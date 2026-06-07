const nodemailer = require("nodemailer");

let smtpTransporter = null;

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

function getSmtpPass() {
  return clean(process.env.SMTP_PASS).replace(/\s+/g, "");
}

function isResendConfigured() {
  return Boolean(clean(process.env.RESEND_API_KEY));
}

function isSmtpConfigured() {
  return Boolean(clean(process.env.SMTP_USER) && getSmtpPass());
}

function isEmailConfigured() {
  return isResendConfigured() || isSmtpConfigured();
}

function getEmailProvider() {
  if (isResendConfigured()) return "resend";
  if (isSmtpConfigured()) return "smtp";
  return null;
}

function getFromAddress() {
  const from = clean(process.env.EMAIL_FROM);
  if (from) return from;

  if (isResendConfigured()) {
    return "TurfBook <onboarding@resend.dev>";
  }

  const user = clean(process.env.SMTP_USER);
  return user ? `"TurfBook" <${user}>` : "TurfBook <noreply@bookmyturf.xyz>";
}

function buildSmtpTransportOptions() {
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

function getSmtpTransporter() {
  if (smtpTransporter) return smtpTransporter;

  const user = clean(process.env.SMTP_USER);
  const pass = getSmtpPass();
  if (!user || !pass) return null;

  smtpTransporter = nodemailer.createTransport(buildSmtpTransportOptions());

  if (!isResendConfigured()) {
    smtpTransporter.verify().then(
      () => console.log("✅ SMTP ready:", user),
      (err) => console.error("❌ SMTP verify failed:", err.message),
    );
  }

  return smtpTransporter;
}

async function sendViaResend({ to, subject, html, text, replyTo }) {
  const apiKey = clean(process.env.RESEND_API_KEY);
  const payload = {
    from: getFromAddress(),
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
    text,
  };

  if (replyTo) {
    payload.reply_to = replyTo;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      body?.message || body?.error || `Resend API error (${response.status})`;
    throw new Error(message);
  }

  return { messageId: body.id, provider: "resend" };
}

async function sendViaSmtp({ to, subject, html, text, replyTo }) {
  const t = getSmtpTransporter();
  if (!t) {
    throw new Error("SMTP is not configured on the server");
  }

  const info = await t.sendMail({
    from: getFromAddress(),
    to,
    subject,
    html,
    text,
    replyTo,
  });

  return { messageId: info.messageId, provider: "smtp" };
}

async function sendMail(options) {
  if (isResendConfigured()) {
    return sendViaResend(options);
  }

  if (isSmtpConfigured()) {
    return sendViaSmtp(options);
  }

  throw new Error("Email is not configured (set RESEND_API_KEY or SMTP credentials)");
}

async function verifyResend() {
  const apiKey = clean(process.env.RESEND_API_KEY);
  const response = await fetch("https://api.resend.com/domains", {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(body?.message || body?.error || `Resend API error (${response.status})`);
  }

  return {
    configured: true,
    ready: true,
    provider: "resend",
    from: getFromAddress(),
    domains: Array.isArray(body?.data) ? body.data.length : 0,
  };
}

async function verifySmtp() {
  if (!isSmtpConfigured()) {
    return {
      configured: false,
      ready: false,
      provider: "smtp",
      error: "SMTP_USER or SMTP_PASS is not set",
    };
  }

  try {
    const t = getSmtpTransporter();
    await t.verify();
    return {
      configured: true,
      ready: true,
      provider: "smtp",
      user: clean(process.env.SMTP_USER),
    };
  } catch (err) {
    const isTimeout = /timeout|ETIMEDOUT/i.test(err.message);
    return {
      configured: true,
      ready: false,
      provider: "smtp",
      user: clean(process.env.SMTP_USER),
      error: err.message,
      hint: isTimeout
        ? "Render free tier blocks SMTP ports 465/587. Use RESEND_API_KEY instead, or upgrade Render to a paid plan."
        : "Use a Gmail App Password (16 chars, no spaces) with 2-Step Verification enabled.",
    };
  }
}

async function verifyEmailService() {
  if (isResendConfigured()) {
    try {
      return await verifyResend();
    } catch (err) {
      return {
        configured: true,
        ready: false,
        provider: "resend",
        from: getFromAddress(),
        error: err.message,
        hint: "Check RESEND_API_KEY at https://resend.com/api-keys",
      };
    }
  }

  if (isSmtpConfigured()) {
    return verifySmtp();
  }

  return {
    configured: false,
    ready: false,
    provider: null,
    error: "No email provider configured",
    hint: "Set RESEND_API_KEY on Render (recommended for free tier). SMTP is blocked on Render free plans.",
  };
}

module.exports = {
  sendMail,
  isEmailConfigured,
  isResendConfigured,
  isSmtpConfigured,
  getEmailProvider,
  getFromAddress,
  verifyEmailService,
  verifySmtp,
  getSmtpTransporter,
};
