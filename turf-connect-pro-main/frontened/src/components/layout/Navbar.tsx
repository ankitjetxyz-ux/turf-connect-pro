import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Menu,
  X,
  MapPin,
  LogIn,
  User,
  LogOut,
  LayoutDashboard,
} from "lucide-react";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  const isLoggedIn = !!token;

  const navLinks = [
    { path: "/", label: "Home" },
    { path: "/turfs", label: "Browse Turfs" },
    { path: "/tournaments", label: "Tournaments" },
    { path: "/about", label: "About" },
    { path: "/contact", label: "Contact" },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login");
  };

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "glass-effect shadow-elevated" : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4">
        <nav className="flex items-center justify-between h-16 md:h-20">

          {/* LOGO */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <MapPin className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-heading font-bold text-xl">
              Turf<span className="text-primary">Book</span>
            </span>
          </Link>

          {/* DESKTOP LINKS */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive(link.path)
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                {link.label}
              </Link>
            ))}
            {isLoggedIn && (
              <Link
                to="/chat"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive("/chat")
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                Chat
              </Link>
            )}
          </div>

          {/* DESKTOP ACTIONS */}
          <div className="hidden md:flex items-center gap-3">

            {!isLoggedIn && (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/login">
                    <LogIn className="w-4 h-4 mr-2" />
                    Login
                  </Link>
                </Button>

                <Button variant="hero" size="sm" asChild>
                  <Link to="/register">
                    <User className="w-4 h-4 mr-2" />
                    Register
                  </Link>
                </Button>
              </>
            )}

            {isLoggedIn && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    navigate(
                      role === "client"
                        ? "/client/dashboard"
                        : "/player/dashboard"
                    )
                  }
                >
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </>
            )}
          </div>

          {/* MOBILE MENU BUTTON */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X /> : <Menu />}
          </button>
        </nav>

        {/* MOBILE MENU */}
        {isOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 p-4 space-y-2 glass-effect border-b border-border/30 animate-slide-down">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive(link.path)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
            {isLoggedIn && (
              <Link
                to="/chat"
                onClick={() => setIsOpen(false)}
                className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive("/chat")
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                }`}
              >
                Chat
              </Link>
            )}

            <div className="pt-2 space-y-2">
              {!isLoggedIn && (
                <>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link to="/login">
                      <LogIn className="w-4 h-4 mr-2" />
                      Login
                    </Link>
                  </Button>
                  <Button variant="hero" className="w-full justify-start" asChild>
                    <Link to="/register">
                      <User className="w-4 h-4 mr-2" />
                      Register
                    </Link>
                  </Button>
                </>
              )}

              {isLoggedIn && (
                <>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      setIsOpen(false);
                      navigate(
                        role === "client"
                          ? "/client/dashboard"
                          : "/player/dashboard"
                      );
                    }}
                  >
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    Dashboard
                  </Button>
                  <Button
                    variant="destructive"
                    className="w-full justify-start"
                    onClick={() => {
                      setIsOpen(false);
                      handleLogout();
                    }}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
