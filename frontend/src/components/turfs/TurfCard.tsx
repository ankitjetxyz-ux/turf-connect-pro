import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, MapPin, Clock, Heart, Phone, ChevronDown, ChevronUp } from "lucide-react";
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
}: TurfCardProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const [showFullAddress, setShowFullAddress] = useState(false);
  
  // Truncate address if too long (max 50 chars by default)
  const maxAddressLength = 50;
  const shouldTruncate = location.length > maxAddressLength;
  const displayAddress = shouldTruncate && !showFullAddress 
    ? `${location.substring(0, maxAddressLength)}...` 
    : location;

  return (
    <Card
      variant={featured ? "featured" : "interactive"}
      className="group overflow-hidden hover-lift glass-card"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={image}
          alt={name}
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/placeholder.jpg";
          }}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />

        {/* Star Rating Badge - Top Left */}
        {rating > 0 && (
          <div className="absolute top-3 left-3 flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1.5 z-10">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            <span className="font-bold text-white text-sm">{rating.toFixed(1)}</span>
            {reviewsCount > 0 && (
              <span className="text-white/80 text-xs">({reviewsCount})</span>
            )}
          </div>
        )}

        <div className="absolute top-3 right-12 flex gap-2">
          {featured && <Badge variant="featured">⭐ Popular Turf</Badge>}
          {availableSlots <= 3 && (
            <Badge variant="destructive">Only {availableSlots} slots!</Badge>
          )}
        </div>

        <button
          onClick={() => setIsLiked(!isLiked)}
          className={`absolute top-3 right-3 w-10 h-10 rounded-full glass-effect flex items-center justify-center ${isLiked ? "text-destructive bg-destructive/20" : ""
            }`}
        >
          <Heart className={`w-5 h-5 ${isLiked ? "fill-destructive" : ""}`} />
        </button>

        <div className="absolute bottom-3 right-3 glass-effect rounded-xl px-3 py-2">
          <span className="font-bold text-primary text-lg">₹{price}</span>
          <span className="text-muted-foreground text-sm">/slot</span>
        </div>
      </div>

      <CardContent className="p-5 space-y-4">
        <div>
          <h3 className="font-bold text-lg line-clamp-1 mb-2">{name}</h3>
          
          {/* Address with expand/collapse */}
          <div className="space-y-1">
            <div className="flex items-start gap-1.5 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 text-primary/70 mt-0.5 shrink-0" />
              <div className="flex-1">
                <span>{displayAddress}</span>
                {shouldTruncate && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowFullAddress(!showFullAddress);
                    }}
                    className="ml-2 text-primary hover:underline inline-flex items-center gap-1 text-xs font-medium"
                  >
                    {showFullAddress ? (
                      <>
                        See less <ChevronUp className="w-3 h-3" />
                      </>
                    ) : (
                      <>
                        See more <ChevronDown className="w-3 h-3" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Contact Number */}
            {ownerPhone && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
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
        </div>

        {/* Rating Display (moved from top, now below name for better visibility) */}
        {rating > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-lg">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-3.5 h-3.5 ${
                      star <= Math.round(rating)
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-300 fill-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="font-semibold text-primary ml-1">{rating.toFixed(1)}</span>
            </div>
            {reviewsCount > 0 && (
              <span className="text-muted-foreground text-sm">
                ({reviewsCount} {reviewsCount === 1 ? 'review' : 'reviews'})
              </span>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
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

        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
          <span>Tournaments: {tournamentsHosted}</span>
          <span>Matches: {matchesPlayed}</span>
        </div>

        <div className="flex items-center justify-between pt-3 border-t">
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
