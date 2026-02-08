import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import TurfCard from "@/components/turfs/TurfCard";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import api from "@/services/api";
import { motion, useScroll, useTransform } from "framer-motion";

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
        const allTurfs = Array.isArray(res.data)
          ? res.data
          : res.data?.data || [];

        const approvedTurfs = allTurfs.filter(
          (turf: any) => turf.verification_status === "approved"
        );

        setTurfs(approvedTurfs.slice(0, 4));
      } catch (error) {
        console.error("Failed to fetch turfs", error);
        setTurfs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTurfs();
  }, []);

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
      className="min-h-screen py-24 relative overflow-hidden flex items-center"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/50 to-background" />

      <div className="absolute inset-0 grid-overlay opacity-40" />


      <div className="container px-4 relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div className="space-y-3">
            <h2 className="text-4xl md:text-5xl lg:text-7xl tracking-tight" style={{ fontFamily: '"Inter Display", sans-serif', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.04em' }}>
              Featured <span className="text-gradient">Turfs</span>
            </h2>
            <p className="text-lg text-muted-foreground font-medium max-w-lg leading-relaxed">
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
                    sports={sports}
                    availableSlots={5}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.section>
  );
};

export default FeaturedTurfs;
