import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  CreditCard, 
  Clock, 
  Users, 
  Trophy,
  Sparkles
} from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Secure Booking",
    description: "100% secure payment gateway with instant confirmation",
    gradient: "from-emerald-500/20 to-primary/20",
  },
  {
    icon: CreditCard,
    title: "Easy Payments",
    description: "Multiple payment options including UPI, cards & wallets",
    gradient: "from-blue-500/20 to-primary/20",
  },
  {
    icon: Clock,
    title: "Real-time Availability",
    description: "See live slot availability and book instantly",
    gradient: "from-orange-500/20 to-primary/20",
  },
  {
    icon: Users,
    title: "Collaborative Play",
    description: "Find players and join matches to complete teams",
    gradient: "from-purple-500/20 to-primary/20",
  },
  {
    icon: Trophy,
    title: "Tournaments",
    description: "Participate in exciting tournaments and win prizes",
    gradient: "from-yellow-500/20 to-primary/20",
  },
  {
    icon: Sparkles,
    title: "Premium Features",
    description: "Access exclusive features and priority support",
    gradient: "from-pink-500/20 to-primary/20",
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-background" />
      <div className="absolute inset-0 grid-overlay-intense opacity-50" />
      
      {/* Ambient effects */}
      <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-primary/8 rounded-full blur-[100px] -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-primary/6 rounded-full blur-[80px]" />

      <div className="container px-4 relative z-10">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-primary" />
            <Badge variant="premium">Why Choose Us</Badge>
          </div>
          <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Everything You Need to
            <span className="text-gradient block mt-1"> Play Better</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            From finding the perfect turf to joining matches, we've got you covered
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card
              key={feature.title}
              variant="interactive"
              className="group animate-slide-up opacity-0 hover-lift glass-card overflow-hidden"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Gradient overlay on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              
              <CardContent className="p-6 relative z-10">
                <div className="flex gap-4">
                  <div className="shrink-0">
                    <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center shadow-glow-sm group-hover:shadow-glow group-hover:scale-110 transition-all duration-300">
                      <feature.icon className="w-7 h-7 text-primary-foreground" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-lg text-foreground mb-2 group-hover:text-primary transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
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
