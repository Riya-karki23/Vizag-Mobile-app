import { Alert, PermissionsAndroid, Platform } from "react-native";
import notifee, {
  TimestampTrigger,
  TriggerType,
  AndroidImportance,
} from "@notifee/react-native";
import { Colors } from "../../constant/color";
import {
  getMessaging,
  requestPermission,
  getAPNSToken,
} from "@react-native-firebase/messaging";
import { getApp } from "@react-native-firebase/app";
import { showToast } from "../../constant/toast";
import { Strings } from "../../constant/string_constant";
import axios from "axios";
import { OneSignal } from "react-native-onesignal";
import { logError, logInfo } from "../../constant/logger";
import { login } from "../auth/auth";
async function requestUserPermission() {
  if (Platform.OS === "android") {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } else {
    const app = getApp();
    const messaging = getMessaging(app);
    const authStatus = await requestPermission(messaging);
    if (authStatus !== 1) {
      showToast("Permission Denied", "Push notifications are disabled.");
      return null;
    }
    try {
      const apnsToken = await getAPNSToken(messaging);
      if (!apnsToken) {
        logInfo("APNs token not available");
        return null;
      }
    } catch (error) {
      console.error("Error getting APNs token:", error);
    }
  }
  return true;
}
export default requestUserPermission;
// export async function displayNotification(remoteMessage) {
//   await notifee.requestPermission({ sound: true });

//   await notifee.createChannel({
//     id: "default",
//     name: "Default Channel",
//     sound: "notification",
//     importance: AndroidImportance.HIGH,
//   });

//   await notifee.displayNotification({
//     title: remoteMessage.notification.title,
//     body: remoteMessage.notification.body,
//     ios: {
//       badgeCount: 0,
//       sound: "notification",
//     },
//     android: {
//       channelId: "default",
//       smallIcon: "ic_notification",
//       color: Colors.orangeColor,
//       sound: "notification",
//       pressAction: {
//         id: "default",
//       },
//     },
//   });
// }

// export async function scheduleReminderNotification(checkInTime) {
//   await notifee.requestPermission({ sound: true });
//   await notifee.createChannel({
//     id: "default",
//     name: "Reminders",
//     sound: "notification",
//     importance: AndroidImportance.HIGH,
//   });
//   const notificationTime = new Date(checkInTime);
//   const timeZoneOffset = notificationTime.getTimezoneOffset();
//   notificationTime.setMinutes(notificationTime.getMinutes() - timeZoneOffset);
//   notificationTime.setHours(notificationTime.getHours() + 9);
//   notificationTime.setMinutes(notificationTime.getMinutes() + 45);

//   const trigger = {
//     type: TriggerType.TIMESTAMP,
//     timestamp: notificationTime.getTime(),
//   };
//   await notifee.createTriggerNotification(
//     {
//       title: "Reminder",
//       body: "You are approaching 10 hours. Don't forget to check out!",
//       android: {
//         channelId: "default",
//         sound: "notification",
//         smallIcon: "ic_notification",
//         color: Colors.orangeColor,
//         pressAction: {
//           id: "default",
//         },
//       },
//     },
//     trigger
//   );
//   console.log("Notification scheduled at:", notificationTime);
// }

export const scheduleNotification = async (dateTime) => {
  try {
    const externalID = await OneSignal.User.getExternalId();
    logInfo("External ID is", externalID);
    const checkOutTime = calculateCheckOutTime(dateTime);
    const response = await axios.post(
      "https://api.onesignal.com/notifications?c=push",
      {
        app_id: Strings.oneSignalAppID,
        contents: {
          en: "Hey! Your 10-hour work session will end soon. Get ready to check out.",
        },
        include_aliases: {
          external_id: [externalID],
        },
        ios_sound: "notification_sound.mp3",
        target_channel: "push",
        small_icon: "ic_notification",
        android_channel_id: "f5cf53c2-3b21-4269-9414-a27acaea8ea8",
        android_accent_color: "FFFF0000",
        delayed_option: "timezone",
        delivery_time_of_day: checkOutTime,
        // timezone: "Asia/Kolkata",
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${Strings.oneSignalApiKey}`,
          Accept: "application/json",
        },
      }
    );
    logInfo("Scheduled Notification:", response.data);
  } catch (error) {
    logError("Error scheduling notification:", error);
    if (axios.isAxiosError(error)) {
      logError("Error scheduling notification:", error.response?.data);
    }
  }
};
function calculateCheckOutTime(checkInTime) {
  const checkInDate = new Date(checkInTime);
  checkInDate.setHours(checkInDate.getHours() + 10);
  checkInDate.setMinutes(checkInDate.getMinutes() - 15);
  let hours = checkInDate.getHours();
  let minutes = checkInDate.getMinutes();
  let seconds = checkInDate.getSeconds();
  hours = hours.toString().padStart(2, "0");
  minutes = minutes.toString().padStart(2, "0");
  seconds = seconds.toString().padStart(2, "0");

  return `${hours}:${minutes}:${seconds}`;
}
export const setExternalId = async (userId) => {
  try {
    await OneSignal.login(userId);
    logInfo("External ID set successfully:", userId);
  } catch (error) {
    console.error("Error setting External ID:", error);
  }
};
