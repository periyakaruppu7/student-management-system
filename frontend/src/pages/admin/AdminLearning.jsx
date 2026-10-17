
import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  UserPlus,
  BookOpen,
  UserCheck,
  FileText,
  Megaphone,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ExternalLink,
  GraduationCap,
  Users,
  Layers,
  Search,
  Plus,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

import {
  createStudentAccount,
  getAdminStudents,
  getAdminCourses,
  createCourse,
  enrollStudent,
  getAdminMaterials,
  createMaterial,
  deleteMaterial,
  getAdminAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
} from "../../api/studentPortal";

import "../../styles/student-portal.css";
import "../../styles/student-portal-admin.enhanced.css";

const emptyCourse = {
  title: "",
  description: "",
  instructor: "",
};

const emptyMaterial = {
  courseId: "",
  title: "",
  type: "PDF",
  url: "",
  description: "",
};

const emptyAnnouncement = {
  title: "",
  body: "",
  courseId: "",
};

function SubmitButton({ children, disabled }) {
  return (
    <button
      type="submit"
      className="admin-submit"
      disabled={disabled}
    >
      {disabled ? (
        <Loader2 size={17} className="admin-spin" />
      ) : (
        <Plus size={17} />
      )}
      {disabled ? "Processing..." : children}
    </button>
  );
}

function StatCard({ icon: Icon, label, value, description, color }) {
  return (
    <article className={`admin-stat-card ${color}`}>
      <div className="admin-stat-icon">
        <Icon size={23} />
      </div>

      <div className="admin-stat-content">
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{description}</small>
      </div>
    </article>
  );
}

function SectionTitle({ icon: Icon, title, description, color = "blue" }) {
  return (
    <div className="admin-section-heading">
      <span className={`admin-section-icon ${color}`}>
        <Icon size={21} />
      </span>

      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function AdminLearning() {
  const location = useLocation();

  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  const [courseForm, setCourseForm] = useState(emptyCourse);
  const [materialForm, setMaterialForm] = useState(emptyMaterial);
  const [announcementForm, setAnnouncementForm] =
    useState(emptyAnnouncement);

  const [accountStudentId, setAccountStudentId] = useState("");
  const [accountPassword, setAccountPassword] = useState("");

  const [enrollForm, setEnrollForm] = useState({
    courseId: "",
    studentId: "",
  });

  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [materialSearch, setMaterialSearch] = useState("");

  const refresh = useCallback(async () => {
    const [studentData, courseData, materialData, announcementData] =
      await Promise.all([
        getAdminStudents(),
        getAdminCourses(),
        getAdminMaterials(),
        getAdminAnnouncements(),
      ]);

    setStudents(Array.isArray(studentData) ? studentData : []);
    setCourses(Array.isArray(courseData) ? courseData : []);
    setMaterials(Array.isArray(materialData) ? materialData : []);
    setAnnouncements(
      Array.isArray(announcementData) ? announcementData : []
    );
  }, []);

  useEffect(() => {
    let active = true;

    async function initialize() {
      try {
        await refresh();
      } catch (err) {
        if (active) {
          setError(
            err?.response?.data?.message ||
              "Could not load administrator data."
          );
        }
      } finally {
        if (active) setIsInitializing(false);
      }
    }

    initialize();

    return () => {
      active = false;
    };
  }, [refresh]);

  useEffect(() => {
    if (!location.hash) return;

    const frame = requestAnimationFrame(() => {
      document
        .getElementById(location.hash.slice(1))
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    return () => cancelAnimationFrame(frame);
  }, [location.hash]);

  async function runAction(action, successMessage) {
    setError("");
    setNotice("");
    setBusy(true);

    try {
      await action();
      await refresh();
      setNotice(successMessage);
      return true;
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "The operation failed. Please try again."
      );
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateAccount(event) {
    event.preventDefault();

    const success = await runAction(
      () => createStudentAccount(accountStudentId, accountPassword),
      "Student account created successfully."
    );

    if (success) {
      setAccountStudentId("");
      setAccountPassword("");
    }
  }

  async function handleCreateCourse(event) {
    event.preventDefault();

    const success = await runAction(
      () => createCourse(courseForm),
      "Course created successfully."
    );

    if (success) setCourseForm(emptyCourse);
  }

  async function handleEnroll(event) {
    event.preventDefault();

    const success = await runAction(
      () => enrollStudent(enrollForm.courseId, enrollForm.studentId),
      "Student enrolled successfully."
    );

    if (success) {
      setEnrollForm({ courseId: "", studentId: "" });
    }
  }

  async function handleCreateMaterial(event) {
    event.preventDefault();

    const success = await runAction(
      () => createMaterial(materialForm),
      "Study material added successfully."
    );

    if (success) setMaterialForm(emptyMaterial);
  }

  async function handleCreateAnnouncement(event) {
    event.preventDefault();

    const success = await runAction(
      () =>
        createAnnouncement({
          ...announcementForm,
          courseId: announcementForm.courseId || null,
        }),
      "Announcement published successfully."
    );

    if (success) setAnnouncementForm(emptyAnnouncement);
  }

  async function handleDeleteMaterial(item) {
    if (
      !window.confirm(
        `Are you sure you want to delete "${item.title}"?`
      )
    ) {
      return;
    }

    await runAction(
      () => deleteMaterial(item._id),
      "Study material deleted."
    );
  }

  async function handleDeleteAnnouncement(item) {
    if (
      !window.confirm(
        `Are you sure you want to delete "${item.title}"?`
      )
    ) {
      return;
    }

    await runAction(
      () => deleteAnnouncement(item._id),
      "Announcement deleted."
    );
  }

  const unregisteredStudents = students.filter(
    (student) => !student.account
  );

  const filteredMaterials = materials.filter((item) => {
    const query = materialSearch.trim().toLowerCase();

    if (!query) return true;

    return (
      item.title?.toLowerCase().includes(query) ||
      item.type?.toLowerCase().includes(query) ||
      item.courseId?.title?.toLowerCase().includes(query)
    );
  });

  if (isInitializing) {
    return (
      <main className="admin-learning-page">
        <div className="admin-loading">
          <Loader2 size={36} className="admin-spin" />
          <h2>Preparing your workspace</h2>
          <p>Loading students, courses and learning resources...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="admin-learning-page">
      <header className="admin-hero">
        <div className="admin-hero-copy">
          <span className="admin-eyebrow">
            <ShieldCheck size={15} />
            ADMINISTRATION WORKSPACE
          </span>

          <h1>Learning Management</h1>

          <p>
            Manage students, organize courses, share resources and keep
            learners informed from one place.
          </p>

          <div className="admin-hero-actions">
            <a href="#student-account" className="admin-hero-button">
              <UserPlus size={17} />
              Create account
            </a>

            <a href="#course-form" className="admin-hero-link">
              <Plus size={17} />
              Add a course
            </a>
          </div>
        </div>

        <div className="admin-hero-art" aria-hidden="true">
          <div className="admin-hero-orbit">
            <GraduationCap size={68} strokeWidth={1.4} />
          </div>
          <span className="admin-hero-floating">
            <BookOpen size={22} />
          </span>
        </div>
      </header>

      {(notice || error) && (
        <div
          className={`admin-feedback ${error ? "is-error" : "is-success"}`}
          role={error ? "alert" : "status"}
        >
          {error ? (
            <AlertCircle size={20} />
          ) : (
            <CheckCircle2 size={20} />
          )}

          <span>{error || notice}</span>

          <button
            type="button"
            className="admin-feedback-close"
            aria-label="Dismiss notification"
            onClick={() => {
              setNotice("");
              setError("");
            }}
          >
            ×
          </button>
        </div>
      )}

      <section className="admin-stats-grid" aria-label="Portal overview">
        <StatCard
          icon={Users}
          label="Total students"
          value={students.length}
          description="Student records"
          color="stat-blue"
        />

        <StatCard
          icon={BookOpen}
          label="Total courses"
          value={courses.length}
          description="Available learning paths"
          color="stat-purple"
        />

        <StatCard
          icon={FileText}
          label="Study resources"
          value={materials.length}
          description="Learning materials"
          color="stat-amber"
        />

        <StatCard
          icon={Megaphone}
          label="Announcements"
          value={announcements.length}
          description="Published updates"
          color="stat-green"
        />
      </section>

      <div className="admin-content-heading">
        <div>
          <span className="admin-eyebrow">MANAGE YOUR PORTAL</span>
          <h2>Administration tools</h2>
          <p>Choose a task below to manage your learning community.</p>
        </div>

        <button
          type="button"
          className="admin-refresh-button"
          disabled={busy}
          onClick={async () => {
            setError("");
            setNotice("");
            setBusy(true);

            try {
              await refresh();
              setNotice("Dashboard data refreshed.");
            } catch (err) {
              setError(
                err?.response?.data?.message ||
                  "Unable to refresh dashboard data."
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          <RefreshCw size={16} className={busy ? "admin-spin" : ""} />
          Refresh data
        </button>
      </div>

      <div className="admin-learning-grid">
        <div className="admin-column">
          <section className="admin-panel" id="student-account">
            <SectionTitle
              icon={UserPlus}
              title="Create student account"
              description="Give an existing student access to the portal."
              color="blue"
            />

            <form onSubmit={handleCreateAccount} className="admin-form">
              <div className="admin-field">
                <label htmlFor="account-student">Select student</label>
                <select
                  id="account-student"
                  className="form-select"
                  value={accountStudentId}
                  onChange={(event) =>
                    setAccountStudentId(event.target.value)
                  }
                  required
                >
                  <option value="">Choose an unregistered student</option>
                  {unregisteredStudents.map((student) => (
                    <option key={student._id} value={student._id}>
                      {student.name} — {student.email}
                    </option>
                  ))}
                </select>

                <small>
                  {unregisteredStudents.length} student
                  {unregisteredStudents.length === 1 ? "" : "s"} without
                  an account
                </small>
              </div>

              <div className="admin-field">
                <label htmlFor="account-password">
                  Temporary password
                </label>
                <input
                  id="account-password"
                  className="form-control"
                  type="password"
                  minLength={10}
                  autoComplete="new-password"
                  placeholder="At least 10 characters"
                  value={accountPassword}
                  onChange={(event) =>
                    setAccountPassword(event.target.value)
                  }
                  required
                />
                <small>Share the temporary password securely.</small>
              </div>

              <SubmitButton disabled={busy}>
                Create student account
              </SubmitButton>
            </form>
          </section>

          <section className="admin-panel" id="enroll-form">
            <SectionTitle
              icon={UserCheck}
              title="Enroll a student"
              description="Assign a student to a learning course."
              color="green"
            />

            <form onSubmit={handleEnroll} className="admin-form">
              <div className="admin-field">
                <label htmlFor="enroll-course">Course</label>
                <select
                  id="enroll-course"
                  className="form-select"
                  value={enrollForm.courseId}
                  onChange={(event) =>
                    setEnrollForm({
                      ...enrollForm,
                      courseId: event.target.value,
                    })
                  }
                  required
                >
                  <option value="">Choose a course</option>
                  {courses.map((course) => (
                    <option key={course._id} value={course._id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="admin-field">
                <label htmlFor="enroll-student">Student</label>
                <select
                  id="enroll-student"
                  className="form-select"
                  value={enrollForm.studentId}
                  onChange={(event) =>
                    setEnrollForm({
                      ...enrollForm,
                      studentId: event.target.value,
                    })
                  }
                  required
                >
                  <option value="">Choose a student</option>
                  {students.map((student) => (
                    <option key={student._id} value={student._id}>
                      {student.name} — {student.email}
                    </option>
                  ))}
                </select>
              </div>

              <SubmitButton disabled={busy}>
                Enroll student
              </SubmitButton>
            </form>
          </section>
        </div>

        <div className="admin-column">
          <section className="admin-panel" id="course-form">
            <SectionTitle
              icon={BookOpen}
              title="Create a course"
              description="Build a new learning path for your students."
              color="purple"
            />

            <form onSubmit={handleCreateCourse} className="admin-form">
              <div className="admin-field">
                <label htmlFor="course-title">Course title</label>
                <input
                  id="course-title"
                  className="form-control"
                  placeholder="e.g. Full Stack Development"
                  value={courseForm.title}
                  onChange={(event) =>
                    setCourseForm({
                      ...courseForm,
                      title: event.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="admin-field">
                <label htmlFor="course-instructor">Instructor name</label>
                <input
                  id="course-instructor"
                  className="form-control"
                  placeholder="e.g. Jane Doe"
                  value={courseForm.instructor}
                  onChange={(event) =>
                    setCourseForm({
                      ...courseForm,
                      instructor: event.target.value,
                    })
                  }
                />
              </div>

              <div className="admin-field">
                <label htmlFor="course-description">Description</label>
                <textarea
                  id="course-description"
                  className="form-control"
                  rows={3}
                  placeholder="What will students learn?"
                  value={courseForm.description}
                  onChange={(event) =>
                    setCourseForm({
                      ...courseForm,
                      description: event.target.value,
                    })
                  }
                />
              </div>

              <SubmitButton disabled={busy}>Save course</SubmitButton>
            </form>
          </section>

          <section className="admin-panel" id="material-form">
            <SectionTitle
              icon={FileText}
              title="Study materials"
              description="Add and manage course resources."
              color="amber"
            />

            <form
              onSubmit={handleCreateMaterial}
              className="admin-form admin-form-inset"
            >
              <div className="admin-field">
                <label htmlFor="material-course">Course</label>
                <select
                  id="material-course"
                  className="form-select"
                  value={materialForm.courseId}
                  onChange={(event) =>
                    setMaterialForm({
                      ...materialForm,
                      courseId: event.target.value,
                    })
                  }
                  required
                >
                  <option value="">Choose a course</option>
                  {courses.map((course) => (
                    <option key={course._id} value={course._id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="admin-field">
                <label htmlFor="material-type">Resource type</label>
                <select
                  id="material-type"
                  className="form-select"
                  value={materialForm.type}
                  onChange={(event) =>
                    setMaterialForm({
                      ...materialForm,
                      type: event.target.value,
                    })
                  }
                >
                  <option value="PDF">PDF document</option>
                  <option value="Video">Video</option>
                  <option value="Resource link">Resource link</option>
                </select>
              </div>

              <div className="admin-field">
                <label htmlFor="material-title">Material title</label>
                <input
                  id="material-title"
                  className="form-control"
                  placeholder="e.g. JavaScript fundamentals"
                  value={materialForm.title}
                  onChange={(event) =>
                    setMaterialForm({
                      ...materialForm,
                      title: event.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="admin-field">
                <label htmlFor="material-url">Resource URL</label>
                <input
                  id="material-url"
                  className="form-control"
                  type="url"
                  placeholder="https://example.com/resource"
                  value={materialForm.url}
                  onChange={(event) =>
                    setMaterialForm({
                      ...materialForm,
                      url: event.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="admin-field">
                <label htmlFor="material-description">
                  Description (optional)
                </label>
                <textarea
                  id="material-description"
                  className="form-control"
                  rows={2}
                  placeholder="A short description of this resource"
                  value={materialForm.description}
                  onChange={(event) =>
                    setMaterialForm({
                      ...materialForm,
                      description: event.target.value,
                    })
                  }
                />
              </div>

              <SubmitButton disabled={busy}>Add material</SubmitButton>
            </form>

            <div className="admin-list-heading">
              <h3>Existing materials</h3>
              <span>{materials.length} total</span>
            </div>

            <div className="admin-search">
              <Search size={17} />
              <input
                type="search"
                aria-label="Search study materials"
                placeholder="Search materials or courses..."
                value={materialSearch}
                onChange={(event) => setMaterialSearch(event.target.value)}
              />
            </div>

            <div className="admin-item-list">
              {filteredMaterials.length === 0 ? (
                <p className="admin-empty">
                  {materials.length
                    ? "No materials match your search."
                    : "No study materials have been added yet."}
                </p>
              ) : (
                filteredMaterials.map((item) => (
                  <article className="admin-resource-item" key={item._id}>
                    <span className="admin-resource-icon">
                      <FileText size={19} />
                    </span>

                    <div className="admin-resource-copy">
                      <strong>{item.title}</strong>
                      <span>
                        {item.type || "Resource"} ·{" "}
                        {item.courseId?.title || "Course resource"}
                      </span>
                    </div>

                    <div className="admin-resource-actions">
                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="admin-icon-button"
                          aria-label={`Open ${item.title}`}
                        >
                          <ExternalLink size={16} />
                        </a>
                      )}

                      <button
                        type="button"
                        className="admin-icon-button danger"
                        disabled={busy}
                        onClick={() => handleDeleteMaterial(item)}
                        aria-label={`Delete ${item.title}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>

        <section className="admin-panel admin-announcements" id="announcement-form">
          <SectionTitle
            icon={Megaphone}
            title="Announcements"
            description="Publish important updates for all students or a specific course."
            color="teal"
          />

          <form
            onSubmit={handleCreateAnnouncement}
            className="admin-form"
          >
            <div className="admin-form-two-column">
              <div className="admin-field">
                <label htmlFor="announcement-title">Title</label>
                <input
                  id="announcement-title"
                  className="form-control"
                  placeholder="e.g. Upcoming assessment"
                  value={announcementForm.title}
                  onChange={(event) =>
                    setAnnouncementForm({
                      ...announcementForm,
                      title: event.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="admin-field">
                <label htmlFor="announcement-audience">Audience</label>
                <select
                  id="announcement-audience"
                  className="form-select"
                  value={announcementForm.courseId}
                  onChange={(event) =>
                    setAnnouncementForm({
                      ...announcementForm,
                      courseId: event.target.value,
                    })
                  }
                >
                  <option value="">All students</option>
                  {courses.map((course) => (
                    <option key={course._id} value={course._id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="admin-field">
              <label htmlFor="announcement-body">Message</label>
              <textarea
                id="announcement-body"
                className="form-control"
                rows={4}
                placeholder="Write the announcement details..."
                value={announcementForm.body}
                onChange={(event) =>
                  setAnnouncementForm({
                    ...announcementForm,
                    body: event.target.value,
                  })
                }
                required
              />
            </div>

            <SubmitButton disabled={busy}>
              Publish announcement
            </SubmitButton>
          </form>

          <div className="admin-list-heading">
            <h3>Published announcements</h3>
            <span>{announcements.length} total</span>
          </div>

          {announcements.length === 0 ? (
            <p className="admin-empty">
              No announcements have been published yet.
            </p>
          ) : (
            <div className="admin-announcement-grid">
              {announcements.map((item) => (
                <article
                  className="admin-announcement-item"
                  key={item._id}
                >
                  <div className="admin-announcement-top">
                    <span className="admin-announcement-icon">
                      <Megaphone size={18} />
                    </span>

                    <button
                      type="button"
                      className="admin-icon-button danger"
                      disabled={busy}
                      onClick={() => handleDeleteAnnouncement(item)}
                      aria-label={`Delete announcement: ${item.title}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <h3>{item.title}</h3>

                  <span className="admin-audience-badge">
                    {item.courseId?.title || "All students"}
                  </span>

                  <p>{item.body}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      <footer className="admin-footer">
        <span>
          <ShieldCheck size={16} />
          Learning Management Administration
        </span>

        <span>
          {students.length} students · {courses.length} courses
        </span>
      </footer>
    </main>
  );
}
