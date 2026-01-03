import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useEffect, useState } from "react";
import api from "@/services/api";

interface ProfileStats {
  turfs_booked: number;
  tournaments_participated: number;
  turfs_owned: number;
  tournaments_hosted: number;
}

interface HistoryItem {
  id: string | number;
  type: 'booking' | 'tournament';
  name: string;
  date?: string;
  owner_name?: string;
  status?: string;
}

interface ProfileUser {
  id: string;
  name: string;
  email: string;
  role: string;
  profile_image_url?: string | null;
}

const ProfilePage = () => {
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [name, setName] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"turfs" | "tournaments">("turfs");

  const loadProfile = async () => {
    try {
      const res = await api.get("/profile/me");
      const data = res.data;
      setUser(data.user);
      setStats(data.stats);
      setName(data.user?.name || "");
    } catch (e) {
      console.error("Failed to load profile", e);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    if (!user) return;
    setHistoryLoading(true);
    try {
      const [bookingsRes, tournamentsRes] = await Promise.all([
        api.get("/bookings/my").catch(() => ({ data: [] })),
        api.get("/tournaments/player-stats").catch(() => ({ data: [] }))
      ]);

      const historyItems: HistoryItem[] = [];

      // Add bookings
      if (bookingsRes.data && Array.isArray(bookingsRes.data)) {
        bookingsRes.data.forEach((b: any) => {
          if (b.turf_name) {
            historyItems.push({
              id: b.id,
              type: 'booking',
              name: b.turf_name,
              date: b.slot_time,
              owner_name: b.turf_owner_name,
              status: b.status
            });
          }
        });
      }

      // Add tournaments
      if (tournamentsRes.data && Array.isArray(tournamentsRes.data)) {
        tournamentsRes.data.forEach((t: any) => {
          if (t.name) {
            historyItems.push({
              id: t.id,
              type: 'tournament',
              name: t.name,
              date: t.start_date,
              status: t.status
            });
          }
        });
      }

      // Sort by date (most recent first)
      historyItems.sort((a, b) => {
        if (!a.date || !b.date) return 0;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });

      setHistory(historyItems);
    } catch (e) {
      console.error("Failed to load history", e);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (user) {
      loadHistory();
    }
  }, [user]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    try {
      let profileImageUrl = user.profile_image_url || undefined;

      if (avatarFile) {
        const form = new FormData();
        form.append("avatar", avatarFile);
        const uploadRes = await api.post("/profile/avatar", form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        profileImageUrl = uploadRes.data.profile_image_url;
      }

      const updateRes = await api.put("/profile", {
        name,
        profile_image_url: profileImageUrl,
      });

      setUser(updateRes.data);

      // Sync basic identity to localStorage for Navbar
      if (updateRes.data?.name) {
        localStorage.setItem("name", updateRes.data.name);
      }
      if (updateRes.data?.profile_image_url) {
        localStorage.setItem("profile_image_url", updateRes.data.profile_image_url);
      }

      // Refresh stats as well
      await loadProfile();
    } catch (e) {
      console.error("Failed to save profile", e);
    } finally {
      setSaving(false);
    }
  };

  const displayAvatar = avatarPreview || user?.profile_image_url || undefined;
  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "U";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-12 container mx-auto px-4">
        {loading && (
          <p className="text-center text-muted-foreground">Loading profile...</p>
        )}

        {!loading && user && (
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,320px),minmax(0,1fr)] gap-8">
            {/* Left: profile editing */}
            <Card className="glass-card border-white/10">
              <CardContent className="p-6 space-y-4">
                <div className="flex flex-col items-center gap-4">
                  <Avatar className="h-20 w-20">
                    {displayAvatar && <AvatarImage src={displayAvatar} alt={user.name} />}
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>

                  <div className="w-full space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>

                  <div className="w-full space-y-2">
                    <Label>Email</Label>
                    <Input value={user.email} disabled />
                  </div>

                  <div className="w-full space-y-2">
                    <Label>Role</Label>
                    <Input value={user.role} disabled />
                  </div>

                  <div className="w-full space-y-2">
                    <Label htmlFor="avatar">Profile Picture</Label>
                    <Input
                      id="avatar"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                    />
                  </div>

                  <Button
                    className="w-full mt-2"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save Profile"}
                  </Button>
                </div>
              </CardContent>
            </Card>
            {/* Right: stats + internal nav and role-based content */}
            <div className="space-y-6">
              <Card className="glass-card border-white/10">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <h2 className="text-xl font-heading font-bold mb-1">
                        Dashboard Overview
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        Quick view of your turf and tournament activity.
                      </p>
                    </div>
                    {stats && (
                      <div className="grid grid-cols-2 gap-3 text-xs min-w-[220px]">
                        {user.role === "player" && (
                          <>
                            <div className="p-3 rounded-xl bg-secondary/40">
                              <p className="text-[10px] text-muted-foreground mb-1">
                                Turfs Booked
                              </p>
                              <p className="text-xl font-heading font-bold">
                                {stats.turfs_booked}
                              </p>
                            </div>
                            <div className="p-3 rounded-xl bg-secondary/40">
                              <p className="text-[10px] text-muted-foreground mb-1">
                                Tournaments Participated
                              </p>
                              <p className="text-xl font-heading font-bold">
                                {stats.tournaments_participated}
                              </p>
                            </div>
                          </>
                        )}
                        {user.role === "client" && (
                          <>
                            <div className="p-3 rounded-xl bg-secondary/40">
                              <p className="text-[10px] text-muted-foreground mb-1">
                                Turfs Owned
                              </p>
                              <p className="text-xl font-heading font-bold">
                                {stats.turfs_owned}
                              </p>
                            </div>
                            <div className="p-3 rounded-xl bg-secondary/40">
                              <p className="text-[10px] text-muted-foreground mb-1">
                                Tournaments Hosted
                              </p>
                              <p className="text-xl font-heading font-bold">
                                {stats.tournaments_hosted}
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Internal nav */}
                  <div className="inline-flex rounded-full bg-secondary/40 p-1 text-xs">
                    <button
                      className={`px-4 py-1.5 rounded-full font-medium transition-all ${
                        activeTab === "turfs"
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      onClick={() => setActiveTab("turfs")}
                    >
                      My Turfs
                    </button>
                    <button
                      className={`px-4 py-1.5 rounded-full font-medium transition-all ${
                        activeTab === "tournaments"
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      onClick={() => setActiveTab("tournaments")}
                    >
                      My Tournaments
                    </button>
                  </div>
                </CardContent>
              </Card>

              {/* Role-specific content using history for players; simple placeholder for clients for now */}
              {user.role === "player" && (
                <Card className="glass-card border-white/10">
                  <CardContent className="p-6 space-y-4">
                    <h2 className="text-lg font-heading font-bold">
                      {activeTab === "turfs" ? "Booked Turfs" : "Tournament Participation"}
                    </h2>
                    {historyLoading ? (
                      <p className="text-muted-foreground text-sm">Loading activity...</p>
                    ) : (
                      <>
                        {history.filter((item) =>
                          activeTab === "turfs"
                            ? item.type === "booking"
                            : item.type === "tournament",
                        ).length === 0 ? (
                          <p className="text-muted-foreground text-sm">
                            No {activeTab === "turfs" ? "bookings" : "tournament entries"} yet.
                          </p>
                        ) : (
                          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                            {history
                              .filter((item) =>
                                activeTab === "turfs"
                                  ? item.type === "booking"
                                  : item.type === "tournament",
                              )
                              .map((item) => (
                                <div
                                  key={`${item.type}-${item.id}`}
                                  className="p-4 rounded-xl bg-secondary/40 border border-white/5 hover:bg-secondary/60 transition-colors"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span
                                          className={`px-2 py-1 rounded text-[10px] font-medium ${
                                            item.type === "booking"
                                              ? "bg-primary/20 text-primary"
                                              : "bg-amber-500/20 text-amber-500"
                                          }`}
                                        >
                                          {item.type === "booking"
                                            ? "Turf Booking"
                                            : "Tournament"}
                                        </span>
                                        {item.status && (
                                          <span className="text-[10px] text-muted-foreground capitalize">
                                            {item.status.replace(/_/g, " ")}
                                          </span>
                                        )}
                                      </div>
                                      <h3 className="font-semibold text-foreground mb-1 truncate">
                                        {item.name}
                                      </h3>
                                      {item.owner_name && (
                                        <p className="text-xs text-muted-foreground truncate">
                                          Owner: {item.owner_name}
                                        </p>
                                      )}
                                      {item.date && (
                                        <p className="text-[11px] text-muted-foreground mt-1">
                                          {item.date}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              )}

              {user.role === "client" && (
                <Card className="glass-card border-white/10">
                  <CardContent className="p-6 space-y-2">
                    <h2 className="text-lg font-heading font-bold mb-2">
                      {activeTab === "turfs" ? "Your Turfs" : "Your Tournaments"}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      This unified view will show your owned turfs and hosted tournaments. Current data is sourced from the same APIs used on the Client Dashboard.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      For now, continue using the Client Dashboard cards for detailed management while this unified view is being enriched.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default ProfilePage;