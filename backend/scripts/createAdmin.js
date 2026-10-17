const path = require("path");

app.use(express.static(path.join(__dirname, "../frontend/dist")));

app.get(/.*/, (req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return next();
  }

  res.sendFile(
    path.join(__dirname, "../frontend/dist/index.html")
  );
});

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

async function main() {
  const uri =
    process.env.MONGODB_URI ||
    process.env.MONGO_URI ||
    "mongodb://127.0.0.1:27017/student_management";

  const email = String(
    process.env.ADMIN_EMAIL || ""
  ).trim().toLowerCase();

  const password = String(
    process.env.ADMIN_PASSWORD || ""
  );

  const name = String(
    process.env.ADMIN_NAME || "System Admin"
  ).trim();

  if (!email || password.length < 12) {
    throw new Error(
      "Set ADMIN_EMAIL and ADMIN_PASSWORD (at least 12 characters) in .env."
    );
  }

  if (
    !process.env.JWT_SECRET ||
    process.env.JWT_SECRET.length < 32
  ) {
    throw new Error(
      "Set JWT_SECRET to a random secret of at least 32 characters."
    );
  }

  await mongoose.connect(uri);

  const existing = await User.findOne({ email });

  if (existing) {
    console.log("Admin account already exists. No changes made.");
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await User.create({
    name,
    email,
    passwordHash,
    role: "admin",
    studentId: null,
    mustChangePassword: false,
  });

  console.log(`Admin account created for ${email}.`);
}

main()
  .catch((error) => {
    console.error("Admin setup failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState) {
      await mongoose.disconnect();
    }
  });