import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import api from "@/services/api";
import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, IndianRupee, Image, Building2 } from "lucide-react";

const AddTurfPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    location: "",
    description: "",
    price_per_slot: "",
    facilities: "",
    images: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name || !form.location || !form.price_per_slot) {
      toast({
        title: "Missing fields",
        description: "Name, location and price are required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const imagesArray = form.images
        .split(",")
        .map((url) => url.trim())
        .filter((url) => url.length > 0);

      await api.post("/turfs", {
        ...form,
        price_per_slot: Number(form.price_per_slot),
        images: imagesArray,
      });

      toast({
        title: "Turf Added 🎉",
        description: "Your turf has been successfully listed",
        variant: "success",
      });

      navigate("/client/dashboard");
    } catch (err: unknown) {
      let errorMessage = "Failed to add turf";

      if (axios.isAxiosError(err)) {
        if (err.response) {
          console.error("Add turf error:", err.response.data);
          errorMessage =
            err.response.data?.error ||
            err.response.data?.message ||
            `Server error (${err.response.status})`;
        } else if (err.request) {
          errorMessage = "No response from server. Check your connection.";
        } else {
          errorMessage = err.message;
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 grid-overlay opacity-20" />
      <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[120px]" />

      <Navbar />

      <main className="pt-24 pb-12 relative z-10">
        <div className="container max-w-xl px-4">
          <Card variant="glass" className="glass-card border-white/10 shadow-glow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Building2 className="w-5 h-5" />
                Add New Turf
              </CardTitle>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="text-sm text-muted-foreground">Turf Name</label>
                  <Input
                    name="name"
                    placeholder="Elite Sports Arena"
                    value={form.name}
                    onChange={handleChange}
                    className="bg-secondary/30 border-white/10 focus:border-primary/60"
                  />
                </div>

                <div>
                  <label className="text-sm text-muted-foreground">Location</label>
                  <Input
                    name="location"
                    placeholder="Ahmedabad, Gujarat"
                    value={form.location}
                    onChange={handleChange}
                    className="bg-secondary/30 border-white/10 focus:border-primary/60"
                  />
                </div>

                <div>
                  <label className="text-sm text-muted-foreground">Description</label>
                  <Textarea
                    name="description"
                    placeholder="Premium football turf with floodlights..."
                    value={form.description}
                    onChange={handleChange}
                    rows={3}
                    className="bg-secondary/30 border-white/10 focus:border-primary/60"
                  />
                </div>

                <div>
                  <label className="text-sm text-muted-foreground">
                    Price per Slot (₹)
                  </label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      name="price_per_slot"
                      type="number"
                      placeholder="1500"
                      value={form.price_per_slot}
                      onChange={handleChange}
                      className="pl-9 bg-secondary/30 border-white/10 focus:border-primary/60"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm text-muted-foreground">
                    Facilities (comma separated)
                  </label>
                  <Input
                    name="facilities"
                    placeholder="Parking, Floodlights, Washroom"
                    value={form.facilities}
                    onChange={handleChange}
                    className="bg-secondary/30 border-white/10 focus:border-primary/60"
                  />
                </div>

                <div>
                  <label className="text-sm text-muted-foreground">
                    Image URLs (comma separated)
                  </label>
                  <div className="relative">
                    <Image className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      name="images"
                      placeholder="https://image1.jpg, https://image2.jpg"
                      value={form.images}
                      onChange={handleChange}
                      className="pl-9 bg-secondary/30 border-white/10 focus:border-primary/60"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full gradient-primary shadow-glow"
                  disabled={loading}
                >
                  {loading ? "Creating Turf..." : "Create Turf"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AddTurfPage;
