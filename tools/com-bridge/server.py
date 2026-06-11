import base64
import binascii
import json
import re
import os
import socket
import subprocess
import sys
import threading
import time
import urllib.parse
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

# Bump when POST/GET routes change so stale bridge processes can be detected (mtime alone is not enough).
BRIDGE_API_VERSION = 4

try:
    import serial
except Exception:
    serial = None


def _is_microsoft_store_python(exe: str) -> bool:
    """MS Store / sandboxed python cannot access COM ports or project files on arbitrary drives."""
    s = (exe or "").lower().replace("\\", "/")
    return "windowsapps" in s or "pythonsoftwarefoundation" in s


if _is_microsoft_store_python(sys.executable):
    raise RuntimeError(
        "检测到 Microsoft Store 版 Python（sys.executable 含 WindowsApps），"
        "该版本沙箱限制导致无法打开串口（WriteFile failed PermissionError '设备不识别此命令'）"
        "和无法读取 JS/data/apm-param-db.json 等文件。\n"
        "请安装 https://www.python.org/downloads/ 的官方 Python，删除 .venv 后重新 setup。"
    )

try:
    from pymavlink import mavutil
    from pymavlink.dialects.v20 import ardupilotmega as mavlink2
except Exception:
    mavutil = None
    mavlink2 = None

try:
    import dronecan
except Exception:
    dronecan = None
# 注意：当前 bridge 主要通过 SLCAN ASCII + MAVLink 交互实现 DroneCAN 功能（见 JS 侧 dronecan-setup.js）。
# 引入 dronecan 包主要是为了让完整 Python DroneCAN 场景（或未来扩展）可用。
# 如果这里为 None，后续若有使用 dronecan 的代码需像 serial/pymavlink 一样加 guard 并通过 _last_bridge_error 报错。


OTA_SESSIONS = {}
PARAM_META_CACHE = {}
PARAM_META_CACHE_TTL_SEC = 1800
PARAM_META_SOURCES = {
    "AP_Periph": "https://autotest.ardupilot.org/Parameters/AP_Periph/apm.pdef.json",
    "ArduCopter": "https://autotest.ardupilot.org/Parameters/ArduCopter/apm.pdef.json",
    "ArduPlane": "https://autotest.ardupilot.org/Parameters/ArduPlane/apm.pdef.json",
    "Rover": "https://autotest.ardupilot.org/Parameters/Rover/apm.pdef.json",
    "ArduSub": "https://autotest.ardupilot.org/Parameters/ArduSub/apm.pdef.json",
}


def _fetch_param_meta_source(vehicle: str):
    vehicle = str(vehicle or "").strip() or "AP_Periph"
    now = time.time()
    cached = PARAM_META_CACHE.get(vehicle)
    if cached and now - float(cached.get("at", 0)) < PARAM_META_CACHE_TTL_SEC:
        return cached.get("data") or {}
    url = PARAM_META_SOURCES.get(vehicle)
    if not url:
        raise RuntimeError(f"unsupported vehicle source: {vehicle}")
    req = urllib.request.Request(url, headers={"User-Agent": "GCS-param-meta/1.0"})
    with urllib.request.urlopen(req, timeout=20) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    PARAM_META_CACHE[vehicle] = {"at": now, "data": data}
    return data


def _lookup_param_meta(vehicle: str, name: str):
    data = _fetch_param_meta_source(vehicle)
    pname = str(name or "").strip().upper()
    if not pname:
        return None
    if vehicle == "AP_Periph":
        group = data.get("AP_Periph")
        if isinstance(group, dict):
            return group.get(pname)
        return None
    for key, val in data.items():
        if isinstance(val, dict) and pname in val and isinstance(val.get(pname), dict):
            return val.get(pname)
    return None


def _classify_port_item(item):
    name = str(item.get("name", "")).lower()
    dev = str(item.get("deviceId", "")).lower()
    if "slcan" in name or "slcan" in dev:
        return "slcan"
    if "mavlink" in name:
        return "mavlink"
    return "serial"


def _finalize_port_list(data):
    if not isinstance(data, list):
        return []
    for item in data:
        item["role"] = _classify_port_item(item)
        item["isSlcanAdapter"] = item["role"] == "slcan"
    return data


def _subprocess_no_window_kwargs():
    if sys.platform != "win32":
        return {}
    flags = getattr(subprocess, "CREATE_NO_WINDOW", 0)
    if not flags:
        return {}
    kwargs = {"creationflags": flags}
    si = getattr(subprocess, "STARTUPINFO", None)
    if si is not None:
      startupinfo = subprocess.STARTUPINFO()
      startupinfo.dwFlags |= getattr(subprocess, "STARTF_USESHOWWINDOW", 0)
      startupinfo.wShowWindow = 0
      kwargs["startupinfo"] = startupinfo
    return kwargs


def _read_ports_windows():
    ps_script = r"""
$ports = Get-CimInstance Win32_SerialPort | Select-Object DeviceID, Name, PNPDeviceID
$result = @()
foreach ($p in $ports) {
  $vid = $null
  $pid = $null
  if ($p.PNPDeviceID -match 'VID_([0-9A-Fa-f]{4})') { $vid = [Convert]::ToInt32($matches[1],16) }
  if ($p.PNPDeviceID -match 'PID_([0-9A-Fa-f]{4})') { $pid = [Convert]::ToInt32($matches[1],16) }
  $result += [PSCustomObject]@{
    deviceId = $p.DeviceID
    name = $p.Name
    usbVendorId = $vid
    usbProductId = $pid
  }
}
$result | ConvertTo-Json -Depth 3
"""
    proc = subprocess.run(
        [
            "powershell",
            "-NoLogo",
            "-NonInteractive",
            "-NoProfile",
            "-Command",
            ps_script,
        ],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="ignore",
        timeout=6,
        **_subprocess_no_window_kwargs(),
    )
    if proc.returncode != 0:
        return []
    out = proc.stdout.strip()
    if not out:
        return []
    try:
        data = json.loads(out)
        if isinstance(data, dict):
            data = [data]
        data = _finalize_port_list(data)

        def com_key(item):
            m = re.match(r"COM(\d+)", str(item.get("deviceId", "")).upper())
            return int(m.group(1)) if m else 10**9

        data.sort(key=com_key)
        return data
    except Exception:
        return []


def _read_ports_unix():
    if serial is None:
        return []
    data = []
    try:
        from serial.tools import list_ports

        for p in list_ports.comports():
            device = str(p.device or "").strip()
            if not device:
                continue
            vid = p.vid
            pid = p.pid
            desc = (p.description or p.name or device).strip()
            item = {
                "deviceId": device,
                "name": desc,
                "usbVendorId": vid if isinstance(vid, int) else None,
                "usbProductId": pid if isinstance(pid, int) else None,
            }
            data.append(item)
    except Exception:
        return []

    data = _finalize_port_list(data)

    def _port_rank(item):
        dev = str(item.get("deviceId", "")).lower()
        name = str(item.get("name", "")).lower()
        if any(x in dev for x in ("bluetooth", "incoming-port", "debug-console")):
            return (2, dev)
        if any(x in name for x in ("bluetooth", "debug", "incoming")):
            return (2, dev)
        if any(x in dev for x in ("usbmodem", "usbserial", "ttyacm", "cu.usb")):
            return (0, dev)
        return (1, dev)

    data.sort(key=_port_rank)
    return data


def read_ports():
    if sys.platform == "win32":
        merged = {}
        if serial is not None:
            try:
                for item in _read_ports_unix():
                    dev = str(item.get("deviceId") or "").upper()
                    if dev:
                        merged[dev] = item
            except Exception:
                pass
        try:
            for item in _read_ports_windows():
                dev = str(item.get("deviceId") or "").upper()
                if not dev:
                    continue
                # Win32_SerialPort often has better CUAV/ArduPilot interface names.
                if dev not in merged or str(item.get("name") or "").strip():
                    merged[dev] = {**merged.get(dev, {}), **item}
        except Exception:
            pass

        ports = list(merged.values())

        def com_key(item):
            m = re.match(r"COM(\d+)", str(item.get("deviceId", "")).upper())
            return int(m.group(1)) if m else 10**9

        ports.sort(key=com_key)
        return ports
    return _read_ports_unix()


def read_ports_debug():
    pyserial_ports = []
    windows_ports = []
    pyserial_error = ""
    windows_error = ""
    if serial is not None:
        try:
            pyserial_ports = _read_ports_unix()
        except Exception as exc:
            pyserial_error = str(exc)
    else:
        pyserial_error = "pyserial unavailable"

    if sys.platform == "win32":
        try:
            windows_ports = _read_ports_windows()
        except Exception as exc:
            windows_error = str(exc)

    return {
        "platform": sys.platform,
        "pyserialPorts": pyserial_ports,
        "pyserialError": pyserial_error,
        "windowsPorts": windows_ports,
        "windowsError": windows_error,
        "mergedPorts": read_ports(),
    }


_PORT_PROBE_CACHE = {"at": 0.0, "ports": []}
_PORT_PROBE_LOCK = threading.Lock()
_BAUD_PROBE_LOCK = threading.Lock()

DEFAULT_BAUD_PROBE_LIST = (921600, 460800, 230400, 115200, 57600)
_BAUD_PROBE_MAX_ELAPSED_S = 12.0


def _is_port_actively_bridged(dev_id):
    """Return True if this device is currently opened by the main MAVLink or SLCAN hub (avoid double-open during probe)."""
    if not dev_id:
        return False
    d = str(dev_id).strip()
    for hub in (MAVLINK_HUB, SLCAN_HUB):
        try:
            if hub and hub.port and str(hub.port).strip() == d:
                st = hub.status()
                if st.get("open"):
                    return True
        except Exception:
            pass
    return False


class HubPortConflictError(Exception):
    def __init__(self, port, owner, requester):
        self.port = str(port or "").strip()
        self.owner = str(owner or "").strip()
        self.requester = str(requester or "").strip()
        super().__init__(
            f"serial port {self.port} is already opened as {self.owner}; "
            f"cannot open as {self.requester} (use separate USB ports for MAVLink and SLCAN)"
        )


def _assert_hub_port_free(port, requester_label, mavlink_hub=None, slcan_hub=None):
    """Raise HubPortConflictError when the other hub already owns this port."""
    dev = str(port or "").strip()
    if not dev:
        return
    requester = str(requester_label or "").strip().lower()
    mav_hub = mavlink_hub if mavlink_hub is not None else MAVLINK_HUB
    slcan_hub = slcan_hub if slcan_hub is not None else SLCAN_HUB
    owners = (("mavlink", mav_hub), ("slcan", slcan_hub))
    for label, hub in owners:
        if label == requester:
            continue
        try:
            st = hub.status()
            if st.get("open") and str(st.get("port") or "").strip() == dev:
                raise HubPortConflictError(dev, label, requester)
        except HubPortConflictError:
            raise
        except Exception:
            pass

def _should_probe_port(item):
    dev = str(item.get("deviceId", "")).lower()
    if any(x in dev for x in ("bluetooth", "incoming-port", "debug-console")):
        return False
    if _is_port_actively_bridged(item.get("deviceId")):
        return False
    return any(x in dev for x in ("usbmodem", "usbserial", "ttyacm", "cu.", "com"))


def _count_mavlink_frames(data, max_frames=32):
    """Mission Planner 思路：用 MAVLink 解析器统计有效帧（优先 HEARTBEAT）。"""
    if not data or mavlink2 is None:
        return 0, False, 0
    parser = mavlink2.MAVLink(None)
    frames = 0
    heartbeat = False
    stx_hits = 0
    for byte in data:
        if byte in (0xFD, 0xFE):
            stx_hits += 1
        try:
            msg = parser.parse_char(bytes([byte]))
        except Exception:
            msg = None
        if msg is None:
            continue
        frames += 1
        try:
            if msg.get_type() == "HEARTBEAT":
                heartbeat = True
        except Exception:
            pass
        if frames >= max_frames:
            break
    return frames, heartbeat, stx_hits


def _count_slcan_lines(data):
    text = data.decode("ascii", errors="ignore")
    lines = 0
    lawicel = False
    for raw in text.splitlines():
        line = raw.strip()
        if not line:
            continue
        low = line.lower()
        if "lawicel" in low or "slcan" in low:
            lawicel = True
        if line[0] in ("T", "t", "R", "r") and len(line) >= 5:
            tail = line[1:]
            if all(c in "0123456789ABCDEFabcdef" for c in tail[: min(8, len(tail))]):
                lines += 1
    return lines, lawicel


def _printable_ratio(data):
    if not data:
        return 0.0
    printable = sum(1 for b in data if b in (9, 10, 13) or 32 <= b <= 126)
    return printable / max(1, len(data))


def _collect_port_sample(port, baudrate=115200):
    """短暂打开端口采样：先被动听 MAVLink，再发 SLCAN 初始化命令观察响应。"""
    if serial is None or not port:
        return b""
    hub = SerialHub("probe")
    buf = bytearray()
    try:
        hub.open(port, baudrate)
        time.sleep(0.42)
        buf.extend(hub.read_buffer(131072))
        for cmd in (b"C\r", b"S8\r", b"O\r", b"V\r"):
            try:
                hub.write(cmd)
            except Exception:
                pass
            time.sleep(0.05)
        time.sleep(0.22)
        buf.extend(hub.read_buffer(131072))
    except Exception:
        return b""
    finally:
        try:
            hub.close()
        except Exception:
            pass
    return bytes(buf)


def _score_mavlink_sample(data):
    """Return (score, analysis). score 0 = no MAVLink; slcan-only returns 0."""
    if not data:
        return 0, None
    mav_frames, heartbeat, _stx_hits = _count_mavlink_frames(data)
    analysis = _analyze_port_sample(data)
    role = str(analysis.get("probeRole", "unknown"))
    conf = str(analysis.get("probeConfidence", "low"))
    mav_n = int(analysis.get("probeMavlinkFrames") or mav_frames or 0)
    if role == "slcan":
        return 0, analysis
    if heartbeat:
        return 1000, analysis
    if role == "mavlink" and conf == "high" and mav_n >= 4:
        return 500 + min(mav_n, 99), analysis
    if mav_n >= 2:
        return 100 + min(mav_n, 99), analysis
    return 0, analysis


def _collect_port_sample_mavlink_only(port, baudrate=115200):
    """Passive MAVLink listen only (no SLCAN init commands)."""
    if serial is None or not port:
        return b""
    hub = SerialHub("baud-probe")
    buf = bytearray()
    try:
        hub.open(port, baudrate)
        time.sleep(0.45)
        buf.extend(hub.read_buffer(131072))
    except Exception:
        return b""
    finally:
        try:
            hub.close()
        except Exception:
            pass
    return bytes(buf)


def probe_baud_for_port(port, baud_list=None):
    """Try baud rates and return the strongest MAVLink candidate instead of the first hit."""
    port = str(port or "").strip()
    if not port:
        return {"ok": False, "error": "port required"}
    if serial is None:
        return {"ok": False, "error": "pyserial unavailable"}
    if _is_port_actively_bridged(port):
        return {"ok": False, "error": "in-use"}

    raw_list = baud_list if baud_list is not None else DEFAULT_BAUD_PROBE_LIST
    bauds = []
    seen = set()
    for b in raw_list:
        try:
            n = int(b)
        except (TypeError, ValueError):
            continue
        if n <= 0 or n in seen:
            continue
        seen.add(n)
        bauds.append(n)
    if not bauds:
        bauds = list(DEFAULT_BAUD_PROBE_LIST)

    t0 = time.time()
    tried = []
    best_slcan_score = 0
    best_match = None
    with _BAUD_PROBE_LOCK:
        for baud in bauds:
            if time.time() - t0 > _BAUD_PROBE_MAX_ELAPSED_S:
                break
            score = 0
            analysis = None
            err = None
            try:
                sample = _collect_port_sample_mavlink_only(port, baud)
                score, analysis = _score_mavlink_sample(sample)
            except Exception as exc:
                err = str(exc)
                score = 0
            row = {"baud": baud, "score": score}
            if err:
                row["error"] = err
            if analysis:
                row["probeRole"] = analysis.get("probeRole")
            tried.append(row)
            if score > 0:
                if (
                    best_match is None
                    or score > best_match["score"]
                ):
                    best_match = {
                        "baud": baud,
                        "score": score,
                        "probeRole": (analysis or {}).get("probeRole", "mavlink"),
                    }
            slcan_score = 0
            if analysis and str(analysis.get("probeRole")) == "slcan":
                slcan_score = int(analysis.get("probeSlcanLines") or 0) + 50
            best_slcan_score = max(best_slcan_score, slcan_score)

    elapsed_ms = int((time.time() - t0) * 1000)
    if best_match is not None:
        return {
            "ok": True,
            "baud": best_match["baud"],
            "score": best_match["score"],
            "probeRole": best_match["probeRole"],
            "tried": tried,
            "elapsedMs": elapsed_ms,
        }
    if best_slcan_score > 0:
        return {
            "ok": False,
            "reason": "slcan",
            "error": "port looks like SLCAN adapter",
            "tried": tried,
            "elapsedMs": elapsed_ms,
        }
    return {
        "ok": False,
        "error": "no mavlink at tried baud rates",
        "tried": tried,
        "elapsedMs": elapsed_ms,
    }


def _analyze_port_sample(data):
    mav_frames, heartbeat, stx_hits = _count_mavlink_frames(data)
    slcan_lines, lawicel = _count_slcan_lines(data)
    printable = _printable_ratio(data)
    detail_parts = [
        f"mav={mav_frames}",
        f"hb={1 if heartbeat else 0}",
        f"stx={stx_hits}",
        f"slcan={slcan_lines}",
        f"ascii={printable:.2f}",
    ]
    detail = ",".join(detail_parts)

    if heartbeat or mav_frames >= 4:
        return {
            "probeRole": "mavlink",
            "probeConfidence": "high",
            "probeDetail": detail + (",heartbeat" if heartbeat else ""),
            "probeMavlinkFrames": mav_frames,
            "probeSlcanLines": slcan_lines,
        }
    if mav_frames >= 2 and slcan_lines == 0 and stx_hits >= 6:
        return {
            "probeRole": "mavlink",
            "probeConfidence": "high",
            "probeDetail": detail,
            "probeMavlinkFrames": mav_frames,
            "probeSlcanLines": slcan_lines,
        }
    if slcan_lines >= 1 and mav_frames == 0 and stx_hits < 3:
        return {
            "probeRole": "slcan",
            "probeConfidence": "high",
            "probeDetail": detail + ",t-frames",
            "probeMavlinkFrames": mav_frames,
            "probeSlcanLines": slcan_lines,
        }
    if lawicel and mav_frames == 0:
        return {
            "probeRole": "slcan",
            "probeConfidence": "medium",
            "probeDetail": detail + ",lawicel",
            "probeMavlinkFrames": mav_frames,
            "probeSlcanLines": slcan_lines,
        }
    if stx_hits >= 3 and mav_frames >= 1:
        return {
            "probeRole": "mavlink",
            "probeConfidence": "medium",
            "probeDetail": detail,
            "probeMavlinkFrames": mav_frames,
            "probeSlcanLines": slcan_lines,
        }
    return {
        "probeRole": "unknown",
        "probeConfidence": "low",
        "probeDetail": detail,
        "probeMavlinkFrames": mav_frames,
        "probeSlcanLines": slcan_lines,
    }


def _apply_probe_analysis(item, analysis):
    item.update(analysis)
    role = str(analysis.get("probeRole", "unknown"))
    if role in ("mavlink", "slcan"):
        item["role"] = role
        item["isSlcanAdapter"] = role == "slcan"
    else:
        item["role"] = _classify_port_item(item)
        item["isSlcanAdapter"] = item["role"] == "slcan"
    return item


def _resolve_probe_group(group, baudrate=115200):
    """同 VID/PID 双口对比判定（与 MP 里两路分别打开对比一致）。"""
    if not group:
        return group
    candidates = [x for x in group if _should_probe_port(x)]
    if not candidates:
        return group

    scored = []
    for item in candidates:
        sample = _collect_port_sample(item.get("deviceId"), baudrate)
        analysis = _analyze_port_sample(sample)
        _apply_probe_analysis(item, analysis)
        scored.append(
            (
                item,
                int(analysis.get("probeMavlinkFrames") or 0),
                str(analysis.get("probeRole")),
                str(analysis.get("probeConfidence")),
            )
        )

    if len(scored) < 2:
        return group

    scored.sort(key=lambda row: row[1], reverse=True)
    best_mav = scored[0]
    second = scored[1]

    if best_mav[1] >= 2 and second[1] == 0:
        _apply_probe_analysis(
            best_mav[0],
            {
                "probeRole": "mavlink",
                "probeConfidence": "high",
                "probeDetail": f"pair-win,mav={best_mav[1]}",
                "probeMavlinkFrames": best_mav[1],
                "probeSlcanLines": 0,
            },
        )
        _apply_probe_analysis(
            second[0],
            {
                "probeRole": "slcan",
                "probeConfidence": "high" if second[3] in ("medium", "high") else "medium",
                "probeDetail": "pair-other",
                "probeMavlinkFrames": second[1],
                "probeSlcanLines": int(second[0].get("probeSlcanLines") or 0),
            },
        )
        return group

    ordered = sorted(candidates, key=lambda x: str(x.get("deviceId", "")).lower())
    if ordered[0].get("probeRole") == "unknown" and ordered[1].get("probeRole") == "unknown":
        ordered[0]["probeRole"] = "mavlink"
        ordered[0]["probeConfidence"] = "heuristic"
        ordered[0]["probeDetail"] = "order-first"
        ordered[1]["probeRole"] = "slcan"
        ordered[1]["probeConfidence"] = "heuristic"
        ordered[1]["probeDetail"] = "order-second"
        for item in ordered:
            _sync_port_role_fields(item)
    return group


def _sync_port_role_fields(item):
    role = str(item.get("probeRole", "unknown"))
    if role in ("mavlink", "slcan"):
        item["role"] = role
        item["isSlcanAdapter"] = role == "slcan"
    return item


def probe_serial_role(port, baudrate=115200):
    analysis = _analyze_port_sample(_collect_port_sample(port, baudrate))
    return str(analysis.get("probeRole", "unknown"))


def _apply_port_role_probes(ports, baudrate=115200):
    if not ports:
        return []
    out = []
    groups = {}
    for raw in ports:
        item = dict(raw)
        if not _should_probe_port(item):
            item["probeRole"] = _classify_port_item(item)
            item["probeConfidence"] = "n/a"
            item["probeDetail"] = "skip"
            _sync_port_role_fields(item)
            out.append(item)
            continue
        out.append(item)
        vid = item.get("usbVendorId")
        pid = item.get("usbProductId")
        if isinstance(vid, int) and isinstance(pid, int):
            groups.setdefault((vid, pid), []).append(item)

    for group in groups.values():
        if len(group) >= 2 and all(_should_probe_port(x) for x in group):
            _resolve_probe_group(group, baudrate)
            continue
        for item in group:
            if item.get("probeRole") in ("mavlink", "slcan"):
                continue
            if _is_port_actively_bridged(item.get("deviceId")):
                item["probeRole"] = _classify_port_item(item)
                item["probeConfidence"] = "n/a"
                item["probeDetail"] = "in-use-by-bridge"
                _sync_port_role_fields(item)
                continue
            analysis = _analyze_port_sample(_collect_port_sample(item.get("deviceId"), baudrate))
            _apply_probe_analysis(item, analysis)

    for item in out:
        if item.get("probeRole") not in ("mavlink", "slcan"):
            _sync_port_role_fields(item)
    return out


def read_ports_fast():
    """Instant COM list with name-based roles (no serial open)."""
    out = []
    for raw in read_ports():
        item = dict(raw)
        role = _classify_port_item(item)
        item["probeRole"] = role if role in ("mavlink", "slcan") else "unknown"
        item["probeConfidence"] = "heuristic"
        item["probeDetail"] = "fast-list"
        _sync_port_role_fields(item)
        out.append(item)
    return out


def read_ports_with_roles(force=False, baudrate=115200, probe_roles=True):
    global _PORT_PROBE_CACHE
    with _PORT_PROBE_LOCK:
        now = time.time()
        if not probe_roles:
            if (
                not force
                and _PORT_PROBE_CACHE.get("ports")
                and (now - float(_PORT_PROBE_CACHE.get("at") or 0)) < 12.0
            ):
                return list(_PORT_PROBE_CACHE["ports"])
            return read_ports_fast()
        if (
            not force
            and _PORT_PROBE_CACHE.get("ports")
            and (now - float(_PORT_PROBE_CACHE.get("at") or 0)) < 12.0
        ):
            return list(_PORT_PROBE_CACHE["ports"])
        base = read_ports()
        probed = _apply_port_role_probes(base, baudrate)
        _PORT_PROBE_CACHE = {"at": now, "ports": probed}
        return probed


_SLCAN_DETECT_CACHE = {"at": 0.0, "port": None}
_SLCAN_DETECT_TTL_S = 30.0


def detect_slcan_port(force=False):
    now = time.time()
    if not force and (now - float(_SLCAN_DETECT_CACHE.get("at") or 0)) < _SLCAN_DETECT_TTL_S:
        return _SLCAN_DETECT_CACHE.get("port")
    port = None
    for item in read_ports_with_roles():
        if item.get("probeRole") == "slcan" or item.get("isSlcanAdapter"):
            port = item.get("deviceId")
            break
    _SLCAN_DETECT_CACHE["at"] = now
    _SLCAN_DETECT_CACHE["port"] = port
    return port


class SerialHub:
    def __init__(self, label):
        self.label = label
        self.lock = threading.Lock()
        self.serial = None
        self.port = None
        self.baudrate = 115200
        self.rx_buffer = bytearray()
        self.reader_thread = None
        self._last_rx_at = 0.0
        self._rx_bytes_total = 0
        self._reader_alive = False
        self._generation = 0
        self._session_seq = 0
        self._session_id = 0
        self._last_error = ""
        self._last_open_port = None
        self._last_open_baud = None

    def status(self):
        with self.lock:
            now = time.time()
            last_rx_age = (now - self._last_rx_at) if getattr(self, "_last_rx_at", 0) else 999
            return {
                "label": self.label,
                "open": self.serial is not None and getattr(self.serial, "is_open", False),
                "port": self.port,
                "baudrate": self.baudrate,
                "sessionId": getattr(self, "_session_id", 0),
                "lastRxAgeSec": round(last_rx_age, 2) if last_rx_age < 999 else None,
                "bytesRx": getattr(self, "_rx_bytes_total", 0),
                "rxBytesTotal": getattr(self, "_rx_bytes_total", 0),
                "readerAlive": getattr(self, "_reader_alive", False),
                "lastOpenPort": getattr(self, "_last_open_port", None),
                "lastOpenBaud": getattr(self, "_last_open_baud", None),
                "error": getattr(self, "_last_error", ""),
            }

    def open(self, port, baudrate):
        if serial is None:
            raise RuntimeError("pyserial is not installed")
        self.close()
        s = serial.Serial(port, baudrate=baudrate, timeout=0.2, write_timeout=3.0)
        # Prevent USB-serial adapters from asserting DTR/RTS which often resets ArduPilot/CUAV/etc flight controllers
        try:
            s.dtr = False
            s.rts = False
        except Exception:
            pass
        with self.lock:
            self._generation += 1
            generation = self._generation
            self._session_seq += 1
            self._session_id = self._session_seq
            self.serial = s
            self.port = port
            self.baudrate = baudrate
            self.rx_buffer = bytearray()
            self._last_rx_at = 0.0
            self._rx_bytes_total = 0
            self._reader_alive = True
            self._last_error = ""
            self._last_open_port = port
            self._last_open_baud = baudrate
        self.reader_thread = threading.Thread(target=self._reader_loop, args=(generation,), daemon=True)
        self.reader_thread.start()
        return self.status()

    def close(self):
        with self.lock:
            s = self.serial
            t = self.reader_thread
            self._generation += 1
            self.serial = None
            self.port = None
            self.rx_buffer = bytearray()
            self._last_rx_at = 0.0
            self._rx_bytes_total = 0
            self._reader_alive = False
            self._session_id = 0
            self._last_error = ""
            self.reader_thread = None
        if s is not None:
            try:
                s.close()
            except Exception:
                pass
        if t is not None and t.is_alive() and t is not threading.current_thread():
            try:
                t.join(timeout=1.0)
            except Exception:
                pass

    def write(self, data):
        with self.lock:
            s = self.serial
            if s is None or not getattr(s, "is_open", False):
                raise RuntimeError(f"{self.label} is not open")
            s.write(data)
            return len(data)

    def read_buffer(self, max_bytes=65536):
        with self.lock:
            if not self.rx_buffer:
                return b""
            data = bytes(self.rx_buffer[:max_bytes])
            del self.rx_buffer[:max_bytes]
            return data

    def _reader_loop(self, generation):
        while True:
            with self.lock:
                if generation != self._generation:
                    return
                s = self.serial
            if s is None or not getattr(s, "is_open", False):
                with self.lock:
                    if generation == self._generation:
                        self._reader_alive = False
                return
            try:
                data = s.read(4096)
                if data:
                    now = time.time()
                    with self.lock:
                        if generation != self._generation:
                            return
                        self.rx_buffer.extend(data)
                        self._last_rx_at = now
                        self._rx_bytes_total = getattr(self, "_rx_bytes_total", 0) + len(data)
                    if self.label == "bridge":
                        _bridge_broadcast(data)
                        SLCAN_MONITOR.feed_mavlink(data)
                    elif self.label == "slcan":
                        SLCAN_MONITOR.feed_slcan(data)
            except Exception as exc:
                with self.lock:
                    if generation == self._generation:
                        self._reader_alive = False
                        self._last_error = str(exc)
                return


class TcpHub:
    def __init__(self, label):
        self.label = label
        self.lock = threading.Lock()
        self.sock = None
        self.host = None
        self.port = None
        self.rx_buffer = bytearray()
        self.reader_thread = None
        self._last_rx_at = 0.0
        self._rx_bytes_total = 0
        self._reader_alive = False
        self._generation = 0
        self._session_seq = 0
        self._session_id = 0
        self._last_error = ""
        self._last_open_host = None
        self._last_open_port = None

    def status(self):
        with self.lock:
            now = time.time()
            last_rx_age = (now - self._last_rx_at) if getattr(self, "_last_rx_at", 0) else 999
            return {
                "label": self.label,
                "open": self.sock is not None,
                "host": self.host,
                "port": self.port,
                "endpoint": f"{self.host}:{self.port}" if self.host and self.port else None,
                "sessionId": getattr(self, "_session_id", 0),
                "lastRxAgeSec": round(last_rx_age, 2) if last_rx_age < 999 else None,
                "bytesRx": getattr(self, "_rx_bytes_total", 0),
                "rxBytesTotal": getattr(self, "_rx_bytes_total", 0),
                "readerAlive": getattr(self, "_reader_alive", False),
                "lastOpenHost": getattr(self, "_last_open_host", None),
                "lastOpenPort": getattr(self, "_last_open_port", None),
                "error": getattr(self, "_last_error", ""),
            }

    def open(self, host, port, timeout=10.0):
        self.close()
        host = str(host or "").strip()
        port = int(port)
        if not host:
            raise RuntimeError("host is required")
        if port <= 0:
            raise RuntimeError("port must be > 0")
        sock = socket.create_connection((host, port), timeout=float(timeout))
        sock.settimeout(0.2)
        with self.lock:
            self._generation += 1
            generation = self._generation
            self._session_seq += 1
            self._session_id = self._session_seq
            self.sock = sock
            self.host = host
            self.port = port
            self.rx_buffer = bytearray()
            self._last_rx_at = 0.0
            self._rx_bytes_total = 0
            self._reader_alive = True
            self._last_error = ""
            self._last_open_host = host
            self._last_open_port = port
        self.reader_thread = threading.Thread(target=self._reader_loop, args=(generation,), daemon=True)
        self.reader_thread.start()
        return self.status()

    def close(self):
        with self.lock:
            s = self.sock
            t = self.reader_thread
            self._generation += 1
            self.sock = None
            self.host = None
            self.port = None
            self.rx_buffer = bytearray()
            self._last_rx_at = 0.0
            self._rx_bytes_total = 0
            self._reader_alive = False
            self._session_id = 0
            self._last_error = ""
            self.reader_thread = None
        if s is not None:
            try:
                s.close()
            except Exception:
                pass
        if t is not None and t.is_alive() and t is not threading.current_thread():
            try:
                t.join(timeout=1.0)
            except Exception:
                pass

    def write(self, data):
        with self.lock:
            s = self.sock
            if s is None:
                raise RuntimeError(f"{self.label} is not open")
            s.sendall(data)
            return len(data)

    def read_buffer(self, max_bytes=65536):
        with self.lock:
            if not self.rx_buffer:
                return b""
            data = bytes(self.rx_buffer[:max_bytes])
            del self.rx_buffer[:max_bytes]
            return data

    def _reader_loop(self, generation):
        while True:
            with self.lock:
                if generation != self._generation:
                    return
                s = self.sock
            if s is None:
                with self.lock:
                    if generation == self._generation:
                        self._reader_alive = False
                return
            try:
                data = s.recv(4096)
                if not data:
                    with self.lock:
                        if generation == self._generation:
                            self._reader_alive = False
                            self._last_error = "tcp peer closed"
                    return
                now = time.time()
                with self.lock:
                    if generation != self._generation:
                        return
                    self.rx_buffer.extend(data)
                    self._last_rx_at = now
                    self._rx_bytes_total = getattr(self, "_rx_bytes_total", 0) + len(data)
                _tcp_broadcast(data)
            except socket.timeout:
                continue
            except Exception as exc:
                with self.lock:
                    if generation == self._generation:
                        self._reader_alive = False
                        self._last_error = str(exc)
                return


MAVLINK_HUB = SerialHub("bridge")
SLCAN_HUB = SerialHub("slcan")
TCP_HUB = TcpHub("tcp")

# ============================================================
# Bridge subscribers — allow multiple pages to share one MAVLink stream
# 每个 tab 拥有自己的接收缓冲区；hub 只在最后一个订阅者断开时真正关闭串口
# ============================================================
_bridge_subscribers = {}  # tab_id -> bytearray
_bridge_subscribers_lock = threading.Lock()
_bridge_probe_last = {
    "at": None,
    "port": None,
    "bauds": [],
    "result": None,
}
_bridge_probe_last_lock = threading.Lock()


def _get_tab_id(handler):
    """从请求头获取 Tab ID"""
    return handler.headers.get('X-GCS-Tab-Id', '')


def _subscribe_bridge_tab(tab_id):
    tab = str(tab_id or "").strip()
    if not tab:
        return False
    with _bridge_subscribers_lock:
        _bridge_subscribers.setdefault(tab, bytearray())
    return True


def _unsubscribe_bridge_tab(tab_id):
    tab = str(tab_id or "").strip()
    if not tab:
        return False
    with _bridge_subscribers_lock:
        existed = tab in _bridge_subscribers
        _bridge_subscribers.pop(tab, None)
        return existed


def _bridge_subscriber_count():
    with _bridge_subscribers_lock:
        return len(_bridge_subscribers)


def _record_bridge_probe(port, bauds, result):
    normalized_bauds = []
    for item in bauds or []:
        try:
            normalized_bauds.append(int(item))
        except Exception:
            continue
    with _bridge_probe_last_lock:
        _bridge_probe_last["at"] = int(time.time() * 1000)
        _bridge_probe_last["port"] = str(port or "").strip() or None
        _bridge_probe_last["bauds"] = normalized_bauds
        _bridge_probe_last["result"] = result


def _get_bridge_probe_snapshot():
    with _bridge_probe_last_lock:
        return {
            "at": _bridge_probe_last.get("at"),
            "port": _bridge_probe_last.get("port"),
            "bauds": list(_bridge_probe_last.get("bauds") or []),
            "result": _bridge_probe_last.get("result"),
        }


_tcp_subscribers = {}
_tcp_subscribers_lock = threading.Lock()


def _subscribe_tcp_tab(tab_id):
    tab = str(tab_id or "").strip()
    if not tab:
        return False
    with _tcp_subscribers_lock:
        _tcp_subscribers.setdefault(tab, bytearray())
    return True


def _unsubscribe_tcp_tab(tab_id):
    tab = str(tab_id or "").strip()
    if not tab:
        return False
    with _tcp_subscribers_lock:
        existed = tab in _tcp_subscribers
        _tcp_subscribers.pop(tab, None)
        return existed


def _tcp_subscriber_count():
    with _tcp_subscribers_lock:
        return len(_tcp_subscribers)


def _tcp_broadcast(data):
    if not data:
        return
    with _tcp_subscribers_lock:
        stale = []
        for tab_id, buf in _tcp_subscribers.items():
            try:
                buf.extend(data)
                if len(buf) > 2_000_000:
                    del buf[:-1_000_000]
            except Exception:
                stale.append(tab_id)
        for tab_id in stale:
            _tcp_subscribers.pop(tab_id, None)


def _tcp_read_for_tab(tab_id, max_bytes=65536):
    tab = str(tab_id or "").strip()
    if not tab:
        return b""
    with _tcp_subscribers_lock:
        buf = _tcp_subscribers.get(tab)
        if not buf:
            return b""
        data = bytes(buf[:max_bytes])
        del buf[:max_bytes]
        return data


def _bridge_broadcast(data):
    if not data:
        return
    with _bridge_subscribers_lock:
        stale = []
        for tab_id, buf in _bridge_subscribers.items():
            try:
                buf.extend(data)
                if len(buf) > 2_000_000:
                    del buf[:-1_000_000]
            except Exception:
                stale.append(tab_id)
        for tab_id in stale:
            _bridge_subscribers.pop(tab_id, None)


def _bridge_read_for_tab(tab_id, max_bytes=65536):
    tab = str(tab_id or "").strip()
    if not tab:
        return b""
    with _bridge_subscribers_lock:
        buf = _bridge_subscribers.get(tab)
        if not buf:
            return b""
        data = bytes(buf[:max_bytes])
        del buf[:max_bytes]
        return data


# Lawicel SLCAN bitrate codes (S0..S8)
SLCAN_BITRATE_CODE = {
    10: "0",
    20: "1",
    50: "2",
    100: "3",
    125: "4",
    250: "5",
    500: "6",
    800: "7",
    1000: "8",
}


def init_slcan_adapter(hub, bitrate_kbps=1000):
    """Bring up a USB-CAN adapter in native SLCAN ASCII mode (not MAVLink CAN_FORWARD)."""
    code = SLCAN_BITRATE_CODE.get(int(bitrate_kbps))
    if not code:
        raise RuntimeError(f"unsupported slcan bitrate {bitrate_kbps}")
    # Reset adapter state: close, set bitrate, open CAN.
    for cmd in (b"C\r", f"S{code}\r".encode("ascii"), b"O\r"):
        hub.write(cmd)
        time.sleep(0.08)


def slcan_hub_needs_recover(st=None):
    """True when the SLCAN serial reader died but pyserial still reports the port open (Windows zombie COM)."""
    st = st or SLCAN_HUB.status()
    err = str(st.get("error") or "")
    if not st.get("open"):
        return False
    if not st.get("readerAlive"):
        return True
    if "PermissionError" in err or "ClearCommError failed" in err:
        return True
    last_rx = st.get("lastRxAgeSec")
    try:
        if last_rx is not None and float(last_rx) > 45.0 and st.get("readerAlive"):
            return True
    except (TypeError, ValueError):
        pass
    return False


_slcan_recover_last_at = 0.0
_SLCAN_RECOVER_COOLDOWN_S = 8.0


def maybe_recover_slcan_hub(bitrate_kbps=1000):
    """Re-open SLCAN after zombie COM failures; rate-limited for poll endpoints."""
    global _slcan_recover_last_at
    st = SLCAN_HUB.status()
    if not slcan_hub_needs_recover(st):
        return st
    now = time.time()
    if now - _slcan_recover_last_at < _SLCAN_RECOVER_COOLDOWN_S:
        return st
    _slcan_recover_last_at = now
    try:
        return recover_slcan_hub_if_needed(bitrate_kbps=bitrate_kbps)
    except Exception:
        return SLCAN_HUB.status()


def recover_slcan_hub_if_needed(bitrate_kbps=1000):
    """Recover from zombie COM states where pyserial still reports open but the reader has already died."""
    st = SLCAN_HUB.status()
    if not slcan_hub_needs_recover(st):
        return st
    port = str(st.get("lastOpenPort") or st.get("port") or "").strip()
    baudrate = int(st.get("lastOpenBaud") or st.get("baudrate") or 115200)
    if not port:
        raise RuntimeError("slcan recover failed: no remembered port")
    SLCAN_HUB.close()
    reopened = SLCAN_HUB.open(port, baudrate)
    init_slcan_adapter(SLCAN_HUB, bitrate_kbps=bitrate_kbps)
    SLCAN_HUB._last_slcan_init_at = time.time()
    return reopened


def _parse_can_id(frame_id):
    raw = int(frame_id) & 0x1FFFFFFF
    return {
        "raw": raw,
        "priority": (raw >> 24) & 0x1F,
        "dataTypeId": (raw >> 8) & 0xFFFF,
        "isService": bool((raw >> 7) & 1),
        "sourceNodeId": raw & 0x7F,
    }


def _decode_node_status_uptime(frame_id, data_bytes):
    parsed = _parse_can_id(frame_id)
    if parsed["isService"] or parsed["dataTypeId"] != 341:
        return None
    if len(data_bytes) < 4:
        return None
    return int.from_bytes(data_bytes[:4], "little", signed=False)


def _monitor_node_key(transport, bus, node_id):
    return (str(transport), int(bus), int(node_id))


MAV_CMD_CAN_FORWARD = 32000
MAV_RESULT_NAMES = (
    "ACCEPTED",
    "TEMPORARILY_REJECTED",
    "DENIED",
    "UNSUPPORTED",
    "FAILED",
    "IN_PROGRESS",
    "CANCELLED",
)


class SlcanMavlinkMonitor:
    def __init__(self):
        self.lock = threading.Lock()
        self.parser = mavlink2.MAVLink(None) if mavlink2 is not None else None
        self.slcan_ascii_buffer = bytearray()
        self.forward_enabled = False
        self.forward_bus = 0
        self.slcan_cport = 1
        self.target_system = 1
        self.target_component = 1
        self.frame_times = []
        self.error_count = 0
        self.nodes = {}
        self.node_ascii = {}
        self.node_recent_frames = {}
        self.node_frame_counts = {}
        self.last_frame_at = 0.0
        self.last_can_forward_ack = None
        self.mavlink_can_frame_rx = 0

    def reset(self):
        with self.lock:
            self.parser = mavlink2.MAVLink(None) if mavlink2 is not None else None
            self.slcan_ascii_buffer = bytearray()
            self.forward_enabled = False
            self.forward_bus = 0
            self.target_system = 1
            self.target_component = 1
            self.frame_times = []
            self.error_count = 0
            self.nodes = {}
            self.node_ascii = {}
            self.node_recent_frames = {}
            self.node_frame_counts = {}
            self.last_frame_at = 0.0
            self.last_can_forward_ack = None
            self.mavlink_can_frame_rx = 0

    def clear_scope(self, scope):
        """Clear monitor pools for one transport without tearing down MAVLink forward state."""
        scope = str(scope or "all").strip().lower()
        with self.lock:
            if scope == "mavlink":
                keys = [k for k in self.nodes if k[0] == "mav"]
            elif scope == "slcan":
                keys = [k for k in self.nodes if k[0] == "slcan"]
                self.slcan_ascii_buffer = bytearray()
            else:
                self.reset()
                return
            for key in keys:
                self.nodes.pop(key, None)
                self.node_ascii.pop(key, None)
                self.node_recent_frames.pop(key, None)
                self.node_frame_counts.pop(key, None)

    def _trim_frames(self, now):
        self.frame_times = [t for t in self.frame_times if now - t <= 1.0]

    def _prune_nodes(self, now, max_age_s=15.0):
        stale = [key for key, node in self.nodes.items() if now - node.get("last_seen", 0) > max_age_s]
        for key in stale:
            self.nodes.pop(key, None)
            self.node_ascii.pop(key, None)
            self.node_recent_frames.pop(key, None)
            self.node_frame_counts.pop(key, None)

    def _prune_mavlink_bus(self, bus):
        bus = int(bus)
        stale = [key for key in self.nodes if key[0] == "mav" and key[1] != bus]
        for key in stale:
            self.nodes.pop(key, None)
            self.node_recent_frames.pop(key, None)
            self.node_frame_counts.pop(key, None)

    def feed(self, data):
        """Legacy entry: treat as SLCAN ASCII (unit tests / inject)."""
        self.feed_slcan(data)

    def feed_slcan(self, data):
        if not data:
            return
        with self.lock:
            self._feed_slcan_ascii(data)

    def feed_mavlink(self, data):
        if not data:
            return
        with self.lock:
            if self.parser is None:
                return
            for byte in data:
                try:
                    msg = self.parser.parse_char(bytes([byte]))
                except Exception:
                    msg = None
                if msg is None:
                    continue
                self._handle_message(msg)

    def _feed_slcan_ascii(self, data):
        self.slcan_ascii_buffer.extend(data)
        while True:
            idx = -1
            for sep in (b"\r", b"\n"):
                pos = self.slcan_ascii_buffer.find(sep)
                if pos != -1 and (idx == -1 or pos < idx):
                    idx = pos
            if idx == -1:
                break
            line = bytes(self.slcan_ascii_buffer[:idx]).strip()
            del self.slcan_ascii_buffer[: idx + 1]
            if not line:
                continue
            try:
                self._handle_slcan_line(line.decode("ascii", errors="ignore"))
            except Exception:
                continue

    def _handle_slcan_line(self, line):
        if not line:
            return
        head = line[0]
        if head not in ("T", "t"):
            # Ignore adapter chatter (version strings, OK/ERROR, etc.)
            return
        extended = head == "T"
        can_id_len = 8 if extended else 3
        min_len = 1 + can_id_len + 1
        if len(line) < min_len:
            return
        can_id = int(line[1:1 + can_id_len], 16)
        dlc = int(line[1 + can_id_len], 16)
        data_hex = line[2 + can_id_len: 2 + can_id_len + dlc * 2]
        if len(data_hex) < dlc * 2:
            return
        data_bytes = bytes.fromhex(data_hex)
        cport = max(1, min(2, int(getattr(self, "slcan_cport", 1) or 1)))
        self._handle_can_frame(
            can_id,
            dlc,
            data_bytes,
            bus=cport,
            source=f"SLCAN Direct CAN{cport}",
            transport="slcan",
        )

    def _record_can_forward_ack(self, command, result, now):
        if int(command) != MAV_CMD_CAN_FORWARD:
            return
        idx = int(result)
        name = MAV_RESULT_NAMES[idx] if 0 <= idx < len(MAV_RESULT_NAMES) else f"UNKNOWN({idx})"
        self.last_can_forward_ack = {
            "command": MAV_CMD_CAN_FORWARD,
            "result": idx,
            "resultName": name,
            "ts": int(now * 1000),
        }

    def _handle_message(self, msg):
        now = time.time()
        mtype = msg.get_type()
        if mtype == "HEARTBEAT":
            sys_id = getattr(msg, "_srcSystem", None)
            if sys_id is not None and int(sys_id) > 0:
                self.target_system = int(sys_id)
            comp_id = getattr(msg, "_srcComponent", None)
            if comp_id is not None and 0 <= int(comp_id) <= 255:
                self.target_component = int(comp_id)
            return
        if mtype == "COMMAND_ACK":
            msg_dict = msg.to_dict()
            self._record_can_forward_ack(
                int(msg_dict.get("command", 0)),
                int(msg_dict.get("result", 0)),
                now,
            )
            return
        if mtype == "CAN_FRAME":
            self.mavlink_can_frame_rx = int(getattr(self, "mavlink_can_frame_rx", 0) or 0) + 1
            msg_dict = msg.to_dict()
            frame_id = int(msg_dict.get("id", 0))
            raw_data = msg_dict.get("data", [])
            if isinstance(raw_data, (bytes, bytearray)):
                data_bytes = bytes(raw_data)
            else:
                data_bytes = bytes(int(x) & 0xFF for x in raw_data[: int(msg_dict.get("len", 0))])
            bus_ui = int(msg_dict.get("bus", 0)) + 1
            self._handle_can_frame(
                frame_id,
                int(msg_dict.get("len", 0)),
                data_bytes,
                bus=bus_ui,
                source=f"MAVLink CAN{bus_ui}",
                transport="mav",
            )
            return

    def _handle_can_frame(self, frame_id, dlc, data_bytes, bus=1, source="SLCAN Direct CAN1", transport="slcan"):
        now = time.time()
        self.last_frame_at = now
        node_id = frame_id & 0x7F
        if 0 < node_id <= 127:
            key = _monitor_node_key(transport, bus, node_id)
            node = self.nodes.get(key, {
                "nodeId": node_id,
                "name": f"node-{node_id}",
                "status": "online",
                "source": source,
                "bus": int(bus),
                "transport": str(transport),
                "rxCount": 0,
                "first_seen": now,
            })
            node["status"] = "online"
            node["source"] = source
            node["bus"] = int(bus)
            node["transport"] = str(transport)
            node["rxCount"] = int(node.get("rxCount", 0)) + 1
            node["last_seen"] = now
            node["lastCanId"] = f"0x{frame_id:X}"
            node["lastDlc"] = int(dlc)
            node["lastDataHex"] = data_bytes.hex().upper()
            uptime_sec = _decode_node_status_uptime(frame_id, data_bytes)
            if uptime_sec is not None:
                node["uptimeSec"] = uptime_sec
            recent = self.node_recent_frames.get(key, [])
            recent.append({
                "ts": int(now * 1000),
                "canId": f"0x{frame_id:X}",
                "dlc": int(dlc),
                "dataHex": data_bytes.hex().upper(),
                "bus": int(bus),
            })
            self.node_recent_frames[key] = recent[-40:]
            counts = self.node_frame_counts.get(key, {})
            can_id_key = f"0x{frame_id:X}"
            counts[can_id_key] = int(counts.get(can_id_key, 0)) + 1
            self.node_frame_counts[key] = counts
            inferred_name = self._infer_node_name(node_id, "")
            node["name"] = inferred_name["name"]
            node["displayName"] = inferred_name["displayName"]
            node["deviceHint"] = inferred_name["deviceHint"]
            node["asciiHint"] = ""
            self.nodes[key] = node
        self.frame_times.append(now)
        self._trim_frames(now)

    def _infer_node_name(self, node_id, ascii_hint):
        text = ascii_hint.lower()
        compact = re.sub(r"[^a-z0-9_]+", "", text)
        if (
            "pmu_lite" in text
            or "can_pmu_lite" in text
            or "cuav_can_p" in text
            or "can_p mu_lite" in text
            or "cuavcanpmulite" in compact
            or "cuavcanpmu" in compact
            or "canpmulite" in compact
            or re.search(r"cua\d?vcanpmulite", compact)
        ):
            return {
                "name": "org.cuav.can_pmu_lite",
                "displayName": "CUAV CAN PMU Lite",
                "deviceHint": "Power module / BEC",
            }
        if "gps" in text or "gnss" in text:
            return {
                "name": "org.dronecan.gnss",
                "displayName": "DroneCAN GNSS",
                "deviceHint": "GNSS",
            }
        if "bms" in text or "battery" in text:
            return {
                "name": "org.dronecan.bms",
                "displayName": "DroneCAN Battery",
                "deviceHint": "Battery / BMS",
            }
        if "esc" in text:
            return {
                "name": "org.dronecan.esc",
                "displayName": "DroneCAN ESC",
                "deviceHint": "ESC",
            }
        if node_id == 34:
            return {
                "name": "org.cuav.can_pmu_lite",
                "displayName": "CUAV CAN PMU Lite",
                "deviceHint": "Power module / BEC",
            }
        return {
            "name": f"node-{node_id}",
            "displayName": f"Node {node_id}",
            "deviceHint": "Unknown",
        }

    def _node_matches_filters(self, node, source_prefix=None, bus_filter=None):
        prefix = str(source_prefix or "").strip()
        source = str(node.get("source", ""))
        if prefix and not source.startswith(prefix):
            return False
        if bus_filter is not None:
            bus_filter = int(bus_filter)
            node_bus = int(node.get("bus") or 0)
            if not source.startswith("MAVLink"):
                return False
            if node_bus != bus_filter:
                return False
            expected = f"MAVLink CAN{bus_filter}"
            if source != expected:
                return False
        return True

    def status(self, source_prefix=None, bus_filter=None):
        now = time.time()
        with self.lock:
            self._trim_frames(now)
            # Do not immediately drop nodes on brief parser / polling gaps.
            if now - self.last_frame_at > 15.0:
                self._prune_nodes(now)
            prefix = str(source_prefix or "").strip()
            return {
                "forwardEnabled": self.forward_enabled,
                "forwardBus": int(getattr(self, "forward_bus", 0) or 0),
                "targetSystem": self.target_system,
                "targetComponent": self.target_component,
                "canForwardAck": self.last_can_forward_ack,
                "mavlinkCanFrameRx": int(getattr(self, "mavlink_can_frame_rx", 0) or 0),
                "framesPerSecond": len(self.frame_times),
                "errorCount": self.error_count,
                "nodes": sorted(
                    [
                        {
                            "nodeId": node["nodeId"],
                            "name": node.get("name") or f"node-{node['nodeId']}",
                            "displayName": node.get("displayName") or node.get("name") or f"Node {node['nodeId']}",
                            "deviceHint": node.get("deviceHint", "Unknown"),
                            "asciiHint": node.get("asciiHint", ""),
                            "status": "online",
                            "source": node.get("source", ""),
                            "bus": node.get("bus"),
                            "transport": node.get("transport", ""),
                            "rxCount": node.get("rxCount", 0),
                            "uptimeSec": node.get("uptimeSec"),
                            "lastCanId": node.get("lastCanId", ""),
                            "lastDataHex": node.get("lastDataHex", ""),
                            "lastDlc": node.get("lastDlc", 0),
                            "firstSeenAt": int(node.get("first_seen", now) * 1000),
                            "lastSeenAt": int(node.get("last_seen", now) * 1000),
                            "recentFrames": list(self.node_recent_frames.get(key, []))[-20:],
                            "frameIdCounts": dict(sorted(self.node_frame_counts.get(key, {}).items(), key=lambda kv: kv[1], reverse=True)[:12]),
                        }
                        for key, node in self.nodes.items()
                        if self._node_matches_filters(node, source_prefix=prefix, bus_filter=bus_filter)
                    ],
                    key=lambda item: item["nodeId"],
                ),
            }

    def enable_forward(self, hub, bus=1):
        if mavlink2 is None:
            raise RuntimeError("pymavlink is not installed")
        bus = int(bus)
        if bus not in (1, 2):
            raise RuntimeError("bus must be 1 or 2")
        with self.lock:
            target_system = self.target_system
            target_component = self.target_component
        _send_mavlink_command_long(hub, mavlink2.MAV_CMD_CAN_FORWARD, float(bus))
        with self.lock:
            prev_bus = int(getattr(self, "forward_bus", 0) or 0)
            if prev_bus and prev_bus != bus:
                self._prune_mavlink_bus(bus)
            self.forward_enabled = True
            self.forward_bus = bus
        return {"bus": bus, "targetSystem": target_system, "targetComponent": target_component}

    def disable_forward(self, hub):
        if mavlink2 is None:
            raise RuntimeError("pymavlink is not installed")
        with self.lock:
            target_system = self.target_system
            target_component = self.target_component
        _send_mavlink_command_long(hub, mavlink2.MAV_CMD_CAN_FORWARD, 0.0)
        with self.lock:
            self.forward_enabled = False
            self.forward_bus = 0
        return {"bus": 0, "targetSystem": target_system, "targetComponent": target_component}


# Mission Planner default DroneCAN filter whitelist (DataTypeId subjects).
DEFAULT_MAVLINK_CAN_FILTER_IDS = (
    0,
    341,   # uavcan.protocol.NodeStatus
    1,     # uavcan.protocol.GetNodeInfo
    5,     # uavcan.protocol.RestartNode
    11,    # uavcan.protocol.param.GetSet
    10,    # uavcan.protocol.param.ExecuteOpcode
    40,    # uavcan.protocol.file.BeginFirmwareUpdate
    48,    # uavcan.protocol.file.Read
    45,    # uavcan.protocol.file.GetInfo
    390,   # uavcan.protocol.dynamic_node_id.Allocation
    16383, # uavcan.protocol.debug.LogMessage
)


def _send_mavlink_command_long(hub, command, param1=0.0, param2=0.0):
    if mavlink2 is None:
        raise RuntimeError("pymavlink is not installed")
    st = hub.status()
    if not st.get("open"):
        raise RuntimeError("mavlink hub not open")
    with SLCAN_MONITOR.lock:
        target_system = int(SLCAN_MONITOR.target_system or 1)
        target_component = int(SLCAN_MONITOR.target_component or 1)
    writer_buffer = bytearray()

    class Writer:
        def write(self, b):
            writer_buffer.extend(b)
            return len(b)

    mav = mavlink2.MAVLink(Writer(), srcSystem=245, srcComponent=190)
    cmd = mav.command_long_encode(
        target_system,
        target_component,
        int(command),
        0,
        float(param1),
        float(param2),
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
    )
    mav.send(cmd)
    return hub.write(bytes(writer_buffer))


def send_mavlink_can_filter_modify(hub, bus_ui=1, ids=None, operation=None):
    """Send CAN_FILTER_MODIFY (#388). bus_ui is 1-indexed (CAN1/CAN2)."""
    if mavlink2 is None:
        raise RuntimeError("pymavlink is not installed")
    bus_ui = int(bus_ui)
    if bus_ui not in (1, 2):
        raise RuntimeError("bus must be 1 or 2")
    id_list = [int(x) & 0xFFFF for x in (ids if ids is not None else DEFAULT_MAVLINK_CAN_FILTER_IDS)]
    num_ids = min(len(id_list), 16)
    id_list = id_list[:16]
    while len(id_list) < 16:
        id_list.append(0)
    op = int(operation if operation is not None else mavlink2.CAN_FILTER_REPLACE)
    with SLCAN_MONITOR.lock:
        target_system = int(SLCAN_MONITOR.target_system or 1)
        target_component = int(SLCAN_MONITOR.target_component or 1)
    writer_buffer = bytearray()

    class Writer:
        def write(self, b):
            writer_buffer.extend(b)
            return len(b)

    mav = mavlink2.MAVLink(Writer(), srcSystem=245, srcComponent=190)
    msg = mav.can_filter_modify_encode(
        target_system,
        target_component,
        bus_ui - 1,
        op,
        len([x for x in id_list if x != 0]) or num_ids,
        id_list,
    )
    mav.send(msg)
    written = hub.write(bytes(writer_buffer))
    return {"written": written, "bus": bus_ui, "operation": op, "ids": id_list}


def _require_mavlink_hub_open():
    mav_open = MAVLINK_HUB.status().get("open")
    if not mav_open:
        raise RuntimeError(
            "open GCS MAVLink serial first (connect flight controller at top of GCS)"
        )


SLCAN_MONITOR = SlcanMavlinkMonitor()


def send_mavlink_can_frame(hub, frame_id, data_bytes, bus=0, target_system=None, target_component=None):
    """Emit MAVLink CAN_FRAME (#386) on the MAVLink serial hub (bus is 0-indexed: 0=CAN1)."""
    if mavlink2 is None:
        raise RuntimeError("pymavlink is not installed")
    st = hub.status()
    if not st.get("open"):
        raise RuntimeError("mavlink hub not open")
    with SLCAN_MONITOR.lock:
        target_system = int(target_system if target_system is not None else SLCAN_MONITOR.target_system)
        target_component = int(
            target_component if target_component is not None else SLCAN_MONITOR.target_component
        )
    raw = bytes(data_bytes or b"")[:64]
    data_list = list(raw)
    while len(data_list) < 64:
        data_list.append(0)
    writer_buffer = bytearray()

    class Writer:
        def write(self, b):
            writer_buffer.extend(b)
            return len(b)

    mav = mavlink2.MAVLink(Writer(), srcSystem=245, srcComponent=190)
    msg = mav.can_frame_encode(
        target_system,
        target_component,
        int(frame_id) & 0xFFFFFFFF,
        int(bus) & 0xFF,
        len(raw),
        data_list,
    )
    mav.send(msg)
    return hub.write(bytes(writer_buffer))


def send_json(handler, status, payload):
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Access-Control-Allow-Headers", "Content-Type")
    handler.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    handler.send_header("Cache-Control", "no-store")
    handler.send_header("Content-Length", str(len(body)))
    handler.end_headers()
    try:
        handler.wfile.write(body)
    except (BrokenPipeError, ConnectionAbortedError, ConnectionResetError):
        # Browsers may cancel polling requests while navigating or refreshing.
        return


class Handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Headers", "Content-Type, X-GCS-Tab-Id")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.end_headers()

    def end_headers(self):
        headers_buf = getattr(self, "_headers_buffer", [])
        has_cors = any(b"Access-Control-Allow-Origin:" in chunk for chunk in headers_buf)
        if not has_cors:
            self.send_header("Access-Control-Allow-Origin", "*")
        super().end_headers()

    def do_GET(self):
        if self.path == "/health":
            mav = MAVLINK_HUB.status() if 'MAVLINK_HUB' in globals() else {}
            tcp = TCP_HUB.status() if 'TCP_HUB' in globals() else {}
            send_json(self, 200, {
                "ok": True,
                "service": "com-bridge",
                "apiVersion": BRIDGE_API_VERSION,
                "scriptMtime": int(os.path.getmtime(__file__)),
                "scriptPath": __file__,
                "mavlinkBridge": {
                    "sessionId": mav.get("sessionId"),
                    "open": mav.get("open", False),
                    "port": mav.get("port"),
                    "lastRxAgeSec": mav.get("lastRxAgeSec"),
                    "readerAlive": mav.get("readerAlive"),
                    "bytesRx": mav.get("bytesRx"),
                    "error": mav.get("error"),
                },
                "tcpBridge": {
                    "sessionId": tcp.get("sessionId"),
                    "open": tcp.get("open", False),
                    "endpoint": tcp.get("endpoint"),
                    "lastRxAgeSec": tcp.get("lastRxAgeSec"),
                    "readerAlive": tcp.get("readerAlive"),
                    "bytesRx": tcp.get("bytesRx"),
                    "error": tcp.get("error"),
                },
            })
            return
        if self.path.startswith("/com-ports"):
            try:
                probe = "probe=1" in self.path or "probe=true" in self.path
                baud = 115200
                if "baud=" in self.path:
                    m = re.search(r"baud=(\d+)", self.path)
                    if m:
                        baud = int(m.group(1))
                ports = read_ports_with_roles(force=probe, baudrate=baud, probe_roles=probe)
                send_json(self, 200, {"ports": ports, "probed": probe})
            except Exception as exc:
                send_json(self, 500, {"ports": [], "ok": False, "error": str(exc)})
            return
        if self.path.startswith("/com-ports-debug"):
            try:
                send_json(self, 200, read_ports_debug())
            except Exception as exc:
                send_json(self, 500, {"ok": False, "error": str(exc)})
            return
        if self.path == "/bridge-status":
            send_json(self, 200, {
                **MAVLINK_HUB.status(),
                "apiVersion": BRIDGE_API_VERSION,
                "scriptMtime": int(os.path.getmtime(__file__)),
                "scriptPath": __file__,
                "subscribers": _bridge_subscriber_count(),
                "lastProbe": _get_bridge_probe_snapshot(),
            })
            return
        if self.path == "/tcp-status":
            send_json(self, 200, {
                **TCP_HUB.status(),
                "apiVersion": BRIDGE_API_VERSION,
                "scriptMtime": int(os.path.getmtime(__file__)),
                "scriptPath": __file__,
                "subscribers": _tcp_subscriber_count(),
            })
            return
        if self.path == "/bridge-read":
            data = _bridge_read_for_tab(_get_tab_id(self))
            send_json(self, 200, {"data": base64.b64encode(data).decode("ascii")})
            return
        if self.path == "/tcp-read":
            data = _tcp_read_for_tab(_get_tab_id(self))
            send_json(self, 200, {"data": base64.b64encode(data).decode("ascii")})
            return
        if self.path == "/slcan-status":
            st = maybe_recover_slcan_hub()
            port = st.get("port") if st.get("open") else detect_slcan_port()
            send_json(self, 200, {"adapterPort": port, **st})
            return
        if self.path == "/slcan-nodes":
            maybe_recover_slcan_hub()
            send_json(self, 200, SLCAN_MONITOR.status(source_prefix="SLCAN"))
            return
        if self.path.startswith("/mavlink-can-nodes"):
            try:
                parsed = urllib.parse.urlparse(self.path)
                qs = urllib.parse.parse_qs(parsed.query or "")
                bus = int((qs.get("bus") or ["1"])[0])
            except (TypeError, ValueError):
                send_json(self, 400, {"ok": False, "error": "bus must be 1 or 2"})
                return
            if bus not in (1, 2):
                send_json(self, 400, {"ok": False, "error": "bus must be 1 or 2"})
                return
            send_json(self, 200, SLCAN_MONITOR.status(source_prefix="MAVLink", bus_filter=bus))
            return
        if self.path == "/slcan-read":
            data = SLCAN_HUB.read_buffer()
            send_json(self, 200, {"data": base64.b64encode(data).decode("ascii")})
            return
        if self.path.startswith("/param-meta"):
            try:
                parsed = urllib.parse.urlparse(self.path)
                qs = urllib.parse.parse_qs(parsed.query or "")
                name = str((qs.get("name") or [""])[0]).strip().upper()
                vehicle = str((qs.get("vehicle") or ["AP_Periph"])[0]).strip() or "AP_Periph"
                if not name:
                    send_json(self, 400, {"ok": False, "error": "name is required"})
                    return
                entry = _lookup_param_meta(vehicle, name)
                send_json(self, 200, {
                    "ok": True,
                    "name": name,
                    "vehicle": vehicle,
                    "entry": entry,
                    "sourceUrl": PARAM_META_SOURCES.get(vehicle),
                })
            except Exception as exc:
                send_json(self, 500, {"ok": False, "error": str(exc)})
            return
        self.send_response(404)
        self.end_headers()

    def do_POST(self):
        length = int(self.headers.get("Content-Length", "0") or 0)
        raw = self.rfile.read(length) if length > 0 else b"{}"
        try:
            payload = json.loads(raw.decode("utf-8"))
        except Exception:
            send_json(self, 400, {"ok": False, "error": "invalid json"})
            return

        try:
            if self.path == "/bridge-probe-baud":
                port = str(payload.get("port") or "").strip()
                bauds = payload.get("bauds")
                if bauds is not None and not isinstance(bauds, list):
                    bauds = None
                result = probe_baud_for_port(port, bauds)
                _record_bridge_probe(port, bauds or DEFAULT_BAUD_PROBE_LIST, result)
                send_json(self, 200, result)
                return
            if self.path == "/bridge-open":
                port = str(payload.get("port") or "").strip()
                baudrate = int(payload.get("baudrate") or 115200)
                if not port:
                    raise RuntimeError("port is required")
                _assert_hub_port_free(port, "mavlink")
                tab_id = _get_tab_id(self)
                current = MAVLINK_HUB.status()
                already_open = (
                    current.get("open")
                    and str(current.get("port") or "").strip() == port
                    and int(current.get("baudrate") or 0) == baudrate
                )
                if already_open:
                    _subscribe_bridge_tab(tab_id)
                    status = MAVLINK_HUB.status()
                    send_json(self, 200, {"ok": True, "shared": True, **status, "subscribers": _bridge_subscriber_count()})
                    return
                status = MAVLINK_HUB.open(port, baudrate)
                if status.get("open"):
                    _subscribe_bridge_tab(tab_id)
                send_json(self, 200, {"ok": True, **status})
                return
            if self.path == "/bridge-close":
                tab_id = _get_tab_id(self)
                prev = MAVLINK_HUB.status()
                _unsubscribe_bridge_tab(tab_id)
                if _bridge_subscriber_count() <= 0:
                    MAVLINK_HUB.close()
                send_json(self, 200, {
                    "ok": True,
                    "sessionClosed": prev.get("sessionId", 0) if _bridge_subscriber_count() <= 0 else 0,
                    **MAVLINK_HUB.status(),
                    "subscribers": _bridge_subscriber_count(),
                })
                return
            if self.path == "/bridge-write":
                b64 = payload.get("data") or ""
                data = base64.b64decode(b64.encode("ascii"))
                written = MAVLINK_HUB.write(data)
                send_json(self, 200, {"ok": True, "written": written})
                return
            if self.path == "/bridge-force-connect":
                port = str(payload.get("port") or "").strip()
                baudrate = int(payload.get("baudrate") or 115200)
                if not port:
                    raise RuntimeError("port is required")
                _assert_hub_port_free(port, "mavlink")
                tab_id = _get_tab_id(self)
                with _bridge_subscribers_lock:
                    _bridge_subscribers.clear()
                MAVLINK_HUB.close()
                status = MAVLINK_HUB.open(port, baudrate)
                if status.get("open"):
                    _subscribe_bridge_tab(tab_id)
                send_json(self, 200, {"ok": True, **status})
                return
            if self.path == "/disconnect-all":
                tab_id = payload.get("tabId") or _get_tab_id(self)
                removed = _unsubscribe_bridge_tab(tab_id)
                if removed and _bridge_subscriber_count() <= 0:
                    MAVLINK_HUB.close()
                send_json(self, 200, {"ok": True, "subscribers": _bridge_subscriber_count()})
                return
            if self.path == "/tcp-open":
                host = str(payload.get("host") or "").strip()
                port = int(payload.get("port") or 0)
                timeout = float(payload.get("timeout") or 10.0)
                if not host:
                    raise RuntimeError("host is required")
                if port <= 0:
                    raise RuntimeError("port is required")
                tab_id = _get_tab_id(self)
                current = TCP_HUB.status()
                already_open = (
                    current.get("open")
                    and str(current.get("host") or "").strip() == host
                    and int(current.get("port") or 0) == port
                )
                if already_open:
                    _subscribe_tcp_tab(tab_id)
                    status = TCP_HUB.status()
                    send_json(self, 200, {"ok": True, "shared": True, **status, "subscribers": _tcp_subscriber_count()})
                    return
                status = TCP_HUB.open(host, port, timeout=timeout)
                if status.get("open"):
                    _subscribe_tcp_tab(tab_id)
                send_json(self, 200, {"ok": True, **status})
                return
            if self.path == "/tcp-close":
                tab_id = _get_tab_id(self)
                prev = TCP_HUB.status()
                _unsubscribe_tcp_tab(tab_id)
                if _tcp_subscriber_count() <= 0:
                    TCP_HUB.close()
                send_json(self, 200, {
                    "ok": True,
                    "sessionClosed": prev.get("sessionId", 0) if _tcp_subscriber_count() <= 0 else 0,
                    **TCP_HUB.status(),
                    "subscribers": _tcp_subscriber_count(),
                })
                return
            if self.path == "/tcp-write":
                b64 = payload.get("data") or ""
                data = base64.b64decode(b64.encode("ascii"))
                written = TCP_HUB.write(data)
                send_json(self, 200, {"ok": True, "written": written})
                return
            if self.path == "/slcan-open":
                port = str(payload.get("port") or "").strip() or str(detect_slcan_port() or "").strip()
                baudrate = int(payload.get("baudrate") or 115200)
                bitrate_kbps = int(payload.get("bitrate_kbps") or 1000)
                if not port:
                    raise RuntimeError("slcan adapter port not found")
                _assert_hub_port_free(port, "slcan")
                try:
                    cport = int(payload.get("slcan_cport") or payload.get("cport") or 1)
                    if cport not in (1, 2):
                        cport = 1
                    SLCAN_MONITOR.clear_scope("slcan")
                    SLCAN_MONITOR.slcan_cport = cport
                    status = SLCAN_HUB.open(port, baudrate)
                    init_slcan_adapter(SLCAN_HUB, bitrate_kbps=bitrate_kbps)
                    send_json(self, 200, {
                        "ok": True,
                        "adapterPort": port,
                        "bitrateKbps": bitrate_kbps,
                        "slcanInit": True,
                        **status,
                    })
                except Exception as exc:
                    send_json(self, 200, {"ok": False, "error": str(exc), "adapterPort": port})
                return
            if self.path == "/slcan-init":
                bitrate_kbps = int(payload.get("bitrate_kbps") or 1000)
                force = bool(payload.get("force"))
                if not SLCAN_HUB.status().get("open"):
                    raise RuntimeError("slcan port not open")
                now = time.time()
                last_init = getattr(SLCAN_HUB, "_last_slcan_init_at", 0.0)
                if not force and now - last_init < 30.0:
                    send_json(self, 200, {"ok": True, "skipped": True, "bitrateKbps": bitrate_kbps})
                    return
                try:
                    init_slcan_adapter(SLCAN_HUB, bitrate_kbps=bitrate_kbps)
                    SLCAN_HUB._last_slcan_init_at = now
                    send_json(self, 200, {"ok": True, "bitrateKbps": bitrate_kbps, "slcanInit": True})
                except Exception as exc:
                    send_json(self, 200, {"ok": False, "error": str(exc), "bitrateKbps": bitrate_kbps})
                return
            if self.path == "/slcan-close":
                SLCAN_HUB.close()
                SLCAN_MONITOR.clear_scope("slcan")
                send_json(self, 200, {"ok": True})
                return
            if self.path in ("/slcan-forward-enable", "/mavlink-can-forward-enable"):
                bus = int(payload.get("bus") or 1)
                if bus not in (1, 2):
                    raise RuntimeError("bus must be 1 or 2")
                _require_mavlink_hub_open()
                result = SLCAN_MONITOR.enable_forward(MAVLINK_HUB, bus=bus)
                send_json(self, 200, {"ok": True, "transport": "mavlink-bridge", **result})
                return
            if self.path == "/mavlink-can-forward-disable":
                _require_mavlink_hub_open()
                result = SLCAN_MONITOR.disable_forward(MAVLINK_HUB)
                send_json(self, 200, {"ok": True, **result})
                return
            if self.path == "/mavlink-can-filter":
                bus = int(payload.get("bus") or 1)
                if bus not in (1, 2):
                    raise RuntimeError("bus must be 1 or 2")
                _require_mavlink_hub_open()
                raw_ids = payload.get("ids")
                ids = None
                if isinstance(raw_ids, list) and raw_ids:
                    ids = [int(x) for x in raw_ids]
                op = payload.get("operation")
                operation = int(op) if op is not None else None
                result = send_mavlink_can_filter_modify(
                    MAVLINK_HUB,
                    bus_ui=bus,
                    ids=ids,
                    operation=operation,
                )
                send_json(self, 200, {"ok": True, **result})
                return
            if self.path == "/slcan-write":
                b64 = payload.get("data") or ""
                data = base64.b64decode(b64.encode("ascii"))
                recover_slcan_hub_if_needed()
                written = SLCAN_HUB.write(data)
                send_json(self, 200, {"ok": True, "written": written})
                return
            if self.path == "/mavlink-can-write":
                bus_ui = int(payload.get("bus") or 1)
                if bus_ui not in (1, 2):
                    raise RuntimeError("bus must be 1 or 2")
                frame_id = int(payload.get("id") or payload.get("frameId") or 0)
                dlen = int(payload.get("len") or payload.get("dlc") or 0)
                b64 = payload.get("data") or ""
                data = base64.b64decode(b64.encode("ascii")) if b64 else b""
                if dlen > 0:
                    data = data[:dlen]
                written = send_mavlink_can_frame(
                    MAVLINK_HUB,
                    frame_id,
                    data,
                    bus=bus_ui - 1,
                )
                send_json(self, 200, {"ok": True, "written": written, "bus": bus_ui})
                return
            if self.path == "/slcan-monitor-reset":
                scope = str(payload.get("scope") or "all").strip().lower()
                SLCAN_MONITOR.clear_scope(scope)
                send_json(self, 200, {"ok": True, "scope": scope})
                return
            if self.path == "/slcan-inject":
                line = str(payload.get("line") or "").strip()
                if not line:
                    raise RuntimeError("line is required")
                SLCAN_MONITOR.feed_slcan((line + "\r").encode("ascii"))
                status = SLCAN_MONITOR.status(source_prefix="SLCAN")
                send_json(self, 200, {"ok": True, "injected": line, **status})
                return
            if self.path == "/dronecan-ota-begin":
                node_id = int(payload.get("nodeId") or 0)
                total_size = int(payload.get("totalSize") or 0)
                image_crc = str(payload.get("imageCrc") or "").strip().upper()
                chunk_size = int(payload.get("chunkSize") or 240)
                if node_id <= 0:
                    raise RuntimeError("nodeId is required")
                if total_size <= 0:
                    raise RuntimeError("totalSize is required")
                if not re.fullmatch(r"[0-9A-F]{8}", image_crc):
                    raise RuntimeError("imageCrc must be 8 hex chars")
                OTA_SESSIONS[node_id] = {
                    "nodeId": node_id,
                    "fileName": str(payload.get("fileName") or "").strip() or "firmware.bin",
                    "totalSize": total_size,
                    "imageCrc": image_crc,
                    "chunkSize": max(64, chunk_size),
                    "received": 0,
                    "chunks": 0,
                    "startedAt": time.time(),
                    "crc32": 0,
                }
                send_json(self, 200, {"ok": True, "nodeId": node_id, "totalSize": total_size, "imageCrc": image_crc})
                return
            if self.path == "/dronecan-ota-chunk":
                node_id = int(payload.get("nodeId") or 0)
                session = OTA_SESSIONS.get(node_id)
                if not session:
                    raise RuntimeError("OTA session not found")
                offset = int(payload.get("offset") or 0)
                data_b64 = str(payload.get("data") or "")
                chunk_crc = str(payload.get("chunkCrc") or "").strip().upper()
                raw = base64.b64decode(data_b64.encode("ascii"))
                if offset != int(session["received"]):
                    raise RuntimeError(f"unexpected offset {offset}, expected {session['received']}")
                calc = f"{binascii.crc32(raw) & 0xFFFFFFFF:08X}"
                if calc != chunk_crc:
                    raise RuntimeError(f"chunk CRC mismatch: {calc} != {chunk_crc}")
                session["crc32"] = binascii.crc32(raw, session["crc32"]) & 0xFFFFFFFF
                session["received"] += len(raw)
                session["chunks"] += 1
                send_json(self, 200, {
                    "ok": True,
                    "nodeId": node_id,
                    "received": session["received"],
                    "totalSize": session["totalSize"],
                    "percent": round((session["received"] / max(1, session["totalSize"])) * 100, 1),
                })
                return
            if self.path == "/dronecan-ota-finish":
                node_id = int(payload.get("nodeId") or 0)
                session = OTA_SESSIONS.get(node_id)
                if not session:
                    raise RuntimeError("OTA session not found")
                final_crc = f"{int(session['crc32']) & 0xFFFFFFFF:08X}"
                if session["received"] != session["totalSize"]:
                    raise RuntimeError(f"incomplete image: {session['received']} / {session['totalSize']}")
                if final_crc != session["imageCrc"]:
                    raise RuntimeError(f"image CRC mismatch: {final_crc} != {session['imageCrc']}")
                finished = {
                    "ok": True,
                    "nodeId": node_id,
                    "received": session["received"],
                    "chunks": session["chunks"],
                    "imageCrc": final_crc,
                    "elapsedSec": round(time.time() - float(session["startedAt"]), 3),
                }
                OTA_SESSIONS.pop(node_id, None)
                send_json(self, 200, finished)
                return
        except HubPortConflictError as e:
            send_json(self, 409, {
                "ok": False,
                "error": str(e),
                "conflict": True,
                "port": e.port,
                "owner": e.owner,
                "requester": e.requester,
            })
            return
        except Exception as e:
            send_json(self, 500, {"ok": False, "error": str(e)})
            return

        self.send_response(404)
        self.end_headers()

    def log_message(self, fmt, *args):
        return


if __name__ == "__main__":
    ThreadingHTTPServer.allow_reuse_address = True
    server = ThreadingHTTPServer(("127.0.0.1", 8765), Handler)
    print("COM bridge running at http://127.0.0.1:8765")
    server.serve_forever()
