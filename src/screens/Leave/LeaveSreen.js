import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Dimensions,
  TouchableWithoutFeedback,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import TopBar from "../../component/TopBar/TopBar";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { ScrollView } from "react-native-gesture-handler";
import LinearGradient from "react-native-linear-gradient";
import Icon from "react-native-vector-icons/Ionicons";
import { fetchLeaveApplications } from "../../api/Leave Application/fetchLeaveApplications/fetchLeaveApplications";
import { getLeaveDetails } from "../../api/Leave Application/fetchLeaveAllocationDetails/LeaveAllocationDetails";
import { SafeAreaView } from "react-native-safe-area-context";
import { request } from "../../api/auth/auth";
import { logError, logInfo } from "../../constant/logger";
import Loader from "../../component/loader/appLoader";
import { Colors } from "../../constant/color";
import CustomText from "../../component/CustomText/customText";
import { LayoutAnimation, Platform } from "react-native";
import { Strings } from "../../constant/string_constant";
import { ScrollViewIndicator } from "@fanchenbao/react-native-scroll-indicator";
import BackgroundWrapper from "../../Background";
import images from "../../constant/image";
import { useIsFocused } from "@react-navigation/native";
import { getItemFromStorage } from "../../utils/asyncStorage";
import { showToast } from "../../constant/toast";
import ShowToastConatiner from "../../component/ToastComponent";
const { width, height } = Dimensions.get("window");
const baseWidth = 375; // Example base width (for design reference)
const desiredFontSize = 20;
const responsiveFontSize = desiredFontSize * (width / baseWidth);

const desiredFontSizeLabel = 12;
const responsiveFontSizeLabel = desiredFontSizeLabel * (width / baseWidth);

const LeaveScreen = () => {
  const isFocused = useIsFocused();
  const [leaveApplications, setLeaveApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userName, setUserName] = useState("");
  const [userDetails, setUserDetails] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [fromDate, setFromDate] = useState(
    new Date(new Date().setDate(new Date().getDate() + 1))
  );
  const [toDate, setToDate] = useState(
    new Date(new Date().setDate(new Date().getDate() + 1))
  );
  const [postingDate, setPostingDate] = useState(new Date());
  const [showFromDatePicker, setShowFromDatePicker] = useState(false);
  const [showToDatePicker, setShowToDatePicker] = useState(false);
  const [showPostingDatePicker, setShowPostingDatePicker] = useState(false);
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("Open");
  const [checked, setChecked] = useState(false);
  const [value, setValue] = useState(0);
  const [leaveTypes, setLeaveTypes] = useState([]); // For fetched leave types
  const [selectedLeaveType, setSelectedLeaveType] = useState(""); // Selected leave type
  const [leaveTypeDropdownVisible, setLeaveTypeDropdownVisible] =
    useState(false); // Control visibility of the leave type dropdown
  const [refresh, setRefresh] = useState(false);
  const [employeeId, setEmployeeId] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [leaveDetails, setLeaveDetails] = useState(null);
  const [isTableVisible, setIsTableVisible] = useState(false); // Controls table visibility

  useEffect(() => {
    const fetchUserName = async () => {
      try {
        const storedUserName = await getItemFromStorage(Strings.userName);
        if (storedUserName) {
          setUserName(storedUserName);
          fetchUserDetails(storedUserName);
          fetchLeaveApplicationsData(storedUserName);
        }
      } catch (error) {
        logError("Failed to load username:", error);
      }
    };

    const fetchEmployees = async () => {
      try {
        const storedUserName = await getItemFromStorage(Strings.userName);
        const Employee = await request(
          "GET",
          `/api/resource/Employee?fields=["name","employee","employee_name","owner","status","leave_approver","company"]&filters=[["user_id", "=", "${storedUserName}"]]`
        );
        const json = Employee.data;
        setEmployees(json.data);
        setEmployeeId(json.data[0].name);
        const today = new Date();
        const formattedDate = today.toISOString().split("T")[0];
        setCurrentDate(formattedDate);

        handleGetLeaveDetails(json.data[0].name, formattedDate);
      } catch (error) {
        logError("Error fetching employees:", error);
      }
    };

    const fetchLeaveApplicationsData = async (userName) => {
      try {
        const data = await fetchLeaveApplications(userName);
        setLeaveApplications(data.data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    const fetchUserDetails = async (userName) => {
      try {
        // const response = await axios.get(
        //   `${BASE_URL}/api/resource/User?filters=[["username", "=", "${userName}"]]&fields=["name","email","full_name","username","owner","first_name","middle_name","last_name"]`
        // );
        const response = await request(
          "GET",
          `/api/resource/User?filters=[["username", "=", "${userName}"]]&fields=["name","email","full_name","username","owner","first_name","middle_name","last_name"]`
        );
        setUserDetails(response.data.data[0]);
      } catch (error) {
        logError("Failed to fetch user details:", error);
        setError(error.message);
      }
    };

    fetchUserName();
    fetchEmployees();
  }, [isFocused, refresh]);

  const handleAddLeave = () => {
    setModalVisible(true);
  };

  const fetchLeaveTypes = async () => {
    try {
      // const response = await fetch(`${BASE_URL}/api/resource/Leave Type`);
      const response = await request("GET", "/api/resource/Leave Type");

      const json = response.data;
      if (json.data && Array.isArray(json.data)) {
        setLeaveTypes(json.data);
      } else {
        logError("Error: No data found");
        setLeaveTypes([]); // Set to empty array if no data
      }
    } catch (error) {
      logError("Error fetching leave types:", error);
    }
  };

  const handleSelectLeaveType = (leaveType) => {
    setSelectedLeaveType(leaveType.name);
    setLeaveTypeDropdownVisible(false);
  };

  const handleSelectEmployee = (employee) => {
    setInputValue(employee.employee_name);
    setSelectedEmployee(employee);
    setDropdownVisible(false);
  };

  const formatDate = (date) => {
    return date.toISOString().split("T")[0]; // Format: YYYY-MM-DD
  };

  const handleDateChange = (event, selectedDate, setDate, setShowPicker) => {
    setShowPicker(Platform.OS === "ios");
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const toggleCheckbox = () => {
    setChecked(!checked); // Toggle checkbox state
    const value = !checked ? 1 : 0;
    setValue(value); // Store the value in state
  };

  const resetForm = () => {
    setSelectedEmployee(null);
    setDescription("");
    setFromDate(new Date());
    setToDate(new Date());
    setPostingDate(new Date());
    setStatus("Open");
    setChecked(false);
    setValue(0);
    setSelectedLeaveType(null);
  };

  const handleFormSubmit = async () => {
    const formData = {
      employee_name: employees[0].employee_name,
      status: status,
      ...(!checked && {
        from_date: formatDate(fromDate),
        to_date: formatDate(toDate),
      }),
      name: employees[0].name,
      company: employees[0].company,
      leave_type: selectedLeaveType,
      employee: employees[0].name,
      ...(employees[0].leave_approver && {
        leave_approver: employees[0].leave_approver,
      }),
      owner: employees[0].owner,
      ...(checked && {
        half_day_date: formatDate(postingDate),
        half_day: value,
        from_date: formatDate(postingDate),
        to_date: formatDate(postingDate),
      }),
      reason: description,
    };
    const errors = validateFormData(formData);

    if (errors.length > 0) {
      showToast(errors.join("\n"));
      return;
    }
    try {
      const response = await request(
        "POST",
        "/api/resource/Leave Application",
        JSON.stringify(formData)
      );
      if (
        response.statusCode == undefined ||
        response.statusCode < 200 ||
        response.statusCode >= 300
      ) {
        const parsedMessages = JSON.parse(response.error?._server_messages);
        throw new Error(`${JSON.parse(parsedMessages[0])?.message}`);
      }
      // Parse the JSON response
      const data = response.data;

      // Success: Show success alert and close the modal
      alert(Strings.leaveAppliedSucess);
      handleCloseModal();
      resetForm();
      setRefresh((prev) => !prev);
      // Close the modal after successful submission
      const Listdata = await fetchLeaveApplications(userName);
      setLeaveApplications(Listdata);
      setModalVisible(false);
    } catch (error) {
      logError("Error submitting form:", error);
      // alert(`${error}`);
    }
  };
  const validateFormData = (formData) => {
    logInfo("data is", formData);
    const errors = [];

    if (!formData.employee_name) errors.push("Employee name is required.");
    if (!formData.status) errors.push("Status is required.");
    if (!formData.from_date) errors.push("From date is required.");
    if (!formData.to_date) errors.push("To date is required.");
    if (!formData.name) errors.push("Employee record name is required.");
    if (!formData.company) errors.push("Company is required.");
    if (!formData.leave_type) errors.push("Leave type is required.");
    // if (!formData.leave_approver) errors.push("Leave approver is required.");
    if (!formData.owner) errors.push("Owner is required.");
    if (checked && !formData.half_day_date)
      errors.push("Half day date is required.");
    if (!formData.reason) errors.push("Leave Reason is required.");
    if (
      checked &&
      (typeof formData.half_day !== "number" ||
        (formData.half_day !== 0 && formData.half_day !== 1))
    ) {
      errors.push("Half day must be 0 or 1.");
    }

    return errors;
  };
  const handleCloseModal = () => {
    setModalVisible(false);
    resetForm(); // Reset form values when modal closes
  };

  const handleGetLeaveDetails = async (
    employee_Id = "",
    current_Date = new Date()
  ) => {
    try {
      const details = await getLeaveDetails(employee_Id, current_Date);
      setLeaveDetails(details);
    } catch (error) {
      alert("Error", error.message);
    }
  };
  if (loading) {
    return <Loader isLoading={loading} />;
  }

  if (error) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: "white", justifyContent: "center" }}
      >
        <CustomText style={styles.errorText}>
          {Strings.noNetworkAvailable}
        </CustomText>
      </SafeAreaView>
    );
  }

  return (
    <BackgroundWrapper imageSource={images.mainBackground}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.container}>
          <TopBar />

          <View style={styles.headerContainer}>
            <CustomText style={styles.headerText}>
              Leave Applications
            </CustomText>
            <TouchableOpacity
              style={[
                styles.addButton,
                {
                  borderColor: Colors.blackColor,
                  borderWidth: 1.5,
                },
              ]}
              onPress={handleAddLeave}
            >
              <CustomText
                style={[
                  styles.addButtonText,
                  { color: Colors.blackColor, paddingHorizontal: 10 },
                ]}
              >
                Apply Leave
              </CustomText>
            </TouchableOpacity>
          </View>
          <ScrollView>
            <View style={{ padding: 10 }}>
              <View style={styles.row}>
                <View style={styles.card}>
                  <CustomText style={styles.header}>Leave Balance</CustomText>
                  <CustomText style={styles.leaveCountStyle}>
                    {(leaveDetails?.leave_allocation?.["Casual Leave"]?.[
                      "remaining_leaves"
                    ] ?? "") +
                      (leaveDetails?.leave_allocation?.["Sick Leave"]?.[
                        "remaining_leaves"
                      ] ?? "")}
                  </CustomText>
                </View>
                <View style={styles.card}>
                  <CustomText style={styles.header} numberOfLines={1}>
                    Pending Approval
                  </CustomText>
                  <CustomText style={styles.leaveCountStyle}>
                    {(leaveDetails?.leave_allocation?.["Casual Leave"]?.[
                      "leaves_pending_approval"
                    ] ?? "") +
                      (leaveDetails?.leave_allocation?.["Sick Leave"]?.[
                        "leaves_pending_approval"
                      ] ?? "")}
                  </CustomText>
                </View>
              </View>
              <View style={styles.row}>
                <View style={styles.card}>
                  <CustomText style={styles.header}>Leaves Taken</CustomText>
                  <CustomText style={styles.leaveCountStyle}>
                    {(leaveDetails?.leave_allocation?.["Casual Leave"]?.[
                      "leaves_taken"
                    ] ?? "") +
                      (leaveDetails?.leave_allocation?.["Sick Leave"]?.[
                        "leaves_taken"
                      ] ?? "")}
                  </CustomText>
                </View>
                <View style={styles.card}>
                  <CustomText style={styles.header}>Total Leaves</CustomText>
                  <CustomText style={styles.leaveCountStyle}>
                    {(leaveDetails?.leave_allocation?.["Casual Leave"]?.[
                      "total_leaves"
                    ] ?? "") +
                      (leaveDetails?.leave_allocation?.["Sick Leave"]?.[
                        "total_leaves"
                      ] ?? "")}
                  </CustomText>
                </View>
              </View>
            </View>
            <View style={styles.tableHeader}>
              <CustomText style={styles.tableHeaderText}>
                Employee Name
              </CustomText>
              <CustomText style={styles.tableHeaderText}>Status</CustomText>
              {/* <CustomText style={styles.tableHeaderText}>Leave Type</CustomText> */}
              <CustomText style={styles.tableHeaderText}>From Date</CustomText>
              <CustomText style={styles.tableHeaderText}>To Date</CustomText>
            </View>

            {leaveApplications.length > 0 ? (
              <FlatList
                scrollEnabled={false}
                data={leaveApplications}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item, index }) => (
                  <View
                    style={[
                      styles.leaveTableRow,
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
                      {item.status}
                    </CustomText>
                    {/* <CustomText style={styles.tableCell}>
                  {item.leave_type}
                </CustomText> */}
                    <CustomText style={styles.tableCell}>
                      {item.from_date}
                    </CustomText>
                    <CustomText style={styles.tableCell}>
                      {item.to_date}
                    </CustomText>
                  </View>
                )}
              />
            ) : (
              <CustomText style={styles.noDataText}>
                {Strings.noDataAvailable}
              </CustomText>
            )}
          </ScrollView>
          <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
          >
            <View style={styles.modalBackground}>
              <View style={styles.modalView}>
                <ScrollViewIndicator
                  contentContainerStyle={styles.modalContent}
                  indStyle={{
                    backgroundColor: Colors.orangeColor,
                    width: 8,
                    marginRight: -12,
                    borderRadius: 4,
                  }}
                >
                  {/* Employee Input */}
                  <View style={styles.crossButton}>
                    <TouchableOpacity
                      onPress={() => {
                        setModalVisible(false);
                        resetForm();
                      }}
                      style={styles.button}
                    >
                      <View>
                        <Icon
                          name="close"
                          size={20}
                          color={Colors.orangeColor}
                        />
                      </View>
                    </TouchableOpacity>
                  </View>
                  <CustomText style={styles.modalLabel}>Leave Type</CustomText>
                  <TouchableOpacity
                    onPress={() => {
                      LayoutAnimation.configureNext(
                        LayoutAnimation.Presets.easeInEaseOut
                      );
                      setLeaveTypeDropdownVisible(!leaveTypeDropdownVisible);
                      if (!leaveTypeDropdownVisible) {
                        fetchLeaveTypes();
                      }
                    }}
                    style={styles.fullWidthInput}
                  >
                    <TextInput
                      placeholderTextColor={Colors.lightGreyColor}
                      style={styles.input}
                      pointerEvents="none"
                      placeholder="Select a leave type"
                      value={selectedLeaveType}
                      editable={false}
                    />
                  </TouchableOpacity>

                  {leaveTypeDropdownVisible && (
                    <View style={styles.dropdown}>
                      {leaveTypes.map((leaveType, index) => (
                        <TouchableOpacity
                          key={index}
                          onPress={() => handleSelectLeaveType(leaveType)}
                          style={styles.dropdownItem}
                        >
                          <CustomText style={styles.modalLabel}>
                            {leaveType.name}
                          </CustomText>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {/* Description */}
                  <CustomText style={styles.modalLabel}>Reason</CustomText>
                  <TextInput
                    placeholderTextColor={Colors.lightGreyColor}
                    placeholder="Enter Reason"
                    style={styles.description}
                    selectionColor={Colors.orangeColor}
                    value={description}
                    onChangeText={(text) => setDescription(text)}
                    multiline
                  />

                  <View style={styles.row}>
                    <View style={styles.fullWidthInput}>
                      <CustomText style={styles.modalLabel}>Company</CustomText>
                      {employees && employees[0] ? ( // Check if employees array exists and has at least one item
                        <TextInput
                          value={employees[0].company || ""}
                          placeholder="Company"
                          editable={false}
                          pointerEvents="none" // Prevents interaction like clicking
                          style={[styles.input, { color: Colors.blackColor }]}
                        />
                      ) : (
                        <CustomText style={styles.modalLabel}>
                          No Company available
                        </CustomText> // Fallback text
                      )}
                    </View>
                  </View>

                  {/* Leave Approver and Owner */}
                  <View style={styles.row}>
                    {employees[0]?.leave_approver && (
                      <>
                        <View style={styles.fullWidthInput}>
                          <CustomText style={styles.modalLabel}>
                            Leave Approver
                          </CustomText>

                          {employees && employees[0] ? ( // Check if employees array exists and has at least one item
                            <TextInput
                              placeholderTextColor={Colors.lightGreyColor}
                              value={employees[0].leave_approver || ""}
                              placeholder="Leave Approver"
                              editable={false}
                              pointerEvents="none" // Prevents interaction
                              style={styles.input}
                            />
                          ) : (
                            <CustomText style={styles.modalLabel}>
                              No leave approver available
                            </CustomText> // Fallback text
                          )}
                        </View>
                      </>
                    )}

                    <View style={styles.fullWidthInput}>
                      <CustomText style={styles.modalLabel}>Owner</CustomText>
                      {employees && employees[0] ? ( // Check if employees array exists and has at least one item
                        <TextInput
                          placeholderTextColor={Colors.lightGreyColor}
                          value={employees[0].owner || ""}
                          placeholder="Owner"
                          editable={false}
                          pointerEvents="none" // Prevents interaction like clicking
                          style={styles.input}
                        />
                      ) : (
                        <CustomText style={styles.modalLabel}></CustomText> // Fallback text
                      )}
                    </View>
                  </View>

                  {/* Date pickers */}
                  {!checked && (
                    <View style={styles.row}>
                      <View style={styles.fullWidthInput}>
                        <CustomText style={styles.modalLabel}>
                          From Date:
                        </CustomText>
                        <TouchableOpacity
                          onPress={() => {
                            setShowFromDatePicker(true);
                            setShowToDatePicker(false);
                          }}
                        >
                          <CustomText style={styles.input}>
                            {fromDate.toISOString().split("T")[0]}
                          </CustomText>
                        </TouchableOpacity>
                        {showFromDatePicker && (
                          <DateTimePicker
                            value={fromDate}
                            mode="date"
                            minimumDate={
                              new Date(
                                new Date().setDate(new Date().getDate() + 1)
                              )
                            }
                            display="default"
                            style={{ alignSelf: "flex-start" }}
                            onChange={(event, date) => {
                              handleDateChange(
                                event,
                                date,
                                setFromDate,
                                setShowFromDatePicker
                              );
                              setShowFromDatePicker(false);
                            }}
                          />
                        )}
                        <View style={styles.fullWidthInput}>
                          <CustomText style={styles.modalLabel}>
                            To Date:
                          </CustomText>
                          <TouchableOpacity
                            onPress={() => {
                              setShowToDatePicker(true);
                              setShowFromDatePicker(false);
                            }}
                          >
                            <CustomText style={styles.input}>
                              {toDate.toISOString().split("T")[0]}
                            </CustomText>
                          </TouchableOpacity>
                          {showToDatePicker && (
                            <DateTimePicker
                              minimumDate={
                                new Date(
                                  new Date().setDate(new Date().getDate() + 1)
                                )
                              }
                              value={toDate}
                              mode="date"
                              display="default"
                              style={{ alignSelf: "flex-start" }}
                              onChange={(event, date) => {
                                handleDateChange(
                                  event,
                                  date,
                                  setToDate,
                                  setShowToDatePicker
                                );
                                setShowToDatePicker(false);
                              }}
                            />
                          )}
                        </View>
                      </View>
                    </View>
                  )}
                  <View style={styles.checkboxContainer}>
                    <TouchableOpacity
                      onPress={toggleCheckbox}
                      style={styles.checkbox}
                    >
                      {checked ? (
                        <Icon
                          name="checkmark"
                          size={20}
                          color={Colors.orangeColor}
                        />
                      ) : null}
                    </TouchableOpacity>
                    <CustomText style={styles.modalLabel}>Half day</CustomText>
                  </View>
                  {checked && (
                    <View
                      style={[
                        styles.fullWidthInput,
                        { marginBottom: checked ? 10 : 0 },
                      ]}
                    >
                      <TouchableOpacity
                        onPress={() => setShowPostingDatePicker(true)}
                      >
                        <CustomText style={styles.input}>
                          {postingDate.toISOString().split("T")[0]}
                        </CustomText>
                      </TouchableOpacity>
                      {showPostingDatePicker && (
                        <DateTimePicker
                          value={postingDate}
                          mode="date"
                          display="default"
                          style={{ alignSelf: "flex-start" }}
                          minimumDate={new Date()}
                          onChange={(event, date) => {
                            handleDateChange(
                              event,
                              date,
                              setPostingDate,
                              setShowPostingDatePicker
                            );
                            setShowPostingDatePicker(false);
                          }}
                        />
                      )}
                    </View>
                  )}

                  <TouchableOpacity onPress={handleFormSubmit}>
                    <LinearGradient
                      colors={[Colors.orangeColor, Colors.redColor]}
                      style={styles.addButton}
                    >
                      <CustomText style={styles.addButtonText}>
                        Submit
                      </CustomText>
                    </LinearGradient>
                  </TouchableOpacity>
                </ScrollViewIndicator>
              </View>
            </View>
          </Modal>
        </View>
      </SafeAreaView>
    </BackgroundWrapper>
  );
};

const styles = StyleSheet.create({
  card: {
    width: "40%",
    backgroundColor: "#fff",
    borderRadius: 10,
    height: 100,
    // padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    margin: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  checkbox: {
    width: 25,
    height: 25,
    borderWidth: 1,
    borderColor: Colors.orangeColor,
    alignItems: "center",
    justifyContent: "center",
    // margin: 5,
    borderRadius: 24,
    // padding: 4,
  },

  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    margin: 5,
  },
  container: {
    flex: 1,
    // backgroundColor: Colors.whiteColor,
  },
  crossButton: {
    paddingRight: 10,
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "flex-end",
  },
  button: {
    width: 40, // Width of the circular button
    height: 40, // Height of the circular button
    borderRadius: 30, // Make it circular by setting the radius to half of width/height
    borderColor: Colors.orangeColor,
    borderWidth: 2,
    justifyContent: "center", // Center the icon inside the button
    alignItems: "center", // Center the icon horizontally and vertically
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    // margin: 20,
    marginLeft: 20,
    marginRight: 20,
  },
  headerText: {
    fontSize: responsiveFontSize,
    // fontWeight: "700",
    fontWeight: Platform.OS == "ios" ? 700 : null,
    marginBottom: 16,
    textAlign: "left",
    color: Colors.darkGreyColor,
  },
  addButton: {
    borderRadius: 10,
    height: 42,
    marginLeft: 10,
    justifyContent: "center",
    marginBottom: 15,
    alignItems: "center",
    alignContent: "center",
    marginTop: 15,
    marginHorizontal: 15,
  },
  addButtonText: {
    color: Colors.whiteColor,
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

  header: {
    flexDirection: "row",
    padding: 5,
    backgroundColor: Colors.whiteColor,
    borderRadius: 24,
    margin: 5,
    alignItems: "center",
    justifyContent: "center",
    color: Colors.blackColor,
    fontSize: 16,
    fontWeight: 600,
  },
  leaveCountStyle: {
    flexDirection: "row",
    padding: 5,
    backgroundColor: Colors.whiteColor,
    borderRadius: 24,
    margin: 5,
    alignItems: "center",
    justifyContent: "center",
    color: Colors.blackColor,
    fontSize: 22,
    fontWeight: Platform.OS == "ios" ? 700 : null,
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
    shadowColor: Colors.blackColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
    borderRadius: 8,
    padding: 7,
    margin: 5,
    backgroundColor: Colors.whiteColor,
    justifyContent: "center",
    alignItems: "center",
  },
  leaveTableRow: {
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

  leaveTableCell: {
    flex: 1,
    fontSize: 14,
    color: Colors.darkGreyColor,
    justifyContent: "center",
    alignItems: "center",
    fontWeight: 500,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: Colors.whiteColor,
    padding: 30,
    borderRadius: 10,
    width: "80%",
  },
  modalLabel: {
    color: Colors.blackColor,
    fontSize: responsiveFontSizeLabel,
    fontWeight: "500",
    padding: 5,
  },

  input: {
    borderColor: Colors.lightGreyColor,
    borderWidth: 1,
    borderRadius: 20,
    padding: 10,
    height: 40,
    marginBottom: 10,
  },

  loadingIndicator: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "red",
    marginHorizontal: 20,
    fontSize: 17,
    textAlign: "center",
  },
  noDataText: {
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    textAlign: "center",
    color: Colors.darkGreyColor,
    marginTop: 20,
    fontSize: responsiveFontSize,
  },
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    // backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    backgroundColor: "white",
    borderRadius: 24,
    padding: 20,
    width: "90%",
    maxHeight: "65%",
    shadowColor: Colors.blackColor,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  modalContent: {
    flexGrow: 1,
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,

    // Shadow for Android
    elevation: 4,
  },
  label: {
    fontSize: responsiveFontSizeLabel,
    marginBottom: 5,
  },
  fullWidthInput: {
    width: "100%",
    // padding: 2,
    // borderColor: '#ddd',
    // borderWidth: 1,
    // borderRadius: 5,
    marginBottom: 10,
  },
  description: {
    fontFamily: Strings.fontFamilyConstant,
    paddingLeft: 10,
    paddingTop: 10,
    borderColor: Colors.borderColor,
    borderWidth: 1,
    borderRadius: 13,
    marginBottom: 10,
    height: 75,
    color: Colors.blackColor,
  },
  selectEmployee: {
    width: "100%",
    padding: 4,
    borderColor: Colors.borderColor,
    borderWidth: 1,
    borderRadius: 5,
    fontSize: responsiveFontSizeLabel,
  },
  dropdown: {
    backgroundColor: Colors.whiteColor,
    borderColor: Colors.lightGreyColor,
    borderWidth: 1,
    borderRadius: 13,
    // maxHeight: 150,
  },
  dropdownItem: {
    padding: 10,
    // borderBottomColor: Colors.borderColor,
    // borderBottomWidth: 1,
  },
  dateText: {
    padding: 10,
    borderColor: Colors.borderColor,
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 4,
    // textAlign: 'center',
  },
  input: {
    height: 40,
    padding: 10,
    borderColor: Colors.borderColor,
    borderWidth: 1,
    borderRadius: 20,
    fontSize: responsiveFontSizeLabel,
    color: Colors.blackColor,
    backgroundColor: Colors.whiteColor,
    fontFamily: Strings.fontFamilyConstant,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  submitButton: {
    backgroundColor: Colors.leaveBakcgroundColor,
    padding: 10,
    borderRadius: 5,
    width: "30%",
    alignItems: "center",
  },
  closeButton: {
    padding: 10,
    borderRadius: 5,
    width: "30%",
    alignItems: "center",
  },

  checkmark: {
    color: "grey",
  },

  dropDownContainer: {
    width: "100%",
  },
  dropDownButton: {
    borderRadius: 8,
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 10,
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});

export default LeaveScreen;
