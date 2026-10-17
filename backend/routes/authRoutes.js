const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const { requireAuth } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/login", async (req, res, next) => {
  try {
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();

    const password = String(req.body.password || "");

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required.",
      });
    }

    const user = await User.findOne({ email })
      .select("+passwordHash");

    if (!user || !user.active) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const valid = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!valid) {
      return res.status(401).json({
        message: "Invalid email or password.",
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

    const token = jwt.sign(
      { role: user.role },
      process.env.JWT_SECRET,
      {
        subject: user._id.toString(),
        expiresIn: process.env.JWT_EXPIRES_IN || "1d",
        algorithm: "HS256",
      }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        mustChangePassword: user.mustChangePassword,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;