import { request } from "../auth/auth";
export const fetchHoliday = async (holidayListName) => {
  try {
    const apiUrl = `/api/resource/Holiday List/${holidayListName}`;
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
