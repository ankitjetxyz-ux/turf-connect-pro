import api from "./api";

interface TurfData {
  name: string;
  location: string;
  description: string;
  price_per_slot: number;
  facilities: string;
  images: string;
}

interface Turf extends TurfData {
  id: number;
  owner_id: number;
  is_active: boolean;
}

export const getTurfs = () => {
  return api.get<Turf[]>("/turfs");
};

export const getTurfById = (id: number | string) => {
  return api.get<Turf>(`/turfs/${id}`);
};

export const createTurf = (data: TurfData) => {
  return api.post<Turf>("/turfs", data);
};

export const getMyTurfs = () => {
  return api.get<Turf[]>("/turfs/my");
};
