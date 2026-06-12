(function () {
  const MAV_FRAME_GLOBAL_RELATIVE_ALT_INT = 6;

  const MAV_FRAME_GLOBAL_TERRAIN_ALT = 10;

  const MAV_FRAME_MISSION = 2;

  const MAV_CMD = {
    NAV_WAYPOINT: 16,
    NAV_LOITER_UNLIM: 17,
    NAV_LOITER_TURNS: 18,
    NAV_LOITER_TIME: 19,
    NAV_LAND: 21,
    NAV_LOITER_TO_ALT: 31,
    NAV_TAKEOFF: 22,
    NAV_SPLINE_WAYPOINT: 82,
    NAV_VTOL_TAKEOFF: 84,
    NAV_VTOL_LAND: 85,
    NAV_RETURN_TO_LAUNCH: 20,
    DO_SET_CAM_TRIGG_DIST: 206,
    IMAGE_START_CAPTURE: 2000,
    IMAGE_STOP_CAPTURE: 2001,
    DO_VTOL_TRANSITION: 3000
  };

  const MAV_VTOL_STATE = {
    MC: 0,
    TRANSITION_TO_FW: 1,
    FW: 2,
    TRANSITION_TO_MC: 3
  };

  const CMD_LABELS = {
    16: "航点",
    17: "盘旋",
    18: "盘旋圈数",
    19: "盘旋定时",
    21: "降落",
    31: "盘旋",
    22: "起飞",
    82: "样条航点",
    84: "垂直起飞",
    85: "垂起降落",
    20: "返航",
    206: "相机间距",
    2000: "开始拍照",
    2001: "停止拍照",
    3000: "模式切换"
  };

  const ROLE_MAP_LABELS = {
    22: "起飞",
    21: "降落",
    17: "盘旋",
    18: "盘旋圈数",
    19: "盘旋定时",
    82: "样条航点",
    84: "垂直起飞",
    31: "盘旋",
    20: "返航",
    85: "垂起降落",
    3000: "模式切换"
  };

  function round6(n) {
    return Math.round(Number(n) * 1e6) / 1e6;
  }

  function createWaypoint(partial) {
    const wp = Object.assign(
      {
        lng: 0,
        lat: 0,
        alt: 0,
        command: MAV_CMD.NAV_WAYPOINT,
        frame: MAV_FRAME_GLOBAL_RELATIVE_ALT_INT,
        param1: 0,
        param2: 0,
        param3: 0,
        param4: 0,
        locked: false,
        label: "",
        source: "manual",
        segmentRole: "",
        pathRole: "",
        blockId: "",
        mapVisible: true
      },
      partial || {}
    );
    if (partial && partial.mapVisible === false) {
      wp.mapVisible = false;
    }
    wp.lng = round6(wp.lng);
    wp.lat = round6(wp.lat);
    wp.alt = round6(Number(wp.alt) || 0);
    return wp;
  }

  function getCommandLabel(command) {
    return CMD_LABELS[command] || "航点";
  }

  function getMapRoleLabel(wp) {
    if (wp && wp.label) {
      return wp.label;
    }
    return ROLE_MAP_LABELS[wp.command] || "";
  }

  function getDisplayTitle(wp, index) {
    if (wp.label) {
      return wp.label;
    }
    if (ROLE_MAP_LABELS[wp.command]) {
      return ROLE_MAP_LABELS[wp.command];
    }
    return getCommandLabel(wp.command) + " " + (index + 1);
  }

  function renumberWaypoints(list) {
    return (list || []).map(function (wp, index) {
      return Object.assign({}, wp, { seq: index });
    });
  }

  function stripSurveyWaypoints(list) {
    return (list || []).filter(function (wp) {
      return wp.source !== "survey";
    });
  }

  function stripConnectorWaypoints(list) {
    return (list || []).filter(function (wp) {
      return wp.source !== "connector";
    });
  }

  function stripCameraWaypoints(list) {
    return (list || []).filter(function (wp) {
      return wp.source !== "camera";
    });
  }

  function buildSurveyMapVisibilitySet(waypoints) {
    const visible = new Set();
    (waypoints || []).forEach(function (wp, index) {
      if (wp.source !== "camera") {
        visible.add(index);
      }
    });
    return visible;
  }

  function applySurveyMapVisibility(waypoints) {
    const list = waypoints || [];
    list.forEach(function (wp) {
      if (wp.source === "survey") {
        wp.mapVisible = true;
      }
    });
    return list;
  }

  function isMapVisibleWaypoint(wp) {
    return Boolean(wp) && wp.mapVisible !== false && wp.source !== "camera";
  }

  function isRenderableNavCommand(command) {
    return (
      command === MAV_CMD.NAV_TAKEOFF ||
      command === MAV_CMD.NAV_WAYPOINT ||
      command === MAV_CMD.NAV_SPLINE_WAYPOINT ||
      command === MAV_CMD.NAV_LOITER_UNLIM ||
      command === MAV_CMD.NAV_LOITER_TURNS ||
      command === MAV_CMD.NAV_LOITER_TIME ||
      command === MAV_CMD.NAV_LAND
    );
  }

  function isDoCommand(command) {
    const cmd = Number(command);
    return (cmd >= 176 && cmd < 3000) || cmd === MAV_CMD.DO_VTOL_TRANSITION || cmd === MAV_CMD.DO_SET_CAM_TRIGG_DIST;
  }

  function isCondCommand(command) {
    const cmd = Number(command);
    return cmd >= 112 && cmd < 160;
  }

  function isValidMissionGeo(lat, lng) {
    return (
      Number.isFinite(Number(lat)) &&
      Number.isFinite(Number(lng)) &&
      Math.abs(Number(lat)) <= 90 &&
      Math.abs(Number(lng)) <= 180 &&
      !(Number(lat) === 0 && Number(lng) === 0)
    );
  }

  function createCameraTriggerStart(afterWp, triggerDistanceMeters, blockId) {
    return createWaypoint({
      lng: afterWp.lng,
      lat: afterWp.lat,
      alt: afterWp.alt,
      command: MAV_CMD.DO_SET_CAM_TRIGG_DIST,
      frame: MAV_FRAME_MISSION,
      param1: round6(Math.max(0.5, Number(triggerDistanceMeters) || 0)),
      param2: 0,
      param3: 1,
      source: "camera",
      segmentRole: "cam-start",
      blockId: blockId || afterWp.blockId || "",
      label: "开始拍照",
      mapVisible: false,
      listVisible: true,
      locked: true
    });
  }

  function createCameraTriggerStop(afterWp, blockId) {
    return createWaypoint({
      lng: afterWp.lng,
      lat: afterWp.lat,
      alt: afterWp.alt,
      command: MAV_CMD.DO_SET_CAM_TRIGG_DIST,
      frame: MAV_FRAME_MISSION,
      param1: 0,
      param2: 0,
      param3: 0,
      source: "camera",
      segmentRole: "cam-stop",
      blockId: blockId || afterWp.blockId || "",
      label: "停止拍照",
      mapVisible: false,
      listVisible: true,
      locked: true
    });
  }

  function appendSurveyCameraCommands(waypoints, triggerDistanceMeters) {
    const list = [];
    (waypoints || []).forEach(function (wp) {
      list.push(wp);
      if (wp.source !== "survey") {
        return;
      }
      if (wp.pathRole === "line-start") {
        list.push(createCameraTriggerStart(wp, triggerDistanceMeters, wp.blockId));
      } else if (wp.pathRole === "line-end") {
        list.push(createCameraTriggerStop(wp, wp.blockId));
      }
    });
    return list;
  }

  function stripRtlWaypoints(list) {
    return (list || []).filter(function (wp) {
      return wp.command !== MAV_CMD.NAV_RETURN_TO_LAUNCH;
    });
  }

  function appendRtlWaypoint(list) {
    const base = stripRtlWaypoints(list);
    const rtl = createWaypoint({
      lng: 0,
      lat: 0,
      alt: 0,
      command: MAV_CMD.NAV_RETURN_TO_LAUNCH,
      frame: MAV_FRAME_GLOBAL_RELATIVE_ALT_INT,
      param1: 0,
      param2: 0,
      param3: 0,
      param4: 0,
      label: "返航",
      source: "template"
    });
    return renumberWaypoints(base.concat([rtl]));
  }

  function surveyPointsToWaypoints(points, altitude) {
    return (points || []).map(function (point) {
      return createWaypoint({
        lng: point.lng,
        lat: point.lat,
        alt: altitude,
        command: MAV_CMD.NAV_WAYPOINT,
        source: "survey"
      });
    });
  }

  function mergeSurveyIntoMission(mission, surveyPoints, altitude, appendRtl) {
    let next = stripSurveyWaypoints(stripRtlWaypoints(mission));
    next = next.concat(surveyPointsToWaypoints(surveyPoints, altitude));
    if (appendRtl) {
      next = appendRtlWaypoint(next);
    }
    return renumberWaypoints(next);
  }

  function appendSurveyIntoMission(mission, surveyPoints, altitude, appendRtl) {
    let next = stripRtlWaypoints(mission);
    next = next.concat(surveyPointsToWaypoints(surveyPoints, altitude));
    if (appendRtl) {
      next = appendRtlWaypoint(next);
    }
    return renumberWaypoints(next);
  }

  function isVehicleConnected() {
    return window._gcsConnState === "connected";
  }

  function hasFlightPlanVehiclePosition() {
    return (
      isVehicleConnected() &&
      Number(window.gps_fix_type) >= 2 &&
      Number.isFinite(window.lat) &&
      Number.isFinite(window.lon)
    );
  }

  function resolveVehicleHomeAltitudeMsl() {
    const gpsRawAlt =
      typeof window.getGpsTelemetryAltitudeMsl === "function"
        ? window.getGpsTelemetryAltitudeMsl()
        : null;
    if (gpsRawAlt != null && Number.isFinite(Number(gpsRawAlt))) {
      return Number(gpsRawAlt);
    }

    const terrainMsl = Number(window._gcsVehicleHomeTerrainMsl);
    const gpsAlt = Number(window.altitude);
    const relAlt = Number(window.relative_alt_m);
    const home = window.homeState;

    if (
      home &&
      home.valid &&
      Number.isFinite(Number(home.alt)) &&
      Number(home.alt) > 50
    ) {
      return Number(home.alt);
    }

    if (Number.isFinite(terrainMsl)) {
      if (Number.isFinite(gpsAlt) && gpsAlt >= terrainMsl - 30) {
        return gpsAlt;
      }
      if (Number.isFinite(relAlt)) {
        return terrainMsl + relAlt;
      }
      return terrainMsl;
    }

    if (Number.isFinite(gpsAlt) && gpsAlt > 50) {
      return gpsAlt;
    }
    if (Number.isFinite(gpsAlt)) {
      return gpsAlt;
    }
    return 30;
  }

  /** 飞行计划 Home / 默认中心：已连接且有定位用当前位置，否则用地图默认中点 */
  function getFlightPlanHomeLatLng() {
    if (hasFlightPlanVehiclePosition()) {
      return {
        lat: window.lat,
        lng: window.lon,
        alt: resolveVehicleHomeAltitudeMsl(),
        source: "vehicle"
      };
    }
    return {
      lat: window.DEFAULT_MAP_LAT || 29.59256,
      lng: window.DEFAULT_MAP_LON || 106.22742,
      alt: 30,
      source: "default"
    };
  }

  function getTakeoffLatLng() {
    const home = getFlightPlanHomeLatLng();
    return { lat: home.lat, lng: home.lng };
  }

  window.MissionModel = {
    MAV_CMD: MAV_CMD,
    MAV_VTOL_STATE: MAV_VTOL_STATE,
    MAV_FRAME_GLOBAL_RELATIVE_ALT_INT: MAV_FRAME_GLOBAL_RELATIVE_ALT_INT,
    MAV_FRAME_GLOBAL_TERRAIN_ALT: MAV_FRAME_GLOBAL_TERRAIN_ALT,
    createWaypoint: createWaypoint,
    getCommandLabel: getCommandLabel,
    getMapRoleLabel: getMapRoleLabel,
    getDisplayTitle: getDisplayTitle,
    renumberWaypoints: renumberWaypoints,
    stripSurveyWaypoints: stripSurveyWaypoints,
    stripConnectorWaypoints: stripConnectorWaypoints,
    stripCameraWaypoints: stripCameraWaypoints,
    isMapVisibleWaypoint: isMapVisibleWaypoint,
    buildSurveyMapVisibilitySet: buildSurveyMapVisibilitySet,
    applySurveyMapVisibility: applySurveyMapVisibility,
    isRenderableNavCommand: isRenderableNavCommand,
    isDoCommand: isDoCommand,
    isCondCommand: isCondCommand,
    isValidMissionGeo: isValidMissionGeo,
    createCameraTriggerStart: createCameraTriggerStart,
    createCameraTriggerStop: createCameraTriggerStop,
    appendSurveyCameraCommands: appendSurveyCameraCommands,
    MAV_FRAME_MISSION: MAV_FRAME_MISSION,
    stripRtlWaypoints: stripRtlWaypoints,
    appendRtlWaypoint: appendRtlWaypoint,
    surveyPointsToWaypoints: surveyPointsToWaypoints,
    mergeSurveyIntoMission: mergeSurveyIntoMission,
    appendSurveyIntoMission: appendSurveyIntoMission,
    isVehicleConnected: isVehicleConnected,
    hasFlightPlanVehiclePosition: hasFlightPlanVehiclePosition,
    getFlightPlanHomeLatLng: getFlightPlanHomeLatLng,
    resolveVehicleHomeAltitudeMsl: resolveVehicleHomeAltitudeMsl,
    getTakeoffLatLng: getTakeoffLatLng
  };
})();
