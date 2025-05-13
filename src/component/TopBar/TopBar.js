import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
  BackHandler,
  Platform,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import LinearGradient from "react-native-linear-gradient";
import { logError } from "../../constant/logger";
import Loader from "../loader/appLoader";
import { Colors } from "../../constant/color";
import CustomText from "../CustomText/customText";
import { getItemFromStorage } from "../../utils/asyncStorage";
import { Strings } from "../../constant/string_constant";
const { width, height } = Dimensions.get("window");
import { request } from "../../api/auth/auth";
const TopBar = () => {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [animationValue] = useState(new Animated.Value(width));
  const [loading, setLoading] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [userName, setUserName] = useState("");
  const [userData, setUserData] = useState(null);
  const [designation, setDesignation] = useState("");
  const [branch, setBranch] = useState("");
  const navigation = useNavigation();
  const route = useRoute();
  const currentRouteName = route.name;

  useEffect(() => {
    const backAction = () => {
      if (currentRouteName === "Home") {
        setLogoutModalVisible(true);
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, [currentRouteName]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedUserName = await getItemFromStorage(Strings.userName);
        const storedDesignation = await getItemFromStorage(Strings.designation);
        const storedBranch = await getItemFromStorage(Strings.branch);

        setUserName(storedUserName || null);
        setDesignation(storedDesignation || null);
        setBranch(storedBranch || null);
        const userResponse = await request(
          "GET",
          `/api/resource/User/${storedUserName}`
        );
        setUserData(userResponse.data.data);
      } catch (error) {
        logError("Error fetching user data: ", error);
      }
    };

    fetchUserData();
  }, []);

  const toggleDrawer = () => {
    if (drawerVisible) {
      Animated.timing(animationValue, {
        toValue: width,
        duration: 300,
        easing: Easing.ease,
        useNativeDriver: true,
      }).start(() => setDrawerVisible(false));
    } else {
      setDrawerVisible(true);
      Animated.timing(animationValue, {
        toValue: 0,
        duration: 300,
        easing: Easing.ease,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleUserProfile = () => {
    navigation.navigate("ProfileScreen");
  };

  const getInitials = (name) => {
    if (!name) return "";
    const initials = name
      .split(" ")
      .map((part) => part[0])
      .join("");
    return initials.toUpperCase();
  };

  return (
    <>
      <LinearGradient
        colors={[Colors.orangeColor, Colors.redColor]}
        style={styles.header}
      >
        <View style={styles.logoContainer}>
          <CustomText style={styles.logoText}>{currentRouteName}</CustomText>
        </View>

        <TouchableOpacity style={styles.iconButton} onPress={handleUserProfile}>
          <View style={styles.profileImageStyle}>
            <CustomText style={styles.initialTextStyle}>
              {userData ? getInitials(userData.full_name) : ""}
            </CustomText>
          </View>
        </TouchableOpacity>
      </LinearGradient>
      {loading && <Loader isLoading={loading} />}
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingVertical: "3%",
    paddingHorizontal: "3%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 70,
    backgroundColor: Colors.whiteColor,
    shadowColor: Colors.blackColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 10,
    marginBottom: "5%",
  },
  initialTextStyle: {
    color: Colors.whiteColor,
    fontSize: 15,
    textAlign: "center",
    fontWeight: Platform.OS == "ios" ? 700 : null,
  },
  logoContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingLeft: 40,
  },
  logoText: {
    textAlign: "left",
    fontSize: 20,
    fontWeight: Platform.OS == "ios" ? "700" : null,
    color: Colors.whiteColor,
  },
  iconButton: {
    marginRight: width * 0.03,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-start",
  },
  drawerContainer: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: width * 0.65,
    backgroundColor: Colors.whiteColor,
    padding: width * 0.05,
    elevation: 5,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    paddingTop: "20%",
  },
  closeButton: {
    marginLeft: 10,
    width: 40,
    height: 40,
    borderRadius: 30,
    borderColor: Colors.orangeColor,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  profileImageStyle: {
    width: 40,
    marginTop: 15,
    height: 40,
    borderRadius: 50,
    borderColor: "white",
    borderWidth: 2.5,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 16,
    shadowColor: Colors.blackColor,
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  drawerItem: {
    paddingVertical: height * 0.01,
    borderBottomColor: Colors.borderColor,
  },
  activeText: {
    color: Colors.orangeColor,
  },
  drawerText: {
    fontSize: width * 0.045,
    fontWeight: 500,
    color: Colors.darkGreyColor,
  },
  loaderContainer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    zIndex: 10,
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

  profileContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  initialsText: {
    fontSize: 32,
    color: Colors.whiteColor,
    fontWeight: Platform.OS == "ios" ? "bold" : null,
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 10,
  },
  designation: {
    fontSize: 16,
    color: Colors.mediumDarkGrey,
    marginTop: 5,
  },
  branch: {
    fontSize: 14,
    color: Colors.mediumDarkGrey,
    marginTop: 2,
  },
  drawerItem: {
    paddingVertical: 15,
    borderBottomColor: Colors.borderColor,
    marginTop: 20,
  },
});

export default TopBar;
