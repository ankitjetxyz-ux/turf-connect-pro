import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Clock,
  IndianRupee,
  Trash2,
  Calendar as CalendarIcon,
  Plus,
  AlertCircle,
  X,
  Edit2,
  ArrowRight,
  Zap,
  Save,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { slotService, TimeBlock, Slot } from "@/services/slotService";
import { useToast } from "@/components/ui/use-toast";

/* ============================================================================
   TYPES
   ============================================================================ */

type ViewMode = "calendar" | "single" | "bulk";
type SlotGenerationMode = "weekdays" | "weekends" | "both";

const WEEKDAYS = [
  { value: "monday", label: "Mon", dayIndex: 1 },
  { value: "tuesday", label: "Tue", dayIndex: 2 },
  { value: "wednesday", label: "Wed", dayIndex: 3 },
  { value: "thursday", label: "Thu", dayIndex: 4 },
  { value: "friday", label: "Fri", dayIndex: 5 },
  { value: "saturday", label: "Sat", dayIndex: 6 },
  { value: "sunday", label: "Sun", dayIndex: 0 },
];

const WEEKDAY_VALUES = ["monday", "tuesday", "wednesday", "thursday", "friday"];
const WEEKEND_VALUES = ["saturday", "sunday"];

// Hour options for single slot (6 AM to 11 PM)
const HOUR_OPTIONS = Array.from({ length: 18 }, (_, i) => {
  const hour = i + 6;
  const display = hour < 12 ? `${hour} AM` : hour === 12 ? `12 PM` : `${hour - 12} PM`;
  const value = `${hour.toString().padStart(2, "0")}:00`;
  return { value, display, hour };
});

const MAX_TIME_BLOCKS = 3;

/* ============================================================================
   MAIN COMPONENT
   ============================================================================ */

const TurfSlotsPage = () => {
  const { turfId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  /* STATE */
  const [mode, setMode] = useState<ViewMode>("calendar");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  /* SINGLE SLOT STATE */
  const [singleDate, setSingleDate] = useState(new Date().toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [price, setPrice] = useState("");
  const [label, setLabel] = useState("");

  /* BULK GENERATION STATE */
  const [bulkStartDate, setBulkStartDate] = useState("");
  const [bulkEndDate, setBulkEndDate] = useState("");
  const [slotGenerationMode, setSlotGenerationMode] = useState<SlotGenerationMode>("weekdays");
  const [activeDays, setActiveDays] = useState<string[]>(["monday", "tuesday", "wednesday", "thursday", "friday"]);
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([
    { start: "06:00", end: "23:00", price: 1000, label: "" }
  ]);
  const [timeBlockErrors, setTimeBlockErrors] = useState<string[]>([]);
  const [slotDuration, setSlotDuration] = useState(60);
  const [conflictStrategy, setConflictStrategy] = useState<"skip" | "overwrite" | "fill_gaps">("skip");

  /* DATE INPUT REFS */
  const startDateRef = useRef<HTMLInputElement>(null);
  const endDateRef = useRef<HTMLInputElement>(null);

  /* SINGLE SLOT - Available hours state */
  const [existingSlotsForDate, setExistingSlotsForDate] = useState<Slot[]>([]);
  const [loadingExistingSlots, setLoadingExistingSlots] = useState(false);

  /* EDIT STATE */
  const [editingSlot, setEditingSlot] = useState<Slot | null>(null);

  /* LOAD SLOTS */
  const loadSlots = async (date?: string) => {
    try {
      setLoading(true);
      const params: any = {};

      if (date) {
        params.date = date;
      } else if (mode === "calendar") {
        // Load month range
        const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).toISOString().split("T")[0];
        const end = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).toISOString().split("T")[0];
        params.start_date = start;
        params.end_date = end;
      }

      const response = await slotService.getSlotsByTurf(turfId!, params);
      setSlots(response.data || []);
    } catch (error: any) {
      toast({
        title: "Error loading slots",
        description: error.response?.data?.error || "Failed to load slots",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSlots();
  }, [currentMonth, mode]);

  /* LOAD EXISTING SLOTS FOR SINGLE SLOT DATE */
  const loadExistingSlotsForDate = useCallback(async (date: string) => {
    if (!turfId) return;
    try {
      setLoadingExistingSlots(true);
      const response = await slotService.getSlotsByTurf(turfId, { date });
      setExistingSlotsForDate(response.data || []);
    } catch (error) {
      setExistingSlotsForDate([]);
    } finally {
      setLoadingExistingSlots(false);
    }
  }, [turfId]);

  useEffect(() => {
    if (mode === "single" && singleDate) {
      loadExistingSlotsForDate(singleDate);
    }
  }, [mode, singleDate, loadExistingSlotsForDate]);

  /* GET AVAILABLE HOURS FOR SINGLE SLOT */
  const availableHours = useMemo(() => {
    const occupiedHours = new Set<number>();
    existingSlotsForDate.forEach(slot => {
      const startHour = parseInt(slot.start_time.split(":")[0]);
      occupiedHours.add(startHour);
    });
    return HOUR_OPTIONS.map(opt => ({
      ...opt,
      disabled: occupiedHours.has(opt.hour)
    }));
  }, [existingSlotsForDate]);

  /* AUTO-SELECT DAYS BASED ON DATE RANGE AND MODE */
  const getTodayDayName = () => {
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    return days[new Date().getDay()];
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  useEffect(() => {
    if (!bulkStartDate || !bulkEndDate) return;

    const start = new Date(bulkStartDate);
    const end = new Date(bulkEndDate);
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    let allowedDays: string[] = [];
    if (slotGenerationMode === "weekdays") {
      allowedDays = WEEKDAY_VALUES;
    } else if (slotGenerationMode === "weekends") {
      allowedDays = WEEKEND_VALUES;
    } else {
      allowedDays = [...WEEKDAY_VALUES, ...WEEKEND_VALUES];
    }

    // If range > 7 days, auto-select all allowed days
    if (daysDiff > 7) {
      setActiveDays(allowedDays.filter(d => d !== getTodayDayName() || !isDateInRange(new Date(), start, end)));
    } else {
      // Find days that fall within the date range
      const daysInRange: string[] = [];
      const current = new Date(start);
      while (current <= end) {
        const dayName = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][current.getDay()];
        if (allowedDays.includes(dayName) && !isToday(current)) {
          daysInRange.push(dayName);
        }
        current.setDate(current.getDate() + 1);
      }
      setActiveDays([...new Set(daysInRange)]);
    }
  }, [bulkStartDate, bulkEndDate, slotGenerationMode]);

  const isDateInRange = (date: Date, start: Date, end: Date) => {
    return date >= start && date <= end;
  };

  /* CHECK IF TODAY IS IN BULK DATE RANGE */
  const isTodayInBulkRange = useMemo(() => {
    if (!bulkStartDate || !bulkEndDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(bulkStartDate);
    const end = new Date(bulkEndDate);
    return today >= start && today <= end;
  }, [bulkStartDate, bulkEndDate]);

  /* GET VISIBLE DAYS BASED ON MODE */
  const visibleDays = useMemo(() => {
    if (slotGenerationMode === "weekdays") {
      return WEEKDAYS.filter(d => WEEKDAY_VALUES.includes(d.value));
    } else if (slotGenerationMode === "weekends") {
      return WEEKDAYS.filter(d => WEEKEND_VALUES.includes(d.value));
    }
    return WEEKDAYS;
  }, [slotGenerationMode]);

  /* TIME BLOCK CONFLICT DETECTION */
  const checkTimeBlockConflicts = useCallback((blocks: TimeBlock[]) => {
    const errors: string[] = new Array(blocks.length).fill("");

    for (let i = 0; i < blocks.length; i++) {
      const blockA = blocks[i];
      const startA = parseInt(blockA.start.replace(":", ""));
      const endA = parseInt(blockA.end.replace(":", ""));

      if (startA >= endA) {
        errors[i] = "Start time must be before end time";
        continue;
      }

      for (let j = i + 1; j < blocks.length; j++) {
        const blockB = blocks[j];
        const startB = parseInt(blockB.start.replace(":", ""));
        const endB = parseInt(blockB.end.replace(":", ""));

        // Conflict if: BlockA.start < BlockB.end AND BlockA.end > BlockB.start
        if (startA < endB && endA > startB) {
          errors[i] = "Time block overlaps with another block";
          errors[j] = "Time block overlaps with another block";
        }
      }
    }

    setTimeBlockErrors(errors);
    return errors.every(e => e === "");
  }, []);

  useEffect(() => {
    checkTimeBlockConflicts(timeBlocks);
  }, [timeBlocks, checkTimeBlockConflicts]);

  /* SINGLE SLOT CREATION */
  const handleCreateSingleSlot = async () => {
    if (!startTime || !endTime || !price) {
      toast({
        title: "Missing fields",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      await slotService.createSlot({
        turf_id: turfId!,
        date: singleDate,
        start_time: startTime,
        end_time: endTime,
        price: Number(price),
        label: label || undefined,
      });

      toast({
        title: "Success",
        description: `Slot created: ${startTime} - ${endTime}`,
      });

      setStartTime("");
      setEndTime("");
      setPrice("");
      setLabel("");
      loadSlots();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to create slot",
        variant: "destructive",
      });
    }
  };

  /* BULK GENERATION */
  const handleBulkGenerate = async () => {
    if (!bulkStartDate || !bulkEndDate || timeBlocks.length === 0) {
      toast({
        title: "Missing fields",
        description: "Please configure date range and time blocks",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const response = await slotService.bulkGenerateSlots({
        turf_id: turfId!,
        start_date: bulkStartDate,
        end_date: bulkEndDate,
        active_days: activeDays,
        time_blocks: timeBlocks,
        slot_duration: slotDuration,
        conflict_strategy: conflictStrategy,
      });

      toast({
        title: "✅ Bulk generation complete!",
        description: `Created ${response.data.created} slots${response.data.skipped > 0 ? `, skipped ${response.data.skipped}` : ""}`,
      });

      loadSlots();
      setMode("calendar");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to generate slots",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  /* TIME BLOCK MANAGEMENT */
  const addTimeBlock = () => {
    if (timeBlocks.length >= MAX_TIME_BLOCKS) return;
    setTimeBlocks([...timeBlocks, { start: "06:00", end: "23:00", price: 1000, label: "" }]);
  };

  const removeTimeBlock = (index: number) => {
    setTimeBlocks(timeBlocks.filter((_, i) => i !== index));
  };

  const updateTimeBlock = (index: number, field: keyof TimeBlock, value: any) => {
    const updated = [...timeBlocks];
    updated[index] = { ...updated[index], [field]: value };
    setTimeBlocks(updated);
  };

  /* DAY TOGGLE */
  const toggleDay = (day: string) => {
    // Don't allow toggling today's day if it's in the date range
    if (day === getTodayDayName() && isTodayInBulkRange) return;

    setActiveDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  /* CHECK IF A DAY IS DISABLED (today in range) */
  const isDayDisabled = (day: string) => {
    return day === getTodayDayName() && isTodayInBulkRange;
  };

  /* EDIT SLOT */
  const handleEditSlot = (slot: Slot) => {
    setEditingSlot(slot);
  };

  const handleSaveEdit = async () => {
    if (!editingSlot) return;

    try {
      await slotService.updateSlot(editingSlot.id, {
        start_time: editingSlot.start_time,
        end_time: editingSlot.end_time,
        price: editingSlot.price,
        label: editingSlot.label,
      });

      toast({
        title: "Success",
        description: "Slot updated successfully",
      });

      setEditingSlot(null);
      loadSlots();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to update slot",
        variant: "destructive",
      });
    }
  };

  /* DELETE SLOT */
  const handleDeleteSlot = async (slotId: number) => {
    if (!confirm("Delete this slot?")) return;

    try {
      await slotService.deleteSlot(slotId);
      toast({
        title: "Success",
        description: "Slot deleted successfully",
      });
      loadSlots();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to delete slot",
        variant: "destructive",
      });
    }
  };

  /* CALENDAR HELPERS */
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return { firstDay, daysInMonth };
  };

  const { firstDay, daysInMonth } = getDaysInMonth(currentMonth);
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));

  /* GET SLOTS FOR DATE */
  const getSlotsForDate = (date: string) => {
    return slots.filter(s => s.date === date);
  };

  const getDaySlots = getSlotsForDate(selectedDate);

  /* PREVIEW COUNT - Dynamic calculation */
  const previewData = useMemo(() => {
    if (!bulkStartDate || !bulkEndDate || timeBlocks.length === 0 || activeDays.length === 0) {
      return { count: 0, valid: false, message: "No slots will be created." };
    }

    // Check for time block errors
    if (timeBlockErrors.some(e => e !== "")) {
      return { count: 0, valid: false, message: "Please fix time block conflicts." };
    }

    const start = new Date(bulkStartDate);
    const end = new Date(bulkEndDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Map day names to JS day indices
    const dayNameToIndex: Record<string, number> = {
      sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
      thursday: 4, friday: 5, saturday: 6
    };

    const activeDayIndices = new Set(activeDays.map(d => dayNameToIndex[d]));

    // Count valid days in range
    let validDays = 0;
    const current = new Date(start);
    while (current <= end) {
      if (activeDayIndices.has(current.getDay())) {
        // Skip today
        if (current.toDateString() !== today.toDateString()) {
          validDays++;
        }
      }
      current.setDate(current.getDate() + 1);
    }

    if (validDays === 0) {
      return { count: 0, valid: false, message: "No valid days in selected range." };
    }

    // Calculate slots per day from all time blocks
    let slotsPerDay = 0;
    for (const block of timeBlocks) {
      const startMin = parseInt(block.start.split(":")[0]) * 60 + parseInt(block.start.split(":")[1]);
      const endMin = parseInt(block.end.split(":")[0]) * 60 + parseInt(block.end.split(":")[1]);
      if (endMin > startMin) {
        slotsPerDay += Math.floor((endMin - startMin) / slotDuration);
      }
    }

    const totalSlots = validDays * slotsPerDay;
    return { count: totalSlots, valid: true, message: `Will create approximately ${totalSlots} slots` };
  }, [bulkStartDate, bulkEndDate, timeBlocks, activeDays, slotDuration, timeBlockErrors]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="pt-24 pb-12 container space-y-6 flex-1">
        {/* HEADER */}
        <div className="space-y-2">
          <button
            onClick={() => navigate(-1)}
            className="text-primary hover:text-primary/80 flex items-center gap-1 text-sm font-medium"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-heading font-bold">Slot Management</h1>
          <p className="text-muted-foreground">Manage your turf time slots with powerful scheduling tools</p>
        </div>

        {/* MODE TABS */}
        <div className="flex gap-2 border-b border-border pb-2">
          <Button
            variant={mode === "calendar" ? "default" : "ghost"}
            onClick={() => setMode("calendar")}
            className="flex items-center gap-2"
          >
            <CalendarIcon className="w-4 h-4" />
            Calendar View
          </Button>
          <Button
            variant={mode === "single" ? "default" : "ghost"}
            onClick={() => setMode("single")}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Single Slot
          </Button>
          <Button
            variant={mode === "bulk" ? "default" : "ghost"}
            onClick={() => setMode("bulk")}
            className="flex items-center gap-2"
          >
            <Zap className="w-4 h-4" />
            Bulk Generate
          </Button>
        </div>

        {/* CALENDAR VIEW */}
        {mode === "calendar" && (
          <div className="grid lg:grid-cols-[1fr,400px] gap-6">
            <Card variant="glass">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-primary" />
                    {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={prevMonth}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={nextMonth}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-2">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                    <div key={day} className="text-center text-sm font-semibold text-muted-foreground p-2">
                      {day}
                    </div>
                  ))}

                  {Array.from({ length: firstDay }).map((_, i) => (
                    <div key={`empty-${i}`} className="p-2" />
                  ))}

                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                    const daySlots = getSlotsForDate(dateStr);
                    const hasSlots = daySlots.length > 0;
                    const isSelected = dateStr === selectedDate;

                    return (
                      <button
                        key={day}
                        onClick={() => {
                          setSelectedDate(dateStr);
                          loadSlots(dateStr);
                        }}
                        className={`p-2 rounded-lg text-sm font-medium transition-all ${isSelected
                          ? "bg-primary text-primary-foreground"
                          : hasSlots
                            ? "bg-green-500/10 text-green-600 hover:bg-green-500/20"
                            : "hover:bg-secondary"
                          }`}
                      >
                        <div>{day}</div>
                        {hasSlots && (
                          <div className="text-xs mt-1">
                            {daySlots.length} slot{daySlots.length !== 1 ? "s" : ""}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* SELECTED DAY SLOTS */}
            <Card variant="glass">
              <CardHeader>
                <CardTitle className="text-lg">
                  {new Date(selectedDate).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                  })}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                  </div>
                ) : getDaySlots.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No slots for this day</p>
                  </div>
                ) : (
                  getDaySlots.map(slot => (
                    <div
                      key={slot.id}
                      className={`p-3 rounded-lg border transition-all ${slot.status === "booked"
                        ? "bg-slate-100 border-slate-200"
                        : slot.status === "held"
                          ? "bg-amber-500/5 border-amber-500/20"
                          : "bg-green-500/5 border-green-500/20 hover:border-green-500/40"
                        }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 font-semibold text-sm">
                          <Clock className="w-4 h-4 text-primary" />
                          {slot.start_time} <ArrowRight className="w-3 h-3" /> {slot.end_time}
                        </div>
                        <Badge
                          variant={slot.status === "booked" ? "secondary" : slot.status === "held" ? "outline" : "outline"}
                          className={
                            slot.status === "booked"
                              ? "bg-slate-200 text-slate-600"
                              : slot.status === "held"
                                ? "bg-amber-500/20 text-amber-600 border-amber-500/30"
                                : "bg-green-500/20 text-green-600 border-green-500/30"
                          }
                        >
                          {slot.status}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <IndianRupee className="w-3 h-3" />
                          ₹{slot.price}
                          {slot.label && <span className="text-xs">• {slot.label}</span>}
                        </div>

                        {slot.status !== "booked" && slot.status !== "held" && (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditSlot(slot)}
                              className="h-7 w-7 p-0"
                            >
                              <Edit2 className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteSlot(slot.id)}
                              className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* SINGLE SLOT MODE */}
        {mode === "single" && (
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" />
                Add Single Slot
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={singleDate}
                    onChange={e => {
                      setSingleDate(e.target.value);
                      setStartTime("");
                      setEndTime("");
                    }}
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
                <div>
                  <Label>Start Time</Label>
                  <select
                    className="w-full h-10 border border-border rounded-md px-3 bg-background text-sm"
                    value={startTime}
                    onChange={e => {
                      const newStart = e.target.value;
                      setStartTime(newStart);
                      // Auto-set end time to start + 1 hour
                      const hour = parseInt(newStart.split(":")[0]);
                      const nextHour = `${(hour + 1).toString().padStart(2, "0")}:00`;
                      setEndTime(nextHour);
                    }}
                    disabled={loadingExistingSlots}
                  >
                    <option value="">Select time</option>
                    {availableHours.map(opt => (
                      <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                        {opt.display}{opt.disabled ? " (Taken)" : ""}
                      </option>
                    ))}
                  </select>
                  {loadingExistingSlots && (
                    <p className="text-xs text-muted-foreground mt-1">Loading available times...</p>
                  )}
                </div>
                <div>
                  <Label>End Time</Label>
                  <Input
                    type="text"
                    value={endTime ? `${parseInt(endTime.split(":")[0])}:00` : "--:--"}
                    disabled
                    className="bg-secondary/50"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Auto-set (1 hour slots)</p>
                </div>
                <div>
                  <Label>Price (₹)</Label>
                  <Input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="1000" />
                </div>
                <div>
                  <Label>Label (Optional)</Label>
                  <Input value={label} onChange={e => setLabel(e.target.value)} placeholder="Morning" />
                </div>
              </div>

              <Button onClick={handleCreateSingleSlot} className="gradient-primary" disabled={!startTime}>
                <Plus className="w-4 h-4 mr-2" />
                Create Slot
              </Button>
            </CardContent>
          </Card>
        )}

        {/* BULK GENERATION MODE */}
        {mode === "bulk" && (
          <Card variant="glass" className="border-primary/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Bulk Slot Generator
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Create multiple slots automatically with recurring schedules
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* DATE RANGE */}
              <div>
                <Label className="text-base font-semibold mb-3 block">1. Date Range</Label>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm">Start Date</Label>
                    <div
                      className="relative cursor-pointer"
                      onClick={() => startDateRef.current?.showPicker()}
                    >
                      <Input
                        ref={startDateRef}
                        type="date"
                        value={bulkStartDate}
                        onChange={e => setBulkStartDate(e.target.value)}
                        min={new Date().toISOString().split("T")[0]}
                        className="cursor-pointer"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm">End Date</Label>
                    <div
                      className="relative cursor-pointer"
                      onClick={() => endDateRef.current?.showPicker()}
                    >
                      <Input
                        ref={endDateRef}
                        type="date"
                        value={bulkEndDate}
                        onChange={e => setBulkEndDate(e.target.value)}
                        min={bulkStartDate || new Date().toISOString().split("T")[0]}
                        className="cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SLOT GENERATION MODE */}
              <div>
                <Label className="text-base font-semibold mb-3 block">2. Slot Generation Mode</Label>
                <div className="flex gap-4 flex-wrap">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="slotMode"
                      checked={slotGenerationMode === "weekdays"}
                      onChange={() => setSlotGenerationMode("weekdays")}
                      className="w-4 h-4 text-primary"
                    />
                    <span className="text-sm">Generate slots for Weekdays</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="slotMode"
                      checked={slotGenerationMode === "weekends"}
                      onChange={() => setSlotGenerationMode("weekends")}
                      className="w-4 h-4 text-primary"
                    />
                    <span className="text-sm">Generate slots for Weekends</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="slotMode"
                      checked={slotGenerationMode === "both"}
                      onChange={() => setSlotGenerationMode("both")}
                      className="w-4 h-4 text-primary"
                    />
                    <span className="text-sm">Generate slots for All Days</span>
                  </label>
                </div>
              </div>

              {/* ACTIVE DAYS */}
              <div>
                <Label className="text-base font-semibold mb-3 block">3. Active Days</Label>
                {isTodayInBulkRange && (
                  <p className="text-xs text-amber-500 mb-2">
                    Note: Today cannot be selected for bulk slot generation.
                  </p>
                )}
                <div className="flex gap-2 flex-wrap">
                  {visibleDays.map(({ value, label }) => {
                    const isDisabled = isDayDisabled(value);
                    const isSelected = activeDays.includes(value);
                    return (
                      <Button
                        key={value}
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleDay(value)}
                        disabled={isDisabled}
                        className={`
                          ${isSelected ? "bg-green-600 hover:bg-green-700 text-white" : ""}
                          ${isDisabled ? "opacity-50 cursor-not-allowed bg-gray-300 text-gray-500" : ""}
                        `}
                      >
                        {label}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* TIME BLOCKS */}
              <div>
                <Label className="text-base font-semibold mb-3 block">4. Time Blocks & Pricing</Label>
                <div className="space-y-3">
                  {timeBlocks.map((block, index) => (
                    <div key={index} className="space-y-1">
                      <div className={`flex gap-3 items-end p-3 rounded-lg ${timeBlockErrors[index] ? "bg-red-500/10 border border-red-500/30" : "bg-secondary/30"
                        }`}>
                        <div className="flex-1 grid grid-cols-4 gap-3">
                          <div>
                            <Label className="text-xs">Start</Label>
                            <Input
                              type="time"
                              value={block.start}
                              onChange={e => updateTimeBlock(index, "start", e.target.value)}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">End</Label>
                            <Input
                              type="time"
                              value={block.end}
                              onChange={e => updateTimeBlock(index, "end", e.target.value)}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Price (₹)</Label>
                            <Input
                              type="number"
                              value={block.price}
                              onChange={e => updateTimeBlock(index, "price", Number(e.target.value))}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Label</Label>
                            <Input
                              value={block.label || ""}
                              onChange={e => updateTimeBlock(index, "label", e.target.value)}
                              placeholder="Morning"
                            />
                          </div>
                        </div>
                        {timeBlocks.length > 1 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeTimeBlock(index)}
                            className="text-destructive hover:text-destructive"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      {timeBlockErrors[index] && (
                        <p className="text-xs text-red-500 pl-3">{timeBlockErrors[index]}</p>
                      )}
                    </div>
                  ))}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addTimeBlock}
                      disabled={timeBlocks.length >= MAX_TIME_BLOCKS}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Time Block
                    </Button>
                    {timeBlocks.length >= MAX_TIME_BLOCKS && (
                      <span className="text-xs text-muted-foreground">
                        Maximum {MAX_TIME_BLOCKS} time blocks allowed.
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* SLOT DURATION */}
              <div>
                <Label className="text-base font-semibold mb-3 block">5. Slot Duration</Label>
                <select
                  className="w-full border border-border rounded-md p-2 bg-background"
                  value={slotDuration}
                  onChange={e => setSlotDuration(Number(e.target.value))}
                >
                  <option value={30}>30 minutes</option>
                  <option value={60}>60 minutes (1 hour)</option>
                  <option value={90}>90 minutes (1.5 hours)</option>
                  <option value={120}>120 minutes (2 hours)</option>
                </select>
              </div>

              {/* CONFLICT STRATEGY */}
              <div>
                <Label className="text-base font-semibold mb-3 block">6. Conflict Strategy</Label>
                <select
                  className="w-full border border-border rounded-md p-2 bg-background"
                  value={conflictStrategy}
                  onChange={e => setConflictStrategy(e.target.value as any)}
                >
                  <option value="skip">Skip - Don't create overlapping slots (Safe)</option>
                  <option value="overwrite">Overwrite - Replace existing slots</option>
                  <option value="fill_gaps">Fill Gaps - Only add where missing</option>
                </select>
              </div>

              {/* PREVIEW */}
              <div className={`rounded-lg p-4 ${previewData.valid
                ? "bg-blue-500/10 border border-blue-500/30"
                : "bg-amber-500/10 border border-amber-500/30"
                }`}>
                <div className="flex items-start gap-3">
                  <AlertCircle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${previewData.valid ? "text-blue-500" : "text-amber-500"
                    }`} />
                  <div>
                    <p className={`font-semibold ${previewData.valid ? "text-blue-600" : "text-amber-600"}`}>
                      Preview
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {previewData.valid ? (
                        <>Will create approximately <span className="font-bold text-foreground">{previewData.count}</span> slots</>
                      ) : (
                        <span className="text-amber-600">{previewData.message}</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* GENERATE BUTTON */}
              <Button
                onClick={handleBulkGenerate}
                disabled={loading || !previewData.valid || timeBlockErrors.some(e => e !== "")}
                className="w-full gradient-primary"
                size="lg"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Generate Slots
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* EDIT MODAL */}
        {editingSlot && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Edit2 className="w-5 h-5" />
                  Edit Slot
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Start Time</Label>
                    <Input
                      type="time"
                      value={editingSlot.start_time}
                      onChange={e => setEditingSlot({ ...editingSlot, start_time: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>End Time</Label>
                    <Input
                      type="time"
                      value={editingSlot.end_time}
                      onChange={e => setEditingSlot({ ...editingSlot, end_time: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label>Price (₹)</Label>
                  <Input
                    type="number"
                    value={editingSlot.price}
                    onChange={e => setEditingSlot({ ...editingSlot, price: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Label (Optional)</Label>
                  <Input
                    value={editingSlot.label || ""}
                    onChange={e => setEditingSlot({ ...editingSlot, label: e.target.value })}
                    placeholder="Morning"
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setEditingSlot(null)} className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={handleSaveEdit} className="flex-1 gradient-primary">
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default TurfSlotsPage;
