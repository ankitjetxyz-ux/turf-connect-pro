import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Building2, Shield, ArrowRight, Check } from "lucide-react";
import bk3 from "../layout/BK3.png";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

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
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start 0.9", "center center"]
  });
  const opacity = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const y = useTransform(scrollYProgress, [0, 1], [100, 0]);

  return (
    <motion.section
      ref={sectionRef}
      style={{ opacity, y }}
      className="min-h-screen py-24 relative overflow-hidden flex items-center"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-card via-background to-card z-0" />

      {/* Background Image - Dull */}
      <div
        className="absolute inset-0 z-0 opacity-30 bg-center bg-cover bg-no-repeat pointer-events-none"
        style={{ backgroundImage: `url(${bk3})` }}
      />

      <div className="absolute inset-0 grid-overlay opacity-30 z-0" />

      <div className="container px-4 relative z-10">
        {/* Header */}
        <div className="text-center max-w-4xl mx-auto mb-20">
          <h2 className="text-4xl md:text-5xl lg:text-7xl tracking-tight mb-4" style={{ fontFamily: '"Inter Display", sans-serif', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.04em' }}>
            Simple Steps to <span className="text-gradient block mt-2">Get Started</span>
          </h2>
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
              variant="glass"
              className="group animate-slide-up opacity-0 hover-lift glass-card"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              <CardContent className="p-8 text-center">
                <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-6 shadow-glow group-hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl font-bold text-primary-foreground">{item.step}</span>
                </div>
                <h3 className="font-heading text-2xl font-bold text-foreground mb-4">
                  {item.title}
                </h3>
                <p className="text-foreground/90 text-lg leading-relaxed">
                  {item.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </motion.section>
  );
};

export default HowItWorks;
