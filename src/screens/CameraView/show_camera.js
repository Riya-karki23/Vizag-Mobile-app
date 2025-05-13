import BackgroundWrapper from "../../Background";
import images from "../../constant/image";
import {
  SafeAreaView,
  TouchableOpacity,
  View,
  StyleSheet,
  Image,
  Platform,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import CustomText from "../../component/CustomText/customText";
import { Colors } from "../../constant/color";
import { useEffect, useState } from "react";
import { request, PERMISSIONS, RESULTS } from "react-native-permissions";
import {
  CommonActions,
  useIsFocused,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { fetchHoliday } from "../../api/fetchHoliday/fetchholiday";
import { getItemFromStorage, setItemToStorage } from "../../utils/asyncStorage";
import { Strings } from "../../constant/string_constant";
// import { request } from "../../api/auth/auth";
import Loader from "../../component/loader/appLoader";
import { logError } from "../../constant/logger";
import LinearGradient from "react-native-linear-gradient";
import { showToast } from "../../constant/toast";
import { Camera, CameraType } from "react-native-camera-kit";
import { useRef } from "react";
import { ScrollView } from "react-native-gesture-handler";
import uploadRequest from "./upload_image";
import { Button } from "react-native";
const ShowCamera = () => {
  const navigation = useNavigation();
  const cameraRef = useRef(null);
  const [photoUri, setPhotoUri] = useState(null);
  const [title, setTitle] = useState("Capture Photo");
  const [loading, setLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const isFocused = useIsFocused();
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const permissionStatus = await request(
          Platform.OS === "android"
            ? PERMISSIONS.ANDROID.CAMERA
            : PERMISSIONS.IOS.CAMERA
        );

        if (permissionStatus === "granted") {
          setHasPermission(true);
        } else {
          setHasPermission(false);
          showToast("Camera permission is required to use this feature.");
        }
      } catch (error) {
        console.error("Permission error:", error);
        setHasPermission(false);
      } finally {
        setLoading(false);
      }
    };

    checkPermissions();
  }, [isFocused]);

  const takePicture = async () => {
    if (hasPermission === false) {
      showToast("Camera permission is required to use this feature.");
    } else {
      if (title == "Remove") {
        setPhotoUri("");
        setTitle("Capture Photo");
      } else {
        try {
          const data = await cameraRef.current.capture();
          setPhotoUri(data?.uri);
          setTitle("Remove");
        } catch (error) {
          console.error(error);
          alert("Error", "There was an error capturing the photo");
        }
      }
    }
  };
  const uploadImage = async () => {
    const baseURL = await getItemFromStorage(Strings.baseURL);
    const endpoint = `${baseURL}/api/method/upload_file`;
    const filePath = photoUri;
    const fileFieldName = "file";
    setLoading(true);
    try {
      const response = await uploadRequest(
        endpoint,
        filePath,
        fileFieldName,
        {}
      );
      setLoading(false);
      showToast("Photo Upload Successful", false);
      setPhotoUri("");
      setTitle("Capture Photo");
      navigation.navigate("MAP", { imageUrl: response?.message?.file_url });
    } catch (error) {
      setLoading(false);
      logError("Upload Failed:", error);
    }
  };
  return (
    <BackgroundWrapper imageSource={images.mainBackground}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.headerView}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="chevron-back" size={30} color={Colors.orangeColor} />
          </TouchableOpacity>
          <CustomText style={styles.headerText}>Capture Photo</CustomText>
        </View>

        {loading ? (
          <View style={styles.loaderWrapper}>
            <Loader isLoading={loading} />
          </View>
        ) : (
          <>
            {hasPermission ? (
              <View style={styles.container}>
                <View style={styles.cameraWrapper}>
                  {photoUri ? (
                    <Image source={{ uri: photoUri }} style={styles.photo} />
                  ) : (
                    <>
                      <Camera
                        ref={cameraRef}
                        style={
                          Platform.OS === "android"
                            ? styles.cameraWrapper
                            : styles.cameraWrapperIOS
                        }
                        cameraType="front"
                        isActive={true}
                        flashMode="auto"
                        focusable={true}
                      />
                    </>
                  )}
                </View>
              </View>
            ) : (
              <View
                style={{
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <CustomText style={styles.headerText}>
                  No Camera Permission
                </CustomText>
              </View>
            )}

            {photoUri && (
              <TouchableOpacity onPress={uploadImage}>
                <LinearGradient
                  colors={[Colors.orangeColor, Colors.redColor]}
                  style={[styles.captureBtn, { marginTop: 50 }]}
                >
                  <CustomText style={styles.buttonText}>
                    {"upload photo".toUpperCase()}
                  </CustomText>
                </LinearGradient>
              </TouchableOpacity>
            )}

            <TouchableOpacity onPress={takePicture}>
              <LinearGradient
                colors={[Colors.orangeColor, Colors.redColor]}
                style={styles.captureBtn}
              >
                <CustomText style={styles.buttonText}>
                  {title.toUpperCase()}
                </CustomText>
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}
      </SafeAreaView>
    </BackgroundWrapper>
  );
};
const styles = StyleSheet.create({
  loaderWrapper: {
    justifyContent: "center",
    alignItems: "center",
    marginTop: 50,
  },
  captureBtn: {
    paddingVertical: 13,
    paddingHorizontal: 20,
    marginBottom: 30,
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
  container: {
    flex: 1,
    paddingTop: 30,
    alignItems: "center",
    backgroundColor: "black",
    backgroundColor: "transparent",
  },
  photo: {
    width: 250,
    height: 250,
    borderRadius: 150,
  },
  cameraWrapper: {
    width: 250,
    height: 250,
    borderRadius: 150,
    overflow: "hidden",
    borderColor: Colors.orangeColor,
    borderWidth: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  cameraWrapperIOS: {
    width: 350,
    height: 350,
    // borderRadius: 150,
    overflow: "hidden",
    borderColor: Colors.orangeColor,
    borderWidth: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  camera: {
    height: 250,
    width: 250,
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
  headerView: {
    flexDirection: "row",
    // paddingLeft: 20,
  },
  addButton: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 10,
  },
});
export default ShowCamera;
