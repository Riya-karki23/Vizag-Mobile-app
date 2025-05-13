// export const fetchSalarySlipList = async (userName) => {
//     try {
//       const apiUrl = `/api/resource/Salary Slip?fields=["employee","start_date","end_date","employee_name","company","net_pay","payment_days","absent_days","gross_pay","total_working_days"]&limit_start=0&limit_page_length=0&employee=${encodeURIComponent(userName)}`;
//       const response = await fetch(apiUrl);

//       if (!response.ok) {
//         throw new Error(`HTTP error! Status: ${response.status}`);
//       }

//       const data = await response.json();
//       return data.data;
//     } catch (error) {
//       throw new Error(error.message);
//     }
//   };

import { request } from "../auth/auth";

export const fetchSalarySlipList = async (userName) => {
  try {
    const apiUrl = `/api/resource/Salary Slip?fields=["employee","name","start_date","end_date","employee_name","company","net_pay","payment_days","absent_days","gross_pay","total_working_days"]&limit_start=0&limit_page_length=0&employee=${encodeURIComponent(userName)}`;
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
