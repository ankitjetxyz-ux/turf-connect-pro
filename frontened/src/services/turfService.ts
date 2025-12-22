import api from "./api";

export const createTurf = (data: {
  name: string;
  location: string;
  description: string;
  price_per_slot: number;
  facilities: string;
  images: string;
}) => {
  return api.post("/turfs", data);
};

export const getAllTurfs = () => {
  return api.get("/turfs");
};
