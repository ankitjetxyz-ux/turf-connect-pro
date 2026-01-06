import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin, MessageSquare, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

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

    return (
        <section className="py-20 bg-gradient-to-b from-secondary/20 to-background">
            <div className="container px-4">
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
                        <MessageSquare className="w-4 h-4" />
                        Get in Touch
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        Have Questions? <span className="text-gradient">Contact Us</span>
                    </h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        Our team is ready to help you with bookings, turf listings, tournament organization,
                        or any other queries you might have.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6 mb-12">
                    {contactMethods.map((method, index) => (
                        <Card key={index} className="border-border/50 hover:border-primary/30 transition-all">
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
        </section>
    );
};

export default ContactUsSection;