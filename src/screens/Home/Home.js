// ✅ Home.js — Removed previous page/location dependency.
// ✅ Only change: Home no longer depends on route params/mode.
// ✅ Flow: Home -> ShowCamera -> MAP (MAP will decide mode from storage)
// ✅ NEW: Show last punch location (stored by MAP after IN/OUT) WITHOUT changing other flow

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  BackHandler,
  Alert,
  Image,
  Platform,
} from "react-native";

import { handleErrorResponse, request } from "../../api/auth/auth";
import Icon from "react-native-vector-icons/Ionicons";
import IconMaterial from "react-native-vector-icons/Fontisto";
import FontAwesomeIcon from "react-native-vector-icons/FontAwesome";
import { CommonActions, useIsFocused, useNavigation } from "@react-navigation/native";
import TopBar from "../../component/TopBar/TopBar";
import LinearGradient from "react-native-linear-gradient";
import { ScrollView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { logError, logInfo } from "../../constant/logger";
import { Colors } from "../../constant/color";
import CustomText from "../../component/CustomText/customText";
import images from "../../constant/image";
import BackgroundWrapper from "../../Background";
import { getItemFromStorage, setItemToStorage } from "../../utils/asyncStorage";
import { Strings } from "../../constant/string_constant";
import Timer from "../../component/Timer/Timer";
import {
  resetTimer,
  startTimer,
  stopTimer,
} from "../../component/Timer/logDurationTimer";
import { showToast } from "../../constant/toast";
import { OneSignal } from "react-native-onesignal";
import axios from "axios";

// ✅ same key used in MAP.js
const LAST_PUNCH_KEY = "last_punch_location";

// ✅ FIX: logoutTimer must be let (you clear it later)
let logoutTimer = null;

const Home = () => {
  const navigation = useNavigation();
  const [punchInTime, setPunchInTime] = useState("- -");
  const [punchOutTime, setPunchOutTime] = useState("- -");
  const [punchInDate, setPunchInDate] = useState("- -");
  const [punchOutDate, setPunchOutDate] = useState("- -");
  const [employeeId, setEmployeeId] = useState(null);
  const [workMode, setWorkMode] = useState("NA");
  const [buttonText, setbuttonText] = useState("CHECK-IN");
  const [userName, setUserName] = useState("");
  const [userData, setUserData] = useState(null);
  const [designation, setDesignation] = useState("");
  const [baseURL, setBaseUrl] = useState("");
  const [companyName, setcompanyName] = useState("");
  const [isManuFactuer, setIsManuFacturer] = useState(false);
  const isFocused = useIsFocused();

  // ✅ optional display
  const [lastPunchLocationText, setLastPunchLocationText] = useState("");

  useEffect(() => {
    const init = async () => {
      await fetchUserData();
      await checkSubcription();
    };
    init();
  }, []);

  useEffect(() => {
    if (employeeId) {
      checkPunchedIn();
      scheduleLogoutBeforeMidnight();
    }
  }, [employeeId]);

  useEffect(() => {
    return () => {
      if (logoutTimer) {
        clearTimeout(logoutTimer);
        logoutTimer = null;
      }
    };
  }, []);

  // ✅ pull last location stored by MAP after IN/OUT (always latest)
  const loadLastPunchLocation = async () => {
    try {
      const raw = await getItemFromStorage(LAST_PUNCH_KEY);
      if (!raw) {
        setLastPunchLocationText("");
        return;
      }
      const obj = typeof raw === "string" ? JSON.parse(raw) : raw;
      const lat = obj?.latitude;
      const lng = obj?.longitude;
      const type = obj?.log_type || "";
      const mode = obj?.mode || "";
      if (typeof lat === "number" && typeof lng === "number") {
        setLastPunchLocationText(
          `${type ? type + " • " : ""}${mode ? mode + " • " : ""}${lat.toFixed(5)}, ${lng.toFixed(5)}`
        );
      } else {
        setLastPunchLocationText("");
      }
    } catch (e) {
      setLastPunchLocationText("");
    }
  };

  useEffect(() => {
    if (isFocused) loadLastPunchLocation();
  }, [isFocused]);

  const checkSubcription = async () => {
    try {
      const baseURL = await getItemFromStorage(Strings.baseURL);
      const fetchID = await fetch(
        `https://erp.multark.com/api/method/custom_theme.api.get_hrms_data?customer_url=${baseURL}`
      );
      const fetchDataID = await fetchID.json();
      const response = await axios.get(
        `https://erp.multark.com/api/resource/HRMS Mobile App Registration/${fetchDataID.message.data[0].name}`
      );

      if (response.data && response.data.data) {
        const { data } = response.data;

        const subscriptionDate = new Date(data.valid_till);
        const currentDate = new Date();

        const onlyDate1 = new Date(currentDate).toISOString().split("T")[0];
        const onlyDate2 = new Date(subscriptionDate).toISOString().split("T")[0];

        if (onlyDate1 <= onlyDate2) {
          logInfo("Subscription is valid.");
          await setItemToStorage(Strings.companyLogo, data?.custom_company_logo);
          await setItemToStorage(Strings.baseURL, data.customer_url);
        } else {
          Alert.alert(
            "Subscription Error",
            "Your subscription is invalid or expired.\n\nPlease contact support:\nEmail: support@multark.com\nWebsite: https://erp.multark.com/about",
            [],
            { cancelable: false }
          );
          logInfo("Subscription is not yet valid.");
        }
      } else {
        logInfo("No data found or invalid response.");
      }
    } catch (error) {
      logError("Error submitting company:", error);
    }
  };

  const scheduleLogoutBeforeMidnight = async () => {
    const baseURL = await getItemFromStorage(Strings.baseURL);
    if (baseURL !== "http://vizagsteel.multark.com") {
      const now = new Date();
      const logoutTime = new Date();
      logoutTime.setHours(23, 59);
      let timeUntilLogout = logoutTime.getTime() - now.getTime();
      if (timeUntilLogout < 0) timeUntilLogout += 24 * 60 * 60 * 1000;

      if (logoutTimer) {
        clearTimeout(logoutTimer);
        logoutTimer = null;
      }
    }
  };

  const logoutUser = async () => {
    const baseURL = await getItemFromStorage(Strings.baseURL);
    if (baseURL !== "http://vizagsteel.multark.com") {
      if (buttonText === "CHECK-OUT") {
        await checkPunchedIn();
      }
      showToast("Logging out user", false);
      await setItemToStorage(Strings.offceCoordinate, "");
      await setItemToStorage(Strings.offceGeoFenceRadius, "");
      await setItemToStorage("work_mode_selected", "");
      await setItemToStorage(LAST_PUNCH_KEY, ""); // ✅ clear last stored location

      await setItemToStorage(Strings.userCookie, null);
      await setItemToStorage(Strings.isLoggedIn, "false");

      navigation.dispatch(
        CommonActions.reset({ index: 0, routes: [{ name: "Login" }] })
      );
    }
  };

  const getIndianTimeFromDateString = (dateString) => {
    const date = new Date(dateString);
    const options = { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true };
    let indianTime = date.toLocaleString("en-IN", { ...options }).toUpperCase();
    indianTime = indianTime.replace(/^(\d):/, "0$1:");
    return indianTime;
  };

  const getIndianDateFromDateString = (dateString) => {
    const date = new Date(dateString);
    const options = { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "Asia/Kolkata" };
    let indianTime = date.toLocaleString("en-IN", { ...options }).toUpperCase();
    indianTime = indianTime.replace(/^(\d):/, "0$1:");
    return indianTime;
  };

  useEffect(() => {
    const backAction = () => {
      if (navigation.canGoBack()) navigation.goBack();
      else {
        Alert.alert("Confirm Exit", "Are you sure you want to exit the app?", [
          { text: "Cancel", onPress: () => null, style: "cancel" },
          { text: "Yes", onPress: () => BackHandler.exitApp() },
        ]);
      }
      return true;
    };

    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => backHandler.remove();
  }, [navigation]);

  useEffect(() => {
    if (employeeId && isFocused) {
      checkPunchedIn();
      loadLastPunchLocation();
    }
  }, [employeeId, isFocused]);

  const checkPunchedIn = async () => {
    const isLoggedIn = await getItemFromStorage(Strings.isLoggedIn);
    if (isLoggedIn !== "true") return;

    try {
      const logTypeIn = await request(
        "GET",
        `/api/resource/Employee Checkin?filters=${encodeURIComponent(
          JSON.stringify([["employee", "=", employeeId], ["log_type", "=", "IN"]])
        )}&fields=${encodeURIComponent(JSON.stringify(["log_type", "time", "work_mode"]))}&order_by=${encodeURIComponent("time desc")}`
      );

      const logTypeOut = await request(
        "GET",
        `/api/resource/Employee Checkin?filters=${encodeURIComponent(
          JSON.stringify([["employee", "=", employeeId], ["log_type", "=", "OUT"]])
        )}&fields=${encodeURIComponent(JSON.stringify(["log_type", "time"]))}&order_by=${encodeURIComponent("time desc")}`
      );

      let punchInTime = "- -";
      let punchOutTime = "- -";
      let punchInDate = "- -";
      let punchOutDate = "- -";

      if (logTypeIn.data?.data?.length > 0) {
        const inLog = logTypeIn.data.data[0];
        punchInTime = getIndianTimeFromDateString(inLog.time);
        punchInDate = getIndianDateFromDateString(inLog.time);

        let wm = inLog.work_mode || "";
        if (!wm) {
          const saved = await getItemFromStorage("work_mode_selected");
          wm =
            saved === "office"
              ? "Office"
              : saved === "marketing"
              ? "Marketing"
              : saved === "out_duty"
              ? "Out Duty"
              : "NA";
        }
        setWorkMode(wm);

        setPunchInTime(punchInTime);
        setPunchInDate(punchInDate);
      } else {
        setPunchInTime("- -");
        setPunchInDate("- -");
        setWorkMode("NA");
      }

      if (logTypeOut.data?.data?.length > 0 && logTypeIn.data?.data?.length > 0) {
        const outLog = logTypeOut.data.data[0];
        const inLog = logTypeIn.data.data[0];
        if (new Date(outLog.time) > new Date(inLog.time)) {
          punchOutTime = getIndianTimeFromDateString(outLog.time);
          punchOutDate = getIndianDateFromDateString(outLog.time);
        }
        setPunchOutTime(punchOutTime);
        setPunchOutDate(punchOutDate);
      } else {
        setPunchOutTime("- -");
        setPunchOutDate("- -");
      }

      const combinedLogs = [
        ...(logTypeIn.data?.data || []),
        ...(logTypeOut.data?.data || []),
      ].sort((a, b) => new Date(b.time) - new Date(a.time));

      if (combinedLogs.length > 0) {
        const latestLog = combinedLogs[0];
        if (latestLog.log_type === "IN") {
          setbuttonText("CHECK-OUT");
          startTimer();
        } else {
          setbuttonText("CHECK-IN");
          stopTimer();
        }
      } else {
        setbuttonText("CHECK-IN");
        stopTimer();
      }
    } catch (error) {
      logError("Error fetching check-in data:", error);
    }
  };

  // ✅ CHANGE: No route/mode logic here. Always go camera -> map.
  const handlePunchInRedirect = async () => {
    navigation.navigate("ShowCamera");
  };

  const isCookieExpired = (cookie) => {
    if (!cookie) return true;
    const match = cookie.match(/Expires=([^;]+)/);
    if (!match) return true;
    const expiryDate = new Date(match[1]);
    const formattedDate = new Date(expiryDate).toISOString().split("T")[0];
    const currentDate = new Date().toISOString().split("T")[0];
    return currentDate >= formattedDate;
  };

  const fetchUserData = async () => {
    try {
      const session = await getItemFromStorage(Strings.userCookie);

      if (!session || isCookieExpired(session)) {
        showToast("Session expired. Please log in again.");
        await setItemToStorage(Strings.userCookie, "");
        await setItemToStorage(Strings.isLoggedIn, "false");
        navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: "Login" }] }));
        return;
      }

      const baseURL = await getItemFromStorage(Strings.baseURL);
      setBaseUrl(baseURL);

      const userName = await getItemFromStorage(Strings.userName);
      const userResponse = await request("GET", `/api/resource/User/${userName}`);

      if (!userResponse || isCookieExpired(session)) {
        showToast("Session is expired. Please log in again.");
        await setItemToStorage(Strings.userCookie, "");
        await setItemToStorage(Strings.isLoggedIn, "false");
        navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: "Login" }] }));
      } else {
        if (userName && session) {
          var isProductionManager = userResponse.data.data.roles.some(
            (role) =>
              role.role === "Manufacturing User" || role.role === "Manufacturing Manager"
          );

          setIsManuFacturer(isProductionManager);
          setUserName(userName);
          const employeeResponse = await request(
            "GET",
            `/api/resource/Employee?filters=[["user_id", "=", "${userName}"]]`
          );
          if (employeeResponse.data.data[0]) {
            const detailedEmployeeResponse = await request(
              "GET",
              `/api/resource/Employee/${employeeResponse.data.data[0].name}`
            );
            setDesignation(detailedEmployeeResponse.data?.data?.designation ?? "");
            setUserData(userResponse.data.data);
            const employee = employeeResponse.data.data[0];
            setEmployeeId(employee.name);
            setcompanyName(detailedEmployeeResponse.data?.data?.company);
          } else {
            logError("Employee not found for the given user", employeeResponse.data.data[0]);
            showToast("Employee not found for the given user");
          }
        } else {
          logError("No user information found");
        }
      }
    } catch (error) {
      logError("Failed to fetch user data:", error.response || error.message);
    }
  };

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <BackgroundWrapper imageSource={images.mainBackground}>
      <View style={styles.container}>
        <SafeAreaView style={{ flex: 1 }}>
          <TopBar />
          <View style={styles.mainContent}>
            <ScrollView>
              <View style={styles.card}>
                <CustomText
                  style={{
                    paddingTop: 20,
                    paddingLeft: 20,
                    fontSize: 18,
                    fontWeight: Platform.OS == "ios" ? 600 : null,
                    color: Colors.blackColor,
                  }}
                >
                  👋 Hello,{" " + (userData?.first_name ?? "") + " " + (userData?.last_name ?? "")}
                </CustomText>

                {designation && (
                  <CustomText
                    style={{
                      paddingLeft: 30,
                      fontSize: 15,
                      fontWeight: Platform.OS == "ios" ? 700 : null,
                      color: Colors.orangeColor,
                    }}
                  >
                    {designation}
                  </CustomText>
                )}

                <CustomText
                  style={{
                    paddingLeft: 30,
                    fontSize: 14,
                    fontWeight: Platform.OS == "ios" ? 600 : null,
                    color: Colors.lightGreyColor,
                  }}
                >
                  {formattedDate}
                </CustomText>

                <View>
                  <Timer punchInTime={punchInTime} punchOutTime={punchOutTime} />
                </View>

                <View style={[styles.locationStatus, { paddingTop: 15, paddingLeft: 20 }]}>
                  <View>
                    <Image source={images.locationIcon} />
                  </View>
                  <View>
                    <CustomText style={[styles.punchLocation, { paddingTop: 3 }]}>
                      {workMode}
                    </CustomText>
                    {!!lastPunchLocationText && (
                      <CustomText style={{ marginTop: 4, color: Colors.lightGreyColor, fontSize: 12 }}>
                        {lastPunchLocationText}
                      </CustomText>
                    )}
                  </View>
                </View>

                <View style={{ flexDirection: "row", justifyContent: "space-between", margin: 10 }}>
                  <View style={{ flexDirection: "column", marginTop: 10, marginLeft: 20, marginRight: 20 }}>
                    <CustomText style={styles.punchText}>Check In</CustomText>
                    {punchInTime && <CustomText style={styles.punchTime}>{punchInTime}</CustomText>}
                  </View>

                  <View style={{ flexDirection: "column", margin: 10 }}>
                    <CustomText style={styles.punchText}>Check Out</CustomText>
                    {punchOutTime && <CustomText style={styles.punchTime}>{punchOutTime}</CustomText>}
                  </View>
                </View>

                <TouchableOpacity
                  style={{
                    alignItems: "center",
                    height: 50,
                    borderRadius: 16,
                    marginBottom: 10,
                    marginLeft: 20,
                    marginRight: 20,
                  }}
                  onPress={handlePunchInRedirect}
                >
                  <LinearGradient
                    colors={[Colors.orangeColor, Colors.redColor]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={{
                      alignItems: "center",
                      width: "100%",
                      height: 50,
                      marginLeft: 20,
                      marginRight: 20,
                      borderRadius: 16,
                      paddingTop: 14,
                    }}
                  >
                    <CustomText
                      style={[
                        styles.punchText,
                        {
                          color: Colors.whiteColor,
                          fontWeight: Platform.OS == "ios" ? 800 : null,
                        },
                      ]}
                    >
                      {buttonText}
                    </CustomText>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              <View style={styles.favCard}>
                <View style={styles.favStatus}>
                  <TouchableOpacity style={styles.favSubCard} onPress={() => navigation.navigate("Attendance")}>
                    <View style={styles.favStatusText}>
                      <CustomText style={styles.punchText}>Check In/Out</CustomText>
                    </View>
                    <View style={styles.favStatusIcon}>
                      <Icon name="time-outline" size={45} color={Colors.orangeColor} />
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity style={[styles.favSubCard]} onPress={() => navigation.navigate("ViewAttendance")}>
                    <View style={styles.favStatusText}>
                      <CustomText style={styles.punchText}>Attendance Record</CustomText>
                    </View>
                    <View style={styles.favStatusIcon}>
                      <FontAwesomeIcon name="calendar-check-o" size={45} color={Colors.orangeColor} />
                    </View>
                  </TouchableOpacity>
                </View>

                <View style={[styles.favStatus, { width: !isManuFactuer ? "50%" : null }]}>
                  <TouchableOpacity
                    style={[styles.favSubCard, { width: "45%", marginBottom: 20 }]}
                    onPress={() => navigation.navigate("HolidayList")}
                  >
                    <View style={styles.favStatusText}>
                      <CustomText style={styles.punchText}>Holiday's</CustomText>
                    </View>
                    <View style={styles.favStatusIcon}>
                      <IconMaterial name="holiday-village" size={45} color={Colors.orangeColor} />
                    </View>
                  </TouchableOpacity>

                  {isManuFactuer && (
                    <TouchableOpacity style={[styles.favSubCard]} onPress={() => navigation.navigate("Production Entry")}>
                      <View style={styles.favStatusText}>
                        <CustomText style={styles.punchText}>Production Entry</CustomText>
                      </View>
                      <View style={styles.favStatusIcon}>
                        <FontAwesomeIcon name="industry" size={45} color={Colors.orangeColor} />
                      </View>
                    </TouchableOpacity>
 )}

 
                </View>
                 <TouchableOpacity
      style={[styles.favSubCard]}
      onPress={() => navigation.navigate("Late Collection")}
    >
      <View style={styles.favStatusText}>
        <CustomText style={styles.punchText}>Late Collection</CustomText>
      </View>
      <View style={styles.favStatusIcon}>
        <Icon name="alert-circle-outline" size={45} color={Colors.orangeColor} />
      </View>
    </TouchableOpacity>
  
              </View>
            </ScrollView>
          </View>
        </SafeAreaView>
      </View>
    </BackgroundWrapper>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  mainContent: { flex: 1, paddingHorizontal: 10 },

  card: {
    backgroundColor: Colors.whiteColor,
    width: "auto",
    margin: 10,
    borderRadius: 16,
    shadowColor: Colors.blackColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 10,
  },

  punchText: {
    textAlign: "center",
    color: Colors.darkGreyColor,
    fontWeight: Platform.OS == "ios" ? 700 : null,
    fontSize: 16,
  },
  punchTime: {
    textAlign: "center",
    color: Colors.blackColor,
    fontWeight: Platform.OS == "ios" ? 700 : null,
    fontFamily: Strings.fontFamilyConstant,
    fontSize: 18,
    paddingTop: 10,
  },
  locationStatus: { flex: 1, flexDirection: "row" },
  punchLocation: {
    textAlign: "left",
    color: Colors.blackColor,
    fontWeight: Platform.OS == "ios" ? 600 : null,
    fontSize: 17,
  },

  favCard: { width: "auto", height: "48%" },
  favStatus: { flex: 1, flexDirection: "row" },
  favSubCard: {
    flex: 1,
    height: 150,
    flexDirection: "column",
    backgroundColor: Colors.whiteColor,
    borderRadius: 13,
    shadowColor: Colors.blackColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 10,
    paddingTop: 20,
    paddingBottom: 10,
    margin: 10,
  },
  favStatusText: {
    flex: 1,
    marginLeft: 21,
    marginRight: 40,
    flexDirection: "column",
    textAlign: "left",
    alignItems: "flex-start",
    justifyContent: "flex-start",
  },
  favStatusIcon: {
    flex: 1,
    paddingTop: 20,
    paddingRight: 19,
    flexDirection: "column",
    alignItems: "flex-end",
    justifyContent: "center",
  },
});

export default Home;
