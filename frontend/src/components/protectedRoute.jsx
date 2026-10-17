import { Navigate } from "react-router-dom";
import { getStoredUser } from "../api/auth";

export default function ProtectedRoute({
  roles,
  children,
}) {
  const token = localStorage.getItem("portalToken");
  const user = getStoredUser();

  if (!token || !user) {
    return <Navigate to="/student-login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return (
      <Navigate
        to={user.role === "admin" ? "/admin/learning" : "/student"}
        replace
      />
    );
  }

  return children;
}