/**
 * 从飞控参数检测已挂载传感器（I2C / SPI / CAN / 串口等），供概览等 UI 使用。
 */
(function () {
  const RNGFND_SERIAL_TYPES = new Set([
    8, 11, 13, 17, 19, 20, 27, 29, 35, 41, 43, 44, 47,
  ]);
  const RNGFND_CAN_TYPES = new Set([24, 33, 34, 38, 39]);
  const RNGFND_I2C_TYPES = new Set([2, 3, 14, 15, 16, 25, 28, 40]);

  const ARSPD_TYPE_INFO = {
    0: { short: "NONE", zh: "未使用", bus: "" },
    1: { short: "MS4525D0", zh: "I2C MS4525D0", bus: "I2C" },
    2: { short: "Analog", zh: "模拟空速管", bus: "模拟" },
    3: { short: "MS5525", zh: "I2C MS5525", bus: "I2C" },
    4: { short: "MS5525_76", zh: "I2C MS5525 (0x76)", bus: "I2C" },
    5: { short: "MS5525_77", zh: "I2C MS5525 (0x77)", bus: "I2C" },
    6: { short: "SDP3X", zh: "I2C SDP3X", bus: "I2C" },
    7: { short: "DLVR-5in", zh: "I2C DLVR 5in", bus: "I2C" },
    8: { short: "DroneCAN", zh: "DroneCAN 空速", bus: "DroneCAN" },
    9: { short: "DLVR-10in", zh: "I2C DLVR 10in", bus: "I2C" },
    10: { short: "DLVR-20in", zh: "I2C DLVR 20in", bus: "I2C" },
    11: { short: "DLVR-30in", zh: "I2C DLVR 30in", bus: "I2C" },
    12: { short: "DLVR-60in", zh: "I2C DLVR 60in", bus: "I2C" },
    14: { short: "MSP", zh: "MSP", bus: "MSP" },
    16: { short: "ExternalAHRS", zh: "外置 AHRS", bus: "外置" },
    100: { short: "SITL", zh: "仿真", bus: "SITL" },
  };

  const FLOW_TYPE_INFO = {
    0: { short: "NONE", zh: "未使用", bus: "" },
    1: { short: "PX4Flow", zh: "PX4 光流", bus: "I2C" },
    2: { short: "Pixart", zh: "Pixart", bus: "I2C" },
    3: { short: "Bebop", zh: "Bebop", bus: "内置" },
    4: { short: "CXOF", zh: "CXOF", bus: "I2C" },
    5: { short: "MAVLink", zh: "MAVLink 光流", bus: "MAVLink" },
    6: { short: "DroneCAN", zh: "DroneCAN 光流", bus: "DroneCAN" },
    7: { short: "MSP", zh: "MSP 光流", bus: "MSP" },
    8: { short: "UPFLOW", zh: "Upflow", bus: "串口" },
    10: { short: "SITL", zh: "仿真", bus: "SITL" },
  };

  const PRX_TYPE_INFO = {
    0: { short: "NONE", zh: "未使用", bus: "" },
    2: { short: "MAVLink", zh: "MAVLink 避障", bus: "MAVLink" },
    3: { short: "TeraRangerTower", zh: "TeraRanger Tower", bus: "I2C" },
    4: { short: "RangeFinder", zh: "复用测距仪", bus: "测距" },
    5: { short: "RPLidarA2", zh: "RPLidar A2", bus: "串口" },
    6: { short: "TeraRangerTowerEvo", zh: "TeraRanger Evo", bus: "I2C" },
    7: { short: "LightwareSF40c", zh: "Lightware SF40c", bus: "CAN" },
    8: { short: "LightwareSF45B", zh: "Lightware SF45B", bus: "CAN" },
    10: { short: "SITL", zh: "SITL 仿真", bus: "SITL" },
    12: { short: "AirSimSITL", zh: "AirSim 仿真", bus: "SITL" },
    13: { short: "CygbotD1", zh: "Cygbot D1", bus: "DroneCAN" },
    14: { short: "DroneCAN", zh: "DroneCAN 避障", bus: "DroneCAN" },
    15: { short: "Scripting", zh: "Lua 脚本", bus: "脚本" },
    16: { short: "LD06", zh: "LD06 激光", bus: "串口" },
    17: { short: "MR72_CAN", zh: "MR72 毫米波", bus: "CAN" },
    18: { short: "HexsoonRadar", zh: "Hexsoon 毫米波雷达", bus: "串口/CAN" },
  };

  const BCN_TYPE_INFO = {
    0: { short: "NONE", zh: "未使用", bus: "" },
    1: { short: "Pozyx", zh: "Pozyx UWB", bus: "UWB/串口" },
    2: { short: "Marvelmind", zh: "Marvelmind", bus: "串口" },
    3: { short: "Nooploop", zh: "Nooploop UWB", bus: "UWB" },
    10: { short: "SITL", zh: "仿真", bus: "SITL" },
  };

  const BATT_MONITOR_INFO = {
    0: { short: "Disabled", zh: "禁用", protocol: "" },
    3: { short: "AnalogVolt", zh: "模拟电压", protocol: "ANALOG" },
    4: { short: "AnalogVoltCurr", zh: "模拟电压+电流", protocol: "ANALOG" },
    5: { short: "Solo", zh: "Solo", protocol: "SOLO" },
    6: { short: "Bebop", zh: "Bebop", protocol: "BEBOP" },
    7: { short: "SMBus", zh: "SMBus 智能电池", protocol: "SMBUS" },
    8: { short: "DroneCAN", zh: "DroneCAN 电池", protocol: "DRONECAN" },
    9: { short: "ESC", zh: "电调遥测", protocol: "ESC" },
    21: { short: "INA2XX", zh: "INA226/228 等 I2C", protocol: "INA2XX" },
    22: { short: "LTC2946", zh: "LTC2946 I2C", protocol: "LTC2946" },
    26: { short: "INA239_SPI", zh: "INA239 SPI", protocol: "INA239" },
    29: { short: "Scripting", zh: "脚本", protocol: "SCRIPT" },
    30: { short: "INA3221", zh: "INA3221", protocol: "INA3221" },
  };

  function battParamPrefix(monitorKey) {
    if (monitorKey === "BATT_MONITOR") return "BATT";
    const m = String(monitorKey).match(/^BATT(\d+)_MONITOR$/);
    if (m) return `BATT${m[1]}`;
    return String(monitorKey).replace("_MONITOR", "");
  }

  function battParamStem(monitorKey) {
    return monitorKey === "BATT_MONITOR" ? "BATT" : battParamPrefix(monitorKey);
  }

  /** 已启用 DroneCAN 的 CAN 驱动器编号（CAN_D1 → 1） */
  function droneCanDriverIndexes(params) {
    const out = [];
    for (let i = 1; i <= 3; i += 1) {
      const v = getp(params, `CAN_D${i}_PROTOCOL`);
      if (v != null && Math.round(v) === 1) out.push(i);
    }
    return out;
  }

  function battBusHint(params, monitorKey, monitorType) {
    const stem = battParamStem(monitorKey);
    const t = Math.round(monitorType);
    if (t === 8) {
      const canPorts = droneCanDriverIndexes(params);
      if (canPorts.length === 1) return `CAN ${canPorts[0]}`;
      if (canPorts.length > 1) return `CAN ${canPorts.join("/")}`;
      return "CAN";
    }
    if (t === 21 || t === 22 || t === 7 || t === 32 || t === 30) {
      const bus = getp(params, `${stem}_I2C_BUS`);
      return bus != null && Number.isFinite(bus) ? `I2C ${Math.round(bus)}` : "I2C";
    }
    if (t === 26) return "SPI";
    if (t === 3 || t === 4) return "模拟";
    if (t === 9) return "ESC";
    if (t === 5) return "SOLO";
    return "";
  }

  function battProtocolLabel(monitorType, row) {
    if (row && row.protocol) return row.protocol;
    if (row && row.short) return String(row.short).replace(/([a-z])([A-Z])/g, "$1_$2").toUpperCase();
    return `TYPE_${Math.round(monitorType)}`;
  }

  const GPS_TYPE_INFO = {
    0: { short: "NONE", zh: "未使用", bus: "" },
    1: { short: "AUTO", zh: "自动检测", bus: "串口" },
    2: { short: "uBlox", zh: "uBlox GNSS", bus: "串口" },
    5: { short: "NMEA", zh: "NMEA", bus: "串口" },
    8: { short: "FAST_NAV", zh: "FAST-NAV", bus: "串口" },
    9: { short: "DroneCAN", zh: "DroneCAN GPS", bus: "DroneCAN" },
    14: { short: "MAV", zh: "MAVLink GPS", bus: "MAVLink" },
  };

  function getp(params, name) {
    if (!(params instanceof Map)) return null;
    if (params.has(name)) {
      const v = Number(params.get(name));
      return Number.isFinite(v) ? v : null;
    }
    const u = name.toUpperCase();
    for (const [k, val] of params) {
      if (String(k).toUpperCase() === u) {
        const v = Number(val);
        return Number.isFinite(v) ? v : null;
      }
    }
    return null;
  }

  function typeRow(map, t, fallback) {
    const n = Math.round(Number(t));
    const row = map[n];
    if (row) return { ...row, type: n };
    return {
      short: fallback ? `${fallback}_${n}` : `TYPE_${n}`,
      zh: `类型 ${n}`,
      bus: "",
      type: n,
    };
  }

  function serialPortsByProtocol(params, protocol) {
    const out = [];
    for (let i = 0; i <= 8; i += 1) {
      const key = `SERIAL${i}_PROTOCOL`;
      const v = getp(params, key);
      if (v != null && Math.round(v) === protocol) out.push(i);
    }
    return out;
  }

  function rngfndBusHint(type, params, slot) {
    const t = Math.round(type);
    if (RNGFND_SERIAL_TYPES.has(t)) {
      const ports = serialPortsByProtocol(params, 9);
      if (ports.length) return `串口 SERIAL${ports.join("/SERIAL")}（协议=测距）`;
      return "串口（请确认 SERIALx_PROTOCOL=9 测距）";
    }
    if (RNGFND_CAN_TYPES.has(t)) return "DroneCAN / CAN";
    if (RNGFND_I2C_TYPES.has(t)) return "I2C";
    if (t === 1) return "模拟";
    if (t === 10) return "MAVLink";
    return "";
  }

  function collectMountedSensors(params) {
    const out = {
      compasses: [],
      imus: [],
      baros: [],
      rangefinders: [],
      proximity: [],
      airspeeds: [],
      opticalFlow: null,
      batteries: [],
      gnss: [],
      beacon: null,
    };

    const compassPairs = [
      ["COMPASS_DEV_ID", "COMPASS_USE", "罗盘 1"],
      ["COMPASS_DEV_ID2", "COMPASS_USE2", "罗盘 2"],
      ["COMPASS_DEV_ID3", "COMPASS_USE3", "罗盘 3"],
    ];
    for (const [idKey, useKey, label] of compassPairs) {
      const rawId = getp(params, idKey);
      if (rawId == null || Math.round(rawId) === 0) continue;
      let use = getp(params, useKey);
      if (use == null) use = 1;
      if (Math.round(use) === 0) continue;
      out.compasses.push({ idKey, label, id: Math.round(rawId) >>> 0 });
    }

    const imuTriples = [
      ["INS_ACC_ID", "INS_GYR_ID", "INS_USE", "IMU 1"],
      ["INS_ACC2_ID", "INS_GYR2_ID", "INS_USE2", "IMU 2"],
      ["INS_ACC3_ID", "INS_GYR3_ID", "INS_USE3", "IMU 3"],
    ];
    for (const [accKey, gyrKey, useKey, label] of imuTriples) {
      const accId = getp(params, accKey);
      const gyrId = getp(params, gyrKey);
      if ((accId == null || Math.round(accId) === 0) && (gyrId == null || Math.round(gyrId) === 0)) continue;
      let use = getp(params, useKey);
      if (use == null) use = 1;
      if (Math.round(use) === 0) continue;
      out.imus.push({
        label,
        accId: accId != null ? Math.round(accId) >>> 0 : 0,
        gyrId: gyrId != null ? Math.round(gyrId) >>> 0 : 0,
      });
    }

    for (let i = 1; i <= 3; i += 1) {
      const v = getp(params, `BARO${i}_DEVID`);
      if (v != null && Math.round(v) !== 0) {
        out.baros.push({ i, label: `气压计 ${i}`, id: Math.round(v) >>> 0 });
      }
    }

    for (let i = 1; i <= 10; i += 1) {
      const v = getp(params, `RNGFND${i}_TYPE`);
      if (v != null && Math.round(v) > 0) {
        const t = Math.round(v);
        out.rangefinders.push({
          slot: i,
          type: t,
          busHint: rngfndBusHint(t, params, i),
        });
      }
    }

    for (let i = 1; i <= 5; i += 1) {
      const v = getp(params, `PRX${i}_TYPE`);
      if (v != null && Math.round(v) > 0) {
        const row = typeRow(PRX_TYPE_INFO, v, "PRX");
        out.proximity.push({ slot: i, ...row });
      }
    }

    const arspdKeys = ["ARSPD_TYPE", "ARSPD2_TYPE", "ARSPD3_TYPE", "ARSPD4_TYPE", "ARSPD5_TYPE", "ARSPD6_TYPE"];
    arspdKeys.forEach((key, idx) => {
      const v = getp(params, key);
      if (v != null && Math.round(v) > 0) {
        const row = typeRow(ARSPD_TYPE_INFO, v, "ARSPD");
        out.airspeeds.push({ slot: idx + 1, param: key, ...row });
      }
    });

    const flowT = getp(params, "FLOW_TYPE");
    if (flowT != null && Math.round(flowT) > 0) {
      out.opticalFlow = typeRow(FLOW_TYPE_INFO, flowT, "FLOW");
    }

    const battKeys = [
      "BATT_MONITOR", "BATT2_MONITOR", "BATT3_MONITOR", "BATT4_MONITOR", "BATT5_MONITOR",
      "BATT6_MONITOR", "BATT7_MONITOR", "BATT8_MONITOR", "BATT9_MONITOR",
    ];
    for (const key of battKeys) {
      const v = getp(params, key);
      if (v == null || Math.round(v) === 0) continue;
      const row = typeRow(BATT_MONITOR_INFO, v, "BATT");
      const type = Math.round(v);
      out.batteries.push({
        key,
        prefix: battParamPrefix(key),
        protocol: battProtocolLabel(type, row),
        busHint: battBusHint(params, key, type),
        type,
        ...row,
      });
    }

    const gpsKeys = [
      ["GPS1_TYPE", "GNSS 1"],
      ["GPS2_TYPE", "GNSS 2"],
      ["GPS_TYPE", "GNSS（主）"],
      ["GPS_TYPE2", "GNSS（副）"],
    ];
    const seenGps = new Set();
    for (const [key, label] of gpsKeys) {
      if (seenGps.has(key)) continue;
      const v = getp(params, key);
      if (v == null || Math.round(v) === 0) continue;
      if (key === "GPS_TYPE" && getp(params, "GPS1_TYPE") != null) continue;
      if (key === "GPS_TYPE2" && getp(params, "GPS2_TYPE") != null) continue;
      seenGps.add(key);
      const row = typeRow(GPS_TYPE_INFO, v, "GPS");
      out.gnss.push({ key, label, ...row });
    }

    const bcn = getp(params, "BCN_TYPE");
    if (bcn != null && Math.round(bcn) > 0) {
      out.beacon = typeRow(BCN_TYPE_INFO, bcn, "BCN");
    }

    return out;
  }

  function hasAnyMountedSensor(mounted) {
    return (
      mounted.compasses.length > 0 ||
      mounted.imus.length > 0 ||
      mounted.baros.length > 0 ||
      mounted.rangefinders.length > 0 ||
      mounted.proximity.length > 0 ||
      mounted.airspeeds.length > 0 ||
      mounted.opticalFlow != null ||
      mounted.batteries.length > 0 ||
      mounted.gnss.length > 0 ||
      mounted.beacon != null
    );
  }

  window.collectArduPilotMountedSensors = collectMountedSensors;
  window.hasArduPilotMountedSensors = hasAnyMountedSensor;
  window.rngfndBusHintForType = rngfndBusHint;
  window.battParamPrefix = battParamPrefix;
  window.battBusHintForMonitor = battBusHint;
  window.PRX_TYPE_INFO = PRX_TYPE_INFO;
})();
