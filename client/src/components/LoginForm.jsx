import React, { useState } from "react";
import { useUserSessionStore } from "../store/userSessionStore";
import axios from "axios";
import { Navigate, useNavigate } from "react-router";
import { Eye, EyeOff } from "lucide-react";
import useToastStore from "../store/toastStore";

const LoginForm = () => {
  const { login, isAuthenticated, user } = useUserSessionStore();
  const navigate = useNavigate();
  const { showToast } = useToastStore();
  const [data, setData] = useState({
    username: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if already authenticated
  if (isAuthenticated()) {
    if (user?.role === "admin") {
      return <Navigate to="/dashboard/admin" replace />;
    } else if (user?.role === "employee") {
      return <Navigate to="/dashboard/employee" replace />;
    }
    // Fallback redirect
    return <Navigate to="/auth" replace />;
  }

  const handleLogin = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await axios.post("/users/login", {
        username: data.username,
        password: data.password,
      });

      const userData = response.data.user || response.data;
      login(userData);

      if (userData?.role === "admin") {
        navigate("/dashboard/admin");
        showToast("Login successful!", "success");

      } else if (userData?.role === "employee") {
        navigate("/dashboard/employee");
        showToast("Login successful!", "success");
      }
    } catch (error) {
      console.error("Login failed:", error);
      setError(
        error.response?.data?.message || "Login failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <fieldset className="fieldset bg-base-200 border-base-300 rounded-box w-xs border p-4">
      <form
        className="form-control w-full max-w-xs flex flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          handleLogin();
        }}
      >
        <label className="label text-base-content">Username</label>
        <input
          type="text"
          className="input"
          placeholder="Username"
          value={data.username}
          onChange={(e) => setData({ ...data, username: e.target.value })}
          disabled={isLoading}
          suggested="username"
          autoComplete="username"
          required
        />

        <label className="label text-base-content">Password</label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            className="input"
            placeholder="Password"
            value={data.password}
            onChange={(e) => setData({ ...data, password: e.target.value })}
            disabled={isLoading}
            suggested="current-password"
            autoComplete="current-password"
            required
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center z-10"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff /> : <Eye />}
          </button>
        </div>

        {error && <div className="text-error text-sm">{error}</div>}

        <button
          type="submit"
          className="btn btn-primary w-full"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="loading loading-ring loading-sm text-accent"></span>
          ) : (
            "Login"
          )}
        </button>
      </form>
    </fieldset>
  );
};

export default LoginForm;
