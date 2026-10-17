const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    if (
      !process.env.JWT_SECRET ||
      process.env.JWT_SECRET.length < 32
    ) {
      return res.status(500).json({
        message: "Authentication is not configured securely.",
      });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });

    const user = await User.findById(payload.sub);

    if (
      !user ||
      !user.active ||
      user.role !== payload.role
    ) {
      return res.status(401).json({
        message: "Account unavailable. Please sign in again.",
      });
    }

    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      studentId: user.studentId
        ? user.studentId.toString()
        : null,
      mustChangePassword: user.mustChangePassword,
    };

    next();
  } catch (error) {
    if (
      error.name === "TokenExpiredError" ||
      error.name === "JsonWebTokenError"
    ) {
      return res.status(401).json({
        message: "Invalid or expired session.",
      });
    }

    next(error);
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "You do not have permission.",
      });
    }

    next();
  };
}

module.exports = {
  requireAuth,
  requireRole,
};