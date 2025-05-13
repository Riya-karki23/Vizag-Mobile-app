import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Home from "../../screens/Home/Home";
import AttendanceScreen from "../../screens/Attendance/AttendanceScreen";
import LeaveScreen from "../../screens/Leave/LeaveSreen";
import ExpensesScreen from "../../screens/Expenses/ExpensesScreen";
import SalarySlipScreen from "../../screens/SalarySlip/SalarySlipScreen";
import CustomTabBar from "./CustomTabBar";

const Tab = createBottomTabNavigator();

const BottomTabNavigator = ({ route }) => {
  return (
    <Tab.Navigator tabBar={(props) => <CustomTabBar {...props} />}>
      <Tab.Screen
        name="Home"
        component={Home}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Attendance"
        component={AttendanceScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Leave"
        component={LeaveScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Expenses"
        component={ExpensesScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Salary Slip"
        component={SalarySlipScreen}
        options={{ headerShown: false }}
      />
    </Tab.Navigator>
  );
};

export default BottomTabNavigator;
