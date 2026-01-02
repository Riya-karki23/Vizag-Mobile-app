// ===============================
// ✅ ShowCamera.js (FULL)
// ✅ Only fixes:
// 1) Upload response -> imageUrl resolve (multiple paths) + console logs
// 2) Always pass action + imageUrl string to next screens ✅ (FIXED)
// 3) Remove accidental setSelectedMode (was undefined in this file)
// 4) Better error logs (no flow/logic change)
// ===============================

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
import { useEffect, useState, useRef } from "react";
// import { request, PERMISSIONS } from "react-native-permissions";
import { request as requestPermission, PERMISSIONS } from "react-native-permissions";
import { request as apiRequest } from "../../api/auth/auth";

import { useIsFocused, useNavigation, useRoute } from "@react-navigation/native"; // ✅ useRoute added
import { getItemFromStorage, setItemToStorage } from "../../utils/asyncStorage";
import { Strings } from "../../constant/string_constant";
import Loader from "../../component/loader/appLoader";
import { logError } from "../../constant/logger";
import LinearGradient from "react-native-linear-gradient";
import { showToast } from "../../constant/toast";
import { Camera } from "react-native-camera-kit";
import uploadRequest from "./upload_image";

const ShowCamera = () => {
  const navigation = useNavigation();
  const route = useRoute(); // ✅ added

  // ✅ get real action from Home (checkin/checkout)
  const normalize = (v) => String(v || "").trim().toLowerCase();

const action = (() => {
  const p = route?.params || {};
  const candidates = [
    p.action,
    p?.parentRouteParams?.action,
    p?.params?.action,
    p?.parentRouteParams?.params?.action,
    p.type,
    p.mode,
  ].map(normalize);

  const found = candidates.find((x) => x === "checkin" || x === "checkout");
  return found || ""; // ✅ NO DEFAULT
})();


  const cameraRef = useRef(null);

  const [photoUri, setPhotoUri] = useState(null);
  const [title, setTitle] = useState("Capture Photo");
  const [loading, setLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);

  const isFocused = useIsFocused();

  useEffect(() => {
    // ✅ NO LOGIC CHANGE: just ensure loading is false initially on focus
    setLoading(false);
  }, []);

  useEffect(() => {
    const checkPermissions = async () => {
      try {
        setLoading(true);

        const permissionStatus = await requestPermission(
          Platform.OS === "android" ? PERMISSIONS.ANDROID.CAMERA : PERMISSIONS.IOS.CAMERA
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

    if (isFocused) checkPermissions();
  }, [isFocused]);

  const takePicture = async () => {
    if (hasPermission === false) {
      showToast("Camera permission is required to use this feature.");
      return;
    }

    if (title === "Remove") {
      setPhotoUri("");
      setTitle("Capture Photo");
      return;
    }

    try {
      const data = await cameraRef.current.capture();
      setPhotoUri(data?.uri || "");
      setTitle("Remove");
    } catch (error) {
      console.error("Capture error:", error);
      showToast("Error capturing photo. Please try again.");
    }
  };

  const uploadImage = async () => {
    const baseURL = await getItemFromStorage(Strings.baseURL);
    const endpoint = `${baseURL}/api/method/upload_file`;
    const filePath = photoUri;
    const fileFieldName = "file";

    setLoading(true);

    try {
      const response = await uploadRequest(endpoint, filePath, fileFieldName, {});
      console.log("📌 Upload raw response:", response);

      showToast("Photo Upload Successful", false);

      // reset UI
      setPhotoUri("");
      setTitle("Capture Photo");

      // ✅ IMPORTANT: clear old mode so "previous stored value" never re-used
      // ✅ SAFER: clear only on checkin (checkout me mode wipe na ho)
      if (action === "checkin") {
        await setItemToStorage("work_mode_selected", "");
      }

      // ✅ fetch department in realtime (same logic, only logs added)
      const storedUserName = await getItemFromStorage(Strings.userName);
      console.log("🧾 storedUserName:", storedUserName);

      let dept = "";
      try {
        const empRes = await apiRequest(
          "GET",
          `/api/resource/Employee?fields=["name","department"]&filters=[["user_id","=","${storedUserName}"]]`
        );

        console.log("📌 Employee API raw response (ShowCamera):", empRes?.data || empRes);

        dept = empRes?.data?.data?.[0]?.department || "";
      } catch (e) {
        logError("Department fetch failed:", e);
        console.log("❌ Department fetch failed:", e);
        dept = "";
      }

      const deptLower = String(dept || "").toLowerCase();

      // ✅ show CheckInOption only for SALES/PRODUCTION (same logic)
      const shouldShowModePicker = deptLower.includes("sales") || deptLower.includes("production");

      // ✅ FIX: file_url can be in different response shapes
      const imageUrl =
        response?.message?.file_url ||
        response?.data?.message?.file_url ||
        response?.data?.file_url ||
        response?.file_url ||
        "";

      const finalImageUrl = String(imageUrl || "");
      console.log("✅ Resolved imageUrl:", finalImageUrl);

      // ✅ Keep your flow: Sales/Production -> CheckInOption else direct MAP
      if (shouldShowModePicker) {
        console.log("➡️ Navigate -> CheckInOption with:", { imageUrl, dept, action });

        navigation.navigate("CheckInOption", {
          imageUrl: finalImageUrl,
          dept,
          action, // ✅ pass real action (checkin/checkout)
        });
      } else {
        // ✅ Direct MAP (skip mode selection) — same logic, only safe strings/logs
        await setItemToStorage("work_mode_selected", "office");

        console.log("➡️ Navigate -> MAP (skip options) with:", {
          imageUrl,
          dept,
          forceMode: "office",
          action,
        });

        navigation.navigate("MAP", {
          imageUrl: finalImageUrl, // ✅ always the resolved one
          dept,
          forceMode: "office",
          action, // ✅ pass real action
        });
      }
    } catch (error) {
      logError("Upload Failed:", error);
      console.log("❌ Upload Failed:", error);
      showToast("Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <BackgroundWrapper imageSource={images.mainBackground}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.headerView}>
          <TouchableOpacity style={styles.addButton} onPress={() => navigation.goBack()}>
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
                    <Camera
                      ref={cameraRef}
                      style={Platform.OS === "android" ? styles.cameraWrapper : styles.cameraWrapperIOS}
                      cameraType="front"
                      isActive={true}
                      flashMode="auto"
                      focusable={true}
                    />
                  )}
                </View>
              </View>
            ) : (
              <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <CustomText style={styles.headerText}>No Camera Permission</CustomText>
              </View>
            )}

            {photoUri ? (
              <TouchableOpacity onPress={uploadImage}>
                <LinearGradient
                  colors={[Colors.orangeColor, Colors.redColor]}
                  style={[styles.captureBtn, { marginTop: 50 }]}
                >
                  <CustomText style={styles.buttonText}>{"upload photo".toUpperCase()}</CustomText>
                </LinearGradient>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity onPress={takePicture}>
              <LinearGradient colors={[Colors.orangeColor, Colors.redColor]} style={styles.captureBtn}>
                <CustomText style={styles.buttonText}>{title.toUpperCase()}</CustomText>
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}
      </SafeAreaView>
    </BackgroundWrapper>
  );
};

const styles = StyleSheet.create({
  loaderWrapper: { justifyContent: "center", alignItems: "center", marginTop: 50 },
  captureBtn: {
    paddingVertical: 13,
    paddingHorizontal: 20,
    marginBottom: 30,
    borderRadius: 24,
    marginHorizontal: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { color: Colors.whiteColor, fontSize: 15, textAlign: "center", fontWeight: "600" },
  container: { flex: 1, paddingTop: 30, alignItems: "center", backgroundColor: "transparent" },
  photo: { width: 250, height: 250, borderRadius: 150 },
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
    overflow: "hidden",
    borderColor: Colors.orangeColor,
    borderWidth: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  headerText: {
    fontWeight: Platform.OS === "ios" ? "700" : undefined,
    fontSize: 22,
    marginBottom: 16,
    textAlign: "left",
    color: Colors.darkGreyColor,
    marginLeft: 0,
    paddingTop: 21,
  },
  headerView: { flexDirection: "row" },
  addButton: { borderRadius: 24, padding: 20, marginBottom: 10 },
});

export default ShowCamera;
