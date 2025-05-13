import React from "react";
import { View, StyleSheet } from "react-native";
import { Colors } from "../../constant/color";
import { Circle } from "react-native-animated-spinkit";
const Loader = ({ isLoading }) => {
  if (!isLoading) return null;

  return (
    <View style={styles.loader}>
      <Circle color={Colors.orangeColor} />
    </View>
  );
};

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default Loader;
