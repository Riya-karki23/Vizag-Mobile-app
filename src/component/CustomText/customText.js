import React from "react";
import { Text } from "react-native";
import { Strings } from "../../constant/string_constant";

const CustomText = (props) => {
  return (
    <Text
      {...props}
      style={[props.style, { fontFamily: Strings.fontFamilyConstant }]}
    />
  );
};

export default CustomText;
