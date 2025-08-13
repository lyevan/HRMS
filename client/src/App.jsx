import React, { useEffect } from "react";
import { Navigate } from "react-router";
import { BrowserRouter, Routes, Route } from "react-router";
import Authentication from "./pages/Authentication";
import OTPLoginForm from "./components/OTPLoginForm";
import ThemeSwitcher from "./components/ThemeSwitcher";
import Unauthorized from "./pages/Unauthorized";
import AdminDashboard from "./pages/adminPages/_AdminDashboard";
import EmployeeDashboard from "./pages/employeePages/_EmployeeDashboard";
import Attendance from "./pages/adminPages/Attendance";
import Organization from "./pages/adminPages/Organization";
import ProtectedRoute from "./components/ProtectedRoute";
import EmployeeHome from "./pages/employeePages/_Home";
import Employee from "./pages/adminPages/Employee";
import AdminHome from "./pages/adminPages/_Home";
import Registration from "./pages/Registration";
import { useUserSessionStore } from "./store/userSessionStore";
import { useTheme } from "./store/themeStore";
import axios from "axios";
import Toast from "./components/Toast";
import useToastStore from "./store/toastStore";

function App() {
  axios.defaults.baseURL = "http://192.168.254.107:3000/api";
  axios.defaults.withCredentials = true;

  const initialize = useUserSessionStore((state) => state.initialize);
  const { theme } = useTheme();

  // Initialize authentication check on app load
  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <div
      data-theme={theme}
      className="w-screen h-screen flex justify-center items-center"
    >
      <BrowserRouter>
        <Toast />
        <Routes>
          <Route path="/" element={<Navigate to="/auth" replace />} />
          <Route path="/auth" element={<Authentication />} />
          <Route
            path="/auth/email-login"
            element={
              <div className="relative w-full h-full justify-center items-center flex flex-col">
                <OTPLoginForm />
                <div className="absolute bottom-4 left-4">
                  <ThemeSwitcher />
                </div>
              </div>
            }
          />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route
            path="/registration-success"
            element={
              <div>
                <h1>Registration Successful!</h1>
                <p>
                  Please expect an email with further instructions on your
                  onboarding process. We hope to see you soon!
                </p>
              </div>
            }
          />
          <Route
            path="/complete-registration/:token"
            element={<Registration />}
          />

          {/* Protected Admin Routes */}
          <Route
            path="/dashboard/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          >
            {/* All nested routes are automatically protected by the parent ProtectedRoute */}
            <Route index element={<Navigate to="home" replace />} />
            <Route path="home" element={<AdminHome />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="employees" element={<Employee />} />
            <Route path="organization" element={<Organization />} />
            <Route path="payroll" element={<div>Payroll Management</div>} />
            <Route path="reports" element={<div>Reports</div>} />
            <Route path="requests" element={<div>Requests</div>} />
            <Route path="schedules" element={<div>Schedules</div>} />
            <Route path="settings" element={<div>Settings</div>} />
            {/* Add more protected admin routes here */}
          </Route>

          {/* Protected Employee Routes */}
          <Route
            path="/dashboard/employee"
            element={
              <ProtectedRoute requiredRole="employee">
                <EmployeeDashboard />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="home" replace />} />
            <Route path="home" element={<EmployeeHome />} />
            <Route path="attendance" element={<div>Attendance</div>} />
            <Route path="deductions" element={<div>Deductions</div>} />
            <Route path="employees" element={<Employee />} />
            <Route path="payroll" element={<div>Payroll</div>} />
            <Route path="requests" element={<div>Requests</div>} />
            <Route path="schedules" element={<div>Schedules</div>} />
            <Route path="settings" element={<div>Settings</div>} />
            {/* Add employee nested routes here if needed */}
          </Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
