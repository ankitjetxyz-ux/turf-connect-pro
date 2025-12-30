const jwt = require("jsonwebtoken");

exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(403).json({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
};
exports.optionalVerifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return next();
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
  } catch (err) {
    // If token invalid, just ignore it and proceed as guest
  }
  next();
};

exports.allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Access denied" });
    }
    next();
  };
};
