import { Toast } from "toastify-react-native";

/**
 * showToast
 * @param {string} message  - Message to show
 * @param {boolean} isError - true => red error toast, false => green success toast
 *
 * Default = success (GREEN)
 */
export const showToast = (message, isError = false) => {
  if (isError) {
    Toast.error(message);
  } else {
    Toast.success(message);
  }
};
