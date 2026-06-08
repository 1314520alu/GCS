function crc_accumulate(byte, crc){
  let tmp = byte ^ (crc & 0xff);
  tmp ^= (tmp << 4) & 0xff;
  return (((crc >> 8) ^ (tmp << 8) ^ (tmp << 3) ^ (tmp >> 4)) & 0xffff);
}

function crc_calculate(buffer){
  let crc = 0xffff;
  for(let b of buffer) crc = crc_accumulate(b, crc);
  return crc;
}

// MAVLINK_CRC_ARDUPILOT 未收录消息的 CRC_EXTRA 补充（勿写与 AP 方言冲突的 common 值，如 137:0）
const CRC_EXTRA = {
  295:234,
  11030:144, 11031:133, 11032:85, 11033:195, 11039:142
};

function getCrcExtra(msgid) {
  const ap = window.MAVLINK_CRC_ARDUPILOT;
  if (ap && ap[msgid] != null) {
    return ap[msgid];
  }
  if (CRC_EXTRA[msgid] != null) {
    return CRC_EXTRA[msgid];
  }
  return 0;
}

window.getMavlinkCrcExtra = getCrcExtra;

function trackGcsRxMsg(msgid, ver) {
  if (!window._gcsMissionDebug) {
    return;
  }
  const s = window._gcsRxStats || (window._gcsRxStats = { v1: 0, v2: 0, byId: {}, crcFail: 0 });
  if (ver === 1) {
    s.v1 += 1;
  } else {
    s.v2 += 1;
  }
  s.byId[msgid] = (s.byId[msgid] || 0) + 1;
}

const ESC_TELEMETRY_MSG_IDS = new Set([11030, 11031, 11032, 11033]);
const LOCAL_TELEMETRY_STATE = {
  navGuidance: {},
  home: {}
};

function normalizeHeadingDegrees(deg) {
  if (!Number.isFinite(deg)) return null;
  return ((deg % 360) + 360) % 360;
}

function getNavGuidanceState() {
  try {
    window.telemetry = window.telemetry || {};
    window.telemetry.navGuidance = window.telemetry.navGuidance || LOCAL_TELEMETRY_STATE.navGuidance;
    window.navGuidance = window.telemetry.navGuidance;
    return window.navGuidance || LOCAL_TELEMETRY_STATE.navGuidance;
  } catch (_) {
    return LOCAL_TELEMETRY_STATE.navGuidance;
  }
}

function getHomeState() {
  try {
    window.telemetry = window.telemetry || {};
    window.telemetry.home = window.telemetry.home || LOCAL_TELEMETRY_STATE.home;
    window.homeState = window.telemetry.home;
    return window.homeState || LOCAL_TELEMETRY_STATE.home;
  } catch (_) {
    return LOCAL_TELEMETRY_STATE.home;
  }
}

function ensureGpsTelemetryState() {
  const root = window.gpsTelemetry || {};
  if (!Array.isArray(root.instances) || root.instances.length < 2) {
    root.instances = [
      { index: 0, label: "GPS1" },
      { index: 1, label: "GPS2" },
    ];
  }
  root.instances = root.instances.map((item, index) => ({
    index,
    label: index === 0 ? "GPS1" : "GPS2",
    rawMsgId: index === 0 ? 24 : 124,
    fixType: 0,
    satellitesVisible: 0,
    lat: null,
    lon: null,
    altM: null,
    eph: null,
    epv: null,
    velMps: null,
    cogDeg: null,
    hAccM: null,
    vAccM: null,
    velAccMps: null,
    yawDeg: null,
    lastUpdateMs: 0,
    ...item,
  }));
  root.rtk = {
    source: "none",
    injectStatus: "idle",
    health: "offline",
    lastCorrectionMs: 0,
    ageSec: null,
    latencyMs: null,
    boundInstance: 0,
    ...(root.rtk || {}),
  };
  window.gpsTelemetry = root;
  return root;
}

function refreshNavGuidanceValidity() {
  const nav = getNavGuidanceState();
  const gpsFix = Number(window.gps_fix_type) || 0;
  const latValid = Number.isFinite(window.lat) && Math.abs(window.lat) <= 90;
  const lonValid = Number.isFinite(window.lon) && Math.abs(window.lon) <= 180;
  const gpsFresh = Date.now() - Math.max(window._lastGpsRawMs || 0, window._lastGposMs || 0) < 4000;
  nav.gpsValid = gpsFix >= 2 && latValid && lonValid && gpsFresh;
}

function dispatchCompatEvent(target, name, detail) {
  if (!target || typeof target.dispatchEvent !== "function") return;
  try {
    if (typeof CustomEvent === "function") {
      target.dispatchEvent(new CustomEvent(name, { detail: detail || null }));
      return;
    }
  } catch (_) {
    /* fall through */
  }
  try {
    if (document && typeof document.createEvent === "function") {
      const evt = document.createEvent("Event");
      evt.initEvent(name, false, false);
      evt.detail = detail || null;
      target.dispatchEvent(evt);
    }
  } catch (_) {
    /* ignore */
  }
}

function emitTelemetryFrame() {
  try {
    const nav = getNavGuidanceState();
    dispatchCompatEvent(document, "gcs:telemetry-frame", {
      yawRad: Number.isFinite(window.yaw) ? window.yaw : null,
      lat: Number.isFinite(window.lat) ? window.lat : null,
      lon: Number.isFinite(window.lon) ? window.lon : null,
      altitude: Number.isFinite(window.altitude) ? window.altitude : null,
      gpsFixType: Number(window.gps_fix_type) || 0,
      lastGposMs: Number(window._lastGposMs) || 0,
      lastGpsRawMs: Number(window._lastGpsRawMs) || 0,
      navGuidance: {
        headingDeg: Number.isFinite(nav.headingDeg) ? nav.headingDeg : null,
        groundTrackDeg: Number.isFinite(nav.groundTrackDeg) ? nav.groundTrackDeg : null,
        desiredHeadingDeg: Number.isFinite(nav.desiredHeadingDeg) ? nav.desiredHeadingDeg : null,
        waypointBearingDeg: Number.isFinite(nav.waypointBearingDeg) ? nav.waypointBearingDeg : null,
        xtrackErrorM: Number.isFinite(nav.xtrackErrorM) ? nav.xtrackErrorM : null,
        turnRateDegS: Number.isFinite(nav.turnRateDegS) ? nav.turnRateDegS : null,
        gpsValid: nav.gpsValid === true
      }
    });
  } catch (_) {
    /* ignore */
  }
}

function setHomeState(lat, lng, altMeters, source) {
  const home = getHomeState();
  home.lat = Number(lat);
  home.lng = Number(lng);
  home.alt = Number(altMeters);
  home.valid =
    Number.isFinite(home.lat) &&
    Number.isFinite(home.lng) &&
    Math.abs(home.lat) <= 90 &&
    Math.abs(home.lng) <= 180 &&
    !(home.lat === 0 && home.lng === 0);
  home.source = source || home.source || "telemetry";
}

/** MAVLink 负载可能是父缓冲区的子视图，必须用 byteOffset，否则 HEARTBEAT 等会读错内存 */
function mavlinkPayloadView(payload) {
  const u8 = payload instanceof Uint8Array ? payload : new Uint8Array(payload);
  return new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
}

/** MAG_CAL_REPORT 载荷解析（兼容基础 44B 与 ArduPilot 扩展长度） */
function parseMagCalReportPayload(payload) {
  if (!payload || payload.length < 44) return null;
  const dv = mavlinkPayloadView(payload);
  const fitness = dv.getFloat32(0, true);
  const readMeta = (off) => {
    if (off + 3 >= payload.length) return null;
    return {
      compass_id: dv.getUint8(off),
      cal_mask: dv.getUint8(off + 1),
      cal_status: dv.getUint8(off + 2),
      autosaved: dv.getUint8(off + 3),
    };
  };
  const isTerminal = (s) => s >= 4 && s <= 7;
  const offsets = new Set([40]);
  if (payload.length >= 48) offsets.add(48);
  if (payload.length >= 6) offsets.add(payload.length - 6);
  let fallback = null;
  for (const off of offsets) {
    const meta = readMeta(off);
    if (!meta) continue;
    if (!fallback) fallback = meta;
    if (isTerminal(meta.cal_status)) {
      return { fitness, ...meta };
    }
  }
  return fallback ? { fitness, ...fallback } : null;
}

window.parseMagCalReportPayload = parseMagCalReportPayload;

/** 单次 parse 最多解多少帧，剩余交给 microtask，避免 PARAM 洪峰等长时间占满主线程 */
const PARSE_MAX_FRAMES_PER_SLICE = 160;
const PARSE_MAX_FRAMES_PARAM_LOAD = 320;
const PARSE_MAX_RESYNC_BYTES = 8192;

function shouldSuppressCrcWarn(now) {
  if (window._mavlinkCrcSuppressProbe) {
    return true;
  }
  const sessionStart = window._mavlinkCrcSessionStartMs;
  if (!sessionStart) return false;
  if (window._mavlinkCrcGraceUntil && now < window._mavlinkCrcGraceUntil) {
    return true;
  }
  const synced =
    window._lastMavlinkRxMs && window._lastMavlinkRxMs >= sessionStart;
  return !synced;
}

function logCrcOnce(msgid) {
  const now = Date.now();
  const diag = window._crcDiag || {
    count: 0,
    sampleIds: [],
    firstSeenMs: 0,
    lastLogMs: 0
  };
  if (!diag.firstSeenMs || now - diag.firstSeenMs > 5000) {
    diag.count = 0;
    diag.sampleIds = [];
    diag.firstSeenMs = now;
  }
  diag.count += 1;
  if (
    Number.isFinite(msgid) &&
    msgid >= 0 &&
    msgid < 10000 &&
    diag.sampleIds.indexOf(msgid) === -1 &&
    diag.sampleIds.length < 4
  ) {
    diag.sampleIds.push(msgid);
  }
  if (diag.count >= 4 && now - diag.lastLogMs > 5000) {
    if (shouldSuppressCrcWarn(now)) {
      diag.count = 0;
      diag.sampleIds = [];
      diag.firstSeenMs = now;
      window._crcDiag = diag;
      return;
    }
    const sampleText = diag.sampleIds.length
      ? "，样本 msg=" + diag.sampleIds.join(",")
      : "";
    console.warn(
      "检测到串口 CRC 错误，已自动重同步" +
        sampleText +
        "。常见原因：波特率不匹配、线缆/USB 干扰。"
    );
    diag.count = 0;
    diag.sampleIds = [];
    diag.firstSeenMs = now;
    diag.lastLogMs = now;
  }
  window._crcDiag = diag;
}

function logMissionRx(msgid) {
  if (
    window._missionUploadActive &&
    (msgid === 40 || msgid === 51 || msgid === 47) &&
    typeof log === "function"
  ) {
    log("📡 RX mission msg=" + msgid, "mission_rx_" + msgid);
  }
  if (
    window._gcsMissionDebug &&
    (msgid === 40 || msgid === 51 || msgid === 47)
  ) {
    console.log("[gcsMissionDebug] RX mission msg=" + msgid);
  }
}

function parse(parseDepth) {
  const depth = typeof parseDepth === "number" ? parseDepth : 0;
  if (depth > 24) return;

  let frames = 0;
  let resync = 0;
  const rxBuf = window.buf;
  if (!rxBuf || !rxBuf.length) return;

  const frameBudget = window._paramLoadActive ? PARSE_MAX_FRAMES_PARAM_LOAD : PARSE_MAX_FRAMES_PER_SLICE;
  while (rxBuf.length > 6 && frames < frameBudget) {
    if (rxBuf[0] === 0xfe) {
      const len = rxBuf[1];
      const full = 6 + len + 2;
      if (rxBuf.length < full) {
        return;
      }
      const pkt = rxBuf.slice(0, full);
      const msgid = pkt[5];
      let crc = crc_calculate(pkt.slice(1, 6 + len));
      crc = crc_accumulate(getCrcExtra(msgid), crc);
      const rx = pkt[6 + len] | (pkt[7 + len] << 8);
      if (crc !== rx) {
        window._mavlinkCrcErrors = (window._mavlinkCrcErrors || 0) + 1;
        if (window._gcsMissionDebug) {
          const s =
            window._gcsRxStats ||
            (window._gcsRxStats = { v1: 0, v2: 0, byId: {}, crcFail: 0 });
          s.crcFail += 1;
        }
        logCrcOnce(msgid);
        rxBuf.shift();
        if (++resync > PARSE_MAX_RESYNC_BYTES) {
          rxBuf.length = 0;
          return;
        }
        continue;
      }
      rxBuf.splice(0, full);
      frames++;
      window._lastMavlinkRxMs = Date.now();
      trackGcsRxMsg(msgid, 1);
      logMissionRx(msgid);
      try {
        handle(msgid, pkt.slice(6, 6 + len), pkt[3], pkt[4]);
      } catch (e) {
        console.error(`MAVLink handle 异常 msgid=${msgid}`, e);
      }
      continue;
    }

    if (rxBuf[0] !== 0xfd) {
      rxBuf.shift();
      if (++resync > PARSE_MAX_RESYNC_BYTES) {
        rxBuf.length = 0;
        return;
      }
      continue;
    }

    const len = rxBuf[1];
    const incompat = rxBuf[2];
    const signed = (incompat & 0x01) !== 0;
    const full = 10 + len + 2 + (signed ? 13 : 0);
    if (rxBuf.length < full) {
      return;
    }

    const pkt = rxBuf.slice(0, full);
    const msgid = pkt[7] | (pkt[8] << 8) | (pkt[9] << 16);

    let crc = crc_calculate(pkt.slice(1, 10 + len));
    crc = crc_accumulate(getCrcExtra(msgid), crc);

    const rx = pkt[10 + len] | (pkt[11 + len] << 8);

    if (crc !== rx) {
      window._mavlinkCrcErrors = (window._mavlinkCrcErrors || 0) + 1;
      if (window._gcsMissionDebug) {
        const s =
          window._gcsRxStats ||
          (window._gcsRxStats = { v1: 0, v2: 0, byId: {}, crcFail: 0 });
        s.crcFail += 1;
      }
      logCrcOnce(msgid);
      rxBuf.shift();
      if (++resync > PARSE_MAX_RESYNC_BYTES) {
        rxBuf.length = 0;
        return;
      }
      continue;
    }

    rxBuf.splice(0, full);
    frames++;

    window._lastMavlinkRxMs = Date.now();
    trackGcsRxMsg(msgid, 2);
    logMissionRx(msgid);

    try {
      handle(msgid, pkt.slice(10, 10 + len), pkt[5], pkt[6]);
    } catch (e) {
      console.error(`MAVLink handle 异常 msgid=${msgid}`, e);
    }
  }

  if (rxBuf.length > 10) {
    queueMicrotask(() => {
      try {
        parse(depth + 1);
      } catch (e) {
        console.error("parse microtask", e);
      }
    });
  }
}

function handle(id, payload, sys, comp){
if(id === 0){ // HEARTBEAT — 本项目约定线序（与 MAVLink common.xml 标准字段顺序不同）：0~3 custom_mode LE, 4 type, 5 autopilot, 6 base_mode, 7 system_status, 8 mavlink_version
    if (payload.length < 9) return;
    const dv = mavlinkPayloadView(payload);
    const custom_mode = dv.getUint32(0, true);
    const base_mode = dv.getUint8(6);
    const mavType = dv.getUint8(4);
    window.fcMavType = mavType;

    if (sys > 0 && mavType !== 6) {
      window.fcSysid = sys;
      // comp=0 为合法 MAVLink 组件 ID（部分 ArduPilot 固件任务协议走 comp 0）
      if (typeof comp === "number" && comp >= 0 && comp <= 255) {
        window.fcCompid = comp;
      }
      window.sysid = window.fcSysid;
      window.compid = window.fcCompid;
    }

    window.flight_mode = getFlightModeString(custom_mode);
    window.armed = (base_mode & 0x80) !== 0;

    try {
      document.dispatchEvent(new CustomEvent("gcs-heartbeat", {
        detail: { mavType, custom_mode, base_mode, armed: window.armed },
      }));
    } catch (_) { /* ignore */ }

    const hbSig = `${custom_mode}|${base_mode}|${window.armed ? 1 : 0}`;
    if (window._lastHbUiSig !== hbSig) {
      window._lastHbUiSig = hbSig;
      log(`HEARTBEAT → 模式: ${window.flight_mode} (custom_mode=${custom_mode}) ${window.armed ? '✅ 已解锁' : '🔒 未解锁'}`);
    }
}
  if(id === 1){ // SYS_STATUS
    let dv = mavlinkPayloadView(payload);
    if (payload.length >= 12) {
      window._sysStatusSensors = {
        present: dv.getUint32(0, true),
        enabled: dv.getUint32(4, true),
        health: dv.getUint32(8, true),
        t: Date.now(),
      };
    }
    const newBat = dv.getUint16(14, true) / 1000;
    // 仅在电压较大变化时记录日志（阈值 0.1V），并且同一类日志至少间隔 5 秒
    const prevBat = (window._lastValues && typeof window._lastValues.battery_voltage === 'number') ? window._lastValues.battery_voltage : null;
    const lastLoggedTs = (window._lastValues && window._lastValues.battery_last_log_ts) ? window._lastValues.battery_last_log_ts : 0;
    const now = Date.now();
    window.battery_voltage = newBat;
    window._lastValues.battery_voltage = newBat;
    const valChanged = (prevBat === null) || (Math.abs(newBat - prevBat) >= 0.1);
    const timePassed = (now - lastLoggedTs) >= 5000;
    if (valChanged || timePassed) {
      log(`电池电压更新: ${newBat.toFixed(2)}V`, 'battery');
      window._lastValues.battery_last_log_ts = now;
    }
  }

  if (id === 22 && !window._missionUploadActive) {
    parseParam(payload);
  }

  if ((id === 24 || id === 124) && payload.length >= 29) {
    // GPS_RAW_INT / GPS2_RAW_INT — fix_type @28, satellites_visible @29（非 @4）
    const dv = mavlinkPayloadView(payload);
    const gpsState = ensureGpsTelemetryState();
    const gpsIndex = id === 124 ? 1 : 0;
    const inst = gpsState.instances[gpsIndex];
    const newFix = dv.getUint8(28);
    const prevFix = Number(window.gps_fix_type) || 0;
    window.gps_fix_type = Math.max(prevFix, newFix);
    inst.fixType = newFix;
    if (payload.length >= 30) {
      const newSats = dv.getUint8(29);
      const prevSats = Number(window.gps_satellites_visible) || 0;
      window.gps_satellites_visible = Math.max(prevSats, newSats);
      inst.satellitesVisible = newSats;
    }
    if (payload.length >= 24) {
      inst.lat = dv.getInt32(8, true) / 1e7;
      inst.lon = dv.getInt32(12, true) / 1e7;
      inst.altM = dv.getInt32(16, true) / 1000;
      inst.eph = dv.getUint16(20, true) / 100;
      inst.epv = dv.getUint16(22, true) / 100;
    }
    if (payload.length >= 26) {
      inst.velMps = dv.getUint16(24, true) / 100;
    }
    if (payload.length >= 28) {
      const cog = dv.getUint16(26, true);
      inst.cogDeg = cog === 65535 ? null : cog / 100;
    }
    inst.lastUpdateMs = Date.now();
    window._lastGpsRawMs = Date.now();
    refreshNavGuidanceValidity();
    emitTelemetryFrame();
  }

  if(id === 30){ // ATTITUDE
    let dv = mavlinkPayloadView(payload);
    window.roll = dv.getFloat32(4,true);
    window.pitch = dv.getFloat32(8,true);
    window.yaw = dv.getFloat32(12,true);
    const nav = getNavGuidanceState();
    nav.headingDeg = normalizeHeadingDegrees(window.yaw * 180 / Math.PI);
    emitTelemetryFrame();
  }

  if (id === 33 && payload.length >= 20) {
    const dv = mavlinkPayloadView(payload);
    window.lat = dv.getInt32(4, true) / 1e7;
    window.lon = dv.getInt32(8, true) / 1e7;
    window.altitude = dv.getInt32(16, true) / 1000;
    if (payload.length >= 28) {
      const cogCdeg = dv.getUint16(26, true);
      const nav = getNavGuidanceState();
      nav.groundTrackDeg = cogCdeg === 65535 ? null : normalizeHeadingDegrees(cogCdeg / 100);
    }
    window._lastGposMs = Date.now();
    refreshNavGuidanceValidity();
    if (window.updateMap) {
      window.updateMap(window.lat, window.lon);
    }
    emitTelemetryFrame();
  }

  if (id === 49 && payload.length >= 12) { // GPS_GLOBAL_ORIGIN
    const dv = mavlinkPayloadView(payload);
    setHomeState(
      dv.getInt32(0, true) / 1e7,
      dv.getInt32(4, true) / 1e7,
      dv.getInt32(8, true) / 1000,
      "gps_global_origin"
    );
  }

  if (id === 242 && payload.length >= 52) { // HOME_POSITION
    const dv = mavlinkPayloadView(payload);
    setHomeState(
      dv.getInt32(0, true) / 1e7,
      dv.getInt32(4, true) / 1e7,
      dv.getInt32(8, true) / 1000,
      "home_position"
    );
  }

  if(id === 74){ // VFR_HUD
    let dv = mavlinkPayloadView(payload);
    window.airspeed = dv.getFloat32(0, true);
    window.groundspeed = dv.getFloat32(4, true);
    window.climb_rate = dv.getFloat32(12, true);
  }

  if(id === 42){ // MISSION_CURRENT
    let dv = mavlinkPayloadView(payload);
    // seq: uint16 at offset 0
    window.wp_current = dv.getUint16(0, true);
  }

  if (id === 62 && payload.length >= 26) { // NAV_CONTROLLER_OUTPUT
    // Layout: nav_roll(f32@0), nav_pitch(f32@4), nav_bearing(i16 cdeg@8), target_bearing(i16 cdeg@10),
    // wp_dist(u16@12), alt_error(f32@14), aspd_error(f32@18), xtrack_error(f32@22)
    const dv = mavlinkPayloadView(payload);
    const nav = getNavGuidanceState();
    const navBearCdeg = dv.getInt16(8, true);
    nav.desiredHeadingDeg = Number.isFinite(navBearCdeg) ? normalizeHeadingDegrees(navBearCdeg / 100) : null;
    const tgtBearCdeg = dv.getInt16(10, true);
    nav.waypointBearingDeg = Number.isFinite(tgtBearCdeg) ? normalizeHeadingDegrees(tgtBearCdeg / 100) : null;
    nav.xtrackErrorM = dv.getFloat32(22, true);
    emitTelemetryFrame();
  }

  if (id === 44 && payload.length >= 4) {
    const dv = mavlinkPayloadView(payload);
    const count = dv.getUint16(0, true);
    if (window._missionTransfer && window._missionTransfer.mode === "download") {
      window._missionTransfer.count = count;
    }
  }

  if ((id === 40 || id === 51) && window._missionTransfer && window._missionTransfer.mode === "upload") {
    const MP = window.MavlinkMissionPack;
    const req = MP ? MP.parseMissionRequest(payload, id === 51) : null;
    if (req) {
      const seq = req.seq;
      const transfer = window._missionTransfer;
      if (seq < (transfer.count || 65535)) {
        transfer.requestedSeq = seq;
        transfer.requestMsgId = id;
        if (
          typeof log === "function" &&
          !window._missionUploadActive &&
          (window._MAVLINK_DEBUG_TX || window._gcsMissionDebug)
        ) {
          log("📥 飞控请求航点 " + seq + " (msg " + id + ")", "mission_req_" + seq);
        }
        if (window._MAVLINK_DEBUG_TX || window._gcsMissionDebug) {
          console.log("[MAVLink] MISSION_REQUEST seq=" + seq + " msg=" + id);
        }
      }
    }
  }

  if (
    (id === 73 || id === 39) &&
    window._missionTransfer &&
    window._missionTransfer.mode === "download"
  ) {
    let item = null;
    if (id === 73 && window.MavlinkMission && window.MavlinkMission.parseMissionItemInt) {
      item = window.MavlinkMission.parseMissionItemInt(
        payload instanceof Uint8Array ? payload : new Uint8Array(payload)
      );
    } else if (id === 39 && window.MavlinkMission && window.MavlinkMission.parseMissionItem) {
      item = window.MavlinkMission.parseMissionItem(
        payload instanceof Uint8Array ? payload : new Uint8Array(payload)
      );
    }
    if (item) {
      if (!window._missionTransfer.items) {
        window._missionTransfer.items = [];
      }
      window._missionTransfer.items[item.seq] = item;
    }
  }

  if (id === 47 && window._missionTransfer && window._missionTransfer.mode === "download") {
    const MP = window.MavlinkMissionPack;
    const ack = MP ? MP.parseMissionAck(payload) : null;
    if (!ack) {
      return;
    }
    if (ack.type !== 0) {
      const msg =
        window.MavlinkMission && window.MavlinkMission.missionAckMessage
          ? window.MavlinkMission.missionAckMessage(ack.type)
          : "MISSION_ACK type=" + ack.type;
      window._missionTransfer.error = msg;
      return;
    }
    window._missionTransfer.ack = true;
  }

  if (id === 47 && window._missionTransfer && window._missionTransfer.mode === "upload") {
    const MP = window.MavlinkMissionPack;
    const ack = MP ? MP.parseMissionAck(payload) : null;
    if (!ack) {
      return;
    }
    const result = ack.type;
    const transfer = window._missionTransfer;
    if (!transfer) {
      return;
    }
    if (window._gcsMissionDebug) {
      console.log("[gcsMissionDebug] MISSION_ACK type=" + result);
    }
    if (result !== 0) {
      const msg =
        window.MavlinkMission && window.MavlinkMission.missionAckMessage
          ? window.MavlinkMission.missionAckMessage(result)
          : "MISSION_ACK type=" + result;
      transfer.error = msg;
      return;
    }
    if (transfer.expectFinalAck) {
      transfer.ack = true;
    }
  }

  if(id === 65){ // RC_CHANNELS (MAVLink2 wire: time_boot_ms + chan1..18 + chancount + rssi)
    let dv = mavlinkPayloadView(payload);
    window.rcChannels = window.rcChannels || Array.from({ length: 16 }, () => 1500);
    for (let i = 0; i < 16; i++) {
      const offset = 4 + i * 2;
      if (offset + 1 >= payload.length) break;
      const v = dv.getUint16(offset, true);
      if (v > 0 && v < 65535) window.rcChannels[i] = v;
    }
    window.rcChannelsUpdatedAt = Date.now();
    if (payload.length > 40) window.rcChannelCount = dv.getUint8(40);
    if (payload.length > 41) window.rcRssi = dv.getUint8(41);
  }

  if (id === 133 && window.TerrainMavlink && window.TerrainMavlink.handleTerrainRequest) {
    window.TerrainMavlink.handleTerrainRequest(payload, sys, comp);
  }

  if (id === 147) { // BATTERY_STATUS
    parseBatteryStatus(payload);
  }

  if (ESC_TELEMETRY_MSG_IDS.has(id)) {
    parseEscTelemetryGroup(id, payload);
  }

  if (id === 253) {
    parseStatustext(payload, sys, comp);
  }

  if (id === 148) {
    parseAutopilotVersion(payload, sys, comp);
  }

  if (id === 193) {
    parseEkfStatusReport(payload);
  }

  // DISTANCE_SENSOR：current_distance 在 offset 8（cm），用于概览测距
  if (id === 132 && payload.length >= 12) {
    const dv = mavlinkPayloadView(payload);
    window._rangefinderTelemetry = {
      currentCm: dv.getUint16(8, true),
      sensorId: dv.getUint8(11),
      t: Date.now(),
    };
  }

  // OBSTACLE_DISTANCE (330)：邻近/雷达障碍物距离数组 → 雷达页实时视图
  if (id === 330 && payload.length >= 153) {
    const dv = mavlinkPayloadView(payload);
    const increment = dv.getFloat32(153, true);
    const inc = Number.isFinite(increment) && increment > 0 ? increment : 5;
    const angleOffset = payload.length >= 169 ? dv.getFloat32(165, true) : 0;
    const obstacles = [];
    for (let i = 0; i < 72; i += 1) {
      const offset = 9 + i * 2;
      if (offset + 1 >= payload.length) break;
      const cm = dv.getUint16(offset, true);
      if (cm === 65535 || cm === 0) continue;
      obstacles.push({
        id: i + 1,
        distance: cm / 100,
        angle: angleOffset + i * inc,
        velocity: 0,
        type: "Proximity",
        status: "Active",
      });
    }
    window.radarTelemetry = {
      obstacles,
      lastUpdateMs: Date.now(),
    };
  }

  // HIGHRES_IMU: time_usec(8) + xacc,yacc,zacc(float) — 加速度 m/s²，换算为 g
  if (id === 105 && payload.length >= 20) {
    const dv = mavlinkPayloadView(payload);
    const gx = dv.getFloat32(8, true) / 9.80665;
    const gy = dv.getFloat32(12, true) / 9.80665;
    const gz = dv.getFloat32(16, true) / 9.80665;
    window.highresImuG = { x: gx, y: gy, z: gz, t: Date.now() };
    window._imuStreamMs = window._imuStreamMs || {};
    window._imuStreamMs.highres = Date.now();
  }

  // SCALED_IMU / SCALED_IMU2 / SCALED_IMU3：布局相同，time_boot_ms(4) + xacc,yacc,zacc int16 mG
  if ((id === 110 || id === 116 || id === 129) && payload.length >= 10) {
    const dv = mavlinkPayloadView(payload);
    const gx = dv.getInt16(4, true) / 1000;
    const gy = dv.getInt16(6, true) / 1000;
    const gz = dv.getInt16(8, true) / 1000;
    window.scaledImuG = { x: gx, y: gy, z: gz, t: Date.now() };
    window._imuStreamMs = window._imuStreamMs || {};
    window._imuStreamMs[id] = Date.now();
  }

  // COMMAND_ACK: command(uint16) + result(uint8) + …
  if (id === 77 && payload.length >= 3) {
    const dv = mavlinkPayloadView(payload);
    const command = dv.getUint16(0, true);
    const result = dv.getUint8(2);
    const MAV_RESULT_NAMES = [
      "ACCEPTED",
      "TEMPORARILY_REJECTED",
      "DENIED",
      "UNSUPPORTED",
      "FAILED",
      "IN_PROGRESS",
      "CANCELLED",
    ];
    const rn = MAV_RESULT_NAMES[result] || `UNKNOWN(${result})`;
    const MAV_CMD_PREFLIGHT_CALIBRATION = 241;
    const MAV_CMD_ACCELCAL_VEHICLE_POS = 42429;
    const MAV_CMD_CAN_FORWARD = 32000;

    if (command === MAV_CMD_CAN_FORWARD) {
      window._lastCanForwardAck = { result, resultName: rn, ts: Date.now() };
    }
    window._lastCommandAck = { command, result, resultName: rn, ts: Date.now() };

    try {
      if (typeof log === "function") {
        log(`COMMAND_ACK → cmd=${command} result=${result} (${rn})`, `mavlink_ack_${command}_${result}`);
      }
    } catch (e) {
      /* ignore */
    }

    // 校准相关：中文摘要，便于判断飞控是否已确认指令、是否已进入标定流程
    try {
      if (typeof log === "function") {
        if (command === MAV_CMD_PREFLIGHT_CALIBRATION) {
          if (result === 0) {
            log(
              "【校准确认】已收到飞控 COMMAND_ACK：MAV_CMD_PREFLIGHT_CALIBRATION → ACCEPTED。飞控已接受指令，可视为已开始/允许进入预校准（含陀螺仪等前置步骤）。",
              `cal_preflight_ack_ok_${result}`,
            );
          } else if (result === 5) {
            log(
              "【校准确认】已收到飞控 COMMAND_ACK：MAV_CMD_PREFLIGHT_CALIBRATION → IN_PROGRESS。飞控已收妥指令并正在执行标定（例如陀螺仪静止阶段），请保持机体静止并观察板载灯。",
              `cal_preflight_ack_ok_${result}`,
            );
          } else {
            log(
              `【校准确认】已收到飞控 COMMAND_ACK：MAV_CMD_PREFLIGHT_CALIBRATION → ${rn}。飞控未接受该预校准指令，未进入正常标定流程；请检查是否已解锁、是否忙线或固件是否支持。`,
              `cal_preflight_ack_bad_${result}`,
            );
          }
        } else if (command === MAV_CMD_ACCELCAL_VEHICLE_POS) {
          if (result !== 0 && result !== 5) {
            log(
              `【校准确认】已收到飞控 COMMAND_ACK：MAV_CMD_ACCELCAL_VEHICLE_POS → ${rn}。六面位姿步骤未被飞控正常接受。`,
              `cal_accelpos_ack_bad_${result}`,
            );
          }
        }
      }
    } catch (e) {
      /* ignore */
    }

    try {
      // 必须在 window 上派发：CustomEvent 默认不冒泡，document.dispatchEvent 不会触发 window.addEventListener
      window.dispatchEvent(new CustomEvent("gcs-command-ack", { detail: { command, result, resultName: rn } }));
    } catch (e) { /* ignore */ }
  }

  // MAG_CAL_PROGRESS — MAVLink v2 wire-reorder（largest-first）布局：
  //   0..3   direction_x (float)
  //   4..7   direction_y (float)
  //   8..11  direction_z (float)
  //   12     compass_id (uint8)
  //   13     cal_mask
  //   14     cal_status
  //   15     attempt
  //   16     completion_pct  ← 真实进度字段
  //   17..26 completion_mask[10]
  if (id === 191 && payload.length >= 17) {
    const dv = mavlinkPayloadView(payload);
    const direction_x = dv.getFloat32(0, true);
    const direction_y = dv.getFloat32(4, true);
    const direction_z = dv.getFloat32(8, true);
    const compass_id = dv.getUint8(12);
    const cal_mask = dv.getUint8(13);
    const cal_status = dv.getUint8(14);
    const attempt = dv.getUint8(15);
    const completion_pct = dv.getUint8(16);
    const completion_mask = [];
    if (payload.length >= 27) {
      for (let i = 0; i < 10; i += 1) {
        completion_mask.push(dv.getUint8(17 + i));
      }
    }
    try {
      const detail = {
        compass_id,
        cal_mask,
        cal_status,
        attempt,
        completion_pct,
        completion_mask,
        direction_x,
        direction_y,
        direction_z
      };
      document.dispatchEvent(new CustomEvent("gcs-mag-cal-progress", { detail }));
      window.dispatchEvent(new CustomEvent("gcs-mag-cal-progress", { detail }));
    } catch (e) { /* ignore */ }
  }

  // MAG_CAL_REPORT — 44B 基础版；≥54B 为 ArduPilot 扩展（末尾 6×uint8）
  if (id === 192 && payload.length >= 44) {
    const parsed = parseMagCalReportPayload(payload);
    if (parsed) {
      try {
        const detail = parsed;
        document.dispatchEvent(new CustomEvent("gcs-mag-cal-report", { detail }));
        window.dispatchEvent(new CustomEvent("gcs-mag-cal-report", { detail }));
      } catch (e) { /* ignore */ }
    }
  }

  // CAN_FRAME (#386) — DroneCAN 经飞控 MAVLink 转发
  if (id === 386 && payload.length >= 14) {
    const dv = mavlinkPayloadView(payload);
    const frameId = dv.getUint32(8, true);
    const bus = dv.getUint8(12);
    const dlen = Math.min(64, dv.getUint8(13));
    const data = new Uint8Array(dlen);
    for (let i = 0; i < dlen; i += 1) {
      data[i] = payload[14 + i] & 0xff;
    }
    const source = `MAVLink CAN${(Number(bus) || 0) + 1}`;
    window._mavlinkCanFrameRxCount = (Number(window._mavlinkCanFrameRxCount) || 0) + 1;
    window._lastCanFrameRxAt = Date.now();
    try {
      if (typeof window.feedMavlinkCanFrameIfActive === "function") {
        window.feedMavlinkCanFrameIfActive(frameId, dlen, data, bus, source);
      }
    } catch (_) { /* ignore */ }
  }

  // 每次解析完消息后，同步重要变量到统一的 window.telemetry
  try{ if(typeof window.syncToTelemetry === 'function') window.syncToTelemetry(); }catch(e){console.warn('syncToTelemetry error',e)}
  try { if (typeof window.scheduleUIUpdate === "function") window.scheduleUIUpdate(); } catch (e) { /* ignore */ }
}

function parseStatustext(payload, sys, comp) {
  if (!payload || payload.length < 2) return;
  const severity = payload[0];
  let text = "";
  for (let i = 1; i < payload.length && i < 1 + 51; i += 1) {
    const c = payload[i];
    if (c === 0) break;
    text += String.fromCharCode(c);
  }
  if (typeof window.ingestStatustext === "function") {
    window.ingestStatustext(severity, text, sys, comp);
  }
}

// decodeFlightSwVersion / formatUidWordPair / bytesToHexTrim / humanizeBoardIdName
//移至 JS/ui/mavlink-helpers.js

/** MAVLink common AUTOPILOT_VERSION（#148）线序：capabilities(8) + 四段 sw + board + 三组 custom[8] + vendor/product + uid(8) + uid2[18] */
function parseAutopilotVersion(payload, sys, comp) {
  if (!payload || payload.length < 24) {
    if (typeof log === "function") log(`⚠️ #148 载荷过短：${payload?.length ?? 0} byte，放弃解析`, "debug");
    return;
  }
  if (typeof log === "function") log(`📥 #148 AUTOPILOT_VERSION 收到，载荷 ${payload.length} byte`, "debug");
  try {
    const u8 = payload instanceof Uint8Array ? payload : new Uint8Array(payload);
    const dv = mavlinkPayloadView(payload);

    const flight_sw_version = dv.getUint32(8, true);
    const middleware_sw_version = dv.getUint32(12, true);
    const os_sw_version = dv.getUint32(16, true);
    const board_version = dv.getUint32(20, true);

    let vendor_id = 0;
    let product_id = 0;
    if (payload.length >= 52) {
      vendor_id = dv.getUint16(48, true);
      product_id = dv.getUint16(50, true);
    }

    const boardType = (board_version >>> 16) & 0xffff;
    const boardRev = board_version & 0xffff;
    const map = window.ARDUPILOT_BOARD_TYPE_NAMES;
    const rawName = map && typeof map === "object" ? map[String(boardType)] || map[boardType] : null;
    const friendly = humanizeBoardIdName(rawName);
    let hardwareText = friendly || `板型 ID ${boardType}`;
    if (boardRev) hardwareText += ` · rev 0x${boardRev.toString(16)}`;
    if (!friendly && (vendor_id || product_id)) {
      hardwareText += ` · vendor ${vendor_id} / product ${product_id}`;
    }

    const git = u8.length >= 32 ? bytesToHexTrim(u8, 24, 8) : "";
    let firmwareText = decodeFlightSwVersion(flight_sw_version);
    if (git) firmwareText += ` · ${git.slice(0, 12)}${git.length > 12 ? "…" : ""}`;
    const looksZeroSemver = /^0\.0\.0(?:\b|\s|$)/.test(String(firmwareText || "").trim());

    if (typeof log === "function") {
      log(`🔍 #148 解析结果：固件=${firmwareText} 硬件=${hardwareText} 板型=${boardType}`, "debug");
    }

    let uidText = "";
    if (u8.length >= 78) {
      uidText = bytesToHexTrim(u8, 60, 18);
    }
    if (!uidText && u8.length >= 60) {
      uidText = formatUidWordPair(dv, 52);
    }
    if (uidText && !uidText.startsWith("0x")) uidText = `0x${uidText}`;

    const hasVersionData =
      !looksZeroSemver && (
      flight_sw_version !== 0 ||
      middleware_sw_version !== 0 ||
      os_sw_version !== 0
      );
    const hasBoardData =
      board_version !== 0 ||
      vendor_id !== 0 ||
      product_id !== 0;
    const hasUidData = !!uidText && !/^0x0+$/i.test(uidText);
    const hasCoreData =
      hasVersionData ||
      (
      flight_sw_version !== 0 ||
      middleware_sw_version !== 0 ||
      os_sw_version !== 0 ||
      board_version !== 0 ||
      !!uidText ||
      vendor_id !== 0 ||
      product_id !== 0
      );

    const srcSys = Number(sys);
    const srcComp = Number(comp);
    const sourceKnown = Number.isFinite(srcSys) && srcSys > 0 && Number.isFinite(srcComp) && srcComp >= 0;
    const preferredSys = Number(window.fcSysid || window.sysid || 0);
    if (sourceKnown && preferredSys > 0 && srcSys !== preferredSys) {
      if (typeof log === "function") {
        log(`ℹ️ 忽略非当前飞控 #148：src ${srcSys}/${srcComp}，当前 ${preferredSys}`, "debug");
      }
      return;
    }
    if (!window._autopilotVersionSource && sourceKnown) {
      window._autopilotVersionSource = { sys: srcSys, comp: srcComp };
    } else if (window._autopilotVersionSource && sourceKnown) {
      const locked = window._autopilotVersionSource;
      if (locked.sys !== srcSys || locked.comp !== srcComp) {
        if (typeof log === "function") {
          log(`ℹ️ 忽略来源漂移 #148：src ${srcSys}/${srcComp}，锁定 ${locked.sys}/${locked.comp}`, "debug");
        }
        return;
      }
    }

    const prev = window.autopilotVersionInfo || null;
    const fallback = window._overviewVersionFallback || null;
    const fallbackHasAny = !!(
      fallback &&
      (
        String(fallback.firmwareText || "").trim() ||
        String(fallback.hardwareText || "").trim() ||
        String(fallback.deviceId || "").trim()
      )
    );
    const prevHasCoreData = !!(prev && (
      Number(prev.flight_sw_version) ||
      Number(prev.middleware_sw_version) ||
      Number(prev.os_sw_version) ||
      Number(prev.board_version) ||
      prev.uidHex ||
      Number(prev.vendor_id) ||
      Number(prev.product_id)
    ));
    if (!hasCoreData && (prevHasCoreData || fallbackHasAny)) {
      window._lastAutopilotVersionRejectedAt = Date.now();
      window._lastAutopilotVersionRejectReason = "empty-payload-with-existing-data";
      if (typeof log === "function") log("ℹ️ #148 本次为全零/空数据，保留现有有效信息", "debug");
      return;
    }
    window._lastAutopilotVersionRejectReason = "";

    window.autopilotVersionInfo = {
      flight_sw_version,
      middleware_sw_version,
      os_sw_version,
      board_version,
      boardType,
      boardRev,
      vendor_id,
      product_id,
      uidHex: uidText,
      updatedAt: Date.now(),
      sourceSys: sourceKnown ? srcSys : null,
      sourceComp: sourceKnown ? srcComp : null,
      hasVersionData,
      hasBoardData,
      hasUidData,
    };
    if (typeof window.parseArdupilotFirmwareVersion === "function") {
      window._telemetryFirmwareVersion = window.parseArdupilotFirmwareVersion(flight_sw_version);
      if (typeof window.detectArdupilotTelemetryProfile === "function") {
        window._telemetryProfile = window.detectArdupilotTelemetryProfile(window._telemetryFirmwareVersion);
      }
    }
    try {
      document.dispatchEvent(new CustomEvent("gcs:autopilot-version", {
        detail: window.autopilotVersionInfo,
      }));
    } catch (_) { /* ignore */ }

    const fwEl = document.getElementById("ov-fw-version");
    const hwEl = document.getElementById("ov-board-hardware");
    const idEl = document.getElementById("ov-device-id");
    const fallbackFw = String(fallback?.firmwareText || "").trim();
    const fallbackHw = String(fallback?.hardwareText || "").trim();
    const fallbackId = String(fallback?.deviceId || "").trim();
    const currentFw = String(fwEl?.textContent || "").trim();
    const currentHw = String(hwEl?.textContent || "").trim();
    const currentId = String(idEl?.textContent || "").trim();
    const fallbackToCurrent = (cur) => {
      if (!cur || /等待飞控上报/.test(cur) || cur === "—") return "";
      return cur;
    };
    const resolvedFw = hasVersionData ? firmwareText : (fallbackFw || fallbackToCurrent(currentFw));
    const resolvedHw = hasBoardData ? hardwareText : (fallbackHw || fallbackToCurrent(currentHw));
    const resolvedId = hasUidData ? uidText : (fallbackId || fallbackToCurrent(currentId));
    if (fwEl) {
      if (resolvedFw) {
        fwEl.textContent = resolvedFw;
        fwEl.className = "ok";
      }
      fwEl.title = hasVersionData
        ? `flight_sw=${flight_sw_version} middleware=${middleware_sw_version} os=${os_sw_version}`
        : (fwEl.title || "来自 STATUSTEXT 回填");
    }
    if (hwEl) {
      if (resolvedHw) {
        hwEl.textContent = resolvedHw;
        hwEl.className = "ok";
      }
      hwEl.title = hasBoardData
        ? (rawName ? String(rawName) : `board_version=0x${board_version.toString(16)}`)
        : (hwEl.title || "来自 STATUSTEXT 回填");
    }
    if (idEl) {
      idEl.textContent = resolvedId || "—";
      idEl.className = resolvedId ? "ok" : "muted";
      idEl.title = hasUidData
        ? "uid2 优先，否则 64-bit uid"
        : (resolvedId ? "来自 STATUSTEXT 回填" : "飞控未提供 UID");
    }
    if (typeof log === "function") {
      log(`✅ 概览字段已更新：固件 → ${firmwareText} / 硬件 → ${hardwareText} / UID → ${uidText || "—"}`, "debug");
    }
  } catch (e) {
    console.warn("parseAutopilotVersion", e);
    if (typeof log === "function") {
      log(`⚠️ #148 解析异常：${e?.message || e}`, "debug");
    }
  }
}

/** EKF_STATUS_REPORT：flags + 方差；线序与 ardupilotmega/common 一致（flags 在首 uint16） */
function parseEkfStatusReport(payload) {
  if (!payload || payload.length < 14) return;
  try {
    const dv = mavlinkPayloadView(payload);
    const flags = dv.getUint16(0, true);
    const posHoriz = dv.getFloat32(6, true);
    const posVert = dv.getFloat32(10, true);
    window._ekfStatusReport = { flags, posHoriz, posVert, t: Date.now() };

    const bits = [];
    if (flags & 0x0001) bits.push("姿态");
    if (flags & 0x0002) bits.push("水平速度");
    if (flags & 0x0004) bits.push("垂直速度");
    if (flags & 0x0010) bits.push("水平位置");
    if (flags & 0x0020) bits.push("垂直位置");
    const summary = bits.length ? `${bits.join("·")} 已融合` : `flags=0x${flags.toString(16)}（初始化或未对齐）`;

    const statusEl = document.getElementById("ov-ekf-status");
    if (statusEl) {
      statusEl.textContent = summary;
      statusEl.className = bits.length >= 3 ? "ok" : bits.length ? "warn" : "muted";
    }
    const posEl = document.getElementById("ov-ekf-pos");
    if (posEl && Number.isFinite(posHoriz)) {
      posEl.textContent = posHoriz < 1 ? `水平方差 ${posHoriz.toExponential(2)}（较好）` : `水平方差 ${posHoriz.toExponential(2)} m²`;
      posEl.className = posHoriz < 1 ? "ok" : "warn";
    }
    const velEl = document.getElementById("ov-ekf-vel");
    if (velEl && Number.isFinite(posVert)) {
      velEl.textContent = `垂直方差 ${posVert.toExponential(2)} m²`;
      velEl.className = posVert < 2 ? "ok" : "warn";
    }
  } catch (e) {
    console.warn("parseEkfStatusReport", e);
  }
}

// scheduleParamTableRender 移至 JS/core/mavlink-helpers.js

function parseParam(p){ /* 保持不变 */ 
  let dv = mavlinkPayloadView(p);
  let val = dv.getFloat32(0,true);
  let count = dv.getUint16(4,true);
  let index = dv.getUint16(6,true);
  let name="";
  for(let i=8;i<24;i++){
    if(p[i]===0) break;
    name+=String.fromCharCode(p[i]);
  }
  if(!name) return;
  const pmap = window.params;
  pmap.set(name,val);
  window._lastParamTableTouch = name;
  window._paramCount = count;
  window._paramLastIndex = index;
  if (!window._paramRxIndices) window._paramRxIndices = new Set();
  if (Number.isFinite(index) && index >= 0 && index < 65535) {
    window._paramRxIndices.add(index);
  }

  if (window._missionUploadActive) {
    return;
  }

  if (window._paramLoadActive) {
    const totalKnown = Number.isFinite(count) && count > 0 ? count : NaN;
    const rxCount = window._paramRxIndices ? window._paramRxIndices.size : pmap.size;
    if (typeof window.updateParamLoadProgress === "function") {
      window.updateParamLoadProgress(rxCount, totalKnown);
    }
    if (
      !window._paramLoadCancel &&
      Number.isFinite(count) && count > 0 &&
      rxCount >= count &&
      typeof window.endParamLoadingUI === "function"
    ) {
      if (window._paramCompleteTimer) clearTimeout(window._paramCompleteTimer);
      const minVisible = 500;
      const started = Number(window._paramLoadStartedAt) || 0;
      const wait = Math.max(0, minVisible - (Date.now() - started));
      window._paramCompleteTimer = setTimeout(() => {
        window._paramCompleteTimer = null;
        if (!window._paramLoadActive || window._paramLoadCancel) return;
        const total = Number(window._paramCount);
        const got = window._paramRxIndices ? window._paramRxIndices.size : pmap.size;
        if (!(total > 0 && got >= total)) return;
        window.endParamLoadingUI(true, "complete");
        setTimeout(() => {
          try {
            if (typeof window.requestAutopilotVersionFromVehicle === "function") {
              window.requestAutopilotVersionFromVehicle();
            }
          } catch (_) { /* ignore */ }
        }, 250);
      }, wait);
    }
  } else {
    scheduleParamTableRender();
  }

  const u = name.toUpperCase();
  if (u === "FRAME_CLASS" || u === "FRAME_TYPE" || u === "Q_FRAME_CLASS" || u === "Q_FRAME_TYPE") {
    try {
      document.dispatchEvent(new CustomEvent("gcs-airframe-params-changed", { detail: { name: u } }));
    } catch (e) { /* ignore */ }
  }
  if (
    u.startsWith("INS_ACC") || u.startsWith("INS_GYR") || u.startsWith("INS_USE") ||
    u.startsWith("COMPASS_DEV_ID") || u.startsWith("COMPASS_USE") ||
    u === "COMPASS_EXTERNAL" || u === "COMPASS_EXTERN2" || u === "COMPASS_EXTERN3" ||
    /^BARO\d+_DEVID$/.test(u) || /^RNGFND\d+_TYPE$/.test(u) ||
    /^PRX\d+_TYPE$/.test(u) || /^ARSPD\d*_TYPE$/.test(u) || u === "FLOW_TYPE" ||
    /^BATT\d*_MONITOR$/.test(u) || /^GPS\d*_TYPE$/.test(u) || u === "GPS_TYPE" ||
    u === "BCN_TYPE" || /^SERIAL\d+_PROTOCOL$/.test(u)
  ) {
    try {
      document.dispatchEvent(new CustomEvent("gcs-sensor-overview-changed", { detail: { name: u } }));
    } catch (e) { /* ignore */ }
  }
}

// renderSortedParams 移至 JS/core/mavlink-helpers.js

// getFlightModeString 移至 JS/core/mavlink-helpers.js

function parseEscTelemetryGroup(id, payload) {
  const baseMotor = ((id - 11030) * 4) + 1;
  const dv = mavlinkPayloadView(payload);
  window.escTelemetry = window.escTelemetry || {};
  const now = Date.now();

  // 兼容不同固件字段布局：
  // layout A: temp(4x u8) + volt(4x u16) + curr(4x u16) + totalcurr(4x u16) + rpm(4x u16) + count...
  // layout B: temp(4x u8) + volt(4x u16) + curr(4x u16) + rpm(4x u16) + ...
  const hasExtended = payload.length >= 36;

  for (let i = 0; i < 4; i += 1) {
    const temp = i < payload.length ? dv.getUint8(i) : null;
    const voltOffset = 4 + i * 2;
    const currOffset = 12 + i * 2;
    const rpmOffset = hasExtended ? 28 + i * 2 : 20 + i * 2;
    const voltageRaw = voltOffset + 1 < payload.length ? dv.getUint16(voltOffset, true) : null;
    const currentRaw = currOffset + 1 < payload.length ? dv.getUint16(currOffset, true) : null;
    const rpmRaw = rpmOffset + 1 < payload.length ? dv.getUint16(rpmOffset, true) : null;
    const motorId = baseMotor + i;

    window.escTelemetry[motorId] = {
      rpm: Number.isFinite(rpmRaw) ? rpmRaw : null,
      current: Number.isFinite(currentRaw) ? (currentRaw / 100) : null,
      temperature: Number.isFinite(temp) ? temp : null,
      voltage: Number.isFinite(voltageRaw) ? (voltageRaw / 100) : null,
      updatedAt: now,
    };
  }
}

function getBattMonitorType(batteryId) {
  const p = window.params;
  if (!(p instanceof Map)) return null;
  const key = typeof window.battMonitorKeyFromSlot === "function"
    ? window.battMonitorKeyFromSlot(batteryId)
    : (batteryId === 0 ? "BATT_MONITOR" : `BATT${batteryId + 1}_MONITOR`);
  if (!p.has(key)) return null;
  const v = Number(p.get(key));
  return Number.isFinite(v) ? Math.round(v) : null;
}

function parseBatteryStatus(payload) {
  const dv = mavlinkPayloadView(payload);
  window.powerInstances = window.powerInstances || new Map();
  const batteryId = payload.length > 32 ? dv.getUint8(32) : 0;
  const currentRaw = payload.length > 31 ? dv.getInt16(30, true) : -1;
  const remaining = payload.length > 35 ? dv.getInt8(35) : -1;
  const tempRaw = payload.length > 9 ? dv.getInt16(8, true) : null;
  const normTemp = typeof window.normalizeBatteryTempC === "function"
    ? window.normalizeBatteryTempC
    : (t) => (Number.isFinite(t) && t !== 32767 ? t / 100 : undefined);
  const temperature = normTemp(tempRaw);

  const cellVoltages = [];
  for (let i = 0; i < 10; i += 1) {
    const off = 10 + i * 2;
    if (off + 1 >= payload.length) break;
    const mv = dv.getUint16(off, true);
    if (mv > 0 && mv < 65535) cellVoltages.push(mv / 1000);
  }
  for (let i = 0; i < 4; i += 1) {
    const off = 41 + i * 2;
    if (off + 1 >= payload.length) break;
    const mv = dv.getUint16(off, true);
    if (mv > 0 && mv < 65535) cellVoltages.push(mv / 1000);
  }

  let voltage = 0;
  if (cellVoltages.length) {
    voltage = cellVoltages.reduce((a, b) => a + b, 0);
  } else if (
    batteryId === 0 &&
    typeof window.battery_voltage === "number" &&
    window.battery_voltage > 0
  ) {
    voltage = window.battery_voltage;
  }

  const current = currentRaw >= 0 ? currentRaw / 100 : 0;
  const monitorType = getBattMonitorType(batteryId);
  
  // BMS数据合理性验证与降级策略
  let validation = { isValid: false, estimatedCells: 0, correctedCells: [], reason: "未验证", isEstimated: false };
  let useCellVoltages = [];
  let useCells = 0;
  
  if (typeof window.validateAndCorrectBatteryData === "function") {
    validation = window.validateAndCorrectBatteryData(voltage, cellVoltages, cellVoltages.length, monitorType);
    
    if (validation.isValid) {
      // 数据可信，使用原始数据
      useCellVoltages = cellVoltages;
      useCells = cellVoltages.length;
    } else if (validation.isEstimated) {
      // 降级策略：使用估算值
      useCellVoltages = validation.correctedCells;
      useCells = validation.estimatedCells;
      if (typeof log === "function") {
        log(`⚠️ Battery ${batteryId + 1}: ${validation.reason}`, "battery");
      }
    }
  }
  
  const assess = typeof window.assessBatteryTelemetryConnected === "function"
    ? window.assessBatteryTelemetryConnected
    : () => useCellVoltages.length > 0 && voltage > 0.5;
  const connected = assess(
    batteryId,
    monitorType,
    cellVoltages.length ? cellVoltages : useCellVoltages,
    voltage,
    current,
    remaining,
    temperature
  );

  const safeVoltage = connected ? voltage : 0;
  const safeCurrent = connected ? current : 0;

  function computeReasonableCells(voltage, reportedCells) {
    if (!voltage || voltage <= 0) return reportedCells || 1;
    const MIN_CELL_V = 2.7;
    const MAX_CELL_V = 4.45;
    const NOMINAL = 3.7;
    let estS = Math.max(1, Math.round(voltage / NOMINAL));
    let perEst = voltage / estS;
    if (perEst < MIN_CELL_V) {
      estS = Math.max(1, Math.floor(voltage / MIN_CELL_V));
    } else if (perEst > MAX_CELL_V) {
      estS = Math.max(1, Math.ceil(voltage / MAX_CELL_V));
    }
    if (reportedCells && reportedCells > 0) {
      const perReported = voltage / reportedCells;
      if (perReported >= MIN_CELL_V && perReported <= MAX_CELL_V) {
        return reportedCells;
      }
      return estS;
    }
    return estS;
  }

  const reportedCells = useCellVoltages.length || 0;
  const safeCells = connected
    ? computeReasonableCells(safeVoltage, reportedCells)
    : 0;
  const uiType = typeof window.batteryUiType === "function"
    ? window.batteryUiType(monitorType, connected ? useCellVoltages : [], safeVoltage)
    : "monitor";
  const monitorKey = typeof window.battMonitorKeyFromSlot === "function"
    ? window.battMonitorKeyFromSlot(batteryId)
    : (batteryId === 0 ? "BATT_MONITOR" : `BATT${batteryId + 1}_MONITOR`);

  window.powerInstances.set(batteryId, {
    id: batteryId,
    name: `Battery ${batteryId + 1}`,
    monitorKey,
    monitorType,
    type: uiType,
    cells: safeCells,
    voltage: safeVoltage,
    current: safeCurrent,
    cellVoltages: connected ? useCellVoltages : [],
    temperature: connected ? temperature : undefined,
    remaining: connected && remaining >= 0 ? remaining : undefined,
    connected,
    validation,  // 添加验证结果
    updatedAt: Date.now(),
  });
}

// syncToTelemetry 与 renderSortedParams 移至 mavlink-helpers.js
