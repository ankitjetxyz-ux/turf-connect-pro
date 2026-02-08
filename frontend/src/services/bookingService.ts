import api from "./api";
import { PaymentVerificationData } from "@/types";

export const getMyBookings = () => {
  return api.get("/bookings/my");
};

export const cancelBooking = (booking_id: number | string) => {
  return api.post("/bookings/cancel", { booking_id });
};

export const createBooking = (slot_ids: number[]) => {
  return api.post("/bookings/create-and-order", { slot_ids });
};

export const verifyPayment = (data: PaymentVerificationData) => {
  return api.post("/payments/verify", data);
};

// Player cancellation info (refund preview)
export const getCancellationInfo = (booking_id: number | string) => {
  return api.get(`/bookings/cancel-info/${booking_id}`);
};

// Owner cancellation stats
export const getOwnerCancellationStats = () => {
  return api.get("/bookings/owner-cancel-stats");
};

// Client bookings with pagination and date filter
export interface ClientBookingsParams {
  limit?: number;
  offset?: number;
  date_filter?: "today" | "week" | "month" | "all";
  show_all?: boolean;
}

export const getClientBookings = (params: ClientBookingsParams = {}) => {
  const queryParams = new URLSearchParams();
  if (params.limit) queryParams.append("limit", String(params.limit));
  if (params.offset) queryParams.append("offset", String(params.offset));
  if (params.date_filter) queryParams.append("date_filter", params.date_filter);
  if (params.show_all) queryParams.append("show_all", "true");

  const query = queryParams.toString();
  return api.get(`/bookings/client${query ? `?${query}` : ""}`);
};

// Owner cancel booking with reason
export const ownerCancelBooking = (booking_id: number | string, reason: string) => {
  return api.post("/bookings/owner-cancel", { booking_id, reason });
};
