import { logError } from "../../../constant/logger";
import { request } from "../../auth/auth";

export const getLeaveDetails = async (employeeId, currentDate) => {
  if (!employeeId || !currentDate) {
    throw new Error("Employee ID or Date is missing!");
  }

  const requestBody = {
    employee: employeeId,
    date: currentDate,
  };

  try {
    const response = await request(
      "POST",
      `/api/method/hrms.hr.doctype.leave_application.leave_application.get_leave_details`,
      JSON.stringify(requestBody)
    );

    const result = response.data;
    if (
      !response.statusCode ||
      response.statusCode < 200 ||
      response.statusCode >= 300
    ) {
      throw new Error(`HTTP error! Status: ${response.statusCode}`);
    }

    return result["message"];
  } catch (error) {
    logError("API call failed:", error);
    throw error;
  }
};
