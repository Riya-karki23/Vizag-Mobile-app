import React from "react";
import {
  TouchableOpacity,
  StyleSheet,
  View,
  ViewStyle,
  ActivityIndicator,
  Text,
} from "react-native";
import { Colors } from "../constant/color";
import CustomText from "./CustomText/customText";

const CustomButton = ({ title, onPress, isLoading = false, style }) => {
  return (
    <View style={[styles.buttonContainer, style]}>
      <TouchableOpacity
        style={styles.button}
        onPress={!isLoading ? onPress : undefined}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={Colors.whiteColor} />
        ) : (
          <CustomText style={styles.text}>{title}</CustomText>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    width: "100%",
    paddingHorizontal: 20,
  },
  button: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 14,
    backgroundColor: Colors.orangeColor,
    height: 50,
    borderRadius: 24,
  },
  text: {
    textAlign: "center",
    color: Colors.whiteColor,
    fontSize: 16,
    fontWeight: "500",
  },
});

export default CustomButton;
