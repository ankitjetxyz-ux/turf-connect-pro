import api from "./api";

export const sendMessage = (data) => {
  return api.post("/chats/send", data);
};

export const getChat = (otherUserId) => {
  return api.get(`/chats/${otherUserId}`);
};
