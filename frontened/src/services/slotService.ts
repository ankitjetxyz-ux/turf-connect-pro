import api from "./api";

export const getSlotsByTurf = (turfId: string) => {
  return api.get(`/slots/${turfId}`);
};

export const createSlot = (data: {
  turf_id: string;
  start_time: string;
  end_time: string;
  price: number;
}) => {
  return api.post("/slots", data);
};
