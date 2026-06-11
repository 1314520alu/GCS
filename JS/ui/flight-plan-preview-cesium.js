/**
 * Flight plan preview powered by CesiumJS.
 * Uses online Cesium terrain when a token is available, and falls back to local/offline imagery.
 */
(function initFlightPlanPreviewCesium() {
  const BASE_URL = "vendor/cesium/Build/Cesium";
  const TILE_SERVER = window.TILE_SERVER || "http://127.0.0.1:8768";
  const COLORS = {
    survey: "#ffde59",
    connector: "#94a9bd",
    rtl: "#ffb347",
    other: "#f3f7fb",
    vertical: "#7dc8ff",
    marker: "#f3f7fb",
    keyMarker: "#ffc857"
  };

  function toCesiumColor(hex, alpha) {
    const Cesium = window.Cesium;
    const color = Cesium.Color.fromCssColorString(hex);
    color.alpha = alpha == null ? 1 : alpha;
    return color;
  }

  function colorForType(type) {
    if (type === "survey") {
      return toCesiumColor(COLORS.survey, 0.98);
    }
    if (type === "connector") {
      return toCesiumColor(COLORS.connector, 0.92);
    }
    if (type === "rtl") {
      return toCesiumColor(COLORS.rtl, 0.98);
    }
    return toCesiumColor(COLORS.other, 0.96);
  }

  function getIonToken() {
    if (window.CESIUM_ION_TOKEN) {
      return String(window.CESIUM_ION_TOKEN);
    }
    try {
      const stored = localStorage.getItem("gcs-cesium-ion-token");
      if (stored) {
        return String(stored);
      }
    } catch (_) {
      /* ignore */
    }
    return "";
  }

  function hasUsableConfig() {
    return !!window.Cesium;
  }

  function buildEsriImageryProvider() {
    const Cesium = window.Cesium;
    return new Cesium.UrlTemplateImageryProvider({
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      credit: "Imagery © Esri",
      maximumLevel: 19
    });
  }

  function buildLocalImageryProvider() {
    const Cesium = window.Cesium;
    return new Cesium.UrlTemplateImageryProvider({
      url: TILE_SERVER + "/tiles/imagery/{z}/{x}/{y}.png",
      credit: "Local tile server",
      maximumLevel: 18
    });
  }

  function buildCartographicPoints(segment) {
    return (segment.samples || []).map(function (sample) {
      return window.Cesium.Cartesian3.fromDegrees(
        Number(sample.lng) || 0,
        Number(sample.lat) || 0,
        Number(sample.flightZ) || 0
      );
    });
  }

  function create(container) {
    const Cesium = window.Cesium;
    if (!Cesium || !container) {
      return null;
    }

    window.CESIUM_BASE_URL = BASE_URL;
    const ionToken = getIonToken();
    if (ionToken) {
      Cesium.Ion.defaultAccessToken = ionToken;
    }

    const viewer = new Cesium.Viewer(container, {
      animation: false,
      baseLayerPicker: false,
      fullscreenButton: false,
      geocoder: false,
      homeButton: false,
      infoBox: false,
      navigationHelpButton: false,
      projectionPicker: false,
      sceneModePicker: false,
      selectionIndicator: false,
      timeline: false,
      terrainProvider: new Cesium.EllipsoidTerrainProvider(),
      imageryProvider: buildEsriImageryProvider(),
      requestRenderMode: true,
      maximumRenderTimeChange: Infinity
    });

    try {
      viewer.imageryLayers.addImageryProvider(buildLocalImageryProvider());
    } catch (_) {
      /* local tile server optional */
    }

    viewer.scene.globe.depthTestAgainstTerrain = false;
    viewer.scene.skyAtmosphere.show = true;
    viewer.scene.globe.enableLighting = true;
    viewer.scene.requestRender();

    let latestSphere = null;

    if (ionToken && typeof Cesium.createWorldTerrainAsync === "function") {
      Cesium.createWorldTerrainAsync()
        .then(function (terrain) {
          viewer.scene.terrainProvider = terrain;
          viewer.scene.requestRender();
        })
        .catch(function () {
          /* stay on offline fallback */
        });
    }

    function clearEntities() {
      viewer.entities.removeAll();
    }

    function addSegment(segment, options) {
      if (!segment || !segment.samples || segment.samples.length < 2) {
        return;
      }
      if (!options.showConnectors && segment.type === "connector") {
        return;
      }
      viewer.entities.add({
        polyline: {
          positions: buildCartographicPoints(segment),
          width: segment.type === "connector" ? 2 : 3,
          material: colorForType(segment.type),
          clampToGround: false
        }
      });
    }

    function addMarkers(data, options) {
      const seen = new Set();
      (data.segments || []).forEach(function (segment) {
        if (!options.showConnectors && segment.type === "connector") {
          return;
        }
        const first = segment.samples[0];
        const last = segment.samples[segment.samples.length - 1];
        [first, last].forEach(function (sample, idx) {
          if (!sample) {
            return;
          }
          const key =
            Math.round((sample.lat || 0) * 1e6) + ":" + Math.round((sample.lng || 0) * 1e6) + ":" + idx;
          if (seen.has(key)) {
            return;
          }
          seen.add(key);
          viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(
              Number(sample.lng) || 0,
              Number(sample.lat) || 0,
              Number(sample.flightZ) || 0
            ),
            point: {
              pixelSize: idx === 0 || segment.type === "rtl" ? 10 : 7,
              color: idx === 0 || segment.type === "rtl"
                ? toCesiumColor(COLORS.keyMarker, 0.95)
                : toCesiumColor(COLORS.marker, 0.95),
              outlineColor: Cesium.Color.BLACK,
              outlineWidth: 1
            }
          });
        });
      });
    }

    function addVerticals(data, options) {
      if (!options.showVerticals) {
        return;
      }
      (data.segments || []).forEach(function (segment) {
        if (!options.showConnectors && segment.type === "connector") {
          return;
        }
        const dense = segment.samples || [];
        const step = Math.max(2, Math.round(dense.length / 9));
        for (let i = 0; i < dense.length; i += step) {
          const sample = dense[i];
          if (!sample) {
            continue;
          }
          viewer.entities.add({
            polyline: {
              positions: [
                Cesium.Cartesian3.fromDegrees(
                  Number(sample.lng) || 0,
                  Number(sample.lat) || 0,
                  Number(sample.terrainZ) || 0
                ),
                Cesium.Cartesian3.fromDegrees(
                  Number(sample.lng) || 0,
                  Number(sample.lat) || 0,
                  Number(sample.flightZ) || 0
                )
              ],
              width: 1,
              material: toCesiumColor(COLORS.vertical, 0.45),
              clampToGround: false
            }
          });
        }
      });
    }

    function zoomToView(viewName) {
      if (!latestSphere) {
        return;
      }
      const Cesium = window.Cesium;
      let heading = Cesium.Math.toRadians(-35);
      let pitch = Cesium.Math.toRadians(-35);
      if (viewName === "top") {
        heading = 0;
        pitch = Cesium.Math.toRadians(-90);
      } else if (viewName === "side") {
        heading = Cesium.Math.toRadians(-90);
        pitch = Cesium.Math.toRadians(-8);
      }
      viewer.camera.flyToBoundingSphere(latestSphere, {
        duration: 0,
        offset: new Cesium.HeadingPitchRange(heading, pitch, Math.max(latestSphere.radius * 2.4, 600))
      });
    }

    function update(data, options) {
      const drawOptions = Object.assign(
        {
          showConnectors: true,
          showVerticals: true,
          showTerrain: true,
          view: "iso"
        },
        options || {}
      );
      if (viewer.scene && viewer.scene.globe) {
        viewer.scene.globe.show = drawOptions.showTerrain !== false;
      }
      clearEntities();
      (data && data.segments ? data.segments : []).forEach(function (segment) {
        addSegment(segment, drawOptions);
      });
      addMarkers(data || { segments: [] }, drawOptions);
      addVerticals(data || { segments: [] }, drawOptions);

      if (viewer.entities.values.length) {
        const positions = [];
        viewer.entities.values.forEach(function (entity) {
          if (entity.polyline && entity.polyline.positions) {
            const polylinePositions = entity.polyline.positions.getValue
              ? entity.polyline.positions.getValue(Cesium.JulianDate.now())
              : entity.polyline.positions;
            if (Array.isArray(polylinePositions)) {
              positions.push.apply(positions, polylinePositions);
            }
          } else if (entity.position) {
            const pos = entity.position.getValue
              ? entity.position.getValue(Cesium.JulianDate.now())
              : entity.position;
            if (pos) {
              positions.push(pos);
            }
          }
        });
        if (positions.length) {
          latestSphere = Cesium.BoundingSphere.fromPoints(positions);
          zoomToView(drawOptions.view);
        }
      }
      viewer.scene.requestRender();
    }

    return {
      update: update,
      resize: function () {
        viewer.scene.requestRender();
      },
      dispose: function () {
        clearEntities();
        viewer.destroy();
      },
      setView: function (viewName) {
        zoomToView(viewName || "iso");
      }
    };
  }

  window.FlightPlanPreviewCesium = {
    create: create,
    hasUsableConfig: hasUsableConfig
  };
})();
