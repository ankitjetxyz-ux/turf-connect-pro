const supabase = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }
    if (!password) {
      return res.status(400).json({ error: "Password is required" });
    }

    // Validate Role
    const allowedRoles = ["player", "client", "admin"];
    const userRole = role || "player";
    if (!allowedRoles.includes(userRole)) {
      return res.status(400).json({ error: "Invalid role. Must be 'player' or 'client'." });
    }

    // Password length check
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long" });
    }

    // Check if user exists
    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("email")
      .eq("email", email)
      .maybeSingle();

    if (checkError) {
      console.error("Check user error:", checkError);
      return res.status(500).json({ error: "Database error checking user" });
    }

    if (existingUser) {
      return res.status(400).json({ error: "User already exists with this email" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from("users")
      .insert([{ name, email, password: hashedPassword, role: userRole }])
      .select();

    if (error) {
      console.error("Supabase insert error:", error);
      return res.status(500).json({ error: "Registration failed: " + error.message });
    }

    res.status(201).json({
      message: "User registered successfully",
      user: data[0]
    });
  } catch (err) {
    console.error("Register exception:", err);
    res.status(500).json({ error: "Registration failed", details: err.message });
  }
};;

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "email and password required" });
    }

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !data) {
      console.error("Login user lookup error:", error);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, data.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: data.id, role: data.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user: { id: data.id, name: data.name, role: data.role, email: data.email, profile_image_url: data.profile_image_url }
    });
  } catch (err) {
    console.error("Login exception:", err);
    res.status(500).json({ error: "Login failed", details: err.message });
  }
};
