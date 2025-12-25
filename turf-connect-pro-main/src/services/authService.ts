import api from "./api";

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: "player" | "client";
}

interface AuthResponse {
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
}

export const loginUser = (data: LoginData) => {
  return api.post<AuthResponse>("/auth/login", data);
};

export const registerUser = (data: RegisterData) => {
  return api.post<AuthResponse>("/auth/register", data);
};
