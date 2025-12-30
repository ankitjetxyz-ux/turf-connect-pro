import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: JSX.Element;
  role?: "player" | "client";
}

const ProtectedRoute = ({ children, role }: ProtectedRouteProps) => {
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("role");

  // Not logged in
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Role mismatch
  if (role && userRole !== role) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
