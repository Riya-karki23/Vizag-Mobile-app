import { request } from "../auth/auth";

export const handlePunchApi = async (data) => {
  try {
    const response = await request(
      "POST",
      `/api/resource/Employee Checkin`,
      data
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};
