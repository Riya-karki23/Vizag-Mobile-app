import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BackgroundWrapper from "../../Background";
import images from "../../constant/image";
import Icon from "react-native-vector-icons/Ionicons";
import { Colors } from "../../constant/color";
import { useState } from "react";
import DateTimePicker from "@react-native-community/datetimepicker";
import LinearGradient from "react-native-linear-gradient";
import { useEffect } from "react";
import CustomText from "../../component/CustomText/customText";
import { FlatList } from "react-native";

const AttendanceFilter = ({ navigation, route }) => {
  const { from_date, selected_log_type } = route.params;
  const [fromDate, setFromDate] = useState(null);
  const [showFromDatePicker, setShowFromDatePicker] = useState(false);
  const [selectedLogType, setSelectedLogType] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const logTypes = ["", "IN", "OUT"];

  useEffect(() => {
    if (from_date) {
      setFromDate(new Date(from_date));
    }
    if (selected_log_type) {
      setSelectedLogType(selected_log_type);
    }
  }, [from_date, selected_log_type]);

  const handleDateChange = async (event, selectedDate) => {
    setShowFromDatePicker(false);
    if (event.type === "dismissed") {
      return;
    }

    if (event.type === "set" && selectedDate) {
      setFromDate(selectedDate);
    }
  };

  const handleSelectLogType = async (logType) => {
    setSelectedLogType(logType);
    console.log("selectedLogType>>>", selectedLogType);

    setShowDropdown(false);
  };

  const LogtypeItem = ({ item }) => {
    const isSelected = selectedLogType === item;

    return (
      <Pressable
        style={({ pressed }) => [
          styles.dropdownItem,
          pressed && styles.dropdownItemPressed,
          isSelected && styles.dropdownItemSelected,
        ]}
        onPress={() => handleSelectLogType(item)}
      >
        <View style={styles.dropdownItemContent}>
          {isSelected ? (
            <Icon
              name="checkmark"
              size={16}
              color="#007aff"
              style={styles.icon}
            />
          ) : item.trim() === "IN" ? (
            <Icon
              name="log-in-outline"
              size={16}
              color="#888"
              style={styles.icon}
            />
          ) : item.trim() === "OUT" ? (
            <Icon
              name="log-out-outline"
              size={16}
              color="#888"
              style={styles.icon}
            />
          ) : null}

          <CustomText
            style={[styles.dropdownText, isSelected && styles.selectedText]}
          >
            {item.trim() !== "" ? item : " "}
          </CustomText>
        </View>
      </Pressable>
    );
  };

  return (
    <BackgroundWrapper imageSource={images.mainBackground}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Icon name="chevron-back" size={24} color={Colors.orangeColor} />
          </TouchableOpacity>
          <CustomText style={styles.title}>Attendance Filter</CustomText>
        </View>

        <View style={styles.container}>
          <View style={styles.SelectedDateStyle}>
            <TouchableOpacity
              onPress={() => {
                setShowFromDatePicker(true);
              }}
            >
              <CustomText style={styles.InputText}>
                {fromDate
                  ? fromDate.toISOString().split("T")[0]
                  : "Select Date"}
              </CustomText>
            </TouchableOpacity>
          </View>
          {showFromDatePicker && (
            <DateTimePicker
              value={fromDate || new Date()}
              mode="date"
              display="default"
              style={{ alignSelf: "flex-start" }}
              onChange={handleDateChange}
            />
          )}

          <View style={styles.SelectLogType}>
            <TouchableOpacity onPress={() => setShowDropdown(!showDropdown)}>
              <CustomText style={styles.InputText}>
                {selectedLogType && selectedLogType.trim() !== ""
                  ? selectedLogType
                  : "Select Log Type"}
              </CustomText>
            </TouchableOpacity>
          </View>

          {showDropdown && (
            <View style={styles.dropdown}>
              <FlatList
                data={logTypes}
                keyExtractor={(item) => item}
                renderItem={LogtypeItem}
              />
            </View>
          )}
        </View>
        <View style={styles.filterButtonContainer}>
          <LinearGradient
            colors={[Colors.orangeColor, Colors.redColor]}
            style={styles.filterButton}
          >
            <TouchableOpacity
              onPress={() => {
                navigation.navigate("Main", {
                  screen: "Attendance",
                  params: {
                    fromDate: fromDate
                      ? fromDate.toISOString().split("T")[0]
                      : null,
                    selectedLogType:
                      selectedLogType.trim() !== "" ? selectedLogType : null,
                  },
                });
              }}
            >
              <CustomText style={styles.filterButtonText}>
                Apply Filter
              </CustomText>
            </TouchableOpacity>
          </LinearGradient>

          <LinearGradient
            colors={[Colors.orangeColor, Colors.redColor]}
            style={styles.filterButton}
          >
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("Main", {
                  screen: "Attendance",
                  params: {
                    fromDate: null,
                    selectedLogType: null,
                  },
                })
              }
            >
              <CustomText style={styles.filterButtonText}>
                Clear Filter
              </CustomText>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </SafeAreaView>
    </BackgroundWrapper>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  backButton: {
    marginRight: 12,
  },
  title: {
    fontSize: 20,
    // fontWeight: "bold",
    color: "#000",
  },
  container: {
    flex: 1,
    padding: 16,
  },

  dropdown: {
    backgroundColor: Colors.whiteColor,
    borderRadius: 5,
    width: "100%",
    elevation: 10,
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    paddingVertical: 4,
  },
  dropdownItem: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  dropdownItemPressed: {
    backgroundColor: "#f0f0f0",
    borderRadius: 5,
  },

  dropdownItemSelected: {
    backgroundColor: "#dceeff",
    borderRadius: 5,
  },

  selectedText: {
    fontWeight: "bold",
    color: "#007aff",
  },

  dropdownItemContent: {
    flexDirection: "row",
    alignItems: "center",
  },

  dropdownText: {
    fontSize: 14,
    color: "#333",
  },
  SelectedDateStyle: {
    borderWidth: 1,
    borderRadius: 8,
    borderColor: Colors.blackColor,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: Colors.whiteColor,
  },

  SelectLogType: {
    marginTop: 14,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: Colors.blackColor,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: Colors.whiteColor,
  },
  icon: {
    marginRight: 8,
  },
  filterButtonContainer: {
    padding: 16,
    marginTop: 14,
    flexDirection: "column",
    gap: 10,
  },
  filterButton: {
    borderRadius: 10,
    height: 42,
    paddingHorizontal: 21,
    paddingVertical: 10,
  },
  filterButtonText: {
    color: Colors.whiteColor,
    fontWeight: 600,
    fontSize: 16,
    textAlign: "center",
  },
  InputText: {
    color: Colors.blackColor,
    fontWeight: 600,
    fontSize: 16,
    textAlign: "left",
  },
});

export default AttendanceFilter;
