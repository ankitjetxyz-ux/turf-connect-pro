const supabase = require("../config/db");
const nodemailer = require("nodemailer");

exports.submitContactForm = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    const userEmail = req.user?.email || email;
    if (!userEmail || !message) {
      return res.status(400).json({ error: "Email and message required" });
    }

    const { data, error: dbError } = await supabase
      .from("contact_messages")
      .insert({
        name,
        email: userEmail,
        subject: subject || "General Inquiry",
        message,
        user_id: req.user?.id || null,
        status: "unread"
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error inserting contact message:", dbError);
      return res.status(500).json({ error: "Failed to save message" });
    }

    if (!data) {
      return res.status(500).json({ error: "Message saved but no data returned" });
    }

    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      await transporter.sendMail({
        from: `"Turf Contact" <${process.env.SMTP_USER}>`,
        to: "bookmyturfofficial@gmail.com",
        replyTo: userEmail,
        subject: `[Contact] ${subject || "General Inquiry"}`,
        text: `Name: ${name}\nEmail: ${userEmail}\n\n${message}`
      });
    }

    res.status(201).json({ message: "Message sent", data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to submit message" });
  }
};
