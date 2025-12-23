import api from "./api";

interface Booking {
  id: number;
  status: string;
  turf_name: string;
  location: string;
  slot_time: string;
}

export const bookSlot = (slotId: number) => {
  return api.post("/bookings/book", { slot_id: slotId });
};

export const getMyBookings = () => {
  return api.get<Booking[]>("/bookings/my");
};

export const cancelBooking = (bookingId: number) => {
  return api.post("/bookings/cancel", { booking_id: bookingId });
};

export const getClientBookings = () => {
  return api.get("/bookings/client");
};
