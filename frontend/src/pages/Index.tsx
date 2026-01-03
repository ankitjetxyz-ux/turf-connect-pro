import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/home/HeroSection";
import FeaturedTurfs from "@/components/home/FeaturedTurfs";
import FeaturesSection from "@/components/home/FeaturesSection";
import TournamentsSection from "@/components/home/TournamentsSection";
import HowItWorks from "@/components/home/HowItWorks";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import PromotionalVideos from "@/components/home/PromotionalVideos";
import CTASection from "@/components/home/CTASection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <FeaturedTurfs />
        <FeaturesSection />

        {/* Inline About Us section (summary) */}
        <section className="py-16 border-t border-border/40 bg-background">
          <div className="container px-4 mx-auto max-w-5xl text-center space-y-4">
            <h2 className="text-3xl font-heading font-bold">About Us</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-base">
              TurfBook is a sports turf and tournament booking platform that connects players with verified turfs
              and helps turf owners manage slots, payments, and events in a single place.
            </p>
          </div>
        </section>

        <PromotionalVideos />
        <TournamentsSection />
        <HowItWorks />

        {/* Inline Contact Us teaser */}
        <section className="py-16 border-t border-border/40 bg-secondary/20">
          <div className="container px-4 mx-auto max-w-4xl text-center space-y-4">
            <h2 className="text-3xl font-heading font-bold">Contact Us</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-base">
              Have questions about bookings or listing your turf? Reach out to our team and we&apos;ll be happy to help.
            </p>
          </div>
        </section>

        <TestimonialsSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
