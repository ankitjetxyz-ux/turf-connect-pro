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

function getTransporter() {
  if (transporter) return transporter;

  const user = clean(process.env.SMTP_USER);
  const pass = getSmtpPass();
  if (!user || !pass) return null;

  const port = Number(process.env.SMTP_PORT || 587);

  transporter = nodemailer.createTransport({
    host: clean(process.env.SMTP_HOST) || "smtp.gmail.com",
    port,
    secure: port === 465,
    pool: true,
    maxConnections: 2,
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 25_000,
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
  });

  transporter.verify().then(
    () => console.log("✅ SMTP ready:", user),
    (err) => console.error("❌ SMTP verify failed:", err.message),
  );

  return transporter;
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
};
