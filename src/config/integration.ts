import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

let integrationBaseURL: string | undefined = process.env.INTEGRATION_BASE_URL || "https://integration.jumpapay.com/api";

const integrationInstance = () => {
  const instance = axios.create({
    baseURL: integrationBaseURL,
  });

  instance.interceptors.request.use(
    (config) => {
      const token = process.env.WA_CLOUD_API_ACCESS_TOKEN;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      console.log("INTEGRATION ERROR ======>", error);
      return Promise.reject(error);
    },
  );

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      return Promise.reject(error?.response?.data || error);
    }
  );

  return instance;
};

export { integrationBaseURL };
export default integrationInstance;
