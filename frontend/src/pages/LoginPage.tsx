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
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "@/services/authService";
import { useToast } from "@/components/ui/use-toast";
import { usePageSEO } from "@/hooks/usePageSEO";


const LoginPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  usePageSEO({ title: "Login", description: "Login to your TurfBook account to manage bookings and profile." });


  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await loginUser(formData);

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.user.role);
      localStorage.setItem("user_id", res.data.user.id);
      localStorage.setItem("name", res.data.user.name || "");
      localStorage.setItem("email", res.data.user.email || formData.email);
      if (res.data.user.profile_image_url) {
        localStorage.setItem("profile_image_url", res.data.user.profile_image_url);
      }

      const role = res.data.user.role;

      if (role === "player" || role === "client") {
        navigate("/profile");
      }
    } catch (err: unknown) {
      console.error(err);
      const backendError = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      const message = backendError || (err instanceof Error ? err.message : "Login failed");
      toast({
        title: "Unable to sign in",
        description: message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      <div className="absolute inset-0 grid-overlay opacity-20" />
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] animate-pulse" />

      <Navbar />

      <main className="pt-24 pb-12 flex-1 flex items-center justify-center relative z-10">
        <div className="container px-4 max-w-md">
          <Card className="glass-card border-white/10 shadow-elevated animate-slide-up">
            <CardHeader className="text-center pb-2">
              <div className="w-12 h-12 mx-auto mb-4 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
                <Lock className="w-6 h-6 text-primary-foreground" />
              </div>
              <Badge variant="outline" className="mx-auto mb-2 border-primary/20 text-primary">Welcome Back</Badge>
              <CardTitle className="text-3xl font-heading font-bold">Sign In</CardTitle>
              <CardDescription className="text-muted-foreground">
                Enter your credentials to access your account
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
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
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-sm font-medium text-muted-foreground">Password</label>
                    <Link to="/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</Link>
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="••••••••"
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
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                <Button type="submit" variant="hero" size="lg" className="w-full mt-2 shadow-glow hover:shadow-glow-lg transition-all">
                  Sign In
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </form>

              <p className="text-center mt-8 text-muted-foreground text-sm">
                Don't have an account?{" "}
                <Link to="/register" className="text-primary font-semibold hover:underline">
                  Sign up
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

export default LoginPage;
