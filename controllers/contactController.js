const supabase = require("../config/db");

exports.submitContactForm = async (req, res, next) => {
  try {
    const { name, email, message, subject } = req.body;
    
    // In a real app, we might send an email via SendGrid/AWS SES here.
    // Since we are "treating it as sent to admin email", we store it in DB 
    // with a status that implies it's an inbox item for the admin.
    
    // We assume a 'contact_messages' table exists.
    const { data, error } = await supabase
      .from("contact_messages")
      .insert([
        {
          name,
          email,
          message,
          subject: subject || "General Inquiry",
          admin_email: "ankitjetxyz@gmail.com", // treated as admin ID/Email
          status: "unread",
          user_id: req.user ? req.user.id : null // optional if logged in
        }
      ])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ message: "Message sent successfully", data });
  } catch (err) {
    next(err);
  }
};
