import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useEffect, useState } from "react";
import api from "@/services/api";
import ClientDashboard from "./client/ClientDashboard";
import PlayerDashboard from "./player/PlayerDashboard";

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
      const apiCalls: Promise<any>[] = [
        api.get("/bookings/my").catch(() => ({ data: [] }))
      ];

      // Only fetch player stats if user is a player
      if (user.role === "player") {
        apiCalls.push(
          api.get("/tournaments/player-stats").catch(() => ({ data: [] }))
        );
      }

      const responses = await Promise.all(apiCalls);
      const bookingsRes = responses[0];
      const tournamentsRes = user.role === "player" ? responses[1] : { data: [] };

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

  // If user is a client, show ClientDashboard
  if (!loading && user?.role === "client") {
    return <ClientDashboard />;
  }

  // If user is a player, show PlayerDashboard
  if (!loading && user?.role === "player") {
    return <PlayerDashboard />;
  }

  // Loading or unknown role - show loading/error
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-12 container mx-auto px-4">
        {loading && (
          <p className="text-center text-muted-foreground">Loading profile...</p>
        )}
        {!loading && !user && (
          <p className="text-center text-muted-foreground">Please log in to view your dashboard.</p>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ProfilePage;