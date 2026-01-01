import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import TurfCard from "@/components/turfs/TurfCard";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState, useMemo } from "react";
import { getAllTurfs } from "@/services/turfService";
import { Turf } from "@/types";
import { Building2, Trophy, Gamepad2 } from "lucide-react";

const TurfPage = () => {
  const [turfs, setTurfs] = useState<Turf[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await getAllTurfs();
        const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
        setTurfs(data);
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

        {/* Platform Stats Bar */}
        {!loading && !error && turfs.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border-blue-500/20">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-400">{stats.totalTurfs}</div>
                  <p className="text-sm text-muted-foreground">Active Turfs</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/5 border-purple-500/20">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-400">{stats.totalTournaments}</div>
                  <p className="text-sm text-muted-foreground">Tournaments Hosted</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border-emerald-500/20">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <Gamepad2 className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-emerald-400">{stats.totalMatches}</div>
                  <p className="text-sm text-muted-foreground">Matches Played</p>
                </div>
              </CardContent>
            </Card>
          </div>
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
