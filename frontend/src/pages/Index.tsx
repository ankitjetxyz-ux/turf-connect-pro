import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/home/HeroSection";
import FeaturedTurfs from "@/components/home/FeaturedTurfs";
import FeaturesSection from "@/components/home/FeaturesSection";
import TournamentsSection from "@/components/home/TournamentsSection";
import HowItWorks from "@/components/home/HowItWorks";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import CTASection from "@/components/home/CTASection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <FeaturedTurfs />
        <FeaturesSection />
        <TournamentsSection />
        <HowItWorks />
        <TestimonialsSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
