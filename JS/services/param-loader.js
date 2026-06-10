/**
 * 参数加载 UI — 从 serial.js 拆分
 *  负责：加载遮罩、进度条、取消逻辑
 */

const PARAM_LOAD_WATCHDOG_MS = 120000;
const PARAM_LOAD_STALL_MS = 1800;
const PARAM_LOAD_SOFT_COMPLETE_MS = 45000;
const PARAM_LOAD_SOFT_COMPLETE_COVERAGE = 0.985;
const PARAM_LOAD_DISPLAY_MIN_RATE = 0.18;
const PARAM_LOAD_DISPLAY_MAX_RATE = 0.9;
const PARAM_LOAD_DISPLAY_CATCHUP_GAIN = 1.8;

function stopParamLoadDisplayAnimation() {
  if (window._paramLoadDisplayRaf) {
    cancelAnimationFrame(window._paramLoadDisplayRaf);
    window._paramLoadDisplayRaf = null;
  }
  window._paramLoadDisplayLastTs = 0;
}

function renderParamLoadBarPct(pct) {
  const bar = document.getElementById("param-load-bar");
  if (!bar) return;
  bar.classList.remove("param-load-bar--indeterminate");
  bar.style.left = "0";
  bar.style.width = `${Math.max(0, Math.min(100, pct))}%`;
}

function tickParamLoadDisplay(ts) {
  if (!window._paramLoadDisplayAnimating) {
    stopParamLoadDisplayAnimation();
    return;
  }
  const target = Number(window._paramLoadDisplayTargetPct);
  let current = Number(window._paramLoadDisplayPct);
  if (!Number.isFinite(target) || !Number.isFinite(current)) {
    stopParamLoadDisplayAnimation();
    return;
  }
  if (!window._paramLoadDisplayLastTs) {
    window._paramLoadDisplayLastTs = ts;
  }
  const dt = Math.max(0.001, (ts - window._paramLoadDisplayLastTs) / 1000);
  window._paramLoadDisplayLastTs = ts;
  const gap = Math.max(0, target - current);
  if (gap <= 0.001) {
    window._paramLoadDisplayPct = target;
    renderParamLoadBarPct(target);
    window._paramLoadDisplayAnimating = false;
    stopParamLoadDisplayAnimation();
    return;
  }
  const rate = Math.min(
    PARAM_LOAD_DISPLAY_MAX_RATE,
    PARAM_LOAD_DISPLAY_MIN_RATE + gap * PARAM_LOAD_DISPLAY_CATCHUP_GAIN
  );
  current = Math.min(target, current + rate * dt * 100);
  window._paramLoadDisplayPct = current;
  renderParamLoadBarPct(current);
  window._paramLoadDisplayRaf = requestAnimationFrame(tickParamLoadDisplay);
}

function ensureParamLoadDisplayAnimation() {
  if (window._paramLoadDisplayAnimating) return;
  window._paramLoadDisplayAnimating = true;
  window._paramLoadDisplayLastTs = 0;
  window._paramLoadDisplayRaf = requestAnimationFrame(tickParamLoadDisplay);
}

function stopParamLoadStallWatcher() {
  if (window._paramStallInterval) {
    clearInterval(window._paramStallInterval);
    window._paramStallInterval = null;
  }
}

function startParamLoadStallWatcher() {
  stopParamLoadStallWatcher();
  window._paramStallLastProgress = -1;
  window._paramStallRetries = 0;
  window._paramStallInterval = setInterval(() => {
    if (!window._paramLoadActive) {
      stopParamLoadStallWatcher();
      return;
    }
    const total = Number(window._paramCount);
    const got = window._paramRxIndices ? window._paramRxIndices.size : (window.params?.size || 0);
    if (!total || got >= total) return;
    if (got === window._paramStallLastProgress) {
      window._paramStallRetries += 1;
      if (window._paramStallRetries <= 12 && typeof window.requestMissingParamBatch === "function") {
        window.requestMissingParamBatch();
        if (window._paramStallRetries % 4 === 0 && typeof window.requestParamListOnce === "function") {
          window.requestParamListOnce("stall-retry").catch(() => {});
        }
      } else if (window._paramStallRetries === 13 && typeof log === "function") {
        log(`⚠️ 参数加载停滞在 ${got}/${total}，继续等待或点「取消」`, "param-load");
      } else if (
        window._paramStallRetries > 13 &&
        window._paramStallRetries % 6 === 0 &&
        typeof window.requestParamListOnce === "function"
      ) {
        window.requestParamListOnce("stall-retry").catch(() => {});
      }
    } else {
      window._paramStallRetries = 0;
    }
    const started = Number(window._paramLoadStartedAt) || 0;
    const elapsed = started > 0 ? Date.now() - started : 0;
    const coverage = total > 0 ? got / total : 0;
    if (elapsed >= PARAM_LOAD_SOFT_COMPLETE_MS && total > 100 && coverage >= PARAM_LOAD_SOFT_COMPLETE_COVERAGE) {
      if (typeof log === "function") {
        log(`ℹ️ 参数已收齐大部分（${got}/${total}），先进入可用状态并后台继续补拉`, "param-load");
      }
      window.endParamLoadingUI(true, "partial");
      return;
    }
    window._paramStallLastProgress = got;
  }, PARAM_LOAD_STALL_MS);
}

function wireParamLoadCancelOnce() {
  const btn = document.getElementById("param-load-cancel");
  if (!btn || btn.dataset.wired === "1") return;
  btn.dataset.wired = "1";
  btn.addEventListener("click", () => {
    if (typeof window.cancelParamLoadingUI === "function") window.cancelParamLoadingUI();
  });
}

window.updateParamLoadProgress = function updateParamLoadProgress(received, total) {
  const prog = document.getElementById("param-load-progress");
  const bar = document.getElementById("param-load-bar");
  if (prog) {
    prog.textContent =
      Number.isFinite(total) && total > 0
        ? `已接收 ${received} / ${total}`
        : `已接收 ${received} 条（等待飞控上报总数…）`;
  }
  if (!bar) return;
  if (Number.isFinite(total) && total > 0) {
    const pct = Math.min(100, (received / total) * 100);
    if (!Number.isFinite(window._paramLoadDisplayPct) || window._paramLoadDisplayPct < 0) {
      window._paramLoadDisplayPct = 0;
    }
    window._paramLoadDisplayTargetPct = pct;
    if (pct <= window._paramLoadDisplayPct + 0.15) {
      window._paramLoadDisplayPct = pct;
      window._paramLoadDisplayAnimating = false;
      stopParamLoadDisplayAnimation();
      renderParamLoadBarPct(pct);
    } else {
      ensureParamLoadDisplayAnimation();
    }
  } else {
    window._paramLoadDisplayAnimating = false;
    stopParamLoadDisplayAnimation();
    bar.classList.add("param-load-bar--indeterminate");
    bar.style.width = "";
    bar.style.left = "";
  }
};

window.beginParamLoadingUI = function beginParamLoadingUI() {
  if (window._paramLoadActive) return false;
  wireParamLoadCancelOnce();

  window._paramLoadActive = true;
  window._paramLoadCancel = false;
  window._paramLoadStartedAt = Date.now();
  if (window._paramCompleteTimer) {
    clearTimeout(window._paramCompleteTimer);
    window._paramCompleteTimer = null;
  }
  try { window.params.clear(); } catch (_) { /* ignore */ }
  window._paramCount = undefined;
  window._paramRxIndices = new Set();
  window._paramLoadDisplayPct = 0;
  window._paramLoadDisplayTargetPct = 0;
  window._paramLoadDisplayAnimating = false;
  stopParamLoadDisplayAnimation();
  startParamLoadStallWatcher();

  const paramsEl = document.getElementById("params");
  if (paramsEl) paramsEl.innerHTML = '<span class="muted">参数表加载中…</span>';

  const ov = document.getElementById("param-load-overlay");
  if (ov) {
    ov.classList.remove("hidden");
    ov.setAttribute("aria-busy", "true");
  }
  const prog = document.getElementById("param-load-progress");
  if (prog) prog.textContent = "正在向飞控请求参数列表…";
  window.updateParamLoadProgress(0, NaN);

  const loadBtn = document.getElementById("loadParamsBtn");
  if (loadBtn) loadBtn.disabled = true;

  document.body.classList.add("param-loading");

  if (window._paramListRetryTimer) {
    clearTimeout(window._paramListRetryTimer);
    window._paramListRetryTimer = null;
  }
  if (window._paramLoadWatchdog) clearTimeout(window._paramLoadWatchdog);
  window._paramLoadWatchdog = setTimeout(() => {
    if (!window._paramLoadActive) return;
    if (typeof log === "function") log(`⚠️ 参数加载超过 ${PARAM_LOAD_WATCHDOG_MS / 1000}s 仍未收齐，已结束等待`, "param-load");
    window.endParamLoadingUI(false, "timeout");
  }, PARAM_LOAD_WATCHDOG_MS);

  return true;
};

window.cancelParamLoadingUI = function cancelParamLoadingUI() {
  if (!window._paramLoadActive) return;
  window._paramLoadCancel = true;
  window.endParamLoadingUI(false, "cancel");
};

window.endParamLoadingUI = function endParamLoadingUI(ok, reason) {
  const wasActive = !!window._paramLoadActive;
  window._paramLoadActive = false;
  window._paramLoadCancel = false;

  if (window._paramListRetryTimer) {
    clearTimeout(window._paramListRetryTimer);
    window._paramListRetryTimer = null;
  }
  if (window._paramCompleteTimer) {
    clearTimeout(window._paramCompleteTimer);
    window._paramCompleteTimer = null;
  }
  stopParamLoadStallWatcher();
  if (window._paramLoadWatchdog) {
    clearTimeout(window._paramLoadWatchdog);
    window._paramLoadWatchdog = null;
  }

  const ov = document.getElementById("param-load-overlay");
  if (ov) {
    ov.classList.add("hidden");
    ov.setAttribute("aria-busy", "false");
  }
  document.body.classList.remove("param-loading");

  const loadBtn = document.getElementById("loadParamsBtn");
  if (loadBtn) loadBtn.disabled = false;

  const bar = document.getElementById("param-load-bar");
  if (bar) {
    window._paramLoadDisplayAnimating = false;
    stopParamLoadDisplayAnimation();
    bar.classList.remove("param-load-bar--indeterminate");
    bar.style.left = "0";
    if (ok && reason === "complete") {
      window._paramLoadDisplayPct = 100;
      window._paramLoadDisplayTargetPct = 100;
      bar.style.width = "100%";
    } else {
      bar.style.width = "0%";
    }
  }

  if (typeof window.renderSortedParams === "function") window.renderSortedParams();

  if (!wasActive) return;

  if (ok && reason === "complete") {
    window._gcsParamsLoadedOnce = true;
    window._gcsParamsLoadedSessionId = window._gcsConnSessionId;
    if (typeof log === "function") log(`✅ 参数表加载完成（${window.params.size} 项）`, "param-load");
    try {
      document.dispatchEvent(new CustomEvent("gcs-airframe-params-changed", { detail: { bulk: true } }));
    } catch (_) { /* ignore */ }
    // 参数加载完成后，主动请求 AUTOPILOT_VERSION（#148）— 确认链路通畅后重试
    if (typeof window.requestAutopilotVersionFromVehicle === "function") {
      window.requestAutopilotVersionFromVehicle();
    }
    if (typeof window.requestProximityTelemetryStreams === "function") {
      window.requestProximityTelemetryStreams().catch(() => {});
    }
  } else if (ok && reason === "partial") {
    window._gcsParamsLoadedOnce = true;
    window._gcsParamsLoadedSessionId = window._gcsConnSessionId;
    if (typeof log === "function") log(`✅ 参数表已可用（${window.params.size} 项，后台继续补拉缺失项）`, "param-load");
    try {
      document.dispatchEvent(new CustomEvent("gcs-airframe-params-changed", { detail: { bulk: true, partial: true } }));
    } catch (_) { /* ignore */ }
    if (typeof window.requestMissingParamBatch === "function") {
      setTimeout(() => window.requestMissingParamBatch().catch(() => {}), 120);
      setTimeout(() => window.requestMissingParamBatch().catch(() => {}), 1800);
    }
  } else if (reason === "cancel") {
    if (typeof log === "function") log(`已取消参数加载（已保留已收到的 ${window.params.size} 项）`, "param-load");
  } else if (reason === "disconnect") {
    if (typeof log === "function") log("⚠️ 连接已断开，参数加载中止", "param-load");
  } else if (reason === "send-fail") {
    if (typeof log === "function") log("⚠️ 无法发送参数列表请求", "param-load");
  }
};

console.log("✅ param-loader.js 已加载");
