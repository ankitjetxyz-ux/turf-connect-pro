import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Construction } from "lucide-react";

const ComingSoonPage = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 flex items-center justify-center relative">
        <div className="absolute inset-0 grid-overlay opacity-20" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] animate-pulse" />
        
        <div className="text-center relative z-10 p-4">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl gradient-primary flex items-center justify-center shadow-glow">
            <Construction className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4">
            Coming <span className="text-gradient">Soon</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-md mx-auto mb-8">
            We're working hard to bring you this feature. Stay tuned for updates!
          </p>
          <Button variant="hero" size="lg" asChild>
            <Link to="/">Return Home</Link>
          </Button>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ComingSoonPage;
