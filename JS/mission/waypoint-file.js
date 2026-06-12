(function () {
  const MM = window.MissionModel;
  if (!MM) {
    return;
  }

  const WPL_VERSION = "QGC WPL 110";

  function roundWplNumber(value, decimals) {
    const factor = Math.pow(10, decimals);
    return Math.round(Number(value) * factor) / factor;
  }

  function formatWplNumber(value, decimals) {
    return roundWplNumber(value, decimals).toFixed(decimals);
  }

  function commandToRow(wp, seq) {
    const AP = window.ArdupilotMissionCompat;
    let frame = AP && AP.normalizeFrameForMissionPlannerExport
      ? AP.normalizeFrameForMissionPlannerExport(wp, seq)
      : (wp.frame != null ? wp.frame : MM.MAV_FRAME_GLOBAL_RELATIVE_ALT_INT);
    let p1 = Number(wp.param1) || 0;
    let p2 = Number(wp.param2) || 0;
    let p3 = Number(wp.param3) || 0;
    let p4 = Number(wp.param4) || 0;
    let lat = Number(wp.lat) || 0;
    let lng = Number(wp.lng) || 0;
    let alt =
      Number(wp.alt) != null && Number.isFinite(Number(wp.alt))
        ? Number(wp.alt)
        : 0;
    const cmd = Number(wp.command) || MM.MAV_CMD.NAV_WAYPOINT;
    const isHome = AP && AP.isHomeRow && AP.isHomeRow(wp, seq);
    const current = isHome || seq === 0 ? 1 : 0;

    if (cmd === MM.MAV_CMD.DO_SET_CAM_TRIGG_DIST) {
      lat = 0;
      lng = 0;
      alt = 0;
      if (p1 <= 0) {
        p1 = 0;
      }
      p3 = 1;
    }

    return [
      seq,
      current,
      frame,
      cmd,
      formatWplNumber(p1, 8),
      formatWplNumber(p2, 8),
      formatWplNumber(p3, 8),
      formatWplNumber(p4, 8),
      formatWplNumber(lat, 8),
      formatWplNumber(lng, 8),
      formatWplNumber(alt, 6),
      1
    ].join("\t");
  }

  function serializeWaypointFile(waypoints, platform) {
    const lines = [WPL_VERSION];
    let list = waypoints || [];
    const AP = window.ArdupilotMissionCompat;
    const FWP = window.FixedWingParams;
    if (FWP && FWP.normalizeWaypointsForPlatform && platform) {
      list = FWP.normalizeWaypointsForPlatform(list, platform);
    }
    if (AP && AP.normalizeWaypointsForMissionPlannerExport) {
      list = AP.normalizeWaypointsForMissionPlannerExport(list);
    }
    list = MM.renumberWaypoints(list);
    if (
      AP &&
      AP.expandWithHomeRow
    ) {
      list = AP.expandWithHomeRow(list);
    }
    list.forEach(function (wp, index) {
      lines.push(commandToRow(wp, index));
    });
    return lines.join("\n") + "\n";
  }

  function parseWaypointFile(text) {
    const lines = String(text || "")
      .split(/\r?\n/)
      .map(function (line) {
        return line.trim();
      })
      .filter(Boolean);
    if (!lines.length) {
      throw new Error("空文件");
    }
    if (!/^QGC\s+WPL\s+\d+/i.test(lines[0])) {
      throw new Error("不是 QGC WPL 航点文件");
    }

    let waypoints = [];
    for (let i = 1; i < lines.length; i += 1) {
      const parts = lines[i].split(/\s+/);
      if (parts.length < 12) {
        continue;
      }

      const cmd = Number(parts[3]);
      const frame = Number(parts[2]) || MM.MAV_FRAME_GLOBAL_RELATIVE_ALT_INT;
      const current = Number(parts[1]) || 0;
      const isCameraCmd =
        cmd === MM.MAV_CMD.DO_SET_CAM_TRIGG_DIST ||
        cmd === MM.MAV_CMD.IMAGE_START_CAPTURE ||
        cmd === MM.MAV_CMD.IMAGE_STOP_CAPTURE;
      const isFileHome =
        waypoints.length === 0 &&
        current === 1 &&
        cmd === MM.MAV_CMD.NAV_WAYPOINT &&
        (frame === 0 || frame === 3);

      waypoints.push(
        MM.createWaypoint({
          seq: waypoints.length,
          frame: frame,
          command: cmd,
          isHome: isFileHome,
          param1: Number(parts[4]) || 0,
          param2: Number(parts[5]) || 0,
          param3: Number(parts[6]) || 0,
          param4: Number(parts[7]) || 0,
          lat: Number(parts[8]) || 0,
          lng: Number(parts[9]) || 0,
          alt: Number(parts[10]) || 0,
          label: isFileHome
            ? "Home"
            : isCameraCmd
              ? Number(parts[4]) > 0
                ? "开始拍照"
                : "停止拍照"
              : MM.getCommandLabel(cmd),
          source: isCameraCmd ? "camera" : "file",
          mapVisible: !isCameraCmd
        })
      );
    }

    if (
      window.ArdupilotMissionCompat &&
      window.ArdupilotMissionCompat.normalizeWaypointsFromMissionPlannerImport
    ) {
      waypoints = window.ArdupilotMissionCompat.normalizeWaypointsFromMissionPlannerImport(
        waypoints
      );
    }

    if (
      window.ArdupilotMissionCompat &&
      window.ArdupilotMissionCompat.stripHomeRowForEditor
    ) {
      return window.ArdupilotMissionCompat.stripHomeRowForEditor(waypoints);
    }
    return MM.renumberWaypoints(waypoints);
  }

  function downloadWaypointFile(waypoints, filename, platform) {
    const text = serializeWaypointFile(waypoints, platform);
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || "mission.waypoints";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  window.WaypointFile = {
    serializeWaypointFile: serializeWaypointFile,
    parseWaypointFile: parseWaypointFile,
    downloadWaypointFile: downloadWaypointFile
  };
})();
