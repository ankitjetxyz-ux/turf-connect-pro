const nodemailer = require("nodemailer");

// Create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

const sendEmail = async ({ to, subject, html }) => {
    try {
        const info = await transporter.sendMail({
            from: `"Turf Connect" <${process.env.SMTP_USER}>`, // sender address
            to,
            subject,
            html,
        });
        console.log("Message sent: %s", info.messageId);
        return true;
    } catch (error) {
        console.error("Error sending email:", error);
        return false;
    }
};

const sendWelcomeEmail = async (email, name) => {
    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Welcome to Turf Connect, ${name}!</h2>
      <p>Thank you for registering with Turf Connect. Your account has been successfully created.</p>
      <p>We are excited to have you on board.</p>
    </div>
  `;
    return sendEmail({ to: email, subject: "Welcome to Turf Connect! 🎉", html });
};

const sendTurfApprovalEmail = async (email, ownerName, turfName) => {
    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #059669;">🎉 Your Turf Has Been Approved!</h2>
      <p>Dear ${ownerName},</p>
      <p>Great news! Your turf "<strong>${turfName}</strong>" has been approved by our verification team and is now <strong style="color: #059669;">LIVE</strong> on Turf Connect.</p>
      
      <p>Players can now discover and book slots at your facility.</p>
      
      <div style="background: #ecfdf5; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <h3 style="color: #047857; margin-top: 0;">Next Steps:</h3>
        <ul style="color: #064e3b;">
          <li>Log in to your dashboard to manage pricing and slots</li>
          <li>Keep your calendar updated to avoid double bookings</li>
          <li>Share your turf link on social media</li>
        </ul>
      </div>
      
      <p>Thank you for partnering with us!</p>
      <p>Best regards,<br/>The Turf Connect Team</p>
    </div>
  `;
    return sendEmail({ to: email, subject: "Your Turf is Live! - Turf Connect", html });
};

const sendTurfRejectionEmail = async (email, ownerName, turfName, reason) => {
    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #dc2626;">Action Required: Turf Verification Update</h2>
      <p>Dear ${ownerName},</p>
      <p>Thank you for submitting "<strong>${turfName}</strong>" to Turf Connect.</p>
      
      <p>Unfortunately, we are unable to approve your listing at this time. Our verification team has identified the following issues:</p>
      
      <div style="background: #fef2f2; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #dc2626;">
        <h3 style="color: #b91c1c; margin-top: 0;">Reason for Rejection:</h3>
        <p style="color: #374151; white-space: pre-wrap;">${reason}</p>
      </div>
      
      <p>Please update your listing details or documents according to the feedback above and re-submit for verification.</p>
      
      <p>If you have any questions, simply reply to this email.</p>
      <p>Best regards,<br/>The Turf Connect Team</p>
    </div>
  `;
    return sendEmail({ to: email, subject: "Action Required: Verification Status - Turf Connect", html });
};

module.exports = {
    sendEmail,
    sendWelcomeEmail,
    sendTurfApprovalEmail,
    sendTurfRejectionEmail
};
