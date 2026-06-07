import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Lock,
  Building2,
  Users as UsersIcon,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { googleAuth } from "@/services/authService";
import { getApiErrorMessage } from "@/lib/apiConfig";
import { persistAuthSession } from "@/lib/authSession";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { usePageSEO } from "@/hooks/usePageSEO";

const RegisterPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  usePageSEO({
    title: "Register",
    description: "Create a TurfBook account with Google and a login password.",
  });

  const [selectedRole, setSelectedRole] = useState<"player" | "client">("player");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [nameError, setNameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    let valid = true;
    const trimmedName = name.trim();

    if (!trimmedName) {
      setNameError("Full name is required");
      valid = false;
    } else if (trimmedName.length < 2) {
      setNameError("Name must be at least 2 characters");
      valid = false;
    } else {
      setNameError("");
    }

    if (!password) {
      setPasswordError("Password is required");
      valid = false;
    } else if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      valid = false;
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      setPasswordError("Use uppercase, lowercase, and a number");
      valid = false;
    } else {
      setPasswordError("");
    }

    if (!confirmPassword) {
      setConfirmPasswordError("Please confirm your password");
      valid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match");
      valid = false;
    } else {
      setConfirmPasswordError("");
    }

    return valid;
  };

  const handleGoogleSignUp = async (credential: string) => {
    if (!validateForm()) {
      toast({
        title: "Complete the form",
        description: "Enter your name and password before continuing with Google.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await googleAuth({
        credential,
        name: name.trim(),
        role: selectedRole,
        password,
        register: true,
      });

      persistAuthSession(res.data);

      toast({
        title: "Welcome to TurfBook!",
        description: "Use your Google email and password to sign in on any device.",
      });

      navigate("/profile");
    } catch (err: unknown) {
      toast({
        title: "Registration failed",
        description: getApiErrorMessage(err, "Google sign-up failed. Please try again."),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = (hasError: boolean) =>
    cn(
      "w-full h-12 pl-12 pr-4 bg-secondary/30 border rounded-xl focus:border-primary/50 focus:ring-1 focus:ring-primary/50 focus:outline-none transition-all placeholder:text-muted-foreground/50",
      hasError
        ? "border-destructive focus:border-destructive focus:ring-destructive/50"
        : "border-white/10",
    );

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      <div className="absolute inset-0 grid-overlay opacity-20" />
      <div className="absolute top-3/4 right-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] animate-pulse" />

      <Navbar />

      <main className="pt-24 pb-12 flex-1 flex items-center justify-center relative z-10">
        <div className="container px-4 max-w-lg">
          <Card className="glass-card border-white/10 shadow-elevated animate-slide-up">
            <CardHeader className="text-center pb-2">
              <div className="w-12 h-12 mx-auto mb-4 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
                <User className="w-6 h-6 text-primary-foreground" />
              </div>
              <Badge variant="outline" className="mx-auto mb-2 border-primary/20 text-primary">
                Create Account
              </Badge>
              <CardTitle className="text-3xl font-heading font-bold">Join TurfBook</CardTitle>
              <CardDescription className="text-muted-foreground">
                Choose your role, set a login password, then verify with Google.
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setSelectedRole("player")}
                  className={cn(
                    "p-4 rounded-xl border-2 transition-all duration-300",
                    selectedRole === "player"
                      ? "border-primary bg-primary/5 shadow-glow-sm"
                      : "border-white/10 hover:border-white/20 bg-secondary/30 hover:bg-secondary/40",
                  )}
                >
                  <UsersIcon
                    className={cn(
                      "mx-auto mb-2 w-6 h-6 transition-colors",
                      selectedRole === "player" ? "text-primary" : "text-muted-foreground",
                    )}
                  />
                  <span
                    className={cn(
                      "font-semibold transition-colors",
                      selectedRole === "player" ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    Player
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">Book and play</p>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole("client")}
                  className={cn(
                    "p-4 rounded-xl border-2 transition-all duration-300",
                    selectedRole === "client"
                      ? "border-primary bg-primary/5 shadow-glow-sm"
                      : "border-white/10 hover:border-white/20 bg-secondary/30 hover:bg-secondary/40",
                  )}
                >
                  <Building2
                    className={cn(
                      "mx-auto mb-2 w-6 h-6 transition-colors",
                      selectedRole === "client" ? "text-primary" : "text-muted-foreground",
                    )}
                  />
                  <span
                    className={cn(
                      "font-semibold transition-colors",
                      selectedRole === "client" ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    Turf Owner
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">Manage your turf</p>
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground ml-1">Full Name *</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input
                    type="text"
                    name="name"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (nameError) setNameError("");
                    }}
                    className={inputClass(!!nameError)}
                  />
                </div>
                {nameError && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {nameError}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground ml-1">
                  Login Password *
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (passwordError) setPasswordError("");
                    }}
                    className={cn(inputClass(!!passwordError), "pr-12")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {passwordError && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {passwordError}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground ml-1">
                  Confirm Password *
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (confirmPasswordError) setConfirmPasswordError("");
                    }}
                    className={cn(inputClass(!!confirmPasswordError), "pr-12")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {confirmPasswordError && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {confirmPasswordError}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                {isSubmitting ? (
                  <Button variant="outline" size="lg" className="w-full" disabled>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating your account...
                  </Button>
                ) : (
                  <GoogleSignInButton
                    mode="signup"
                    disabled={isSubmitting}
                    onCredential={handleGoogleSignUp}
                    onError={() =>
                      toast({
                        title: "Google sign-in cancelled",
                        description: "Please try again to continue registration.",
                        variant: "destructive",
                      })
                    }
                  />
                )}

                <p className="text-xs text-center text-muted-foreground">
                  Google verifies your email. Sign in later with that Gmail address and the password
                  above.
                </p>
              </div>

              <p className="text-center text-muted-foreground text-sm">
                Already have an account?{" "}
                <Link to="/login" className="text-primary font-semibold hover:underline">
                  Sign in
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default RegisterPage;
