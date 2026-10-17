require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const studentRoutes = require("./routes/studentRoutes");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const studentPortalRoutes = require("./routes/studentPortalRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});

// Middleware
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json({ limit: "100kb" }));

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/student-portal", studentPortalRoutes);

// Health-check endpoint
app.get("/", (req, res) => {
  res.json({ message: "Student Management API is running" });
});

// Student routes
app.use("/api/students", studentRoutes);

// Handle unknown routes
app.use((req, res) => {
  res.status(404).json({ message: "API endpoint not found" });
});

// Central error handler
app.use((error, req, res, next) => {
  console.error(error);

  if (error.name === "ValidationError" || error.name === "CastError") {
    return res.status(400).json({ message: error.message });
  }

  res.status(500).json({
    message: "Internal server error",
  });
});

// Start only after MongoDB connects
async function startServer() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI ||
        process.env.MONGO_URI ||
        "mongodb://127.0.0.1:27017/student_management"
    );

    console.log("MongoDB connected successfully");

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error.message);
    process.exit(1);
  }
}

startServer();