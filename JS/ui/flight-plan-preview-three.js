/**
 * Flight plan 3D preview for survey and mission routes.
 * Renders route lines, terrain ribbon strips, waypoint markers, and vertical AGL guides.
 */
(function initFlightPlanPreviewThree() {
  const TILE_SERVER = window.TILE_SERVER || "http://127.0.0.1:8768";
  const ESRI_IMAGERY_URL =
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
  const CLEAR_COLOR = 0x09111a;
  const COLORS = {
    terrain: 0x223142,
    terrainEdge: 0x375068,
    survey: 0xffde59,
    connector: 0xffde59,
    rtl: 0xffde59,
    other: 0xffde59,
    smooth: 0xff9f1c,
    marker: 0xf3f7fb,
    keyMarker: 0xffc857,
    vertical: 0x7dc8ff,
    grid: 0x203041
  };

  function disposeMaterial(material) {
    if (!material) {
      return;
    }
    if (Array.isArray(material)) {
      material.forEach(disposeMaterial);
      return;
    }
    if (material.map) {
      material.map.dispose();
    }
    material.dispose();
  }

  function disposeObject3D(root) {
    if (!root) {
      return;
    }
    while (root.children && root.children.length) {
      const child = root.children.pop();
      disposeObject3D(child);
    }
    if (root.geometry) {
      root.geometry.dispose();
    }
    if (root.material) {
      disposeMaterial(root.material);
    }
  }

  function create(canvas) {
    const THREE = window.THREE;
    if (!THREE || !canvas) {
      return null;
    }

    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: true,
      powerPreference: "low-power"
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    if (THREE.SRGBColorSpace) {
      renderer.outputColorSpace = THREE.SRGBColorSpace;
    }
    renderer.setClearColor(CLEAR_COLOR, 1);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 20000);
    const target = new THREE.Vector3(0, 0, 0);
    const spherical = {
      radius: 420,
      theta: Math.PI / 4,
      phi: Math.PI / 3.1
    };
    const pan = new THREE.Vector3(0, 0, 0);
    const pointer = {
      active: false,
      button: 0,
      x: 0,
      y: 0
    };

    let destroyed = false;
    let bounds = {
      minX: -80,
      maxX: 80,
      minY: 0,
      maxY: 120,
      minZ: -80,
      maxZ: 80
    };

    scene.add(new THREE.AmbientLight(0xffffff, 0.52));
    const key = new THREE.DirectionalLight(0xfff4e6, 1.08);
    key.position.set(260, 420, 320);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x9bc8ff, 0.34);
    fill.position.set(-300, 200, -180);
    scene.add(fill);

    const root = new THREE.Group();
    scene.add(root);
    const terrainGroup = new THREE.Group();
    const routeGroup = new THREE.Group();
    const markerGroup = new THREE.Group();
    const verticalGroup = new THREE.Group();
    const gridGroup = new THREE.Group();
    root.add(gridGroup);
    root.add(terrainGroup);
    root.add(routeGroup);
    root.add(markerGroup);
    root.add(verticalGroup);

    const axis = new THREE.AxesHelper(24);
    axis.material.depthTest = false;
    axis.renderOrder = 9;
    root.add(axis);

    function render() {
      if (destroyed) {
        return;
      }
      renderer.render(scene, camera);
    }

    function syncCamera() {
      const sinPhi = Math.sin(spherical.phi);
      const x = target.x + pan.x + spherical.radius * sinPhi * Math.cos(spherical.theta);
      const y = target.y + pan.y + spherical.radius * Math.cos(spherical.phi);
      const z = target.z + pan.z + spherical.radius * sinPhi * Math.sin(spherical.theta);
      camera.position.set(x, y, z);
      camera.lookAt(target.x + pan.x, target.y + pan.y, target.z + pan.z);
      camera.updateProjectionMatrix();
      render();
    }

    function ensureSize() {
      const w = canvas.clientWidth || canvas.width || 1;
      const h = canvas.clientHeight || canvas.height || 1;
      const size = new THREE.Vector2();
      renderer.getSize(size);
      if (Math.abs(size.x - w) > 1 || Math.abs(size.y - h) > 1) {
        renderer.setSize(w, h, false);
        camera.aspect = w / Math.max(1, h);
        camera.updateProjectionMatrix();
      }
    }

    function fitToBounds(nextBounds, viewName) {
      bounds = nextBounds || bounds;
      const centerX = (bounds.minX + bounds.maxX) / 2;
      const centerY = (bounds.minY + bounds.maxY) / 2;
      const centerZ = (bounds.minZ + bounds.maxZ) / 2;
      target.set(centerX, centerY, centerZ);
      pan.set(0, 0, 0);

      const sizeX = Math.max(20, bounds.maxX - bounds.minX);
      const sizeY = Math.max(20, bounds.maxY - bounds.minY);
      const sizeZ = Math.max(20, bounds.maxZ - bounds.minZ);
      const radius = Math.max(sizeX, sizeY, sizeZ);

      if (viewName === "top") {
        spherical.theta = Math.PI / 4;
        spherical.phi = 0.18;
      } else if (viewName === "side") {
        spherical.theta = Math.PI / 2;
        spherical.phi = Math.PI / 2.5;
      } else {
        spherical.theta = Math.PI / 4;
        spherical.phi = Math.PI / 3.1;
      }
      spherical.radius = Math.max(150, radius * 1.85);
      syncCamera();
    }

    function clearGroups() {
      [terrainGroup, routeGroup, markerGroup, verticalGroup, gridGroup].forEach(function (group) {
        disposeObject3D(group);
        while (group.children.length) {
          group.remove(group.children[0]);
        }
      });
    }

    function buildBounds(data) {
      const out = {
        minX: Infinity,
        maxX: -Infinity,
        minY: Infinity,
        maxY: -Infinity,
        minZ: Infinity,
        maxZ: -Infinity
      };
      function pushPoint(x, y, z) {
        out.minX = Math.min(out.minX, x);
        out.maxX = Math.max(out.maxX, x);
        out.minY = Math.min(out.minY, y);
        out.maxY = Math.max(out.maxY, y);
        out.minZ = Math.min(out.minZ, z);
        out.maxZ = Math.max(out.maxZ, z);
      }
      (data.segments || []).forEach(function (segment) {
        (segment.samples || []).forEach(function (sample) {
          pushPoint(sample.x, sample.terrainZ, sample.z);
          pushPoint(sample.x, sample.flightZ, sample.z);
        });
      });
      if (!Number.isFinite(out.minX)) {
        return {
          minX: -60,
          maxX: 60,
          minY: 0,
          maxY: 120,
          minZ: -60,
          maxZ: 60
        };
      }
      const padX = Math.max(24, (out.maxX - out.minX) * 0.1);
      const padY = Math.max(24, (out.maxY - out.minY) * 0.12);
      const padZ = Math.max(24, (out.maxZ - out.minZ) * 0.1);
      return {
        minX: out.minX - padX,
        maxX: out.maxX + padX,
        minY: Math.max(0, out.minY - padY * 0.2),
        maxY: out.maxY + padY,
        minZ: out.minZ - padZ,
        maxZ: out.maxZ + padZ
      };
    }

    function addGrid(nextBounds) {
      const spanX = nextBounds.maxX - nextBounds.minX;
      const spanZ = nextBounds.maxZ - nextBounds.minZ;
      const gridSize = Math.max(spanX, spanZ, 120);
      const divisions = Math.max(8, Math.min(40, Math.round(gridSize / 30)));
      const grid = new THREE.GridHelper(gridSize, divisions, COLORS.grid, COLORS.grid);
      grid.position.y = nextBounds.minY;
      grid.material.transparent = true;
      grid.material.opacity = 0.5;
      gridGroup.add(grid);
    }

    function projectMetersToLngLat(point, origin) {
      const metersPerLat = 111320;
      const metersPerLng = Math.cos((origin.lat * Math.PI) / 180) * metersPerLat || 1;
      return {
        lng: origin.lng + point.x / metersPerLng,
        lat: origin.lat + point.y / metersPerLat
      };
    }

    function lngLatToTile(lng, lat, zoom) {
      const n = Math.pow(2, zoom);
      const x = Math.floor(((lng + 180) / 360) * n);
      const latRad = (lat * Math.PI) / 180;
      const y = Math.floor(
        ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n
      );
      return { x: x, y: y, z: zoom };
    }

    function pickMapZoom(spanM) {
      const span = Math.max(200, Number(spanM) || 200);
      if (span > 40000) {
        return 11;
      }
      if (span > 20000) {
        return 12;
      }
      if (span > 10000) {
        return 13;
      }
      if (span > 5000) {
        return 14;
      }
      if (span > 2500) {
        return 15;
      }
      if (span > 1200) {
        return 16;
      }
      return 17;
    }

    function loadTileImage(url) {
      return new Promise(function (resolve, reject) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = function () {
          resolve(img);
        };
        img.onerror = reject;
        img.src = url;
      });
    }

    function addMapBasemap(preview, nextBounds, drawOptions) {
      if (!drawOptions.showTerrain) {
        return;
      }
      const origin = preview && preview.origin;
      if (!origin || !Number.isFinite(Number(origin.lat)) || !Number.isFinite(Number(origin.lng))) {
        return;
      }
      const spanX = nextBounds.maxX - nextBounds.minX;
      const spanZ = nextBounds.maxZ - nextBounds.minZ;
      const centerLocalX = (nextBounds.minX + nextBounds.maxX) / 2;
      const centerLocalZ = (nextBounds.minZ + nextBounds.maxZ) / 2;
      const centerGeo = projectMetersToLngLat({ x: centerLocalX, y: centerLocalZ }, origin);
      const zoom = pickMapZoom(Math.max(spanX, spanZ));
      const centerTile = lngLatToTile(centerGeo.lng, centerGeo.lat, zoom);
      const grid = 3;
      const tileSize = 256;
      const canvas = document.createElement("canvas");
      canvas.width = tileSize * grid;
      canvas.height = tileSize * grid;
      const ctx = canvas.getContext("2d");
      const jobs = [];
      for (let dy = 0; dy < grid; dy += 1) {
        for (let dx = 0; dx < grid; dx += 1) {
          const tx = centerTile.x - 1 + dx;
          const ty = centerTile.y - 1 + dy;
          const localUrl =
            TILE_SERVER + "/tiles/imagery/" + zoom + "/" + tx + "/" + ty + ".png";
          const esriUrl = ESRI_IMAGERY_URL.replace("{z}", String(zoom))
            .replace("{x}", String(tx))
            .replace("{y}", String(ty));
          jobs.push(
            loadTileImage(localUrl)
              .catch(function () {
                return loadTileImage(esriUrl);
              })
              .then(function (img) {
                ctx.drawImage(img, dx * tileSize, dy * tileSize, tileSize, tileSize);
              })
              .catch(function () {
                ctx.fillStyle = "#1a2838";
                ctx.fillRect(dx * tileSize, dy * tileSize, tileSize, tileSize);
              })
          );
        }
      }
      Promise.all(jobs).then(function () {
        if (destroyed) {
          return;
        }
        const texture = new THREE.CanvasTexture(canvas);
        if (THREE.SRGBColorSpace) {
          texture.colorSpace = THREE.SRGBColorSpace;
        }
        texture.needsUpdate = true;
        const planeW = Math.max(spanX * 1.45, 320);
        const planeD = Math.max(spanZ * 1.45, 320);
        const geom = new THREE.PlaneGeometry(planeW, planeD);
        geom.rotateX(-Math.PI / 2);
        const mesh = new THREE.Mesh(
          geom,
          new THREE.MeshBasicMaterial({
            map: texture,
            toneMapped: false
          })
        );
        mesh.position.set(centerLocalX, nextBounds.minY - 0.8, centerLocalZ);
        terrainGroup.add(mesh);
        render();
      });
    }

    function lineColorForType(type) {
      if (type === "survey") {
        return COLORS.survey;
      }
      if (type === "connector") {
        return COLORS.connector;
      }
      if (type === "rtl") {
        return COLORS.rtl;
      }
      return COLORS.other;
    }

    function addRouteSegment(segment, options) {
      if (!segment || !segment.samples || segment.samples.length < 2) {
        return;
      }
      if (!options.showConnectors && segment.type === "connector") {
        return;
      }
      const pts = segment.samples.map(function (sample) {
        return new THREE.Vector3(sample.x, sample.flightZ, sample.z);
      });
      const geom = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = new THREE.LineBasicMaterial({
        color: lineColorForType(segment.type),
        transparent: true,
        opacity: 0.98
      });
      const line = new THREE.Line(geom, mat);
      routeGroup.add(line);
    }

    function addSmoothedFixedWingRoute(data, options) {
      if (!options.showFixedWingCurve) {
        return;
      }
      const points = [];
      (data.routePoints || []).forEach(function (sample) {
        if (!sample) {
          return;
        }
        points.push(new THREE.Vector3(sample.x, sample.flightZ, sample.z));
      });
      if (points.length < 4) {
        return;
      }
      const stride = Math.max(1, Math.round(points.length / 140));
      const control = points.filter(function (_, index) {
        return index === 0 || index === points.length - 1 || index % stride === 0;
      });
      if (control.length < 4) {
        return;
      }
      const curve = new THREE.CatmullRomCurve3(control, false, "centripetal", 0.4);
      const smoothPts = curve.getPoints(Math.min(220, Math.max(60, control.length * 4)));
      const geom = new THREE.BufferGeometry().setFromPoints(smoothPts);
      const mat = new THREE.LineBasicMaterial({
        color: COLORS.smooth,
        transparent: true,
        opacity: 0.98
      });
      const line = new THREE.Line(geom, mat);
      line.renderOrder = 4;
      routeGroup.add(line);
    }

    function addTerrainRibbon(segment) {
      if (!segment || !segment.samples || segment.samples.length < 2) {
        return;
      }
      const width = Math.max(8, Number(segment.ribbonWidth) || 18);
      const positions = [];
      const indices = [];
      for (let i = 0; i < segment.samples.length; i += 1) {
        const sample = segment.samples[i];
        const bearing = sample.bearingRad || 0;
        const dx = Math.sin(bearing) * width * 0.5;
        const dz = Math.cos(bearing) * width * 0.5;
        positions.push(sample.x - dx, sample.terrainZ, sample.z + dz);
        positions.push(sample.x + dx, sample.terrainZ, sample.z - dz);
        if (i < segment.samples.length - 1) {
          const base = i * 2;
          indices.push(base, base + 1, base + 2);
          indices.push(base + 1, base + 3, base + 2);
        }
      }
      const geom = new THREE.BufferGeometry();
      geom.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
      geom.setIndex(indices);
      geom.computeVertexNormals();
      const mesh = new THREE.Mesh(
        geom,
        new THREE.MeshStandardMaterial({
          color: COLORS.terrain,
          roughness: 0.92,
          metalness: 0.05,
          transparent: true,
          opacity: 0.88,
          side: THREE.DoubleSide
        })
      );
      terrainGroup.add(mesh);

      const edgePoints = [];
      segment.samples.forEach(function (sample) {
        edgePoints.push(new THREE.Vector3(sample.x, sample.terrainZ + 0.25, sample.z));
      });
      const edgeGeom = new THREE.BufferGeometry().setFromPoints(edgePoints);
      const edge = new THREE.Line(
        edgeGeom,
        new THREE.LineBasicMaterial({
          color: COLORS.terrainEdge,
          transparent: true,
          opacity: 0.85
        })
      );
      terrainGroup.add(edge);
    }

    function addMarkers(data, options) {
      const segments = data.segments || [];
      const added = [];
      const markerGeom = new THREE.SphereGeometry(2.3, 14, 12);
      const keyGeom = new THREE.SphereGeometry(3.6, 16, 14);
      segments.forEach(function (segment) {
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
            sample.x.toFixed(2) +
            ":" +
            sample.z.toFixed(2) +
            ":" +
            sample.flightZ.toFixed(1) +
            ":" +
            idx;
          if (added.indexOf(key) !== -1) {
            return;
          }
          added.push(key);
          const isKey = idx === 0 || segment.type === "rtl";
          const marker = new THREE.Mesh(
            isKey ? keyGeom.clone() : markerGeom.clone(),
            new THREE.MeshStandardMaterial({
              color: isKey ? COLORS.keyMarker : COLORS.marker,
              roughness: 0.45,
              metalness: 0.22
            })
          );
          marker.position.set(sample.x, sample.flightZ, sample.z);
          markerGroup.add(marker);
        });
      });
    }

    function addVerticals(data, options) {
      if (!options.showVerticals) {
        return;
      }
      const material = new THREE.LineBasicMaterial({
        color: COLORS.vertical,
        transparent: true,
        opacity: 0.42
      });
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
          const geom = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(sample.x, sample.terrainZ, sample.z),
            new THREE.Vector3(sample.x, sample.flightZ, sample.z)
          ]);
          verticalGroup.add(new THREE.Line(geom, material.clone()));
        }
      });
    }

    function update(data, options) {
      ensureSize();
      clearGroups();
      const preview = data || { segments: [] };
      const drawOptions = Object.assign(
        {
          showTerrain: true,
          showConnectors: true,
          showVerticals: true,
          showFixedWingCurve: false,
          view: "iso"
        },
        options || {}
      );
      const nextBounds = buildBounds(preview);
      addGrid(nextBounds);
      addMapBasemap(preview, nextBounds, drawOptions);
      (preview.segments || []).forEach(function (segment) {
        if (drawOptions.showTerrain) {
          addTerrainRibbon(segment);
        }
        addRouteSegment(segment, drawOptions);
      });
      addSmoothedFixedWingRoute(preview, drawOptions);
      addMarkers(preview, drawOptions);
      addVerticals(preview, drawOptions);
      fitToBounds(nextBounds, drawOptions.view);
    }

    function onPointerDown(event) {
      pointer.active = true;
      pointer.button = event.button;
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      event.preventDefault();
    }

    function onPointerMove(event) {
      if (!pointer.active) {
        return;
      }
      const dx = event.clientX - pointer.x;
      const dy = event.clientY - pointer.y;
      pointer.x = event.clientX;
      pointer.y = event.clientY;

      if (pointer.button === 2 || event.shiftKey || event.metaKey || event.ctrlKey) {
        const span = Math.max(bounds.maxX - bounds.minX, bounds.maxZ - bounds.minZ, 120);
        const scale = span / Math.max(320, canvas.clientWidth || 320);
        pan.x -= dx * scale;
        pan.z -= dy * scale;
      } else {
        spherical.theta -= dx * 0.008;
        spherical.phi = Math.max(0.12, Math.min(Math.PI - 0.12, spherical.phi + dy * 0.008));
      }
      syncCamera();
      event.preventDefault();
    }

    function endPointer() {
      pointer.active = false;
    }

    function onWheel(event) {
      const factor = event.deltaY > 0 ? 1.08 : 0.92;
      spherical.radius = Math.max(40, Math.min(15000, spherical.radius * factor));
      syncCamera();
      event.preventDefault();
    }

    function setView(viewName) {
      fitToBounds(bounds, viewName || "iso");
    }

    function resize() {
      ensureSize();
      syncCamera();
    }

    function dispose() {
      destroyed = true;
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("wheel", onWheel);
      window.removeEventListener("pointerup", endPointer);
      window.removeEventListener("pointerleave", endPointer);
      clearGroups();
      disposeObject3D(root);
      renderer.dispose();
    }

    canvas.style.touchAction = "none";
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("contextmenu", function (event) {
      event.preventDefault();
    });
    window.addEventListener("pointerup", endPointer);
    window.addEventListener("pointerleave", endPointer);

    ensureSize();
    syncCamera();

    return {
      update: update,
      resize: resize,
      dispose: dispose,
      setView: setView
    };
  }

  window.FlightPlanPreviewThree = {
    create: create
  };
})();
