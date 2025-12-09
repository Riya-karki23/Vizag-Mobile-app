

import { AppRoutes } from "../../constant/appRoutes";
import { request } from "../auth/auth";

export const fetchSalesCollectionData = async () => {
  try {

    const response = await request(
      "GET",`/api/resource/Sales Officer Collection?limit_start=0&limit_page_length=0`
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
    console.error("Error fetching production entry data:", error);
    throw new Error(error.message);
  }
};




export const  getSingleSalesCollectionData  = async (Id) => {
    const Url = `${AppRoutes.PRODUCTENTRY}/${Id}`;
    try {
      const response = await request( "GET",`${Url}`);
      // console.log("response.data",response.data);

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
    console.error("Error fetching production entry data:", error);
    throw new Error(error.message);
  }
  }
