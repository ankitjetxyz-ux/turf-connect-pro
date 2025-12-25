const supabase = require("../config/db");
const nodemailer = require("nodemailer");

exports.submitContactForm = async (req, res, next) => {
  try {
    const { name, email, message, subject } = req.body;
    
    // Store in DB
    const { data, error } = await supabase
      .from("contact_messages")
      .insert([
        {
          name,
          email,
          message,
          subject: subject || "General Inquiry",
          admin_email: "ankitjetxyz@gmail.com",
          status: "unread",
          user_id: req.user ? req.user.id : null
        }
      ])
      .select()
      .single();

    if (error) throw error;

    // Send Email using Nodemailer
    // Only attempt if SMTP credentials are provided to avoid crashing
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      const transporter = nodemailer.createTransport({
        service: "gmail", // Assuming Gmail or allow custom host
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: process.env.SMTP_PORT || 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      // Note: Most SMTP providers (like Gmail) override the 'from' header to the authenticated user.
      // To strictly follow "sent from user's registered email", we set 'from', but it might be rewritten.
      // We also set 'replyTo' to ensure replies go to the user.
      await transporter.sendMail({
        from: email, 
        to: "ankitjetxyz@gmail.com",
        replyTo: email,
        subject: `[Contact Form] ${subject || "General Inquiry"}`,
        text: `You have received a new message from the contact page.\n\nName: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
      });
    } else {
        console.warn("SMTP credentials missing. Email not sent, but saved to DB.");
    }

    res.status(201).json({ message: "Message sent successfully", data });
  } catch (err) {
    next(err);
  }
};
