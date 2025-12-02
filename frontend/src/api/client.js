// src/api/client.js
import axios from "axios";

const API_BASE_URL = "/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false,
});

export const logApiBaseUrl = () => {
  console.log("API baseURL =>", API_BASE_URL);
};
