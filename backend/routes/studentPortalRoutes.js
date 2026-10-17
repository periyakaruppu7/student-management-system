const express = require("express");
const mongoose = require("mongoose");

const Student = require("../models/Student");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");
const Material = require("../models/Material");
const Announcement = require("../models/Announcement");

const {
  requireAuth,
  requireRole,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.use(requireAuth, requireRole("student"));

async function getStudent(req) {
  if (!req.user.studentId) return null;

  return Student.findById(req.user.studentId).lean();
}

async function getCourseIds(studentId) {
  const enrollments = await Enrollment.find({ studentId })
    .select("courseId")
    .lean();

  return enrollments.map((item) => item.courseId);
}

async function getAnnouncements(courseIds) {
  return Announcement.find({
    published: true,
    $or: [
      { courseId: null },
      { courseId: { $in: courseIds } },
    ],
  })
    .populate("courseId", "title")
    .sort({ createdAt: -1 })
    .lean();
}

// Student dashboard
router.get("/dashboard", async (req, res, next) => {
  try {
    const student = await getStudent(req);

    if (!student) {
      return res.status(404).json({
        message: "Linked student record not found.",
      });
    }

    const courseIds = await getCourseIds(student._id);

    const [courses, materials, announcements] =
      await Promise.all([
        Course.find({
          _id: { $in: courseIds },
          active: true,
        }).sort({ title: 1 }).lean(),

        Material.find({
          courseId: { $in: courseIds },
        })
          .populate("courseId", "title")
          .sort({ createdAt: -1 })
          .limit(5)
          .lean(),

        getAnnouncements(courseIds),
      ]);

    res.json({
      student,
      courseCount: courses.length,
      courses,
      recentMaterials: materials,
      announcements: announcements.slice(0, 5),
    });
  } catch (error) {
    next(error);
  }
});

// Active courses available to students for self-enrollment.
router.get("/courses/catalog", async (req, res, next) => {
  try {
    const courses = await Course.find({ active: true })
      .sort({ title: 1 })
      .lean();

    res.json(courses);
  } catch (error) {
    next(error);
  }
});

// Enroll the authenticated student in an active course.
router.post("/courses/:courseId/enroll", async (req, res, next) => {
  try {
    const { courseId } = req.params;

    if (!mongoose.isValidObjectId(courseId)) {
      return res.status(400).json({ message: "Invalid course ID." });
    }

    if (!req.user.studentId) {
      return res.status(404).json({
        message: "Linked student record not found.",
      });
    }

    const [course, student] = await Promise.all([
      Course.findOne({ _id: courseId, active: true }).select("_id"),
      Student.findById(req.user.studentId).select("_id"),
    ]);

    if (!course) {
      return res.status(404).json({ message: "Active course not found." });
    }

    if (!student) {
      return res.status(404).json({
        message: "Linked student record not found.",
      });
    }

    const existing = await Enrollment.findOne({
      courseId,
      studentId: student._id,
    }).select("_id");

    if (existing) {
      return res.status(409).json({
        message: "You are already enrolled in this course.",
      });
    }

    const enrollment = await Enrollment.create({
      courseId,
      studentId: student._id,
      enrolledBy: req.user.id,
    });

    res.status(201).json({
      message: "You have successfully enrolled in the course.",
      enrollment,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "You are already enrolled in this course.",
      });
    }

    next(error);
  }
});

// Enrolled courses
router.get("/courses", async (req, res, next) => {
  try {
    const student = await getStudent(req);

    if (!student) {
      return res.status(404).json({
        message: "Linked student record not found.",
      });
    }

    const courseIds = await getCourseIds(student._id);

    const courses = await Course.find({
      _id: { $in: courseIds },
      active: true,
    })
      .sort({ title: 1 })
      .lean();

    res.json(courses);
  } catch (error) {
    next(error);
  }
});

// Materials from enrolled courses only
router.get("/materials", async (req, res, next) => {
  try {
    const student = await getStudent(req);

    if (!student) {
      return res.status(404).json({
        message: "Linked student record not found.",
      });
    }

    const courseIds = await getCourseIds(student._id);

    const materials = await Material.find({
      courseId: { $in: courseIds },
    })
      .populate("courseId", "title")
      .sort({ createdAt: -1 })
      .lean();

    res.json(materials);
  } catch (error) {
    next(error);
  }
});

// General and enrolled-course announcements
router.get("/announcements", async (req, res, next) => {
  try {
    const student = await getStudent(req);

    if (!student) {
      return res.status(404).json({
        message: "Linked student record not found.",
      });
    }

    const courseIds = await getCourseIds(student._id);

    res.json(await getAnnouncements(courseIds));
  } catch (error) {
    next(error);
  }
});

module.exports = router;