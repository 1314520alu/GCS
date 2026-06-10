(function initRadarSetup() {
  const RADAR_PANEL = "radar";
  const STORAGE_KEY = "gcs-radar-drafts-v2";
  const EPS = 1e-5;
  const TELEMETRY_STALE_MS = 4000;
  const SECTOR_STALE_MS = 3000;
  const MAX_VIS_RANGE_M = 40;
  const MAX_DISTANCE_UI_MIN_M = 0.1;
  const MAX_DISTANCE_UI_MAX_M = 100;
  const MIN_DISTANCE_UI_MIN_M = 0.1;
  const MIN_DISTANCE_UI_MAX_M = 4;
  const ALT_MIN_UI_MIN_M = 0;
  const ALT_MIN_UI_MAX_M = 20;
  const POLAR_CENTER = 200;
  const POLAR_RADIUS_PX = 168;
  const INSTANCE_COUNT = 5;

  const SCAN_TYPES = new Set([3, 5, 6, 7, 8, 16]);
  const ADDR_TYPES = new Set([3, 6, 7, 8, 13, 14, 17, 18]);
  const RECV_ID_TYPES = new Set([7, 8, 14, 17, 18]);

  const SECTOR_COLORS = ["#f59e0b", "#a855f7", "#22c55e", "#06b6d4"];

  const PRX_TYPE_OPTIONS = [
    { value: 0, label: "无（禁用）", group: "禁用" },
    { value: 10, label: "SITL 仿真", group: "仿真" },
    { value: 12, label: "AirSim 仿真", group: "仿真" },
    { value: 5, label: "RPLidar A2", group: "2D 激光 / 扫描" },
    { value: 16, label: "LD06 激光", group: "2D 激光 / 扫描" },
    { value: 3, label: "TeraRanger Tower", group: "2D 激光 / 扫描" },
    { value: 6, label: "TeraRanger Tower Evo", group: "2D 激光 / 扫描" },
    { value: 7, label: "Lightware SF40c", group: "2D 激光 / 扫描" },
    { value: 8, label: "Lightware SF45B", group: "2D 激光 / 扫描" },
    { value: 4, label: "测距仪 (RangeFinder)", group: "单点测距" },
    { value: 14, label: "DroneCAN", group: "总线雷达" },
    { value: 17, label: "MR72 CAN", group: "总线雷达" },
    { value: 18, label: "Hexsoon 雷达", group: "总线雷达" },
    { value: 13, label: "Cygbot D1", group: "总线雷达" },
    { value: 2, label: "MAVLink 外部", group: "外部 / 自定义" },
    { value: 15, label: "Lua 脚本", group: "外部 / 自定义" },
  ];

  const OA_DB_OUTPUT_OPTIONS = [
    { value: 0, label: "不向地面站发送" },
    { value: 1, label: "仅高重要性" },
    { value: 2, label: "高 + 正常" },
    { value: 3, label: "全部" },
  ];

  const INSTANCE_FIELD_SUFFIXES = [
    "TYPE", "ORIENT", "YAW_CORR", "MIN", "MAX", "ADDR", "RECV_ID",
    "IGN_ANG1", "IGN_ANG2", "IGN_ANG3", "IGN_ANG4",
    "IGN_WID1", "IGN_WID2", "IGN_WID3", "IGN_WID4",
  ];

  const GLOBAL_KEYS = [
    "PRX_FILT", "PRX_ALT_MIN", "PRX_IGN_GND", "PRX_LOG_RAW",
    "AVOID_ENABLE", "AVOID_MARGIN", "AVOID_DIST_MAX", "AVOID_BEHAVE",
    "OA_TYPE", "OA_DB_SIZE", "OA_DB_OUTPUT",
  ];

  function buildParamKeys() {
    const keys = [];
    for (let n = 1; n <= INSTANCE_COUNT; n += 1) {
      INSTANCE_FIELD_SUFFIXES.forEach((suffix) => keys.push(`PRX${n}_${suffix}`));
    }
    GLOBAL_KEYS.forEach((key) => keys.push(key));
    return keys;
  }

  const PARAM_KEYS = buildParamKeys();

  function buildDefaults() {
    const defaults = {
      PRX_FILT: 10,
      PRX_ALT_MIN: 0,
      PRX_IGN_GND: 1,
      PRX_LOG_RAW: 0,
      AVOID_ENABLE: 2,
      AVOID_MARGIN: 2,
      AVOID_DIST_MAX: 5,
      AVOID_BEHAVE: 0,
      OA_TYPE: 1,
      OA_DB_SIZE: 100,
      OA_DB_OUTPUT: 2,
    };
    for (let n = 1; n <= INSTANCE_COUNT; n += 1) {
      defaults[`PRX${n}_TYPE`] = 0;
      defaults[`PRX${n}_MAX`] = 40;
      defaults[`PRX${n}_MIN`] = 0.3;
      defaults[`PRX${n}_YAW_CORR`] = 0;
      defaults[`PRX${n}_ORIENT`] = 0;
      defaults[`PRX${n}_ADDR`] = 0;
      defaults[`PRX${n}_RECV_ID`] = 0;
      for (let i = 1; i <= 4; i += 1) {
        defaults[`PRX${n}_IGN_ANG${i}`] = 0;
        defaults[`PRX${n}_IGN_WID${i}`] = 0;
      }
    }
    return defaults;
  }

  const DEFAULTS = buildDefaults();

  const state = {
    mounted: false,
    panelActive: false,
    hasActivated: false,
    drafts: new Map(),
    activeInstance: 1,
    sortKey: "distance",
    sortAsc: true,
    lastSyncMs: 0,
    liveTimer: 0,
    selectedSectorSlot: null,
    sectorDrag: null,
    lastRenderedTelemetryMs: -1,
    lastFreshStateKey: "",
    radarStaticKey: "",
    lastDynamicFingerprint: "",
    liveExpanded: false,
  };

  function el(id) {
    return document.getElementById(id);
  }

  function syncPanelActiveFromDom() {
    const panel = el("setup-panel-radar");
    state.panelActive = !!(panel && panel.classList.contains("active"));
    return state.panelActive;
  }

  function prxTypeInfo() {
    return window.PRX_TYPE_INFO || {};
  }

  function paramKey(suffix) {
    return `PRX${state.activeInstance}_${suffix}`;
  }

  function getParamsMap() {
    return window.params instanceof Map ? window.params : null;
  }

  function fcConnected() {
    const st = String(window._gcsConnState || "").toLowerCase();
    if (st !== "connected") return false;
    return !!(window.writer || (typeof writer !== "undefined" && writer)) ||
      window._bridgeConnActive === true;
  }

  function hasLiveProximityData() {
    const telemetry = window.radarTelemetry || {};
    const lastIngestMs = Number(telemetry.lastIngestMs ?? telemetry.lastUpdateMs) || 0;
    if (!lastIngestMs || Date.now() - lastIngestMs >= TELEMETRY_STALE_MS) return false;
    const sectors = Array.isArray(telemetry.sectors) ? telemetry.sectors : [];
    const points = Array.isArray(telemetry.points) ? telemetry.points : [];
    return sectors.length > 0 || points.length > 0;
  }

  function valuesClose(a, b) {
    return Math.abs(Number(a) - Number(b)) < EPS;
  }

  function getParamNum(key) {
    const params = getParamsMap();
    if (!params || !params.has(key)) return null;
    const numeric = Number(params.get(key));
    return Number.isFinite(numeric) ? numeric : null;
  }

  function getDraftValue(key) {
    return state.drafts.has(key) ? state.drafts.get(key) : getParamNum(key);
  }

  function persistDrafts() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries(state.drafts.entries())));
    } catch (_) {
      // ignore
    }
  }

  function loadDrafts() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      Object.entries(parsed || {}).forEach(([key, value]) => {
        const numeric = Number(value);
        if (Number.isFinite(numeric) && PARAM_KEYS.includes(key)) {
          state.drafts.set(key, numeric);
        }
      });
    } catch (_) {
      // ignore
    }
  }

  function setDraftValue(key, value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return;
    const live = getParamNum(key);
    if (live != null && valuesClose(live, numeric)) {
      state.drafts.delete(key);
    } else {
      state.drafts.set(key, numeric);
    }
    persistDrafts();
  }

  function reconcileDraftsWithParams() {
    let changed = false;
    PARAM_KEYS.forEach((key) => {
      if (!state.drafts.has(key)) return;
      const live = getParamNum(key);
      if (live == null) return;
      if (valuesClose(state.drafts.get(key), live)) {
        state.drafts.delete(key);
        changed = true;
      }
    });
    if (changed) persistDrafts();
  }

  function typeLabel(typeValue) {
    const n = Math.round(Number(typeValue));
    const info = prxTypeInfo()[n];
    if (info) return info.zh || info.short;
    const opt = PRX_TYPE_OPTIONS.find((item) => Number(item.value) === n);
    if (opt) return opt.label;
    return `类型 ${n}`;
  }

  function typeBus(typeValue) {
    const n = Math.round(Number(typeValue));
    const info = prxTypeInfo()[n];
    if (info && info.bus) return info.bus;
    const opt = PRX_TYPE_OPTIONS.find((item) => Number(item.value) === n);
    if (opt) return opt.group || "--";
    return "--";
  }

  function getInstanceType(instance) {
    return Number(getDraftValue(`PRX${instance}_TYPE`)) || 0;
  }

  function getActiveType() {
    return getInstanceType(state.activeInstance);
  }

  function telemetrySourceLabel(source) {
    if (source === "distance_sensor") return "8扇区";
    if (source === "obstacle_distance") return "高分辨率";
    if (source === "merged") return "8扇区+高分辨率";
    return "";
  }

  function getLiveRateLabel(device) {
    const telemetry = window.radarTelemetry || {};
    const sourceHint = telemetrySourceLabel(telemetry.source);
    const hz132 = Number(telemetry.rxHz132) || 0;
    const hz330 = Number(telemetry.rxHz330) || 0;
    const hz = hz132 > 0 ? hz132 : hz330;
    const lastIngest = Number(telemetry.lastIngestMs) || 0;
    const ageMs = lastIngest > 0 ? Date.now() - lastIngest : Infinity;
    const sectorN = Array.isArray(telemetry.sectors) ? telemetry.sectors.length : 0;

    if (device.fresh && hz >= 0.5) {
      const parts = [hz.toFixed(1) + " Hz"];
      if (sourceHint) parts.push(sourceHint);
      if (sectorN > 0) parts.push(sectorN + "扇区");
      if (ageMs < 5000) parts.push(Math.round(ageMs) + "ms前");
      return parts.join(" · ");
    }
    if (device.fresh) {
      const parts = [];
      if (sourceHint) parts.push(sourceHint);
      if (sectorN > 0) parts.push(sectorN + "扇区");
      if (ageMs < 5000) parts.push(Math.round(ageMs) + "ms前");
      return parts.length ? parts.join(" · ") : "实时";
    }
    if (lastIngest > 0 && ageMs < 60000) {
      return "超时 " + Math.round(ageMs / 1000) + "s";
    }
    return "等待遥测";
  }

  function getDeviceStatus(instance) {
    const inst = instance != null ? instance : state.activeInstance;
    const typeValue = getInstanceType(inst);
    const enabled = typeValue !== 0;
    const telemetry = window.radarTelemetry || {};
    const lastUpdateMs = Number(telemetry.lastIngestMs ?? telemetry.lastUpdateMs) || 0;
    const fresh = lastUpdateMs > 0 && (Date.now() - lastUpdateMs) < TELEMETRY_STALE_MS;
    const liveData = hasLiveProximityData();
    const connected = fcConnected();

    let statusLabel = "离线";
    let statusClass = "is-offline";

    if (!connected) {
      statusLabel = "未连接";
    } else if (liveData) {
      statusLabel = "在线";
      statusClass = "is-online";
    } else if (!enabled) {
      statusLabel = "未启用";
    } else if (fresh) {
      statusLabel = "在线";
      statusClass = "is-online";
    } else if (lastUpdateMs > 0) {
      statusLabel = "超时";
      statusClass = "is-timeout";
    } else {
      statusLabel = "等待遥测";
    }

    return {
      enabled: enabled || liveData,
      typeValue,
      typeLabel: typeLabel(typeValue),
      connLabel: typeBus(typeValue),
      statusLabel,
      statusClass,
      fresh: fresh && (liveData || enabled),
    };
  }

  function getObstacles() {
    const telemetry = window.radarTelemetry || {};
    const now = Date.now();
    const list = [];

    const sectors = Array.isArray(telemetry.sectors) ? telemetry.sectors : [];
    sectors.forEach((item, index) => {
      const lastMs = Number(item.lastMs) || Number(telemetry.lastUpdateMs) || 0;
      if (lastMs > 0 && now - lastMs > SECTOR_STALE_MS) return;
      list.push({
        id: item.id != null ? item.id : index + 1,
        distance: Number(item.distance ?? item.dist ?? 0),
        angle: Number(item.angle ?? item.bearing ?? 0),
        velocity: 0,
        type: String(item.type || "Proximity"),
        status: String(item.status || "Active"),
        widthDeg: Number(item.widthDeg) || 45,
        isSector: true,
      });
    });

    const points = Array.isArray(telemetry.points)
      ? telemetry.points
      : (Array.isArray(telemetry.obstacles)
        ? telemetry.obstacles.filter((item) => !item.isSector)
        : []);
    points.forEach((item, index) => {
      list.push({
        id: item.id != null ? item.id : "p" + (index + 1),
        distance: Number(item.distance ?? item.dist ?? 0),
        angle: Number(item.angle ?? item.bearing ?? 0),
        velocity: Number(item.velocity ?? item.vel ?? 0),
        type: String(item.type || "—"),
        status: String(item.status || "Active"),
        widthDeg: 0,
        isSector: false,
      });
    });

    return list;
  }

  function getTelemetryLastUpdateMs() {
    const telemetry = window.radarTelemetry || {};
    return Number(telemetry.lastIngestMs ?? telemetry.lastUpdateMs) || 0;
  }

  function getFreshStateKey() {
    const device = getDeviceStatus();
    return [
      fcConnected() ? "connected" : "disconnected",
      device.statusLabel,
      device.statusClass,
      device.fresh ? "fresh" : "stale",
      formatSyncTime(state.lastSyncMs),
      state.activeInstance,
    ].join("|");
  }

  function polarToCanvas(distance, angleDeg, center, radiusPx, maxRange) {
    const clamped = Math.max(0, Math.min(maxRange, distance));
    const r = (clamped / maxRange) * radiusPx;
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return {
      x: center + Math.cos(rad) * r,
      y: center + Math.sin(rad) * r,
    };
  }

  function canvasToPolarAngle(clientX, clientY, svg) {
    if (!svg) return 0;
    const rect = svg.getBoundingClientRect();
    const vb = svg.viewBox.baseVal;
    const scaleX = vb.width / rect.width;
    const scaleY = vb.height / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    const dx = x - POLAR_CENTER;
    const dy = y - POLAR_CENTER;
    let deg = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
    while (deg < 0) deg += 360;
    while (deg >= 360) deg -= 360;
    return deg;
  }

  function normAngle360(deg) {
    let a = Number(deg) || 0;
    while (a < 0) a += 360;
    while (a >= 360) a -= 360;
    return a;
  }

  function sectorArcPath(center, radiusPx, angCenter, angWidth) {
    const w = Number(angWidth) || 0;
    if (w <= 0) return "";
    const start = normAngle360(angCenter - w / 2);
    const end = normAngle360(angCenter + w / 2);
    const p1 = polarToCanvas(1, start, center, radiusPx, 1);
    const p2 = polarToCanvas(1, end, center, radiusPx, 1);
    const large = w > 180 ? 1 : 0;
    return (
      `M ${center} ${center} L ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} ` +
      `A ${radiusPx} ${radiusPx} 0 ${large} 1 ${p2.x.toFixed(2)} ${p2.y.toFixed(2)} Z`
    );
  }

  function getVisRange() {
    const maxParam = Number(getDraftValue(paramKey("MAX"))) || 0;
    const maxRange = maxParam > 0 ? maxParam : MAX_VIS_RANGE_M;
    return Math.max(5, Math.min(500, maxRange));
  }

  function getSectorData(slot) {
    const ang = Number(getDraftValue(paramKey(`IGN_ANG${slot}`))) || 0;
    const wid = Number(getDraftValue(paramKey(`IGN_WID${slot}`))) || 0;
    return { ang: normAngle360(ang), wid: Math.max(0, Math.min(127, wid)) };
  }

  function setSectorData(slot, ang, wid) {
    setDraftValue(paramKey(`IGN_ANG${slot}`), normAngle360(ang));
    setDraftValue(paramKey(`IGN_WID${slot}`), Math.max(0, Math.min(127, Math.round(wid))));
  }

  function buildRadarStaticKey(visRange, showSectors) {
    const sectorBits = [];
    if (showSectors) {
      for (let slot = 1; slot <= 4; slot += 1) {
        const { ang, wid } = getSectorData(slot);
        sectorBits.push(slot + ":" + ang + ":" + wid);
      }
    }
    return visRange + "|" + (showSectors ? "1" : "0") + "|" + sectorBits.join(",");
  }

  function buildDynamicFingerprint(obstacles) {
    const staleBucket = Math.floor(Date.now() / 400);
    const body = obstacles.map((o) =>
      o.id + ":" + Math.round(o.angle) + ":" + o.distance.toFixed(2)
    ).join(";");
    return staleBucket + "|" + body;
  }

  function renderRadarStatic(host, visRange, center, radiusPx, showSectors) {
    const rings = [5, 10, 20, 40, 80, 100].filter((value) => value <= visRange);
    const ringHtml = rings.map((value) => {
      const r = (value / visRange) * radiusPx;
      return (
        '<circle cx="' + center + '" cy="' + center + '" r="' + r + '" fill="none" stroke="rgba(59,130,246,0.18)" stroke-width="1"></circle>' +
        '<text x="' + (center + 4) + '" y="' + (center - r + 12) + '" fill="rgba(156,163,175,0.85)" font-size="10">' + value + "m</text>"
      );
    }).join("");

    const crosshair =
      '<line x1="' + center + '" y1="' + (center - radiusPx) + '" x2="' + center + '" y2="' + (center + radiusPx) + '" stroke="rgba(75,85,99,0.45)" stroke-width="1"></line>' +
      '<line x1="' + (center - radiusPx) + '" y1="' + center + '" x2="' + (center + radiusPx) + '" y2="' + center + '" stroke="rgba(75,85,99,0.45)" stroke-width="1"></line>';

    const aircraft =
      '<g transform="translate(' + center + ',' + center + ')">' +
        '<polygon points="0,-14 8,10 -8,10" fill="#93c5fd" stroke="#dbeafe" stroke-width="1"></polygon>' +
        '<line x1="-16" y1="4" x2="16" y2="4" stroke="#60a5fa" stroke-width="2"></line>' +
      "</g>";

    const sweep =
      '<g class="radar-sweep">' +
        '<path d="M ' + center + ' ' + center + ' L ' + center + ' ' + (center - radiusPx) + ' A ' + radiusPx + ' ' + radiusPx + ' 0 0 1 ' +
          (center + radiusPx * Math.sin(Math.PI / 4)) + " " + (center - radiusPx * Math.cos(Math.PI / 4)) +
          ' Z" fill="url(#radarSweepGrad)" opacity="0.55"></path>' +
      "</g>";

    let sectorsHtml = "";
    if (showSectors) {
      for (let slot = 1; slot <= 4; slot += 1) {
        const { ang, wid } = getSectorData(slot);
        if (wid <= 0) continue;
        const path = sectorArcPath(center, radiusPx, ang, wid);
        const selected = state.selectedSectorSlot === slot;
        const color = SECTOR_COLORS[slot - 1];
        const midPt = polarToCanvas(visRange * 0.72, ang, center, radiusPx, visRange);
        sectorsHtml +=
          '<path class="radar-sector' + (selected ? " is-selected" : "") + '" data-sector-slot="' + slot + '" ' +
            'd="' + path + '" fill="' + color + '" fill-opacity="0.22" stroke="' + color + '" stroke-width="' + (selected ? 2 : 1) + '" ' +
            'style="cursor:grab"></path>' +
          '<circle class="radar-sector-handle" data-sector-slot="' + slot + '" data-handle="center" ' +
            'cx="' + midPt.x.toFixed(1) + '" cy="' + midPt.y.toFixed(1) + '" r="6" fill="' + color + '" stroke="#fff" stroke-width="1" style="cursor:grab"></circle>';
      }
    }

    host.innerHTML =
      '<defs>' +
        '<radialGradient id="radarSweepGrad" cx="50%" cy="50%" r="50%">' +
          '<stop offset="0%" stop-color="rgba(59,130,246,0.05)"></stop>' +
          '<stop offset="100%" stop-color="rgba(59,130,246,0.45)"></stop>' +
        "</radialGradient>" +
      "</defs>" +
      '<g id="radar-static-layer">' +
        ringHtml +
        crosshair +
        sectorsHtml +
        sweep +
        aircraft +
      "</g>" +
      '<g id="radar-dynamic-layer"></g>';
  }

  function renderRadarDynamic(host, obstacles, visRange, center, radiusPx) {
    let dynamic = host.querySelector("#radar-dynamic-layer");
    if (!dynamic) return;

    const dots = obstacles.filter((item) => !item.isSector).map((item) => {
      const pt = polarToCanvas(item.distance, item.angle, center, radiusPx, visRange);
      const tone = item.velocity > 0.2 ? "#f59e0b" : "#ef4444";
      return (
        '<circle class="radar-obstacle-dot" cx="' + pt.x.toFixed(1) + '" cy="' + pt.y.toFixed(1) + '" r="4" fill="' + tone + '"></circle>' +
        '<title>' + item.distance.toFixed(1) + "m / " + item.angle.toFixed(0) + "°</title>"
      );
    }).join("");

    const proximityHtml = obstacles.filter((item) => item.isSector && item.widthDeg === 45).map((item) => {
      const arcRadius = Math.max(4, (item.distance / visRange) * radiusPx);
      const path = sectorArcPath(center, arcRadius, item.angle, item.widthDeg);
      const labelPt = polarToCanvas(item.distance, item.angle, center, radiusPx, visRange);
      return (
        '<path class="radar-proximity-sector" d="' + path + '" fill="rgba(239,68,68,0.35)" stroke="#ef4444" stroke-width="1">' +
          '<title>' + item.distance.toFixed(1) + "m / " + item.angle.toFixed(0) + "°</title>" +
        "</path>" +
        '<text class="radar-proximity-label" x="' + labelPt.x.toFixed(1) + '" y="' + (labelPt.y - 4).toFixed(1) + '" ' +
          'text-anchor="middle" font-size="11" fill="#4ade80" font-weight="600">' +
          item.distance.toFixed(1) + "m" +
        "</text>"
      );
    }).join("");

    dynamic.innerHTML = proximityHtml + dots;
  }

  function renderRadarCanvas() {
    const host = el("radar-live-svg");
    if (!host) return;

    const obstacles = getObstacles();
    const visRange = getVisRange();
    const center = POLAR_CENTER;
    const radiusPx = POLAR_RADIUS_PX;
    const showSectors = SCAN_TYPES.has(getActiveType());
    const staticKey = buildRadarStaticKey(visRange, showSectors);
    const dynamicFp = buildDynamicFingerprint(obstacles);

    if (staticKey !== state.radarStaticKey || !host.querySelector("#radar-static-layer")) {
      renderRadarStatic(host, visRange, center, radiusPx, showSectors);
      state.radarStaticKey = staticKey;
      state.lastDynamicFingerprint = "";
    }

    if (dynamicFp !== state.lastDynamicFingerprint) {
      renderRadarDynamic(host, obstacles, visRange, center, radiusPx);
      state.lastDynamicFingerprint = dynamicFp;
    }

    renderSectorReadout();
  }

  function renderSectorReadout() {
    const host = el("radar-sector-readout");
    if (!host) return;
    if (!SCAN_TYPES.has(getActiveType())) {
      host.innerHTML = '<span class="muted">当前类型不支持忽略扇区</span>';
      return;
    }
    const rows = [];
    for (let slot = 1; slot <= 4; slot += 1) {
      const { ang, wid } = getSectorData(slot);
      const active = state.selectedSectorSlot === slot ? " is-active" : "";
      rows.push(
        '<button type="button" class="radar-sector-chip' + active + '" data-sector-slot="' + slot + '">' +
          slot + ": " + ang.toFixed(0) + "° ±" + (wid / 2).toFixed(0) + "°" +
        "</button>"
      );
    }
    host.innerHTML =
      '<span class="radar-sector-hint">在极坐标上拖拽扇区调整忽略角度；滚轮调整宽度</span>' +
      '<div class="radar-sector-chips">' + rows.join("") + "</div>";
  }

  function sortObstacles(list) {
    const sorted = list.slice();
    const key = state.sortKey;
    sorted.sort((a, b) => {
      const av = a[key];
      const bv = b[key];
      if (typeof av === "string") {
        return state.sortAsc ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
      }
      return state.sortAsc ? Number(av) - Number(bv) : Number(bv) - Number(av);
    });
    return sorted;
  }

  function getSectorSlotMap() {
    const map = new Map();
    getObstacles().forEach((item) => {
      const id = Number(item.id);
      if (!Number.isFinite(id) || id < 0 || id > 7) return;
      if (!map.has(id) || item.isSector) map.set(id, item);
    });
    return map;
  }

  function renderObstacleTable() {
    const tbody = el("radar-obstacle-body");
    if (!tbody) return;

    const slotMap = getSectorSlotMap();
    const rows = [];
    for (let id = 0; id <= 7; id += 1) {
      const item = slotMap.get(id);
      const rowClass = item ? "" : ' class="is-empty"';
      const cellClass = item ? "" : ' class="muted"';
      rows.push(
        "<tr" + rowClass + ">" +
          "<td>" + id + "</td>" +
          "<td" + cellClass + ">" + (item ? item.distance.toFixed(1) + " m" : "--") + "</td>" +
          "<td" + cellClass + ">" + (item ? item.angle.toFixed(0) + "°" : "--") + "</td>" +
        "</tr>"
      );
    }
    tbody.innerHTML = rows.join("");
  }

  function renderTypeSelect(select, value) {
    if (!select || document.activeElement === select) return;
    const current = Number(value);
    const groups = new Map();
    PRX_TYPE_OPTIONS.forEach((opt) => {
      const g = opt.group || "其他";
      if (!groups.has(g)) groups.set(g, []);
      groups.get(g).push(opt);
    });
    if (Number.isFinite(current) && !PRX_TYPE_OPTIONS.some((item) => Number(item.value) === current)) {
      groups.set("其他", [{ value: current, label: "类型 " + current }].concat(groups.get("其他") || []));
    }
    let html = "";
    groups.forEach((opts, group) => {
      html += '<optgroup label="' + group + '">';
      opts.forEach((opt) => {
        html += '<option value="' + opt.value + '">' + opt.label + "</option>";
      });
      html += "</optgroup>";
    });
    select.innerHTML = html;
    if (Number.isFinite(current)) select.value = String(current);
  }

  function renderSelect(select, options, value) {
    if (!select || document.activeElement === select) return;
    const current = Number(value);
    let opts = options.slice();
    if (Number.isFinite(current) && !opts.some((item) => Number(item.value) === current)) {
      opts = [{ value: current, label: String(current) }, ...opts];
    }
    select.innerHTML = opts.map((option) =>
      '<option value="' + option.value + '">' + option.label + "</option>"
    ).join("");
    if (Number.isFinite(current)) select.value = String(current);
  }

  function updateDirtyStyles() {
    document.querySelectorAll("#setup-panel-radar [data-param-key]").forEach((node) => {
      const key = node.getAttribute("data-param-key");
      if (!key) return;
      node.classList.toggle("radar-field-dirty", state.drafts.has(key));
    });
  }

  function dirtyParamCount() {
    return PARAM_KEYS.filter((key) => state.drafts.has(key)).length;
  }

  function updateDirtyUi() {
    updateDirtyStyles();
    const dirtyCount = dirtyParamCount();
    const connected = fcConnected();
    const dirtyNode = el("radar-dirty-count");
    if (dirtyNode) {
      dirtyNode.textContent = dirtyCount > 0 ? ("未写入修改: " + dirtyCount + " 项") : "无未写入修改";
    }
    const readBtn = el("radar-read-btn");
    const refreshBtn = el("radar-refresh-btn");
    const writeBtn = el("radar-write-btn");
    if (readBtn) {
      readBtn.disabled = false;
      readBtn.title = connected ? "从飞控读取 PRX 参数" : "请先在顶部连接飞控";
    }
    if (refreshBtn) {
      refreshBtn.disabled = false;
      refreshBtn.title = connected ? "重新读取参数" : "请先在顶部连接飞控";
    }
    if (writeBtn) writeBtn.disabled = !connected || dirtyCount === 0;
  }

  function setSwitch(id, checked) {
    const input = el(id);
    if (input) input.checked = !!checked;
  }

  function readAvoidEnableBits() {
    return Number(getDraftValue("AVOID_ENABLE")) || 0;
  }

  function writeAvoidEnableBit(bit, enabled) {
    let value = readAvoidEnableBits();
    const mask = 1 << bit;
    value = enabled ? (value | mask) : (value & ~mask);
    setDraftValue("AVOID_ENABLE", value);
  }

  function syncSwitchUi() {
    const bits = readAvoidEnableBits();
    setSwitch("radar-sw-avoid", (bits & 2) !== 0);
    setSwitch("radar-sw-detour", Number(getDraftValue("OA_TYPE")) > 0);
    setSwitch("radar-sw-brake", Number(getDraftValue("AVOID_BEHAVE")) === 1);
    setSwitch("radar-sw-database", Number(getDraftValue("OA_DB_SIZE")) > 0);
    setSwitch("radar-global-log", Number(getDraftValue("PRX_LOG_RAW")) === 1);
    setSwitch("radar-global-ground", Number(getDraftValue("PRX_IGN_GND")) === 1);
  }

  function setText(id, value) {
    const node = el(id);
    if (node) node.textContent = value;
  }

  function formatSyncTime(ms) {
    if (!Number.isFinite(ms) || ms <= 0) return "尚未同步";
    return new Date(ms).toLocaleString("zh-CN", { hour12: false });
  }

  function syncRangeUi(prefix, minKey, maxKey) {
    const minVal = Number(getDraftValue(minKey));
    const maxVal = Number(getDraftValue(maxKey));
    const minSlider = el(`${prefix}-min-dist`);
    const maxSlider = el(`${prefix}-max-dist`);
    if (minSlider) {
      minSlider.disabled = false;
      minSlider.value = String(Math.max(MIN_DISTANCE_UI_MIN_M, Math.min(MIN_DISTANCE_UI_MAX_M, Number.isFinite(minVal) ? minVal : 0.3)));
    }
    if (maxSlider) {
      maxSlider.disabled = false;
      maxSlider.value = String(Math.max(MAX_DISTANCE_UI_MIN_M, Math.min(MAX_DISTANCE_UI_MAX_M, Number.isFinite(maxVal) ? maxVal : 40)));
    }
    setText(`${prefix}-min-dist-val`, (Number.isFinite(minVal) ? minVal : 0.3).toFixed(1) + " m");
    setText(`${prefix}-max-dist-val`, (Number.isFinite(maxVal) ? maxVal : 40).toFixed(0) + " m");
  }

  function updateInstanceParamKeys() {
    const map = {
      "radar-device-type": "TYPE",
      "radar-addr": "ADDR",
      "radar-recv-id": "RECV_ID",
      "radar-yaw-corr": "YAW_CORR",
      "radar-max-dist": "MAX",
      "radar-min-dist": "MIN",
    };
    Object.entries(map).forEach(([id, suffix]) => {
      const node = el(id);
      if (node) node.setAttribute("data-param-key", paramKey(suffix));
    });
  }

  function updateFieldVisibility() {
    const typeVal = getActiveType();
    const addrRow = el("radar-addr-row");
    const recvRow = el("radar-recv-id-row");
    const rngHint = el("radar-rngfnd-hint");
    const sectorHint = el("radar-sector-panel");

    if (addrRow) addrRow.hidden = !ADDR_TYPES.has(typeVal);
    if (recvRow) recvRow.hidden = !RECV_ID_TYPES.has(typeVal);
    if (rngHint) rngHint.hidden = typeVal !== 4;
    if (sectorHint) sectorHint.hidden = !SCAN_TYPES.has(typeVal);

    const wrap = el("radar-canvas-wrap");
    if (wrap) wrap.classList.toggle("is-sector-edit", SCAN_TYPES.has(typeVal));
  }

  function renderInstanceTabs() {
    const host = el("radar-instance-tabs");
    if (!host) return;
    host.querySelectorAll("[data-instance]").forEach((btn) => {
      const inst = Number(btn.getAttribute("data-instance"));
      const status = getDeviceStatus(inst);
      const label = el("radar-tab-label-" + inst);
      const dot = btn.querySelector(".radar-tab-dot");
      if (label) {
        label.textContent = status.enabled ? status.typeLabel : "未配置";
      }
      btn.classList.toggle("is-active", inst === state.activeInstance);
      btn.classList.toggle("is-enabled", status.enabled);
      if (dot) {
        dot.className = "radar-tab-dot " + status.statusClass;
      }
    });
  }

  function renderConnectionAndFreshness() {
    const device = getDeviceStatus();

    const connChip = el("radar-conn-chip");
    if (connChip) {
      connChip.textContent = fcConnected() ? "链路已连接" : "链路未连接";
      connChip.className = "radar-tag " + (fcConnected() ? "is-good" : "is-bad");
    }

    const badge = el("radar-device-badge");
    if (badge) {
      badge.textContent = device.statusLabel;
      badge.className = "radar-badge " + device.statusClass;
    }

    setText("radar-sync-time", "上次同步: " + formatSyncTime(state.lastSyncMs));
    setText("radar-live-rate", getLiveRateLabel(device));
    renderInstanceTabs();
  }

  function renderControls() {
    updateInstanceParamKeys();
    const device = getDeviceStatus();

    renderTypeSelect(el("radar-device-type"), getDraftValue(paramKey("TYPE")));

    const addrInput = el("radar-addr");
    const recvInput = el("radar-recv-id");
    if (addrInput && document.activeElement !== addrInput) {
      addrInput.value = String(Number(getDraftValue(paramKey("ADDR"))) || 0);
    }
    if (recvInput && document.activeElement !== recvInput) {
      recvInput.value = String(Number(getDraftValue(paramKey("RECV_ID"))) || 0);
    }

    setText("radar-conn-type", device.connLabel);
    setText("radar-active-slot", "PRX" + state.activeInstance);

    const badge = el("radar-device-badge");
    if (badge) {
      badge.textContent = device.statusLabel;
      badge.className = "radar-badge " + device.statusClass;
    }

    const orient = Number(getDraftValue(paramKey("ORIENT"))) || 0;
    el("radar-orient-up")?.classList.toggle("is-active", orient === 0);
    el("radar-orient-down")?.classList.toggle("is-active", orient === 1);

    const yawInput = el("radar-yaw-corr");
    if (yawInput && document.activeElement !== yawInput) {
      yawInput.value = String(Number(getDraftValue(paramKey("YAW_CORR"))) || 0);
    }

    syncRangeUi("radar", paramKey("MIN"), paramKey("MAX"));

    const filtSlider = el("radar-prx-filt");
    const filtVal = Number(getDraftValue("PRX_FILT")) || 0;
    if (filtSlider && document.activeElement !== filtSlider) filtSlider.value = String(filtVal);
    setText("radar-prx-filt-val", filtVal.toFixed(0) + " Hz");

    const altSlider = el("radar-prx-alt-min");
    const altVal = Number(getDraftValue("PRX_ALT_MIN")) || 0;
    if (altSlider && document.activeElement !== altSlider) {
      altSlider.value = String(Math.max(ALT_MIN_UI_MIN_M, Math.min(ALT_MIN_UI_MAX_M, altVal)));
    }
    setText("radar-prx-alt-min-val", altVal.toFixed(1) + " m");

    const marginSlider = el("radar-safety-margin");
    const brakeSlider = el("radar-brake-dist");
    const marginVal = Number(getDraftValue("AVOID_MARGIN")) || DEFAULTS.AVOID_MARGIN;
    const brakeVal = Number(getDraftValue("AVOID_DIST_MAX")) || DEFAULTS.AVOID_DIST_MAX;
    if (marginSlider) marginSlider.value = String(marginVal);
    if (brakeSlider) brakeSlider.value = String(brakeVal);
    setText("radar-safety-margin-val", marginVal.toFixed(1) + " m");
    setText("radar-brake-dist-val", brakeVal.toFixed(1) + " m");

    renderSelect(el("radar-oa-db-output"), OA_DB_OUTPUT_OPTIONS, getDraftValue("OA_DB_OUTPUT"));

    const connChip = el("radar-conn-chip");
    if (connChip) {
      connChip.textContent = fcConnected() ? "链路已连接" : "链路未连接";
      connChip.className = "radar-tag " + (fcConnected() ? "is-good" : "is-bad");
    }

    setText("radar-sync-time", "上次同步: " + formatSyncTime(state.lastSyncMs));
    setText("radar-live-rate", getLiveRateLabel(device));

    renderInstanceTabs();
    updateFieldVisibility();
    syncSwitchUi();
    updateDirtyUi();
  }

  function render(force) {
    if (!state.mounted) return;
    syncPanelActiveFromDom();
    if (!force && !state.panelActive) return;
    renderControls();
    renderRadarCanvas();
    renderObstacleTable();
    updateDirtyUi();
  }

  async function probeParams(options) {
    if (!fcConnected()) return false;
    const pmap = getParamsMap();
    if (pmap && PARAM_KEYS.some((key) => pmap.has(key))) {
      reconcileDraftsWithParams();
      state.lastSyncMs = Date.now();
      return true;
    }
    if (typeof window.requestParamByName !== "function") return false;
    const quiet = !!(options && options.quiet);
    if (!quiet) setStatus("正在读取雷达参数…", "warn");
    for (const name of PARAM_KEYS) {
      await window.requestParamByName(name).catch(() => {});
      await new Promise((resolve) => setTimeout(resolve, 15));
    }
    reconcileDraftsWithParams();
    state.lastSyncMs = Date.now();
    return true;
  }

  async function readFromVehicle() {
    if (!fcConnected()) {
      setStatus("飞控未连接，请先在顶部选择端口并连接。", "bad");
      if (typeof log === "function") log("⚠️ 雷达：飞控未连接，无法读取参数", "radar");
      render(true);
      return;
    }
    setStatus("正在从飞控读取参数…", "warn");
    state.drafts.clear();
    persistDrafts();
    if (typeof window.loadParams === "function") {
      await window.loadParams({ force: true }).catch(() => {});
    }
    const ok = await probeParams();
    if (typeof window.requestProximityTelemetryStreams === "function") {
      window.requestProximityTelemetryStreams({ quiet: true }).catch(() => {});
    }
    setStatus(ok ? "已从飞控读取参数。" : "读取未完成，请确认连接后重试。", ok ? "ok" : "bad");
    render(true);
  }

  async function writeToVehicle() {
    const pending = PARAM_KEYS
      .filter((key) => state.drafts.has(key))
      .map((key) => ({ key, value: state.drafts.get(key) }));

    if (!fcConnected()) {
      setStatus("飞控未连接，无法写入。", "bad");
      return;
    }
    if (!pending.length) {
      setStatus("无待写入修改。", "warn");
      return;
    }

    const typeChanged = pending.some((item) => /^PRX\d_TYPE$/.test(item.key));
    setStatus("正在写入 " + pending.length + " 个参数…", "warn");
    let sent = 0;
    for (const item of pending) {
      try {
        const ok = await window.sendParamSet(item.key, item.value);
        if (ok) {
          sent += 1;
          if (window.params instanceof Map) window.params.set(item.key, Number(item.value));
        }
      } catch (_) {
        // ignore
      }
      await new Promise((resolve) => setTimeout(resolve, 40));
    }

    await probeParams();

    let verified = 0;
    pending.forEach((item) => {
      const live = getParamNum(item.key);
      if (live != null && valuesClose(live, item.value)) {
        state.drafts.delete(item.key);
        verified += 1;
      }
    });
    persistDrafts();
    state.lastSyncMs = Date.now();

    let msg = "已发送 " + sent + "/" + pending.length + "，回读确认 " + verified + "/" + pending.length + "。";
    if (typeChanged) msg += " 修改 PRX_TYPE 后可能需要重启飞控。";
    setStatus(verified === pending.length ? msg : msg + " 未确认项已保留为待写入。", verified === pending.length ? "ok" : "warn");
    render(true);
  }

  function restoreDefaults() {
    Object.entries(DEFAULTS).forEach(([key, value]) => setDraftValue(key, value));
    setStatus("推荐默认值已暂存本地，写入飞控后生效。", "warn");
    render(true);
  }

  function setStatus(text, tone) {
    const node = el("radar-write-status");
    const inline = el("radar-action-status");
    const className = "radar-write-status" + (tone ? " is-" + tone : "");
    if (node) {
      node.textContent = text;
      node.className = className;
    }
    if (inline) {
      inline.textContent = text;
      inline.className = "radar-action-status" + (tone ? " is-" + tone : "");
    }
  }

  function bindInstanceTabs() {
    el("radar-instance-tabs")?.querySelectorAll("[data-instance]").forEach((btn) => {
      if (btn.dataset.bound === "1") return;
      btn.dataset.bound = "1";
      btn.addEventListener("click", () => {
        const inst = Number(btn.getAttribute("data-instance"));
        if (!Number.isFinite(inst)) return;
        state.activeInstance = inst;
        state.selectedSectorSlot = null;
        render(true);
      });
    });
  }

  function bindOrientButtons() {
    const setOrient = (value) => {
      setDraftValue(paramKey("ORIENT"), value);
      updateDirtyUi();
      render(true);
    };
    el("radar-orient-up")?.addEventListener("click", () => setOrient(0));
    el("radar-orient-down")?.addEventListener("click", () => setOrient(1));
  }

  function bindYawPresets() {
    document.querySelectorAll(".radar-yaw-preset").forEach((btn) => {
      if (btn.dataset.bound === "1") return;
      btn.dataset.bound = "1";
      btn.addEventListener("click", () => {
        const yaw = Number(btn.getAttribute("data-yaw"));
        if (!Number.isFinite(yaw)) return;
        setDraftValue(paramKey("YAW_CORR"), yaw);
        updateDirtyUi();
        render(true);
      });
    });
  }

  function bindRangeControls() {
    const maxSlider = el("radar-max-dist");
    const minSlider = el("radar-min-dist");
    if (maxSlider && maxSlider.dataset.delegated !== "1") {
      maxSlider.dataset.delegated = "1";
      maxSlider.addEventListener("input", () => {
        const key = paramKey("MAX");
        const value = Number(maxSlider.value);
        if (!Number.isFinite(value)) return;
        setDraftValue(key, value);
        setText("radar-max-dist-val", value.toFixed(0) + " m");
        updateDirtyUi();
        renderRadarCanvas();
      });
    }
    if (minSlider && minSlider.dataset.delegated !== "1") {
      minSlider.dataset.delegated = "1";
      minSlider.addEventListener("input", () => {
        const key = paramKey("MIN");
        const value = Number(minSlider.value);
        if (!Number.isFinite(value)) return;
        setDraftValue(key, value);
        setText("radar-min-dist-val", value.toFixed(1) + " m");
        updateDirtyUi();
        renderRadarCanvas();
      });
    }
  }

  function bindSliders() {
    const map = [
      ["radar-prx-filt", "PRX_FILT", "radar-prx-filt-val", (v) => v.toFixed(0) + " Hz"],
      ["radar-prx-alt-min", "PRX_ALT_MIN", "radar-prx-alt-min-val", (v) => v.toFixed(1) + " m"],
      ["radar-safety-margin", "AVOID_MARGIN", "radar-safety-margin-val", (v) => v.toFixed(1) + " m"],
      ["radar-brake-dist", "AVOID_DIST_MAX", "radar-brake-dist-val", (v) => v.toFixed(1) + " m"],
    ];
    map.forEach(([id, key, valId, fmt]) => {
      const input = el(id);
      if (!input || input.dataset.bound === "1") return;
      input.dataset.bound = "1";
      input.addEventListener("input", () => {
        const value = Number(input.value);
        if (!Number.isFinite(value)) return;
        setDraftValue(key, value);
        setText(valId, fmt(value));
        updateDirtyUi();
      });
    });
  }

  function bindSwitches() {
    const bind = (id, handler) => {
      const input = el(id);
      if (!input || input.dataset.bound === "1") return;
      input.dataset.bound = "1";
      input.addEventListener("change", () => handler(input.checked));
    };

    bind("radar-sw-avoid", (checked) => {
      writeAvoidEnableBit(1, checked);
      updateDirtyUi();
    });
    bind("radar-sw-detour", (checked) => {
      setDraftValue("OA_TYPE", checked ? 1 : 0);
      updateDirtyUi();
    });
    bind("radar-sw-brake", (checked) => {
      setDraftValue("AVOID_BEHAVE", checked ? 1 : 0);
      updateDirtyUi();
    });
    bind("radar-sw-database", (checked) => {
      setDraftValue("OA_DB_SIZE", checked ? DEFAULTS.OA_DB_SIZE : 0);
      updateDirtyUi();
    });
    bind("radar-global-log", (checked) => {
      setDraftValue("PRX_LOG_RAW", checked ? 1 : 0);
      updateDirtyUi();
    });
    bind("radar-global-ground", (checked) => {
      setDraftValue("PRX_IGN_GND", checked ? 1 : 0);
      updateDirtyUi();
    });
  }

  function bindFields() {
    const typeSelect = el("radar-device-type");
    if (typeSelect && typeSelect.dataset.bound !== "1") {
      typeSelect.dataset.bound = "1";
      typeSelect.addEventListener("change", () => {
        setDraftValue(paramKey("TYPE"), Number(typeSelect.value));
        updateDirtyUi();
        render(true);
      });
    }

    const oaSelect = el("radar-oa-db-output");
    if (oaSelect && oaSelect.dataset.bound !== "1") {
      oaSelect.dataset.bound = "1";
      oaSelect.addEventListener("change", () => {
        setDraftValue("OA_DB_OUTPUT", Number(oaSelect.value));
        updateDirtyUi();
      });
    }

    ["radar-addr", "radar-recv-id", "radar-yaw-corr"].forEach((id) => {
      const input = el(id);
      if (!input || input.dataset.bound === "1") return;
      input.dataset.bound = "1";
      input.addEventListener("input", () => {
        const key = input.getAttribute("data-param-key");
        if (!key) return;
        setDraftValue(key, Number(input.value));
        updateDirtyUi();
      });
    });
  }

  function bindSectorInteraction() {
    const svg = el("radar-live-svg");
    const wrap = el("radar-canvas-wrap");
    if (!svg || !wrap || wrap.dataset.sectorBound === "1") return;
    wrap.dataset.sectorBound = "1";

    const onPointerDown = (event) => {
      if (!SCAN_TYPES.has(getActiveType())) return;
      const target = event.target;
      const slot = Number(target.getAttribute("data-sector-slot"));
      if (!Number.isFinite(slot)) return;
      event.preventDefault();
      state.selectedSectorSlot = slot;
      const { ang, wid } = getSectorData(slot);
      state.sectorDrag = {
        slot,
        startAng: ang,
        startWid: wid || 30,
        pointerId: event.pointerId,
      };
      try { target.setPointerCapture(event.pointerId); } catch (_) { /* ignore */ }
      renderRadarCanvas();
    };

    const onPointerMove = (event) => {
      if (!state.sectorDrag || state.sectorDrag.pointerId !== event.pointerId) return;
      const { slot, startWid } = state.sectorDrag;
      const angle = canvasToPolarAngle(event.clientX, event.clientY, svg);
      const wid = startWid || getSectorData(slot).wid || 30;
      setSectorData(slot, angle, wid);
      updateDirtyUi();
      renderRadarCanvas();
    };

    const onPointerUp = (event) => {
      if (!state.sectorDrag || state.sectorDrag.pointerId !== event.pointerId) return;
      state.sectorDrag = null;
      updateDirtyUi();
    };

    const onWheel = (event) => {
      if (!SCAN_TYPES.has(getActiveType())) return;
      if (!state.selectedSectorSlot) return;
      event.preventDefault();
      const slot = state.selectedSectorSlot;
      const { ang, wid } = getSectorData(slot);
      const next = Math.max(0, Math.min(127, (wid || 0) + (event.deltaY > 0 ? -2 : 2)));
      setSectorData(slot, ang, next);
      updateDirtyUi();
      renderRadarCanvas();
    };

    const onDblClick = (event) => {
      if (!SCAN_TYPES.has(getActiveType())) return;
      const slot = state.selectedSectorSlot || 1;
      const angle = canvasToPolarAngle(event.clientX, event.clientY, svg);
      const { wid } = getSectorData(slot);
      setSectorData(slot, angle, wid > 0 ? wid : 30);
      state.selectedSectorSlot = slot;
      updateDirtyUi();
      renderRadarCanvas();
    };

    svg.addEventListener("pointerdown", onPointerDown);
    svg.addEventListener("pointermove", onPointerMove);
    svg.addEventListener("pointerup", onPointerUp);
    svg.addEventListener("pointercancel", onPointerUp);
    wrap.addEventListener("wheel", onWheel, { passive: false });
    svg.addEventListener("dblclick", onDblClick);

    el("radar-sector-readout")?.addEventListener("click", (event) => {
      const btn = event.target.closest("[data-sector-slot]");
      if (!btn) return;
      state.selectedSectorSlot = Number(btn.getAttribute("data-sector-slot"));
      renderRadarCanvas();
    });
  }

  function bindTableSort() {
    document.querySelectorAll("#radar-obstacle-table th[data-sort]").forEach((th) => {
      if (th.dataset.bound === "1") return;
      th.dataset.bound = "1";
      th.addEventListener("click", () => {
        const key = th.getAttribute("data-sort");
        if (state.sortKey === key) state.sortAsc = !state.sortAsc;
        else {
          state.sortKey = key;
          state.sortAsc = true;
        }
        renderObstacleTable();
      });
    });
  }

  function setLiveExpanded(expanded) {
    state.liveExpanded = !!expanded;
    const body = document.querySelector("#setup-panel-radar .radar-body");
    const btn = el("radar-expand-btn");
    if (body) body.classList.toggle("is-radar-expanded", state.liveExpanded);
    if (btn) {
      btn.textContent = state.liveExpanded ? "缩小" : "放大";
      btn.classList.toggle("is-active", state.liveExpanded);
      btn.title = state.liveExpanded ? "恢复默认布局" : "放大雷达图占满显示区";
    }
  }

  function bindExpandToggle() {
    const btn = el("radar-expand-btn");
    if (!btn || btn.dataset.bound === "1") return;
    btn.dataset.bound = "1";
    btn.addEventListener("click", () => {
      setLiveExpanded(!state.liveExpanded);
    });
  }

  function bindToolbar() {
    el("radar-read-btn")?.addEventListener("click", () => {
      readFromVehicle().catch((err) => {
        setStatus("读取失败：" + (err?.message || String(err)), "bad");
      });
    });
    el("radar-write-btn")?.addEventListener("click", () => {
      writeToVehicle().catch((err) => {
        setStatus("写入失败：" + (err?.message || String(err)), "bad");
      });
    });
    el("radar-refresh-btn")?.addEventListener("click", () => {
      readFromVehicle().catch((err) => {
        setStatus("刷新失败：" + (err?.message || String(err)), "bad");
      });
    });
    el("radar-reset-btn")?.addEventListener("click", () => restoreDefaults());
  }

  function bindAll() {
    bindToolbar();
    bindExpandToggle();
    bindInstanceTabs();
    bindOrientButtons();
    bindYawPresets();
    bindRangeControls();
    bindSliders();
    bindSwitches();
    bindFields();
    bindSectorInteraction();
    bindTableSort();
  }

  function startLiveLoop() {
    if (state.animFrame) return;
    const tick = () => {
      syncPanelActiveFromDom();
      if (state.panelActive) {
        if (typeof window.republishProximityTelemetry === "function") {
          window.republishProximityTelemetry();
        }
        renderRadarCanvas();
        renderObstacleTable();
        const device = getDeviceStatus();
        setText("radar-live-rate", getLiveRateLabel(device));
        const connChip = el("radar-conn-chip");
        if (connChip) {
          connChip.textContent = fcConnected() ? "链路已连接" : "链路未连接";
          connChip.className = "radar-tag " + (fcConnected() ? "is-good" : "is-bad");
        }
        const badge = el("radar-device-badge");
        if (badge) {
          badge.textContent = device.statusLabel;
          badge.className = "radar-badge " + device.statusClass;
        }
        updateDirtyUi();
        if (fcConnected() && !device.fresh) {
          const lastMs = getTelemetryLastUpdateMs();
          if (!lastMs || Date.now() - lastMs > 3000) {
            const now = Date.now();
            if (!state.lastProximityReqMs || now - state.lastProximityReqMs > 5000) {
              state.lastProximityReqMs = now;
              if (typeof window.requestProximityTelemetryStreams === "function") {
                window.requestProximityTelemetryStreams({ quiet: true }).catch(() => {});
              }
            }
          }
        }
      }
      state.animFrame = window.requestAnimationFrame(tick);
    };
    state.animFrame = window.requestAnimationFrame(tick);
  }

  async function activatePanel() {
    syncPanelActiveFromDom();
    if (typeof window.reconcileConnectionUiState === "function") {
      window.reconcileConnectionUiState("radar-panel");
    }
    if (typeof window.requestProximityTelemetryStreams === "function") {
      window.requestProximityTelemetryStreams().catch(() => {});
    }
    if (getParamsMap()?.size) {
      reconcileDraftsWithParams();
      state.lastSyncMs = Date.now();
    }
    await probeParams({ quiet: true });
    render(true);
  }

  function mount() {
    if (!el("setup-panel-radar")) return;
    state.mounted = true;
    loadDrafts();
    if (getParamsMap()?.size) reconcileDraftsWithParams();
    bindAll();
    syncPanelActiveFromDom();

    window.addEventListener("gcs:setup-panel-changed", (event) => {
      syncPanelActiveFromDom();
      const active = event.detail?.panel === RADAR_PANEL;
      state.panelActive = active;
      if (active) activatePanel().catch(() => render(true));
      else render(true);
    });

    document.addEventListener("gcs-connection", (event) => {
      const disconnected = event.detail && event.detail.state === "disconnected";
      if (disconnected && typeof window.clearProximityTelemetry === "function") {
        window.clearProximityTelemetry();
      }
      if (event.detail && event.detail.state === "connected") {
        if (typeof window.requestProximityTelemetryStreams === "function") {
          window.requestProximityTelemetryStreams({ quiet: true }).catch(() => {});
        }
        if (syncPanelActiveFromDom()) {
          probeParams({ quiet: true }).finally(() => render(true));
          return;
        }
      }
      render(true);
    });

    document.addEventListener("gcs-radar-telemetry", () => {
      if (!syncPanelActiveFromDom()) return;
      renderRadarCanvas();
      renderObstacleTable();
      const device = getDeviceStatus();
      const connChip = el("radar-conn-chip");
      if (connChip) {
        connChip.textContent = fcConnected() ? "链路已连接" : "链路未连接";
        connChip.className = "radar-tag " + (fcConnected() ? "is-good" : "is-bad");
      }
      const badge = el("radar-device-badge");
      if (badge) {
        badge.textContent = device.statusLabel;
        badge.className = "radar-badge " + device.statusClass;
      }
      setText("radar-live-rate", getLiveRateLabel(device));
    });

    document.addEventListener("gcs-sensor-overview-changed", () => {
      if (!syncPanelActiveFromDom()) return;
      reconcileDraftsWithParams();
      render(true);
    });

    document.addEventListener("gcs-airframe-params-changed", () => {
      if (!syncPanelActiveFromDom()) return;
      reconcileDraftsWithParams();
      state.lastSyncMs = Date.now();
      render(true);
    });

    startLiveLoop();

    syncPanelActiveFromDom();
    if (state.panelActive) {
      activatePanel().catch(() => render(true));
    } else {
      render(true);
    }
  }

  window.radarSetupRender = render;

  if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
