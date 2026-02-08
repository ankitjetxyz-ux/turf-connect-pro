import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

import heroBg from "@/assets/hero-bg-bk2.jpeg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-start overflow-hidden pt-28">
      {/* Background Gradients */}
      <div className="absolute inset-0 bg-background" />

      {/* Dull Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroBg}
          alt="Hero Background"
          className="w-full h-full object-cover opacity-80 brightness-90"
          style={{ objectPosition: '10% 35%' }}
        />
        <div className="absolute inset-0 bg-background/30" /> {/* Overlay to further dull it */}
      </div>

      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background/40 to-background/80" />

      {/* Grid Overlay */}
      <div className="absolute inset-0 grid-overlay-intense opacity-50 z-0" />



      {/* Content */}
      <div className="w-full mx-auto px-4 relative z-10">
        <div className="w-full text-right space-y-8 max-w-max ml-auto">
          {/* Heading */}
          <h1 className="animate-slide-up opacity-0 stagger-2 whitespace-nowrap leading-none"
            style={{
              fontFamily: '"Inter Display", sans-serif',
              fontSize: '10.2vw', // Reverted to occupy full breadth
              fontWeight: 900,
              fontStyle: 'normal',
              letterSpacing: '-0.04em',
              color: 'rgb(255, 255, 255)',
              textTransform: 'uppercase',
              transform: 'scaleY(2.2)'
            }}>
            BOOK YOUR <span style={{ color: 'hsl(82, 84%, 55%)' }}>TURF</span>
          </h1>


          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-end animate-slide-up opacity-0 stagger-4 mr-4">
            <Button
              variant="outline"
              size="xl"
              className="animate-float"
              asChild
            >
              <Link to="/turfs" className="flex items-center gap-2">
                Explore Turfs
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
          </div>

          {/* Info Text */}
          <div className="text-right space-y-2 animate-slide-up opacity-0 stagger-5 mr-4 pt-4">
            <p className="text-2xl font-bold text-white tracking-tight">Play more. Wait less.</p>
            <p className="text-lg text-white/90 font-medium max-w-lg ml-auto leading-relaxed">
              Find nearby turfs, check availability, and book your slot in seconds.
            </p>
          </div>
        </div>
      </div>


      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-float">
        <div className="w-7 h-11 rounded-full border-2 border-primary/40 flex items-start justify-center p-2 glass-effect">
          <div className="w-1.5 h-3 bg-primary rounded-full animate-bounce" />
        </div>
      </div>
    </section >
  );
};

export default HeroSection;
