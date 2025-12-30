import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, MapPin, Calendar, Users, Gift, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "@/services/api";

const TournamentsSection = () => {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const res = await api.get("/tournaments");
        const tournamentData = Array.isArray(res.data) ? res.data : res.data?.data || [];
        // Show only first 4 tournaments on home page
        setTournaments(tournamentData.slice(0, 4));
      } catch (error) {
        console.error("Failed to fetch tournaments:", error);
        setTournaments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTournaments();
  }, []);

  if (loading) {
    return (
      <section className="py-24 relative overflow-hidden">
        <div className="container px-4 text-center">
          <p className="text-muted-foreground">Loading tournaments...</p>
        </div>
      </section>
    );
  }

  if (tournaments.length === 0) {
    return (
      <section className="py-24 relative overflow-hidden">
        <div className="container px-4 text-center">
          <h2 className="font-heading text-3xl font-bold mb-4">
            Upcoming <span className="text-gradient">Competitions</span>
          </h2>
          <p className="text-muted-foreground mb-6">No tournaments available at the moment. Check back soon!</p>
          <Link to="/tournaments">
            <Button>View All Tournaments</Button>
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 grid-overlay-intense" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/8 rounded-full blur-3xl animate-glow-pulse" />

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
              className="group overflow-hidden hover-lift animate-slide-up opacity-0 glass-card cursor-pointer"
              style={{ animationDelay: `${index * 0.1}s` }}
              onClick={() => navigate("/tournaments")}
            >
              {/* Image */}
              {tournament.image && (
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img
                    src={tournament.image}
                    alt={tournament.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />

                  {/* Sport Badge */}
                  <div className="absolute top-3 right-3">
                    <Badge variant="outline" className="backdrop-blur-sm bg-background/50">
                      {tournament.sport}
                    </Badge>
                  </div>
                </div>
              )}

              <CardContent className="p-5 space-y-4">
                {/* Title */}
                <h3 className="font-heading font-bold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1">
                  {tournament.name}
                </h3>

                {/* Details */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Calendar className="w-4 h-4 text-primary/70" />
                    <span>{tournament.start_date} - {tournament.end_date}</span>
                  </div>
                  {tournament.max_teams && (
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Users className="w-4 h-4 text-primary/70" />
                      <span>{tournament.max_teams} Teams Available</span>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-border/50">
                  {tournament.entry_fee && (
                    <div className="flex items-center gap-1.5 text-sm">
                      <Gift className="w-4 h-4 text-primary" />
                      <span className="font-bold text-primary">₹{tournament.entry_fee}</span>
                    </div>
                  )}
                  <Button
                    variant="hero"
                    size="sm"
                    className="transition-all duration-300"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate("/tournaments");
                    }}
                  >
                    View Details
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
