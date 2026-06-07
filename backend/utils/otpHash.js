const crypto = require("crypto");
const bcrypt = require("bcrypt");

function getPepper() {
  return process.env.JWT_SECRET || process.env.OTP_PEPPER || "turfbook-otp-pepper";
}

/** Fast OTP hash — bcrypt was slowing every send/verify by ~200ms+. */
function hashOTP(otp) {
  return crypto.createHmac("sha256", getPepper()).update(String(otp)).digest("hex");
}

async function verifyOTPValue(otp, storedHash) {
  if (!storedHash || !otp) return false;

  // New SHA-256 HMAC hashes (64 hex chars)
  if (/^[a-f0-9]{64}$/i.test(storedHash)) {
    const expected = hashOTP(otp);
    try {
      return crypto.timingSafeEqual(
        Buffer.from(expected, "hex"),
        Buffer.from(storedHash, "hex"),
      );
    } catch {
      return false;
    }
  }

  // Legacy bcrypt hashes still in the database
  try {
    return await bcrypt.compare(String(otp), storedHash);
  } catch {
    return false;
  }
}

module.exports = { hashOTP, verifyOTPValue };
