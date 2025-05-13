import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  InteractionManager,
  Keyboard,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Text,
  Linking,
} from "react-native";
import {
  CommonActions,
  useIsFocused,
  useRoute,
} from "@react-navigation/native";
import { Picker } from "@react-native-picker/picker";
import { useNavigation } from "@react-navigation/native";
import { login, storeSession } from "../../api/auth/auth";
import Icon from "react-native-vector-icons/FontAwesome";
import Ionicons from "react-native-vector-icons/Ionicons";
import styles from "./styles";
import LinearGradient from "react-native-linear-gradient";
import BackgroundWrapper from "../../Background";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  BaseURL,
  GROWTHAWK_URL,
  MULTARK_URL,
  PANORAH_URL,
} from "../../constant/app_url";
import { showToast } from "../../constant/toast";
import { logError, logInfo } from "../../constant/logger";
import images from "../../constant/image";
import Loader from "../loader/appLoader";
import { Colors } from "../../constant/color";
import CustomText from "../CustomText/customText";
import { Strings } from "../../constant/string_constant";
import { getItemFromStorage, setItemToStorage } from "../../utils/asyncStorage";
import axios from "axios";
import { Modal } from "react-native";
import { Button } from "react-native";
const LoginForm = () => {
  const route = useRoute();
  const isFocused = useIsFocused();
  const { showDropdown } = route.params || {};
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const [baseURL, setBaseURL] = useState(MULTARK_URL);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [focus, setFocus] = useState({ email: false, password: false });

  // useEffect(() => {
  useEffect(() => {
    const getURl = async () => {
      try {
        const savedBaseURL = await getItemFromStorage(Strings.baseURL);
        if (savedBaseURL) {
          setDropdownVisible(true);
        } else {
          setDropdownVisible(false);
        }
      } catch (error) {
        logError("Error retrieving baseURL:", error);
      }
    };
    getURl();
  }, [isFocused]);

  // }, [isFocused]);
  useEffect(() => {
    const interactionHandle = InteractionManager.runAfterInteractions(() => {});
    return () => interactionHandle.cancel();
  }, []);
  useEffect(() => {
    const setBaseURL = async () => {
      try {
        const savedBaseURL = await getItemFromStorage(Strings.baseURL);
        if (!savedBaseURL) {
          // await setItemToStorage(Strings.baseURL, baseURL);
          logInfo("Base URL set for the first time:", baseURL);
        } else {
          logInfo("Base URL already set:", savedBaseURL);
        }
      } catch (error) {
        logError("Error setting baseURL:", error);
      }
    };
    setBaseURL();
  }, [isFocused]);
  useEffect(() => {
    switch (selectedCompany) {
      case BaseURL.MULTARK:
        setBaseURL(MULTARK_URL);
        break;
      case BaseURL.PANORAH:
        setBaseURL(PANORAH_URL);
        break;
      case BaseURL.GROWTHAWK:
        setBaseURL(GROWTHAWK_URL);
        break;
      default:
        setBaseURL(MULTARK_URL);
    }
  }, [selectedCompany]);
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      setEmail("");
      setPassword("");
    });
    return unsubscribe;
  }, [navigation]);
  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const handleEmailPress = (email) => {
    Linking.openURL(`mailto:${email}`);
  };

  const handleCallPress = (phoneNumber) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const handleSubmit = async () => {
    setLoading(true);
    if (!selectedCompany) {
      showToast("Please enter a valid URL");
      setLoading(false);
      return;
    }
    try {
      const fetchID = await fetch(
        `https://erp.multark.com/api/method/custom_theme.api.get_hrms_data?customer_url=${selectedCompany}`
      );
      const fetchDataID = await fetchID.json();
      const response = await axios.get(
        `https://erp.multark.com/api/resource/HRMS Mobile App Registration/${fetchDataID.message.data[0].name}`
      );

      if (response.data && response.data.data) {
        const { data } = response.data;

        // Parse the date_of_subscription
        const subscriptionDate = new Date(data.valid_till);
        const currentDate = new Date();

        const date1 = new Date(currentDate);
        const date2 = new Date(subscriptionDate);

        // Extract the date part (YYYY-MM-DD)
        const onlyDate1 = date1.toISOString().split("T")[0];
        const onlyDate2 = date2.toISOString().split("T")[0];

        if (onlyDate1 <= onlyDate2) {
          setDropdownVisible(true);
          // setBaseURL(data.customer_url);

          await setItemToStorage(Strings.baseURL, data.customer_url);
        } else {
          logInfo("Subscription is not yet valid.");
          setModalVisible(true);
        }
      } else {
        logInfo("No data found or invalid response.");
        setDropdownVisible(false);
      }
    } catch (error) {
      logError("Error submitting company:", error);
      setDropdownVisible(false);
      setModalVisible(true);
    } finally {
      setLoading(false);
      // setSelectedCompany("");
    }
  };

  const handleLogin = async () => {
    Keyboard.dismiss();
    setLoading(true);
    if (!email || !password) {
      requestAnimationFrame(() => setLoading(false));
      setLoading(false);
      showToast("Please enter username and password");
      return;
    }
    try {
      const result = await login(email, password, baseURL);
      if (result.success && result.message === "Logged In") {
        const sessionData = { cookies: result.cookies, userName: email };
        setLoading(false);
        await storeSession(sessionData);
        // navigation.dispatch(
        //   CommonActions.reset({
        //     index: 0,
        //     routes: [
        //       {
        //         name: "Main",
        //         params: { userData: result.data },
        //       },
        //     ],
        //   })
        // );
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [
              {
                name: "SelectOfficeLocation",
                params: { userData: result.data },
              },
            ],
          })
        );
      } else {
        setLoading(false);
      }
    } catch (error) {
      setLoading(false);
      showToast(`Login failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLinkPress = (url) => {
    Linking.openURL(url).catch((err) =>
      console.error("An error occurred: ", err)
    );
  };

  const selectUrl = [
    { label: BaseURL.MULTARK, value: BaseURL.MULTARK },
    { label: BaseURL.PANORAH, value: BaseURL.PANORAH },
    { label: BaseURL.GROWTHAWK, value: BaseURL.GROWTHAWK },
  ];
  return (
    <BackgroundWrapper imageSource={images.backGroundImage}>
      <SafeAreaView style={{ flex: 1, backgroundColor: "transparent" }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "height" : "padding"}
          style={{ flex: 1 }}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView
              contentContainerStyle={{ flexGrow: 1 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              showsHorizontalScrollIndicator={false}
            >
              {/* {dropdownVisible && (
                <TouchableOpacity
                  style={{
                    marginBottom: 16,
                    marginTop: 10,
                    marginLeft: 20,
                  }}
                  onPress={() => {
                    setDropdownVisible(false);
                  }}
                >
                  <Ionicons
                    name="chevron-back"
                    size={32}
                    color={Colors.blackColor}
                  />
                </TouchableOpacity>
              )} */}
              <View style={styles.container}>
                <View style={[styles.imageContainer, styles.logoConatiner]}>
                  <Image
                    source={images.multarkLogo}
                    style={styles.multarkLogo}
                  />
                </View>
                <View style={styles.imageContainer}>
                  <Image source={images.loginPage} style={styles.loginImage} />
                </View>
                {/* {Platform.OS === "android" && (
                  <View
                    style={{
                      backgroundColor: Colors.pinkColor,
                      margin: 25,
                      borderRadius: 24,
                      borderColor: Colors.orangeColor,
                      borderWidth: 1,
                      elevation: 5,
                      shadowColor: Colors.blackColor,
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.25,
                      shadowRadius: 3.84,
                      paddingHorizontal: 16,
                    }}
                  >
                    <Picker
                      selectedValue={selectedCompany}
                      onValueChange={(itemValue) =>
                        setSelectedCompany(itemValue)
                      }
                      style={{
                        height: 56,
                        fontSize: 16,
                        color: Colors.greyishBlueColor,
                        paddingTop: 6,
                        paddingBottom: 6,
                      }}
                    >
                      <Picker.Item
                        label={BaseURL.MULTARK}
                        value={BaseURL.MULTARK}
                      />
                      <Picker.Item
                        label={BaseURL.PANORAH}
                        value={BaseURL.PANORAH}
                      />
                      <Picker.Item
                        label={BaseURL.GROWTHAWK}
                        value={BaseURL.GROWTHAWK}
                      />
                    </Picker>
                  </View>
                )} */}
                {/* {Platform.OS === "ios" && (
                  <View
                    style={{
                      backgroundColor: "white",
                      margin: 25,
                      borderColor: Colors.redColor,
                      borderWidth: 1,
                      borderRadius: 24,
                      elevation: 5,
                      shadowColor: Colors.blackColor,
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.25,
                      shadowRadius: 3.84,
                      paddingHorizontal: 16,
                    }}
                  >
                    <TouchableOpacity
                      onPress={() => {
                        setDropdownVisible(!dropdownVisible);
                      }}
                      style={styles.fullWidthInput}
                    >
                      <TextInput
                        style={{
                          height: 56,
                          padding: 4,
                          borderColor: Colors.borderColor,
                          fontFamily: Strings.fontFamilyConstant,
                          borderRadius: 5,
                          fontSize: 16,
                          fontWeight: 400,
                          color: "black",
                          backgroundColor: Colors.whiteColor,
                        }}
                        pointerEvents="none"
                        placeholder="Select Your Location"
                        value={selectedCompany}
                        editable={false}
                      />
                    </TouchableOpacity>

                    {dropdownVisible && (
                      <View>
                        {selectUrl.map((urlData, index) => (
                          <TouchableOpacity
                            key={index}
                            onPress={() => {
                              setSelectedCompany(urlData.value);
                              setDropdownVisible(!dropdownVisible);
                            }}
                            style={{
                              padding: 10,
                              borderBottomWidth: 1,
                              borderBottomColor: Colors.borderColor,
                            }}
                          >
                            <CustomText style={styles.modalLabel}>
                              {urlData.label}
                            </CustomText>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                )} */}

                <View style={styles.fieldContainer}>
                  {!dropdownVisible && (
                    <>
                      <TextInput
                        style={[
                          styles.input,
                          focus.email && styles.activeInput,
                        ]}
                        placeholder="http://example.com"
                        placeholderTextColor={Colors.greyishBlueColor}
                        value={selectedCompany}
                        selectionColor={Colors.orangeColor}
                        onChangeText={setSelectedCompany}
                        keyboardType="default"
                        onFocus={() => setFocus({ ...focus, email: true })}
                        onBlur={() => setFocus({ ...focus, email: false })}
                      />

                      <TouchableOpacity onPress={handleSubmit}>
                        {loading ? (
                          <Loader isLoading={loading} />
                        ) : (
                          <LinearGradient
                            colors={[Colors.orangeColor, Colors.redColor]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 0, y: 1 }}
                            style={styles.button}
                          >
                            <CustomText style={styles.buttonText}>
                              Submit
                            </CustomText>
                          </LinearGradient>
                        )}
                      </TouchableOpacity>
                    </>
                  )}

                  {dropdownVisible || showDropdown ? (
                    <View>
                      <TextInput
                        style={[
                          styles.input,
                          focus.email && styles.activeInput,
                        ]}
                        placeholder="Enter your email"
                        placeholderTextColor={Colors.greyishBlueColor}
                        value={email}
                        selectionColor={Colors.orangeColor}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        onFocus={() => setFocus({ ...focus, email: true })}
                        onBlur={() => setFocus({ ...focus, email: false })}
                      />
                      <View style={styles.passwordContainer}>
                        <TextInput
                          style={[
                            styles.input,
                            focus.password && styles.activeInput,
                          ]}
                          placeholder="Enter your password"
                          placeholderTextColor={Colors.greyishBlueColor}
                          value={password}
                          selectionColor={Colors.orangeColor}
                          onChangeText={setPassword}
                          secureTextEntry={!passwordVisible}
                          onFocus={() => setFocus({ ...focus, password: true })}
                          onBlur={() => setFocus({ ...focus, password: false })}
                        />
                        <TouchableOpacity
                          onPress={togglePasswordVisibility}
                          style={styles.eyeIcon}
                        >
                          <Icon
                            name={passwordVisible ? "eye" : "eye-slash"}
                            size={20}
                            color={Colors.redColor}
                          />
                        </TouchableOpacity>
                      </View>
                      <TouchableOpacity
                        style={styles.button}
                        onPress={handleLogin}
                      >
                        {loading ? (
                          <Loader isLoading={loading} />
                        ) : (
                          <LinearGradient
                            colors={[Colors.orangeColor, Colors.redColor]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 0, y: 1 }}
                            style={styles.button}
                          >
                            <CustomText style={styles.buttonText}>
                              Log In
                            </CustomText>
                          </LinearGradient>
                        )}
                      </TouchableOpacity>
                    </View>
                  ) : null}
                </View>
              </View>

              <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
              >
                <View style={styles.modalOverlay}>
                  <View style={styles.modalContent}>
                    <Text style={styles.modelHading}>
                      Subscribe now to get started.{" "}
                    </Text>
                    <Text style={styles.modelHading}>Need help? </Text>
                    <View style={styles.modalTextContainer}>
                      <Text style={styles.boldText}>
                        Email:{" "}
                        <Text
                          style={styles.boldTextHighlight}
                          onPress={() =>
                            handleEmailPress("support@multark.com")
                          }
                        >
                          support@multark.com
                        </Text>
                      </Text>
                      <Text style={styles.boldText}>
                        Website:{" "}
                        <Text
                          style={styles.boldTextHighlight}
                          onPress={() =>
                            handleLinkPress("https://erp.multark.com/about")
                          }
                        >
                          https://erp.multark.com
                        </Text>
                      </Text>
                      <Text style={styles.boldText}>
                        Contact:{" "}
                        <Text
                          style={styles.boldTextHighlight}
                          onPress={() => handleCallPress("+919136453613")}
                        >
                          +91 91364 53613
                        </Text>
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.button}
                      onPress={() => setModalVisible(false)}
                    >
                      {loading ? (
                        <Loader isLoading={loading} />
                      ) : (
                        <LinearGradient
                          colors={[Colors.orangeColor, Colors.redColor]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 0, y: 1 }}
                          style={styles.CloseButton}
                        >
                          <CustomText style={styles.CloseButtonText}>
                            Close
                          </CustomText>
                        </LinearGradient>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </Modal>
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </BackgroundWrapper>
  );
};

export default LoginForm;
