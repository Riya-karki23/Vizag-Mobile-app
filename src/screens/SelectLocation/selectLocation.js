import BackgroundWrapper from "../../Background";
import images from "../../constant/image";
import {
  SafeAreaView,
  TouchableOpacity,
  View,
  StyleSheet,
  TextInput,
  ScrollView,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import CustomText from "../../component/CustomText/customText";
import { Colors } from "../../constant/color";
import { useEffect, useState } from "react";
import {
  CommonActions,
  useIsFocused,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { fetchHoliday } from "../../api/fetchHoliday/fetchholiday";
import { getItemFromStorage, setItemToStorage } from "../../utils/asyncStorage";
import { Strings } from "../../constant/string_constant";
import { request } from "../../api/auth/auth";
import Loader from "../../component/loader/appLoader";
import { logError } from "../../constant/logger";
import LinearGradient from "react-native-linear-gradient";
import { showToast } from "../../constant/toast";
const SelectOfficeLocation = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { userData } = route.params || {};
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [branchAddress, setbranchAddress] = useState([]);
  const [selectedOfficeLocation, setSelectedOfficeLocation] = useState(null);
  const [defaultBranch, setDefaultBranch] = useState(null);
  useEffect(() => {
    const getOfficeLocation = async () => {
      try {
        const Employee = await request(
          "GET",
          `/api/resource/Employee/?fields=["name","employee_name","owner","status","leave_approver","company","branch"]`
        );
        const json = Employee.data;
        setDefaultBranch(json.data[0].branch);
        const baseURL = await getItemFromStorage(Strings.baseURL);
        const fetchID = await fetch(
          `https://erp.multark.com/api/method/custom_theme.api.get_hrms_data?customer_url=${baseURL}`
        );
        const fetchDataID = await fetchID.json();
        const getLocationData = await fetch(
          `https://erp.multark.com/api/resource/HRMS Mobile App Registration/${fetchDataID.message.data[0].name}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        const data = await getLocationData.json();
        const branchAddress = data.data.branch_address;
        setbranchAddress(branchAddress);
      } catch (e) {
        logError("Branch Address is not fetched", e);
      }
    };
    getOfficeLocation();
  }, []);
  const nextBtnPressed = async () => {
    if (defaultBranch != null) {
      const matchedBranch = branchAddress.find(
        (item) => item.branch === defaultBranch
      );
      if (matchedBranch) {
        await setItemToStorage(
          Strings.offceCoordinate,
          JSON.stringify({
            latitude: matchedBranch.latitude,
            longitude: matchedBranch.longitude,
          })
        );
        await setItemToStorage(
          Strings.offceGeoFenceRadius,
          JSON.stringify(matchedBranch.geo_fencing_area)
        );
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [
              {
                name: "Main",
                params: { userData: userData },
              },
            ],
          })
        );
      } else {
        showToast("Branch not found.");
      }
    } else {
      if (selectedOfficeLocation != null) {
        await setItemToStorage(
          Strings.offceCoordinate,
          JSON.stringify({
            latitude: selectedOfficeLocation.latitude,
            longitude: selectedOfficeLocation.longitude,
          })
        );
        await setItemToStorage(
          Strings.offceGeoFenceRadius,
          JSON.stringify(selectedOfficeLocation.geo_fencing_area)
        );
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [
              {
                name: "Main",
                params: { userData: userData },
              },
            ],
          })
        );
      } else {
        showToast("Please select office address.");
      }
    }
  };
  return (
    <BackgroundWrapper imageSource={images.mainBackground}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.headerView}>
          <CustomText style={styles.headerText}>Select Location</CustomText>
        </View>
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
              value={
                defaultBranch != null
                  ? defaultBranch
                  : selectedOfficeLocation?.building_name ||
                      selectedOfficeLocation?.branch ||
                      selectedOfficeLocation?.country ||
                      selectedOfficeLocation?.pin_code
                    ? `${selectedOfficeLocation?.building_name || ""}, ${selectedOfficeLocation?.branch || ""}, ${selectedOfficeLocation?.country || ""}, ${selectedOfficeLocation?.pin_code || ""}`
                    : "Select Your Office Location"
              }
              placeholder="Select Your Office Location"
              placeholderTextColor={"grey"}
              editable={false}
            />
          </TouchableOpacity>

          {dropdownVisible && (
            <View style={{ maxHeight: 200 }}>
              <ScrollView>
                {branchAddress.map((branch_address, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => {
                      setDefaultBranch(null);
                      setSelectedOfficeLocation(branch_address);
                      setDropdownVisible(!dropdownVisible);
                    }}
                    style={{
                      padding: 10,
                      borderBottomWidth: 1,
                      borderBottomColor: Colors.borderColor,
                    }}
                  >
                    <CustomText style={styles.modalLabel}>
                      {`${branch_address.building_name}, ${branch_address.branch}, ${branch_address.country}, ${branch_address.pin_code}`}
                    </CustomText>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={nextBtnPressed}>
          <LinearGradient
            colors={[Colors.orangeColor, Colors.redColor]}
            style={styles.nextButton}
          >
            <CustomText style={styles.buttonText}>Go to dashboard</CustomText>
          </LinearGradient>
        </TouchableOpacity>
      </SafeAreaView>
    </BackgroundWrapper>
  );
};
const styles = StyleSheet.create({
  nextButton: {
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 24,
    marginHorizontal: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: Colors.whiteColor,
    fontSize: 15,
    textAlign: "center",
    fontWeight: "600",
  },
  headerView: {
    flexDirection: "row",
    paddingLeft: 20,
  },
  addButton: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 10,
  },
  headerText: {
    fontWeight: Platform.OS == "ios" ? 700 : null,
    fontSize: 22,
    marginBottom: 16,
    textAlign: "left",
    color: Colors.darkGreyColor,
    marginLeft: 0,
    paddingTop: 21,
  },
  modalLabel: {
    color: Colors.blackColor,
    fontSize: 14,
    fontWeight: "500",
    fontFamily: Strings.fontFamilyConstant,
    padding: 5,
  },
});
export default SelectOfficeLocation;
