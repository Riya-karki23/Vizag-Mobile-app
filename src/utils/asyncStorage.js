import AsyncStorage from "@react-native-async-storage/async-storage";
import { logError } from "../constant/logger";
export const setItemToStorage = async (key, value) => {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (error) {
    logError("Error storing data:", error);
  }
};
export const getItemFromStorage = async (key) => {
  try {
    const value = await AsyncStorage.getItem(key);
    return value;
  } catch (error) {
    logError("Error retrieving data:", error);
    return null;
  }
};
export const removeItemFromStorage = async (key) => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    logError("Error retrieving data:", error);
    return null;
  }
};
