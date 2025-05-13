import React from "react";
import { ImageBackground, StyleSheet, View } from "react-native";
import images from "./constant/image";

const BackgroundWrapper = ({ children, imageSource }) => {
  const backgroundImage = imageSource || images.defaultBackgroundImage;
  return (
    <ImageBackground
      source={imageSource}
      style={styles.background}
      resizeMode="cover"
    >
      {children}
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: "white",
  },
});

export default BackgroundWrapper;
