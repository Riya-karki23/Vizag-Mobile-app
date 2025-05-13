import {
  FlatList,
  LayoutAnimation,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import BackgroundWrapper from "../../Background";
import images from "../../constant/image";
import Icon from "react-native-vector-icons/Ionicons";
import CustomText from "../../component/CustomText/customText";
import { Colors } from "../../constant/color";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { logError, logInfo } from "../../constant/logger";
import { request } from "../../api/auth/auth";
import { getItemFromStorage } from "../../utils/asyncStorage";
import { Strings } from "../../constant/string_constant";
import LinearGradient from "react-native-linear-gradient";
import { ScrollViewIndicator } from "@fanchenbao/react-native-scroll-indicator";
import DateTimePicker from "@react-native-community/datetimepicker";
import { showToast } from "../../constant/toast";
const TaskScreen = () => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const [taskData, setTaskData] = useState(null);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [projectDropdownVisible, setprojectDropdownVisible] = useState(false);
  const [statusDropDownVisible, setstatusDropDownVisible] = useState(false);
  const [priorityVisible, setpriorityVisible] = useState(false);
  const [issueDropDownVisible, setissueDropDownVisible] = useState(false);
  const [startDatePicker, setstartDatePicker] = useState(false);
  const [endDatePicker, setendDatePicker] = useState(false);
  const [requirementDropdownVisible, setrequirementDropDownVisible] =
    useState(false);
  const [addTaskDropDownVisible, setaddTaskDropDownVisible] = useState(false);
  const [taskSelectDropDownVisible, setTaskSelectDropDownVisible] =
    useState(false);
  const [taskList, setTaskList] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [checked, setChecked] = useState(false);
  const [value, setValue] = useState(0);
  const [selectStatus, setselectStatus] = useState("");
  const [priorityData, setpriority] = useState("");
  const [issueData, setissueData] = useState("");
  const [selectIssueData, setselectIssueData] = useState("");
  const [selectedRequirementType, setselectedRequirementType] = useState("");
  const [selectedProject, setselectedProject] = useState("");
  const [taskID, setTaskID] = useState("");
  const [progress, setProgress] = useState("");
  const [fromDate, setFromDate] = useState(
    new Date(new Date().setDate(new Date().getDate() + 1))
  );
  const [endDate, setendDate] = useState(
    new Date(new Date().setDate(new Date().getDate() + 1))
  );
  const [subject, setSubject] = useState("");
  const [timeHour, setTimeHour] = useState("");
  const [projectData, setprojectData] = useState(null);
  const [workDoneDetail, setworkDoneDetail] = useState("");
  const [taskDescription, settaskDescription] = useState("");
  const [buttonTitle, setbuttonTitle] = useState("Submit");
  useEffect(() => {
    const fetchTask = async () => {
      try {
        const taskData = await request(
          "GET",
          `/api/resource/Task?fields=["name","status","project","expected_time","exp_start_date","exp_end_date","custom_work_done","description","priority","is_group","subject","issue","type","depends_on"]&limit_start=0&limit_page_length=0`
        );

        const issueApiData = await request("GET", `/api/resource/Issue`);
        const projectResponse = await request(
          "GET",
          `/api/resource/Project?fields=["project_name","name"]`
        );
        setprojectData(projectResponse.data.data);
        setissueData(issueApiData.data.data);
        setTaskData(taskData.data.data);
      } catch (e) {
        logError("Error is", e);
      }
    };
    fetchTask();
  }, [isFocused]);
  const formatDate = (date) => {
    return date.toISOString().split("T")[0]; // Format: YYYY-MM-DD
  };
  const handleFormSubmit = async () => {
    const storedUserName = await getItemFromStorage(Strings.userName);

    const formData = {
      owner: storedUserName,
      subject: subject,
      issue: selectIssueData,
      project: selectedProject,
      type: selectedRequirementType,
      is_group: value,
      progress: progress ?? "0.00",
      status: selectStatus,
      expected_time: timeHour ?? "0.00",
      priority: priorityData,
      exp_start_date: formatDate(fromDate),
      exp_end_date: formatDate(endDate),
      description: taskDescription,
      custom_work_done: workDoneDetail,
      ...(taskList.length > 0 && {
        depends_on: taskList.map((task, index) => ({
          docstatus: 0,
          doctype: "Task Depends On",
          name: `new-task-depends-on-${Math.random().toString(36).substring(2, 15)}`,
          __islocal: 1,
          __unsaved: 1,
          owner: storedUserName,
          parent: taskID,
          parentfield: "depends_on",
          parenttype: "Task",
          idx: index + 1,
          __unedited: false,
          subject: task.subject,
          task: task.name,
        })),
      }),
    };
    const errors = validateFormData(formData);

    if (errors.length > 0) {
      showToast(errors.join("\n"));
      return;
    }
    try {
      if (buttonTitle !== "Update") {
        await request(
          "POST",
          `/api/resource/Task?fields=["name","status","expected_time","project","exp_end_date","exp_start_date","description","type","custom_work_done","issue","priority","is_group","subject"]&limit_start=0&limit_page_length=0`,
          JSON.stringify(formData)
        );
      } else {
        await request(
          "PUT",
          `/api/resource/Task/${taskID}`,
          JSON.stringify(formData)
        );
      }

      const taskData = await request(
        "GET",
        `/api/resource/Task?fields=["name","status","project","expected_time","exp_end_date","exp_start_date","description","type","custom_work_done","priority","is_group","subject","issue"]&limit_start=0&limit_page_length=0`
      );

      alert("Form Submitted Successfully!");
      setDropdownVisible(false);
      setTaskData(taskData.data.data);
      resetForm();
    } catch (e) {
      logError("ERROR While Submitting the form", e);
    }
  };
  const validateFormData = (formData) => {
    logInfo("Validating form data:", formData);
    const errors = [];

    if (!formData.owner) errors.push("Owner is required.");
    if (!formData.subject) errors.push("Subject is required.");
    if (!formData.project) errors.push("Project is required.");
    if (!formData.type) errors.push("Requirement type is required.");
    if (formData.is_group === undefined || formData.is_group === null)
      errors.push("Group status is required.");
    if (!formData.status) errors.push("Status is required.");
    if (!formData.priority) errors.push("Priority is required.");
    if (!formData.exp_start_date)
      errors.push("Expected start date is required.");
    if (!formData.exp_end_date) errors.push("Expected end date is required.");
    if (!formData.description) errors.push("Task description is required.");

    return errors;
  };
  const toggleCheckbox = () => {
    setChecked(!checked);
    const value = !checked ? 1 : 0;
    setValue(value);
  };
  const priorityColors = {
    Low: Colors.presentColor,
    Medium: Colors.orangeColor,
    High: "red",
    Urgent: "red",
  };
  const requirementTypeList = ["External", "Internal"];
  const statusColors = {
    Open: "#4caf50",
    Working: "#ff9800",
    "Pending Review": "#ffeb3b",
    Overdue: "#f44336",
    Template: "#607d8b",
    Completed: "green",
    Cancelled: "#9e9e9e",
  };
  const statuses = [
    "Open",
    "Working",
    "Pending Review",
    "Overdue",
    "Template",
    "Completed",
    "Cancelled",
  ];
  const priority = ["Low", "Medium", "High", "Urgent"];

  const resetForm = () => {
    setTaskID("");
    setTimeHour("");
    setselectStatus("");
    setselectedProject("");
    setChecked(false);
    setselectIssueData("");
    setpriority(null);
    setselectedRequirementType("");
    setSubject("");
    setworkDoneDetail("");
    settaskDescription("");
    setValue(0);
    setTaskList([]);
  };
  const CustomModal = ({
    visible,
    onClose,
    resetForm,
    children,
    indStyle,
    modalStyles,
    buttonStyles,
  }) => {
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={visible}
        onRequestClose={onClose}
      >
        <View style={styles.modalBackground}>
          <View style={[styles.modalView, modalStyles]}>
            <ScrollViewIndicator
              contentContainerStyle={styles.modalContent}
              indicatorStyle="white"
            >
              <View style={styles.crossButton}>
                <TouchableOpacity
                  onPress={() => {
                    if (resetForm) resetForm();
                    onClose();
                  }}
                  style={[styles.button, buttonStyles]}
                >
                  <Icon name="close" size={20} color="orange" />
                </TouchableOpacity>
              </View>
              {children}
            </ScrollViewIndicator>
          </View>
        </View>
      </Modal>
    );
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
          <CustomText style={styles.headerText}>Task</CustomText>
        </View>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "flex-end",
            paddingRight: 20,
          }}
        >
          <TouchableOpacity
            onPress={() => {
              setbuttonTitle("Submit");
              setDropdownVisible(true);
            }}
          >
            <LinearGradient
              colors={[Colors.orangeColor, Colors.redColor]}
              style={styles.applyRequirementButton}
            >
              <CustomText style={styles.addButtonText}>Add Task</CustomText>
            </LinearGradient>
          </TouchableOpacity>
        </View>
        <View style={styles.tableHeader}>
          <CustomText style={styles.tableHeaderText}>Subject</CustomText>
          <CustomText style={styles.tableHeaderText}>Status</CustomText>
          <CustomText style={styles.tableHeaderText}>Project</CustomText>
          <CustomText style={styles.tableHeaderText}>Priority</CustomText>
          <CustomText style={styles.tableHeaderText}>ID</CustomText>
        </View>
        <FlatList
          data={taskData}
          keyExtractor={(item, index) => index.toString()}
          ListEmptyComponent={() => (
            <CustomText style={styles.noDataText}>
              {Strings.noRecordAvaliable}
            </CustomText>
          )}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              onPress={() => {
                setbuttonTitle("Update");
                setTaskID(item.name);
                setselectIssueData(item.issue);
                setSubject(item.subject);
                setselectStatus(item.status);
                setselectedProject(item.project);
                setpriority(item.priority);
                setselectedRequirementType(item.type);
                setworkDoneDetail(item.custom_work_done);
                settaskDescription(item.description);
                const expStartDate = item.exp_start_date
                  ? new Date(item.exp_start_date)
                  : null;
                setFromDate(expStartDate);
                setChecked(1);
                const expEndDate = item.exp_end_date
                  ? new Date(item.exp_end_date)
                  : null;

                setendDate(expEndDate);
                setDropdownVisible(true);
              }}
            >
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
                <CustomText style={styles.tableCell}>{item.subject}</CustomText>
                <CustomText
                  style={[
                    styles.tableCell,
                    {
                      color: statusColors[item.status || "----"],
                      fontWeight: 700,
                      fontSize: 14,
                    },
                  ]}
                >
                  {item.status}
                </CustomText>
                <CustomText style={styles.tableCell}>
                  {item.project || "----"}
                </CustomText>
                <CustomText
                  style={[
                    styles.tableCell,
                    {
                      color: priorityColors[item.priority || "----"],
                      fontWeight: 700,
                      fontSize: 14,
                    },
                  ]}
                >
                  {item.priority || "----"}
                </CustomText>
                <CustomText style={styles.tableCell}>
                  {item.name || "----"}
                </CustomText>
              </View>
            </TouchableOpacity>
          )}
        />
        <Modal
          animationType="slide"
          transparent={true}
          visible={dropdownVisible}
          onRequestClose={() => setDropdownVisible(false)}
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
                      setDropdownVisible(false);
                    }}
                    style={styles.button}
                  >
                    <View>
                      <Icon name="close" size={20} color={Colors.orangeColor} />
                    </View>
                  </TouchableOpacity>
                </View>
                <TextInput
                  placeholderTextColor={Colors.lightGreyColor}
                  style={[styles.input, { marginTop: 10 }]}
                  value={subject}
                  onChangeText={(text) => setSubject(text)}
                  placeholder="Enter a subject"
                />
                <TouchableOpacity
                  onPress={() => {
                    LayoutAnimation.configureNext(
                      LayoutAnimation.Presets.easeInEaseOut
                    );
                    setstatusDropDownVisible(!statusDropDownVisible);
                  }}
                  style={styles.fullWidthInput}
                >
                  <TextInput
                    placeholderTextColor={Colors.lightGreyColor}
                    style={[styles.input, { marginTop: 10 }]}
                    pointerEvents="none"
                    placeholder="Status"
                    editable={false}
                    value={selectStatus}
                  />
                </TouchableOpacity>
                {statusDropDownVisible && (
                  <View style={styles.dropdown}>
                    {statuses.map((statusData, index) => (
                      <TouchableOpacity
                        key={index}
                        onPress={() => {
                          setselectStatus(statusData);
                          setstatusDropDownVisible(!statusDropDownVisible);
                        }}
                        style={styles.dropdownItem}
                      >
                        <CustomText style={styles.modalLabel}>
                          {statusData}
                        </CustomText>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                <TouchableOpacity
                  onPress={() => {
                    LayoutAnimation.configureNext(
                      LayoutAnimation.Presets.easeInEaseOut
                    );
                    setprojectDropdownVisible(!projectDropdownVisible);
                  }}
                  style={styles.fullWidthInput}
                >
                  <TextInput
                    placeholderTextColor={Colors.lightGreyColor}
                    style={[styles.input, { marginTop: 10 }]}
                    pointerEvents="none"
                    placeholder="Project"
                    editable={false}
                    value={selectedProject}
                  />
                </TouchableOpacity>
                {projectDropdownVisible && (
                  <View style={styles.dropdown}>
                    {projectData.map((project, index) => (
                      <TouchableOpacity
                        key={index}
                        onPress={() => {
                          setselectedProject(project.name);
                          setprojectDropdownVisible(!projectDropdownVisible);
                        }}
                        style={styles.dropdownItem}
                      >
                        <CustomText style={styles.modalLabel}>
                          {project.name + " " + project.project_name}
                        </CustomText>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                <TouchableOpacity
                  onPress={() => {
                    LayoutAnimation.configureNext(
                      LayoutAnimation.Presets.easeInEaseOut
                    );
                    setpriorityVisible(!priorityVisible);
                  }}
                  style={styles.fullWidthInput}
                >
                  <TextInput
                    placeholderTextColor={Colors.lightGreyColor}
                    style={[styles.input, { marginTop: 10 }]}
                    pointerEvents="none"
                    placeholder="Priority"
                    editable={false}
                    value={priorityData}
                  />
                </TouchableOpacity>
                {priorityVisible && (
                  <View style={styles.dropdown}>
                    {priority.map((priorityData, index) => (
                      <TouchableOpacity
                        key={index}
                        onPress={() => {
                          setpriority(priorityData);
                          setpriorityVisible(!priorityVisible);
                        }}
                        style={styles.dropdownItem}
                      >
                        <CustomText style={styles.modalLabel}>
                          {priorityData}
                        </CustomText>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                <TouchableOpacity
                  onPress={() => {
                    LayoutAnimation.configureNext(
                      LayoutAnimation.Presets.easeInEaseOut
                    );
                    setissueDropDownVisible(!issueDropDownVisible);
                  }}
                  style={styles.fullWidthInput}
                >
                  <TextInput
                    placeholderTextColor={Colors.lightGreyColor}
                    style={[styles.input, { marginTop: 10 }]}
                    pointerEvents="none"
                    placeholder="Issue"
                    editable={false}
                    value={selectIssueData}
                  />
                </TouchableOpacity>
                {issueDropDownVisible && (
                  <View style={styles.dropdown}>
                    {issueData.map((issue, index) => (
                      <TouchableOpacity
                        key={index}
                        onPress={() => {
                          setselectIssueData(issue.name);
                          setissueDropDownVisible(!issueDropDownVisible);
                        }}
                        style={styles.dropdownItem}
                      >
                        <CustomText style={styles.modalLabel}>
                          {issue.name}
                        </CustomText>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                <TouchableOpacity
                  onPress={() => {
                    LayoutAnimation.configureNext(
                      LayoutAnimation.Presets.easeInEaseOut
                    );
                    setrequirementDropDownVisible(!requirementDropdownVisible);
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
                <TextInput
                  placeholderTextColor={Colors.lightGreyColor}
                  style={[styles.input, { height: 100 }]}
                  multiline={true}
                  placeholder="Work Done details"
                  value={workDoneDetail}
                  onChangeText={(text) => setworkDoneDetail(text)}
                />
                <TextInput
                  placeholderTextColor={Colors.lightGreyColor}
                  style={[styles.input, { height: 100 }]}
                  multiline={true}
                  placeholder="Task Description"
                  value={taskDescription}
                  onChangeText={(text) => settaskDescription(text)}
                />
                <CustomText style={[styles.modalLabel, { paddingTop: 10 }]}>
                  Expected Start Date:
                </CustomText>
                <TouchableOpacity
                  onPress={() => {
                    setstartDatePicker(true);
                  }}
                >
                  <CustomText style={styles.input}>
                    {fromDate.toISOString().split("T")[0]}
                  </CustomText>
                </TouchableOpacity>
                {startDatePicker && (
                  <DateTimePicker
                    value={fromDate}
                    mode="date"
                    display="default"
                    style={{ alignSelf: "flex-start" }}
                    onChange={(event, date) => {
                      setFromDate(date);
                      setstartDatePicker(false);
                    }}
                  />
                )}
                <CustomText style={[styles.modalLabel, { paddingTop: 10 }]}>
                  Expected End Date:
                </CustomText>
                <TouchableOpacity
                  onPress={() => {
                    setendDatePicker(true);
                  }}
                >
                  <CustomText style={styles.input}>
                    {endDate.toISOString().split("T")[0]}
                  </CustomText>
                </TouchableOpacity>
                {endDatePicker && (
                  <DateTimePicker
                    value={endDate}
                    mode="date"
                    display="default"
                    style={{ alignSelf: "flex-start" }}
                    onChange={(event, date) => {
                      setendDate(date);
                      setendDatePicker(false);
                    }}
                  />
                )}
                <TextInput
                  placeholderTextColor={Colors.lightGreyColor}
                  style={[styles.input, { marginTop: 10 }]}
                  value={timeHour}
                  keyboardType="numeric"
                  onChangeText={(text) => setTimeHour(text)}
                  placeholder="Expected Time (in hours)"
                />
                <TextInput
                  placeholderTextColor={Colors.lightGreyColor}
                  style={[styles.input, { marginTop: 10 }]}
                  keyboardType="numeric"
                  placeholder="Progress"
                  value={progress}
                  onChangeText={(text) => setProgress(text)}
                />
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
                  <CustomText style={styles.modalLabel}>Is Group</CustomText>
                </View>
                {taskList.length != 0 && (
                  <>
                    <View
                      style={{
                        flexDirection: "row",
                        padding: 10,
                        marginBottom: 8,
                        borderWidth: 1,
                        backgroundColor: Colors.whiteColor,
                        borderRadius: 10,
                        margin: 20,
                      }}
                    >
                      <CustomText style={styles.tableHeaderText}>
                        Task
                      </CustomText>
                      <CustomText style={styles.tableHeaderText}>
                        Subject
                      </CustomText>
                    </View>
                    <FlatList
                      data={taskList}
                      scrollEnabled={false}
                      keyExtractor={(item, index) => index.toString()}
                      ListEmptyComponent={() => (
                        <CustomText style={styles.noDataText}>
                          {Strings.noRecordAvaliable}
                        </CustomText>
                      )}
                      renderItem={({ item, index }) => (
                        <View
                          style={[styles.leaveTableRow, { borderRadius: 10 }]}
                        >
                          <CustomText style={styles.tableCell}>
                            {item.name}
                          </CustomText>
                          <CustomText style={styles.tableCell}>
                            {item.subject}
                          </CustomText>
                        </View>
                      )}
                    />
                  </>
                )}
                <TouchableOpacity
                  onPress={() => {
                    setaddTaskDropDownVisible(true);
                  }}
                >
                  <LinearGradient
                    colors={[Colors.orangeColor, Colors.redColor]}
                    style={[styles.addButton, { marginTop: 20 }]}
                  >
                    <CustomText style={styles.addButtonText}>
                      Add Dependent Tasks
                    </CustomText>
                  </LinearGradient>
                </TouchableOpacity>
                <CustomModal
                  visible={addTaskDropDownVisible}
                  onClose={() => setaddTaskDropDownVisible(false)}
                  resetForm={() => {
                    setSelectedTask(null);
                  }}
                >
                  <TouchableOpacity
                    onPress={() => {
                      LayoutAnimation.configureNext(
                        LayoutAnimation.Presets.easeInEaseOut
                      );
                      setTaskSelectDropDownVisible(!taskSelectDropDownVisible);
                    }}
                    style={styles.fullWidthInput}
                  >
                    <TextInput
                      placeholderTextColor={Colors.lightGreyColor}
                      style={styles.input}
                      value={selectedTask?.name || ""}
                      pointerEvents="none"
                      placeholder="Select a task"
                      editable={false}
                    />
                  </TouchableOpacity>
                  {taskSelectDropDownVisible && (
                    <View style={[styles.dropdown, { maxHeight: 250 }]}>
                      <ScrollView>
                        {taskData.map((taskData, index) => (
                          <TouchableOpacity
                            key={index}
                            onPress={() => {
                              setSelectedTask(taskData);
                              setTaskSelectDropDownVisible(
                                !taskSelectDropDownVisible
                              );
                            }}
                            style={styles.dropdownItem}
                          >
                            <CustomText style={styles.modalLabel}>
                              {taskData.name}
                            </CustomText>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                  <TextInput
                    placeholderTextColor={Colors.lightGreyColor}
                    style={styles.input}
                    value={selectedTask?.subject || ""}
                    pointerEvents="none"
                    placeholder="Subject"
                    editable={false}
                  />
                  <TouchableOpacity
                    onPress={() => {
                      if (selectedTask != null) {
                        setTaskList((prevTasks) => [
                          ...prevTasks,
                          selectedTask,
                        ]);
                        setSelectedTask(null);
                      }
                    }}
                  >
                    <LinearGradient
                      colors={[Colors.orangeColor, Colors.redColor]}
                      style={[styles.addButton, { marginTop: 10 }]}
                    >
                      <CustomText style={styles.addButtonText}>Add</CustomText>
                    </LinearGradient>
                  </TouchableOpacity>
                </CustomModal>
                <TouchableOpacity onPress={handleFormSubmit}>
                  <LinearGradient
                    colors={[Colors.orangeColor, Colors.redColor]}
                    style={[styles.addButton, { marginTop: 10 }]}
                  >
                    <CustomText style={styles.addButtonText}>
                      {buttonTitle}
                    </CustomText>
                  </LinearGradient>
                </TouchableOpacity>
              </ScrollViewIndicator>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </BackgroundWrapper>
  );
};
const styles = StyleSheet.create({
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    margin: 5,
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
  input: {
    height: 40,
    padding: 10,
    marginTop: 10,
    borderColor: Colors.borderColor,
    borderWidth: 1,
    borderRadius: 20,
    fontSize: 14,
    color: Colors.blackColor,
    backgroundColor: Colors.whiteColor,
    fontFamily: Strings.fontFamilyConstant,
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
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalLabel: {
    color: Colors.blackColor,
    fontSize: 14,
    fontWeight: "500",
    padding: 5,
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
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,

    // Shadow for Android
    elevation: 4,
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
    marginBottom: 10,
  },
  attendanceView: {
    flexDirection: "row",
  },
  addButton: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 10,
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
  tableHeaderText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
    color: Colors.blackColor,
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
  tableCell: {
    flex: 1,
    padding: 3,
    fontSize: 13,
    fontWeight: 500,
    textAlign: "center",
    color: Colors.darkGreyColor,
  },
  noDataText: {
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    textAlign: "center",
    marginTop: 20,
    fontSize: 14,
  },
});
export default TaskScreen;
