import api from "./api";

export const getTurfs = () => {
  return api.get("/turfs");
};

export const createTurf = (data) => {
  return api.post("/turfs", data);
};
