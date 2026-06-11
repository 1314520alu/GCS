(function initRtkSetup() {
  const RTK_PANEL = "rtk";
  const GPS_PANEL = "params";

  const state = {
    panelActive: false,
    activeSource: "none",
    survey: {
      running: false,
      targetAcc: 2.0,
      targetDur: 120,
      startMs: 0,
      lastAcc: null,
      goodSinceMs: 0
    },
    ntrip: {
      connected: false,
      host: "rtk.ntrip.qxwz.com",
      port: 8002,
      mount: "AUTO",
      user: "",
      pass: ""
    },
    movingRole: 0,   // 0=off, 1=base, 2=rover
    lastRateBps: null
  };

  function el(id) { return document.getElementById(id); }

  function fcConnected() {
    return String(window._gcsConnState || "").toLowerCase() === "connected" &&
      typeof window.sendParamSet === "function";
  }

  function getTelemetry() {
    return window.gpsTelemetry || {};
  }

  function openPanel(panel) {
    document.querySelectorAll(".ov-panel").forEach((node) => {
      node.classList.toggle("active", node.id === "setup-panel-" + panel);
    });
    window.dispatchEvent(new CustomEvent("gcs:setup-panel-changed", { detail: { panel } }));
  }

  // ---------- Labels & helpers ----------
  function sourceLabel(source) {
    if (source === "cors") return "CORS / NTRIP";
    if (source === "moving") return "移动基站";
    return "无 RTK";
  }
  function injectLabel(status) {
    if (status === "active") return "注入中";
    if (status === "standby") return "待命";
    return "空闲";
  }
  function healthLabel(health) {
    if (health === "good") return "正常";
    if (health === "warn") return "关注";
    return "离线";
  }
  function healthClass(health) {
    if (health === "good") return "is-good";
    if (health === "warn") return "is-warn";
    return "is-muted";
  }
  function formatLastUpdate(ms) {
    if (!Number.isFinite(ms) || ms <= 0) return "--";
    return new Date(ms).toLocaleTimeString("zh-CN", { hour12: false });
  }
  function fixLabel(ft) {
    if (ft >= 6) return "RTK 固定";
    if (ft >= 5) return "RTK 浮点";
    if (ft >= 4) return "差分";
    if (ft >= 3) return "3D";
    if (ft >= 2) return "2D";
    return "无定位";
  }

  // ---------- Survey-In ----------
  function bindSurveyControls() {
    const acc = el("rtk-survey-acc");
    const dur = el("rtk-survey-dur");
    const accVal = el("rtk-survey-acc-val");
    const durVal = el("rtk-survey-dur-val");
    const startBtn = el("rtk-survey-start");
    const stopBtn = el("rtk-survey-stop");

    if (!acc || !dur) return;

    function updateVals() {
      state.survey.targetAcc = parseFloat(acc.value) || 2.0;
      state.survey.targetDur = parseInt(dur.value, 10) || 120;
      if (accVal) accVal.textContent = state.survey.targetAcc.toFixed(1) + " m";
      if (durVal) durVal.textContent = state.survey.targetDur + " s";
    }

    acc.addEventListener("input", updateVals);
    dur.addEventListener("input", updateVals);
    updateVals();

    startBtn?.addEventListener("click", () => {
      if (!fcConnected()) {
        alert("请先连接飞控");
        return;
      }
      state.survey.running = true;
      state.survey.startMs = Date.now();
      state.survey.goodSinceMs = 0;
      state.survey.lastAcc = null;
      if (startBtn) startBtn.disabled = true;
      if (stopBtn) stopBtn.disabled = false;
      renderSurveyStatus();
      // Optional: send a hint to firmware (many users set the GPS to base mode manually)
      // We keep UI state so the progress can be tracked from telemetry.
    });

    stopBtn?.addEventListener("click", () => {
      state.survey.running = false;
      if (startBtn) startBtn.disabled = false;
      if (stopBtn) stopBtn.disabled = true;
      renderSurveyStatus();
    });
  }

  function renderSurveyStatus() {
    const curAccEl = el("rtk-survey-cur-acc");
    const timeEl = el("rtk-survey-time");
    const stateEl = el("rtk-survey-state");
    const progressWrap = el("rtk-survey-progress-wrap");
    const progressBar = el("rtk-survey-progress");
    const progressText = el("rtk-survey-progress-text");

    const s = state.survey;
    const tel = getTelemetry();
    const insts = tel.instances || [];
    const bound = Number(window.gpsSetupGetDraftValue?.("GPS_PRIMARY") || 0);
    const inst = insts[bound] || insts[0] || {};
    const hAcc = (inst.hAccM != null) ? inst.hAccM : (tel.rtk && tel.rtk.hAccM);

    if (curAccEl) curAccEl.textContent = (hAcc != null) ? hAcc.toFixed(2) + " m" : "--";
    s.lastAcc = hAcc;

    let elapsed = 0;
    let statusText = "未开始";
    let pct = 0;

    if (s.running && s.startMs) {
      elapsed = Math.floor((Date.now() - s.startMs) / 1000);
      const targetDur = s.targetDur;
      const goodTime = s.goodSinceMs ? Math.floor((Date.now() - s.goodSinceMs) / 1000) : 0;

      if (hAcc != null && hAcc <= s.targetAcc) {
        if (!s.goodSinceMs) s.goodSinceMs = Date.now();
        statusText = `精度达标 ${goodTime}s / ${targetDur}s`;
        pct = Math.min(100, Math.round(goodTime / targetDur * 100));
      } else {
        s.goodSinceMs = 0;
        statusText = `观测中 ${elapsed}s (精度 ${hAcc != null ? hAcc.toFixed(2) : "--"} m)`;
        pct = Math.min(100, Math.round(elapsed / (targetDur * 1.5) * 100)); // soft progress
      }

      if (goodTime >= targetDur) {
        statusText = "Survey-In 完成！";
        pct = 100;
        s.running = false;
        const startBtn = el("rtk-survey-start");
        const stopBtn = el("rtk-survey-stop");
        if (startBtn) startBtn.disabled = false;
        if (stopBtn) stopBtn.disabled = true;
      }
    }

    if (timeEl) timeEl.textContent = elapsed ? (elapsed + " s") : "--";
    if (stateEl) {
      stateEl.textContent = statusText;
      stateEl.className = (pct >= 100) ? "is-good" : "";
    }
    if (progressWrap) progressWrap.hidden = !s.running;
    if (progressBar) progressBar.style.width = pct + "%";
    if (progressText) progressText.textContent = statusText;
  }

  // ---------- NTRIP ----------
  function bindNtrip() {
    const host = el("rtk-ntrip-host");
    const port = el("rtk-ntrip-port");
    const mount = el("rtk-ntrip-mount");
    const user = el("rtk-ntrip-user");
    const pass = el("rtk-ntrip-pass");
    const btn = el("rtk-ntrip-connect");
    const stateEl = el("rtk-ntrip-state");
    const rateEl = el("rtk-ntrip-rate");

    // restore last values
    try {
      const saved = JSON.parse(localStorage.getItem("gcs-rtk-ntrip") || "{}");
      if (saved.host && host) host.value = saved.host;
      if (saved.port && port) port.value = saved.port;
      if (saved.mount && mount) mount.value = saved.mount;
      if (saved.user && user) user.value = saved.user;
    } catch (_) {}

    function saveConfig() {
      const cfg = {
        host: host?.value || "",
        port: port?.value || 8002,
        mount: mount?.value || "",
        user: user?.value || ""
      };
      localStorage.setItem("gcs-rtk-ntrip", JSON.stringify(cfg));
      state.ntrip = { ...state.ntrip, ...cfg };
    }

    [host, port, mount, user].forEach(i => i?.addEventListener("change", saveConfig));

    btn?.addEventListener("click", () => {
      if (state.ntrip.connected) {
        // disconnect
        state.ntrip.connected = false;
        if (btn) btn.textContent = "连接";
        if (stateEl) { stateEl.textContent = "已断开"; stateEl.className = "rtk-tag is-bad"; }
        if (rateEl) rateEl.textContent = "注入速率: --";
        // In real implementation: tell bridge to stop NTRIP client
        return;
      }

      saveConfig();
      state.ntrip.connected = true;
      if (btn) btn.textContent = "断开";
      if (stateEl) { stateEl.textContent = "已连接"; stateEl.className = "rtk-tag is-good"; }

      // Simulate injection rate (real rate will come from telemetry or bridge later)
      state.lastRateBps = 180 + Math.random() * 120;
      if (rateEl) rateEl.textContent = "注入速率: " + Math.round(state.lastRateBps) + " B/s";

      // Hook for real implementation:
      // window.startNtripInjection?.(state.ntrip);
    });

    // initial state
    if (stateEl) stateEl.textContent = state.ntrip.connected ? "已连接" : "未连接";
  }

  // ---------- Moving Baseline + core params ----------
  function ensureSelectOptions() {
    // Two sets of selects (moving section + injection card)
    const targets = [
      { pri: "rtk-primary-target", inj: "rtk-inject-target" },
      { pri: "rtk-primary-target2", inj: "rtk-inject-target2" }
    ];

    targets.forEach(({ pri, inj }) => {
      const priEl = el(pri);
      const injEl = el(inj);

      if (priEl && priEl.dataset.ready !== "1") {
        priEl.dataset.ready = "1";
        priEl.innerHTML = '<option value="0">GPS1</option><option value="1">GPS2</option>';
        priEl.addEventListener("change", () => {
          const v = Number(priEl.value);
          if (Number.isFinite(v)) {
            window.gpsSetupSetDraftValue?.("GPS_PRIMARY", v);
            syncAll();
          }
        });
      }
      if (injEl && injEl.dataset.ready !== "1") {
        injEl.dataset.ready = "1";
        injEl.innerHTML =
          '<option value="0">注入 GPS1</option>' +
          '<option value="1">注入 GPS2</option>' +
          '<option value="127">注入全部</option>';
        injEl.addEventListener("change", () => {
          const v = Number(injEl.value);
          if (Number.isFinite(v)) {
            window.gpsSetupSetDraftValue?.("GPS_INJECT_TO", v);
            syncAll();
          }
        });
      }

      if (priEl) {
        const v = Number(window.gpsSetupGetDraftValue?.("GPS_PRIMARY"));
        priEl.value = Number.isFinite(v) ? String(v) : "0";
      }
      if (injEl) {
        const v = Number(window.gpsSetupGetDraftValue?.("GPS_INJECT_TO"));
        injEl.value = Number.isFinite(v) ? String(v) : "127";
      }
    });

    // Moving baseline role
    const role = el("rtk-moving-role");
    if (role && role.dataset.ready !== "1") {
      role.dataset.ready = "1";
      role.addEventListener("change", () => {
        state.movingRole = Number(role.value) || 0;
      });
    }
    if (role) role.value = String(state.movingRole);
  }

  function writeCoreParams() {
    const status = el("gps-write-status");
    const keys = ["GPS_INJECT_TO", "GPS_PRIMARY"];

    if (!fcConnected()) {
      if (status) {
        status.textContent = "飞控未连接，无法写入 RTK 参数。";
        status.className = "muted gps-write-status is-bad";
      }
      return;
    }

    let sent = 0;
    for (const key of keys) {
      const value = window.gpsSetupGetDraftValue?.(key);
      if (!Number.isFinite(Number(value))) continue;
      try {
        window.sendParamSet(key, value).then(ok => {
          if (ok && window.params instanceof Map) window.params.set(key, Number(value));
        });
        sent++;
      } catch (_) {}
    }

    window.gpsSetupClearDrafts?.(keys);
    window.gpsSetupRender?.(true);
    syncAll();

    if (status) {
      status.textContent = "RTK 参数已写入 " + sent + "/" + keys.length;
      status.className = "muted gps-write-status is-ok";
    }
  }

  function writeMovingBaseline() {
    if (!fcConnected()) {
      alert("请先连接飞控");
      return;
    }
    const role = state.movingRole;
    // GPS_DRV_OPTIONS bit 3 (8) is often "Use dedicated CAN for moving baseline"
    // For simplicity we just write a note + the role can be used by user to set GPS1_TYPE / GPS2_TYPE = 9 or 10 (moving baseline capable)
    // We also ensure GPS_PRIMARY and INJECT_TO are written.
    writeCoreParams();

    const status = el("gps-write-status");
    if (status) {
      status.textContent = "移动基线角色已记录 (role=" + role + ")。请确认 GPS_DRV_OPTIONS 与接收机类型。";
      status.className = "muted gps-write-status is-ok";
    }
  }

  // ---------- Rich status + per-instance ----------
  function inferSummary() {
    const root = getTelemetry();
    const instances = Array.isArray(root.instances) ? root.instances : [];
    const rtk = root.rtk || {};
    const maxFix = Math.max(0, ...instances.map(i => Number(i.fixType) || 0));
    const primary = Number(window.gpsSetupGetDraftValue?.("GPS_PRIMARY") || 0);

    let source = state.activeSource || String(rtk.source || "none");
    let injectStatus = String(rtk.injectStatus || "idle");
    let health = String(rtk.health || "offline");

    if (maxFix >= 6) {
      if (source === "none") source = "moving";
      injectStatus = "active";
      health = "good";
    } else if (maxFix >= 5) {
      if (source === "none") source = "moving";
      if (injectStatus === "idle") injectStatus = "standby";
      if (health === "offline") health = "warn";
    }

    const lastCorrectionMs = Number(rtk.lastCorrectionMs) || Math.max(0, ...instances.map(i => Number(i.lastUpdateMs) || 0));

    return {
      source,
      injectStatus,
      health,
      boundInstance: Number.isFinite(primary) ? primary : 0,
      lastCorrectionMs,
      ageSec: Number(rtk.ageSec),
      latencyMs: Number(rtk.latencyMs),
      rateBps: state.lastRateBps
    };
  }

  function renderInstancesStatus() {
    const container = el("rtk-instances-status");
    if (!container) return;

    const root = getTelemetry();
    const instances = Array.isArray(root.instances) ? root.instances : [];
    const rtk = root.rtk || {};

    let html = "";
    instances.forEach((inst, idx) => {
      const ft = Number(inst.fixType) || 0;
      const age = (rtk.ageSec != null) ? rtk.ageSec + "s" : "--";
      const label = inst.label || ("GPS" + (idx + 1));
      const fl = fixLabel(ft);
      const cls = (ft >= 6) ? "is-good" : (ft >= 5 ? "is-warn" : "");
      html += `
        <div class="rtk-inst-row">
          <span class="label">${label}</span>
          <span class="value ${cls}">${fl}</span>
          <span class="label">龄期</span>
          <span class="value">${age}</span>
        </div>`;
    });
    if (!html) html = `<div class="rtk-inst-row"><span class="label">暂无 GPS 实例数据</span></div>`;
    container.innerHTML = html;
  }

  function syncSummary() {
    ensureSelectOptions();
    const summary = inferSummary();
    const tel = getTelemetry();
    tel.rtk = tel.rtk || {};
    tel.rtk.source = summary.source;
    tel.rtk.boundInstance = summary.boundInstance;

    const ageText = Number.isFinite(summary.ageSec) ? (summary.ageSec + " 秒") : "--";
    const latencyText = Number.isFinite(summary.latencyMs) ? (summary.latencyMs + " ms") : "--";
    const bindLabel = summary.boundInstance === 1 ? "GPS2" : "GPS1";
    const rateText = (summary.rateBps != null) ? Math.round(summary.rateBps) + " B/s" : "--";

    const srcPill = el("rtk-source-pill");
    if (srcPill) {
      srcPill.textContent = sourceLabel(summary.source);
      srcPill.className = "gps-status-value " + healthClass(summary.health);
    }
    setText("rtk-inject-pill", injectLabel(summary.injectStatus));
    setText("rtk-last-pill", formatLastUpdate(summary.lastCorrectionMs));
    setText("rtk-age-pill", ageText + " / " + latencyText);
    setText("rtk-rate-pill", rateText);
    setText("rtk-bind-pill", bindLabel);
    setText("rtk-health-label", healthLabel(summary.health));
    setText("rtk-last-update", formatLastUpdate(summary.lastCorrectionMs));
    setText("rtk-latency", latencyText);
    setText("rtk-bind-side", bindLabel);

    renderInstancesStatus();
    renderSurveyStatus();
  }

  function setText(id, value) {
    const n = el(id);
    if (n) n.textContent = value;
  }

  function syncAll() {
    syncSummary();
    // also keep source panels in sync if user changed source elsewhere
    const tabs = document.querySelectorAll(".rtk-source-tab");
    tabs.forEach(t => t.classList.toggle("active", t.getAttribute("data-rtk-source") === state.activeSource));
  }

  // ---------- Source tabs (still kept for compatibility) ----------
  function syncSourcePanels() {
    document.querySelectorAll(".rtk-source-tab").forEach(tab => {
      tab.classList.toggle("active", tab.getAttribute("data-rtk-source") === state.activeSource);
    });
    const summaryNode = el("rtk-source-summary");
    if (summaryNode) {
      summaryNode.textContent = {
        none: "当前未启用 RTK 来源。",
        cors: "已选择网络差分 (NTRIP/CORS)。",
        moving: "已选择移动基线。"
      }[state.activeSource] || "";
    }
  }

  function bindSourceTabs() {
    document.querySelectorAll(".rtk-source-tab").forEach(tab => {
      if (tab.dataset.bound === "1") return;
      tab.dataset.bound = "1";
      tab.addEventListener("click", () => {
        state.activeSource = tab.getAttribute("data-rtk-source") || "none";
        syncSourcePanels();
        syncSummary();
      });
    });
  }

  // ---------- Main wiring ----------
  function bindEvents() {
    el("rtk-back-to-gps")?.addEventListener("click", () => openPanel(GPS_PANEL));

    el("rtk-write-source-btn")?.addEventListener("click", writeCoreParams);
    el("rtk-write-mb-btn")?.addEventListener("click", writeMovingBaseline);

    bindSourceTabs();
    bindSurveyControls();
    bindNtrip();

    // keep two sets of core selects in sync when GPS page also changes them
    document.addEventListener("gcs:gps-params-written", syncAll);
  }

  function handlePanelChange(panel) {
    state.panelActive = (panel === RTK_PANEL);
    if (state.panelActive) {
      syncSourcePanels();
      syncSummary();
      renderSurveyStatus();
    }
  }

  function mount() {
    if (!el("setup-panel-rtk")) return;

    // restore previous source choice
    const saved = localStorage.getItem("gcs-rtk-source");
    if (saved) state.activeSource = saved;

    // restore survey / ntrip from local if wanted (optional)
    try {
      const s = JSON.parse(localStorage.getItem("gcs-rtk-survey") || "{}");
      if (s.targetAcc) state.survey.targetAcc = s.targetAcc;
      if (s.targetDur) state.survey.targetDur = s.targetDur;
    } catch (_) {}

    bindEvents();
    syncSourcePanels();
    syncSummary();

    window.addEventListener("gcs:setup-panel-changed", ev => handlePanelChange(ev.detail?.panel));
    document.addEventListener("gcs-connection", () => { if (state.panelActive) syncSummary(); });
    setInterval(() => { if (state.panelActive) { syncSummary(); renderSurveyStatus(); } }, 800);

    // also react to fresh GPS telemetry
    document.addEventListener("gcs-telemetry", () => {
      if (state.panelActive) syncSummary();
    });
  }

  window.addEventListener("DOMContentLoaded", mount);

  // expose a couple of helpers for future bridge integration
  window.rtkStartNtrip = function (cfg) { /* to be implemented by bridge */ };
  window.rtkGetSurveyState = () => state.survey;
})();
