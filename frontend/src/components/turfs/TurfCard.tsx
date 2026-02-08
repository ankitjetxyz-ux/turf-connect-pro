import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Heart, Phone, ChevronDown, ChevronUp } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

interface TurfCardProps {
  id: string | number;
  name?: string;
  location?: string;
  image?: string;
  rating?: number;
  reviews?: number;
  reviewsCount?: number;
  price?: number;
  sports?: string[];
  availableSlots?: number;
  featured?: boolean;
  tournamentsHosted?: number;
  matchesPlayed?: number;
  ownerPhone?: string;
  onToggleFavorite?: () => void;
}

const TurfCard = ({
  id,
  name = "Unnamed Turf",
  location = "Location not specified",
  image = "/placeholder.jpg",
  rating = 0,
  reviews = 0,
  reviewsCount = 0,
  price = 0,
  sports = [],
  availableSlots = 0,
  featured = false,
  tournamentsHosted = 0,
  matchesPlayed = 0,
  ownerPhone,
  onToggleFavorite,
}: TurfCardProps) => {
  const [isLiked, setIsLiked] = useState(() => {
    try {
      const stored = localStorage.getItem('favourite_turfs');
      if (stored) {
        const favs = JSON.parse(stored);
        // Loose comparison to handle string/number mismatch
        return favs.some((fid: any) => fid == id);
      }
    } catch (e) {
      console.error("Error reading favourites", e);
    }
    return false;
  });
  const [showFullAddress, setShowFullAddress] = useState(false);

  // Truncate address if too long (max 50 chars by default)
  const maxAddressLength = 50;
  const shouldTruncate = location.length > maxAddressLength;
  const displayAddress = shouldTruncate && !showFullAddress
    ? `${location.substring(0, maxAddressLength)}...`
    : location;

  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const stored = localStorage.getItem('favourite_turfs');
      let favs = stored ? JSON.parse(stored) : [];

      if (isLiked) {
        favs = favs.filter((fid: any) => fid != id);
      } else {
        // Avoid duplicates
        if (!favs.some((fid: any) => fid == id)) {
          favs.push(id);
        }
      }

      localStorage.setItem('favourite_turfs', JSON.stringify(favs));
      setIsLiked(!isLiked);
      if (onToggleFavorite) onToggleFavorite();
    } catch (err) {
      console.error("Failed to toggle favorite", err);
    }
  };

  return (
    <Card
      id={`turf-card-${id}`}
      variant="glass"
      className={`group overflow-hidden hover-lift glass-card h-full flex flex-col cursor-pointer transition-colors ${featured ? "border-primary/30 shadow-glow" : "hover:border-primary/50 hover:shadow-glow"
        }`}
    >
      <div className="relative aspect-[4/3] overflow-hidden shrink-0">
        <img
          src={image}
          alt={name}
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/placeholder.jpg";
          }}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />

        <button
          onClick={toggleFavorite}
          className={`absolute top-3 right-3 w-10 h-10 rounded-full glass-effect flex items-center justify-center transition-all ${isLiked ? "bg-white/20 text-red-500" : "text-foreground hover:text-red-500"
            }`}
        >
          <Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
        </button>

        <div className="absolute bottom-3 right-3 glass-effect rounded-xl px-3 py-2">
          <span className="font-bold text-primary text-lg">₹{price}</span>
          <span className="text-muted-foreground text-sm">/slot</span>
        </div>
      </div>

      <CardContent className="p-5 flex flex-col flex-1">
        <div className="flex-1 space-y-3">
          <h3 className="font-bold text-xl line-clamp-1">{name}</h3>

          <div className="min-h-[60px]">
            <div className="flex items-start gap-1.5 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 text-primary/70 mt-0.5 shrink-0" />
              <div className="flex-1">
                <span className="line-clamp-2">{location}</span>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    window.open(`https://www.google.com/maps/search/?q=${encodeURIComponent(location)}`, "_blank");
                  }}
                  className="block text-xs text-primary mt-1 hover:underline font-medium"
                >
                  View on map
                </button>
              </div>
            </div>

            {ownerPhone && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-2">
                <Phone className="w-4 h-4 text-primary/70 shrink-0" />
                <a
                  href={`tel:${ownerPhone}`}
                  onClick={(e) => e.stopPropagation()}
                  className="hover:text-primary transition-colors"
                >
                  {ownerPhone}
                </a>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 min-h-[28px]">
            {sports.slice(0, 3).map((sport) => (
              <Badge key={sport} variant="secondary" className="text-xs">
                {sport}
              </Badge>
            ))}
            {sports.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{sports.length - 3} more
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t mt-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            {availableSlots} slots available
          </div>

          <Button variant="hero" size="sm" asChild>
            <Link to={`/turfs/${id}`}>Book Now</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TurfCard;
