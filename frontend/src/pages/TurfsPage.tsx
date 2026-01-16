import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import TurfCard from "@/components/turfs/TurfCard";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState, useMemo } from "react";
import { getAllTurfs } from "@/services/turfService";
import { Turf } from "@/types";
import AnimatedStatsBar from "@/components/ui/AnimatedStatsBar";

const TurfPage = () => {
  const [turfs, setTurfs] = useState<Turf[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await getAllTurfs();
        const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
        setTurfs(data.filter((t: Turf) => t.verification_status === "approved"));
      } catch (err: unknown) {
        console.error("Failed to load turfs", err);
        const errorMessage = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Failed to load turfs";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Calculate platform-wide stats
  const stats = useMemo(() => {
    const totalTurfs = turfs.length;
    const totalTournaments = turfs.reduce((sum, t) => sum + (t.tournaments_hosted || 0), 0);
    const totalMatches = turfs.reduce((sum, t) => sum + (t.matches_played || 0), 0);
    return { totalTurfs, totalTournaments, totalMatches };
  }, [turfs]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-12 container mx-auto px-4">
        <div className="text-center mb-10 space-y-2">
          <Badge variant="success">Available Turfs</Badge>
          <h1 className="text-3xl font-bold mt-2">Browse Turfs</h1>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            Discover active turfs along with how many tournaments they host and
            how often they are played on.
          </p>
        </div>

        {/* Platform Stats Bar - Animated */}
        {!loading && !error && turfs.length > 0 && (
          <AnimatedStatsBar
            stats={[
              { value: stats.totalTurfs, label: "Active Turfs" },
              { value: stats.totalTournaments, label: "Tournaments Hosted" },
              { value: stats.totalMatches, label: "Matches Played" },
            ]}
          />
        )}

        {loading && (
          <p className="text-center text-muted-foreground">Loading turfs...</p>
        )}

        {!loading && error && (
          <p className="text-center text-red-500">{error}</p>
        )}

        {!loading && !error && turfs.length === 0 && (
          <p className="text-center text-muted-foreground">
            No turfs available yet.
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {turfs.map((turf, index) => {
            const images = Array.isArray(turf.images)
              ? turf.images
              : typeof turf.images === "string"
                ? turf.images.split(",")
                : [];
            const displayImage = images[0] || undefined;
            const sports = Array.isArray(turf.sports)
              ? turf.sports
              : typeof turf.sports === "string"
                ? turf.sports.split(",")
                : [];

            const tournamentsHosted = turf.tournaments_hosted ?? 0;
            const matchesPlayed = turf.matches_played ?? 0;
            const isPopular = Boolean(turf.is_popular);

            return (
              <div
                key={turf.id}
                className="animate-slide-up opacity-0"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <TurfCard
                  id={turf.id}
                  name={turf.name}
                  location={turf.location}
                  image={displayImage}
                  price={turf.price_per_slot}
                  rating={4.5}
                  reviews={matchesPlayed}
                  sports={sports}
                  availableSlots={0}
                  featured={isPopular}
                  tournamentsHosted={tournamentsHosted}
                  matchesPlayed={matchesPlayed}
                />
              </div>
            );
          })}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TurfPage;
