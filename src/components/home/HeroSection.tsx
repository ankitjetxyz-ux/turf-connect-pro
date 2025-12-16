import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Calendar, ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-turf.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Sports turf arena"
          className="w-full h-full object-cover scale-105 animate-[scale-in_1.5s_ease-out]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/70 to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-transparent to-background/60" />
      </div>

      {/* Grid Overlay - Enhanced */}
      <div className="absolute inset-0 grid-overlay-intense opacity-70" />
      
      {/* Ambient Glow Effects */}
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-primary/12 rounded-full blur-[120px] animate-glow-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-primary/8 rounded-full blur-[100px] animate-glow-pulse" style={{ animationDelay: '1s' }} />

      {/* Content */}
      <div className="container relative z-10 px-4 pt-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Badge */}
          <div className="animate-slide-down opacity-0 stagger-1">
            <Badge variant="premium" className="px-4 py-2 neon-border">
              <Sparkles className="w-4 h-4 mr-2" />
              India's #1 Turf Booking Platform
            </Badge>
          </div>

          {/* Heading */}
          <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight animate-slide-up opacity-0 stagger-2">
            <span className="inline-block">Book Your Perfect</span>
            <span className="text-gradient block mt-2 neon-glow">Sports Turf</span>
          </h1>

          {/* Subtitle */}
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto animate-slide-up opacity-0 stagger-3 leading-relaxed">
            Discover and book premium sports turfs near you. Football, cricket, badminton & more – all in one place.
          </p>

          {/* Search Box */}
          <div className="animate-scale-in opacity-0 stagger-4">
            <div className="glass-effect rounded-2xl p-2 max-w-2xl mx-auto shadow-elevated hover:shadow-glow transition-shadow duration-500">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1 flex items-center gap-3 bg-secondary/60 rounded-xl px-4 py-3.5 border border-border/30 transition-all duration-300 focus-within:border-primary/50 focus-within:bg-secondary/80">
                  <MapPin className="w-5 h-5 text-primary shrink-0" />
                  <input
                    type="text"
                    placeholder="Enter your location..."
                    className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-sm"
                  />
                </div>
                <div className="flex-1 flex items-center gap-3 bg-secondary/60 rounded-xl px-4 py-3.5 border border-border/30 transition-all duration-300 focus-within:border-primary/50 focus-within:bg-secondary/80">
                  <Calendar className="w-5 h-5 text-primary shrink-0" />
                  <input
                    type="text"
                    placeholder="Select date..."
                    className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-sm"
                  />
                </div>
                <Button variant="hero" size="lg" className="w-full sm:w-auto shadow-glow-sm hover:shadow-glow transition-shadow duration-300">
                  <Search className="w-5 h-5" />
                  <span className="hidden sm:inline">Search</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 md:gap-8 max-w-lg mx-auto animate-fade-in opacity-0 stagger-5">
            {[
              { value: "500+", label: "Turfs Listed" },
              { value: "50K+", label: "Happy Players" },
              { value: "100+", label: "Cities" },
            ].map((stat, index) => (
              <div 
                key={stat.label} 
                className="text-center p-4 rounded-xl glass-card hover:bg-secondary/30 transition-all duration-300 group"
              >
                <div className="font-heading text-2xl md:text-3xl font-bold text-primary group-hover:neon-glow transition-all duration-300">
                  {stat.value}
                </div>
                <div className="text-muted-foreground text-xs md:text-sm mt-1">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up opacity-0 stagger-5">
            <Button variant="hero" size="xl" className="group shadow-glow hover:shadow-elevated transition-all duration-300" asChild>
              <Link to="/turfs">
                Explore Turfs
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button variant="glass" size="xl" className="hover:bg-secondary/50 transition-all duration-300" asChild>
              <Link to="/register">List Your Turf</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-float">
        <div className="w-7 h-11 rounded-full border-2 border-primary/40 flex items-start justify-center p-2 glass-effect">
          <div className="w-1.5 h-3 bg-primary rounded-full animate-bounce" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
