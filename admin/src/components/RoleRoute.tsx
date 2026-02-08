import { Navigate } from "react-router-dom";
import { getRole } from "@/utils/auth";

const RoleRoute = ({
  children,
  role,
}: {
  children: JSX.Element;
  role: "player" | "client";
}) => {
  const userRole = getRole();

  if (userRole !== role) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default RoleRoute;
