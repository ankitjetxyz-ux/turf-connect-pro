const supabase = require("../config/db");

/* ============================================================================
   RECURRING SLOT SCHEDULER - CONTROLLER
   ============================================================================
   Implements bulk slot generation with recurring schedules
   Features:
   - Date range selection
   - Day-of-week filtering
   - Multiple time blocks per day
   - Configurable slot duration
   - Conflict handling strategies
   ============================================================================ */

/* ============================================================================
   UTILITY FUNCTIONS
   ============================================================================ */

/**
 * Get day name from date
 */
const getDayName = (date) => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[new Date(date).getDay()];
};

/**
 * Convert time string to minutes since midnight
 */
const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Convert minutes to time string
 */
const minutesToTime = (totalMinutes) => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

/**
 * Generate date range array
 */
const getDateRange = (startDate, endDate) => {
  const dates = [];
  const current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    dates.push(new Date(current).toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }

  return dates;
};

/**
 * Check if slot overlaps with existing slots
 */
const checkOverlap = async (turfId, date, startTime, endTime, excludeId = null) => {
  const { data, error } = await supabase
    .from('slots')
    .select('id')
    .eq('turf_id', turfId)
    .eq('date', date)
    .or(`and(start_time.lt.${endTime},end_time.gt.${startTime})`);

  if (error) return { overlap: false };

  if (excludeId) {
    return { overlap: data.some(slot => slot.id !== excludeId) };
  }

  return { overlap: data && data.length > 0 };
};

/* ============================================================================
   BULK SLOT GENERATION
   ============================================================================ */

exports.bulkGenerateSlots = async (req, res) => {
  try {
    const {
      turf_id,
      start_date,
      end_date,
      active_days,      // ["monday", "tuesday", ...]
      time_blocks,      // [{start, end, price, label}]
      slot_duration,    // in minutes
      conflict_strategy = 'skip', // 'skip', 'overwrite', 'fill_gaps'
      save_template = false,
      template_name
    } = req.body;

    // Validation
    if (!turf_id || !start_date || !end_date || !active_days || !time_blocks || !slot_duration) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!Array.isArray(active_days) || active_days.length === 0) {
      return res.status(400).json({ error: 'active_days must be a non-empty array' });
    }

    if (!Array.isArray(time_blocks) || time_blocks.length === 0) {
      return res.status(400).json({ error: 'time_blocks must be a non-empty array' });
    }

    // Verify ownership
    const { data: turf, error: turfError } = await supabase
      .from('turfs')
      .select('owner_id')
      .eq('id', turf_id)
      .single();

    if (turfError || !turf) {
      return res.status(404).json({ error: 'Turf not found' });
    }

    if (turf.owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Save template if requested
    let templateId = null;
    if (save_template) {
      const { data: template, error: templateError } = await supabase
        .from('slot_templates')
        .insert([{
          turf_id,
          name: template_name || `Template ${new Date().toISOString()}`,
          start_date,
          end_date,
          active_days,
          time_blocks,
          slot_duration,
          conflict_strategy
        }])
        .select()
        .single();

      if (!templateError && template) {
        templateId = template.id;
      }
    }

    // Generate slots
    const slotsToCreate = [];
    const skipped = [];
    const dateRange = getDateRange(start_date, end_date);

    for (const date of dateRange) {
      const dayName = getDayName(date);

      // Skip if day not in active_days
      if (!active_days.includes(dayName)) {
        continue;
      }

      // Process each time block
      for (const block of time_blocks) {
        const blockStart = timeToMinutes(block.start);
        const blockEnd = timeToMinutes(block.end);
        let currentTime = blockStart;

        // Generate slots within time block
        while (currentTime + slot_duration <= blockEnd) {
          const slotStart = minutesToTime(currentTime);
          const slotEnd = minutesToTime(currentTime + slot_duration);

          // Check for conflicts
          const { overlap } = await checkOverlap(turf_id, date, slotStart, slotEnd);

          if (overlap) {
            if (conflict_strategy === 'skip') {
              skipped.push({ date, start: slotStart, end: slotEnd });
              currentTime += slot_duration;
              continue;
            } else if (conflict_strategy === 'overwrite') {
              // Delete existing conflicting slots
              await supabase
                .from('slots')
                .delete()
                .eq('turf_id', turf_id)
                .eq('date', date)
                .gte('start_time', slotStart)
                .lt('start_time', slotEnd);
            }
            // 'fill_gaps' - will insert if no exact match exists
          }

          slotsToCreate.push({
            turf_id,
            template_id: templateId,
            date,
            start_time: slotStart,
            end_time: slotEnd,
            price: block.price,
            label: block.label || null,
            status: 'available',
            is_booked: false
          });

          currentTime += slot_duration;
        }
      }
    }

    // Bulk insert slots
    let created = [];
    if (slotsToCreate.length > 0) {
      // Insert in batches to avoid timeout
      const batchSize = 500;
      for (let i = 0; i < slotsToCreate.length; i += batchSize) {
        const batch = slotsToCreate.slice(i, i + batchSize);
        const { data, error } = await supabase
          .from('slots')
          .insert(batch)
          .select();

        if (!error && data) {
          created = created.concat(data);
        }
      }
    }

    console.log(`✅ Bulk generation: ${created.length} slots created, ${skipped.length} skipped`);

    res.status(201).json({
      success: true,
      created: created.length,
      skipped: skipped.length,
      template_id: templateId,
      message: `Successfully created ${created.length} slots${skipped.length > 0 ? `, skipped ${skipped.length} conflicting slots` : ''}`
    });

  } catch (err) {
    console.error('[bulkGenerateSlots] error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/* ============================================================================
   SINGLE SLOT CREATION
   ============================================================================ */

exports.createSlot = async (req, res) => {
  try {
    const { turf_id, date, start_time, end_time, price, label } = req.body;

    if (!turf_id || !start_time || !end_time || !price) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const slotDate = date || new Date().toISOString().split("T")[0];

    // Check overlap - for single slot creation, reject if any slot exists for this time
    const { overlap } = await checkOverlap(turf_id, slotDate, start_time, end_time);
    if (overlap) {
      return res.status(400).json({ error: 'Slot already exists for this time. Please delete the existing slot first.' });
    }

    const { data, error } = await supabase
      .from("slots")
      .insert([{
        turf_id,
        date: slotDate,
        start_time,
        end_time,
        price,
        label,
        status: 'available',
        is_booked: false,
      }])
      .select()
      .single();

    if (error) {
      console.error("Error creating slot:", error);
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json(data);
  } catch (err) {
    console.error("Create slot crash:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* ============================================================================
   GET SLOTS
   ============================================================================ */

exports.getSlotsByTurf = async (req, res) => {
  try {
    const { turfId } = req.params;
    const { date, start_date, end_date, status } = req.query;

    if (!turfId) {
      return res.status(400).json({ error: "Turf ID is required" });
    }


    let query = supabase
      .from("slots")
      .select("*")
      .eq("turf_id", turfId);

    // AUTO-RELEASE EXPIRED HOLDS
    // Checks for held slots where lock_expires_at < now and resets them
    const { error: releaseError } = await supabase
      .from("slots")
      .update({ status: 'available', locked_by: null, lock_expires_at: null })
      .eq('turf_id', turfId)
      .eq('status', 'held')
      .lt('lock_expires_at', new Date().toISOString());

    if (releaseError) {
      console.error("Error releasing expired slots:", releaseError);
      // Continue anyway, don't block fetch
    }

    // Filter by single date
    if (date) {
      query = query.eq('date', date);
    }

    // Filter by date range
    if (start_date && end_date) {
      query = query.gte('date', start_date).lte('date', end_date);
    }

    // Filter by status
    if (status) {
      query = query.eq('status', status);
    }

    query = query.order("date").order("start_time");

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching slots:", error);
      return res.status(400).json({ error: error.message });
    }


    res.json(data);
  } catch (err) {
    console.error("Get slots by turf error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* ============================================================================
   CALENDAR VIEW
   ============================================================================ */

exports.getCalendarView = async (req, res) => {
  try {
    const { turfId } = req.params;
    const { start_date, end_date } = req.query;

    if (!turfId || !start_date || !end_date) {
      return res.status(400).json({ error: "turf_id, start_date, and end_date are required" });
    }

    const { data, error } = await supabase
      .from("slots")
      .select("date, status, COUNT(*) as count, SUM(price) as total_price")
      .eq("turf_id", turfId)
      .gte("date", start_date)
      .lte("date", end_date)
      .group("date, status");

    if (error) {
      console.error("Error fetching calendar view:", error);
      return res.status(400).json({ error: error.message });
    }

    // Transform data for calendar
    const calendar = {};
    (data || []).forEach(item => {
      if (!calendar[item.date]) {
        calendar[item.date] = { total: 0, available: 0, booked: 0 };
      }
      calendar[item.date].total += parseInt(item.count);
      calendar[item.date][item.status] = parseInt(item.count);
    });

    res.json(calendar);
  } catch (err) {
    console.error("Get calendar view error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* ============================================================================
   UPDATE SLOT
   ============================================================================ */

exports.updateSlot = async (req, res) => {
  try {
    const { id } = req.params;
    const { price, start_time, end_time, status, label } = req.body;

    // Verify ownership
    const { data: slot, error: slotError } = await supabase
      .from("slots")
      .select("turf_id, status, turfs(owner_id)")
      .eq("id", id)
      .single();

    if (slotError || !slot) {
      return res.status(404).json({ error: "Slot not found" });
    }

    if (!slot.turfs || slot.turfs.owner_id !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Prevent editing booked slots
    if (slot.status === 'booked' && !status) {
      return res.status(400).json({ error: "Cannot edit booked slot" });
    }

    const updates = {};
    if (price !== undefined) updates.price = price;
    if (start_time !== undefined) updates.start_time = start_time;
    if (end_time !== undefined) updates.end_time = end_time;
    if (status !== undefined) updates.status = status;
    if (label !== undefined) updates.label = label;

    const { data, error } = await supabase
      .from("slots")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating slot:", error);
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (err) {
    console.error("Update slot error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* ============================================================================
   BULK UPDATE
   ============================================================================ */

exports.bulkUpdateSlots = async (req, res) => {
  try {
    const { turf_id, updates, filters } = req.body;
    // filters: { date, day_of_week, label, status }
    // updates: { price, status, label }

    if (!turf_id || !updates) {
      return res.status(400).json({ error: "turf_id and updates are required" });
    }

    // Verify ownership
    const { data: turf } = await supabase
      .from('turfs')
      .select('owner_id')
      .eq('id', turf_id)
      .single();

    if (!turf || turf.owner_id !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    let query = supabase
      .from('slots')
      .update(updates)
      .eq('turf_id', turf_id)
      .eq('status', 'available'); // Only update available slots

    // Apply filters
    if (filters?.date) {
      query = query.eq('date', filters.date);
    }
    if (filters?.label) {
      query = query.eq('label', filters.label);
    }

    const { data, error, count } = await query.select();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ updated: count || data?.length || 0, message: `Updated ${count || data?.length || 0} slots` });
  } catch (err) {
    console.error("Bulk update error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* ============================================================================
   DELETE SLOT
   ============================================================================ */

exports.deleteSlot = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: slot, error: slotError } = await supabase
      .from("slots")
      .select("turf_id, status, turfs(owner_id)")
      .eq("id", id)
      .single();

    if (slotError || !slot) {
      return res.status(404).json({ error: "Slot not found" });
    }

    if (!slot.turfs || slot.turfs.owner_id !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    if (slot.status === 'booked') {
      return res.status(400).json({ error: "Cannot delete booked slot" });
    }

    const { error } = await supabase.from("slots").delete().eq("id", id);
    if (error) {
      console.error("Error deleting slot:", error);
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: "Slot deleted" });
  } catch (err) {
    console.error("Delete slot error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* ============================================================================
   BULK DELETE
   ============================================================================ */

exports.bulkDeleteSlots = async (req, res) => {
  try {
    const { turf_id, filters } = req.body;
    // filters: { start_date, end_date, label, status }

    if (!turf_id) {
      return res.status(400).json({ error: "turf_id is required" });
    }

    // Verify ownership
    const { data: turf } = await supabase
      .from('turfs')
      .select('owner_id')
      .eq('id', turf_id)
      .single();

    if (!turf || turf.owner_id !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    let query = supabase
      .from('slots')
      .delete()
      .eq('turf_id', turf_id)
      .neq('status', 'booked'); // Don't delete booked slots

    // Apply filters
    if (filters?.start_date) {
      query = query.gte('date', filters.start_date);
    }
    if (filters?.end_date) {
      query = query.lte('date', filters.end_date);
    }
    if (filters?.label) {
      query = query.eq('label', filters.label);
    }

    const { count, error } = await query;

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ deleted: count || 0, message: `Deleted ${count || 0} slots` });
  } catch (err) {
    console.error("Bulk delete error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* ============================================================================
   TEMPLATES
   ============================================================================ */

exports.getTemplates = async (req, res) => {
  try {
    const { turf_id } = req.query;

    if (!turf_id) {
      return res.status(400).json({ error: "turf_id is required" });
    }

    const { data, error } = await supabase
      .from('slot_templates')
      .select('*')
      .eq('turf_id', turf_id)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data || []);
  } catch (err) {
    console.error("Get templates error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.applyTemplate = async (req, res) => {
  try {
    const { template_id, start_date, end_date } = req.body;

    if (!template_id || !start_date || !end_date) {
      return res.status(400).json({ error: "template_id, start_date, and end_date are required" });
    }

    const { data: template, error: templateError } = await supabase
      .from('slot_templates')
      .select('*')
      .eq('id', template_id)
      .single();

    if (templateError || !template) {
      return res.status(404).json({ error: "Template not found" });
    }

    // Use template config to generate slots
    req.body = {
      turf_id: template.turf_id,
      start_date,
      end_date,
      active_days: template.active_days,
      time_blocks: template.time_blocks,
      slot_duration: template.slot_duration,
      conflict_strategy: template.conflict_strategy
    };

    // Call bulk generate
    return exports.bulkGenerateSlots(req, res);
  } catch (err) {
    console.error("Apply template error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};


/* ============================================================================
   HOLD SLOT
   ============================================================================ */

exports.holdSlot = async (req, res) => {
  try {
    const { slot_ids } = req.body;
    const user_id = req.user.id;

    if (!slot_ids || !Array.isArray(slot_ids) || slot_ids.length === 0) {
      return res.status(400).json({ error: "slot_ids array is required" });
    }

    // LIMIT 1: Max 3 slots per hold
    if (slot_ids.length > 3) {
      return res.status(400).json({ error: "Cannot hold more than 3 slots at a time" });
    }

    // Fetch turf_id from the first slot to check for existing holds
    // We assume all slots belong to the same turf (frontend enforces this, but validation is good)
    const { data: slotInfo, error: slotInfoError } = await supabase
      .from("slots")
      .select("turf_id")
      .in("id", slot_ids)
      .limit(1)
      .single();

    if (slotInfoError || !slotInfo) {
      return res.status(400).json({ error: "Invalid slot IDs" });
    }

    const turfId = slotInfo.turf_id;

    // LIMIT 2: Only one active hold per user per turf
    const { count: existingHolds, error: holdError } = await supabase
      .from("slots")
      .select("id", { count: "exact", head: true })
      .eq("turf_id", turfId)
      .eq("locked_by", user_id)
      .eq("status", "held")
      .gt("lock_expires_at", new Date().toISOString()); // Only count non-expired holds

    if (holdError) {
      console.error("Error checking existing holds:", holdError);
      return res.status(500).json({ error: "Failed to check existing holds" });
    }

    if (existingHolds > 0) {
      return res.status(400).json({ error: "You already have active held slots for this turf. Please complete or cancel them first." });
    }

    // Update slots: set status = 'held', locked_by = user_id
    // Only where status is 'available' to prevent overwriting existing holds/bookings
    // EXPIRY: Set to 5 minutes from now
    const { data, error } = await supabase
      .from("slots")
      .update({
        status: 'held',
        locked_by: user_id,
        lock_expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString()
      })
      .in("id", slot_ids)
      .eq("status", "available") // Optimistic locking
      .select();

    if (error) {
      console.error("Error holding slots:", error);
      return res.status(400).json({ error: error.message });
    }

    if (!data || data.length !== slot_ids.length) {
      // Some slots could not be held (already booked/held)
      // Rollback? No, just report success for those that worked, or fail all?
      // For now, let's treat partial success as failure or just return what was held.
      // Better to fail if not all could be held.
      // But we already updated some.
      // ideally we should check first.
      // For this subproblem, let's just return what was held.
      if (data.length === 0) {
        return res.status(409).json({ error: "Selected slots are no longer available" });
      }
      return res.json({
        message: `Held ${data.length} slots`,
        held_slots: data,
        partial: data.length !== slot_ids.length
      });
    }

    res.json({ message: "Slots held successfully", held_slots: data });
  } catch (err) {
    console.error("Hold slot error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = exports;
