window._knownPorts = window._knownPorts || [];
window._comOptionMap = window._comOptionMap || new Map();
window._systemComPorts = window._systemComPorts || [];
window._autoConnectAttempts = 0;

function applyConnectionModeUi() {
  const modeEl = document.getElementById("connMode");
  const comEl = document.getElementById("comPort");
  const baudLabel = document.querySelector('label[for="serialBaud"]');
  const baudEl = document.getElementById("serialBaud");
  const autoBaud = document.querySelector('label[for="autoBaudProbe"]');
  const tcpHostEl = document.getElementById("tcpHost");
  const tcpPortEl = document.getElementById("tcpPort");
  const connectBtn = document.getElementById("connectBtn");
  const mode = modeEl ? String(modeEl.value || "bridge") : "bridge";
  const isTcp = mode === "tcp";

  if (comEl) comEl.hidden = isTcp;
  if (baudLabel) baudLabel.hidden = isTcp;
  if (baudEl) baudEl.hidden = isTcp;
  if (autoBaud) autoBaud.hidden = isTcp;
  if (tcpHostEl) tcpHostEl.hidden = !isTcp;
  if (tcpPortEl) tcpPortEl.hidden = !isTcp;
  if (connectBtn && window._gcsConnState !== "connected" && window._gcsConnState !== "connecting") {
    connectBtn.textContent = isTcp ? "连接 TCP" : "连接串口";
  }

  try {
    localStorage.setItem("gcs.connMode", mode);
    if (tcpHostEl && tcpHostEl.value) localStorage.setItem("gcs.tcpHost", tcpHostEl.value);
    if (tcpPortEl && tcpPortEl.value) localStorage.setItem("gcs.tcpPort", tcpPortEl.value);
  } catch (_) { /* ignore */ }

  if (typeof window.setConnectionUI === "function") {
    window.setConnectionUI(window._gcsConnState || "disconnected");
  }
}

function initConnectionModeUi() {
  const modeEl = document.getElementById("connMode");
  const tcpHostEl = document.getElementById("tcpHost");
  const tcpPortEl = document.getElementById("tcpPort");
  if (!modeEl) return;

  try {
    const savedMode = localStorage.getItem("gcs.connMode") || "bridge";
    modeEl.value = savedMode === "tcp" ? "tcp" : "bridge";
    if (tcpHostEl) tcpHostEl.value = localStorage.getItem("gcs.tcpHost") || tcpHostEl.value || "192.168.4.1";
    if (tcpPortEl) tcpPortEl.value = localStorage.getItem("gcs.tcpPort") || tcpPortEl.value || "5760";
  } catch (_) { /* ignore */ }

  modeEl.addEventListener("change", applyConnectionModeUi);
  tcpHostEl?.addEventListener("change", applyConnectionModeUi);
  tcpPortEl?.addEventListener("change", applyConnectionModeUi);
  applyConnectionModeUi();
}

function systemComPorts() {
  return Array.isArray(window._systemComPorts) ? window._systemComPorts : [];
}
const AUTO_CONNECT_MAX_ATTEMPTS = 20;
const AUTO_CONNECT_LATE_RETRY_MS = [8000, 15000, 30000];
const AUTO_CONNECT_BACKOFF_MS = [2000, 5000, 12000, 30000, 60000];
const BRIDGE_API = "http://127.0.0.1:8765";
let ensureBridgePromise = null;
let _bridgeFreshInFlight = null;

function hasWebSerialApi() {
  return !!(typeof navigator !== "undefined" && navigator.serial && window.isSecureContext);
}

window.hasWebSerialApi = hasWebSerialApi;

/** 蓝牙/调试等非飞控口（内置浏览器默认项常误选这些） */
function isNoiseSerialPort(sp) {
  const dev = String(sp?.deviceId || "").toLowerCase();
  const name = String(sp?.name || "").toLowerCase();
  if (!dev && !name) return true;
  if (/bluetooth|incoming-port|debug-console|wlan|iphone|android/i.test(dev)) return true;
  if (/bluetooth|debug console|incoming|phone link/i.test(name)) return true;
  return false;
}

function rankSerialPort(sp) {
  if (!sp || isNoiseSerialPort(sp)) return 1000;
  let score = 400;
  const dev = String(sp.deviceId || "").toLowerCase();
  const name = String(sp.name || "").toLowerCase();
  if (/usbmodem|usbserial|acm\d|cu\.usb|ttyusb|ttyacm/i.test(dev)) score -= 250;
  if (typeof sp.usbVendorId === "number" && typeof sp.usbProductId === "number") score -= 120;
  const vid = sp.usbVendorId;
  if ([0x26ac, 0x1209, 0x2dae, 0x3162, 0x0483].includes(vid)) score -= 100;
  if (/cuav|pixhawk|ardupilot|mavlink|fmuv|cube|holybro|px4/i.test(name)) score -= 80;
  return score;
}

function sortSystemPortsForPicker(ports) {
  return ports.slice().sort((a, b) => {
    const d = rankSerialPort(a) - rankSerialPort(b);
    if (d !== 0) return d;
    return String(a.deviceId || "").localeCompare(String(b.deviceId || ""), "en");
  });
}

function pickPreferredPortValue(comSelect) {
  if (!comSelect) return "";
  for (const opt of comSelect.options) {
    if (!opt.value || opt.value.startsWith("__")) continue;
    const meta = window._comOptionMap?.get(opt.value);
    if (getPortProbeRole(meta?.systemPort) === "mavlink") return opt.value;
  }
  let bestVal = "";
  let bestRank = Infinity;
  for (const opt of comSelect.options) {
    if (!opt.value || opt.value.startsWith("__")) continue;
    const meta = window._comOptionMap?.get(opt.value);
    if (getPortProbeRole(meta?.systemPort) === "slcan") continue;
    const rank = meta?.systemPort ? rankSerialPort(meta.systemPort) : 900;
    if (rank < bestRank) {
      bestRank = rank;
      bestVal = opt.value;
    }
  }
  return bestRank < 900 ? bestVal : "";
}

window.isNoiseSerialPort = isNoiseSerialPort;
window.rankSerialPort = rankSerialPort;

const BRIDGE_OFFLINE_BACKOFF_MS = 45000;
const BRIDGE_HEALTH_PROBE_MS = 15000;
const EXPECTED_BRIDGE_API_VERSION = 4;
const _PAGE_LOAD_TS = Math.floor(Date.now() / 1000);

function isBridgeBackoffActive() {
  return typeof window._comBridgeBackoffUntil === "number" && Date.now() < window._comBridgeBackoffUntil;
}
window.systemComPorts = systemComPorts;
async function probeBridgeHealth() {
  if (window.__gcsStackBootstrapping) return false;
  if (typeof window._comBridgeProbeBackoffUntil === "number" && Date.now() < window._comBridgeProbeBackoffUntil) {
    return false;
  }
  try {
    const resp = await fetch(`${BRIDGE_API}/health`, { cache: "no-store" });
    window._comBridgeProbeBackoffUntil = 0;
    if (resp.ok) {
      window._comBridgeOnline = true;
      window._comBridgeBackoffUntil = 0;
      try {
        const j = await resp.clone().json();
        window._lastBridgeScriptMtime = j && j.scriptMtime ? j.scriptMtime : null;
        window._lastBridgeScriptPath = j && j.scriptPath ? j.scriptPath : null;
        window._lastBridgeApiVersion = j && j.apiVersion != null ? Number(j.apiVersion) : null;
        const apiStale = window._lastBridgeApiVersion == null
          || window._lastBridgeApiVersion < EXPECTED_BRIDGE_API_VERSION;
        if (apiStale && !window._bridgeStaleRefreshInFlight) {
          window._bridgeStaleRefreshInFlight = true;
          requestBridgeStartup(true)
            .catch(() => {})
            .finally(() => {
              window._bridgeStaleRefreshInFlight = false;
            });
        }
        if (!window._loggedBridgeMtimeDiag && window._lastBridgeScriptMtime && Math.abs(window._lastBridgeScriptMtime - _PAGE_LOAD_TS) > 600) {
          window._loggedBridgeMtimeDiag = true;
          console.log("[gcs] probeBridgeHealth: bridge scriptMtime differs sig from page load ts (possible stale-code case before self-heal):", window._lastBridgeScriptMtime, "path=", window._lastBridgeScriptPath);
        }
      } catch (_) {}
    }
    return resp.ok;
  } catch (_) {
    window._comBridgeProbeBackoffUntil = Date.now() + BRIDGE_HEALTH_PROBE_MS;
    return false;
  }
}

async function getBridgeStartupError() {
  try {
    const r = await fetch("http://127.0.0.1:8766/__gcs/ping", { cache: "no-store" });
    if (r.ok) {
      const j = await r.json();
      return j?.bridgeError || null;
    }
  } catch (_) {}
  return null;
}
window.getBridgeStartupError = getBridgeStartupError;

async function requestBridgeStartup(forceRestart = false) {
  const attempts = [
    {
      url: forceRestart
        ? "http://127.0.0.1:8766/__gcs/ensure-bridge?force=1"
        : "http://127.0.0.1:8766/__gcs/ensure-bridge",
      method: "POST",
      headers: forceRestart ? { "X-GCS-Force-Bridge-Restart": "1" } : undefined,
    },
    { url: "http://127.0.0.1:8767/launch", method: "POST" },
  ];
  for (const { url, method, headers } of attempts) {
    try {
      const resp = await fetch(url, { method, headers, cache: "no-store" });
      if (resp.ok) return true;
    } catch (_) {
      // try next launcher/runtime
    }
  }
  return false;
}

async function ensureComBridgeFresh() {
  if (_bridgeFreshInFlight) return _bridgeFreshInFlight;
  _bridgeFreshInFlight = (async () => {
    await requestBridgeStartup(true);
    for (let i = 0; i < 15; i += 1) {
      if (await probeBridgeHealth()) return true;
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
    return !!window._comBridgeOnline;
  })().finally(() => {
    _bridgeFreshInFlight = null;
  });
  return _bridgeFreshInFlight;
}
window.ensureComBridgeFresh = ensureComBridgeFresh;

function markBridgeOffline(message) {
  window._comBridgeOnline = false;
  window._comBridgeBackoffUntil = Date.now() + BRIDGE_OFFLINE_BACKOFF_MS;
  if (!window._comBridgeOfflineHintLogged) {
    window._comBridgeOfflineHintLogged = true;
    if (typeof window.log === "function" && message) {
      window.log(message);
    }
  }
}

async function ensureComBridgeRunning() {
  const liveDev = !!window.__gcsLiveServerDev;
  if (isBridgeBackoffActive()) {
    if (await probeBridgeHealth()) {
      window._comBridgeOnline = true;
      window._comBridgeBackoffUntil = 0;
      window._autoConnectAttempts = 0;
      return true;
    }
    return !!window._comBridgeOnline;
  }
  if (await probeBridgeHealth()) {
    window._comBridgeOnline = true;
    window._comBridgeBackoffUntil = 0;
    return true;
  }
  if (typeof window.ensureGcsStackReady === "function") {
    if (liveDev) {
      window.ensureGcsStackReady().catch(() => {});
    } else {
      await window.ensureGcsStackReady();
    }
  }
  if (await probeBridgeHealth()) {
    window._comBridgeOnline = true;
    window._comBridgeBackoffUntil = 0;
    return true;
  }
  if (isBridgeBackoffActive()) return false;
  const waitAttempts = liveDev ? 8 : 20;
  if (!ensureBridgePromise) {
    ensureBridgePromise = (async () => {
      await requestBridgeStartup();
      for (let i = 0; i < waitAttempts; i += 1) {
        if (await probeBridgeHealth()) {
          window._comBridgeOnline = true;
          window._comBridgeBackoffUntil = 0;
          window._comBridgeOfflineHintLogged = false;
          return true;
        }
        await new Promise((resolve) => setTimeout(resolve, liveDev ? 400 : 300));
      }
      const hint = liveDev
        ? "COM bridge 未启动或未就绪。请先启动本地 bridge 服务，再进行飞控连接。"
        : "本地 COM bridge 未就绪。请从桌面「GCS」图标打开，或确认 8765/8766 启动器可用。";
      markBridgeOffline(hint);
      return false;
    })().finally(() => {
      ensureBridgePromise = null;
    });
  }
  return ensureBridgePromise;
}

function getPortProbeRole(sp) {
  if (!sp) return "";
  const role = String(sp.probeRole || sp.role || "").toLowerCase();
  if (role === "mavlink" || role === "slcan") return role;
  return "";
}

function findPortByProbeRole(role) {
  const want = String(role || "").toLowerCase();
  if (!want) return null;
  return systemComPorts().find((p) => getPortProbeRole(p) === want) || null;
}

window.getPortProbeRole = getPortProbeRole;

async function fetchSystemComPortsImpl(opts = {}) {
  const forceProbe = opts.forceProbe === true || opts.forceBridgeProbe === true;
  const cached = Array.isArray(window._lastFetchedSystemPorts) ? window._lastFetchedSystemPorts : [];
  const lastAt = window._lastFetchedSystemPortsAt || 0;
  if (!forceProbe && cached.length && Date.now() - lastAt < 12000) {
    return cached;
  }
  if (!forceProbe && isBridgeBackoffActive()) {
    return cached;
  }
  if (hasWebSerialApi() && isBridgeBackoffActive() && !opts.forceBridge) {
    return cached;
  }
  if (!window.__gcsLiveServerDev) {
    await ensureComBridgeRunning();
  } else {
    await probeBridgeHealth();
  }
  if (isBridgeBackoffActive() && !window._comBridgeOnline) {
    return cached;
  }
  try {
    const baudEl = document.getElementById("serialBaud");
    const baud = baudEl ? parseInt(String(baudEl.value || "115200"), 10) : 115200;
    const baudQ = Number.isFinite(baud) && baud > 0 ? baud : 115200;
    const probeQ = forceProbe ? "1" : "0";
    const resp = await fetch(`${BRIDGE_API}/com-ports?probe=${probeQ}&baud=${baudQ}`, { cache: "no-store" });
    if (!resp.ok) throw new Error(`bridge list failed (${resp.status})`);
    const data = await resp.json();
    const ports = Array.isArray(data.ports) ? data.ports : [];
    window._comBridgeOnline = true;
    window._comBridgeBackoffUntil = 0;
    window._lastFetchedSystemPorts = ports;
    window._lastFetchedSystemPortsAt = Date.now();
    window._comBridgeOfflineHintLogged = false;
    resetAutoConnectAttempts();
    return ports;
  } catch (_) {
    markBridgeOffline(null);
    window._lastFetchedSystemPorts = window._lastFetchedSystemPorts || [];
    return window._lastFetchedSystemPorts;
  }
}

async function fetchSystemComPorts(opts = {}) {
  fetchSystemComPorts._queue = fetchSystemComPorts._queue || Promise.resolve();
  const run = fetchSystemComPorts._queue.then(() => fetchSystemComPortsImpl(opts));
  fetchSystemComPorts._queue = run.catch(() => {});
  return run;
}

function getRememberedPortKey() {
  try { return localStorage.getItem("gcs.lastPortKey") || ""; } catch (_) { return ""; }
}

function getRememberedPortLabel() {
  try { return localStorage.getItem("gcs.lastPortLabel") || ""; } catch (_) { return ""; }
}

function extractComDeviceId(text) {
  const m = String(text || "").match(/\b(COM\d+)\b/i);
  return m ? m[1].toUpperCase() : "";
}

function isAutoReconnectEnabled() {
  try {
    return localStorage.getItem("gcs.autoReconnect") !== "0";
  } catch (_) {
    return true;
  }
}

function getRememberedDeviceId() {
  try {
    const id = localStorage.getItem("gcs.lastDeviceId") || "";
    if (id) return id.toUpperCase();
    return extractComDeviceId(getRememberedPortLabel());
  } catch (_) {
    return "";
  }
}

function shouldAutoReconnectOnLoad() {
  if (!isAutoReconnectEnabled()) return false;
  try {
    if (localStorage.getItem("gcs.wasConnected") === "0") return false;
  } catch (_) { /* ignore */ }
  return !!(getRememberedPortKey() || getRememberedPortLabel() || getRememberedDeviceId());
}

function restoreRememberedBaud() {
  try {
    const raw = localStorage.getItem("gcs.lastBaud");
    const n = raw != null ? parseInt(String(raw), 10) : NaN;
    if (!Number.isFinite(n) || n <= 0) return;
    const el = document.getElementById("serialBaud");
    if (el) el.value = String(n);
  } catch (_) { /* ignore */ }
}

function resolveRememberedPortValue(comSelect) {
  if (!comSelect) return "";

  const mavProbed = findPortByProbeRole("mavlink");
  if (mavProbed?.deviceId) {
    for (const [val, meta] of window._comOptionMap.entries()) {
      if (val.startsWith("__")) continue;
      if (meta?.systemPort?.deviceId === mavProbed.deviceId) return val;
    }
  }

  const deviceId = getRememberedDeviceId();
  if (deviceId) {
    for (const [val, meta] of window._comOptionMap.entries()) {
      if (val.startsWith("__")) continue;
      if (meta?.systemPort?.deviceId && String(meta.systemPort.deviceId).toUpperCase() === deviceId) {
        if (!isNoiseSerialPort(meta.systemPort)) return val;
      }
    }
    const byDev = Array.from(comSelect.options).find(
      (o) =>
        !o.value.startsWith("__") &&
        String(o.text || "").toUpperCase().includes(deviceId) &&
        !isNoiseSerialPort(window._comOptionMap?.get(o.value)?.systemPort)
    );
    if (byDev) return byDev.value;
  }

  const rememberedKey = getRememberedPortKey();
  if (rememberedKey && window._comOptionMap.has(rememberedKey)) {
    const meta = window._comOptionMap.get(rememberedKey);
    if (!meta?.systemPort || !isNoiseSerialPort(meta.systemPort)) {
      return rememberedKey;
    }
  }

  const rememberedLabel = getRememberedPortLabel();
  if (rememberedLabel) {
    const match = Array.from(comSelect.options).find((o) => String(o.text || "") === rememberedLabel);
    if (match && match.value && !match.value.startsWith("__")) {
      const meta = window._comOptionMap.get(match.value);
      if (!meta?.systemPort || !isNoiseSerialPort(meta.systemPort)) return match.value;
    }
  }
  return "";
}

function findCuavSiblingPort(mavlinkDeviceId) {
  if (!mavlinkDeviceId) return "";
  const slcanProbed = findPortByProbeRole("slcan");
  if (slcanProbed?.deviceId && slcanProbed.deviceId !== mavlinkDeviceId) {
    return slcanProbed.deviceId;
  }
  const ports = systemComPorts();
  const current = ports.find((p) => p?.deviceId === mavlinkDeviceId);
  const siblings = ports.filter(
    (p) => p?.deviceId && p.deviceId !== mavlinkDeviceId && !isNoiseSerialPort(p)
  );
  if (!siblings.length) return "";

  const slcanSibling = siblings.find((p) => getPortProbeRole(p) === "slcan");
  if (slcanSibling?.deviceId) return slcanSibling.deviceId;

  if (current && typeof current.usbVendorId === "number" && typeof current.usbProductId === "number") {
    const vidPidSiblings = siblings.filter(
      (p) => p.usbVendorId === current.usbVendorId && p.usbProductId === current.usbProductId
    );
    if (vidPidSiblings.length === 1) return vidPidSiblings[0].deviceId;
    const nonMavlink = vidPidSiblings.find((p) => getPortProbeRole(p) !== "mavlink");
    if (nonMavlink?.deviceId) return nonMavlink.deviceId;
  }

  if (siblings.length === 1) return siblings[0].deviceId;
  return "";
}

function detectFcPortTopology(opts = {}) {
  const ports = systemComPorts().filter((p) => p?.deviceId && !isNoiseSerialPort(p));
  const mavProbed = findPortByProbeRole("mavlink");
  const slcanProbed = findPortByProbeRole("slcan");
  const mavlinkDeviceId = String(
    opts.mavlinkDeviceId || getMavlinkDeviceId() || mavProbed?.deviceId || ""
  ).trim();
  let slcanDeviceId = String(slcanProbed?.deviceId || "").trim();
  if (!slcanDeviceId && mavlinkDeviceId) {
    slcanDeviceId = String(findCuavSiblingPort(mavlinkDeviceId) || "").trim();
  }
  if (!slcanDeviceId) {
    const named = ports.find((p) => p.isSlcanAdapter || /slcan/i.test(String(p.name || "")));
    slcanDeviceId = String(named?.deviceId || "").trim();
  }

  const dualByProbe = !!(
    mavProbed?.deviceId &&
    slcanProbed?.deviceId &&
    mavProbed.deviceId !== slcanProbed.deviceId
  );
  const dualByPair = !!(
    mavlinkDeviceId &&
    slcanDeviceId &&
    slcanDeviceId !== mavlinkDeviceId
  );
  const dualByVidPid = (() => {
    const groups = new Map();
    ports.forEach((p) => {
      if (typeof p.usbVendorId !== "number" || typeof p.usbProductId !== "number") return;
      const key = `${p.usbVendorId}:${p.usbProductId}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(p);
    });
    return Array.from(groups.values()).some((g) => g.length >= 2);
  })();

  const singleCom = ports.length <= 1 && !dualByProbe && !dualByPair;
  let mode = "unknown";
  if (singleCom) mode = "single-com";
  else if (dualByProbe || dualByPair || dualByVidPid) mode = "dual-com";

  const slcanPort = slcanDeviceId
    ? ports.find((p) => p.deviceId === slcanDeviceId)
    : null;
  const slcanAvailable = !!(
    slcanProbed?.deviceId ||
    (slcanDeviceId &&
      slcanDeviceId !== mavlinkDeviceId &&
      (!slcanPort || getPortProbeRole(slcanPort) !== "mavlink"))
  );

  return {
    mode,
    portCount: ports.length,
    mavlinkDeviceId,
    slcanDeviceId,
    slcanAvailable,
    mavlinkProbed: !!mavProbed?.deviceId,
    slcanProbed: !!slcanProbed?.deviceId,
    dualByProbe,
    dualByPair,
    dualByVidPid,
  };
}

function pruneStalePortStorage() {
  const ports = systemComPorts();
  const ids = new Set(ports.map((p) => String(p?.deviceId || "").trim()).filter(Boolean));
  try {
    const manual = localStorage.getItem("gcs.slcanDeviceIdManual") === "1";
    const slcan = localStorage.getItem("gcs.slcanDeviceId") || "";
    if (!manual && slcan && ids.size && !ids.has(slcan)) {
      localStorage.removeItem("gcs.slcanDeviceId");
    }
    const mav = localStorage.getItem("gcs.mavlinkDeviceId") || "";
    if (mav && ids.size && !ids.has(mav) && !ids.has(mav.toUpperCase())) {
      localStorage.removeItem("gcs.mavlinkDeviceId");
    }
  } catch (_) { /* ignore */ }
}

function assignSlcanSiblingFromMavlink(mavlinkDeviceId) {
  if (!mavlinkDeviceId) return;
  try {
    const manual = localStorage.getItem("gcs.slcanDeviceIdManual");
    if (manual === "1") return;
    const sibling = findCuavSiblingPort(mavlinkDeviceId);
    if (sibling) localStorage.setItem("gcs.slcanDeviceId", sibling);
  } catch (_) { /* ignore */ }
}

function getSlcanDeviceId() {
  const probed = findPortByProbeRole("slcan");
  if (probed?.deviceId) return probed.deviceId;
  try {
    const manual = localStorage.getItem("gcs.slcanDeviceIdManual") === "1";
    const saved = localStorage.getItem("gcs.slcanDeviceId") || "";
    if (saved) {
      const hit = systemComPorts().find((p) => p?.deviceId === saved);
      if (hit && getPortProbeRole(hit) !== "mavlink" && (manual || findCuavSiblingPort(getMavlinkDeviceId()) === saved)) {
        return saved;
      }
    }
  } catch (_) { /* ignore */ }
  const mavDev = getMavlinkDeviceId();
  if (mavDev) {
    const sibling = findCuavSiblingPort(mavDev);
    if (sibling) return sibling;
  }
  const hit = systemComPorts().find((p) => p && (p.isSlcanAdapter || /slcan/i.test(String(p.name || ""))));
  return hit?.deviceId || "";
}

function getMavlinkDeviceId() {
  const probed = findPortByProbeRole("mavlink");
  if (probed?.deviceId) return probed.deviceId;
  try {
    const id = localStorage.getItem("gcs.mavlinkDeviceId") || getRememberedDeviceId() || "";
    if (id && systemComPorts().some((p) => p?.deviceId && String(p.deviceId).toUpperCase() === id.toUpperCase())) {
      return id;
    }
  } catch (_) { /* ignore */ }
  return getRememberedDeviceId();
}

function portRoleSuffix(sp) {
  const role = getPortProbeRole(sp);
  if (role === "slcan") return " [SLCAN]";
  if (role === "mavlink") return " [MAVLink]";
  if (!sp?.deviceId) return "";
  return "";
}

window.getSlcanDeviceId = getSlcanDeviceId;
window.getMavlinkDeviceId = getMavlinkDeviceId;
window.findCuavSiblingPort = findCuavSiblingPort;
window.findPortByProbeRole = findPortByProbeRole;
window.detectFcPortTopology = detectFcPortTopology;
window.pruneStalePortStorage = pruneStalePortStorage;
window.assignSlcanSiblingFromMavlink = assignSlcanSiblingFromMavlink;

function rememberSelectedPort(value, label) {
  try {
    if (value) localStorage.setItem("gcs.lastPortKey", value);
    if (label) localStorage.setItem("gcs.lastPortLabel", label);
    const meta = window._comOptionMap?.get(value);
    const deviceId = meta?.systemPort?.deviceId || extractComDeviceId(label);
    if (deviceId) {
      const dev = String(deviceId);
      const role = getPortProbeRole(meta?.systemPort);
      if (role === "slcan") {
        localStorage.setItem("gcs.slcanDeviceId", dev);
        localStorage.setItem("gcs.slcanDeviceIdManual", "1");
      } else {
        localStorage.setItem("gcs.lastDeviceId", dev.toUpperCase());
        localStorage.setItem("gcs.mavlinkDeviceId", dev);
        assignSlcanSiblingFromMavlink(dev);
      }
    }
    const baudEl = document.getElementById("serialBaud");
    if (baudEl) localStorage.setItem("gcs.lastBaud", String(baudEl.value || "115200"));
  } catch (_) { /* ignore */ }
}

function markGcsSessionConnected() {
  try {
    localStorage.setItem("gcs.wasConnected", "1");
  } catch (_) { /* ignore */ }
}

function markGcsSessionDisconnected() {
  try {
    localStorage.setItem("gcs.wasConnected", "0");
  } catch (_) { /* ignore */ }
}

function setConnectSerialHint(text) {
  const btn = document.getElementById("connectBtn");
  if (btn) btn.title = text || "";
}

/** 自动重连：仅主 bridge sys 口；不再对主飞控链路使用 auth: Web Serial */
function canSilentAutoConnect(target) {
  if (!target || target.startsWith("__")) return false;
  const meta = window._comOptionMap?.get(target);
  if (target.startsWith("auth:")) return false;
  if (meta?.systemPort?.deviceId) {
    if (isNoiseSerialPort(meta.systemPort)) return false;
    if (window._comBridgeOnline) return true;
    return !isBridgeBackoffActive();
  }
  return false;
}

function pickPreferredPortValueForAutoConnect(comSelect) {
  if (!comSelect) return "";
  const candidates = [];
  for (const opt of comSelect.options) {
    if (!opt.value || opt.value.startsWith("__")) continue;
    const meta = window._comOptionMap?.get(opt.value);
    if (meta?.systemPort && isNoiseSerialPort(meta.systemPort)) continue;
    if (!canSilentAutoConnect(opt.value)) continue;
    candidates.push(opt.value);
  }
  for (const val of candidates) {
    const role = getPortProbeRole(window._comOptionMap?.get(val)?.systemPort);
    if (role === "mavlink") return val;
  }
  for (const val of candidates) {
    const role = getPortProbeRole(window._comOptionMap?.get(val)?.systemPort);
    if (role !== "slcan") return val;
  }
  return candidates[0] || "";
}

function preferMavlinkConnectTarget(comSelect, target) {
  if (!target || !comSelect) return target;
  const meta = window._comOptionMap?.get(target);
  const role = getPortProbeRole(meta?.systemPort);
  if (role === "mavlink") return target;

  const mavProbed = findPortByProbeRole("mavlink");
  if (mavProbed?.deviceId) {
    for (const [val, m] of window._comOptionMap.entries()) {
      if (val.startsWith("__")) continue;
      if (m?.systemPort?.deviceId === mavProbed.deviceId && canSilentAutoConnect(val)) {
        return val;
      }
    }
  }

  const preferred = pickPreferredPortValueForAutoConnect(comSelect);
  if (preferred && getPortProbeRole(window._comOptionMap?.get(preferred)?.systemPort) !== "slcan") {
    return preferred;
  }
  return target;
}

function resetAutoConnectAttempts() {
  window._autoConnectAttempts = 0;
  window._autoConnectRetryUntil = 0;
}

function noteAutoConnectFailure() {
  window._autoConnectAttempts = (window._autoConnectAttempts || 0) + 1;
  const idx = Math.min(window._autoConnectAttempts - 1, AUTO_CONNECT_BACKOFF_MS.length - 1);
  const delay = AUTO_CONNECT_BACKOFF_MS[idx] || AUTO_CONNECT_BACKOFF_MS[AUTO_CONNECT_BACKOFF_MS.length - 1];
  window._autoConnectRetryUntil = Date.now() + delay;
}

let _tryAutoConnectInFlight = false;

async function tryAutoConnect() {
  try {
    if ((localStorage.getItem("gcs.connMode") || "bridge") === "tcp") return;
  } catch (_) { /* ignore */ }
  if (!shouldAutoReconnectOnLoad()) return;
  if (window._gcsConnState === "connected" || window._gcsConnState === "connecting") return;
  if (typeof window._autoConnectRetryUntil === "number" && Date.now() < window._autoConnectRetryUntil) return;
  if (_tryAutoConnectInFlight) return;
  _tryAutoConnectInFlight = true;

  if (window.__gcsRuntimeNative && typeof ensureComBridgeRunning === "function") {
    try {
      await ensureComBridgeRunning();
    } catch (_) { /* ignore */ }
  }

  const comSelect = document.getElementById("comPort");
  if (!comSelect || !comSelect.options.length) return;

  let target = resolveRememberedPortValue(comSelect);
  if (!target || !canSilentAutoConnect(target)) {
    target = pickPreferredPortValueForAutoConnect(comSelect);
  }
  if (!target) target = pickPreferredPortValue(comSelect);
  target = preferMavlinkConnectTarget(comSelect, target);
  if (!target || !canSilentAutoConnect(target)) {
    _tryAutoConnectInFlight = false;
    return;
  }

  const targetMeta = window._comOptionMap.get(target);
  if (targetMeta?.systemPort && isNoiseSerialPort(targetMeta.systemPort)) {
    const alt = pickPreferredPortValueForAutoConnect(comSelect) || pickPreferredPortValue(comSelect);
    if (!alt || !canSilentAutoConnect(alt)) {
      _tryAutoConnectInFlight = false;
      return;
    }
    target = alt;
    if (typeof window.log === "function") {
      window.log("内置浏览器：已跳过蓝牙/调试口，改用飞控 USB 串口", "info");
    }
  }

  const bridgeReady = !!window._comBridgeOnline;
  const attempts = window._autoConnectAttempts || 0;
  if (attempts >= AUTO_CONNECT_MAX_ATTEMPTS && bridgeReady) {
    _tryAutoConnectInFlight = false;
    return;
  }
  if (attempts >= AUTO_CONNECT_MAX_ATTEMPTS + 10) {
    _tryAutoConnectInFlight = false;
    return;
  }

  comSelect.value = target;
  restoreRememberedBaud();

  if (window._paramLoadActive || window._gcsConnState === "connected") return;

  try {
    if (localStorage.getItem("gcs.autoLoadParams") !== "0") {
      window._pendingParamRequest = true;
    }
  } catch (_) {
    window._pendingParamRequest = true;
  }

  const hint = getRememberedDeviceId() || comSelect.options[comSelect.selectedIndex]?.text || target;
  setConnectSerialHint(`正在自动重连 ${hint}…`);

  window._gcsAutoConnectActive = true;
  const runConnect = () => {
    if (window._gcsConnState === "connected" || window._gcsConnState === "connecting") {
      window._gcsAutoConnectActive = false;
      _tryAutoConnectInFlight = false;
      return;
    }
    if (typeof window.connect !== "function") {
      window._gcsAutoConnectActive = false;
      _tryAutoConnectInFlight = false;
      return;
    }
    Promise.resolve()
      .then(() => window.connect())
      .catch(() => {})
      .finally(() => {
        window._gcsAutoConnectActive = false;
        _tryAutoConnectInFlight = false;
        if (window._gcsConnState !== "connected") {
          noteAutoConnectFailure();
          if (window._gcsConnState === "connecting") {
            window._gcsConnState = "disconnected";
            if (typeof window.forceDisconnectAfterLinkLoss === "function") {
              window.forceDisconnectAfterLinkLoss("auto-connect failed").catch(() => {});
            } else {
              setConnectionUI("disconnected");
            }
          }
        }
      });
  };
  setTimeout(runConnect, window.__gcsRuntimeNative ? 120 : 220);
}

function scheduleAutoReconnectAfterRefresh() {
  if (!shouldAutoReconnectOnLoad()) return;

  let baseDelays = [0, 600, 1800, 4000, ...AUTO_CONNECT_LATE_RETRY_MS];

  baseDelays.forEach((ms) => {
    setTimeout(() => {
      if (window._gcsConnState === "connected" || window._gcsConnState === "connecting") return;
      refreshPorts({ probeBridge: ms > 0, forceBridgeProbe: ms >= 4000 })
        .then(() => tryAutoConnect())
        .catch(() => {});
    }, ms);
  });
}

async function refreshPorts(opts = {}) {
  let probeBridge = opts.probeBridge !== false;
  if (probeBridge && !opts.forceBridgeProbe && isBridgeBackoffActive()) {
    probeBridge = false;
  }
  const comSelect = document.getElementById("comPort");
  if (!comSelect) return;

  const canWebSerial = hasWebSerialApi();
  let ports = [];
  if (canWebSerial) {
    try { ports = await navigator.serial.getPorts(); } catch (_) { ports = []; }
  }
  const systemPorts = probeBridge
    ? await fetchSystemComPorts({
        forceProbe: !!opts.forceBridgeProbe,
        forceBridge: !!opts.forceBridgeProbe,
      })
    : (Array.isArray(window._lastFetchedSystemPorts) ? window._lastFetchedSystemPorts : []);

  const currentValue = comSelect.value;
  window._knownPorts = ports;
  window._systemComPorts = systemPorts;
  pruneStalePortStorage();
  window._comOptionMap = new Map();
  comSelect.innerHTML = "";

  if (systemPorts.length > 0) {
    const sortedPorts = sortSystemPortsForPicker(systemPorts);
    const vidPidCounts = new Map();
    sortedPorts.forEach((sp) => {
      if (typeof sp.usbVendorId === "number" && typeof sp.usbProductId === "number") {
        const key = `${sp.usbVendorId}:${sp.usbProductId}`;
        vidPidCounts.set(key, (vidPidCounts.get(key) || 0) + 1);
      }
    });
    sortedPorts.forEach((sp, i) => {
      const option = document.createElement("option");
      option.value = `sys:${sp.deviceId || i}`;
      const label = sp.deviceId || sp.name || "Unknown";
      const dupHint =
        typeof sp.usbVendorId === "number" &&
        typeof sp.usbProductId === "number" &&
        (vidPidCounts.get(`${sp.usbVendorId}:${sp.usbProductId}`) || 0) > 1
          ? " · 多接口"
          : "";
      const noise = isNoiseSerialPort(sp);
      const roleTag = noise ? "" : portRoleSuffix(sp);
      option.text = `${label} (${sp.name || "Unknown"}) [桥接]${dupHint}${roleTag}${noise ? " [非飞控]" : ""}`;
      if (noise) option.disabled = true;
      comSelect.appendChild(option);
      window._comOptionMap.set(option.value, { authIndex: -1, systemPort: sp });
    });

    const resolved = resolveRememberedPortValue(comSelect);
    if (resolved) {
      comSelect.value = resolved;
    } else if (currentValue && window._comOptionMap.has(currentValue)) {
      const curMeta = window._comOptionMap.get(currentValue);
      if (!curMeta?.systemPort || !isNoiseSerialPort(curMeta.systemPort)) {
        comSelect.value = currentValue;
      }
    }
    if (!comSelect.value || comSelect.value.startsWith("__")) {
      const preferred = pickPreferredPortValue(comSelect);
      if (preferred) comSelect.value = preferred;
    }

    appendPortPickerExtras(comSelect, canWebSerial);
    setConnectSerialHint("主飞控连接统一走 COM bridge；优先选择 [MAVLink]，DroneCAN 继续使用 [SLCAN]");
    const probed = window._systemComPorts.filter((p) => getPortProbeRole(p));
    if (probed.length && typeof window.log === "function") {
      const summary = probed
        .map((p) => {
          const short = String(p.deviceId || "").split("/").pop();
          const role = getPortProbeRole(p).toUpperCase();
          const conf = String(p.probeConfidence || "").trim();
          const detail = String(p.probeDetail || "").trim();
          const tag = conf && conf !== "n/a" ? `·${conf}` : "";
          const extra = detail ? ` (${detail})` : "";
          return `${short}→${role}${tag}${extra}`;
        })
        .join("，");
      window.log(`🔍 串口协议探测：${summary}`, "port-probe");
    }
    if (window._gcsConnState !== "connected" && window._gcsConnState !== "connecting") {
      tryAutoConnect().catch(() => {});
    }
    return;
  }

  if (ports.length === 0) {
    if (!canWebSerial) {
      const waitOpt = document.createElement("option");
      waitOpt.value = "";
      waitOpt.text = systemPorts.length ? "请选择 COM 口" : "等待 COM bridge（请先启动本地 bridge 服务）";
      waitOpt.disabled = true;
      comSelect.appendChild(waitOpt);
      appendPortPickerExtras(comSelect, false);
      comSelect.value = "__refresh_bridge__";
      setConnectSerialHint("主飞控连接统一走 COM bridge；请先确保 bridge 已启动，再选 [MAVLink] 口连接");
      return;
    }
    const waitOpt = document.createElement("option");
    waitOpt.value = "";
    waitOpt.text = "未发现可用 COM bridge 端口";
    waitOpt.disabled = true;
    comSelect.appendChild(waitOpt);
    appendPortPickerExtras(comSelect, canWebSerial);
    comSelect.value = "__refresh_bridge__";
    setConnectSerialHint("未发现 bridge 端口；请确认飞控已插入并且本地 COM bridge 正在运行");
    return;
  }

  appendPortPickerExtras(comSelect, canWebSerial);
  comSelect.value = "__refresh_bridge__";
  setConnectSerialHint("主飞控连接统一走 COM bridge；当前未识别到 bridge 端口，请刷新或检查 bridge");
  tryAutoConnect().catch(() => {});
}

function appendPortPickerExtras(comSelect, canWebSerial) {
  const refreshOpt = document.createElement("option");
  refreshOpt.value = "__refresh_bridge__";
  refreshOpt.text = "↻ 刷新 COM 列表";
  comSelect.appendChild(refreshOpt);
  if (canWebSerial) {
    const addOpt = document.createElement("option");
    addOpt.value = "__add__";
    addOpt.text = "＋ 添加/重新选择串口设备…";
    comSelect.appendChild(addOpt);
  }
}

async function requestAndRefreshPort() {
  if (!hasWebSerialApi()) {
    await refreshPorts({ probeBridge: true, forceBridgeProbe: true });
    return (window._systemComPorts || []).length > 0;
  }
  try {
    await navigator.serial.requestPort();
    await refreshPorts({ probeBridge: false });
    return true;
  } catch (e) {
    if (e && e.name === "NotFoundError") return false;
    throw e;
  }
}

async function requestAllPortsInteractive() {
  if (!hasWebSerialApi()) {
    await refreshPorts({ probeBridge: true });
    return (window._systemComPorts || []).length;
  }
  let added = 0;
  while (true) {
    try {
      await navigator.serial.requestPort();
      added += 1;
      await refreshPorts({ probeBridge: false });
      if (!window.confirm("已添加一个串口。是否继续添加下一个串口？")) break;
    } catch (e) {
      if (e && e.name === "NotFoundError") break;
      throw e;
    }
  }
  return added;
}

function initComPortAutoRefresh() {
  window._gcsPageLoadTs = Date.now();
  window._gcsJustReloaded = true;
  setTimeout(() => { window._gcsJustReloaded = false; }, 8000);

  initConnectionModeUi();

  if (document.getElementById("comPort")) {
    refreshPorts({ probeBridge: true, forceBridgeProbe: false }).catch(() => {});
  }

  window.addEventListener("load", () => {
    const startRefresh = async () => {
      if (window.__gcsRuntimeNative && typeof ensureComBridgeRunning === "function") {
        try {
          await ensureComBridgeRunning();
        } catch (_) { /* ignore */ }
      }
      try {
        await refreshPorts({ probeBridge: true, forceBridgeProbe: false });
        setTimeout(
          () => refreshPorts({ probeBridge: true, forceBridgeProbe: true }).catch(() => {}),
          2000,
        );
      } catch (_) { /* ignore */ }
      scheduleAutoReconnectAfterRefresh();
      tryAutoConnect().catch(() => {});
    };
    if (window.__gcsBootstrapPromise) {
      window.__gcsBootstrapPromise.finally(startRefresh);
    } else {
      startRefresh();
    }
    window._bridgeMode = "bridge";
    [800, 2000, 4000].forEach((ms) => {
      setTimeout(() => refreshPorts({ probeBridge: true }).catch(() => {}), ms);
    });
    if (typeof window.log === "function") {
      window.log("主飞控连接已统一为 COM bridge 模式；请选择 [MAVLink] 口，勿选蓝牙/调试口。", "info");
    }
  });

  if (!window._comBridgeFocusHooked) {
    window._comBridgeFocusHooked = true;
    window.addEventListener("focus", () => {
      const now = Date.now();
      if (window._comBridgeLastFocusProbe && now - window._comBridgeLastFocusProbe < 12000) return;
      window._comBridgeLastFocusProbe = now;
      if (!isBridgeBackoffActive()) {
        refreshPorts({ probeBridge: true }).catch(() => {});
      }
    });
  }

  if (navigator.serial && navigator.serial.addEventListener) {
    navigator.serial.addEventListener("connect", () => refreshPorts({ probeBridge: true }));
    navigator.serial.addEventListener("disconnect", () => {
      refreshPorts({ probeBridge: true });
      if (typeof window.forceDisconnectAfterLinkLoss === "function") {
        window.forceDisconnectAfterLinkLoss("navigator.serial disconnect").catch(() => {});
      }
    });
  }

  if (window._portAutoRefreshTimer) clearInterval(window._portAutoRefreshTimer);
  window._portAutoRefreshTimer = setInterval(() => {
    const probe = !window._comBridgeOnline && !isBridgeBackoffActive();
    refreshPorts({ probeBridge: probe }).catch(() => {});
  }, 8000);

  if (window._comBridgeSlowProbeTimer) clearInterval(window._comBridgeSlowProbeTimer);
  window._comBridgeSlowProbeTimer = setInterval(() => {
    if (isBridgeBackoffActive()) return;
    refreshPorts({ probeBridge: true, forceBridgeProbe: true }).catch(() => {});
  }, 90000);
}

window.ensureComBridgeRunning = ensureComBridgeRunning;
window.isBridgeBackoffActive = isBridgeBackoffActive;
window.fetchSystemComPorts = fetchSystemComPorts;
window.refreshPorts = refreshPorts;
window.requestAndRefreshPort = requestAndRefreshPort;
window.requestAllPortsInteractive = requestAllPortsInteractive;
window.initComPortAutoRefresh = initComPortAutoRefresh;
window.rememberSelectedPort = rememberSelectedPort;
window.markGcsSessionConnected = markGcsSessionConnected;
window.markGcsSessionDisconnected = markGcsSessionDisconnected;
window.tryAutoConnect = tryAutoConnect;
window.resetAutoConnectAttempts = resetAutoConnectAttempts;
window.canSilentAutoConnect = canSilentAutoConnect;

window.initSerialAutoRefresh = initComPortAutoRefresh;
initComPortAutoRefresh();
