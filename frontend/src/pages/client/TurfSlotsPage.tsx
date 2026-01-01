import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Clock,
  IndianRupee,
  Trash2,
  Calendar,
  Plus,
  AlertCircle,
  CheckCircle2,
  X,
  Edit2,
  ArrowRight,
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { getSlotsByTurf, createSlot } from "@/services/slotService";
import api from "@/services/api";
import { Slot } from "@/types";

/* TYPES */

type Toast = {
  id: string;
  title: string;
  description?: string;
  variant: "default" | "destructive" | "success";
};

/* UTILITIES */

const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
};

const validateTimeSlot = (startTime: string, endTime: string): { valid: boolean; error?: string } => {
  if (!startTime || !endTime) {
    return { valid: false, error: "Both start and end times are required" };
  }

  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);

  if (startMinutes >= endMinutes) {
    return { valid: false, error: "Start time must be before end time" };
  }

  const duration = endMinutes - startMinutes;
  if (duration < 30) {
    return { valid: false, error: "Minimum slot duration is 30 minutes" };
  }

  if (duration > 480) {
    return { valid: false, error: "Maximum slot duration is 8 hours" };
  }

  return { valid: true };
};

const checkOverlappingSlots = (
  startTime: string,
  endTime: string,
  existingSlots: Slot[],
  excludeId?: number
): boolean => {
  const newStart = timeToMinutes(startTime);
  const newEnd = timeToMinutes(endTime);

  return existingSlots.some((slot) => {
    if (excludeId && slot.id === excludeId) return false;

    const slotStart = timeToMinutes(slot.start_time);
    const slotEnd = timeToMinutes(slot.end_time);

    return !(newEnd <= slotStart || newStart >= slotEnd);
  });
};

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
};

const showToast = (
  setToasts: React.Dispatch<React.SetStateAction<Toast[]>>,
  title: string,
  description?: string,
  variant: "default" | "destructive" | "success" = "default"
) => {
  const id = Date.now().toString();
  setToasts((prev: Toast[]) => [...prev, { id, title, description, variant }]);
  setTimeout(() => {
    setToasts((prev: Toast[]) => prev.filter((t) => t.id !== id));
  }, 4000);
};

/* MAIN COMPONENT */

const TurfSlotsPage = () => {
  const { turfId } = useParams();
  const navigate = useNavigate();

  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);

  /* FORM STATE */
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [price, setPrice] = useState("");

  /* BULK CREATION STATE */
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkStartTime, setBulkStartTime] = useState("06:00");
  const [bulkEndTime, setBulkEndTime] = useState("23:00");
  const [bulkSlotDuration, setBulkSlotDuration] = useState("60");
  const [bulkDays, setBulkDays] = useState("1");
  const [bulkPrice, setBulkPrice] = useState("");

  /* EDIT STATE */
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");
  const [editPrice, setEditPrice] = useState("");

  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadSlots = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getSlotsByTurf(turfId!);
      setSlots(res.data || []);
    } catch (error: unknown) {
      const errorMessage = (error as { response?: { data?: { error?: string } } })?.response?.data?.error || "Failed to load slots";
      showToast(setToasts, "Error", errorMessage, "destructive");
    } finally {
      setLoading(false);
    }
  }, [turfId]);

  /* FETCH SLOTS */
  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  /* SINGLE SLOT CREATION */
  const handleCreateSlot = async () => {
    setFormError("");

    if (!startTime || !endTime || !price) {
      setFormError("All fields are required");
      return;
    }

    const validation = validateTimeSlot(startTime, endTime);
    if (!validation.valid) {
      setFormError(validation.error!);
      return;
    }

    if (checkOverlappingSlots(startTime, endTime, slots)) {
      setFormError("This time slot overlaps with an existing slot");
      return;
    }

    if (Number(price) <= 0) {
      setFormError("Price must be greater than 0");
      return;
    }

    setSubmitting(true);
    try {
      await createSlot({
        turf_id: turfId!,
        start_time: startTime,
        end_time: endTime,
        price: Number(price),
      });

      showToast(setToasts, "Success", `Slot created: ${startTime} - ${endTime}`, "success");
      setStartTime("");
      setEndTime("");
      setPrice("");
      setFormError("");
      loadSlots();
    } catch (error: unknown) {
      const errorMessage = (error as { response?: { data?: { error?: string } } })?.response?.data?.error || "Failed to create slot";
      showToast(
        setToasts,
        "Error",
        errorMessage,
        "destructive"
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* BULK SLOT CREATION */
  const handleBulkCreateSlots = async () => {
    setFormError("");

    if (!bulkPrice || !bulkSlotDuration) {
      setFormError("All fields are required");
      return;
    }

    const validation = validateTimeSlot(bulkStartTime, bulkEndTime);
    if (!validation.valid) {
      setFormError(validation.error!);
      return;
    }

    if (Number(bulkPrice) <= 0 || Number(bulkSlotDuration) <= 0 || Number(bulkDays) <= 0) {
      setFormError("Price, duration, and days must be greater than 0");
      return;
    }

    if (Number(bulkDays) > 30) {
      setFormError("Cannot create slots for more than 30 days at once");
      return;
    }

    setSubmitting(true);
    const durationMinutes = Number(bulkSlotDuration);
    const dayCount = Number(bulkDays);
    let createdCount = 0;
    let failedCount = 0;

    try {
      const startMin = timeToMinutes(bulkStartTime);
      const endMin = timeToMinutes(bulkEndTime);

      for (let day = 0; day < dayCount; day++) {
        let currentMin = startMin;

        while (currentMin + durationMinutes <= endMin) {
          const slotStart = minutesToTime(currentMin);
          const slotEnd = minutesToTime(currentMin + durationMinutes);

          try {
            await createSlot({
              turf_id: turfId!,
              start_time: slotStart,
              end_time: slotEnd,
              price: Number(bulkPrice),
            });
            createdCount++;
          } catch (error) {
            failedCount++;
          }

          currentMin += durationMinutes;
        }
      }

      showToast(
        setToasts,
        "Success",
        `Created ${createdCount} slots${failedCount > 0 ? `, ${failedCount} failed` : ""}`,
        "success"
      );

      setBulkMode(false);
      setBulkPrice("");
      setFormError("");
      loadSlots();
    } catch (error: unknown) {
      const errorMessage = (error as { response?: { data?: { error?: string } } })?.response?.data?.error || "Failed to create slots";
      showToast(
        setToasts,
        "Error",
        errorMessage,
        "destructive"
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* EDIT SLOT */
  const handleEditSlot = (slot: Slot) => {
    setEditingId(slot.id);
    setEditStartTime(slot.start_time);
    setEditEndTime(slot.end_time);
    setEditPrice(String(slot.price));
    setFormError("");
  };

  const handleSaveEdit = async () => {
    setFormError("");

    if (!editStartTime || !editEndTime || !editPrice) {
      setFormError("All fields are required");
      return;
    }

    const validation = validateTimeSlot(editStartTime, editEndTime);
    if (!validation.valid) {
      setFormError(validation.error!);
      return;
    }

    if (checkOverlappingSlots(editStartTime, editEndTime, slots, editingId!)) {
      setFormError("This time slot overlaps with another slot");
      return;
    }

    setSubmitting(true);
    try {
      await api.put(`/slots/${editingId}`, {
        start_time: editStartTime,
        end_time: editEndTime,
        price: Number(editPrice),
      });

      showToast(setToasts, "Success", "Slot updated successfully", "success");
      setEditingId(null);
      loadSlots();
    } catch (error: unknown) {
      const errorMessage = (error as { response?: { data?: { error?: string } } })?.response?.data?.error || "Failed to update slot";
      showToast(
        setToasts,
        "Error",
        errorMessage,
        "destructive"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditStartTime("");
    setEditEndTime("");
    setEditPrice("");
    setFormError("");
  };

  /* DELETE SLOT */
  const handleDeleteSlot = async (slotId: number) => {
    if (!confirm("Are you sure you want to delete this slot?")) return;

    try {
      await api.delete(`/slots/${slotId}`);
      showToast(setToasts, "Success", "Slot deleted successfully", "success");
      loadSlots();
    } catch (error: unknown) {
      const errorMessage = (error as { response?: { data?: { error?: string } } })?.response?.data?.error || "Failed to delete slot";
      showToast(
        setToasts,
        "Error",
        errorMessage,
        "destructive"
      );
    }
  };

  /* GROUP SLOTS BY DATE */
  const groupedSlots = slots.reduce((acc, slot) => {
    const key = "All Days"; // Since we don't have date in current schema, group all
    if (!acc[key]) acc[key] = [];
    acc[key].push(slot);
    return acc;
  }, {} as { [key: string]: Slot[] });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* TOASTS */}
      <div className="fixed top-20 right-4 z-50 space-y-2 max-w-sm">
        {toasts.map((toast) => {
          const bgColor =
            toast.variant === "success"
              ? "bg-green-600"
              : toast.variant === "destructive"
              ? "bg-red-600"
              : "bg-slate-800";

          return (
            <div key={toast.id} className={`${bgColor} text-white p-4 rounded-lg shadow-lg animate-slide-down`}>
              <b className="block mb-1">{toast.title}</b>
              {toast.description && <p className="text-sm">{toast.description}</p>}
            </div>
          );
        })}
      </div>

      <main className="pt-24 pb-12 container space-y-8">
        {/* PAGE HEADER */}
        <div className="space-y-2">
          <button
            onClick={() => navigate(-1)}
            className="text-primary hover:text-primary/80 flex items-center gap-1 text-sm font-medium mb-4"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-heading font-bold text-foreground">Manage Slots</h1>
          <p className="text-muted-foreground">Add, edit, and manage time slots for your turf</p>
        </div>

        {/* ADD SLOT FORM */}
        {!bulkMode && editingId === null && (
          <Card variant="glass">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  <CardTitle>Add New Slot</CardTitle>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setBulkMode(true)}
                  className="ml-auto"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Bulk Create
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {formError && (
                <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-red-600">{formError}</span>
                </div>
              )}

              <div className="grid md:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">Start Time</label>
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => {
                      setStartTime(e.target.value);
                      setFormError("");
                    }}
                    className="h-10"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">End Time</label>
                  <Input
                    type="time"
                    value={endTime}
                    onChange={(e) => {
                      setEndTime(e.target.value);
                      setFormError("");
                    }}
                    className="h-10"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">Price (₹)</label>
                  <Input
                    type="number"
                    placeholder="Price"
                    value={price}
                    onChange={(e) => {
                      setPrice(e.target.value);
                      setFormError("");
                    }}
                    className="h-10"
                  />
                </div>

                <div className="flex items-end">
                  <Button
                    onClick={handleCreateSlot}
                    disabled={submitting}
                    className="w-full gradient-primary"
                  >
                    {submitting ? "Creating..." : "Add Slot"}
                  </Button>
                </div>
              </div>

              {startTime && endTime && (
                <div className="text-xs text-muted-foreground bg-secondary/50 rounded-lg p-3">
                  Duration: {Math.round((timeToMinutes(endTime) - timeToMinutes(startTime)) / 60 * 10) / 10} hours
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* BULK CREATE FORM */}
        {bulkMode && editingId === null && (
          <Card variant="glass" className="border-primary/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Plus className="w-5 h-5 text-primary" />
                  <CardTitle>Bulk Create Slots</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setBulkMode(false);
                    setFormError("");
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {formError && (
                <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-red-600">{formError}</span>
                </div>
              )}

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                <p className="text-xs text-blue-600">
                  💡 Create multiple slots automatically. For example: Create 1-hour slots from 6 AM to 11 PM for 7 days.
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">Start Time</label>
                  <Input
                    type="time"
                    value={bulkStartTime}
                    onChange={(e) => {
                      setBulkStartTime(e.target.value);
                      setFormError("");
                    }}
                    className="h-10"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">End Time</label>
                  <Input
                    type="time"
                    value={bulkEndTime}
                    onChange={(e) => {
                      setBulkEndTime(e.target.value);
                      setFormError("");
                    }}
                    className="h-10"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">Slot Duration (min)</label>
                  <Input
                    type="number"
                    placeholder="60"
                    value={bulkSlotDuration}
                    onChange={(e) => {
                      setBulkSlotDuration(e.target.value);
                      setFormError("");
                    }}
                    className="h-10"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">Number of Days</label>
                  <Input
                    type="number"
                    placeholder="1"
                    value={bulkDays}
                    onChange={(e) => {
                      setBulkDays(e.target.value);
                      setFormError("");
                    }}
                    className="h-10"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">Price per Slot (₹)</label>
                  <Input
                    type="number"
                    placeholder="Price"
                    value={bulkPrice}
                    onChange={(e) => {
                      setBulkPrice(e.target.value);
                      setFormError("");
                    }}
                    className="h-10"
                  />
                </div>

                <div className="flex items-end gap-2">
                  <Button
                    onClick={handleBulkCreateSlots}
                    disabled={submitting}
                    className="flex-1 gradient-primary"
                  >
                    {submitting ? "Creating..." : "Create Slots"}
                  </Button>
                </div>
              </div>

              {bulkSlotDuration && bulkDays && (
                <div className="text-xs text-muted-foreground bg-secondary/50 rounded-lg p-3">
                  Will create approximately{" "}
                  <span className="font-semibold text-foreground">
                    {Math.ceil(
                      ((timeToMinutes(bulkEndTime) - timeToMinutes(bulkStartTime)) / Number(bulkSlotDuration)) *
                      Number(bulkDays)
                    )}
                  </span>{" "}
                  slots
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* EDIT FORM */}
        {editingId !== null && (
          <Card variant="glass" className="border-primary/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-primary" />
                <CardTitle>Edit Slot</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {formError && (
                <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-red-600">{formError}</span>
                </div>
              )}

              <div className="grid md:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">Start Time</label>
                  <Input
                    type="time"
                    value={editStartTime}
                    onChange={(e) => {
                      setEditStartTime(e.target.value);
                      setFormError("");
                    }}
                    className="h-10"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">End Time</label>
                  <Input
                    type="time"
                    value={editEndTime}
                    onChange={(e) => {
                      setEditEndTime(e.target.value);
                      setFormError("");
                    }}
                    className="h-10"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">Price (₹)</label>
                  <Input
                    type="number"
                    placeholder="Price"
                    value={editPrice}
                    onChange={(e) => {
                      setEditPrice(e.target.value);
                      setFormError("");
                    }}
                    className="h-10"
                  />
                </div>

                <div className="flex items-end gap-2">
                  <Button
                    onClick={handleSaveEdit}
                    disabled={submitting}
                    className="flex-1 gradient-primary"
                  >
                    {submitting ? "Saving..." : "Save"}
                  </Button>
                  <Button
                    onClick={handleCancelEdit}
                    variant="outline"
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* SLOTS LIST */}
        <div className="space-y-6">
          {loading ? (
            <Card variant="glass">
              <CardContent className="py-12 text-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading slots...</p>
              </CardContent>
            </Card>
          ) : slots.length === 0 ? (
            <Card variant="glass">
              <CardContent className="py-12 text-center">
                <Clock className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground">No slots created yet. Add your first slot above!</p>
              </CardContent>
            </Card>
          ) : (
            Object.entries(groupedSlots).map(([date, dateSlots]) => (
              <div key={date} className="space-y-3">
                <h2 className="text-lg font-heading font-semibold text-foreground flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  {date}
                </h2>

                <div className="space-y-2">
                  {dateSlots.map((slot) => (
                    <div
                      key={slot.id}
                      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl border transition-all ${
                        slot.is_booked
                          ? "bg-red-500/5 border-red-500/20"
                          : "bg-green-500/5 border-green-500/20 hover:border-green-500/40"
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex items-center gap-2 font-semibold text-foreground">
                            <Clock className="w-4 h-4 text-primary" />
                            {slot.start_time} <ArrowRight className="w-3 h-3 text-muted-foreground" /> {slot.end_time}
                          </div>
                          <Badge
                            variant={slot.is_booked ? "default" : "outline"}
                            className={
                              slot.is_booked
                                ? "bg-red-500/20 text-red-600 hover:bg-red-500/30"
                                : "bg-green-500/20 text-green-600 border-green-500/30 hover:bg-green-500/30"
                            }
                          >
                            {slot.is_booked ? "Booked" : "Available"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <IndianRupee className="w-3 h-3" />
                          {slot.price} per hour
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {!slot.is_booked && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditSlot(slot)}
                              className="text-primary hover:text-primary hover:bg-primary/10"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteSlot(slot.id)}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        {slot.is_booked && (
                          <span className="text-xs text-muted-foreground italic">Cannot edit booked slot</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* SUMMARY */}
        {slots.length > 0 && (
          <Card variant="glass">
            <CardContent className="py-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{slots.length}</div>
                  <div className="text-xs text-muted-foreground mt-1">Total Slots</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{slots.filter((s) => !s.is_booked).length}</div>
                  <div className="text-xs text-muted-foreground mt-1">Available</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{slots.filter((s) => s.is_booked).length}</div>
                  <div className="text-xs text-muted-foreground mt-1">Booked</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    ₹{slots.reduce((sum, s) => sum + s.price, 0) / slots.length}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Avg Price</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default TurfSlotsPage;
