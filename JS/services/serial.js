/**
 * serial.js — Web Serial 连接/断开/读循环 + MAVLink 命令收发
 *
 * 已拆出的模块：
 *   - com-bridge.js: 端口枚举、自动刷新
 *   - param-loader.js: 参数加载遮罩/进度条 UI
 */

// ============================================================
// GCS Tab ID — 每个页面唯一标识（刷新保留，新标签页重新生成）
// 用于串口所有权冲突检测（防止多个标签页连同一个串口）
// ============================================================
let _gcsTabId = sessionStorage.getItem('gcs-tab-id');
if (!_gcsTabId) {
    _gcsTabId = 'gcs-' + Date.now() + '-' + Math.random().toString(36).substr(2, 8);
    sessionStorage.setItem('gcs-tab-id', _gcsTabId);
}
const GCS_TAB_ID = _gcsTabId;

window._pendingParamRequest = false;
window._bridgeMode = window._bridgeMode || "bridge";
window._bridgeConnActive = window._bridgeConnActive || false;

function shouldAutoLoadParams() {
  try {
    return localStorage.getItem("gcs.autoLoadParams") !== "0";
  } catch (_) {
    return true;
  }
}

async function bridgeFetch(path, body = null, bridgeOpts = {}) {
  if (!bridgeOpts.skipEnsure && typeof window.ensureComBridgeRunning === "function") {
    await window.ensureComBridgeRunning();
  }
  const fetchOpts = body ? {
    method: "POST",
    headers: {
        "Content-Type": "text/plain;charset=utf-8",
        "X-GCS-Tab-Id": GCS_TAB_ID
    },
    body: JSON.stringify(body),
  } : {
    method: "GET",
    headers: { "X-GCS-Tab-Id": GCS_TAB_ID }
  };
  const resp = await fetch(`http://127.0.0.1:8765${path}`, fetchOpts);
  const text = await resp.text();
  let data = {};
  try { data = JSON.parse(text); } catch (_) {}
  if (!resp.ok || data?.ok === false) {
    throw new Error(data?.error || `bridge ${path} failed (${resp.status})`);
  }
  return data;
}

function bridgeBytesToBase64(bytes) {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function bridgeBase64ToBytes(text) {
  if (!text) return new Uint8Array(0);
  const bin = atob(text);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function missionBridgeFastWrite() {
  return (
    window._missionUploadActive === true ||
    (window._missionTransfer &&
      (window._missionTransfer.mode === "upload" || window._missionTransfer.mode === "download"))
  );
}

let _bridgeWriteQueue = Promise.resolve();

function enqueueBridgeWrite(task) {
  const next = _bridgeWriteQueue.then(task, task);
  _bridgeWriteQueue = next.catch(function () {});
  return next;
}

async function bridgeWriteBytes(bytes) {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const missionIo = missionBridgeFastWrite();
  const writeFn = function () {
    return bridgeFetch(
      "/bridge-write",
      { data: bridgeBytesToBase64(arr) },
      { skipEnsure: missionIo }
    );
  };

  try {
    if (missionIo) {
      await enqueueBridgeWrite(writeFn);
      return;
    }
    await writeFn();
  } catch (err) {
    const msg = err && err.message ? err.message : String(err);
    if (missionIo && window._missionTransfer && !window._missionTransfer.error) {
      window._missionTransfer.error = "桥接写入失败: " + msg;
    }
    throw err;
  }
}

function resolveBridgeDeviceId(selectedValue, optionMeta, comSelect) {
  const sp = optionMeta?.systemPort;
  if (sp?.deviceId) return String(sp.deviceId).trim().split(" ")[0];
  if (selectedValue.startsWith("sys:")) {
    return selectedValue.replace(/^sys:/, "").trim().split(" ")[0];
  }
  return "";
}

/** 仅对 COM 桥枚举口（sys: / deviceId）走桥接；auth: 为 Web Serial 授权项 */
function shouldUseBridgeForSelection(selectedValue, optionMeta) {
  if (!selectedValue || selectedValue.startsWith("__")) return false;
  if (selectedValue.startsWith("auth:")) return false;
  if (window._bridgeMode === "bridge") return true;
  if (window._bridgeMode !== "auto") return false;
  const sp = optionMeta?.systemPort;
  if (sp?.deviceId) return true;
  return selectedValue.startsWith("sys:");
}

function getDuplicateVidPidSiblingPorts(deviceId) {
  const ports = Array.isArray(window._systemComPorts) ? window._systemComPorts : [];
  const current = ports.find((p) => p.deviceId === deviceId);
  if (!current || typeof current.usbVendorId !== "number" || typeof current.usbProductId !== "number") {
    return [];
  }
  return ports.filter(
    (p) =>
      p.deviceId &&
      p.deviceId !== deviceId &&
      p.usbVendorId === current.usbVendorId &&
      p.usbProductId === current.usbProductId
  );
}

async function probeBridgePortActivity(port, baudRate, dwellMs = 500) {
  try {
    await bridgeFetch("/bridge-close", {});
  } catch (_) { /* ignore */ }
  await bridgeFetch("/bridge-open", { port, baudrate: baudRate });
  await new Promise((r) => setTimeout(r, dwellMs));
  const resp = await bridgeFetch("/bridge-read");
  const chunk = bridgeBase64ToBytes(resp?.data || "");
  try {
    await bridgeFetch("/bridge-close", {});
  } catch (_) { /* ignore */ }
  return chunk.length;
}

async function pickActiveBridgePort(deviceId, baudRate, opts = {}) {
  const exclude = new Set(
    (opts.excludeDeviceIds || []).filter((id) => typeof id === "string" && id)
  );
  if (typeof window.getSlcanDeviceId === "function") {
    const slcanId = window.getSlcanDeviceId();
    if (slcanId) exclude.add(slcanId);
  }
  const siblings = getDuplicateVidPidSiblingPorts(deviceId).filter((p) => !exclude.has(p.deviceId));
  if (!siblings.length) return deviceId;

  const candidates = [deviceId, ...siblings.map((p) => p.deviceId)].filter((id) => !exclude.has(id));
  if (!candidates.length) return deviceId;
  if (candidates.length === 1) return candidates[0];
  let best = deviceId;
  let bestScore = -1;
  for (const port of candidates) {
    let score = 0;
    try {
      score = await probeBridgePortActivity(port, baudRate);
    } catch (_) { /* ignore */ }
    if (score > bestScore) {
      bestScore = score;
      best = port;
    }
  }
  if (best !== deviceId && bestScore > 0) {
    log(`💡 检测到同 VID/PID 多串口，已自动选用数据更活跃的 ${best}`);
  }
  return best;
}

async function bridgeReadLoop() {
  while (window._bridgeConnActive) {
    try {
      let bursts = 0;
      const maxBursts = window._paramLoadActive ? 64 : missionBridgeFastWrite() ? 48 : 24;
      while (window._bridgeConnActive && bursts < maxBursts) {
        const resp = await bridgeFetch("/bridge-read", null, { skipEnsure: true });
        const chunk = bridgeBase64ToBytes(resp?.data || "");
        if (!chunk.length) break;
        bursts += 1;
        const rx = window.buf;
        for (let i = 0; i < chunk.length; i++) rx.push(chunk[i]);
        if (typeof parse === "function") {
          parse();
          let drain = 0;
          while (rx.length > 2048 && drain < 16 && typeof parse === "function") {
            parse();
            drain += 1;
          }
        }
      }
      const fastMissionIo = missionBridgeFastWrite();
      const waitMs = window._paramLoadActive
        ? bursts
          ? 8
          : 5
        : fastMissionIo
          ? bursts
            ? 4
            : 6
          : bursts
            ? 15
            : 45;
      await new Promise((r) => setTimeout(r, waitMs));
    } catch (e) {
      const msg = e?.message || String(e);
      log(`桥接读失败: ${msg}`);
      window._bridgeConnActive = false;
      setConnectionUI("error");
      return;
    }
  }
}

let _bridgeDataWatchdog = null;
function startBridgeDataWatchdog() {
  if (_bridgeDataWatchdog) clearInterval(_bridgeDataWatchdog);
  _bridgeDataWatchdog = setInterval(async () => {
    if (!window._bridgeConnActive) {
      clearInterval(_bridgeDataWatchdog);
      _bridgeDataWatchdog = null;
      return;
    }
    try {
      const st = await bridgeFetch("/bridge-status", null, { skipEnsure: true });
      const readerDead = st?.readerAlive === false;
      const noRecentSerialRx = typeof st?.lastRxAgeSec === "number" && st.lastRxAgeSec > 12;
      const noMavlink = !window._lastMavlinkRxMs || (Date.now() - window._lastMavlinkRxMs > 8000);
      if ((readerDead || noRecentSerialRx) && noMavlink) {
        log("⚠️ 桥接串口读线程或数据已停止流动（readerAlive/lastRx 异常），链路疑似中断。建议：检查飞控供电与USB线缆、确认波特率正确、或断开后重连 / 重启 GCS 后台。", "bridge");
        // Do not auto force-close here (user may be mid-flight); just surface the diagnostic.
      }
    } catch (_) {
      // ignore transient status poll errors
    }
  }, 7000);
}

async function waitForFirstMavlinkPacket(opts = {}) {
  const timeoutMs = Number.isFinite(opts.timeoutMs) ? opts.timeoutMs : 8000;
  const sessionId = Number(opts.sessionId || 0);
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (window._lastMavlinkRxMs && window._lastMavlinkRxMs >= startedAt) {
      return true;
    }
    try {
      const st = await bridgeFetch("/bridge-status", null, { skipEnsure: true });
      if (sessionId && Number(st?.sessionId || 0) !== sessionId) {
        throw new Error("bridge session changed");
      }
      if (st?.readerAlive === false) {
        throw new Error(st?.error || "bridge reader stopped");
      }
      if (typeof st?.bytesRx === "number" && st.bytesRx > 0 && typeof st?.lastRxAgeSec === "number" && st.lastRxAgeSec < 2) {
        // 给解析器一点时间把原始串口字节转成首个 MAVLink 包
      }
    } catch (err) {
      throw err;
    }
    await new Promise((r) => setTimeout(r, 120));
  }
  throw new Error("首个 MAVLink 数据包超时未到达");
}

// ========== 串口生命周期管理 ==========

/**
 * 释放 Web Serial 读写锁并关闭端口。
 * Windows 上若未关闭就再次 open，会报 InvalidStateError。
 * @param {{ fast?: boolean }} [opts] - fast=true：跳过延时与桥接请求（页面卸载时用，避免阻塞刷新）
 */
async function closeSerialResources(opts) {
  const fast = !!(opts && opts.fast);
  if (window._heartbeatInterval) {
    clearInterval(window._heartbeatInterval);
    window._heartbeatInterval = null;
  }
  if (window._telemetryReqTimer) {
    clearInterval(window._telemetryReqTimer);
    window._telemetryReqTimer = null;
  }
  if (window._postConnectInfoTimer) {
    clearTimeout(window._postConnectInfoTimer);
    window._postConnectInfoTimer = null;
  }
  if (window._postConnectInfoRetryTimer) {
    clearTimeout(window._postConnectInfoRetryTimer);
    window._postConnectInfoRetryTimer = null;
  }
  if (_bridgeDataWatchdog) {
    clearInterval(_bridgeDataWatchdog);
    _bridgeDataWatchdog = null;
  }
  if (typeof window.endParamLoadingUI === "function" && window._paramLoadActive) {
    window.endParamLoadingUI(false, "disconnect");
  }
  window._gcsParamsLoadedOnce = false;
  window._gcsParamsLoadedSessionId = null;
  window._motorFrameProbeExhausted = false;
  if (window.MavlinkMission && window.MavlinkMission.resetMissionSession) {
    window.MavlinkMission.resetMissionSession();
  }
  window._missionUploadActive = false;
  window._bridgeConnActive = false;

  const p = window.port;
  const r = typeof reader !== "undefined" ? reader : null;
  const w = typeof writer !== "undefined" ? writer : null;

  if (fast) {
    reader = null;
    window.reader = null;
    writer = null;
    window.writer = null;
    try {
      if (r) {
        try { r.cancel().catch(() => {}); } catch (_) { /* ignore */ }
        try { r.releaseLock(); } catch (_) { /* ignore */ }
      } else if (p && p.readable && p.readable.locked) {
        try { p.readable.cancel().catch(() => {}); } catch (_) { /* ignore */ }
      }
    } catch (_) { /* ignore */ }
    try {
      if (w) {
        try { w.close().catch(() => {}); } catch (_) { /* ignore */ }
        try { w.releaseLock(); } catch (_) { /* ignore */ }
      } else if (p && p.writable && p.writable.locked) {
        try { p.writable.abort().catch(() => {}); } catch (_) { /* ignore */ }
      }
    } catch (_) { /* ignore */ }
  } else {
  try {
    if (r) {
      try { await r.cancel(); } catch (_) { /* ignore */ }
      try { r.releaseLock(); } catch (_) { /* ignore */ }
    } else if (p && p.readable && p.readable.locked) {
      try { await p.readable.cancel(); } catch (_) { /* ignore */ }
    }
  } catch (_) { /* ignore */ }
  reader = null;
  window.reader = null;

  try {
    if (w) {
      try { await w.close(); } catch (_) { /* ignore */ }
      try { w.releaseLock(); } catch (_) { /* ignore */ }
    } else if (p && p.writable && p.writable.locked) {
      try { await p.writable.abort(); } catch (_) { /* ignore */ }
    }
  } catch (_) { /* ignore */ }
  writer = null;
  window.writer = null;
  }

  try {
    if (p && typeof p.close === "function") {
      if (fast) {
        // 卸载路径：只发起 close，不 await，避免 Chrome 刷新时一直转圈
        try { p.close().catch(() => {}); } catch (_) { /* ignore */ }
      } else {
        for (let attempt = 0; attempt < 2; attempt += 1) {
          try {
            await p.close();
            break;
          } catch (_) {
            if (attempt === 0) {
              await new Promise((r) => setTimeout(r, 60));
            }
          }
        }
        await new Promise((r) => setTimeout(r, 110));
      }
    }
  } catch (_) { /* ignore */ }

  window._lastPortCloseTs = Date.now();
  window.port = null;
  if (!fast) {
    try {
      await bridgeFetch("/bridge-close", {}, { skipEnsure: true });
    } catch (_) { /* ignore */ }
  }
}

function bumpConnectionSession() {
  window._gcsConnSessionId = (window._gcsConnSessionId || 0) + 1;
  window._gcsParamsLoadedSessionId = null;
  window._gcsParamsLoadedOnce = false;
  const rx = window.buf;
  if (rx && rx.length) rx.length = 0;
  window._crcDiag = null;
  window._mavlinkCrcErrors = 0;
  window._lastMavlinkRxMs = 0;
  const now = Date.now();
  const graceMs = window._gcsAutoConnectActive ? 3000 : 2000;
  window._mavlinkCrcSessionStartMs = now;
  window._mavlinkCrcGraceUntil = now + graceMs;
}

function setConnectionUI(state) {
  window._gcsConnState = state;
  if (state === "disconnected") {
    window._radarTelemetryRxLogged = false;
  }
  try {
    document.dispatchEvent(new CustomEvent("gcs-connection", { detail: { state } }));
  } catch (e) { /* ignore */ }
  const comSelect = document.getElementById("comPort");
  const btn = document.getElementById("connectBtn");
  const baudEl = document.getElementById("serialBaud");
  if (!comSelect || !btn) return;

  if (baudEl) baudEl.disabled = state === "connecting" || state === "connected";

  comSelect.classList.remove("com-disconnected", "com-connecting", "com-connected", "com-error");
  btn.classList.remove("connecting", "connected", "error");

  if (state === "connecting") {
    comSelect.classList.add("com-connecting");
    btn.classList.add("connecting");
    btn.disabled = true;
    btn.textContent = "连接中";
  } else if (state === "connected") {
    comSelect.classList.add("com-connected");
    btn.classList.add("connected");
    btn.disabled = false;
    btn.textContent = "取消连接";
  } else if (state === "error") {
    comSelect.classList.add("com-error");
    btn.classList.add("error");
    btn.disabled = false;
    btn.textContent = "连接失败";
  } else {
    comSelect.classList.add("com-disconnected");
    btn.disabled = false;
    btn.textContent = comSelect.value === "__refresh_bridge__" ? "刷新串口" : "连接串口";
  }
}

function hasActiveConnectionRuntime() {
  if (window._bridgeConnActive === true) return true;
  if (window.port && typeof window.port === "object") return true;
  if (window.writer || (typeof writer !== "undefined" && writer)) return true;
  if (window.reader || (typeof reader !== "undefined" && reader)) return true;
  return false;
}

function reconcileConnectionUiState(reason) {
  const state = String(window._gcsConnState || "").toLowerCase();
  if (state !== "connected" && state !== "connecting") {
    setConnectionUI("disconnected");
    return false;
  }
  if (hasActiveConnectionRuntime()) {
    setConnectionUI(state);
    return true;
  }
  try {
    if (typeof log === "function" && reason) {
      log(`ℹ️ 已清理失效的串口连接界面状态（${reason}）`);
    }
  } catch (_) { /* ignore */ }
  window._bridgeConnActive = false;
  setConnectionUI("disconnected");
  return false;
}

window.reconcileConnectionUiState = reconcileConnectionUiState;

function getSelectedBaudRate() {
  const el = document.getElementById("serialBaud");
  const n = el ? parseInt(String(el.value).trim(), 10) : 115200;
  return Number.isFinite(n) && n > 0 ? n : 115200;
}

function ensureBridgeBaudPolicyHelpers() {
  if (typeof window.isAutoBaudProbeEnabled !== "function") {
    window.isAutoBaudProbeEnabled = function isAutoBaudProbeEnabledFallback() {
      try {
        return localStorage.getItem("gcs.autoBaudProbe") !== "0";
      } catch (_) {
        return true;
      }
    };
  }

  if (typeof window.getBaudProbeCandidates !== "function") {
    window.getBaudProbeCandidates = function getBaudProbeCandidatesFallback() {
      const defaults = [460800, 230400, 115200, 57600, 921600];
      const highExtra = [3000000, 2000000, 1500000];
      const selected = getSelectedBaudRate();
      const merged = [...defaults];
      if (selected > 921600) merged.unshift(selected);
      else if (selected === 921600) merged.push(selected);
      else if (selected > 0 && !merged.includes(selected)) merged.unshift(selected);
      for (const b of highExtra) {
        if (b === selected && !merged.includes(b)) merged.unshift(b);
      }
      const seen = new Set();
      const out = [];
      for (const b of merged) {
        const n = Number(b);
        if (!Number.isFinite(n) || n <= 0 || seen.has(n)) continue;
        seen.add(n);
        out.push(n);
      }
      if (!seen.has(selected)) out.push(selected);
      return out;
    };
  }

  if (typeof window.isLikelyUsbFlightControllerPort !== "function") {
    window.isLikelyUsbFlightControllerPort = function isLikelyUsbFlightControllerPortFallback(opts) {
      const sp = opts?.systemPort || null;
      const hint = [
        opts?.portName,
        opts?.portLabel,
        sp?.deviceId,
        sp?.name,
        sp?.manufacturer,
        sp?.friendlyName,
        sp?.path,
        sp?.description,
      ]
        .filter((v) => typeof v === "string" && v.trim())
        .join(" | ")
        .toLowerCase();
      if (!hint) return false;
      if (/radio|telemetry|telem|uart|ttl|ftdi|cp210|ch340|bridge|rf|sik|expresslrs|elrs|rx|tx/.test(hint)) {
        return false;
      }
      if (/usbmodem|usbserial|ttyacm|ttyusb|cu\.usb|\/dev\/tty\.acm|\/dev\/cu\.usb/.test(hint)) {
        return true;
      }
      if (/pixhawk|cuav|cube|holybro|ardupilot|px4|fmuv|mavlink/.test(hint)) {
        return true;
      }
      return typeof sp?.usbVendorId === "number" && typeof sp?.usbProductId === "number";
    };
  }

  if (typeof window.shouldAutoProbeBaud !== "function") {
    window.shouldAutoProbeBaud = function shouldAutoProbeBaudFallback(opts) {
      if (!window.isAutoBaudProbeEnabled()) return false;
      if (!opts?.useBridge) return true;
      return window.isLikelyUsbFlightControllerPort(opts);
    };
  }

  if (typeof window.resolveConnectBaudRate !== "function") {
    window.resolveConnectBaudRate = async function resolveConnectBaudRateFallback(opts) {
      const options = opts || {};
      if (!window.shouldAutoProbeBaud(options)) {
        return getSelectedBaudRate();
      }
      if (window._baudProbeInFlight) {
        return getSelectedBaudRate();
      }
      window._baudProbeInFlight = true;
      try {
        if (!options.useBridge || !options.portName) {
          return getSelectedBaudRate();
        }
        const data = await bridgeFetch("/bridge-probe-baud", {
          port: options.portName,
          bauds: window.getBaudProbeCandidates(),
        });
        const detected = Number(data?.baud || 0);
        if (Number.isFinite(detected) && detected > 0) {
          const baudEl = document.getElementById("serialBaud");
          if (baudEl) baudEl.value = String(detected);
          try {
            localStorage.setItem("gcs.lastBaud", String(detected));
          } catch (_) { /* ignore */ }
          if (typeof log === "function") log(`已自动匹配波特率 ${detected}`);
          return detected;
        }
        return getSelectedBaudRate();
      } catch (_) {
        return getSelectedBaudRate();
      } finally {
        window._baudProbeInFlight = false;
      }
    };
  }
}
ensureBridgeBaudPolicyHelpers();

function describeBridgeBaudPolicy(optionMeta, portName, portLabel) {
  const policy = {
    kind: "manual",
    label: "固定波特率",
    reason: "非 USB 飞控口默认尊重手动波特率",
  };
  if (typeof window.shouldAutoProbeBaud === "function") {
    const auto = window.shouldAutoProbeBaud({
      useBridge: true,
      portName,
      portLabel,
      systemPort: optionMeta?.systemPort || null,
    });
    if (auto) {
      policy.kind = "auto";
      policy.label = "自适应波特率";
      policy.reason = "检测为 USB 飞控直连口";
      return policy;
    }
  }
  if (typeof window.isAutoBaudProbeEnabled === "function" && !window.isAutoBaudProbeEnabled()) {
    policy.reason = "用户已关闭自动波特率探测";
  }
  return policy;
}

function scheduleRefreshPorts(opts = {}) {
  if (typeof window.refreshPorts !== "function") return;
  window.refreshPorts(opts).catch(() => {});
}

async function openSerialPortWithTimeout(port, options, timeoutMs = 15000) {
  let timer = null;
  try {
    await Promise.race([
      port.open(options),
      new Promise((_, reject) => {
        timer = setTimeout(
          () => reject(new Error("串口打开超时（15s），请关闭 Mission Planner/QGC 后重试")),
          timeoutMs
        );
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function disconnectSerial() {
  if (window._gcsConnState !== "connected") return;
  try {
    await closeSerialResources();
  } catch (e) {
    try { log(`⚠️ 断开清理异常: ${e?.message || e}`); } catch (_) { /* ignore */ }
  } finally {
    setConnectionUI("disconnected");
    // 通知后端释放串口所有权
    try {
      await fetch('http://127.0.0.1:8765/disconnect-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tabId: GCS_TAB_ID })
      });
    } catch (_) { /* ignore */ }
  }
  if (typeof window.markGcsSessionDisconnected === "function") {
    window.markGcsSessionDisconnected();
  }
  log("🔌 已取消连接（串口已释放）");
  scheduleRefreshPorts({ probeBridge: false });
}
window.disconnectSerial = disconnectSerial;

let _connectInFlight = null;

async function connect() {
  if (_connectInFlight) return _connectInFlight;
  if (window._baudProbeInFlight) {
    log("⚠️ 正在探测波特率，请稍候…");
    return;
  }

  _connectInFlight = connectImpl().finally(() => {
    _connectInFlight = null;
  });
  return _connectInFlight;
}

async function connectImpl() {
  const comSelect = document.getElementById("comPort");
  if (!comSelect) {
    log("❌ 页面未就绪：找不到串口下拉框");
    return;
  }
  let selectedValue = comSelect.value;

  if (window._gcsConnState === "connecting") {
    log("⚠️ 正在连接中，请稍候…");
    return;
  }

  let connectWatchdog = null;
  const connectWatchdogMs =
    typeof window.getConnectWatchdogMs === "function" ? window.getConnectWatchdogMs() : 25000;
  const armConnectWatchdog = () => {
    if (connectWatchdog) clearTimeout(connectWatchdog);
    connectWatchdog = setTimeout(() => {
      if (window._gcsConnState !== "connecting") return;
      const sec = Math.round(connectWatchdogMs / 1000);
      log(`❌ 连接超时（${sec}s），已释放串口；请改选带 [MAVLink] 的口或串口1 后重试`);
      closeSerialResources()
        .catch(() => {})
        .finally(() => setConnectionUI("error"));
    }, connectWatchdogMs);
  };
  const disarmConnectWatchdog = () => {
    if (connectWatchdog) clearTimeout(connectWatchdog);
    connectWatchdog = null;
  };

  try {
    const canWebSerial = typeof window.hasWebSerialApi === "function"
      ? window.hasWebSerialApi()
      : !!(navigator.serial && window.isSecureContext);

    if (!window.isSecureContext) {
      log("❌ 当前页面不是安全上下文，请通过 localhost 或 https 打开");
      setConnectionUI("error");
      return;
    }

    if (selectedValue === "__refresh_bridge__") {
      setConnectionUI("connecting");
      if (typeof window.refreshPorts === "function") {
        await window.refreshPorts({ probeBridge: true });
      }
      const comSelectAfterRefresh = document.getElementById("comPort");
      const refreshedValue = comSelectAfterRefresh ? comSelectAfterRefresh.value : "";
      const hasBridgePort = !!(
        comSelectAfterRefresh &&
        Array.from(comSelectAfterRefresh.options || []).some((opt) => opt.value && !opt.value.startsWith("__"))
      );
      if (!hasBridgePort || refreshedValue === "__refresh_bridge__") {
        setConnectionUI("error");
        log("❌ COM bridge 已启动，但当前未发现可用串口设备。请确认飞控已插入、Windows 已识别出 COM 口后，再刷新串口列表。");
        if (typeof window.alert === "function") {
          window.alert("COM bridge 已启动，但未发现可用串口设备。\n\n请确认飞控已插入电脑，并且 Windows 设备管理器中已经出现对应的 COM 口，然后回到页面点击“刷新串口”。\n\n如果设备管理器里也没有新 COM 口，通常是数据线、驱动或飞控 USB 模式问题。");
        }
        return;
      }
      setConnectionUI("disconnected");
      log("↻ 已刷新 COM 列表，请从下拉选择 [MAVLink] 端口后点击「连接串口」");
      return;
    }

    window._bridgeMode = "bridge";
    if (typeof window.ensureComBridgeRunning === "function") {
      const bridgeOk = await window.ensureComBridgeRunning();
      if (!bridgeOk) {
        log("❌ COM bridge 未就绪：请先启动本地 bridge 服务，再连接飞控");
        setConnectionUI("error");
        return;
      }
    }

    if (window._gcsConnState === "connected") {
      await disconnectSerial();
      return;
    }

    setConnectionUI("connecting");
    armConnectWatchdog();

    await closeSerialResources();

    const optionMetaEarly = window._comOptionMap?.get(selectedValue);
    const useBridge = !!selectedValue && shouldUseBridgeForSelection(selectedValue, optionMetaEarly);

    if (useBridge && selectedValue) {
      if (typeof window.ensureComBridgeRunning === "function") {
        const bridgeOk = await window.ensureComBridgeRunning();
        if (!bridgeOk) {
          const msg = window._gcsAutoConnectActive
            ? "⏳ 自动连接：COM 桥未就绪，稍后将重试"
            : "❌ COM 桥未就绪：请确认 GCS 后台服务已启动";
          log(msg);
          setConnectionUI("disconnected");
          return;
        }
      }
      try {
        const optionMeta = optionMetaEarly || window._comOptionMap?.get(selectedValue);
        if (optionMeta?.systemPort && typeof window.isNoiseSerialPort === "function" && window.isNoiseSerialPort(optionMeta.systemPort)) {
          log("❌ 当前选中的是蓝牙/调试口，无法连接飞控。请在下拉中选择 CUAV/Pixhawk 的 usbmodem 口");
          setConnectionUI("error");
          return;
        }
        let portName = resolveBridgeDeviceId(selectedValue, optionMeta, comSelect);
        if (!portName) {
          throw new Error("未识别到 COM 口名称，请在下拉中点击「↻ 刷新 COM 列表」并选择带 [桥接] 的端口");
        }
        const portLabel = comSelect.options[comSelect.selectedIndex]?.text || selectedValue;
        const portRole =
          typeof window.getPortProbeRole === "function"
            ? window.getPortProbeRole(optionMeta?.systemPort)
            : "";
        const slcanPort =
          typeof window.getSlcanDeviceId === "function" ? window.getSlcanDeviceId() : "";
        const mavlinkPort =
          typeof window.getMavlinkDeviceId === "function" ? window.getMavlinkDeviceId() : "";
        if (portRole === "slcan" || (slcanPort && portName === slcanPort)) {
          if (mavlinkPort) {
            log(`💡 当前选中 SLCAN 口，已改连 MAVLink 口：${mavlinkPort}`);
            portName = mavlinkPort;
          } else {
            log("❌ 探测为 SLCAN 口，不能用于 MAVLink 连接。请选 [MAVLink] 口");
            setConnectionUI("error");
            return;
          }
        } else if (!portRole && mavlinkPort) {
          portName = mavlinkPort;
        }
        let baudRate = getSelectedBaudRate();
        const baudPolicy = describeBridgeBaudPolicy(optionMeta, portName, portLabel);
        if (baudPolicy.kind === "auto" && typeof window.resolveConnectBaudRate === "function") {
          log(`ℹ️ ${baudPolicy.reason}，连接前先执行自适应波特率探测`);
          baudRate = await window.resolveConnectBaudRate({
            portName,
            useBridge: true,
            portLabel,
            systemPort: optionMeta?.systemPort || null,
          });
        } else {
          log(`ℹ️ ${baudPolicy.reason}，本次按手动波特率 ${baudRate} 连接`);
        }
        if (!portRole && !mavlinkPort && !window._gcsAutoConnectActive) {
          const siblings = getDuplicateVidPidSiblingPorts(portName);
          if (siblings.length) {
            portName = await pickActiveBridgePort(portName, baudRate, { excludeDeviceIds: [slcanPort] });
          }
        }
        // 调用 /bridge-open，处理 409 串口冲突
        const openResp = await fetch('http://127.0.0.1:8765/bridge-open', {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
                'X-GCS-Tab-Id': GCS_TAB_ID
            },
            body: JSON.stringify({ port: portName, baudrate: baudRate })
        });
        const openData = await openResp.json();
        if (openResp.status === 409 && openData.conflict) {
            const takeOver = confirm(
                '串口 ' + openData.port + ' 已被另一个页面占用。\n\n是否接管？对方将被断开连接。'
            );
            if (takeOver) {
                const forceResp = await fetch('http://127.0.0.1:8765/bridge-force-connect', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'text/plain;charset=utf-8',
                        'X-GCS-Tab-Id': GCS_TAB_ID
                    },
                    body: JSON.stringify({ port: portName, baudrate: baudRate })
                });
                const forceData = await forceResp.json();
                if (!forceResp.ok || forceData?.ok === false) {
                    throw new Error(forceData?.error || '接管串口失败');
                }
                var opened = forceData;
            } else {
                throw new Error('用户取消了串口连接');
            }
        } else if (!openResp.ok || openData?.ok === false) {
            throw new Error(openData?.error || ('bridge-open failed (' + openResp.status + ')'));
        } else {
            var opened = openData;
        }
        const bridgeSessionId = Number(opened?.sessionId || 0);
        bumpConnectionSession();
        window._bridgeConnActive = true;
        window.port = { bridge: true, close: async () => { await bridgeFetch("/bridge-close", {}); } };
        writer = { write: async (bytes) => bridgeWriteBytes(bytes) };
        window.writer = writer;
        reader = { cancel: async () => {}, releaseLock: () => {} };
        window.reader = reader;
        log(`🔌 COM bridge 已打开：${opened.port || portName} @ ${opened.baudrate}，等待首个 MAVLink 数据…`);
        window._readLoopLostWarned = false;
        window._lastMavlinkRxMs = 0;
        bridgeReadLoop();
        await waitForFirstMavlinkPacket({ sessionId: bridgeSessionId, timeoutMs: Math.min(connectWatchdogMs - 3000, 9000) });
        if (window._heartbeatInterval) clearInterval(window._heartbeatInterval);
        window._heartbeatInterval = setInterval(sendHeartbeat, 1000);
        sendHeartbeat().catch(() => {});
        setTimeout(() => sendHeartbeat().catch(() => {}), 250);
        startBridgeDataWatchdog();
        setConnectionUI("connected");
        log(`✅ COM bridge 已连接：${opened.port || portName} @ ${opened.baudrate}，已收到首个 MAVLink 数据`);
        if (typeof window.rememberSelectedPort === "function") {
          window.rememberSelectedPort(
            selectedValue,
            comSelect.options[comSelect.selectedIndex]?.text || selectedValue
          );
        }
        if (typeof window.markGcsSessionConnected === "function") {
          window.markGcsSessionConnected();
        }
        if (typeof window.resetAutoConnectAttempts === "function") {
          window.resetAutoConnectAttempts();
        }
        schedulePostConnectMavlinkInfoRequests();
        if (typeof window.applyConnectionTelemetrySetup === "function") {
          window.applyConnectionTelemetrySetup()
            .then(() => {
              if (typeof window.startTelemetryMaintenance === "function") {
                window.startTelemetryMaintenance(window._telemetryProfile || "sr0");
              }
            })
            .catch((e) => log(`桥接遥测初始化失败: ${e?.message || e}`));
        }
        if (window._pendingParamRequest || shouldAutoLoadParams()) {
          window._pendingParamRequest = false;
          log("桥接连接成功：开始加载参数表");
          if (typeof window.loadParams === "function") {
            window.loadParams({ force: true }).catch(() => {});
          }
        }
        disarmConnectWatchdog();
        return;
      } catch (bridgeErr) {
        window._bridgeConnActive = false;
        try { await bridgeFetch("/bridge-close", {}, { skipEnsure: true }); } catch (_) { /* ignore */ }
        if (window._gcsAutoConnectActive) {
          log(`⏳ 自动连接：桥接打开失败，将重试（${bridgeErr?.message || bridgeErr}）`);
          setConnectionUI("disconnected");
          return;
        }
        log(`❌ COM bridge 连接失败：${bridgeErr?.message || bridgeErr}`);
        setConnectionUI("error");
        return;
      }
    }

    if (!selectedValue || selectedValue.startsWith("__")) {
      log("❌ 请先从顶部下拉选择 COM bridge 端口后连接");
      setConnectionUI("error");
      return;
    }

    log("❌ 主飞控连接已统一为 COM bridge；当前未找到可用的 bridge MAVLink 端口");
    setConnectionUI("error");
    return;
  } catch (e) {
    const name = e?.name || "Error";
    const msg = e?.message || String(e);
    log(`❌ 连接失败: ${name} - ${msg}`);

    if (/reader stopped|首个 MAVLink 数据包超时|bridge/i.test(msg)) {
      log("💡 请检查 bridge 是否仍在线、端口/波特率是否正确，或断开后重新连接。");
    } else if (/open serial port|端口|占用|busy|in use/i.test(msg)) {
      log("💡 请关闭其他占用串口的程序（如 Mission Planner / QGC），再重试 bridge 连接。");
    }

    try { await closeSerialResources(); } catch (_) { /* ignore */ }
    disarmConnectWatchdog();
    setConnectionUI("error");
  } finally {
    if (window._gcsConnState !== "connecting") disarmConnectWatchdog();
  }
}
window.connect = connect;

// ========== MAVLink 命令发送 ==========

const MAV_COMP_ID_MISSIONPLANNER = 190;

async function send_v2(msgid, payload, crc_extra) {
  if (typeof window._mavlinkTxSeq !== "number" || window._mavlinkTxSeq < 0 || window._mavlinkTxSeq > 255) {
    window._mavlinkTxSeq = 0;
  }
  window._mavlinkTxSeq = (window._mavlinkTxSeq + 1) & 0xff;

  const srcSys = typeof window.gcsSysId === "number" && window.gcsSysId >= 0 && window.gcsSysId <= 255
    ? window.gcsSysId : 255;

  const pkt = [
    0xFD, payload.length, 0, 0, window._mavlinkTxSeq,
    srcSys, MAV_COMP_ID_MISSIONPLANNER & 0xff,
    msgid & 0xff, (msgid >> 8) & 0xff, (msgid >> 16) & 0xff,
    ...payload
  ];

  let crc = crc_calculate(pkt.slice(1));
  crc = crc_accumulate(crc_extra, crc);
  pkt.push(crc & 0xff, crc >> 8);
  const w = window.writer || writer;
  if (!w) throw new Error("未连接串口");
  await w.write(new Uint8Array(pkt));
}

function resolveMavlinkTargetSystem(explicit) {
  if (explicit != null && Number(explicit) > 0) return Number(explicit);
  const s = Number(window.fcSysid ?? window.sysid);
  return Number.isFinite(s) && s > 0 ? s : 1;
}

function resolveMavlinkTargetComponent(explicit) {
  if (explicit != null && Number(explicit) >= 0 && Number(explicit) <= 255) return Number(explicit);
  const c = Number(window.fcCompid ?? window.compid);
  return Number.isFinite(c) && c >= 0 && c <= 255 ? c : 1;
}

window.resolveMavlinkTargetSystem = resolveMavlinkTargetSystem;
window.resolveMavlinkTargetComponent = resolveMavlinkTargetComponent;

async function sendCommandLong(command, p1, p2, p3, p4, p5, p6, p7, confirmation, targetSystem, targetComponent) {
  if (!(window.writer || writer)) throw new Error("未连接串口");

  const ts = resolveMavlinkTargetSystem(targetSystem);
  const tc = resolveMavlinkTargetComponent(targetComponent);

  const payload = [
    ...f32bytes(p1 || 0), ...f32bytes(p2 || 0), ...f32bytes(p3 || 0),
    ...f32bytes(p4 || 0), ...f32bytes(p5 || 0), ...f32bytes(p6 || 0),
    ...f32bytes(p7 || 0),
    ...u16bytes(command), ts & 0xff, tc & 0xff, (confirmation || 0) & 0xff,
  ];
  await send_v2(76, payload, 152);
}

/** MAVLink CAN_FRAME (#386). busUi: 1=CAN1, 2=CAN2 (mavlink bus field is 0-indexed). */
async function sendMavlinkCanFrame(frameId, dataBytes, busUi = 1, targetSystem, targetComponent) {
  if (!(window.writer || writer)) throw new Error("未连接串口");
  const ts = resolveMavlinkTargetSystem(targetSystem);
  const tc = resolveMavlinkTargetComponent(targetComponent);
  const busMav = Math.max(0, (Number(busUi) || 1) - 1);
  const data = dataBytes instanceof Uint8Array ? dataBytes : new Uint8Array(dataBytes || []);
  const dlen = Math.min(64, data.length);
  const raw = new Uint8Array(78);
  const dv = new DataView(raw.buffer);
  raw[0] = ts & 0xff;
  raw[1] = tc & 0xff;
  dv.setUint32(8, frameId >>> 0, true);
  raw[12] = busMav & 0xff;
  raw[13] = dlen & 0xff;
  raw.set(data.subarray(0, dlen), 14);
  const crcExtra = typeof window.getMavlinkCrcExtra === "function" ? window.getMavlinkCrcExtra(386) : 8;
  await send_v2(386, Array.from(raw.slice(0, 14 + dlen)), crcExtra || 8);
}

/** Mission Planner DroneCAN whitelist — must match the serial link used for CAN_FORWARD. */
const DEFAULT_MAVLINK_CAN_FILTER_IDS = [
  0, 341, 1, 5, 11, 10, 40, 48, 45, 390, 16383,
];

/** MAVLink CAN_FILTER_MODIFY (#388). busUi: 1=CAN1, 2=CAN2 (mavlink bus field is 0-indexed). */
async function sendMavlinkCanFilterModify(busUi = 1, ids, operation = 0, targetSystem, targetComponent) {
  if (!(window.writer || writer)) throw new Error("未连接串口");
  const ts = resolveMavlinkTargetSystem(targetSystem);
  const tc = resolveMavlinkTargetComponent(targetComponent);
  const busMav = Math.max(0, (Number(busUi) || 1) - 1);
  const idList = Array.isArray(ids) && ids.length ? ids.slice(0, 16) : DEFAULT_MAVLINK_CAN_FILTER_IDS.slice();
  while (idList.length < 16) idList.push(0);
  const numIds = Math.max(1, idList.filter((x) => Number(x) > 0).length);
  const payload = [ts & 0xff, tc & 0xff, busMav & 0xff, operation & 0xff, numIds & 0xff];
  for (let i = 0; i < 16; i += 1) {
    const v = Number(idList[i]) & 0xffff;
    payload.push(v & 0xff, (v >> 8) & 0xff);
  }
  const crcExtra = typeof window.getMavlinkCrcExtra === "function" ? window.getMavlinkCrcExtra(388) : 8;
  await send_v2(388, payload, crcExtra || 8);
}

const MAV_CMD_REQUEST_MESSAGE = 512;
const MAV_CMD_REQUEST_AUTOPILOT_CAPABILITIES = 520;

async function sendHeartbeat() {
  await send_v2(0, [0, 0, 0, 0, 6, 8, 0, 0, 3], 50);
}

function f32bytes(v) {
  const buf = new ArrayBuffer(4);
  new DataView(buf).setFloat32(0, v, true);
  return Array.from(new Uint8Array(buf));
}

function u16bytes(v) { return [v & 0xff, (v >> 8) & 0xff]; }
function _sleepMs(ms) { return new Promise((r) => setTimeout(r, ms)); }

const MAV_CMD_ACCELCAL_VEHICLE_POS = 42429;

async function sendAccelcalVehiclePos(position) {
  if (!(window.writer || writer)) return false;
  const p1 = Number(position);
  if (!Number.isFinite(p1)) return false;
  await sendCommandLong(MAV_CMD_ACCELCAL_VEHICLE_POS, p1);
  return true;
}

window.sendParamSet = async function sendParamSet(name, value) {
  if (typeof send_v2 !== "function" || !(window.writer || writer)) return false;
  const encoder = new TextEncoder();
  const bytes = Array.from(encoder.encode(String(name).slice(0, 16)));
  while (bytes.length < 16) bytes.push(0);
  const buf = new ArrayBuffer(4);
  new DataView(buf).setFloat32(0, Number(value), true);
  const payload = [...Array.from(new Uint8Array(buf)), window.sysid || 1, window.compid || 1, ...bytes, 9];
  await send_v2(23, payload, 168);
  return true;
};

// ========== 连接后操作 ==========

function fwOverviewStillPlaceholder() {
  return ["ov-fw-version", "ov-board-hardware", "ov-device-id"].some(id => {
    const el = document.getElementById(id);
    return el && String(el.textContent || "").includes("等待飞控上报");
  });
}

async function requestAutopilotVersionAndEkfOnce() {
  if (window._gcsConnState !== "connected" || !(window.writer || writer)) return;
  try { await sendCommandLong(MAV_CMD_REQUEST_AUTOPILOT_CAPABILITIES, 1, 0, 0, 0, 0, 0, 0, 0); } catch (_) {}
  await _sleepMs(120);
  try { await sendCommandLong(MAV_CMD_REQUEST_MESSAGE, 148, 0, 0, 0, 0, 0, 0, 0); } catch (_) {}
  await _sleepMs(120);
  try { await sendCommandLong(MAV_CMD_REQUEST_MESSAGE, 193, 0, 0, 0, 0, 0, 0, 0); } catch (_) {}
}
window.requestAutopilotVersionFromVehicle = requestAutopilotVersionAndEkfOnce;

function schedulePostConnectMavlinkInfoRequests() {
  if (window._postConnectInfoTimer) clearTimeout(window._postConnectInfoTimer);
  if (window._postConnectInfoRetryTimer) clearTimeout(window._postConnectInfoRetryTimer);
  if (window._postConnectInfoRetryCount) clearTimeout(window._postConnectInfoRetryCount);
  window._postConnectInfoRetries = 0;
  window._postConnectInfoTimer = setTimeout(() => {
    window._postConnectInfoTimer = null;
    if (window._gcsConnState !== "connected" || !(window.writer || writer)) return;
    (async () => {
      await requestAutopilotVersionAndEkfOnce();
      window._postConnectInfoRetryTimer = setTimeout(async function retryCheck() {
        window._postConnectInfoRetryTimer = null;
        if (window._gcsConnState !== "connected" || !(window.writer || writer)) return;
        if (fwOverviewStillPlaceholder()) {
          window._postConnectInfoRetries++;
          if (window._postConnectInfoRetries <= 5) {
            if (typeof log === "function") {
              log(`🔄 #148 版本信息未收到，第 ${window._postConnectInfoRetries} 次重试…`, "debug");
            }
            await requestAutopilotVersionAndEkfOnce();
            window._postConnectInfoRetryTimer = setTimeout(retryCheck, 3000);
          } else {
            if (typeof log === "function") {
              log("⚠️ 已重试 5 次仍未收到 #148，飞控可能不支持 MAV_CMD_REQUEST_MESSAGE", "debug");
              if (window._lastAutopilotVersionRejectReason) {
                log(`ℹ️ 最近一次 #148 未用于覆盖概览：${window._lastAutopilotVersionRejectReason}`, "debug");
              }
            }
            // 不改动占位文本，让用户手动点"刷新"
          }
        } else {
          if (typeof log === "function") log("✅ #148 版本/硬件信息已收到并更新", "debug");
        }
      }, 3200);
    })();
  }, 500);
}

function startTelemetryRequests() {
  /* 周期遥测维护由 applyConnectionTelemetrySetup → startTelemetryMaintenance 按固件版本启动 */
}

// ========== 参数加载（保留引用 param-loader.js） ==========

function getParamLoadProfile() {
  const info = window.autopilotVersionInfo || {};
  const boardType = Number(info.boardType);
  const hwText = String(document.getElementById("ov-board-hardware")?.textContent || "").toLowerCase();
  const rawName = String(document.getElementById("ov-board-hardware")?.title || "").toLowerCase();
  const sig = `${hwText} ${rawName}`;
  const isCubeBlack =
    boardType === 9 || boardType === 50 ||
    /cube.?black|pixhawk.?1|fmuv3/.test(sig);

  if (isCubeBlack) {
    return {
      name: "cubeblack-safe",
      batchSize: 36,
      batchDelayMs: 10,
      firstRequestDelayMs: 700,
    };
  }
  return {
    name: "default-fast",
    batchSize: 72,
    batchDelayMs: 3,
    firstRequestDelayMs: 300,
  };
}
window.getParamLoadProfile = getParamLoadProfile;

async function requestParamReadByIndex(index) {
  const idx = Number(index);
  if (!Number.isFinite(idx) || idx < 0 || idx > 65534) return false;
  const payload = [...new Array(16).fill(0), idx & 0xff, (idx >> 8) & 0xff, window.sysid || 1, window.compid || 1];
  await send_v2(20, payload, 214);
  return true;
}

async function requestParamListOnce(reason) {
  if (!(window.writer || writer)) return false;
  await send_v2(21, [window.sysid || 1, window.compid || 1], 159);
  if (typeof log === "function" && reason) {
    log(`↻ 重发 PARAM_REQUEST_LIST（${reason}）`, "param-load");
  }
  return true;
}
window.requestParamListOnce = requestParamListOnce;

async function requestParamByName(name) {
  const id = String(name || "").slice(0, 16);
  if (!id || !(window.writer || writer)) return false;
  const bytes = Array.from(new TextEncoder().encode(id));
  while (bytes.length < 16) bytes.push(0);
  bytes.push(0xff, 0xff, window.sysid || 1, window.compid || 1);
  await send_v2(20, bytes, 214);
  return true;
}
window.requestParamByName = requestParamByName;

function markParamReRequestSent(indices) {
  const now = Date.now();
  if (!window._paramMissingRetryAt) window._paramMissingRetryAt = new Map();
  for (const idx of indices) {
    window._paramMissingRetryAt.set(idx, now);
  }
}

function resetParamRetryTracking() {
  window._paramMissingCursor = 0;
  window._paramMissingRetryAt = new Map();
  window._paramMissingBatchInFlight = false;
}
window.resetParamRetryTracking = resetParamRetryTracking;

async function requestMissingParamBatch() {
  const count = Number(window._paramCount);
  const seen = window._paramRxIndices;
  if (!window._paramLoadActive || !count || !seen || !(window.writer || writer)) return;
  if (window._paramMissingBatchInFlight) return;
  const profile = getParamLoadProfile();
  const retryAt = window._paramMissingRetryAt instanceof Map ? window._paramMissingRetryAt : new Map();
  window._paramMissingRetryAt = retryAt;
  const retryCooldownMs = Math.max(1200, profile.batchDelayMs * Math.max(12, profile.batchSize / 2));
  const missing = [];
  const start = Number.isFinite(window._paramMissingCursor) ? window._paramMissingCursor : 0;
  for (let step = 0; step < count && missing.length < profile.batchSize; step += 1) {
    const idx = (start + step) % count;
    if (seen.has(idx)) continue;
    const lastRetryAt = Number(retryAt.get(idx) || 0);
    if (lastRetryAt > 0 && Date.now() - lastRetryAt < retryCooldownMs) continue;
    missing.push(idx);
  }
  if (!missing.length) {
    for (let step = 0; step < count && missing.length < profile.batchSize; step += 1) {
      const idx = (start + step) % count;
      if (!seen.has(idx)) missing.push(idx);
    }
  }
  if (!missing.length) return;
  window._paramMissingBatchInFlight = true;
  markParamReRequestSent(missing);
  window._paramMissingCursor = (missing[missing.length - 1] + 1) % count;
  if (typeof log === "function") {
    const span = missing.length > 1 ? `${missing[0]}-${missing[missing.length - 1]}` : `${missing[0]}`;
    log(`↻ 补拉缺失参数 ${missing.length} 项（已收 ${seen.size}/${count}，策略=${profile.name}，索引=${span}）`, "param-load");
  }
  try {
    for (const idx of missing) {
      try {
        await requestParamReadByIndex(idx);
      } catch (_) { /* ignore */ }
      await new Promise((r) => setTimeout(r, profile.batchDelayMs));
    }
  } finally {
    window._paramMissingBatchInFlight = false;
  }
}
window.requestMissingParamBatch = requestMissingParamBatch;

async function loadParams(opts) {
  const force = !!(opts && opts.force);
  if (!(window.writer || writer)) {
    window._pendingParamRequest = true;
    log("⚠️ 当前未连接成功：已缓存参数加载请求（连接成功后自动发送）");
    return;
  }
  const sessionLoaded =
    window._gcsParamsLoadedSessionId != null &&
    window._gcsParamsLoadedSessionId === window._gcsConnSessionId;
  if (
    !force &&
    sessionLoaded &&
    window.params instanceof Map &&
    window.params.size > 50
  ) {
    if (typeof log === "function") {
      log("ℹ️ 本次连接已加载过参数表，跳过重复拉取（点「加载参数」可强制刷新）", "param-load");
    }
    return;
  }
  if (typeof window.beginParamLoadingUI !== "function" || !window.beginParamLoadingUI()) {
    log("⚠️ 参数表正在加载中，请稍候或点击「取消」结束", "param-load");
    return;
  }
  resetParamRetryTracking();
  window._pendingParamRequest = false;
  const profile = getParamLoadProfile();
  const requestParamList = () => {
    requestParamListOnce("load-start").catch((err) => {
      if (typeof window.endParamLoadingUI === "function") window.endParamLoadingUI(false, "send-fail");
      log(`⚠️ PARAM_REQUEST_LIST 发送失败：${err?.message || err}`);
    });
  };
  try {
    log(`发送 PARAM_REQUEST_LIST（策略=${profile.name}）`);
    setTimeout(requestParamList, profile.firstRequestDelayMs);
    if (window._paramListRetryTimer) clearTimeout(window._paramListRetryTimer);
    window._paramListRetryTimer = setTimeout(() => {
      window._paramListRetryTimer = null;
      if (!window._paramLoadActive) return;
      const total = Number(window._paramCount);
      const got = window._paramRxIndices ? window._paramRxIndices.size : (window.params?.size || 0);
      const staleRx = !window._lastMavlinkRxMs || Date.now() - window._lastMavlinkRxMs > 2500;
      if (staleRx && got === 0) {
        log("⚠️ 仍未收到 MAVLink 数据：请确认波特率与飞控一致，或换一个 CUAV 串口后重连", "param-load");
        return;
      }
      if (total > 0 && got > 0 && got < total) {
        if (typeof window.requestMissingParamBatch === "function") {
          window.requestMissingParamBatch();
        }
        return;
      }
      if (got === 0) {
        log("↻ 仍未收到参数，重发 PARAM_REQUEST_LIST", "param-load");
        requestParamList();
      }
    }, 4000);
  } catch (e) {
    if (typeof window.endParamLoadingUI === "function") window.endParamLoadingUI(false, "send-fail");
    window._pendingParamRequest = true;
    log(`⚠️ PARAM_REQUEST_LIST 发送失败：${e?.message || e}`);
  }
}
window.loadParams = loadParams;

// ========== 读循环 ==========

async function readLoop() {
  while (true) {
    try {
      const { value } = await reader.read();
      if (!value) continue;
      const rx = window.buf;
      for (let i = 0; i < value.length; i++) rx.push(value[i]);
      parse();
    } catch (e) {
      const msg = String(e?.message || e || "");
      if (e?.name === "AbortError") {
        try { if (reader && typeof reader.releaseLock === "function") reader.releaseLock(); } catch (_) { /* ignore */ }
        reader = null;
        window.reader = null;
        return;
      }
      const lost = e?.name === "NetworkError" || /device has been lost|设备丢失/i.test(msg);
      if (lost) {
        if (!window._readLoopLostWarned) {
          window._readLoopLostWarned = true;
          try { log("⚠️ 串口读取中断（设备已断开），请重新连接。"); } catch (_) { /* ignore */ }
        }
        try { await closeSerialResources(); } catch (_) { /* ignore */ }
        try { setConnectionUI("error"); } catch (_) { /* ignore */ }
        return;
      }
      throw e;
    }
  }
}

// ========== 导出 ==========

window.send_v2 = send_v2;
window.sendMavlinkV2 = send_v2;
window.sendCommandLong = sendCommandLong;
window.sendMavlinkCanFrame = sendMavlinkCanFrame;
window.sendMavlinkCanFilterModify = sendMavlinkCanFilterModify;
window.sendHeartbeat = sendHeartbeat;
window.sendAccelcalVehiclePos = sendAccelcalVehiclePos;

// 显式导出 close，供卸载处理器和调试使用
window.closeSerialResources = closeSerialResources;

// 页面刷新 / 关闭时主动释放 Web Serial（仅 pagehide，同步 fast 路径，不阻塞导航）。
function installSerialUnloadHandlers() {
  let unloadReleaseStarted = false;

  const releaseOnUnload = () => {
    if (unloadReleaseStarted) return;
    unloadReleaseStarted = true;
    try {
      if (typeof closeSerialResources === "function") {
        closeSerialResources({ fast: true }).catch(() => {});
      }
    } catch (_) { /* ignore */ }
    // 桥接模式：keepalive fetch，不 await，避免刷新卡死
    if (window._bridgeConnActive) {
      try {
        fetch("http://127.0.0.1:8765/bridge-close", {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: "{}",
          keepalive: true,
        }).catch(() => {});
      } catch (_) { /* ignore */ }
    }
  };

  window.addEventListener("pagehide", releaseOnUnload);

  window.forceReleaseSerial = () => {
    unloadReleaseStarted = false;
    releaseOnUnload();
  };
}

installSerialUnloadHandlers();

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => reconcileConnectionUiState("page-init"), { once: true });
} else {
  reconcileConnectionUiState("page-init");
}

// 页面关闭/刷新时通知后端释放串口所有权
window.addEventListener('beforeunload', function() {
    navigator.sendBeacon('http://127.0.0.1:8765/disconnect-all',
        JSON.stringify({ tabId: GCS_TAB_ID })
    );
});
window.addEventListener('pagehide', function() {
    navigator.sendBeacon('http://127.0.0.1:8765/disconnect-all',
        JSON.stringify({ tabId: GCS_TAB_ID })
    );
});

console.log("✅ serial.js 已加载（精简版）+ 刷新释放保护已安装（pagehide fast）");
