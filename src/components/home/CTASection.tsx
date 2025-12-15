import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Check } from "lucide-react";

const CTASection = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/30 to-background" />
      <div className="absolute inset-0 grid-overlay opacity-40" />
      
      {/* Ambient glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] animate-glow-pulse" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] animate-glow-pulse" style={{ animationDelay: '1.5s' }} />

      <div className="container px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Glass Card */}
          <div className="glass-card rounded-3xl p-8 md:p-12 lg:p-16 text-center relative overflow-hidden">
            {/* Inner glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-primary/10 rounded-full blur-[80px]" />
            
            <div className="relative z-10 space-y-8">
              {/* Icon */}
              <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto shadow-glow animate-float">
                <Sparkles className="w-8 h-8 text-primary-foreground" />
              </div>

              {/* Heading */}
              <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
                Ready to Find Your
                <span className="text-gradient block mt-2 neon-glow">Perfect Turf?</span>
              </h2>

              {/* Description */}
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
                Join thousands of sports enthusiasts who book their favorite turfs through TurfBook. 
                Start your journey today!
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="hero" size="xl" className="group shadow-glow hover:shadow-elevated transition-all duration-300">
                  Get Started Free
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Button>
                <Button variant="glass" size="xl" className="hover:bg-secondary/50 transition-all duration-300">
                  Contact Sales
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8 pt-8 border-t border-border/30">
                {[
                  "No Credit Card Required",
                  "Free Registration",
                  "24/7 Support",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-muted-foreground">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary" />
                    </div>
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
