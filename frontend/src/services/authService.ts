import api from "./api";

export const registerUser = (data: {
  name: string;
  email: string;
  password: string;
  role: string;
}) => {
  const payload = new URLSearchParams();
  payload.append("name", data.name);
  payload.append("email", data.email);
  payload.append("password", data.password);
  payload.append("role", data.role);
  return api.post("/auth/register", payload, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
};

export const loginUser = (data: {
  email: string;
  password: string;
}) => {
  const payload = new URLSearchParams();
  payload.append("email", data.email);
  payload.append("password", data.password);
  return api.post("/auth/login", payload, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
};
