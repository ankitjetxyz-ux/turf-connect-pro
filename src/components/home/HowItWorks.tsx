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
          <Badge variant="success" className="mb-4">Get Started</Badge>
          <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Choose Your <span className="text-gradient">Role</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Whether you're a player or turf owner, we have the perfect solution for you
          </p>
        </div>

        {/* Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {roles.map((role, index) => (
            <Card
              key={role.title}
              variant={role.variant}
              className={`group animate-slide-up opacity-0 hover-lift glass-card relative ${
                role.popular ? "md:-translate-y-4 ring-2 ring-primary/50 shadow-glow" : ""
              }`}
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              {/* Popular Badge */}
              {role.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge variant="featured" className="shadow-glow-sm">Most Popular</Badge>
                </div>
              )}

              <CardContent className="p-8 text-center">
                {/* Icon */}
                <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-6 shadow-glow group-hover:scale-110 transition-transform duration-300">
                  <role.icon className="w-8 h-8 text-primary-foreground" />
                </div>

                {/* Title */}
                <h3 className="font-heading text-2xl font-bold text-foreground mb-2">
                  {role.title}
                </h3>
                <p className="text-muted-foreground text-sm mb-6">
                  {role.description}
                </p>

                {/* Features List */}
                <ul className="space-y-3 mb-8">
                  {role.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-3 text-sm text-muted-foreground"
                    >
                      <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-primary" />
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Button
                  variant={role.popular ? "hero" : "outline"}
                  className={`w-full group/btn ${role.popular ? 'shadow-glow-sm hover:shadow-glow' : 'hover:border-primary/50'} transition-all duration-300`}
                >
                  {role.cta}
                  <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
