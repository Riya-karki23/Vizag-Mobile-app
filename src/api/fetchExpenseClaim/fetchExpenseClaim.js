import { request } from "../auth/auth";

export const fetchExpenseClaim = async (userName) => {
  try {
    // const apiUrl = `${BASE_URL}/api/resource/Expense Claim?fields=["employee_name","employee","status","name","expense_approver","approval_status","total_sanctioned_amount","total_claimed_amount"]&limit_start=0&limit_page_length=0&employee_name=${encodeURIComponent(userName)}`;
    // const response = await fetch(apiUrl);
    const response = await request(
      "GET",
      `/api/resource/Expense Claim?fields=["employee_name","employee","status","name","expense_approver","approval_status","total_sanctioned_amount","total_claimed_amount"]&limit_start=0&limit_page_length=0&employee_name=${encodeURIComponent(userName)}`
    );
    if (
      !response.statusCode ||
      response.statusCode < 200 ||
      response.statusCode >= 300
    ) {
      throw new Error(`HTTP error! Status: ${response.statusCode}`);
    }

    const data = response;
    return data.data;
  } catch (error) {
    throw new Error(error.message);
  }
};
