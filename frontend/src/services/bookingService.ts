import api from "./api";

export const getMyBookings = () => {
  return api.get("/bookings/my");
};

export const cancelBooking = (booking_id: number | string) => {
  return api.post("/bookings/cancel", { booking_id });
};

export const createBooking = (slot_ids: number[]) => {
  return api.post("/bookings/create-and-order", { slot_ids });
};

export const verifyPayment = (data: any) => {
  return api.post("/payments/verify", data);
};
