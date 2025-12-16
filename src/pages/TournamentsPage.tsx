import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Trophy, 
  MapPin, 
  Calendar, 
  Users, 
  Gift, 
  Clock, 
  Search,
  Filter,
  ChevronDown,
  Flame,
  Target
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

const allTournaments = [
  {
    id: "1",
    name: "Mumbai Premier League",
    sport: "Football",
    date: "Dec 20-22, 2024",
    time: "6:00 PM - 10:00 PM",
    location: "Green Arena, Mumbai",
    city: "Mumbai",
    teams: 16,
    prize: "₹1,00,000",
    image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800",
    status: "Registering",
    spotsLeft: 4,
    entryFee: "₹5,000",
    format: "Knockout",
  },
  {
    id: "2",
    name: "Bangalore Cricket Cup",
    sport: "Cricket",
    date: "Dec 28-30, 2024",
    time: "9:00 AM - 6:00 PM",
    location: "Champions Hub, Bangalore",
    city: "Bangalore",
    teams: 8,
    prize: "₹75,000",
    image: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800",
    status: "Registering",
    spotsLeft: 2,
    entryFee: "₹3,000",
    format: "Round Robin",
  },
  {
    id: "3",
    name: "Delhi Badminton Open",
    sport: "Badminton",
    date: "Jan 5-7, 2025",
    time: "4:00 PM - 9:00 PM",
    location: "Sports Complex, Delhi",
    city: "Delhi",
    teams: 32,
    prize: "₹50,000",
    image: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800",
    status: "Coming Soon",
    spotsLeft: 32,
    entryFee: "₹1,500",
    format: "Knockout",
  },
  {
    id: "4",
    name: "Chennai Tennis Masters",
    sport: "Tennis",
    date: "Jan 12-14, 2025",
    time: "7:00 AM - 12:00 PM",
    location: "Elite Sports Zone, Chennai",
    city: "Chennai",
    teams: 16,
    prize: "₹60,000",
    image: "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800",
    status: "Coming Soon",
    spotsLeft: 16,
    entryFee: "₹2,500",
    format: "Knockout",
  },
  {
    id: "5",
    name: "Hyderabad Hockey Challenge",
    sport: "Hockey",
    date: "Jan 18-20, 2025",
    time: "5:00 PM - 9:00 PM",
    location: "Stadium Arena, Hyderabad",
    city: "Hyderabad",
    teams: 12,
    prize: "₹80,000",
    image: "https://images.unsplash.com/photo-1519766030446-ae88fdb13796?w=800",
    status: "Coming Soon",
    spotsLeft: 12,
    entryFee: "₹4,000",
    format: "League",
  },
  {
    id: "6",
    name: "Pune Basketball League",
    sport: "Basketball",
    date: "Jan 25-27, 2025",
    time: "6:00 PM - 10:00 PM",
    location: "Sports Hub, Pune",
    city: "Pune",
    teams: 8,
    prize: "₹45,000",
    image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800",
    status: "Registering",
    spotsLeft: 3,
    entryFee: "₹2,000",
    format: "Knockout",
  },
  {
    id: "7",
    name: "Kolkata Football Fiesta",
    sport: "Football",
    date: "Feb 1-3, 2025",
    time: "4:00 PM - 9:00 PM",
    location: "City Ground, Kolkata",
    city: "Kolkata",
    teams: 24,
    prize: "₹1,50,000",
    image: "https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=800",
    status: "Coming Soon",
    spotsLeft: 24,
    entryFee: "₹6,000",
    format: "League + Knockout",
  },
  {
    id: "8",
    name: "Ahmedabad Cricket Premier",
    sport: "Cricket",
    date: "Feb 8-10, 2025",
    time: "8:00 AM - 5:00 PM",
    location: "Green Park, Ahmedabad",
    city: "Ahmedabad",
    teams: 16,
    prize: "₹90,000",
    image: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800",
    status: "Registering",
    spotsLeft: 6,
    entryFee: "₹4,500",
    format: "Round Robin",
  },
];

const sportFilters = ["All Sports", "Football", "Cricket", "Badminton", "Tennis", "Basketball", "Hockey"];
const dateFilters = ["All Dates", "This Week", "This Month", "Next Month", "Custom"];
const cityFilters = ["All Cities", "Mumbai", "Bangalore", "Delhi", "Chennai", "Hyderabad", "Pune", "Kolkata", "Ahmedabad"];

const TournamentsPage = () => {
  const [selectedSport, setSelectedSport] = useState("All Sports");
  const [selectedDate, setSelectedDate] = useState("All Dates");
  const [selectedCity, setSelectedCity] = useState("All Cities");
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTournaments = allTournaments.filter((tournament) => {
    const matchesSport = selectedSport === "All Sports" || tournament.sport === selectedSport;
    const matchesCity = selectedCity === "All Cities" || tournament.city === selectedCity;
    const matchesSearch = tournament.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tournament.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSport && matchesCity && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16 relative">
        {/* Background Effects */}
        <div className="absolute inset-0 grid-overlay-intense" />
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px] animate-glow-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-primary/3 rounded-full blur-[120px] animate-glow-pulse" style={{ animationDelay: '1.5s' }} />

        <div className="container px-4 relative z-10">
          {/* Header */}
          <div className="text-center mb-12 animate-slide-up opacity-0">
            <Badge variant="featured" className="mb-4 animate-border-glow">
              <Trophy className="w-4 h-4 mr-2" />
              Tournaments
            </Badge>
            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4">
              Compete & <span className="text-gradient neon-glow">Win Big</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Join exciting tournaments, showcase your skills, and win amazing prizes across multiple sports
            </p>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 animate-scale-in opacity-0 stagger-2">
            {[
              { value: "50+", label: "Active Tournaments", icon: Trophy },
              { value: "₹10L+", label: "Total Prize Pool", icon: Gift },
              { value: "500+", label: "Teams Registered", icon: Users },
              { value: "25+", label: "Cities Covered", icon: MapPin },
            ].map((stat, index) => (
              <Card key={stat.label} variant="glass" className="glass-card hover-lift">
                <CardContent className="p-4 text-center">
                  <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-primary/10 flex items-center justify-center">
                    <stat.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="font-heading text-xl md:text-2xl font-bold text-primary">{stat.value}</div>
                  <div className="text-muted-foreground text-xs">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Search & Filters */}
          <Card variant="glass" className="mb-8 glass-card animate-slide-up opacity-0 stagger-3">
            <CardContent className="p-4 md:p-6">
              {/* Search Bar */}
              <div className="flex flex-col lg:flex-row gap-4 mb-4">
                <div className="flex-1 flex items-center gap-3 bg-secondary/50 rounded-xl px-4 py-3 border border-border/30 focus-within:border-primary/50 transition-all duration-300">
                  <Search className="w-5 h-5 text-primary" />
                  <input
                    type="text"
                    placeholder="Search tournaments..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground"
                  />
                </div>

                <Button 
                  variant="outline" 
                  className="lg:hidden"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                  <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                </Button>

                <Button variant="hero" className="shadow-glow-sm hover:shadow-glow transition-all duration-300">
                  <Search className="w-4 h-4" />
                  Search
                </Button>
              </div>

              {/* Filter Options */}
              <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${showFilters ? 'block' : 'hidden lg:grid'}`}>
                {/* Sport Filter */}
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Sport
                  </label>
                  <select
                    value={selectedSport}
                    onChange={(e) => setSelectedSport(e.target.value)}
                    className="w-full bg-secondary/50 text-foreground rounded-xl px-4 py-3 outline-none border border-border/30 focus:border-primary/50 transition-all"
                  >
                    {sportFilters.map((sport) => (
                      <option key={sport} value={sport}>{sport}</option>
                    ))}
                  </select>
                </div>

                {/* Date Filter */}
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Date
                  </label>
                  <select
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full bg-secondary/50 text-foreground rounded-xl px-4 py-3 outline-none border border-border/30 focus:border-primary/50 transition-all"
                  >
                    {dateFilters.map((date) => (
                      <option key={date} value={date}>{date}</option>
                    ))}
                  </select>
                </div>

                {/* City Filter */}
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Location
                  </label>
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full bg-secondary/50 text-foreground rounded-xl px-4 py-3 outline-none border border-border/30 focus:border-primary/50 transition-all"
                  >
                    {cityFilters.map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results Count */}
          <div className="flex items-center justify-between mb-6 animate-fade-in opacity-0 stagger-4">
            <p className="text-muted-foreground">
              Showing <span className="text-foreground font-semibold">{filteredTournaments.length}</span> tournaments
            </p>
            <select className="bg-secondary/50 text-foreground rounded-lg px-4 py-2 text-sm outline-none border border-border/30">
              <option>Sort by: Date</option>
              <option>Prize: High to Low</option>
              <option>Prize: Low to High</option>
              <option>Spots Left</option>
            </select>
          </div>

          {/* Tournaments Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredTournaments.map((tournament, index) => (
              <Card
                key={tournament.id}
                variant="interactive"
                className="group overflow-hidden hover-lift animate-slide-up opacity-0 glass-card"
                style={{ animationDelay: `${0.4 + index * 0.05}s` }}
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
                      {tournament.status === "Registering" && (
                        <Flame className="w-3 h-3 mr-1 animate-pulse" />
                      )}
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
                      <Clock className="w-4 h-4 text-primary/70" />
                      <span>{tournament.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <MapPin className="w-4 h-4 text-primary/70" />
                      <span className="line-clamp-1">{tournament.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Users className="w-4 h-4 text-primary/70" />
                      <span>{tournament.teams} Teams • {tournament.format}</span>
                    </div>
                  </div>

                  {/* Entry Fee & Spots */}
                  <div className="flex items-center justify-between pt-3 border-t border-border/50">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Entry: </span>
                      <span className="font-semibold text-foreground">{tournament.entryFee}</span>
                    </div>
                    {tournament.status === "Registering" ? (
                      <div className="flex items-center gap-1.5 text-sm">
                        <span className="text-destructive font-medium">{tournament.spotsLeft} spots</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">Opens soon</span>
                    )}
                  </div>

                  {/* Join Button */}
                  <Button 
                    variant={tournament.status === "Registering" ? "hero" : "outline"} 
                    className="w-full shadow-glow-sm hover:shadow-glow transition-all duration-300"
                  >
                    {tournament.status === "Registering" ? "Join Tournament" : "Notify Me"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* No Results */}
          {filteredTournaments.length === 0 && (
            <div className="text-center py-16 animate-fade-in">
              <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="font-heading text-xl font-semibold text-foreground mb-2">No tournaments found</h3>
              <p className="text-muted-foreground">Try adjusting your filters to find more tournaments</p>
            </div>
          )}

          {/* Load More */}
          {filteredTournaments.length > 0 && (
            <div className="flex justify-center mt-12">
              <Button variant="outline" size="lg" className="hover-lift">
                Load More Tournaments
              </Button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TournamentsPage;