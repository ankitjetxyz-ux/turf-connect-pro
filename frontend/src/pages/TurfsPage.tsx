import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import TurfCard from "@/components/turfs/TurfCard";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { getAllTurfs } from "@/services/turfService";

const TurfPage = () => {
  const [turfs, setTurfs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getPrimaryImage = (images: any): string | undefined => {
    if (Array.isArray(images) && images.length > 0) {
      return images[0];
    }
    if (typeof images === "string") {
      return images.split(",")[0];
    }
    return undefined;
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await getAllTurfs();
        const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
        setTurfs(data);
      } catch (err: any) {
        console.error("Failed to load turfs", err);
        setError(err?.response?.data?.error || "Failed to load turfs");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-12 container mx-auto px-4">
        <div className="text-center mb-10">
          <Badge variant="success">Available Turfs</Badge>
          <h1 className="text-3xl font-bold mt-2">Browse Turfs</h1>
        </div>

        {loading && (
          <p className="text-center text-muted-foreground">Loading turfs...</p>
        )}

        {!loading && error && (
          <p className="text-center text-red-500">{error}</p>
        )}

        {!loading && !error && turfs.length === 0 && (
          <p className="text-center text-muted-foreground">No turfs available yet.</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {turfs.map((turf, index) => {
            const images = Array.isArray(turf.images)
              ? turf.images
              : typeof turf.images === "string"
                ? turf.images.split(",")
                : [];
            const displayImage = images[0] || undefined;
            const sports = Array.isArray(turf.facilities)
              ? turf.facilities
              : typeof turf.facilities === "string"
                ? turf.facilities.split(",")
                : [];

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
                  reviews={sports.length}
                  sports={sports}
                  availableSlots={0}
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
