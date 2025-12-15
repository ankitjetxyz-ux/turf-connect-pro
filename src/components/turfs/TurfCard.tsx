import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, MapPin, Clock, Users, Heart } from "lucide-react";
import { Link } from "react-router-dom";

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
  return (
    <Card
      variant={featured ? "featured" : "interactive"}
      className="group overflow-hidden"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
        
        {/* Badges */}
        <div className="absolute top-4 left-4 flex gap-2">
          {featured && (
            <Badge variant="featured">⭐ Featured</Badge>
          )}
          {availableSlots <= 3 && (
            <Badge variant="destructive">Only {availableSlots} slots left!</Badge>
          )}
        </div>

        {/* Favorite Button */}
        <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-background/50 backdrop-blur-sm flex items-center justify-center text-foreground hover:text-destructive hover:bg-background transition-colors">
          <Heart className="w-5 h-5" />
        </button>

        {/* Price Tag */}
        <div className="absolute bottom-4 right-4 glass-effect rounded-lg px-3 py-1.5">
          <span className="font-heading font-bold text-primary">₹{price}</span>
          <span className="text-muted-foreground text-sm">/hr</span>
        </div>
      </div>

      <CardContent className="p-5 space-y-4">
        {/* Title & Location */}
        <div>
          <h3 className="font-heading font-bold text-lg text-foreground group-hover:text-primary transition-colors">
            {name}
          </h3>
          <div className="flex items-center gap-1 text-muted-foreground text-sm mt-1">
            <MapPin className="w-4 h-4" />
            {location}
          </div>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-md">
            <Star className="w-4 h-4 text-primary fill-primary" />
            <span className="font-semibold text-primary">{rating}</span>
          </div>
          <span className="text-muted-foreground text-sm">({reviews} reviews)</span>
        </div>

        {/* Sports Tags */}
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

        {/* Availability & CTA */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Clock className="w-4 h-4" />
            <span>{availableSlots} slots available</span>
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
