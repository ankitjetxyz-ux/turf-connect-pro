import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const AdminLogin = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { toast } = useToast();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await api.post("/admin/login", { email, password });

            // api.ts interceptor handles standard errors, but we can check response.data
            const data = response.data;

            if (data.success || data.token) {
                // Store token
                localStorage.setItem("adminToken", data.token);
                localStorage.setItem("adminUser", JSON.stringify(data.admin));

                toast({
                    title: "Access Granted",
                    description: "Welcome to the Admin Portal.",
                });

                navigate("/manage/dashboard");
            } else {
                throw new Error(data.error || "Login failed");
            }
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Access Denied",
                description: error.response?.data?.error || "Invalid credentials",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-950">
            <Card className="w-full max-w-md border-slate-800 bg-slate-900 text-slate-50">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-4">
                        {/* Simple Logo Placeholder */}
                        <div className="h-12 w-12 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-xl">
                            BM
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight text-white">Admin Portal</CardTitle>
                    <CardDescription className="text-slate-400">
                        Secure access for authorized personnel only
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleLogin}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="bg-slate-800 border-slate-700 text-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="bg-slate-800 border-slate-700 text-white"
                            />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isLoading}
                        >
                            {isLoading ? "Authenticating..." : "Access Dashboard"}
                        </Button>
                    </CardFooter>
                </form>
                <div className="px-6 pb-6 text-center text-xs text-slate-500">
                    Unauthorized access attempts are logged and monitored.
                </div>
            </Card>
        </div>
    );
};

export default AdminLogin;
