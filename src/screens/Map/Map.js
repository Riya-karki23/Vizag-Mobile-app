// ✅ MAP.js — Office selected => geofence enforced (IN & OUT)
// ✅ FIX: Prevent early-click bypass by resolving mode from storage at click time + disabling button until init completes
// ✅ FIX: Proper API error handling (shows real backend message)
// ✅ FIX: Robust success detection (statusCode/status/data)
// ✅ NEW: Store latest punch location in storage (overwrites previous) after IN/OUT success

import React, { useState, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, Dimensions, Text } from "react-native";
import MapView, { Marker, Circle } from "react-native-maps";
import {
  requestLocationPermission,
  getCurrentLocation,
} from "../../api/requestLocationPermission/requestLocationPermission";
import Icon from "react-native-vector-icons/Ionicons";
import { SafeAreaView } from "react-native-safe-area-context";
import { handleErrorResponse, request } from "../../api/auth/auth";
import { showToast } from "../../constant/toast";
import { logError } from "../../constant/logger";
import Loader from "../../component/loader/appLoader";
import { Colors } from "../../constant/color";
import { Strings } from "../../constant/string_constant";
import LinearGradient from "react-native-linear-gradient";
import BackgroundWrapper from "../../Background";
import images from "../../constant/image";
import { getItemFromStorage, setItemToStorage } from "../../utils/asyncStorage";
import { resetTimer, startTimer, stopTimer } from "../../component/Timer/logDurationTimer";
import { useIsFocused } from "@react-navigation/native";
import { scheduleNotification } from "../../api/requestPushNotificationPermission/requestPushNotificationPermission";

const { width } = Dimensions.get("window");
const baseWidth = 375;
const desiredFontSize = 14;
const responsiveFontSize = desiredFontSize * (width / baseWidth);

const MODE_KEY = "work_mode_selected"; // "office" | "out_duty" | "marketing"

// ✅ Latest punch location storage key (overwrite always)
const LAST_PUNCH_KEY = "last_punch_location"; // { latitude, longitude, time, log_type, mode }

const DEFAULT_OFFICE = {
  latitude: 17.6918384,
  longitude: 83.1997948,
  radius: 500,
};

const MAP = ({ navigation, route }) => {
  const p = route?.params || {};

  // ✅ robust param read (supports imageUrl / image_url / file_url)
  const imageUrl = String(p.imageUrl || p.image_url || p.file_url || "");
  console.log("🧾 MAP received params:", p);
  console.log("✅ MAP resolved imageUrl:", imageUrl);
    const safeImageUrl = String(imageUrl || "");
console.log("📸 Punch IN custom_picture:", safeImageUrl);

  const isFocus = useIsFocused();


  const [mode, setMode] = useState("out_duty"); // safe default
  const [geofenceRadius, setgeofenceRadius] = useState(DEFAULT_OFFICE.radius);
  const [officeLocation, setOfficeLocation] = useState({
    latitude: DEFAULT_OFFICE.latitude,
    longitude: DEFAULT_OFFICE.longitude,
  });

  const [region, setRegion] = useState({
    latitude: 19.076,
    longitude: 72.8777,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  });

  const [permissionGranted, setPermissionGranted] = useState(false);
  const [loading, setLoading] = useState(false);

  const [employeeId, setEmployeeId] = useState(null);
  const [companyName, setcompanyName] = useState("");
  const [isPunchedIn, setIsPunchedIn] = useState(false);
  const [checked, setChecked] = useState(false);

  // ✅ NEW: init complete flag (prevents early-click bypass)
  const [modeReady, setModeReady] = useState(false);

 const normalizeMode = (raw) => {
  const v = String(raw || "").trim().toLowerCase();

  // office aliases
  if (v === "office" || v === "in office") return "office";

  // non-office aliases
  if (v === "marketing") return "marketing";
  if (v === "out_duty" || v === "out duty" || v === "outduty") return "out_duty";
  if (v === "wfh" || v === "work from home" || v === "workfromhome") return "wfh";
  if (v === "anywhere") return "anywhere";

  return v || ""; // never default to office
};

  // ✅ location shape safe
  const pickLatLng = (loc) => {
    const lat = loc?.latitude ?? loc?.coords?.latitude;
    const lng = loc?.longitude ?? loc?.coords?.longitude;
    if (typeof lat === "number" && typeof lng === "number") return { latitude: lat, longitude: lng };
    return null;
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371000;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // ✅ office config ONLY from storage radius (coords always fixed)
  const getOfficeConfig = async () => {
    try {
      const geoFenceRadiusStr = await getItemFromStorage(Strings.offceGeoFenceRadius);
      let r = geoFenceRadiusStr;

      try {
        // handle '"500"' or '500'
        if (typeof r === "string" && r.trim().startsWith('"')) r = JSON.parse(r);
      } catch (e) {}

      const radius = Number(r || DEFAULT_OFFICE.radius);
      const finalRadius = Number.isFinite(radius) ? radius : DEFAULT_OFFICE.radius;

      const finalLat = DEFAULT_OFFICE.latitude;
      const finalLng = DEFAULT_OFFICE.longitude;

      setOfficeLocation({ latitude: finalLat, longitude: finalLng });
      setgeofenceRadius(finalRadius);

      return { officeLat: finalLat, officeLng: finalLng, radius: finalRadius };
    } catch (e) {
      logError("getOfficeConfig error:", e);
      setOfficeLocation({ latitude: DEFAULT_OFFICE.latitude, longitude: DEFAULT_OFFICE.longitude });
      setgeofenceRadius(DEFAULT_OFFICE.radius);
      return { officeLat: DEFAULT_OFFICE.latitude, officeLng: DEFAULT_OFFICE.longitude, radius: DEFAULT_OFFICE.radius };
    }
  };

  const resolveModeNow = async () => {
    const savedMode = normalizeMode(await getItemFromStorage(MODE_KEY));
    return savedMode;
  };

  const storeLatestPunchLocation = async ({ latitude, longitude, log_type, modeLabel }) => {
    try {
      await setItemToStorage(
        LAST_PUNCH_KEY,
        JSON.stringify({
          latitude,
          longitude,
          time: getCurrentDateTime(),
          log_type,
          mode: modeLabel,
        })
      );
    } catch (e) {
      // silent
    }
  };

  const init = async () => {
    try {
      setLoading(true);
      setModeReady(false);

      // ✅ if forced mode passed, store it
      const forced = route?.params?.forceMode;
      if (forced) {
        const resolvedForced = normalizeMode(forced);
        await setItemToStorage(MODE_KEY, resolvedForced);
        setMode(resolvedForced);
      }

      const savedMode = await getItemFromStorage(MODE_KEY);
      const resolvedMode = normalizeMode(savedMode);

      await setItemToStorage(MODE_KEY, resolvedMode);
      setMode(resolvedMode);

      const permission = await requestLocationPermission();
      setPermissionGranted(permission);

      if (!permission) {
        showToast("Location permission is required to use this feature.");
        return;
      }

      const locationData = await getCurrentLocation(true);
      const pos = pickLatLng(locationData);

      if (resolvedMode === "office") {
        await getOfficeConfig();
      }

      if (pos) {
        setRegion({
          latitude: pos.latitude,
          longitude: pos.longitude,
          latitudeDelta: 0.002,
          longitudeDelta: 0.002,
        });
      } else {
        showToast("Location not found. Please retry.");
      }
    } catch (err) {
      logError("init error:", err);
      showToast("Failed to load location. Please retry.");
    } finally {
      setLoading(false);
      setModeReady(true);
    }
  };

  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFocus]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userName = await getItemFromStorage(Strings.userName);
        const session = await getItemFromStorage(Strings.userCookie);
        if (!userName || !session) return;

        const employeeResponse = await request(
          "GET",
          `/api/resource/Employee?filters=[["user_id", "=", "${userName}"]]&fields=["company","name","default_shift","department"]`
        );

        if (employeeResponse?.data?.data?.[0]) {
          const employee = employeeResponse.data.data[0];
          setEmployeeId(employee.name);
          setcompanyName(employee.company);
        }
      } catch (error) {
        logError("Failed to fetch user data:", error?.response || error?.message);
      }
    };

    fetchUserData();
  }, []);

  async function fetchLogType(logType) {
    return request(
      "GET",
      `/api/resource/Employee Checkin?filters=${encodeURIComponent(
        JSON.stringify([
          ["employee", "=", employeeId],
          ["log_type", "=", logType],
        ])
      )}&fields=${encodeURIComponent(
        JSON.stringify(["log_type", "time", "work_mode", "night_shift"])
      )}&order_by=${encodeURIComponent("time desc")}`
    );
  }

  useEffect(() => {
    if (!employeeId) return;

    const checkPunchedIn = async () => {
      try {
        const logTypeIn = await fetchLogType("IN");
        const logTypeOut = await fetchLogType("OUT");

        const combinedLogs = [
          ...(logTypeIn?.data?.data || []),
          ...(logTypeOut?.data?.data || []),
        ].sort((a, b) => new Date(b.time) - new Date(a.time));

        setIsPunchedIn(combinedLogs?.[0]?.log_type === "IN");
      } catch (error) {
        logError("Error fetching check-in data:", error);
      }
    };

    checkPunchedIn();
  }, [employeeId, isFocus]);

  const isOkResponse = (res) => {
    return (
      res?.statusCode === 200 ||
      res?.status === 200 ||
      res?.data?.data ||
      res?.data?.message
    );
  };

  const showApiErrorIfAny = async (res, fallback = "Request failed") => {
    if (res?.error) {
      const msg = await handleErrorResponse(res.error);
      showToast(`${fallback}: ${msg}`);
      return true;
    }
    return false;
  };




  const handlePunchIn = async () => {
    if (!permissionGranted) {
      showToast("Please allow location permission first.");
      await init();
      return;
    }

    if (!employeeId) {
      showToast("Employee not loaded yet. Please wait.");
      return;
    }

    if (!modeReady) {
      showToast("Please wait... loading mode & location.");
      return;
    }

    const resolvedModeNow = await resolveModeNow();
    const mustBeInOffice = resolvedModeNow === "office";

    let officeCfg = null;
    if (mustBeInOffice) {
      officeCfg = await getOfficeConfig();
    }

    setLoading(true);

    try {
      const locationData = await getCurrentLocation(true);
      const pos = pickLatLng(locationData);

      if (!pos) {
        showToast("Failed to retrieve location. Please try again.");
        return;
      }

      const { latitude, longitude } = pos;

      if (mustBeInOffice) {
        const distance = calculateDistance(
          officeCfg.officeLat,
          officeCfg.officeLng,
          latitude,
          longitude
        );

        if (distance > Number(officeCfg.radius || 0)) {
          showToast("You are out of office area. Please go inside office location.");
          return;
        }
      }

      const work_mode =
        mustBeInOffice ? "Office" : resolvedModeNow === "marketing" ? "Marketing" : "Out Duty";

      const response = await request(
        "POST",
        `/api/resource/Employee Checkin`,
        JSON.stringify({
          employee: employeeId,
          log_type: "IN",
          time: getCurrentDateTime(),
          custom_picture: safeImageUrl,
          work_mode,
          latitude,
          longitude,
        })
      );

      // ✅ show real backend error
      if (await showApiErrorIfAny(response, "Punch In failed")) return;

      if (!isOkResponse(response)) {
        showToast(`Punch In failed. Code: ${response?.statusCode || response?.status || "NA"}`);
        return;
      }

      // ✅ store latest punch location (overwrite previous)
      await storeLatestPunchLocation({ latitude, longitude, log_type: "IN", modeLabel: work_mode });

      scheduleNotification(new Date());
      startTimer();
      showToast("Check In successful!", false);
      navigation.navigate("Home");
    } catch (error) {
      logError("Punch In error:", error);
      showToast(`Failed to process punch in. Please try again. ${error?.message || ""}`);
    } finally {
      setLoading(false);
    }
  };

  const getAttendanceStatus = (totalHours) => {
    const [hours] = (totalHours || "0:0").split(":").map(Number);
    if (hours < 4) return "Absent";
    if (hours >= 4 && hours <= 7) return "Half Day";
    return "Present";
  };

  const getOvertime = async (totalHoursStr) => {
    const totalHours = parseFloat(totalHoursStr || "0");
    const normalHours = 8;
    return totalHours > normalHours ? totalHours - normalHours : 0;
  };

  const markAttendance = async (data) => {
    try {
      const response = await request("POST", `/api/resource/Attendance`, JSON.stringify(data));
      if (response?.error) {
        showToast(`Failed to mark attendance ${await handleErrorResponse(response.error)}`);
      }
    } catch (error) {
      logError(`Failed to mark attendance`, error);
    }
  };



  const handlePunchOut = async () => {
    if (!permissionGranted) {
      showToast("Please allow location permission first.");
      await init();
      return;
    }

    if (!employeeId) {
      showToast("Employee not loaded yet. Please wait.");
      return;
    }

    if (!modeReady) {
      showToast("Please wait... loading mode & location.");
      return;
    }

    setLoading(true);

    try {
      const locationData = await getCurrentLocation(true);
      const pos = pickLatLng(locationData);

      if (!pos) {
        showToast("Failed to retrieve location. Please try again.");
        return;
      }

      const { latitude, longitude } = pos;

      const logTypeIn = await fetchLogType("IN");
      const lastInRow = logTypeIn?.data?.data?.[0];

      if (!lastInRow) {
        showToast("No IN record found. Please check your logs.");
        return;
      }

      const totalHours = await getItemFromStorage(Strings.totalHours);

    
      
  // ✅ only CURRENT selected mode matters (not last IN mode)
const resolvedModeNow = await resolveModeNow();
const currentSelectedOffice = normalizeMode(resolvedModeNow) === "office";

// ✅ enforce ONLY if CURRENT selected mode is office
if (currentSelectedOffice) {
  const officeCfg = await getOfficeConfig();
  const distance = calculateDistance(
    officeCfg.officeLat,
    officeCfg.officeLng,
    latitude,
    longitude
  );

  if (distance > Number(officeCfg.radius || 0)) {
    showToast("You are out of office area. Please go inside office location.");
    return;
  }
}

// ✅ OUT work_mode based ONLY on current selection
const selected = normalizeMode(resolvedModeNow);
const resolvedOutMode =
  selected === "office"
    ? "Office"
    : selected === "marketing"
    ? "Marketing"
    : "Out Duty";



      const response = await request(
        "POST",
        `/api/resource/Employee Checkin`,
        JSON.stringify({
          employee: employeeId,
          log_type: "OUT",
          time: getCurrentDateTime(),
          custom_picture: safeImageUrl,

          custom_hours: totalHours,
          work_mode: resolvedOutMode,
          latitude,
          longitude,
        })
      );

      // ✅ show real backend error
      if (await showApiErrorIfAny(response, "Punch Out failed")) return;

      if (!isOkResponse(response)) {
        showToast(`Punch Out failed. Code: ${response?.statusCode || response?.status || "NA"}`);
        return;
      }

      // ✅ store latest punch location (overwrite previous)
      await storeLatestPunchLocation({ latitude, longitude, log_type: "OUT", modeLabel: resolvedOutMode });

      if (checked) {
        await markAttendance({
          employee: employeeId,
          status: getAttendanceStatus(totalHours),
          docstatus: 1,
          attendance_date: new Date().toISOString().split("T")[0],
          company: companyName,
          custom_total_working_hours: totalHours,
          custom_overtime_hours: await getOvertime(totalHours),
        });
        await stopTimer();
        await resetTimer();
      }

      stopTimer();
      showToast("Check Out successful!", false);

      navigation.reset({
        index: 0,
        routes: [{ name: "Main" }],
      });
    } catch (error) {
      logError("Punch Out error:", error);
      showToast(`Failed to process punch out. Please try again. ${error?.message || ""}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <BackgroundWrapper imageSource={images.mainBackground}>
      <SafeAreaView style={{ flex: 1 }}>
        {!loading && (
          <View style={styles.container}>
            <View>
              <TouchableOpacity style={styles.backButtonOUT} onPress={() => navigation.goBack()}>
                <Icon name="chevron-back" size={35} color={Colors.orangeColor} />
              </TouchableOpacity>

              {isPunchedIn ? (
                <TouchableOpacity onPress={handlePunchOut} disabled={!modeReady}>
                  <LinearGradient colors={[Colors.orangeColor, Colors.redColor]} style={styles.punchOutButton}>
                    <Text style={styles.buttonText}>Check Out</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={handlePunchIn} disabled={!modeReady}>
                  <LinearGradient colors={[Colors.orangeColor, Colors.redColor]} style={styles.orangeButton}>
                    <Text style={styles.buttonText}>Check In</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}

              {!modeReady && (
                <Text style={{ color: Colors.orangeColor, textAlign: "center", marginTop: 8 }}>
                  Loading mode & location...
                </Text>
              )}
            </View>

            {permissionGranted ? (
              <View style={styles.mapContainer}>
                <MapView
                  style={styles.map}
                  region={region?.latitude && region?.longitude ? region : undefined}
                  showsUserLocation={false}
                  showsMyLocationButton={true}
                >
                  {normalizeMode(mode) === "office" && officeLocation?.latitude && officeLocation?.longitude && (
                    <>
                      <Marker coordinate={officeLocation} pinColor="red" />
                      <Circle
                        center={officeLocation}
                        radius={Number(geofenceRadius || DEFAULT_OFFICE.radius)}
                        fillColor="rgba(255, 105, 0, 0.2)"
                        strokeColor="rgba(255, 105, 0, 0.5)"
                      />
                    </>
                  )}
                </MapView>
              </View>
            ) : (
              <Text style={{ color: Colors.orangeColor, fontSize: 18, textAlign: "center", marginTop: 40 }}>
                Location permission is required to use this feature.
              </Text>
            )}
          </View>
        )}

        {loading && <Loader isLoading={loading} />}
      </SafeAreaView>
    </BackgroundWrapper>
  );
};

export const getCurrentDateTime = () => {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  orangeButton: {
    marginTop: 5,
    height: 50,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 12,
    marginHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  punchOutButton: {
    height: 50,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 12,
    marginTop: 10,
    marginHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: Colors.whiteColor,
    fontSize: responsiveFontSize,
    textAlign: "center",
    fontWeight: "600",
  },
  mapContainer: {
    flex: 1,
    marginTop: 10,
    borderRadius: 8,
    overflow: "hidden",
    shadowColor: Colors.blackColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  map: { width: "100%", height: "100%" },
  backButtonOUT: { marginLeft: 10, marginTop: 5, marginBottom: 10 },
});

export default MAP;
