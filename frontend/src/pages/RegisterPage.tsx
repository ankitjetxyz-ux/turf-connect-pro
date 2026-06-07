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
  Building2,
  Users as UsersIcon,
  Loader2,
  AlertCircle,
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
    description: "Create a TurfBook account with Google to start booking or managing turfs.",
  });

  const [selectedRole, setSelectedRole] = useState<"player" | "client">("player");
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateName = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError("Full name is required");
      return false;
    }
    if (trimmed.length < 2) {
      setNameError("Name must be at least 2 characters");
      return false;
    }
    setNameError("");
    return true;
  };

  const handleGoogleSignUp = async (credential: string) => {
    if (!validateName()) {
      toast({
        title: "Enter your name",
        description: "Please enter your full name before continuing with Google.",
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
        register: true,
      });

      persistAuthSession(res.data);

      toast({
        title: res.data.isNewUser ? "Welcome to TurfBook!" : "Signed in",
        description: res.data.message,
      });

      navigate("/profile");
    } catch (err: unknown) {
      const message = getApiErrorMessage(err, "Google sign-up failed. Please try again.");
      toast({
        title: "Registration failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
                Choose your role, enter your name, and sign up with Google.
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
                <label className="text-sm font-medium text-muted-foreground ml-1">
                  Full Name *
                </label>
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
                    className={cn(
                      "w-full h-12 pl-12 pr-4 bg-secondary/30 border rounded-xl focus:border-primary/50 focus:ring-1 focus:ring-primary/50 focus:outline-none transition-all placeholder:text-muted-foreground/50",
                      nameError
                        ? "border-destructive focus:border-destructive focus:ring-destructive/50"
                        : "border-white/10",
                    )}
                  />
                </div>
                {nameError && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {nameError}
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
                  Sign in later with Google or email and password on the login page.
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
