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
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "@/services/authService";

const RegisterPage = () => {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"player" | "client">("player");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      await registerUser({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: selectedRole,
      });

      alert("Registration successful. Please login.");
      navigate("/login");
    } catch (err: unknown) {
      console.error(err);
      // Extract backend error message if available
      const backendError = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      const message = backendError || (err instanceof Error ? err.message : "Registration failed");
      alert(message);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 grid-overlay opacity-20" />
      <div className="absolute top-3/4 right-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] animate-pulse" />

      <Navbar />

      <main className="pt-24 pb-12 flex items-center justify-center min-h-screen relative z-10">
        <div className="container px-4 max-w-lg">
          <Card className="glass-card border-white/10 shadow-elevated animate-slide-up">
            <CardHeader className="text-center pb-2">
              <div className="w-12 h-12 mx-auto mb-4 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
                <User className="w-6 h-6 text-primary-foreground" />
              </div>
              <Badge variant="outline" className="mx-auto mb-2 border-primary/20 text-primary">Create Account</Badge>
              <CardTitle className="text-3xl font-heading font-bold">Join TurfBook</CardTitle>
              <CardDescription className="text-muted-foreground">
                Sign up to start booking sports turfs
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-6">
              {/* Role Selection */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <button
                  type="button"
                  onClick={() => setSelectedRole("player")}
                  className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                    selectedRole === "player"
                      ? "border-primary bg-primary/5 shadow-glow-sm"
                      : "border-white/10 hover:border-white/20 bg-secondary/30"
                  }`}
                >
                  <UsersIcon className={`mx-auto mb-2 w-6 h-6 ${selectedRole === "player" ? "text-primary" : "text-muted-foreground"}`} />
                  <span className={`font-semibold ${selectedRole === "player" ? "text-foreground" : "text-muted-foreground"}`}>Player</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole("client")}
                  className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                    selectedRole === "client"
                      ? "border-primary bg-primary/5 shadow-glow-sm"
                      : "border-white/10 hover:border-white/20 bg-secondary/30"
                  }`}
                >
                  <Building2 className={`mx-auto mb-2 w-6 h-6 ${selectedRole === "client" ? "text-primary" : "text-muted-foreground"}`} />
                  <span className={`font-semibold ${selectedRole === "client" ? "text-foreground" : "text-muted-foreground"}`}>Turf Owner</span>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground ml-1">Full Name</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input
                      type="text"
                      name="name"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full h-12 pl-12 pr-4 bg-secondary/30 border border-white/10 rounded-xl focus:border-primary/50 focus:ring-1 focus:ring-primary/50 focus:outline-none transition-all placeholder:text-muted-foreground/50"
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground ml-1">Email Address</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input
                      type="email"
                      name="email"
                      placeholder="name@example.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full h-12 pl-12 pr-4 bg-secondary/30 border border-white/10 rounded-xl focus:border-primary/50 focus:ring-1 focus:ring-primary/50 focus:outline-none transition-all placeholder:text-muted-foreground/50"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground ml-1">Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Create a password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full h-12 pl-12 pr-12 bg-secondary/30 border border-white/10 rounded-xl focus:border-primary/50 focus:ring-1 focus:ring-primary/50 focus:outline-none transition-all placeholder:text-muted-foreground/50"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground ml-1">Confirm Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="confirmPassword"
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="w-full h-12 pl-12 pr-4 bg-secondary/30 border border-white/10 rounded-xl focus:border-primary/50 focus:ring-1 focus:ring-primary/50 focus:outline-none transition-all placeholder:text-muted-foreground/50"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" variant="hero" size="lg" className="w-full mt-4 shadow-glow hover:shadow-glow-lg transition-all">
                  Create Account
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </form>

              <p className="text-center mt-8 text-muted-foreground text-sm">
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
