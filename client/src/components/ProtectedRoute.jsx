import React from "react";
import { Navigate } from "react-router";
import { useUserSessionStore } from "../store/userSessionStore";

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const user = useUserSessionStore((state) => state.user);
  const isLoading = useUserSessionStore((state) => state.isLoading);
  const isAuthenticated = useUserSessionStore((state) => state.isAuthenticated);
  const hasRole = useUserSessionStore((state) => state.hasRole);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated()) {
    return <Navigate to="/auth" replace />;
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;
