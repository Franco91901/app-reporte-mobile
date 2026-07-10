import axios from "axios";
import { getToken, removeToken } from "./tokenService";
import { router } from "expo-router";

const api = axios.create({
  baseURL: "http://192.168.18.9:8080/api",
});

// INTERCEPTOR DE PETICIÓN
api.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// INTERCEPTOR DE RESPUESTA
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.log("Sesión inválida o expirada. Limpiando token...");

      await removeToken();

      if (router) {
        router.replace("/");
      }
    }
    return Promise.reject(error);
  },
);

export default api;
