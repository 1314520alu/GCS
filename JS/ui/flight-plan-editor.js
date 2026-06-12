(function () {
  const SURVEY_CAMERA_PRESETS = [
    {
      id: "sony-ilx-lr1",
      brand: "Sony",
      name: "Sony ILX-LR1",
      sensorWidthMm: 35.7,
      sensorHeightMm: 23.8,
      resolutionW: 9504,
      resolutionH: 6336,
      interchangeableLens: true,
      focalLengthsMm: [14, 20, 24, 35, 50, 55, 85, 135],
      focalLengthMinMm: 8,
      focalLengthMaxMm: 500
    },
    {
      id: "sony-a7r5",
      brand: "Sony",
      name: "Sony α7R V",
      sensorWidthMm: 35.7,
      sensorHeightMm: 23.8,
      resolutionW: 9504,
      resolutionH: 6336,
      interchangeableLens: true,
      focalLengthsMm: [14, 20, 24, 35, 50, 55, 85, 135],
      focalLengthMinMm: 8,
      focalLengthMaxMm: 500
    },
    {
      id: "sony-a7r4",
      brand: "Sony",
      name: "Sony α7R IV",
      sensorWidthMm: 35.7,
      sensorHeightMm: 23.8,
      resolutionW: 9504,
      resolutionH: 6336,
      interchangeableLens: true,
      focalLengthsMm: [14, 20, 24, 35, 50, 55, 85, 135],
      focalLengthMinMm: 8,
      focalLengthMaxMm: 500
    },
    {
      id: "sony-a7iv",
      brand: "Sony",
      name: "Sony α7 IV",
      sensorWidthMm: 35.9,
      sensorHeightMm: 23.9,
      resolutionW: 7008,
      resolutionH: 4672,
      interchangeableLens: true,
      focalLengthsMm: [14, 20, 24, 35, 50, 55, 85, 135],
      focalLengthMinMm: 8,
      focalLengthMaxMm: 500
    },
    {
      id: "sony-a7c2",
      brand: "Sony",
      name: "Sony α7C II",
      sensorWidthMm: 35.9,
      sensorHeightMm: 23.9,
      resolutionW: 7008,
      resolutionH: 4672,
      interchangeableLens: true,
      focalLengthsMm: [20, 24, 35, 40, 50, 55, 85],
      focalLengthMinMm: 8,
      focalLengthMaxMm: 500
    },
    {
      id: "sony-a6400",
      brand: "Sony",
      name: "Sony α6400 (APS-C)",
      sensorWidthMm: 23.5,
      sensorHeightMm: 15.6,
      resolutionW: 6000,
      resolutionH: 4000,
      interchangeableLens: true,
      focalLengthsMm: [10, 16, 18, 20, 24, 35, 50, 55],
      focalLengthMinMm: 8,
      focalLengthMaxMm: 300
    },
    {
      id: "sony-rx1r2",
      brand: "Sony",
      name: "Sony RX1R II",
      sensorWidthMm: 35.9,
      sensorHeightMm: 24.0,
      resolutionW: 7952,
      resolutionH: 5304,
      interchangeableLens: false,
      focalLengthsMm: [35],
      focalLengthMinMm: 35,
      focalLengthMaxMm: 35
    },
    {
      id: "zenmuse-p1",
      brand: "DJI",
      name: "DJI Zenmuse P1",
      sensorWidthMm: 35.9,
      sensorHeightMm: 24.0,
      resolutionW: 8192,
      resolutionH: 5460,
      interchangeableLens: false,
      focalLengthsMm: [24, 35, 50],
      focalLengthMinMm: 24,
      focalLengthMaxMm: 50
    },
    {
      id: "mavic-3e",
      brand: "DJI",
      name: "DJI Mavic 3 Enterprise",
      sensorWidthMm: 17.3,
      sensorHeightMm: 13.0,
      resolutionW: 5280,
      resolutionH: 3956,
      interchangeableLens: false,
      focalLengthsMm: [12.29],
      focalLengthMinMm: 12.29,
      focalLengthMaxMm: 12.29
    },
    {
      id: "phantom-4-rtk",
      brand: "DJI",
      name: "DJI Phantom 4 RTK",
      sensorWidthMm: 13.2,
      sensorHeightMm: 8.8,
      resolutionW: 4864,
      resolutionH: 3648,
      interchangeableLens: false,
      focalLengthsMm: [8.8],
      focalLengthMinMm: 8.8,
      focalLengthMaxMm: 8.8
    },
    {
      id: "share-6100",
      brand: "赛尔",
      name: "赛尔 SHARE 6100",
      sensorWidthMm: 23.5,
      sensorHeightMm: 15.6,
      resolutionW: 6000,
      resolutionH: 4000,
      interchangeableLens: false,
      focalLengthsMm: [25, 35, 50],
      focalLengthMinMm: 25,
      focalLengthMaxMm: 50
    },
    {
      id: "ixm-100",
      brand: "Phase One",
      name: "Phase One iXM-100",
      sensorWidthMm: 44.0,
      sensorHeightMm: 33.0,
      resolutionW: 11664,
      resolutionH: 8750,
      interchangeableLens: false,
      focalLengthsMm: [35, 55, 80],
      focalLengthMinMm: 35,
      focalLengthMaxMm: 80
    }
  ];

  const DEFAULT_MISSION_SETTINGS = {
    altitude: 300,
    speed: 20,
    surveyAltitude: 300,
    forwardOverlap: 0.7,
    sideOverlap: 0.7,
    cameraId: "sony-ilx-lr1",
    focalLengthMm: 35,
    turnAroundMeters: 20,
    surveyEntryCorner: "top-left",
    surveyHeadingDeg: null,
    surveyHeadingAuto: true,
    useTerrainFollowing: false,
    terrainAgMarginM: 30,
    terrainAutoPartition: false,
    terrainMaxReliefM: 120,
    terrainMaxSortieMin: 60,
    terrainMaxClimbRateMps: 4,
    terrainMaxDescentRateMps: 3,
    terrainMaxAglM: 200,
    terrainClimbSmoothing: true,
    terrainCruiseSpeedMps: 20,
    terrainPrefetchOnDraw: true
  };

  const TURN_AROUND_DEFAULT_MULTIROTOR_M = 20;
  const TURN_AROUND_DEFAULT_FIXED_WING_M = 100;

  function ensureLocalTileServerReady() {
    function postEnsure(url) {
      return fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      })
        .then(function (response) {
          if (!response.ok) {
            throw new Error("HTTP " + response.status);
          }
          return response.json().catch(function () {
            return { ok: true };
          });
        })
        .then(function (payload) {
          if (!payload || payload.ok === false) {
            throw new Error("高程服务启动失败");
          }
          return true;
        });
    }

    // Live Server(5501) 下没有 /__gcs 路由，先尝试当前站点，再回退到本地 runtime/watchdog。
    return postEnsure("/__gcs/ensure-tile-server")
      .catch(function () {
        return postEnsure("http://127.0.0.1:8766/__gcs/ensure-tile-server");
      })
      .catch(function () {
        return postEnsure("http://127.0.0.1:8767/launch");
      })
      .then(function () {
        const TS = window.TerrainService;
        if (TS && typeof TS.probeHealth === "function") {
          return TS.probeHealth(true).then(function (health) {
            return !!(health && health.ok);
          });
        }
        return fetch((window.TILE_SERVER || "http://127.0.0.1:8768") + "/health", {
          cache: "no-store"
        }).then(function (response) {
          return response.ok;
        });
      });
  }

  function getDefaultTurnAroundMeters(platform) {
    const FWP = window.FixedWingParams;
    if (FWP && FWP.isFixedWingPlatform(platform)) {
      return TURN_AROUND_DEFAULT_FIXED_WING_M;
    }
    return TURN_AROUND_DEFAULT_MULTIROTOR_M;
  }

  const SURVEY_ENTRY_CORNER_OPTIONS = [
    { id: "top-left", label: "左上" },
    { id: "top-right", label: "右上" },
    { id: "bottom-left", label: "左下" },
    { id: "bottom-right", label: "右下" }
  ];

  function normalizeSurveyEntryCorner(value) {
    const match = SURVEY_ENTRY_CORNER_OPTIONS.find(function (option) {
      return option.id === value;
    });
    return match ? match.id : DEFAULT_MISSION_SETTINGS.surveyEntryCorner;
  }

  function resolveSurveyEntryConfig(entryCorner) {
    const corner = normalizeSurveyEntryCorner(entryCorner);
    return {
      reverseRows: corner === "top-left" || corner === "top-right",
      firstRowForward: corner === "top-left" || corner === "bottom-left"
    };
  }

  function getSurveyPathPointRole(pointIndex, pointCount) {
    if (pointCount === 4) {
      return ["overshoot-entry", "line-start", "line-end", "overshoot-exit"][pointIndex];
    }
    if (pointCount === 2) {
      return pointIndex === 0 ? "line-start" : "line-end";
    }
    return "connector";
  }

  function computeBearingDegrees(from, to) {
    const lat1 = (from.lat * Math.PI) / 180;
    const lat2 = (to.lat * Math.PI) / 180;
    const dLng = ((to.lng - from.lng) * Math.PI) / 180;
    const y = Math.sin(dLng) * Math.cos(lat2);
    const x =
      Math.cos(lat1) * Math.sin(lat2) -
      Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
    return (Math.atan2(y, x) * 180) / Math.PI;
  }

  function midpointLatLng(a, b) {
    return {
      lat: (a.lat + b.lat) / 2,
      lng: (a.lng + b.lng) / 2
    };
  }

  function pointOnSegment(start, end, ratio) {
    const t = clamp(Number(ratio) || 0, 0, 1);
    return {
      lat: start.lat + (end.lat - start.lat) * t,
      lng: start.lng + (end.lng - start.lng) * t
    };
  }

  function offsetLatLngMeters(point, bearingDegrees, forwardMeters, rightMeters) {
    const bearing = (bearingDegrees * Math.PI) / 180;
    const rightBearing = bearing + Math.PI / 2;
    const metersPerLat = 111320;
    const metersPerLng =
      Math.cos((point.lat * Math.PI) / 180) * metersPerLat || 1;
    const dLat =
      (forwardMeters * Math.cos(bearing) + rightMeters * Math.cos(rightBearing)) /
      metersPerLat;
    const dLng =
      (forwardMeters * Math.sin(bearing) + rightMeters * Math.sin(rightBearing)) /
      metersPerLng;
    return { lat: point.lat + dLat, lng: point.lng + dLng };
  }

  function distanceMetersBetween(a, b) {
    const earthRadius = 6371000;
    const lat1 = (a.lat * Math.PI) / 180;
    const lat2 = (b.lat * Math.PI) / 180;
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLng = ((b.lng - a.lng) * Math.PI) / 180;
    const h =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * earthRadius * Math.asin(Math.sqrt(h));
  }

  function pointToSegmentDistance(p, a, b) {
    const dx = b.lng - a.lng;
    const dy = b.lat - a.lat;
    const len2 = dx * dx + dy * dy;
    if (len2 === 0) {
      return distanceMetersBetween(p, a);
    }
    let t = ((p.lng - a.lng) * dx + (p.lat - a.lat) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    const proj = { lng: a.lng + t * dx, lat: a.lat + t * dy };
    return distanceMetersBetween(p, proj);
  }

  const SURVEY_ROUTE_WP_LABEL_QUADRANTS = ["ne", "nw", "se", "sw"];

  function extractSurveyRouteWaypoints(path) {
    if (!Array.isArray(path) || !path.length) {
      return [];
    }

    if (path.length === 1) {
      return [{ lng: path[0].lng, lat: path[0].lat }];
    }

    const minTurnDegrees = 8;
    const corners = [];

    function pushUnique(point) {
      const last = corners[corners.length - 1];
      if (last && distanceMetersBetween(last, point) < 2) {
        return;
      }
      corners.push({ lng: point.lng, lat: point.lat });
    }

    pushUnique(path[0]);

    for (let index = 1; index < path.length - 1; index += 1) {
      const previous = path[index - 1];
      const current = path[index];
      const next = path[index + 1];
      const isRoleCorner =
        current.role === "line-start" || current.role === "line-end";
      const bearingIn = computeBearingDegrees(previous, current);
      const bearingOut = computeBearingDegrees(current, next);
      let turnDelta = Math.abs(bearingOut - bearingIn);
      if (turnDelta > 180) {
        turnDelta = 360 - turnDelta;
      }

      if (isRoleCorner || turnDelta >= minTurnDegrees) {
        pushUnique(current);
      }
    }

    pushUnique(path[path.length - 1]);
    return corners;
  }

  function layoutSurveyRouteWaypoints(waypoints, minSeparationMeters) {
    const items = waypoints.map(function (point, index) {
      return {
        lng: point.lng,
        lat: point.lat,
        seq: index + 1,
        displayLat: point.lat,
        displayLng: point.lng,
        labelQuadrant: SURVEY_ROUTE_WP_LABEL_QUADRANTS[index % 4]
      };
    });

    for (let pass = 0; pass < 10; pass += 1) {
      for (let i = 0; i < items.length; i += 1) {
        for (let j = i + 1; j < items.length; j += 1) {
          const a = { lat: items[i].displayLat, lng: items[i].displayLng };
          const b = { lat: items[j].displayLat, lng: items[j].displayLng };
          const gap = distanceMetersBetween(a, b);
          if (gap >= minSeparationMeters) {
            continue;
          }

          const pushBearing = computeBearingDegrees(a, b);
          const pushDistance = minSeparationMeters - gap + 1.5;
          const moved = offsetLatLngMeters(b, pushBearing, pushDistance, 0);
          items[j].displayLat = moved.lat;
          items[j].displayLng = moved.lng;
          items[j].labelQuadrant =
            SURVEY_ROUTE_WP_LABEL_QUADRANTS[(j + pass + i) % 4];
        }
      }
    }

    return items;
  }

  function getSurveyCamera(cameraId) {
    const match = SURVEY_CAMERA_PRESETS.find(function (camera) {
      return camera.id === cameraId;
    });
    return match || SURVEY_CAMERA_PRESETS[0];
  }

  function cameraHasInterchangeableLens(camera) {
    return Boolean(camera && camera.interchangeableLens);
  }

  function normalizeCameraFocalLength(camera, focalLengthMm) {
    const presets = camera.focalLengthsMm || [];
    let focal = Number(focalLengthMm);

    if (!isFinite(focal) || focal <= 0) {
      focal = presets[0] || 35;
    }

    if (cameraHasInterchangeableLens(camera)) {
      const minFocal = Number(camera.focalLengthMinMm) || 8;
      const maxFocal = Number(camera.focalLengthMaxMm) || 500;
      return round(clamp(focal, minFocal, maxFocal), 2);
    }

    if (presets.indexOf(focal) === -1) {
      return presets[0];
    }

    return focal;
  }

  function getCameraBrandGroups() {
    const groups = [];
    const groupMap = {};

    SURVEY_CAMERA_PRESETS.forEach(function (camera) {
      const brand = camera.brand || "其他";
      if (!groupMap[brand]) {
        groupMap[brand] = [];
        groups.push({ brand: brand, cameras: groupMap[brand] });
      }
      groupMap[brand].push(camera);
    });

    return groups;
  }

  function computeGroundFootprintMeters(camera, focalLengthMm, altitudeMeters) {
    const focal = Math.max(1, Number(focalLengthMm) || 1);
    const altitude = Math.max(1, Number(altitudeMeters) || 1);
    return {
      widthMeters: (Number(camera.sensorWidthMm) / focal) * altitude,
      heightMeters: (Number(camera.sensorHeightMm) / focal) * altitude
    };
  }

  function getCameraSwathWidthMeters(settings) {
    const camera = getSurveyCamera(settings.cameraId);
    const focalLengthMm = normalizeCameraFocalLength(camera, settings.focalLengthMm);
    const altitude = Number(settings.surveyAltitude) || Number(settings.altitude) || 100;
    return computeGroundFootprintMeters(camera, focalLengthMm, altitude).widthMeters;
  }

  function applyAutoFootprintFromCamera(settings) {
    const camera = getSurveyCamera(settings.cameraId);
    const focalLengthMm = normalizeCameraFocalLength(camera, settings.focalLengthMm);
    const altitude = Number(settings.surveyAltitude) || Number(settings.altitude) || 100;
    const footprint = computeGroundFootprintMeters(camera, focalLengthMm, altitude);

    settings.cameraId = camera.id;
    settings.focalLengthMm = focalLengthMm;
    settings.footprintWidthMeters = round(footprint.widthMeters, 1);
    settings.footprintHeightMeters = round(footprint.heightMeters, 1);
    return settings;
  }

  const OVERLAP_PERCENT_MIN = 1;
  const OVERLAP_PERCENT_MAX = 99;
  const OVERLAP_FRACTION_MIN = 0.01;
  const OVERLAP_FRACTION_MAX = 0.99;

  function overlapFractionToPercent(fraction) {
    return Math.round(
      clamp(Number(fraction) || 0, OVERLAP_FRACTION_MIN, OVERLAP_FRACTION_MAX) * 100
    );
  }

  function formatOverlapPercentDisplay(fraction) {
    return String(overlapFractionToPercent(fraction));
  }

  function overlapPercentToFraction(percent) {
    const percentInt = Math.round(
      clamp(Number(percent), OVERLAP_PERCENT_MIN, OVERLAP_PERCENT_MAX)
    );
    return percentInt / 100;
  }

  function isValidOverlapPercentDraft(text) {
    if (text === "") {
      return true;
    }
    if (!/^\d{1,2}$/.test(text)) {
      return false;
    }
    return Number(text) <= OVERLAP_PERCENT_MAX;
  }

  function parseOverlapPercentInput(text) {
    const trimmed = String(text).trim();
    if (trimmed === "") {
      return null;
    }
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : NaN;
  }

  function normalizeMissionSettings(raw) {
    const source = raw || {};
    const settings = Object.assign({}, DEFAULT_MISSION_SETTINGS, source);

    settings.altitude = formatMissionSettingValue(
      "altitude",
      Number(settings.altitude) || DEFAULT_MISSION_SETTINGS.altitude
    );
    settings.speed = formatMissionSettingValue(
      "speed",
      Number(settings.speed) || DEFAULT_MISSION_SETTINGS.speed
    );
    settings.turnAroundMeters = formatMissionSettingValue(
      "turnAroundMeters",
      Number(settings.turnAroundMeters) || DEFAULT_MISSION_SETTINGS.turnAroundMeters
    );
    settings.forwardOverlap = formatMissionSettingValue(
      "forwardOverlap",
      clamp(
        Number(
          source.forwardOverlap != null
            ? source.forwardOverlap
            : source.overlapRate != null
              ? source.overlapRate
              : settings.forwardOverlap
        ) || DEFAULT_MISSION_SETTINGS.forwardOverlap,
        OVERLAP_FRACTION_MIN,
        OVERLAP_FRACTION_MAX
      )
    );
    settings.sideOverlap = formatMissionSettingValue(
      "sideOverlap",
      clamp(
        Number(
          source.sideOverlap != null
            ? source.sideOverlap
            : source.overlapRate != null
              ? source.overlapRate
              : settings.sideOverlap
        ) || DEFAULT_MISSION_SETTINGS.sideOverlap,
        OVERLAP_FRACTION_MIN,
        OVERLAP_FRACTION_MAX
      )
    );

    if (source.surveyAltitude == null || source.surveyAltitude === "") {
      settings.surveyAltitude = settings.altitude;
    } else {
      settings.surveyAltitude = formatMissionSettingValue(
        "surveyAltitude",
        Number(settings.surveyAltitude) || settings.altitude
      );
    }

    settings.cameraId = getSurveyCamera(source.cameraId || settings.cameraId).id;
    settings.focalLengthMm = Number(settings.focalLengthMm) || DEFAULT_MISSION_SETTINGS.focalLengthMm;
    settings.surveyEntryCorner = normalizeSurveyEntryCorner(
      source.surveyEntryCorner || settings.surveyEntryCorner
    );
    settings.surveyHeadingAuto =
      source.surveyHeadingAuto == null ? true : Boolean(source.surveyHeadingAuto);
    if (source.surveyHeadingDeg == null || source.surveyHeadingDeg === "") {
      settings.surveyHeadingDeg = null;
    } else {
      const hd = Number(source.surveyHeadingDeg);
      settings.surveyHeadingDeg = Number.isFinite(hd) ? Math.round(hd) % 360 : null;
    }

    settings.useTerrainFollowing = Boolean(source.useTerrainFollowing);
    settings.terrainAgMarginM =
      Number(source.terrainAgMarginM) || DEFAULT_MISSION_SETTINGS.terrainAgMarginM;
    settings.terrainAutoPartition =
      source.terrainAutoPartition == null
        ? DEFAULT_MISSION_SETTINGS.terrainAutoPartition
        : Boolean(source.terrainAutoPartition);
    settings.terrainMaxReliefM =
      Number(source.terrainMaxReliefM) || DEFAULT_MISSION_SETTINGS.terrainMaxReliefM;
    settings.terrainMaxSortieMin =
      Number(source.terrainMaxSortieMin) || DEFAULT_MISSION_SETTINGS.terrainMaxSortieMin;
    settings.terrainMaxClimbRateMps =
      Number(source.terrainMaxClimbRateMps) || DEFAULT_MISSION_SETTINGS.terrainMaxClimbRateMps;
    settings.terrainMaxDescentRateMps =
      Number(source.terrainMaxDescentRateMps) ||
      Number(source.terrainMaxClimbRateMps) ||
      DEFAULT_MISSION_SETTINGS.terrainMaxDescentRateMps;
    settings.terrainMaxAglM =
      Number(source.terrainMaxAglM) || DEFAULT_MISSION_SETTINGS.terrainMaxAglM;
    settings.terrainClimbSmoothing =
      source.terrainClimbSmoothing == null
        ? DEFAULT_MISSION_SETTINGS.terrainClimbSmoothing
        : Boolean(source.terrainClimbSmoothing);
    settings.terrainCruiseSpeedMps =
      Number(source.terrainCruiseSpeedMps || source.speed) ||
      DEFAULT_MISSION_SETTINGS.terrainCruiseSpeedMps;
    settings.terrainPrefetchOnDraw =
      source.terrainPrefetchOnDraw == null
        ? DEFAULT_MISSION_SETTINGS.terrainPrefetchOnDraw
        : Boolean(source.terrainPrefetchOnDraw);

    applyAutoFootprintFromCamera(settings);

    return settings;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function round(value, digits) {
    const factor = 10 ** digits;
    return Math.round(value * factor) / factor;
  }

  function formatMissionSettingValue(key, value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return value;
    }

    switch (key) {
      case "altitude":
      case "surveyAltitude":
      case "turnAroundMeters":
        return Math.round(numeric);
      case "speed":
      case "footprintWidthMeters":
        return round(numeric, 1);
      case "forwardOverlap":
      case "sideOverlap":
        return round(numeric, 2);
      default:
        return numeric;
    }
  }

  function createNumericSettingHandlers(handleSettingChange, key, options) {
    const integerOnly = Boolean(options && options.integer);

    return {
      onChange: function (event) {
        handleSettingChange(key, event.target.value, integerOnly);
      },
      onBlur: integerOnly
        ? undefined
        : function (event) {
            handleSettingChange(key, event.target.value, true);
          }
    };
  }

  function lngLatEquals(a, b, epsilon) {
    return Math.abs(a.lng - b.lng) <= epsilon && Math.abs(a.lat - b.lat) <= epsilon;
  }

  function computeLineSpacingMeters(overlapRate, footprintWidthMeters) {
    const safeOverlap = clamp(Number(overlapRate) || 0, OVERLAP_FRACTION_MIN, OVERLAP_FRACTION_MAX);
    const safeFootprint = Math.max(5, Number(footprintWidthMeters) || 60);
    return safeFootprint * (1 - safeOverlap);
  }

  function getSurveyOrigin(vertices) {
    const seed = vertices && vertices.length ? vertices[0] : { lng: 0, lat: 0 };
    return { lng: Number(seed.lng) || 0, lat: Number(seed.lat) || 0 };
  }

  function projectLngLatToMeters(point, origin) {
    const metersPerLat = 111320;
    const metersPerLng = Math.cos((origin.lat * Math.PI) / 180) * metersPerLat;
    return {
      x: (point.lng - origin.lng) * metersPerLng,
      y: (point.lat - origin.lat) * metersPerLat
    };
  }

  function projectMetersToLngLat(point, origin) {
    const metersPerLat = 111320;
    const metersPerLng = Math.cos((origin.lat * Math.PI) / 180) * metersPerLat || 1;
    return {
      lng: origin.lng + point.x / metersPerLng,
      lat: origin.lat + point.y / metersPerLat
    };
  }

  function rotatePoint(point, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
      x: point.x * cos - point.y * sin,
      y: point.x * sin + point.y * cos
    };
  }

  function inverseRotatePoint(point, angle) {
    return rotatePoint(point, -angle);
  }

  function getLongestEdgeHeading(points) {
    if (!Array.isArray(points) || points.length < 2) {
      return 0;
    }

    let bestLength = 0;
    let bestHeading = 0;

    for (let index = 0; index < points.length; index += 1) {
      const current = points[index];
      const next = points[(index + 1) % points.length];
      const dx = next.x - current.x;
      const dy = next.y - current.y;
      const distanceSq = dx * dx + dy * dy;
      if (distanceSq > bestLength) {
        bestLength = distanceSq;
        bestHeading = Math.atan2(dx, dy);
      }
    }

    return bestHeading;
  }

  function getHorizontalIntersections(points, y) {
    const intersections = [];

    for (let index = 0; index < points.length; index += 1) {
      const start = points[index];
      const end = points[(index + 1) % points.length];
      const minY = Math.min(start.y, end.y);
      const maxY = Math.max(start.y, end.y);

      if (start.y === end.y) {
        continue;
      }

      if (y < minY || y >= maxY) {
        continue;
      }

      const ratio = (y - start.y) / (end.y - start.y);
      intersections.push(start.x + ratio * (end.x - start.x));
    }

    intersections.sort(function (left, right) {
      return left - right;
    });

    const deduped = [];
    intersections.forEach(function (x) {
      if (!deduped.length || Math.abs(x - deduped[deduped.length - 1]) > 0.05) {
        deduped.push(x);
      }
    });

    return deduped;
  }

  function getRowLegEndpoints(orderedSegments, forward) {
    if (!orderedSegments || !orderedSegments.length) {
      return null;
    }
    const firstSeg = orderedSegments[0];
    const lastSeg = orderedSegments[orderedSegments.length - 1];
    if (forward) {
      return { from: firstSeg[0], to: lastSeg[1] };
    }
    return { from: firstSeg[1], to: lastSeg[0] };
  }

  function buildSurveyRows(rotatedPolygon, rowSpacing) {
    const bounds = rotatedPolygon.reduce(
      function (accumulator, point) {
        accumulator.minY = Math.min(accumulator.minY, point.y);
        accumulator.maxY = Math.max(accumulator.maxY, point.y);
        return accumulator;
      },
      { minY: Infinity, maxY: -Infinity }
    );

    if (!isFinite(bounds.minY) || !isFinite(bounds.maxY)) {
      return [];
    }

    const rows = [];
    const startY = bounds.minY + rowSpacing / 2;

    for (let y = startY; y <= bounds.maxY + 0.0001; y += rowSpacing) {
      const intersections = getHorizontalIntersections(rotatedPolygon, y);
      if (intersections.length < 2) {
        continue;
      }

      const segments = [];
      for (let index = 0; index < intersections.length - 1; index += 2) {
        const startX = intersections[index];
        const endX = intersections[index + 1];
        if (Math.abs(endX - startX) < 0.001) {
          continue;
        }
        segments.push([
          { x: startX, y: y },
          { x: endX, y: y }
        ]);
      }

      if (segments.length) {
        rows.push(segments);
      }
    }

    return rows;
  }

  function generateSurveyPath(polygonVertices, overlapRate, options) {
    const settings = options || {};
    const vertices = Array.isArray(polygonVertices) ? polygonVertices : [];

    if (vertices.length < 3) {
      return [];
    }

    const origin = getSurveyOrigin(vertices);
    const localPolygon = vertices.map(function (vertex) {
      return projectLngLatToMeters(vertex, origin);
    });

    let rotationRad;
    if (Number.isFinite(settings.headingRadians)) {
      rotationRad = settings.headingRadians;
    } else if (Number.isFinite(settings.headingDegrees)) {
      const SP = window.SurveyPlanner;
      rotationRad =
        SP && typeof SP.trueNorthBearingDegToLocalRotationRad === "function"
          ? SP.trueNorthBearingDegToLocalRotationRad(settings.headingDegrees)
          : Math.PI / 2 - (settings.headingDegrees * Math.PI) / 180;
    } else {
      rotationRad = Math.PI / 2 - getLongestEdgeHeading(localPolygon);
    }
    const rotatedPolygon = localPolygon.map(function (point) {
      return rotatePoint(point, -rotationRad);
    });

    const rowSpacing = Math.max(
      4,
      Number(settings.lineSpacingMeters) ||
        computeLineSpacingMeters(overlapRate, settings.footprintWidthMeters)
    );
    const turnAroundMeters = Math.max(0, Number(settings.turnAroundMeters) || 0);
    const entryConfig = resolveSurveyEntryConfig(settings.entryCorner || settings.surveyEntryCorner);
    const rows = buildSurveyRows(rotatedPolygon, rowSpacing);
    const orderedRows = entryConfig.reverseRows ? rows.slice().reverse() : rows;
    const path = [];

    orderedRows.forEach(function (segments, rowIndex) {
      const forward = entryConfig.firstRowForward
        ? rowIndex % 2 === 0
        : rowIndex % 2 !== 0;
      const orderedSegments = forward ? segments.slice() : segments.slice().reverse();
      const leg = getRowLegEndpoints(orderedSegments, forward);
      if (!leg) {
        return;
      }

      const from = leg.from;
      const to = leg.to;
      const legStart =
        turnAroundMeters > 0
          ? { x: from.x - (forward ? turnAroundMeters : -turnAroundMeters), y: from.y }
          : from;
      const legEnd =
        turnAroundMeters > 0
          ? { x: to.x + (forward ? turnAroundMeters : -turnAroundMeters), y: to.y }
          : to;

      const orderedPoints = turnAroundMeters > 0 ? [legStart, from, to, legEnd] : [from, to];

      orderedPoints.forEach(function (point, pointIndex) {
        const rotatedBack = inverseRotatePoint(point, -rotationRad);
        const lngLat = projectMetersToLngLat(rotatedBack, origin);
        const previous = path[path.length - 1];
        const role = getSurveyPathPointRole(pointIndex, orderedPoints.length);

        if (previous && lngLatEquals(previous, lngLat, 1e-9)) {
          return;
        }

        path.push({
          lng: lngLat.lng,
          lat: lngLat.lat,
          row: rowIndex,
          segment: 0,
          role: role
        });
      });
    });

    return path;
  }

  function createEmptyFeatureCollection() {
    return {
      type: "FeatureCollection",
      features: []
    };
  }

  function createWaypointPointGeoJSON(waypoints) {
    return {
      type: "FeatureCollection",
      features: waypoints.map(function (point, index) {
        return {
          type: "Feature",
          properties: {
            label: "WP" + (index + 1),
            altitude: point.alt
          },
          geometry: {
            type: "Point",
            coordinates: [point.lng, point.lat]
          }
        };
      })
    };
  }

  function createWaypointLineGeoJSON(waypoints) {
    if (waypoints.length < 2) {
      return createEmptyFeatureCollection();
    }

    return {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: waypoints.map(function (point) {
              return [point.lng, point.lat];
            })
          }
        }
      ]
    };
  }

  function createSurveyPolygonGeoJSON(area) {
    if (area.length < 3) {
      return createEmptyFeatureCollection();
    }

    const ring = area.map(function (point) {
      return [point.lng, point.lat];
    });
    ring.push([area[0].lng, area[0].lat]);

    return {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {},
          geometry: {
            type: "Polygon",
            coordinates: [ring]
          }
        }
      ]
    };
  }

  function createSurveyVertexGeoJSON(area) {
    return {
      type: "FeatureCollection",
      features: area.map(function (point, index) {
        return {
          type: "Feature",
          properties: {
            label: "A" + (index + 1)
          },
          geometry: {
            type: "Point",
            coordinates: [point.lng, point.lat]
          }
        };
      })
    };
  }

  function createSurveyPathGeoJSON(path) {
    if (path.length < 2) {
      return createEmptyFeatureCollection();
    }

    return {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: path.map(function (point) {
              return [point.lng, point.lat];
            })
          }
        }
      ]
    };
  }

  function fitMissionBounds(map, waypoints, surveyArea, surveyPath) {
    if (!map || typeof map.fitBounds !== "function" || !window.L) {
      return;
    }

    const latLngs = []
      .concat(
        waypoints.map(function (point) {
          return [point.lat, point.lng];
        })
      )
      .concat(
        surveyArea.map(function (point) {
          return [point.lat, point.lng];
        })
      )
      .concat(
        surveyPath.map(function (point) {
          return [point.lat, point.lng];
        })
      );

    if (!latLngs.length) {
      return;
    }

    map.fitBounds(window.L.latLngBounds(latLngs), {
      padding: [40, 40],
      animate: false
    });
  }

  function addFlightPlanBaseLayers(map) {
    if (typeof window.addGcsMapBaseLayers === "function") {
      window.addGcsMapBaseLayers(map);
    }
  }

  const WAYPOINT_LABEL_QUADRANTS = ["ne", "nw", "se", "sw"];

  function getVehicleHeadingDegrees() {
    const yaw = Number(window.yaw);
    if (!Number.isFinite(yaw)) {
      return 0;
    }
    let deg = (yaw * 180) / Math.PI;
    deg = ((deg % 360) + 360) % 360;
    return deg;
  }

  function normalizeFlightPlanPlatform(platform) {
    const VMI = window.VehicleMarkerIcons;
    if (VMI && typeof VMI.normalizeVehicleMarkerKind === "function") {
      return VMI.normalizeVehicleMarkerKind(platform);
    }
    return "multirotor-x";
  }

  function createHomeMarkerIcon(homeSource) {
    const live = homeSource === "vehicle";
    return window.L.divIcon({
      className: "fp-home-marker" + (live ? " fp-home-marker--live" : ""),
      html:
        '<span class="fp-home-marker-wrap" title="Home">' +
        '<span class="fp-home-marker-badge">H</span>' +
        '<span class="fp-home-marker-label">Home</span>' +
        "</span>",
      iconSize: [56, 28],
      iconAnchor: [14, 14]
    });
  }

  function vehicleMarkerSvg(platform) {
    const kind = normalizeFlightPlanPlatform(platform);
    const VMI = window.VehicleMarkerIcons;
    if (VMI && typeof VMI.vehicleMarkerSvg === "function") {
      return VMI.vehicleMarkerSvg(kind);
    }
    return "";
  }

  function createVehicleMapIcon(platform, headingDeg) {
    const kind = normalizeFlightPlanPlatform(platform);
    const rotation = Number.isFinite(headingDeg) ? headingDeg : 0;
    return window.L.divIcon({
      className: "fp-vehicle-marker fp-vehicle-marker--" + kind,
      html:
        '<span class="fp-vehicle-marker-wrap" title="飞机位置">' +
        '<span class="fp-vehicle-marker-rot" style="transform:rotate(' +
        rotation.toFixed(1) +
        'deg)">' +
        vehicleMarkerSvg(platform) +
        "</span>" +
        "</span>",
      iconSize: [80, 80],
      iconAnchor: [40, 40]
    });
  }

  function syncFlightPlanMapOverlays(layers, platform) {
    if (!layers || !window.L) {
      return;
    }

    const MM = window.MissionModel;
    const homeGroup = layers.homeGroup;
    const vehicleGroup = layers.vehicleGroup;
    if (!homeGroup || !vehicleGroup) {
      return;
    }

    homeGroup.clearLayers();
    vehicleGroup.clearLayers();

    const home =
      MM && MM.getFlightPlanHomeLatLng
        ? MM.getFlightPlanHomeLatLng()
        : {
            lat: window.DEFAULT_MAP_LAT || 29.59256,
            lng: window.DEFAULT_MAP_LON || 106.22742,
            alt: 30,
            source: "default"
          };

    const homeMarker = window.L.marker([home.lat, home.lng], {
      icon: createHomeMarkerIcon(home.source),
      interactive: false,
      zIndexOffset: 600
    });
    homeMarker.bindPopup(
      "<strong>Home</strong><br>" +
        round(home.lng, 6).toFixed(6) +
        ", " +
        round(home.lat, 6).toFixed(6) +
        (home.source === "vehicle" ? "<br>飞控当前位置" : "<br>地图默认中心")
    );
    homeGroup.addLayer(homeMarker);

    const hasVehicle =
      MM && MM.hasFlightPlanVehiclePosition
        ? MM.hasFlightPlanVehiclePosition()
        : false;
    if (hasVehicle) {
      const heading = getVehicleHeadingDegrees();
      const vehicleMarker = window.L.marker([window.lat, window.lon], {
        icon: createVehicleMapIcon(platform, heading),
        interactive: false,
        zIndexOffset: 900
      });
      const altText =
        typeof window.altitude === "number" && isFinite(window.altitude)
          ? window.altitude.toFixed(1) + " m"
          : "--";
      vehicleMarker.bindPopup(
        "<strong>飞机</strong><br>" +
          round(window.lon, 6).toFixed(6) +
          ", " +
          round(window.lat, 6).toFixed(6) +
          "<br>高度 " +
          altText
      );
      vehicleGroup.addLayer(vehicleMarker);
    }
  }

  function buildHomePreviewTableRow(missionWaypoints) {
    const MM = window.MissionModel;
    const AP = window.ArdupilotMissionCompat;
    const home = resolvePreviewHome(
      missionWaypoints,
      MM && MM.getFlightPlanHomeLatLng ? MM.getFlightPlanHomeLatLng() : null
    );
    const homeFrame =
      home.frame != null
        ? home.frame
        : AP && AP.MAV_FRAME_GLOBAL != null
          ? AP.MAV_FRAME_GLOBAL
          : 0;
    return {
      key: "home-0",
      seq: 0,
      label: "Home",
      lng: home.lng,
      lat: home.lat,
      alt: home.alt,
      frame: homeFrame,
      frameLabel: String(homeFrame),
      preview: false,
      isSurvey: false,
      isHome: true,
      missionIndex: -1,
      canDelete: false
    };
  }

  function createWaypointMarkerIcon(waypointIndex, altitude, roleLabel, labelQuadrant) {
    const altText =
      typeof altitude === "number" && isFinite(altitude) ? Math.round(altitude) + " m" : "--";
    const title = roleLabel
      ? roleLabel + " · " + altText
      : "航点 " + waypointIndex + " · " + altText;
    const quad = labelQuadrant || "ne";
    const roleHtml = roleLabel
      ? '<span class="fp-waypoint-marker-role-label fp-waypoint-marker-role-label--' +
        quad +
        '">' +
        roleLabel +
        "</span>"
      : "";
    return window.L.divIcon({
      className: "fp-waypoint-marker",
      html:
        '<span class="fp-waypoint-marker-wrap" title="' +
        title +
        '">' +
        '<span class="fp-waypoint-marker-body">' +
        '<span class="fp-waypoint-marker-dot">' +
        waypointIndex +
        "</span>" +
        roleHtml +
        "</span>" +
        '<span class="fp-waypoint-marker-alt-tag">' +
        altText +
        "</span>" +
        "</span>",
      iconSize: [72, 28],
      iconAnchor: [14, 14]
    });
  }

  function createSurveyVertexMarkerIcon(vertexIndex) {
    return window.L.divIcon({
      className: "fp-survey-vertex-marker",
      html:
        '<span class="fp-survey-vertex-marker-dot" title="区域顶点 ' +
        vertexIndex +
        '（拖拽移动，右键菜单删除）">' +
        vertexIndex +
        "</span>",
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });
  }

  function showSurveyVertexContextMenu(originalEvent, vertexIndex, deleteCallback) {
    if (!originalEvent || typeof deleteCallback !== "function") {
      return;
    }
    const existing = document.querySelector(".fp-survey-ctx-menu");
    if (existing && existing.parentNode) {
      existing.parentNode.removeChild(existing);
    }
    const menu = document.createElement("div");
    menu.className = "fp-survey-ctx-menu";
    menu.innerHTML =
      '<div class="fp-ctx-item fp-ctx-danger" data-action="delete">删除顶点 ' +
      (vertexIndex + 1) +
      '</div><div class="fp-ctx-item" data-action="cancel">取消</div>';

    const pageX = originalEvent.pageX != null ? originalEvent.pageX : originalEvent.clientX + window.scrollX;
    const pageY = originalEvent.pageY != null ? originalEvent.pageY : originalEvent.clientY + window.scrollY;
    menu.style.position = "absolute";
    menu.style.left = pageX + "px";
    menu.style.top = pageY + "px";
    menu.style.zIndex = "2500";
    document.body.appendChild(menu);

    function closeMenu() {
      if (menu.parentNode) {
        menu.parentNode.removeChild(menu);
      }
      document.removeEventListener("pointerdown", onDocClick, true);
      document.removeEventListener("keydown", onKey, true);
    }

    function onDocClick(ev) {
      if (!menu.contains(ev.target)) {
        closeMenu();
      }
    }

    function onKey(ev) {
      if (ev.key === "Escape") {
        closeMenu();
      }
    }

    menu.addEventListener("click", function (ev) {
      const actionEl = ev.target && ev.target.closest ? ev.target.closest("[data-action]") : ev.target;
      const action = actionEl && actionEl.dataset ? actionEl.dataset.action : null;
      if (action === "delete") {
        closeMenu();
        deleteCallback(vertexIndex);
      } else if (action === "cancel") {
        closeMenu();
      }
    });

    setTimeout(function () {
      document.addEventListener("pointerdown", onDocClick, true);
      document.addEventListener("keydown", onKey, true);
    }, 0);
  }

  function createPartitionVertexMarkerIcon() {
    return window.L.divIcon({
      className: "fp-partition-vertex-marker",
      html: '<span class="fp-partition-vertex-dot"></span>',
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    });
  }

  function createPartitionBlockLabelIcon(order, reliefText, minutesText, over, selected) {
    const cls =
      "fp-partition-label" +
      (over ? " fp-partition-label--over" : "") +
      (selected ? " fp-partition-label--selected" : "");
    return window.L.divIcon({
      className: "fp-partition-label-wrap",
      html:
        '<div class="' +
        cls +
        '"><strong>块 ' +
        order +
        "</strong><span>Δ" +
        reliefText +
        "m · ~" +
        minutesText +
        "min</span></div>",
      iconSize: [96, 34],
      iconAnchor: [48, 17]
    });
  }

  function convexHullLngLat(points) {
    const pts = (points || [])
      .filter(function (p) {
        return p && Number.isFinite(Number(p.lng)) && Number.isFinite(Number(p.lat));
      })
      .map(function (p) {
        return { lng: Number(p.lng), lat: Number(p.lat) };
      });
    if (pts.length < 3) {
      return pts;
    }
    pts.sort(function (a, b) {
      return a.lng === b.lng ? a.lat - b.lat : a.lng - b.lng;
    });
    const cross = function (o, a, b) {
      return (a.lng - o.lng) * (b.lat - o.lat) - (a.lat - o.lat) * (b.lng - o.lng);
    };
    const lower = [];
    pts.forEach(function (p) {
      while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
        lower.pop();
      }
      lower.push(p);
    });
    const upper = [];
    for (let i = pts.length - 1; i >= 0; i -= 1) {
      const p = pts[i];
      while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
        upper.pop();
      }
      upper.push(p);
    }
    lower.pop();
    upper.pop();
    return lower.concat(upper);
  }

  function leafletPolygonCenter(polygon) {
    if (!polygon || !polygon.length) {
      return null;
    }
    if (
      window.TerrainPolygonSplit &&
      typeof window.TerrainPolygonSplit.polygonCentroid === "function"
    ) {
      return window.TerrainPolygonSplit.polygonCentroid(polygon);
    }
    let lat = 0;
    let lng = 0;
    polygon.forEach(function (p) {
      lat += Number(p.lat);
      lng += Number(p.lng);
    });
    return { lat: lat / polygon.length, lng: lng / polygon.length };
  }

  function createSurveyRouteWaypointIcon(sequence, labelQuadrant) {
    return window.L.divIcon({
      className: "fp-survey-route-wp-marker",
      html:
        '<span class="fp-survey-route-wp">' +
        '<span class="fp-survey-route-wp-dot"></span>' +
        '<span class="fp-survey-route-wp-label fp-survey-route-wp-label--' +
        labelQuadrant +
        '">' +
        sequence +
        "</span>" +
        "</span>",
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });
  }

  function createSurveyDirectionArrowIcon(bearingDegrees) {
    const iconRotation = round(bearingDegrees, 1);
    return window.L.divIcon({
      className: "fp-survey-direction-arrow",
      html:
        '<span class="fp-survey-direction-arrow-glyph" style="transform:rotate(' +
        iconRotation +
        'deg)">' +
        '<svg class="fp-survey-direction-arrow-svg" viewBox="0 0 24 24" aria-hidden="true">' +
        '<path d="M12 5 L18 17 L12 14 L6 17 Z" />' +
        "</svg></span>",
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
  }

  function createSurveyWaypointMarkerIcon(waypointNumber, altitude) {
    const altText =
      typeof altitude === "number" && isFinite(altitude) ? Math.round(altitude) + " m" : "--";
    return window.L.divIcon({
      className: "fp-survey-waypoint-marker",
      html:
        '<span class="fp-survey-waypoint-marker-wrap" title="航点 ' +
        waypointNumber +
        " · " +
        altText +
        '">' +
        '<span class="fp-survey-waypoint-marker-body">' +
        '<span class="fp-survey-waypoint-marker-dot">' +
        waypointNumber +
        "</span>" +
        "</span>" +
        '<span class="fp-survey-waypoint-marker-alt-tag">' +
        altText +
        "</span>" +
        "</span>",
      iconSize: [72, 28],
      iconAnchor: [14, 14]
    });
  }

  function forEachSurveyPhotoLegFromPath(path, callback) {
    (path || []).forEach(function (point, index) {
      const role = point.pathRole || point.role;
      if (role !== "line-start") {
        return;
      }
      let entry = null;
      for (let j = index - 1; j >= 0; j -= 1) {
        const prevRole = path[j].pathRole || path[j].role;
        if (prevRole === "overshoot-entry") {
          entry = path[j];
          break;
        }
        if (prevRole === "line-end" || prevRole === "line-start") {
          break;
        }
      }
      let lineEnd = null;
      for (let j = index + 1; j < path.length; j += 1) {
        const nextRole = path[j].pathRole || path[j].role;
        if (nextRole === "line-end") {
          lineEnd = path[j];
          break;
        }
        if (nextRole === "line-start") {
          break;
        }
      }
      if (!lineEnd) {
        return;
      }
      callback({
        lineStart: point,
        lineEnd: lineEnd,
        entry: entry,
        row: point.row
      });
    });
  }

  function drawSurveyConnectorSegmentsFromPath(layerGroup, path, opts) {
    if (!layerGroup || !window.L || !Array.isArray(path) || path.length < 2) {
      return;
    }
    const lineOptions = {
      color: "#6d8299",
      weight: opts && opts.weight != null ? opts.weight : 1.5,
      opacity: opts && opts.opacity != null ? opts.opacity : 0.45,
      dashArray: "6 8"
    };
    for (let i = 1; i < path.length; i += 1) {
      const a = path[i - 1];
      const b = path[i];
      const aRole = a.pathRole || a.role;
      const bRole = b.pathRole || b.role;
      if (aRole === "line-start" && bRole === "line-end") {
        continue;
      }
      window.L.polyline(
        [
          [a.lat, a.lng],
          [b.lat, b.lng]
        ],
        lineOptions
      ).addTo(layerGroup);
    }
  }

  function addSurveyHeadingArrow(layerGroup, from, to, options) {
    if (!from || !to || !layerGroup) {
      return;
    }
    const opts = options || {};
    const bearing = computeBearingDegrees(from, to);
    const anchorFrom = opts.anchorFrom || from;
    const anchorTo = opts.anchorTo || to;
    let arrowPosition = pointOnSegment(
      anchorFrom,
      anchorTo,
      opts.alongRatio != null ? opts.alongRatio : 0.5
    );
    const lateral = Number(opts.lateralOffsetMeters) || 0;
    if (lateral) {
      arrowPosition = offsetLatLngMeters(arrowPosition, bearing, 0, lateral);
    }
    window.L.marker([arrowPosition.lat, arrowPosition.lng], {
      icon: createSurveyDirectionArrowIcon(bearing),
      interactive: false,
      zIndexOffset: 600
    }).addTo(layerGroup);
  }

  function isSurveyPhotoLegSegment(a, b) {
    return (
      a.source === "survey" &&
      b.source === "survey" &&
      a.pathRole === "line-start" &&
      b.pathRole === "line-end"
    );
  }

  function isSurveyPhotoLegInteriorWaypoint(wp) {
    return (
      wp.source === "survey" &&
      !wp.pathRole &&
      wp.segmentRole === "transect"
    );
  }

  function shouldSkipSurveyMapSegment(a, b) {
    if (isSurveyPhotoLegSegment(a, b)) {
      return true;
    }
    if (a.pathRole === "line-start" && isSurveyPhotoLegInteriorWaypoint(b)) {
      return true;
    }
    if (isSurveyPhotoLegInteriorWaypoint(a) && b.pathRole === "line-end") {
      return true;
    }
    if (isSurveyPhotoLegInteriorWaypoint(a) && isSurveyPhotoLegInteriorWaypoint(b)) {
      return true;
    }
    return false;
  }

  function isSurveyConnectorSegment(a, b) {
    if (a.source !== "survey" || b.source !== "survey") {
      return false;
    }
    if (shouldSkipSurveyMapSegment(a, b)) {
      return false;
    }
    const overshootRoles = {
      "overshoot-entry": true,
      "overshoot-exit": true
    };
    if (overshootRoles[a.pathRole] || overshootRoles[b.pathRole]) {
      return true;
    }
    if (a.segmentRole === "turn" || b.segmentRole === "turn") {
      return true;
    }
    if (a.segmentRole === "connector" || b.segmentRole === "connector") {
      return true;
    }
    if (a.label === "转弯" || b.label === "转弯") {
      return true;
    }
    return false;
  }

  function forEachSurveyPhotoLegFromMission(waypoints, callback) {
    (waypoints || []).forEach(function (wp, index) {
      if (wp.source !== "survey" || wp.pathRole !== "line-start") {
        return;
      }
      const blockId = wp.blockId || "";
      let entry = null;
      let entryIndex = -1;
      for (let j = index - 1; j >= 0; j -= 1) {
        const prev = waypoints[j];
        if (prev.source === "camera") {
          continue;
        }
        if (prev.source !== "survey" || (prev.blockId || "") !== blockId) {
          break;
        }
        if (prev.pathRole === "overshoot-entry") {
          entry = prev;
          entryIndex = j;
          break;
        }
        if (prev.pathRole === "line-end" || prev.pathRole === "line-start") {
          break;
        }
      }
      let lineEnd = null;
      let lineEndIndex = -1;
      for (let j = index + 1; j < waypoints.length; j += 1) {
        const next = waypoints[j];
        if (next.source === "camera") {
          continue;
        }
        if (next.source !== "survey" || (next.blockId || "") !== blockId) {
          break;
        }
        if (next.pathRole === "line-end") {
          lineEnd = next;
          lineEndIndex = j;
          break;
        }
      }
      if (!lineEnd) {
        return;
      }
      callback({
        lineStart: wp,
        lineStartIndex: index,
        lineEnd: lineEnd,
        lineEndIndex: lineEndIndex,
        entry: entry,
        entryIndex: entryIndex,
        row: wp.row
      });
    });
  }

  function drawSurveyPhotoSegmentsFromMission(layerGroup, waypoints, opts) {
    const photoPathOptions = {
      color: "#3dd68c",
      weight: opts.weight != null ? opts.weight : 4,
      opacity: opts.opacity != null ? opts.opacity : 0.98,
      lineCap: "round",
      lineJoin: "round"
    };

    forEachSurveyPhotoLegFromMission(waypoints, function (leg) {
      const rowIndex = leg.row != null ? leg.row : 0;
      const alongRatio = rowIndex % 2 === 0 ? 0.42 : 0.58;
      const arrowFromIdx = leg.entryIndex >= 0 ? leg.entryIndex : leg.lineStartIndex;
      const arrowToIdx = leg.lineStartIndex + 1;
      const arrowFrom = waypoints[arrowFromIdx];
      const arrowTo = waypoints[arrowToIdx] || leg.lineStart;

      addSurveyHeadingArrow(layerGroup, arrowFrom, arrowTo, {
        alongRatio: alongRatio,
        anchorFrom: leg.lineStart,
        anchorTo: leg.lineEnd
      });

      window.L.polyline(
        [
          [leg.lineStart.lat, leg.lineStart.lng],
          [leg.lineEnd.lat, leg.lineEnd.lng]
        ],
        photoPathOptions
      ).addTo(layerGroup);
    });
  }

  function drawSurveyPhotoSegmentsFromPath(layerGroup, path, opts) {
    const photoPathOptions = {
      color: "#3dd68c",
      weight: opts.weight != null ? opts.weight : 4,
      opacity: opts.opacity != null ? opts.opacity : 0.98,
      lineCap: "round",
      lineJoin: "round"
    };

    forEachSurveyPhotoLegFromPath(path, function (leg) {
      const rowIndex = leg.row != null ? leg.row : 0;
      const alongRatio = rowIndex % 2 === 0 ? 0.42 : 0.58;
      const arrowFrom = leg.entry || leg.lineStart;
      const arrowTo = leg.lineStart;

      addSurveyHeadingArrow(layerGroup, arrowFrom, arrowTo, {
        alongRatio: alongRatio,
        anchorFrom: leg.lineStart,
        anchorTo: leg.lineEnd
      });

      window.L.polyline(
        [
          [leg.lineStart.lat, leg.lineStart.lng],
          [leg.lineEnd.lat, leg.lineEnd.lng]
        ],
        photoPathOptions
      ).addTo(layerGroup);
    });
  }

  function drawSurveyPhotoSegments(layerGroup, points, options) {
    if (!layerGroup || !window.L || !Array.isArray(points) || !points.length) {
      return;
    }

    const opts = options || {};
    const isMission = points[0].source != null;
    if (isMission) {
      drawSurveyPhotoSegmentsFromMission(layerGroup, points, opts);
    } else {
      drawSurveyPhotoSegmentsFromPath(layerGroup, points, opts);
    }
  }

  function buildSurveyPathOptionsFromSettings(settings) {
    return {
      footprintWidthMeters: settings.footprintWidthMeters,
      turnAroundMeters: settings.turnAroundMeters,
      entryCorner: settings.surveyEntryCorner,
      lineSpacingMeters: computeLineSpacingMeters(
        settings.sideOverlap,
        settings.footprintWidthMeters
      )
    };
  }

  function syncWaypointMissionLayers(layers, waypoints, onWaypointMoved) {
    if (!layers || !window.L) {
      return;
    }

    const VT = window.VehicleTemplates;
    const MM = window.MissionModel;

    layers.waypointGroup.clearLayers();

    const mapWaypoints = [];
    const mapVisibleSet =
      MM && MM.buildSurveyMapVisibilitySet
        ? MM.buildSurveyMapVisibilitySet(waypoints)
        : null;

    waypoints.forEach(function (waypoint, index) {
      if (waypoint.source === "camera") {
        return;
      }
      if (mapVisibleSet && !mapVisibleSet.has(index)) {
        return;
      }
      mapWaypoints.push(waypoint);
      const waypointNumber = index + 1;
      const isSurveyNav = waypoint.source === "survey";
      const roleLabel = MM ? MM.getMapRoleLabel(waypoint) : waypoint.label || "";
      const popupTitle = MM ? MM.getDisplayTitle(waypoint, index) : roleLabel || "航点 " + waypointNumber;
      const labelQuadrant = WAYPOINT_LABEL_QUADRANTS[index % WAYPOINT_LABEL_QUADRANTS.length];
      const canDrag = Boolean(onWaypointMoved) && !waypoint.locked;
      const marker = window.L.marker([waypoint.lat, waypoint.lng], {
        icon: isSurveyNav
          ? createSurveyWaypointMarkerIcon(waypointNumber, waypoint.alt)
          : createWaypointMarkerIcon(waypointNumber, waypoint.alt, roleLabel, labelQuadrant),
        draggable: canDrag
      });

      marker.bindPopup(
        "<strong>" +
          popupTitle +
          "</strong><div style='margin-top:4px;font-size:11px;color:#9fb0c1'>" +
          round(waypoint.lng, 6).toFixed(6) +
          ", " +
          round(waypoint.lat, 6).toFixed(6) +
          (typeof waypoint.alt === "number" ? "<br>高度 " + waypoint.alt + " m" : "") +
          (waypoint.locked ? "<br>已锁定（飞控位置）" : "") +
          "</div>"
      );

      marker.on("click", window.L.DomEvent.stopPropagation);

      if (canDrag) {
        marker.on("dragstart", window.L.DomEvent.stopPropagation);
        marker.on("dragend", function () {
          const latLng = marker.getLatLng();
          onWaypointMoved(index, round(latLng.lng, 6), round(latLng.lat, 6));
        });
      }

      layers.waypointGroup.addLayer(marker);
    });

    if (mapWaypoints.length >= 2) {
      let leadingTemplateChain = true;
      for (let i = 1; i < mapWaypoints.length; i++) {
        const a = mapWaypoints[i - 1];
        const b = mapWaypoints[i];
        if (a.source === "survey" && b.source === "survey" && shouldSkipSurveyMapSegment(a, b)) {
          if (a.source !== "template" || b.source !== "template") {
            leadingTemplateChain = false;
          }
          continue;
        }
        let color = "#4fc3f7";
        let weight = 3;
        if (a.source === "survey" && b.source === "survey") {
          if (isSurveyConnectorSegment(a, b)) {
            color = "#7a8fa3";
            weight = 2;
          }
        } else if (VT && VT.gradeSegmentColor && a.source === "template" && b.source === "template") {
          color = VT.gradeSegmentColor(a, b);
        }
        window.L.polyline(
          [
            [a.lat, a.lng],
            [b.lat, b.lng]
          ],
          { color: color, weight: weight, opacity: 0.9 }
        ).addTo(layers.waypointGroup);

        const isLeadingTemplateLeg =
          leadingTemplateChain && a.source === "template" && b.source === "template";

        if (isLeadingTemplateLeg && VT && VT.horizontalDistanceM) {
          const dist = round(VT.horizontalDistanceM(a, b), 0);
          const mid = { lat: (a.lat + b.lat) / 2, lng: (a.lng + b.lng) / 2 };
          const isTakeoffLeg =
            MM &&
            (a.command === MM.MAV_CMD.NAV_TAKEOFF ||
              a.command === MM.MAV_CMD.NAV_VTOL_TAKEOFF);
          let labelText = dist + " m";
          let labelClass = "fp-segment-label-text";
          if (isTakeoffLeg && VT.gradeDegrees) {
            labelText = dist + " m · " + round(VT.gradeDegrees(a, b), 0) + "°";
            labelClass = "fp-segment-label-text fp-segment-label-text--grade";
          }
          window.L.marker([mid.lat, mid.lng], {
            icon: window.L.divIcon({
              className: "fp-segment-label",
              html: '<span class="' + labelClass + '">' + labelText + "</span>",
              iconSize: isTakeoffLeg ? [72, 18] : [52, 16],
              iconAnchor: isTakeoffLeg ? [36, 9] : [26, 8]
            }),
            interactive: false
          }).addTo(layers.waypointGroup);
        }

        if (a.source !== "template" || b.source !== "template") {
          leadingTemplateChain = false;
        }
      }

      drawSurveyPhotoSegments(layers.waypointGroup, waypoints, { weight: 4, opacity: 0.95 });
    }
  }

  function syncSurveyMissionLayers(
    layers,
    surveyArea,
    surveyPath,
    onSurveyVertexMoved,
    onSurveyVertexDeleted,
    onSurveyVertexInserted,
    layerOptions,
    committedBlocks,
    planningBlocks,
    partitionOptions
  ) {
    if (!layers || !window.L) {
      return;
    }

    const opts = layerOptions || {};
    const surveyPathPreview = Boolean(opts.surveyPathPreview);

    layers.surveyGroup.clearLayers();
    layers.pathGroup.clearLayers();

    const partition = partitionOptions || {};
    const partitionBlocks = Array.isArray(partition.blocks) ? partition.blocks : [];
    const partitionSelection = Array.isArray(partition.selection)
      ? partition.selection
      : [];
    partitionBlocks.forEach(function (block, blockIndex) {
      if (!block || !block.polygon || block.polygon.length < 3) {
        return;
      }
      const selected = partitionSelection.indexOf(blockIndex) !== -1;
      const over = Boolean(block.overSortie);
      const baseColor = over ? "#e0743a" : "#37c0a8";
      const polygon = window.L.polygon(
        block.polygon.map(function (p) {
          return [p.lat, p.lng];
        }),
        {
          color: selected ? "#ffd34d" : baseColor,
          weight: selected ? 3.5 : 2.5,
          dashArray: selected ? null : "6 5",
          fillColor: baseColor,
          fillOpacity: selected ? 0.28 : 0.14
        }
      ).addTo(layers.surveyGroup);
      if (typeof partition.onBlockClick === "function") {
        polygon.on("click", function (event) {
          window.L.DomEvent.stopPropagation(event);
          partition.onBlockClick(blockIndex);
        });
      }

      const center = leafletPolygonCenter(block.polygon);
      if (center) {
        const reliefText = Number(block.relief || 0).toFixed(0);
        const minutesText = Number(block.estMinutes || 0).toFixed(0);
        const label = window.L.marker([center.lat, center.lng], {
          icon: createPartitionBlockLabelIcon(
            blockIndex + 1,
            reliefText,
            minutesText,
            over,
            selected
          ),
          interactive: true,
          keyboard: false
        });
        if (typeof partition.onBlockClick === "function") {
          label.on("click", function (event) {
            window.L.DomEvent.stopPropagation(event);
            partition.onBlockClick(blockIndex);
          });
        }
        label.addTo(layers.surveyGroup);
      }

      if (typeof partition.onVertexMoved === "function") {
        block.polygon.forEach(function (vertex, vertexIndex) {
          const marker = window.L.marker([vertex.lat, vertex.lng], {
            icon: createPartitionVertexMarkerIcon(),
            draggable: true,
            keyboard: false
          });
          marker.on("dragstart", window.L.DomEvent.stopPropagation);
          marker.on("dragend", function () {
            const latLng = marker.getLatLng();
            partition.onVertexMoved(
              blockIndex,
              vertexIndex,
              round(latLng.lng, 6),
              round(latLng.lat, 6)
            );
          });
          layers.surveyGroup.addLayer(marker);
        });
      }
    });

    (planningBlocks || []).forEach(function (block) {
      if (!block || !block.polygon || block.polygon.length < 3) {
        return;
      }
      window.L.polygon(
        block.polygon.map(function (p) {
          return [p.lat, p.lng];
        }),
        {
          color: "#6d8299",
          weight: 2,
          dashArray: "8 6",
          fillColor: "#6d8299",
          fillOpacity: 0.08
        }
      ).addTo(layers.surveyGroup);

      const blockPath = block && Array.isArray(block.previewPath) ? block.previewPath : [];
      if (blockPath.length >= 2) {
        drawSurveyConnectorSegmentsFromPath(layers.pathGroup, blockPath, {
          weight: 1.5,
          opacity: 0.45
        });
        drawSurveyPhotoSegments(layers.pathGroup, blockPath, {
          weight: 3.5,
          opacity: 0.82
        });
      }
    });

    (committedBlocks || []).forEach(function (block, blockIndex) {
      if (!block.polygon || block.polygon.length < 3) {
        return;
      }
      window.L.polygon(
        block.polygon.map(function (p) {
          return [p.lat, p.lng];
        }),
        {
          color: "#f0c24f",
          weight: 2.5,
          dashArray: "4 6",
          fillColor: "#f0c24f",
          fillOpacity: 0.18
        }
      ).addTo(layers.surveyGroup);

      const blockPath = Array.isArray(block.pathPoints)
        ? block.pathPoints
        : Array.isArray(block.previewPath)
          ? block.previewPath
          : [];
      if (blockPath.length >= 2) {
        drawSurveyConnectorSegmentsFromPath(layers.pathGroup, blockPath, {
          weight: 1.5,
          opacity: 0.45
        });
        drawSurveyPhotoSegments(layers.pathGroup, blockPath, {
          weight: 3.5,
          opacity: 0.82
        });
      }
    });

    // Main survey area boundary for editing:
    // Draw fill polygon first (interactive:false so interior clicks fall through to map append),
    // then the line on top so clicks on the yellow border can insert vertices.
    if (surveyArea.length >= 3) {
      window.L.polygon(
        surveyArea.map(function (point) {
          return [point.lat, point.lng];
        }),
        {
          color: "#f0c24f",
          weight: 2.5,
          fillColor: "#f0c24f",
          fillOpacity: 0.18,
          interactive: false
        }
      ).addTo(layers.surveyGroup);
    }

    if (surveyArea.length >= 2) {
      const line = window.L.polyline(
        surveyArea.map(function (point) {
          return [point.lat, point.lng];
        }),
        { color: "#f0c24f", weight: 2.5 }
      ).addTo(layers.surveyGroup);
      if (onSurveyVertexInserted) {
        line.on("click", function (event) {
          window.L.DomEvent.stopPropagation(event);
          const ll = event.latlng;
          const clicked = { lng: round(ll.lng, 6), lat: round(ll.lat, 6) };
          let bestAfter = 0;
          let bestD = Infinity;
          for (let i = 0; i < surveyArea.length; i += 1) {
            const a = surveyArea[i];
            const b = surveyArea[(i + 1) % surveyArea.length];
            const d = pointToSegmentDistance(clicked, a, b);
            if (d < bestD) {
              bestD = d;
              bestAfter = i;
            }
          }
          onSurveyVertexInserted(bestAfter, clicked.lng, clicked.lat);
        });
      }
    }

    surveyArea.forEach(function (point, index) {
      const vertexNumber = index + 1;
      const marker = window.L.marker([point.lat, point.lng], {
        icon: createSurveyVertexMarkerIcon(vertexNumber),
        draggable: Boolean(onSurveyVertexMoved)
      });
      marker.bindPopup(
        "<strong>区域顶点 " +
          vertexNumber +
          "</strong><div style='margin-top:4px;font-size:11px;color:#9fb0c1'>" +
          round(point.lng, 6).toFixed(6) +
          ", " +
          round(point.lat, 6).toFixed(6) +
          "</div>"
      );
      marker.on("click", window.L.DomEvent.stopPropagation);

      if (onSurveyVertexMoved) {
        marker.on("dragstart", window.L.DomEvent.stopPropagation);
        marker.on("dragend", function () {
          const latLng = marker.getLatLng();
          onSurveyVertexMoved(index, round(latLng.lng, 6), round(latLng.lat, 6));
        });
      }

      if (onSurveyVertexDeleted) {
        marker.on("contextmenu", function (ev) {
          window.L.DomEvent.stopPropagation(ev);
          const orig = ev.originalEvent;
          if (orig) {
            orig.preventDefault();
            orig.stopPropagation();
          }
          showSurveyVertexContextMenu(orig || ev, index, onSurveyVertexDeleted);
        });
      }

      layers.surveyGroup.addLayer(marker);
    });

    if (!(planningBlocks && planningBlocks.length)) {
      const previewSettings = opts.previewSettings;
      const SP = window.SurveyPlanner;
      const drawSurveyPreviewPath = function (path) {
        if (!path || path.length < 2) {
          return;
        }
        drawSurveyConnectorSegmentsFromPath(layers.pathGroup, path, {
          weight: surveyPathPreview ? 1.5 : 2,
          opacity: surveyPathPreview ? 0.45 : 0.55
        });
        drawSurveyPhotoSegments(layers.pathGroup, path, {
          weight: surveyPathPreview ? 3.5 : 4,
          opacity: surveyPathPreview ? 0.82 : 0.98
        });
      };

      if (
        partitionBlocks.length &&
        previewSettings &&
        SP &&
        typeof SP.generateSurveyPath === "function"
      ) {
        partitionBlocks.forEach(function (block) {
          if (
            !block ||
            !block.polygon ||
            block.polygon.length < 3 ||
            block.contourHeadingDeg == null ||
            !Number.isFinite(Number(block.contourHeadingDeg))
          ) {
            return;
          }
          const pathOpts = buildSurveyPathOptionsFromSettings(previewSettings);
          pathOpts.headingDegrees = Number(block.contourHeadingDeg);
          const blockPath = SP.generateSurveyPath(
            block.polygon,
            previewSettings.sideOverlap,
            pathOpts
          );
          drawSurveyPreviewPath(blockPath);
        });
      } else if (surveyPath.length >= 2) {
        drawSurveyPreviewPath(surveyPath);
      }
    }
  }

  function syncLeafletMissionLayers(
    layers,
    waypoints,
    surveyArea,
    surveyPath,
    onWaypointMoved,
    onSurveyVertexMoved,
    onSurveyVertexDeleted,
    onSurveyVertexInserted,
    layerOptions,
    committedBlocks,
    syncScope,
    overlayOptions
  ) {
    if (!layers || !window.L) {
      return;
    }

    const scope = syncScope || "all";
    const mapForClose =
      layers.waypointGroup && layers.waypointGroup._map
        ? layers.waypointGroup._map
        : null;
    if (
      scope === "all" &&
      mapForClose &&
      typeof mapForClose.closePopup === "function"
    ) {
      mapForClose.closePopup();
    }

    if (scope === "all" || scope === "waypoints") {
      syncWaypointMissionLayers(layers, waypoints, onWaypointMoved);
    }
    if (scope === "all" || scope === "survey") {
      syncSurveyMissionLayers(
        layers,
        surveyArea,
        surveyPath,
        onSurveyVertexMoved,
        onSurveyVertexDeleted,
        onSurveyVertexInserted,
        layerOptions,
        committedBlocks,
        overlayOptions && overlayOptions.planningBlocks,
        overlayOptions && overlayOptions.partition
      );
    }

    const platform =
      overlayOptions && overlayOptions.platform
        ? overlayOptions.platform
        : "multirotor";
    syncFlightPlanMapOverlays(layers, platform);
    if (overlayOptions && overlayOptions.settings) {
      syncTerrainIssueLayers(
        layers,
        overlayOptions.terrainProfiles || [],
        overlayOptions.settings,
        platform
      );
    }
    syncTerrainContourLayers(
      layers.terrainContourGroup,
      overlayOptions && overlayOptions.terrainContourGeo,
      overlayOptions && overlayOptions.showTerrainContours
    );
  }

  function formatCoordinate(point, altitude) {
    return (
      "Lng " +
      round(point.lng, 6).toFixed(6) +
      " / Lat " +
      round(point.lat, 6).toFixed(6) +
      (typeof altitude === "number" ? " / Alt " + altitude + " m" : "")
    );
  }


  function isFlightPlanViewActive() {
    const view = document.getElementById("view-flight-plan");
    return Boolean(view && view.classList.contains("active"));
  }

  function hasVisibleMapContainer(container) {
    if (!container) {
      return false;
    }
    const rect = container.getBoundingClientRect();
    return rect.width > 8 && rect.height > 8;
  }

  function resolveTerrainSurveyPolygon(surveyArea, surveyBlocks) {
    if (surveyArea && surveyArea.length >= 3) {
      return surveyArea;
    }
    const blocks = surveyBlocks || [];
    for (let i = blocks.length - 1; i >= 0; i -= 1) {
      const poly = blocks[i] && blocks[i].polygon;
      if (poly && poly.length >= 3) {
        return poly;
      }
    }
    return [];
  }

  const TERRAIN_CONTOUR_BASE_SPACING_M = 40;
  const TERRAIN_CONTOUR_MAX_AXIS_SAMPLES = 80;
  const TERRAIN_CONTOUR_MIN_VALID_RATIO = 0.7;
  const TERRAIN_CONTOUR_MAIN_STROKE = "#ffd24a";
  const TERRAIN_CONTOUR_MINOR_STROKE = "#f7d774";
  const TERRAIN_CONTOUR_LABEL_MIN_POINTS = 6;

  function buildViewportPolygonFromMap(map) {
    if (!map || typeof map.getBounds !== "function") {
      return [];
    }
    const bounds = map.getBounds();
    if (!bounds) {
      return [];
    }
    const north = bounds.getNorth();
    const south = bounds.getSouth();
    const east = bounds.getEast();
    const west = bounds.getWest();
    if (
      !Number.isFinite(north) ||
      !Number.isFinite(south) ||
      !Number.isFinite(east) ||
      !Number.isFinite(west)
    ) {
      return [];
    }
    return [
      { lat: north, lng: west },
      { lat: north, lng: east },
      { lat: south, lng: east },
      { lat: south, lng: west }
    ];
  }

  function pickContourLabelPoint(polyline) {
    if (!Array.isArray(polyline) || polyline.length < TERRAIN_CONTOUR_LABEL_MIN_POINTS) {
      return null;
    }
    return polyline[Math.floor(polyline.length / 2)] || null;
  }

  function pointInPolygonMeters(point, polygon) {
    if (!point || !polygon || polygon.length < 3) {
      return false;
    }
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
      const xi = polygon[i].x;
      const yi = polygon[i].y;
      const xj = polygon[j].x;
      const yj = polygon[j].y;
      const intersects =
        yi > point.y !== yj > point.y &&
        point.x < ((xj - xi) * (point.y - yi)) / ((yj - yi) || 1e-9) + xi;
      if (intersects) {
        inside = !inside;
      }
    }
    return inside;
  }

  function resolveTerrainContourInterval(reliefMeters) {
    const relief = Math.max(0, Number(reliefMeters) || 0);
    if (relief < 30) {
      return 5;
    }
    if (relief < 120) {
      return 10;
    }
    if (relief < 300) {
      return 20;
    }
    return 50;
  }

  function buildTerrainContourLevels(minElevation, maxElevation) {
    if (!Number.isFinite(minElevation) || !Number.isFinite(maxElevation) || maxElevation <= minElevation) {
      return [];
    }
    const interval = resolveTerrainContourInterval(maxElevation - minElevation);
    const start = Math.ceil(minElevation / interval) * interval;
    const levels = [];
    for (let level = start; level < maxElevation; level += interval) {
      levels.push(level);
    }
    return levels;
  }

  function interpolateContourPoint(a, b, level) {
    if (!a || !b || !Number.isFinite(a.z) || !Number.isFinite(b.z)) {
      return null;
    }
    const delta = b.z - a.z;
    const ratio = Math.abs(delta) < 1e-9 ? 0.5 : (level - a.z) / delta;
    return {
      x: a.x + (b.x - a.x) * ratio,
      y: a.y + (b.y - a.y) * ratio
    };
  }

  function appendContourEdgeHits(target, pointA, pointB, level) {
    if (!pointA || !pointB || !Number.isFinite(pointA.z) || !Number.isFinite(pointB.z)) {
      return;
    }
    const z1 = pointA.z;
    const z2 = pointB.z;
    if ((level < z1 && level < z2) || (level > z1 && level > z2) || z1 === z2) {
      return;
    }
    if (level === z2 && level !== z1) {
      return;
    }
    const hit = interpolateContourPoint(pointA, pointB, level);
    if (hit) {
      target.push(hit);
    }
  }

  function quantizeContourKey(point) {
    return round(point.x, 3) + ":" + round(point.y, 3);
  }

  function buildContourPolylinesFromSegments(segments) {
    if (!Array.isArray(segments) || !segments.length) {
      return [];
    }

    const polylines = [];
    const endpointMap = new Map();

    function attach(line, point, atStart) {
      const key = quantizeContourKey(point);
      const bucket = endpointMap.get(key) || [];
      bucket.push({ line: line, atStart: atStart });
      endpointMap.set(key, bucket);
    }

    function detach(line, point, atStart) {
      const key = quantizeContourKey(point);
      const bucket = endpointMap.get(key);
      if (!bucket) {
        return;
      }
      const next = bucket.filter(function (entry) {
        return entry.line !== line || entry.atStart !== atStart;
      });
      if (next.length) {
        endpointMap.set(key, next);
      } else {
        endpointMap.delete(key);
      }
    }

    segments.forEach(function (segment) {
      if (!segment || !segment.length || segment.length < 2) {
        return;
      }
      const start = segment[0];
      const end = segment[segment.length - 1];
      const startKey = quantizeContourKey(start);
      const endKey = quantizeContourKey(end);
      const startMatch = endpointMap.get(startKey);
      const endMatch = endpointMap.get(endKey);
      let line = null;

      if (startMatch && startMatch.length) {
        const match = startMatch[0];
        line = match.line;
        detach(line, match.atStart ? line[0] : line[line.length - 1], match.atStart);
        if (match.atStart) {
          const nextSegment = segment.slice(0, -1).reverse();
          Array.prototype.unshift.apply(line, nextSegment);
        } else {
          Array.prototype.push.apply(line, segment.slice(1));
        }
      } else if (endMatch && endMatch.length) {
        const match = endMatch[0];
        line = match.line;
        detach(line, match.atStart ? line[0] : line[line.length - 1], match.atStart);
        if (match.atStart) {
          Array.prototype.unshift.apply(line, segment.slice(1).reverse());
        } else {
          Array.prototype.push.apply(line, segment.slice(0, -1).reverse());
        }
      } else {
        line = segment.slice();
        polylines.push(line);
      }

      let merged = true;
      while (merged) {
        merged = false;
        const lineStart = line[0];
        const lineEnd = line[line.length - 1];
        const endEntries = endpointMap.get(quantizeContourKey(lineEnd)) || [];
        const startEntries = endpointMap.get(quantizeContourKey(lineStart)) || [];
        const joinEntry = endEntries.concat(startEntries).find(function (entry) {
          return entry.line !== line;
        });
        if (joinEntry) {
          const other = joinEntry.line;
          const otherStart = other[0];
          const otherEnd = other[other.length - 1];
          detach(other, otherStart, true);
          detach(other, otherEnd, false);
          if (polylines.indexOf(other) >= 0) {
            polylines.splice(polylines.indexOf(other), 1);
          }
          if (quantizeContourKey(lineEnd) === quantizeContourKey(otherStart)) {
            Array.prototype.push.apply(line, other.slice(1));
          } else if (quantizeContourKey(lineEnd) === quantizeContourKey(otherEnd)) {
            Array.prototype.push.apply(line, other.slice(0, -1).reverse());
          } else if (quantizeContourKey(lineStart) === quantizeContourKey(otherEnd)) {
            Array.prototype.unshift.apply(line, other.slice(0, -1));
          } else if (quantizeContourKey(lineStart) === quantizeContourKey(otherStart)) {
            Array.prototype.unshift.apply(line, other.slice(1).reverse());
          }
          merged = true;
        }
      }

      attach(line, line[0], true);
      attach(line, line[line.length - 1], false);
    });

    return polylines;
  }

  function buildTerrainContoursFromGrid(grid, origin, minElevation, maxElevation) {
    if (!grid || !grid.points || !grid.points.length || !origin) {
      return [];
    }
    const levels = buildTerrainContourLevels(minElevation, maxElevation);
    if (!levels.length) {
      return [];
    }

    const contourMap = new Map();

    for (let row = 0; row < grid.rows - 1; row += 1) {
      for (let col = 0; col < grid.cols - 1; col += 1) {
        const p00 = grid.points[row][col];
        const p10 = grid.points[row][col + 1];
        const p01 = grid.points[row + 1][col];
        const p11 = grid.points[row + 1][col + 1];
        if (!(p00 && p10 && p01 && p11)) {
          continue;
        }
        if (
          !Number.isFinite(p00.z) ||
          !Number.isFinite(p10.z) ||
          !Number.isFinite(p01.z) ||
          !Number.isFinite(p11.z)
        ) {
          continue;
        }
        const cellMin = Math.min(p00.z, p10.z, p01.z, p11.z);
        const cellMax = Math.max(p00.z, p10.z, p01.z, p11.z);
        levels.forEach(function (level) {
          if (level <= cellMin || level >= cellMax) {
            return;
          }
          const hits = [];
          appendContourEdgeHits(hits, p00, p10, level);
          appendContourEdgeHits(hits, p10, p11, level);
          appendContourEdgeHits(hits, p11, p01, level);
          appendContourEdgeHits(hits, p01, p00, level);
          if (hits.length < 2) {
            return;
          }
          const bucket = contourMap.get(level) || [];
          for (let i = 0; i + 1 < hits.length; i += 2) {
            bucket.push([hits[i], hits[i + 1]]);
          }
          contourMap.set(level, bucket);
        });
      }
    }

    return Array.from(contourMap.entries())
      .sort(function (a, b) {
        return a[0] - b[0];
      })
      .map(function (entry, index) {
        const level = entry[0];
        const polylines = buildContourPolylinesFromSegments(entry[1]).map(function (segment) {
          return segment.map(function (point) {
            return projectMetersToLngLat(point, origin);
          });
        });
        return {
          level: level,
          index: index,
          major: index % 5 === 0,
          polylines: polylines
        };
      })
      .filter(function (entry) {
        return entry.polylines.length > 0;
      });
  }

  async function generateTerrainContoursForPolygon(polygon, options) {
    const TS = window.TerrainService;
    const opts = options || {};
    if (!TS || typeof TS.sampleElevationBatch !== "function") {
      throw new Error("TerrainService 未加载");
    }
    if (!Array.isArray(polygon) || polygon.length < 3) {
      return { contours: [], validRatio: 0, insideCount: 0, interval: 0 };
    }

    const origin = getSurveyOrigin(polygon);
    const projected = polygon.map(function (point) {
      return projectLngLatToMeters(point, origin);
    });
    const bounds = projected.reduce(
      function (acc, point) {
        acc.minX = Math.min(acc.minX, point.x);
        acc.maxX = Math.max(acc.maxX, point.x);
        acc.minY = Math.min(acc.minY, point.y);
        acc.maxY = Math.max(acc.maxY, point.y);
        return acc;
      },
      { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity }
    );
    const widthM = Math.max(1, bounds.maxX - bounds.minX);
    const heightM = Math.max(1, bounds.maxY - bounds.minY);
    const axisMax = Math.max(widthM, heightM);
    const spacing = Math.max(
      TERRAIN_CONTOUR_BASE_SPACING_M,
      axisMax / Math.max(2, TERRAIN_CONTOUR_MAX_AXIS_SAMPLES - 1)
    );
    const cols = Math.min(
      TERRAIN_CONTOUR_MAX_AXIS_SAMPLES,
      Math.max(2, Math.floor(widthM / spacing) + 1)
    );
    const rows = Math.min(
      TERRAIN_CONTOUR_MAX_AXIS_SAMPLES,
      Math.max(2, Math.floor(heightM / spacing) + 1)
    );
    const stepX = cols > 1 ? widthM / (cols - 1) : widthM;
    const stepY = rows > 1 ? heightM / (rows - 1) : heightM;
    const samplePoints = [];
    const gridPoints = [];
    let insideCount = 0;

    for (let row = 0; row < rows; row += 1) {
      const gridRow = [];
      const y = bounds.minY + stepY * row;
      for (let col = 0; col < cols; col += 1) {
        const x = bounds.minX + stepX * col;
        const inside = pointInPolygonMeters({ x: x, y: y }, projected);
        const ll = projectMetersToLngLat({ x: x, y: y }, origin);
        const point = { x: x, y: y, lat: ll.lat, lng: ll.lng, inside: inside, z: null };
        if (inside) {
          insideCount += 1;
          samplePoints.push({ lat: ll.lat, lng: ll.lng });
        }
        gridRow.push(point);
      }
      gridPoints.push(gridRow);
    }

    if (!insideCount) {
      return { contours: [], validRatio: 0, insideCount: 0, interval: 0 };
    }

    const sampled = await TS.sampleElevationBatch(samplePoints, {
      timeoutMs: 20000,
      signal: opts.signal
    });
    let sampleIndex = 0;
    let validCount = 0;
    let minElevation = Infinity;
    let maxElevation = -Infinity;

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const point = gridPoints[row][col];
        if (!point.inside) {
          continue;
        }
        const sample = sampled[sampleIndex];
        sampleIndex += 1;
        const elevation =
          sample && Number.isFinite(Number(sample.elevation)) ? Number(sample.elevation) : null;
        point.z = elevation;
        if (elevation != null) {
          validCount += 1;
          minElevation = Math.min(minElevation, elevation);
          maxElevation = Math.max(maxElevation, elevation);
        }
      }
    }

    const validRatio = insideCount ? validCount / insideCount : 0;
    if (validRatio < TERRAIN_CONTOUR_MIN_VALID_RATIO || !Number.isFinite(minElevation) || !Number.isFinite(maxElevation)) {
      return {
        contours: [],
        validRatio: validRatio,
        insideCount: insideCount,
        interval: 0
      };
    }

    const contours = buildTerrainContoursFromGrid(
      { points: gridPoints, rows: rows, cols: cols },
      origin,
      minElevation,
      maxElevation
    );
    return {
      contours: contours,
      validRatio: validRatio,
      insideCount: insideCount,
      interval: resolveTerrainContourInterval(maxElevation - minElevation)
    };
  }

  function syncTerrainContourLayers(layerGroup, contourGeo, visible) {
    if (!layerGroup || !window.L) {
      return;
    }
    layerGroup.clearLayers();
    if (!visible || !Array.isArray(contourGeo) || !contourGeo.length) {
      return;
    }
    contourGeo.forEach(function (entry) {
      if (!entry || !Array.isArray(entry.polylines)) {
        return;
      }
      entry.polylines.forEach(function (polyline) {
        if (!polyline || polyline.length < 2) {
          return;
        }
        window.L.polyline(
          polyline.map(function (point) {
            return [point.lat, point.lng];
          }),
          {
            color: entry.major ? TERRAIN_CONTOUR_MAIN_STROKE : TERRAIN_CONTOUR_MINOR_STROKE,
            weight: entry.major ? 2 : 1,
            opacity: entry.major ? 0.9 : 0.7,
            interactive: false
          }
        ).addTo(layerGroup);
        if (entry.major) {
          const labelPoint = pickContourLabelPoint(polyline);
          if (labelPoint) {
            window.L.marker([labelPoint.lat, labelPoint.lng], {
              interactive: false,
              keyboard: false,
              zIndexOffset: 200,
              icon: window.L.divIcon({
                className: "fp-terrain-contour-label",
                html:
                  '<span style="' +
                  "display:inline-block;padding:1px 5px;border-radius:999px;" +
                  "background:rgba(12,18,26,0.72);border:1px solid rgba(255,210,74,0.38);" +
                  "color:#ffe38a;font-size:11px;font-weight:700;line-height:1.2;" +
                  "text-shadow:0 1px 2px rgba(0,0,0,0.45);" +
                  '">' +
                  Math.round(Number(entry.level) || 0) +
                  "m</span>",
                iconSize: [44, 18],
                iconAnchor: [22, 9]
              })
            }).addTo(layerGroup);
          }
        }
      });
    });
  }

  function formatTerrainPrefetchStatus(status) {
    if (!status) {
      return { label: "—", tone: "muted" };
    }
    if (status.running) {
      const done = status.done || 0;
      const total = status.total || 0;
      let label = "预取中 " + done + "/" + total;
      if (status.message) {
        label += "（" + status.message + "）";
      }
      return { label: label, tone: "pending" };
    }
    if (status.message === "完成" || (status.total > 0 && status.done >= status.total)) {
      return { label: "完成（" + (status.done || 0) + " 瓦片）", tone: "ok" };
    }
    if (status.message === "已取消") {
      return { label: "已取消", tone: "muted" };
    }
    if ((status.errors || 0) > 0) {
      return {
        label: "部分失败（" + status.errors + " 错误）",
        tone: "warn"
      };
    }
    return { label: "空闲", tone: "muted" };
  }

  function hasTerrainPlanBlockingErrors(issues) {
    return (issues || []).some(function (issue) {
      return issue && issue.level === "error";
    });
  }

  function summarizeBlockTerrainIssues(issues) {
    const TPV = window.TerrainProfileValidator;
    if (TPV && typeof TPV.summarizeTerrainIssues === "function") {
      return TPV.summarizeTerrainIssues(issues);
    }
    return issues || [];
  }

  function shouldDisplayTerrainIssue(issue) {
    if (!issue) {
      return false;
    }
    const code = issue.code ? String(issue.code) : "";
    if (
      code === "terrain_climb_rate" ||
      code === "terrain_climb_rate_summary" ||
      code === "terrain_grade" ||
      code === "terrain_grade_summary"
    ) {
      return false;
    }
    return true;
  }

  function collectTerrainProfilesForMap(planBlocks, committedBlocks) {
    const out = [];
    (planBlocks || []).forEach(function (block) {
      if (block.previewProfile && block.previewProfile.length >= 2) {
        out.push({ profile: block.previewProfile });
      }
    });
    if (!out.length) {
      (committedBlocks || []).forEach(function (block) {
        if (block.storedProfile && block.storedProfile.length >= 2) {
          out.push({ profile: block.storedProfile });
        }
      });
    }
    return out;
  }

  function drawTerrainIssueSegments(layerGroup, profile, settings, platform) {
    if (!layerGroup || !window.L) {
      return;
    }
    const TPS = window.TerrainProfileSegments;
    if (!TPS || typeof TPS.findProfileProblemSegments !== "function") {
      return;
    }
    TPS.findProfileProblemSegments(profile, settings, platform).forEach(function (seg) {
      window.L.polyline(
        seg.latlngs.map(function (p) {
          return [p.lat, p.lng];
        }),
        {
          color: seg.tone === "danger" ? "#ff6b6b" : "#ffb020",
          weight: 6,
          opacity: 0.9,
          lineCap: "round",
          lineJoin: "round"
        }
      ).addTo(layerGroup);
    });
  }

  function syncTerrainIssueLayers(layers, profileSources, settings, platform) {
    if (!layers || !layers.terrainIssueGroup) {
      return;
    }
    layers.terrainIssueGroup.clearLayers();
    (profileSources || []).forEach(function (src) {
      if (src && src.profile) {
        drawTerrainIssueSegments(layers.terrainIssueGroup, src.profile, settings, platform);
      }
    });
  }

  function getTerrainGridStatusLabel() {
    const TM = window.TerrainMavlink;
    if (!TM || typeof TM.getTerrainGridStatus !== "function") {
      return { label: "—", tone: "muted" };
    }
    const st = TM.getTerrainGridStatus();
    if (!st.connected) {
      return { label: "未连接", tone: "muted" };
    }
    if (!st.hookInstalled) {
      return { label: "未就绪", tone: "muted" };
    }
    if (st.requestCount > 0) {
      return {
        label: "已响应 " + st.requestCount + " 次 · 发送 " + st.rowsSent + " 行",
        tone: "ok"
      };
    }
    return { label: "等待飞控请求", tone: "pending" };
  }

  function isTerrainValidationIssue(issue) {
    const code = issue && issue.code ? String(issue.code) : "";
    return code.indexOf("terrain") === 0;
  }

  function getTerrainFcEnableStatus(connected) {
    if (!connected) {
      return { label: "未连接", tone: "muted" };
    }
    const TM = window.TerrainMavlink;
    if (!TM || typeof TM.checkTerrainEnableBeforeUpload !== "function") {
      return { label: "未知", tone: "muted" };
    }
    const result = TM.checkTerrainEnableBeforeUpload();
    if (result.ok) {
      return { label: "已启用", tone: "ok" };
    }
    if (window.params instanceof Map && window.params.has("TERRAIN_ENABLE")) {
      return { label: "未启用", tone: "warn" };
    }
    return { label: "参数未就绪", tone: "muted" };
  }

  function effectiveProfileSparklineAgl(point, fallbackAgl) {
    const override = point && Number(point.aglOverride);
    return Number.isFinite(override) ? override : fallbackAgl;
  }

  function profileCumulativeDistancesM(points) {
    const dist = [0];
    for (let i = 1; i < points.length; i += 1) {
      const a = points[i - 1];
      const b = points[i];
      dist.push(
        dist[i - 1] +
          distanceMetersBetween(
            { lat: Number(a.lat), lng: Number(a.lng) },
            { lat: Number(b.lat), lng: Number(b.lng) }
          )
      );
    }
    return dist;
  }

  function profileAltitudesDiffer(idealAbs, feasibleAbs, toleranceM) {
    const limit = Number.isFinite(Number(toleranceM)) ? Number(toleranceM) : 0.5;
    if (!idealAbs || !feasibleAbs || idealAbs.length !== feasibleAbs.length) {
      return false;
    }
    for (let i = 0; i < idealAbs.length; i += 1) {
      if (Math.abs(Number(idealAbs[i]) - Number(feasibleAbs[i])) > limit) {
        return true;
      }
    }
    return false;
  }

  function resolveProfileFlightAltitudes(profile, settings, platform) {
    const pts = (profile || []).filter(function (p) {
      return p && p.elevation != null && Number.isFinite(Number(p.elevation));
    });
    if (!pts.length) {
      return null;
    }
    const fallbackAgl = Number(settings && settings.surveyAltitude) || 300;
    const ground = pts.map(function (p) {
      return Number(p.elevation);
    });
    const idealAbs = ground.map(function (elev) {
      return elev + fallbackAgl;
    });

    const FWP = window.FixedWingParams;
    const isFw =
      FWP && typeof FWP.isFixedWingPlatform === "function" && FWP.isFixedWingPlatform(platform);
    if (!isFw) {
      return {
        points: pts,
        ground: ground,
        idealAbs: idealAbs,
        feasibleAbs: idealAbs.slice(),
        feasibleSource: "ideal",
        showIdealLine: false
      };
    }

    const hasTargetAbs = pts.every(function (p) {
      return p.targetAbsAlt != null && Number.isFinite(Number(p.targetAbsAlt));
    });
    if (hasTargetAbs) {
      const feasibleAbs = pts.map(function (p) {
        return Number(p.targetAbsAlt);
      });
      return {
        points: pts,
        ground: ground,
        idealAbs: idealAbs,
        feasibleAbs: feasibleAbs,
        feasibleSource: "profile",
        showIdealLine: profileAltitudesDiffer(idealAbs, feasibleAbs)
      };
    }

    const hasAglOverride = pts.every(function (p) {
      return p.aglOverride != null && Number.isFinite(Number(p.aglOverride));
    });
    if (hasAglOverride) {
      const feasibleAbs = pts.map(function (p, index) {
        return ground[index] + Number(p.aglOverride);
      });
      return {
        points: pts,
        ground: ground,
        idealAbs: idealAbs,
        feasibleAbs: feasibleAbs,
        feasibleSource: "profile",
        showIdealLine: profileAltitudesDiffer(idealAbs, feasibleAbs)
      };
    }

    const solver = window.TerrainClimbSolver;
    if (!solver || settings.terrainClimbSmoothing === false || !solver.buildFeasibleEnvelope) {
      return {
        points: pts,
        ground: ground,
        idealAbs: idealAbs,
        feasibleAbs: idealAbs.slice(),
        feasibleSource: "ideal",
        showIdealLine: false
      };
    }

    const dist = profileCumulativeDistancesM(pts);
    const opts = solver.resolveOpts ? solver.resolveOpts(settings) : null;
    if (!opts) {
      return {
        points: pts,
        ground: ground,
        idealAbs: idealAbs,
        feasibleAbs: idealAbs.slice(),
        feasibleSource: "ideal",
        showIdealLine: false
      };
    }
    const env = solver.buildFeasibleEnvelope(ground, dist, opts);
    const feasibleAbs = env && env.abs ? env.abs : idealAbs.slice();
    return {
      points: pts,
      ground: ground,
      idealAbs: idealAbs,
      feasibleAbs: feasibleAbs,
      feasibleSource: "solver",
      showIdealLine: profileAltitudesDiffer(idealAbs, feasibleAbs)
    };
  }

  function interpolateProfileValuesAtDist(targetDist, dist, values) {
    const n = dist.length;
    if (!n) {
      return null;
    }
    if (targetDist <= dist[0]) {
      return values[0];
    }
    if (targetDist >= dist[n - 1]) {
      return values[n - 1];
    }
    let lo = 0;
    let hi = n - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (dist[mid] <= targetDist) {
        lo = mid;
      } else {
        hi = mid;
      }
    }
    const span = dist[hi] - dist[lo] || 1e-9;
    const t = (targetDist - dist[lo]) / span;
    return values[lo] + (values[hi] - values[lo]) * t;
  }

  function smoothFeasibleForDisplay(feasibleAbs, ground, dist, opts) {
    const stepM = Number(opts && opts.stepM) || 12;
    const totalDist = dist.length ? dist[dist.length - 1] : 0;
    if (totalDist <= 0 || feasibleAbs.length < 2) {
      return {
        displayAbs: feasibleAbs.slice(),
        displayGround: ground.slice(),
        displayDist: dist.slice()
      };
    }
    const denseDist = [0];
    const denseFeas = [feasibleAbs[0]];
    const denseGround = [ground[0]];
    let cursor = stepM;
    while (cursor < totalDist) {
      denseDist.push(cursor);
      denseFeas.push(interpolateProfileValuesAtDist(cursor, dist, feasibleAbs));
      denseGround.push(interpolateProfileValuesAtDist(cursor, dist, ground));
      cursor += stepM;
    }
    if (denseDist[denseDist.length - 1] !== totalDist) {
      denseDist.push(totalDist);
      denseFeas.push(feasibleAbs[feasibleAbs.length - 1]);
      denseGround.push(ground[ground.length - 1]);
    }
    const smoothed = denseFeas.slice();
    for (let i = 1; i < denseFeas.length - 1; i += 1) {
      smoothed[i] = (denseFeas[i - 1] + denseFeas[i] + denseFeas[i + 1]) / 3;
    }
    const displayAbs = smoothed.map(function (value, index) {
      const floor = interpolateProfileValuesAtDist(denseDist[index], dist, feasibleAbs);
      return Math.max(value, floor);
    });
    return {
      displayAbs: displayAbs,
      displayGround: denseGround,
      displayDist: denseDist
    };
  }

  function buildSmoothSparklinePath(displayAbs, displayDist, totalDist, pad, width, yAt) {
    if (!displayAbs || displayAbs.length < 2) {
      return "";
    }
    function xAtDist(distM) {
      const usable = Math.max(1, width - pad * 2);
      const fraction = totalDist > 0 ? distM / totalDist : 0;
      return pad + fraction * usable;
    }
    const points = displayAbs.map(function (value, index) {
      return {
        x: xAtDist(displayDist[index]),
        y: yAt(value)
      };
    });
    if (points.length === 2) {
      return (
        "M" +
        points[0].x.toFixed(1) +
        " " +
        points[0].y.toFixed(1) +
        " L" +
        points[1].x.toFixed(1) +
        " " +
        points[1].y.toFixed(1)
      );
    }
    let path = "M" + points[0].x.toFixed(1) + " " + points[0].y.toFixed(1);
    for (let i = 0; i < points.length - 1; i += 1) {
      const p0 = points[i === 0 ? i : i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] || p2;
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      path +=
        " C" +
        cp1x.toFixed(1) +
        " " +
        cp1y.toFixed(1) +
        " " +
        cp2x.toFixed(1) +
        " " +
        cp2y.toFixed(1) +
        " " +
        p2.x.toFixed(1) +
        " " +
        p2.y.toFixed(1);
    }
    return path;
  }

  function interpolateProfileSeriesAt(t, series) {
    const dist = series.dist || [];
    const total = dist.length ? dist[dist.length - 1] : 0;
    const clampedT = Math.max(0, Math.min(1, Number(t) || 0));
    const targetDist = clampedT * total;
    const ground = interpolateProfileValuesAtDist(targetDist, dist, series.ground);
    const feasibleAbs = interpolateProfileValuesAtDist(targetDist, dist, series.feasibleAbs);
    const idealAbs = interpolateProfileValuesAtDist(targetDist, dist, series.idealAbs);
    return {
      ground: ground,
      feasibleAbs: feasibleAbs,
      idealAbs: idealAbs,
      agl: feasibleAbs - ground,
      distM: targetDist,
      t: clampedT
    };
  }

  function clientToProfileProbeT(clientX, stageRect, viewBox, series) {
    const vb = viewBox || { x: 0, w: series.width };
    const pad = series.pad || 0;
    const rx = stageRect.width > 0 ? (clientX - stageRect.left) / stageRect.width : 0.5;
    const worldX = vb.x + rx * vb.w;
    const usable = Math.max(1, series.width - pad * 2);
    return Math.max(0, Math.min(1, (worldX - pad) / usable));
  }

  function profileProbeScreenX(probeT, series, viewBox, stageRect) {
    const vb = viewBox || { x: 0, w: series.width };
    const worldX = series.pad + probeT * (series.width - series.pad * 2);
    const rx = vb.w > 0 ? (worldX - vb.x) / vb.w : probeT;
    return stageRect.left + rx * stageRect.width;
  }

  function renderProfileProbeOverlay(e, series, probeT) {
    if (!series || !e) {
      return null;
    }
    const sample = interpolateProfileSeriesAt(probeT, series);
    const range = Math.max(1, series.maxY - series.minY);
    const x = series.pad + sample.t * (series.width - series.pad * 2);
    function yAt(value) {
      return series.pad + (1 - (value - series.minY) / range) * (series.height - series.pad * 2);
    }
    const yGround = yAt(sample.ground);
    const yFlight = yAt(sample.feasibleAbs);
    const flip = x > series.width * 0.72;
    const labelX = flip ? x - 8 : x + 8;
    const anchor = flip ? "end" : "start";
    return e(
      "g",
      { className: "fp-profile-probe", key: "profile-probe" },
      e("line", {
        className: "fp-profile-probe-line",
        x1: x,
        y1: yGround,
        x2: x,
        y2: yFlight
      }),
      e("circle", {
        className: "fp-profile-probe-dot fp-profile-probe-dot--ground",
        cx: x,
        cy: yGround,
        r: 3
      }),
      e("circle", {
        className: "fp-profile-probe-dot fp-profile-probe-dot--flight",
        cx: x,
        cy: yFlight,
        r: 3.5
      }),
      e("rect", {
        className: "fp-profile-probe-handle",
        x: x - 12,
        y: yFlight - 14,
        width: 24,
        height: 8,
        rx: 2
      }),
      e(
        "text",
        {
          className: "fp-profile-probe-label",
          x: labelX,
          y: yFlight - 18,
          textAnchor: anchor
        },
        "高度 " + Math.round(sample.feasibleAbs) + " m"
      ),
      e(
        "text",
        {
          className: "fp-profile-probe-label",
          x: labelX,
          y: yFlight - 5,
          textAnchor: anchor
        },
        "AGL " + Math.round(sample.agl) + " m"
      ),
      e(
        "text",
        {
          className: "fp-profile-probe-label fp-profile-probe-label--muted",
          x: labelX,
          y: yFlight + 8,
          textAnchor: anchor
        },
        "地面 " + Math.round(sample.ground) + " m"
      )
    );
  }

  function buildSparklineFlightSegments(flightValues, xAt, yAt, errorSet, keyPrefix, segmentKind) {
    const segments = [];
    for (let i = 1; i < flightValues.length; i += 1) {
      const segKey = i - 1 + "-" + i;
      segments.push({
        key: (keyPrefix || "fl-") + segKey,
        kind: segmentKind || "feasible",
        isError: segmentKind === "feasible" ? !!errorSet[segKey] : false,
        d:
          "M" +
          xAt(i - 1).toFixed(1) +
          " " +
          yAt(flightValues[i - 1]).toFixed(1) +
          " L" +
          xAt(i).toFixed(1) +
          " " +
          yAt(flightValues[i]).toFixed(1)
      });
    }
    return segments;
  }

  function buildTerrainProfileSparklinePaths(profile, settings, platform, layout) {
    const altitudes = resolveProfileFlightAltitudes(profile, settings, platform);
    if (!altitudes || altitudes.points.length < 2) {
      return null;
    }
    const pts = altitudes.points;
    const ground = altitudes.ground;
    const idealAbs = altitudes.idealAbs;
    const feasibleAbs = altitudes.feasibleAbs;
    const minY = Math.min.apply(null, ground);
    const maxY = Math.max.apply(null, idealAbs.concat(feasibleAbs));
    const range = Math.max(1, maxY - minY);
    const width = Number(layout && layout.width) || 200;
    const height = Number(layout && layout.height) || 48;
    const pad = Number(layout && layout.pad) || 2;
    function xAt(index) {
      return pad + (index / (pts.length - 1)) * (width - pad * 2);
    }
    function yAt(value) {
      return pad + (1 - (value - minY) / range) * (height - pad * 2);
    }
    const groundPath = ground
      .map(function (value, index) {
        return (index === 0 ? "M" : "L") + xAt(index).toFixed(1) + " " + yAt(value).toFixed(1);
      })
      .join(" ");
    const TPS = window.TerrainProfileSegments;
    const errorSet =
      TPS && platform && typeof TPS.profileSegmentErrorSet === "function"
        ? TPS.profileSegmentErrorSet(profile, settings, platform)
        : {};
    const idealFlightSegments = altitudes.showIdealLine
      ? buildSparklineFlightSegments(idealAbs, xAt, yAt, errorSet, "ideal-", "ideal")
      : [];
    const feasibleFlightSegments = buildSparklineFlightSegments(
      feasibleAbs,
      xAt,
      yAt,
      errorSet,
      "feasible-",
      "feasible"
    );
    const dist = profileCumulativeDistancesM(pts);
    const totalDist = dist.length ? dist[dist.length - 1] : 0;
    const smoothed = smoothFeasibleForDisplay(feasibleAbs, ground, dist, { stepM: 12 });
    const feasibleFlightPath = buildSmoothSparklinePath(
      smoothed.displayAbs,
      smoothed.displayDist,
      totalDist,
      pad,
      width,
      yAt
    );
    const idealAgl = idealAbs.map(function (abs, index) {
      return abs - ground[index];
    });
    const feasibleAgl = feasibleAbs.map(function (abs, index) {
      return abs - ground[index];
    });
    return {
      groundPath: groundPath,
      groundCloseX: xAt(pts.length - 1).toFixed(1),
      groundCloseY: yAt(minY).toFixed(1),
      idealFlightSegments: idealFlightSegments,
      feasibleFlightSegments: feasibleFlightSegments,
      feasibleFlightPath: feasibleFlightPath,
      flightSegments: feasibleFlightSegments,
      showIdealLine: altitudes.showIdealLine,
      contentWidth: width,
      contentHeight: height,
      series: {
        dist: dist,
        ground: ground,
        feasibleAbs: feasibleAbs,
        idealAbs: idealAbs,
        minY: minY,
        maxY: maxY,
        pad: pad,
        width: width,
        height: height,
        pointCount: pts.length
      },
      stats: {
        terrainMin: minY,
        terrainMax: Math.max.apply(null, ground),
        aglMin: Math.min.apply(null, feasibleAgl),
        aglMax: Math.max.apply(null, feasibleAgl),
        idealAglMin: Math.min.apply(null, idealAgl),
        idealAglMax: Math.max.apply(null, idealAgl),
        feasibleAglMin: Math.min.apply(null, feasibleAgl),
        feasibleAglMax: Math.max.apply(null, feasibleAgl),
        feasibleSource: altitudes.feasibleSource,
        pointCount: pts.length,
        showIdealLine: altitudes.showIdealLine
      }
    };
  }

  function renderTerrainProfileSparkline(e, paths, options) {
    if (!paths || !e) {
      return null;
    }
    const opts = options || {};
    const viewBox =
      opts.viewBox || "0 0 " + paths.contentWidth + " " + paths.contentHeight;
    const svgProps = {
      className: opts.className || "fp-terrain-sparkline fp-terrain-sparkline--wide",
      viewBox: viewBox,
      width: opts.width != null ? opts.width : paths.contentWidth,
      height: opts.height != null ? opts.height : paths.contentHeight,
      role: "img",
      "aria-label": opts.ariaLabel || "地形剖面预览"
    };
    if (opts.style) {
      svgProps.style = opts.style;
    }
    if (opts.onPointerDown) {
      svgProps.onPointerDown = opts.onPointerDown;
    }
    if (opts.onPointerMove) {
      svgProps.onPointerMove = opts.onPointerMove;
    }
    if (opts.onPointerUp) {
      svgProps.onPointerUp = opts.onPointerUp;
    }
    if (opts.onWheel) {
      svgProps.onWheel = opts.onWheel;
    }
    const idealSegments = paths.showIdealLine ? paths.idealFlightSegments || [] : [];
    const feasibleSegments = (paths.feasibleFlightSegments || paths.flightSegments || []).filter(
      function (segment) {
        return segment.isError;
      }
    );
    const children = [
      e("path", {
        key: "ground",
        className: "fp-terrain-sparkline-ground",
        d:
          paths.groundPath +
          " L" +
          paths.groundCloseX +
          " " +
          paths.groundCloseY +
          " Z"
      })
    ];
    idealSegments.forEach(function (segment) {
      children.push(
        e("path", {
          key: segment.key,
          className: "fp-terrain-sparkline-flight fp-terrain-sparkline-flight--ideal",
          d: segment.d
        })
      );
    });
    if (paths.feasibleFlightPath) {
      children.push(
        e("path", {
          key: "feasible-smooth",
          className: "fp-terrain-sparkline-flight fp-terrain-sparkline-flight--feasible",
          d: paths.feasibleFlightPath
        })
      );
    }
    feasibleSegments.forEach(function (segment) {
      children.push(
        e("path", {
          key: segment.key,
          className: "fp-terrain-sparkline-flight fp-terrain-sparkline-flight--error",
          d: segment.d
        })
      );
    });
    if (opts.probe && paths.series && opts.probeT != null) {
      const probeOverlay = renderProfileProbeOverlay(e, paths.series, opts.probeT);
      if (probeOverlay) {
        children.push(probeOverlay);
      }
    }
    return e("svg", svgProps, children);
  }

  function createTerrainProfileSparklineElement(e, profile, settings, platform, layout) {
    const paths = buildTerrainProfileSparklinePaths(
      profile,
      settings,
      platform,
      layout || { width: 200, height: 48, pad: 2 }
    );
    if (!paths) {
      return null;
    }
    return renderTerrainProfileSparkline(e, paths, {
      width: 200,
      height: 48
    });
  }

  function renderTerrainProfileSparklineRow(e, options) {
    const profile = options && options.profile;
    const settings = options && options.settings;
    const platform = options && options.platform;
    const title = (options && options.title) || "地形剖面";
    const onExpand = options && options.onExpand;
    const sparkline = createTerrainProfileSparklineElement(e, profile, settings, platform);
    if (!sparkline) {
      return null;
    }
    return e(
      "div",
      { className: "fp-block-sparkline-row" },
      e("div", { className: "fp-block-item-sparkline" }, sparkline),
      e(
        "button",
        {
          type: "button",
          className: "fp-btn fp-btn--tiny fp-btn--icon",
          "aria-label": "放大地形剖面",
          title: "放大地形剖面",
          onClick: function () {
            if (typeof onExpand === "function") {
              onExpand({
                title: title,
                profile: profile,
                settings: settings
              });
            }
          }
        },
        "\u2922"
      )
    );
  }

  function clampProfileViewBox(viewBox, contentWidth, contentHeight) {
    const vb = viewBox || { x: 0, y: 0, w: contentWidth, h: contentHeight };
    const w = Math.max(contentWidth * 0.06, Math.min(contentWidth, vb.w));
    const h = Math.max(contentHeight * 0.06, Math.min(contentHeight, vb.h));
    const x = Math.max(0, Math.min(contentWidth - w, vb.x));
    const y = Math.max(0, Math.min(contentHeight - h, vb.y));
    return { x: x, y: y, w: w, h: h };
  }

  function formatProfileViewBox(viewBox) {
    if (!viewBox) {
      return "";
    }
    return (
      viewBox.x.toFixed(2) +
      " " +
      viewBox.y.toFixed(2) +
      " " +
      viewBox.w.toFixed(2) +
      " " +
      viewBox.h.toFixed(2)
    );
  }

  function zoomProfileViewBox(viewBox, contentWidth, contentHeight, stageRect, clientX, clientY, deltaY) {
    const vb = viewBox || { x: 0, y: 0, w: contentWidth, h: contentHeight };
    const factor = deltaY > 0 ? 1.12 : 0.88;
    const newW = vb.w * factor;
    const newH = vb.h * factor;
    const rx = stageRect.width > 0 ? (clientX - stageRect.left) / stageRect.width : 0.5;
    const ry = stageRect.height > 0 ? (clientY - stageRect.top) / stageRect.height : 0.5;
    const worldX = vb.x + rx * vb.w;
    const worldY = vb.y + ry * vb.h;
    return clampProfileViewBox(
      {
        x: worldX - rx * newW,
        y: worldY - ry * newH,
        w: newW,
        h: newH
      },
      contentWidth,
      contentHeight
    );
  }

  function panProfileViewBox(viewBox, contentWidth, contentHeight, stageRect, deltaX, deltaY) {
    const vb = viewBox || { x: 0, y: 0, w: contentWidth, h: contentHeight };
    const scaleX = stageRect.width > 0 ? vb.w / stageRect.width : 1;
    const scaleY = stageRect.height > 0 ? vb.h / stageRect.height : 1;
    return clampProfileViewBox(
      {
        x: vb.x - deltaX * scaleX,
        y: vb.y - deltaY * scaleY,
        w: vb.w,
        h: vb.h
      },
      contentWidth,
      contentHeight
    );
  }

  const FP3D_SAMPLE_STEP_M = 28;
  const FP3D_SURVEY_STEP_M = 24;

  function isRelativeAltPreviewFrame(frame, MM) {
    const AP = window.ArdupilotMissionCompat;
    return (
      frame === 3 ||
      frame === MM.MAV_FRAME_GLOBAL_RELATIVE_ALT_INT ||
      (AP && frame === AP.MAV_FRAME_GLOBAL_RELATIVE_ALT)
    );
  }

  function resolveAbsolutePreviewFlightZ(alt, terrainRef) {
    const absoluteAlt = Number(alt) || 0;
    const terrain =
      terrainRef != null && Number.isFinite(Number(terrainRef)) ? Number(terrainRef) : null;
    if (terrain != null && absoluteAlt < terrain - 5) {
      return terrain;
    }
    return absoluteAlt;
  }

  function effectivePreviewPointAlt(point, fallbackAlt) {
    const override = point && Number(point.aglOverride);
    if (Number.isFinite(override)) {
      return override;
    }
    return Number(point && point.alt != null ? point.alt : fallbackAlt) || 0;
  }

  function interpolateSegmentAgl(from, to, ratio, fallbackAlt) {
    const startAgl = effectivePreviewPointAlt(from, fallbackAlt);
    const endAgl = effectivePreviewPointAlt(to, fallbackAlt);
    return startAgl + (endAgl - startAgl) * ratio;
  }

  function computeWaypointPreviewFlightZ(wp, terrainZ, homeTerrain, MM, fallbackAlt) {
    if (!wp) {
      return 0;
    }
    const alt = effectivePreviewPointAlt(wp, fallbackAlt);
    const frame = normalizePreviewFrame(wp.frame);
    const terrainRef = homeTerrain != null ? homeTerrain : terrainZ;
    if (frame === MM.MAV_FRAME_GLOBAL_TERRAIN_ALT) {
      return terrainZ + alt;
    }
    if (isRelativeAltPreviewFrame(frame, MM)) {
      return (homeTerrain != null ? homeTerrain : terrainZ) + alt;
    }
    return resolveAbsolutePreviewFlightZ(alt, terrainRef);
  }

  function previewWaypointsColocated(a, b, maxDistM) {
    if (!a || !b) {
      return false;
    }
    const limit = Number.isFinite(Number(maxDistM)) ? Number(maxDistM) : 15;
    return (
      distanceMetersBetween(
        { lat: Number(a.lat), lng: Number(a.lng) },
        { lat: Number(b.lat), lng: Number(b.lng) }
      ) <= limit
    );
  }

  function previewWaypointsSameAltitude(a, b) {
    if (!a || !b) {
      return false;
    }
    return Math.abs((Number(a.alt) || 0) - (Number(b.alt) || 0)) < 0.5;
  }

  function findPreviewHomeAnchorWaypoint(missionWaypoints) {
    const MM = window.MissionModel;
    const AP = window.ArdupilotMissionCompat;
    const list = missionWaypoints || [];
    for (let i = 0; i < list.length; i += 1) {
      const wp = list[i];
      if (!wp || wp.source === "camera") {
        continue;
      }
      if (
        MM &&
        wp.command === MM.MAV_CMD.NAV_WAYPOINT &&
        (wp.frame === 0 || (AP && wp.frame === AP.MAV_FRAME_GLOBAL))
      ) {
        return wp;
      }
      return wp;
    }
    return null;
  }

  function resolvePreviewHome(missionWaypoints, fallback) {
    const AP = window.ArdupilotMissionCompat;
    const MM = window.MissionModel;
    const fb =
      fallback ||
      (MM && MM.getFlightPlanHomeLatLng
        ? MM.getFlightPlanHomeLatLng()
        : {
            lat: window.DEFAULT_MAP_LAT || 29.59256,
            lng: window.DEFAULT_MAP_LON || 106.22742,
            alt: 30,
            source: "default"
          });
    if (MM && MM.hasFlightPlanVehiclePosition && MM.hasFlightPlanVehiclePosition()) {
      return MM.getFlightPlanHomeLatLng();
    }
    const anchor = findPreviewHomeAnchorWaypoint(missionWaypoints);
    if (AP && typeof AP.getMissionFileHome === "function") {
      const fileHome = AP.getMissionFileHome();
      if (
        fileHome &&
        Number.isFinite(Number(fileHome.lat)) &&
        Number.isFinite(Number(fileHome.lng))
      ) {
        const resolved = {
          lat: Number(fileHome.lat),
          lng: Number(fileHome.lng),
          alt: Number(fileHome.alt) || 0,
          frame: fileHome.frame,
          source: "file"
        };
        if (anchor && previewWaypointsColocated(resolved, anchor)) {
          return {
            lat: Number(anchor.lat),
            lng: Number(anchor.lng),
            alt: Number(anchor.alt) || 0,
            frame: resolved.frame,
            source: "file"
          };
        }
        return resolved;
      }
    }
    if (
      anchor &&
      Number.isFinite(Number(anchor.lat)) &&
      Number.isFinite(Number(anchor.lng))
    ) {
      return {
        lat: Number(anchor.lat),
        lng: Number(anchor.lng),
        alt: Number(anchor.alt) || 0,
        frame: anchor.frame != null ? anchor.frame : 0,
        source: "waypoint"
      };
    }
    return fb;
  }

  function resolvePreviewHomeTerrain(homeTerrain, home) {
    if (homeTerrain != null && Number.isFinite(Number(homeTerrain))) {
      return Number(homeTerrain);
    }
    const AP = window.ArdupilotMissionCompat;
    const fileHome = AP && AP.getMissionFileHome ? AP.getMissionFileHome() : null;
    if (
      fileHome &&
      (fileHome.frame === 0 || fileHome.frame === AP.MAV_FRAME_GLOBAL) &&
      Number.isFinite(Number(fileHome.alt))
    ) {
      return Number(fileHome.alt);
    }
    if (home && Number.isFinite(Number(home.alt)) && home.source === "file") {
      return Number(home.alt);
    }
    return null;
  }

  function computePreviewFlightZ(interpolatedAlt, segmentFrame, terrainZ, homeTerrain, MM) {
    let flightZ = interpolatedAlt;
    if (segmentFrame === MM.MAV_FRAME_GLOBAL_TERRAIN_ALT) {
      flightZ = terrainZ + interpolatedAlt;
    } else if (isRelativeAltPreviewFrame(segmentFrame, MM)) {
      flightZ = (homeTerrain != null ? homeTerrain : terrainZ) + interpolatedAlt;
    }
    return flightZ;
  }

  function getLoiterRadiusMeters(wp) {
    if (!wp) {
      return 0;
    }
    const p2 = Number(wp.param2) || 0;
    const p1 = Number(wp.param1) || 0;
    if (p2 !== 0) {
      return p2;
    }
    if (p1 !== 0) {
      return p1;
    }
    return -120;
  }

  function appendLoiterArcToSamples(samples, segment, origin) {
    const MM = window.MissionModel;
    const to = segment && segment.to;
    if (
      !MM ||
      !to ||
      to.command !== MM.MAV_CMD.NAV_LOITER_TO_ALT ||
      !samples ||
      samples.length < 2
    ) {
      return samples;
    }
    const radiusSigned = getLoiterRadiusMeters(to);
    const radiusM = Math.abs(radiusSigned);
    if (radiusM < 5) {
      return samples;
    }
    const fromLocal = projectLngLatToMeters(segment.from, origin);
    const centerLocal = projectLngLatToMeters(to, origin);
    const approachAngle = Math.atan2(
      centerLocal.x - fromLocal.x,
      centerLocal.y - fromLocal.y
    );
    const last = samples[samples.length - 1];
    const sweep = (radiusSigned < 0 ? 1 : -1) * Math.PI * 1.35;
    const steps = Math.max(12, Math.round(radiusM / 5));
    const out = samples.slice();
    for (let i = 1; i <= steps; i += 1) {
      const angle = approachAngle + sweep * (i / steps);
      const x = centerLocal.x + radiusM * Math.sin(angle);
      const z = centerLocal.y + radiusM * Math.cos(angle);
      const geo = projectMetersToLngLat({ x: x, y: z }, origin);
      out.push({
        lat: geo.lat,
        lng: geo.lng,
        x: x,
        z: z,
        terrainZ: last.terrainZ,
        flightZ: last.flightZ,
        agl: last.agl,
        available: last.available,
        bearingRad: angle + (radiusSigned < 0 ? Math.PI / 2 : -Math.PI / 2)
      });
    }
    return out;
  }

  function countPreviewMissionWaypoints(opts, mode) {
    if (mode === "planning") {
      if (opts.terrainPlanBlocks && opts.terrainPlanBlocks.length) {
        return opts.terrainPlanBlocks.reduce(function (total, block) {
          const path = block && Array.isArray(block.previewPath) ? block.previewPath : [];
          return total + path.length;
        }, 0);
      }
      return Array.isArray(opts.surveyPath) ? opts.surveyPath.length : 0;
    }
    return (opts.missionWaypoints || []).filter(function (wp) {
      return wp && wp.source !== "camera";
    }).length;
  }

  function normalizePreviewPoint(point, fallbackAlt) {
    if (!point) {
      return null;
    }
    return {
      lat: Number(point.lat),
      lng: Number(point.lng),
      alt: effectivePreviewPointAlt(point, fallbackAlt),
      aglOverride: Number.isFinite(Number(point && point.aglOverride))
        ? Number(point.aglOverride)
        : undefined,
      frame: point.frame,
      source: point.source || "survey",
      command: point.command,
      blockId: point.blockId || "",
      pathRole: point.pathRole || point.role || "",
      segmentRole: point.segmentRole || "",
      label: point.label || ""
    };
  }

  function effectivePreviewWaypointLatLng(wp, home) {
    if (!wp) {
      return null;
    }
    const MM = window.MissionModel;
    if (
      MM &&
      wp.command === MM.MAV_CMD.NAV_RETURN_TO_LAUNCH &&
      home &&
      Number.isFinite(home.lat) &&
      Number.isFinite(home.lng)
    ) {
      return {
        lat: Number(home.lat),
        lng: Number(home.lng),
        alt: Number(home.alt) || 0
      };
    }
    if (!Number.isFinite(Number(wp.lat)) || !Number.isFinite(Number(wp.lng))) {
      return null;
    }
    return {
      lat: Number(wp.lat),
      lng: Number(wp.lng),
      alt: Number(wp.alt) || 0
    };
  }

  function isSurveyLikePreviewWaypoint(wp) {
    if (!wp) {
      return false;
    }
    if (wp.source === "survey" || wp.source === "connector") {
      return true;
    }
    if (wp.blockId) {
      return true;
    }
    if (wp.segmentRole || wp.pathRole) {
      return true;
    }
    return false;
  }

  function isPreviewWorkSegment(segment) {
    if (!segment) {
      return false;
    }
    const type = segment.type || "";
    if (type === "survey") {
      return true;
    }
    if (type === "connector" && segment.blockId) {
      return true;
    }
    return false;
  }

  function classifyPreviewSegmentType(a, b) {
    const MM = window.MissionModel;
    if (MM && b && b.command === MM.MAV_CMD.NAV_RETURN_TO_LAUNCH) {
      return "rtl";
    }
    if (a && b && isSurveyLikePreviewWaypoint(a) && isSurveyLikePreviewWaypoint(b)) {
      if (isSurveyConnectorSegment(a, b)) {
        return "connector";
      }
      return "survey";
    }
    if (
      isSurveyLikePreviewWaypoint(a) ||
      isSurveyLikePreviewWaypoint(b) ||
      (a && a.source === "connector") ||
      (b && b.source === "connector")
    ) {
      return "connector";
    }
    return "other";
  }

  function buildPreviewResampledPoints(a, b, stepM) {
    const pts = [];
    if (!a || !b) {
      return pts;
    }
    const total = Math.max(0, distanceMetersBetween(a, b));
    const step = Math.max(8, Number(stepM) || FP3D_SAMPLE_STEP_M);
    const divisions = Math.max(1, Math.ceil(total / step));
    for (let i = 0; i <= divisions; i += 1) {
      pts.push(pointOnSegment(a, b, divisions <= 0 ? 0 : i / divisions));
    }
    return pts;
  }

  function buildMissionPreviewSegments(waypoints, settings, home) {
    const MM = window.MissionModel;
    const list = (waypoints || []).filter(function (wp) {
      return wp && wp.source !== "camera";
    });
    const segments = [];
    for (let i = 1; i < list.length; i += 1) {
      const a = list[i - 1];
      const b = list[i];
      const pa = effectivePreviewWaypointLatLng(a, home);
      const pb = effectivePreviewWaypointLatLng(b, home);
      if (!pa || !pb) {
        continue;
      }
      const surveyLikeLeg =
        isSurveyLikePreviewWaypoint(a) || isSurveyLikePreviewWaypoint(b);
      const terrainFrameOverride =
        MM &&
        (settings.useTerrainFollowing ||
          normalizePreviewFrame(a.frame) === MM.MAV_FRAME_GLOBAL_TERRAIN_ALT ||
          normalizePreviewFrame(b.frame) === MM.MAV_FRAME_GLOBAL_TERRAIN_ALT) &&
        surveyLikeLeg
          ? { frame: MM.MAV_FRAME_GLOBAL_TERRAIN_ALT }
          : null;
      segments.push({
        id: "mission-" + i,
        type: classifyPreviewSegmentType(a, b),
        from: normalizePreviewPoint(
          Object.assign({}, a, pa, terrainFrameOverride || {}),
          settings.surveyAltitude
        ),
        to: normalizePreviewPoint(
          Object.assign({}, b, pb, terrainFrameOverride || {}),
          settings.surveyAltitude
        ),
        blockId: a.blockId || b.blockId || "",
        ribbonWidth: Math.max(12, Number(settings.lineSpacingMeters) || computeLineSpacingMeters(
          settings.sideOverlap,
          settings.footprintWidthMeters
        ))
      });
    }
    return segments;
  }

  function buildHomeConnectorPreviewSegment(home, firstWaypoint, settings) {
    const MM = window.MissionModel;
    const AP = window.ArdupilotMissionCompat;
    if (!MM || !home || !firstWaypoint) {
      return null;
    }
    const homeFrame = AP && AP.MAV_FRAME_GLOBAL != null ? AP.MAV_FRAME_GLOBAL : 0;
    const homePoint = normalizePreviewPoint(
      {
        lat: Number(home.lat),
        lng: Number(home.lng),
        alt: Number(home.alt) || 0,
        frame: homeFrame,
        command: MM.MAV_CMD.NAV_WAYPOINT,
        source: "home",
        label: "Home"
      },
      settings.surveyAltitude
    );
    const firstCoords = effectivePreviewWaypointLatLng(firstWaypoint, home);
    if (!homePoint || !firstCoords) {
      return null;
    }
    const firstPoint = normalizePreviewPoint(
      Object.assign({}, firstWaypoint, firstCoords),
      settings.surveyAltitude
    );
    if (previewWaypointsColocated(homePoint, firstPoint, 3)) {
      return null;
    }
    return {
      id: "mission-home",
      type: "other",
      from: homePoint,
      to: firstPoint,
      blockId: "",
      ribbonWidth: 12
    };
  }

  function buildPlanningPreviewSegments(terrainPlanBlocks, surveyPath, settings) {
    const MM = window.MissionModel;
    const previewFrame =
      settings && settings.useTerrainFollowing && MM
        ? MM.MAV_FRAME_GLOBAL_TERRAIN_ALT
        : MM && MM.MAV_FRAME_GLOBAL_RELATIVE_ALT_INT != null
          ? MM.MAV_FRAME_GLOBAL_RELATIVE_ALT_INT
          : undefined;
    const segments = [];
    if (terrainPlanBlocks && terrainPlanBlocks.length) {
      terrainPlanBlocks.forEach(function (block, index) {
        const path = block && Array.isArray(block.previewPath) ? block.previewPath : [];
        for (let i = 1; i < path.length; i += 1) {
          const a = normalizePreviewPoint(
            Object.assign({ frame: previewFrame }, path[i - 1]),
            settings.surveyAltitude
          );
          const b = normalizePreviewPoint(
            Object.assign({ frame: previewFrame }, path[i]),
            settings.surveyAltitude
          );
          if (!a || !b) {
            continue;
          }
          segments.push({
            id: "plan-" + index + "-" + i,
            type: "survey",
            from: a,
            to: b,
            blockId: block && block.id ? block.id : "plan-" + index,
            profile: block && Array.isArray(block.previewProfile) ? block.previewProfile : [],
            ribbonWidth: Math.max(
              12,
              Number(settings.lineSpacingMeters) ||
                computeLineSpacingMeters(settings.sideOverlap, settings.footprintWidthMeters)
            )
          });
        }
      });
      return segments;
    }

    for (let i = 1; i < (surveyPath || []).length; i += 1) {
      const a = normalizePreviewPoint(
        Object.assign({ frame: previewFrame }, surveyPath[i - 1]),
        settings.surveyAltitude
      );
      const b = normalizePreviewPoint(
        Object.assign({ frame: previewFrame }, surveyPath[i]),
        settings.surveyAltitude
      );
      if (!a || !b) {
        continue;
      }
      segments.push({
        id: "draft-" + i,
        type: "survey",
        from: a,
        to: b,
        blockId: "draft",
        ribbonWidth: Math.max(
          12,
          Number(settings.lineSpacingMeters) ||
            computeLineSpacingMeters(settings.sideOverlap, settings.footprintWidthMeters)
        )
      });
    }
    return segments;
  }

  function buildTerrainProfileLookup(planBlocks, surveyBlocks) {
    const map = new Map();

    function store(block, profile) {
      if (!block || !Array.isArray(profile) || profile.length < 2) {
        return;
      }
      if (block.id) {
        map.set(String(block.id), profile);
      }
      if (block.order != null) {
        map.set("order:" + String(block.order), profile);
      }
    }

    (planBlocks || []).forEach(function (block) {
      store(block, block.previewProfile);
    });
    (surveyBlocks || []).forEach(function (block) {
      store(block, block.storedProfile || block.previewProfile);
    });

    return map;
  }

  function findNearestProfileIndex(profile, point) {
    if (!Array.isArray(profile) || profile.length === 0 || !point) {
      return -1;
    }
    let bestIndex = -1;
    let bestDist = Infinity;
    for (let i = 0; i < profile.length; i += 1) {
      const sample = profile[i];
      if (!sample) {
        continue;
      }
      const lat = Number(sample.lat);
      const lng = Number(sample.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        continue;
      }
      const dist = distanceMetersBetween(point, { lat: lat, lng: lng });
      if (dist < bestDist) {
        bestDist = dist;
        bestIndex = i;
      }
    }
    return bestIndex;
  }

  function extractProfileSampleFields(raw) {
    if (!raw) {
      return null;
    }
    const elevation =
      raw.elevation != null && Number.isFinite(Number(raw.elevation))
        ? Number(raw.elevation)
        : null;
    const aglOverride =
      raw.aglOverride != null && Number.isFinite(Number(raw.aglOverride))
        ? Number(raw.aglOverride)
        : null;
    const targetAbsAlt =
      raw.targetAbsAlt != null && Number.isFinite(Number(raw.targetAbsAlt))
        ? Number(raw.targetAbsAlt)
        : null;
    if (elevation == null && aglOverride == null && targetAbsAlt == null) {
      return null;
    }
    return {
      elevation: elevation,
      aglOverride: aglOverride,
      targetAbsAlt: targetAbsAlt,
      available: raw.available !== false
    };
  }

  function blendProfileSampleFields(a, b, ratio) {
    if (!a) {
      return b;
    }
    if (!b) {
      return a;
    }
    const t = Math.max(0, Math.min(1, Number(ratio) || 0));
    function blend(key) {
      const av = a[key];
      const bv = b[key];
      if (av == null && bv == null) {
        return null;
      }
      if (av == null) {
        return bv;
      }
      if (bv == null) {
        return av;
      }
      return av + (bv - av) * t;
    }
    return {
      elevation: blend("elevation"),
      aglOverride: blend("aglOverride"),
      targetAbsAlt: blend("targetAbsAlt"),
      available: a.available !== false && b.available !== false
    };
  }

  function sampleProfileAtGeoPoint(profile, point) {
    if (!Array.isArray(profile) || profile.length === 0 || !point) {
      return null;
    }
    if (profile.length === 1) {
      return extractProfileSampleFields(profile[0]);
    }

    let bestDist = Infinity;
    let bestSample = null;
    for (let i = 0; i < profile.length - 1; i += 1) {
      const a = profile[i];
      const b = profile[i + 1];
      if (!a || !b) {
        continue;
      }
      const aLat = Number(a.lat);
      const aLng = Number(a.lng);
      const bLat = Number(b.lat);
      const bLng = Number(b.lng);
      if (
        !Number.isFinite(aLat) ||
        !Number.isFinite(aLng) ||
        !Number.isFinite(bLat) ||
        !Number.isFinite(bLng)
      ) {
        continue;
      }
      const segStart = { lat: aLat, lng: aLng };
      const segEnd = { lat: bLat, lng: bLng };
      const segLen = distanceMetersBetween(segStart, segEnd);
      if (segLen <= 0.5) {
        const dist = distanceMetersBetween(point, segStart);
        if (dist < bestDist) {
          bestDist = dist;
          bestSample = extractProfileSampleFields(a);
        }
        continue;
      }
      let bestSegDist = Infinity;
      let bestRatio = 0;
      for (let step = 0; step <= 12; step += 1) {
        const ratio = step / 12;
        const probe = pointOnSegment(segStart, segEnd, ratio);
        const dist = distanceMetersBetween(point, probe);
        if (dist < bestSegDist) {
          bestSegDist = dist;
          bestRatio = ratio;
        }
      }
      if (bestSegDist < bestDist) {
        bestDist = bestSegDist;
        bestSample = blendProfileSampleFields(
          extractProfileSampleFields(a),
          extractProfileSampleFields(b),
          bestRatio
        );
      }
    }

    if (bestSample) {
      return bestSample;
    }
    const idx = findNearestProfileIndex(profile, point);
    return idx >= 0 ? extractProfileSampleFields(profile[idx]) : null;
  }

  function normalizePreviewFrame(frame) {
    const n = Number(frame);
    return Number.isFinite(n) ? n : null;
  }

  function missionUsesTerrainFollowFrame(waypoints, MM) {
    if (!MM || !waypoints || !waypoints.length) {
      return false;
    }
    return waypoints.some(function (wp) {
      if (!wp || wp.source === "camera") {
        return false;
      }
      return normalizePreviewFrame(wp.frame) === MM.MAV_FRAME_GLOBAL_TERRAIN_ALT;
    });
  }

  function resolvePreviewTerrainSettings(settings, waypoints, surveyBlocks) {
    const MM = window.MissionModel;
    const base = Object.assign({}, settings || normalizeMissionSettings());
    if (base.useTerrainFollowing) {
      return base;
    }
    if (missionUsesTerrainFollowFrame(waypoints, MM)) {
      return Object.assign({}, base, { useTerrainFollowing: true });
    }
    if (
      (surveyBlocks || []).some(function (block) {
        return block && block.paramsSnapshot && block.paramsSnapshot.useTerrainFollowing;
      })
    ) {
      return Object.assign({}, base, { useTerrainFollowing: true });
    }
    if (
      (surveyBlocks || []).some(function (block) {
        return (
          block &&
          ((Array.isArray(block.storedProfile) && block.storedProfile.length >= 2) ||
            (Array.isArray(block.previewProfile) && block.previewProfile.length >= 2))
        );
      }) &&
      (waypoints || []).some(function (wp) {
        return isSurveyLikePreviewWaypoint(wp);
      })
    ) {
      return Object.assign({}, base, { useTerrainFollowing: true });
    }
    return base;
  }

  function isTerrainFollowPreviewSegment(segment, settings, MM) {
    if (!segment || !MM) {
      return false;
    }
    const fromFrame = normalizePreviewFrame(segment.from && segment.from.frame);
    const toFrame = normalizePreviewFrame(segment.to && segment.to.frame);
    if (
      fromFrame === MM.MAV_FRAME_GLOBAL_TERRAIN_ALT ||
      toFrame === MM.MAV_FRAME_GLOBAL_TERRAIN_ALT
    ) {
      return true;
    }
    if (!settings || !settings.useTerrainFollowing) {
      return false;
    }
    const type = segment.type || "";
    if (type === "rtl") {
      return false;
    }
    if (segment.from && segment.from.source === "home") {
      return false;
    }
    if (type === "other" && !segment.blockId) {
      return false;
    }
    if (type === "survey" || type === "connector") {
      return true;
    }
    if (segment.blockId) {
      return true;
    }
    return (
      isSurveyLikePreviewWaypoint(segment.from) ||
      isSurveyLikePreviewWaypoint(segment.to)
    );
  }

  function sampleTerrainFromProfile(profile, point) {
    const sample = sampleProfileAtGeoPoint(profile, point);
    if (!sample || sample.elevation == null) {
      return null;
    }
    return {
      elevation: sample.elevation,
      available: sample.available !== false
    };
  }

  function computePreviewSampleFlightZ(options) {
    const sample = options.sample;
    const ratio = options.ratio;
    const segment = options.segment;
    const segmentProfile = options.segmentProfile;
    const settings = options.settings;
    const homeTerrain = options.homeTerrain;
    const MM = options.MM;
    const fallbackAlt = Number(settings && settings.surveyAltitude) || 0;
    const profileSample = segmentProfile
      ? sampleProfileAtGeoPoint(segmentProfile, { lat: sample.lat, lng: sample.lng })
      : null;
    const terrainFollow = isTerrainFollowPreviewSegment(segment, settings, MM);

    if (terrainFollow) {
      let agl = interpolateSegmentAgl(segment.from, segment.to, ratio, fallbackAlt);
      if (
        profileSample &&
        profileSample.aglOverride != null &&
        Number.isFinite(profileSample.aglOverride)
      ) {
        agl = profileSample.aglOverride;
      }
      return sample.terrainZ + agl;
    }

    const segmentFrame = segment.from && segment.from.frame;
    if (isRelativeAltPreviewFrame(segmentFrame, MM)) {
      const agl = interpolateSegmentAgl(segment.from, segment.to, ratio, fallbackAlt);
      return (homeTerrain != null ? homeTerrain : sample.terrainZ) + agl;
    }

    const startTerrainZ = options.startTerrainZ;
    const endTerrainZ = options.endTerrainZ;
    const startFlightZ = computeWaypointPreviewFlightZ(
      segment.from,
      startTerrainZ,
      homeTerrain,
      MM,
      fallbackAlt
    );
    const endFlightZ = computeWaypointPreviewFlightZ(
      segment.to,
      endTerrainZ,
      homeTerrain,
      MM,
      fallbackAlt
    );
    return startFlightZ + (endFlightZ - startFlightZ) * ratio;
  }

  function buildPreviewSummary(data) {
    const summary = {
      segmentCount: 0,
      waypointCount: 0,
      terrainMin: null,
      terrainMax: null,
      flightMin: null,
      flightMax: null,
      aglMin: null,
      aglMax: null,
      workAglMin: null,
      workAglMax: null
    };
    if (!data || !data.segments) {
      return summary;
    }
    summary.segmentCount = data.segments.length;
    summary.waypointCount =
      data.missionWaypointCount != null && Number.isFinite(Number(data.missionWaypointCount))
        ? Number(data.missionWaypointCount)
        : 0;
    data.segments.forEach(function (segment) {
      const workSegment = isPreviewWorkSegment(segment);
      (segment.samples || []).forEach(function (sample) {
        if (sample.terrainZ != null && Number.isFinite(sample.terrainZ)) {
          summary.terrainMin =
            summary.terrainMin == null ? sample.terrainZ : Math.min(summary.terrainMin, sample.terrainZ);
          summary.terrainMax =
            summary.terrainMax == null ? sample.terrainZ : Math.max(summary.terrainMax, sample.terrainZ);
        }
        if (sample.flightZ != null && Number.isFinite(sample.flightZ)) {
          summary.flightMin =
            summary.flightMin == null ? sample.flightZ : Math.min(summary.flightMin, sample.flightZ);
          summary.flightMax =
            summary.flightMax == null ? sample.flightZ : Math.max(summary.flightMax, sample.flightZ);
        }
        if (sample.agl != null && Number.isFinite(sample.agl)) {
          summary.aglMin =
            summary.aglMin == null ? sample.agl : Math.min(summary.aglMin, sample.agl);
          summary.aglMax =
            summary.aglMax == null ? sample.agl : Math.max(summary.aglMax, sample.agl);
          if (workSegment) {
            summary.workAglMin =
              summary.workAglMin == null ? sample.agl : Math.min(summary.workAglMin, sample.agl);
            summary.workAglMax =
              summary.workAglMax == null ? sample.agl : Math.max(summary.workAglMax, sample.agl);
          }
        }
      });
    });
    return summary;
  }

  function buildPreviewRoutePoints(segments) {
    const points = [];
    const seen = new Set();
    (segments || []).forEach(function (segment) {
      (segment.samples || []).forEach(function (sample) {
        const key =
          Math.round((sample.lat || 0) * 1e6) +
          ":" +
          Math.round((sample.lng || 0) * 1e6) +
          ":" +
          Math.round((sample.flightZ || 0) * 100);
        if (seen.has(key)) {
          return;
        }
        seen.add(key);
        points.push({
          lat: sample.lat,
          lng: sample.lng,
          alt: sample.flightZ,
          terrainZ: sample.terrainZ,
          frame: sample.frame || null,
          source: segment.source || segment.type || "survey"
        });
      });
    });
    return points;
  }

  function prepareFlightPlanPreviewData(options) {
    const opts = options || {};
    const settings = resolvePreviewTerrainSettings(
      opts.settings || normalizeMissionSettings(),
      opts.missionWaypoints,
      opts.surveyBlocks
    );
    const home = opts.home || { lat: 0, lng: 0, alt: 0 };
    const mode = opts.mode || "mission";
    const terrainProfileLookup = buildTerrainProfileLookup(
      opts.terrainPlanBlocks,
      opts.surveyBlocks
    );
    const rawSegmentsBase =
      mode === "planning"
        ? buildPlanningPreviewSegments(opts.terrainPlanBlocks, opts.surveyPath, settings)
        : buildMissionPreviewSegments(opts.missionWaypoints, settings, home);
    let rawSegments = rawSegmentsBase;
    if (mode === "mission") {
      const firstMissionWp = (opts.missionWaypoints || []).find(function (wp) {
        return wp && wp.source !== "camera";
      });
      const homeSegment = buildHomeConnectorPreviewSegment(home, firstMissionWp, settings);
      if (homeSegment) {
        rawSegments = [homeSegment].concat(rawSegmentsBase);
      }
    }
    if (!rawSegments.length) {
      return Promise.resolve({
        ok: false,
        error: "暂无可预览的航线",
        data: { mode: mode, segments: [], summary: buildPreviewSummary({ segments: [] }) }
      });
    }

    const origin = {
      lat: Number(home.lat) || Number(rawSegments[0].from.lat) || 0,
      lng: Number(home.lng) || Number(rawSegments[0].from.lng) || 0
    };
    const TS = window.TerrainService;
    const MM = window.MissionModel;
    const homePoint = { lat: Number(home.lat) || origin.lat, lng: Number(home.lng) || origin.lng };
    const step = mode === "planning" ? FP3D_SURVEY_STEP_M : FP3D_SAMPLE_STEP_M;

    function sampleHomeTerrain() {
      if (!TS || typeof TS.sampleElevationBatch !== "function") {
        return Promise.resolve(null);
      }
      return TS.sampleElevationBatch([homePoint]).then(function (points) {
        const first = points && points[0];
        return first && first.elevation != null && Number.isFinite(first.elevation)
          ? Number(first.elevation)
          : null;
      }).catch(function () {
        return null;
      });
    }

    function resolveSegmentProfile(segment) {
      if (segment && Array.isArray(segment.profile) && segment.profile.length >= 2) {
        return segment.profile;
      }
      if (segment && segment.blockId && terrainProfileLookup.has(String(segment.blockId))) {
        return terrainProfileLookup.get(String(segment.blockId));
      }
      return null;
    }

    return sampleHomeTerrain().then(function (homeTerrainRaw) {
      const homeTerrain = resolvePreviewHomeTerrain(homeTerrainRaw, home);
      return Promise.all(
        rawSegments.map(function (segment) {
          const densePoints = buildPreviewResampledPoints(segment.from, segment.to, step);
          const segmentProfile = resolveSegmentProfile(segment);
          const shouldSampleTerrain =
            TS && typeof TS.sampleElevationBatch === "function";
          const terrainPromise = shouldSampleTerrain
            ? TS.sampleElevationBatch(
                densePoints.map(function (p) {
                  return { lat: p.lat, lng: p.lng };
                })
              ).catch(function () {
                return [];
              })
            : Promise.resolve([]);

          return terrainPromise.then(function (terrainSamples) {
            const samples = densePoints.map(function (point, index) {
              let terrain = terrainSamples[index] || {};
              if (
                (!terrain ||
                  terrain.elevation == null ||
                  !Number.isFinite(Number(terrain.elevation))) &&
                segmentProfile
              ) {
                terrain =
                  sampleTerrainFromProfile(segmentProfile, point) || terrain;
              }
              const terrainZ =
                terrain && terrain.elevation != null && Number.isFinite(Number(terrain.elevation))
                  ? Number(terrain.elevation)
                  : homeTerrain != null
                    ? homeTerrain
                    : 0;
              const available =
                !!terrain &&
                terrain.elevation != null &&
                Number.isFinite(Number(terrain.elevation)) &&
                terrain.available !== false;
              const local = projectLngLatToMeters(point, origin);
              let bearingRad = 0;
              if (index < densePoints.length - 1) {
                const nextLocal = projectLngLatToMeters(densePoints[index + 1], origin);
                bearingRad = Math.atan2(nextLocal.x - local.x, nextLocal.y - local.y);
              } else if (index > 0) {
                const prevLocal = projectLngLatToMeters(densePoints[index - 1], origin);
                bearingRad = Math.atan2(local.x - prevLocal.x, local.y - prevLocal.y);
              }
              return {
                lat: point.lat,
                lng: point.lng,
                x: local.x,
                z: local.y,
                terrainZ: terrainZ,
                flightZ: 0,
                agl: 0,
                available: available,
                bearingRad: bearingRad
              };
            });
            if (samples.length) {
              const startTerrainZ = samples[0].terrainZ;
              const endTerrainZ = samples[samples.length - 1].terrainZ;
              samples.forEach(function (sample, index) {
                const ratio = samples.length <= 1 ? 0 : index / (samples.length - 1);
                sample.flightZ = computePreviewSampleFlightZ({
                  sample: sample,
                  ratio: ratio,
                  segment: segment,
                  segmentProfile: segmentProfile,
                  settings: settings,
                  homeTerrain: homeTerrain,
                  MM: MM,
                  startTerrainZ: startTerrainZ,
                  endTerrainZ: endTerrainZ
                });
                sample.agl = Math.max(0, sample.flightZ - sample.terrainZ);
              });
            }
            const withLoiterArc = appendLoiterArcToSamples(samples, segment, origin);
            return Object.assign({}, segment, {
              samples: withLoiterArc,
              terrainAvailable: withLoiterArc.some(function (sample) {
                return sample.available;
              })
            });
          });
        })
      ).then(function (segments) {
        const missionWaypointCount = countPreviewMissionWaypoints(opts, mode);
        const summary = buildPreviewSummary({
          segments: segments,
          missionWaypointCount: missionWaypointCount
        });
        let previewNotice = segments.some(function (segment) {
          return !segment.terrainAvailable;
        })
          ? "部分地形高程缺失，已降级显示航线/参考地表。"
          : "";
        const aglSpread =
          summary.workAglMin != null && summary.workAglMax != null
            ? summary.workAglMax - summary.workAglMin
            : summary.aglMin != null && summary.aglMax != null
              ? summary.aglMax - summary.aglMin
              : 0;
        const terrainSpread =
          summary.terrainMin != null && summary.terrainMax != null
            ? summary.terrainMax - summary.terrainMin
            : 0;
        if (
          settings.useTerrainFollowing &&
          summary.workAglMin != null &&
          aglSpread > Math.max(80, terrainSpread * 0.35) &&
          !missionUsesTerrainFollowFrame(opts.missionWaypoints, MM)
        ) {
          previewNotice =
            (previewNotice ? previewNotice + " " : "") +
            "测绘航点未使用地形高度帧（frame 10），预览按相对高度显示；重新提交地形测绘任务后可修正。";
        }
        return {
          ok: true,
          error: previewNotice,
          data: {
            mode: mode,
            platform: opts.platform || settings.platform || null,
            origin: { lat: origin.lat, lng: origin.lng },
            segments: segments,
            routePoints: buildPreviewRoutePoints(segments),
            summary: summary,
            missionWaypointCount: missionWaypointCount
          }
        };
      });
    });
  }

  function loadInitialFlightPlanDraft() {
    if (!window.FlightPlanDraft || typeof window.FlightPlanDraft.load !== "function") {
      return null;
    }
    const draft = window.FlightPlanDraft.load();
    if (!draft) {
      return null;
    }
    return {
      activeTab: draft.activeTab || "waypoint",
      settings: draft.settings ? normalizeMissionSettings(draft.settings) : null,
      missionWaypoints: Array.isArray(draft.missionWaypoints) ? draft.missionWaypoints : [],
      platformOverride: typeof draft.platformOverride === "string" ? draft.platformOverride : "",
      surveyArea: Array.isArray(draft.surveyArea) ? draft.surveyArea : [],
      surveyCommitted: Boolean(draft.surveyCommitted),
      appendRtl: Boolean(draft.appendRtl),
      surveyAltitudeCustomized: Boolean(draft.surveyAltitudeCustomized),
      turnAroundCustomized: Boolean(draft.turnAroundCustomized),
      surveyBlocks: Array.isArray(draft.surveyBlocks) ? draft.surveyBlocks : []
    };
  }

  function FlightPlanEditor() {
    const ReactApi = window.React;
    const useCallback = ReactApi.useCallback;
    const useEffect = ReactApi.useEffect;
    const useMemo = ReactApi.useMemo;
    const useRef = ReactApi.useRef;
    const useState = ReactApi.useState;

    const initialDraft = useMemo(loadInitialFlightPlanDraft, []);

    const mapContainerRef = useRef(null);
    const mapRef = useRef(null);
    const layersRef = useRef(null);
    const activeTabRef = useRef("waypoint");
    const settingsRef = useRef(normalizeMissionSettings());
    const surveyAltitudeCustomizedRef = useRef(
      initialDraft ? initialDraft.surveyAltitudeCustomized : false
    );
    const turnAroundCustomizedRef = useRef(
      initialDraft ? initialDraft.turnAroundCustomized : false
    );
    const missionBootstrappedRef = useRef(
      Boolean(
        initialDraft &&
          (initialDraft.missionWaypoints.length ||
            initialDraft.surveyArea.length ||
            initialDraft.surveyCommitted)
      )
    );
    const waypointCountRef = useRef(0);
    const surveyAreaCountRef = useRef(0);
    const latestWaypointsRef = useRef([]);
    const latestSurveyAreaRef = useRef([]);
    const latestSurveyPathRef = useRef([]);
    const latestSurveyBlocksRef = useRef(
      initialDraft && initialDraft.surveyBlocks ? initialDraft.surveyBlocks : []
    );
    const surveyCommittedRef = useRef(initialDraft ? initialDraft.surveyCommitted : false);
    const mapSyncRafRef = useRef(0);
    const mapSyncScopeRef = useRef("all");
    const syncTakeoffToVehicleRef = useRef(null);
    const latestPlatformRef = useRef("multirotor");
    const latestSettingsRef = useRef(normalizeMissionSettings());
    const latestTerrainPlanBlocksRef = useRef([]);
    const latestTerrainPartitionBlocksRef = useRef([]);
    const latestPartitionSelectionRef = useRef([]);
    const onPartitionVertexMovedRef = useRef(null);
    const onPartitionBlockClickRef = useRef(null);
    const partitionRecalcPendingRef = useRef({});
    const partitionRecalcTimerRef = useRef(null);
    const latestTerrainContourGeoRef = useRef([]);
    const latestShowTerrainContoursRef = useRef(false);
    const terrainContourEnsureAttemptRef = useRef(false);
    const terrainContourRequestIdRef = useRef(0);
    const terrainContourAbortRef = useRef(null);
    const terrainStatsAbortRef = useRef(null);
    const demHeadingLastResolveKeyRef = useRef("");
    const demHeadingLastBearingRef = useRef(null);
    const demHeadingRequestIdRef = useRef(0);
    const fileInputRef = useRef(null);
    const previewThreeCanvasRef = useRef(null);
    const previewThreeApiRef = useRef(null);
    const previewCesiumContainerRef = useRef(null);
    const previewCesiumViewerRef = useRef(null);
    const [activeTab, setActiveTab] = useState(
      initialDraft && initialDraft.activeTab ? initialDraft.activeTab : "waypoint"
    );
    const [settings, setSettings] = useState(
      initialDraft && initialDraft.settings
        ? initialDraft.settings
        : normalizeMissionSettings()
    );
    const [overlapEditKey, setOverlapEditKey] = useState(null);
    const [overlapEditText, setOverlapEditText] = useState("");
    const [missionWaypoints, setMissionWaypoints] = useState(
      initialDraft ? initialDraft.missionWaypoints : []
    );
    const [platformOverride, setPlatformOverride] = useState(
      initialDraft ? initialDraft.platformOverride : ""
    );
    const [surveyArea, setSurveyArea] = useState(initialDraft ? initialDraft.surveyArea : []);
    const [surveyCommitted, setSurveyCommitted] = useState(
      initialDraft ? initialDraft.surveyCommitted : false
    );
    const [appendRtl, setAppendRtl] = useState(initialDraft ? initialDraft.appendRtl : false);
    const [surveyBlocks, setSurveyBlocks] = useState(
      initialDraft && initialDraft.surveyBlocks ? initialDraft.surveyBlocks : []
    );
    const [validationIssues, setValidationIssues] = useState([]);
    const [surveyToast, setSurveyToast] = useState("");
    const [terrainPlanning, setTerrainPlanning] = useState(false);
    const [terrainPlanBlocks, setTerrainPlanBlocks] = useState([]);
    const [terrainPlanIssues, setTerrainPlanIssues] = useState([]);
    const [terrainPlanStats, setTerrainPlanStats] = useState(null);
    const [terrainPartitionBlocks, setTerrainPartitionBlocks] = useState([]);
    const [terrainPartitionIssues, setTerrainPartitionIssues] = useState([]);
    const [partitionSelection, setPartitionSelection] = useState([]);
    const [terrainAdvisorText, setTerrainAdvisorText] = useState("");
    const [terrainHealth, setTerrainHealth] = useState(null);
    const [terrainHealthLoading, setTerrainHealthLoading] = useState(false);
    const [surveyAreaTerrainStats, setSurveyAreaTerrainStats] = useState(null);
    const [surveyAreaStatsLoading, setSurveyAreaStatsLoading] = useState(false);
    const [terrainPrefetchStatus, setTerrainPrefetchStatus] = useState(null);
    const [terrainPrefetchBusy, setTerrainPrefetchBusy] = useState(false);
    const [terrainPrefetchEstimate, setTerrainPrefetchEstimate] = useState(null);
    const [terrainPlanPhase, setTerrainPlanPhase] = useState("");
    const [terrainPlanProgressMessage, setTerrainPlanProgressMessage] = useState("");
    const [surveyWaypointGroundElev, setSurveyWaypointGroundElev] = useState({});
    const [terrainGridStatusRevision, setTerrainGridStatusRevision] = useState(0);
    const [showTerrainContours, setShowTerrainContours] = useState(false);
    const [terrainContourGeo, setTerrainContourGeo] = useState([]);
    const [terrainContourLoading, setTerrainContourLoading] = useState(false);
    const [terrainContourError, setTerrainContourError] = useState("");
    const [terrainContourViewportRevision, setTerrainContourViewportRevision] = useState(0);
    const [connected, setConnected] = useState(
      window._gcsConnState === "connected"
    );
    const [missionIoBusy, setMissionIoBusy] = useState(false);
    const [missionIoNote, setMissionIoNote] = useState("");
    const [missionIoProgress, setMissionIoProgress] = useState(null);
    const [fcParamRevision, setFcParamRevision] = useState(0);
    const [preview3dOpen, setPreview3dOpen] = useState(false);
    const [preview3dLoading, setPreview3dLoading] = useState(false);
    const [preview3dError, setPreview3dError] = useState("");
    const [preview3dNotice, setPreview3dNotice] = useState("");
    const [preview3dData, setPreview3dData] = useState(null);
    const [preview3dMode, setPreview3dMode] = useState("mission");
    const [preview3dView, setPreview3dView] = useState("iso");
    const [preview3dCesiumHealthy, setPreview3dCesiumHealthy] = useState(true);
    const [preview3dShowTerrain, setPreview3dShowTerrain] = useState(true);
    const [preview3dShowConnectors, setPreview3dShowConnectors] = useState(true);
    const [preview3dShowVerticals, setPreview3dShowVerticals] = useState(true);
    const [profilePreview, setProfilePreview] = useState(null);
    const [profileViewBox, setProfileViewBox] = useState(null);
    const [profileProbeT, setProfileProbeT] = useState(0.5);
    const profilePointerRef = useRef({ active: false, mode: "pan", x: 0, y: 0 });
    const profileStageRef = useRef(null);
    const cesiumPreviewEnabled =
      !!(window.Cesium && window.FlightPlanPreviewCesium) && preview3dCesiumHealthy;
    const [demPreviewHeadingDeg, setDemPreviewHeadingDeg] = useState(null);
    const [demPreviewHeadingStatus, setDemPreviewHeadingStatus] = useState("idle");
    const [demPreviewHeadingSource, setDemPreviewHeadingSource] = useState("");
    const partitionContourHeadingDeg = useMemo(
      function () {
        if (!settings.useTerrainFollowing || !terrainPartitionBlocks.length) {
          return null;
        }
        for (let i = 0; i < terrainPartitionBlocks.length; i++) {
          const block = terrainPartitionBlocks[i];
          if (
            block &&
            block.contourHeadingDeg != null &&
            Number.isFinite(Number(block.contourHeadingDeg))
          ) {
            return Number(block.contourHeadingDeg);
          }
        }
        return null;
      },
      [terrainPartitionBlocks, settings.useTerrainFollowing]
    );
    const resolvedSurveyHeadingDeg = useMemo(
      function () {
        if (surveyArea.length < 3) {
          return null;
        }
        if (!settings.surveyHeadingAuto) {
          return settings.surveyHeadingDeg;
        }
        const pathOpts = buildSurveyPathOptionsFromSettings(settings);
        const geometryHeading =
          window.SurveyPlanner && window.SurveyPlanner.pickBestSurveyHeadingDegrees
            ? window.SurveyPlanner.pickBestSurveyHeadingDegrees(
                surveyArea,
                settings.sideOverlap,
                pathOpts
              )
            : null;
        if (settings.useTerrainFollowing) {
          if (
            partitionContourHeadingDeg != null &&
            Number.isFinite(Number(partitionContourHeadingDeg))
          ) {
            return Number(partitionContourHeadingDeg);
          }
          if (
            demPreviewHeadingDeg != null &&
            Number.isFinite(Number(demPreviewHeadingDeg)) &&
            (demPreviewHeadingStatus === "ready" || demPreviewHeadingStatus === "loading")
          ) {
            return Number(demPreviewHeadingDeg);
          }
          if (demPreviewHeadingStatus === "unavailable") {
            return geometryHeading;
          }
          return null;
        }
        return geometryHeading;
      },
      [
        surveyArea,
        settings.surveyHeadingAuto,
        settings.surveyHeadingDeg,
        settings.useTerrainFollowing,
        demPreviewHeadingDeg,
        demPreviewHeadingStatus,
        partitionContourHeadingDeg,
        settings.sideOverlap,
        settings.footprintWidthMeters,
        settings.turnAroundMeters,
        settings.surveyEntryCorner
      ]
    );

    const autoSurveyHeadingHint = useMemo(
      function () {
        if (!settings.surveyHeadingAuto) {
          return "手动";
        }
        if (!settings.useTerrainFollowing) {
          return "自动";
        }
        if (
          partitionContourHeadingDeg != null &&
          Number.isFinite(Number(partitionContourHeadingDeg))
        ) {
          return "自动 · 约 " + Math.round(Number(partitionContourHeadingDeg)) + "°";
        }
        if (
          demPreviewHeadingDeg != null &&
          Number.isFinite(Number(demPreviewHeadingDeg)) &&
          (demPreviewHeadingStatus === "ready" || demPreviewHeadingStatus === "loading")
        ) {
          if (demPreviewHeadingStatus === "loading") {
            return "自动 · 约 " + Math.round(Number(demPreviewHeadingDeg)) + "° · 更新中…";
          }
          return "自动 · 约 " + Math.round(Number(demPreviewHeadingDeg)) + "°";
        }
        if (demPreviewHeadingStatus === "loading") {
          return "自动 · 估计 DEM 航向…";
        }
        if (demPreviewHeadingStatus === "unavailable") {
          return "自动 · DEM 不可用，几何回退";
        }
        return "自动";
      },
      [
        settings.surveyHeadingAuto,
        settings.useTerrainFollowing,
        partitionContourHeadingDeg,
        demPreviewHeadingDeg,
        demPreviewHeadingStatus
      ]
    );

    const surveyPath = useMemo(function () {
      if (surveyArea.length < 3) {
        return [];
      }

      const pathOpts = buildSurveyPathOptionsFromSettings(settings);
      if (!settings.surveyHeadingAuto && settings.surveyHeadingDeg != null) {
        pathOpts.headingDegrees = settings.surveyHeadingDeg;
      } else if (resolvedSurveyHeadingDeg != null) {
        pathOpts.headingDegrees = resolvedSurveyHeadingDeg;
      }

      const gen =
        window.SurveyPlanner && window.SurveyPlanner.generateSurveyPath
          ? window.SurveyPlanner.generateSurveyPath
          : generateSurveyPath;
      return gen(surveyArea, settings.sideOverlap, pathOpts).map(function (point) {
        return {
          lng: point.lng,
          lat: point.lat,
          row: point.row,
          segment: point.segment,
          role: point.role
        };
      });
    }, [
      surveyArea,
      resolvedSurveyHeadingDeg,
      settings.sideOverlap,
      settings.footprintWidthMeters,
      settings.turnAroundMeters,
      settings.surveyEntryCorner,
      settings.surveyHeadingAuto,
      settings.surveyHeadingDeg
    ]);

    const surveyPreviewPoints = useMemo(
      function () {
        if (surveyCommitted) {
          return [];
        }
        const activePreviewPath =
          settings.useTerrainFollowing && terrainPlanBlocks.length
            ? terrainPlanBlocks.reduce(function (all, block) {
                return all.concat(Array.isArray(block.previewPath) ? block.previewPath : []);
              }, [])
            : surveyPath;
        if (activePreviewPath.length < 1) {
          return [];
        }
        return extractSurveyRouteWaypoints(activePreviewPath).map(function (point, index) {
          return {
            seq: missionWaypoints.length + index + 1,
            lat: point.lat,
            lng: point.lng,
            alt: settings.surveyAltitude
          };
        });
      },
      [
        surveyPath,
        terrainPlanBlocks,
        settings.useTerrainFollowing,
        settings.surveyAltitude,
        surveyCommitted,
        missionWaypoints.length
      ]
    );

    const canPreviewMission3d = useMemo(function () {
      return (missionWaypoints || []).some(function (wp) {
        return wp && wp.source !== "camera";
      });
    }, [missionWaypoints]);

    const canPreviewPlanning3d = useMemo(function () {
      return (
        (terrainPlanBlocks && terrainPlanBlocks.length > 0) ||
        (surveyPath && surveyPath.length > 1)
      );
    }, [terrainPlanBlocks, surveyPath]);

    const preferPlanning3d = useMemo(function () {
      if (terrainPlanBlocks && terrainPlanBlocks.length) {
        return true;
      }
      if (surveyPath && surveyPath.length > 1 && missionWaypoints.length <= 4) {
        return true;
      }
      return !surveyCommitted && surveyPath && surveyPath.length > 1;
    }, [terrainPlanBlocks, surveyCommitted, surveyPath, missionWaypoints.length]);

    const resolvedPlatform = useMemo(
      function () {
        const VT = window.VehicleTemplates;
        const detect = VT && VT.detectVehiclePlatform ? VT.detectVehiclePlatform() : "multirotor";
        const base = connected ? detect : platformOverride || detect;
        const VMI = window.VehicleMarkerIcons;
        if (connected && VMI && typeof VMI.detectVehicleMarkerKind === "function") {
          return VMI.detectVehicleMarkerKind({ requireConnected: false });
        }
        if (VMI && base === "multirotor" && typeof VMI.detectMultirotorFrameKind === "function") {
          return VMI.detectMultirotorFrameKind();
        }
        return base;
      },
      [platformOverride, connected, fcParamRevision]
    );

    useEffect(function () {
      latestPlatformRef.current = resolvedPlatform;
    }, [resolvedPlatform]);

    useEffect(function () {
      function onResize() {
        if (previewCesiumViewerRef.current && typeof previewCesiumViewerRef.current.resize === "function") {
          previewCesiumViewerRef.current.resize();
        }
        if (previewThreeApiRef.current && typeof previewThreeApiRef.current.resize === "function") {
          previewThreeApiRef.current.resize();
        }
        if (mapRef.current) {
          mapRef.current.invalidateSize();
        }
      }
      window.addEventListener("resize", onResize);
      return function () {
        window.removeEventListener("resize", onResize);
      };
    }, []);  // always listen so 2D map recovers on browser resize too

    useEffect(function () {
      if (!preview3dOpen || !preview3dData) {
        return;
      }
      const canUseCesium =
        !!(window.Cesium && window.FlightPlanPreviewCesium) && preview3dCesiumHealthy;
      if (!previewCesiumViewerRef.current && canUseCesium && previewCesiumContainerRef.current && window.FlightPlanPreviewCesium) {
        try {
          previewCesiumViewerRef.current = window.FlightPlanPreviewCesium.create(previewCesiumContainerRef.current);
        } catch (err) {
          console.error("3D Cesium preview init failed, falling back to Three.js", err);
          previewCesiumViewerRef.current = null;
          setPreview3dCesiumHealthy(false);
          setPreview3dNotice("Cesium 预览初始化失败，已切换到本地 3D 预览。");
        }
      }
      if (previewCesiumViewerRef.current) {
        try {
          previewCesiumViewerRef.current.update(preview3dData, {
            showTerrain: preview3dShowTerrain,
            showConnectors: preview3dShowConnectors,
            showVerticals: preview3dShowVerticals,
            view: preview3dView
          });
          return;
        } catch (err) {
          console.error("3D Cesium preview update failed, falling back to Three.js", err);
          if (typeof previewCesiumViewerRef.current.dispose === "function") {
            previewCesiumViewerRef.current.dispose();
          }
          previewCesiumViewerRef.current = null;
          setPreview3dCesiumHealthy(false);
          setPreview3dNotice("Cesium 预览不可用，已切换到本地 3D 预览。");
        }
      }
      if (!previewThreeCanvasRef.current) {
        return;
      }
      if (!previewThreeApiRef.current && window.FlightPlanPreviewThree) {
        previewThreeApiRef.current = window.FlightPlanPreviewThree.create(previewThreeCanvasRef.current);
      }
      if (!previewThreeApiRef.current) {
        return;
      }
      previewThreeApiRef.current.update(preview3dData, {
        showTerrain: preview3dShowTerrain,
        showConnectors: preview3dShowConnectors,
        showVerticals: preview3dShowVerticals,
        showFixedWingCurve: resolvedPlatform === "plane" || resolvedPlatform === "vtol",
        view: preview3dView
      });
    }, [
      preview3dOpen,
      preview3dData,
      preview3dCesiumHealthy,
      preview3dShowTerrain,
      preview3dShowConnectors,
      preview3dShowVerticals,
      preview3dView,
      resolvedPlatform
    ]);

    // When 3D preview closes, force the 2D Leaflet map to re-measure its container.
    // This fixes cases where the map goes black/blank after using the 3D modal.
    useEffect(function () {
      if (preview3dOpen) {
        return;
      }
      const t = window.setTimeout(function () {
        if (mapRef.current) {
          mapRef.current.invalidateSize();
          if (layersRef.current) {
            // also re-sync layers in case something was cleared
            syncLeafletMissionLayers(
              layersRef.current,
              latestWaypointsRef.current,
              latestSurveyAreaRef.current,
              latestSurveyPathRef.current,
              function (index, lng, lat) {
                if (onWaypointMovedRef.current) {
                  onWaypointMovedRef.current(index, lng, lat);
                }
              },
              function (index, lng, lat) {
                if (onSurveyVertexMovedRef.current) {
                  onSurveyVertexMovedRef.current(index, lng, lat);
                }
              },
              function (index) {
                if (onSurveyVertexDeletedRef.current) {
                  onSurveyVertexDeletedRef.current(index);
                }
              },
              function (afterIndex, lng, lat) {
                if (onSurveyVertexInsertedRef.current) {
                  onSurveyVertexInsertedRef.current(afterIndex, lng, lat);
                }
              },
              { surveyPathPreview: !surveyCommittedRef.current, previewSettings: latestSettingsRef.current },
              latestSurveyBlocksRef.current,
              "all",
              {
                platform: latestPlatformRef.current,
                settings: latestSettingsRef.current,
                planningBlocks: latestTerrainPlanBlocksRef.current,
                partition: getPartitionOverlay(),
                showTerrainContours: latestShowTerrainContoursRef.current,
                terrainContourGeo: latestTerrainContourGeoRef.current,
                terrainProfiles: collectTerrainProfilesForMap(
                  latestTerrainPlanBlocksRef.current,
                  latestSurveyBlocksRef.current
                )
              }
            );
          }
        }
      }, 60);
      return function () {
        window.clearTimeout(t);
      };
    }, [preview3dOpen]);

    useEffect(function () {
      return function () {
        if (previewThreeApiRef.current && typeof previewThreeApiRef.current.dispose === "function") {
          previewThreeApiRef.current.dispose();
          previewThreeApiRef.current = null;
        }
      };
    }, []);

    useEffect(function () {
      if (turnAroundCustomizedRef.current) {
        return;
      }
      const next = getDefaultTurnAroundMeters(resolvedPlatform);
      setSettings(function (prev) {
        if (prev.turnAroundMeters === next) {
          return prev;
        }
        return Object.assign({}, prev, {
          turnAroundMeters: formatMissionSettingValue("turnAroundMeters", next)
        });
      });
    }, [resolvedPlatform]);

    useEffect(function () {
      if (!layersRef.current) {
        return;
      }
      syncFlightPlanMapOverlays(layersRef.current, resolvedPlatform);
    }, [connected, resolvedPlatform]);

    useEffect(function () {
      function onAirframeParams() {
        if (!connected) {
          return;
        }
        setFcParamRevision(function (n) {
          return n + 1;
        });
      }
      document.addEventListener("gcs-airframe-params-changed", onAirframeParams);
      return function () {
        document.removeEventListener("gcs-airframe-params-changed", onAirframeParams);
      };
    }, [connected]);

    useEffect(
      function () {
        if (!settings.useTerrainFollowing) {
          setTerrainHealth(null);
          setTerrainHealthLoading(false);
          return;
        }
        let cancelled = false;
        let timer = null;
        let unsubscribe = null;
        function bindHealth() {
          const TS = window.TerrainService;
          if (!TS || typeof TS.subscribeHealth !== "function") {
            timer = window.setTimeout(bindHealth, 1000);
            return;
          }
          unsubscribe = TS.subscribeHealth(function (snapshot) {
            if (cancelled) {
              return;
            }
            setTerrainHealth(snapshot || null);
            setTerrainHealthLoading(
              !!snapshot &&
                (snapshot.status === "checking" || snapshot.status === "idle") &&
                !snapshot.lastOkAt
            );
          });
          if (typeof TS.ensureHealthPolling === "function") {
            TS.ensureHealthPolling();
          } else if (typeof TS.probeHealth === "function") {
            TS.probeHealth(true);
          }
        }
        setTerrainHealthLoading(true);
        bindHealth();
        return function () {
          cancelled = true;
          if (timer) {
            window.clearTimeout(timer);
          }
          if (typeof unsubscribe === "function") {
            unsubscribe();
          }
        };
      },
      [settings.useTerrainFollowing]
    );

    const terrainSurveyPolygon = useMemo(
      function () {
        return resolveTerrainSurveyPolygon(surveyArea, surveyBlocks);
      },
      [surveyArea, surveyBlocks]
    );

    const terrainSurveyFromCommitted = useMemo(
      function () {
        return surveyArea.length < 3 && terrainSurveyPolygon.length >= 3;
      },
      [surveyArea.length, terrainSurveyPolygon.length]
    );

    const contourTargetPolygon = useMemo(
      function () {
        return buildViewportPolygonFromMap(mapRef.current);
      },
      [terrainContourViewportRevision]
    );

    const contourTargetKey = useMemo(
      function () {
        if (!contourTargetPolygon.length) {
          return "";
        }
        return contourTargetPolygon
          .map(function (point) {
            return round(point.lng, 5).toFixed(5) + "," + round(point.lat, 5).toFixed(5);
          })
          .join("|");
      },
      [contourTargetPolygon]
    );

    const contourTargetAvailable = useMemo(
      function () {
        return contourTargetPolygon.length >= 3;
      },
      [contourTargetPolygon]
    );

    const terrainServiceStatus =
      terrainHealth && terrainHealth.status ? String(terrainHealth.status) : "idle";

    useEffect(
      function () {
        if (!settings.useTerrainFollowing || terrainSurveyPolygon.length < 3) {
          if (terrainStatsAbortRef.current) {
            try {
              terrainStatsAbortRef.current.abort();
            } catch (_) {
              /* ignore */
            }
            terrainStatsAbortRef.current = null;
          }
          setSurveyAreaTerrainStats(null);
          setSurveyAreaStatsLoading(false);
          return;
        }
        const TS = window.TerrainService;
        if (!TS || typeof TS.getTerrainStats !== "function") {
          setSurveyAreaStatsLoading(terrainServiceStatus === "checking" || terrainServiceStatus === "idle");
          return;
        }
        if (terrainStatsAbortRef.current) {
          try {
            terrainStatsAbortRef.current.abort();
          } catch (_) {
            /* ignore */
          }
        }
        const controller =
          typeof AbortController === "function" ? new AbortController() : null;
        terrainStatsAbortRef.current = controller;
        setSurveyAreaStatsLoading(true);
        TS.getTerrainStats(terrainSurveyPolygon, {
          signal: controller ? controller.signal : null
        })
          .then(function (stats) {
            if (terrainStatsAbortRef.current !== controller) {
              return;
            }
            setSurveyAreaTerrainStats(stats || null);
            setSurveyAreaStatsLoading(false);
          })
          .catch(function (err) {
            if (terrainStatsAbortRef.current !== controller) {
              return;
            }
            if (err && err.message === "请求已取消") {
              return;
            }
            setSurveyAreaTerrainStats(null);
            setSurveyAreaStatsLoading(false);
          });
        return function () {
          if (terrainStatsAbortRef.current === controller) {
            terrainStatsAbortRef.current = null;
          }
          if (controller) {
            try {
              controller.abort();
            } catch (_) {
              /* ignore */
            }
          }
        };
      },
      [settings.useTerrainFollowing, terrainSurveyPolygon, terrainServiceStatus]
    );

    const terrainStatsRelief =
      surveyAreaTerrainStats != null && Number.isFinite(Number(surveyAreaTerrainStats.relief))
        ? Number(surveyAreaTerrainStats.relief)
        : null;

    const demHeadingResolveKey = useMemo(
      function () {
        if (terrainSurveyPolygon.length < 3) {
          return "";
        }
        return (
          terrainSurveyPolygon
            .map(function (point) {
              return round(point.lng, 6).toFixed(6) + "," + round(point.lat, 6).toFixed(6);
            })
            .join("|") +
          "|" +
          String(settings.sideOverlap) +
          "|" +
          String(settings.turnAroundMeters) +
          "|" +
          String(settings.surveyEntryCorner) +
          "|" +
          String(settings.footprintWidthMeters)
        );
      },
      [
        terrainSurveyPolygon,
        settings.sideOverlap,
        settings.turnAroundMeters,
        settings.surveyEntryCorner,
        settings.footprintWidthMeters
      ]
    );

    useEffect(
      function () {
        if (
          !settings.useTerrainFollowing ||
          !settings.surveyHeadingAuto ||
          !demHeadingResolveKey
        ) {
          demHeadingLastResolveKeyRef.current = "";
          demHeadingLastBearingRef.current = null;
          setDemPreviewHeadingDeg(null);
          setDemPreviewHeadingStatus("idle");
          setDemPreviewHeadingSource("");
          return;
        }
        if (demHeadingLastResolveKeyRef.current !== demHeadingResolveKey) {
          demHeadingLastBearingRef.current = null;
        }
        if (
          demHeadingLastResolveKeyRef.current === demHeadingResolveKey &&
          demHeadingLastBearingRef.current != null &&
          Number.isFinite(Number(demHeadingLastBearingRef.current))
        ) {
          return;
        }
        const TSP = window.TerrainSurveyPlanner;
        const TS = window.TerrainService;
        if (!TSP || typeof TSP.resolvePartitionCutBearing !== "function" || !TS) {
          demHeadingLastResolveKeyRef.current = "";
          demHeadingLastBearingRef.current = null;
          setDemPreviewHeadingDeg(null);
          setDemPreviewHeadingStatus("unavailable");
          setDemPreviewHeadingSource("none");
          return;
        }
        let cancelled = false;
        const requestId = demHeadingRequestIdRef.current + 1;
        demHeadingRequestIdRef.current = requestId;
        const hadCachedBearing =
          demHeadingLastResolveKeyRef.current === demHeadingResolveKey &&
          demHeadingLastBearingRef.current != null;
        if (!hadCachedBearing && demHeadingLastBearingRef.current == null) {
          setDemPreviewHeadingStatus("loading");
        }
        const debounceTimer = window.setTimeout(function () {
          TSP.resolvePartitionCutBearing(TS, terrainSurveyPolygon, settings)
            .then(function (resolved) {
              if (cancelled || requestId !== demHeadingRequestIdRef.current) {
                return;
              }
              const bearing =
                resolved && Number.isFinite(Number(resolved.bearing))
                  ? Number(resolved.bearing)
                  : null;
              if (bearing != null) {
                demHeadingLastResolveKeyRef.current = demHeadingResolveKey;
                demHeadingLastBearingRef.current = bearing;
                setDemPreviewHeadingDeg(bearing);
                setDemPreviewHeadingStatus("ready");
                setDemPreviewHeadingSource((resolved && resolved.source) || "terrain_grid");
              } else {
                demHeadingLastResolveKeyRef.current = demHeadingResolveKey;
                demHeadingLastBearingRef.current = null;
                setDemPreviewHeadingDeg(null);
                setDemPreviewHeadingStatus("unavailable");
                setDemPreviewHeadingSource((resolved && resolved.source) || "none");
              }
            })
            .catch(function () {
              if (cancelled || requestId !== demHeadingRequestIdRef.current) {
                return;
              }
              demHeadingLastResolveKeyRef.current = demHeadingResolveKey;
              demHeadingLastBearingRef.current = null;
              setDemPreviewHeadingDeg(null);
              setDemPreviewHeadingStatus("unavailable");
              setDemPreviewHeadingSource("error");
            });
        }, 300);
        return function () {
          cancelled = true;
          window.clearTimeout(debounceTimer);
        };
      },
      [
        demHeadingResolveKey,
        settings.useTerrainFollowing,
        settings.surveyHeadingAuto,
        terrainServiceStatus,
        terrainStatsRelief
      ]
    );

    useEffect(
      function () {
        if (!settings.useTerrainFollowing) {
          setTerrainPrefetchStatus(null);
          return;
        }
        const TS = window.TerrainService;
        if (!TS || typeof TS.terrainPrefetchStatus !== "function") {
          return;
        }
        let cancelled = false;
        function poll() {
          TS.terrainPrefetchStatus()
            .then(function (status) {
              if (!cancelled) {
                setTerrainPrefetchStatus(status || null);
              }
            })
            .catch(function () {
              if (!cancelled) {
                setTerrainPrefetchStatus(null);
              }
            });
        }
        poll();
        const timer = window.setInterval(poll, 3000);
        return function () {
          cancelled = true;
          window.clearInterval(timer);
        };
      },
      [settings.useTerrainFollowing]
    );

    const terrainValidationIssues = useMemo(
      function () {
        return validationIssues
          .filter(isTerrainValidationIssue)
          .filter(shouldDisplayTerrainIssue);
      },
      [validationIssues]
    );

    const visibleMissionValidationIssues = useMemo(
      function () {
        return (validationIssues || []).filter(function (issue) {
          if (isTerrainValidationIssue(issue)) {
            return shouldDisplayTerrainIssue(issue);
          }
          return true;
        });
      },
      [validationIssues]
    );

    const terrainFcEnableStatus = useMemo(
      function () {
        return getTerrainFcEnableStatus(connected);
      },
      [connected, fcParamRevision]
    );

    const terrainFcParamIssues = useMemo(
      function () {
        if (!connected) {
          return [];
        }
        const TM = window.TerrainMavlink;
        if (!TM || typeof TM.checkTerrainParamsBeforeUpload !== "function") {
          return [];
        }
        const result = TM.checkTerrainParamsBeforeUpload(resolvedPlatform);
        return (result && result.issues) || [];
      },
      [connected, fcParamRevision, resolvedPlatform]
    );

    const onWaypointMovedRef = useRef(null);
    const onSurveyVertexMovedRef = useRef(null);
    const onSurveyVertexDeletedRef = useRef(null);
    const onSurveyVertexInsertedRef = useRef(null);

    const vehicleHomeTerrainCacheRef = useRef({
      lat: null,
      lng: null,
      elev: null,
      pending: false,
      lastSampleMs: 0
    });

    const refreshVehicleHomeTerrainCache = useCallback(function () {
      const MM = window.MissionModel;
      if (!MM || !MM.hasFlightPlanVehiclePosition || !MM.hasFlightPlanVehiclePosition()) {
        return Promise.resolve(null);
      }
      const lat = Number(window.lat);
      const lng = Number(window.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return Promise.resolve(null);
      }
      const cache = vehicleHomeTerrainCacheRef.current;
      const now = Date.now();
      if (
        cache.lat === lat &&
        cache.lng === lng &&
        cache.elev != null &&
        now - cache.lastSampleMs < 30000
      ) {
        window._gcsVehicleHomeTerrainMsl = cache.elev;
        return Promise.resolve(cache.elev);
      }
      if (cache.pending || now - cache.lastSampleMs < 2000) {
        return Promise.resolve(cache.elev);
      }
      const TS = window.TerrainService;
      if (!TS || typeof TS.sampleElevationBatch !== "function") {
        return Promise.resolve(null);
      }
      cache.pending = true;
      return TS.sampleElevationBatch([{ lat: lat, lng: lng }])
        .then(function (points) {
          cache.pending = false;
          cache.lastSampleMs = Date.now();
          const first = points && points[0];
          const elev =
            first && first.elevation != null && Number.isFinite(Number(first.elevation))
              ? Number(first.elevation)
              : null;
          if (elev != null) {
            cache.lat = lat;
            cache.lng = lng;
            cache.elev = elev;
            window._gcsVehicleHomeTerrainMsl = elev;
          }
          return elev;
        })
        .catch(function () {
          cache.pending = false;
          cache.lastSampleMs = Date.now();
          return null;
        });
    }, []);

    const applyTakeoffVehicleSync = useCallback(function () {
      const VT = window.VehicleTemplates;
      if (!VT || window._gcsConnState !== "connected") {
        return;
      }
      refreshVehicleHomeTerrainCache().finally(function () {
        setMissionWaypoints(function (prev) {
          if (!prev.length) {
            return prev;
          }
          const sync =
            VT.syncMissionHomeAnchorsFromVehicle || VT.syncTakeoffFromVehicle;
          return sync(prev, true);
        });
      });
    }, [refreshVehicleHomeTerrainCache]);

    useEffect(function () {
      syncTakeoffToVehicleRef.current = applyTakeoffVehicleSync;
    }, [applyTakeoffVehicleSync]);

    useEffect(function () {
      const timer = window.setInterval(function () {
        if (!isFlightPlanViewActive() || !layersRef.current) {
          return;
        }
        syncFlightPlanMapOverlays(layersRef.current, latestPlatformRef.current);
        if (window._gcsConnState === "connected" && syncTakeoffToVehicleRef.current) {
          syncTakeoffToVehicleRef.current();
        }
      }, 500);
      return function () {
        window.clearInterval(timer);
      };
    }, []);

    const invalidateSurveyTerrainPlan = useCallback(function () {
      setTerrainPlanBlocks([]);
      setTerrainPlanIssues([]);
      setTerrainPlanStats(null);
      setTerrainPartitionBlocks([]);
      setTerrainPartitionIssues([]);
      setPartitionSelection([]);
      setTerrainAdvisorText("");
      setSurveyAreaTerrainStats(null);
      setSurveyAreaStatsLoading(false);
    }, []);

    const handleWaypointMoved = useCallback(function (index, lng, lat) {
      setMissionWaypoints(function (previous) {
        if (index < 0 || index >= previous.length) {
          return previous;
        }
        const next = previous.slice();
        next[index] = Object.assign({}, next[index], { lng: lng, lat: lat });
        const MM = window.MissionModel;
        return MM ? MM.renumberWaypoints(next) : next;
      });
    }, []);

    const handleSurveyVertexMoved = useCallback(function (index, lng, lat) {
      setSurveyArea(function (previous) {
        if (index < 0 || index >= previous.length) {
          return previous;
        }
        const next = previous.slice();
        next[index] = { lng: lng, lat: lat };
        return next;
      });
      setSurveyCommitted(false);
      invalidateSurveyTerrainPlan();
    }, [invalidateSurveyTerrainPlan]);

    const handleSurveyVertexDeleted = useCallback(function (index) {
      setSurveyArea(function (previous) {
        if (index < 0 || index >= previous.length) {
          return previous;
        }
        const next = previous.slice();
        next.splice(index, 1);
        return next;
      });
      setSurveyCommitted(false);
      invalidateSurveyTerrainPlan();
    }, [invalidateSurveyTerrainPlan]);

    const handleSurveyVertexInserted = useCallback(function (afterIndex, lng, lat) {
      setSurveyArea(function (previous) {
        if (!Array.isArray(previous) || previous.length === 0) {
          return [{ lng: lng, lat: lat }];
        }
        const idx = Math.max(-1, Math.min(previous.length - 1, afterIndex));
        const next = previous.slice();
        next.splice(idx + 1, 0, { lng: lng, lat: lat });
        return next;
      });
      setSurveyCommitted(false);
      invalidateSurveyTerrainPlan();
    }, [invalidateSurveyTerrainPlan]);

    const bootstrapMissionForSurvey = useCallback(function () {
      const MM = window.MissionModel;
      const VT = window.VehicleTemplates;
      if (!MM || !VT) {
        return;
      }
      const origin = MM.getTakeoffLatLng();
      const list = VT.buildBootstrapWaypoints(
        resolvedPlatform,
        origin,
        MM.isVehicleConnected()
      );
      setMissionWaypoints(list);
      missionBootstrappedRef.current = true;
    }, [resolvedPlatform]);

    const handlePlatformChange = useCallback(
      function (val) {
        if (connected) {
          return;
        }
        setPlatformOverride(val);
        const MM = window.MissionModel;
        const VT = window.VehicleTemplates;
        const MC = window.MissionComposer;
        if (MM && VT) {
          const boot = VT.buildBootstrapWaypoints(val, MM.getTakeoffLatLng(), false);
          if (MC && surveyBlocks.length) {
            setMissionWaypoints(
              MC.rebuildMissionFromBlocks(boot, surveyBlocks, val, appendRtl)
            );
          } else {
            setMissionWaypoints(boot);
          }
          missionBootstrappedRef.current = true;
        }
      },
      [connected, surveyBlocks, appendRtl]
    );

    const runTerrainAutoPlan = useCallback(function (polygon, options) {
      const TSP = window.TerrainSurveyPlanner;
      if (!TSP || !polygon || polygon.length < 3) {
        return Promise.reject(new Error("请先绘制测区"));
      }
      const opts = options || {};
      setTerrainPlanning(true);
      setTerrainPlanPhase("prefetch");
      setTerrainPlanProgressMessage(opts.progressMessage || "准备地形数据…");
      if (!opts.keepAdvisorText) {
        setTerrainAdvisorText("");
      }
      const planSettings = Object.assign({}, settings, { useTerrainFollowing: true });
      return TSP.planAuto(polygon, planSettings, resolvedPlatform, {
        onProgress: function (progress) {
          if (!progress) {
            return;
          }
          if (progress.phase === "prefetch") {
            setTerrainPlanPhase("prefetch");
            if (progress.status) {
              setTerrainPrefetchStatus(progress.status);
            }
            setTerrainPlanProgressMessage("下载测区地形…");
          } else if (progress.phase === "stats") {
            setTerrainPlanPhase("stats");
            setTerrainPlanProgressMessage(progress.message || "读取测区高程…");
          } else if (progress.phase === "planning") {
            setTerrainPlanPhase("planning");
            setTerrainPlanProgressMessage(
              progress.message ||
                "规划块 " +
                  (progress.blockIndex || 0) +
                  "/" +
                  (progress.blockTotal || 0)
            );
          } else if (progress.phase === "done") {
            setTerrainPlanPhase("");
            setTerrainPlanProgressMessage("");
          }
        }
      })
        .finally(function () {
          setTerrainPlanning(false);
          setTerrainPlanPhase("");
          setTerrainPlanProgressMessage("");
        });
    }, [settings, resolvedPlatform]);

    const handleConfirmSurveyGenerate = useCallback(async function () {
      const MC = window.MissionComposer;
      if (!MC || surveyArea.length < 3) {
        return;
      }
      let plannedBlocks = terrainPlanBlocks;
      let plannedIssues = terrainPlanIssues;
      let plannedStats = terrainPlanStats;
      if (settings.useTerrainFollowing && !plannedBlocks.length) {
        try {
          const result = await runTerrainAutoPlan(surveyArea, {
            progressMessage: "确认前检查地形…",
            keepAdvisorText: true
          });
          plannedBlocks = result.blocks || [];
          plannedIssues = result.issues || [];
          plannedStats = result.stats || null;
          setTerrainPlanBlocks(plannedBlocks);
          setTerrainPlanIssues(plannedIssues);
          setTerrainPlanStats(plannedStats);
        } catch (err) {
          setSurveyToast((err && err.message) || "地形自动规划失败");
          setTerrainPlanBlocks([]);
          setTerrainPlanIssues([]);
          setTerrainPlanStats(null);
          return;
        }
      }
      if (settings.useTerrainFollowing && hasTerrainPlanBlockingErrors(plannedIssues)) {
        const isFwConfirm =
          resolvedPlatform === "plane" || resolvedPlatform === "vtol";
        const hardBlock =
          isFwConfirm &&
          (plannedIssues || []).some(function (issue) {
            return issue && issue.level === "error" && issue.code === "terrain_clearance";
          });
        if (hardBlock) {
          setSurveyToast(
            "固定翼存在触地风险（修正后离地高度仍低于安全裕度），已阻止生成"
          );
          return;
        }
        if (
          !window.confirm(
            "存在地形校核错误（如 DEM 缺失或爬升率超限），仍要确认生成？"
          )
        ) {
          return;
        }
      }
      if (plannedBlocks.length && settings.useTerrainFollowing) {
        let waypoints = missionWaypoints;
        let blocks = surveyBlocks.slice();
        let addedTotal = 0;
        plannedBlocks.forEach(function (previewBlock) {
          const block =
            typeof MC.createSurveyBlockFromPreview === "function"
              ? MC.createSurveyBlockFromPreview(
                  previewBlock,
                  previewBlock.paramsSnapshot || settings,
                  blocks.length,
                  surveyArea
                )
              : MC.createSurveyBlock(
                  previewBlock.polygon || surveyArea,
                  previewBlock.paramsSnapshot || settings,
                  blocks.length
                );
          if (!block.storedProfile) {
            block.storedProfile = previewBlock.previewProfile || null;
          }
          if (!block.storedIssues) {
            block.storedIssues = previewBlock.previewIssues || [];
          }
          block.terrainPlanned = true;
          const result = MC.appendBlockToMission(waypoints, block, resolvedPlatform, false);
          waypoints = result.waypoints;
          blocks = blocks.concat([result.block]);
          addedTotal += result.addedCount;
        });
        if (appendRtl) {
          const MM = window.MissionModel;
          if (MM && MM.appendRtlWaypoint) {
            waypoints = MM.appendRtlWaypoint(waypoints);
          }
        }
        setMissionWaypoints(waypoints);
        setSurveyBlocks(blocks);
        setSurveyToast(
          "已追加 " + plannedBlocks.length + " 块地形测绘区域，+" + addedTotal + " 个航点"
        );
        setTerrainPlanBlocks([]);
        setTerrainPlanIssues([]);
        setTerrainPlanStats(null);
        setSurveyArea([]);
        setSurveyCommitted(false);
        return;
      }
      if (!surveyPath.length) {
        return;
      }
      const block = MC.createSurveyBlock(surveyArea, settings, surveyBlocks.length);
      const result = MC.appendBlockToMission(
        missionWaypoints,
        block,
        resolvedPlatform,
        appendRtl
      );
      setMissionWaypoints(result.waypoints);
      setSurveyBlocks(function (prev) {
        return prev.concat([result.block]);
      });
      setSurveyToast(
        "已追加区域 " +
          (result.block.order + 1) +
          "：+" +
          result.addedCount +
          " 个测绘航点，共 " +
          result.waypoints.length +
          " 个任务航点"
      );
      setSurveyArea([]);
      setSurveyCommitted(false);
    }, [
      surveyArea,
      surveyPath,
      settings,
      surveyBlocks.length,
      appendRtl,
      resolvedPlatform,
      missionWaypoints,
      terrainPlanBlocks,
      terrainPlanIssues,
      terrainPlanStats,
      runTerrainAutoPlan
    ]);

    const handleAutoTerrainPlan = useCallback(function () {
      if (surveyArea.length < 3) {
        return;
      }
      runTerrainAutoPlan(surveyArea)
        .then(function (result) {
          setTerrainPlanBlocks(result.blocks || []);
          setTerrainPlanIssues(result.issues || []);
          setTerrainPlanStats(result.stats || null);
          const errCount = (result.issues || []).filter(function (i) {
            return i.level === "error";
          }).length;
          setSurveyToast(
            "自动规划完成：" +
              (result.blocks ? result.blocks.length : 0) +
              " 块区域" +
              ((result.issues || []).length
                ? "，" + result.issues.length + " 条校核提示" +
                  (errCount ? "（" + errCount + " 错误）" : "")
                : "")
          );
        })
        .catch(function (err) {
          setSurveyToast(err.message || "地形自动规划失败");
          setTerrainPlanBlocks([]);
          setTerrainPlanIssues([]);
          setTerrainPlanStats(null);
        });
    }, [surveyArea, runTerrainAutoPlan]);

    const recomputePartitionBlock = useCallback(
      function (block) {
        const TS = window.TerrainService;
        const TSP = window.TerrainSurveyPlanner;
        const SP = window.SurveyPlanner;
        const polygon = block && Array.isArray(block.polygon) ? block.polygon : [];
        if (polygon.length < 3) {
          return Promise.resolve(block);
        }
        const maxSortie = Number(settings.terrainMaxSortieMin) || 0;
        const statsPromise =
          TSP && typeof TSP.getPartitionStats === "function"
            ? TSP.getPartitionStats(TS, polygon)
            : TS && typeof TS.getTerrainStats === "function"
              ? TS.getTerrainStats(polygon).catch(function () {
                  return { relief: block.relief || 0 };
                })
              : Promise.resolve({ relief: block.relief || 0 });
        return statsPromise.then(function (subStats) {
          const relief = Number(subStats && subStats.relief) || 0;
          const est =
            SP && typeof SP.estimateBlockFlightTime === "function"
              ? SP.estimateBlockFlightTime(polygon, settings, resolvedPlatform, subStats)
              : { minutes: 0, breakdown: {} };
          const minutes = Number(est && est.minutes) || 0;
          return Object.assign({}, block, {
            relief: relief,
            stats: subStats,
            estMinutes: minutes,
            estBreakdown: (est && est.breakdown) || {},
            overSortie: maxSortie > 0 && minutes > maxSortie
          });
        });
      },
      [settings, resolvedPlatform]
    );

    const schedulePartitionRecalc = useCallback(
      function () {
        if (partitionRecalcTimerRef.current) {
          return;
        }
        partitionRecalcTimerRef.current = window.setTimeout(function () {
          partitionRecalcTimerRef.current = null;
          const pending = partitionRecalcPendingRef.current || {};
          partitionRecalcPendingRef.current = {};
          const recalcAll = Boolean(pending.all);
          setTerrainPartitionBlocks(function (previous) {
            previous.forEach(function (block, index) {
              if (!recalcAll && !pending[index]) {
                return;
              }
              recomputePartitionBlock(block).then(function (updated) {
                setTerrainPartitionBlocks(function (cur) {
                  if (index >= cur.length || cur[index].id !== block.id) {
                    return cur;
                  }
                  const next = cur.slice();
                  next[index] = updated;
                  return next;
                });
              });
            });
            return previous;
          });
        }, 350);
      },
      [recomputePartitionBlock]
    );

    const handleTerrainPartition = useCallback(function () {
      const TSP = window.TerrainSurveyPlanner;
      if (!TSP || typeof TSP.planPartition !== "function") {
        setSurveyToast("切块模块未加载");
        return;
      }
      if (surveyArea.length < 3) {
        setSurveyToast("请先绘制测区");
        return;
      }
      setTerrainPlanning(true);
      setTerrainPlanPhase("prefetch");
      setTerrainPlanProgressMessage("准备地形数据…");
      setPartitionSelection([]);
      const planSettings = Object.assign({}, settings, { useTerrainFollowing: true });
      TSP.planPartition(surveyArea, planSettings, resolvedPlatform, {
        onProgress: function (progress) {
          if (!progress) {
            return;
          }
          if (progress.phase === "prefetch") {
            setTerrainPlanPhase("prefetch");
            if (progress.status) {
              setTerrainPrefetchStatus(progress.status);
            }
            setTerrainPlanProgressMessage("下载测区地形…");
          } else if (progress.phase === "stats") {
            setTerrainPlanPhase("stats");
            setTerrainPlanProgressMessage(progress.message || "读取测区高程…");
          } else if (progress.phase === "planning") {
            setTerrainPlanPhase("planning");
            setTerrainPlanProgressMessage(progress.message || "地形切块规划中…");
          } else if (progress.phase === "done") {
            setTerrainPlanPhase("");
            setTerrainPlanProgressMessage("");
          }
        }
      })
        .then(function (result) {
          setTerrainPartitionBlocks(result.blocks || []);
          setTerrainPartitionIssues(result.issues || []);
          const over = (result.blocks || []).filter(function (b) {
            return b.overSortie;
          }).length;
          const headingNote =
            result.contourHeading != null
              ? "，侧线约 " + Math.round(result.contourHeading) + "°"
              : "";
          setSurveyToast(
            "切块完成：" +
              (result.blocks ? result.blocks.length : 0) +
              " 块（方向沿 DEM 估计等高线走向，直线高程带）" +
              headingNote +
              (over ? "，" + over + " 块航时超限" : "")
          );
        })
        .catch(function (err) {
          setSurveyToast((err && err.message) || "切块失败");
          setTerrainPartitionBlocks([]);
          setTerrainPartitionIssues([]);
        })
        .finally(function () {
          setTerrainPlanning(false);
          setTerrainPlanPhase("");
          setTerrainPlanProgressMessage("");
        });
    }, [surveyArea, settings, resolvedPlatform]);

    const handlePartitionVertexMoved = useCallback(
      function (blockIndex, vertexIndex, lng, lat) {
        setTerrainPartitionBlocks(function (previous) {
          if (blockIndex < 0 || blockIndex >= previous.length) {
            return previous;
          }
          const target = previous[blockIndex];
          const polygon = target.polygon.slice();
          if (vertexIndex < 0 || vertexIndex >= polygon.length) {
            return previous;
          }
          polygon[vertexIndex] = { lng: lng, lat: lat };
          const next = previous.slice();
          next[blockIndex] = Object.assign({}, target, { polygon: polygon });
          return next;
        });
        partitionRecalcPendingRef.current[blockIndex] = true;
        schedulePartitionRecalc();
      },
      [schedulePartitionRecalc]
    );

    const handlePartitionBlockClick = useCallback(function (blockIndex) {
      setPartitionSelection(function (previous) {
        const idx = previous.indexOf(blockIndex);
        if (idx !== -1) {
          return previous.filter(function (i) {
            return i !== blockIndex;
          });
        }
        return previous.concat([blockIndex]);
      });
    }, []);

    const handleMergeSelectedPartitions = useCallback(function () {
      if (partitionSelection.length < 2) {
        setSurveyToast("请先在地图或列表选择至少两块");
        return;
      }
      setTerrainPartitionBlocks(function (previous) {
        const selected = partitionSelection
          .map(function (i) {
            return previous[i];
          })
          .filter(Boolean);
        if (selected.length < 2) {
          return previous;
        }
        const pointSet = [];
        selected.forEach(function (b) {
          (b.polygon || []).forEach(function (p) {
            pointSet.push({ lng: Number(p.lng), lat: Number(p.lat) });
          });
        });
        const merged = convexHullLngLat(pointSet);
        if (merged.length < 3) {
          return previous;
        }
        const keepFirstIndex = Math.min.apply(null, partitionSelection);
        const mergedBlock = {
          id: "tp-merge-" + Date.now().toString(36),
          order: 0,
          polygon: merged,
          relief: 0,
          estMinutes: 0,
          estBreakdown: {},
          overSortie: false,
          paramsSnapshot: selected[0].paramsSnapshot,
          partitionOnly: true
        };
        const remaining = previous.filter(function (b, i) {
          return partitionSelection.indexOf(i) === -1;
        });
        remaining.splice(
          Math.min(keepFirstIndex, remaining.length),
          0,
          mergedBlock
        );
        return remaining.map(function (b, i) {
          return Object.assign({}, b, { order: i });
        });
      });
      setPartitionSelection([]);
      partitionRecalcPendingRef.current.all = true;
      schedulePartitionRecalc();
    }, [partitionSelection, schedulePartitionRecalc]);

    const handleResplitPartitionBlock = useCallback(
      function (blockIndex) {
        const TSP = window.TerrainSurveyPlanner;
        const TPS = window.TerrainPolygonSplit;
        const TS = window.TerrainService;
        if (!TSP || !TPS || !TPS.autoPartitionForTerrain || !TS) {
          setSurveyToast("切块模块未加载");
          return;
        }
        const target = terrainPartitionBlocks[blockIndex];
        if (!target || !target.polygon || target.polygon.length < 3) {
          return;
        }
        setTerrainPlanning(true);
        setTerrainPlanProgressMessage("再切一刀…");
        const planSettings = Object.assign({}, settings, { useTerrainFollowing: true });
        const getStats = function (poly) {
          return TSP.getPartitionStats
            ? TSP.getPartitionStats(TS, poly)
            : TS.getTerrainStats(poly).catch(function () {
                return { relief: 0 };
              });
        };
        const bearingPromise =
          target.contourHeadingDeg != null && Number.isFinite(Number(target.contourHeadingDeg))
            ? Promise.resolve({ bearing: Number(target.contourHeadingDeg) })
            : TSP.resolvePartitionCutBearing
              ? TSP.resolvePartitionCutBearing(TS, target.polygon, planSettings)
              : TSP.estimateContourHeading(TS, target.polygon).then(function (heading) {
                  return { bearing: Number(heading) };
                });
        bearingPromise
          .then(function (resolved) {
            const bearing = Number(resolved && resolved.bearing);
            if (!Number.isFinite(bearing)) {
              throw new Error("无法估计等高线方向，请先预取地形");
            }
            return TPS.autoPartitionForTerrain(target.polygon, {
              maxReliefM: Number(settings.terrainMaxReliefM) || 120,
              maxSortieMin: Number(settings.terrainMaxSortieMin) || 0,
              cutBearingDeg: bearing,
              maxDepth: 1,
              forceSplit: true,
              getStats: getStats,
              getEstimate: function (poly) {
                return getStats(poly).then(function (s) {
                  const SP = window.SurveyPlanner;
                  return SP
                    ? SP.estimateBlockFlightTime(poly, planSettings, resolvedPlatform, s)
                    : { minutes: 0 };
                });
              }
            });
          })
          .then(function (parts) {
            return Promise.all(
              (parts || []).map(function (poly) {
                return recomputePartitionBlock({
                  id: "tp-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 6),
                  polygon: poly,
                  paramsSnapshot: target.paramsSnapshot,
                  partitionOnly: true,
                  contourHeadingDeg: target.contourHeadingDeg
                });
              })
            );
          })
          .then(function (newBlocks) {
            setTerrainPartitionBlocks(function (previous) {
              const next = previous.slice();
              const args = [blockIndex, 1].concat(newBlocks);
              Array.prototype.splice.apply(next, args);
              return next.map(function (b, i) {
                return Object.assign({}, b, { order: i });
              });
            });
            setPartitionSelection([]);
          })
          .catch(function (err) {
            setSurveyToast((err && err.message) || "再切失败");
          })
          .finally(function () {
            setTerrainPlanning(false);
            setTerrainPlanProgressMessage("");
          });
      },
      [terrainPartitionBlocks, settings, resolvedPlatform, recomputePartitionBlock]
    );

    const handleDeletePartitionBlock = useCallback(function (blockIndex) {
      setTerrainPartitionBlocks(function (previous) {
        return previous
          .filter(function (b, i) {
            return i !== blockIndex;
          })
          .map(function (b, i) {
            return Object.assign({}, b, { order: i });
          });
      });
      setPartitionSelection([]);
    }, []);

    const handleClearPartition = useCallback(function () {
      setTerrainPartitionBlocks([]);
      setTerrainPartitionIssues([]);
      setPartitionSelection([]);
    }, []);

    const handleConfirmPartition = useCallback(function () {
      const MC = window.MissionComposer;
      if (!terrainPartitionBlocks.length) {
        setSurveyToast("没有可确认的切块");
        return;
      }
      let blocks = surveyBlocks.slice();
      terrainPartitionBlocks.forEach(function (part) {
        const snapshot = Object.assign({}, part.paramsSnapshot || settings);
        // Propagate the contour heading (the direction used for the cut boundaries) into the
        // snapshot so the subsequent per-block survey leg generation flies along the same
        // elevation band instead of re-estimating (which can be unreliable on thin cut pieces).
        if (part.contourHeadingDeg != null && Number.isFinite(Number(part.contourHeadingDeg))) {
          snapshot.surveyHeadingDeg = Math.round(Number(part.contourHeadingDeg));
          snapshot.surveyHeadingAuto = false;
        }
        const block =
          MC && typeof MC.createSurveyBlock === "function"
            ? MC.createSurveyBlock(part.polygon, snapshot, blocks.length)
            : {
                id: "sb-" + Date.now().toString(36) + "-" + blocks.length,
                order: blocks.length,
                polygon: part.polygon,
                paramsSnapshot: snapshot,
                waypointCount: 0,
                committed: true
              };
        block.needsPlanning = true;
        block.partitionRelief = part.relief || 0;
        block.partitionEstMinutes = part.estMinutes || 0;
        blocks = blocks.concat([block]);
      });
      setSurveyBlocks(blocks);
      setTerrainPartitionBlocks([]);
      setTerrainPartitionIssues([]);
      setPartitionSelection([]);
      setSurveyArea([]);
      setSurveyCommitted(false);
      setSurveyToast(
        "已确认 " + terrainPartitionBlocks.length + " 块区域（待逐块规划航线）"
      );
    }, [terrainPartitionBlocks, surveyBlocks, settings]);

    const handleManualTerrainPrefetch = useCallback(
      function () {
        const TS = window.TerrainService;
        if (!TS || terrainSurveyPolygon.length < 3) {
          setSurveyToast("请先绘制或确认测区");
          return;
        }
        setTerrainPrefetchBusy(true);
        setSurveyToast("正在预取测区地形…");
        TS.ensureTerrainForPolygon(terrainSurveyPolygon, {
          force: true,
          onProgress: function (status) {
            setTerrainPrefetchStatus(status || null);
          }
        })
          .then(function () {
            setSurveyToast("测区地形预取完成");
            return TS.probeHealth(true);
          })
          .catch(function (err) {
            setSurveyToast((err && err.message) || "地形预取失败");
          })
          .finally(function () {
            setTerrainPrefetchBusy(false);
          });
      },
      [terrainSurveyPolygon]
    );

    const handleCancelTerrainPrefetch = useCallback(function () {
      const TS = window.TerrainService;
      if (!TS || typeof TS.cancelTerrainPrefetch !== "function") {
        return;
      }
      TS.cancelTerrainPrefetch()
        .then(function () {
          setSurveyToast("已请求取消地形预取");
        })
        .catch(function () {
          setSurveyToast("取消预取失败");
        });
    }, []);

    const handleAnalyzeTerrainPlan = useCallback(function () {
      const TPA = window.TerrainPlanAdvisor;
      if (!TPA) {
        return;
      }
      const summary = {
        platform: resolvedPlatform,
        settings: settings,
        stats: terrainPlanStats,
        blockCount: terrainPlanBlocks.length,
        issues: terrainPlanIssues
      };
      TPA.analyzePlan(summary).then(function (res) {
        setTerrainAdvisorText(res.text || "");
      });
    }, [resolvedPlatform, settings, terrainPlanStats, terrainPlanBlocks, terrainPlanIssues]);

    const handleDeleteLastSurveyBlock = useCallback(function () {
      const MC = window.MissionComposer;
      if (!MC || !surveyBlocks.length) {
        return;
      }
      const result = MC.removeLastBlock(missionWaypoints, surveyBlocks);
      setSurveyBlocks(result.blocks);
      setMissionWaypoints(result.waypoints);
      setSurveyToast("已删除区域 " + (result.removed ? result.removed.order + 1 : ""));
    }, [missionWaypoints, surveyBlocks]);

    const handleRecalcSurveyBlock = useCallback(
      function (blockId) {
        const MC = window.MissionComposer;
        const TSP = window.TerrainSurveyPlanner;
        const TS = window.TerrainService;
        if (!MC) {
          return;
        }
        const block = surveyBlocks.find(function (b) {
          return b.id === blockId;
        });
        if (!block) {
          return;
        }
        const runRecalc = function (profileBlock) {
          let blocksForRecalc = surveyBlocks;
          if (profileBlock) {
            blocksForRecalc = surveyBlocks.map(function (b) {
              if (b.id !== blockId) {
                return b;
              }
              return Object.assign({}, b, {
                pathPoints: profileBlock.previewPath || b.pathPoints,
                storedProfile: profileBlock.previewProfile || b.storedProfile,
                storedIssues: profileBlock.previewIssues || b.storedIssues,
                terrainPlanned: true
              });
            });
            setSurveyBlocks(blocksForRecalc);
          }
          const result = MC.recalcBlock(
            missionWaypoints,
            blocksForRecalc,
            blockId,
            resolvedPlatform,
            appendRtl
          );
          if (!result) {
            return;
          }
          setMissionWaypoints(result.waypoints);
          setSurveyToast("已重算区域 " + (result.block.order + 1));
        };
        if (
          settings.useTerrainFollowing &&
          TSP &&
          TS &&
          block.polygon &&
          block.polygon.length >= 3
        ) {
          setTerrainPlanning(true);
          setTerrainPlanPhase("prefetch");
          setTerrainPlanProgressMessage("重算：预取地形…");
          TS.ensureTerrainForPolygon(block.polygon, {
            force: false,
            onProgress: setTerrainPrefetchStatus
          })
            .then(function () {
              setTerrainPlanPhase("planning");
              setTerrainPlanProgressMessage("重算：剖面校核…");
              const hdg = (block && Number.isFinite(Number(block.contourHeadingDeg))) ? Number(block.contourHeadingDeg) : null;
              return TSP.planBlock(
                block.polygon,
                Object.assign({}, settings, { useTerrainFollowing: true }),
                resolvedPlatform,
                block.order,
                hdg
              );
            })
            .then(function (previewBlock) {
              runRecalc(previewBlock);
            })
            .catch(function (err) {
              setSurveyToast((err && err.message) || "地形重算失败");
              runRecalc(null);
            })
            .finally(function () {
              setTerrainPlanning(false);
              setTerrainPlanPhase("");
              setTerrainPlanProgressMessage("");
            });
          return;
        }
        runRecalc(null);
      },
      [missionWaypoints, surveyBlocks, resolvedPlatform, appendRtl, settings]
    );

    const handlePlanSurveyBlock = useCallback(
      function (blockId) {
        const MC = window.MissionComposer;
        const TSP = window.TerrainSurveyPlanner;
        const TS = window.TerrainService;
        if (!MC || !TSP) {
          setSurveyToast("规划模块未加载");
          return;
        }
        const block = surveyBlocks.find(function (b) {
          return b.id === blockId;
        });
        if (!block || !block.polygon || block.polygon.length < 3) {
          return;
        }
        const snapshot = Object.assign({}, block.paramsSnapshot || settings, {
          useTerrainFollowing: true
        });
        setTerrainPlanning(true);
        setTerrainPlanPhase("prefetch");
        setTerrainPlanProgressMessage("规划块：预取地形…");
        const prefetch =
          TS && typeof TS.ensureTerrainForPolygon === "function"
            ? TS.ensureTerrainForPolygon(block.polygon, {
                force: false,
                onProgress: setTerrainPrefetchStatus
              }).catch(function () {
                return null;
              })
            : Promise.resolve(null);
        prefetch
          .then(function () {
            setTerrainPlanPhase("planning");
            setTerrainPlanProgressMessage("规划块：生成航线与剖面…");
            const hdg = (block && Number.isFinite(Number(block.contourHeadingDeg))) ? Number(block.contourHeadingDeg) : null;
            return TSP.planBlock(block.polygon, snapshot, resolvedPlatform, block.order, hdg);
          })
          .then(function (preview) {
            const planned =
              typeof MC.createSurveyBlockFromPreview === "function"
                ? MC.createSurveyBlockFromPreview(
                    preview,
                    preview.paramsSnapshot || snapshot,
                    block.order,
                    block.polygon
                  )
                : MC.createSurveyBlock(block.polygon, snapshot, block.order);
            planned.id = block.id;
            planned.needsPlanning = false;
            planned.terrainPlanned = true;
            const result = MC.appendBlockToMission(
              missionWaypoints,
              planned,
              resolvedPlatform,
              false
            );
            setMissionWaypoints(result.waypoints);
            setSurveyBlocks(function (prev) {
              return prev.map(function (b) {
                return b.id === blockId ? result.block : b;
              });
            });
            setSurveyToast(
              "已规划区域 " +
                (block.order + 1) +
                " 航线，+" +
                (result.addedCount || 0) +
                " 航点"
            );
          })
          .catch(function (err) {
            setSurveyToast((err && err.message) || "块航线规划失败");
          })
          .finally(function () {
            setTerrainPlanning(false);
            setTerrainPlanPhase("");
            setTerrainPlanProgressMessage("");
          });
      },
      [missionWaypoints, surveyBlocks, resolvedPlatform, settings]
    );

    const handleAppendRtlChange = useCallback(function (checked) {
      setAppendRtl(checked);
      const MM = window.MissionModel;
      if (!MM) {
        return;
      }
      setMissionWaypoints(function (previous) {
        if (checked) {
          return MM.appendRtlWaypoint(previous);
        }
        return MM.stripRtlWaypoints(previous);
      });
    }, []);

    useEffect(function () {
      onWaypointMovedRef.current = handleWaypointMoved;
    }, [handleWaypointMoved]);

    useEffect(function () {
      onSurveyVertexMovedRef.current = handleSurveyVertexMoved;
    }, [handleSurveyVertexMoved]);

    useEffect(function () {
      onSurveyVertexDeletedRef.current = handleSurveyVertexDeleted;
    }, [handleSurveyVertexDeleted]);

    useEffect(function () {
      onSurveyVertexInsertedRef.current = handleSurveyVertexInserted;
    }, [handleSurveyVertexInserted]);

    useEffect(function () {
      onPartitionVertexMovedRef.current = handlePartitionVertexMoved;
    }, [handlePartitionVertexMoved]);

    useEffect(function () {
      onPartitionBlockClickRef.current = handlePartitionBlockClick;
    }, [handlePartitionBlockClick]);

    const getPartitionOverlay = useCallback(function () {
      return {
        blocks: latestTerrainPartitionBlocksRef.current,
        selection: latestPartitionSelectionRef.current,
        onVertexMoved: function (blockIndex, vertexIndex, lng, lat) {
          if (onPartitionVertexMovedRef.current) {
            onPartitionVertexMovedRef.current(blockIndex, vertexIndex, lng, lat);
          }
        },
        onBlockClick: function (blockIndex) {
          if (onPartitionBlockClickRef.current) {
            onPartitionBlockClickRef.current(blockIndex);
          }
        }
      };
    }, []);

    const syncMapLayers = useCallback(function (
      nextWaypoints,
      nextSurveyArea,
      nextSurveyPath,
      committed,
      nextBlocks,
      syncScope
    ) {
      if (!mapRef.current || !layersRef.current) {
        return;
      }
      syncLeafletMissionLayers(
        layersRef.current,
        nextWaypoints,
        nextSurveyArea,
        nextSurveyPath,
        function (index, lng, lat) {
          if (onWaypointMovedRef.current) {
            onWaypointMovedRef.current(index, lng, lat);
          }
        },
        function (index, lng, lat) {
          if (onSurveyVertexMovedRef.current) {
            onSurveyVertexMovedRef.current(index, lng, lat);
          }
        },
        function (index) {
          if (onSurveyVertexDeletedRef.current) {
            onSurveyVertexDeletedRef.current(index);
          }
        },
        function (afterIndex, lng, lat) {
          if (onSurveyVertexInsertedRef.current) {
            onSurveyVertexInsertedRef.current(afterIndex, lng, lat);
          }
        },
        {
          surveyPathPreview: !committed,
          previewSettings: latestSettingsRef.current
        },
        nextBlocks || [],
        syncScope || "all",
        {
          platform: latestPlatformRef.current,
          settings: latestSettingsRef.current,
          planningBlocks: latestTerrainPlanBlocksRef.current,
          partition: getPartitionOverlay(),
          showTerrainContours: latestShowTerrainContoursRef.current,
          terrainContourGeo: latestTerrainContourGeoRef.current,
          terrainProfiles: collectTerrainProfilesForMap(
            latestTerrainPlanBlocksRef.current,
            nextBlocks || []
          )
        }
      );
    }, []);

    const scheduleMapLayerSync = useCallback(
      function (syncScope) {
        if (syncScope === "survey") {
          mapSyncScopeRef.current =
            mapSyncScopeRef.current === "waypoints" ? "all" : "survey";
        } else if (syncScope === "waypoints") {
          mapSyncScopeRef.current =
            mapSyncScopeRef.current === "survey" ? "all" : "waypoints";
        } else {
          mapSyncScopeRef.current = "all";
        }

        if (mapSyncRafRef.current) {
          return;
        }

        mapSyncRafRef.current = window.requestAnimationFrame(function () {
          mapSyncRafRef.current = 0;
          const scope = mapSyncScopeRef.current;
          mapSyncScopeRef.current = "all";
          if (!mapRef.current || !layersRef.current) {
            return;
          }
          syncMapLayers(
            latestWaypointsRef.current,
            latestSurveyAreaRef.current,
            latestSurveyPathRef.current,
            surveyCommittedRef.current,
            latestSurveyBlocksRef.current,
            scope
          );
        });
      },
      [syncMapLayers]
    );

    useEffect(function () {
      activeTabRef.current = activeTab;
      settingsRef.current = settings;
      latestSettingsRef.current = settings;
      waypointCountRef.current = missionWaypoints.length;
      surveyAreaCountRef.current = surveyArea.length;
      surveyCommittedRef.current = surveyCommitted;
    }, [activeTab, settings, missionWaypoints.length, surveyArea.length, surveyCommitted]);

    useEffect(function () {
      latestWaypointsRef.current = missionWaypoints;
      latestSurveyAreaRef.current = surveyArea;
      latestSurveyPathRef.current = surveyPath;
      latestSurveyBlocksRef.current = surveyBlocks;
      latestTerrainPlanBlocksRef.current = terrainPlanBlocks;
      latestTerrainPartitionBlocksRef.current = terrainPartitionBlocks;
      latestPartitionSelectionRef.current = partitionSelection;
      latestTerrainContourGeoRef.current = terrainContourGeo;
      latestShowTerrainContoursRef.current = showTerrainContours;
    }, [
      missionWaypoints,
      surveyArea,
      surveyPath,
      surveyBlocks,
      terrainPlanBlocks,
      terrainPartitionBlocks,
      partitionSelection,
      terrainContourGeo,
      showTerrainContours
    ]);

    useEffect(function () {
      if (!window.FlightPlanDraft || typeof window.FlightPlanDraft.save !== "function") {
        return;
      }
      window.FlightPlanDraft.save({
        activeTab: activeTab,
        settings: settings,
        missionWaypoints: missionWaypoints,
        platformOverride: platformOverride,
        surveyArea: surveyArea,
        surveyCommitted: surveyCommitted,
        appendRtl: appendRtl,
        surveyAltitudeCustomized: surveyAltitudeCustomizedRef.current,
        turnAroundCustomized: turnAroundCustomizedRef.current,
        surveyBlocks: surveyBlocks
      });
    }, [
      activeTab,
      settings,
      missionWaypoints,
      platformOverride,
      surveyArea,
      surveyCommitted,
      appendRtl,
      surveyBlocks
    ]);

    useEffect(function () {
      const MV = window.MissionValidator;
      if (!MV) {
        return;
      }
      if (MV.validateMissionAsync) {
        MV.validateMissionAsync(missionWaypoints, resolvedPlatform, {
          settings: settings,
          surveyBlocks: surveyBlocks
        }).then(function (issues) {
          setValidationIssues(issues || []);
        });
        return;
      }
      setValidationIssues(MV.validateMission(missionWaypoints, resolvedPlatform, { settings: settings }));
    }, [missionWaypoints, resolvedPlatform, settings, surveyBlocks]);

    useEffect(function () {
      if (activeTab !== "survey") {
        return;
      }
      const VT = window.VehicleTemplates;
      const MM = window.MissionModel;
      if (
        VT &&
        MM &&
        VT.shouldRebuildBootstrapTemplate &&
        VT.shouldRebuildBootstrapTemplate(missionWaypoints, resolvedPlatform)
      ) {
        const boot = VT.buildBootstrapWaypoints(
          resolvedPlatform,
          MM.getTakeoffLatLng(),
          MM.isVehicleConnected()
        );
        const MC = window.MissionComposer;
        if (MC && surveyBlocks.length) {
          setMissionWaypoints(
            MC.rebuildMissionFromBlocks(boot, surveyBlocks, resolvedPlatform, appendRtl)
          );
        } else {
          setMissionWaypoints(boot);
        }
        missionBootstrappedRef.current = true;
        return;
      }
      if (surveyArea.length || surveyCommitted || missionWaypoints.length) {
        missionBootstrappedRef.current = true;
        return;
      }
      if (!missionBootstrappedRef.current) {
        bootstrapMissionForSurvey();
      }
    }, [
      activeTab,
      bootstrapMissionForSurvey,
      missionWaypoints,
      resolvedPlatform,
      surveyArea.length,
      surveyCommitted,
      surveyBlocks,
      appendRtl
    ]);

    useEffect(function () {
      function onConn(event) {
        const next = event && event.detail && event.detail.state === "connected";
        setConnected(next);
        const VT = window.VehicleTemplates;
        if (next) {
          setPlatformOverride("");
          if (VT) {
            setMissionWaypoints(function (prev) {
              if (!prev.length) {
                return prev;
              }
              const sync =
                VT.syncMissionHomeAnchorsFromVehicle || VT.syncTakeoffFromVehicle;
              return sync(prev, true);
            });
          }
        } else if (VT) {
          setPlatformOverride(
            VT.detectVehiclePlatform ? VT.detectVehiclePlatform() : "multirotor"
          );
          setMissionWaypoints(function (prev) {
            if (!prev.length) {
              return prev;
            }
            const sync =
              VT.syncMissionHomeAnchorsFromVehicle || VT.syncTakeoffFromVehicle;
            return sync(prev, false);
          });
        }
      }
      document.addEventListener("gcs-connection", onConn);
      return function () {
        document.removeEventListener("gcs-connection", onConn);
      };
    }, []);

    useEffect(function () {
      let disposed = false;
      let retryTimer = null;
      let mapResizeObserver = null;

      function destroyMap() {
        layersRef.current = null;
        if (mapResizeObserver) {
          mapResizeObserver.disconnect();
          mapResizeObserver = null;
        }
        if (mapRef.current) {
          if (typeof window.removeGcsMapBaseLayers === "function") {
            window.removeGcsMapBaseLayers(mapRef.current);
          }
          mapRef.current.remove();
          mapRef.current = null;
        }
        window.flightPlanMap = null;
      }

      function tryCreateMap() {
        const container = mapContainerRef.current;

        if (disposed || mapRef.current || !window.L || !container) {
          return Boolean(mapRef.current);
        }

        if (!isFlightPlanViewActive() || !hasVisibleMapContainer(container)) {
          return false;
        }

        const center =
          typeof window.getMapCenterLatLng === "function"
            ? window.getMapCenterLatLng()
            : [window.DEFAULT_MAP_LAT || 29.59256, window.DEFAULT_MAP_LON || 106.22742];
        const map = window.L.map(container, {
          zoomControl: true,
          preferCanvas: true
        }).setView(center, 13);

        addFlightPlanBaseLayers(map);
        if (window.GcsMapPrefetch && typeof window.GcsMapPrefetch.setupMap === "function") {
          window.GcsMapPrefetch.setupMap(map);
        }

        layersRef.current = {
          terrainContourGroup: window.L.layerGroup().addTo(map),
          pathGroup: window.L.layerGroup().addTo(map),
          terrainIssueGroup: window.L.layerGroup().addTo(map),
          surveyGroup: window.L.layerGroup().addTo(map),
          waypointGroup: window.L.layerGroup().addTo(map),
          homeGroup: window.L.layerGroup().addTo(map),
          vehicleGroup: window.L.layerGroup().addTo(map)
        };

        // Robustness: observe container size changes (tab switch, 3D modal, splitters, etc.)
        // and call invalidateSize so Leaflet map doesn't stay blank/black.
        if (window.ResizeObserver) {
          if (mapResizeObserver) {
            mapResizeObserver.disconnect();
          }
          mapResizeObserver = new ResizeObserver(function () {
            if (mapRef.current) {
              mapRef.current.invalidateSize();
            }
          });
          mapResizeObserver.observe(container);
        }

        map.on("click", function (event) {
          const clicked = {
            lng: round(event.latlng.lng, 6),
            lat: round(event.latlng.lat, 6)
          };

          if (activeTabRef.current === "survey") {
            setSurveyArea(function (previous) {
              return previous.concat(clicked);
            });
            setSurveyCommitted(false);
          } else {
            const MM = window.MissionModel;
            setMissionWaypoints(function (previous) {
              const wp = MM
                ? MM.createWaypoint({
                    lng: clicked.lng,
                    lat: clicked.lat,
                    alt: Number(settingsRef.current.altitude),
                    source: "manual"
                  })
                : {
                    lng: clicked.lng,
                    lat: clicked.lat,
                    alt: Number(settingsRef.current.altitude)
                  };
              const next = MM ? MM.renumberWaypoints(previous.concat([wp])) : previous.concat([wp]);
              return next;
            });
          }
        });

        mapRef.current = map;
        window.flightPlanMap = map;

        function handleContourViewportChange() {
          setTerrainContourViewportRevision(function (value) {
            return value + 1;
          });
        }

        map.on("moveend zoomend resize", handleContourViewportChange);
        handleContourViewportChange();

        syncLeafletMissionLayers(
          layersRef.current,
          latestWaypointsRef.current,
          latestSurveyAreaRef.current,
          latestSurveyPathRef.current,
          function (index, lng, lat) {
            if (onWaypointMovedRef.current) {
              onWaypointMovedRef.current(index, lng, lat);
            }
          },
          function (index, lng, lat) {
            if (onSurveyVertexMovedRef.current) {
              onSurveyVertexMovedRef.current(index, lng, lat);
            }
          },
          function (index) {
            if (onSurveyVertexDeletedRef.current) {
              onSurveyVertexDeletedRef.current(index);
            }
          },
          function (afterIndex, lng, lat) {
            if (onSurveyVertexInsertedRef.current) {
              onSurveyVertexInsertedRef.current(afterIndex, lng, lat);
            }
          },
          { surveyPathPreview: !surveyCommittedRef.current, previewSettings: latestSettingsRef.current },
          latestSurveyBlocksRef.current,
          "all",
          { platform: latestPlatformRef.current,
            settings: latestSettingsRef.current,
            planningBlocks: latestTerrainPlanBlocksRef.current,
            partition: getPartitionOverlay(),
            showTerrainContours: latestShowTerrainContoursRef.current,
            terrainContourGeo: latestTerrainContourGeoRef.current,
            terrainProfiles: collectTerrainProfilesForMap(
              latestTerrainPlanBlocksRef.current,
              latestSurveyBlocksRef.current
            )
          }
        );

        window.requestAnimationFrame(function () {
          if (!mapRef.current) {
            return;
          }
          mapRef.current.invalidateSize();
          fitMissionBounds(
            mapRef.current,
            latestWaypointsRef.current,
            latestSurveyAreaRef.current,
            latestSurveyPathRef.current
          );
        });

        return true;
      }


      function scheduleMapInit() {
        if (disposed) {
          return;
        }
        if (tryCreateMap()) {
          if (retryTimer) {
            window.clearTimeout(retryTimer);
            retryTimer = null;
          }
          return;
        }
        retryTimer = window.setTimeout(scheduleMapInit, 80);
      }

      function handleViewChanged(event) {
        if (!event || !event.detail || event.detail.name !== "flight-plan") {
          return;
        }

        window.requestAnimationFrame(function () {
          if (disposed) {
            return;
          }
          if (!mapRef.current) {
            scheduleMapInit();
            return;
          }
          mapRef.current.invalidateSize();
          if (layersRef.current) {
            syncLeafletMissionLayers(
              layersRef.current,
              latestWaypointsRef.current,
              latestSurveyAreaRef.current,
              latestSurveyPathRef.current,
              function (index, lng, lat) {
                if (onWaypointMovedRef.current) {
                  onWaypointMovedRef.current(index, lng, lat);
                }
              },
              function (index, lng, lat) {
                if (onSurveyVertexMovedRef.current) {
                  onSurveyVertexMovedRef.current(index, lng, lat);
                }
              },
              function (index) {
                if (onSurveyVertexDeletedRef.current) {
                  onSurveyVertexDeletedRef.current(index);
                }
              },
              function (afterIndex, lng, lat) {
                if (onSurveyVertexInsertedRef.current) {
                  onSurveyVertexInsertedRef.current(afterIndex, lng, lat);
                }
              },
              { surveyPathPreview: !surveyCommittedRef.current, previewSettings: latestSettingsRef.current },
              latestSurveyBlocksRef.current,
              "all",
              {
                platform: latestPlatformRef.current,
                settings: latestSettingsRef.current,
                planningBlocks: latestTerrainPlanBlocksRef.current,
                partition: getPartitionOverlay(),
                showTerrainContours: latestShowTerrainContoursRef.current,
                terrainContourGeo: latestTerrainContourGeoRef.current,
                terrainProfiles: collectTerrainProfilesForMap(
                  latestTerrainPlanBlocksRef.current,
                  latestSurveyBlocksRef.current
                )
              }
            );
          }
          fitMissionBounds(
            mapRef.current,
            latestWaypointsRef.current,
            latestSurveyAreaRef.current,
            latestSurveyPathRef.current
          );
          if (syncTakeoffToVehicleRef.current) {
            syncTakeoffToVehicleRef.current();
          }
        });
      }

      window.addEventListener("gcs:main-view-changed", handleViewChanged);
      scheduleMapInit();

      return function () {
        disposed = true;
        if (retryTimer) {
          window.clearTimeout(retryTimer);
        }
        if (mapSyncRafRef.current) {
          window.cancelAnimationFrame(mapSyncRafRef.current);
          mapSyncRafRef.current = 0;
        }
        window.removeEventListener("gcs:main-view-changed", handleViewChanged);
        destroyMap();
      };
    }, []);

    useEffect(function () {
      scheduleMapLayerSync("survey");
    }, [surveyArea, surveyPath, surveyCommitted, surveyBlocks, terrainPlanBlocks, terrainPartitionBlocks, partitionSelection, scheduleMapLayerSync]);

    useEffect(function () {
      scheduleMapLayerSync("waypoints");
    }, [missionWaypoints, scheduleMapLayerSync]);

    useEffect(function () {
      if (!mapRef.current || !layersRef.current) {
        return;
      }
      scheduleMapLayerSync("all");
    }, [activeTab, scheduleMapLayerSync]);

    useEffect(function () {
      const MC = window.MissionComposer;
      if (!MC || surveyBlocks.length) {
        return;
      }
      const migrated = MC.migrateLegacySurveyWaypoints(missionWaypoints, surveyBlocks);
      if (migrated.length) {
        setSurveyBlocks(migrated);
      }
    }, [missionWaypoints, surveyBlocks.length]);

    const handleSettingChange = useCallback(function (key, value, finalize, options) {
      options = options || {};

      setSettings(function (previous) {
        const next = Object.assign({}, previous);

        if (
          options.asPercent &&
          (key === "forwardOverlap" || key === "sideOverlap")
        ) {
          const percent = parseOverlapPercentInput(value);
          if (percent === null) {
            return previous;
          }
          if (!Number.isFinite(percent)) {
            return previous;
          }
          value = overlapPercentToFraction(
            clamp(percent, OVERLAP_PERCENT_MIN, OVERLAP_PERCENT_MAX)
          );
        }

        if (key === "forwardOverlap" || key === "sideOverlap") {
          const parsed = Number(value);
          if (finalize) {
            next[key] = formatMissionSettingValue(
              key,
              clamp(
                Number.isFinite(parsed) ? parsed : previous[key],
                OVERLAP_FRACTION_MIN,
                OVERLAP_FRACTION_MAX
              )
            );
          } else if (!Number.isFinite(parsed)) {
            return previous;
          } else {
            next[key] = parsed;
          }
        } else if (key === "surveyEntryCorner") {
          next[key] = normalizeSurveyEntryCorner(value);
        } else if (key === "surveyHeadingAuto") {
          next.surveyHeadingAuto = Boolean(value);
        } else if (key === "surveyHeadingDeg") {
          if (value === "" || value == null) {
            next.surveyHeadingDeg = null;
          } else {
            const parsed = Number(value);
            if (!Number.isFinite(parsed)) {
              return previous;
            }
            next.surveyHeadingDeg = finalize ? Math.round(parsed) % 360 : parsed;
          }
        } else if (
          key === "useTerrainFollowing" ||
          key === "terrainAutoPartition" ||
          key === "terrainPrefetchOnDraw" ||
          key === "terrainClimbSmoothing"
        ) {
          next[key] = Boolean(value);
        } else {
          next[key] = Number(value);
          if (finalize) {
            next[key] = formatMissionSettingValue(key, next[key]);
          }
        }

        if (key === "surveyAltitude") {
          surveyAltitudeCustomizedRef.current = true;
        }

        if (key === "turnAroundMeters") {
          turnAroundCustomizedRef.current = true;
        }

        if (key === "altitude" && !surveyAltitudeCustomizedRef.current) {
          next.surveyAltitude = formatMissionSettingValue("surveyAltitude", next.altitude);
        }

        if (key === "speed") {
          next.terrainCruiseSpeedMps = Number(next.speed) || DEFAULT_MISSION_SETTINGS.terrainCruiseSpeedMps;
        }

        if (
          key === "surveyAltitude" ||
          key === "altitude" ||
          key === "sideOverlap"
        ) {
          applyAutoFootprintFromCamera(next);
        }

        return next;
      });
    }, []);

    const handleCameraSelect = useCallback(function (cameraId) {
      setSettings(function (previous) {
        const camera = getSurveyCamera(cameraId);
        const nextFocal = cameraHasInterchangeableLens(camera)
          ? normalizeCameraFocalLength(camera, previous.focalLengthMm)
          : camera.focalLengthsMm[0];
        const next = Object.assign({}, previous, {
          cameraId: camera.id,
          focalLengthMm: nextFocal
        });
        applyAutoFootprintFromCamera(next);
        return next;
      });
    }, []);

    const handleFocalLengthSelect = useCallback(function (focalLengthMm) {
      setSettings(function (previous) {
        const camera = getSurveyCamera(previous.cameraId);
        const next = Object.assign({}, previous, {
          focalLengthMm: normalizeCameraFocalLength(camera, focalLengthMm)
        });
        applyAutoFootprintFromCamera(next);
        return next;
      });
    }, []);

    const handleFocalLengthInput = useCallback(function (focalLengthMm) {
      handleFocalLengthSelect(focalLengthMm);
    }, [handleFocalLengthSelect]);

    const handleDeleteWaypoint = useCallback(
      function (index) {
        setMissionWaypoints(function (previous) {
          if (index < 0 || index >= previous.length) {
            return previous;
          }
          const target = previous[index];
          if (target.locked) {
            return previous;
          }
          const next = previous.slice();
          next.splice(index, 1);
          const MM = window.MissionModel;
          return MM ? MM.renumberWaypoints(next) : next;
        });
      },
      []
    );

    const handleDeletePreviewWaypoint = useCallback(
      function (index) {
        setMissionWaypoints(function (previous) {
          if (index < 0 || index >= previous.length) {
            return previous;
          }
          const target = previous[index];
          if (
            target.locked &&
            target.source !== "survey" &&
            target.source !== "camera"
          ) {
            return previous;
          }
          const next = previous.slice();
          next.splice(index, 1);
          const MM = window.MissionModel;
          return MM ? MM.renumberWaypoints(next) : next;
        });
      },
      []
    );

    const close3dPreview = useCallback(function () {
      setPreview3dOpen(false);
      setPreview3dLoading(false);
      if (previewCesiumViewerRef.current && typeof previewCesiumViewerRef.current.dispose === "function") {
        previewCesiumViewerRef.current.dispose();
        previewCesiumViewerRef.current = null;
      }
      if (previewThreeApiRef.current && typeof previewThreeApiRef.current.dispose === "function") {
        previewThreeApiRef.current.dispose();
        previewThreeApiRef.current = null;
      }
    }, []);

    const closeProfilePreview = useCallback(function () {
      setProfilePreview(null);
      setProfileViewBox(null);
      setProfileProbeT(0.5);
      profilePointerRef.current = { active: false, mode: "pan", x: 0, y: 0 };
    }, []);

    const openProfilePreview = useCallback(function (payload) {
      if (!payload || !payload.profile || payload.profile.length < 2) {
        return;
      }
      const paths = buildTerrainProfileSparklinePaths(
        payload.profile,
        payload.settings || settings,
        resolvedPlatform,
        { width: 960, height: 220, pad: 8 }
      );
      if (!paths) {
        return;
      }
      setProfilePreview(payload);
      setProfileViewBox({
        x: 0,
        y: 0,
        w: paths.contentWidth,
        h: paths.contentHeight
      });
      setProfileProbeT(0.5);
      profilePointerRef.current = { active: false, mode: "pan", x: 0, y: 0 };
    }, [resolvedPlatform, settings]);

    useEffect(
      function () {
        if (!profilePreview) {
          return;
        }
        function onKeyDown(event) {
          if (event.key === "Escape") {
            closeProfilePreview();
          }
        }
        function endProfilePointer() {
          profilePointerRef.current = { active: false, mode: "pan", x: 0, y: 0 };
          if (profileStageRef.current) {
            profileStageRef.current.classList.remove("is-dragging");
            profileStageRef.current.classList.remove("is-probe-dragging");
          }
        }
        document.addEventListener("keydown", onKeyDown, true);
        window.addEventListener("pointerup", endProfilePointer);
        window.addEventListener("pointercancel", endProfilePointer);
        return function () {
          document.removeEventListener("keydown", onKeyDown, true);
          window.removeEventListener("pointerup", endProfilePointer);
          window.removeEventListener("pointercancel", endProfilePointer);
        };
      },
      [profilePreview, closeProfilePreview]
    );

    const resetProfileViewBox = useCallback(function () {
      if (!profilePreview) {
        return;
      }
      const paths = buildTerrainProfileSparklinePaths(
        profilePreview.profile,
        profilePreview.settings || settings,
        resolvedPlatform,
        { width: 960, height: 220, pad: 8 }
      );
      if (!paths) {
        return;
      }
      setProfileViewBox({
        x: 0,
        y: 0,
        w: paths.contentWidth,
        h: paths.contentHeight
      });
      setProfileProbeT(0.5);
      profilePointerRef.current = { active: false, mode: "pan", x: 0, y: 0 };
    }, [profilePreview, resolvedPlatform, settings]);

    const open3dPreview = useCallback(function (mode) {
      const MM = window.MissionModel;
      const home = resolvePreviewHome(
        missionWaypoints,
        MM && MM.getFlightPlanHomeLatLng ? MM.getFlightPlanHomeLatLng() : null
      );
      setPreview3dMode(mode);
      setPreview3dView("iso");
      setPreview3dError("");
      setPreview3dNotice("");
      setPreview3dCesiumHealthy(true);
      setPreview3dLoading(true);
      setPreview3dOpen(true);
      prepareFlightPlanPreviewData({
        mode: mode,
        missionWaypoints: missionWaypoints,
        terrainPlanBlocks: terrainPlanBlocks,
        surveyBlocks: surveyBlocks,
        surveyPath: surveyPath,
        settings: settings,
        home: home,
        platform: resolvedPlatform
      })
        .then(function (result) {
          if (!result || !result.ok) {
            setPreview3dData(result && result.data ? result.data : null);
            setPreview3dError((result && result.error) || "暂无可预览的航线");
            setPreview3dNotice("");
            return;
          }
          setPreview3dData(result.data || null);
          setPreview3dError("");
          setPreview3dNotice(result.error || "");
        })
        .catch(function (err) {
          setPreview3dData(null);
          setPreview3dError((err && err.message) || "3D 预览准备失败");
          setPreview3dNotice("");
        })
        .finally(function () {
          setPreview3dLoading(false);
        });
    }, [missionWaypoints, terrainPlanBlocks, surveyBlocks, surveyPath, settings]);

    const handleOpen3dPreview = useCallback(function () {
      const mode =
        preferPlanning3d
          ? "planning"
          : canPreviewMission3d
            ? "mission"
            : "planning";
      open3dPreview(mode);
    }, [canPreviewMission3d, open3dPreview, preferPlanning3d]);

    const handleClearWaypoints = useCallback(function () {
      setMissionWaypoints([]);
      missionBootstrappedRef.current = false;
    }, []);

    const handleClearSurvey = useCallback(function () {
      setSurveyArea([]);
      setSurveyCommitted(false);
      invalidateSurveyTerrainPlan();
    }, [invalidateSurveyTerrainPlan]);

    useEffect(
      function () {
        if (!settings.useTerrainFollowing || settings.terrainPrefetchOnDraw === false) {
          return;
        }
        if (terrainSurveyPolygon.length < 3) {
          return;
        }
        const TS = window.TerrainService;
        if (!TS || !TS.prefetchTerrain || !TS.polygonBbox) {
          return;
        }
        const bbox = TS.polygonBbox(terrainSurveyPolygon);
        if (!bbox) {
          return;
        }
        TS.prefetchTerrain(bbox).catch(function () {
          /* draw-time prefetch is best-effort */
        });
      },
      [
        terrainSurveyPolygon,
        settings.useTerrainFollowing,
        settings.terrainPrefetchOnDraw
      ]
    );

    useEffect(
      function () {
        if (!settings.useTerrainFollowing || terrainSurveyPolygon.length < 3) {
          setTerrainPrefetchEstimate(null);
          return;
        }
        const TS = window.TerrainService;
        if (!TS || typeof TS.estimateTerrainPrefetch !== "function" || !TS.polygonBbox) {
          return;
        }
        const bbox = TS.polygonBbox(terrainSurveyPolygon);
        if (!bbox) {
          return;
        }
        let cancelled = false;
        TS.estimateTerrainPrefetch(bbox)
          .then(function (data) {
            if (!cancelled) {
              setTerrainPrefetchEstimate(data || null);
            }
          })
          .catch(function () {
            if (!cancelled) {
              setTerrainPrefetchEstimate(null);
            }
          });
        return function () {
          cancelled = true;
        };
      },
      [settings.useTerrainFollowing, terrainSurveyPolygon]
    );

    useEffect(
      function () {
        if (!settings.useTerrainFollowing) {
          setSurveyWaypointGroundElev({});
          return;
        }
        const TS = window.TerrainService;
        if (!TS || typeof TS.sampleElevationBatch !== "function") {
          return;
        }
        const points = [];
        const indexMap = [];
        missionWaypoints.forEach(function (wp, index) {
          if (wp.source === "survey") {
            points.push({ lat: wp.lat, lng: wp.lng });
            indexMap.push(index);
          }
        });
        if (!points.length) {
          setSurveyWaypointGroundElev({});
          return;
        }
        let cancelled = false;
        TS.sampleElevationBatch(points)
          .then(function (sampled) {
            if (cancelled) {
              return;
            }
            const elevMap = {};
            indexMap.forEach(function (missionIndex, i) {
              const pt = sampled[i];
              if (pt && pt.elevation != null && Number.isFinite(pt.elevation)) {
                elevMap[missionIndex] = pt.elevation;
              }
            });
            setSurveyWaypointGroundElev(elevMap);
          })
          .catch(function () {
            if (!cancelled) {
              setSurveyWaypointGroundElev({});
            }
          });
        return function () {
          cancelled = true;
        };
      },
      [missionWaypoints, settings.useTerrainFollowing]
    );

    useEffect(
      function () {
        if (!settings.useTerrainFollowing || !connected) {
          return;
        }
        const timer = window.setInterval(function () {
          setTerrainGridStatusRevision(function (n) {
            return n + 1;
          });
        }, 5000);
        return function () {
          window.clearInterval(timer);
        };
      },
      [settings.useTerrainFollowing, connected]
    );

    useEffect(
      function () {
        if (terrainContourAbortRef.current) {
          try {
            terrainContourAbortRef.current.abort();
          } catch (_) {
            /* ignore */
          }
          terrainContourAbortRef.current = null;
        }
        if (!showTerrainContours) {
          terrainContourEnsureAttemptRef.current = false;
          setTerrainContourLoading(false);
          setTerrainContourError("");
          setSurveyToast(function (prev) {
            return prev === "高程服务已启动，正在生成等高线..." ? "" : prev;
          });
          if (terrainContourGeo.length) {
            setTerrainContourGeo([]);
          }
          return;
        }
        if (!contourTargetAvailable) {
          setTerrainContourLoading(false);
          setTerrainContourError("");
          setSurveyToast(function (prev) {
            return prev === "高程服务已启动，正在生成等高线..." ? "" : prev;
          });
          if (terrainContourGeo.length) {
            setTerrainContourGeo([]);
          }
          return;
        }
        const serviceStatus = terrainHealth ? terrainHealth.status : "idle";
        if (serviceStatus !== "online" && serviceStatus !== "online-empty") {
          if (!terrainContourEnsureAttemptRef.current) {
            terrainContourEnsureAttemptRef.current = true;
            setTerrainContourLoading(true);
            setTerrainContourError("高程服务离线，正在尝试启动本地服务...");
            ensureLocalTileServerReady()
              .then(function (ok) {
                if (!ok) {
                  throw new Error("高程服务未就绪");
                }
                setTerrainContourError("");
                setSurveyToast("高程服务已启动，正在生成等高线...");
              })
              .catch(function (err) {
                const message =
                  (err && err.message) || "高程服务未就绪，请通过启动器检查 :8768";
                setTerrainContourLoading(false);
                setTerrainContourError(message);
                setSurveyToast(message);
              });
            return;
          }
          setTerrainContourLoading(false);
          setTerrainContourError("高程服务未就绪");
          setTerrainContourError(
            terrainHealth && terrainHealth.lastError
              ? "高程服务未就绪：" + terrainHealth.lastError
              : "高程服务未就绪，请启动本地服务 :8768"
          );
          if (terrainContourGeo.length) {
            setTerrainContourGeo([]);
          }
          return;
        }

        terrainContourEnsureAttemptRef.current = false;
        const requestId = terrainContourRequestIdRef.current + 1;
        terrainContourRequestIdRef.current = requestId;
        const controller =
          typeof AbortController === "function" ? new AbortController() : null;
        terrainContourAbortRef.current = controller;
        latestTerrainContourGeoRef.current = [];
        setTerrainContourLoading(true);
        setTerrainContourError("");

        const contourTimeout = window.setTimeout(function () {
          if (terrainContourRequestIdRef.current !== requestId) {
            return;
          }
          if (terrainContourAbortRef.current === controller && controller) {
            try {
              controller.abort();
            } catch (_) {
              /* ignore */
            }
            terrainContourAbortRef.current = null;
          }
          setTerrainContourLoading(false);
          setTerrainContourGeo([]);
          setTerrainContourError("等高线生成超时，请缩小视野或先预取地形后重试");
          setSurveyToast("等高线生成超时，请缩小视野或先预取地形后重试");
        }, 25000);

        generateTerrainContoursForPolygon(contourTargetPolygon, {
          signal: controller ? controller.signal : null
        })
          .then(function (result) {
            if (terrainContourRequestIdRef.current !== requestId) {
              return;
            }
            window.clearTimeout(contourTimeout);
            if (!result || result.validRatio < TERRAIN_CONTOUR_MIN_VALID_RATIO) {
              setTerrainContourGeo([]);
              setTerrainContourError("等高线生成失败，请确认地形数据已预取");
              setSurveyToast("等高线生成失败，请确认地形数据已预取");
              return;
            }
            setTerrainContourGeo(Array.isArray(result.contours) ? result.contours : []);
            setTerrainContourError("");
            setSurveyToast(function (prev) {
              return prev === "高程服务已启动，正在生成等高线..." ? "" : prev;
            });
          })
          .catch(function (err) {
            if (terrainContourRequestIdRef.current !== requestId) {
              return;
            }
            window.clearTimeout(contourTimeout);
            if (err && err.message === "请求已取消") {
              setTerrainContourError("");
              return;
            }
            setTerrainContourGeo([]);
            setTerrainContourError((err && err.message) || "等高线生成失败");
            setSurveyToast("等高线生成失败，请确认地形数据已预取");
          })
          .finally(function () {
            window.clearTimeout(contourTimeout);
            if (terrainContourAbortRef.current === controller) {
              terrainContourAbortRef.current = null;
            }
            if (terrainContourRequestIdRef.current === requestId) {
              setTerrainContourLoading(false);
            }
          });

        return function () {
          window.clearTimeout(contourTimeout);
          if (terrainContourAbortRef.current === controller) {
            terrainContourAbortRef.current = null;
          }
          if (controller) {
            try {
              controller.abort();
            } catch (_) {
              /* ignore */
            }
          }
        };
      },
      [
        showTerrainContours,
        contourTargetAvailable,
        contourTargetKey,
        terrainServiceStatus,
        terrainHealth && terrainHealth.lastError,
        terrainContourGeo.length
      ]
    );

    useEffect(function () {
      scheduleMapLayerSync("survey");
    }, [terrainContourGeo, showTerrainContours, scheduleMapLayerSync]);

    const handleFitMission = useCallback(function () {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
        fitMissionBounds(mapRef.current, missionWaypoints, surveyArea, surveyPath);
      }
    }, [missionWaypoints, surveyArea, surveyPath]);

    const handleSaveMissionFile = useCallback(function () {
      if (!window.WaypointFile) {
        return;
      }
      window.WaypointFile.downloadWaypointFile(
        missionWaypoints,
        "mission.waypoints",
        resolvedPlatform
      );
    }, [missionWaypoints, resolvedPlatform]);

    const handleImportMissionFile = useCallback(function (event) {
      const file = event.target.files && event.target.files[0];
      if (!file || !window.WaypointFile) {
        return;
      }
      const reader = new FileReader();
      reader.onload = function () {
        try {
          let list = window.WaypointFile.parseWaypointFile(reader.result);
          const FWP = window.FixedWingParams;
          if (FWP && FWP.normalizeWaypointsForPlatform) {
            list = FWP.normalizeWaypointsForPlatform(list, resolvedPlatform);
          }
          setMissionWaypoints(list);
          missionBootstrappedRef.current = true;
          setMissionIoNote("已导入 " + list.length + " 个航点");
        } catch (err) {
          setMissionIoNote(err.message || "导入失败");
        }
        event.target.value = "";
      };
      reader.readAsText(file, "utf-8");
    }, [resolvedPlatform]);

    const handleUploadMission = useCallback(async function () {
      if (!window.MavlinkMission) {
        return;
      }
      const MV = window.MissionValidator;
      if (MV) {
        const issues = MV.validateMissionAsync
          ? await MV.validateMissionAsync(missionWaypoints, resolvedPlatform, {
              settings: settings,
              surveyBlocks: surveyBlocks
            })
          : MV.validateMission(missionWaypoints, resolvedPlatform, { settings: settings });
        setValidationIssues(issues);
        if (MV.hasBlockingErrors(issues)) {
          setMissionIoNote("任务校验未通过，请修正后再写入飞控");
          if (typeof log === "function") {
            log("❌ 航线校验未通过，已阻止写入飞控");
          }
          return;
        }
        const TM = window.TerrainMavlink;
        if (settings.useTerrainFollowing && TM && TM.checkTerrainParamsBeforeUpload) {
          const tp = TM.checkTerrainParamsBeforeUpload(resolvedPlatform);
          (tp.issues || []).forEach(function (issue) {
            if (typeof log === "function") {
              const icon = issue.level === "error" ? "❌" : issue.level === "warning" ? "⚠️" : "ℹ️";
              log(icon + " " + issue.message);
            }
          });
          if (tp.blocking) {
            setMissionIoNote("地形飞控参数未就绪，请修正后再写入飞控");
            if (typeof log === "function") {
              log("❌ 地形飞控参数校核未通过，已阻止写入飞控");
            }
            return;
          }
        } else if (settings.useTerrainFollowing && TM && TM.checkTerrainEnableBeforeUpload) {
          const te = TM.checkTerrainEnableBeforeUpload();
          if (te.warning && typeof log === "function") {
            log("⚠️ " + te.warning);
          }
        }
      }
      const total = missionWaypoints.length;
      setMissionIoBusy(true);
      setMissionIoProgress({
        mode: "upload",
        current: 0,
        total: total,
        indeterminate: total <= 0,
        label: "正在写入飞控…"
      });
      setMissionIoNote("正在写入飞控…");
      try {
        let uploadList = missionWaypoints;
        const FWP = window.FixedWingParams;
        if (FWP && FWP.normalizeWaypointsForPlatform) {
          uploadList = FWP.normalizeWaypointsForPlatform(uploadList, resolvedPlatform);
        }
        await window.MavlinkMission.uploadMission(uploadList, function (cur, tot) {
          const isLast = cur >= tot;
          if (!isLast && tot > 8 && cur % 3 !== 0) {
            return;
          }
          setMissionIoProgress({
            mode: "upload",
            current: cur,
            total: tot,
            indeterminate: false,
            label: "写入航点 " + cur + " / " + tot
          });
          setMissionIoNote("写入航点 " + cur + " / " + tot);
        });
        setMissionIoNote("任务已写入飞控");
        if (typeof log === "function") {
          log("✅ 航线已写入飞控");
        }
      } catch (err) {
        const msg = err.message || "写入失败";
        setMissionIoNote(msg);
        if (typeof log === "function") {
          log("❌ 写入航线失败: " + msg);
          if (/超时|MISSION_ACK|心跳/.test(msg)) {
            log("💡 请确认：1) 串口已连接且未被 MP/QGC 占用 2) 控制台无大量 CRC 错误 3) 可尝试提高波特率后重连");
          }
        }
      } finally {
        setMissionIoBusy(false);
        setMissionIoProgress(null);
      }
    }, [missionWaypoints, resolvedPlatform, settings, surveyBlocks]);

    const handleDownloadMission = useCallback(async function () {
      if (!window.MavlinkMission) {
        return;
      }
      setMissionIoBusy(true);
      setMissionIoProgress({
        mode: "download",
        current: 0,
        total: 0,
        indeterminate: true,
        label: "正在连接飞控任务…"
      });
      setMissionIoNote("正在读取飞控任务…");
      try {
        const list = await window.MavlinkMission.downloadMission(function (cur, tot) {
          const isLast = cur >= tot;
          if (!isLast && tot > 8 && cur % 3 !== 0) {
            return;
          }
          setMissionIoProgress({
            mode: "download",
            current: cur,
            total: tot,
            indeterminate: false,
            label: "读取航点 " + cur + " / " + tot
          });
          setMissionIoNote("读取航点 " + cur + " / " + tot);
        });
        setMissionWaypoints(list);
        missionBootstrappedRef.current = true;
        setMissionIoNote("已读取 " + list.length + " 个航点");
        if (typeof log === "function") {
          log("✅ 已从飞控读取 " + list.length + " 个航点");
        }
      } catch (err) {
        setMissionIoNote(err.message || "读取失败");
        if (typeof log === "function") {
          log("❌ 读取航线失败: " + (err.message || err));
        }
      } finally {
        setMissionIoBusy(false);
        setMissionIoProgress(null);
      }
    }, []);

    const lineSpacing = round(
      computeLineSpacingMeters(settings.sideOverlap, settings.footprintWidthMeters),
      2
    );
    const gpsFix = Number(window.gps_fix_type) || 0;
    const missionCurrent = Number.isFinite(Number(window.wp_current))
      ? Number(window.wp_current) + 1
      : null;
    const liveAltitude = Number.isFinite(Number(window.altitude))
      ? Math.round(Number(window.altitude))
      : null;
    const liveGroundspeed = Number.isFinite(Number(window.groundspeed))
      ? round(Number(window.groundspeed), 1)
      : null;
    const surveyReady = surveyArea.length >= 3 && surveyPath.length > 0;
    const connectionSummary = connected ? "飞控在线" : "未连接飞控";
    const planningSummary =
      activeTab === "survey"
        ? surveyReady
          ? "区域可生成航测航线"
          : "至少 3 个顶点后可生成航线"
        : missionWaypoints.length
          ? "可直接写入飞控或导出"
          : "点击地图开始添加航点";

    const e = window.React.createElement;

    const adjustOverlapPercent = useCallback(
      function (key, delta) {
        const base =
          overlapEditKey === key && overlapEditText !== ""
            ? Number(overlapEditText)
            : overlapFractionToPercent(settings[key]);
        const nextPercent = clamp(
          Math.round(Number.isFinite(base) ? base : overlapFractionToPercent(settings[key])) +
            delta,
          OVERLAP_PERCENT_MIN,
          OVERLAP_PERCENT_MAX
        );
        handleSettingChange(key, String(nextPercent), true, { asPercent: true });
        setOverlapEditKey(null);
        setOverlapEditText("");
      },
      [handleSettingChange, overlapEditKey, overlapEditText, settings]
    );

    function renderOverlapPercentField(key, id, label) {
      const displayValue =
        overlapEditKey === key ? overlapEditText : formatOverlapPercentDisplay(settings[key]);

      return e(
        "div",
        { className: "fp-field fp-field-overlap-percent" },
        e("label", { htmlFor: id }, label),
        e(
          "div",
          { className: "fp-percent-stepper" },
          e("input", {
            id: id,
            className: "fp-percent-stepper-input",
            type: "text",
            inputMode: "numeric",
            autoComplete: "off",
            value: displayValue,
            onFocus: function () {
              setOverlapEditKey(key);
              setOverlapEditText(formatOverlapPercentDisplay(settings[key]));
            },
            onChange: function (event) {
              const text = event.target.value;
              if (!isValidOverlapPercentDraft(text)) {
                return;
              }
              setOverlapEditKey(key);
              setOverlapEditText(text);
              if (text !== "") {
                const percent = Number(text);
                if (percent >= OVERLAP_PERCENT_MIN && percent <= OVERLAP_PERCENT_MAX) {
                  handleSettingChange(key, text, true, { asPercent: true });
                }
              }
            },
            onBlur: function () {
              if (overlapEditKey !== key) {
                return;
              }
              if (overlapEditText === "") {
                setOverlapEditKey(null);
                setOverlapEditText("");
                return;
              }
              const percent = parseOverlapPercentInput(overlapEditText);
              if (
                !Number.isFinite(percent) ||
                percent < OVERLAP_PERCENT_MIN ||
                percent > OVERLAP_PERCENT_MAX
              ) {
                setOverlapEditKey(null);
                setOverlapEditText("");
                return;
              }
              handleSettingChange(key, String(Math.round(percent)), true, { asPercent: true });
              setOverlapEditKey(null);
              setOverlapEditText("");
            }
          }),
          e(
            "div",
            { className: "fp-percent-stepper-controls" },
            e(
              "button",
              {
                type: "button",
                className: "fp-percent-stepper-btn",
                "aria-label": label + " 增加 1%",
                tabIndex: -1,
                onMouseDown: function (event) {
                  event.preventDefault();
                },
                onClick: function () {
                  adjustOverlapPercent(key, 1);
                }
              },
              "+"
            ),
            e(
              "button",
              {
                type: "button",
                className: "fp-percent-stepper-btn",
                "aria-label": label + " 减少 1%",
                tabIndex: -1,
                onMouseDown: function (event) {
                  event.preventDefault();
                },
                onClick: function () {
                  adjustOverlapPercent(key, -1);
                }
              },
              "−"
            )
          )
        )
      );
    }

    function renderWaypointTab() {
      return e(
        window.React.Fragment,
        null,
        e(
          "section",
          { className: "fp-card" },
          e("h3", { className: "fp-card-title" }, "航点任务"),
          e(
            "p",
            { className: "fp-card-note" },
            "在地图上单击即可追加航点，左侧列表会同步显示坐标。"
          ),
          e(
            "div",
            { className: "fp-button-row" },
            e(
              "button",
              {
                type: "button",
                className: "fp-btn primary",
                onClick: handleFitMission
              },
              "缩放到任务范围"
            ),
            e(
              "button",
              {
                type: "button",
                className: "fp-btn",
                onClick: handleClearWaypoints
              },
              "清空航点"
            )
          )
        ),
        e(
          "section",
          { className: "fp-card" },
          e("h3", { className: "fp-card-title" }, "航点列表"),
          missionWaypoints.length
            ? e(
                "div",
                { className: "fp-survey-wp-table-wrap" },
                e(
                  "table",
                  { className: "fp-survey-wp-table fp-waypoint-table" },
                  e(
                    "thead",
                    null,
                    e(
                      "tr",
                      null,
                      e("th", { scope: "col" }, "航点"),
                      e("th", { scope: "col" }, "经度"),
                      e("th", { scope: "col" }, "纬度"),
                      e("th", { scope: "col" }, "高度"),
                      e("th", { scope: "col", className: "fp-wp-col-delete" }, "")
                    )
                  ),
                  e(
                    "tbody",
                    null,
                    missionWaypoints.map(function (waypoint, index) {
                      const isCamera = waypoint.source === "camera";
                      const title =
                        waypoint.label ||
                        (window.MissionModel
                          ? window.MissionModel.getDisplayTitle(waypoint, index)
                          : "WP" + (index + 1));
                      const canDelete = !waypoint.locked && !isCamera;
                      return e(
                        "tr",
                        {
                          key: "wp-" + index,
                          className: isCamera ? "fp-wp-row--camera" : ""
                        },
                        e("th", { scope: "row" }, title),
                        e(
                          "td",
                          { className: "fp-survey-wp-num" },
                          round(waypoint.lng, 6).toFixed(6)
                        ),
                        e(
                          "td",
                          { className: "fp-survey-wp-num" },
                          round(waypoint.lat, 6).toFixed(6)
                        ),
                        e(
                          "td",
                          { className: "fp-survey-wp-num" },
                          String(Math.round(Number(waypoint.alt) || 0))
                        ),
                        e(
                          "td",
                          { className: "fp-wp-col-delete" },
                          canDelete
                            ? e(
                                "button",
                                {
                                  type: "button",
                                  className: "fp-wp-delete-btn",
                                  title: "删除航点 " + (index + 1),
                                  "aria-label": "删除航点 " + (index + 1),
                                  onClick: function () {
                                    handleDeleteWaypoint(index);
                                  }
                                },
                                "×"
                              )
                            : e(
                                "span",
                                { className: "fp-wp-delete-placeholder", "aria-hidden": true },
                                "—"
                              )
                        )
                      );
                    })
                  )
                )
              )
            : e("div", { className: "fp-empty" }, "暂无航点，直接在地图上点击即可开始规划。")
        )
      );
    }

    function renderMissionIoProgressBar() {
      if (!missionIoProgress) {
        return null;
      }
      const current = Number(missionIoProgress.current) || 0;
      const total = Number(missionIoProgress.total) || 0;
      const percent =
        missionIoProgress.indeterminate || total <= 0
          ? 0
          : Math.min(100, Math.round((current / total) * 100));
      const progressText = missionIoProgress.indeterminate
        ? "获取任务数量…"
        : current + " / " + total;

      return e(
        "div",
        {
          className: "fp-mission-io-progress",
          role: "progressbar",
          "aria-valuemin": 0,
          "aria-valuemax": missionIoProgress.indeterminate ? 100 : total,
          "aria-valuenow": missionIoProgress.indeterminate ? undefined : current,
          "aria-label": missionIoProgress.label || "航线传输进度"
        },
        e(
          "div",
          { className: "fp-mission-io-progress-head" },
          e("span", { className: "fp-mission-io-progress-label" }, missionIoProgress.label),
          e("span", { className: "fp-mission-io-progress-text" }, progressText)
        ),
        e(
          "div",
          { className: "fp-mission-io-progress-bar-wrap" },
          e("div", {
            className:
              "fp-mission-io-progress-bar-fill" +
              (missionIoProgress.indeterminate ? " is-indeterminate" : ""),
            style: missionIoProgress.indeterminate ? undefined : { width: percent + "%" }
          })
        )
      );
    }

    function renderMissionIoCard() {
      return e(
        "section",
        { className: "fp-card fp-card-mission-io" },
        e("h3", { className: "fp-card-title" }, "航线文件与飞控"),
        renderMissionIoProgressBar(),
        missionIoNote && !missionIoProgress
          ? e("p", { className: "fp-card-note fp-mission-io-note" }, missionIoNote)
          : null,
        missionIoNote && missionIoProgress
          ? e("p", { className: "fp-card-note fp-mission-io-note fp-mission-io-note--sub" }, missionIoNote)
          : null,
        e("input", {
          ref: fileInputRef,
          type: "file",
          accept: ".waypoints,.txt",
          className: "fp-hidden-file",
          onChange: handleImportMissionFile
        }),
        e(
          "div",
          { className: "fp-button-row fp-button-row-wrap" },
          e(
            "button",
            {
              type: "button",
              className: "fp-btn",
              disabled: !missionWaypoints.length || missionIoBusy,
              onClick: handleSaveMissionFile
            },
            "保存航线"
          ),
          e(
            "button",
            {
              type: "button",
              className: "fp-btn",
              disabled: missionIoBusy,
              onClick: function () {
                if (fileInputRef.current) {
                  fileInputRef.current.click();
                }
              }
            },
            "导入航线"
          ),
          e(
            "button",
            {
              type: "button",
              className: "fp-btn primary",
              disabled: !connected || !missionWaypoints.length || missionIoBusy,
              onClick: handleUploadMission
            },
            "写入飞控"
          ),
          e(
            "button",
            {
              type: "button",
              className: "fp-btn",
              disabled: !connected || missionIoBusy,
              onClick: handleDownloadMission
            },
            "读取飞控"
          )
        ),
        visibleMissionValidationIssues.length
          ? e(
              "ul",
              { className: "fp-validation-list", "aria-label": "任务校验" },
              visibleMissionValidationIssues.map(function (issue, index) {
                return e(
                  "li",
                  {
                    key: issue.code + "-" + index,
                    className: "fp-validation-item fp-validation-item--" + issue.level
                  },
                  issue.message
                );
              })
            )
          : null
      );
    }

    function renderProfilePreviewModal() {
      if (!profilePreview) {
        return null;
      }
      const modalPaths = buildTerrainProfileSparklinePaths(
        profilePreview.profile,
        profilePreview.settings || settings,
        resolvedPlatform,
        { width: 960, height: 220, pad: 8 }
      );
      if (!modalPaths) {
        return null;
      }
      const stats = modalPaths.stats || {};
      const contentWidth = modalPaths.contentWidth;
      const contentHeight = modalPaths.contentHeight;
      const viewBox =
        profileViewBox ||
        ({ x: 0, y: 0, w: contentWidth, h: contentHeight });
      const viewBoxText = formatProfileViewBox(viewBox);

      function handleProfilePointerDown(event) {
        const stageRect = profileStageRef.current
          ? profileStageRef.current.getBoundingClientRect()
          : { left: 0, width: contentWidth };
        const series = modalPaths.series;
        const nearProbe =
          series &&
          Math.abs(
            event.clientX - profileProbeScreenX(profileProbeT, series, viewBox, stageRect)
          ) <= 12;
        profilePointerRef.current = {
          active: true,
          mode: nearProbe ? "probe" : "pan",
          x: event.clientX,
          y: event.clientY
        };
        if (profileStageRef.current) {
          profileStageRef.current.classList.toggle("is-probe-dragging", nearProbe);
          profileStageRef.current.classList.toggle("is-dragging", !nearProbe);
        }
        if (event.currentTarget && event.currentTarget.setPointerCapture) {
          event.currentTarget.setPointerCapture(event.pointerId);
        }
        event.preventDefault();
      }

      function handleProfilePointerMove(event) {
        const pointer = profilePointerRef.current;
        if (!pointer.active || !profileStageRef.current) {
          return;
        }
        if (pointer.mode === "probe" && modalPaths.series) {
          const stageRect = profileStageRef.current.getBoundingClientRect();
          setProfileProbeT(
            clientToProfileProbeT(event.clientX, stageRect, viewBox, modalPaths.series)
          );
          event.preventDefault();
          return;
        }
        const dx = event.clientX - pointer.x;
        const dy = event.clientY - pointer.y;
        pointer.x = event.clientX;
        pointer.y = event.clientY;
        const stageRect = profileStageRef.current.getBoundingClientRect();
        setProfileViewBox(function (previous) {
          return panProfileViewBox(
            previous || viewBox,
            contentWidth,
            contentHeight,
            stageRect,
            dx,
            dy
          );
        });
        event.preventDefault();
      }

      function handleProfilePointerUp(event) {
        profilePointerRef.current = { active: false, mode: "pan", x: 0, y: 0 };
        if (profileStageRef.current) {
          profileStageRef.current.classList.remove("is-dragging");
          profileStageRef.current.classList.remove("is-probe-dragging");
        }
        if (
          event.currentTarget &&
          event.currentTarget.releasePointerCapture &&
          event.pointerId != null
        ) {
          try {
            event.currentTarget.releasePointerCapture(event.pointerId);
          } catch (_) {
            /* ignore */
          }
        }
      }

      function handleProfileWheel(event) {
        if (!profileStageRef.current) {
          return;
        }
        const stageRect = profileStageRef.current.getBoundingClientRect();
        setProfileViewBox(function (previous) {
          return zoomProfileViewBox(
            previous || viewBox,
            contentWidth,
            contentHeight,
            stageRect,
            event.clientX,
            event.clientY,
            event.deltaY
          );
        });
        event.preventDefault();
      }

      const modalSparkline = renderTerrainProfileSparkline(e, modalPaths, {
        className: "fp-terrain-sparkline fp-terrain-sparkline--modal",
        viewBox: viewBoxText,
        ariaLabel: "地形剖面放大预览",
        probe: true,
        probeT: profileProbeT
      });

      return e(
        "div",
        {
          className: "fp-profile-modal",
          role: "dialog",
          "aria-modal": "true",
          "aria-labelledby": "fp-profile-modal-title",
          onClick: function (event) {
            if (event.target === event.currentTarget) {
              closeProfilePreview();
            }
          }
        },
        e(
          "div",
          { className: "fp-profile-modal-shell" },
          e(
            "div",
            { className: "fp-profile-modal-header" },
            e(
              "div",
              null,
              e(
                "h3",
                { id: "fp-profile-modal-title", className: "fp-profile-modal-title" },
                "地形剖面 · ",
                profilePreview.title || "测绘区域"
              ),
              e(
                "p",
                { className: "fp-profile-modal-subtitle" },
                "剖面 ",
                String(stats.pointCount || profilePreview.profile.length),
                " 点",
                stats.terrainMin != null && stats.terrainMax != null
                  ? " · 地形 " +
                    Math.round(stats.terrainMin) +
                    "–" +
                    Math.round(stats.terrainMax) +
                    " m"
                  : "",
                stats.showIdealLine &&
                  stats.idealAglMin != null &&
                  stats.idealAglMax != null
                  ? " · 理想 AGL " +
                    Math.round(stats.idealAglMin) +
                    "–" +
                    Math.round(stats.idealAglMax) +
                    " m"
                  : stats.aglMin != null && stats.aglMax != null
                    ? " · AGL " +
                      Math.round(stats.aglMin) +
                      "–" +
                      Math.round(stats.aglMax) +
                      " m"
                    : "",
                stats.showIdealLine &&
                  stats.feasibleAglMin != null &&
                  stats.feasibleAglMax != null
                  ? " · 可行 AGL " +
                    Math.round(stats.feasibleAglMin) +
                    "–" +
                    Math.round(stats.feasibleAglMax) +
                    " m"
                  : "",
                stats.feasibleSource === "solver" ? " · 按爬升率/空速重算" : ""
              )
            ),
            e(
              "button",
              {
                type: "button",
                className: "fp-profile-modal-close",
                onClick: closeProfilePreview,
                "aria-label": "关闭地形剖面预览"
              },
              "×"
            )
          ),
          e(
            "div",
            { className: "fp-profile-modal-toolbar" },
            e(
              "button",
              {
                type: "button",
                className: "fp-btn fp-btn--tiny",
                onClick: resetProfileViewBox
              },
              "重置视图"
            ),
            modalPaths.showIdealLine
              ? e(
                  "span",
                  { className: "fp-profile-legend" },
                  e(
                    "span",
                    { className: "fp-profile-legend-item fp-profile-legend-item--ideal" },
                    "理想"
                  ),
                  e(
                    "span",
                    { className: "fp-profile-legend-item fp-profile-legend-item--feasible" },
                    "可行"
                  )
                )
              : null,
            e(
              "span",
              { className: "fp-profile-modal-hint" },
              modalPaths.showIdealLine
                ? "琥珀虚线=理想 · 蓝实线=可行 · 拖竖线查高度 · 空白处拖拽平移 · 滚轮缩放"
                : "蓝实线=飞行高度 · 拖竖线查高度 · 空白处拖拽平移 · 滚轮缩放 · 红线=问题段"
            )
          ),
          e(
            "div",
            {
              ref: profileStageRef,
              className: "fp-profile-modal-stage",
              onPointerDown: handleProfilePointerDown,
              onPointerMove: handleProfilePointerMove,
              onPointerUp: handleProfilePointerUp,
              onPointerLeave: handleProfilePointerUp,
              onWheel: handleProfileWheel
            },
            modalSparkline
          )
        )
      );
    }

    function render3dPreviewModal() {
      if (!preview3dOpen) {
        return null;
      }
      const summary = preview3dData && preview3dData.summary ? preview3dData.summary : {};
      return e(
        "div",
        {
          className: "fp-preview3d-modal",
          role: "dialog",
          "aria-modal": "true",
          "aria-labelledby": "fp-preview3d-title",
          onClick: function (event) {
            if (event.target === event.currentTarget) {
              close3dPreview();
            }
          }
        },
        e(
          "div",
          { className: "fp-preview3d-shell" },
          e(
            "div",
            { className: "fp-preview3d-header" },
            e(
              "div",
              null,
              e(
                "h3",
                { id: "fp-preview3d-title", className: "fp-preview3d-title" },
                preview3dMode === "mission" ? "任务 3D 预览" : "规划中 3D 预览"
              ),
              e(
                "p",
                { className: "fp-preview3d-subtitle" },
                "段数 ",
                String(summary.segmentCount || 0),
                " · 航点 ",
                String(summary.waypointCount || 0),
                summary.terrainMin != null && summary.terrainMax != null
                  ? " · 地形 " +
                    Math.round(summary.terrainMin) +
                    "–" +
                    Math.round(summary.terrainMax) +
                    " m"
                  : "",
                summary.workAglMin != null && summary.workAglMax != null
                  ? " · 测线 AGL " +
                    Math.round(summary.workAglMin) +
                    "–" +
                    Math.round(summary.workAglMax) +
                    " m"
                  : summary.aglMin != null && summary.aglMax != null
                    ? " · AGL " +
                      Math.round(summary.aglMin) +
                      "–" +
                      Math.round(summary.aglMax) +
                      " m"
                    : ""
              )
            ),
            e(
              "button",
              {
                type: "button",
                className: "fp-preview3d-close",
                onClick: close3dPreview,
                "aria-label": "关闭 3D 预览"
              },
              "×"
            )
          ),
          e(
            "div",
            { className: "fp-preview3d-toolbar" },
            e(
              "div",
              { className: "fp-preview3d-toolbar-group" },
              e(
                "button",
                {
                  type: "button",
                  className: "fp-btn fp-btn--tiny" + (preview3dView === "top" ? " is-active" : ""),
                  onClick: function () {
                    setPreview3dView("top");
                  }
                },
                "俯视"
              ),
              e(
                "button",
                {
                  type: "button",
                  className: "fp-btn fp-btn--tiny" + (preview3dView === "iso" ? " is-active" : ""),
                  onClick: function () {
                    setPreview3dView("iso");
                  }
                },
                "等轴"
              ),
              e(
                "button",
                {
                  type: "button",
                  className: "fp-btn fp-btn--tiny" + (preview3dView === "side" ? " is-active" : ""),
                  onClick: function () {
                    setPreview3dView("side");
                  }
                },
                "侧视"
              )
            ),
            e(
              "div",
              { className: "fp-preview3d-toolbar-group fp-preview3d-toolbar-group--checks" },
              e(
                "label",
                { className: "fp-check-row fp-check-row--compact" },
                e("input", {
                  type: "checkbox",
                  checked: preview3dShowTerrain,
                  onChange: function (event) {
                    setPreview3dShowTerrain(event.target.checked);
                  }
                }),
                e("span", null, "显示地表/地图")
              ),
              e(
                "label",
                { className: "fp-check-row fp-check-row--compact" },
                e("input", {
                  type: "checkbox",
                  checked: preview3dShowConnectors,
                  onChange: function (event) {
                    setPreview3dShowConnectors(event.target.checked);
                  }
                }),
                e("span", null, "显示连接段")
              ),
              e(
                "label",
                { className: "fp-check-row fp-check-row--compact" },
                e("input", {
                  type: "checkbox",
                  checked: preview3dShowVerticals,
                  onChange: function (event) {
                    setPreview3dShowVerticals(event.target.checked);
                  }
                }),
                e("span", null, "显示高度参考线")
              )
            )
          ),
          preview3dError
            ? e("div", { className: "fp-preview3d-banner fp-preview3d-banner--error" }, preview3dError)
            : null,
          preview3dNotice
            ? e("div", { className: "fp-preview3d-banner fp-preview3d-banner--note" }, preview3dNotice)
            : null,
          e(
            "div",
            { className: "fp-preview3d-stage-wrap" },
            preview3dLoading
              ? e("div", { className: "fp-preview3d-loading" }, "正在准备 3D 预览…")
              : null,
            e("div", {
              ref: previewCesiumContainerRef,
              className: "fp-preview3d-cesium" + (cesiumPreviewEnabled ? " is-active" : "")
            }),
            e("canvas", {
              ref: previewThreeCanvasRef,
              className: "fp-preview3d-canvas",
              style: { display: cesiumPreviewEnabled ? "none" : "block" }
            }),
            e(
              "div",
              { className: "fp-preview3d-help" },
              "左键旋转，滚轮缩放，右键或按住 Shift 拖拽可平移。"
            )
          )
        )
      );
    }

    function renderSurveyTab() {
      const VT = window.VehicleTemplates;
      const platformOptions = VT ? VT.PLATFORM_OPTIONS : [];
      const MM = window.MissionModel;
      const terrainFrame =
        MM && MM.MAV_FRAME_GLOBAL_TERRAIN_ALT != null
          ? MM.MAV_FRAME_GLOBAL_TERRAIN_ALT
          : 10;
      const tableRows = [buildHomePreviewTableRow(missionWaypoints)].concat(
        missionWaypoints
          .map(function (wp, index) {
            const isSurvey =
              wp.source === "survey" || wp.source === "camera";
            const groundElev = surveyWaypointGroundElev[index];
            const isTerrainFrame = wp.frame === terrainFrame;
            return {
              key: "mwp-" + index,
              seq: index + 1,
              label:
                wp.label ||
                (MM ? MM.getDisplayTitle(wp, index) : "航点 " + (index + 1)),
              lng: wp.lng,
              lat: wp.lat,
              alt: wp.alt,
              frame: wp.frame,
              frameLabel: isTerrainFrame ? "10·AGL" : String(wp.frame != null ? wp.frame : "—"),
              agl: isTerrainFrame
                ? wp.alt
                : groundElev != null
                  ? wp.alt - groundElev
                  : null,
              amsl:
                groundElev != null
                  ? isTerrainFrame
                    ? groundElev + wp.alt
                    : wp.alt
                  : null,
              preview: false,
              isSurvey: isSurvey,
              missionIndex: index,
              canDelete: isSurvey || (!wp.locked && wp.source !== "camera")
            };
          })
          .concat(
            surveyCommitted
              ? []
              : surveyPreviewPoints.map(function (wp, previewIndex) {
                  const baseSeq = missionWaypoints.length + 1;
                  return {
                    key: "prev-" + previewIndex,
                    seq: baseSeq + previewIndex,
                    label: "测绘 " + (previewIndex + 1),
                    lng: wp.lng,
                    lat: wp.lat,
                    alt: wp.alt,
                    preview: true,
                    isSurvey: true
                  };
                })
          )
      );

      return e(
        window.React.Fragment,
        null,
        e(
          "section",
          { className: "fp-card" },
          e(
            "div",
            { className: "fp-inline-stats" },
            e(
              "div",
              { className: "fp-stat" },
              e("div", { className: "fp-stat-label" }, "区域顶点"),
              e("div", { className: "fp-stat-value" }, String(surveyArea.length))
            ),
            e(
              "div",
              { className: "fp-stat" },
              e("div", { className: "fp-stat-label" }, "测线间距"),
              e("div", { className: "fp-stat-value" }, lineSpacing + "m")
            ),
            e(
              "div",
              { className: "fp-stat" },
              e("div", { className: "fp-stat-label" }, "任务航点"),
              e("div", { className: "fp-stat-value" }, String(missionWaypoints.length))
            ),
            e(
              "div",
              { className: "fp-stat" },
              e("div", { className: "fp-stat-label" }, "测绘预览"),
              e("div", { className: "fp-stat-value" }, String(surveyPreviewPoints.length))
            ),
            e(
              "div",
              { className: "fp-stat fp-stat--control" },
              e(
                "div",
                { className: "fp-stat-label-wrap" },
                e("label", { className: "fp-stat-label", htmlFor: "fp-platform" }, "机型")
              ),
              e(
                "select",
                {
                  id: "fp-platform",
                  className: "fp-stat-select",
                  value: resolvedPlatform,
                  disabled: connected,
                  title: connected
                    ? "已连接飞控，机型由飞控参数自动判定"
                    : "未连接飞控时可手动选择机型",
                  onChange: function (event) {
                    handlePlatformChange(event.target.value);
                  }
                },
                platformOptions.map(function (opt) {
                  return e("option", { key: opt.id, value: opt.id }, opt.label);
                })
              )
            ),
            e(
              "div",
              { className: "fp-stat fp-stat--control" },
              e(
                "div",
                { className: "fp-stat-label-wrap" },
                e("label", { className: "fp-stat-label", htmlFor: "fp-survey-entry" }, "起始方向")
              ),
              e(
                "select",
                {
                  id: "fp-survey-entry",
                  className: "fp-stat-select",
                  value: settings.surveyEntryCorner,
                  onChange: function (event) {
                    handleSettingChange("surveyEntryCorner", event.target.value, true);
                  }
                },
                SURVEY_ENTRY_CORNER_OPTIONS.map(function (option) {
                  return e("option", { key: option.id, value: option.id }, option.label);
                })
              )
            )
          ),
          e(
            "div",
            { className: "fp-button-row", style: { marginTop: "12px" } },
            e(
              "button",
              {
                type: "button",
                className: "fp-btn accent",
                onClick: handleFitMission
              },
              "预览航测区域"
            ),
            e(
              "button",
              {
                type: "button",
                className: "fp-btn primary",
                disabled:
                  surveyArea.length < 3 ||
                  surveyCommitted ||
                  terrainPlanning ||
                  (!settings.useTerrainFollowing && !surveyPath.length),
                onClick: handleConfirmSurveyGenerate
              },
              surveyCommitted
                ? "已生成测绘航线"
                : settings.useTerrainFollowing && terrainPlanBlocks.length
                  ? "确认生成（" + terrainPlanBlocks.length + " 块）"
                  : settings.useTerrainFollowing
                    ? "确认生成地形航线"
                    : "确认生成测绘航线"
            ),
            settings.useTerrainFollowing
              ? e(
                  "button",
                  {
                    type: "button",
                    className: "fp-btn accent",
                    disabled: surveyArea.length < 3 || terrainPlanning,
                    onClick: handleAutoTerrainPlan
                  },
                  terrainPlanning
                    ? terrainPlanPhase === "prefetch"
                      ? "地形预取…"
                      : terrainPlanPhase === "planning"
                        ? "路径规划…"
                        : "自动规划中…"
                    : "自动规划"
                )
              : null,
            settings.useTerrainFollowing
              ? e(
                  "button",
                  {
                    type: "button",
                    className: "fp-btn accent",
                    disabled: surveyArea.length < 3 || terrainPlanning,
                    onClick: handleTerrainPartition,
                    title: "以地形可飞性为主、航时为软约束，沿 DEM 估计等高线走向切块（直线高程带近似，只切块不画线）"
                  },
                  terrainPlanning && terrainPartitionBlocks.length === 0
                    ? "切块中…"
                    : "智能切块"
                )
              : null,
            e(
              "button",
              {
                type: "button",
                className: "fp-btn",
                disabled: !surveyArea.length,
                onClick: handleClearSurvey
              },
              "清空区域"
            ),
            e(
              "button",
              {
                type: "button",
                className: "fp-btn",
                disabled: !surveyBlocks.length,
                onClick: handleDeleteLastSurveyBlock
              },
              "删除上一块区域"
            )
          ),
          surveyToast
            ? e("div", { className: "fp-toast", role: "status" }, surveyToast)
            : null,
          e(
            "div",
            { className: "fp-field-grid", style: { marginTop: "10px" } },
            e(
              "label",
              { className: "fp-check-row" },
              e("input", {
                type: "checkbox",
                checked: settings.useTerrainFollowing,
                onChange: function (event) {
                  handleSettingChange("useTerrainFollowing", event.target.checked, true);
                  if (!event.target.checked) {
                    setTerrainPlanBlocks([]);
                    setTerrainPlanIssues([]);
                  }
                }
              }),
              e("span", null, "用地形跟随规划航线（AGL / frame 10）")
            ),
            settings.useTerrainFollowing
              ? e(
                  window.React.Fragment,
                  null,
                  e(
                    "label",
                    { className: "fp-check-row" },
                    e("input", {
                      type: "checkbox",
                      checked: settings.terrainAutoPartition,
                      onChange: function (event) {
                        handleSettingChange("terrainAutoPartition", event.target.checked, true);
                      }
                    }),
                    e("span", null, "自动切块（高差+航时软约束，沿等高线方向）")
                  ),
                  e(
                    "label",
                    { className: "fp-check-row" },
                    e("input", {
                      type: "checkbox",
                      checked: settings.terrainPrefetchOnDraw,
                      onChange: function (event) {
                        handleSettingChange("terrainPrefetchOnDraw", event.target.checked, true);
                      }
                    }),
                    e("span", null, "画完测区自动预取地形")
                  ),
                  e(
                    "label",
                    { htmlFor: "fp-terrain-margin" },
                    "安全离地裕度 (m)"
                  ),
                  e("input", {
                    id: "fp-terrain-margin",
                    type: "number",
                    min: 0,
                    step: 5,
                    value: settings.terrainAgMarginM,
                    onChange: function (event) {
                      handleSettingChange("terrainAgMarginM", event.target.value, true);
                    }
                  }),
                  e(
                    "label",
                    { className: "fp-check-row" },
                    e("input", {
                      type: "checkbox",
                      checked: settings.terrainClimbSmoothing,
                      onChange: function (event) {
                        handleSettingChange("terrainClimbSmoothing", event.target.checked, true);
                      }
                    }),
                    e("span", null, "爬升率平滑（固定翼自动抬升/盘旋爬升）")
                  ),
                  e(
                    "label",
                    { htmlFor: "fp-terrain-climb" },
                    "最大爬升率 (m/s)"
                  ),
                  e("input", {
                    id: "fp-terrain-climb",
                    type: "number",
                    min: 0.5,
                    step: 0.5,
                    value: settings.terrainMaxClimbRateMps,
                    onChange: function (event) {
                      handleSettingChange("terrainMaxClimbRateMps", event.target.value, true);
                    }
                  }),
                  e(
                    "label",
                    { htmlFor: "fp-terrain-descent" },
                    "最大下降率 (m/s)"
                  ),
                  e("input", {
                    id: "fp-terrain-descent",
                    type: "number",
                    min: 0.5,
                    step: 0.5,
                    value: settings.terrainMaxDescentRateMps,
                    onChange: function (event) {
                      handleSettingChange("terrainMaxDescentRateMps", event.target.value, true);
                    }
                  }),
                  e(
                    "label",
                    { htmlFor: "fp-terrain-maxagl" },
                    "自动抬升 AGL 上限 (m)"
                  ),
                  e("input", {
                    id: "fp-terrain-maxagl",
                    type: "number",
                    min: 30,
                    step: 10,
                    value: settings.terrainMaxAglM,
                    onChange: function (event) {
                      handleSettingChange("terrainMaxAglM", event.target.value, true);
                    }
                  }),
                  e(
                    "label",
                    { htmlFor: "fp-terrain-relief" },
                    "切块高差上限 (m)"
                  ),
                  e("input", {
                    id: "fp-terrain-relief",
                    type: "number",
                    min: 20,
                    step: 10,
                    value: settings.terrainMaxReliefM,
                    onChange: function (event) {
                      handleSettingChange("terrainMaxReliefM", event.target.value, true);
                    }
                  }),
                  e(
                    "label",
                    { htmlFor: "fp-terrain-sortie" },
                    "单架次航时上限 (min)"
                  ),
                  e("input", {
                    id: "fp-terrain-sortie",
                    type: "number",
                    min: 10,
                    step: 5,
                    value: settings.terrainMaxSortieMin,
                    onChange: function (event) {
                      handleSettingChange("terrainMaxSortieMin", event.target.value, true);
                    }
                  })
                )
              : null,
            e(
              "label",
              { className: "fp-check-row" },
              e("input", {
                type: "checkbox",
                checked: settings.surveyHeadingAuto,
                onChange: function (event) {
                  handleSettingChange("surveyHeadingAuto", event.target.checked, true);
                }
              }),
              e(
                "span",
                null,
                settings.useTerrainFollowing
                  ? "自动优选主航向（航程 + 地形起伏）"
                  : "自动优选主航向（最短航程）"
              )
            ),
            e(
              "label",
              { htmlFor: "fp-survey-heading" },
              "主航向 (°)",
              e(
                "span",
                { className: "fp-field-hint" },
                autoSurveyHeadingHint
              )
            ),
            e("input", {
              id: "fp-survey-heading",
              type: "number",
              min: 0,
              max: 359,
              step: 1,
              disabled: settings.surveyHeadingAuto,
              title: "真北 0°，顺时针，东 90°（与切块/侧线方向一致）",
              value:
                settings.surveyHeadingDeg == null ? "" : String(settings.surveyHeadingDeg),
              onChange: function (event) {
                handleSettingChange("surveyHeadingDeg", event.target.value, false);
              },
              onBlur: function (event) {
                handleSettingChange("surveyHeadingDeg", event.target.value, true);
              }
            })
          ),
          settings.useTerrainFollowing
            ? (function () {
                const healthInfo = terrainHealth && terrainHealth.health ? terrainHealth.health : null;
                const serviceStatus = terrainHealth ? terrainHealth.status : "idle";
                const serviceReady = serviceStatus === "online";
                const serviceTone =
                  serviceStatus === "online"
                    ? "ok"
                    : serviceStatus === "online-empty"
                      ? "warn"
                      : serviceStatus === "offline"
                        ? "error"
                        : "pending";
                let serviceLabel = "检测中…";
                if (terrainHealth) {
                  if (serviceStatus === "online") {
                    serviceLabel =
                      "在线（缓存 " + ((healthInfo && healthInfo.cachedTerrainTiles) || 0) + " 瓦片）";
                  } else if (serviceStatus === "online-empty") {
                    serviceLabel = "在线（无地形缓存，请预取或自动规划）";
                  } else if (serviceStatus === "checking" && terrainHealth.lastError && terrainHealth.lastOkAt) {
                    serviceLabel = "检测中（最近一次检查失败，正在重试）";
                  } else if (serviceStatus === "checking" || serviceStatus === "idle") {
                    serviceLabel = "检测中…";
                  } else {
                    serviceLabel = "离线（请启动本地瓦片服务 :8768）";
                  }
                }
                const prefetchDisplay = formatTerrainPrefetchStatus(terrainPrefetchStatus);
                const hasTerrainPolygon = terrainSurveyPolygon.length >= 3;
                const prefetchRunning = !!(terrainPrefetchStatus && terrainPrefetchStatus.running);
                const prefetchPct =
                  terrainPrefetchStatus && terrainPrefetchStatus.total > 0
                    ? Math.min(
                        100,
                        Math.round(
                          ((terrainPrefetchStatus.done || 0) /
                            terrainPrefetchStatus.total) *
                            100
                        )
                      )
                    : prefetchRunning
                      ? 5
                      : 0;
                void terrainGridStatusRevision;
                const gridDisplay = getTerrainGridStatusLabel();
                return e(
                  "div",
                  { className: "fp-terrain-panel" },
                  e("div", { className: "fp-terrain-panel-title" }, "地形跟随状态"),
                  (function () {
                    const degraded = (terrainPlanIssues || []).find(function (i) {
                      return i && i.code === "terrain_prefetch_degraded";
                    });
                    return degraded
                      ? e(
                          "div",
                          {
                            className: "fp-validation-item fp-validation-item--warning",
                            style: {
                              marginBottom: "6px",
                              fontWeight: 600,
                              borderLeft: "3px solid #f0a020",
                              paddingLeft: "8px"
                            }
                          },
                          "⚠️ 地形已降级规划：" + degraded.message
                        )
                      : null;
                  })(),
                  terrainPlanProgressMessage || terrainPlanning
                    ? e(
                        "div",
                        { className: "fp-terrain-plan-progress" },
                        terrainPlanProgressMessage || "自动规划进行中…"
                      )
                    : null,
                  e(
                    "div",
                    { className: "fp-terrain-status-row" },
                    e("span", { className: "fp-terrain-status-label" }, "高程服务"),
                    e(
                      "span",
                      {
                        className:
                          "fp-terrain-status-value fp-terrain-status-value--" + serviceTone
                      },
                      serviceLabel
                    )
                  ),
                  e(
                    "div",
                    { className: "fp-terrain-status-row" },
                    e("span", { className: "fp-terrain-status-label" }, "地形预取"),
                    e(
                      "span",
                      {
                        className:
                          "fp-terrain-status-value fp-terrain-status-value--" +
                          prefetchDisplay.tone
                      },
                      prefetchDisplay.label
                    )
                  ),
                  prefetchRunning || terrainPrefetchBusy
                    ? e(
                        "div",
                        { className: "fp-terrain-prefetch-bar-wrap" },
                        e("div", {
                          className: "fp-terrain-prefetch-bar",
                          style: { width: prefetchPct + "%" },
                          role: "progressbar",
                          "aria-valuenow": prefetchPct,
                          "aria-valuemin": 0,
                          "aria-valuemax": 100
                        })
                      )
                    : null,
                  terrainPrefetchEstimate && terrainPrefetchEstimate.total
                    ? e(
                        "div",
                        { className: "fp-terrain-status-row fp-terrain-status-row--note" },
                        "预估约 " + terrainPrefetchEstimate.total + " 个 SRTM 瓦片"
                      )
                    : null,
                  hasTerrainPolygon
                    ? e(
                        "div",
                        { className: "fp-terrain-prefetch-actions" },
                        e(
                          "button",
                          {
                            type: "button",
                            className: "fp-btn fp-btn--tiny",
                            disabled: terrainPrefetchBusy || terrainPlanning,
                            onClick: handleManualTerrainPrefetch
                          },
                          terrainPrefetchBusy ? "预取中…" : "立即预取测区"
                        ),
                        prefetchRunning
                          ? e(
                              "button",
                              {
                                type: "button",
                                className: "fp-btn fp-btn--tiny",
                                onClick: handleCancelTerrainPrefetch
                              },
                              "停止"
                            )
                          : null
                      )
                    : null,
                  e(
                    "div",
                    { className: "fp-terrain-status-row" },
                    e("span", { className: "fp-terrain-status-label" }, "TERRAIN_ENABLE"),
                    e(
                      "span",
                      {
                        className:
                          "fp-terrain-status-value fp-terrain-status-value--" +
                          terrainFcEnableStatus.tone
                      },
                      terrainFcEnableStatus.label
                    )
                  ),
                  e(
                    "div",
                    { className: "fp-terrain-status-row" },
                    e("span", { className: "fp-terrain-status-label" }, "TERRAIN_DATA"),
                    e(
                      "span",
                      {
                        className:
                          "fp-terrain-status-value fp-terrain-status-value--" + gridDisplay.tone
                      },
                      gridDisplay.label
                    )
                  ),
                  terrainFcParamIssues.length
                    ? e(
                        "ul",
                        {
                          className: "fp-validation-list fp-terrain-validation-list",
                          "aria-label": "地形飞控参数校核"
                        },
                        terrainFcParamIssues.map(function (issue, index) {
                          return e(
                            "li",
                            {
                              key: issue.code + "-fcparam-" + index,
                              className:
                                "fp-validation-item fp-validation-item--" +
                                (issue.level || "warning")
                            },
                            issue.message
                          );
                        })
                      )
                    : null,
                  hasTerrainPolygon
                    ? surveyAreaStatsLoading
                      ? e(
                          "div",
                          { className: "fp-terrain-status-row fp-terrain-status-row--note" },
                          terrainSurveyFromCommitted
                            ? "已确认测区高程统计计算中…"
                            : "测区高程统计计算中…"
                        )
                      : surveyAreaTerrainStats &&
                          surveyAreaTerrainStats.min != null &&
                          surveyAreaTerrainStats.max != null
                        ? e(
                            "div",
                            { className: "fp-terrain-status-row fp-terrain-status-row--note" },
                            (terrainSurveyFromCommitted ? "已确认测区 " : "测区 ") +
                              "高程 " +
                              Math.round(surveyAreaTerrainStats.min) +
                              "–" +
                              Math.round(surveyAreaTerrainStats.max) +
                              " m，高差约 " +
                              Math.round(surveyAreaTerrainStats.relief || 0) +
                              " m"
                          )
                        : serviceReady
                          ? e(
                              "div",
                              { className: "fp-terrain-status-row fp-terrain-status-row--note" },
                              terrainSurveyFromCommitted
                                ? "已确认测区暂无高程样本（请检查测区范围）。"
                                : "暂无高程样本（请检查测区范围）。"
                            )
                          : null
                    : e(
                        "div",
                        { className: "fp-terrain-hint" },
                        "请先绘制测区多边形（≥3 顶点）。"
                      ),
                  surveyArea.length >= 3 &&
                  !terrainPlanBlocks.length &&
                  !terrainPlanning &&
                  !surveyCommitted
                    ? e(
                        "div",
                        { className: "fp-terrain-hint" },
                        "测区已就绪，可直接点「确认生成地形航线」；如需先看切块和剖面校核，再点「自动规划」。"
                      )
                    : null,
                  terrainSurveyFromCommitted && !terrainPlanBlocks.length && !terrainPlanning
                    ? e(
                        "div",
                        { className: "fp-terrain-hint" },
                        "区域已确认。若高度未按地形调整，请对下方区域点「重算」或重新自动规划。"
                      )
                    : null,
                  terrainValidationIssues.length
                    ? e(
                        "ul",
                        {
                          className: "fp-validation-list fp-terrain-validation-list",
                          "aria-label": "地形校核"
                        },
                        terrainValidationIssues.map(function (issue, index) {
                          return e(
                            "li",
                            {
                              key: issue.code + "-terrain-" + index,
                              className:
                                "fp-validation-item fp-validation-item--" + (issue.level || "warning")
                            },
                            issue.message
                          );
                        })
                      )
                    : null
                );
              })()
            : null,
          summarizeBlockTerrainIssues(terrainPlanIssues).filter(shouldDisplayTerrainIssue).length
            ? e(
                "div",
                { className: "fp-validation-list", style: { marginTop: "8px" } },
                summarizeBlockTerrainIssues(terrainPlanIssues)
                  .filter(shouldDisplayTerrainIssue)
                  .map(function (issue, idx) {
                  return e(
                    "div",
                    {
                      key: "tpi-" + idx,
                      className:
                        "fp-validation-item fp-validation-item--" + (issue.level || "warning")
                    },
                    issue.message
                  );
                })
              )
            : null,
          terrainPartitionBlocks.length
            ? e(
                "div",
                { className: "fp-block-list", style: { marginTop: "8px" } },
                e(
                  "div",
                  { className: "fp-block-list-title" },
                  "智能切块预览 (" + terrainPartitionBlocks.length + " 块)"
                ),
                e(
                  "div",
                  { className: "fp-card-note" },
                  "切块界线平行于 DEM 估计等高线走向（直线高程带近似）· 软约束 ≤ " +
                    (Number(settings.terrainMaxSortieMin) || 60) +
                    " min/架次 · 点击块可选中后合并" +
                    (terrainPartitionBlocks[0] &&
                    terrainPartitionBlocks[0].contourHeadingDeg != null
                      ? " · 侧线约 " +
                        Math.round(terrainPartitionBlocks[0].contourHeadingDeg) +
                        "°（真北 0°，东 90°）"
                      : "")
                ),
                e(
                  "div",
                  { className: "fp-survey-actions", style: { marginTop: "6px" } },
                  e(
                    "button",
                    {
                      type: "button",
                      className: "fp-btn fp-btn--tiny",
                      disabled: partitionSelection.length < 2,
                      onClick: handleMergeSelectedPartitions
                    },
                    "合并所选 (" + partitionSelection.length + ")"
                  ),
                  e(
                    "button",
                    {
                      type: "button",
                      className: "fp-btn fp-btn--tiny primary",
                      disabled: !terrainPartitionBlocks.length || terrainPlanning,
                      onClick: handleConfirmPartition
                    },
                    "确认切块"
                  ),
                  e(
                    "button",
                    {
                      type: "button",
                      className: "fp-btn fp-btn--tiny",
                      onClick: handleClearPartition
                    },
                    "清空切块"
                  )
                ),
                terrainPartitionBlocks.map(function (block, idx) {
                  const selected = partitionSelection.indexOf(idx) !== -1;
                  return e(
                    "div",
                    { key: block.id || "tpart-" + idx, className: "fp-block-item-wrap" },
                    e(
                      "div",
                      {
                        className:
                          "fp-block-item" + (selected ? " fp-block-item--selected" : ""),
                        style: { cursor: "pointer" },
                        onClick: function () {
                          handlePartitionBlockClick(idx);
                        }
                      },
                      e(
                        "span",
                        null,
                        "块 " +
                          (idx + 1) +
                          " · 高差 " +
                          Math.round(block.relief || 0) +
                          " m · ~" +
                          Math.round(block.estMinutes || 0) +
                          " min" +
                          (block.overSortie ? " · 航时超限" : "")
                      ),
                      e(
                        "span",
                        { className: "fp-block-item-actions" },
                        e(
                          "button",
                          {
                            type: "button",
                            className: "fp-btn fp-btn--tiny",
                            disabled: terrainPlanning,
                            onClick: function (event) {
                              event.stopPropagation();
                              handleResplitPartitionBlock(idx);
                            }
                          },
                          "再切"
                        ),
                        e(
                          "button",
                          {
                            type: "button",
                            className: "fp-btn fp-btn--tiny",
                            onClick: function (event) {
                              event.stopPropagation();
                              handleDeletePartitionBlock(idx);
                            }
                          },
                          "删除"
                        )
                      )
                    )
                  );
                }),
                (terrainPartitionIssues || []).length
                  ? e(
                      "div",
                      { className: "fp-card-note", style: { marginTop: "6px" } },
                      (terrainPartitionIssues || [])
                        .map(function (i) {
                          return i.message;
                        })
                        .join("；")
                    )
                  : null
              )
            : null,
          terrainPlanBlocks.length
            ? e(
                "div",
                { className: "fp-block-list", style: { marginTop: "8px" } },
                e(
                  "div",
                  { className: "fp-block-list-title" },
                  "自动规划预览 (" + terrainPlanBlocks.length + " 块)"
                ),
                terrainPlanStats
                  ? e(
                      "div",
                      { className: "fp-card-note" },
                      "高程 " +
                        (terrainPlanStats.min != null ? Math.round(terrainPlanStats.min) : "?") +
                        "–" +
                        (terrainPlanStats.max != null ? Math.round(terrainPlanStats.max) : "?") +
                        " m，高差约 " +
                        Math.round(terrainPlanStats.relief || 0) +
                        " m"
                    )
                  : null,
                terrainPlanBlocks.map(function (block, idx) {
                  const prof = block.previewProfile || [];
                  const maxClimb = (block.previewIssues || []).some(function (i) {
                    return i.level === "error";
                  });
                  const sparklineRow =
                    prof.length >= 2
                      ? renderTerrainProfileSparklineRow(e, {
                          profile: prof,
                          settings: settings,
                          platform: resolvedPlatform,
                          title: "块 " + (idx + 1),
                          onExpand: openProfilePreview
                        })
                      : null;
                  return e(
                    "div",
                    { key: "tpb-" + idx, className: "fp-block-item-wrap" },
                    e(
                      "div",
                      { className: "fp-block-item" },
                      e(
                        "span",
                        null,
                        "块 " +
                          (idx + 1) +
                          " · " +
                          (block.previewPath ? block.previewPath.length : 0) +
                          " 路径点" +
                          (maxClimb ? " · 校核未通过" : "")
                      ),
                      prof.length
                        ? e(
                            "span",
                            { className: "fp-field-hint" },
                            "剖面 " + prof.length + " 点 · 红线=问题段"
                          )
                        : null
                    ),
                    sparklineRow
                  );
                }),
                e(
                  "button",
                  {
                    type: "button",
                    className: "fp-btn fp-btn--tiny",
                    style: { marginTop: "6px" },
                    onClick: handleAnalyzeTerrainPlan
                  },
                  "分析规划（LLM）"
                ),
                terrainAdvisorText
                  ? e(
                      "div",
                      { className: "fp-card-note", style: { marginTop: "6px", whiteSpace: "pre-wrap" } },
                      terrainAdvisorText
                    )
                  : null
              )
            : null,
          surveyBlocks.length
            ? e(
                "div",
                { className: "fp-block-list", style: { marginTop: "12px" } },
                e("div", { className: "fp-block-list-title" }, "已确认区域 (" + surveyBlocks.length + ")"),
                surveyBlocks.map(function (block) {
                  const prof = block.storedProfile || [];
                  const sparklineRow =
                    prof.length >= 2
                      ? renderTerrainProfileSparklineRow(e, {
                          profile: prof,
                          settings: block.paramsSnapshot || settings,
                          platform: resolvedPlatform,
                          title: "区域 " + (block.order + 1),
                          onExpand: openProfilePreview
                        })
                      : null;
                  return e(
                    "div",
                    { key: block.id, className: "fp-block-item-wrap" },
                    e(
                      "div",
                      { className: "fp-block-item" },
                      e(
                        "span",
                        null,
                        "区域 " +
                          (block.order + 1) +
                          " · " +
                          (block.needsPlanning
                            ? "待规划（高差 " +
                              Math.round(block.partitionRelief || 0) +
                              " m · ~" +
                              Math.round(block.partitionEstMinutes || 0) +
                              " min）"
                            : (block.waypointCount || 0) +
                              " 航点" +
                              (block.terrainPlanned ? " · 地形已校核" : ""))
                      ),
                      block.needsPlanning
                        ? e(
                            "button",
                            {
                              type: "button",
                              className: "fp-btn fp-btn--tiny primary",
                              disabled: terrainPlanning,
                              onClick: function () {
                                handlePlanSurveyBlock(block.id);
                              }
                            },
                            "规划航线"
                          )
                        : block.legacy
                          ? null
                          : e(
                              "button",
                              {
                                type: "button",
                                className: "fp-btn fp-btn--tiny",
                                disabled: terrainPlanning,
                                onClick: function () {
                                  handleRecalcSurveyBlock(block.id);
                                }
                              },
                              "重算"
                            )
                    ),
                    sparklineRow
                  );
                })
              )
            : null,
          e(
            "label",
            { className: "fp-check-row", style: { marginTop: "10px" } },
            e("input", {
              type: "checkbox",
              checked: appendRtl,
              onChange: function (event) {
                handleAppendRtlChange(event.target.checked);
              }
            }),
            e("span", null, "规划完成后追加 RTL 返航")
          )
        ),
        e(
          "section",
          { className: "fp-card" },
          e("h3", { className: "fp-card-title" }, "航点预览"),
          tableRows.length
            ? e(
                "div",
                { className: "fp-survey-wp-table-wrap" },
                e(
                  "table",
                  { className: "fp-survey-wp-table" },
                  e(
                    "thead",
                    null,
                    e(
                      "tr",
                      null,
                      e("th", { scope: "col", className: "fp-survey-wp-col-seq" }, "序号"),
                      e("th", { scope: "col" }, "航点"),
                      e("th", { scope: "col" }, "经度"),
                      e("th", { scope: "col" }, "纬度"),
                      settings.useTerrainFollowing
                        ? e("th", { scope: "col" }, "帧")
                        : null,
                      e("th", { scope: "col" }, settings.useTerrainFollowing ? "AGL(m)" : "高度"),
                      settings.useTerrainFollowing
                        ? e("th", { scope: "col" }, "AMSL(m)")
                        : null,
                      e("th", { scope: "col", className: "fp-wp-col-delete" }, "")
                    )
                  ),
                  e(
                    "tbody",
                    null,
                    tableRows.map(function (waypoint) {
                      const rowClass = waypoint.isHome
                        ? "fp-survey-wp-row--home"
                        : waypoint.isSurvey
                          ? "fp-survey-wp-row--survey"
                          : waypoint.preview
                            ? "fp-survey-wp-row--preview"
                            : "";
                      const aglDisplay =
                        waypoint.agl != null && Number.isFinite(waypoint.agl)
                          ? String(Math.round(waypoint.agl))
                          : waypoint.isHome || !waypoint.isSurvey
                            ? "—"
                            : String(Math.round(Number(waypoint.alt) || 0));
                      const amslDisplay =
                        waypoint.amsl != null && Number.isFinite(waypoint.amsl)
                          ? String(Math.round(waypoint.amsl))
                          : "—";
                      return e(
                        "tr",
                        {
                          key: waypoint.key,
                          className: rowClass
                        },
                        e(
                          "td",
                          { className: "fp-survey-wp-seq fp-survey-wp-num" },
                          String(waypoint.seq)
                        ),
                        e("th", { scope: "row" }, waypoint.label),
                        e("td", { className: "fp-survey-wp-num" }, round(waypoint.lng, 6).toFixed(6)),
                        e("td", { className: "fp-survey-wp-num" }, round(waypoint.lat, 6).toFixed(6)),
                        settings.useTerrainFollowing
                          ? e(
                              "td",
                              { className: "fp-survey-wp-num" },
                              waypoint.frameLabel || "—"
                            )
                          : null,
                        e(
                          "td",
                          { className: "fp-survey-wp-num" },
                          settings.useTerrainFollowing
                            ? aglDisplay
                            : String(Math.round(Number(waypoint.alt) || 0))
                        ),
                        settings.useTerrainFollowing
                          ? e("td", { className: "fp-survey-wp-num" }, amslDisplay)
                          : null,
                        e(
                          "td",
                          { className: "fp-wp-col-delete" },
                          waypoint.preview
                            ? null
                            : waypoint.canDelete
                              ? e(
                                  "button",
                                  {
                                    type: "button",
                                    className: "fp-wp-delete-btn",
                                    title: "删除航点 " + waypoint.seq,
                                    "aria-label": "删除航点 " + waypoint.seq,
                                    onClick: function () {
                                      handleDeletePreviewWaypoint(waypoint.missionIndex);
                                    }
                                  },
                                  "×"
                                )
                              : e(
                                  "span",
                                  { className: "fp-wp-delete-placeholder", "aria-hidden": true },
                                  "—"
                                )
                        )
                      );
                    })
                  )
                )
              )
            : e(
                "div",
                { className: "fp-empty" },
                "至少需要 3 个区域顶点才能生成航点。"
              )
        )
      );
    }

    function renderCameraSettingsCard() {
      const activeCamera = getSurveyCamera(settings.cameraId);
      const interchangeable = cameraHasInterchangeableLens(activeCamera);
      const brandGroups = getCameraBrandGroups();
      const groundFootprint = computeGroundFootprintMeters(
        activeCamera,
        settings.focalLengthMm,
        settings.surveyAltitude
      );
      const cameraSwathWidth = round(getCameraSwathWidthMeters(settings), 1);
      const surveyLineSpacing = round(
        computeLineSpacingMeters(settings.sideOverlap, settings.footprintWidthMeters),
        1
      );
      const cameraTriggerSpacing = round(
        window.SurveyPlanner && window.SurveyPlanner.computeCameraTriggerDistanceMeters
          ? window.SurveyPlanner.computeCameraTriggerDistanceMeters(
              settings.footprintHeightMeters || groundFootprint.heightMeters,
              settings.forwardOverlap
            )
          : groundFootprint.heightMeters * (1 - settings.forwardOverlap),
        1
      );

      return e(
        "section",
        { className: "fp-card" },
        e("h3", { className: "fp-card-title" }, "相机设置"),
        e(
          "div",
          { className: "fp-grid-2" },
          e(
            "div",
            { className: "fp-field" },
            e("label", { htmlFor: "fp-camera" }, "相机型号"),
            e(
              "select",
              {
                id: "fp-camera",
                value: settings.cameraId,
                onChange: function (event) {
                  handleCameraSelect(event.target.value);
                }
              },
              brandGroups.map(function (group) {
                return e(
                  "optgroup",
                  { key: group.brand, label: group.brand },
                  group.cameras.map(function (camera) {
                    return e("option", { key: camera.id, value: camera.id }, camera.name);
                  })
                );
              })
            )
          ),
          e(
            "div",
            { className: "fp-field" },
            e("label", { htmlFor: "fp-focal-length" }, "镜头焦距 (mm)"),
            interchangeable
              ? e("input", {
                  id: "fp-focal-length",
                  type: "number",
                  min: String(activeCamera.focalLengthMinMm || 8),
                  max: String(activeCamera.focalLengthMaxMm || 500),
                  step: "0.1",
                  value: settings.focalLengthMm,
                  onChange: function (event) {
                    handleFocalLengthInput(event.target.value);
                  }
                })
              : e("input", {
                  id: "fp-focal-length",
                  type: "number",
                  readOnly: true,
                  value: settings.focalLengthMm
                })
          )
        ),
        e(
          "div",
          { className: "fp-inline-stats fp-camera-specs" },
          e(
            "div",
            { className: "fp-stat" },
            e("div", { className: "fp-stat-label" }, "CMOS 宽 × 高"),
            e(
              "div",
              { className: "fp-stat-value fp-stat-value-sm" },
              activeCamera.sensorWidthMm + " × " + activeCamera.sensorHeightMm + " mm"
            )
          ),
          e(
            "div",
            { className: "fp-stat" },
            e("div", { className: "fp-stat-label" }, "CMOS 分辨率"),
            e(
              "div",
              { className: "fp-stat-value fp-stat-value-sm" },
              activeCamera.resolutionW + " × " + activeCamera.resolutionH
            )
          ),
          e(
            "div",
            { className: "fp-stat" },
            e("div", { className: "fp-stat-label" }, "地面幅宽 × 幅高"),
            e(
              "div",
              { className: "fp-stat-value fp-stat-value-sm" },
              round(groundFootprint.widthMeters, 1) +
                " × " +
                round(groundFootprint.heightMeters, 1) +
                " m"
            )
          ),
          e(
            "div",
            { className: "fp-stat" },
            e("div", { className: "fp-stat-label" }, "理论单航带幅宽"),
            e(
              "div",
              { className: "fp-stat-value fp-stat-value-sm" },
              cameraSwathWidth + " m"
            )
          ),
          e(
            "div",
            { className: "fp-stat" },
            e("div", { className: "fp-stat-label" }, "测线间距"),
            e(
              "div",
              { className: "fp-stat-value fp-stat-value-sm" },
              surveyLineSpacing + " m"
            )
          ),
          e(
            "div",
            { className: "fp-stat" },
            e("div", { className: "fp-stat-label" }, "沿航向拍照间距"),
            e(
              "div",
              { className: "fp-stat-value fp-stat-value-sm" },
              cameraTriggerSpacing + " m"
            )
          )
        )
      );
    }

    function renderSettingsTab() {
      return e(
        window.React.Fragment,
        null,
        renderCameraSettingsCard(),
        e(
          "section",
          { className: "fp-card" },
          e("h3", { className: "fp-card-title" }, "航线设置"),
          e(
            "p",
            { className: "fp-card-note" },
            "航测高度默认跟随默认航点高度；单独修改航测高度后不再自动联动。"
          ),
          e(
            "div",
            { className: "fp-grid-3" },
            e(
              "div",
              { className: "fp-field" },
              e("label", { htmlFor: "fp-altitude" }, "默认航点高度"),
              e(
                "input",
                Object.assign(
                  {
                    id: "fp-altitude",
                    type: "number",
                    step: "1",
                    value: settings.altitude
                  },
                  createNumericSettingHandlers(handleSettingChange, "altitude", { integer: true })
                )
              )
            ),
            e(
              "div",
              { className: "fp-field" },
              e("label", { htmlFor: "fp-speed" }, "巡航速度 m/s"),
              e(
                "input",
                Object.assign(
                  {
                    id: "fp-speed",
                    type: "number",
                    step: "0.1",
                    value: settings.speed
                  },
                  createNumericSettingHandlers(handleSettingChange, "speed")
                )
              )
            ),
            e(
              "div",
              { className: "fp-field" },
              e("label", { htmlFor: "fp-survey-altitude" }, settings.useTerrainFollowing ? "航测高度 (AGL)" : "航测高度"),
              e(
                "input",
                Object.assign(
                  {
                    id: "fp-survey-altitude",
                    type: "number",
                    step: "1",
                    value: settings.surveyAltitude
                  },
                  createNumericSettingHandlers(handleSettingChange, "surveyAltitude", {
                    integer: true
                  })
                )
              )
            ),
            renderOverlapPercentField("forwardOverlap", "fp-forward-overlap", "航向重叠率 (%)"),
            renderOverlapPercentField("sideOverlap", "fp-side-overlap", "旁向重叠率 (%)"),
            e(
              "p",
              { className: "fp-card-note fp-card-note--inline" },
              "确认生成测绘航线后，将在每个测线起点/终点后自动插入 MAVLink 206（DO_SET_CAM_TRIGG_DIST）开始/停止拍照命令；间距由航向重叠率与画幅高度计算，不在地图上显示。"
            ),
            e(
              "div",
              { className: "fp-field" },
              e("label", { htmlFor: "fp-turn-around" }, "过冲延伸距离"),
              e(
                "input",
                Object.assign(
                  {
                    id: "fp-turn-around",
                    type: "number",
                    min: "0",
                    step: "1",
                    value: settings.turnAroundMeters
                  },
                  createNumericSettingHandlers(handleSettingChange, "turnAroundMeters", {
                    integer: true
                  })
                )
              )
            )
          )
        )
      );
    }

    return e(
      "div",
      { className: "fp-shell" },
      e(
        "aside",
        { className: "fp-sidebar" },
        e(
          "div",
          { className: "fp-sidebar-header" },
          e("h2", { className: "fp-sidebar-title" }, "飞行计划编辑器"),
          e("p", { className: "fp-sidebar-subtitle" }, connectionSummary + " · " + planningSummary)
        ),
        e(
          "div",
          { className: "fp-tabbar" },
          e(
            "button",
            {
              type: "button",
              className: "fp-tab" + (activeTab === "waypoint" ? " active" : ""),
              onClick: function () {
                setActiveTab("waypoint");
              }
            },
            "添加航点"
          ),
          e(
            "button",
            {
              type: "button",
              className: "fp-tab" + (activeTab === "survey" ? " active" : ""),
              onClick: function () {
                setActiveTab("survey");
              }
            },
            "添加航测区域"
          ),
          e(
            "button",
            {
              type: "button",
              className: "fp-tab" + (activeTab === "settings" ? " active" : ""),
              onClick: function () {
                setActiveTab("settings");
              }
            },
            "航线设置"
          )
        ),
        e(
          "div",
          { className: "fp-sidebar-scroll" },
          activeTab === "waypoint"
            ? renderWaypointTab()
            : activeTab === "survey"
              ? renderSurveyTab()
              : renderSettingsTab(),
          renderMissionIoCard()
        )
      ),
      e(
        "section",
        { className: "fp-map-panel" },
        e(
          "div",
          { className: "fp-map-toolbar" },
          e(
            "div",
            { className: "fp-map-toolbar-left" },
            e(
              "span",
              { className: "fp-chip" },
              e("strong", null, activeTab === "survey" ? "Survey Mode" : "Waypoint Mode")
            ),
            e(
              "span",
              { className: "fp-chip" },
              "航点 ",
              e("strong", null, String(missionWaypoints.length))
            ),
            e(
              "span",
              { className: "fp-chip" },
              "区域顶点 ",
              e("strong", null, String(surveyArea.length))
            ),
            e(
              "span",
              { className: "fp-chip" },
              "测线间距 ",
              e("strong", null, lineSpacing + " m")
            ),
            activeTab === "survey"
              ? e(
                  "span",
                  { className: "fp-chip" },
                  "过冲 ",
                  e("strong", null, String(settings.turnAroundMeters) + " m")
                )
              : null,
            e(
              "span",
              {
                className:
                  "fp-chip fp-chip-status " +
                  (connected ? "is-online" : "is-offline")
              },
              connected ? "串口在线" : "串口离线"
            )
          ),
          e(
            "div",
            { className: "fp-map-toolbar-right" },
            e(
              "label",
              {
                className: "fp-check-row",
                style: {
                  marginRight: "10px",
                  opacity: contourTargetAvailable ? 1 : 0.55
                },
                title: contourTargetAvailable
                  ? terrainContourLoading
                    ? "正在生成当前视野等高线"
                    : terrainContourError || "在主地图显示当前视野的地形等高线"
                  : "地图尚未就绪"
              },
              e("input", {
                type: "checkbox",
                checked: showTerrainContours,
                disabled: !contourTargetAvailable,
                onChange: function (event) {
                  setShowTerrainContours(event.target.checked);
                }
              }),
              e(
                "span",
                null,
                terrainContourLoading ? "显示地形等高线（生成中）" : "显示地形等高线"
              )
            ),
            e(
              "button",
              {
                type: "button",
                className: "fp-btn fp-btn--tiny",
                disabled: !canPreviewMission3d && !canPreviewPlanning3d,
                onClick: handleOpen3dPreview,
                title:
                  canPreviewMission3d || canPreviewPlanning3d
                    ? "打开 3D 预览"
                    : "请先生成航线或绘制测区"
              },
              "3D 预览"
            ),
            e(
              "span",
              { className: "fp-chip fp-token-note" },
              window.L
                ? "Leaflet 地图已加载（" +
                  (typeof window.getCurrentMapBaseLayerLabel === "function"
                    ? window.getCurrentMapBaseLayerLabel()
                    : "底图") +
                  "）"
                : "Leaflet 未加载，请检查网络"
            )
          )
        ),
        e(
          "div",
          { className: "fp-map-stage" },
          e("div", { ref: mapContainerRef, className: "fp-map-canvas" })
        )
      ),
      renderProfilePreviewModal(),
      render3dPreviewModal()
    );
  }

  function mountFlightPlanEditor() {
    if (!window.React || !window.ReactDOM || !window.ReactDOM.createRoot) {
      window.setTimeout(mountFlightPlanEditor, 50);
      return;
    }

    if (window._currentMainView && window._currentMainView !== "flight-plan") {
      return;
    }

    const host = document.getElementById("flight-plan-app");
    if (!host || host.dataset.mounted === "true") {
      return;
    }

    host.dataset.mounted = "true";
    const root = window.ReactDOM.createRoot(host);
    root.render(window.React.createElement(FlightPlanEditor));
  }

  window.generateSurveyPath = generateSurveyPath;
  window.computeSurveyLineSpacingMeters = computeLineSpacingMeters;
  window.mountFlightPlanEditor = mountFlightPlanEditor;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountFlightPlanEditor);
  } else {
    mountFlightPlanEditor();
  }

  window.addEventListener("gcs:main-view-changed", function (ev) {
    if (ev && ev.detail && ev.detail.name === "flight-plan") {
      mountFlightPlanEditor();
    }
  });
})();
