import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, MapPin, User, LogIn } from "lucide-react";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { path: "/", label: "Home" },
    { path: "/turfs", label: "Browse Turfs" },
    { path: "/tournaments", label: "Tournaments" },
    { path: "/about", label: "About" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-effect">
      <div className="container mx-auto px-4">
        <nav className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center shadow-glow group-hover:scale-110 transition-transform duration-300">
              <MapPin className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-heading font-bold text-xl text-foreground">
              Turf<span className="text-primary">Book</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`font-medium text-sm transition-colors duration-200 relative py-2 ${
                  isActive(link.path)
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {link.label}
                {isActive(link.path) && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 gradient-primary rounded-full" />
                )}
              </Link>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/login" className="flex items-center gap-2">
                <LogIn className="w-4 h-4" />
                Login
              </Link>
            </Button>
            <Button variant="hero" size="sm" asChild>
              <Link to="/register" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Register
              </Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-foreground hover:text-primary transition-colors"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </nav>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden pb-6 animate-slide-down">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                    isActive(link.path)
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <div className="flex gap-2 mt-4 px-4">
                <Button variant="outline" className="flex-1" asChild>
                  <Link to="/login">Login</Link>
                </Button>
                <Button variant="hero" className="flex-1" asChild>
                  <Link to="/register">Register</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
