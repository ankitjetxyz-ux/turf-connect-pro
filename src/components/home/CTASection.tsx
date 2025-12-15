import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

const CTASection = () => {
  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />

      <div className="container px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Icon */}
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto shadow-glow animate-float">
            <Sparkles className="w-8 h-8 text-primary-foreground" />
          </div>

          {/* Heading */}
          <h2 className="font-heading text-3xl md:text-5xl font-bold text-foreground">
            Ready to Find Your
            <span className="text-gradient block mt-2">Perfect Turf?</span>
          </h2>

          {/* Description */}
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Join thousands of sports enthusiasts who book their favorite turfs through TurfBook. 
            Start your journey today!
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="xl">
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button variant="glass" size="xl">
              Contact Sales
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-8 pt-8 border-t border-border/50">
            {[
              "No Credit Card Required",
              "Free Registration",
              "24/7 Support",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
