
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getStudentDashboard } from "../../api/studentPortal";
import {
  BookOpen,
  FileText,
  Bell,
  AlertCircle,
  RefreshCcw,
  ExternalLink,
  GraduationCap,
  ArrowRight,
  PlayCircle,
  Clock3,
  Search,
  Sparkles,
  CalendarDays,
} from "lucide-react";
import "./StudentDashboard.css";

function formatDate(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getInitials(name) {
  return String(name || "Student")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

function getProgress(course) {
  const value = Number(
    course.progress ?? course.progressPercentage ?? course.completionPercentage
  );

  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

function StatCard({ icon: Icon, label, value, detail, className = "" }) {
  return (
    <article className={`learning-stat ${className}`}>
      <span className="learning-stat-icon">
        <Icon size={21} />
      </span>
      <div className="learning-stat-copy">
        <span>{label}</span>
        <strong>{value ?? 0}</strong>
        {detail && <small>{detail}</small>}
      </div>
    </article>
  );
}

function SectionHeading({ eyebrow, title, description, to, linkText = "View all" }) {
  return (
    <div className="learning-section-heading">
      <div>
        {eyebrow && <span className="learning-eyebrow">{eyebrow}</span>}
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {to && (
        <Link to={to} className="learning-text-link">
          {linkText} <ArrowRight size={15} />
        </Link>
      )}
    </div>
  );
}

function EmptyState({ icon: Icon = BookOpen, title, message, to, action }) {
  return (
    <div className="learning-empty">
      <span className="learning-empty-icon">
        <Icon size={25} />
      </span>
      <h3>{title}</h3>
      <p>{message}</p>
      {to && (
        <Link to={to} className="learning-button learning-button-outline">
          {action || "Explore courses"}
        </Link>
      )}
    </div>
  );
}

function CourseCard({ course }) {
  const progress = getProgress(course);
  const title = course.title || "Untitled course";
  const instructor = course.instructor || "Instructor not specified";
  const thumbnail =
    course.thumbnail ||
    course.thumbnailUrl ||
    course.imageUrl ||
    course.coverImage ||
    "";

  return (
    <article className="learning-course-card">
      <Link
        to={`/student/courses/${course._id}`}
        className="learning-course-image"
        aria-label={`Open ${title}`}
      >
        {thumbnail ? (
          <img src={thumbnail} alt="" loading="lazy" />
        ) : (
          <div className="learning-course-placeholder">
            <BookOpen size={38} />
            <span>YOUR NEXT LESSON</span>
          </div>
        )}
        <span className="learning-course-play">
          <PlayCircle size={34} />
        </span>
      </Link>

      <div className="learning-course-content">
        <span className="learning-course-kicker">MY LEARNING</span>
        <h3>
          <Link to={`/student/courses/${course._id}`}>{title}</Link>
        </h3>
        <p className="learning-course-instructor">{instructor}</p>

        <div className="learning-progress-meta">
          <span>{progress}% complete</span>
          {progress === 100 ? (
            <span className="learning-completed">Completed</span>
          ) : progress > 0 ? (
            <span>In progress</span>
          ) : (
            <span>Not started</span>
          )}
        </div>

        <div
          className="learning-progress-track"
          role="progressbar"
          aria-label={`${title} completion`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
        >
          <span style={{ width: `${progress}%` }} />
        </div>

        <Link
          to={`/student/courses/${course._id}`}
          className="learning-course-action"
        >
          {progress === 100
            ? "Review course"
            : progress > 0
              ? "Continue learning"
              : "Start learning"}
          <ArrowRight size={15} />
        </Link>
      </div>
    </article>
  );
}

function MaterialCard({ item }) {
  const type = String(item.type || "Resource").toUpperCase();
  const isVideo = type.includes("VIDEO");
  const isPdf = type.includes("PDF");

  return (
    <article className="learning-material-card">
      <span
        className={`learning-material-icon ${
          isVideo ? "material-video" : isPdf ? "material-pdf" : "material-link"
        }`}
      >
        {isVideo ? (
          <PlayCircle size={22} />
        ) : isPdf ? (
          <FileText size={22} />
        ) : (
          <BookOpen size={22} />
        )}
      </span>

      <div className="learning-material-copy">
        <span className="learning-material-type">{type}</span>
        <h3>{item.title || "Untitled resource"}</h3>
        <p>{item.courseId?.title || "Course resource"}</p>
      </div>

      {item.url ? (
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="learning-material-open"
          aria-label={`Open ${item.title || "study material"}`}
        >
          <ExternalLink size={17} />
        </a>
      ) : (
        <span
          className="learning-material-open is-disabled"
          title="Material link unavailable"
        >
          <ExternalLink size={17} />
        </span>
      )}
    </article>
  );
}

export default function StudentDashboard() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await getStudentDashboard();
      const result = response?.data ?? response;
      setData(result || {});
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Could not load your dashboard. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (isLoading) {
    return (
      <main className="learning-dashboard">
        <div className="learning-loading" role="status">
          <span className="spinner-border" />
          <p>Preparing your learning space...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="learning-dashboard">
        <div className="learning-error" role="alert">
          <AlertCircle size={30} />
          <h2>We couldn't load your dashboard</h2>
          <p>{error}</p>
          <button
            type="button"
            className="learning-button learning-button-primary"
            onClick={fetchDashboardData}
          >
            <RefreshCcw size={16} /> Try again
          </button>
        </div>
      </main>
    );
  }

  const {
    student,
    courses = [],
    recentMaterials = [],
    announcements = [],
    courseCount,
  } = data || {};

  const safeCourses = Array.isArray(courses) ? courses : [];
  const safeMaterials = Array.isArray(recentMaterials) ? recentMaterials : [];
  const safeAnnouncements = Array.isArray(announcements)
    ? announcements
    : [];

  const displayName = student?.name?.trim()?.split(/\s+/)[0] || "Learner";
  const firstCourse = safeCourses.find((course) => getProgress(course) < 100);
  const completedCourses = safeCourses.filter(
    (course) => getProgress(course) === 100
  ).length;

  const progressValues = safeCourses.map(getProgress);
  const averageProgress = progressValues.length
    ? Math.round(
        progressValues.reduce((total, value) => total + value, 0) /
          progressValues.length
      )
    : 0;

  return (
    <main className="learning-dashboard">
      <header className="learning-topbar">
        <div className="learning-topbar-copy">
          <span className="learning-eyebrow">STUDENT LEARNING PORTAL</span>
          <h1>Welcome back, {displayName}!</h1>
          <p>Every lesson brings you one step closer to your goals.</p>
        </div>

        <div className="learning-profile">
          <span className="learning-profile-avatar">
            {getInitials(student?.name)}
          </span>
          <div>
            <strong>{student?.name || "Student"}</strong>
            <small>Student account</small>
          </div>
        </div>
      </header>

      <section className="learning-hero">
        <div className="learning-hero-content">
          <span className="learning-hero-label">
            <Sparkles size={15} /> YOUR LEARNING JOURNEY
          </span>
          <h2>
            Learn something
            <br />
            <span>new today.</span>
          </h2>
          <p>
            Pick up where you left off or explore courses to discover your next
            skill.
          </p>

          <div className="learning-hero-actions">
            {firstCourse?._id ? (
              <Link
                to={`/student/courses/${firstCourse._id}`}
                className="learning-button learning-button-gold"
              >
                <PlayCircle size={18} /> Continue learning
              </Link>
            ) : (
              <Link
                to="/student/courses"
                className="learning-button learning-button-gold"
              >
                <Search size={18} /> Explore courses
              </Link>
            )}

            <Link
              to="/student/courses"
              className="learning-hero-secondary"
            >
              Browse my courses <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        <div className="learning-hero-art" aria-hidden="true">
          <div className="learning-art-orbit orbit-one" />
          <div className="learning-art-orbit orbit-two" />
          <div className="learning-art-card">
            <GraduationCap size={66} strokeWidth={1.4} />
            <span>KEEP GROWING</span>
          </div>
          <div className="learning-art-badge">
            <BookOpen size={19} />
          </div>
        </div>
      </section>

      <section className="learning-stats-grid" aria-label="Learning overview">
        <StatCard
          icon={BookOpen}
          label="Enrolled courses"
          value={courseCount ?? safeCourses.length}
          detail="Your learning library"
          className="stat-blue"
        />
        <StatCard
          icon={GraduationCap}
          label="Completed courses"
          value={completedCourses}
          detail="Courses at 100%"
          className="stat-purple"
        />
        <StatCard
          icon={FileText}
          label="Study resources"
          value={safeMaterials.length}
          detail="Recently added materials"
          className="stat-gold"
        />
        <StatCard
          icon={Bell}
          label="Announcements"
          value={safeAnnouncements.length}
          detail="Learning updates"
          className="stat-green"
        />
      </section>

      <section className="learning-progress-summary">
        <div className="learning-progress-symbol">
          <Clock3 size={22} />
        </div>
        <div className="learning-progress-text">
          <strong>Your learning progress</strong>
          <span>
            {safeCourses.length
              ? `Average progress across ${safeCourses.length} enrolled course${
                  safeCourses.length === 1 ? "" : "s"
                }`
              : "Enroll in a course to start tracking your progress"}
          </span>
        </div>
        <strong className="learning-progress-number">{averageProgress}%</strong>
        <div className="learning-summary-track">
          <span style={{ width: `${averageProgress}%` }} />
        </div>
      </section>

      <section className="learning-section">
        <SectionHeading
          eyebrow="PICK UP WHERE YOU LEFT OFF"
          title="Continue learning"
          description="Your courses, all in one place."
          to="/student/courses"
        />

        {safeCourses.length ? (
          <div className="learning-course-grid">
            {safeCourses.slice(0, 3).map((course, index) => (
              <CourseCard
                key={course._id || course.id || `${course.title}-${index}`}
                course={course}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={GraduationCap}
            title="Your learning journey starts here"
            message="Explore available courses and enroll to build your personal learning library."
            to="/student/courses"
            action="Explore courses"
          />
        )}
      </section>

      <div className="learning-bottom-grid">
        <section className="learning-panel">
          <SectionHeading
            eyebrow="STAY INFORMED"
            title="Latest announcements"
            description="Important updates from your learning portal."
            to="/student/announcements"
          />

          {safeAnnouncements.length ? (
            <div className="learning-announcement-list">
              {safeAnnouncements.slice(0, 4).map((item, index) => (
                <article
                  className="learning-announcement"
                  key={item._id || item.id || index}
                >
                  <span className="learning-announcement-icon">
                    <Bell size={18} />
                  </span>
                  <div>
                    <h3>{item.title || "Learning update"}</h3>
                    <p>{item.body || "Open the announcement for details."}</p>
                    <small>
                      {item.courseId?.title || "General announcement"}
                      {item.createdAt ? ` · ${formatDate(item.createdAt)}` : ""}
                    </small>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Bell}
              title="You're all caught up"
              message="New announcements will appear here."
            />
          )}
        </section>

        <section className="learning-panel">
          <SectionHeading
            eyebrow="YOUR STUDY LIBRARY"
            title="Recent study materials"
            description="Resources ready when you are."
            to="/student/materials"
          />

          {safeMaterials.length ? (
            <div className="learning-material-list">
              {safeMaterials.slice(0, 5).map((item, index) => (
                <MaterialCard
                  key={item._id || item.id || index}
                  item={item}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={FileText}
              title="No study materials yet"
              message="Your notes, videos, and learning resources will appear here when available."
              to="/student/materials"
              action="View materials"
            />
          )}
        </section>
      </div>

      <footer className="learning-footer">
        <span>
          <CalendarDays size={15} /> Keep your learning momentum going.
        </span>
        <Link to="/student/courses">
          View all courses <ArrowRight size={15} />
        </Link>
      </footer>
    </main>
  );
}
