import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin, MessageSquare, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

const ContactUsSection = () => {
    const contactMethods = [
        {
            icon: Mail,
            title: "Email Support",
            details: "bookmyturfofficial@gmail.com",
            description: "We respond within 24 hours",
        },
        {
            icon: Phone,
            title: "Phone Support",
            details: "+91 9328 063 509",
            description: "Mon-Fri, 9am - 6pm IST",
        },
        {
            icon: MapPin,
            title: "Office Location",
            details: "Vadodara/Ahemedabad,Gujarat",
            description: "Visit our headquarters",
        },
    ];

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
            className="py-20 bg-gradient-to-b from-secondary/20 to-background relative overflow-hidden"
        >
            <div className="container px-4">
                <div className="text-center mb-12">
                    <h2 className="text-4xl md:text-5xl lg:text-7xl tracking-tight mb-6" style={{ fontFamily: '"Inter Display", sans-serif', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.04em' }}>
                        Have Questions? <span className="text-gradient">Contact Us</span>
                    </h2>
                    <p className="text-lg text-muted-foreground font-medium max-w-3xl mx-auto leading-relaxed mb-12">
                        Our team is ready to help you with bookings, turf listings, tournament organization,
                        or any other queries you might have.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6 mb-12">
                    {contactMethods.map((method, index) => (
                        <Card key={index} variant="glass" className="glass-card hover-lift transition-all hover:shadow-glow">
                            <CardContent className="p-6 text-center">
                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                    <method.icon className="w-6 h-6 text-primary" />
                                </div>
                                <h3 className="font-bold text-lg mb-2">{method.title}</h3>
                                <p className="text-foreground font-medium mb-1">{method.details}</p>
                                <p className="text-sm text-muted-foreground">{method.description}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="max-w-5xl mx-auto">
                    <h3 className="text-2xl font-bold mb-8 text-center">Why Contact Us?</h3>
                    <ul className="grid md:grid-cols-2 gap-6">
                        {[
                            {
                                title: "Booking Assistance",
                                description: "Help with turf bookings, payments, and cancellations"
                            },
                            {
                                title: "Turf Owner Support",
                                description: "Guidance on listing and managing your turf facility"
                            },
                            {
                                title: "Tournament Queries",
                                description: "Information about organizing or joining tournaments"
                            },
                            {
                                title: "Technical Support",
                                description: "Help with app/website issues and feature requests"
                            },
                            {
                                title: "Partnership Inquiries",
                                description: "Business collaboration and partnership opportunities"
                            },
                            {
                                title: "Feedback & Suggestions",
                                description: "Share your thoughts to help us improve the platform"
                            }
                        ].map((item, index) => (
                            <li key={index} className="flex items-start gap-4 p-4 bg-secondary/30 rounded-xl hover:bg-secondary/50 transition-colors">
                                <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                                <div>
                                    <h4 className="font-bold text-foreground text-lg">{item.title}</h4>
                                    <p className="text-sm text-muted-foreground">{item.description}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                    <div className="mt-10 text-center">
                        <Button asChild variant="default" className="w-full sm:w-auto px-8 gradient-primary">
                            <Link to="/contact">
                                Visit Contact Page
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        </motion.section>
    );
};

export default ContactUsSection;