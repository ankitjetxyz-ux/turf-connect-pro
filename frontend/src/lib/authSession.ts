export interface AuthUser {
  id: string;
  name?: string;
  email?: string;
  role?: string;
  profile_image_url?: string | null;
}

export interface AuthSessionResponse {
  token: string;
  refreshToken?: string;
  user: AuthUser;
}

export function persistAuthSession(data: AuthSessionResponse) {
  localStorage.setItem("token", data.token);
  localStorage.setItem("role", data.user.role || "");
  localStorage.setItem("user_id", data.user.id);
  localStorage.setItem("name", data.user.name || "");
  localStorage.setItem("email", data.user.email || "");

  if (data.user.profile_image_url) {
    localStorage.setItem("profile_image_url", data.user.profile_image_url);
  } else {
    localStorage.removeItem("profile_image_url");
  }
}

export function getGoogleClientId(): string {
  return (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined)?.trim() || "";
}

export function isGoogleAuthEnabled(): boolean {
  return Boolean(getGoogleClientId());
}
