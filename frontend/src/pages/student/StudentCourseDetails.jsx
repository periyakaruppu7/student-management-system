
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  FileText,
  ExternalLink,
  AlertCircle,
  RefreshCcw,
  GraduationCap,
  PlayCircle,
} from "lucide-react";

import { getStudentDashboard } from "../../api/studentPortal";

export default function StudentCourseDetails() {
  const { courseId } = useParams();

  const [course, setCourse] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadCourse = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getStudentDashboard();
      const data = response?.data ?? response;

      const courses = Array.isArray(data?.courses)
        ? data.courses
        : [];

      const recentMaterials = Array.isArray(data?.recentMaterials)
        ? data.recentMaterials
        : [];

      const selectedCourse = courses.find(
        (item) => String(item._id) === String(courseId)
      );

      setCourse(selectedCourse ?? null);

      const courseMaterials = recentMaterials.filter((item) => {
        const materialCourseId =
          item.courseId?._id ?? item.courseId;

        return String(materialCourseId) === String(courseId);
      });

      setMaterials(courseMaterials);

      if (!selectedCourse) {
        setError(
          "Course details are not available in the dashboard response."
        );
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load course details. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    loadCourse();
  }, [loadCourse]);

  return (
    <main className="portal-card student-course-details">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <Link
          to="/student/courses"
          className="btn btn-light d-inline-flex align-items-center gap-2"
        >
          <ArrowLeft size={16} />
          Back to courses
        </Link>

        <Link
          to="/student/materials"
          className="btn btn-outline-primary d-inline-flex align-items-center gap-2"
        >
          <FileText size={16} />
          All study materials
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div
            className="spinner-border text-primary mb-3"
            role="status"
            aria-label="Loading course"
          />
          <p className="text-muted mb-0">
            Loading course details...
          </p>
        </div>
      ) : error ? (
        <div className="text-center py-5">
          <AlertCircle
            size={44}
            className="text-warning mb-3"
          />

          <h1 className="h4 mb-2">Course unavailable</h1>

          <p className="text-muted mb-4">{error}</p>

          <div className="d-flex justify-content-center gap-2 flex-wrap">
            <button
              type="button"
              className="btn btn-primary d-inline-flex align-items-center gap-2"
              onClick={loadCourse}
            >
              <RefreshCcw size={16} />
              Try again
            </button>

            <Link
              to="/student/courses"
              className="btn btn-light"
            >
              Browse courses
            </Link>
          </div>
        </div>
      ) : (
        <>
          <section className="rounded-4 p-4 p-md-5 mb-4 bg-light">
            <div className="d-flex flex-column flex-md-row align-items-md-center gap-4">
              <div
                className="rounded-4 bg-white text-primary d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ width: 88, height: 88 }}
              >
                <GraduationCap size={46} />
              </div>

              <div className="flex-grow-1">
                <span className="badge text-bg-primary mb-3">
                  My learning
                </span>

                <h1 className="h2 fw-bold mb-2">
                  {course?.title || "Course details"}
                </h1>

                <p className="text-muted mb-0">
                  {course?.instructor
                    ? `Instructor: ${course.instructor}`
                    : "Continue learning with your course materials."}
                </p>
              </div>
            </div>
          </section>

          <section className="mb-5">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h2 className="h5 fw-bold mb-1">
                  Course resources
                </h2>
                <p className="text-muted mb-0">
                  Materials available for this course
                </p>
              </div>

              <span className="badge rounded-pill text-bg-light">
                {materials.length}{" "}
                {materials.length === 1 ? "resource" : "resources"}
              </span>
            </div>

            {materials.length > 0 ? (
              <div className="row g-3">
                {materials.map((material) => (
                  <div
                    className="col-12 col-md-6"
                    key={material._id}
                  >
                    <article className="border rounded-4 p-3 h-100">
                      <div className="d-flex align-items-start gap-3">
                        <div className="text-primary bg-light rounded-3 p-3">
                          <FileText size={24} />
                        </div>

                        <div className="flex-grow-1 min-w-0">
                          <h3 className="h6 fw-semibold mb-1">
                            {material.title || "Study material"}
                          </h3>

                          <p className="small text-muted mb-3">
                            {material.type || "Resource"}
                          </p>

                          {material.url ? (
                            <a
                              href={material.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-2"
                            >
                              <ExternalLink size={14} />
                              Open material
                            </a>
                          ) : (
                            <span className="small text-muted">
                              No resource link available
                            </span>
                          )}
                        </div>
                      </div>
                    </article>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border rounded-4 text-center p-4 p-md-5">
                <BookOpen
                  size={40}
                  className="text-muted mb-3"
                />

                <h3 className="h6 fw-bold">
                  No course materials yet
                </h3>

                <p className="text-muted mb-3">
                  Study resources for this course will appear here
                  when they are available.
                </p>

                <Link
                  to="/student/materials"
                  className="btn btn-primary d-inline-flex align-items-center gap-2"
                >
                  <PlayCircle size={17} />
                  Browse materials
                </Link>
              </div>
            )}
          </section>

          <section className="border-top pt-4">
            <h2 className="h6 fw-bold mb-2">
              Keep learning
            </h2>

            <p className="text-muted mb-3">
              Open your course resources or explore other available
              study materials.
            </p>

            <Link
              to="/student/courses"
              className="btn btn-light"
            >
              View all courses
            </Link>
          </section>
        </>
      )}
    </main>
  );
}
