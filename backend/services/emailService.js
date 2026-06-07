const { sendMail, isEmailConfigured } = require("../utils/emailSender");

const sendEmail = async ({ to, subject, html, text }) => {
  if (!isEmailConfigured()) {
    console.error("SMTP not configured — email not sent");
    return false;
  }

  try {
    const info = await sendMail({ to, subject, html, text });
    console.log("Message sent: %s", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending email:", error.message);
    return false;
  }
};

const sendWelcomeEmail = async (email, name) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Welcome to TurfBook, ${name}!</h2>
      <p>Thank you for registering. Your account has been successfully created.</p>
    </div>
  `;
  return sendEmail({ to: email, subject: "Welcome to TurfBook!", html });
};

const sendTurfApprovalEmail = async (email, ownerName, turfName) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #059669;">Your Turf Has Been Approved!</h2>
      <p>Dear ${ownerName},</p>
      <p>Your turf "<strong>${turfName}</strong>" is now live on TurfBook.</p>
    </div>
  `;
  return sendEmail({ to: email, subject: "Your Turf is Live! - TurfBook", html });
};

const sendTurfRejectionEmail = async (email, ownerName, turfName, reason) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #dc2626;">Turf Verification Update</h2>
      <p>Dear ${ownerName},</p>
      <p>Your turf "<strong>${turfName}</strong>" could not be approved yet.</p>
      <p><strong>Reason:</strong> ${reason}</p>
    </div>
  `;
  return sendEmail({ to: email, subject: "Turf Verification Update - TurfBook", html });
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendTurfApprovalEmail,
  sendTurfRejectionEmail,
};
