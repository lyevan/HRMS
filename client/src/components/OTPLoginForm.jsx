import React, { useState, useEffect } from "react";
import { useUserSessionStore } from "../store/userSessionStore";
import axios from "axios";
import { Navigate, useNavigate } from "react-router";
import { Mail, ArrowLeft } from "lucide-react";
import useToastStore from "../store/toastStore";
import LoadingSpinner from "./LoadingSpinner";

const OTPLoginForm = () => {
  const { login, isAuthenticated, user } = useUserSessionStore();
  const navigate = useNavigate();
  const { showToast } = useToastStore();

  const [step, setStep] = useState("email"); // 'email' or 'otp'
  const [email, setEmail] = useState("");
  const [otp, setOTP] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState("");

  // Redirect if already authenticated
  if (isAuthenticated()) {
    if (user?.role === "admin") {
      return <Navigate to="/dashboard/admin" replace />;
    } else if (user?.role === "staff") {
      return <Navigate to="/dashboard/staff" replace />;
    } else if (user?.role === "employee") {
      return <Navigate to="/dashboard/employee" replace />;
    }
    return <Navigate to="/auth" replace />;
  }

  // Countdown timer for OTP expiration
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Step 1: Send OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setError("");

    try {
      const response = await axios.post("/users/send-otp", { email });

      if (response.data.success) {
        showToast("OTP sent to your email!", "success");
        setStep("otp");
        setCountdown(600); // 10 minutes
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to send OTP";
      setError(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP and Login
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!email || !otp || otp.length !== 6) return;

    setIsLoading(true);
    setError("");

    try {
      const response = await axios.post("/users/verify-otp", {
        email,
        otp,
      });

      if (response.data.success) {
        const userData = response.data.user;

        if (!userData) {
          throw new Error("Invalid response from server");
        }

        // Store user in Zustand (same as regular login)
        login(userData);

        // Navigate based on role (same as regular login)
        if (userData.role === "admin") {
          navigate("/dashboard/admin");
        } else if (userData.role === "staff") {
          navigate("/dashboard/staff");
        } else if (userData.role === "employee") {
          navigate("/dashboard/employee");
        } else {
          navigate("/dashboard/employee");
        }

        showToast("Login successful!", "success");
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Invalid or expired OTP";
      setError(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 540) return; // Can only resend after 1 minute
    await handleSendOTP({ preventDefault: () => {} });
  };

  const goBackToEmail = () => {
    setStep("email");
    setOTP("");
    setError("");
    setCountdown(0);
  };

  const goBackToLogin = () => {
    navigate("/auth");
  };

  if (step === "email") {
    return (
      <fieldset className="fieldset bg-base-200 border-base-300 rounded-box w-xs border p-4">
        <form
          className="form-control w-full max-w-xs flex flex-col gap-2"
          onSubmit={handleSendOTP}
        >
          <div className="flex items-center gap-2 mb-2">
            <button
              type="button"
              onClick={goBackToLogin}
              className="btn btn-ghost btn-sm btn-circle"
            >
              <ArrowLeft size={18} />
            </button>
            <h2 className="text-lg font-semibold">Login with Email</h2>
          </div>

          <label className="label text-base-content">Email Address</label>
          <div className="relative">
            <input
              type="email"
              className="input pl-10"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
              autoComplete="email"
            />
            <Mail
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content opacity-70"
              size={18}
            />
          </div>

          {error && <div className="text-error text-sm">{error}</div>}

          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={isLoading || !email}
          >
            {isLoading ? <LoadingSpinner /> : "Send OTP"}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={goBackToLogin}
              className="link link-primary text-sm"
            >
              Back to Username Login
            </button>
          </div>
        </form>
      </fieldset>
    );
  }

  return (
    <fieldset className="fieldset bg-base-200 border-base-300 rounded-box w-xs border p-4">
      <form
        className="form-control w-full max-w-xs flex flex-col gap-2"
        onSubmit={handleVerifyOTP}
      >
        <div className="flex items-center gap-2 mb-2">
          <button
            type="button"
            onClick={goBackToEmail}
            className="btn btn-ghost btn-sm btn-circle"
          >
            <ArrowLeft size={18} />
          </button>
          <h2 className="text-lg font-semibold">Enter OTP</h2>
        </div>

        <div className="text-sm text-base-content opacity-70 mb-2">
          OTP sent to: <span className="font-medium">{email}</span>
        </div>

        <label className="label text-base-content">6-Digit OTP</label>
        <input
          type="text"
          className="input text-center text-2xl tracking-widest font-mono"
          placeholder="123456"
          value={otp}
          onChange={(e) =>
            setOTP(e.target.value.replace(/\D/g, "").slice(0, 6))
          }
          maxLength={6}
          disabled={isLoading}
          required
          autoComplete="one-time-code"
        />

        {countdown > 0 && (
          <div className="text-sm text-base-content opacity-70 text-center">
            OTP expires in:{" "}
            <span className="font-medium text-warning">
              {formatTime(countdown)}
            </span>
          </div>
        )}

        {countdown === 0 && (
          <div className="text-sm text-error text-center">
            OTP has expired. Please request a new one.
          </div>
        )}

        {error && <div className="text-error text-sm">{error}</div>}

        <button
          type="submit"
          className="btn btn-primary w-full"
          disabled={isLoading || otp.length !== 6 || countdown === 0}
        >
          {isLoading ? <LoadingSpinner /> : "Verify & Login"}
        </button>

        <button
          type="button"
          onClick={handleResendOTP}
          className="btn btn-ghost w-full"
          disabled={isLoading || countdown > 540} // Can resend after 1 minute
        >
          {countdown > 540
            ? `Resend in ${formatTime(countdown - 540)}`
            : "Resend OTP"}
        </button>

        <div className="text-center">
          <button
            type="button"
            onClick={goBackToLogin}
            className="link link-primary text-sm"
          >
            Back to Username Login
          </button>
        </div>
      </form>
    </fieldset>
  );
};

export default OTPLoginForm;
