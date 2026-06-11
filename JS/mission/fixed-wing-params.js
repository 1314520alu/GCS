/**
 * ArduPilot Plane / QuadPlane 固定翼航段任务参数规范（与 Copter 区分）。
 * 参考：https://ardupilot.org/plane/docs/common-mavlink-mission-command-messages-mav_cmd.html
 *
 * NAV_TAKEOFF (22):        param1=俯仰角(°), param7/alt=目标高度(m, 相对 Home)
 * NAV_LOITER_TO_ALT (31):  param2=半径(m, 负=逆时针), param4=XTrack(0/1), param7/alt=目标高度
 * NAV_WAYPOINT (16):       param2=接受半径(m), param3=过点半径(m, 负=逆时针)
 * DO_SET_CAM_TRIGG_DIST:   param1=间距(m), param3=1 立即拍一张
 */
(function () {
  const MM = window.MissionModel;
  if (!MM) {
    return;
  }

  const CMD = MM.MAV_CMD;

  const FW_TAKEOFF_PITCH_DEG = 15;
  const FW_BOOTSTRAP_LOITER_RADIUS_M = 120;
  const FW_SURVEY_TURN_LOITER_RADIUS_M = 80;
  const FW_LOITER_XTRACK_TANGENT = 0;
  const FW_CAMERA_TRIGGER_ONCE = 1;

  function isFixedWingPlatform(platform) {
    return platform === "plane" || platform === "vtol";
  }

  function signedLoiterRadiusMeters(radiusM, counterClockwise) {
    const r = Math.abs(Number(radiusM) || 0);
    if (!r) {
      return 0;
    }
    return counterClockwise !== false ? -r : r;
  }

  function planeTakeoffFields(altitudeMeters, pitchDeg) {
    const alt = Number(altitudeMeters);
    const pitch = Number(pitchDeg);
    return {
      param1: Number.isFinite(pitch) ? pitch : FW_TAKEOFF_PITCH_DEG,
      param2: 0,
      param3: 0,
      param4: 0,
      alt: Number.isFinite(alt) ? alt : 0,
      param7: Number.isFinite(alt) ? alt : 0
    };
  }

  function planeLoiterToAltFields(radiusMeters, altitudeMeters, xtrackTangent) {
    const alt = Number(altitudeMeters);
    const radius = Number(radiusMeters);
    return {
      param1: 0,
      param2: Number.isFinite(radius) ? radius : signedLoiterRadiusMeters(FW_BOOTSTRAP_LOITER_RADIUS_M, true),
      param3: 0,
      param4: Number.isFinite(xtrackTangent) ? xtrackTangent : FW_LOITER_XTRACK_TANGENT,
      alt: Number.isFinite(alt) ? alt : 0,
      param7: Number.isFinite(alt) ? alt : 0
    };
  }

  function planeWaypointFields(options) {
    const opts = options || {};
    const fields = {
      param1: 0,
      param2: 0,
      param3: 0,
      param4: 0
    };
    if (opts.acceptRadiusM != null && Number.isFinite(Number(opts.acceptRadiusM))) {
      fields.param2 = Number(opts.acceptRadiusM);
    }
    if (opts.passRadiusM != null && Number.isFinite(Number(opts.passRadiusM))) {
      fields.param3 = Number(opts.passRadiusM);
    }
    return fields;
  }

  function round6(n) {
    return Math.round(Number(n) * 1e6) / 1e6;
  }

  function planeCameraTriggerFields(triggerDistanceMeters, triggerOnce) {
    return {
      param1: round6(Math.max(0.5, Number(triggerDistanceMeters) || 0)),
      param2: 0,
      param3: triggerOnce === false ? 0 : FW_CAMERA_TRIGGER_ONCE,
      param4: 0
    };
  }

  /**
   * 将误写在 param3 的 LOITER_TO_ALT 半径迁移到 param2（兼容旧任务）。
   */
  function migrateLoiterToAltParams(wp) {
    if (!wp || wp.command !== CMD.NAV_LOITER_TO_ALT) {
      return wp;
    }
    const p2 = Number(wp.param2) || 0;
    const p3 = Number(wp.param3) || 0;
    if (p2 === 0 && p3 !== 0) {
      return Object.assign({}, wp, { param2: p3, param3: 0 });
    }
    return wp;
  }

  function normalizeWaypointForPlatform(wp, platform) {
    if (!wp || !isFixedWingPlatform(platform)) {
      return wp;
    }
    let next = migrateLoiterToAltParams(wp);
    const alt = Number(next.alt) || 0;

    if (next.command === CMD.NAV_TAKEOFF) {
      const pitch = Number(next.param1);
      const takeoffAlt = Number(next.param7) || alt;
      next = Object.assign(
        {},
        next,
        planeTakeoffFields(
          takeoffAlt,
          pitch > 0 ? pitch : FW_TAKEOFF_PITCH_DEG
        )
      );
    } else if (next.command === CMD.NAV_LOITER_TO_ALT) {
      const radius = Number(next.param2) || 0;
      next = Object.assign(
        {},
        next,
        planeLoiterToAltFields(radius, alt, Number(next.param4) || 0)
      );
    } else if (next.command === CMD.DO_SET_CAM_TRIGG_DIST && Number(next.param1) > 0) {
      next = Object.assign(
        {},
        next,
        planeCameraTriggerFields(next.param1, Number(next.param3) > 0)
      );
    }

    return next;
  }

  function normalizeWaypointsForPlatform(waypoints, platform) {
    if (!isFixedWingPlatform(platform)) {
      return waypoints || [];
    }
    return (waypoints || []).map(function (wp) {
      return normalizeWaypointForPlatform(wp, platform);
    });
  }

  function createPlaneTakeoffWaypoint(partial, takeoffAltMeters, pitchDeg) {
    const base = Object.assign(
      {
        command: CMD.NAV_TAKEOFF,
        frame: MM.MAV_FRAME_GLOBAL_RELATIVE_ALT_INT,
        label: "起飞",
        source: "template"
      },
      partial || {},
      planeTakeoffFields(
        takeoffAltMeters != null ? takeoffAltMeters : partial && partial.alt,
        pitchDeg
      )
    );
    return MM.createWaypoint(base);
  }

  function createPlaneLoiterToAltWaypoint(partial, radiusMeters, altitudeMeters) {
    const base = Object.assign(
      {
        command: CMD.NAV_LOITER_TO_ALT,
        frame: MM.MAV_FRAME_GLOBAL_RELATIVE_ALT_INT,
        label: "盘旋",
        source: partial && partial.source ? partial.source : "template"
      },
      partial || {},
      planeLoiterToAltFields(
        radiusMeters != null
          ? radiusMeters
          : partial && partial.param2,
        altitudeMeters != null ? altitudeMeters : partial && partial.alt,
        partial && partial.param4
      )
    );
    return MM.createWaypoint(base);
  }

  function createPlaneSurveyTurnWaypoint(partial, altitudeMeters) {
    return createPlaneLoiterToAltWaypoint(
      Object.assign(
        {
          label: "转弯",
          source: "survey",
          segmentRole: "turn"
        },
        partial || {}
      ),
      signedLoiterRadiusMeters(FW_SURVEY_TURN_LOITER_RADIUS_M, true),
      altitudeMeters
    );
  }

  window.FixedWingParams = {
    FW_TAKEOFF_PITCH_DEG: FW_TAKEOFF_PITCH_DEG,
    FW_BOOTSTRAP_LOITER_RADIUS_M: FW_BOOTSTRAP_LOITER_RADIUS_M,
    FW_SURVEY_TURN_LOITER_RADIUS_M: FW_SURVEY_TURN_LOITER_RADIUS_M,
    FW_LOITER_XTRACK_TANGENT: FW_LOITER_XTRACK_TANGENT,
    isFixedWingPlatform: isFixedWingPlatform,
    signedLoiterRadiusMeters: signedLoiterRadiusMeters,
    planeTakeoffFields: planeTakeoffFields,
    planeLoiterToAltFields: planeLoiterToAltFields,
    planeWaypointFields: planeWaypointFields,
    planeCameraTriggerFields: planeCameraTriggerFields,
    migrateLoiterToAltParams: migrateLoiterToAltParams,
    normalizeWaypointForPlatform: normalizeWaypointForPlatform,
    normalizeWaypointsForPlatform: normalizeWaypointsForPlatform,
    createPlaneTakeoffWaypoint: createPlaneTakeoffWaypoint,
    createPlaneLoiterToAltWaypoint: createPlaneLoiterToAltWaypoint,
    createPlaneSurveyTurnWaypoint: createPlaneSurveyTurnWaypoint
  };
})();
