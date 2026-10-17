const express = require("express");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const Student = require("../models/Student");
const User = require("../models/User");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");
const Material = require("../models/Material");
const Announcement = require("../models/Announcement");

const {
  requireAuth,
  requireRole,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.use(requireAuth, requireRole("admin"));

const validId = (id) => mongoose.Types.ObjectId.isValid(id);

function validHttpUrl(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
}

// Get existing students and account status
router.get("/students", async (req, res, next) => {
  try {
    const students = await Student.find()
      .sort({ name: 1 })
      .lean();

    const users = await User.find({ role: "student" })
      .select("studentId email active")
      .lean();

    const accounts = new Map(
      users.map((u) => [String(u.studentId), u])
    );

    res.json(
      students.map((student) => {
        const account = accounts.get(String(student._id));

        return {
          ...student,
          account: account
            ? {
                email: account.email,
                active: account.active,
              }
            : null,
        };
      })
    );
  } catch (error) {
    next(error);
  }
});

// Create a login account for an existing student
router.post(
  "/students/:studentId/account",
  async (req, res, next) => {
    try {
      const { studentId } = req.params;
      const password = String(req.body.password || "");

      if (!validId(studentId)) {
        return res.status(400).json({
          message: "Invalid student ID.",
        });
      }

      if (password.length < 10) {
        return res.status(400).json({
          message: "Temporary password must be at least 10 characters.",
        });
      }

      const student = await Student.findById(studentId);

      if (!student) {
        return res.status(404).json({
          message: "Student record not found.",
        });
      }

      const email = String(student.email || "")
        .trim()
        .toLowerCase();

      if (!email) {
        return res.status(400).json({
          message: "Add an email to the student record first.",
        });
      }

      const existing = await User.findOne({ email });

      if (existing) {
        return res.status(409).json({
          message: "An account already exists for this email.",
        });
      }

      const passwordHash = await bcrypt.hash(password, 12);

      const user = await User.create({
        name: student.name,
        email,
        passwordHash,
        role: "student",
        studentId: student._id,
        mustChangePassword: true,
      });

      res.status(201).json({
        message: "Student account created.",
        account: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({
          message: "An account already exists for this email.",
        });
      }

      next(error);
    }
  }
);

// List courses
router.get("/courses", async (req, res, next) => {
  try {
    const courses = await Course.find()
      .sort({ createdAt: -1 })
      .lean();

    const counts = await Enrollment.aggregate([
      {
        $group: {
          _id: "$courseId",
          count: { $sum: 1 },
        },
      },
    ]);

    const countMap = new Map(
      counts.map((item) => [
        String(item._id),
        item.count,
      ])
    );

    res.json(
      courses.map((course) => ({
        ...course,
        enrollmentCount:
          countMap.get(String(course._id)) || 0,
      }))
    );
  } catch (error) {
    next(error);
  }
});

// Create a course
router.post("/courses", async (req, res, next) => {
  try {
    const title = String(req.body.title || "").trim();
    const description = String(
      req.body.description || ""
    ).trim();
    const instructor = String(
      req.body.instructor || ""
    ).trim();

    if (!title) {
      return res.status(400).json({
        message: "Course title is required.",
      });
    }

    const course = await Course.create({
      title,
      description,
      instructor,
      createdBy: req.user.id,
    });

    res.status(201).json(course);
  } catch (error) {
    next(error);
  }
});

// Enroll a student
router.post(
  "/courses/:courseId/enroll",
  async (req, res, next) => {
    try {
      const { courseId } = req.params;
      const { studentId } = req.body;

      if (!validId(courseId) || !validId(studentId)) {
        return res.status(400).json({
          message: "Valid course and student IDs are required.",
        });
      }

      const [course, student, account] = await Promise.all([
        Course.findOne({ _id: courseId, active: true }),
        Student.findById(studentId),
        User.findOne({ studentId, role: "student", active: true }),
      ]);

      if (!course) {
        return res.status(404).json({
          message: "Active course not found.",
        });
      }

      if (!student) {
        return res.status(404).json({
          message: "Student record not found.",
        });
      }

      if (!account) {
        return res.status(400).json({
          message: "Create an active student login account first.",
        });
      }

      const enrollment = await Enrollment.findOneAndUpdate(
        { courseId, studentId },
        {
          $setOnInsert: {
            courseId,
            studentId,
            enrolledBy: req.user.id,
          },
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }
      );

      res.json({
        message: "Student enrolled successfully.",
        enrollment,
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({
          message: "Student is already enrolled.",
        });
      }

      next(error);
    }
  }
);

// List all study materials for admin
router.get("/materials", async (req, res, next) => {
  try {
    const materials = await Material.find()
      .populate("courseId", "title")
      .sort({ createdAt: -1 })
      .lean();

    res.json(materials);
  } catch (error) {
    next(error);
  }
});

// Add PDF, video or resource URL
router.post("/materials", async (req, res, next) => {
  try {
    const {
      courseId,
      title,
      type,
      url,
      description = "",
    } = req.body;

    if (!validId(courseId)) {
      return res.status(400).json({
        message: "Select a valid course.",
      });
    }

    if (!String(title || "").trim()) {
      return res.status(400).json({
        message: "Material title is required.",
      });
    }

    if (!["PDF", "Video", "Resource link"].includes(type)) {
      return res.status(400).json({
        message: "Invalid material type.",
      });
    }

    if (!validHttpUrl(String(url || ""))) {
      return res.status(400).json({
        message: "Enter a valid HTTP or HTTPS URL.",
      });
    }

    if (!(await Course.findById(courseId))) {
      return res.status(404).json({
        message: "Course not found.",
      });
    }

    const material = await Material.create({
      courseId,
      title: String(title).trim(),
      type,
      url: String(url).trim(),
      description: String(description).trim(),
      createdBy: req.user.id,
    });

    res.status(201).json(material);
  } catch (error) {
    next(error);
  }
});

// Delete material
router.delete(
  "/materials/:materialId",
  async (req, res, next) => {
    try {
      if (!validId(req.params.materialId)) {
        return res.status(400).json({
          message: "Invalid material ID.",
        });
      }

      const material = await Material.findByIdAndDelete(
        req.params.materialId
      );

      if (!material) {
        return res.status(404).json({
          message: "Material not found.",
        });
      }

      res.json({ message: "Material deleted." });
    } catch (error) {
      next(error);
    }
  }
);

// List announcements
router.get("/announcements", async (req, res, next) => {
  try {
    const items = await Announcement.find()
      .populate("courseId", "title")
      .sort({ createdAt: -1 })
      .lean();

    res.json(items);
  } catch (error) {
    next(error);
  }
});

// Publish general or course-specific announcement
router.post("/announcements", async (req, res, next) => {
  try {
    const title = String(req.body.title || "").trim();
    const body = String(req.body.body || "").trim();
    const courseId = req.body.courseId || null;

    if (!title || !body) {
      return res.status(400).json({
        message: "Title and announcement details are required.",
      });
    }

    if (courseId && !validId(courseId)) {
      return res.status(400).json({
        message: "Invalid course ID.",
      });
    }

    if (
      courseId &&
      !(await Course.findById(courseId))
    ) {
      return res.status(404).json({
        message: "Course not found.",
      });
    }

    const announcement = await Announcement.create({
      title,
      body,
      courseId,
      published: true,
      createdBy: req.user.id,
    });

    res.status(201).json(announcement);
  } catch (error) {
    next(error);
  }
});

// Delete announcement
router.delete(
  "/announcements/:announcementId",
  async (req, res, next) => {
    try {
      if (!validId(req.params.announcementId)) {
        return res.status(400).json({
          message: "Invalid announcement ID.",
        });
      }

      const item = await Announcement.findByIdAndDelete(
        req.params.announcementId
      );

      if (!item) {
        return res.status(404).json({
          message: "Announcement not found.",
        });
      }

      res.json({ message: "Announcement deleted." });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;