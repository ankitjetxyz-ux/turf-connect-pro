import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
    CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
    Mail,
    Lock,
    ArrowLeft,
    CheckCircle2,
    Loader2,
    Shield,
    Key,
    MailCheck,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { forgotPassword, resetPassword, sendOTP, verifyOTP } from "@/services/authService";

const ForgotPasswordPage = () => {
    const navigate = useNavigate();
    const { toast } = useToast();

    // State for the current step
    const [step, setStep] = useState<"email" | "otp" | "reset" | "success">("email");

    // Form states
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // UI states
    const [loading, setLoading] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [otpVerified, setOtpVerified] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [showPassword, setShowPassword] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);

    // Password strength checker
    const checkPasswordStrength = (password: string) => {
        let strength = 0;
        if (password.length >= 8) strength += 1;
        if (/[A-Z]/.test(password)) strength += 1;
        if (/[a-z]/.test(password)) strength += 1;
        if (/[0-9]/.test(password)) strength += 1;
        if (/[^A-Za-z0-9]/.test(password)) strength += 1;
        return strength;
    };

    // Handle password change
    const handlePasswordChange = (value: string) => {
        setNewPassword(value);
        setPasswordStrength(checkPasswordStrength(value));
    };

    // Countdown timer for OTP resend
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    // Validate email format
    const isValidEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    // Step 1: Send OTP to email
    const handleSendOTP = async () => {
        if (!email) {
            toast({
                title: "Email required",
                description: "Please enter your email address",
                variant: "destructive",
            });
            return;
        }

        if (!isValidEmail(email)) {
            toast({
                title: "Invalid email",
                description: "Please enter a valid email address",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);
        try {
            // Call forgot password API (this will trigger OTP sending)
            await forgotPassword(email);

            // Then send OTP for password reset
            await sendOTP(email, "password_reset");

            setOtpSent(true);
            setStep("otp");
            setCountdown(60); // 1 minute countdown for resend

            toast({
                title: "OTP sent successfully",
                description: "Check your email for the verification code",
            });
        } catch (err: any) {
            const errorMessage = err.response?.data?.error || err.message || "Failed to send OTP";
            toast({
                title: "Failed to send OTP",
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Verify OTP
    const handleVerifyOTP = async () => {
        if (!otp || otp.length !== 6) {
            toast({
                title: "Invalid OTP",
                description: "Please enter a valid 6-digit OTP code",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);
        try {
            await verifyOTP(email, otp, "password_reset");
            setOtpVerified(true);
            setStep("reset");

            toast({
                title: "OTP verified",
                description: "You can now set your new password",
            });
        } catch (err: any) {
            const errorMessage = err.response?.data?.error || "Invalid OTP";
            toast({
                title: "Verification failed",
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    // Step 3: Reset Password
    const handleResetPassword = async () => {
        // Validate passwords
        if (newPassword.length < 8) {
            toast({
                title: "Password too short",
                description: "Password must be at least 8 characters long",
                variant: "destructive",
            });
            return;
        }

        if (passwordStrength < 3) {
            toast({
                title: "Weak password",
                description: "Password must include uppercase, lowercase, and numbers",
                variant: "destructive",
            });
            return;
        }

        if (newPassword !== confirmPassword) {
            toast({
                title: "Passwords don't match",
                description: "Please make sure both passwords match",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);
        try {
            await resetPassword(email, otp, newPassword);
            setStep("success");

            toast({
                title: "Password reset successful",
                description: "You can now sign in with your new password",
            });
        } catch (err: any) {
            const errorMessage = err.response?.data?.error || "Failed to reset password";
            toast({
                title: "Reset failed",
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    // Resend OTP
    const handleResendOTP = async () => {
        if (countdown > 0) {
            toast({
                title: "Please wait",
                description: `You can resend OTP in ${countdown} seconds`,
                variant: "destructive",
            });
            return;
        }

        setLoading(true);
        try {
            await sendOTP(email, "password_reset");
            setCountdown(60);

            toast({
                title: "OTP resent",
                description: "A new OTP has been sent to your email",
            });
        } catch (err: any) {
            const errorMessage = err.response?.data?.error || "Failed to resend OTP";
            toast({
                title: "Resend failed",
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    // Render step indicator
    const renderStepIndicator = () => {
        const steps = [
            { id: "email", label: "Enter Email", icon: Mail },
            { id: "otp", label: "Verify OTP", icon: Shield },
            { id: "reset", label: "New Password", icon: Key },
            { id: "success", label: "Complete", icon: CheckCircle2 },
        ];

        return (
            <div className="flex justify-between items-center mb-8 relative">
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700 -translate-y-1/2 z-0" />
                {steps.map((stepItem, index) => {
                    const Icon = stepItem.icon;
                    const isActive = step === stepItem.id;
                    const isCompleted =
                        (step === "otp" && index < 1) ||
                        (step === "reset" && index < 2) ||
                        (step === "success" && index < 3);

                    return (
                        <div key={stepItem.id} className="flex flex-col items-center relative z-10">
                            <div className={`
                w-10 h-10 rounded-full flex items-center justify-center mb-2
                ${isActive ? 'bg-primary text-primary-foreground' :
                                    isCompleted ? 'bg-green-500 text-white' :
                                        'bg-gray-200 dark:bg-gray-700 text-gray-500'}
                transition-all duration-300
              `}>
                                <Icon className="w-5 h-5" />
                            </div>
                            <span className={`
                text-xs font-medium
                ${isActive || isCompleted ? 'text-foreground' : 'text-muted-foreground'}
              `}>
                                {stepItem.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        );
    };

    // Render step content
    const renderStepContent = () => {
        switch (step) {
            case "email":
                return (
                    <>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="name@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-10"
                                        disabled={loading}
                                    />
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Enter the email address associated with your account
                                </p>
                            </div>

                            <Button
                                onClick={handleSendOTP}
                                disabled={loading || !email || !isValidEmail(email)}
                                className="w-full"
                                size="lg"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Sending OTP...
                                    </>
                                ) : (
                                    <>
                                        Send Verification Code
                                        <MailCheck className="ml-2 w-4 h-4" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </>
                );

            case "otp":
                return (
                    <>
                        <div className="space-y-4">
                            <div className="text-center">
                                <p className="text-sm text-muted-foreground mb-2">
                                    We sent a 6-digit verification code to
                                </p>
                                <p className="font-medium">{email}</p>
                                <Button
                                    variant="link"
                                    size="sm"
                                    onClick={() => setStep("email")}
                                    className="mt-2"
                                >
                                    Change email
                                </Button>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="otp">Enter Verification Code</Label>
                                <Input
                                    id="otp"
                                    type="text"
                                    placeholder="000000"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                    maxLength={6}
                                    className="text-center text-2xl font-mono tracking-widest"
                                    disabled={loading}
                                />
                                <div className="flex justify-between items-center">
                                    <p className="text-sm text-muted-foreground">
                                        Enter the 6-digit code
                                    </p>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleResendOTP}
                                        disabled={loading || countdown > 0}
                                    >
                                        {countdown > 0 ? `Resend (${countdown}s)` : "Resend OTP"}
                                    </Button>
                                </div>
                            </div>

                            <Button
                                onClick={handleVerifyOTP}
                                disabled={loading || otp.length !== 6}
                                className="w-full"
                                size="lg"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Verifying...
                                    </>
                                ) : (
                                    "Verify Code"
                                )}
                            </Button>
                        </div>
                    </>
                );

            case "reset":
                return (
                    <>
                        <div className="space-y-4">
                            <div className="text-center mb-4">
                                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-2" />
                                <p className="font-medium">Email Verified Successfully</p>
                                <p className="text-sm text-muted-foreground">
                                    Now create a new password for your account
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="newPassword">New Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                    <Input
                                        id="newPassword"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Create a strong password"
                                        value={newPassword}
                                        onChange={(e) => handlePasswordChange(e.target.value)}
                                        className="pl-10 pr-10"
                                        disabled={loading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        {showPassword ? "Hide" : "Show"}
                                    </button>
                                </div>

                                {/* Password strength meter */}
                                {newPassword && (
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs">
                                            <span>Password strength:</span>
                                            <span className={`
                        ${passwordStrength >= 4 ? 'text-green-500' :
                                                    passwordStrength >= 3 ? 'text-yellow-500' :
                                                        'text-red-500'}
                      `}>
                                                {passwordStrength === 0 ? 'Very Weak' :
                                                    passwordStrength === 1 ? 'Weak' :
                                                        passwordStrength === 2 ? 'Fair' :
                                                            passwordStrength === 3 ? 'Good' : 'Strong'}
                                            </span>
                                        </div>
                                        <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div
                                                className={`
                          h-full transition-all duration-300
                          ${passwordStrength >= 4 ? 'bg-green-500' :
                                                        passwordStrength >= 3 ? 'bg-yellow-500' :
                                                            'bg-red-500'}
                        `}
                                                style={{ width: `${(passwordStrength / 5) * 100}%` }}
                                            />
                                        </div>
                                        <ul className="text-xs text-muted-foreground space-y-1 mt-2">
                                            <li className={newPassword.length >= 8 ? "text-green-500" : ""}>
                                                • At least 8 characters
                                            </li>
                                            <li className={/[A-Z]/.test(newPassword) ? "text-green-500" : ""}>
                                                • At least one uppercase letter
                                            </li>
                                            <li className={/[a-z]/.test(newPassword) ? "text-green-500" : ""}>
                                                • At least one lowercase letter
                                            </li>
                                            <li className={/[0-9]/.test(newPassword) ? "text-green-500" : ""}>
                                                • At least one number
                                            </li>
                                        </ul>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                    <Input
                                        id="confirmPassword"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Confirm your new password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="pl-10"
                                        disabled={loading}
                                    />
                                </div>
                                {confirmPassword && newPassword !== confirmPassword && (
                                    <p className="text-sm text-red-500">
                                        Passwords do not match
                                    </p>
                                )}
                            </div>

                            <Button
                                onClick={handleResetPassword}
                                disabled={
                                    loading ||
                                    newPassword.length < 8 ||
                                    passwordStrength < 3 ||
                                    newPassword !== confirmPassword
                                }
                                className="w-full"
                                size="lg"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Resetting Password...
                                    </>
                                ) : (
                                    "Reset Password"
                                )}
                            </Button>
                        </div>
                    </>
                );

            case "success":
                return (
                    <div className="text-center space-y-6">
                        <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                        </div>

                        <div>
                            <h3 className="text-xl font-bold mb-2">Password Reset Successful!</h3>
                            <p className="text-muted-foreground">
                                Your password has been reset successfully. You can now sign in with your new password.
                            </p>
                        </div>

                        <div className="bg-green-50 dark:bg-green-900/10 p-4 rounded-lg">
                            <p className="text-sm text-green-800 dark:text-green-300">
                                <strong>Security Tip:</strong> For your security, we recommend:
                            </p>
                            <ul className="text-sm text-green-700 dark:text-green-400 text-left mt-2 space-y-1">
                                <li>• Use a password manager</li>
                                <li>• Enable two-factor authentication</li>
                                <li>• Don't reuse passwords across sites</li>
                                <li>• Log out from all devices after reset</li>
                            </ul>
                        </div>

                        <div className="space-y-3">
                            <Button
                                onClick={() => navigate("/login")}
                                className="w-full"
                                size="lg"
                            >
                                Sign In Now
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => navigate("/")}
                                className="w-full"
                            >
                                Go to Homepage
                            </Button>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
            <Navbar />

            <main className="container mx-auto px-4 py-12 max-w-md">
                <div className="mb-6">
                    <Button
                        variant="ghost"
                        onClick={() => navigate(-1)}
                        className="mb-4"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>

                    <div className="text-center mb-8">
                        <Badge variant="outline" className="mb-2">
                            Account Recovery
                        </Badge>
                        <h1 className="text-3xl font-bold tracking-tight mb-2">
                            Reset Your Password
                        </h1>
                        <p className="text-muted-foreground">
                            Follow the steps to securely reset your password
                        </p>
                    </div>
                </div>

                <Card className="shadow-lg border-primary/10">
                    <CardHeader>
                        {renderStepIndicator()}
                    </CardHeader>

                    <CardContent>
                        {renderStepContent()}
                    </CardContent>

                    {step !== "success" && (
                        <CardFooter className="border-t pt-6">
                            <div className="w-full">
                                <div className="flex items-center text-sm text-muted-foreground">
                                    <Shield className="w-4 h-4 mr-2" />
                                    <span>
                                        This process is secure and your information is protected
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">
                                    Having trouble?{" "}
                                    <button
                                        onClick={() => navigate("/contact")}
                                        className="text-primary hover:underline"
                                    >
                                        Contact support
                                    </button>
                                </p>
                            </div>
                        </CardFooter>
                    )}
                </Card>

                {/* Security Tips */}
                <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                    <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">
                        🔒 Security Reminders
                    </h4>
                    <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                        <li>• Never share your password or OTP with anyone</li>
                        <li>• Our team will never ask for your password</li>
                        <li>• OTPs expire after 5 minutes for security</li>
                        <li>• Check for "turfconnect.com" in the sender email</li>
                    </ul>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default ForgotPasswordPage;