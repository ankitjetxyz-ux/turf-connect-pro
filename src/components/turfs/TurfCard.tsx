import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, MapPin, Clock, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

interface TurfCardProps {
  id: string;
  name: string;
  location: string;
  image: string;
  rating: number;
  reviews: number;
  price: number;
  sports: string[];
  availableSlots: number;
  featured?: boolean;
}

const TurfCard = ({
  id,
  name,
  location,
  image,
  rating,
  reviews,
  price,
  sports,
  availableSlots,
  featured = false,
}: TurfCardProps) => {
  const [isLiked, setIsLiked] = useState(false);

  return (
    <Card
      variant={featured ? "featured" : "interactive"}
      className="group overflow-hidden hover-lift glass-card"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {featured && (
            <Badge variant="featured" className="backdrop-blur-sm">⭐ Featured</Badge>
          )}
          {availableSlots <= 3 && (
            <Badge variant="destructive" className="backdrop-blur-sm animate-pulse">
              Only {availableSlots} slots!
            </Badge>
          )}
        </div>

        {/* Favorite Button */}
        <button 
          onClick={() => setIsLiked(!isLiked)}
          className={`absolute top-3 right-3 w-10 h-10 rounded-full glass-effect flex items-center justify-center transition-all duration-300 hover:scale-110 ${
            isLiked ? 'text-destructive bg-destructive/20' : 'text-foreground hover:text-destructive'
          }`}
        >
          <Heart className={`w-5 h-5 transition-all ${isLiked ? 'fill-destructive' : ''}`} />
        </button>

        {/* Price Tag */}
        <div className="absolute bottom-3 right-3 glass-effect rounded-xl px-3 py-2 backdrop-blur-md">
          <span className="font-heading font-bold text-primary text-lg">₹{price}</span>
          <span className="text-muted-foreground text-sm">/hr</span>
        </div>
      </div>

      <CardContent className="p-5 space-y-4">
        {/* Title & Location */}
        <div>
          <h3 className="font-heading font-bold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1">
            {name}
          </h3>
          <div className="flex items-center gap-1.5 text-muted-foreground text-sm mt-1">
            <MapPin className="w-4 h-4 text-primary/70" />
            <span className="line-clamp-1">{location}</span>
          </div>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/20">
            <Star className="w-4 h-4 text-primary fill-primary" />
            <span className="font-semibold text-primary">{rating}</span>
          </div>
          <span className="text-muted-foreground text-sm">({reviews} reviews)</span>
        </div>

        {/* Sports Tags */}
        <div className="flex flex-wrap gap-2">
          {sports.slice(0, 3).map((sport) => (
            <Badge key={sport} variant="secondary" className="text-xs bg-secondary/80 hover:bg-secondary transition-colors">
              {sport}
            </Badge>
          ))}
          {sports.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{sports.length - 3} more
            </Badge>
          )}
        </div>

        {/* Availability & CTA */}
        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Clock className="w-4 h-4" />
            <span>{availableSlots} slots available</span>
          </div>
          <Button variant="hero" size="sm" asChild className="shadow-glow-sm hover:shadow-glow transition-shadow">
            <Link to={`/turfs/${id}`}>Book Now</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TurfCard;
