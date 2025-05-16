import { request } from "../auth/auth";

export const fetchEmployeeCheckins = async (
  userName = null,
  selectedDate = null,
  logType = null
) => {
  try {
    let apiUrl = `/api/resource/Employee Checkin?fields=["employee_name","employee","time","log_type","shift"]&limit_start=0&limit_page_length=0&employee=${encodeURIComponent(userName)}`;

    let filters = [];

    if (logType) {
      filters.push(["Employee Checkin", "log_type", "=", logType]);
    }

    if (selectedDate) {
      filters.push([
        "Employee Checkin",
        "time",
        "Between",
        [`${selectedDate} 00:00:00`, `${selectedDate} 23:59:59`],
      ]);
    }

    if (filters.length > 0) {
      apiUrl += `&filters=${JSON.stringify(filters)}`;
    }

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

export const fetchEmployeeCheckinsReports = async (userName = null) => {
  try {
    let apiUrl = `/api/method/frappe.desk.reportview.get_list?doctype=Employee Checkin&fields=["name","custom_hours","employee_name","employee","time","log_type"]`;
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
