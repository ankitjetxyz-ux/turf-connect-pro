import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import TurfCard from "@/components/turfs/TurfCard";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState, useMemo } from "react";
import { getAllTurfs } from "@/services/turfService";
import { Turf } from "@/types";
import AnimatedStatsBar from "@/components/ui/AnimatedStatsBar";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const TurfPage = () => {
  const [turfs, setTurfs] = useState<Turf[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchCity, setSearchCity] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [refreshFavorite, setRefreshFavorite] = useState(0);

  const suggestions = useMemo(() => {
    if (!searchCity.trim()) return [];

    // Extract unique cities/locations from turfs
    // Assuming turf.location contains the city or full address
    const uniqueLocations = Array.from(new Set(
      turfs.map(t => t.location || "")
        .filter(Boolean)
        .map(loc => loc.trim())
    ));

    return uniqueLocations
      .filter(loc => loc.toLowerCase().includes(searchCity.toLowerCase()) && loc.toLowerCase() !== searchCity.toLowerCase())
      .slice(0, 5);
  }, [turfs, searchCity]);

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

  const filteredTurfs = useMemo(() => {
    let result = [...turfs];

    if (searchCity.trim()) {
      result = result.filter(turf =>
        turf.location?.toLowerCase().includes(searchCity.toLowerCase())
      );
    }

    // Sort by favourite
    const stored = localStorage.getItem('favourite_turfs');
    if (stored) {
      const favs = JSON.parse(stored);
      result.sort((a, b) => {
        const aFav = favs.includes(a.id);
        const bFav = favs.includes(b.id);
        if (aFav && !bFav) return -1;
        if (!aFav && bFav) return 1;
        return 0;
      });
    }
    return result;
  }, [turfs, searchCity, refreshFavorite]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      <div className="absolute inset-0 grid-overlay-intense opacity-50 z-0 pointer-events-none" />
      <Navbar />

      <main className="pt-24 pb-12 container mx-auto px-4 relative z-10 flex-1">
        <div className="text-center mb-10 space-y-2">
          <h1 className="text-4xl md:text-5xl lg:text-7xl tracking-tight mb-6" style={{ fontFamily: '"Inter Display", sans-serif', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.04em' }}>
            Browse <span className="text-gradient">Turfs</span>
          </h1>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            Discover active turfs along with how many tournaments they host and
            how often they are played on.
          </p>


        </div>

        {/* Platform Stats Bar - Animated */}
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

        <div className="flex justify-start mb-6 z-50 relative">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
            <Input
              type="text"
              placeholder="Search by city..."
              className="pl-12 h-12 rounded-2xl bg-black/20 border-white/10 backdrop-blur-md shadow-lg focus:border-primary/50 focus:bg-black/30 transition-all text-sm font-medium"
              style={{
                boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.2)',
              }}
              value={searchCity}
              onChange={(e) => {
                setSearchCity(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            />

            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50">
                {suggestions.map((suggestion, idx) => (
                  <div
                    key={idx}
                    className="px-4 py-3 text-sm text-foreground/90 hover:bg-white/10 cursor-pointer transition-colors border-b border-white/5 last:border-0"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setSearchCity(suggestion);
                      setShowSuggestions(false);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Search className="w-3 h-3 opacity-50" />
                      {suggestion}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {loading && (
          <p className="text-center text-muted-foreground">Loading turfs...</p>
        )}

        {!loading && error && (
          <p className="text-center text-red-500">{error}</p>
        )}

        {!loading && !error && filteredTurfs.length === 0 && (
          <p className="text-center text-muted-foreground py-12">
            {searchCity ? `No turfs found in "${searchCity}"` : "No turfs available yet."}
          </p>
        )}

        {(!loading && !error && filteredTurfs.length > 0) && (
          <div className="h-[75vh] min-h-[500px] overflow-y-auto rounded-2xl border border-white/20 bg-black/90 p-6 shadow-2xl backdrop-blur-md overscroll-contain">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTurfs.map((turf, index) => {
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
                      sports={sports}
                      availableSlots={0}
                      featured={isPopular}
                      tournamentsHosted={tournamentsHosted}
                      matchesPlayed={matchesPlayed}
                      onToggleFavorite={() => setRefreshFavorite(prev => prev + 1)}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default TurfPage;
