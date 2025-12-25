import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import api from "@/services/api";
import SocialMediaLinks from "@/components/common/SocialMediaLinks";
import { useState } from "react";
import { 
  Mail, 
  Phone, 
  MapPin, 
  MessageSquare, 
  Send
} from "lucide-react";

const ContactPage = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/contact", formData);
      toast({
        title: "Message Sent!",
        description: "We'll get back to you soon.",
        variant: "default", // Success style if available, or default
        className: "bg-green-600 text-white border-none"
      });
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16 relative">
        {/* Background Effects */}
        <div className="absolute inset-0 grid-overlay-intense" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] animate-glow-pulse" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] animate-glow-pulse" style={{ animationDelay: '2s' }} />

        <div className="container px-4 relative z-10">
          <div className="text-center mb-12 animate-slide-up opacity-0">
            <Badge variant="featured" className="mb-4">
              <MessageSquare className="w-4 h-4 mr-2" />
              Get in Touch
            </Badge>
            <h1 className="font-heading text-4xl md:text-5xl font-bold text-foreground mb-4">
              We'd Love to <span className="text-gradient">Hear From You</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Have a question about booking, listing your turf, or just want to say hello? 
              Our team is ready to answer all your questions.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Contact Info */}
            <div className="space-y-6 lg:col-span-1 animate-slide-right opacity-0 stagger-1">
              <Card variant="glass" className="glass-card h-full">
                <CardContent className="p-8 space-y-8">
                  <div>
                    <h3 className="font-heading text-xl font-semibold mb-6">Contact Information</h3>
                    <div className="space-y-6">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center shrink-0 shadow-glow-sm">
                          <Mail className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Email Us</p>
                          <p className="text-sm text-muted-foreground">support@turfbook.com</p>
                          <p className="text-sm text-muted-foreground">partners@turfbook.com</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center shrink-0 shadow-glow-sm">
                          <Phone className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Call Us</p>
                          <p className="text-sm text-muted-foreground">+91 9876 543 210</p>
                          <p className="text-sm text-muted-foreground">Mon-Fri, 9am - 6pm</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center shrink-0 shadow-glow-sm">
                          <MapPin className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Visit Us</p>
                          <p className="text-sm text-muted-foreground">
                            123 Sports Complex,<br />
                            Andheri West, Mumbai,<br />
                            Maharashtra 400053
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-white/10">
                    <h3 className="font-heading text-lg font-semibold mb-4">Connect With Us</h3>
                    <SocialMediaLinks />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2 animate-slide-left opacity-0 stagger-2">
              <Card variant="glass" className="glass-card">
                <CardContent className="p-8">
                  <h3 className="font-heading text-2xl font-semibold mb-6">Send us a Message</h3>
                  <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Name</label>
                        <Input 
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="Your Name" 
                          className="bg-secondary/30 border-white/10 focus:border-primary/50" 
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Email</label>
                        <Input 
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="your@email.com" 
                          className="bg-secondary/30 border-white/10 focus:border-primary/50" 
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Subject</label>
                      <Input 
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        placeholder="How can we help?" 
                        className="bg-secondary/30 border-white/10 focus:border-primary/50" 
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Message</label>
                      <Textarea 
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Tell us more about your inquiry..." 
                        className="min-h-[150px] bg-secondary/30 border-white/10 focus:border-primary/50" 
                        required
                      />
                    </div>

                    <Button type="submit" variant="hero" size="lg" className="w-full sm:w-auto" disabled={loading}>
                      <Send className="w-4 h-4 mr-2" />
                      {loading ? "Sending..." : "Send Message"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ContactPage;
