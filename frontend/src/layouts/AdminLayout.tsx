import { useEffect } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
    LayoutDashboard,
    ShieldCheck,
    LogOut,
    Menu
} from "lucide-react";

const AdminLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const token = localStorage.getItem("adminToken");

    useEffect(() => {
        if (!token) {
            navigate("/admin/login");
        }
    }, [token, navigate]);

    const handleLogout = () => {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        navigate("/admin/login");
    };

    if (!token) return null;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
            {/* Admin Navbar */}
            <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <div className="container flex h-16 items-center justify-between px-4">
                    <div className="flex items-center gap-6">
                        <Link to="/admin/dashboard" className="flex items-center gap-2 font-bold text-xl text-primary">
                            <ShieldCheck className="h-6 w-6" />
                            <span>Admin Portal</span>
                        </Link>

                        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
                            <Link
                                to="/admin/dashboard"
                                className={`transition-colors hover:text-primary ${location.pathname === '/admin/dashboard' ? 'text-primary' : 'text-muted-foreground'}`}
                            >
                                Dashboard
                            </Link>
                            <Link
                                to="/admin/verification"
                                className={`transition-colors hover:text-primary ${location.pathname.startsWith('/admin/verification') ? 'text-primary' : 'text-muted-foreground'}`}
                            >
                                Verification
                            </Link>
                        </nav>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden md:block text-xs text-muted-foreground">
                            Administrator
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleLogout}
                            className="gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900 dark:hover:bg-red-950"
                        >
                            <LogOut className="h-4 w-4" />
                            Logout
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 container py-6 px-4 md:px-6">
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;
