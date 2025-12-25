import api from "./api";

export const bookSlot = (slotId) => {
  return api.post("/bookings/book", { slot_id: slotId });
};

export const cancelBooking = (bookingId) => {
  return api.post("/bookings/cancel", { booking_id: bookingId });
};
