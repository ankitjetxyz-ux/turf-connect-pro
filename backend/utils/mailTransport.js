const nodemailer = require("nodemailer");

let transporter = null;

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

/** Gmail app passwords are often copied with spaces — strip them. */
function getSmtpPass() {
  return clean(process.env.SMTP_PASS).replace(/\s+/g, "");
}

function isSmtpConfigured() {
  return Boolean(clean(process.env.SMTP_USER) && getSmtpPass());
}

function buildTransportOptions() {
  const user = clean(process.env.SMTP_USER);
  const pass = getSmtpPass();
  const host = clean(process.env.SMTP_HOST) || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT || 465);
  const isGmail = host === "smtp.gmail.com" || user.endsWith("@gmail.com");

  const base = {
    pool: true,
    maxConnections: 2,
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 25_000,
    auth: { user, pass },
  };

  if (isGmail && !process.env.SMTP_HOST) {
    return { ...base, service: "gmail" };
  }

  return {
    ...base,
    host,
    port,
    secure: port === 465,
    tls: { rejectUnauthorized: false },
  };
}

function getTransporter() {
  if (transporter) return transporter;

  const user = clean(process.env.SMTP_USER);
  const pass = getSmtpPass();
  if (!user || !pass) return null;

  transporter = nodemailer.createTransport(buildTransportOptions());

  transporter.verify().then(
    () => console.log("✅ SMTP ready:", user),
    (err) => console.error("❌ SMTP verify failed:", err.message),
  );

  return transporter;
}

async function verifySmtp() {
  if (!isSmtpConfigured()) {
    return {
      configured: false,
      ready: false,
      error: "SMTP_USER or SMTP_PASS is not set",
    };
  }

  try {
    const t = getTransporter();
    await t.verify();
    return { configured: true, ready: true, user: clean(process.env.SMTP_USER) };
  } catch (err) {
    return {
      configured: true,
      ready: false,
      user: clean(process.env.SMTP_USER),
      error: err.message,
      hint: "Use a Gmail App Password (16 chars, no spaces) with 2-Step Verification enabled.",
    };
  }
}

async function sendMail(options) {
  const t = getTransporter();
  if (!t) {
    throw new Error("SMTP is not configured on the server");
  }

  return t.sendMail({
    from: `"TurfBook" <${clean(process.env.SMTP_USER)}>`,
    ...options,
  });
}

module.exports = {
  getTransporter,
  sendMail,
  isSmtpConfigured,
  getSmtpPass,
  verifySmtp,
};
