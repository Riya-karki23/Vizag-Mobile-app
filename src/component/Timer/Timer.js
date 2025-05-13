import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import CustomText from "../CustomText/customText";
import { Colors } from "../../constant/color";
import {
  subscribeToTimer,
  loadTimerState,
  stopTimer,
  resetTimer,
} from "../../component/Timer/logDurationTimer";
import { logError } from "../../constant/logger";
import { handleErrorResponse, request } from "../../api/auth/auth";
import { getItemFromStorage, setItemToStorage } from "../../utils/asyncStorage";
import { Strings } from "../../constant/string_constant";
import { useIsFocused } from "@react-navigation/native";
import { showToast } from "../../constant/toast";
import { getCurrentLocation } from "../../api/requestLocationPermission/requestLocationPermission";

const Timer = ({ punchInTime, punchOutTime }) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [loading, setloading] = useState(false);
  const [isNightShift, setIsNightShift] = useState(false);
  const isFocused = useIsFocused();
  useEffect(() => {
    loadTimerState();
    checkPunchedIn();
    const unsubscribe = subscribeToTimer(setElapsedTime);
    return () => unsubscribe();
  }, [isFocused]);
  const [formattedStartTime, setFormattedStartTime] = useState("");
  async function fetchLogType(logType) {
    const userName = await getItemFromStorage(Strings.userName);
    const session = await getItemFromStorage(Strings.userCookie);
    if (userName && session) {
      const userResponse = await request(
        "GET",
        `/api/resource/User/${userName}`
      );
      const employeeResponse = await request(
        "GET",
        `/api/resource/Employee?filters=[["user_id", "=", "${userName}"]]&fields=["company","name"]`
      );
      const currentDate = new Date().toISOString().split("T")[0];
      const response = await request(
        "GET",
        `/api/resource/Employee Checkin?filters=${encodeURIComponent(
          JSON.stringify([
            ["employee", "=", employeeResponse.data.data[0].name],
            ["log_type", "=", logType],
            // ["time", ">=", `${currentDate} 00:00:00`],
            // ["time", "<=", `${currentDate} 23:59:59`],
          ])
        )}&fields=${encodeURIComponent(JSON.stringify(["log_type", "time", "custom_work_mode", "night_shift"]))}&order_by=${encodeURIComponent("time desc")}`
      );
      return response;
    }
  }
  const checkPunchedIn = async () => {
    setloading(true);
    try {
      const logTypeIn = await fetchLogType("IN");
      const logTypeOut = await fetchLogType("OUT");
      const combinedLogs = [
        ...logTypeIn.data.data,
        ...logTypeOut.data.data,
      ].sort((a, b) => new Date(a.time) - new Date(b.time));
      const latestCheckIn = [...logTypeIn.data.data].sort(
        (a, b) => new Date(b.time) - new Date(a.time)
      )[0];
      const hasCheckOut = combinedLogs.some(
        (log) =>
          log.log_type === "OUT" &&
          new Date(log.time) > new Date(latestCheckIn.time)
      );
      if (!hasCheckOut && latestCheckIn?.night_shift === 1) {
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0)).getTime();
        const startOfTomorrow = new Date(today);
        startOfTomorrow.setDate(today.getDate() + 1);
        startOfTomorrow.setHours(0, 0, 0, 0);
        const startOfYesterday = new Date(today);
        startOfYesterday.setDate(today.getDate() - 1);
        startOfYesterday.setHours(0, 0, 0, 0);
        let checkInTime = combinedLogs.filter((log) => {
          const logTime = new Date(log.time).getTime();
          return logTime >= startOfDay && log.log_type === "IN";
        });
        if (checkInTime.length === 0) {
          checkInTime = combinedLogs.filter((log) => {
            const logTime = new Date(log.time).getTime();
            return (
              logTime >= startOfYesterday &&
              logTime < startOfDay &&
              log.log_type === "IN"
            );
          });
        }
        let checkOutTime = combinedLogs.filter((log) => {
          const logTime = new Date(log.time).getTime();
          return logTime >= startOfTomorrow && log.log_type === "OUT";
        });
        if (checkOutTime.length === 0) {
          checkOutTime = combinedLogs.filter((log) => {
            const logTime = new Date(log.time).getTime();
            return logTime >= startOfDay && log.log_type === "OUT";
          });
        }
        let lastCheckOutTime =
          checkOutTime.length > 0
            ? new Date(checkOutTime[0].time).getTime()
            : null;
        let inTime = new Date(checkInTime[0].time).getTime();

        if (lastCheckOutTime !== null) {
          const checkOutDate = new Date(lastCheckOutTime);
          const checkInDate = new Date(inTime);
          const checkOutHour = checkOutDate.getHours();
          const checkInHour = checkInDate.getHours();
          if (
            checkOutHour < 12 &&
            checkInHour >= 14 &&
            checkInDate.getDate() === checkOutDate.getDate()
          ) {
            inTime = new Date(checkInTime[0].time).getTime();
          }
        }

        let outTime =
          checkOutTime.length > 0
            ? new Date(checkOutTime[0].time).getTime()
            : new Date().getTime();

        if (outTime < inTime) {
          outTime = new Date().getTime();
        }
        const timeDiffMs = outTime - inTime;
        const hours = Math.floor(timeDiffMs / (1000 * 60 * 60));
        const minutes = Math.floor(
          (timeDiffMs % (1000 * 60 * 60)) / (1000 * 60)
        );
        const seconds = Math.floor((timeDiffMs % (1000 * 60)) / 1000);
        setFormattedStartTime(
          addFormattedStartTimeAndElapsed(
            `${hours}:${minutes}:${seconds}`,
            elapsedTime
          )
        );
      } else {
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0)).getTime();
        const endOfDay = new Date(today.setHours(23, 59, 59, 999)).getTime();

        const todayLogs = combinedLogs.filter((log) => {
          const logTime = new Date(log.time).getTime();
          return logTime >= startOfDay && logTime <= endOfDay;
          // return logTime >= startOfDay;
        });

        let totalMilliseconds = 0;
        let lastInTime = null;
        todayLogs.forEach((log) => {
          const logTime = new Date(log.time).getTime();
          if (log.log_type === "IN") {
            lastInTime = logTime;
          } else if (log.log_type === "OUT" && lastInTime) {
            totalMilliseconds += logTime - lastInTime;
            lastInTime = null;
          }
        });

        if (lastInTime) {
          totalMilliseconds += new Date().getTime() - lastInTime;
        }

        const formattedTotalHours = formatTime(totalMilliseconds);

        setFormattedStartTime(
          addFormattedStartTimeAndElapsed(formattedTotalHours, elapsedTime)
        );
        // const [totalTime] = formattedTotalHours.split(":").map(Number);

        // checkIsReadyforPunchOut(formattedTotalHours);
      }

      setloading(false);
    } catch (error) {
      setloading(false);
      logError("Error fetching check-in data:", error);
    }
  };
  const formatTime = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };
  const timeStringToMilliseconds = (timeString) => {
    const [hours, minutes, seconds] = timeString.split(":").map(Number);
    return (hours * 3600 + minutes * 60 + seconds) * 1000;
  };
  const addFormattedStartTimeAndElapsed = (formattedStartTime, elapsedTime) => {
    let startTimeInMilliseconds = formattedStartTime
      ? timeStringToMilliseconds(formattedStartTime)
      : 0;
    const totalMilliseconds = startTimeInMilliseconds + elapsedTime;
    const formattedTime = formatTime(totalMilliseconds);
    setItemToStorage(Strings.totalHours, formattedTime);
    return formatTime(totalMilliseconds);
  };

  const checkIsReadyforPunchOut = async (time) => {
    const totalHours = time;
    const totalHoursRaw = await timeStringToSeconds(totalHours);
    const threshold2 = await timeStringToSeconds("10:00:00");
    if (totalHoursRaw === threshold2 || totalHoursRaw > threshold2) {
      await stopTimer();
      await resetTimer();
      await handlePunchOut(totalHours);
    }
  };

  const handlePunchOut = async (time) => {
    const logTypeIn = await fetchLogType("IN");
    const userName = await getItemFromStorage(Strings.userName);
    const locationData = await getCurrentLocation(true);
    if (!locationData) {
      showToast("Failed to retrieve location. Please try again.");
      return;
    }
    const { latitude, longitude } = locationData;
    const employeeResponse = await request(
      "GET",
      `/api/resource/Employee?filters=[["user_id", "=", "${userName}"]]&fields=["company","name"]`
    );

    const response = await request(
      "POST",
      `/api/resource/Employee Checkin`,
      JSON.stringify({
        employee: employeeResponse?.data?.data[0].name,
        log_type: "OUT",
        custom_hours: time,
        custom_work_mode: logTypeIn.data.data[0].custom_work_mode,
        latitude: latitude,
        longitude: longitude,
      })
    );
    if (response.statusCode == 200) {
      await markAttendance({
        employee: employeeResponse?.data?.data[0].name,
        status: getAttendanceStatus(time),
        docstatus: 1,
        attendance_date: new Date().toISOString().split("T")[0],
        company: employeeResponse?.data?.data[0].company,
      });
      const punchOutTime = new Date().toLocaleTimeString();
      await stopTimer();
      showToast("Check Out successful!", false);
    } else {
      showToast("Punch Out failed. Please try again.");
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

  async function timeStringToSeconds(timeString) {
    const [hours, minutes, seconds] = timeString.split(":").map(Number);
    return hours * 3600 + minutes * 60 + seconds;
  }

  return (
    <View style={styles.container}>
      <CustomText style={styles.timerHeadingText}>
        Logged In Duration :
      </CustomText>
      {!loading && (
        <CustomText style={styles.timerText}>
          {addFormattedStartTimeAndElapsed(formattedStartTime, elapsedTime)}
        </CustomText>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "flex-start",
    justifyContent: "center",
    paddingLeft: 30,
  },
  timerText: {
    paddingTop: 5,
    fontSize: 22,
    color: "black",
    alignContent: "center",
    textAlign: "center",
  },
  timerHeadingText: {
    fontSize: 16,
    paddingTop: 10,
    color: Colors.mediumDarkGrey,
    textAlign: "center",
  },
});

export default Timer;
