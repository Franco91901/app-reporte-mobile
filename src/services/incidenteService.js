import api from "./api";

export const votarIncidente = async (incidenteId) => {
  const response = await api.post(`/incidentes/${incidenteId}/votar`);

  return response.data;
};
