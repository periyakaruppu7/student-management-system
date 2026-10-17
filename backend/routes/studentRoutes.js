
const express = require("express");
const mongoose = require("mongoose");
const Student = require("../models/Student");

const router = express.Router();

const allowedFields = [
  "name",
  "email",
  "age",
  "dateOfBirth",
  "gender",
  "profileImage",
  "phone",
  "alternatePhone",
  "address",
  "studentId",
  "course",
  "department",
  "yearOfStudy",
  "semester",
  "admissionDate",
  "academicStatus",
  "guardian",
  "bloodGroup",
  "notes",
];

function pickStudentFields(body) {
  const result = {};

  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      result[field] = body[field];
    }
  }

  return result;
}

function isValidId(id) {
  return mongoose.isValidObjectId(id);
}

function handleError(error, res, next) {
  if (error.code === 11000) {
    return res.status(409).json({
      message: "A student with this email or student ID already exists.",
      field: Object.keys(error.keyPattern || {})[0],
    });
  }

  if (error.name === "ValidationError" || error.name === "CastError") {
    return res.status(400).json({
      message: "Please check the submitted student details.",
      errors:
        error.name === "ValidationError"
          ? Object.values(error.errors).map((item) => ({
              field: item.path,
              message: item.message,
            }))
          : [{ field: error.path, message: error.message }],
    });
  }

  next(error);
}

// GET /api/students
// Supports search, course, status, sorting and pagination.
router.get("/", async (req, res, next) => {
  try {
    const {
      search = "",
      course,
      status,
      page = "1",
      limit = "10",
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    const pageNumber = Number(page);
    const pageSize = Number(limit);

    if (
      !Number.isInteger(pageNumber) ||
      pageNumber < 1 ||
      !Number.isInteger(pageSize) ||
      pageSize < 1 ||
      pageSize > 100
    ) {
      return res.status(400).json({
        message: "Page must be positive and limit must be between 1 and 100.",
      });
    }

    const allowedSortFields = [
      "name",
      "email",
      "age",
      "course",
      "createdAt",
      "updatedAt",
    ];

    if (!allowedSortFields.includes(sortBy)) {
      return res.status(400).json({
        message: "Invalid sort field.",
      });
    }

    if (!["asc", "desc"].includes(order)) {
      return res.status(400).json({
        message: "Order must be asc or desc.",
      });
    }

    const filter = {};

    if (search.trim()) {
      const escapedSearch = search.trim().replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );
      const searchRegex = new RegExp(escapedSearch, "i");

      filter.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { course: searchRegex },
        { studentId: searchRegex },
        { department: searchRegex },
      ];
    }

    if (course) {
      filter.course = course;
    }

    if (status) {
      filter.academicStatus = status;
    }

    const [students, total] = await Promise.all([
      Student.find(filter)
        .sort({ [sortBy]: order === "asc" ? 1 : -1 })
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      Student.countDocuments(filter),
    ]);

    res.json({
      students,
      pagination: {
        total,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/students/stats
router.get("/stats", async (req, res, next) => {
  try {
    const [totalStudents, activeStudents, courseGroups, ageStats] = await Promise.all([
      Student.countDocuments(),
      Student.countDocuments({ academicStatus: "Active" }),
      Student.aggregate([
        {
          $group: {
            _id: "$course",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]),
      Student.aggregate([
        {
          $group: {
            _id: null,
            averageAge: { $avg: "$age" },
          },
        },
      ]),
    ]);

    res.json({
      totalStudents,
      activeStudents,
      totalCourses: courseGroups.length,
      averageAge: ageStats[0]?.averageAge ?? null,
      courses: courseGroups.map((item) => ({
        course: item._id,
        count: item.count,
      })),
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/students/:id
router.get("/:id", async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: "Invalid student ID." });
    }

    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }

    res.json(student);
  } catch (error) {
    next(error);
  }
});

// POST /api/students
router.post("/", async (req, res, next) => {
  try {
    const fields = pickStudentFields(req.body);

    if (!fields.name || !fields.email || fields.age == null || !fields.course) {
      return res.status(400).json({
        message: "Name, email, age, and course are required.",
      });
    }

    // Avoid duplicate email addresses, ignoring case.
    const existingEmail = await Student.findOne({
      email: String(fields.email).trim().toLowerCase(),
    }).select("_id");

    if (existingEmail) {
      return res.status(409).json({
        message: "A student with this email already exists.",
        field: "email",
      });
    }

    const student = await Student.create(fields);

    res.status(201).json(student);
  } catch (error) {
    handleError(error, res, next);
  }
});

// PUT /api/students/:id
// Updates only supplied, permitted fields.
router.put("/:id", async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: "Invalid student ID." });
    }

    const fields = pickStudentFields(req.body);

    if (Object.keys(fields).length === 0) {
      return res.status(400).json({
        message: "Provide at least one supported field to update.",
      });
    }

    if (fields.name !== undefined && !String(fields.name).trim()) {
      return res.status(400).json({ message: "Name cannot be empty." });
    }

    if (fields.email !== undefined) {
      fields.email = String(fields.email).trim().toLowerCase();

      const existingEmail = await Student.findOne({
        email: fields.email,
        _id: { $ne: req.params.id },
      }).select("_id");

      if (existingEmail) {
        return res.status(409).json({
          message: "Another student already uses this email.",
          field: "email",
        });
      }
    }

    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { $set: fields },
      {
        new: true,
        runValidators: true,
        context: "query",
      }
    );

    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }

    res.json(student);
  } catch (error) {
    handleError(error, res, next);
  }
});

// DELETE /api/students/:id
router.delete("/:id", async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: "Invalid student ID." });
    }

    const student = await Student.findByIdAndDelete(req.params.id);

    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }

    res.json({
      message: "Student deleted successfully.",
      deletedStudent: {
        id: student._id,
        name: student.name,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
