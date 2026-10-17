
const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {

    profileImage: {
      type: String,
      trim: true,
      maxlength: [2048, "Profile image URL is too long"],
      default: "",
    },
    // Personal information
    name: {
      type: String,
      required: [true, "Student name is required"],
      trim: true,
      minlength: [2, "Name must contain at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      maxlength: [254, "Email cannot exceed 254 characters"],
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please enter a valid email address",
      ],
    },

    age: {
      type: Number,
      required: [true, "Age is required"],
      min: [1, "Age must be at least 1"],
      max: [120, "Age cannot exceed 120"],
      validate: {
        validator: Number.isInteger,
        message: "Age must be a whole number",
      },
    },

    dateOfBirth: {
      type: Date,
      validate: {
        validator(value) {
          return !value || value <= new Date();
        },
        message: "Date of birth cannot be in the future",
      },
    },

    gender: {
      type: String,
      enum: ["Male", "Female", "Other", "Prefer not to say"],
      default: "Prefer not to say",
    },

    profileImage: {
      type: String,
      trim: true,
      maxlength: [2048, "Profile image URL is too long"],
    },

    phone: {
      type: String,
      trim: true,
      match: [
        /^\+?[0-9\s()-]{7,20}$/,
        "Please enter a valid phone number",
      ],
    },

    alternatePhone: {
      type: String,
      trim: true,
      match: [
        /^\+?[0-9\s()-]{7,20}$/,
        "Please enter a valid alternate phone number",
      ],
    },

    // Address
    address: {
      street: {
        type: String,
        trim: true,
        maxlength: [150, "Street cannot exceed 150 characters"],
      },
      city: {
        type: String,
        trim: true,
        maxlength: [80, "City cannot exceed 80 characters"],
      },
      state: {
        type: String,
        trim: true,
        maxlength: [80, "State cannot exceed 80 characters"],
      },
      postalCode: {
        type: String,
        trim: true,
        maxlength: [15, "Postal code cannot exceed 15 characters"],
      },
      country: {
        type: String,
        trim: true,
        maxlength: [80, "Country cannot exceed 80 characters"],
        default: "India",
      },
    },

    // Academic information
    studentId: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: [30, "Student ID cannot exceed 30 characters"],
      unique: true,
      sparse: true,
    },

    course: {
      type: String,
      required: [true, "Course is required"],
      trim: true,
      maxlength: [100, "Course cannot exceed 100 characters"],
    },

    department: {
      type: String,
      trim: true,
      maxlength: [100, "Department cannot exceed 100 characters"],
    },

    yearOfStudy: {
      type: Number,
      min: [1, "Year of study must be at least 1"],
      max: [10, "Year of study cannot exceed 10"],
      validate: {
        validator(value) {
          return value == null || Number.isInteger(value);
        },
        message: "Year of study must be a whole number",
      },
    },

    semester: {
      type: Number,
      min: [1, "Semester must be at least 1"],
      max: [20, "Semester cannot exceed 20"],
      validate: {
        validator(value) {
          return value == null || Number.isInteger(value);
        },
        message: "Semester must be a whole number",
      },
    },

    admissionDate: {
      type: Date,
      default: Date.now,
      validate: {
        validator(value) {
          return !value || value <= new Date();
        },
        message: "Admission date cannot be in the future",
      },
    },

    academicStatus: {
      type: String,
      enum: ["Active", "Graduated", "On Leave", "Withdrawn"],
      default: "Active",
    },

    // Guardian information
    guardian: {
      name: {
        type: String,
        trim: true,
        maxlength: [100, "Guardian name cannot exceed 100 characters"],
      },
      relationship: {
        type: String,
        trim: true,
        maxlength: [50, "Relationship cannot exceed 50 characters"],
      },
      phone: {
        type: String,
        trim: true,
        match: [
          /^\+?[0-9\s()-]{7,20}$/,
          "Please enter a valid guardian phone number",
        ],
      },
      email: {
        type: String,
        trim: true,
        lowercase: true,
        maxlength: [254, "Guardian email cannot exceed 254 characters"],
        match: [
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
          "Please enter a valid guardian email",
        ],
      },
    },

    // Optional additional information
    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", ""],
      default: "",
    },

    notes: {
      type: String,
      trim: true,
      maxlength: [1000, "Notes cannot exceed 1000 characters"],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Useful for searching student records by name or email.
studentSchema.index({ name: 1 });
studentSchema.index({ email: 1 });

// Virtual field: calculate age from date of birth when available.
studentSchema.virtual("calculatedAge").get(function () {
  if (!this.dateOfBirth) return this.age;

  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let calculatedAge = today.getFullYear() - birthDate.getFullYear();

  const birthdayNotReached =
    today.getMonth() < birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() &&
      today.getDate() < birthDate.getDate());

  if (birthdayNotReached) calculatedAge--;

  return calculatedAge;
});

module.exports = mongoose.model("Student", studentSchema);
