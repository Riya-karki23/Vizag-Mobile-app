import axios from "axios";
import FormData from "form-data";

const uploadRequest = async (
  endpoint,
  filePath,
  fileFieldName,
  additionalData = {}
) => {
  try {
    const formData = new FormData();
    const fileName = filePath.split("/").pop();
    formData.append(fileFieldName, {
      uri: filePath,
      name: fileName,
      type: "image/png",
    });
    const response = await axios.post(endpoint, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      validateStatus: (status) => status >= 200 && status < 500,
    });

    return handleResponse(response);
  } catch (error) {
    return handleError(error);
  }
};

const handleResponse = (response) => {
  if (response.status >= 200 && response.status < 300) {
    return response.data;
  } else {
    throw new Error(`Error: ${response.status} - ${response.statusText}`);
  }
};

const handleError = (error) => {
  console.error(error);
  return { success: false, message: error.message || "An error occurred" };
};

export default uploadRequest;
