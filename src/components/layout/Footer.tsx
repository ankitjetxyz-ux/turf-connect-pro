import { Link } from "react-router-dom";
import { MapPin, Mail, Phone, Facebook, Twitter, Instagram, Youtube, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const Footer = () => {
  return (
    <footer className="relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-card" />
      <div className="absolute inset-0 grid-overlay opacity-20" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px]" />

      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          {/* Brand */}
          <div className="space-y-5">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-11 h-11 rounded-xl gradient-primary flex items-center justify-center shadow-glow-sm group-hover:shadow-glow transition-shadow duration-300">
                <MapPin className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-heading font-bold text-xl text-foreground">
                Turf<span className="text-primary">Book</span>
              </span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed">
              India's leading turf booking platform. Find and book sports turfs near you with ease.
            </p>
            <div className="flex gap-2">
              {[
                { icon: Facebook, label: "Facebook" },
                { icon: Twitter, label: "Twitter" },
                { icon: Instagram, label: "Instagram" },
                { icon: Youtube, label: "Youtube" },
              ].map(({ icon: Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="w-10 h-10 rounded-xl glass-effect flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 transition-all duration-300"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-heading font-semibold text-foreground mb-5">Quick Links</h4>
            <ul className="space-y-3">
              {[
                { label: "Browse Turfs", href: "/turfs" },
                { label: "Tournaments", href: "/tournaments" },
                { label: "Collaborative Play", href: "#" },
                { label: "Offers & Deals", href: "#" },
              ].map((item) => (
                <li key={item.label}>
                  <Link 
                    to={item.href} 
                    className="text-muted-foreground hover:text-primary text-sm transition-colors inline-flex items-center gap-1 group"
                  >
                    {item.label}
                    <ArrowUpRight className="w-3 h-3 opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Business */}
          <div>
            <h4 className="font-heading font-semibold text-foreground mb-5">For Business</h4>
            <ul className="space-y-3">
              {[
                { label: "List Your Turf", href: "#" },
                { label: "Partner Program", href: "#" },
                { label: "Advertising", href: "#" },
                { label: "API Access", href: "#" },
              ].map((item) => (
                <li key={item.label}>
                  <a 
                    href={item.href} 
                    className="text-muted-foreground hover:text-primary text-sm transition-colors inline-flex items-center gap-1 group"
                  >
                    {item.label}
                    <ArrowUpRight className="w-3 h-3 opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & Newsletter */}
          <div>
            <h4 className="font-heading font-semibold text-foreground mb-5">Contact Us</h4>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-3 text-muted-foreground text-sm">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-primary" />
                </div>
                support@turfbook.com
              </li>
              <li className="flex items-center gap-3 text-muted-foreground text-sm">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4 text-primary" />
                </div>
                +91 9876 543 210
              </li>
              <li className="flex items-start gap-3 text-muted-foreground text-sm">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-primary" />
                </div>
                123 Sports Complex, Mumbai, India
              </li>
            </ul>
            
            {/* Newsletter */}
            <div className="glass-effect rounded-xl p-4">
              <p className="text-sm text-muted-foreground mb-3">Subscribe to our newsletter</p>
              <div className="flex gap-2">
                <input 
                  type="email" 
                  placeholder="Enter email..."
                  className="flex-1 bg-secondary/50 rounded-lg px-3 py-2 text-sm border border-border/30 focus:border-primary/50 focus:outline-none transition-colors"
                />
                <Button variant="hero" size="sm">
                  Subscribe
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border/30 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground text-sm">
            © 2024 TurfBook. All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center gap-6">
            {["Privacy Policy", "Terms of Service", "Cookie Policy"].map((item) => (
              <a 
                key={item} 
                href="#" 
                className="text-muted-foreground hover:text-primary text-sm transition-colors"
              >
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
