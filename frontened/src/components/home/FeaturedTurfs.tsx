import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import TurfCard from "@/components/turfs/TurfCard";
import { ArrowRight, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "@/services/api";

type Turf = {
  id: string;
  name: string;
  location: string;
  images: string;
  price_per_slot: number;
  description?: string;
  facilities?: string;
};

const FeaturedTurfs = () => {
  const [turfs, setTurfs] = useState<Turf[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTurfs = async () => {
      try {
        const res = await api.get("/turfs");
        // Ensure data is an array before slicing
        const turfData = Array.isArray(res.data) ? res.data : res.data?.data || [];
        setTurfs(turfData.slice(0, 4));
      } catch (error) {
        console.error("Failed to fetch turfs", error);
        setTurfs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTurfs();
  }, []);

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
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
             {[1,2,3,4].map(i => (
               <div key={i} className="h-80 bg-muted/20 animate-pulse rounded-xl" />
             ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {turfs.map((turf, index) => {
              // Parse images if stored as comma-separated string
              const imageList = turf.images ? turf.images.split(',') : [];
              const displayImage = imageList.length > 0 ? imageList[0] : "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800"; // Fallback

              return (
                <div
                  key={turf.id}
                  className="animate-slide-up opacity-0"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <TurfCard 
                    id={turf.id}
                    name={turf.name}
                    location={turf.location}
                    image={displayImage}
                    price={turf.price_per_slot}
                    rating={4.5} // Placeholder as backend might not have ratings yet
                    reviews={0} // Placeholder
                    sports={[]} // Placeholder or parse from facilities
                    availableSlots={5} // Placeholder or fetch
                  />
                </div>
              );
            })}
          </div>
        )}
        
        {!loading && turfs.length === 0 && (
           <div className="text-center py-10 text-muted-foreground">
             No turfs available at the moment.
           </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedTurfs;
