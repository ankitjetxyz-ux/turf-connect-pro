import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import TurfCard from "@/components/turfs/TurfCard";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "@/services/api";

type Turf = {
  id: string;
  name: string;
  location: string;
  images?: string | string[];
  price_per_slot: number;
  description?: string;
  facilities?: string | string[];
};

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800";

const FeaturedTurfs = () => {
  const [turfs, setTurfs] = useState<Turf[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTurfs = async () => {
      try {
        const res = await api.get("/turfs");
        const turfData = Array.isArray(res.data)
          ? res.data
          : res.data?.data || [];

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
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/50 to-background" />
      <div className="absolute inset-0 grid-overlay opacity-40" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px]" />

      <div className="container px-4 relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div className="space-y-3">
            <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold">
              Featured <span className="text-gradient">Turfs</span>
            </h2>
            <p className="text-muted-foreground max-w-md">
              Discover top-rated sports turfs loved by players in your area
            </p>
          </div>

          <Button variant="outline" asChild>
            <Link to="/turfs" className="flex items-center gap-2">
              View All Turfs
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-80 bg-muted/20 animate-pulse rounded-xl"
              />
            ))}
          </div>
        ) : turfs.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            No turfs available at the moment.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {turfs.map((turf, index) => {
              // ✅ SAFE IMAGE HANDLING
              const images = Array.isArray(turf.images)
                ? turf.images
                : typeof turf.images === "string"
                  ? turf.images.split(",")
                  : [];

              const displayImage = images[0] || FALLBACK_IMAGE;

              const sports = Array.isArray(turf.facilities)
                ? turf.facilities
                : typeof turf.facilities === "string"
                  ? (Array.isArray(turf.facilities) ? turf.facilities : turf.facilities.split(","))
                  : [];

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
                    rating={4.5}
                    reviews={0}
                    sports={sports}
                    availableSlots={5}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedTurfs;
