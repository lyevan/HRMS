import { useEffect, useState } from "react";
import { Navigate } from "react-router";
import { useUserSessionStore } from "../store/userSessionStore";
import DashboardSkeleton from "../pages/dashboard-skeleton";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string | null;
}

const ProtectedRoute = ({
  children,
  requiredRole = null,
}: ProtectedRouteProps) => {
  const { user, isLoading, checkAuthStatus, validateRole, isAuthenticated } =
    useUserSessionStore();
  const [isValidating, setIsValidating] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const validateAccess = async () => {
      try {
        // Always verify with server on route access
        await checkAuthStatus();

        const currentUser = useUserSessionStore.getState().user;

        // Check if user is authenticated
        if (!currentUser) {
          setIsAuthorized(false);
          return;
        }

        // If no specific role required, user is authorized
        if (!requiredRole) {
          setIsAuthorized(true);
          return;
        }

        // Validate specific role with fresh server check
        const hasValidRole = await validateRole(requiredRole);
        setIsAuthorized(hasValidRole);
      } catch (error) {
        console.error("Access validation failed:", error);
        setIsAuthorized(false);
      } finally {
        setIsValidating(false);
      }
    };

    validateAccess();
  }, [requiredRole, checkAuthStatus, validateRole]);

  // Show loading spinner while validating
  if (isLoading || isValidating) {
    return (
      // <div className="flex justify-center items-center h-screen">
      //   <span className="ml-2">Verifying access... {user?.name}</span>
      // </div>
      <DashboardSkeleton />
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated()) {
    return <Navigate to="/auth" replace />;
  }

  console.log("User session:", requiredRole, isAuthorized, user);
  // Redirect to unauthorized if role check failed
  if (requiredRole && !isAuthorized) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Render protected content
  return children;
};

export default ProtectedRoute;
