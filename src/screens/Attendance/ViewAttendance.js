import { SafeAreaView } from "react-native-safe-area-context";
import BackgroundWrapper from "../../Background";
import images from "../../constant/image";
import { TouchableOpacity, StyleSheet, View, ScrollView } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { Colors } from "../../constant/color";
import CustomText from "../../component/CustomText/customText";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { getItemFromStorage } from "../../utils/asyncStorage";
import { Strings } from "../../constant/string_constant";
import { logInfo, logError } from "../../constant/logger";
import { fetchAttendance } from "../../api/fetchAttendance/fetchAttendance";
import { Platform } from "react-native";
import PieChart from "react-native-pie-chart";
import Loader from "../../component/loader/appLoader";
import { Calendar } from "react-native-calendars";
const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const ViewAttendance = () => {
  const [employeeAttendanceData, setEmployeeAttendanceData] = useState([]);
  const [pieChartSeriesData, setpieChartSeriesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  const [username, setUserName] = useState("");
  const isFocused = useIsFocused();
  const [markedDates, setMarkedDates] = useState(null);
  const getMonthStartAndEndDates = (
    year = new Date().getFullYear(),
    monthIndex = new Date().getMonth()
  ) => {
    const firstDate = new Date(year, monthIndex, 1);
    const lastDate = new Date(year, monthIndex + 1, 0);

    const formatDate = (date) =>
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

    return {
      formattedFirstDate: formatDate(firstDate),
      formattedLastDate: formatDate(lastDate),
    };
  };
  const calculateAttendance = (data) => {
    if (!data || data.length === 0) return [0, 0, 0, 0, 0];
    const statusCounts = {
      Present: 0,
      Absent: 0,
      "Work From Home": 0,
      "On Leave": 0,
      "Half Day": 0,
    };

    data.forEach((item) => {
      if (statusCounts[item.status] !== undefined) {
        statusCounts[item.status]++;
      }
    });

    return [
      statusCounts.Present,
      statusCounts.Absent,
      statusCounts["Work From Home"],
      statusCounts["On Leave"],
      statusCounts["Half Day"],
    ];
  };
  useEffect(() => {
    const fetchUserName = async () => {
      setLoading(true);
      try {
        const storedUserName = await getItemFromStorage(Strings.userName);
        if (storedUserName) {
          setUserName(storedUserName);
          fetchAttendanceData(storedUserName);
        }
      } catch (error) {
        setLoading(false);
        logError("Failed to load username:", error);
      }
    };
    const fetchAttendanceData = async (userName) => {
      try {
        const { formattedFirstDate, formattedLastDate } =
          getMonthStartAndEndDates();
        const data = await fetchAttendance(
          userName,
          formattedFirstDate,
          formattedLastDate
        );
        setEmployeeAttendanceData(data.data);
        setpieChartSeriesData(calculateAttendance(data.data || []));
        const attendanceDates = {};
        data.data.forEach((item) => {
          const date = item.attendance_date;
          attendanceDates[date] = {
            selected: true,
            marked: true,
            disableTouchEvent: true,
            selectedColor:
              item.status === "Present"
                ? Colors.presentColor
                : item.status === "Work From Home"
                  ? Colors.wfhColor
                  : item.status === "On Leave"
                    ? Colors.leaveColor
                    : item.status === "Half Day"
                      ? Colors.mediumDarkGrey
                      : "red",
          };
        });

        setMarkedDates(attendanceDates);
        setLoading(false);
      } catch (error) {
        setLoading(false);
        logError("Failed to load employee Attendance Data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserName();
  }, [isFocused]);

  if (loading) {
    return <Loader isLoading={loading} />;
  }
  const widthAndHeight = 140;
  const sliceColor = [
    Colors.presentColor,
    "red",
    Colors.wfhColor,
    Colors.leaveColor,
    Colors.mediumDarkGrey,
  ];
  const statusLabels = [
    "Present",
    "Absent",
    "Work From Home",
    "On Leave",
    "Half Day",
  ];
  return (
    <BackgroundWrapper imageSource={images.mainBackground}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.attendanceView}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="chevron-back" size={30} color={Colors.orangeColor} />
          </TouchableOpacity>
          <CustomText style={styles.headerText}>Attendance Record</CustomText>
        </View>
        <ScrollView>
          <Calendar
            theme={{
              textDayFontFamily: Strings.fontFamilyConstant,
              arrowColor: Colors.blackColor,
              textMonthFontFamily: Strings.fontFamilyConstant,
              dayTextColor: Colors.blackColor,
              textDayHeaderFontFamily: Strings.fontFamilyConstant,
              textDayFontWeight: Platform.OS == "ios" ? 600 : null,
              textDayHeaderFontWeight: Platform.OS == "ios" ? 900 : null,
              textMonthFontWeight: Platform.OS == "ios" ? "bold" : null,
              textMonthFontSize: 22,
              backgroundColor: "transparent",
              calendarBackground: "transparent",
              textDisabledColor: Colors.lightGreyColor,
              selectedDotColor: "transparent",
              textSectionTitleColor: Colors.blackColor,
            }}
            style={{
              backgroundColor: "transparent",
            }}
            renderArrow={(direction) => (
              <Icon
                name={
                  direction === "left"
                    ? "arrow-back-circle-outline"
                    : "arrow-forward-circle-outline"
                }
                size={40}
                color={Colors.orangeColor}
              />
            )}
            markedDates={markedDates}
            onMonthChange={async (month) => {
              const selectedMonthIndex = month["month"] - 1;
              const { formattedFirstDate, formattedLastDate } =
                getMonthStartAndEndDates(month["year"], selectedMonthIndex);
              const data = await fetchAttendance(
                username,
                formattedFirstDate,
                formattedLastDate
              );
              let attendanceDates = {};
              data.data.forEach((item) => {
                const date = item.attendance_date;
                attendanceDates[date] = {
                  selected: true,
                  marked: true,
                  disableTouchEvent: true,
                  selectedColor:
                    item.status === "Present"
                      ? Colors.presentColor
                      : item.status === "Work From Home"
                        ? Colors.wfhColor
                        : item.status === "On Leave"
                          ? Colors.leaveColor
                          : item.status === "Half Day"
                            ? Colors.mediumDarkGrey
                            : "red",
                };
              });
              setEmployeeAttendanceData(data?.data || []);
              setpieChartSeriesData(calculateAttendance(data?.data || []));
              setMarkedDates(attendanceDates);
            }}
          />

          <View style={styles.chartView}>
            {employeeAttendanceData.length === 0 ? (
              <CustomText
                style={{
                  padding: 20,
                  textAlign: "center",
                  marginBottom: 8,
                  fontSize: 20,
                  color: Colors.blackColor,
                  fontWeight: 600,
                }}
              >
                {Strings.noRecordAvaliable}
              </CustomText>
            ) : (
              <>
                {pieChartSeriesData.length === 0 ||
                pieChartSeriesData.reduce(
                  (accumulator, currentValue) => accumulator + currentValue,
                  0
                ) === 0 ? (
                  <View style={styles.errorContainer}>
                    <CustomText style={styles.errorText}>
                      No valid data available to display the chart.
                    </CustomText>
                  </View>
                ) : (
                  <>
                    <PieChart
                      widthAndHeight={widthAndHeight}
                      series={pieChartSeriesData}
                      sliceColor={sliceColor}
                      coverRadius={0.45}
                      coverFill={Colors.whiteColor}
                    />
                    <CustomText style={styles.centeredText}>
                      {pieChartSeriesData.reduce(
                        (accumulator, currentValue) =>
                          accumulator + currentValue,
                        0
                      )}
                    </CustomText>
                  </>
                )}
              </>
            )}
          </View>
          <View style={styles.legend}>
            {statusLabels.map((label, index) => (
              <View style={styles.legendItem} key={index}>
                <View
                  style={[
                    styles.colorBox,
                    { backgroundColor: sliceColor[index] },
                  ]}
                />
                <CustomText style={styles.chartText}>{label} : </CustomText>
                <CustomText style={styles.statusText}>
                  {pieChartSeriesData[index]}
                </CustomText>
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </BackgroundWrapper>
  );
};
const styles = StyleSheet.create({
  chartText: {
    fontSize: 16,
    fontWeight: Platform.OS == "ios" ? 600 : null,
    color: Colors.blackColor,
  },
  statusText: { color: Colors.blackColor, fontSize: 21, fontWeight: "600" },
  legend: {
    marginTop: 20,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 10,
    marginLeft: 10,
    marginBottom: 10,
  },
  colorBox: {
    width: 15,
    height: 15,
    borderRadius: 24,
    marginRight: 10,
  },
  chartView: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 24,
  },
  centeredText: {
    position: "absolute",
    top: "57%",
    fontSize: 24,
    fontWeight: 600,
    color: "#000",
  },
  attendanceView: {
    flexDirection: "row",
  },
  selectMonthView: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginLeft: 21,
    marginRight: 21,
    paddingLeft: 16,
    height: 50,
    padding: 4,
    fontFamily: Strings.fontFamilyConstant,
    shadowColor: Colors.blackColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    borderColor: Colors.whiteColor,
    borderWidth: 1,
    borderRadius: 24,
    fontSize: 16,
    elevation: 3,
    backgroundColor: Colors.whiteColor,
    color: Colors.blackColor,
  },
  itemText: {
    fontSize: 16,
    paddingBottom: 10,
    fontWeight: "600",
    textAlign: "left",
    color: Colors.darkGreyColor,
    paddingLeft: 15,
  },
  input: {
    padding: 4,
    fontFamily: Strings.fontFamilyConstant,
    fontSize: 16,
    backgroundColor: Colors.whiteColor,
    color: Colors.blackColor,
  },
  headerText: {
    fontWeight: Platform.OS == "ios" ? 700 : null,
    fontSize: 20,
    marginBottom: 16,
    textAlign: "left",
    color: Colors.darkGreyColor,
    marginLeft: 0,
    paddingTop: 21,
  },
  container: {
    flex: 1,
    padding: 10,
  },
  addButton: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 10,
  },
});
export default ViewAttendance;
