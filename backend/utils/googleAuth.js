const { OAuth2Client } = require("google-auth-library");

function getGoogleClientId() {
  return (process.env.GOOGLE_CLIENT_ID || "").trim();
}

function isGoogleAuthConfigured() {
  return Boolean(getGoogleClientId());
}

async function verifyGoogleIdToken(idToken) {
  const clientId = getGoogleClientId();
  if (!clientId) {
    throw new Error("GOOGLE_CLIENT_ID is not configured on the server");
  }

  const client = new OAuth2Client(clientId);
  const ticket = await client.verifyIdToken({
    idToken,
    audience: clientId,
  });

  const payload = ticket.getPayload();
  if (!payload?.email) {
    throw new Error("Google account did not return an email address");
  }

  if (payload.email_verified === false) {
    throw new Error("Google email is not verified");
  }

  return {
    googleId: payload.sub,
    email: payload.email.toLowerCase(),
    name: payload.name || payload.email.split("@")[0],
    picture: payload.picture || null,
  };
}

module.exports = {
  verifyGoogleIdToken,
  isGoogleAuthConfigured,
  getGoogleClientId,
};
