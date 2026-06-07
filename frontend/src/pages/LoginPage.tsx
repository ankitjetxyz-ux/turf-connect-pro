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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  loginUser,
  googleAuth,
  setLoginPassword,
  setLoginPasswordViaGoogle,
} from "@/services/authService";
import { persistAuthSession } from "@/lib/authSession";
import { getApiErrorMessage } from "@/lib/apiConfig";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { useToast } from "@/components/ui/use-toast";
import { usePageSEO } from "@/hooks/usePageSEO";

function validatePassword(password: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters";
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    return "Use uppercase, lowercase, and a number";
  }
  return null;
}

const LoginPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  usePageSEO({
    title: "Login",
    description: "Sign in with email and password or Google.",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createConfirmPassword, setCreateConfirmPassword] = useState("");
  const [formData, setFormData] = useState({ email: "", password: "" });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const finishLogin = () => {
    navigate("/profile");
  };

  const handleGoogleSignIn = async (credential: string) => {
    setIsGoogleLoading(true);
    try {
      const res = await googleAuth({ credential, register: false });
      persistAuthSession(res.data);

      if (res.data.needsLoginPassword) {
        setShowPasswordModal(true);
        return;
      }

      finishLogin();
    } catch (err: unknown) {
      toast({
        title: "Unable to sign in",
        description: getApiErrorMessage(err, "Google sign-in failed."),
        variant: "destructive",
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const savePasswordAfterGoogleLogin = async () => {
    const err = validatePassword(newPassword);
    if (err) {
      toast({ title: "Invalid password", description: err, variant: "destructive" });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }

    setIsSavingPassword(true);
    try {
      await setLoginPassword(newPassword);
      toast({
        title: "Password saved",
        description: "You can now sign in with your email and password on any device.",
      });
      setShowPasswordModal(false);
      finishLogin();
    } catch (err: unknown) {
      toast({
        title: "Could not save password",
        description: getApiErrorMessage(err, "Please try again."),
        variant: "destructive",
      });
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleCreatePasswordViaGoogle = async (credential: string) => {
    const err = validatePassword(createPassword);
    if (err) {
      toast({ title: "Invalid password", description: err, variant: "destructive" });
      return;
    }
    if (createPassword !== createConfirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }

    setIsSavingPassword(true);
    try {
      const res = await setLoginPasswordViaGoogle(credential, createPassword);
      toast({
        title: "Password created",
        description: res.data.message,
      });
      if (res.data.email) {
        setFormData((prev) => ({ ...prev, email: res.data.email }));
      }
      setShowCreatePassword(false);
      setCreatePassword("");
      setCreateConfirmPassword("");
    } catch (err: unknown) {
      toast({
        title: "Could not create password",
        description: getApiErrorMessage(err, "Please try again."),
        variant: "destructive",
      });
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await loginUser(formData);
      persistAuthSession(res.data);
      finishLogin();
    } catch (err: unknown) {
      const response = (err as { response?: { data?: { error?: string; code?: string } } })
        ?.response?.data;
      const message = response?.error || (err instanceof Error ? err.message : "Login failed");

      if (response?.code === "PASSWORD_NOT_SET") {
        setShowCreatePassword(true);
      }

      toast({
        title: "Unable to sign in",
        description: message,
        variant: "destructive",
      });
    }
  };

  const passwordInputClass =
    "w-full h-12 pl-12 pr-12 bg-secondary/30 border border-white/10 rounded-xl focus:border-primary/50 focus:ring-1 focus:ring-primary/50 focus:outline-none transition-all placeholder:text-muted-foreground/50";

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      <div className="absolute inset-0 grid-overlay opacity-20" />
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] animate-pulse" />

      <Navbar />

      <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create a login password</DialogTitle>
            <DialogDescription>
              Optional but recommended — use your Google email and this password to sign in manually
              on any device without Google.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <input
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full h-11 px-4 rounded-lg border bg-background"
            />
            <input
              type="password"
              placeholder="Confirm password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              className="w-full h-11 px-4 rounded-lg border bg-background"
            />
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="ghost" onClick={finishLogin} disabled={isSavingPassword}>
              Skip for now
            </Button>
            <Button onClick={savePasswordAfterGoogleLogin} disabled={isSavingPassword}>
              {isSavingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <main className="pt-24 pb-12 flex-1 flex items-center justify-center relative z-10">
        <div className="container px-4 max-w-md">
          <Card className="glass-card border-white/10 shadow-elevated animate-slide-up">
            <CardHeader className="text-center pb-2">
              <div className="w-12 h-12 mx-auto mb-4 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
                <Lock className="w-6 h-6 text-primary-foreground" />
              </div>
              <Badge variant="outline" className="mx-auto mb-2 border-primary/20 text-primary">
                Welcome Back
              </Badge>
              <CardTitle className="text-3xl font-heading font-bold">Sign In</CardTitle>
              <CardDescription className="text-muted-foreground">
                Sign in with email and password, or use Google
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground ml-1">
                    Email Address
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input
                      type="email"
                      name="email"
                      placeholder="name@gmail.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full h-12 pl-12 pr-4 bg-secondary/30 border border-white/10 rounded-xl focus:border-primary/50 focus:ring-1 focus:ring-primary/50 focus:outline-none transition-all placeholder:text-muted-foreground/50"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground ml-1">Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleInputChange}
                      className={passwordInputClass}
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

                <Button
                  type="submit"
                  variant="hero"
                  size="lg"
                  className="w-full mt-2 shadow-glow hover:shadow-glow-lg transition-all"
                >
                  Sign In
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              {isGoogleLoading ? (
                <Button variant="outline" size="lg" className="w-full" disabled>
                  Signing in with Google...
                </Button>
              ) : (
                <GoogleSignInButton
                  mode="signin"
                  onCredential={handleGoogleSignIn}
                  onError={() =>
                    toast({ title: "Google sign-in cancelled", variant: "destructive" })
                  }
                />
              )}

              <div className="mt-6 rounded-xl border border-white/10 bg-secondary/20 p-4 space-y-3">
                <button
                  type="button"
                  onClick={() => setShowCreatePassword(!showCreatePassword)}
                  className="text-sm font-medium text-primary hover:underline w-full text-left"
                >
                  Registered with Google? Create a password for manual sign-in
                </button>

                {showCreatePassword && (
                  <div className="space-y-3 pt-1">
                    <p className="text-xs text-muted-foreground">
                      Choose a password, then verify with Google once. After that, use your Gmail
                      address and this password above.
                    </p>
                    <input
                      type="password"
                      placeholder="New password"
                      value={createPassword}
                      onChange={(e) => setCreatePassword(e.target.value)}
                      className="w-full h-11 px-4 rounded-lg border bg-background/50"
                    />
                    <input
                      type="password"
                      placeholder="Confirm password"
                      value={createConfirmPassword}
                      onChange={(e) => setCreateConfirmPassword(e.target.value)}
                      className="w-full h-11 px-4 rounded-lg border bg-background/50"
                    />
                    {isSavingPassword ? (
                      <Button variant="outline" className="w-full" disabled>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </Button>
                    ) : (
                      <GoogleSignInButton
                        mode="signin"
                        onCredential={handleCreatePasswordViaGoogle}
                        onError={() =>
                          toast({ title: "Google verification cancelled", variant: "destructive" })
                        }
                      />
                    )}
                  </div>
                )}
              </div>

              <p className="text-center mt-8 text-muted-foreground text-sm">
                Don&apos;t have an account?{" "}
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
