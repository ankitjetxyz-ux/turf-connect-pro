const jwt = require("jsonwebtoken");
const supabase = require("../config/db");

const adminAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: "Access denied. No token provided." });
        }

        const token = authHeader.split(' ')[1];

        // Verify token
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // Check if user is admin
        if (decoded.role !== 'admin' && decoded.role !== 'super_admin') {
            return res.status(403).json({ error: "Access denied. Admin privileges required." });
        }

        // Verify admin exists in database and is active
        const { data: admin, error } = await supabase
            .from("admins")
            .select("id, email, name, role, is_active")
            .eq("id", decoded.adminId)
            .single();

        if (error || !admin) {
            return res.status(401).json({ error: "Invalid admin credentials." });
        }

        if (!admin.is_active) {
            return res.status(403).json({ error: "Admin account is deactivated." });
        }

        // Attach admin to request
        req.admin = admin;
        next();

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: "Token expired." });
        }
        return res.status(401).json({ error: "Invalid token." });
    }
};

module.exports = adminAuth;
