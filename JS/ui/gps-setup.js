(function initGpsSetup() {
  const GPS_PANEL = "params";
  const RTK_PANEL = "rtk";
  const STORAGE_KEY = "gcs-gps-drafts-v1";
  const EPS = 1e-5;
  const TELEMETRY_STALE_MS = 3000;

  function fieldLabel(zh, en) {
    return (
      '<span class="gps-field-label">' +
        '<span class="gps-field-label-zh">' + zh + "</span>" +
        '<span class="gps-field-label-en">' + en + "</span>" +
      "</span>"
    );
  }

  function chipLabel(zh, en) {
    return (
      '<span class="gps-chip-label">' +
        '<span class="gps-chip-label-zh">' + zh + "</span>" +
        '<span class="gps-chip-label-en">' + en + "</span>" +
      "</span>"
    );
  }

  const INSTANCE_KEYS = {
    0: [
      "GPS_TYPE",
      "GPS_RATE_MS",
      "GPS_GNSS_MODE",
      "GPS_HDOP_GOOD",
      "GPS_MIN_SATS",
      "GPS_AUTO_CONFIG",
      "GPS_SBAS_MODE",
    ],
    1: [
      "GPS_TYPE2",
      "GPS_RATE_MS2",
      "GPS_GNSS_MODE2",
      "GPS_HDOP_GOOD",
      "GPS_MIN_SATS",
      "GPS_AUTO_CONFIG",
      "GPS_SBAS_MODE",
    ],
  };

  const OFFSET_KEYS = [
    "GPS_POS1_X",
    "GPS_POS1_Y",
    "GPS_POS1_Z",
    "GPS_POS2_X",
    "GPS_POS2_Y",
    "GPS_POS2_Z",
  ];

  const BLEND_KEYS = [
    "GPS_AUTO_SWITCH",
    "GPS_PRIMARY",
    "GPS_INJECT_TO",
    "GPS_BLEND_MASK",
  ];

  const ADVANCED_KEYS = [
    "GPS_NAVFILTER",
    "GPS_SAVE_CFG",
    "GPS_DRV_OPTIONS",
  ];

  // ArduPilot 4.6+ renamed several GPS params (GPS1_TYPE, GPS1_RATE_MS, …).
  const PARAM_ALIASES = {
    GPS_TYPE: ["GPS1_TYPE", "GPS_TYPE"],
    GPS_TYPE2: ["GPS2_TYPE", "GPS_TYPE2"],
    GPS_RATE_MS: ["GPS1_RATE_MS", "GPS_RATE_MS"],
    GPS_RATE_MS2: ["GPS2_RATE_MS", "GPS_RATE_MS2"],
    GPS_GNSS_MODE: ["GPS1_GNSS_MODE", "GPS_GNSS_MODE"],
    GPS_GNSS_MODE2: ["GPS2_GNSS_MODE", "GPS_GNSS_MODE2"],
    GPS_POS1_X: ["GPS1_POS_X", "GPS_POS1_X"],
    GPS_POS1_Y: ["GPS1_POS_Y", "GPS_POS1_Y"],
    GPS_POS1_Z: ["GPS1_POS_Z", "GPS_POS1_Z"],
    GPS_POS2_X: ["GPS2_POS_X", "GPS_POS2_X"],
    GPS_POS2_Y: ["GPS2_POS_Y", "GPS_POS2_Y"],
    GPS_POS2_Z: ["GPS2_POS_Z", "GPS_POS2_Z"],
  };

  const ALL_PARAM_KEYS = [
    ...INSTANCE_KEYS[0],
    ...INSTANCE_KEYS[1],
    ...OFFSET_KEYS,
    ...BLEND_KEYS,
    ...ADVANCED_KEYS,
  ];

  const DEFAULTS = {
    GPS_TYPE: 1,
    GPS_TYPE2: 0,
    GPS_RATE_MS: 200,
    GPS_RATE_MS2: 200,
    GPS_GNSS_MODE: 67,
    GPS_GNSS_MODE2: 67,
    GPS_HDOP_GOOD: 140,
    GPS_MIN_SATS: 6,
    GPS_AUTO_CONFIG: 1,
    GPS_SBAS_MODE: 1,
    GPS_AUTO_SWITCH: 1,
    GPS_PRIMARY: 0,
    GPS_INJECT_TO: 127,
    GPS_BLEND_MASK: 7,
    GPS_NAVFILTER: 8,
    GPS_SAVE_CFG: 2,
    GPS_DRV_OPTIONS: 0,
    GPS_POS1_X: 0,
    GPS_POS1_Y: 0,
    GPS_POS1_Z: 0,
    GPS_POS2_X: 0,
    GPS_POS2_Y: 0,
    GPS_POS2_Z: 0,
  };

  const PARAM_ID_MAP = {
    "gps-type-0": "GPS_TYPE",
    "gps-type-1": "GPS_TYPE2",
    "gps-rate-0": "GPS_RATE_MS",
    "gps-rate-1": "GPS_RATE_MS2",
    "gps-hdop-good": "GPS_HDOP_GOOD",
    "gps-hdop-good-1": "GPS_HDOP_GOOD",
    "gps-min-sats": "GPS_MIN_SATS",
    "gps-min-sats-1": "GPS_MIN_SATS",
    "gps-auto-config": "GPS_AUTO_CONFIG",
    "gps-auto-config-1": "GPS_AUTO_CONFIG",
    "gps-sbas-mode": "GPS_SBAS_MODE",
    "gps-sbas-mode-1": "GPS_SBAS_MODE",
    "gps-pos1-x": "GPS_POS1_X",
    "gps-pos1-y": "GPS_POS1_Y",
    "gps-pos1-z": "GPS_POS1_Z",
    "gps-pos2-x": "GPS_POS2_X",
    "gps-pos2-y": "GPS_POS2_Y",
    "gps-pos2-z": "GPS_POS2_Z",
    "gps-auto-switch": "GPS_AUTO_SWITCH",
    "gps-primary": "GPS_PRIMARY",
    "gps-inject-to": "GPS_INJECT_TO",
    "gps-navfilter": "GPS_NAVFILTER",
    "gps-save-cfg": "GPS_SAVE_CFG",
  };

  const TYPE_OPTIONS = [
    { value: 0, label: "禁用" },
    { value: 1, label: "自动" },
    { value: 2, label: "u-blox" },
    { value: 5, label: "NMEA" },
    { value: 9, label: "DroneCAN" },
    { value: 17, label: "uBlox 基站" },
    { value: 18, label: "uBlox 流动站" },
    { value: 22, label: "DroneCAN 基站" },
    { value: 23, label: "DroneCAN 流动站" },
    { value: 26, label: "SBF 双天线" },
  ];

  const RATE_OPTIONS = [
    { value: 200, label: "5 Hz (200 ms)" },
    { value: 125, label: "8 Hz (125 ms)" },
    { value: 100, label: "10 Hz (100 ms)" },
    { value: 50, label: "20 Hz (50 ms)" },
  ];

  const AUTO_CONFIG_OPTIONS = [
    { value: 0, label: "禁用" },
    { value: 1, label: "启用" },
    { value: 2, label: "启用含 CAN" },
    { value: 3, label: "清除自定义配置" },
  ];

  const SBAS_OPTIONS = [
    { value: 0, label: "禁用" },
    { value: 1, label: "启用" },
    { value: 2, label: "保持接收机设置" },
  ];

  const AUTO_SWITCH_OPTIONS = [
    { value: 0, label: "使用主 GPS" },
    { value: 1, label: "使用最佳" },
    { value: 2, label: "融合" },
    { value: 4, label: "优先主 GPS" },
  ];

  const PRIMARY_OPTIONS = [
    { value: 0, label: "GPS1" },
    { value: 1, label: "GPS2" },
  ];

  const INJECT_OPTIONS = [
    { value: 0, label: "注入 GPS1" },
    { value: 1, label: "注入 GPS2" },
    { value: 127, label: "注入全部" },
  ];

  const SAVE_CFG_OPTIONS = [
    { value: 0, label: "不保存" },
    { value: 1, label: "立即保存" },
    { value: 2, label: "自动" },
  ];

  const NAVFILTER_OPTIONS = [
    { value: 8, label: "便携" },
    { value: 4, label: "静止" },
    { value: 5, label: "步行" },
    { value: 6, label: "车载" },
    { value: 7, label: "海上" },
    { value: 9, label: "机载 1G" },
    { value: 10, label: "机载 2G" },
    { value: 11, label: "机载 4G" },
  ];

  const CONSTELLATIONS = [
    { bit: 0, label: "GPS" },
    { bit: 1, label: "SBAS" },
    { bit: 2, label: "Galileo" },
    { bit: 3, label: "BeiDou" },
    { bit: 4, label: "IMES" },
    { bit: 5, label: "QZSS" },
    { bit: 6, label: "GLONASS" },
  ];

  const BLEND_MASK_OPTIONS = [
    { bit: 0, label: "水平" },
    { bit: 1, label: "垂直" },
    { bit: 2, label: "速度" },
  ];

  const DRV_OPTIONS = [
    { bit: 0, label: "UART2 移动基站", labelEn: "Use UART2 for moving baseline on ublox" },
    { bit: 1, label: "SBF 基站航向", labelEn: "Use base station for GPS yaw on SBF" },
    { bit: 2, label: "115200 波特率", labelEn: "Use baudrate 115200 on ublox" },
    { bit: 3, label: "专用 CAN 基线", labelEn: "Use dedicated CAN port b/w GPSes for moving baseline" },
    { bit: 4, label: "椭球高度", labelEn: "Use ellipsoid height instead of AMSL" },
  ];

  const FIX_LABELS = {
    0: "无 GPS",
    1: "无定位",
    2: "2D 定位",
    3: "3D 定位",
    4: "差分 GPS",
    5: "RTK 浮点",
    6: "RTK 固定",
  };

  const SHARED_FIELD_MIRROR_IDS = {
    GPS_HDOP_GOOD: ["gps-hdop-good", "gps-hdop-good-1"],
    GPS_MIN_SATS: ["gps-min-sats", "gps-min-sats-1"],
    GPS_AUTO_CONFIG: ["gps-auto-config", "gps-auto-config-1"],
    GPS_SBAS_MODE: ["gps-sbas-mode", "gps-sbas-mode-1"],
  };

  function syncMirroredFields(key, value) {
    const ids = SHARED_FIELD_MIRROR_IDS[key];
    if (!ids) return;
    ids.forEach((id) => {
      const node = el(id);
      if (!node || document.activeElement === node) return;
      node.value = String(value);
    });
  }

  const state = {
    mounted: false,
    panelActive: false,
    drafts: new Map(),
    probeGeneration: 0,
    instanceGridSignature: "",
  };

  function el(id) {
    return document.getElementById(id);
  }

  function getParamsMap() {
    return window.params instanceof Map ? window.params : null;
  }

  function fcConnected() {
    return String(window._gcsConnState || "").toLowerCase() === "connected" &&
      typeof window.sendParamSet === "function";
  }

  function valuesClose(a, b) {
    return Math.abs(Number(a) - Number(b)) < EPS;
  }

  function resolveParamKey(key) {
    const aliases = PARAM_ALIASES[key];
    const params = getParamsMap();
    if (aliases && params) {
      for (const name of aliases) {
        if (params.has(name)) return name;
      }
      return aliases[0];
    }
    return key;
  }

  function getParamNum(key) {
    const params = getParamsMap();
    if (!params) return null;
    const aliases = PARAM_ALIASES[key] || [key];
    for (const name of aliases) {
      if (!params.has(name)) continue;
      const numeric = Number(params.get(name));
      if (Number.isFinite(numeric)) return numeric;
    }
    return null;
  }

  function reconcileDraftsWithParams() {
    let changed = false;
    ALL_PARAM_KEYS.forEach((key) => {
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

  function getDraftValue(key) {
    return state.drafts.has(key) ? state.drafts.get(key) : getParamNum(key);
  }

  function persistDrafts() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries(state.drafts.entries())));
    } catch (_) {
      // ignore storage failures
    }
  }

  function loadDrafts() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      Object.entries(parsed || {}).forEach(([key, value]) => {
        const numeric = Number(value);
        if (Number.isFinite(numeric)) {
          state.drafts.set(key, numeric);
        }
      });
    } catch (_) {
      // ignore malformed storage
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

  function clearDraftsForKeys(keys) {
    let changed = false;
    keys.forEach((key) => {
      if (state.drafts.delete(key)) changed = true;
    });
    if (changed) persistDrafts();
  }

  function textOr(id, fallback) {
    return String(el(id)?.textContent || fallback || "").trim();
  }

  function fmt(value, digits, suffix) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return "--";
    return numeric.toFixed(digits) + (suffix || "");
  }

  function fmtLatLon(lat, lon) {
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return "--";
    return lat.toFixed(6) + ", " + lon.toFixed(6);
  }

  function formatAge(ms) {
    if (!Number.isFinite(ms) || ms <= 0) return "--";
    const ageMs = Math.max(0, Date.now() - ms);
    if (ageMs < 1000) return "实时";
    if (ageMs < 60000) return Math.round(ageMs / 1000) + " 秒前";
    return Math.round(ageMs / 60000) + " 分钟前";
  }

  function optionLabel(options, value, fallback) {
    const match = options.find((item) => Number(item.value) === Number(value));
    if (match) return match.label;
    if (fallback) return fallback;
    return String(value);
  }

  function getBitmaskValue(key, options) {
    const raw = Number(getDraftValue(key));
    if (Number.isFinite(raw)) return raw;
    return options.reduce((sum, option) => sum + (1 << option.bit), 0);
  }

  function dopBarWidth(dop) {
    return Number.isFinite(dop) ? Math.max(0, Math.min(100, ((4 - Math.min(dop, 4)) / 4) * 100)) : 0;
  }

  function buildInstanceDopHtml(instance) {
    const hdopW = dopBarWidth(instance.eph);
    const vdopW = dopBarWidth(instance.epv);
    const hdopText = Number.isFinite(instance.eph) ? instance.eph.toFixed(2) : "--";
    const vdopText = Number.isFinite(instance.epv) ? instance.epv.toFixed(2) : "--";
    return (
      '<div class="gps-instance-dop">' +
        '<div class="gps-precision-band">' +
          '<span class="gps-precision-label">HDOP</span>' +
          '<div class="gps-precision-track">' +
            '<span class="gps-instance-hdop-bar gps-precision-fill" style="width:' + hdopW + '%"></span>' +
          "</div>" +
          '<strong class="gps-instance-hdop-val">' + hdopText + "</strong>" +
        "</div>" +
        '<div class="gps-precision-band">' +
          '<span class="gps-precision-label">VDOP</span>' +
          '<div class="gps-precision-track">' +
            '<span class="gps-instance-vdop-bar gps-precision-fill gps-precision-fill--secondary" style="width:' + vdopW + '%"></span>' +
          "</div>" +
          '<strong class="gps-instance-vdop-val">' + vdopText + "</strong>" +
        "</div>" +
      "</div>"
    );
  }

  function updateInstanceDop(card, instance) {
    const hdopBar = card.querySelector(".gps-instance-hdop-bar");
    const vdopBar = card.querySelector(".gps-instance-vdop-bar");
    const hdopVal = card.querySelector(".gps-instance-hdop-val");
    const vdopVal = card.querySelector(".gps-instance-vdop-val");
    if (hdopBar) hdopBar.style.width = dopBarWidth(instance.eph) + "%";
    if (vdopBar) vdopBar.style.width = dopBarWidth(instance.epv) + "%";
    if (hdopVal) hdopVal.textContent = Number.isFinite(instance.eph) ? instance.eph.toFixed(2) : "--";
    if (vdopVal) vdopVal.textContent = Number.isFinite(instance.epv) ? instance.epv.toFixed(2) : "--";
  }

  function getConstellationRxMask(instance) {
    const item = (getTelemetryRoot().instances || [])[instance.index] || {};
    if (Number.isFinite(item.constellationRxMask)) {
      return Number(item.constellationRxMask);
    }
    return 0;
  }

  function buildRxConstellationChips(instance) {
    const mask = getConstellationRxMask(instance);
    const stale = !instance.enabled || !instance.fresh;
    return CONSTELLATIONS.map((item) => {
      const receiving = !stale && (Number(mask) & (1 << item.bit)) !== 0;
      const cls = receiving ? " is-receiving" : "";
      return '<span class="gps-rx-constellation-chip' + cls + '">' + item.label + "</span>";
    }).join("");
  }

  function renderSelect(select, options, value) {
    if (!select) return;
    if (document.activeElement === select) return;

    const current = Number(value);
    let opts = options.slice();
    if (Number.isFinite(current) && !opts.some((item) => Number(item.value) === current)) {
      opts = [{ value: current, label: "类型 " + current }, ...opts];
    }

    const nextValue = Number.isFinite(current) ? String(current) : "";
    if (
      select.dataset.bound === "1" &&
      select.value === nextValue &&
      select.options.length === opts.length
    ) {
      return;
    }

    select.innerHTML = opts.map((option) => {
      return '<option value="' + option.value + '">' + option.label + "</option>";
    }).join("");
    if (Number.isFinite(current)) {
      select.value = nextValue;
    }
  }

  function renderBitmask(host, key, options, value) {
    if (!host) return;
    host.innerHTML = options.map((option) => {
      const checked = (Number(value) & (1 << option.bit)) !== 0 ? " checked" : "";
      const labelHtml = option.labelEn
        ? chipLabel(option.label, option.labelEn)
        : "<span>" + option.label + "</span>";
      return (
        '<label class="gps-check-chip">' +
          '<input type="checkbox" data-mask-key="' + key + '" data-mask-bit="' + option.bit + '"' + checked + ">" +
          labelHtml +
        "</label>"
      );
    }).join("");
  }

  function getFixClass(enabled, fresh, fixType) {
    if (!enabled) return "is-muted";
    if (!fresh) return "is-bad";
    if (fixType >= 6) return "is-good";
    if (fixType >= 5) return "is-warn";
    if (fixType >= 3) return "is-warn";
    return "is-bad";
  }

  function getTelemetryRoot() {
    return window.gpsTelemetry || {};
  }

  function readInstNum(item, key) {
    const value = item[key];
    if (value == null || value === "") return null;
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  }

  function resolveDisplayMetrics(item, fixType) {
    let altM = readInstNum(item, "altM");
    if (fixType < 3 && (altM == null || Math.abs(altM) < 0.001)) altM = null;

    let hAccM = readInstNum(item, "hAccM");
    let vAccM = readInstNum(item, "vAccM");
    const eph = readInstNum(item, "eph");
    const epv = readInstNum(item, "epv");
    if (hAccM == null && eph != null && eph > 0) hAccM = eph * 5;
    if (vAccM == null && epv != null && epv > 0) vAccM = epv * 5;

    return { altM, hAccM, vAccM };
  }

  function getInstances() {
    const telemetry = Array.isArray(getTelemetryRoot().instances)
      ? getTelemetryRoot().instances
      : [{}, {}];

    return [0, 1].map((index) => {
      const item = telemetry[index] || {};
      const typeKey = index === 0 ? "GPS_TYPE" : "GPS_TYPE2";
      const rateKey = index === 0 ? "GPS_RATE_MS" : "GPS_RATE_MS2";
      const gnssKey = index === 0 ? "GPS_GNSS_MODE" : "GPS_GNSS_MODE2";
      const typeValue = Number(getDraftValue(typeKey)) || 0;
      const lastUpdateMs = Number(item.lastUpdateMs) || 0;
      const fresh = lastUpdateMs > 0 && (Date.now() - lastUpdateMs) < TELEMETRY_STALE_MS;
      const enabled = typeValue !== 0;
      const fixType = Number(item.fixType) || 0;
      const gnssMask = getBitmaskValue(gnssKey, CONSTELLATIONS);
      const metrics = resolveDisplayMetrics(item, fixType);

      return {
        index,
        enabled,
        typeKey,
        rateKey,
        gnssKey,
        typeValue,
        typeLabel: optionLabel(TYPE_OPTIONS, typeValue, enabled ? "接收机" : "禁用"),
        fixType,
        fixLabel: FIX_LABELS[fixType] || ("定位 " + fixType),
        statusClass: getFixClass(enabled, fresh, fixType),
        fresh,
        lastUpdateMs,
        sats: Number(item.satellitesVisible) || 0,
        lat: readInstNum(item, "lat"),
        lon: readInstNum(item, "lon"),
        altM: metrics.altM,
        eph: readInstNum(item, "eph"),
        epv: readInstNum(item, "epv"),
        velMps: readInstNum(item, "velMps"),
        hAccM: metrics.hAccM,
        vAccM: metrics.vAccM,
        velAccMps: readInstNum(item, "velAccMps"),
        yawDeg: readInstNum(item, "yawDeg"),
        gnssMask,
      };
    });
  }

  function getRtkSummary(instances) {
    const telemetry = getTelemetryRoot().rtk || {};
    const bestFix = Math.max.apply(null, instances.map((item) => item.fixType || 0));
    let source = String(telemetry.source || "");
    let label = "无 RTK";
    let className = "is-muted";

    if (bestFix >= 6) {
      label = "RTK 固定";
      className = "is-good";
      if (!source) source = "moving";
    } else if (bestFix >= 5) {
      label = "RTK 浮点";
      className = "is-warn";
      if (!source) source = "moving";
    } else if (source === "cors") {
      label = "CORS 就绪";
      className = "is-warn";
    } else if (source === "moving") {
      label = "移动基站";
      className = "is-warn";
    }

    return {
      source: source || "none",
      label,
      className,
      injectLabel: optionLabel(INJECT_OPTIONS, getDraftValue("GPS_INJECT_TO"), "注入"),
      lastCorrectionMs: Number(telemetry.lastCorrectionMs) || 0,
      ageSec: Number(telemetry.ageSec),
      latencyMs: Number(telemetry.latencyMs),
    };
  }

  function setText(id, value) {
    const node = el(id);
    if (node) node.textContent = value;
  }

  function setStatusValue(id, text, className) {
    const node = el(id);
    if (!node) return;
    node.textContent = text;
    node.className = "gps-status-value " + (className || "");
  }

  function renderHeader(instances) {
    const connectionChip = el("gps-conn-chip");

    setText("gps-fw-tag", "固件: " + textOr("ov-fw-version", "等待上报"));
    setText("gps-board-tag", "机型: " + textOr("ov-board-hardware", "等待上报"));

    if (connectionChip) {
      connectionChip.textContent = fcConnected() ? "链路已连接" : "链路未连接";
      connectionChip.className = "gps-chip " + (fcConnected() ? "gps-chip--ok" : "gps-chip--offline");
    }
  }

  function buildRealtimeRows(instance) {
    return [
      ["定位", instance.fixLabel],
      ["经纬度", fmtLatLon(instance.lat, instance.lon)],
      ["高度", fmt(instance.altM, 2, " m")],
      ["速度", fmt(instance.velMps, 2, " m/s")],
      ["水平精度", fmt(instance.hAccM, 3, " m")],
      ["垂直精度", fmt(instance.vAccM, 3, " m")],
      ["速度精度", fmt(instance.velAccMps, 3, " m/s")],
      ["HDOP", Number.isFinite(instance.eph) ? instance.eph.toFixed(2) : "--"],
      ["VDOP", Number.isFinite(instance.epv) ? instance.epv.toFixed(2) : "--"],
      ["航向", Number.isFinite(instance.yawDeg) && instance.yawDeg > 0 ? instance.yawDeg.toFixed(1) + "°" : "--"],
    ];
  }

  function instanceFieldSuffix(index) {
    return index === 0 ? "" : "-" + index;
  }

  function buildSharedReceiverFields(instanceIndex) {
    const suffix = instanceFieldSuffix(instanceIndex);
    return (
      '<label class="gps-field">' + fieldLabel("HDOP 良好阈值", "HDOP Good Threshold") + '<input id="gps-hdop-good' + suffix + '" type="number" step="1"></label>' +
      '<label class="gps-field">' + fieldLabel("最少卫星数", "Min Satellites") + '<input id="gps-min-sats' + suffix + '" type="number" step="1"></label>' +
      '<label class="gps-field">' + fieldLabel("自动配置", "Auto Config") + '<select id="gps-auto-config' + suffix + '"></select></label>' +
      '<label class="gps-field">' + fieldLabel("SBAS", "SBAS") + '<select id="gps-sbas-mode' + suffix + '"></select></label>'
    );
  }

  function buildInstanceCard(instance) {
    const realtimeRows = buildRealtimeRows(instance);
    const freshnessLabel = instance.fresh ? "实时" : "过期";
    const cardTone = instance.statusClass === "is-good"
      ? " is-good"
      : instance.statusClass === "is-warn"
        ? " is-warn"
        : instance.statusClass === "is-bad"
          ? " is-bad"
          : "";

    return (
      '<article class="gps-instance-card' + cardTone + '" data-gps-instance="' + instance.index + '">' +
        '<div class="gps-instance-head">' +
          '<div class="gps-instance-title">' +
            '<span class="gps-instance-eyebrow">GPS #' + (instance.index + 1) + "</span>" +
            '<div class="gps-instance-name">' + instance.typeLabel + "</div>" +
            '<div class="gps-instance-meta">' +
              '<span class="gps-inline-tag">卫星 ' + instance.sats + "</span>" +
              '<span class="gps-inline-tag">' + freshnessLabel + "</span>" +
            "</div>" +
          "</div>" +
          '<div class="gps-head-right">' +
            '<span class="gps-fix-badge ' + instance.statusClass + '">' + instance.fixLabel + "</span>" +
            buildInstanceDopHtml(instance) +
          "</div>" +
        "</div>" +
        '<div class="gps-instance-body">' +
          '<div class="gps-instance-primary-col">' +
            '<div class="gps-real-grid">' +
              '<div class="gps-real-kv-list">' +
              realtimeRows.map((row) => {
                return '<div class="gps-kv"><span>' + row[0] + "</span><strong>" + row[1] + "</strong></div>";
              }).join("") +
              "</div>" +
              '<div class="gps-rx-constellation">' +
                '<div class="gps-rx-constellation-head">接收星座</div>' +
                '<div class="gps-rx-constellation-grid">' + buildRxConstellationChips(instance) + "</div>" +
                '<p class="gps-rx-constellation-note muted">分星座遥测待接入，收到卫星后将高亮显示</p>' +
              "</div>" +
            "</div>" +
            '<div class="gps-instance-actions">' +
              '<button type="button" class="gps-card-action gps-instance-param-btn" data-write-instance="' + instance.index + '">设置参数</button>' +
            "</div>" +
          "</div>" +
          '<div class="gps-fields-grid">' +
            '<label class="gps-field">' + fieldLabel("接收机类型", "Receiver Type") + '<select id="gps-type-' + instance.index + '"></select></label>' +
            '<label class="gps-field">' + fieldLabel("更新频率", "Update Rate") + '<select id="gps-rate-' + instance.index + '"></select></label>' +
            '<div class="gps-field">' +
              fieldLabel("GNSS 模式", "GNSS Mode") +
              '<div id="gps-gnss-' + instance.index + '" class="gps-check-grid"></div>' +
            "</div>" +
            buildSharedReceiverFields(instance.index) +
          "</div>" +
        "</div>" +
      "</article>"
    );
  }

  function buildEmptyGps2Card() {
    const emptyInstance = {
      index: 1,
      enabled: false,
      fresh: false,
      eph: NaN,
      epv: NaN,
      fixType: 0,
      fixLabel: "无 GPS",
      statusClass: "is-muted",
    };

    return (
      '<article class="gps-instance-card" data-gps-instance="1">' +
        '<div class="gps-instance-head">' +
          '<div class="gps-instance-title">' +
            '<span class="gps-instance-eyebrow">GPS #2</span>' +
            '<div class="gps-instance-name">副接收机未启用</div>' +
            '<div class="gps-instance-meta">' +
              '<span class="gps-inline-tag">卫星 0</span>' +
              '<span class="gps-inline-tag">未启用</span>' +
            "</div>" +
          "</div>" +
          '<div class="gps-head-right">' +
            '<span class="gps-fix-badge is-muted">无 GPS</span>' +
            buildInstanceDopHtml(emptyInstance) +
          "</div>" +
        "</div>" +
        '<div class="gps-instance-body">' +
          '<div class="gps-instance-primary-col">' +
            '<div class="gps-real-grid">' +
              '<div class="gps-empty-title">启用 GPS2</div>' +
              '<div class="gps-empty-copy">GPS_TYPE2 为 0。启用后可使用双 GPS 融合、冗余或移动基线航向。</div>' +
            "</div>" +
          "</div>" +
          '<div class="gps-fields-grid">' +
            '<label class="gps-field">' + fieldLabel("接收机类型", "Receiver Type") + '<select id="gps2-enable-type"></select></label>' +
            '<div class="gps-instance-actions">' +
              '<button type="button" id="gps2-enable-btn" class="gps-enable-btn gps-instance-param-btn">启用 GPS2</button>' +
            "</div>" +
          "</div>" +
        "</div>" +
      "</article>"
    );
  }

  function instanceGridSignature(instances) {
    return instances.map((instance) => {
      if (instance.index === 1 && !instance.enabled) return "1:empty";
      return instance.index + ":card";
    }).join("|");
  }

  function applyCardTone(card, statusClass) {
    card.classList.remove("is-good", "is-warn", "is-bad");
    if (statusClass === "is-good") card.classList.add("is-good");
    else if (statusClass === "is-warn") card.classList.add("is-warn");
    else if (statusClass === "is-bad") card.classList.add("is-bad");
  }

  function updateInstanceTelemetry(instances) {
    instances.forEach((instance) => {
      if (instance.index === 1 && !instance.enabled) return;
      const card = document.querySelector('#gps-instance-grid [data-gps-instance="' + instance.index + '"]');
      if (!card) return;

      applyCardTone(card, instance.statusClass);

      const name = card.querySelector(".gps-instance-name");
      if (name) name.textContent = instance.typeLabel;

      const meta = card.querySelector(".gps-instance-meta");
      if (meta) {
        meta.innerHTML =
          '<span class="gps-inline-tag">卫星 ' + instance.sats + "</span>" +
          '<span class="gps-inline-tag">' + (instance.fresh ? "实时" : "过期") + "</span>";
      }

      const badge = card.querySelector(".gps-fix-badge");
      if (badge) {
        badge.textContent = instance.fixLabel;
        badge.className = "gps-fix-badge " + instance.statusClass;
      }

      const signal = card.querySelector(".gps-instance-dop");
      if (signal) updateInstanceDop(card, instance);

      const kvList = card.querySelector(".gps-real-kv-list");
      if (kvList) {
        kvList.innerHTML = buildRealtimeRows(instance).map((row) => {
          return '<div class="gps-kv"><span>' + row[0] + "</span><strong>" + row[1] + "</strong></div>";
        }).join("");
      }

      const rxGrid = card.querySelector(".gps-rx-constellation-grid");
      if (rxGrid) rxGrid.innerHTML = buildRxConstellationChips(instance);
    });
  }

  function bindInstanceCardActions(host) {
    const gps2EnableBtn = host.querySelector("#gps2-enable-btn");
    if (gps2EnableBtn && gps2EnableBtn.dataset.bound !== "1") {
      gps2EnableBtn.dataset.bound = "1";
      gps2EnableBtn.addEventListener("click", () => {
        const nextType = Number(el("gps2-enable-type")?.value || 9);
        setDraftValue("GPS_TYPE2", nextType);
        render(true);
      });
    }

    host.querySelectorAll("[data-write-instance]").forEach((button) => {
      if (button.dataset.bound === "1") return;
      button.dataset.bound = "1";
      button.addEventListener("click", () => {
        const instanceIndex = Number(button.getAttribute("data-write-instance"));
        writeKeys(INSTANCE_KEYS[instanceIndex] || [], instanceIndex === 0 ? "GPS1" : "GPS2");
      });
    });
  }

  function renderInstanceControls(instances) {
    instances.forEach((instance) => {
      if (!instance.enabled && instance.index === 1) return;
      renderSelect(el("gps-type-" + instance.index), TYPE_OPTIONS, getDraftValue(instance.typeKey));
      renderSelect(el("gps-rate-" + instance.index), RATE_OPTIONS, getDraftValue(instance.rateKey));
      renderBitmask(el("gps-gnss-" + instance.index), instance.gnssKey, CONSTELLATIONS, instance.gnssMask);
    });

    [0, 1].forEach((index) => {
      if (index === 1 && !instances.find((item) => item.index === 1 && item.enabled)) return;
      const suffix = instanceFieldSuffix(index);
      renderSelect(el("gps-auto-config" + suffix), AUTO_CONFIG_OPTIONS, getDraftValue("GPS_AUTO_CONFIG"));
      renderSelect(el("gps-sbas-mode" + suffix), SBAS_OPTIONS, getDraftValue("GPS_SBAS_MODE"));
      const hdopInput = el("gps-hdop-good" + suffix);
      const minSatsInput = el("gps-min-sats" + suffix);
      if (hdopInput) hdopInput.value = String(Number(getDraftValue("GPS_HDOP_GOOD")) || DEFAULTS.GPS_HDOP_GOOD);
      if (minSatsInput) minSatsInput.value = String(Number(getDraftValue("GPS_MIN_SATS")) || DEFAULTS.GPS_MIN_SATS);
    });

    const gps2Enable = el("gps2-enable-type");
    if (gps2Enable) {
      renderSelect(gps2Enable, TYPE_OPTIONS.filter((item) => item.value !== 0), 9);
    }
  }

  function renderInstances(instances, options) {
    const host = el("gps-instance-grid");
    if (!host) return;

    const forceRebuild = !!(options && options.forceRebuild);
    const signature = instanceGridSignature(instances);
    if (forceRebuild || signature !== state.instanceGridSignature) {
      state.instanceGridSignature = signature;
      const html = instances.map((instance) => {
        if (instance.index === 1 && !instance.enabled) {
          return buildEmptyGps2Card();
        }
        return buildInstanceCard(instance);
      }).join("");

      host.innerHTML = html;
      bindInstanceCardActions(host);
      bindDynamicControls();
    }

    renderInstanceControls(instances);
    updateInstanceTelemetry(instances);
  }

  async function probeGpsParams() {
    if (!fcConnected() || typeof window.requestParamByName !== "function") return;

    const gen = ++state.probeGeneration;
    const names = [];
    ALL_PARAM_KEYS.forEach((key) => {
      const resolved = resolveParamKey(key);
      if (!names.includes(resolved)) names.push(resolved);
    });

    for (const name of names) {
      if (gen !== state.probeGeneration) return;
      await window.requestParamByName(name).catch(() => {});
      await new Promise((resolve) => setTimeout(resolve, 35));
    }

    reconcileDraftsWithParams();
  }

  function renderLowerCards() {
    OFFSET_KEYS.forEach((key) => {
      const selector = document.querySelector('[data-param-key="' + key + '"]');
      if (selector) {
        selector.value = String(Number(getDraftValue(key)) || 0);
      }
    });

    renderSelect(el("gps-auto-switch"), AUTO_SWITCH_OPTIONS, getDraftValue("GPS_AUTO_SWITCH"));
    renderSelect(el("gps-primary"), PRIMARY_OPTIONS, getDraftValue("GPS_PRIMARY"));
    renderSelect(el("gps-inject-to"), INJECT_OPTIONS, getDraftValue("GPS_INJECT_TO"));
    renderSelect(el("gps-navfilter"), NAVFILTER_OPTIONS, getDraftValue("GPS_NAVFILTER"));
    renderSelect(el("gps-save-cfg"), SAVE_CFG_OPTIONS, getDraftValue("GPS_SAVE_CFG"));
    renderBitmask(el("gps-blend-mask"), "GPS_BLEND_MASK", BLEND_MASK_OPTIONS, getBitmaskValue("GPS_BLEND_MASK", BLEND_MASK_OPTIONS));
    renderBitmask(el("gps-drv-options"), "GPS_DRV_OPTIONS", DRV_OPTIONS, getBitmaskValue("GPS_DRV_OPTIONS", DRV_OPTIONS));
  }

  function renderRail(instances) {
    const rtk = getRtkSummary(instances);
    const lastAge = rtk.ageSec != null && Number.isFinite(rtk.ageSec)
      ? String(rtk.ageSec) + " 秒"
      : "--";
    const latency = rtk.latencyMs != null && Number.isFinite(rtk.latencyMs)
      ? String(rtk.latencyMs) + " ms"
      : "--";

    setText("gps-rtk-source", rtk.label);
    setText("gps-rtk-inject", rtk.injectLabel);
    setText("gps-rtk-last", rtk.lastCorrectionMs ? formatAge(rtk.lastCorrectionMs) : "--");
    setText("gps-rtk-age", lastAge + " / " + latency);
  }

  function updateFieldDirtyStyles() {
    document.querySelectorAll("#setup-panel-params input, #setup-panel-params select").forEach((node) => {
      const key = node.getAttribute("data-param-key") || PARAM_ID_MAP[node.id];
      if (!key) return;
      node.classList.toggle("gps-field-dirty", state.drafts.has(key));
    });
  }

  function updateDirtyUi() {
    updateFieldDirtyStyles();
  }

  function refreshRequestedParams(keys) {
    if (typeof window.requestParamByName !== "function") return Promise.resolve();
    return keys.reduce((promise, key) => {
      return promise.then(() => window.requestParamByName(resolveParamKey(key)).catch(() => {}));
    }, Promise.resolve());
  }

  async function writeKeys(keys, label) {
    const status = el("gps-write-status");
    const pending = keys
      .filter((key) => state.drafts.has(key))
      .map((key) => ({ key, value: state.drafts.get(key) }));

    if (!fcConnected()) {
      if (status) {
        status.textContent = "飞控未连接，无法写入。";
        status.className = "muted gps-write-status is-bad";
      }
      return;
    }

    if (!pending.length) {
      if (status) {
        status.textContent = label + "：无待写入修改。";
        status.className = "muted gps-write-status";
      }
      return;
    }

    if (status) {
      status.textContent = label + "：正在写入 " + pending.length + " 个参数…";
      status.className = "muted gps-write-status is-warn";
    }

    let sent = 0;
    for (const item of pending) {
      try {
        const ok = await window.sendParamSet(resolveParamKey(item.key), item.value);
        if (ok) {
          sent += 1;
          if (window.params instanceof Map) {
            window.params.set(resolveParamKey(item.key), Number(item.value));
          }
          state.drafts.delete(item.key);
        }
      } catch (_) {
        // keep aggregate status only
      }
      await new Promise((resolve) => setTimeout(resolve, 40));
    }

    persistDrafts();
    updateDirtyUi();
    await refreshRequestedParams(keys);

    if (status) {
      status.textContent = label + "：已写入 " + sent + "/" + pending.length + " 个参数。";
      status.className = "muted gps-write-status " + (sent === pending.length ? "is-ok" : "is-warn");
    }

    render(true);
  }

  async function refreshParams() {
    state.drafts.clear();
    persistDrafts();
    if (typeof window.loadParams === "function") {
      await window.loadParams({ force: true }).catch(() => {});
    }
    await probeGpsParams();
    render(true);
  }

  function restoreDefaults() {
    Object.entries(DEFAULTS).forEach(([key, value]) => {
      setDraftValue(key, value);
    });
    render(true);
    const status = el("gps-write-status");
    if (status) {
      status.textContent = "推荐默认值已暂存本地，写入飞控后生效。";
      status.className = "muted gps-write-status is-warn";
    }
  }

  function saveLocalOnly() {
    persistDrafts();
    const status = el("gps-write-status");
    if (status) {
      status.textContent = "草稿已保存到本浏览器。";
      status.className = "muted gps-write-status is-ok";
    }
  }

  function toggleSetupPanel(panel) {
    document.querySelectorAll(".ov-panel").forEach((node) => {
      node.classList.toggle("active", node.id === "setup-panel-" + panel);
    });
    window.dispatchEvent(new CustomEvent("gcs:setup-panel-changed", { detail: { panel } }));
  }

  function bindStaticActions() {
    el("gps-open-rtk-btn")?.addEventListener("click", () => toggleSetupPanel(RTK_PANEL));
    el("gps-write-offset-btn")?.addEventListener("click", () => writeKeys(OFFSET_KEYS, "安装偏移"));
    el("gps-write-blend-btn")?.addEventListener("click", () => writeKeys(BLEND_KEYS, "双 GPS 融合"));
    el("gps-write-advanced-btn")?.addEventListener("click", () => writeKeys(ADVANCED_KEYS, "高级参数"));
  }

  function collectBitmaskFromGroup(group) {
    return Array.from(group.querySelectorAll("input[data-mask-bit]")).reduce((sum, input) => {
      return sum + (input.checked ? (1 << Number(input.getAttribute("data-mask-bit"))) : 0);
    }, 0);
  }

  function handleControlDraftChange(key, nextValue) {
    const prevValue = getDraftValue(key);
    const prevEnabled = Number(prevValue) !== 0;
    setDraftValue(key, nextValue);
    syncMirroredFields(key, nextValue);
    updateDirtyUi();

    const isTypeKey = key === "GPS_TYPE" || key === "GPS_TYPE2";
    const nowEnabled = Number(nextValue) !== 0;
    if (isTypeKey && prevEnabled !== nowEnabled) {
      render(true);
      return;
    }

    updateInstanceTelemetry(getInstances());
  }

  function bindDynamicControls() {
    document.querySelectorAll("#setup-panel-params input[type='number']").forEach((input) => {
      if (input.dataset.bound === "1") return;
      input.dataset.bound = "1";
      input.addEventListener("input", () => {
        const key = input.getAttribute("data-param-key") || PARAM_ID_MAP[input.id];
        if (!key) return;
        setDraftValue(key, Number(input.value));
        syncMirroredFields(key, Number(input.value));
        updateDirtyUi();
      });
    });

    document.querySelectorAll("#setup-panel-params select").forEach((select) => {
      if (select.dataset.bound === "1") return;
      select.dataset.bound = "1";
      select.addEventListener("change", () => {
        const key = select.getAttribute("data-param-key") || PARAM_ID_MAP[select.id];
        if (!key) return;
        handleControlDraftChange(key, Number(select.value));
      });
    });

    document.querySelectorAll("#setup-panel-params input[data-mask-bit]").forEach((input) => {
      if (input.dataset.bound === "1") return;
      input.dataset.bound = "1";
      input.addEventListener("change", () => {
        const key = input.getAttribute("data-mask-key");
        const group = input.closest(".gps-check-grid");
        if (!key || !group) return;
        setDraftValue(key, collectBitmaskFromGroup(group));
        updateDirtyUi();
        updateInstanceTelemetry(getInstances());
      });
    });
  }

  function renderTelemetry() {
    if (!state.mounted || !state.panelActive) return;
    const instances = getInstances();
    renderHeader(instances);
    updateInstanceTelemetry(instances);
    renderRail(instances);
  }

  function render(force) {
    if (!state.mounted) return;
    if (!force && !state.panelActive) return;

    const instances = getInstances();
    renderHeader(instances);
    renderInstances(instances, { forceRebuild: !!force });
    renderLowerCards();
    renderRail(instances);
    bindDynamicControls();
    updateDirtyUi();
  }

  async function activatePanel() {
    state.panelActive = true;
    if (typeof window.requestGpsTelemetryStreams === "function") {
      await window.requestGpsTelemetryStreams({ quiet: true }).catch(() => {});
    }
    await probeGpsParams();
    render(true);
  }

  function mount() {
    if (!el("setup-panel-params")) return;

    state.mounted = true;
    loadDrafts();
    bindStaticActions();
    state.panelActive = document.querySelector(".ov-nav-item.active[data-setup-panel='params']") != null;

    window.addEventListener("gcs:setup-panel-changed", (event) => {
      const active = event.detail?.panel === GPS_PANEL;
      state.panelActive = active;
      if (active) {
        activatePanel().catch(() => render(true));
      }
    });

    document.addEventListener("gcs-connection", () => {
      if (!state.panelActive) return;
      activatePanel().catch(() => render(true));
    });
    document.addEventListener("gcs-sensor-overview-changed", (event) => {
      const name = String(event.detail?.name || "");
      if (!state.panelActive || !/^GPS/i.test(name)) return;
      reconcileDraftsWithParams();
      renderInstanceControls(getInstances());
      updateInstanceTelemetry(getInstances());
      renderLowerCards();
      updateDirtyUi();
    });
    setInterval(() => renderTelemetry(), 1000);

    if (state.panelActive) {
      activatePanel().catch(() => render(true));
    } else {
      render(true);
    }
  }

  window.gpsSetupOpenPanel = toggleSetupPanel;
  window.gpsSetupRender = render;
  window.gpsSetupGetDraftValue = getDraftValue;
  window.gpsSetupSetDraftValue = function gpsSetupSetDraftValue(key, value) {
    setDraftValue(key, value);
    render(true);
  };
  window.gpsSetupClearDrafts = clearDraftsForKeys;

  window.addEventListener("DOMContentLoaded", mount);
})();
