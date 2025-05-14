import React, { useState, useEffect } from "react";
import {
  View,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  StyleSheet,
  ScrollView,
  Dimensions,
  LayoutAnimation,
} from "react-native";
import TopBar from "../../component/TopBar/TopBar";
import { fetchExpenseClaim } from "../../api/fetchExpenseClaim/fetchExpenseClaim";
import DateTimePicker from "@react-native-community/datetimepicker";
import LinearGradient from "react-native-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { request } from "../../api/auth/auth";
import Icon from "react-native-vector-icons/Ionicons";
import { logError, logInfo } from "../../constant/logger";
import Loader from "../../component/loader/appLoader";
import { Colors } from "../../constant/color";
import CustomText from "../../component/CustomText/customText";
import { ScrollViewIndicator } from "@fanchenbao/react-native-scroll-indicator";
import BackgroundWrapper from "../../Background";
import images from "../../constant/image";
import { Strings } from "../../constant/string_constant";
import { getItemFromStorage } from "../../utils/asyncStorage";
import { showToast } from "../../constant/toast";
import { useIsFocused } from "@react-navigation/native";
const { width, height } = Dimensions.get("window");
const baseWidth = 375; // Example base width (for design reference)
const desiredFontSize = 20;
const responsiveFontSize = desiredFontSize * (width / baseWidth);

const desiredFontSizeLabel = 12;
const responsiveFontSizeLabel = desiredFontSizeLabel * (width / baseWidth);

const ExpensesScreen = () => {
  const isFocused = useIsFocused();
  const [expenseClaim, setExpenseClaim] = useState([]);
  const [expenseType, setExpenseType] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userName, setUserName] = useState("");
  const [userDetails, setUserDetails] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [dropdownExpenseVisible, setDropdownExpenseVisible] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [description, setDescription] = useState("");
  const [selectedExpenseType, setSelectedExpenseType] = useState(
    expenseType.length > 0 ? expenseType[0].name : ""
  );
  const [amount, setAmount] = useState("");
  const [expenses, setExpenses] = useState([]);
  const [fromDate, setFromDate] = useState(new Date());
  const [showFromDatePicker, setShowFromDatePicker] = useState(false);
  const [errors, setFormErrors] = useState(false);
  const [project, setProject] = useState([]);
  useEffect(() => {
    if (expenseType.length > 0 && selectedExpenseType === "") {
      setSelectedExpenseType(expenseType[0].name);
    }
  }, [expenseType]);
  useEffect(() => {
    const fetchUserName = async () => {
      const storedUserName = await getItemFromStorage(Strings.userName);
      if (storedUserName) {
        setUserName(storedUserName);
        fetchUserDetails(storedUserName);
        fetchExpenseClaimData(storedUserName);
      }
    };

    const fetchEmployees = async () => {
      try {
        const storedUserName = await getItemFromStorage(Strings.userName);
        const response = await request(
          "GET",
          `/api/resource/Employee?fields=["employee_name","employee" ,"status","expense_approver","company"]&filters=[["user_id", "=", "${storedUserName}"]]`
        );
        const json = response.data;
        setEmployees(json.data);
      } catch (error) {
        logError("Error fetching employees:", error);
      }
    };

    const fetchExpenseClaimData = async (userName) => {
      try {
        const data = await fetchExpenseClaim(userName);
        if (data?.data === null) {
          setExpenseClaim([]);
        } else {
          setExpenseClaim(data?.data ?? []);
        }
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
        setError(error.message);
      }
    };

    const fetchExpenseClaimType = async () => {
      try {
        const response = await request(
          "GET",
          `/api/resource/Expense Claim Type`
        );
        // await axios.get(
        //   `${BASE_URL}/api/resource/Expense Claim Type`
        // );
        setExpenseType(response.data.data);
      } catch (error) {
        setError(error.message);
      }
    };
    const fetchProject = async () => {
      try {
        const response = await request(
          "GET",
          `/api/resource/Project?fields=["project_name","name"]`
        );
        setProject(response.data.data);
      } catch (error) {
        setError(error.message);
        logError("project fetch failed", error.message);
      }
    };
    fetchUserName();
    fetchEmployees();
    fetchExpenseClaimType();
    fetchProject();
  }, [isFocused]);

  const handleSelectEmployee = (projectData) => {
    setInputValue(projectData.project_name);
    setSelectedProject(projectData);
    setDropdownVisible(false);
  };

  const formatDate = (date) => {
    return date.toISOString().split("T")[0];
  };

  const addExpense = () => {
    setFormErrors({});
    const errors = {};
    if (!selectedProject) errors.project = "Please select a project";
    if (!selectedExpenseType) errors.expenseType = "Expense type is required.";
    if (!description) errors.description = "Description is required.";
    if (!amount) errors.amount = "Amount is required.";
    if (isNaN(amount)) errors.amount = "Amount must be a number.";
    if (!fromDate) errors.fromDate = " Select date";
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      showToast(Object.values(errors).join("\n"));
      return;
    }

    setExpenses([
      ...expenses,
      {
        expense_type: selectedExpenseType,
        description,
        amount,
        expense_date: formatDate(fromDate),
      },
    ]);

    setSelectedExpenseType("");
    setDescription("");
    setAmount("");
  };

  const handleDateChange = (event, selectedDate, setDate, setShowPicker) => {
    setShowPicker(Platform.OS === "ios");
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const resetForm = () => {
    setInputValue(null);
    setSelectedProject(null);
    setDescription("");
    setSelectedExpenseType("");
    setAmount("");
    setExpenses([]);
  };

  const handleFormSubmit = async () => {
    const formData = {
      employee: employees[0]?.employee,
      expense_approver: employees[0]?.expense_approver,
      company: employees[0]?.company,
      currency: "INR",
      expenses: expenses,
      project: selectedProject?.name,
    };

    if (expenses.length == 0) {
      showToast(Object.values(errors).join("\n"));
      return;
    }
    try {
      const response = await request(
        "POST",
        `/api/resource/Expense Claim`,
        JSON.stringify(formData)
      );

      if (response.statusCode == 200) {
        alert("Form submitted successfully!");
        const storedUserName = await getItemFromStorage(Strings.userName);
        if (storedUserName) {
          try {
            const data = await fetchExpenseClaim(storedUserName);
            setExpenseClaim(data.data);
          } catch (error) {
            setError(error.message);
          } finally {
            setLoading(false);
          }
        }
        setModalVisible(false);
        resetForm();
      } else {
        resetForm();
        setModalVisible(false);
        logError(`Error: Received status code ${response.status}`);
        throw new Error(`Request failed with status code ${response.status}`);
      }
    } catch (error) {
      resetForm();
      if (error.response) {
        logError(`Error submitting form: [AxiosError: ${error.message}]`);
        if (error.response.status === 417) {
          logError(
            "Expectation failed (417): Something went wrong with the request.",
            ""
          );
        } else {
          logError(`Request failed with status code: ${error.response.status}`);
        }
      } else if (error.request) {
        logError("Error submitting form: No response received.", error.request);
      } else {
        logError("Error submitting form:", error.message);
      }
      // alert(`Error: ${error.message}`);
      setModalVisible(false);
      throw error;
    }
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    resetForm();
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
            <CustomText style={styles.headerText}>Expenses Claim</CustomText>
            <TouchableOpacity
              style={[
                styles.addButton,
                {
                  borderColor: Colors.blackColor,
                  borderWidth: 1.5,
                },
              ]}
              onPress={() => setModalVisible(true)}
            >
              <CustomText
                style={[
                  styles.addButtonText,
                  { color: Colors.blackColor, paddingHorizontal: 15 },
                ]}
              >
                Add Expense Claim
              </CustomText>
            </TouchableOpacity>
          </View>

          <View style={styles.tableHeader}>
            <CustomText style={styles.tableHeaderText}>Name</CustomText>
            <CustomText style={styles.tableHeaderText}>Status</CustomText>
            <CustomText style={styles.tableHeaderText}>Claim Amt</CustomText>
            <CustomText style={styles.tableHeaderText}>
              Sactioned Amt
            </CustomText>
          </View>
          {expenseClaim.length > 0 ? (
            <FlatList
              data={expenseClaim}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item, index }) => (
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
                  <CustomText style={styles.tableCell}>{item.name}</CustomText>
                  <CustomText style={styles.tableCell}>
                    {item.approval_status}
                  </CustomText>
                  <CustomText style={styles.tableCell}>
                    {item.total_claimed_amount || "0.0"}
                  </CustomText>
                  <CustomText style={styles.tableCell}>
                    {item.total_sanctioned_amount || "0.0"}
                  </CustomText>
                </View>
              )}
            />
          ) : (
            <CustomText style={styles.noDataText}>
              {Strings.noDataAvailable}
            </CustomText>
          )}

          <Modal
            animationType="slide"
            visible={modalVisible}
            onRequestClose={handleCloseModal}
            transparent={true}
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
                  <View style={styles.crossButton}>
                    <TouchableOpacity
                      onPress={() => {
                        resetForm();
                        setModalVisible(false);
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

                  <CustomText style={styles.modalLabel}>
                    Expense Approver
                  </CustomText>
                  <TextInput
                    value={employees[0]?.expense_approver || ""}
                    placeholder="Expense Approver"
                    style={styles.input}
                    editable={false}
                    pointerEvents="none"
                  />

                  <CustomText style={styles.modalLabel}>Company</CustomText>

                  <TextInput
                    value={employees[0]?.company || ""}
                    placeholder="Company"
                    style={styles.input}
                    editable={false}
                    pointerEvents="none"
                  />

                  <CustomText style={styles.modalLabel}>
                    Expense Type
                  </CustomText>
                  <TouchableOpacity
                    style={styles.fullWidthInput}
                    onPress={() => {
                      LayoutAnimation.configureNext(
                        LayoutAnimation.Presets.easeInEaseOut
                      );
                      setDropdownExpenseVisible(!dropdownExpenseVisible);
                    }}
                  >
                    <TextInput
                      pointerEvents="none"
                      value={selectedExpenseType}
                      placeholderTextColor={Colors.lightGreyColor}
                      placeholder="Select an Expense Type"
                      editable={false}
                      style={styles.input}
                    />
                  </TouchableOpacity>
                  {dropdownExpenseVisible && (
                    <View style={styles.dropdown}>
                      <ScrollView nestedScrollEnabled={true}>
                        {expenseType.map((type, index) => (
                          <TouchableOpacity
                            key={index}
                            style={styles.dropdownItem}
                            onPress={() => {
                              setSelectedExpenseType(type.name);
                              setDropdownExpenseVisible(
                                !dropdownExpenseVisible
                              );
                            }}
                          >
                            <CustomText style={styles.modalLabel}>
                              {type.name}
                            </CustomText>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}

                  <CustomText style={styles.modalLabel}>Description</CustomText>

                  <TextInput
                    value={description}
                    selectionColor={Colors.orangeColor}
                    onChangeText={setDescription}
                    placeholderTextColor={Colors.lightGreyColor}
                    placeholder="Description"
                    style={styles.description}
                  />
                  <CustomText style={styles.modalLabel}>Project</CustomText>
                  <TouchableOpacity
                    style={styles.fullWidthInput}
                    onPress={() => {
                      LayoutAnimation.configureNext(
                        LayoutAnimation.Presets.easeInEaseOut
                      );
                      setDropdownVisible(!dropdownVisible);
                    }}
                  >
                    <TextInput
                      pointerEvents="none"
                      value={inputValue}
                      placeholderTextColor={Colors.lightGreyColor}
                      placeholder="Select an project"
                      editable={false}
                      style={styles.input}
                    />
                  </TouchableOpacity>
                  {dropdownVisible && (
                    <View style={styles.dropdown}>
                      <ScrollView nestedScrollEnabled={true}>
                        {project.map((projectData, index) => (
                          <TouchableOpacity
                            key={index}
                            style={styles.dropdownItem}
                            onPress={() => handleSelectEmployee(projectData)}
                          >
                            <CustomText style={styles.modalLabel}>
                              {projectData.project_name}
                            </CustomText>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                  <CustomText style={styles.modalLabel}>
                    Claim Amount
                  </CustomText>

                  <TextInput
                    value={amount}
                    placeholderTextColor={Colors.lightGreyColor}
                    onChangeText={setAmount}
                    placeholder="Amount"
                    keyboardType="numeric"
                    style={styles.input}
                  />

                  <CustomText style={styles.modalLabel}>
                    Expense Date:
                  </CustomText>
                  <View>
                    <TouchableOpacity
                      onPress={() => setShowFromDatePicker(true)}
                    >
                      <CustomText style={styles.input}>
                        {fromDate.toISOString().split("T")[0]}
                      </CustomText>
                    </TouchableOpacity>
                    {showFromDatePicker && (
                      <DateTimePicker
                        value={fromDate}
                        mode="date"
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
                  </View>

                  <TouchableOpacity onPress={addExpense}>
                    <LinearGradient
                      colors={[Colors.orangeColor, Colors.redColor]}
                      style={[styles.addButton, { marginTop: 20 }]}
                    >
                      <CustomText style={styles.addButtonText}>
                        Add Expense
                      </CustomText>
                    </LinearGradient>
                  </TouchableOpacity>

                  {/* Display added expenses */}
                  {expenses.length > 0 && (
                    <View>
                      {expenses.map((expense, index) => (
                        <View key={index} style={styles.expenseItem}>
                          <CustomText style={styles.expenseText}>
                            Expense Date: {expense.expense_date}
                          </CustomText>
                          <CustomText style={styles.expenseText}>
                            Expense Claim Type: {expense.expense_type}
                          </CustomText>
                          <CustomText style={styles.expenseText}>
                            Description: {expense.description}
                          </CustomText>
                          <CustomText style={styles.expenseText}>
                            Amount: {expense.amount}
                          </CustomText>
                          <CustomText style={styles.expenseText}>
                            Project: {selectedProject?.project_name ?? "N/A"}
                          </CustomText>
                        </View>
                      ))}
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
  container: {
    flex: 1,
  },

  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginLeft: 20,
    marginRight: 20,
  },
  headerText: {
    fontWeight: Platform.OS == "ios" ? 700 : null,
    fontSize: responsiveFontSize,
    marginBottom: 16,
    textAlign: "left",
    color: Colors.darkGreyColor,
  },
  addButton: {
    borderRadius: 10,
    height: 42,
    marginHorizontal: 10,
    flexWrap: "wrap",
    alignContent: "center",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
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
  crossButton: {
    paddingRight: 10,
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "flex-end",
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: 30,
    borderColor: Colors.orangeColor,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  expenseItem: {
    backgroundColor: Colors.whiteColor,
    padding: 15,
    borderWidth: 1,
    borderColor: Colors.lightGreyColor,
    borderRadius: 24,
    margin: 10,
  },
  expenseText: {
    flex: 1,
    fontSize: responsiveFontSizeLabel,
    textAlign: "left",
    color: Colors.darkGreyColor,
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
    fontSize: 14,
    fontWeight: "500",
    fontFamily: Strings.fontFamilyConstant,
    padding: 5,
  },

  input: {
    borderColor: Colors.lightGreyColor,
    borderWidth: 1,
    borderRadius: 20,
    padding: 10,
    fontFamily: Strings.fontFamilyConstant,
    color: Colors.blackColor,
  },

  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    backgroundColor: "white",
    borderRadius: 24,
    padding: 20,
    width: "90%",
    maxHeight: "80%",
  },
  modalContent: {
    flexGrow: 1,
  },

  dropdownItem: {
    padding: 5,
  },

  fullWidthInput: {
    width: "100%",
    marginBottom: 10,
  },

  description: {
    fontFamily: Strings.fontFamilyConstant,
    paddingLeft: 20,
    borderColor: Colors.lightGreyColor,
    borderWidth: 1,
    borderRadius: 15,
    marginBottom: 10,
    height: 75,
    color: Colors.blackColor,
  },

  dropdown: {
    backgroundColor: Colors.whiteColor,
    borderColor: Colors.lightGreyColor,
    borderWidth: 1,
    borderRadius: 13,
    maxHeight: 150,
  },

  picker: {
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    borderRadius: 5,
  },

  submitButton: {
    backgroundColor: Colors.expenseColor,
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 10,
  },
  submitButtonText: {
    color: Colors.whiteColor,
    fontWeight: "bold",
  },
  closeButton: {
    backgroundColor: Colors.expenseErrorColor,
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
  },
  closeButtonText: {
    color: Colors.whiteColor,
    fontWeight: "bold",
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
  expenseList: {
    marginTop: 20,
  },
  noDataText: {
    fontSize: 18,
    padding: 20,
    textAlign: "center",
    color: Colors.darkGreyColor,
  },
});

export default ExpensesScreen;
