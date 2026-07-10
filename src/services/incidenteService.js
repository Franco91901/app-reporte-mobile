import api from "./api";

export const obtenerIncidentes = async () => {
  const response = await api.get("/incidentes");

  return response.data;
};

export const votarIncidente = async (incidenteId) => {
  const response = await api.post(`/incidentes/${incidenteId}/votar`);

  return response.data;
};

export const obtenerVotos = async (incidenteId) => {
  const response = await api.get(`/incidentes/${incidenteId}/votos`);

  return response.data;
};
