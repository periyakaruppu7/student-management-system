
import { useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import AddStudent from "./pages/AddStudent";
import EditStudent from "./pages/EditStudent";
import Login from "./Login";

import StudentLogin from "./pages/student/StudentLogin";
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentCourses from "./pages/student/StudentCourses";
import StudentCourseDetails from "./pages/student/StudentCourseDetails";
import StudentMaterials from "./pages/student/StudentMaterials";
import StudentAnnouncements from "./pages/student/StudentAnnouncements";

import AdminLearning from "./pages/admin/AdminLearning";
import ProtectedRoute from "./components/protectedRoute.jsx";
import StudentPortalLayout from "./components/studentPortalLayout.jsx";

import "./App.css";

function AdminLayout({ isLoggedIn, onLogout }) {
  const location = useLocation();

  if (!isLoggedIn) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  return (
    <>
      <Navbar onLogout={onLogout} />

      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/students" element={<Students />} />
        <Route path="/students/add" element={<AddStudent />} />
        <Route path="/students/edit/:id" element={<EditStudent />} />

        <Route
          path="*"
          element={
            <div className="container py-5 text-center">
              <h2>404 - Page Not Found</h2>
              <a href="/" className="btn btn-primary mt-3">
                Back to Dashboard
              </a>
            </div>
          }
        />
      </Routes>
    </>
  );
}

function AppRoutes() {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  return (
    <Routes>
      {/* Admin login */}
      <Route
        path="/login"
        element={
          isAdminLoggedIn ? (
            <Navigate to="/" replace />
          ) : (
            <Login onLogin={() => setIsAdminLoggedIn(true)} />
          )
        }
      />

      {/* Student login */}
      <Route path="/student-login" element={<StudentLogin />} />

      {/* Student portal */}
      <Route
        path="/student"
        element={
          <ProtectedRoute roles={["student"]}>
            <StudentPortalLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<StudentDashboard />} />
        <Route path="courses" element={<StudentCourses />} />

        {/* Open an individual course */}
        <Route
          path="courses/:courseId"
          element={<StudentCourseDetails />}
        />

        <Route path="materials" element={<StudentMaterials />} />
        <Route
          path="announcements"
          element={<StudentAnnouncements />}
        />
      </Route>

      {/* Admin learning management */}
      <Route
        path="/admin/learning"
        element={
          <ProtectedRoute roles={["admin"]}>
            <AdminLearning />
          </ProtectedRoute>
        }
      />

      {/* Existing admin pages */}
      <Route
        path="/*"
        element={
          <AdminLayout
            isLoggedIn={isAdminLoggedIn}
            onLogout={() => setIsAdminLoggedIn(false)}
          />
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
