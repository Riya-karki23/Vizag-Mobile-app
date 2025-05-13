export const logError = (message, error) => {
  console.error(`[ERROR]: ${message}`, error);
};

export const logInfo = (message, data) => {
  console.log(`[INFO]: ${message}`, data);
};
