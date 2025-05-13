import { request } from "../auth/auth";
export const fetchAttendance = async (userName, startDate, endDate) => {
  try {
    const employeeResponse = await request(
      "GET",
      `/api/resource/Employee?filters=[["user_id", "=", "${userName}"]]&fields=["company","name"]`
    );
    const apiUrl = employeeResponse?.data?.data[0]
      ? `/api/resource/Attendance?fields=["employee","status","attendance_date"]&limit_start=0&limit_page_length=0&filters=[["attendance_date",">=","${startDate}"],["attendance_date","<=","${endDate}"],["employee","=","${employeeResponse.data.data[0].name}"]]`
      : `/api/resource/Attendance?fields=["employee","status","attendance_date"]&limit_start=0&limit_page_length=0&filters=[["attendance_date",">=","${startDate}"],["attendance_date","<=","${endDate}"]]`;
    // const response = await fetch(apiUrl);
    const response = await request("GET", apiUrl);
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
