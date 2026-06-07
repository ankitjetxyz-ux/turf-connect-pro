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
import { Lock } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { googleAuth } from "@/services/authService";
import { persistAuthSession } from "@/lib/authSession";
import { getApiErrorMessage } from "@/lib/apiConfig";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { useToast } from "@/components/ui/use-toast";
import { usePageSEO } from "@/hooks/usePageSEO";

const LoginPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  usePageSEO({
    title: "Login",
    description: "Sign in to TurfBook with your Google account.",
  });

  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleGoogleSignIn = async (credential: string) => {
    setIsGoogleLoading(true);
    try {
      const res = await googleAuth({ credential, register: false });
      persistAuthSession(res.data);
      navigate("/profile");
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
              <Badge variant="outline" className="mx-auto mb-2 border-primary/20 text-primary">
                Welcome Back
              </Badge>
              <CardTitle className="text-3xl font-heading font-bold">Sign In</CardTitle>
              <CardDescription className="text-muted-foreground">
                Sign in with Google using the same account you registered with.
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-6">
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

              <p className="text-xs text-center text-muted-foreground mt-4">
                Google will ask for your Gmail and password securely — TurfBook never sees your
                Google password.
              </p>

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
