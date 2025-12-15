import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, MapPin, Calendar, Users, Gift, ArrowRight, Clock } from "lucide-react";
import { Link } from "react-router-dom";

const tournaments = [
  {
    id: "1",
    name: "Mumbai Premier League",
    sport: "Football",
    date: "Dec 20-22, 2024",
    location: "Green Arena, Mumbai",
    teams: 16,
    prize: "₹1,00,000",
    image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800",
    status: "Registering",
    spotsLeft: 4,
  },
  {
    id: "2",
    name: "Bangalore Cricket Cup",
    sport: "Cricket",
    date: "Dec 28-30, 2024",
    location: "Champions Hub, Bangalore",
    teams: 8,
    prize: "₹75,000",
    image: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800",
    status: "Registering",
    spotsLeft: 2,
  },
  {
    id: "3",
    name: "Delhi Badminton Open",
    sport: "Badminton",
    date: "Jan 5-7, 2025",
    location: "Sports Complex, Delhi",
    teams: 32,
    prize: "₹50,000",
    image: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800",
    status: "Coming Soon",
    spotsLeft: 32,
  },
  {
    id: "4",
    name: "Chennai Tennis Masters",
    sport: "Tennis",
    date: "Jan 12-14, 2025",
    location: "Elite Sports Zone, Chennai",
    teams: 16,
    prize: "₹60,000",
    image: "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800",
    status: "Coming Soon",
    spotsLeft: 16,
  },
];

const TournamentsSection = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 grid-overlay" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl animate-glow-pulse" />
      
      <div className="container px-4 relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow-sm">
                <Trophy className="w-5 h-5 text-primary-foreground" />
              </div>
              <Badge variant="featured" className="animate-border-glow">🏆 Tournaments</Badge>
            </div>
            <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
              Upcoming <span className="text-gradient">Competitions</span>
            </h2>
            <p className="text-muted-foreground max-w-lg">
              Join exciting tournaments, compete with the best, and win amazing prizes
            </p>
          </div>
          <Button variant="outline" asChild className="group">
            <Link to="/tournaments" className="flex items-center gap-2">
              View All Tournaments
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>

        {/* Tournament Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {tournaments.map((tournament, index) => (
            <Card
              key={tournament.id}
              variant="interactive"
              className="group overflow-hidden hover-lift animate-slide-up opacity-0 glass-card"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Image */}
              <div className="relative aspect-[16/10] overflow-hidden">
                <img
                  src={tournament.image}
                  alt={tournament.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                
                {/* Status Badge */}
                <div className="absolute top-3 left-3">
                  <Badge 
                    variant={tournament.status === "Registering" ? "success" : "secondary"}
                    className="backdrop-blur-sm"
                  >
                    {tournament.status === "Registering" && <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse mr-1.5" />}
                    {tournament.status}
                  </Badge>
                </div>

                {/* Sport Badge */}
                <div className="absolute top-3 right-3">
                  <Badge variant="outline" className="backdrop-blur-sm bg-background/50">
                    {tournament.sport}
                  </Badge>
                </div>

                {/* Prize Tag */}
                <div className="absolute bottom-3 right-3 glass-effect rounded-lg px-3 py-1.5 flex items-center gap-1.5">
                  <Gift className="w-4 h-4 text-primary" />
                  <span className="font-heading font-bold text-primary">{tournament.prize}</span>
                </div>
              </div>

              <CardContent className="p-5 space-y-4">
                {/* Title */}
                <h3 className="font-heading font-bold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1">
                  {tournament.name}
                </h3>

                {/* Details */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Calendar className="w-4 h-4 text-primary/70" />
                    <span>{tournament.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <MapPin className="w-4 h-4 text-primary/70" />
                    <span className="line-clamp-1">{tournament.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Users className="w-4 h-4 text-primary/70" />
                    <span>{tournament.teams} Teams</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-border/50">
                  {tournament.status === "Registering" ? (
                    <div className="flex items-center gap-1.5 text-sm">
                      <Clock className="w-4 h-4 text-destructive" />
                      <span className="text-destructive font-medium">{tournament.spotsLeft} spots left</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">Registration opens soon</span>
                  )}
                  <Button 
                    variant={tournament.status === "Registering" ? "hero" : "outline"} 
                    size="sm"
                    className="transition-all duration-300"
                  >
                    {tournament.status === "Registering" ? "Join Now" : "Notify Me"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Stats Bar */}
        <div className="mt-16 glass-card rounded-2xl p-6 md:p-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {[
              { value: "50+", label: "Active Tournaments", icon: Trophy },
              { value: "500+", label: "Teams Participated", icon: Users },
              { value: "₹10L+", label: "Total Prize Pool", icon: Gift },
              { value: "25+", label: "Cities Covered", icon: MapPin },
            ].map((stat, index) => (
              <div 
                key={stat.label} 
                className="text-center animate-scale-in opacity-0"
                style={{ animationDelay: `${0.5 + index * 0.1}s` }}
              >
                <div className="flex justify-center mb-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <stat.icon className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <div className="font-heading text-2xl md:text-3xl font-bold text-primary mb-1">
                  {stat.value}
                </div>
                <div className="text-muted-foreground text-sm">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TournamentsSection;
