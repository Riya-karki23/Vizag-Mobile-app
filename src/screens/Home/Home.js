import React, { useState, useEffect } from "react";
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
import {
  CommonActions,
  useIsFocused,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
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
import { MULTARK_URL } from "../../constant/app_url";
import {
  resetTimer,
  startTimer,
  stopTimer,
} from "../../component/Timer/logDurationTimer";
import { showToast } from "../../constant/toast";
import { getCurrentLocation } from "../../api/requestLocationPermission/requestLocationPermission";
import { OneSignal } from "react-native-onesignal";
import { getCurrentDateTime } from "../Map/Map";
import axios from "axios";

const Home = () => {
  const navigation = useNavigation();
  const route = useRoute();
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
  const isFocused = useIsFocused();
  useEffect(() => {
    fetchUserData();
    scheduleLogoutBeforeMidnight();
    checkSubcription();
  }, []);

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

        // Parse the date_of_subscription
        const subscriptionDate = new Date(data.valid_till);
        const currentDate = new Date();

        const date1 = new Date(currentDate);
        const date2 = new Date(subscriptionDate);

        // Extract the date part (YYYY-MM-DD)
        const onlyDate1 = date1.toISOString().split("T")[0];
        const onlyDate2 = date2.toISOString().split("T")[0];

        if (onlyDate1 <= onlyDate2) {
          logInfo("Subscription is valid.");
          await setItemToStorage(Strings.baseURL, data.customer_url);
        } else {
          Alert.alert(
            "Subscription Error",
            "Your subscription is invalid or expired.\n\nPlease contact support:\nEmail: support@multark.com\nWebsite: https://erp.multark.com/about",
            [],
            {
              cancelable: false,
            }
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
    if (baseURL !== "http://akgni.in") {
      await checkPunchedIn();
      const now = new Date();
      const logoutTime = new Date();
      logoutTime.setHours(23, 59);
      let timeUntilLogout = logoutTime.getTime() - now.getTime();
      if (timeUntilLogout < 0) {
        timeUntilLogout += 24 * 60 * 60 * 1000;
      }
      setTimeout(() => {
        logoutUser();
      }, timeUntilLogout);
    }
  };
  const logoutUser = async () => {
    const baseURL = await getItemFromStorage(Strings.baseURL);
    if (baseURL !== "http://akgni.in") {
      if (buttonText === "CHECK-OUT") {
        // await handlePunchOut();
        await checkPunchedIn();
      }
      showToast("Logging out user", false);
      await setItemToStorage(Strings.userCookie, "");
      await setItemToStorage(Strings.isLoggedIn, "false");
      navigation.dispatch(
        CommonActions.reset({ index: 0, routes: [{ name: "Login" }] })
      );
    }
  };
  async function fetchLogType(logType) {
    const currentDate = new Date().toISOString().split("T")[0];
    const response = await request(
      "GET",
      `/api/resource/Employee Checkin?filters=${encodeURIComponent(
        JSON.stringify([
          ["employee", "=", employeeId],
          ["log_type", "=", logType],
          // ["time", ">=", `${currentDate} 00:00:00`],
          // ["time", "<=", `${currentDate} 23:59:59`],
        ])
      )}&fields=${encodeURIComponent(JSON.stringify(["log_type", "time", "custom_work_mode"]))}&order_by=${encodeURIComponent("time desc")}`
    );
    return response;
  }
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371000;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };
  const handlePunchOut = async () => {
    try {
      const locationData = await getCurrentLocation(true);
      if (!locationData) {
        showToast("Failed to retrieve location. Please try again.");
        return;
      }
      const offcieLocation = await getItemFromStorage(Strings.offceCoordinate);
      const geoFenceRadius = await getItemFromStorage(
        Strings.offceGeoFenceRadius
      );
      const { latitude, longitude } = locationData;
      const distance = calculateDistance(
        offcieLocation.latitude,
        offcieLocation.longitude,
        latitude,
        longitude
      );
      const logTypeIn = await fetchLogType("IN");
      const totalHours = await getItemFromStorage(Strings.totalHours);
      if (logTypeIn.data.data[0].custom_work_mode == "Office") {
        if (distance <= geoFenceRadius) {
          const response = await request(
            "POST",
            `/api/resource/Employee Checkin`,
            JSON.stringify({
              employee: employeeId,
              log_type: "OUT",
              time: getCurrentDateTime(),
              custom_hours: totalHours,
              custom_work_mode: logTypeIn.data.data[0].custom_work_mode,
              latitude: latitude,
              longitude: longitude,
            })
          );
          if (response.statusCode == 200) {
            await markAttendance({
              employee: employeeId,
              status: getAttendanceStatus(totalHours),
              docstatus: 1,
              attendance_date: new Date().toISOString().split("T")[0],
              company: companyName,
            });
            const punchOutTime = new Date().toLocaleTimeString();
            stopTimer();
            showToast("Check Out successful!", false);
          } else {
            showToast("Punch Out failed. Please try again.");
          }
        } else {
          showToast("Error: You are currently outside the office location!");
        }
      } else {
        const response = await request(
          "POST",
          `/api/resource/Employee Checkin`,
          JSON.stringify({
            employee: employeeId,
            log_type: "OUT",
            custom_hours: totalHours,
            custom_work_mode: logTypeIn.data.data[0].custom_work_mode,
            latitude: latitude,
            longitude: longitude,
          })
        );
        if (response.statusCode == 200) {
          await markAttendance({
            employee: employeeId,
            status: getAttendanceStatus(totalHours),
            docstatus: 1,
            attendance_date: new Date().toISOString().split("T")[0],
            company: companyName,
          });
          const punchOutTime = new Date().toLocaleTimeString();
          await stopTimer();
          showToast("Check Out successful!", false);
        } else {
          showToast("Punch Out failed. Please try again.");
        }
      }
    } catch (error) {
      // await stopTimer();
      logError("error", error);
      showToast(`Failed to process punch out. Please try again. ${error}`);
    }
  };

  const markAttendance = async (data) => {
    try {
      const response = await request(
        "POST",
        `/api/resource/Attendance`,
        JSON.stringify(data)
      );
      if (response?.error) {
        showToast(
          `Failed to mark attendance ${await handleErrorResponse(response.error)}`
        );
      }
    } catch (error) {
      logError(`Failed to mark attendance `, error);
    }
  };
  const getAttendanceStatus = (totalHours) => {
    const [hours] = totalHours.split(":").map(Number);
    if (hours < 4) {
      return "Absent";
    } else if (hours >= 4 && hours <= 7) {
      return "Half Day";
    } else {
      return "Present";
    }
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
      const baseURL = await getItemFromStorage(Strings.baseURL);
      setBaseUrl(baseURL);
      const userName = await getItemFromStorage(Strings.userName);
      const session = await getItemFromStorage(Strings.userCookie);
      const userResponse = await request(
        "GET",
        `/api/resource/User/${userName}`
      );
      if (!userResponse || isCookieExpired(session)) {
        showToast("Session is expired. Please log in again.");
        await setItemToStorage(Strings.userCookie, "");
        await setItemToStorage(Strings.isLoggedIn, "false");
        navigation.dispatch(
          CommonActions.reset({ index: 0, routes: [{ name: "Login" }] })
        );
      } else {
        if (userName && session) {
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
            setDesignation(
              detailedEmployeeResponse.data?.data?.designation ?? ""
            );
            setUserData(userResponse.data.data);
            const employee = employeeResponse.data.data[0];
            setEmployeeId(employee.name);
            setcompanyName(detailedEmployeeResponse.data?.data?.company);
          } else {
            logError(
              "Employee not found for the given user",
              employeeResponse.data.data[0]
            );
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

  const getIndianTimeFromDateString = (dateString) => {
    const date = new Date(dateString);
    const options = {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    };
    let indianTime = date.toLocaleString("en-IN", { ...options }).toUpperCase();
    indianTime = indianTime.replace(/^(\d):/, "0$1:");
    return indianTime;
  };
  const getIndianDateFromDateString = (dateString) => {
    const date = new Date(dateString);
    const options = {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",

      timeZone: "Asia/Kolkata",
    };
    let indianTime = date.toLocaleString("en-IN", { ...options }).toUpperCase();
    indianTime = indianTime.replace(/^(\d):/, "0$1:");
    return indianTime;
  };
  useEffect(() => {
    const backAction = () => {
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        Alert.alert("Confirm Exit", "Are you sure you want to exit the app?", [
          { text: "Cancel", onPress: () => null, style: "cancel" },
          { text: "Yes", onPress: () => BackHandler.exitApp() },
        ]);
      }
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, [navigation]);
  useEffect(() => {
    checkPunchedIn();
  });

  const checkPunchedIn = async () => {
    const currentDate = new Date().toISOString().split("T")[0];
    try {
      const logTypeIn = await request(
        "GET",
        `/api/resource/Employee Checkin?filters=${encodeURIComponent(
          JSON.stringify([
            ["employee", "=", employeeId],
            ["log_type", "=", "IN"],
            // ["time", ">=", `${currentDate} 00:00:00`],
            // ["time", "<=", `${currentDate} 23:59:59`],
          ])
        )}&fields=${encodeURIComponent(JSON.stringify(["log_type", "time", "custom_work_mode"]))}&order_by=${encodeURIComponent("time desc")}`
      );
      if (logTypeIn.data?.data?.length > 0) {
        const punchInTime = getIndianTimeFromDateString(
          logTypeIn.data.data[0].time
        );
        const pucnhInDate = getIndianDateFromDateString(
          logTypeIn.data.data[0].time
        );
        await setWorkMode(logTypeIn.data.data[0].custom_work_mode);
        await setPunchInTime(punchInTime);
        await setPunchInDate(pucnhInDate);
      } else {
        await setPunchInTime("- -");
        await setPunchInDate("- -");
      }
      const logTypeOut = await request(
        "GET",
        `/api/resource/Employee Checkin?filters=${encodeURIComponent(
          JSON.stringify([
            ["employee", "=", employeeId],
            ["log_type", "=", "OUT"],
            // ["time", ">=", `${currentDate} 00:00:00`],
            // ["time", "<=", `${currentDate} 23:59:59`],
          ])
        )}&fields=${encodeURIComponent(JSON.stringify(["log_type", "time"]))}&order_by=${encodeURIComponent("time desc")}`
      );
      if (logTypeOut.data?.data?.length > 0) {
        const punchOutTime = getIndianTimeFromDateString(
          logTypeOut.data.data[0].time
        );

        const punchInTime = getIndianTimeFromDateString(
          logTypeIn.data.data[0].time
        );
        const pucnhOutDate = getIndianDateFromDateString(
          logTypeOut.data.data[0].time
        );
        if (
          new Date(logTypeOut.data.data[0].time) >
          new Date(logTypeIn.data.data[0].time)
        ) {
          await setPunchOutTime(punchOutTime);
          await setPunchOutDate(pucnhOutDate);
        } else {
          await setPunchOutTime("- -");
          await setPunchOutDate("- -");
        }
        const combinedLogs = [
          ...logTypeIn.data.data,
          ...logTypeOut.data.data,
        ].sort((a, b) => new Date(b.time) - new Date(a.time));
        if (combinedLogs.length > 0) {
          const latestLog = combinedLogs[0];
          if (latestLog.log_type === "IN") {
            setbuttonText("CHECK-OUT");
            startTimer();
          } else if (latestLog.log_type === "OUT") {
            setbuttonText("CHECK-IN");
            stopTimer();
          }
        } else {
          setbuttonText("CHECK-IN");
          stopTimer();
        }
      } else {
        if (punchOutTime === "- -" && punchInTime === "- -") {
          setbuttonText("CHECK-IN");
          stopTimer();
        } else {
          setbuttonText("CHECK-OUT");
          startTimer();
        }
      }
    } catch (error) {
      logError("Error fetching check-in data:", error);
    }
  };

  const handlePunchInRedirect = async () => {
    if (buttonText == "CHECK-IN") {
      navigation.navigate("ShowCamera");
    } else {
      navigation.navigate("MAP");
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
                  👋 Hello,
                  {" " +
                    (userData?.first_name ?? "") +
                    " " +
                    (userData?.last_name ?? "")}
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
                  <Timer
                    punchInTime={punchInTime}
                    punchOutTime={punchOutTime}
                  />
                </View>
                <View
                  style={[
                    styles.locationStatus,
                    { paddingTop: 15, paddingLeft: 20 },
                  ]}
                >
                  <View>
                    <Image source={images.locationIcon} />
                  </View>
                  <View>
                    <CustomText
                      style={[styles.punchLocation, { paddingTop: 3 }]}
                    >
                      {workMode}
                    </CustomText>
                  </View>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    margin: 10,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "column",
                      marginTop: 10,
                      marginLeft: 20,
                      marginRight: 20,
                    }}
                  >
                    <CustomText style={styles.punchText}>Check In</CustomText>
                    {/* {punchInDate && (
                      <CustomText style={styles.punchTime}>
                        {punchInDate}
                      </CustomText>
                    )} */}
                    {punchInTime && (
                      <CustomText style={styles.punchTime}>
                        {punchInTime}
                      </CustomText>
                    )}
                  </View>
                  <View style={{ flexDirection: "column", margin: 10 }}>
                    <CustomText style={styles.punchText}>Check Out</CustomText>
                    {/* {punchOutDate && (
                      <CustomText style={styles.punchTime}>
                        {punchOutDate}
                      </CustomText>
                    )} */}
                    {punchOutTime && (
                      <CustomText style={styles.punchTime}>
                        {punchOutTime}
                      </CustomText>
                    )}
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
                  onPress={() => navigation.navigate("MAP")}
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
                  <TouchableOpacity
                    style={styles.favSubCard}
                    onPress={() => navigation.navigate("Attendance")}
                  >
                    <View style={styles.favStatusText}>
                      <CustomText style={styles.punchText}>
                        Check In/Out
                      </CustomText>
                    </View>
                    <View style={styles.favStatusIcon}>
                      <Icon
                        name="time-outline"
                        size={45}
                        color={Colors.orangeColor}
                      />
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.favSubCard]}
                    onPress={() => navigation.navigate("ViewAttendance")}
                  >
                    <View style={styles.favStatusText}>
                      <CustomText style={styles.punchText}>
                        Attendance Record
                      </CustomText>
                    </View>
                    <View style={styles.favStatusIcon}>
                      <FontAwesomeIcon
                        name="calendar-check-o"
                        size={45}
                        color={Colors.orangeColor}
                      />
                    </View>
                  </TouchableOpacity>
                </View>

                <View style={styles.favStatus}>


 <TouchableOpacity
                  style={[
                    styles.favSubCard,
                    { width: "45%", marginBottom: 20 },
                  ]}
                  onPress={() => navigation.navigate("HolidayList")}
                >
                  <View style={styles.favStatusText}>
                    <CustomText style={styles.punchText}>Holiday's</CustomText>
                  </View>
                  <View style={styles.favStatusIcon}>
                    <IconMaterial
                      name="holiday-village"
                      size={45}
                      color={Colors.orangeColor}
                    />
                  </View>
                </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.favSubCard]}
                    onPress={() => navigation.navigate("Production Entry")}
                  >
                    <View style={styles.favStatusText}>
                      <CustomText style={styles.punchText}>
                        Production Entry
                      </CustomText>
                    </View>
                    <View style={styles.favStatusIcon}>
                      <FontAwesomeIcon
                        name="file-text-o"
                        size={45}
                        color={Colors.orangeColor}
                      />
                    </View>
                  </TouchableOpacity>
                </View>
               
                {/* <View style={styles.favStatus}>
                  <TouchableOpacity
                    style={styles.favSubCard}
                    onPress={() => navigation.navigate("Leave")}
                  >
                    <View style={styles.favStatusText}>
                      <CustomText style={styles.punchText}>
                        Apply Leave
                      </CustomText>
                    </View>
                    <View style={styles.favStatusIcon}>
                      <Icon
                        name="calendar-outline"
                        size={45}
                        color={Colors.orangeColor}
                      />
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.favSubCard}
                    onPress={() => navigation.navigate("HolidayList")}
                  >
                    <View style={styles.favStatusText}>
                      <CustomText style={styles.punchText}>
                        Holiday's
                      </CustomText>
                    </View>
                    <View style={styles.favStatusIcon}>
                      <IconMaterial
                        name="holiday-village"
                        size={45}
                        color={Colors.orangeColor}
                      />
                    </View>
                  </TouchableOpacity>
                </View>
                {baseURL === MULTARK_URL && (
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    <TouchableOpacity
                      style={[styles.favSubCard, { width: "45%" }]}
                      onPress={() => navigation.navigate("RequirementsScreens")}
                    >
                      <View style={styles.favStatusText}>
                        <CustomText style={styles.punchText}>
                          Requirements
                        </CustomText>
                      </View>
                      <View style={styles.favStatusIcon}>
                        <FontAwesomeIcon
                          name="tasks"
                          size={40}
                          color={Colors.orangeColor}
                        />
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.favSubCard, { width: "45%" }]}
                      onPress={() => navigation.navigate("TaskScreen")}
                    >
                      <View style={styles.favStatusText}>
                        <CustomText style={styles.punchText}>Task</CustomText>
                      </View>
                      <View style={styles.favStatusIcon}>
                        <FontAwesomeIcon
                          name="briefcase"
                          size={40}
                          color={Colors.orangeColor}
                        />
                      </View>
                    </TouchableOpacity>
                  </View> */}
                {/* )} */}
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
  header: {
    padding: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    marginTop: 10,
    shadowColor: Colors.blackColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 4,
    borderRadius: 10,
    width: "auto",
  },
  leftside: { flexDirection: "row" },
  logo: { width: 150, height: 20 },
  headerIcons: { flexDirection: "row" },
  iconButton: { marginLeft: 10 },

  searchBar: {
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.whiteColor,
    borderRadius: 24,
    paddingBottom: 3,
    paddingTop: 3,
    paddingLeft: 16,
    paddingRight: 16,
    marginBottom: 20,
    shadowColor: Colors.blackColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 10,
    width: "auto",
    marginTop: "1%",
    marginRight: "3%",
    marginLeft: "3%",
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.greyishBlueColor,
    marginLeft: 10,
  },

  favoritesSection: { marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },

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
  punchStatus: { flex: 1, margin: 10, flexDirection: "row" },
  punchInStatus: { flex: 1, flexDirection: "column" },
  punchStatusText: {
    flex: 1,
    paddingTop: 12,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: "10%",
  },
  locationStatusText: {
    flex: 1,
    flexDirection: "column",
    alignItems: "flex-end",
    justifyContent: "center",
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
  locationStatusValue: {
    backgroundColor: Colors.whiteColor,
    flex: 2,
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "center",
    paddingLeft: "5%",
    paddingRight: "5%",
  },
  iconContainer: {
    backgroundColor: Colors.orangeColor,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    width: 40,
    height: 40,
    marginTop: 10,
  },
  punchStatusBg: {
    width: 106,
    backgroundColor: "rgba(255, 105, 1, 0.25)",
    flexDirection: "column",
    paddingBottom: 10,
    marginRight: 24,
    borderRadius: 12,
  },
  punchLocation: {
    textAlign: "left",
    color: Colors.blackColor,
    fontWeight: Platform.OS == "ios" ? 600 : null,
    fontSize: 17,
  },
  // favoriteCard
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
