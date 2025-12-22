import api from "./api";

export const getChatByBooking = (bookingId: string) => {
  return api.get(`/chats/${bookingId}`);
};

export const sendChatMessage = (data: {
  booking_id: string;
  message: string;
}) => {
  return api.post("/chats", data);
};



export const getMessages = (bookingId: string) =>
  api.get(`/chats/${bookingId}`);

export const sendMessage = (data: {
  booking_id: string;
  message: string;
}) => api.post("/chats", data);
