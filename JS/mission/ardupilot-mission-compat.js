/**
 * ArduPilot / Mission Planner 任务格式兼容：
 * - 文件第 0 行应为 Home（MAV_CMD_NAV_WAYPOINT, frame=0, current=1）
 * - 起飞等指令从第 1 项起（与 MP「确认起点」后保存的 waypoints3 一致）
 */
(function () {
  const MM = window.MissionModel;
  if (!MM) {
    return;
  }

  const CMD = MM.MAV_CMD;
  /** 与 MP 保存的 home 行一致：MAV_FRAME_GLOBAL */
  const MAV_FRAME_GLOBAL = 0;
  const MAV_FRAME_GLOBAL_RELATIVE_ALT = 3;
  const MAV_FRAME_GLOBAL_RELATIVE_ALT_INT = MM.MAV_FRAME_GLOBAL_RELATIVE_ALT_INT;
  const MAV_FRAME_GLOBAL_TERRAIN_ALT = MM.MAV_FRAME_GLOBAL_TERRAIN_ALT;
  const MAV_FRAME_MISSION = MM.MAV_FRAME_MISSION;

  /** 从 MP 文件导入时缓存 Home 行（编辑器内不保留 seq0） */
  let missionFileHomeCache = null;

  function setMissionFileHomeFromRow(homeRow) {
    if (!homeRow) {
      missionFileHomeCache = null;
      return;
    }
    missionFileHomeCache = {
      lat: Number(homeRow.lat),
      lng: Number(homeRow.lng),
      alt: Number(homeRow.alt) || 0,
      frame: homeRow.frame != null ? homeRow.frame : MAV_FRAME_GLOBAL,
      source: "file"
    };
  }

  function getMissionFileHome() {
    return missionFileHomeCache;
  }

  function clearMissionFileHome() {
    missionFileHomeCache = null;
  }

  function isHomeRow(wp, index) {
    if (!wp) {
      return false;
    }
    if (wp.isHome === true) {
      return true;
    }
    if (wp.source === "home" || wp.label === "Home" || wp.label === "HOME") {
      return true;
    }
    return false;
  }

  function findFirstTakeoffWaypoint(waypoints) {
    const list = waypoints || [];
    for (let i = 0; i < list.length; i += 1) {
      const wp = list[i];
      if (
        wp.command === CMD.NAV_TAKEOFF ||
        wp.command === CMD.NAV_VTOL_TAKEOFF
      ) {
        return wp;
      }
    }
    return null;
  }

  function homeFromContext(waypoints) {
    const cached = getMissionFileHome();
    if (cached && Number.isFinite(cached.lat) && Number.isFinite(cached.lng)) {
      return MM.createWaypoint({
        command: CMD.NAV_WAYPOINT,
        frame: cached.frame != null ? cached.frame : MAV_FRAME_GLOBAL,
        lat: cached.lat,
        lng: cached.lng,
        alt: cached.alt,
        param1: 0,
        param2: 0,
        param3: 0,
        param4: 0,
        label: "Home",
        source: "home",
        isHome: true,
        mapVisible: false
      });
    }
    const first = waypoints && waypoints[0];
    const takeoff = findFirstTakeoffWaypoint(waypoints);
    const anchor =
      first &&
      first.command === CMD.NAV_WAYPOINT &&
      (first.frame === MAV_FRAME_GLOBAL || first.frame === 3)
        ? first
        : first;
    let lat;
    let lng;
    let alt = 30;
    if (
      anchor &&
      Number.isFinite(anchor.lat) &&
      Number.isFinite(anchor.lng) &&
      anchor.command === CMD.NAV_WAYPOINT &&
      anchor.frame === MAV_FRAME_GLOBAL
    ) {
      lat = anchor.lat;
      lng = anchor.lng;
      alt = Number(anchor.alt) || alt;
    } else if (
      takeoff &&
      Number.isFinite(takeoff.lat) &&
      Number.isFinite(takeoff.lng)
    ) {
      lat = takeoff.lat;
      lng = takeoff.lng;
      if (MM && MM.getFlightPlanHomeLatLng) {
        const h = MM.getFlightPlanHomeLatLng();
        alt = Number(h && h.alt) || alt;
      }
    } else if (MM && MM.getFlightPlanHomeLatLng) {
      const h = MM.getFlightPlanHomeLatLng();
      lat = h.lat;
      lng = h.lng;
      alt = Number(h.alt) || alt;
    } else if (first && Number.isFinite(first.lat) && Number.isFinite(first.lng)) {
      lat = first.lat;
      lng = first.lng;
      alt = Number(first.alt) || alt;
    } else {
      lat = window.DEFAULT_MAP_LAT || 29.59256;
      lng = window.DEFAULT_MAP_LON || 106.22742;
    }
    return MM.createWaypoint({
      command: CMD.NAV_WAYPOINT,
      frame: MAV_FRAME_GLOBAL,
      lat: lat,
      lng: lng,
      alt: alt,
      param1: 0,
      param2: 0,
      param3: 0,
      param4: 0,
      label: "Home",
      source: "home",
      isHome: true,
      mapVisible: false
    });
  }

  /** 上传/导出前：若无 Home 行则在队首插入（原 seq0 起飞等整体后移） */
  function expandWithHomeRow(waypoints) {
    const list = MM.renumberWaypoints(waypoints || []);
    if (!list.length) {
      return list;
    }
    if (isHomeRow(list[0], 0)) {
      return list;
    }
    return MM.renumberWaypoints([homeFromContext(list)].concat(list));
  }

  /** 从 MP 文件读入后：去掉仅用于显示的 Home 行，保留起飞与任务航点 */
  function stripHomeRowForEditor(waypoints) {
    const list = MM.renumberWaypoints(waypoints || []);
    if (!list.length || !isHomeRow(list[0], 0)) {
      return list;
    }
    setMissionFileHomeFromRow(list[0]);
    return MM.renumberWaypoints(list.slice(1));
  }

  function normalizeWaypointsForMissionPlannerExport(waypoints) {
    let lastNavFrame = MAV_FRAME_GLOBAL_RELATIVE_ALT;
    return MM.renumberWaypoints((waypoints || []).reduce(function (acc, wp) {
      if (!wp) {
        return acc;
      }
      if (
        wp.command === CMD.NAV_WAYPOINT ||
        wp.command === CMD.NAV_TAKEOFF ||
        wp.command === CMD.NAV_RETURN_TO_LAUNCH ||
        wp.command === CMD.NAV_LOITER_TO_ALT
      ) {
        lastNavFrame = normalizeFrameForMissionPlannerExport(wp, acc.length);
      }
      if (
        wp.command === CMD.IMAGE_START_CAPTURE ||
        wp.command === CMD.IMAGE_STOP_CAPTURE
      ) {
        return acc;
      }
      if (wp.command === CMD.DO_SET_CAM_TRIGG_DIST) {
        acc.push(Object.assign({}, wp, {
          frame: lastNavFrame,
          lat: 0,
          lng: 0,
          alt: 0,
          param3: 1
        }));
        return acc;
      }
      if (wp.command === CMD.NAV_LOITER_TO_ALT) {
        const p1 = Number(wp.param1) || 0;
        const p2 = Number(wp.param2) || 0;
        const exportWp = Object.assign({}, wp);
        if (p2 !== 0 && p1 === 0) {
          exportWp.param1 = p2;
          exportWp.param2 = 0;
        }
        acc.push(exportWp);
        return acc;
      }
      acc.push(wp);
      return acc;
    }, []));
  }

  function normalizeFrameForMissionPlannerExport(wp, index) {
    if (!wp) {
      return MAV_FRAME_GLOBAL_RELATIVE_ALT;
    }
    if (isHomeRow(wp, index)) {
      return MAV_FRAME_GLOBAL;
    }
    const frame = Number(wp.frame);
    if (frame === MAV_FRAME_MISSION) {
      return MAV_FRAME_GLOBAL_RELATIVE_ALT;
    }
    if (frame === MAV_FRAME_GLOBAL_RELATIVE_ALT_INT) {
      return MAV_FRAME_GLOBAL_RELATIVE_ALT;
    }
    if (frame === MAV_FRAME_GLOBAL_TERRAIN_ALT) {
      return MAV_FRAME_GLOBAL_TERRAIN_ALT;
    }
    if (!Number.isFinite(frame)) {
      return MAV_FRAME_GLOBAL_RELATIVE_ALT;
    }
    return frame;
  }

  /** MP 文件 cmd 31 半径写在 param1；GCS 内部用 param2（ArduPilot Plane 规范） */
  function normalizeWaypointFromMissionPlannerImport(wp) {
    if (!wp || wp.command !== CMD.NAV_LOITER_TO_ALT) {
      return wp;
    }
    const p1 = Number(wp.param1) || 0;
    const p2 = Number(wp.param2) || 0;
    if (p1 !== 0 && p2 === 0) {
      return Object.assign({}, wp, { param1: 0, param2: p1 });
    }
    return wp;
  }

  function normalizeWaypointsFromMissionPlannerImport(waypoints) {
    return (waypoints || []).map(normalizeWaypointFromMissionPlannerImport);
  }

  window.ArdupilotMissionCompat = {
    MAV_FRAME_GLOBAL: MAV_FRAME_GLOBAL,
    MAV_FRAME_GLOBAL_RELATIVE_ALT: MAV_FRAME_GLOBAL_RELATIVE_ALT,
    MAV_FRAME_GLOBAL_TERRAIN_ALT: MAV_FRAME_GLOBAL_TERRAIN_ALT,
    isHomeRow: isHomeRow,
    expandWithHomeRow: expandWithHomeRow,
    stripHomeRowForEditor: stripHomeRowForEditor,
    getMissionFileHome: getMissionFileHome,
    clearMissionFileHome: clearMissionFileHome,
    setMissionFileHomeFromRow: setMissionFileHomeFromRow,
    normalizeWaypointsForMissionPlannerExport: normalizeWaypointsForMissionPlannerExport,
    normalizeFrameForMissionPlannerExport: normalizeFrameForMissionPlannerExport,
    normalizeWaypointFromMissionPlannerImport: normalizeWaypointFromMissionPlannerImport,
    normalizeWaypointsFromMissionPlannerImport: normalizeWaypointsFromMissionPlannerImport
  };
})();
