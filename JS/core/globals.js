// Global state shared across legacy UI scripts.
window.port = null;
window.reader = null;
window.writer = null;
window.buf = [];

window.telemetry = window.telemetry || {};
window.telemetry.navGuidance = window.telemetry.navGuidance || {};
window.telemetry.home = window.telemetry.home || {};
window.navGuidance = window.telemetry.navGuidance;
window.homeState = window.telemetry.home;

window.sysid = 1;
window.compid = 1;
window.fcSysid = 1;
window.fcCompid = 1;
window.gcsSysId = 255;

window.params = new Map();

window.roll = 0;
window.pitch = 0;
window.yaw = 0;
window.DEFAULT_MAP_LAT = 29.59256;
window.DEFAULT_MAP_LON = 106.22742;

window.getMapCenterLatLng = function getMapCenterLatLng() {
  const fix = Number(window.gps_fix_type);
  const lat = window.lat;
  const lon = window.lon;
  if (
    Number.isFinite(fix) &&
    fix >= 2 &&
    typeof lat === "number" &&
    typeof lon === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lon) <= 180
  ) {
    return [lat, lon];
  }
  return [window.DEFAULT_MAP_LAT, window.DEFAULT_MAP_LON];
};

window.lat = window.DEFAULT_MAP_LAT;
window.lon = window.DEFAULT_MAP_LON;
window.airspeed = 0;
window.groundspeed = 0;
window.altitude = 0;
window.relative_alt_m = 0;
window.climb_rate = 0;

window.battery_voltage = 0;
window.gps_fix_type = 0;
window.gps_satellites_visible = 0;
window._lastGpsRawMs = 0;
window._lastGps2RawMs = 0;
window._lastGposMs = 0;
window.gpsTelemetry = window.gpsTelemetry || {
  instances: [
    {
      index: 0,
      rawMsgId: 24,
      label: "GPS1",
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
    },
    {
      index: 1,
      rawMsgId: 124,
      label: "GPS2",
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
    },
  ],
  rtk: {
    source: "none",
    injectStatus: "idle",
    health: "offline",
    lastCorrectionMs: 0,
    ageSec: null,
    latencyMs: null,
    boundInstance: 0,
  },
};
window.ekf_status = false;
window.armed = false;
window.flight_mode = "UNKNOWN";
window.dist_to_wp = 0;
window.wp_current = null;
window.vibe_status = 0;
window.escTelemetry = window.escTelemetry || {};
window.powerInstances = window.powerInstances || new Map();

Object.assign(window.navGuidance, {
  headingDeg: null,
  groundTrackDeg: null,
  desiredHeadingDeg: null,
  waypointBearingDeg: null,
  xtrackErrorM: null,
  turnRateDegS: null,
  gpsValid: false
});

Object.assign(window.homeState, {
  lat: null,
  lng: null,
  alt: null,
  valid: false,
  source: null
});

window._lastLogByKey = {};
window._lastValues = {};
window._logEntryCount = 0;
window._logMaxEntries = 240;

function log(s, key = null) {
  try {
    const el = document.getElementById("log");
    if (!el) return;

    let dedupeKey = key;
    if (!dedupeKey) {
      if (typeof s === "string") {
        const arrowIdx = s.indexOf("->");
        if (arrowIdx !== -1) dedupeKey = s.slice(0, arrowIdx).trim();
        else if (s.indexOf(":") !== -1) dedupeKey = s.split(":")[0].trim();
        else dedupeKey = s.split(" ")[0].trim();
      } else {
        dedupeKey = "default";
      }
    }

    if (window._lastLogByKey[dedupeKey] === s) return;
    window._lastLogByKey[dedupeKey] = s;

    const line = document.createElement("div");
    line.className = "gcs-log-line";
    line.textContent = s;
    el.appendChild(line);
    window._logEntryCount += 1;

    const maxEntries =
      Number.isFinite(window._logMaxEntries) && window._logMaxEntries > 20
        ? window._logMaxEntries
        : 240;
    while (window._logEntryCount > maxEntries && el.firstChild) {
      el.removeChild(el.firstChild);
      window._logEntryCount -= 1;
    }
    el.scrollTop = el.scrollHeight;
  } catch (e) {
    console.error("log error", e);
  }
}

window.log = log;

console.log("globals initialized");
