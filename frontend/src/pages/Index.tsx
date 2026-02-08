import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/home/HeroSection";
import FeaturedTurfs from "@/components/home/FeaturedTurfs";
import FeaturesSection from "@/components/home/FeaturesSection";
import TournamentsSection from "@/components/home/TournamentsSection";
import HowItWorks from "@/components/home/HowItWorks";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import PromotionalVideos from "@/components/home/PromotionalVideos";
import AboutUsSection from "../components/home/AboutUsSection";
import ContactUsSection from "../components/home/ContactUsSection";
import Marquee from "@/components/common/Marquee";


const Index = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <FeaturedTurfs />
        <Marquee text="BOOK TURF" />

        <PromotionalVideos />

        <HowItWorks />
        <Marquee text="BOOK TURF" />
        <TestimonialsSection />

        <AboutUsSection /> {/* New About Us section */}
        <ContactUsSection /> {/* New Contact Us section at the end */}
      </main>
      <Footer />
    </div >
  );
};

export default Index;