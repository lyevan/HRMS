import AdminLayout from "./pages/admin/layout";
import LoginPage from "./pages/authentication";
import Dashboard from "./pages/admin/dashboard";
import { BrowserRouter, Routes, Route } from "react-router";
import axios from "axios";
import ProtectedRoute from "./components/protected-route";
import { Toaster } from "./components/ui/sonner";

function App() {
  axios.defaults.baseURL = "http://192.168.254.107:3000/api";
  axios.defaults.withCredentials = true;
  const baseUrl = "/app";
  return (
    <BrowserRouter>
      <Toaster position="top-right" expand={true} richColors />
      <div className="min-h-screen bg-background">
        <Routes>
          <Route path="/auth" element={<LoginPage />} />
          <Route path="/unauthorized" element={<div>Unauthorized</div>} />
        </Routes>
        <ProtectedRoute requiredRole="admin">
          <AdminLayout>
            <Routes>
              <Route path={`${baseUrl}/admin`} element={<Dashboard />} />
              <Route
                path={`${baseUrl}/admin/employees`}
                element={<div>Employees LOL</div>}
              />
            </Routes>
          </AdminLayout>
        </ProtectedRoute>
      </div>
    </BrowserRouter>
  );
}

export default App;
