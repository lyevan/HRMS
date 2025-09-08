import AdminLayout from "./pages/admin/layout";
import LoginPage from "./pages/authentication";
import Dashboard from "./pages/admin/dashboard";
import TimekeepingPage from "./pages/admin/timekeeping";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import axios from "axios";
import ProtectedRoute from "./components/protected-route";
import { Toaster } from "./components/ui/sonner";
import { useUserSessionStore } from "./store/userSessionStore";
import { useEffect } from "react";
import config, { validateEnvironment } from "./lib/config";
import LandingLayout from "./pages/public/layout";
import { Landing } from "./pages/public/landing";
import { useIsMobile } from "./hooks/use-mobile";
import { ThemeProvider } from "@/components/theme-provider";
import EmployeeDashboard from "./pages/admin/employees/dashboard";
import EmployeeManagement from "./pages/admin/employees/management";
import CompleteRegistrationForm from "./pages/public/complete-registration";
import Organization from "./pages/admin/employees/organization";

function App() {
  // Validate environment variables and configure axios
  validateEnvironment();

  axios.defaults.baseURL = config.api.baseUrl;
  axios.defaults.withCredentials = true;

  // Add request interceptor for production debugging
  if (config.isProduction) {
    axios.interceptors.request.use(
      (config) => {
        console.log(`Making request to: ${config.baseURL}${config.url}`);
        return config;
      },
      (error) => {
        console.error("Request error:", error);
        return Promise.reject(error);
      }
    );

    axios.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        console.error("Response error:", {
          status: error.response?.status,
          statusText: error.response?.statusText,
          message: error.response?.data?.message || error.message,
          url: error.config?.url,
        });
        return Promise.reject(error);
      }
    );
  }

  const { initialize } = useUserSessionStore();
  const isMobile = useIsMobile();

  // Initialize authentication check on app load
  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <ThemeProvider>
      <BrowserRouter>
        <Toaster
          richColors
          expand={false}
          position={isMobile ? "bottom-center" : "top-right"}
        />
        <div className="min-h-screen bg-background">
          <Routes>
            {/* Root redirect */}
            <Route path="/" element={<Navigate to="/home" />} />
            <Route
              path="/home"
              element={
                <LandingLayout>
                  <Landing
                    heading="Outsource and Consultancy Services"
                    subheading=""
                    description="Unlock seamless business operations with our expert outsourcing services. We help streamline your processes, reduce costs, and drive efficiency, so you can focus on what matters most, growing your business."
                    buttons={{
                      primary: {
                        text: "Inquire Now",
                        url: "",
                      },
                    }}
                    image={{
                      src: "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/placeholder-dark-7-tall.svg",
                      alt: "Placeholder",
                    }}
                  />
                </LandingLayout>
              }
            />

            {/* Public routes */}

            <Route path="/auth" element={<LoginPage />} />
            <Route
              path="/complete-registration/:token"
              element={<CompleteRegistrationForm />}
            />
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
                      <Route
                        path="/"
                        element={<Navigate to="dashboard" replace />}
                      />
                      <Route path="dashboard" element={<Dashboard />} />
                      {/* Admin Employee Group Routes */}
                      <Route
                        path="emp"
                        element={<Navigate to="/emp/dashboard" />}
                      />
                      <Route
                        path="emp/dashboard"
                        element={<EmployeeDashboard />}
                      />
                      <Route
                        path="emp/management"
                        element={<EmployeeManagement />}
                      />
                      <Route
                        path="emp/organization"
                        element={<Organization />}
                      />

                      {/* Admin Timekeeping Group Routes */}
                      <Route
                        path="tk"
                        element={<Navigate to="tk/dashboard" replace />}
                      />
                      <Route
                        path="tk/dashboard"
                        element={<TimekeepingPage />}
                      />

                      {/* Admin Payroll Group Routes */}
                      <Route path="payroll" element={<div>Payroll Page</div>} />
                      <Route
                        path="requests"
                        element={<div>Requests Page</div>}
                      />
                      <Route
                        path="schedule"
                        element={<div>Schedule Page</div>}
                      />
                      <Route
                        path="pending"
                        element={<div>Pending Employee Applications</div>}
                      />
                      <Route
                        path="settings"
                        element={<div>Settings Page</div>}
                      />
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
    </ThemeProvider>
  );
}

export default App;
