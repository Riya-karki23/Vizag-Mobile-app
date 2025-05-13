import { SafeAreaView, StyleSheet, TouchableOpacity, View } from "react-native";
import BackgroundWrapper from "../../Background";
import images from "../../constant/image";
import Icon from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import { Colors } from "../../constant/color";
import { SceneMap, TabBar, TabView } from "react-native-tab-view";
import { useState } from "react";
import EmployeeAttendanceDetail from "./Employee Onboarding Tabs/employee_attendance";
import EmployeePersonalDetail from "./Employee Onboarding Tabs/employee_personal";
import { getItemFromStorage } from "../../utils/asyncStorage";
import { logError, logInfo } from "../../constant/logger";
import { Strings } from "../../constant/string_constant";
import { useEffect } from "react";
import { request } from "../../api/auth/auth";
import CustomText from "../../component/CustomText/customText";

const EmployeeOnBoarding = () => {
  const navigation = useNavigation();
  const [index, setIndex] = useState(0);
  const [employeeData, setEmployeeData] = useState(null);
  const [routes] = useState([
    { key: "employeeAttendance", title: "Address & Contacts" },
    { key: "employeeProfile", title: "Personal" },
  ]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userName = await getItemFromStorage(Strings.userName);

        const employeeResponse = await request(
          "GET",
          `/api/resource/Employee?filters=[["user_id", "=", "${userName}"]]`
        );
        const detailedEmployeeResponse = await request(
          "GET",
          `/api/resource/Employee/${employeeResponse.data.data[0].name}`
        );
        setEmployeeData(detailedEmployeeResponse.data.data);
      } catch (e) {
        logError("error is", e);
      }
    };
    fetchUserData();
  }, []);
  const renderScene = SceneMap({
    employeeAttendance: () => (
      <EmployeeAttendanceDetail empData={employeeData} />
    ),
    employeeProfile: EmployeePersonalDetail,
  });
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
          <CustomText style={styles.headerText}>
            {employeeData?.first_name}
          </CustomText>
        </View>
        <TabView
          navigationState={{ index, routes }}
          renderScene={renderScene}
          onIndexChange={setIndex}
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
      </SafeAreaView>
    </BackgroundWrapper>
  );
};
const styles = StyleSheet.create({
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
  tabBarStyle: {
    backgroundColor: "transparent",
    fontSize: 30,
  },
  addButton: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 10,
  },
});
export default EmployeeOnBoarding;
