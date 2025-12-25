import api from "./api";

export const getSlots = (turfId) => {
  return api.get(`/slots/${turfId}`);
};

export const createSlot = (data) => {
  return api.post("/slots", data);
};
