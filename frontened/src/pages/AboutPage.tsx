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
  ArrowRight
} from "lucide-react";
import { Link } from "react-router-dom";

const AboutPage = () => {
  const platformFeatures = [
    {
      icon: Zap,
      title: "Instant Booking",
      description: "Book your preferred turf in seconds with real-time slot availability"
    },
    {
      icon: Shield,
      title: "Secure Payments",
      description: "100% secure payment gateway with multiple payment options"
    },
    {
      icon: Clock,
      title: "24/7 Access",
      description: "Book anytime, anywhere with our always-available platform"
    },
    {
      icon: Star,
      title: "Verified Turfs",
      description: "All listed turfs are verified for quality and facilities"
    },
  ];

  const playerBenefits = [
    "Free registration with no hidden charges",
    "Easy turf discovery with advanced filters",
    "Real-time slot availability",
    "Collaborative play to find teammates",
    "Exclusive offers and discounts",
    "Booking history and easy rebooking",
    "Tournament participation opportunities",
    "24/7 customer support",
  ];

  const ownerBenefits = [
    "Increased visibility and bookings",
    "Easy slot and pricing management",
    "Automated booking system",
    "Real-time analytics dashboard",
    "Host tournaments and events",
    "Secure and timely payments",
    "Marketing support from platform",
    "Detailed booking reports",
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
      description: "Your personal and payment information is protected with bank-level encryption"
    },
    {
      icon: Handshake,
      title: "Fair Practices",
      description: "Transparent pricing with no hidden fees. What you see is what you pay"
    },
    {
      icon: Award,
      title: "Quality Assurance",
      description: "Every turf undergoes thorough verification before being listed"
    },
    {
      icon: Heart,
      title: "Customer First",
      description: "24/7 support team dedicated to resolving any issues quickly"
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16 relative">
        {/* Background Effects */}
        <div className="absolute inset-0 grid-overlay-intense" />
        <div className="absolute top-1/4 left-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px] animate-glow-pulse" />
        <div className="absolute bottom-1/4 right-0 w-[500px] h-[500px] bg-primary/3 rounded-full blur-[120px] animate-glow-pulse" style={{ animationDelay: '1.5s' }} />

        <div className="container px-4 relative z-10">
          {/* Hero Section */}
          <section className="text-center mb-20 animate-slide-up opacity-0">
            <Badge variant="featured" className="mb-4 animate-border-glow">
              <Target className="w-4 h-4 mr-2" />
              About Us
            </Badge>
            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4">
              Revolutionizing <span className="text-gradient">Sports Booking</span>
            </h1>
            <div className="glow-divider glow-divider-lg mx-auto my-4" />
            <p className="text-muted-foreground text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
              TurfBook is India's premier sports turf booking platform, connecting players with premium 
              sports facilities across the country. We're on a mission to make sports accessible to everyone.
            </p>
          </section>

          {/* Stats Section */}
          <section className="mb-20">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 animate-scale-in opacity-0 stagger-2">
              {stats.map((stat, index) => (
                <Card 
                  key={stat.label} 
                  variant="glass" 
                  className="glass-card hover-lift text-center"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CardContent className="p-6">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-xl gradient-primary flex items-center justify-center shadow-glow-sm">
                      <stat.icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div className="font-heading text-3xl md:text-4xl font-bold text-primary mb-1">{stat.value}</div>
                    <div className="text-muted-foreground text-sm">{stat.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Mission & Vision */}
          <section className="mb-20">
            <div className="grid md:grid-cols-2 gap-6 md:gap-8">
              <Card 
                variant="glass" 
                className="glass-card hover-lift animate-slide-right opacity-0 stagger-3"
              >
                <CardContent className="p-8">
                  <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mb-6 shadow-glow-sm">
                    <Target className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-4">
                    Our Mission
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    To democratize access to sports facilities by creating a seamless, transparent, 
                    and trustworthy platform that connects players with quality turfs. We believe 
                    everyone deserves the opportunity to play their favorite sport without hassle.
                  </p>
                </CardContent>
              </Card>

              <Card 
                variant="glass" 
                className="glass-card hover-lift animate-slide-left opacity-0 stagger-3"
              >
                <CardContent className="p-8">
                  <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mb-6 shadow-glow-sm">
                    <Eye className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-4">
                    Our Vision
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    To become the go-to platform for sports enthusiasts across India, fostering a 
                    community of active players while empowering turf owners with technology that 
                    helps them grow their business and serve players better.
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Why Choose Us */}
          <section className="mb-20">
            <div className="text-center mb-12 animate-slide-up opacity-0 stagger-4">
              <Badge variant="success" className="mb-4">Why TurfBook</Badge>
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
                Why Choose <span className="text-gradient">Our Platform</span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                We've built the most comprehensive and user-friendly turf booking experience
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {platformFeatures.map((feature, index) => (
                <Card 
                  key={feature.title}
                  variant="interactive"
                  className="glass-card hover-lift animate-slide-up opacity-0"
                  style={{ animationDelay: `${0.5 + index * 0.1}s` }}
                >
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <feature.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-heading font-semibold text-lg text-foreground mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Benefits Section */}
          <section className="mb-20">
            <div className="text-center mb-12 animate-slide-up opacity-0 stagger-5">
              <Badge variant="premium" className="mb-4">Benefits</Badge>
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
                Built for <span className="text-gradient">Everyone</span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Whether you're a player looking to book or an owner looking to list, we've got you covered
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* For Players */}
              <Card 
                variant="glass" 
                className="glass-card hover-lift animate-slide-right opacity-0 stagger-6"
              >
                <CardContent className="p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-glow-sm">
                      <Users className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <h3 className="font-heading text-2xl font-bold text-foreground">For Players</h3>
                  </div>
                  <ul className="space-y-3">
                    {playerBenefits.map((benefit, index) => (
                      <li key={index} className="flex items-start gap-3 text-muted-foreground">
                        <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                  <Button variant="hero" className="mt-6 w-full shadow-glow-sm" asChild>
                    <Link to="/register">
                      Start Playing
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* For Owners */}
              <Card 
                variant="glass" 
                className="glass-card hover-lift animate-slide-left opacity-0 stagger-6"
              >
                <CardContent className="p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-glow-sm">
                      <Trophy className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <h3 className="font-heading text-2xl font-bold text-foreground">For Turf Owners</h3>
                  </div>
                  <ul className="space-y-3">
                    {ownerBenefits.map((benefit, index) => (
                      <li key={index} className="flex items-start gap-3 text-muted-foreground">
                        <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                  <Button variant="outline" className="mt-6 w-full hover-lift" asChild>
                    <Link to="/register">
                      List Your Turf
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Trust Section */}
          <section className="mb-20">
            <div className="text-center mb-12 animate-slide-up opacity-0 stagger-7">
              <Badge variant="secondary" className="mb-4">Trust & Transparency</Badge>
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
                Your Trust, <span className="text-gradient">Our Priority</span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                We're committed to maintaining the highest standards of security and transparency
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {trustPoints.map((point, index) => (
                <Card 
                  key={point.title}
                  variant="interactive"
                  className="glass-card hover-lift animate-scale-in opacity-0"
                  style={{ animationDelay: `${0.8 + index * 0.1}s` }}
                >
                  <CardContent className="p-6">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                      <point.icon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-heading font-semibold text-lg text-foreground mb-2">
                      {point.title}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {point.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* CTA Section */}
          <section className="animate-scale-in opacity-0 stagger-8">
            <Card variant="gradient" className="relative overflow-hidden">
              <div className="absolute inset-0 grid-overlay opacity-30" />
              <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/20 rounded-full blur-[100px]" />
              
              <CardContent className="relative z-10 p-8 md:p-12 text-center">
                <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
                  Ready to <span className="text-gradient">Get Started?</span>
                </h2>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
                  Join thousands of players and turf owners who trust TurfBook for their sports booking needs
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button variant="hero" size="xl" className="shadow-glow hover:shadow-elevated" asChild>
                    <Link to="/turfs">
                      Explore Turfs
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Link>
                  </Button>
                  <Button variant="glass" size="xl" asChild>
                    <Link to="/tournaments">
                      Browse Tournaments
                    </Link>
                  </Button>
                </div>
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