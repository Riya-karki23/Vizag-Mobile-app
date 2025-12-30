import AsyncStorage from "@react-native-async-storage/async-storage";
import { logError } from "../constant/logger";

export const setItemToStorage = async (key, value) => {
  try {
    // ✅ FIX: key must be a string
    if (typeof key !== "string" || !key) {
      console.warn("[AsyncStorage] setItemToStorage invalid key:", key);
      return;
    }

    // ✅ FIX: value must be a string for AsyncStorage
    const safeValue = value === null || value === undefined ? "" : String(value);

    await AsyncStorage.setItem(key, safeValue);
  } catch (error) {
    logError("Error storing data:", error);
    console.warn("[AsyncStorage] setItemToStorage failed:", key, error);
  }
};

export const getItemFromStorage = async (key) => {
  try {
    // ✅ FIX: key must be a string
    if (typeof key !== "string" || !key) {
      console.warn("[AsyncStorage] getItemFromStorage invalid key:", key);
      return null;
    }

    const value = await AsyncStorage.getItem(key);
    return value;
  } catch (error) {
    logError("Error retrieving data:", error);
    console.warn("[AsyncStorage] getItemFromStorage failed:", key, error);
    return null;
  }
};

export const removeItemFromStorage = async (key) => {
  try {
    // ✅ FIX: key must be a string
    if (typeof key !== "string" || !key) {
      console.warn("[AsyncStorage] removeItemFromStorage invalid key:", key);
      return;
    }

    await AsyncStorage.removeItem(key);
  } catch (error) {
    logError("Error removing data:", error);
    console.warn("[AsyncStorage] removeItemFromStorage failed:", key, error);
    return null;
  }
};
