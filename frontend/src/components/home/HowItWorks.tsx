import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Building2, Shield, ArrowRight, Check } from "lucide-react";

const roles = [
  {
    icon: User,
    title: "Player",
    description: "Book turfs, join matches, and never miss a game",
    features: [
      "Free registration",
      "Browse & book turfs",
      "Join collaborative matches",
      "Exclusive offers & discounts",
    ],
    cta: "Register as Player",
    variant: "default" as const,
    popular: false,
  },
  {
    icon: Building2,
    title: "Turf Owner",
    description: "List your turf and grow your sports business",
    features: [
      "Minimal listing fee",
      "Manage bookings & slots",
      "Organize tournaments",
      "Analytics dashboard",
    ],
    cta: "List Your Turf",
    variant: "featured" as const,
    popular: true,
  },
  {
    icon: Shield,
    title: "Admin",
    description: "Full control over the platform ecosystem",
    features: [
      "User management",
      "Payment oversight",
      "Policy management",
      "System security",
    ],
    cta: "Admin Access",
    variant: "default" as const,
    popular: false,
  },
];

const HowItWorks = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-card via-background to-card" />
      <div className="absolute inset-0 grid-overlay opacity-30" />
      
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />

      <div className="container px-4 relative z-10">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Badge variant="success" className="mb-4">How It Works</Badge>
          <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Simple Steps to <span className="text-gradient">Get Started</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Book your favorite turf in just a few easy steps
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {[
            {
              step: "1",
              title: "Browse Turfs",
              description: "Explore our wide selection of premium sports turfs in your area",
            },
            {
              step: "2",
              title: "Select & Book",
              description: "Choose your preferred date and time slot, then complete your booking",
            },
            {
              step: "3",
              title: "Play & Enjoy",
              description: "Show up at the turf with your verification code and enjoy the game",
            },
          ].map((item, index) => (
            <Card
              key={item.step}
              variant="default"
              className="group animate-slide-up opacity-0 hover-lift glass-card"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-6 shadow-glow group-hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl font-bold text-primary-foreground">{item.step}</span>
                </div>
                <h3 className="font-heading text-xl font-bold text-foreground mb-2">
                  {item.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {item.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
