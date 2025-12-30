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

  useEffect(() => {
    loadProfile();
  }, []);

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
      alert("Failed to save profile");
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="md:col-span-1 glass-card border-white/10">
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

            <Card className="md:col-span-2 glass-card border-white/10">
              <CardContent className="p-6 space-y-4">
                <h2 className="text-xl font-heading font-bold mb-2">
                  Profile Stats
                </h2>

                {stats ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {user.role === "player" && (
                      <>
                        <div className="p-4 rounded-xl bg-secondary/40">
                          <p className="text-xs text-muted-foreground mb-1">
                            Turfs Booked
                          </p>
                          <p className="text-2xl font-heading font-bold">
                            {stats.turfs_booked}
                          </p>
                        </div>
                        <div className="p-4 rounded-xl bg-secondary/40">
                          <p className="text-xs text-muted-foreground mb-1">
                            Tournaments Participated
                          </p>
                          <p className="text-2xl font-heading font-bold">
                            {stats.tournaments_participated}
                          </p>
                        </div>
                      </>
                    )}

                    {user.role === "client" && (
                      <>
                        <div className="p-4 rounded-xl bg-secondary/40">
                          <p className="text-xs text-muted-foreground mb-1">
                            Turfs Owned
                          </p>
                          <p className="text-2xl font-heading font-bold">
                            {stats.turfs_owned}
                          </p>
                        </div>
                        <div className="p-4 rounded-xl bg-secondary/40">
                          <p className="text-xs text-muted-foreground mb-1">
                            Tournaments Hosted
                          </p>
                          <p className="text-2xl font-heading font-bold">
                            {stats.tournaments_hosted}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    No stats available yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default ProfilePage;