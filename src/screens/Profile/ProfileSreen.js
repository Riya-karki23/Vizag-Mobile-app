import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Modal,
  Alert,
} from "react-native";
import { CommonActions } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import LinearGradient from "react-native-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { request } from "../../api/auth/auth";
import { logError, logInfo } from "../../constant/logger";
import Loader from "../../component/loader/appLoader";
import { Colors } from "../../constant/color";
import CustomText from "../../component/CustomText/customText";
import { getItemFromStorage } from "../../utils/asyncStorage";
import { Strings } from "../../constant/string_constant";
import BackgroundWrapper from "../../Background";
import images from "../../constant/image";
import { showToast } from "../../constant/toast";
import DeviceInfo from "react-native-device-info";
import { OneSignal } from "react-native-onesignal";
const ProfileScreen = () => {
  const [userData, setUserData] = useState(null);
  const [employeeData, setEmployeeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userName = await getItemFromStorage(Strings.userName);
        const session = await getItemFromStorage(Strings.userCookie);
        if (userName && session) {
          const userResponse = await request(
            "GET",
            `/api/resource/User/${userName}`
          );
          setUserData(userResponse.data.data);

          const employeeResponse = await request(
            "GET",
            `/api/resource/Employee?filters=[["user_id", "=", "${userName}"]]`
          );

          if (employeeResponse.data.data.length > 0) {
            const employeeName = employeeResponse.data.data[0].name;

            const detailedEmployeeResponse = await request(
              "GET",
              `/api/resource/Employee/${employeeName}`
            );
            setEmployeeData(detailedEmployeeResponse.data.data);
          } else {
            logError("No employee found for the given user", "");
            showToast("No employee found for the given user");
          }
        } else {
          setError("No user information found");
        }
      } catch (error) {
        logError("Failed to fetch user data:", error.response || error.message);
        setError("Failed to fetch user data");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const displayField = (label, value) => (
    <View style={styles.fieldRow}>
      <CustomText style={styles.label}>{label}</CustomText>
      <CustomText style={styles.value} numberOfLines={1} ellipsizeMode="tail">
        {value || "N/A"}
      </CustomText>
    </View>
  );

  const getInitial = (name) => {
    if (!name) return "";
    const initials = name
      .split(" ")
      .map((part) => part[0])
      .join("");
    return initials.toUpperCase();
  };

  if (loading) {
    return <Loader isLoading={loading} />;
  }

  // if (error) {
  //   return <CustomText style={styles.errorText}>{error}</CustomText>;
  // }
  const handleLogoutClick = () => {
    setLogoutModalVisible(true);
  };
  const handleLogout = async () => {
    setLoading(true);
    setLogoutModalVisible(false);

    try {
      await clearExceptKeys(Strings.baseURL);
      await clearExceptKeys(Strings.companyLogo);
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: "Login" }],
        })
      );
      OneSignal.logout();
      showToast("Logged Out Successfully", false);
    } catch (error) {
      setLoading(false);
      Alert.alert("Logout Error", "An error occurred while logging out.");
    }
  };
  const clearExceptKeys = async (keysToKeep) => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const keysToDelete = keys.filter((key) => !keysToKeep.includes(key));
      await AsyncStorage.multiRemove(keysToDelete);
    } catch (error) {
      console.error("Error clearing AsyncStorage:", error);
    }
  };
  return (
    <BackgroundWrapper imageSource={images.mainBackground}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.container}>
          <View style={styles.logoutView}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons
                name="chevron-back"
                size={32}
                color={Colors.orangeColor}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleLogoutClick}
            >
              <Ionicons
                name="exit-outline"
                size={32}
                color={Colors.orangeColor}
              />
            </TouchableOpacity>
          </View>
          <Modal
            animationType="slide"
            transparent={true}
            visible={logoutModalVisible}
            onRequestClose={() => setLogoutModalVisible(false)}
          >
            <SafeAreaView style={{ flex: 1 }}>
              <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                  <CustomText style={styles.modalTitle}>
                    Confirm Logout
                  </CustomText>
                  <CustomText style={styles.modalMessage}>
                    Are you sure you want to logout?
                  </CustomText>
                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      style={styles.addButton}
                      onPress={handleLogout}
                    >
                      <LinearGradient
                        colors={[Colors.orangeColor, Colors.redColor]}
                        style={styles.addButton}
                      >
                        <CustomText style={styles.addButtonText}>
                          Yes
                        </CustomText>
                      </LinearGradient>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.addButton}
                      onPress={() => setLogoutModalVisible(false)}
                    >
                      <LinearGradient
                        colors={[Colors.orangeColor, Colors.redColor]}
                        style={styles.addButton}
                      >
                        <CustomText style={styles.addButtonText}>No</CustomText>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </SafeAreaView>
          </Modal>
          {!employeeData && (
            <CustomText style={styles.errorText}>
              User Details Not Found !
            </CustomText>
          )}
          {employeeData && (
            <ScrollView style={styles.section}>
              {userData && (
                <>
                  <View>
                    <LinearGradient
                      colors={[Colors.orangeColor, Colors.redColor]}
                      style={styles.profileImage}
                    >
                      <CustomText style={styles.initialText}>
                        {getInitial(userData.full_name)}
                      </CustomText>
                    </LinearGradient>
                  </View>
                  <CustomText style={styles.sectionTitle}>
                    {userData.full_name}
                  </CustomText>
                </>
              )}
              <View style={styles.cardView}>
                {displayField("Employee ID", employeeData.name)}
                {displayField("Designation", employeeData.designation)}
                {displayField("Department", employeeData.department)}
                {displayField("Leave Approver", employeeData.leave_approver)}
                {displayField(
                  "Expense Approver",
                  employeeData.expense_approver
                )}
                {displayField("Branch", employeeData.branch)}
                {displayField("Company", employeeData.company)}
              </View>
            </ScrollView>
          )}
          <CustomText
            style={{
              color: Colors.blackColor,
              textAlign: "center",
              fontSize: 19,
              marginBottom: 40,
              marginTop: 40,
            }}
          >
            version {DeviceInfo.getVersion()} ({DeviceInfo.getBuildNumber()})
          </CustomText>
        </View>
      </SafeAreaView>
    </BackgroundWrapper>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  backButton: {
    marginBottom: 16,
    marginRight: 10,
    marginLeft: 10,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    textAlign: "center",
    color: "red",
    marginTop: 20,
    fontSize: 20,
  },
  section: {
    marginBottom: 4,
    backgroundColor: Colors.transparent,
    borderRadius: 12,
    padding: 20,
  },
  cardView: {
    marginBottom: 4,
    backgroundColor: Colors.whiteColor,
    borderRadius: 12,
    padding: 10,
    shadowColor: Colors.blackColor,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 16,
    shadowColor: Colors.blackColor,
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  logoutView: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalContainer: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    borderRadius: 24,
    padding: 20,
    backgroundColor: Colors.whiteColor,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: Colors.darkGreyColor,
  },
  modalMessage: {
    fontSize: 16,
    marginBottom: 20,
    color: Colors.darkGreyColor,
  },
  modalButtons: {
    flexDirection: "row",
    width: "100%",
  },
  addButton: {
    borderRadius: 24,
    height: 42,
    paddingHorizontal: 21,
    paddingVertical: 10,
    marginBottom: 15,
  },
  addButtonText: {
    color: Colors.whiteColor,
    fontWeight: "bold",
    textAlign: "center",
  },
  initialText: {
    color: Colors.whiteColor,
    fontSize: 36,
    fontWeight: Platform.OS == "ios" ? "bold" : null,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: Platform.OS == "ios" ? "bold" : null,
    color: Colors.darkGreyColor,
    marginBottom: 16,
    textAlign: "center",
  },
  fieldRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.borderColor,
  },
  label: {
    fontSize: 14,
    fontWeight: Platform.OS == "ios" ? "bold" : null,
    color: Colors.blackColor,
    flex: 1,
  },
  value: {
    fontSize: 12,
    color: Colors.darkGreyColor,
    textAlign: "right",
    flex: 2,
  },
});
