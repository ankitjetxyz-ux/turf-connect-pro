import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Calendar, ArrowRight } from "lucide-react";
import heroImage from "@/assets/hero-turf.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Sports turf arena"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-background/40" />
      </div>

      {/* Content */}
      <div className="container relative z-10 px-4 pt-20">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          {/* Badge */}
          <div className="animate-slide-down opacity-0 stagger-1">
            <Badge variant="premium" className="px-4 py-2">
              🏟️ India's #1 Turf Booking Platform
            </Badge>
          </div>

          {/* Heading */}
          <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight animate-slide-up opacity-0 stagger-2">
            Book Your Perfect
            <span className="text-gradient block mt-2">Sports Turf</span>
          </h1>

          {/* Subtitle */}
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto animate-slide-up opacity-0 stagger-3">
            Discover and book premium sports turfs near you. Football, cricket, badminton & more – all in one place.
          </p>

          {/* Search Box */}
          <div className="animate-scale-in opacity-0 stagger-4">
            <div className="glass-effect rounded-2xl p-2 max-w-2xl mx-auto">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1 flex items-center gap-3 bg-secondary/50 rounded-xl px-4 py-3">
                  <MapPin className="w-5 h-5 text-primary" />
                  <input
                    type="text"
                    placeholder="Enter your location..."
                    className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <div className="flex-1 flex items-center gap-3 bg-secondary/50 rounded-xl px-4 py-3">
                  <Calendar className="w-5 h-5 text-primary" />
                  <input
                    type="text"
                    placeholder="Select date..."
                    className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <Button variant="hero" size="lg" className="w-full sm:w-auto">
                  <Search className="w-5 h-5" />
                  Search
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
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="font-heading text-2xl md:text-3xl font-bold text-primary">
                  {stat.value}
                </div>
                <div className="text-muted-foreground text-xs md:text-sm">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up opacity-0 stagger-5">
            <Button variant="hero" size="xl">
              Explore Turfs
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button variant="glass" size="xl">
              List Your Turf
            </Button>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-float">
        <div className="w-6 h-10 rounded-full border-2 border-primary/50 flex items-start justify-center p-2">
          <div className="w-1.5 h-2.5 bg-primary rounded-full animate-bounce" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
