import { Toast } from "toastify-react-native";

export const showToast = (message, isError = true) => {
  if (isError) {
    Toast.error(`Oops! ${message}`);
  } else {
    Toast.success(`${message}`);
  }
};
