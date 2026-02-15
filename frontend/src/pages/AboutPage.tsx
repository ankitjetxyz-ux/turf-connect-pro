import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Target,
  Eye,
  Shield,
  Users,
  Trophy,
  MapPin,
  CheckCircle2,
  Zap,
  Clock,
  Star,
  Heart,
  TrendingUp,
  Award,
  Handshake,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import { usePageSEO } from "@/hooks/usePageSEO";


const AboutPage = () => {
  usePageSEO({ title: "About Us", description: "Learn about TurfBook's mission to revolutionize sports turf booking in India." });

  const platformFeatures = [
    {
      icon: Zap,
      title: "Instant Booking",
      description: "Book your preferred turf in seconds with real-time slot availability",
    },
    {
      icon: Shield,
      title: "Secure Payments",
      description: "100% secure payment gateway with multiple payment options",
    },
    {
      icon: Clock,
      title: "24/7 Access",
      description: "Book anytime, anywhere with our always-available platform",
    },
    {
      icon: Star,
      title: "Verified Turfs",
      description: "All listed turfs are verified for quality and facilities",
    },
  ];

  const playerBenefits = [
    "Free registration with no hidden charges",
    "Easy turf discovery with advanced filters",
    "Real-time slot availability",
    "Collaborative play to find teammates",
    "Exclusive offers and discounts",
    "Booking history and easy rebooking",
    "Direct chat with turf owners",
    "Tournament participation opportunities",
  ];

  const ownerBenefits = [
    "Increased visibility and bookings",
    "Easy slot and pricing management",
    "Automated booking system",
    "Real-time analytics dashboard",
    "Host tournaments and events",
    "Direct player communication",
    "Secure and timely payments",
    "Marketing support from platform",
  ];

  const stats = [
    { value: "500+", label: "Turfs Listed", icon: MapPin },
    { value: "50K+", label: "Happy Players", icon: Users },
    { value: "100+", label: "Cities", icon: Trophy },
    { value: "1M+", label: "Bookings", icon: TrendingUp },
  ];

  const trustPoints = [
    {
      icon: Shield,
      title: "Data Security",
      description: "Your personal and payment information is protected with bank-level encryption",
    },
    {
      icon: Handshake,
      title: "Fair Practices",
      description: "Transparent pricing with no hidden fees. What you see is what you pay",
    },
    {
      icon: Award,
      title: "Quality Assurance",
      description: "Every turf undergoes thorough verification before being listed",
    },
    {
      icon: Heart,
      title: "Customer First",
      description: "24/7 support team dedicated to resolving any issues quickly",
    },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      {/* Reuse hero/contact style background for visual consistency */}
      <div className="absolute inset-0 grid-overlay-intense" />
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/8 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 right-0 w-[480px] h-[480px] bg-primary/6 rounded-full blur-[120px]" />

      <Navbar />

      <main className="pt-24 pb-16 relative z-10 flex-1">
        <div className="container px-4 relative z-10">
          <section className="text-center mb-20">
            <Badge variant="featured" className="mb-4">
              <Target className="w-4 h-4 mr-2" />
              About Us
            </Badge>

            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Revolutionizing <span className="text-gradient">Sports Booking</span>
            </h1>

            <p className="text-muted-foreground max-w-3xl mx-auto">
              TurfBook is India's premier sports turf booking platform, connecting players with premium sports facilities.
            </p>
          </section>

          <section className="mb-20 grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <Card key={stat.label} variant="glass" className="text-center">
                <CardContent className="p-6">
                  <stat.icon className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <div className="text-3xl font-bold">{stat.value}</div>
                  <p className="text-muted-foreground text-sm">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </section>

          <section className="grid md:grid-cols-2 gap-8 mb-20">
            <Card variant="glass">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
                <p className="text-muted-foreground">
                  To democratize access to sports facilities by creating a seamless booking experience.
                </p>
              </CardContent>
            </Card>

            <Card variant="glass">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-4">Our Vision</h2>
                <p className="text-muted-foreground">
                  To become India’s most trusted sports infrastructure platform.
                </p>
              </CardContent>
            </Card>
          </section>

          <section className="grid md:grid-cols-2 gap-8 mb-20">
            <Card variant="glass">
              <CardContent className="p-8">
                <h3 className="text-xl font-bold mb-4">For Players</h3>
                <ul className="space-y-2">
                  {playerBenefits.map((b, i) => (
                    <li key={i} className="flex gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary" /> {b}
                    </li>
                  ))}
                </ul>
                <Button className="mt-6" asChild>
                  <Link to="/register">Start Playing</Link>
                </Button>
              </CardContent>
            </Card>

            <Card variant="glass">
              <CardContent className="p-8">
                <h3 className="text-xl font-bold mb-4">For Turf Owners</h3>
                <ul className="space-y-2">
                  {ownerBenefits.map((b, i) => (
                    <li key={i} className="flex gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary" /> {b}
                    </li>
                  ))}
                </ul>
                <Button variant="outline" className="mt-6" asChild>
                  <Link to="/register">List Your Turf</Link>
                </Button>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AboutPage;
