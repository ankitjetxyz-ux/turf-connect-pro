import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { isGoogleAuthEnabled } from "@/lib/authSession";

interface GoogleSignInButtonProps {
  onCredential: (credential: string) => void;
  onError?: () => void;
  disabled?: boolean;
  mode?: "signin" | "signup";
}

export function GoogleSignInButton({
  onCredential,
  onError,
  disabled = false,
  mode = "signin",
}: GoogleSignInButtonProps) {
  if (!isGoogleAuthEnabled()) {
    return (
      <p className="text-sm text-center text-muted-foreground">
        Google sign-in is not configured yet.
      </p>
    );
  }

  return (
    <div
      className={`flex justify-center ${disabled ? "pointer-events-none opacity-50" : ""}`}
      aria-disabled={disabled}
    >
      <GoogleLogin
        onSuccess={(response: CredentialResponse) => {
          if (response.credential) {
            onCredential(response.credential);
          } else {
            onError?.();
          }
        }}
        onError={() => onError?.()}
        text={mode === "signup" ? "signup_with" : "signin_with"}
        shape="rectangular"
        size="large"
        width={320}
        theme="outline"
      />
    </div>
  );
}
