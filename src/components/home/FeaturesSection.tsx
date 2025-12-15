import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  CreditCard, 
  Clock, 
  Users, 
  Trophy, 
  MessageCircle 
} from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Secure Booking",
    description: "100% secure payment gateway with instant confirmation",
  },
  {
    icon: CreditCard,
    title: "Easy Payments",
    description: "Multiple payment options including UPI, cards & wallets",
  },
  {
    icon: Clock,
    title: "Real-time Availability",
    description: "See live slot availability and book instantly",
  },
  {
    icon: Users,
    title: "Collaborative Play",
    description: "Find players and join matches to complete teams",
  },
  {
    icon: Trophy,
    title: "Tournaments",
    description: "Participate in exciting tournaments and win prizes",
  },
  {
    icon: MessageCircle,
    title: "Direct Chat",
    description: "Chat directly with turf owners for queries",
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-20">
      <div className="container px-4">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Badge variant="premium" className="mb-4">Why Choose Us</Badge>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
            Everything You Need to
            <span className="text-gradient"> Play Better</span>
          </h2>
          <p className="text-muted-foreground">
            From finding the perfect turf to joining matches, we've got you covered
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card
              key={feature.title}
              variant="interactive"
              className="group animate-slide-up opacity-0"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-6 flex gap-4">
                <div className="shrink-0">
                  <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-glow group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {feature.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
