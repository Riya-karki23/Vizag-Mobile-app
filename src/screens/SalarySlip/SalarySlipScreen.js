import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import TopBar from "../../component/TopBar/TopBar";
import { fetchSalarySlipList } from "../../api/fetchSalarySlipList/fetchSalarySlipList";
import { useNavigation } from "@react-navigation/native";
import LinearGradient from "react-native-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { logError } from "../../constant/logger";
import Loader from "../../component/loader/appLoader";
import { Colors } from "../../constant/color";
import CustomText from "../../component/CustomText/customText";
import { Strings } from "../../constant/string_constant";
import BackgroundWrapper from "../../Background";
import images from "../../constant/image";
import { getItemFromStorage } from "../../utils/asyncStorage";
import { request } from "../../api/auth/auth";
import Icon from "react-native-vector-icons/Feather";
import Ionicons from "react-native-vector-icons/Ionicons";
const { width, height } = Dimensions.get("window");
const baseWidth = 375;
const desiredFontSize = 20;
const responsiveFontSize = desiredFontSize * (width / baseWidth);

const SalarySlipScreen = ({ route }) => {
  const [salarySlip, setSalarySlip] = useState([]);
  const [filteredSalarySlip, setFilteredSalarySlip] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userName, setUserName] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("Select Month");
  const [selectedYear, setSelectedYear] = useState("Select Year");
  const [isHRManager, setisHRManager] = useState(false);
  const [empList, setEmpList] = useState([]);
  const [selectedEmp, setSelectedEmp] = useState("Select Employee");
  const navigation = useNavigation();

  const handleItemPress = (item) => {
    navigation.navigate("SalarySlipPrint", { item });
  };

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
  const currentYear = new Date().getFullYear();
  const startYear = 2020;
  const years = Array.from({ length: currentYear - startYear + 1 }, (_, i) =>
    (startYear + i).toString()
  );

  const fetchSalarySlipListData = async (userName) => {
    try {
      const Employee = await request(
        "GET",
        `/api/resource/Employee/?fields=["name","employee","employee_name","owner","status","leave_approver","company"]&filters=[["user_id", "=", "${userName}"]]`
      );
      const json = Employee.data;
      if (json.data.length === 0) {
        setFilteredSalarySlip(null);
      } else {
        const data = await fetchSalarySlipList(json.data[0].name);
        setSalarySlip(data.data);
        // const uniqueData = data.data.filter(
        //   (item, index, self) =>
        //     index === self.findIndex((t) => t.date === item.date)
        // );
        setFilteredSalarySlip(data.data);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchUserName = async () => {
      try {
        const storedUserName = await getItemFromStorage(Strings.userName);
        if (storedUserName) {
          setUserName(storedUserName);
          fetchUserRoles(storedUserName);
          fetchSalarySlipListData(storedUserName);
        }
      } catch (error) {
        logError("Failed to load username:", error);
      }
    };
    const fetchUserRoles = async (storedUserName) => {
      try {
        const userResponse = await request(
          "GET",
          `/api/resource/User/${storedUserName}`
        );
        const isHRManager = userResponse.data.data.roles.some(
          (item) => item.role === "HR Manager"
        );
        if (isHRManager) {
          const employee = await request(
            "GET",
            `/api/resource/Employee/?fields=["name","employee","employee_name"]&limit_start=0&limit_page_length=0`
          );
          setEmpList(employee.data.data);
        } else {
          setEmpList([]);
        }
        setisHRManager(isHRManager);
      } catch (error) {
        logError("Failed to load username:", error);
      }
    };

    fetchUserName();
  }, []);
  useEffect(() => {
    if (salarySlip.length === 0) {
      fetchSalarySlipListData(userName);
    }
  }, []);

  useEffect(() => {
    if (route.params?.filterSalarySlipData) {
      const filtersData = route.params.filterSalarySlipData;
      setFilteredSalarySlip(filtersData);
    }
    if (route.params?.selectedEmp) {
      setSelectedEmp(route.params.selectedEmp);
    } else {
      setSelectedEmp("Select Employee");
    }
    if (route.params?.selectedMonth) {
      setSelectedMonth(route.params.selectedMonth);
    } else {
      setSelectedMonth("Select Month");
    }
    if (route.params?.selectedYear) {
      setSelectedYear(route.params.selectedYear);
    } else {
      setSelectedYear("Select Year");
    }
  }, [
    route.params?.filterSalarySlipData,
    route.params?.selectedEmp,
    route.params?.selectedMonth,
    route.params?.selectedYear,
  ]);

  if (loading) {
    return <Loader isLoading={loading} />;
  }

  if (error) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
        <CustomText style={styles.errorText}>Error: {error}</CustomText>
      </SafeAreaView>
    );
  }

  return (
    <BackgroundWrapper imageSource={images.mainBackground}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.container}>
          <TopBar />
          <View style={styles.headerContainer}>
            <CustomText style={styles.headerText}>Salary Slip List</CustomText>
            <View style={styles.filterButtons}>
              <View style={styles.filterContainer}>
                <TouchableOpacity
                  onPress={() => {
                    navigation.navigate("SalarySlipFilter", {
                      employeeList: empList,
                      months: months,
                      years: years,
                      isManager: isHRManager,
                      salarySlip: salarySlip,
                      selected_Month: selectedMonth,
                      selected_Year: selectedYear,
                      selected_Emp: selectedEmp,
                    });
                  }}
                  style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
                >
                  <Ionicons name="filter-outline" size={20} color="#666" />
                  <CustomText style={styles.filterText}> Filter</CustomText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          <View style={styles.tableHeader}>
            <CustomText style={styles.tableHeaderText}>
              Employee Name
            </CustomText>
            <CustomText style={styles.tableHeaderText}>Start Date</CustomText>
            <CustomText style={styles.tableHeaderText}>End Date</CustomText>
          </View>
          {filteredSalarySlip?.length === 0 ? (
            <View style={styles.container}>
              <CustomText style={styles.noDataText}>
                {Strings.noDataAvailable}
              </CustomText>
            </View>
          ) : (
            <FlatList
              data={filteredSalarySlip}
              keyExtractor={(item) => item.name}
              renderItem={({ item, index }) => (
                <TouchableOpacity onPress={() => handleItemPress(item)}>
                  <View
                    style={[
                      styles.tableRow,
                      {
                        backgroundColor:
                          index % 2 === 0
                            ? Colors.tableRowColor
                            : Colors.whiteColor,
                      },
                    ]}
                  >
                    <CustomText style={styles.tableCell}>
                      {item.employee_name}
                    </CustomText>
                    <CustomText style={styles.tableCell}>
                      {item.start_date}
                    </CustomText>
                    <CustomText style={styles.tableCell}>
                      {item.end_date}
                    </CustomText>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </SafeAreaView>
    </BackgroundWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginLeft: 20,
    marginTop: 10,
  },
  headerText: {
    fontWeight: Platform.OS == "ios" ? 700 : null,
    fontSize: responsiveFontSize,
    textAlign: "left",
    color: Colors.darkGreyColor,
  },
  addButton: {
    borderRadius: 24,
    height: 40,
    paddingHorizontal: 11,
    justifyContent: "center",
    marginVertical: 10,
    marginBottom: 15,
  },
  addButtonText: {
    color: Colors.blackColor,
    fontWeight: 600,
    fontSize: 16,
    textAlign: "center",
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
    fontWeight: 500,
    textAlign: "center",
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
    marginTop: 20,
    color: Colors.darkGreyColor,
    fontSize: responsiveFontSize,
  },
  retryText: {
    textAlign: "center",
    marginTop: 15,
    fontSize: 17,
    marginHorizontal: 10,
    color: Colors.darkGreyColor,
  },
  loadingIndicator: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  dropdownContainer: {
    backgroundColor: Colors.whiteColor,
    borderRadius: 10,
    elevation: 10,
    marginHorizontal: 20,
    height: "30%",
  },

  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGreyColor,
  },
  itemText: {
    fontSize: 15,
    fontWeight: "600",
    textAlign: "left",
    color: Colors.darkGreyColor,
    paddingLeft: 15,
  },
  filterContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  filterViewStyle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 10,
    marginTop: 10,
    borderColor: Colors.blackColor,
    borderWidth: 1.5,
    padding: 8,
    borderRadius: 8,
  },
  filterButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
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

export default SalarySlipScreen;
