
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  GraduationCap,
  Search,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ArrowRight,
  UserRound,
} from "lucide-react";

import {
  getAvailableCourses,
  getMyCourses,
  enrollInCourse,
} from "../../api/studentPortal";

import "../../styles/student-portal.css";
import "./student-courses.css";

export default function StudentCourses() {
  const [available, setAvailable] = useState([]);
  const [enrolled, setEnrolled] = useState([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("available");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadCourses() {
    setLoading(true);
    setError("");

    try {
      const [allCourses, myCourses] = await Promise.all([
        getAvailableCourses(),
        getMyCourses(),
      ]);

      setAvailable(Array.isArray(allCourses) ? allCourses : []);
      setEnrolled(Array.isArray(myCourses) ? myCourses : []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load courses. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCourses();
  }, []);

  const enrolledIds = new Set(
    enrolled.map((course) => String(course._id))
  );

  const visibleCourses = (
    activeTab === "available"
      ? available.filter(
          (course) => !enrolledIds.has(String(course._id))
        )
      : enrolled
  ).filter((course) => {
    const query = search.toLowerCase();

    return (
      course.title?.toLowerCase().includes(query) ||
      course.instructor?.toLowerCase().includes(query) ||
      course.description?.toLowerCase().includes(query)
    );
  });

  async function handleEnroll(courseId) {
    setBusyId(courseId);
    setError("");
    setNotice("");

    try {
      await enrollInCourse(courseId);
      await loadCourses();

      setActiveTab("enrolled");
      setNotice("You have successfully enrolled in the course.");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Enrollment failed. Please try again."
      );
    } finally {
      setBusyId("");
    }
  }

  return (
    <main className="student-courses-page">
      <header className="student-courses-hero">
        <div>
          <span className="student-courses-eyebrow">
            LEARNING LIBRARY
          </span>

          <h1>Explore Courses</h1>

          <p>
            Discover new skills, enroll in a course, and start learning
            at your own pace.
          </p>

          <div className="student-courses-count">
            <BookOpen size={17} />
            {available.length} courses available
            <span>·</span>
            {enrolled.length} enrolled
          </div>
        </div>

        <div className="student-courses-hero-icon">
          <GraduationCap size={76} />
        </div>
      </header>

      {notice && (
        <div className="student-courses-notice success">
          <CheckCircle2 size={19} />
          {notice}
        </div>
      )}

      {error && (
        <div className="student-courses-notice error">
          <AlertCircle size={19} />
          <span>{error}</span>
          <button onClick={loadCourses}>Retry</button>
        </div>
      )}

      <section className="student-courses-toolbar">
        <div className="student-courses-tabs">
          <button
            className={activeTab === "available" ? "active" : ""}
            onClick={() => setActiveTab("available")}
          >
            Available Courses
          </button>

          <button
            className={activeTab === "enrolled" ? "active" : ""}
            onClick={() => setActiveTab("enrolled")}
          >
            My Learning ({enrolled.length})
          </button>
        </div>

        <label className="student-courses-search">
          <Search size={18} />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courses..."
            aria-label="Search courses"
          />
        </label>
      </section>

      {loading ? (
        <div className="student-courses-loading">
          <Loader2 className="student-courses-spinner" size={32} />
          <p>Loading courses...</p>
        </div>
      ) : visibleCourses.length === 0 ? (
        <div className="student-courses-empty">
          <BookOpen size={42} />

          <h2>
            {activeTab === "available"
              ? "No available courses found"
              : "Your learning journey starts here"}
          </h2>

          <p>
            {activeTab === "available"
              ? "Try another search or check your enrolled courses."
              : "Explore available courses and enroll to get started."}
          </p>

          {activeTab === "enrolled" && (
            <button
              className="student-courses-primary"
              onClick={() => setActiveTab("available")}
            >
              Explore courses
            </button>
          )}
        </div>
      ) : (
        <section className="student-course-grid">
          {visibleCourses.map((course) => {
            const isEnrolled = enrolledIds.has(String(course._id));
            const isBusy = busyId === course._id;

            return (
              <article
                className="student-course-card"
                key={course._id}
              >
                <div className="student-course-cover">
                  <span className="student-course-cover-label">
                    {isEnrolled ? "YOUR COURSE" : "COURSE"}
                  </span>

                  <BookOpen size={45} />

                  <span className="student-course-initial">
                    {course.title?.charAt(0)?.toUpperCase() || "C"}
                  </span>
                </div>

                <div className="student-course-body">
                  <span
                    className={`student-course-status ${
                      isEnrolled ? "enrolled" : "available"
                    }`}
                  >
                    {isEnrolled ? "Enrolled" : "Available"}
                  </span>

                  <h2>{course.title}</h2>

                  <p className="student-course-description">
                    {course.description ||
                      "Explore this course and build your skills."}
                  </p>

                  <div className="student-course-instructor">
                    <UserRound size={16} />
                    <span>
                      {course.instructor || "Instructor not specified"}
                    </span>
                  </div>

                  {isEnrolled ? (
                    <Link
                      className="student-course-action"
                      to={`/student/courses/${course._id}`}
                    >
                      Study Course <ArrowRight size={17} />
                    </Link>
                  ) : (
                    <button
                      className="student-course-action"
                      disabled={Boolean(busyId)}
                      onClick={() => handleEnroll(course._id)}
                    >
                      {isBusy ? (
                        <>
                          <Loader2
                            className="student-courses-spinner"
                            size={17}
                          />
                          Enrolling...
                        </>
                      ) : (
                        <>
                          Enroll Now <ArrowRight size={17} />
                        </>
                      )}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
