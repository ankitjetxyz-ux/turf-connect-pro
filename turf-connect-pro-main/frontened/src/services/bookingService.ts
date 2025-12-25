import api from "./api";

export const getMyBookings = () => {
  return api.get("/bookings/my");
};

export const cancelBooking = (booking_id: number) => {
  return api.post("/bookings/cancel", { booking_id });
};
