import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  TextInput,
} from "react-native";
import MapView, { Marker, Circle } from "react-native-maps";
import {
  requestLocationPermission,
  getCurrentLocation,
} from "../../api/requestLocationPermission/requestLocationPermission";
import Icon from "react-native-vector-icons/Ionicons";
import { SafeAreaView } from "react-native-safe-area-context";
import { handleErrorResponse, request } from "../../api/auth/auth";
import { showToast } from "../../constant/toast";
import { logError, logInfo } from "../../constant/logger";
import Loader from "../../component/loader/appLoader";
import { Colors } from "../../constant/color";
import CustomText from "../../component/CustomText/customText";
import { Strings } from "../../constant/string_constant";
import { LayoutAnimation, Platform } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import BackgroundWrapper from "../../Background";
import images from "../../constant/image";
import { getItemFromStorage } from "../../utils/asyncStorage";
import {
  resetTimer,
  startTimer,
  stopTimer,
} from "../../component/Timer/logDurationTimer";
import { useIsFocused } from "@react-navigation/native";
import { Alert } from "react-native";
import { scheduleNotification } from "../../api/requestPushNotificationPermission/requestPushNotificationPermission";
const { width } = Dimensions.get("window");
const baseWidth = 375;
const desiredFontSize = 14;
const responsiveFontSize = desiredFontSize * (width / baseWidth);
const MAP = ({ navigation, route }) => {
  const { imageUrl } = route.params || "";
  const isFocus = useIsFocused();
  const [employeeShift, setEmployeeShift] = useState(null);
  const [shiftTypeList, setSetShiftTypeList] = useState([]);
  const [shiftDropDownVisible, setshiftDropDownVisible] = useState(false);
  const [geofenceRadius, setgeofenceRadius] = useState(null);
  const [naviMumbaiLocation, setNaviMumbaiLocation] = useState({
    latitude: null,
    longitude: null,
  });
  const [officeLocation, setOfficeLocation] = useState({
    latitude: null,
    longitude: null,
  });
  const [region, setRegion] = useState({
    latitude: naviMumbaiLocation.latitude,
    longitude: naviMumbaiLocation.longitude,
    latitudeDelta: 0.5,
    longitudeDelta: 0.5,
  });
  const [availableOptions, setAvailableOptions] = useState([]);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [workFrom, setWorkFrom] = useState("Select Your Location");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [isPunchedIn, setIsPunchedIn] = useState(false);
  const [userData, setUserData] = useState(null);
  const [employeeId, setEmployeeId] = useState(null);
  const [companyName, setcompanyName] = useState("");
  const [checked, setChecked] = useState(false);
  const [isNightShift, setIsNightShift] = useState(false);
  const options = [
    { label: "Office", value: "Office" },
    { label: "Onfield", value: "Onfield" },
    // { label: "Work from Home", value: "Work from Home" },
  ];
  useEffect(() => {
    init();
  }, [isFocus]);

  const init = async () => {
    try {
      setLoading(true);
      const permission = await requestLocationPermission();
      setPermissionGranted(permission);
      const storedUserName = await getItemFromStorage(Strings.userName);
      setUsername(storedUserName || "");
      if (permission) {
        try {
          try {
            const offcieLocation = await getItemFromStorage(
              Strings.offceCoordinate
            );
            const geoFenceRadius = await getItemFromStorage(
              Strings.offceGeoFenceRadius
            );

            if (JSON.parse(offcieLocation).latitude) {
              const parsedLocation = offcieLocation
                ? JSON.parse(offcieLocation)
                : null;

              setgeofenceRadius(geoFenceRadius);
              const officeLocationlatitude = parseFloat(
                parsedLocation.latitude
              );
              const officeLocatiolongitude = parseFloat(
                parsedLocation.longitude
              );
              setOfficeLocation({
                latitude: officeLocationlatitude,
                longitude: officeLocatiolongitude,
              });
              setNaviMumbaiLocation({
                latitude: officeLocationlatitude,
                longitude: officeLocatiolongitude,
              });
              const locationData = await getCurrentLocation(permission);
              if (locationData !== null) {
                const { latitude, longitude } = locationData;
                const distance = calculateDistance(
                  officeLocationlatitude,
                  officeLocatiolongitude,
                  latitude,
                  longitude
                );
                setRegion({
                  latitude: locationData.latitude,
                  longitude: locationData.longitude,
                  latitudeDelta: 0.002,
                  longitudeDelta: 0.002,
                });

                if (distance <= geoFenceRadius) {
                  setWorkFrom(options[0].value);
                  setSelectedLocation(options[0].value);
                  setAvailableOptions(
                    options.filter(
                      (option) =>
                        option.value !== "Onfield" &&
                        option.value !== "Work from Home"
                    )
                  );
                  setLoading(false);
                } else {
                  const employeeResponse = await request(
                    "GET",
                    `/api/resource/Employee?filters=[["user_id", "=", "${storedUserName}"]]&fields=["company","name","default_shift","department"]`
                  );

                  const employee = employeeResponse.data.data[0];
                  if (employee) {
                    if (employee.department === "Sales - V") {
                      const newOptions = options
                        .filter(
                          (option) =>
                            option.value !== "Office" &&
                            option.value !== "Work from Home"
                        )
                        .concat({
                          label: "Marketing",
                          value: "Marketing",
                        });
                      setAvailableOptions(newOptions);
                    } else if (employee.department === "Accounts - V") {
                      const newOptions = options
                        .filter(
                          (option) =>
                            option.value !== "Office" &&
                            option.value !== "Onfield"
                        )
                        .concat({
                          label: "Work from Home",
                          value: "Work from Home",
                        });
                      setAvailableOptions(newOptions);
                      setWorkFrom(newOptions[0].value);
                      setSelectedLocation(newOptions[0].value);
                    } else {
                      setWorkFrom(options[1].value);
                      setSelectedLocation(options[1].value);
                      setAvailableOptions(
                        options.filter((option) => option.value !== "Office")
                      );
                    }
                  } else {
                    logError(
                      "Employee not found for the given user",
                      employeeResponse.data.data[0]
                    );
                    showToast("Employee not found for the given user");
                  }

                  setLoading(false);
                }
              } else {
                setLoading(false);
                logInfo("------------------->", "this method call");
              }
            } else {
              setLoading(false);
              showToast(
                "Current Office Location Latitude and logitue not found"
              );
              logInfo(
                "------------------->",
                "Office Latitue and logitue not found"
              );
            }
          } catch (e) {
            setLoading(false);
            logError(e);
          }
        } catch (e) {
          showToast(e);
          setLoading(false);
        }
      } else {
        setLoading(false);
        showToast("Location permission is required to use this feature.");
      }
    } catch (error) {
      setLoading(false);
      logError("Initialization error:", error);
    }
  };

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

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const userName = await getItemFromStorage(Strings.userName);
        const session = await getItemFromStorage(Strings.userCookie);
        if (userName && session) {
          const userResponse = await request(
            "GET",
            `/api/resource/User/${userName}`
          );
          setUserData(userResponse.data.data);
          const employeeResponse = await request(
            "GET",
            `/api/resource/Employee?filters=[["user_id", "=", "${userName}"]]&fields=["company","name","default_shift","department"]`
          );
          const shiftTypeList = await request(
            "GET",
            `/api/resource/Shift Type?fields=["name","start_time","end_time"]`
          );
          setSetShiftTypeList(shiftTypeList.data.data);
          if (employeeResponse.data.data[0]) {
            const employee = employeeResponse.data.data[0];
            setEmployeeId(employee.name);
            // setEmployeeShift(employee.default_shift);
            setcompanyName(employee.company);
          } else {
            logError(
              "Employee not found for the given user",
              employeeResponse.data.data[0]
            );
            showToast("Employee not found for the given user");
          }
        } else {
          setError("No user information found");
        }
      } catch (error) {
        logError("Failed to fetch user data:", error.response || error.message);
        setError("Failed to fetch user data");
        // setLoading(false);
      } finally {
        // setLoading(false);
      }
    };

    fetchUserData();
  }, []);
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
      )}&fields=${encodeURIComponent(JSON.stringify(["log_type", "time", "work_mode", "night_shift"]))}&order_by=${encodeURIComponent("time desc")}`
    );
    return response;
  }
  useEffect(() => {
    const checkPunchedIn = async () => {
      try {
        const logTypeIn = await fetchLogType("IN");
        const logTypeOut = await fetchLogType("OUT");
        const combinedLogs = [
          ...logTypeIn.data.data,
          ...logTypeOut.data.data,
        ].sort((a, b) => new Date(b.time) - new Date(a.time));

        if (combinedLogs.length > 0) {
          const latestLog = combinedLogs[0];
          if (latestLog.log_type === "IN") {
            setIsPunchedIn(true);
          } else if (latestLog.log_type === "OUT") {
            setIsPunchedIn(false);
          }
        } else {
          setIsPunchedIn(false);
        }
      } catch (error) {
        setLoading(false);
        logError("Error fetching check-in data:", error);
      }
    };

    checkPunchedIn();
  });
  const handlePunchIn = async () => {
    if (workFrom === "Select Your Location") {
      showToast("Please Select Your Location");
      return;
    }

    // if (employeeShift === null) {
    //   showToast("Please Select Your Shift");
    //   return;
    // }

    setLoading(true);

    try {
      const locationData = await getCurrentLocation(permissionGranted);
      if (!locationData) {
        showToast("Failed to retrieve location. Please try again.");
        setLoading(false);
        return;
      }

      const { latitude, longitude } = locationData;
      const distance = calculateDistance(
        officeLocation.latitude,
        officeLocation.longitude,
        latitude,
        longitude
      );
      if (workFrom === "Office" || selectedLocation === "Office") {
        if (distance <= geofenceRadius) {
          const punchInTime = new Date().toLocaleTimeString();
          const response = await request(
            "POST",
            `/api/resource/Employee Checkin`,
            JSON.stringify({
              employee: employeeId,
              log_type: "IN",
              time: getCurrentDateTime(),
              // night_shift: isNightShift === true ? 1 : 0,
              // shift: employeeShift,
              custom_picture: imageUrl,
              work_mode:
                Platform.OS === "ios" ? selectedLocation : workFrom,
              latitude: latitude,
              longitude: longitude,
            })
          );

          if (response.statusCode == 200) {
            scheduleNotification(new Date());
            startTimer();
            showToast("Check In successful!", false);
            // setLoading(false);
            navigation.navigate("Home", { punchInTime });
          } else {
            showToast("Punch In failed. Please try again.");
          }
        } else {
          setLoading(false);
          showToast("You are outside the geofence zone.");
        }
      } else {
        const punchInTime = new Date().toLocaleTimeString();

        const response = await request(
          "POST",
          `/api/resource/Employee Checkin`,
          JSON.stringify({
            employee: employeeId,
            log_type: "IN",
            time: getCurrentDateTime(),
            // shift: employeeShift,
            // night_shift: isNightShift === true ? 1 : 0,
            custom_picture: imageUrl,
            work_mode:
              Platform.OS === "ios" ? selectedLocation : workFrom,
            latitude: latitude,
            longitude: longitude,
          })
        );

        if (response.statusCode == 200) {
          scheduleNotification(new Date());
          setLoading(false);
          startTimer();
          showToast("Check In successful!", false);
          navigation.navigate("Home", { punchInTime });
        } else {
          setLoading(false);
          stopTimer();
          showToast("Punch In failed. Please try again.");
        }
      }

      setRegion({ ...region, latitude, longitude });
    } catch (error) {
      setLoading(false);
      logError("Location Error:", error.message);
      showToast("Failed to process punch in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePunchOut = async () => {
    setLoading(true);
    // if (employeeShift === null) {
    //   showToast("Please Select Your Shift");
    //   setLoading(false);
    //   return;
    // }
    try {
      const locationData = await getCurrentLocation(permissionGranted);
      if (!locationData) {
        showToast("Failed to retrieve location. Please try again.");
        setLoading(false);
        return;
      }

      const { latitude, longitude } = locationData;
      const distance = calculateDistance(
        officeLocation.latitude,
        officeLocation.longitude,
        latitude,
        longitude
      );
      const logTypeIn = await fetchLogType("IN");
      const currentDate = new Date();
      const formattedDate = currentDate.toISOString().split("T")[0];
      // const attendance_date =
      //   logTypeIn?.data?.data[0]?.night_shift === 1
      //     ? new Date(currentDate.setDate(currentDate.getDate() - 1))
      //         .toISOString()
      //         .split("T")[0]
      //     : formattedDate;
      const totalHours = await getItemFromStorage(Strings.totalHours);
      if (logTypeIn.data.data[0].work_mode == "Office") {
        if (distance <= geofenceRadius) {
          const response = await request(
            "POST",
            `/api/resource/Employee Checkin`,
            JSON.stringify({
              employee: employeeId,
              log_type: "OUT",
              // night_shift: logTypeIn?.data?.data[0]?.night_shift === 1,
              time: getCurrentDateTime(),
              // shift: employeeShift,
               custom_picture: imageUrl,
              custom_hours: totalHours,
              work_mode: logTypeIn.data.data[0].work_mode,
              latitude: latitude,
              longitude: longitude,
            })
          );
          if (response.statusCode == 200) {
            if (checked) {
              await markAttendance({
                employee: employeeId,
                status: getAttendanceStatus(totalHours),
                docstatus: 1,
                attendance_date: attendance_date,
                company: companyName,
              });
              await stopTimer();
              await resetTimer();
            }
            const punchOutTime = new Date().toLocaleTimeString();
            stopTimer();
            showToast("Check Out successful!", false);
            setChecked(false);
            navigation.navigate("Home", { punchOutTime });
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
            // shift: employeeShift,
            // night_shift: logTypeIn?.data?.data[0]?.night_shift === 1,
            custom_hours: totalHours,
            work_mode: logTypeIn.data.data[0].work_mode,
            latitude: latitude,
            time: getCurrentDateTime(),
            longitude: longitude,
          })
        );
        if (response.statusCode == 200) {
          if (checked) {
            await markAttendance({
              employee: employeeId,
              status: getAttendanceStatus(totalHours),
              docstatus: 1,
              attendance_date: attendance_date,
              company: companyName,
              custom_total_working_hours: totalHours,
              custom_overtime_hours: await getOvertime(totalHours),
            });
            await stopTimer();
            await resetTimer();
          }
          const punchOutTime = new Date().toLocaleTimeString();
          stopTimer();
          showToast("Check Out successful!", false);
          setChecked(false);
          navigation.navigate("Home", { punchOutTime });
        } else {
          showToast("Punch Out failed. Please try again.");
        }
      }
    } catch (error) {
      // stopTimer();
      showToast(
        `Failed to process punch out. Please try again. ${error.message}`
      );
    } finally {
      // stopTimer();
      setLoading(false);
    }
  };

  const getOvertime = async (totalHoursStr) => {
    const totalHours = parseFloat(totalHoursStr || "0");
    const normalHours = 8;
    const overtime = totalHours > normalHours ? totalHours - normalHours : 0;
    logInfo("Overtime:", overtime);
    return overtime;
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
      setChecked(false);
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
  const toggleCheckbox = () => {
    setChecked(!checked);
  };
  const toggleNightShift = () => {
    setIsNightShift(!isNightShift);
  };
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(
    "Select Your Location"
  );
  const handleSelectLocation = (location) => {
    setWorkFrom(location.value);
    setSelectedLocation(location.value);
    setDropdownVisible(false);
  };
  return (
    <BackgroundWrapper imageSource={images.mainBackground}>
      <SafeAreaView style={{ flex: 1 }}>
        {!loading && (
          <View style={styles.container}>
            <View>
              <TouchableOpacity
                style={styles.backButtonOUT}
                onPress={() => navigation.goBack()}
              >
                <Icon
                  name="chevron-back"
                  size={35}
                  color={Colors.orangeColor}
                />
              </TouchableOpacity>
                 {/* <TouchableOpacity
                onPress={() => {
                  LayoutAnimation.configureNext(
                    LayoutAnimation.Presets.easeInEaseOut
                  );
                  setshiftDropDownVisible(!shiftDropDownVisible);
                }}
                style={{ marginTop: 10 }}
              >
                <TextInput
                  style={styles.input}
                  pointerEvents="none"
                  placeholderTextColor={Colors.blackColor}
                  placeholder={employeeShift || "Select Your Shift"}
                  selectedValue={employeeShift}
                  editable={false}
                />
           </TouchableOpacity> */}

              {shiftDropDownVisible && (
                <View
                  style={{
                    shadowColor: Colors.blackColor,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 5,
                    borderColor: Colors.lightGreyColor,
                    padding: 4,
                    borderWidth: 1,
                    borderRadius: 12,
                    fontSize: 14,
                    marginTop: 10,
                    marginHorizontal: 15,
                    backgroundColor: Colors.whiteColor,
                  }}
                >
                  {shiftTypeList.map((shift, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => {
                        setEmployeeShift(shift.name);
                        setshiftDropDownVisible(false);
                      }}
                      style={styles.dropdownItem}
                    >
                      <CustomText style={{ color: Colors.blackColor }}>
                        {shift.name} {"("}
                        {shift.start_time}-{shift.end_time}
                        {")"}
                      </CustomText>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              {isPunchedIn && (
                <>
                  {/* <View style={styles.noteContainer}>
                    <Icon
                      name="information-circle-outline"
                      size={25}
                      color={Colors.orangeColor}
                    />
                    <CustomText style={styles.noteText}>
                      Always select{" "}
                      <CustomText style={styles.boldText}>
                        "Are You Ready to End Your Workday?"
                      </CustomText>{" "}
                      if your work is completed. If not selected,{" "}
                      <CustomText style={styles.boldText}>
                        your attendance will not be marked.
                      </CustomText>{" "}
                      Please note.
                    </CustomText>
                  </View> */}
                </>
              )}
              {isPunchedIn ? (
                <>
                  {/* <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginHorizontal: 20,
                      marginVertical: 10,
                    }}
                  >
                    <TouchableOpacity
                      onPress={toggleCheckbox}
                      style={styles.checkbox}
                    >
                      {checked ? (
                        <Icon
                          name="checkmark"
                          size={25}
                          style={styles.checkbox}
                          color={Colors.orangeColor}
                        />
                      ) : null}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={toggleCheckbox}>
                      <CustomText
                        style={{
                          color: Colors.blackColor,
                          padding: 8,
                          fontSize: 18,
                        }}
                      >
                        Are You Ready to End Your Workday?
                      </CustomText>
                    </TouchableOpacity>
                  </View> */}

                  <TouchableOpacity
                    // onPress={() => {
                    //   if (checked) {
                    //     Alert.alert(
                    //       "Confirm Workday Completion",
                    //       "Are you sure you want to end your workday? Once confirmed, your attendance will be marked based on your working hours.",
                    //       [
                    //         {
                    //           text: "No, Keep Working",
                    //           style: "cancel",
                    //           onPress: () => {
                    //             setChecked(false);
                    //           },
                    //         },
                    //         {
                    //           text: "Yes, End My Workday",
                    //           onPress: () => {
                    //             handlePunchOut();
                    //           },
                    //         },
                    //       ]
                    //     );
                    //   } else {
                    //     handlePunchOut();
                    //   }
                    // }}
                     onPress={handlePunchOut}
                  >
                    <LinearGradient
                      colors={[Colors.orangeColor, Colors.redColor]}
                      style={styles.punchOutButton}
                    >
                      <CustomText style={styles.buttonText}>
                        Check Out
                      </CustomText>
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity
                    onPress={() => {
                      if (
                        workFrom !== "Office" &&
                        availableOptions.length > 1
                      ) {
                        LayoutAnimation.configureNext(
                          LayoutAnimation.Presets.easeInEaseOut
                        );
                        setDropdownVisible(!dropdownVisible);
                      }
                    }}
                    style={{ marginTop: 10 }}
                  >
                    <TextInput
                      style={styles.input}
                      pointerEvents="none"
                      placeholderTextColor={Colors.blackColor}
                      placeholder={workFrom || "Select Your Location"}
                      selectedValue={workFrom}
                      editable={false}
                    />
                  </TouchableOpacity>

                  {dropdownVisible && (
                    <View
                      style={{
                        shadowColor: Colors.blackColor,
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.1,
                        shadowRadius: 5,
                        borderColor: Colors.lightGreyColor,
                        padding: 4,
                        borderWidth: 1,
                        borderRadius: 12,
                        fontSize: 14,
                        marginTop: 10,
                        marginHorizontal: 15,
                        backgroundColor: Colors.whiteColor,
                      }}
                    >
                      {availableOptions.map((location, index) => (
                        <TouchableOpacity
                          key={index}
                          onPress={() => handleSelectLocation(location)}
                          style={styles.dropdownItem}
                        >
                          <CustomText style={{ color: Colors.blackColor }}>
                            {location.label}
                          </CustomText>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                  {/* <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginHorizontal: 15,
                      marginVertical: 5,
                    }}
                  >
                    <TouchableOpacity
                      onPress={toggleNightShift}
                      style={styles.checkbox}
                    >
                      {isNightShift ? (
                        <Icon
                          name="checkmark"
                          size={25}
                          style={styles.checkbox}
                          color={Colors.orangeColor}
                        />
                      ) : null}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={toggleNightShift}>
                      <CustomText
                        style={{
                          color: Colors.blackColor,
                          padding: 8,
                          fontSize: 18,
                        }}
                      >
                        Are you starting your night shift?
                      </CustomText>
                    </TouchableOpacity>
                  </View> */}
                  <TouchableOpacity onPress={handlePunchIn}>
                    <LinearGradient
                      colors={[Colors.orangeColor, Colors.redColor]}
                      style={styles.orangeButton}
                    >
                      <CustomText style={styles.buttonText}>
                        Check In
                      </CustomText>
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              )}
            </View>
            {permissionGranted ? (
              <View style={styles.mapContainer}>
                {region ? (
                  <MapView
                    style={styles.map}
                    region={region.latitude || region.longitude ? region : null}
                    showsUserLocation={true}
                    showsMyLocationButton={true}
                  >
                    <Marker coordinate={officeLocation} pinColor="red" />
                    <Circle
                      center={officeLocation}
                      radius={100}
                      fillColor="rgba(255, 105, 0, 0.2)"
                      strokeColor="rgba(255, 105, 0, 0.5)"
                    />
                  </MapView>
                ) : (
                  <>
                    <CustomText
                      style={{
                        color: Colors.orangeColor,
                        fontSize: 18,
                        textAlign: "center",
                        marginTop: 40,
                      }}
                    >
                      Please turn on location to use this feature.
                    </CustomText>
                    <TouchableOpacity
                      style={{
                        marginTop: 20,
                        paddingVertical: 10,
                        paddingHorizontal: 20,
                        marginHorizontal: 80,
                        backgroundColor: Colors.orangeColor,
                        borderRadius: 8,
                      }}
                      onPress={async () => await init()}
                    >
                      <CustomText
                        style={{
                          color: "white",
                          fontSize: 16,
                          textAlign: "center",
                        }}
                      >
                        Retry
                      </CustomText>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            ) : (
              <CustomText
                style={{
                  color: Colors.orangeColor,
                  fontSize: 18,
                  textAlign: "center",
                  marginTop: 40,
                }}
              >
                Location permission is required to use this feature.
              </CustomText>
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
  const month = String(now.getMonth() + 1).padStart(2, "0"); // Months are 0-based
  const year = now.getFullYear();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  noteContainer: {
    flexDirection: "row",
    alignItems: "flex-start",

    padding: 5,
    borderRadius: 6,
    marginTop: 10,
  },
  noteText: {
    flex: 1,
    color: "#333",
    marginLeft: 8,
    fontSize: 12,
  },
  boldText: {
    fontFamily: "Nunito-ExtraBold",
    color: Colors.orangeColor,
  },
  buttonRowContainer: {
    flexDirection: "column",
    justifyContent: "space-between",
    width: "80%",
    marginLeft: "14%",
  },
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
    // width: "100%",
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
  checkbox: {
    width: 25,
    height: 25,
    borderWidth: 2,
    borderColor: Colors.orangeColor,
    alignItems: "center",
    justifyContent: "center",
    // marginTop: 10,
    borderRadius: 24,
    // padding: 4,
  },
  loader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  pickerContainer: {
    borderRadius: 12,
    borderColor: Colors.lightGreyColor,
    borderWidth: 1,
    marginHorizontal: 15,
    marginVertical: 5,
    // overflow: "hidden",
    backgroundColor: Colors.whiteColor,
  },
  picker: {
    height: 50,
    width: "100%",
    fontFamily: Strings.fontFamilyConstant,
    color: Colors.greyishBlueColor,
  },
  dropdownItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderColor,
  },
  input: {
    height: 50,
    padding: 4,
    paddingLeft: 10,
    fontFamily: Strings.fontFamilyConstant,
    shadowColor: Colors.blackColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    borderColor: Colors.lightGreyColor,
    borderWidth: 1,
    borderRadius: 12,
    marginVertical: 5,
    marginHorizontal: 15,
    fontSize: 14,
    color: Colors.blackColor,
    backgroundColor: Colors.whiteColor,
  },
});

export default MAP;
