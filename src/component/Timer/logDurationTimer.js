import { logError } from "../../constant/logger";
import { Strings } from "../../constant/string_constant";
import { getItemFromStorage, setItemToStorage } from "../../utils/asyncStorage";

let elapsedTime = 0;
let isRunning = false;
let intervalId = null;
const listeners = new Set();
let previousElapsedTime = 0;
const notifyListeners = () => {
  listeners.forEach((listener) => listener(elapsedTime));
};
let currentDay = new Date().toDateString();
const checkForDayChange = () => {
  // const today = new Date().toDateString();
  // if (today !== currentDay) {
  //   resetTimer();
  //   currentDay = today;
  // }
};
export const loadTimerState = async () => {
  try {
    const savedIsRunning = await getItemFromStorage(Strings.isRunning);

    if (savedIsRunning === "true") {
      startTimer();
    }
  } catch (error) {
    logError("Error loading timer state:", error);
  }
};
const saveTimerState = async () => {
  try {
    // await setItemToStorage("elapsedTime", previousElapsedTime.toString());
    await setItemToStorage(Strings.isRunning, isRunning.toString());
  } catch (error) {
    logError("Error saving timer state:", error);
  }
};
export const startTimer = () => {
  // checkForDayChange();
  if (!isRunning) {
    isRunning = true;
    elapsedTime = previousElapsedTime;
    intervalId = setInterval(() => {
      elapsedTime += 1000;
      saveTimerState();
      notifyListeners();
    }, 1000);
  }
};

export const stopTimer = async () => {
  if (isRunning) {
    clearInterval(intervalId);
    isRunning = false;
    previousElapsedTime = elapsedTime;
    await saveTimerState();
  }
};

export const resetTimer = async () => {
  elapsedTime = 0;
  previousElapsedTime = 0;
  await saveTimerState();
  notifyListeners();
};

export const subscribeToTimer = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const getElapsedTime = () => elapsedTime;
