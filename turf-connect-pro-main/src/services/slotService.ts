import api from "./api";

interface SlotData {
  turf_id: string | number;
  start_time: string;
  end_time: string;
  price: number;
}

interface Slot extends SlotData {
  id: number;
  is_available: boolean;
}

export const getSlots = (turfId: string | number) => {
  return api.get<Slot[]>(`/slots/${turfId}`);
};

export const createSlot = (data: SlotData) => {
  return api.post<Slot>("/slots", data);
};
