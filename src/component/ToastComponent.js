import { Platform } from "react-native";
import React from "react";
import Container from "toastify-react-native";
import { Strings } from "../constant/string_constant";
import { Colors } from "../constant/color";
const ShowToastConatiner = () => {
  return (
    <Container
      position="top"
      duration={2000}
      height={"auto"}
      positionValue={Platform.OS === "ios" ? undefined : 0}
      style={{
        elevation: 10,
        width: "100%",
        fontFamily: Strings.fontFamilyConstant,
      }}
      textStyle={{
        fontSize: 18,
        flex: 1,
        color: Colors.darkGreyColor,
        fontFamily: Strings.fontFamilyConstant,
      }}
    />
  );
};
export default ShowToastConatiner;
