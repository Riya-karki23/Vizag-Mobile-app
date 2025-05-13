import { FlatList, StyleSheet, TouchableOpacity, View } from "react-native";
import CustomText from "../../component/CustomText/customText";
import Icon from "react-native-vector-icons/Feather";
import BackgroundWrapper from "../../Background";
import images from "../../constant/image";
import { Colors } from "../../constant/color";
import { useEffect, useState } from "react";
import Loader from "../../component/loader/appLoader";
import { showToast } from "../../constant/toast";
const SalarySlipFilter = ({ navigation, route }) => {
  const {
    employeeList,
    months,
    years,
    isManager,
    salarySlip,
    selected_Month,
    selected_Year,
    selected_Emp,
  } = route.params;
  const [isDropdownVisible, setDropdownVisible] = useState(false);
  const [isYearDropdownVisible, setYearDropdownVisible] = useState(false);
  const [isEmpDropdownVisible, setisEmpDropdownVisible] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("Select Month");
  const [selectedYear, setSelectedYear] = useState("Select Year");
  const [isHRManager, setisHRManager] = useState(false);
  const [empList, setEmpList] = useState([]);
  const [selectedEmp, setSelectedEmp] = useState("Select Employee");
  const [filteredSalarySlip, setFilteredSalarySlip] = useState([]);
  const [salarySlipList, setSalarySlipList] = useState([]);
  const [isLoading, setisLoading] = useState(false);
  useEffect(() => {
    setEmpList(employeeList);
    setisHRManager(isManager);
    setSalarySlipList(salarySlip);
    setSelectedEmp(selected_Emp || "Select Employee");
    setSelectedMonth(selected_Month || "Select Month");
    setSelectedYear(selected_Year || "Select Year");
  }, [employeeList, months, years, isManager, salarySlip]);
  const toggleDropdown = () => {
    setDropdownVisible(!isDropdownVisible);
  };

  const toggleYearDropdown = () => {
    setYearDropdownVisible(!isYearDropdownVisible);
  };

  const toggleEmpDropdown = () => {
    setisEmpDropdownVisible(!isEmpDropdownVisible);
  };

  const selectMonth = (month) => {
    setSelectedMonth(month);
    setDropdownVisible(false);
    filterByMonthAndYear(month, selectedYear, selectedEmp);
  };

  const selectYear = (year) => {
    setSelectedYear(year);
    setYearDropdownVisible(false);
    filterByMonthAndYear(selectedMonth, year, selectedEmp);
  };

  const selectEmp = (emp) => {
    setSelectedEmp(emp);
    setisEmpDropdownVisible(false);
    filterByMonthAndYear(selectedMonth, selectedYear, emp);
  };

  const filterByMonthAndYear = (month, year, emp) => {
    const monthIndex = month ? months.indexOf(month) + 1 : null;
    const selectedYear = year ? Number(year) : null;
    const filteredData = salarySlipList.filter((slip) => {
      if (!slip.start_date || !slip.end_date || !slip.employee) return false;
      const startDate = new Date(slip.start_date);
      const endDate = new Date(slip.end_date);
      const startMonth = startDate.getMonth() + 1;
      const startYear = startDate.getFullYear();
      const endMonth = endDate.getMonth() + 1;
      const endYear = endDate.getFullYear();
      const matchesMonth = monthIndex
        ? startMonth === monthIndex || endMonth === monthIndex
        : true;
      const matchesYear = selectedYear
        ? startYear === selectedYear || endYear === selectedYear
        : true;
      const matchesEmployee =
        emp !== "Select Employee" ? slip.employee === emp : true;
      return matchesMonth && matchesYear && matchesEmployee;
    });
    setFilteredSalarySlip(filteredData);
  };
  return (
    <BackgroundWrapper imageSource={images.mainBackground}>
      <View style={styles.container}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginLeft: 10,
            marginTop: 30,
          }}
        >
          <Icon
            name="chevron-left"
            size={40}
            color={Colors.blackColor}
            onPress={() => {
              navigation.goBack();
            }}
          />
          <CustomText style={styles.headingStyle}>Filters</CustomText>
        </View>
        <View style={styles.filterView}>
          <TouchableOpacity
            style={styles.filterViewStyle}
            onPress={() => {
              toggleDropdown();
              setYearDropdownVisible(false);
              setisEmpDropdownVisible(false);
            }}
          >
            <CustomText style={styles.addButtonText}>
              {selectedMonth}
            </CustomText>
            <Icon
              name={selectedMonth === "Select Month" ? "chevron-down" : "x"}
              size={30}
              onPress={() => {
                if (selectedMonth !== "Select Month") {
                  setSelectedMonth("Select Month");
                  filterByMonthAndYear(null, selectedYear, selectedEmp);
                }
              }}
              style={{ marginLeft: 10 }}
              color={Colors.orangeColor}
            />
          </TouchableOpacity>
          {isDropdownVisible && (
            <View style={styles.dropdownContainer}>
              <FlatList
                data={months}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() => selectMonth(item)}
                  >
                    <CustomText style={styles.itemText}>{item}</CustomText>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}
          <TouchableOpacity
            style={styles.filterViewStyle}
            onPress={() => {
              toggleYearDropdown();
              setDropdownVisible(false);
              setisEmpDropdownVisible(false);
            }}
          >
            <CustomText style={styles.addButtonText}>{selectedYear}</CustomText>
            <Icon
              name={selectedYear === "Select Year" ? "chevron-down" : "x"}
              size={30}
              style={{ marginLeft: 10 }}
              onPress={() => {
                if (selectedYear !== "Select Year") {
                  setSelectedYear("Select Year");
                  filterByMonthAndYear(selectedMonth, null, selectedEmp);
                }
              }}
              color={Colors.orangeColor}
            />
          </TouchableOpacity>
          {isYearDropdownVisible && (
            <View style={styles.dropdownContainer}>
              <FlatList
                data={years}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() => {
                      selectYear(item);
                    }}
                  >
                    <CustomText style={styles.itemText}>{item}</CustomText>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}
          {isHRManager && (
            <TouchableOpacity
              style={styles.filterViewStyle}
              onPress={() => {
                toggleEmpDropdown();
                setYearDropdownVisible(false);
                setDropdownVisible(false);
              }}
            >
              <CustomText style={styles.addButtonText}>
                {empList.find((item) => item.name === selectedEmp)
                  ?.employee_name || "Select Employee"}
              </CustomText>
              <Icon
                name={selectedEmp === "Select Employee" ? "chevron-down" : "x"}
                style={{ marginLeft: 10 }}
                onPress={() => {
                  if (selectedEmp !== "Select Employee") {
                    setSelectedEmp("Select Employee");
                    filterByMonthAndYear(selectedMonth, selectedYear, null);
                  }
                }}
                size={30}
                color={Colors.orangeColor}
              />
            </TouchableOpacity>
          )}
        </View>

        {isEmpDropdownVisible && (
          <View style={[styles.dropdownContainer, { marginHorizontal: 25 }]}>
            <FlatList
              data={empList}
              keyExtractor={(item) => item.name}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => {
                    selectEmp(item?.employee);
                  }}
                >
                  <CustomText style={styles.itemText}>
                    {item.employee_name}
                  </CustomText>
                </TouchableOpacity>
              )}
            />
          </View>
        )}
      </View>
      <TouchableOpacity
        style={styles.buttonViewStyle}
        onPress={() => {
          setisLoading(true);
          const filteredData = filteredSalarySlip;
          if (
            selectedMonth === "Select Month" &&
            selectedYear === "Select Year" &&
            selectedEmp === "Select Employee"
          ) {
            setTimeout(() => {
              showToast("Please select filter options!");
              setisLoading(false);
            }, 1000);
          } else {
            setTimeout(() => {
              setisLoading(false);

              navigation.navigate("Main", {
                screen: "Salary Slip",
                params: {
                  filterSalarySlipData: filteredData,
                  selectedMonth: selectedMonth,
                  selectedYear: selectedYear,
                  selectedEmp: selectedEmp,
                },
              });
            }, 2000);
          }
        }}
      >
        {isLoading ? (
          <CustomText style={styles.buttonText}>Please wait...</CustomText>
        ) : (
          <CustomText style={styles.buttonText}>Apply Filters</CustomText>
        )}
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.buttonViewStyle, { marginBottom: 40 }]}
        onPress={() => {
          setSelectedMonth("Select Month");
          setSelectedYear("Select Year");
          setSelectedEmp("Select Employee");
          filterByMonthAndYear(null, null, null);
          setDropdownVisible(false);
          setYearDropdownVisible(false);
          setisEmpDropdownVisible(false);

          navigation.navigate("Main", {
            screen: "Salary Slip",
            params: {
              filterSalarySlipData: salarySlipList,
              selectedMonth: null,
              selectedYear: null,
              selectedEmp: null,
            },
          });
        }}
      >
        <CustomText style={styles.buttonText}>Clear Filters</CustomText>
      </TouchableOpacity>
    </BackgroundWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headingStyle: {
    color: Colors.blackColor,
    fontSize: 20,
    marginLeft: 20,
  },
  filterViewStyle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 10,
    marginTop: 20,
    borderColor: Colors.blackColor,
    borderWidth: 1.5,
    padding: 8,
    borderRadius: 8,
  },
  addButton: {
    borderRadius: 24,
    height: 40,
    paddingHorizontal: 11,
    marginVertical: 10,
    marginBottom: 15,
  },
  addButtonText: {
    color: Colors.blackColor,
    fontWeight: 600,
    fontSize: 16,
  },
  filterView: {
    marginHorizontal: 20,
    marginTop: 20,
  },
  buttonViewStyle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 40,
    marginTop: 20,
    backgroundColor: Colors.orangeColor,
    padding: 8,
    borderRadius: 8,
  },
  buttonText: {
    color: Colors.whiteColor,
    fontWeight: 600,
    fontSize: 16,
  },
  dropdownContainer: {
    backgroundColor: Colors.whiteColor,
    borderRadius: 10,
    elevation: 10,
    marginHorizontal: 10,
    marginTop: 10,
    height: "40%",
  },
  itemText: {
    fontSize: 15,
    fontWeight: "600",
    textAlign: "left",
    color: Colors.darkGreyColor,
    paddingLeft: 15,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGreyColor,
  },
});

export default SalarySlipFilter;
