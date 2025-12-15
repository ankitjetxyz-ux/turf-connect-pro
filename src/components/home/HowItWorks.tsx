import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Building2, Shield, ArrowRight } from "lucide-react";

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
  },
];

const HowItWorks = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-card to-background">
      <div className="container px-4">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Badge variant="success" className="mb-4">Get Started</Badge>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
            Choose Your <span className="text-primary">Role</span>
          </h2>
          <p className="text-muted-foreground">
            Whether you're a player or turf owner, we have the perfect solution for you
          </p>
        </div>

        {/* Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {roles.map((role, index) => (
            <Card
              key={role.title}
              variant={role.variant}
              className={`group animate-slide-up opacity-0 ${
                role.variant === "featured" ? "md:-translate-y-4 ring-2 ring-primary" : ""
              }`}
              style={{ animationDelay: `${index * 0.15}s` }}
            >
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
                <ul className="space-y-3 mb-8 text-left">
                  {role.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Button
                  variant={role.variant === "featured" ? "hero" : "outline"}
                  className="w-full"
                >
                  {role.cta}
                  <ArrowRight className="w-4 h-4" />
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
