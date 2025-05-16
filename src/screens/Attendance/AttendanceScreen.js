import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Dimensions,
  Platform,
} from "react-native";
import TopBar from "../../component/TopBar/TopBar";
import { fetchEmployeeCheckins } from "../../api/fetchEmployeeCheckins/fetchEmployeeCheckins";
import { SafeAreaView } from "react-native-safe-area-context";
import Loader from "../../component/loader/appLoader";
import { Strings } from "../../constant/string_constant";
import { Colors } from "../../constant/color";
import CustomText from "../../component/CustomText/customText";
import BackgroundWrapper from "../../Background";
import images from "../../constant/image";
import { useNavigation } from "@react-navigation/native";
import { getItemFromStorage } from "../../utils/asyncStorage";

import { TouchableOpacity } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { request } from "../../api/auth/auth";

const { width, height } = Dimensions.get("window");
const baseWidth = 375;
const desiredFontSize = 20;
const responsiveFontSize = desiredFontSize * (width / baseWidth);

const AttendanceScreen = ({ route }) => {
  const [employeeCheckins, setEmployeeCheckins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userName, setUserName] = useState("");
  const [shiftTypeList, setSetShiftTypeList] = useState([]);
  const navigation = useNavigation();

  const filterData = async (storedUserName) => {
    try {
      setLoading(true);
      const fromDate = route.params?.fromDate || "";
      const selectedLogType = route.params?.selectedLogType || "";
      const data = await fetchEmployeeCheckins(
        storedUserName,
        fromDate,
        selectedLogType
      );
      setEmployeeCheckins(data.data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const setShiftData = async () => {
      const shiftTypeListData = await request(
        "GET",
        `/api/resource/Shift Type?fields=["name","start_time","end_time"]`
      );
      setSetShiftTypeList(shiftTypeListData.data.data);
    };
    setShiftData();
  }, [userName]);

  useEffect(() => {
    const loadUserAndData = async () => {
      const storedUserName = await getItemFromStorage(Strings.userName);
      if (storedUserName) {
        setUserName(storedUserName);
        filterData(storedUserName);
      }
    };

    loadUserAndData();
  }, [route.params?.fromDate, route.params?.selectedLogType]);

  if (loading) {
    return <Loader isLoading={loading} />;
  }

  const formatToIST = (timestamp) => {
    const date = new Date(timestamp.replace(" ", "T"));
    const utcOffset = date.getTime() + date.getTimezoneOffset() * 60000;
    const istTime = new Date(utcOffset + 5.5 * 60 * 60 * 1000);
    const day = istTime.getDate().toString().padStart(2, "0");
    const month = (istTime.getMonth() + 1).toString().padStart(2, "0");
    const year = istTime.getFullYear();
    const hours = istTime.getHours().toString().padStart(2, "0");
    const minutes = istTime.getMinutes().toString().padStart(2, "0");
    const seconds = istTime.getSeconds().toString().padStart(2, "0");
    const period = hours >= 12 ? "PM" : "AM";
    const adjustedHours = (hours % 12 || 12).toString().padStart(2, "0");
    return `${day}/${month}/${year} \n${adjustedHours}:${minutes} ${period}`;
  };

  return (
    <BackgroundWrapper imageSource={images.mainBackground}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.container}>
          <TopBar />
          <View style={styles.filterButtons}>
            <CustomText style={styles.headerText}>Employee Checkins</CustomText>
            <View style={styles.filterContainer}>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate("Attendance Filter", {
                    from_date: route.params?.fromDate || "",
                    selected_log_type: route.params?.selectedLogType || "",
                  })
                }
                style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
              >
                <Ionicons name="filter-outline" size={20} color="#666" />
                <CustomText style={styles.filterText}> Filter</CustomText>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.tableHeader}>
            <CustomText style={styles.tableHeaderText}>
              Employee Name
            </CustomText>
            <CustomText style={styles.tableHeaderText}>Time</CustomText>
            <CustomText style={styles.tableHeaderText}>
              Shift Timings
            </CustomText>
            <CustomText style={styles.tableHeaderText}>Log Type</CustomText>
          </View>

          {employeeCheckins.length > 0 ? (
            <FlatList
              data={[...employeeCheckins].sort(
                (a, b) => new Date(b.time) - new Date(a.time)
              )}
              keyExtractor={(item, index) =>
                item.time ? item.time.toString() : index.toString()
              }
              renderItem={({ item, index }) => (
                <View
                  style={[
                    styles.tableRow,
                    {
                      backgroundColor:
                        index % 2 === 0 ? Colors.tableRowColor : "white",
                    },
                  ]}
                >
                  <CustomText style={styles.tableCell}>
                    {item.employee_name}
                  </CustomText>
                  <CustomText style={styles.tableCell}>
                    {item.time ? formatToIST(item.time) : "NA"}
                  </CustomText>
                  <CustomText style={styles.tableCell}>
                    {shiftTypeList?.length > 0
                      ? (() => {
                          const matchedShift = shiftTypeList.find(
                            (shift) => shift.name === item?.shift
                          );
                          if (matchedShift) {
                            const formatTime = (timeStr) => {
                              const date = new Date(`1970-01-01T${timeStr}`);
                              return date.toLocaleTimeString([], {
                                hour: "numeric",
                                minute: "2-digit",
                                hour12: true,
                              });
                            };

                            return `${matchedShift.name} ${formatTime(matchedShift.start_time)} - ${formatTime(matchedShift.end_time)}`;
                          } else {
                            return "NA";
                          }
                        })()
                      : "NA"}
                  </CustomText>
                  <CustomText
                    style={[
                      styles.tableCell,
                      {
                        color: item.log_type === "IN" ? "green" : "red",
                        fontWeight: Platform.OS == "ios" ? "600" : null,
                        fontSize: 13,
                      },
                    ]}
                  >
                    {item.log_type}
                  </CustomText>
                </View>
              )}
            />
          ) : (
            <CustomText style={styles.noDataText}>
              {Strings.noDataAvailable}
            </CustomText>
          )}
        </View>
      </SafeAreaView>
    </BackgroundWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centeredText: {
    textAlign: "center",
    fontSize: 18,
    fontWeight: 600,
    color: "#000",
  },
  safeAreaStyle: {
    flex: 1,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
  headerText: {
    fontWeight: Platform.OS == "ios" ? 700 : null,
    fontSize: responsiveFontSize,
    marginBottom: 16,
    textAlign: "left",
    color: Colors.darkGreyColor,
    marginLeft: 18,
  },
  subText: {
    fontWeight: Platform.OS == "ios" ? 400 : null,
    fontSize: 14,
    marginBottom: 10,
    textAlign: "right",
    color: Colors.darkGreyColor,
    marginRight: 24,
  },
  tableHeader: {
    flexDirection: "row",
    padding: 20,
    marginBottom: 8,
    backgroundColor: Colors.whiteColor,
    borderRadius: 10,
    margin: 10,
    shadowColor: Colors.blackColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 10,
  },
  tableHeaderText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
    color: Colors.blackColor,
  },
  tableRow: {
    flexDirection: "row",
    shadowColor: "black",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    borderRadius: 10,
    padding: 7,
    marginLeft: 15,
    marginTop: 4,
    marginBottom: 4,
    marginRight: 15,
    backgroundColor: Colors.whiteColor,
  },
  tableCell: {
    flex: 1,
    paddingTop: 5,
    fontSize: 13,
    fontWeight: Platform.OS == "ios" ? 500 : null,
    textAlign: "center",
    fontFamily: Strings.fontFamilyConstant,
    color: Colors.darkGreyColor,
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginTop: 20,
  },
  noDataText: {
    padding: 20,
    textAlign: "center",
    color: Colors.darkGreyColor,
    marginTop: 20,
    fontSize: responsiveFontSize,
  },
  loadingIndicator: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  filterButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginRight: 20,
  },

  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  filterButtonText: {
    color: Colors.whiteColor,
    fontSize: 14,
  },

  filterContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    gap: 5,
    paddingHorizontal: 10,
  },
  filterText: {
    fontSize: 14,
    color: "#333",
  },
});

export default AttendanceScreen;
