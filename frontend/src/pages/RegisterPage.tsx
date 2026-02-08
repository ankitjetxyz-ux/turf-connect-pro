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
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  Building2,
  Users as UsersIcon,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser, sendOTP, verifyOTP } from "@/services/authService";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// Add proper type definitions
interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  otp?: string;
}

const RegisterPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"player" | "client">("player");
  const [otpVerified, setOtpVerified] = useState(false);
  const [otp, setOtp] = useState("");
  const [sendingOTP, setSendingOTP] = useState(false);
  const [verifyingOTP, setVerifyingOTP] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // Countdown timer for OTP resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (otpCountdown > 0) {
      timer = setTimeout(() => {
        setOtpCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [otpCountdown]);

  // Validate email format
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.name.trim()) {
      errors.name = "Name is required";
    } else if (formData.name.length < 2) {
      errors.name = "Name must be at least 2 characters";
    }

    if (!formData.email) {
      errors.email = "Email is required";
    } else if (!isValidEmail(formData.email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.password = "Password must contain uppercase, lowercase, and numbers";
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Clear error when user starts typing
    if (formErrors[name as keyof FormErrors]) {
      setFormErrors({ ...formErrors, [name]: "" });
    }
  };

  const handleSendOTP = async () => {
    // Validate email before sending OTP
    if (!formData.email) {
      setFormErrors({ ...formErrors, email: "Email is required" });
      return;
    }

    if (!isValidEmail(formData.email)) {
      setFormErrors({ ...formErrors, email: "Please enter a valid email address" });
      return;
    }

    setSendingOTP(true);
    try {
      await sendOTP(formData.email, "email_verification");
      setOtpSent(true);
      setOtpCountdown(60); // 60 seconds countdown
      toast({
        title: "OTP sent successfully",
        description: "Please check your email for the verification code.",
      });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      const message = error.response?.data?.error || "Failed to send OTP. Please try again.";

      toast({
        title: "Failed to send OTP",
        description: message,
        variant: "destructive",
      });

      // Reset OTP state on error
      setOtpSent(false);
    } finally {
      setSendingOTP(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter a 6-digit OTP code.",
        variant: "destructive",
      });
      return;
    }

    setVerifyingOTP(true);
    try {
      await verifyOTP(formData.email, otp, "email_verification");
      setOtpVerified(true);
      toast({
        title: "Email verified successfully",
        description: "Your email has been verified. You can now proceed.",
      });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      const message = error.response?.data?.error || "Invalid OTP. Please try again.";

      toast({
        title: "Verification failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setVerifyingOTP(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!validateForm()) {
      toast({
        title: "Please fix the errors",
        description: "Some fields require your attention.",
        variant: "destructive",
      });
      return;
    }

    if (!otpVerified) {
      toast({
        title: "Email verification required",
        description: "Please verify your email with OTP before registering.",
        variant: "destructive",
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setFormErrors({
        ...formErrors,
        confirmPassword: "Passwords do not match",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await registerUser({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: selectedRole,
        otp: otp,
      });

      toast({
        title: "Registration successful!",
        description: "Your account has been created. You can now sign in.",
      });

      // Small delay before navigation for better UX
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err: unknown) {
      console.error("Registration error:", err);
      const error = err as { response?: { data?: { error?: string } } };
      const message = error.response?.data?.error ||
        (err instanceof Error ? err.message : "Registration failed. Please try again.");

      toast({
        title: "Unable to register",
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
              <CardTitle className="text-3xl font-heading font-bold">
                Join TurfBook
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Sign up to start {selectedRole === "player" ? "booking" : "managing"} sports turfs
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-6">
              {/* Role Selection */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <button
                  type="button"
                  onClick={() => setSelectedRole("player")}
                  className={cn(
                    "p-4 rounded-xl border-2 transition-all duration-300",
                    selectedRole === "player"
                      ? "border-primary bg-primary/5 shadow-glow-sm"
                      : "border-white/10 hover:border-white/20 bg-secondary/30 hover:bg-secondary/40"
                  )}
                >
                  <UsersIcon
                    className={cn(
                      "mx-auto mb-2 w-6 h-6 transition-colors",
                      selectedRole === "player" ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                  <span
                    className={cn(
                      "font-semibold transition-colors",
                      selectedRole === "player" ? "text-foreground" : "text-muted-foreground"
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
                      : "border-white/10 hover:border-white/20 bg-secondary/30 hover:bg-secondary/40"
                  )}
                >
                  <Building2
                    className={cn(
                      "mx-auto mb-2 w-6 h-6 transition-colors",
                      selectedRole === "client" ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                  <span
                    className={cn(
                      "font-semibold transition-colors",
                      selectedRole === "client" ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    Turf Owner
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">Manage your turf</p>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Name */}
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
                      value={formData.name}
                      onChange={handleInputChange}
                      className={cn(
                        "w-full h-12 pl-12 pr-4 bg-secondary/30 border rounded-xl focus:border-primary/50 focus:ring-1 focus:ring-primary/50 focus:outline-none transition-all placeholder:text-muted-foreground/50",
                        formErrors.name
                          ? "border-destructive focus:border-destructive focus:ring-destructive/50"
                          : "border-white/10"
                      )}
                      required
                    />
                  </div>
                  {formErrors.name && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {formErrors.name}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-muted-foreground ml-1">
                      Email Address *
                    </label>
                    {otpVerified && (
                      <span className="text-xs text-green-500 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Verified
                      </span>
                    )}
                  </div>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input
                      type="email"
                      name="email"
                      placeholder="name@example.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={otpVerified || sendingOTP}
                      className={cn(
                        "w-full h-12 pl-12 pr-4 bg-secondary/30 border rounded-xl focus:border-primary/50 focus:ring-1 focus:ring-primary/50 focus:outline-none transition-all placeholder:text-muted-foreground/50",
                        formErrors.email
                          ? "border-destructive focus:border-destructive focus:ring-destructive/50"
                          : "border-white/10",
                        (otpVerified || sendingOTP) && "opacity-60 cursor-not-allowed"
                      )}
                      required
                    />
                  </div>
                  {formErrors.email && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {formErrors.email}
                    </p>
                  )}
                  {!otpVerified && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleSendOTP}
                      disabled={sendingOTP || !formData.email || otpCountdown > 0}
                      className="w-full"
                    >
                      {sendingOTP ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : otpSent && otpCountdown > 0 ? (
                        `Resend OTP in ${otpCountdown}s`
                      ) : otpSent ? (
                        "Resend OTP"
                      ) : (
                        "Send Verification Code"
                      )}
                    </Button>
                  )}
                </div>

                {/* OTP Verification */}
                {otpSent && !otpVerified && (
                  <div className="space-y-2 animate-in fade-in duration-300">
                    <label className="text-sm font-medium text-muted-foreground ml-1">
                      Enter OTP *
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        placeholder="000000"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        maxLength={6}
                        className="flex-1 text-center text-2xl tracking-widest font-mono h-12"
                        disabled={verifyingOTP}
                      />
                      <Button
                        type="button"
                        variant="hero"
                        onClick={handleVerifyOTP}
                        disabled={verifyingOTP || otp.length !== 6}
                        className="h-12 px-6"
                      >
                        {verifyingOTP ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "Verify"
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Enter the 6-digit code sent to {formData.email}
                    </p>
                  </div>
                )}

                {/* Password */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground ml-1">
                    Password *
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Create a strong password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className={cn(
                        "w-full h-12 pl-12 pr-12 bg-secondary/30 border rounded-xl focus:border-primary/50 focus:ring-1 focus:ring-primary/50 focus:outline-none transition-all placeholder:text-muted-foreground/50",
                        formErrors.password
                          ? "border-destructive focus:border-destructive focus:ring-destructive/50"
                          : "border-white/10"
                      )}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {formErrors.password && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {formErrors.password}
                    </p>
                  )}
                  {!formErrors.password && formData.password && (
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>Password must contain:</p>
                      <ul className="list-disc list-inside pl-2">
                        <li className={formData.password.length >= 8 ? "text-green-500" : ""}>
                          At least 8 characters
                        </li>
                        <li className={/[a-z]/.test(formData.password) ? "text-green-500" : ""}>
                          One lowercase letter
                        </li>
                        <li className={/[A-Z]/.test(formData.password) ? "text-green-500" : ""}>
                          One uppercase letter
                        </li>
                        <li className={/\d/.test(formData.password) ? "text-green-500" : ""}>
                          One number
                        </li>
                      </ul>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground ml-1">
                    Confirm Password *
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="confirmPassword"
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className={cn(
                        "w-full h-12 pl-12 pr-4 bg-secondary/30 border rounded-xl focus:border-primary/50 focus:ring-1 focus:ring-primary/50 focus:outline-none transition-all placeholder:text-muted-foreground/50",
                        formErrors.confirmPassword
                          ? "border-destructive focus:border-destructive focus:ring-destructive/50"
                          : "border-white/10"
                      )}
                      required
                    />
                  </div>
                  {formErrors.confirmPassword && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {formErrors.confirmPassword}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  variant="hero"
                  size="lg"
                  disabled={isSubmitting || !otpVerified}
                  className="w-full mt-6 shadow-glow hover:shadow-glow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </>
                  )}
                </Button>
              </form>

              {/* Terms and Conditions */}
              <p className="text-center mt-6 text-xs text-muted-foreground">
                By creating an account, you agree to our{" "}
                <Link to="/terms" className="text-primary hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link to="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
              </p>

              {/* Login Link */}
              <p className="text-center mt-6 text-muted-foreground text-sm">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="text-primary font-semibold hover:underline transition-colors"
                >
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

