import { PermissionsAndroid, Platform } from "react-native";
import GetLocation from "react-native-get-location";
import { logError, logInfo } from "../../constant/logger";
import { promptForEnableLocationIfNeeded } from "react-native-android-location-enabler";
import { showToast } from "../../constant/toast";
import { PERMISSIONS } from "react-native-permissions";
export const requestLocationPermission = async () => {
  if (Platform.OS === "android") {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: "Location Permission",
          message: "This app needs access to your location.",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel",
          buttonPositive: "OK",
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      logError(err, "");
      return false;
    }
  } else if (Platform.OS === "ios") {
    return true;
  }
  return false;
};

const enableGPS = async () => {
  try {
    await promptForEnableLocationIfNeeded();
    return true;
  } catch (error) {
    showToast(`GPS not enabled. ${error}`);
    return false;
  }
};
export const getCurrentLocation = async (permissionGranted) => {
  if (!permissionGranted) {
    showToast("Location permission not granted.");
    return null;
  }
  if (permissionGranted) {
    try {
      if (Platform.OS === "android") {
        const gpsEnabled = await enableGPS();
        if (!gpsEnabled) {
          showToast("GPS is not enabled.");
          return null;
        }
      }
      const location = await GetLocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 60000,
      });
      const { latitude, longitude } = location;
      return { latitude, longitude };
    } catch (error) {
      logError(error.code, error.message);
      return null;
    }
  } else {
    return null;
  }
};

// export const getCurrentLocation = async (permissionGranted) => {
//   if (permissionGranted) {
//     try {
//       const location = await GetLocation.getCurrentPosition({
//         enableHighAccuracy: true,
//         timeout: 60000,
//       });
//       const { latitude, longitude } = location;

//       return { latitude, longitude };
//     } catch (error) {
//       logError(error.code, error.message);
//       return null;
//     }
//   } else {
//     return null;
//   }
// };
