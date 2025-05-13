import { SafeAreaView } from "react-native-safe-area-context";
import BackgroundWrapper from "../../Background";
import images from "../../constant/image";
import {
  LayoutAnimation,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import CustomText from "../../component/CustomText/customText";
import { Colors } from "../../constant/color";
import LinearGradient from "react-native-linear-gradient";
import { FlatList } from "react-native";
import { useEffect, useState } from "react";
import { request } from "../../api/auth/auth";
import { logError, logInfo } from "../../constant/logger";
import { getItemFromStorage } from "../../utils/asyncStorage";
import { Strings } from "../../constant/string_constant";
import { ScrollViewIndicator } from "@fanchenbao/react-native-scroll-indicator";
import { showToast } from "../../constant/toast";
import { SceneMap, TabBar, TabView } from "react-native-tab-view";
const RequirementsScreens = () => {
  const [requirements, setrequirements] = useState([]);
  const [employeeData, setEmployeeData] = useState([]);
  const [selectedRequirementsData, setselectedRequirementsData] =
    useState(null);
  const [routes] = useState([
    { key: "fulfilledBy", title: "Fulfilled By" },
    { key: "raisedBy", title: "Raised By" },
  ]);
  const renderScene = SceneMap({
    fulfilledBy: () => renderFlatList(requirements),
    raisedBy: () => renderFlatList(requirements),
  });
  const [tabIndex, setTabIndex] = useState(0);
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const [modalVisible, setModalVisible] = useState(false);
  const [subject, setSubject] = useState("");
  const [descriptionData, setDescriptionData] = useState("");
  const [userName, setUserName] = useState("");
  const [customerData, setCustomerData] = useState(null);
  const [projectData, setProjectData] = useState([]);
  const [selectedProject, setselectedProject] = useState(null);
  const [selectedRequirementType, setselectedRequirementType] = useState("");
  const [selectedStatus, setselectedStatus] = useState("");
  const [selectedCustomer, setselectedCustomer] = useState("");
  const [buttonText, setButtonText] = useState("Submit");

  const [statusDropdownVisible, setstatusDropdownVisible] = useState(false);
  const [requirementDropdownVisible, setrequirementDropDownVisible] =
    useState(false);
  const [customerDropdownVisible, setcustomerDropdownVisible] = useState(false);
  const [projectDropdownVisible, setprojectDropdownVisible] = useState(false);
  const status = ["Open", "Working", "Completed"];
  const requirementTypeList = ["External", "Internal"];
  const renderFlatList = (data) => (
    <>
      <View style={styles.tableHeader}>
        <CustomText style={styles.tableHeaderText}>ID</CustomText>
        <CustomText style={styles.tableHeaderText}>Status</CustomText>
        <CustomText style={styles.tableHeaderText}>
          To Be Fulfilled By
        </CustomText>
        <CustomText style={styles.tableHeaderText}>Raised By</CustomText>
      </View>
      <FlatList
        data={data}
        keyExtractor={(item, index) => index.toString()}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <CustomText style={styles.emptyText}>
              {Strings.noRecordAvaliable}
            </CustomText>
          </View>
        )}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            onPress={() => {
              const getProjectName = projectData.find(
                (project) => project.name === item.project
              );
              setButtonText("Update");
              setselectedRequirementsData(item);
              setselectedCustomer(item.customer);
              setselectedProject(getProjectName ?? null);
              setselectedRequirementType(item.requirement_type);
              setselectedStatus(item.status);
              setSubject(item.subject);
              setDescriptionData(item.description);
              setModalVisible(true);
            }}
          >
            <View
              style={[
                styles.leaveTableRow,
                {
                  backgroundColor:
                    index % 2 === 0 ? Colors.tableRowColor : Colors.whiteColor,
                },
              ]}
            >
              <CustomText style={styles.tableCell}>{item.name}</CustomText>
              <CustomText style={styles.tableCell}>{item.status}</CustomText>
              <CustomText style={styles.tableCell}>
                {item.to_be_fulfilled_by || "----"}
              </CustomText>
              <CustomText style={styles.tableCell}>
                {item.raised_by || "----"}
              </CustomText>
            </View>
          </TouchableOpacity>
        )}
      />
    </>
  );
  useEffect(() => {
    const fetchRequirements = async (employeeName) => {
      try {
        const storedUserName = await getItemFromStorage(Strings.userName);
        setUserName(storedUserName);
        const requireMentData = await request(
          "GET",
          `/api/resource/Requirements?filters=[["Requirements","to_be_fulfilled_by","=","${employeeName}"]]&fields=["name","status","raised_by","to_be_fulfilled_by","subject","description","customer","requirement_type","project"]`
        );

        setrequirements(requireMentData.data.data);
      } catch (e) {
        logError("Error is ", e);
      }
    };
    const fetchCustomers = async () => {
      try {
        const getCustomerData = await request("GET", `/api/resource/Customer`);
        setCustomerData(getCustomerData.data.data);
      } catch (e) {
        logError("Error is ", e);
      }
    };
    const fetchEmployee = async () => {
      try {
        const Employee = await request(
          "GET",
          `/api/resource/Employee/?fields=["name","employee_name","owner","status","leave_approver","company"]`
        );
        const json = Employee.data;
        setEmployeeData(json.data);
        fetchRequirements(json.data[0].name);
      } catch (e) {
        logError("Error is ", e);
      }
    };
    const fetchProjects = async () => {
      try {
        const getProjectData = await request(
          "GET",
          `/api/resource/Project?fields=["project_name","name"]`
        );
        setProjectData(getProjectData.data.data);
      } catch (e) {
        logError("Error is ", e);
      }
    };
    fetchEmployee();
    fetchCustomers();
    fetchProjects();
  }, [isFocused]);
  const handleFormSubmit = async () => {
    const formData = {
      subject: subject,
      raised_by: userName,
      status: selectedStatus,
      requirement_type: selectedRequirementType,
      customer: selectedCustomer,
      project: selectedProject?.name ?? "",
      description: descriptionData,
    };
    const errors = validateFormData(formData);

    if (errors.length > 0) {
      showToast(errors.join("\n"));
      return;
    }
    try {
      if (buttonText == "Submit") {
        await request(
          "POST",
          `/api/resource/Requirements`,
          JSON.stringify(formData)
        );
      } else {
        await request(
          "PUT",
          `/api/resource/Requirements/${selectedRequirementsData.name}`,
          JSON.stringify(formData)
        );
      }
      const requireMentData = await request(
        "GET",
        `/api/resource/Requirements?filters=[["Requirements","owner", "=", "${userName}"]]&fields=["name","status","raised_by","to_be_fulfilled_by","subject","description","customer","requirement_type","project"]`
      );
      setrequirements(requireMentData.data.data);
      resetForm();
      setModalVisible(false);
    } catch (e) {
      logError("Data not submit", e);
      showToast(e);
    }
  };
  const validateFormData = (formData) => {
    const errors = [];
    if (!formData.subject || formData.subject.trim() === "") {
      errors.push("Subject is required.");
    }
    if (!formData.status || formData.status.trim() === "") {
      errors.push("Status is required.");
    }
    if (!formData.requirement_type || formData.requirement_type.trim() === "") {
      errors.push("Requirement Type is required.");
    }
    if (!formData.customer || formData.customer.trim() === "") {
      errors.push("Customer is required.");
    }
    if (!formData.project || formData.project.trim() === "") {
      errors.push("Project is required.");
    }
    if (!formData.description || formData.description.trim() === "") {
      errors.push("Description is required.");
    }
    return errors;
  };
  const resetForm = () => {
    setselectedRequirementsData(null);
    setselectedCustomer(null);
    setselectedProject(null);
    setselectedRequirementType(null);
    setselectedStatus(null);
    setSubject(null);
    setDescriptionData(null);
  };
  const handleIndexChange = async (newIndex) => {
    setTabIndex(newIndex);
    if (newIndex === 0) {
      const requireMentData = await request(
        "GET",
        `/api/resource/Requirements?filters=[["Requirements","to_be_fulfilled_by","=","${employeeData[0].name}"]]&fields=["name","status","raised_by","to_be_fulfilled_by","subject","description","customer","requirement_type","project"]`
      );
      setrequirements(requireMentData.data.data);
    } else {
      const requireMentData = await request(
        "GET",
        `/api/resource/Requirements?filters=[["Requirements","raised_by","=","${userName}"]]&fields=["name","status","raised_by","to_be_fulfilled_by","subject","description","customer","requirement_type","project"]`
      );
      setrequirements(requireMentData.data.data);
    }
  };
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
          <CustomText style={styles.headerText}>Requirements</CustomText>
        </View>
        {tabIndex === 1 && (
          <View
            style={{
              flexDirection: "row",
              justifyContent: "flex-end",
              paddingRight: 20,
            }}
          >
            <TouchableOpacity
              onPress={() => {
                setModalVisible(true);
                setButtonText("Submit");
              }}
            >
              <LinearGradient
                colors={[Colors.orangeColor, Colors.redColor]}
                style={styles.applyRequirementButton}
              >
                <CustomText style={styles.addButtonText}>
                  Add Requirement
                </CustomText>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        <TabView
          navigationState={{ index: tabIndex, routes }}
          renderScene={renderScene}
          onIndexChange={handleIndexChange}
          renderTabBar={(props) => (
            <TabBar
              {...props}
              style={styles.tabBarStyle}
              activeColor={Colors.orangeColor}
              inactiveColor="black"
              tabStyle={{
                borderColor: "lightgray",
                borderBottomWidth: 1,
              }}
              indicatorStyle={{
                backgroundColor: Colors.orangeColor,
                height: 6,
              }}
            />
          )}
        />

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
                <View style={styles.crossButton}>
                  <TouchableOpacity
                    onPress={() => {
                      resetForm();
                      setModalVisible(false);
                    }}
                    style={styles.button}
                  >
                    <View>
                      <Icon name="close" size={20} color={Colors.orangeColor} />
                    </View>
                  </TouchableOpacity>
                </View>
                <CustomText style={styles.modalLabel}>Subject</CustomText>
                <TextInput
                  placeholderTextColor={Colors.lightGreyColor}
                  placeholder="Enter Subject"
                  style={styles.description}
                  selectionColor={Colors.orangeColor}
                  value={subject}
                  editable={tabIndex == 0 ? false : true}
                  onChangeText={(text) => setSubject(text)}
                  multiline={true}
                />
                <CustomText style={styles.modalLabel}>Raised By</CustomText>
                <TextInput
                  placeholderTextColor={Colors.lightGreyColor}
                  placeholder="Raised By"
                  style={styles.input}
                  editable={false}
                  selectionColor={Colors.orangeColor}
                  value={userName}
                  onChangeText={(text) => setSubject(text)}
                />
                <CustomText style={[styles.modalLabel, { marginTop: 10 }]}>
                  Status
                </CustomText>
                <TouchableOpacity
                  onPress={() => {
                    if (tabIndex === 1) {
                      LayoutAnimation.configureNext(
                        LayoutAnimation.Presets.easeInEaseOut
                      );
                      setstatusDropdownVisible(!statusDropdownVisible);
                    }
                  }}
                  style={styles.fullWidthInput}
                >
                  <TextInput
                    placeholderTextColor={Colors.lightGreyColor}
                    style={styles.input}
                    value={selectedStatus}
                    pointerEvents="none"
                    placeholder="Select a status"
                    editable={false}
                  />
                </TouchableOpacity>
                {statusDropdownVisible && (
                  <View style={styles.dropdown}>
                    {status.map((statusName, index) => (
                      <TouchableOpacity
                        key={index}
                        onPress={() => {
                          setselectedStatus(statusName);
                          setstatusDropdownVisible(!statusDropdownVisible);
                        }}
                        style={styles.dropdownItem}
                      >
                        <CustomText style={styles.modalLabel}>
                          {statusName}
                        </CustomText>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                <CustomText style={[styles.modalLabel, { marginTop: 10 }]}>
                  Requirement Type
                </CustomText>
                <TouchableOpacity
                  onPress={() => {
                    if (tabIndex === 1) {
                      LayoutAnimation.configureNext(
                        LayoutAnimation.Presets.easeInEaseOut
                      );
                      setrequirementDropDownVisible(
                        !requirementDropdownVisible
                      );
                    }
                  }}
                  style={styles.fullWidthInput}
                >
                  <TextInput
                    placeholderTextColor={Colors.lightGreyColor}
                    style={styles.input}
                    value={selectedRequirementType}
                    pointerEvents="none"
                    placeholder="Select a requirement type"
                    editable={false}
                  />
                </TouchableOpacity>
                {requirementDropdownVisible && (
                  <View style={styles.dropdown}>
                    {requirementTypeList.map((requirementType, index) => (
                      <TouchableOpacity
                        key={index}
                        onPress={() => {
                          setselectedRequirementType(requirementType);
                          setrequirementDropDownVisible(
                            !requirementDropdownVisible
                          );
                        }}
                        style={styles.dropdownItem}
                      >
                        <CustomText style={styles.modalLabel}>
                          {requirementType}
                        </CustomText>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                <CustomText style={[styles.modalLabel, { marginTop: 10 }]}>
                  Customer
                </CustomText>
                <TouchableOpacity
                  onPress={() => {
                    if (tabIndex === 1) {
                      LayoutAnimation.configureNext(
                        LayoutAnimation.Presets.easeInEaseOut
                      );
                      setcustomerDropdownVisible(!customerDropdownVisible);
                    }
                  }}
                  style={styles.fullWidthInput}
                >
                  <TextInput
                    placeholderTextColor={Colors.lightGreyColor}
                    style={styles.input}
                    value={selectedCustomer}
                    pointerEvents="none"
                    placeholder="Select a customer"
                    editable={false}
                  />
                </TouchableOpacity>
                {customerDropdownVisible && (
                  <View style={styles.dropdown}>
                    <ScrollView nestedScrollEnabled={true}>
                      {customerData.map((customer, index) => (
                        <TouchableOpacity
                          key={index}
                          onPress={() => {
                            setselectedCustomer(customer.name);
                            setcustomerDropdownVisible(
                              !customerDropdownVisible
                            );
                          }}
                          style={styles.dropdownItem}
                        >
                          <CustomText style={styles.modalLabel}>
                            {customer.name}
                          </CustomText>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
                <CustomText style={[styles.modalLabel, { marginTop: 10 }]}>
                  Project
                </CustomText>
                <TouchableOpacity
                  onPress={() => {
                    if (tabIndex === 1) {
                      LayoutAnimation.configureNext(
                        LayoutAnimation.Presets.easeInEaseOut
                      );
                      setprojectDropdownVisible(!projectDropdownVisible);
                    }
                  }}
                  style={styles.fullWidthInput}
                >
                  <TextInput
                    placeholderTextColor={Colors.lightGreyColor}
                    style={styles.input}
                    value={selectedProject?.project_name ?? ""}
                    pointerEvents="none"
                    placeholder="Select a project"
                    editable={false}
                  />
                </TouchableOpacity>
                {projectDropdownVisible && (
                  <View style={styles.dropdown}>
                    <ScrollView nestedScrollEnabled={true}>
                      {projectData.map((project, index) => (
                        <TouchableOpacity
                          key={index}
                          onPress={() => {
                            setselectedProject(project);
                            setprojectDropdownVisible(!projectDropdownVisible);
                          }}
                          style={styles.dropdownItem}
                        >
                          <CustomText style={styles.modalLabel}>
                            {project.project_name}
                          </CustomText>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
                <CustomText style={[styles.modalLabel, { marginTop: 10 }]}>
                  Description
                </CustomText>
                <TextInput
                  placeholderTextColor={Colors.lightGreyColor}
                  placeholder="Enter Description"
                  style={styles.description}
                  selectionColor={Colors.orangeColor}
                  value={descriptionData}
                  editable={tabIndex == 0 ? false : true}
                  onChangeText={(text) => setDescriptionData(text)}
                  multiline={true}
                />
                {tabIndex == 1 && (
                  <TouchableOpacity onPress={handleFormSubmit}>
                    <LinearGradient
                      colors={[Colors.orangeColor, Colors.redColor]}
                      style={[styles.addButton, { marginTop: 20 }]}
                    >
                      <CustomText style={styles.addButtonText}>
                        {buttonText}
                      </CustomText>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </ScrollViewIndicator>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </BackgroundWrapper>
  );
};
const styles = StyleSheet.create({
  tabBarStyle: {
    backgroundColor: "transparent",
    fontSize: 30,
  },
  dropdown: {
    backgroundColor: Colors.whiteColor,
    borderColor: Colors.lightGreyColor,
    borderWidth: 1,
    borderRadius: 13,
    maxHeight: 150,
  },
  dropdownItem: {
    padding: 10,
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
  tableCell: {
    flex: 1,
    paddingTop: 5,
    fontSize: 13,
    fontWeight: 500,
    textAlign: "center",
    color: Colors.darkGreyColor,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  emptyText: {
    fontSize: 18,
    color: "black",
  },
  tableHeader: {
    flexDirection: "row",
    padding: 20,
    marginBottom: 8,
    backgroundColor: Colors.whiteColor,
    borderRadius: 24,
    margin: 10,
    shadowColor: Colors.blackColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 10,
  },
  leaveTableRow: {
    flexDirection: "row",
    shadowColor: "black",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    borderRadius: 24,
    padding: 7,
    marginLeft: 15,
    marginTop: 4,
    marginBottom: 4,
    marginRight: 15,
    backgroundColor: Colors.whiteColor,
  },
  tableHeaderText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
    color: Colors.blackColor,
  },
  input: {
    height: 40,
    padding: 10,
    borderColor: Colors.borderColor,
    borderWidth: 1,
    borderRadius: 20,
    fontSize: 13,
    color: Colors.blackColor,
    backgroundColor: Colors.whiteColor,
    fontFamily: Strings.fontFamilyConstant,
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
  attendanceView: {
    flexDirection: "row",
  },
  addButton: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 10,
  },
  addButtonText: {
    color: Colors.whiteColor,
    fontWeight: 600,
    fontSize: 16,
    textAlign: "center",
  },
  applyRequirementButton: {
    borderRadius: 24,
    height: 42,
    paddingHorizontal: 21,
    paddingVertical: 10,
    // marginRight: 15,
    marginBottom: 15,
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
  modalLabel: {
    color: Colors.blackColor,
    fontSize: 13,
    fontWeight: "500",
    padding: 5,
  },
});
export default RequirementsScreens;
