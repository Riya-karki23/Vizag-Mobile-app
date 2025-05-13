import axios from "axios";
import getAxiosInstance from "../../utils/axiosInstance";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { logError, logInfo } from "../../constant/logger";
import { showToast } from "../../constant/toast";
import {
  getItemFromStorage,
  removeItemFromStorage,
  setItemToStorage,
} from "../../utils/asyncStorage";
import { Strings } from "../../constant/string_constant";
export const storeLogType = async (logType) => {
  try {
    await setItemToStorage(Strings.logType, logType);
  } catch (error) {
    logError("Error saving logType:", error);
  }
};

export const getLogType = async () => {
  try {
    const logType = await getItemFromStorage(Strings.logType);
    if (logType) {
      return logType;
    }
    return null;
  } catch (error) {
    logError("Error retrieving logType:", error);
    return null;
  }
};

export const request = async (method, url, data) => {
  try {
    const axiosInstance = await getAxiosInstance();
    const response = await axiosInstance({ method, url, data });
    const cookies = response.headers["set-cookie"] || [];
    const cookieString = cookies.join("; ");

    return {
      success: true,
      statusCode: response.status,
      cookies: cookieString,
      message: response.data.message,
      data: response.data,
    };
  } catch (error) {
    logError("Error is:", error);
    if (axios.isAxiosError(error)) {
      logError("Axios Error:", {
        message:
          error.response?.data?.message || error.response?.data?._error_message,
        status: error.response?.status,
        data: await handleErrorResponse(error),
      });
      await showErrorsStatusCode(error);
      return {
        success: false,
        error:
          error.response?.data ||
          error.response?.data?.message ||
          error.response?.data?._error_message ||
          (await handleErrorResponse(error)),
      };
    } else {
      logError("Unexpected Error:", error);
    }
    // return { success: false, error: axios.isAxiosError(error) };
  }
};

const showErrorsStatusCode = async (error) => {
  switch (error.response?.status) {
    case 400:
      return showToast(
        `Bad Request: ${error.response?.data?.message || error.response?.data?._error_message || (await handleErrorResponse(error))}`
      );
    case 417:
      return showToast(
        `Bad Request: ${error.response?.data?.message || error.response?.data?._error_message || (await handleErrorResponse(error))}`
      );
    case 401:
      return showToast(
        `Unauthorized: ${error.response?.data?.message || error.response?.data?._error_message || (await handleErrorResponse(error))}`
      );
    case 403:
      return showToast(
        `Forbidden: ${error.response?.data?.message || error.response?.data?._error_message || (await handleErrorResponse(error))}`
      );
    case 417:
      return showToast(
        `Bad Request: ${error.response?.data?.message || error.response?.data?._error_message || (await handleErrorResponse(error))}`
      );
    case 404:
      return showToast(
        `Not Found: ${error.response?.data?.message || error.response?.data?._error_message || (await handleErrorResponse(error))}`
      );
    case 500:
      return showToast(
        `Server Error: ${error.response?.data?.message || error.response?.data?._error_message || (await handleErrorResponse(error))}`
      );
    case 503:
      return showToast(
        `Service Unavailable: ${error.response?.data?.message || error.response?.data?._error_message || (await handleErrorResponse(error))}`
      );
    default:
      return showToast(
        (await handleErrorResponse(error)) ||
          error.response?.data?.message ||
          error.response?.data?._error_message
      );
  }
};
const formatErrorMessage = (htmlMessage) => {
  try {
    const plainMessage = htmlMessage
      .replace(/<a href="([^"]+)">([^<]+)<\/a>/g, "$2 ($1)")
      .replace(/<br\s*\/?>/g, "\n")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");

    return plainMessage;
  } catch (error) {
    logError("Error formatting message:", error);
    return "An error occurred while formatting the message.";
  }
};

export const handleErrorResponse = async (error) => {
  try {
    // Extract _server_messages from error response
    const serverMessages =
      error.response?.data["_server_messages"] || error._server_messages;
    if (serverMessages) {
      // Decode the base64 encoded messages (if needed, based on your API setup)
      const decodedMessages = JSON.parse(serverMessages);
      const parsedMessage = JSON.parse(decodedMessages[0]);

      // Extract the message
      const userFriendlyMessage = parsedMessage.message;
      // Log the user-friendly message
      logError("Axios Error Parsed Message:", userFriendlyMessage);

      return formatErrorMessage(userFriendlyMessage);
    } else {
      logError("No server messages found");
      return "An unexpected error occurred.";
    }
  } catch (err) {
    logError("Error parsing server message:", err);
    return "Failed to process error message.";
  }
};
export const login = async (email, password, baseURL) => {
  logInfo("email", email);
  logInfo("password", password);
  logInfo("baseURL", baseURL);
  const result = await request("POST", "/api/method/login", {
    usr: email,
    pwd: password,
  });

  logInfo("result>>>>>>>>>>>>>>>>>>>>>", result);
  try {
    if (result.success) {
      // Store session details if login is successful
      await storeSession({
        cookies: result.cookies,
        userName: result.data.full_name || email, // Assuming full_name is returned
        userImageUrl: result.data.user_image || "", // Assuming user_image is returned
      });
    }

    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
};
export const storeSession = async (sessionData) => {
  const currentDate = new Date().toISOString();
  await setItemToStorage(Strings.userCookie, sessionData.cookies);
  await setItemToStorage(Strings.loginDate, currentDate);
  await setItemToStorage(Strings.userName, sessionData.userName);
  await setItemToStorage(Strings.isLoggedIn, "true"); // On login

  // await AsyncStorage.setItem('logType', sessionData.logType);

  logInfo("AsyncStorage", sessionData.userName);
};

export const getSession = async () => {
  const userCookie = await getItemFromStorage(Strings.userCookie);
  const loginDate = await getItemFromStorage(Strings.loginDate);
  const userName = await getItemFromStorage(Strings.userName);
  const isLoggedIn = await getItemFromStorage(Strings.isLoggedIn);
  // const logType = await AsyncStorage.getItem('logType');

  logInfo("userName................", userName);

  if (userCookie && loginDate) {
    return {
      userCookie,
      loginDate,
      userName,
      isLoggedIn,
      // logType
    };
  }
  return null;
};

export const clearSession = async () => {
  await removeItemFromStorage(Strings.userCookie);
  await removeItemFromStorage(Strings.loginDate);
  await removeItemFromStorage(Strings.userName);
  await removeItemFromStorage(Strings.isLoggedIn);
};
