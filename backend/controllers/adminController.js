const supabase = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { sendTurfApprovalEmail, sendTurfRejectionEmail } = require("../services/emailService");

// ============================================
// ADMIN LOGIN
// ============================================
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }

        // Find admin
        const { data: admin, error } = await supabase
            .from("admins")
            .select("*")
            .eq("email", email)
            .eq("is_active", true)
            .single();

        if (error || !admin) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, admin.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // Update last login
        await supabase
            .from("admins")
            .update({ last_login: new Date().toISOString() })
            .eq("id", admin.id);

        // Create Token
        const token = jwt.sign(
            { adminId: admin.id, role: admin.role, email: admin.email },
            process.env.JWT_SECRET,
            { expiresIn: "12h" }
        );

        // Log activity
        await logActivity({
            activityType: 'admin_login',
            description: 'Admin logged in',
            adminId: admin.id
        });

        res.json({
            success: true,
            token,
            admin: {
                id: admin.id,
                name: admin.name,
                email: admin.email,
                role: admin.role
            }
        });

    } catch (err) {
        console.error("Admin login error:", err);
        res.status(500).json({ error: "Server error during login" });
    }
};

// ============================================
// DASHBOARD STATS
// ============================================
exports.getDashboardStats = async (req, res) => {
    try {
        console.log("📊 [Admin] Fetching Dashboard Stats...");
        // 1. Total Turfs & Live Turfs
        const { count: totalTurfs, error: err1 } = await supabase
            .from("turfs")
            .select("*", { count: "exact", head: true });

        const { count: liveTurfs, error: err2 } = await supabase
            .from("turfs")
            .select("*", { count: "exact", head: true })
            .eq("verification_status", "approved");

        const { count: pendingTurfs, error: err3 } = await supabase
            .from("turfs")
            .select("*", { count: "exact", head: true })
            .eq("verification_status", "pending");

        // 2. Users (Total & New this week)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { count: totalUsers } = await supabase
            .from("users")
            .select("*", { count: "exact", head: true });

        const { count: newUsers } = await supabase
            .from("users")
            .select("*", { count: "exact", head: true })
            .gte("created_at", sevenDaysAgo.toISOString());

        // 3. Bookings (This week)
        const { count: weeklyBookings } = await supabase
            .from("bookings")
            .select("*", { count: "exact", head: true })
            .gte("created_at", sevenDaysAgo.toISOString());

        res.json({
            turfs: {
                total: totalTurfs || 0,
                live: liveTurfs || 0,
                pending: pendingTurfs || 0
            },
            users: {
                total: totalUsers || 0,
                new: newUsers || 0
            },
            bookings: {
                weekly: weeklyBookings || 0
            }
        });

    } catch (err) {
        console.error("Dashboard stats error:", err);
        res.status(500).json({ error: "Failed to fetch dashboard statistics" });
    }
};

// ============================================
// PENDING TURFS (PREVIEW)
// ============================================
exports.getPendingTurfsPreview = async (req, res) => {
    try {
        const { data: turfs, error } = await supabase
            .from("turfs")
            .select(`
        id, 
        name, 
        location, 
        submitted_at, 
        images,
        owner:users!owner_id (name, email)
      `)
            .eq("verification_status", "pending")
            .order("submitted_at", { ascending: false })
            .limit(5);

        if (error) throw error;

        res.json({ turfs });

    } catch (err) {
        console.error("Pending turfs preview error:", err);
        res.status(500).json({ error: "Failed to fetch pending turfs" });
    }
};

// ============================================
// VERIFICATION LIST (ALL STATUSES)
// ============================================
exports.getTurfsByStatus = async (req, res) => {
    try {
        const { status } = req.params; // pending, approved, rejected
        const { search, city } = req.query;

        let query = supabase
            .from("turfs")
            .select(`
        id, 
        name, 
        location, 
        formatted_address,
        submitted_at, 
        reviewed_at,
        verification_status,
        images,
        owner:users!owner_id (name, email, phone)
      `)
            .eq("verification_status", status)
            .order("submitted_at", { ascending: false });

        // Apply filters
        if (city && city !== 'All') {
            query = query.ilike('location', `%${city}%`);
        }

        if (search) {
            // Note: Supabase basic search. For complex OR, might need .or()
            query = query.ilike('name', `%${search}%`);
            // Simulating search on name. 
            // If we need mulit-field search, we use .or(`name.ilike.%${search}%,location.ilike.%${search}%`)
        }

        const { data, error } = await query;

        if (error) throw error;

        res.json({ turfs: data });

    } catch (err) {
        console.error("Turf list error:", err);
        res.status(500).json({ error: "Failed to fetch turfs" });
    }
};

// ============================================
// TURF DETAILS (FULL VIEW)
// ============================================
exports.getTurfVerificationDetails = async (req, res) => {
    try {
        const { id } = req.params;

        const { data: turf, error } = await supabase
            .from("turfs")
            .select(`
        *,
        owner:users!owner_id (
          id, name, email, phone, created_at, email_verified
        )
      `)
            .eq("id", id)
            .single();

        if (error || !turf) {
            return res.status(404).json({ error: "Turf not found" });
        }

        // 2. Fetch Documents Explicitly
        const { data: docs } = await supabase
            .from("turf_verification_documents")
            .select("*")
            .eq("turf_id", id);

        // Attach to turf object
        turf.turf_verification_documents = docs || [];

        // 3. Activity Logs
        const { data: logs } = await supabase
            .from("activity_logs")
            .select("*")
            .eq("entity_id", id)
            .order("created_at", { ascending: false });

        res.json({
            turf,
            activityLogs: logs || []
        });

    } catch (err) {
        console.error("Turf detail error:", err);
        res.status(500).json({ error: "Failed to fetch turf details" });
    }
};

// ============================================
// APPROVE TURF
// ============================================
exports.approveTurf = async (req, res) => {
    try {
        const { id } = req.params;
        const { adminNotes } = req.body;
        const adminId = req.admin.id;

        // 1. Update Turf
        const { data: turf, error } = await supabase
            .from("turfs")
            .update({
                verification_status: 'approved',
                is_active: true, // Go live immediately?
                reviewed_at: new Date().toISOString(),
                reviewed_by: adminId,
                admin_notes: adminNotes
            })
            .eq("id", id)
            .select("*, owner:users!owner_id(email, name)")
            .single();

        if (error) throw error;

        // 2. Log Activity
        await logActivity({
            activityType: 'turf_approved',
            description: `Turf "${turf.name}" approved`,
            entityId: id,
            entityType: 'turf',
            adminId: adminId
        });

        // 3. Add to History
        await supabase.from("turf_verification_history").insert({
            turf_id: id,
            old_status: 'pending',
            new_status: 'approved',
            changed_by: adminId,
            change_reason: adminNotes || 'Approved by Admin'
        });

        // 3. Send Email
        if (turf.owner && turf.owner.email) {
            await sendTurfApprovalEmail(turf.owner.email, turf.owner.name, turf.name);
        }

        res.json({
            success: true,
            message: "Turf approved successfully"
        });

    } catch (err) {
        console.error("Approve turf error:", err);
        res.status(500).json({ error: "Failed to approve turf" });
    }
};

// ============================================
// REJECT TURF
// ============================================
exports.rejectTurf = async (req, res) => {
    try {
        const { id } = req.params;
        const { rejectionReason, adminNotes } = req.body;
        const adminId = req.admin.id;

        if (!rejectionReason) {
            return res.status(400).json({ error: "Rejection reason is required" });
        }

        // 1. Update Turf
        const { data: turf, error } = await supabase
            .from("turfs")
            .update({
                verification_status: 'rejected',
                reviewed_at: new Date().toISOString(),
                reviewed_by: adminId,
                rejection_reason: rejectionReason,
                admin_notes: adminNotes
            })
            .eq("id", id)
            .select("*, owner:users!owner_id(email, name)")
            .single();

        if (error) throw error;

        // 2. Log Activity
        await logActivity({
            activityType: 'turf_rejected',
            description: `Turf "${turf.name}" rejected`,
            entityId: id,
            entityType: 'turf',
            adminId: adminId
        });

        // 3. Add to History
        await supabase.from("turf_verification_history").insert({
            turf_id: id,
            old_status: 'pending',
            new_status: 'rejected',
            changed_by: adminId,
            change_reason: rejectionReason
        });

        // 3. Send Email
        if (turf.owner && turf.owner.email) {
            await sendTurfRejectionEmail(turf.owner.email, turf.owner.name, turf.name, rejectionReason);
        }

        res.json({
            success: true,
            message: "Turf rejected successfully"
        });

    } catch (err) {
        console.error("Reject turf error:", err);
        res.status(500).json({ error: "Failed to reject turf" });
    }
};

// ============================================
// ACTIVITY LOGS
// ============================================
exports.getRecentActivity = async (req, res) => {
    try {
        const { data: activities, error } = await supabase
            .from("activity_logs")
            .select(`
        *,
        admin:admins!admin_id(name)
      `)
            .order("created_at", { ascending: false })
            .limit(10);

        if (error) throw error;

        res.json({ activities });

    } catch (err) {
        console.error("Activity log error:", err);
        res.status(500).json({ error: "Failed to fetch activities" });
    }
};


// Helper: Log Activity
async function logActivity({ activityType, description, entityId, entityType, adminId, metadata }) {
    try {
        await supabase.from("activity_logs").insert({
            activity_type: activityType,
            description,
            entity_id: entityId,
            entity_type: entityType,
            admin_id: adminId,
            metadata
        });
    } catch (e) {
        console.error("Failed to log activity:", e);
        // Don't fail the request just because logging failed
    }
}
