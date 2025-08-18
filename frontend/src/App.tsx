import AdminLayout from "./pages/admin/layout";
import LoginPage from "./pages/authentication";
import Dashboard from "./pages/admin/dashboard";
import EmployeesPage from "./pages/admin/employees";
import AttendancePage from "./pages/admin/attendance";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import axios from "axios";
import ProtectedRoute from "./components/protected-route";
import { Toaster } from "./components/ui/sonner";
import { useUserSessionStore } from "./store/userSessionStore";
import { useEffect } from "react";
import config, { validateEnvironment } from "./lib/config";

function App() {
  // Validate environment variables and configure axios
  validateEnvironment();

  axios.defaults.baseURL = config.api.baseUrl;
  axios.defaults.withCredentials = true;

  const { initialize } = useUserSessionStore();

  // Initialize authentication check on app load
  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <BrowserRouter>
      <Toaster richColors expand={true} position="top-right" />
      <div className="min-h-screen bg-background">
        <Routes>
          {/* Root redirect */}
          <Route path="/" element={<Navigate to="/auth" replace />} />

          {/* Public routes */}
          <Route path="/auth" element={<LoginPage />} />
          <Route
            path="/unauthorized"
            element={<div>Unauthorized Access</div>}
          />

          {/* Protected Admin Routes */}
          <Route
            path="/app/admin/*"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminLayout>
                  <Routes>
                    <Route index element={<Dashboard />} />
                    <Route path="employees" element={<EmployeesPage />} />
                    <Route path="attendance" element={<AttendancePage />} />
                    <Route
                      path="departments"
                      element={<div>Departments Page</div>}
                    />
                    <Route path="payroll" element={<div>Payroll Page</div>} />
                    <Route path="requests" element={<div>Requests Page</div>} />
                    <Route path="schedule" element={<div>Schedule Page</div>} />
                    <Route
                      path="pending"
                      element={<div>Pending Employee Applications</div>}
                    />
                    <Route path="settings" element={<div>Settings Page</div>} />
                  </Routes>
                </AdminLayout>
              </ProtectedRoute>
            }
          />

          {/* Protected Staff Routes (future expansion) */}
          <Route
            path="/app/staff/*"
            element={
              <ProtectedRoute requiredRole="staff">
                <div>Staff Dashboard - Coming Soon</div>
              </ProtectedRoute>
            }
          />

          {/* Protected Employee Routes (future expansion) */}
          <Route
            path="/app/employee/*"
            element={
              <ProtectedRoute requiredRole="employee">
                <div>Employee Dashboard - Coming Soon</div>
              </ProtectedRoute>
            }
          />

          {/* Catch-all route */}
          <Route path="*" element={<Navigate to="/auth" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
