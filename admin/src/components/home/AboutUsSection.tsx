import { useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, Users, Trophy, Zap, Shield, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";

const AboutUsSection = () => {
    const sectionRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start 0.9", "center center"]
    });

    const opacity = useTransform(scrollYProgress, [0, 1], [0, 1]);
    const y = useTransform(scrollYProgress, [0, 1], [100, 0]);

    const features = [
        {
            icon: Zap,
            title: "Instant Booking",
            description: "Book your preferred turf in seconds with real-time slot availability",
        },
        {
            icon: Shield,
            title: "Secure Platform",
            description: "Bank-level security for all your transactions and personal data",
        },
        {
            icon: Trophy,
            title: "Tournament Hub",
            description: "Join and organize competitive tournaments with ease",
        },
        {
            icon: Users,
            title: "Community Driven",
            description: "Connect with fellow players and turf owners across India",
        },
    ];

    return (
        <motion.section
            ref={sectionRef}
            style={{ opacity, y }}
            className="py-20 bg-gradient-to-b from-background to-secondary/20 relative overflow-hidden"
        >
            <div className="container px-4">
                <div className="text-center mb-12">
                    <h2
                        className="text-4xl md:text-5xl lg:text-7xl tracking-tight mb-6"
                        style={{ fontFamily: '"Inter Display", sans-serif', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.04em' }}
                    >
                        Revolutionizing <span className="text-gradient">Sports Booking</span> in India
                    </h2>
                    <p className="text-lg text-muted-foreground font-medium max-w-3xl mx-auto leading-relaxed mb-12">
                        TurfBook is India's premier platform connecting sports enthusiasts with premium
                        facilities. We're on a mission to make sports accessible to everyone.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {features.map((feature, index) => (
                        <Card key={index} variant="glass" className="glass-card hover-lift transition-all hover:shadow-glow">
                            <CardContent className="p-6 text-center">
                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                    <feature.icon className="w-6 h-6 text-primary" />
                                </div>
                                <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                                <p className="text-sm text-muted-foreground">{feature.description}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="grid lg:grid-cols-2 gap-8 items-center">
                    <div>
                        <h3 className="text-2xl font-bold mb-4">Why Choose TurfBook?</h3>
                        <ul className="space-y-3">
                            {[
                                "Largest network of verified sports turfs",
                                "Real-time slot availability and booking",
                                "Secure and instant payment processing",
                                "Tournament management and participation",
                                "Direct communication with turf owners",
                                "Competitive pricing with no hidden charges",
                                "24/7 customer support",
                                "Mobile-friendly booking experience"
                            ].map((item, index) => (
                                <li key={index} className="flex items-start gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                                    <span className="text-foreground">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <Card variant="glass" className="glass-card border-border/50">
                        <CardContent className="p-8">
                            <h3 className="text-2xl font-bold mb-4">Our Mission</h3>
                            <p className="text-muted-foreground mb-6">
                                To democratize access to sports facilities by creating a seamless, transparent,
                                and efficient booking ecosystem that benefits both players and turf owners.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Button asChild className="gradient-primary">
                                    <Link to="/about">Learn More About Us</Link>
                                </Button>
                                <Button variant="outline" asChild>
                                    <Link to="/contact">Contact Us</Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </motion.section>
    );
};

export default AboutUsSection;