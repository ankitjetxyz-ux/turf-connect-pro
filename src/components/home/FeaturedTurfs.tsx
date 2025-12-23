import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import TurfCard from "@/components/turfs/TurfCard";
import { ArrowRight, Zap } from "lucide-react";
import { Link } from "react-router-dom";

const sampleTurfs = [
  {
    id: "1",
    name: "Green Arena Sports Complex",
    location: "Andheri West, Mumbai",
    image: "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800",
    rating: 4.8,
    reviews: 245,
    price: 1200,
    sports: ["Football", "Cricket", "Badminton"],
    availableSlots: 5,
    featured: true,
  },
  {
    id: "2",
    name: "Champions Turf Hub",
    location: "Koramangala, Bangalore",
    image: "https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800",
    rating: 4.6,
    reviews: 189,
    price: 800,
    sports: ["Football", "Tennis"],
    availableSlots: 8,
  },
  {
    id: "3",
    name: "Victory Sports Arena",
    location: "Bandra East, Mumbai",
    image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800",
    rating: 4.9,
    reviews: 312,
    price: 1500,
    sports: ["Cricket", "Football", "Hockey", "Basketball"],
    availableSlots: 2,
    featured: true,
  },
  {
    id: "4",
    name: "Elite Sports Zone",
    location: "Indiranagar, Bangalore",
    image: "https://images.unsplash.com/photo-1459865264687-595d652de67e?w=800",
    rating: 4.5,
    reviews: 156,
    price: 900,
    sports: ["Football", "Volleyball"],
    availableSlots: 12,
  },
];

const FeaturedTurfs = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/50 to-background" />
      <div className="absolute inset-0 grid-overlay opacity-40" />
      
      {/* Ambient glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px]" />

      <div className="container px-4 relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow-sm">
                <Zap className="w-5 h-5 text-primary-foreground" />
              </div>
              <Badge variant="success" className="animate-pulse-glow">🔥 Popular Near You</Badge>
            </div>
            <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
              Featured <span className="text-gradient">Turfs</span>
            </h2>
            <p className="text-muted-foreground max-w-md">
              Discover top-rated sports turfs loved by players in your area
            </p>
          </div>
          <Button variant="outline" asChild className="group hover:border-primary/50 transition-colors">
            <Link to="/turfs" className="flex items-center gap-2">
              View All Turfs
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>

        {/* Turf Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {sampleTurfs.map((turf, index) => (
            <div
              key={turf.id}
              className="animate-slide-up opacity-0"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <TurfCard {...turf} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedTurfs;
