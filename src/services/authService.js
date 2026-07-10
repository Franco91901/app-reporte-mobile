import api from "./api";
import { saveToken } from "./tokenService";

export const login = async (email, password) => {
  const response = await api.post("/auth/login", {
    email,
    password,
  });

  const token = response.data.token;

  await saveToken(token);

  return token;
};

export const register = async (nombres, apellidos, email, password) => {
  const response = await api.post("/auth/registro", {
    nombres,
    apellidos,
    email,
    password,
  });

  return response.data;
};
