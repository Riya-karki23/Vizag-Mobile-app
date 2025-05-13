// CustomTabBar.js
import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { LinearGradient } from "react-native-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Ionicons";
import { Colors } from "../../constant/color";

const CustomTabBar = ({ state, descriptors, navigation }) => {
  const getIconName = (routeName, isFocused) => {
    switch (routeName) {
      case "Home":
        return isFocused ? "home" : "home-outline";
      case "Attendance":
        return isFocused ? "calendar" : "calendar-outline";
      case "Leave":
        return isFocused ? "briefcase" : "briefcase-outline";
      case "Expenses":
        return isFocused ? "cash" : "cash-outline";
      case "Salary Slip":
        return isFocused ? "document-text" : "document-text-outline";
      default:
        return "ellipse-outline";
    }
  };

  return (
    <View style={{ backgroundColor: Colors.whiteColor }}>
      <LinearGradient
        colors={[Colors.orangeColor, Colors.redColor]}
        style={[styles.tabBar]}
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const iconName = getIconName(route.name, isFocused);

          return (
            <TouchableOpacity
              key={index}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              style={styles.tab}
            >
              <View
                style={[
                  styles.iconContainer,
                  isFocused && styles.focusedIconContainer,
                ]}
              >
                <Icon
                  name={iconName}
                  size={20}
                  color={isFocused ? Colors.whiteColor : Colors.whiteColor}
                />
              </View>
            </TouchableOpacity>
          );
        })}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    height: 55,
    elevation: 4,
    shadowColor: Colors.blackColor,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    borderRadius: 30,
    marginBottom: 20,
    marginLeft: 20,
    marginRight: 20,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainer: {
    width: 45,
    height: 45,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  focusedIconContainer: {
    backgroundColor: Colors.tabSelectionColor,
    shadowColor: Colors.blackColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    borderRadius: 25,
    width: 45,
    height: 45,
  },
});

export default CustomTabBar;
