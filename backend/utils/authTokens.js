const jwt = require("jsonwebtoken");
const supabase = require("../config/db");

async function issueSessionTokens(user, req) {
  const token = jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" },
  );

  const refreshToken = jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "30d" },
  );

  await supabase.from("user_sessions").insert({
    user_id: user.id,
    refresh_token: refreshToken,
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    user_agent: req.headers["user-agent"],
    ip_address: req.ip,
  });

  const { password: _password, ...userWithoutSensitiveData } = user;

  return {
    token,
    refreshToken,
    user: userWithoutSensitiveData,
    expiresIn: 7 * 24 * 60 * 60,
  };
}

module.exports = { issueSessionTokens };
