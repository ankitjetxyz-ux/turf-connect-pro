function validateLoginPassword(password) {
  if (!password || password.length < 8) {
    return "Password must be at least 8 characters long";
  }
  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
    return "Password must contain uppercase, lowercase, and numbers";
  }
  return null;
}

module.exports = { validateLoginPassword };
