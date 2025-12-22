import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, IndianRupee } from "lucide-react";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { getSlotsByTurf, createSlot } from "@/services/slotService";

const TurfSlotsPage = () => {
  const { turfId } = useParams();
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    start_time: "",
    end_time: "",
    price: "",
  });

  const loadSlots = async () => {
    try {
      const res = await getSlotsByTurf(turfId!);
      setSlots(res.data);
    } catch {
      alert("Failed to load slots");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSlots();
  }, []);

  const handleCreateSlot = async () => {
    if (!form.start_time || !form.end_time || !form.price) {
      alert("Please fill all fields");
      return;
    }

    try {
      await createSlot({
        turf_id: turfId!,
        start_time: form.start_time,
        end_time: form.end_time,
        price: Number(form.price),
      });

      setForm({ start_time: "", end_time: "", price: "" });
      loadSlots();
    } catch {
      alert("Failed to create slot");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-12">
        <div className="container max-w-4xl px-4 space-y-8">

          {/* PAGE TITLE */}
          <h1 className="text-3xl font-bold">Manage Turf Slots</h1>

          {/* ADD SLOT */}
          <Card>
            <CardHeader>
              <CardTitle>Add New Slot</CardTitle>
            </CardHeader>

            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-muted-foreground">
                  Start Time
                </label>
                <input
                  type="time"
                  value={form.start_time}
                  onChange={(e) =>
                    setForm({ ...form, start_time: e.target.value })
                  }
                  className="w-full mt-1 border rounded-lg p-2"
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground">
                  End Time
                </label>
                <input
                  type="time"
                  value={form.end_time}
                  onChange={(e) =>
                    setForm({ ...form, end_time: e.target.value })
                  }
                  className="w-full mt-1 border rounded-lg p-2"
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground">
                  Price (₹)
                </label>
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) =>
                    setForm({ ...form, price: e.target.value })
                  }
                  className="w-full mt-1 border rounded-lg p-2"
                />
              </div>

              <div className="md:col-span-3">
                <Button className="w-full" onClick={handleCreateSlot}>
                  Add Slot
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* SLOT LIST */}
          <Card>
            <CardHeader>
              <CardTitle>Existing Slots</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              {loading && <p>Loading slots...</p>}

              {!loading && slots.length === 0 && (
                <p className="text-muted-foreground">
                  No slots added yet.
                </p>
              )}

              {slots.map((slot) => (
                <div
                  key={slot.id}
                  className="flex items-center justify-between p-4 border rounded-xl bg-secondary/40"
                >
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-primary" />
                    <div>
                      <div className="font-semibold">
                        {slot.start_time} – {slot.end_time}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <IndianRupee className="w-4 h-4" />
                        {slot.price}
                      </div>
                    </div>
                  </div>

                  <Badge
                    variant={slot.is_available ? "success" : "secondary"}
                  >
                    {slot.is_available ? "Available" : "Booked"}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TurfSlotsPage;
