import axios from "axios";
import { logError, logInfo } from "../constant/logger";
import { getItemFromStorage } from "./asyncStorage";
import { Strings } from "../constant/string_constant";
const getAxiosInstance = async () => {
  try {
    const baseURL = await getItemFromStorage(Strings.baseURL);
    // logInfo("baseurl is ---->", baseURL);
    if (!baseURL) {
      throw new Error("Base URL not found. Please log in again.");
    }

    return axios.create({
      baseURL,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      // httpsAgent: new https.Agent({
      //   rejectUnauthorized: false,
      // }),
      withCredentials: true,
    });
  } catch (error) {
    logError("Error creating Axios instance:", error);
    throw error;
  }
};
export default getAxiosInstance;
