import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, MapPin, User, LogIn } from "lucide-react";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  const navLinks = [
    { path: "/", label: "Home" },
    { path: "/turfs", label: "Browse Turfs" },
    { path: "/tournaments", label: "Tournaments" },
    { path: "/about", label: "About" },
  ];

  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled 
          ? 'glass-effect shadow-elevated' 
          : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4">
        <nav className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow-sm group-hover:shadow-glow group-hover:scale-105 transition-all duration-300">
              <MapPin className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-heading font-bold text-xl text-foreground">
              Turf<span className="text-primary">Book</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`relative px-4 py-2 font-medium text-sm transition-all duration-300 rounded-lg ${
                  isActive(link.path)
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                {link.label}
                {isActive(link.path) && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                )}
              </Link>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild className="hover:bg-secondary/50">
              <Link to="/login" className="flex items-center gap-2">
                <LogIn className="w-4 h-4" />
                Login
              </Link>
            </Button>
            <Button variant="hero" size="sm" asChild className="shadow-glow-sm hover:shadow-glow transition-shadow duration-300">
              <Link to="/register" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Register
              </Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg text-foreground hover:text-primary hover:bg-secondary/50 transition-all duration-300"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </nav>

        {/* Mobile Navigation */}
        <div 
          className={`md:hidden overflow-hidden transition-all duration-300 ${
            isOpen ? 'max-h-[400px] opacity-100 pb-6' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="flex flex-col gap-1 pt-2">
            {navLinks.map((link, index) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={`px-4 py-3 rounded-xl font-medium transition-all duration-300 animate-slide-right opacity-0 ${
                  isActive(link.path)
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
                style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'forwards' }}
              >
                {link.label}
              </Link>
            ))}
            <div className="flex gap-2 mt-4 px-1">
              <Button variant="outline" className="flex-1" asChild>
                <Link to="/login" onClick={() => setIsOpen(false)}>Login</Link>
              </Button>
              <Button variant="hero" className="flex-1 shadow-glow-sm" asChild>
                <Link to="/register" onClick={() => setIsOpen(false)}>Register</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
