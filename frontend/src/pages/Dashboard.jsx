
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getStudentStats, getStudents } from "../api/students";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import "./Dashboard.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
);

ChartJS.defaults.font.family =
  '"Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
ChartJS.defaults.color = "#64748b";

const chartColors = [
  "#1d4ed8",
  "#0f766e",
  "#475569",
  "#b45309",
  "#6d28d9",
  "#0369a1",
  "#9f1239",
  "#4d7c0f",
];

// Supports different image field names returned by your API.
function StudentAvatar({ student }) {
  const [imageFailed, setImageFailed] = useState(false);

  const imageUrl = [
    student?.profileImage,
    student?.profilePicture,
    student?.avatar,
    student?.image,
    student?.photo,
  ].find(
    (value) =>
      typeof value === "string" && value.trim().length > 0
  );

  const initials = (student?.name || "S")
    .trim()
    .charAt(0)
    .toUpperCase();

  if (!imageUrl || imageFailed) {
    return (
      <span className="student-initials" aria-hidden="true">
        {initials}
      </span>
    );
  }

  return (
    <img
      src={imageUrl.trim()}
      alt={`${student?.name || "Student"} profile`}
      className="dashboard-student-avatar"
      loading="lazy"
      onError={() => setImageFailed(true)}
    />
  );
}

export default function Dashboard() {
  const [dashboardStats, setDashboardStats] = useState(null);
  const [recentStudents, setRecentStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [statsResponse, studentsResponse] = await Promise.all([
        getStudentStats(),
        getStudents({
          limit: 5,
          sortBy: "createdAt",
          order: "desc",
        }),
      ]);

      // Support APIs that return an array directly or { students: [...] }.
      const students = Array.isArray(studentsResponse)
        ? studentsResponse
        : Array.isArray(studentsResponse?.students)
          ? studentsResponse.students
          : Array.isArray(studentsResponse?.data)
            ? studentsResponse.data
            : [];

      setDashboardStats(statsResponse?.data ?? statsResponse);
      setRecentStudents(students);

      console.log(
        "Student profile image fields:",
        students.map((student) => ({
          name: student.name,
          profileImage: student.profileImage,
          profilePicture: student.profilePicture,
          avatar: student.avatar,
          image: student.image,
          photo: student.photo,
        }))
      );
    } catch (err) {
      setError(
        err.message || "Unable to load student statistics."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const statistics = useMemo(() => {
    const courseEntries = (
      dashboardStats?.courses || []
    ).map(({ course, count }) => [
      course || "Not specified",
      Number(count) || 0,
    ]);

    return {
      totalStudents: Number(dashboardStats?.totalStudents) || 0,
      activeStudents: Number(dashboardStats?.activeStudents) || 0,
      totalCourses: Number(dashboardStats?.totalCourses) || 0,
      averageAge:
        dashboardStats?.averageAge == null
          ? "—"
          : Number(dashboardStats.averageAge).toFixed(1),
      courseEntries,
    };
  }, [dashboardStats]);

  const barData = {
    labels: statistics.courseEntries.map(([course]) => course),
    datasets: [
      {
        label: "Number of students",
        data: statistics.courseEntries.map(([, count]) => count),
        backgroundColor: statistics.courseEntries.map(
          (_, index) => chartColors[index % chartColors.length]
        ),
        borderRadius: 4,
        maxBarThickness: 48,
      },
    ],
  };

  const doughnutData = {
    labels: statistics.courseEntries.map(([course]) => course),
    datasets: [
      {
        data: statistics.courseEntries.map(([, count]) => count),
        backgroundColor: statistics.courseEntries.map(
          (_, index) => chartColors[index % chartColors.length]
        ),
        borderWidth: 2,
        borderColor: "#ffffff",
        hoverOffset: 4,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        backgroundColor: "#0f172a",
        padding: 10,
        cornerRadius: 6,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { color: "#e2e8f0" },
        ticks: { maxRotation: 35, minRotation: 0 },
      },
      y: {
        beginAtZero: true,
        border: { display: false },
        grid: { color: "#eef2f7" },
        ticks: { precision: 0, stepSize: 1 },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "68%",
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          usePointStyle: true,
          pointStyle: "rect",
          padding: 16,
        },
      },
      tooltip: {
        backgroundColor: "#0f172a",
        padding: 10,
        cornerRadius: 6,
      },
    },
  };

  const activePercent = statistics.totalStudents
    ? Math.round(
        (statistics.activeStudents / statistics.totalStudents) * 100
      )
    : 0;

  if (loading && !dashboardStats) {
    return (
      <div className="dashboard-state">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="text-secondary mt-3">Loading dashboard...</p>
      </div>
    );
  }

  if (error && !dashboardStats) {
    return (
      <div className="dashboard-state">
        <div className="alert alert-danger" role="alert">
          <h5>Dashboard could not load</h5>
          <p className="mb-3">{error}</p>
          <button
            className="btn btn-outline-danger"
            onClick={loadDashboard}
            disabled={loading}
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="container-fluid dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p>Student enrolment and course overview.</p>
        </div>

        <div className="dashboard-header-actions">
          <span className="dashboard-date">
            {new Intl.DateTimeFormat("en-IN", {
              weekday: "short",
              day: "numeric",
              month: "short",
              year: "numeric",
            }).format(new Date())}
          </span>

          <button
            type="button"
            className="btn dashboard-refresh-button"
            onClick={loadDashboard}
            disabled={loading}
          >
            <span aria-hidden="true">↻</span> Refresh
          </button>

          <Link
            to="/students/add"
            className="btn btn-primary dashboard-add-button"
          >
            <span aria-hidden="true">+</span> Add student
          </Link>
        </div>
      </header>

      {error && (
        <div className="alert alert-warning" role="status">
          {error}
        </div>
      )}

      {/* Statistics cards */}
      <section
        className="row g-3 dashboard-stat-grid"
        aria-label="Student statistics"
      >
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card dashboard-stat-card h-100">
            <div className="card-body">
              <div className="stat-card-top">
                <span className="stat-label">Total students</span>
                <span className="stat-icon" aria-hidden="true">♙</span>
              </div>
              <h2 className="stat-value">
                {statistics.totalStudents.toLocaleString()}
              </h2>
              <p className="stat-description mb-0">
                All registered records
              </p>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card dashboard-stat-card h-100">
            <div className="card-body">
              <div className="stat-card-top">
                <span className="stat-label">Active students</span>
                <span className="stat-icon stat-green" aria-hidden="true">
                  ✓
                </span>
              </div>
              <h2 className="stat-value">
                {statistics.activeStudents.toLocaleString()}
              </h2>
              <p className="stat-description mb-0">
                {statistics.totalStudents
                  ? `${activePercent}% of all students`
                  : "No student records yet"}
              </p>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card dashboard-stat-card h-100">
            <div className="card-body">
              <div className="stat-card-top">
                <span className="stat-label">Total courses</span>
                <span className="stat-icon" aria-hidden="true">▤</span>
              </div>
              <h2 className="stat-value">
                {statistics.totalCourses.toLocaleString()}
              </h2>
              <p className="stat-description mb-0">
                Across the student body
              </p>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card dashboard-stat-card h-100">
            <div className="card-body">
              <div className="stat-card-top">
                <span className="stat-label">Average age</span>
                <span className="stat-icon" aria-hidden="true">⌁</span>
              </div>
              <h2 className="stat-value">{statistics.averageAge}</h2>
              <p className="stat-description mb-0">
                Years across all records
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick actions */}
      <section className="dashboard-quick-actions" aria-label="Quick actions">
        <div className="dashboard-quick-copy">
          <h2>Quick actions</h2>
          <p>Go straight to common tasks.</p>
        </div>

        <div className="dashboard-action-links">
          <Link to="/students/add" className="dashboard-action-link">
            <span className="action-link-icon" aria-hidden="true">+</span>
            <span>
              <strong>Add a student</strong>
              <small>Create a new record</small>
            </span>
            <span className="action-link-arrow" aria-hidden="true">↗</span>
          </Link>

          <Link to="/students" className="dashboard-action-link">
            <span className="action-link-icon" aria-hidden="true">☷</span>
            <span>
              <strong>Manage students</strong>
              <small>Search and update records</small>
            </span>
            <span className="action-link-arrow" aria-hidden="true">↗</span>
          </Link>

          <Link
            to="/admin/learning#course-form"
            className="dashboard-action-link"
          >
            <span className="action-link-icon" aria-hidden="true">▤</span>
            <span>
              <strong>Add a course</strong>
              <small>Create a learning course</small>
            </span>
            <span className="action-link-arrow" aria-hidden="true">↗</span>
          </Link>

          <Link
            to="/admin/learning#material-form"
            className="dashboard-action-link"
          >
            <span className="action-link-icon" aria-hidden="true">PDF</span>
            <span>
              <strong>Add PDF material</strong>
              <small>Link a hosted PDF resource</small>
            </span>
            <span className="action-link-arrow" aria-hidden="true">↗</span>
          </Link>

          <Link
            to="/admin/learning#announcement-form"
            className="dashboard-action-link"
          >
            <span className="action-link-icon" aria-hidden="true">!</span>
            <span>
              <strong>Publish announcement</strong>
              <small>Share a student update</small>
            </span>
            <span className="action-link-arrow" aria-hidden="true">↗</span>
          </Link>

          <Link
            to="/admin/learning#student-account"
            className="dashboard-action-link"
          >
            <span className="action-link-icon" aria-hidden="true">ID</span>
            <span>
              <strong>Create student login</strong>
              <small>Set a temporary password</small>
            </span>
            <span className="action-link-arrow" aria-hidden="true">↗</span>
          </Link>
        </div>
      </section>

      {/* Charts */}
      <div className="row g-3 mb-3">
        <div className="col-12 col-xl-7">
          <div className="card dashboard-panel h-100">
            <div className="card-body p-3 p-md-4">
              <h2 className="h5 fw-bold mb-1">Students by course</h2>
              <p className="text-secondary small mb-4">
                Compare student counts across courses
              </p>

              {statistics.courseEntries.length === 0 ? (
                <div className="chart-empty">
                  No course data available yet.
                </div>
              ) : (
                <div className="bar-chart-container">
                  <Bar data={barData} options={barOptions} />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-5">
          <div className="card dashboard-panel h-100">
            <div className="card-body p-3 p-md-4">
              <h2 className="h5 fw-bold mb-1">Course distribution</h2>
              <p className="text-secondary small mb-4">
                Share of students in each course
              </p>

              {statistics.courseEntries.length === 0 ? (
                <div className="chart-empty">
                  Add courses to view distribution.
                </div>
              ) : (
                <div className="doughnut-chart-container">
                  <Doughnut
                    data={doughnutData}
                    options={doughnutOptions}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Course statistics */}
      <div className="card dashboard-panel mb-3">
        <div className="card-body p-3 p-md-4">
          <h2 className="h5 fw-bold mb-1">Course statistics</h2>
          <p className="text-secondary small mb-4">
            Student count and percentage by course
          </p>

          {statistics.courseEntries.length === 0 ? (
            <p className="text-secondary mb-0">
              No course statistics to display.
            </p>
          ) : (
            <div className="row g-4">
              {statistics.courseEntries.map(([course, count], index) => {
                const percentage = statistics.totalStudents
                  ? (count / statistics.totalStudents) * 100
                  : 0;

                return (
                  <div className="col-12 col-md-6" key={course}>
                    <div className="d-flex justify-content-between gap-3 mb-2">
                      <span className="fw-semibold text-break">{course}</span>
                      <span className="text-secondary text-nowrap">
                        {count} ({percentage.toFixed(1)}%)
                      </span>
                    </div>

                    <div
                      className="progress course-progress"
                      role="progressbar"
                      aria-label={`${course} student percentage`}
                      aria-valuenow={percentage}
                      aria-valuemin="0"
                      aria-valuemax="100"
                    >
                      <div
                        className="progress-bar"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor:
                            chartColors[index % chartColors.length],
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent students */}
      <div className="card dashboard-panel">
        <div className="card-body p-3 p-md-4">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
            <div>
              <h2 className="h5 fw-bold mb-1">Recent students</h2>
              <p className="text-secondary small mb-0">
                Latest five student records
              </p>
            </div>

            <Link to="/students" className="btn btn-outline-primary btn-sm">
              View all
            </Link>
          </div>

          {recentStudents.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-secondary">
                No students have been added yet.
              </p>
              <Link to="/students/add" className="btn btn-primary">
                Add your first student
              </Link>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th>Student name</th>
                    <th>Email</th>
                    <th>Course</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {recentStudents.map((student, index) => (
                    <tr key={student._id || student.id || index}>
                      <td>
                        <div className="dashboard-student-name">
                          <StudentAvatar student={student} />
                          <span className="fw-semibold">
                            {student.name || "Unnamed Student"}
                          </span>
                        </div>
                      </td>

                      <td className="dashboard-email">
                        {student.email || "—"}
                      </td>

                      <td>
                        <span className="badge text-bg-light border">
                          {student.course || "Not specified"}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`student-status-badge ${
                            (student.academicStatus || "Active") === "Active"
                              ? "student-status-active"
                              : "student-status-other"
                          }`}
                        >
                          <span aria-hidden="true" />
                          {student.academicStatus || "Active"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
