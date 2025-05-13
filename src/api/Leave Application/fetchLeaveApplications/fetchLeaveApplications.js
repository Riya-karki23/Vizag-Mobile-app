import { request } from "../../auth/auth";

export const fetchLeaveApplications = async (userName) => {
  try {
    // const apiUrl = `${BASE_URL}/api/resource/Leave Application?fields=["employee_name","status","from_date","to_date","leave_type"]&limit_start=0&limit_page_length=0&employee_name=${encodeURIComponent(userName)}`;
    // const response = await fetch(apiUrl);
    const response = await request(
      "GET",
      `/api/resource/Leave Application?fields=["employee_name","status","from_date","to_date","leave_type"]&limit_start=0&limit_page_length=0&employee_name=${encodeURIComponent(userName)}`
    );
    if (
      !response.statusCode ||
      response.statusCode < 200 ||
      response.statusCode >= 300
    ) {
      throw new Error(`HTTP error! Status: ${response.statusCode}`);
    }
    return response.data;
  } catch (error) {
    throw new Error(error.message);
  }
};
