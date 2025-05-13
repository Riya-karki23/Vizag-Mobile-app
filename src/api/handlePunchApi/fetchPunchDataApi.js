import { logInfo } from "../../constant/logger";
export const fetchPunchDataApi = async (data) => {
  try {
    const response = await request(
      "GET",
      `/api/resource/Employee Checkin${data}`
    );
    logInfo("fetchPunchDataApi API", response.data);
    return response.data;
  } catch (error) {
    throw error;
  }
};
