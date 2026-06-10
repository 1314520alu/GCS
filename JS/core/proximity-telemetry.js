/**
 * ArduPilot 邻近遥测聚合：#132 DISTANCE_SENSOR 8 扇区 + 可选 #330 OBSTACLE_DISTANCE。
 * 对齐 Mission Planner Proximity.cs / ProximityControl.cs 行为。
 */
(function () {
  /** MAV_SENSOR_ROTATION yaw sectors 0–7 (MP ProximityControl / ArduPilot send_proximity) */
  const PROXIMITY_SECTOR_ORIENTATIONS = {
    0: 0, 1: 45, 2: 90, 3: 135, 4: 180, 5: 225, 6: 270, 7: 315,
  };
  const SECTOR_WIDTH_DEG = 45;
  const SECTOR_STALE_MS = 3000;

  const sectorState = new Map();
  let obstaclePoints = [];
  let obstacleMeta = {};
  let logged132 = false;
  let logged330 = false;
  let lastIngestMs = 0;
  let rx132Count = 0;
  let rx132WindowStart = Date.now();
  let rx132Hz = 0;
  let rx330Count = 0;
  let rx330WindowStart = Date.now();
  let rx330Hz = 0;

  function note132Rx() {
    const now = Date.now();
    lastIngestMs = now;
    rx132Count += 1;
    const elapsed = now - rx132WindowStart;
    if (elapsed >= 1000) {
      rx132Hz = (rx132Count * 1000) / elapsed;
      rx132Count = 0;
      rx132WindowStart = now;
    }
  }

  function note330Rx() {
    const now = Date.now();
    lastIngestMs = now;
    rx330Count += 1;
    const elapsed = now - rx330WindowStart;
    if (elapsed >= 1000) {
      rx330Hz = (rx330Count * 1000) / elapsed;
      rx330Count = 0;
      rx330WindowStart = now;
    }
  }

  function latestSampleMs(sectors) {
    let maxMs = 0;
    sectors.forEach((entry) => {
      const t = Number(entry.lastMs) || 0;
      if (t > maxMs) maxMs = t;
    });
    return maxMs || lastIngestMs || 0;
  }

  function isSectorOrientation(orientation) {
    return Object.prototype.hasOwnProperty.call(PROXIMITY_SECTOR_ORIENTATIONS, orientation);
  }

  function payloadView(payload) {
    if (payload instanceof DataView) return payload;
    const u8 = payload instanceof Uint8Array ? payload : new Uint8Array(payload);
    return new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
  }

  function ingestDistanceSensor(payload) {
    if (!payload || payload.length < 13) return false;
    const dv = payloadView(payload);
    const minCm = dv.getUint16(4, true);
    const maxCm = dv.getUint16(6, true);
    const currentCm = dv.getUint16(8, true);
    const sensorId = dv.getUint8(11);
    const orientation = dv.getUint8(12);

    if (currentCm >= maxCm || currentCm <= minCm) {
      return false;
    }

    if (isSectorOrientation(orientation)) {
      note132Rx();
      sectorState.set(orientation, {
        distanceM: currentCm / 100,
        sensorId,
        minM: minCm / 100,
        maxM: maxCm / 100,
        lastMs: Date.now(),
        angle: PROXIMITY_SECTOR_ORIENTATIONS[orientation],
        orientation,
      });
      return true;
    }

    window._rangefinderTelemetry = {
      currentCm,
      sensorId,
      orientation,
      t: Date.now(),
    };
    return false;
  }

  function getFreshSectors(nowMs) {
    const now = nowMs != null ? nowMs : Date.now();
    const sectors = [];
    sectorState.forEach((entry, orientation) => {
      if (now - entry.lastMs > SECTOR_STALE_MS) return;
      sectors.push({
        id: orientation,
        orientation,
        angle: entry.angle,
        widthDeg: SECTOR_WIDTH_DEG,
        distance: entry.distanceM,
        type: "Proximity",
        status: "Active",
        lastMs: entry.lastMs,
      });
    });
    sectors.sort((a, b) => a.angle - b.angle);
    return sectors;
  }

  function ingestObstacleDistance(obstacles, meta) {
    obstaclePoints = Array.isArray(obstacles) ? obstacles.slice() : [];
    obstacleMeta = meta && typeof meta === "object" ? meta : {};
  }

  function resolveSource(hasSectors, hasPoints) {
    if (hasSectors && hasPoints) return "merged";
    if (hasPoints) return "obstacle_distance";
    if (hasSectors) return "distance_sensor";
    return "distance_sensor";
  }

  function publishRadarTelemetry(options) {
    const emitEvent = !(options && options.silent);
    const now = Date.now();
    const sectors = getFreshSectors(now);
    const hasSectors = sectors.length > 0;
    const hasPoints = obstaclePoints.length > 0;
    const sampleMs = latestSampleMs(sectors);

    if (!hasSectors && !hasPoints) {
      if (window.radarTelemetry) {
        window.radarTelemetry.sectors = [];
        window.radarTelemetry.obstacles = [];
        window.radarTelemetry.points = [];
        window.radarTelemetry.lastUpdateMs = sampleMs;
      }
      return null;
    }

    const source = resolveSource(hasSectors, hasPoints);
    const mergedObstacles = sectors.map((s) => ({
      id: s.id,
      distance: s.distance,
      angle: s.angle,
      velocity: 0,
      type: s.type,
      status: s.status,
      widthDeg: s.widthDeg,
      isSector: true,
      lastMs: s.lastMs,
    })).concat(obstaclePoints.map((p) => ({
      id: p.id,
      distance: p.distance,
      angle: p.angle,
      velocity: p.velocity || 0,
      type: p.type || "Proximity",
      status: p.status || "Active",
      widthDeg: 0,
      isSector: false,
    })));

    window.radarTelemetry = {
      source,
      sectors,
      obstacles: mergedObstacles,
      points: obstaclePoints.slice(),
      lastUpdateMs: sampleMs,
      lastIngestMs,
      rxHz132: rx132Hz,
      rxHz330: rx330Hz,
      incrementDeg: obstacleMeta.incrementDeg,
      angleOffset: obstacleMeta.angleOffset,
      maxDistanceM: obstacleMeta.maxDistanceM,
    };

    if (emitEvent) {
      try {
        document.dispatchEvent(new CustomEvent("gcs-radar-telemetry", {
          detail: {
            source,
            sectorCount: sectors.length,
            pointCount: obstaclePoints.length,
            count: mergedObstacles.length,
            lastUpdateMs: sampleMs,
            lastIngestMs,
            rxHz132: rx132Hz,
          },
        }));
      } catch (_) { /* ignore */ }
    }

    return window.radarTelemetry;
  }

  function clearProximityState() {
    sectorState.clear();
    obstaclePoints = [];
    obstacleMeta = {};
    window.radarTelemetry = undefined;
    logged132 = false;
    logged330 = false;
    lastIngestMs = 0;
    rx132Count = 0;
    rx132WindowStart = Date.now();
    rx132Hz = 0;
    rx330Count = 0;
    rx330WindowStart = Date.now();
    rx330Hz = 0;
  }

  window.ingestProximityDistanceSensor = function ingestProximityDistanceSensor(payload) {
    const sectorUpdated = ingestDistanceSensor(payload);
    if (sectorUpdated && !logged132) {
      logged132 = true;
      if (typeof log === "function") {
        log("📡 收到 DISTANCE_SENSOR (#132) 邻近扇区", "radar-telemetry");
      }
    }
    return publishRadarTelemetry();
  };

  window.ingestProximityObstacleDistance = function ingestProximityObstacleDistance(obstacles, meta) {
    ingestObstacleDistance(obstacles, meta);
    if (obstacles.length > 0) note330Rx();
    if (!logged330 && obstacles.length > 0) {
      logged330 = true;
      if (typeof log === "function") {
        log("📡 收到 OBSTACLE_DISTANCE (#330)：" + obstacles.length + " 个有效点", "radar-telemetry");
      }
    }
    return publishRadarTelemetry();
  };

  window.republishProximityTelemetry = function republishProximityTelemetry() {
    return publishRadarTelemetry({ silent: true });
  };
  window.clearProximityTelemetry = clearProximityState;

  document.addEventListener("gcs-connection", (event) => {
    if (event.detail && event.detail.state === "disconnected") {
      clearProximityState();
    }
  });
})();
