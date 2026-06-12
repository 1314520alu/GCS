(function () {
  const MM = window.MissionModel;
  const FWP = window.FixedWingParams;
  if (!MM) {
    return;
  }

  const PLATFORM_OPTIONS = [
    { id: "multirotor", label: "多旋翼" },
    { id: "plane", label: "固定翼" },
    { id: "vtol", label: "垂起降固定翼" }
  ];

  const LOITER_DISTANCE_THRESHOLD_M = 200;
  const BOOTSTRAP_LEG_DISTANCE_M = 220;
  const BOOTSTRAP_BEARING_DEG = 0;
  const GRADE_WARN_DEG = 20;

  function getFrameParamKeys() {
    const p = window.params;
    if (!(p instanceof Map)) {
      return null;
    }
    if (p.has("FRAME_CLASS") && p.has("FRAME_TYPE")) {
      return { classKey: "FRAME_CLASS", typeKey: "FRAME_TYPE" };
    }
    if (p.has("Q_FRAME_CLASS") && p.has("Q_FRAME_TYPE")) {
      return { classKey: "Q_FRAME_CLASS", typeKey: "Q_FRAME_TYPE" };
    }
    return null;
  }

  function getParamNum(name) {
    const p = window.params;
    if (!(p instanceof Map) || !p.has(name)) {
      return null;
    }
    const v = Number(p.get(name));
    return Number.isFinite(v) ? v : null;
  }

  function detectVehiclePlatform() {
    const keys = getFrameParamKeys();
    if (keys && keys.classKey.startsWith("Q_")) {
      return "vtol";
    }
    const fc = keys ? getParamNum(keys.classKey) : null;
    if (fc != null && [1, 2, 3, 4, 5, 7, 12, 13, 14].includes(Math.round(fc))) {
      return "multirotor";
    }
    if (keys && keys.classKey === "FRAME_CLASS") {
      return "plane";
    }
    return "multirotor";
  }

  function offsetLatLngMeters(origin, bearingDeg, distanceM) {
    const R = 6378137;
    const br = (bearingDeg * Math.PI) / 180;
    const lat1 = (origin.lat * Math.PI) / 180;
    const lng1 = (origin.lng * Math.PI) / 180;
    const dr = distanceM / R;
    const lat2 = Math.asin(
      Math.sin(lat1) * Math.cos(dr) + Math.cos(lat1) * Math.sin(dr) * Math.cos(br)
    );
    const lng2 =
      lng1 +
      Math.atan2(
        Math.sin(br) * Math.sin(dr) * Math.cos(lat1),
        Math.cos(dr) - Math.sin(lat1) * Math.sin(lat2)
      );
    return {
      lat: (lat2 * 180) / Math.PI,
      lng: (lng2 * 180) / Math.PI
    };
  }

  function horizontalDistanceM(a, b) {
    const R = 6378137;
    const lat1 = (a.lat * Math.PI) / 180;
    const lat2 = (b.lat * Math.PI) / 180;
    const dLat = lat2 - lat1;
    const dLng = (((b.lng - a.lng) * Math.PI) / 180) * Math.cos((lat1 + lat2) / 2);
    return Math.sqrt(dLat * dLat + dLng * dLng) * R;
  }

  function gradeDegrees(wp1, wp2) {
    const dist = horizontalDistanceM(wp1, wp2);
    if (dist < 0.5) {
      return 0;
    }
    const alt1 = Number(wp1.alt) || 0;
    const alt2 = Number(wp2.alt) || 0;
    return (Math.atan2(Math.abs(alt2 - alt1), dist) * 180) / Math.PI;
  }

  function gradeSegmentColor(wp1, wp2) {
    return gradeDegrees(wp1, wp2) > GRADE_WARN_DEG ? "#f44336" : "#f0c24f";
  }

  function bearingBetween(a, b) {
    const lat1 = (a.lat * Math.PI) / 180;
    const lat2 = (b.lat * Math.PI) / 180;
    const dLng = ((b.lng - a.lng) * Math.PI) / 180;
    const y = Math.sin(dLng) * Math.cos(lat2);
    const x =
      Math.cos(lat1) * Math.sin(lat2) -
      Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
    return (Math.atan2(y, x) * 180) / Math.PI;
  }

  function loiterPositionAfterGuide(takeoff, guide) {
    const bearing = bearingBetween(takeoff, guide);
    return offsetLatLngMeters(guide, bearing, BOOTSTRAP_LEG_DISTANCE_M);
  }

  function buildBootstrapWaypoints(platform, origin, connected) {
    const takeoff = Object.assign({}, origin);
    const locked = Boolean(
      connected &&
      MM.hasFlightPlanVehiclePosition &&
      MM.hasFlightPlanVehiclePosition()
    );
    let list = [];

    if (platform === "multirotor") {
      list.push(
        MM.createWaypoint({
          lng: takeoff.lng,
          lat: takeoff.lat,
          alt: 30,
          command: MM.MAV_CMD.NAV_TAKEOFF,
          param7: 30,
          locked: locked,
          label: "起飞",
          source: "template"
        })
      );
      const g2 = offsetLatLngMeters(takeoff, 0, 100);
      const g3 = offsetLatLngMeters(takeoff, 90, 100);
      list.push(
        MM.createWaypoint({
          lng: g2.lng,
          lat: g2.lat,
          alt: 30,
          label: "引导点2",
          source: "template"
        }),
        MM.createWaypoint({
          lng: g3.lng,
          lat: g3.lat,
          alt: 30,
          label: "引导点3",
          source: "template"
        })
      );
      return MM.renumberWaypoints(list);
    }

    if (platform === "vtol") {
      list.push(
        MM.createWaypoint({
          lng: takeoff.lng,
          lat: takeoff.lat,
          alt: 40,
          command: MM.MAV_CMD.NAV_VTOL_TAKEOFF,
          param7: 40,
          locked: locked,
          label: "垂直起飞",
          source: "template"
        })
      );
    } else {
      const guide1Alt = 50;
      list.push(
        FWP
          ? FWP.createPlaneTakeoffWaypoint(
              {
                lng: takeoff.lng,
                lat: takeoff.lat,
                locked: locked,
                source: "template"
              },
              guide1Alt
            )
          : MM.createWaypoint({
              lng: takeoff.lng,
              lat: takeoff.lat,
              alt: guide1Alt,
              command: MM.MAV_CMD.NAV_TAKEOFF,
              locked: locked,
              label: "起飞",
              source: "template"
            })
      );
    }

    const leg = BOOTSTRAP_LEG_DISTANCE_M;
    const guide1 = offsetLatLngMeters(takeoff, BOOTSTRAP_BEARING_DEG, leg);
    const guide1Alt = platform === "vtol" ? Number(list[0].alt) || 40 : 50;
    list.push(
      MM.createWaypoint({
        lng: guide1.lng,
        lat: guide1.lat,
        alt: guide1Alt,
        label: "引导",
        source: "template"
      })
    );

    const loiterPt = offsetLatLngMeters(guide1, BOOTSTRAP_BEARING_DEG, leg);
    const loiterAlt = 300;
    list.push(
      FWP
        ? FWP.createPlaneLoiterToAltWaypoint(
            {
              lng: loiterPt.lng,
              lat: loiterPt.lat,
              source: "template"
            },
            FWP.signedLoiterRadiusMeters(FWP.FW_BOOTSTRAP_LOITER_RADIUS_M, true),
            loiterAlt
          )
        : MM.createWaypoint({
            lng: loiterPt.lng,
            lat: loiterPt.lat,
            alt: loiterAlt,
            command: MM.MAV_CMD.NAV_LOITER_TO_ALT,
            label: "盘旋",
            source: "template"
          })
    );

    const guide2 = offsetLatLngMeters(loiterPt, BOOTSTRAP_BEARING_DEG, leg);
    list.push(
      MM.createWaypoint({
        lng: guide2.lng,
        lat: guide2.lat,
        alt: 300,
        label: "引导",
        source: "template"
      })
    );

    if (platform === "vtol") {
      const vtolAlt = Number(list[0].alt) || 40;
      list[1] = Object.assign({}, list[1], { alt: vtolAlt });
    }

    const normalized = FWP && FWP.normalizeWaypointsForPlatform
      ? FWP.normalizeWaypointsForPlatform(list, platform)
      : list;
    return MM.renumberWaypoints(normalized);
  }

  function insertTemplateLoiter(waypoints, vtolTakeoffAlt) {
    const list = waypoints.slice();
    if (list.length < 2) {
      return list;
    }
    if (
      list.some(function (wp) {
        return wp.label === "盘旋" && wp.source === "template";
      })
    ) {
      return list;
    }
    const wp1 = list[0];
    const wp2 = list[1];
    const loiterPos = loiterPositionAfterGuide(wp1, wp2);
    const gradeBaseAlt =
      wp1.command === MM.MAV_CMD.NAV_VTOL_TAKEOFF
        ? Number(vtolTakeoffAlt) || Number(wp1.alt) || 40
        : Number(wp2.alt) || 50;
    list.splice(
      2,
      0,
      FWP
        ? FWP.createPlaneLoiterToAltWaypoint(
            {
              lng: loiterPos.lng,
              lat: loiterPos.lat,
              source: "template"
            },
            FWP.signedLoiterRadiusMeters(FWP.FW_BOOTSTRAP_LOITER_RADIUS_M, true),
            300
          )
        : MM.createWaypoint({
            lng: loiterPos.lng,
            lat: loiterPos.lat,
            alt: 300,
            command: MM.MAV_CMD.NAV_LOITER_TO_ALT,
            label: "盘旋",
            source: "template"
          })
    );
    if (wp1.command === MM.MAV_CMD.NAV_VTOL_TAKEOFF) {
      list[1] = Object.assign({}, list[1], {
        alt: gradeBaseAlt
      });
    }
    return list;
  }

  function maybeInsertLoiter(waypoints, vtolTakeoffAlt) {
    const list = waypoints.slice();
    if (list.length < 2) {
      return list;
    }
    const wp1 = list[0];
    const wp2 = list[1];
    const dist = horizontalDistanceM(wp1, wp2);
    if (dist <= LOITER_DISTANCE_THRESHOLD_M) {
      return list;
    }
    return insertTemplateLoiter(list, vtolTakeoffAlt);
  }

  function refreshLoiterForMission(waypoints, platform) {
    const base = waypoints.filter(function (wp) {
      if (wp.command === MM.MAV_CMD.NAV_LOITER_TO_ALT && wp.source === "template") {
        return false;
      }
      if (wp.command === MM.MAV_CMD.DO_VTOL_TRANSITION) {
        return false;
      }
      return true;
    });
    if (platform === "multirotor" || base.length < 2) {
      return MM.renumberWaypoints(base);
    }
    const wp1 = base[0];
    const wp2 = base[1];
    const dist = horizontalDistanceM(wp1, wp2);
    if (dist <= LOITER_DISTANCE_THRESHOLD_M) {
      return MM.renumberWaypoints(base);
    }
    const loiterPos = loiterPositionAfterGuide(wp1, wp2);
    const rebuilt = base.slice(0, 2);
    rebuilt.push(
      FWP
        ? FWP.createPlaneLoiterToAltWaypoint(
            {
              lng: loiterPos.lng,
              lat: loiterPos.lat,
              source: "template"
            },
            FWP.signedLoiterRadiusMeters(FWP.FW_BOOTSTRAP_LOITER_RADIUS_M, true),
            300
          )
        : MM.createWaypoint({
            lng: loiterPos.lng,
            lat: loiterPos.lat,
            alt: 300,
            command: MM.MAV_CMD.NAV_LOITER_TO_ALT,
            label: "盘旋",
            source: "template"
          })
    );
    const legBearing = bearingBetween(wp1, wp2);
    let guide2Aligned = false;
    for (let i = 2; i < base.length; i += 1) {
      if (base[i].source === "template" && base[i].label === "盘旋") {
        continue;
      }
      if (
        !guide2Aligned &&
        base[i].source === "template" &&
        base[i].label === "引导"
      ) {
        const g2Pos = offsetLatLngMeters(loiterPos, legBearing, BOOTSTRAP_LEG_DISTANCE_M);
        rebuilt.push(
          Object.assign({}, base[i], {
            lng: g2Pos.lng,
            lat: g2Pos.lat
          })
        );
        guide2Aligned = true;
        continue;
      }
      rebuilt.push(base[i]);
    }
    return MM.renumberWaypoints(rebuilt);
  }

  function shouldRebuildBootstrapTemplate(waypoints, platform) {
    if (platform === "multirotor") {
      return false;
    }
    const list = waypoints || [];
    if (
      list.some(function (wp) {
        return wp.source === "survey" || wp.source === "connector";
      })
    ) {
      return false;
    }
    const template = list.filter(function (wp) {
      return wp.source === "template";
    });
    if (!template.length) {
      return false;
    }
    if (
      !template.some(function (wp) {
        return wp.label === "盘旋";
      })
    ) {
      return true;
    }
    const loiter = template.find(function (wp) {
      return wp.label === "盘旋";
    });
    const guide1 = template.find(function (wp) {
      return wp.label === "引导";
    });
    if (loiter && guide1 && horizontalDistanceM(loiter, guide1) < 30) {
      return true;
    }
    return false;
  }

  function findFirstTakeoffIndex(waypoints) {
    const CMD = MM.MAV_CMD;
    for (let i = 0; i < (waypoints || []).length; i += 1) {
      const wp = waypoints[i];
      if (
        wp.command === CMD.NAV_TAKEOFF ||
        wp.command === CMD.NAV_VTOL_TAKEOFF
      ) {
        return i;
      }
    }
    return -1;
  }

  function findHomeAnchorWaypointIndex(waypoints) {
    const CMD = MM.MAV_CMD;
    const AP = window.ArdupilotMissionCompat;
    const list = waypoints || [];
    const takeoffIdx = findFirstTakeoffIndex(list);
    const searchEnd = takeoffIdx >= 0 ? takeoffIdx : list.length;
    for (let i = 0; i < searchEnd; i += 1) {
      const wp = list[i];
      if (!wp || wp.source === "camera") {
        continue;
      }
      if (
        wp.command === CMD.NAV_WAYPOINT &&
        (wp.frame === 0 || (AP && wp.frame === AP.MAV_FRAME_GLOBAL))
      ) {
        return i;
      }
    }
    return -1;
  }

  function unlockSyncedHomeAnchors(list, indexes) {
    let changed = false;
    const next = list.slice();
    indexes.forEach(function (idx) {
      if (idx < 0 || !next[idx] || !next[idx].locked) {
        return;
      }
      next[idx] = Object.assign({}, next[idx], { locked: false });
      changed = true;
    });
    return changed ? next : list;
  }

  function syncMissionHomeAnchorsFromVehicle(waypoints, connected) {
    const list = waypoints || [];
    if (!list.length) {
      return list;
    }

    const anchorIdx = findHomeAnchorWaypointIndex(list);
    const takeoffIdx = findFirstTakeoffIndex(list);
    const syncIndexes = [anchorIdx, takeoffIdx].filter(function (idx) {
      return idx >= 0;
    });

    if (!connected) {
      return unlockSyncedHomeAnchors(list, syncIndexes);
    }

    if (!MM.hasFlightPlanVehiclePosition || !MM.hasFlightPlanVehiclePosition()) {
      return unlockSyncedHomeAnchors(list, syncIndexes);
    }

    const origin = MM.getFlightPlanHomeLatLng();
    const AP = window.ArdupilotMissionCompat;
    if (AP && typeof AP.setMissionFileHomeFromRow === "function") {
      AP.setMissionFileHomeFromRow({
        lat: origin.lat,
        lng: origin.lng,
        alt: origin.alt,
        frame: AP.MAV_FRAME_GLOBAL != null ? AP.MAV_FRAME_GLOBAL : 0
      });
    }

    let next = null;

    function touchIndex(idx, patch) {
      if (idx < 0 || !list[idx]) {
        return;
      }
      if (!next) {
        next = list.slice();
      }
      next[idx] = Object.assign({}, list[idx], patch, { locked: true });
    }

    if (anchorIdx >= 0) {
      const wp = list[anchorIdx];
      const targetAlt = Number(origin.alt);
      const altOk =
        !Number.isFinite(targetAlt) ||
        Math.abs((Number(wp.alt) || 0) - targetAlt) < 0.5;
      if (
        !(
          wp.locked &&
          horizontalDistanceM(wp, origin) < 1 &&
          altOk
        )
      ) {
        touchIndex(anchorIdx, {
          lat: origin.lat,
          lng: origin.lng,
          alt: Number.isFinite(targetAlt) ? targetAlt : wp.alt
        });
      }
    }

    if (takeoffIdx >= 0) {
      const wp = list[takeoffIdx];
      if (!(wp.locked && horizontalDistanceM(wp, origin) < 1)) {
        touchIndex(takeoffIdx, {
          lat: origin.lat,
          lng: origin.lng
        });
      }
    }

    return next || list;
  }

  function syncTakeoffFromVehicle(waypoints, connected) {
    return syncMissionHomeAnchorsFromVehicle(waypoints, connected);
  }

  window.VehicleTemplates = {
    PLATFORM_OPTIONS: PLATFORM_OPTIONS,
    LOITER_DISTANCE_THRESHOLD_M: LOITER_DISTANCE_THRESHOLD_M,
    BOOTSTRAP_LEG_DISTANCE_M: BOOTSTRAP_LEG_DISTANCE_M,
    bearingBetween: bearingBetween,
    loiterPositionAfterGuide: loiterPositionAfterGuide,
    insertTemplateLoiter: insertTemplateLoiter,
    GRADE_WARN_DEG: GRADE_WARN_DEG,
    detectVehiclePlatform: detectVehiclePlatform,
    buildBootstrapWaypoints: buildBootstrapWaypoints,
    maybeInsertLoiter: maybeInsertLoiter,
    shouldRebuildBootstrapTemplate: shouldRebuildBootstrapTemplate,
    refreshLoiterForMission: refreshLoiterForMission,
    gradeDegrees: gradeDegrees,
    gradeSegmentColor: gradeSegmentColor,
    horizontalDistanceM: horizontalDistanceM,
    offsetLatLngMeters: offsetLatLngMeters,
    findHomeAnchorWaypointIndex: findHomeAnchorWaypointIndex,
    syncMissionHomeAnchorsFromVehicle: syncMissionHomeAnchorsFromVehicle,
    syncTakeoffFromVehicle: syncTakeoffFromVehicle
  };
})();
