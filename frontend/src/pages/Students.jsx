
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { deleteStudent, getStudents } from "../api/students";
import "./Students.css";

const PAGE_SIZE = 10;
const MAX_RECORDS = 100;

const STATUS_OPTIONS = ["Active", "Graduated", "On Leave", "Withdrawn"];

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
).replace(/\/+$/, "");

const API_ORIGIN = API_BASE_URL.replace(/\/api$/, "");

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}

function getStudentName(student) {
  return String(student?.name || "").trim() || "Unnamed student";
}

function getStudentStatus(student) {
  return student?.academicStatus || "Active";
}

function getInitials(name) {
  const parts = String(name || "Student")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

// Supports image URLs and backend upload paths.
function getPhoto(student) {
  const value =
    student?.profileImage ||
    student?.profilePicture ||
    student?.avatar ||
    student?.image ||
    student?.photo ||
    "";

  if (typeof value !== "string" || !value.trim()) {
    return "";
  }

  const imageUrl = value.trim();

  if (/^(https?:\/\/|data:image\/)/i.test(imageUrl)) {
    return imageUrl;
  }

  // Handles paths such as /uploads/student.jpg.
  return `${API_ORIGIN}/${imageUrl.replace(/^\/+/, "")}`;
}

function getCreatedTime(student) {
  const value = new Date(student?.createdAt || 0).getTime();
  return Number.isFinite(value) ? value : 0;
}

function getStatusClass(status) {
  const classes = {
    Active: "status-active",
    Graduated: "status-graduated",
    "On Leave": "status-on-leave",
    Withdrawn: "status-withdrawn",
  };

  return classes[status] || "status-unknown";
}

function StudentAvatar({ student, name }) {
  const [imageFailed, setImageFailed] = useState(false);
  const photo = getPhoto(student);

  useEffect(() => {
    setImageFailed(false);
  }, [photo]);

  if (!photo || imageFailed) {
    return (
      <span
        className="students-avatar students-avatar-fallback"
        aria-label={`${name} initials`}
      >
        {getInitials(name)}
      </span>
    );
  }

  return (
    <img
      src={photo}
      alt={`${name} profile`}
      className="students-avatar"
      loading="lazy"
      onError={() => {
        console.error("Unable to load student profile image:", photo);
        setImageFailed(true);
      }}
    />
  );
}

export default function Students() {
  const location = useLocation();
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const loadStudents = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getStudents({
        page: 1,
        limit: MAX_RECORDS,
      });

      const records = Array.isArray(response)
        ? response
        : Array.isArray(response?.students)
          ? response.students
          : Array.isArray(response?.data)
            ? response.data
            : Array.isArray(response?.data?.students)
              ? response.data.students
              : null;

      if (!records) {
        throw new Error("The server returned an unexpected student list.");
      }

      setStudents(records);

      console.log(
        "Student image URLs:",
        records.map((student) => ({
          name: student.name,
          profileImage: student.profileImage,
          profilePicture: student.profilePicture,
          avatar: student.avatar,
          image: student.image,
          photo: student.photo,
        }))
      );
    } catch (err) {
      setError(getErrorMessage(err, "Unable to load student records."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  useEffect(() => {
    const message = location.state?.message;

    if (!message) return;

    setSuccess(message);

    navigate(location.pathname + location.search, {
      replace: true,
      state: null,
    });
  }, [location.pathname, location.search, location.state, navigate]);

  const courses = useMemo(
    () =>
      [
        ...new Set(
          students
            .map((student) => String(student.course || "").trim())
            .filter(Boolean)
        ),
      ].sort((a, b) => a.localeCompare(b)),
    [students]
  );

  const filteredStudents = useMemo(() => {
    const term = search.trim().toLowerCase();

    const result = students.filter((student) => {
      const values = [
        student.name,
        student.email,
        student.age,
        student.studentId,
        student.course,
        student.department,
        student.phone,
        student.academicStatus,
        student.yearOfStudy,
        student.semester,
      ];

      const matchesSearch =
        !term ||
        values.some((value) =>
          String(value ?? "").toLowerCase().includes(term)
        );

      const matchesCourse =
        courseFilter === "all" ||
        String(student.course || "").trim() === courseFilter;

      const matchesStatus =
        statusFilter === "all" ||
        getStudentStatus(student) === statusFilter;

      return matchesSearch && matchesCourse && matchesStatus;
    });

    return result.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return getStudentName(a).localeCompare(getStudentName(b));
        case "oldest":
          return getCreatedTime(a) - getCreatedTime(b);
        case "age":
          return Number(a.age || 0) - Number(b.age || 0);
        case "age-desc":
          return Number(b.age || 0) - Number(a.age || 0);
        default:
          return getCreatedTime(b) - getCreatedTime(a);
      }
    });
  }, [students, search, courseFilter, statusFilter, sortBy]);

  const totalStudents = students.length;

  const activeCount = students.filter(
    (student) => getStudentStatus(student) === "Active"
  ).length;

  const graduatedCount = students.filter(
    (student) => getStudentStatus(student) === "Graduated"
  ).length;

  const pageCount = Math.max(
    1,
    Math.ceil(filteredStudents.length / PAGE_SIZE)
  );

  const safePage = Math.min(page, pageCount);

  const visibleStudents = useMemo(() => {
    const startIndex = (safePage - 1) * PAGE_SIZE;
    return filteredStudents.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredStudents, safePage]);

  useEffect(() => {
    setPage(1);
  }, [search, courseFilter, statusFilter, sortBy]);

  function clearFilters() {
    setSearch("");
    setCourseFilter("all");
    setStatusFilter("all");
    setSortBy("newest");
    setPage(1);
  }

  async function handleDelete(student) {
    if (deletingId !== null) return;

    if (!student?._id) {
      setError("This student record does not have a valid ID.");
      return;
    }

    const name = getStudentName(student);
    const confirmed = window.confirm(
      `Delete ${name}?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    setDeletingId(student._id);
    setError("");
    setSuccess("");

    try {
      await deleteStudent(student._id);

      setStudents((current) =>
        current.filter((item) => item._id !== student._id)
      );

      setSuccess(`${name} was deleted successfully.`);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to delete this student."));
    } finally {
      setDeletingId(null);
    }
  }

  const hasActiveFilters =
    Boolean(search.trim()) ||
    courseFilter !== "all" ||
    statusFilter !== "all";

  const firstRecord =
    filteredStudents.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;

  const lastRecord = Math.min(
    safePage * PAGE_SIZE,
    filteredStudents.length
  );

  return (
    <main className="students-page">
      <header className="students-page-header">
        <div>
          <nav className="students-breadcrumb" aria-label="Breadcrumb">
            <Link to="/">Dashboard</Link>
            <i className="bi bi-chevron-right" aria-hidden="true" />
            <span aria-current="page">Students</span>
          </nav>

          <h1>Student Directory</h1>
          <p>Manage student profiles, courses, and enrolment status.</p>
        </div>

        <Link to="/students/add" className="students-add-btn">
          <i className="bi bi-plus-lg" aria-hidden="true" />
          Add student
        </Link>
      </header>

      {success && (
        <div className="alert alert-success students-alert" role="status">
          <span>{success}</span>
          <button
            type="button"
            className="btn-close"
            aria-label="Dismiss success message"
            onClick={() => setSuccess("")}
          />
        </div>
      )}

      {error && (
        <div className="alert alert-danger students-alert" role="alert">
          <span>{error}</span>
          <button
            type="button"
            className="btn-close"
            aria-label="Dismiss error"
            onClick={() => setError("")}
          />
          <button
            type="button"
            className="students-retry-btn"
            onClick={loadStudents}
            disabled={loading}
          >
            {loading ? "Loading..." : "Retry"}
          </button>
        </div>
      )}

      <section className="students-summary" aria-label="Student statistics">
        <article className="students-stat">
          <span className="students-stat-icon">
            <i className="bi bi-people" aria-hidden="true" />
          </span>
          <div>
            <span>Total students loaded</span>
            <strong>{loading ? "—" : totalStudents}</strong>
          </div>
        </article>

        <article className="students-stat">
          <span className="students-stat-icon courses">
            <i className="bi bi-mortarboard" aria-hidden="true" />
          </span>
          <div>
            <span>Courses</span>
            <strong>{loading ? "—" : courses.length}</strong>
          </div>
        </article>

        <article className="students-stat">
          <span className="students-stat-icon active">
            <i className="bi bi-person-check" aria-hidden="true" />
          </span>
          <div>
            <span>Active students</span>
            <strong>{loading ? "—" : activeCount}</strong>
          </div>
        </article>

        <article className="students-stat">
          <span className="students-stat-icon graduated">
            <i className="bi bi-mortarboard-fill" aria-hidden="true" />
          </span>
          <div>
            <span>Graduated</span>
            <strong>{loading ? "—" : graduatedCount}</strong>
          </div>
        </article>
      </section>

      <section className="students-table-panel">
        <div className="students-table-heading">
          <div>
            <h2>All students</h2>
            <p>
              {loading
                ? "Loading student records..."
                : `${filteredStudents.length} matching record${
                    filteredStudents.length === 1 ? "" : "s"
                  }`}
            </p>
          </div>

          <button
            type="button"
            className="students-refresh-btn"
            onClick={loadStudents}
            disabled={loading || deletingId !== null}
          >
            <i className="bi bi-arrow-clockwise me-2" aria-hidden="true" />
            Refresh
          </button>
        </div>

        <div className="students-toolbar">
          <label htmlFor="student-search" className="students-search">
            <i className="bi bi-search" aria-hidden="true" />
            <input
              id="student-search"
              type="search"
              placeholder="Search name, ID, email, phone..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search student records"
            />
          </label>

          <select
            className="form-select students-filter"
            value={courseFilter}
            onChange={(event) => setCourseFilter(event.target.value)}
            aria-label="Filter by course"
          >
            <option value="all">All courses</option>
            {courses.map((course) => (
              <option key={course} value={course}>
                {course}
              </option>
            ))}
          </select>

          <select
            className="form-select students-filter"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter by academic status"
          >
            <option value="all">All statuses</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          <select
            className="form-select students-filter"
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
            aria-label="Sort students"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="name">Name A–Z</option>
            <option value="age">Age: low to high</option>
            <option value="age-desc">Age: high to low</option>
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              className="students-clear-filters"
              onClick={clearFilters}
            >
              Clear filters
            </button>
          )}
        </div>

        <div className="table-responsive">
          <table className="table students-table align-middle mb-0">
            <thead>
              <tr>
                <th>Student</th>
                <th>Contact</th>
                <th>Course / Department</th>
                <th>Academic status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5">
                    <div className="students-table-state" role="status">
                      <span className="spinner-border spinner-border-sm" />
                      Loading students...
                    </div>
                  </td>
                </tr>
              ) : visibleStudents.length > 0 ? (
                visibleStudents.map((student) => {
                  const name = getStudentName(student);
                  const status = getStudentStatus(student);

                  return (
                    <tr key={student._id || student.email || name}>
                      <td>
                        <div className="students-person">
                          <StudentAvatar student={student} name={name} />

                          <div className="students-person-details">
                            <strong>{name}</strong>
                            <span>
                              {student.studentId || "ID not assigned"}
                            </span>
                            {student.age != null && student.age !== "" && (
                              <small>{student.age} years old</small>
                            )}
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="students-contact">
                          <span>{student.email || "No email"}</span>
                          <small>{student.phone || "No phone number"}</small>
                        </div>
                      </td>

                      <td>
                        <div className="students-academic">
                          <span>
                            {student.course || "Course not specified"}
                          </span>
                          <small>
                            {student.department || "Department not specified"}
                          </small>
                          {(student.yearOfStudy || student.semester) && (
                            <small>
                              {student.yearOfStudy
                                ? `Year ${student.yearOfStudy}`
                                : ""}
                              {student.yearOfStudy && student.semester
                                ? " · "
                                : ""}
                              {student.semester
                                ? `Semester ${student.semester}`
                                : ""}
                            </small>
                          )}
                        </div>
                      </td>

                      <td>
                        <span
                          className={`students-status ${getStatusClass(status)}`}
                        >
                          {status}
                        </span>
                      </td>

                      <td>
                        <div className="students-row-actions">
                          <Link
                            to={`/students/edit/${student._id}`}
                            className="students-action-btn edit"
                            aria-label={`Edit ${name}`}
                            title="Edit student"
                          >
                            <i className="bi bi-pencil" aria-hidden="true" />
                          </Link>

                          <button
                            type="button"
                            className="students-action-btn delete"
                            onClick={() => handleDelete(student)}
                            disabled={deletingId !== null || !student._id}
                            aria-label={`Delete ${name}`}
                            title="Delete student"
                          >
                            {deletingId === student._id ? (
                              <span className="spinner-border spinner-border-sm" />
                            ) : (
                              <i
                                className="bi bi-trash3"
                                aria-hidden="true"
                              />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5">
                    <div className="students-empty-state">
                      <i
                        className="bi bi-person-lines-fill"
                        aria-hidden="true"
                      />
                      <h3>
                        {hasActiveFilters
                          ? "No matching students"
                          : "No students added yet"}
                      </h3>
                      <p>
                        {hasActiveFilters
                          ? "Try changing your search or filters."
                          : "Add a student to start building your directory."}
                      </p>
                      {hasActiveFilters ? (
                        <button
                          type="button"
                          className="students-empty-link"
                          onClick={clearFilters}
                        >
                          Clear filters
                        </button>
                      ) : (
                        <Link
                          to="/students/add"
                          className="students-empty-link"
                        >
                          Add student
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {!loading && filteredStudents.length > 0 && (
          <div className="students-pagination">
            <span>
              Showing {firstRecord}–{lastRecord} of {filteredStudents.length}
            </span>

            <div>
              <button
                type="button"
                className="students-page-btn"
                disabled={safePage <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Previous
              </button>

              <span>
                Page {safePage} of {pageCount}
              </span>

              <button
                type="button"
                className="students-page-btn"
                disabled={safePage >= pageCount}
                onClick={() =>
                  setPage((current) => Math.min(pageCount, current + 1))
                }
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
