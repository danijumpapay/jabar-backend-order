import axios, { AxiosError } from "axios";
import dotenv from "dotenv";

dotenv.config();

const integrationBaseURL: string = process.env.INTEGRATION_BASE_URL || "";

const integrationInstance = () => {
  const instance = axios.create({
    baseURL: integrationBaseURL,
  });

  instance.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => Promise.reject(error)
  );

  return instance;
};

export { integrationBaseURL };
export default integrationInstance;
