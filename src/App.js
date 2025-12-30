import React, { useEffect, useState } from "react";
import { NavigationContainer, useNavigation } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LoginForm from "./component/LoginForm/LoginForm";
import BottomTabNavigator from "./component/BottomTabNavigator/BottomTabNavigator";
import { Alert, Platform, StyleSheet, View } from "react-native";
import "react-native-reanimated";
import Map from "./screens/Map/Map";
import AttendanceScreen from "./screens/Attendance/AttendanceScreen";
import LeaveScreen from "./screens/Leave/LeaveSreen";
import ExpensesScreen from "./screens/Expenses/ExpensesScreen";
import SalarySlipScreen from "./screens/SalarySlip/SalarySlipScreen";
import ProfileSreen from "./screens/Profile/ProfileSreen";
import Home from "./screens/Home/Home";
import SalarySlipPrint from "./screens/SalarySlipPrint/SalarySlipPrint";
import { logError, logInfo } from "./constant/logger";
import Loader from "./component/loader/appLoader";
import { getItemFromStorage } from "./utils/asyncStorage";
import { Strings } from "./constant/string_constant";
import ViewAttendance from "./screens/Attendance/ViewAttendance";
import HolidayList from "./screens/HolidayList/holidayList";
import EmployeeOnBoarding from "./screens/Employee Onboarding/employeeOnboarding";
import RequirementsScreens from "./screens/Requirements/requirement";
import TaskScreen from "./screens/Task/task";
import ShowCamera from "./screens/CameraView/show_camera";
import Icon from "react-native-vector-icons/Feather";
import { Colors } from "./constant/color";
import NetInfo from "@react-native-community/netinfo";
import CustomText from "./component/CustomText/customText";
import BackgroundWrapper from "./Background";
import images from "./constant/image";
import { showToast } from "./constant/toast";
import Container from "toastify-react-native";
import ShowToastConatiner from "./component/ToastComponent";
import { SafeAreaView } from "react-native-safe-area-context";
import SalesCollectionOfficer from "./screens/SalesCollectionOfficer/SalesCollectionOfficer";
import requestUserPermission, {
  displayNotification,
  scheduleNotification,
} from "./api/requestPushNotificationPermission/requestPushNotificationPermission";
import { getApp } from "@react-native-firebase/app";
import {
  getMessaging,
  onMessage,
  getToken,
} from "@react-native-firebase/messaging";
import { LogLevel, OneSignal } from "react-native-onesignal";
import { use } from "react";
import SalarySlipFilter from "./screens/SalarySlip/SalarySlipFilter";
import AttendanceFilter from "./screens/Attendance/AttendanceFilter";
import ProductionEntryList from "./screens/ProductionEntry/ProductionEntryList";
import CreateProductionEntry from "./screens/ProductionEntry/CreateProductionEntry";
import SalesOfficerCollectionList from "./screens/SalesCollection/SalesOfficerCollectionList";
import LateCollection from "./screens/LateCollection/LateCollection";

// import SelectOfficeLocation from "./screens/SelectLocation/selectLocation";
import CheckInOption from "./screens/CheckInOption/CheckInOption";

const Stack = createNativeStackNavigator();

const App = () => {
  const [initialRoute, setInitialRoute] = useState(null);
  const [isConnected, setIsConnected] = useState(true);
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected);
      if (state.isConnected === false) {
        showToast("You are offline. Please check your internet connection.");
      }
    });
    return () => {
      unsubscribe();
    };
  }, []);
  useEffect(() => {
    requestPushNotificationPermission();
  }, []);
  const requestPushNotificationPermission = async () => {
    OneSignal.Debug.setLogLevel(6);
    OneSignal.initialize(Strings.oneSignalAppID);
    await OneSignal.Notifications.requestPermission(
      Platform.OS === "ios" ? false : true
    );
    OneSignal.Notifications.addEventListener("click", (event) => {
      logInfo("OneSignal: notification clicked:", event);
    });
  };

  useEffect(() => {
    const checkSession = async () => {
      try {
        const userCookie = await getItemFromStorage(Strings.userCookie);
       if (userCookie) {
  setInitialRoute("Main");
} else {
  setInitialRoute("Login");
}

      } catch (error) {
        logError("Error checking session:", error);
        setInitialRoute("Login");
      }
    };

    checkSession();
  }, []);

  // useEffect(() => {
  // requestUserPermission();
  //   const app = getApp();
  //   const messaging = getMessaging(app);
  //   getToken(messaging)
  //     .then((token) => console.log("FCM Token:", token))
  //     .catch((error) => console.log("Error getting FCM token:", error));
  //   const unsubscribe = onMessage(messaging, async (remoteMessage) => {
  //     console.log("Notification Received (Foreground):", remoteMessage);
  //     // displayNotification(remoteMessage);
  //   });
  //   return () => unsubscribe();
  // }, []);

  if (!initialRoute) {
    return <Loader isLoading={true} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ShowToastConatiner />
        {isConnected ? (
          <NavigationContainer>
            <Stack.Navigator initialRouteName={initialRoute}>
              <Stack.Screen
                name="Login"
                component={LoginForm}
                options={{ headerShown: false, gestureEnabled: false }}
              />

                {/* <Stack.Screen
    name="SelectOfficeLocation"
    component={SelectOfficeLocation}
    options={{ headerShown: false }}
  /> */}

               {/* check in  */}
              <Stack.Screen
  name="CheckInOption"
  component={CheckInOption}
  options={{ headerShown: false }}
/>

<Stack.Screen
  name="SalesCollectionOfficer"
  component={SalesCollectionOfficer}
  options={{ headerShown: false }}
/>

<Stack.Screen
  name="Late Collection"
  component={LateCollection}
  options={{ headerShown: false }}
/>


              <Stack.Screen
                name="Dashboard"
                component={Home}
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="MAP"
                component={Map}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="Main"
                component={BottomTabNavigator}
                options={{
                  headerShown: false,
                }}
              />
              <Stack.Screen
                name="Attendance"
                component={AttendanceScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="Leave"
                component={LeaveScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="Expenses"
                component={ExpensesScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="Salary Slip"
                component={SalarySlipScreen}
                options={{ headerShown: false }}
              />


              <Stack.Screen
                name="Sales Collection"
                component={SalesOfficerCollectionList}
                options={{ headerShown: false }}
              />


              
              <Stack.Screen
                name="ProfileScreen"
                component={ProfileSreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="SalarySlipPrint"
                component={SalarySlipPrint}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="ViewAttendance"
                component={ViewAttendance}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="HolidayList"
                component={HolidayList}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="EmployeeOnBoarding"
                component={EmployeeOnBoarding}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="RequirementsScreens"
                component={RequirementsScreens}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="TaskScreen"
                component={TaskScreen}
                options={{ headerShown: false }}
              />
             
              <Stack.Screen
                name="ShowCamera"
                component={ShowCamera}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="SalarySlipFilter"
                component={SalarySlipFilter}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="SalarySlipScreen"
                component={SalarySlipScreen}
                options={{ headerShown: false }}
              />

              {/* SalarySlipFilter */}
              <Stack.Screen
                name="Attendance Filter"
                component={AttendanceFilter}
                options={{ headerShown: false }}
              />
 


              <Stack.Screen
                name="Production Entry"
                component={ProductionEntryList}
                options={{ headerShown: false }}
              />

               <Stack.Screen
                name="Create Production Entry"
                component={CreateProductionEntry}
                options={{ headerShown: false }}
              />

              

              {/* TaskScreen */}
            </Stack.Navigator>
          </NavigationContainer>
        ) : (
          <BackgroundWrapper imageSource={images.mainBackground}>
            <View style={styles.background}>
              <View style={styles.iconContainer}>
                <Icon
                  name="wifi-off"
                  size={40}
                  color={Colors.darkGreyColor}
                  style={styles.icon}
                />
              </View>
              <CustomText style={styles.offlineText}>
                You are offline. Please check your internet connection.
              </CustomText>
            </View>
          </BackgroundWrapper>
        )}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};
const styles = StyleSheet.create({
  background: { flex: 1 },
  icon: {
    marginTop: 100,

    alignContent: "center",
    justifyContent: "center",
    alignItems: "center",
  },
  iconContainer: {
    marginBottom: 10,
    alignSelf: "center",
  },
  offlineText: {
    fontSize: 20,
    color: Colors.orangeColor,
    textAlign: "center",
    justifyContent: "center",
    alignItems: "center",
  },
});
export default App;