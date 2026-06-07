const supabase = require("../config/db");
const { sendMail, isSmtpConfigured } = require("../utils/mailTransport");

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

    // Send email notification
    if (isSmtpConfigured()) {
      try {
        await sendMail({
          to: "bookmyturfofficial@gmail.com",
          replyTo: userEmail,
          subject: `[Contact Form] ${subject || "General Inquiry"}`,
          text: `New contact form submission:\n\nName: ${name}\nEmail: ${userEmail}\nSubject: ${subject || "General Inquiry"}\n\nMessage:\n${message}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">New Contact Form Submission</h2>
              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> <a href="mailto:${userEmail}">${userEmail}</a></p>
                <p><strong>Subject:</strong> ${subject || "General Inquiry"}</p>
              </div>
              <div style="background: #ffffff; padding: 20px; border-left: 4px solid #2563eb;">
                <h3>Message:</h3>
                <p style="line-height: 1.6;">${message.replace(/\n/g, '<br>')}</p>
              </div>
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 12px;">
                This email was sent from the Book My Turf contact form. 
                Reply directly to this email to respond to ${name}.
              </p>
            </div>
          `,
        });
        console.log("✅ Contact form email sent");
        console.log("📧 Email sent to: bookmyturfsupport@gmail.com");
        console.log("📤 From:", userEmail);
      } catch (emailError) {
        console.error("❌ Email sending failed:", emailError);
        console.error("Details:", {
          code: emailError.code,
          command: emailError.command,
          response: emailError.response,
          responseCode: emailError.responseCode
        });
        // Don't fail the entire request if email fails
        // Message is still saved in database
      }
    } else {
      console.warn("⚠️ SMTP credentials not configured. Email not sent.");
      console.warn("Please set SMTP_USER and SMTP_PASS in environment variables");
    }

    res.status(201).json({ message: "Message sent", data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to submit message" });
  }
};
