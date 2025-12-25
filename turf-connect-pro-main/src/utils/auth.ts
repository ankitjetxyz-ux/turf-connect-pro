export const isLoggedIn = (): boolean => {
  return !!localStorage.getItem("token");
};

export const getToken = (): string | null => {
  return localStorage.getItem("token");
};

export const getUserRole = (): string | null => {
  return localStorage.getItem("role");
};

export const setAuthData = (token: string, role: string): void => {
  localStorage.setItem("token", token);
  localStorage.setItem("role", role);
};

export const clearAuthData = (): void => {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
};
