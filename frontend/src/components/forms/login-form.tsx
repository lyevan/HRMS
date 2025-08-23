import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

import {
  Mail,
  LockKeyhole,
  UserRound,
  LucideEyeClosed,
  LucideEye,
  Check,
  ChevronLeft,
} from "lucide-react";
import { useState } from "react";
import { useNavigate, Navigate } from "react-router";
import axios from "axios";
import { useUserSessionStore } from "@/store/userSessionStore";
import Spinner from "../spinner";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [email, setEmail] = useState("");
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [otpFormData, setOtpFormData] = useState({
    email: "",
    otp: "",
  });
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isEmailLogin, setIsEmailLogin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { login, isAuthenticated, user } = useUserSessionStore();
  const navigate = useNavigate();

  // Redirect if already authenticated
  if (isAuthenticated()) {
    if (user?.role === "admin") {
      return <Navigate to="/app/admin" replace />;
    } else if (user?.role === "staff") {
      return <Navigate to="/app/staff" replace />;
    } else if (user?.role === "employee") {
      return <Navigate to="/app/employee" replace />;
    }
    // Fallback redirect
    return <Navigate to="/auth" replace />;
  }

  const handleLogin = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await axios.post("/users/login", {
        username: formData.username,
        password: formData.password,
      });

      // Extract user data from response
      const userData = response.data.user;
      const employeeData = response.data.employee;

      if (!userData) {
        throw new Error("Invalid response from server");
      }

      // Store user in Zustand
      login(userData, employeeData);

      console.log("User logged in:", userData); // Navigate based on role
      if (userData.role === "admin") {
        navigate("/app/admin");
      } else if (userData.role === "staff") {
        navigate("/app/staff");
      } else if (userData.role === "employee") {
        navigate("/app/employee");
      } else {
        // Fallback for unknown roles
        navigate("/app/employee");
      }
    } catch (error) {
      console.error("Login failed:", error);
      setError(
        (typeof error === "object" &&
          error !== null &&
          "response" in error &&
          (error as any).response?.data?.message) ||
          "Login failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpLogin = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await axios.post("/users/verify-otp", {
        email: otpFormData.email,
        otp: otpFormData.otp,
      });

      // Extract user data from response
      const userData = response.data.user;
      const employeeData = response.data.employee;

      if (!userData) {
        throw new Error("Invalid response from server");
      }

      // Store user in Zustand
      login(userData, employeeData);

      if (userData.role === "admin") {
        navigate("/app/admin");
      } else if (userData.role === "staff") {
        navigate("/app/staff");
      } else if (userData.role === "employee") {
        navigate("/app/employee");
      } else {
        // Fallback for unknown roles
        navigate("/app/employee");
      }
    } catch (error) {
      console.error("OTP login failed:", error);
      setError(
        (typeof error === "object" &&
          error !== null &&
          "response" in error &&
          (error as any).response?.data?.message) ||
          "OTP login failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSend = async () => {
    try {
      setIsLoading(true);
      const response = await axios.post("/users/send-otp", {
        email,
      });
      if (response.data.success) {
        setIsEmailSent(true);
        setOtpFormData({ ...otpFormData, email });
        setError("");
      } else {
        throw new Error("Failed to send OTP");
      }
    } catch (error) {
      console.error("Error sending email:", error);
      setError(
        (typeof error === "object" &&
          error !== null &&
          "response" in error &&
          (error as any).response?.data?.message) ||
          "Failed to send email. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      {...props}
      onSubmit={(e) => {
        e.preventDefault();
        handleLogin();
      }}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <h1
          className={`text-2xl font-medium font-[Lato] flex flex-row items-center w-full ${
            isEmailLogin ? "justify-start" : "justify-center"
          }`}
        >
          {isEmailLogin && (
            <span
              className="justify-self-start mr-6"
              onClick={() => setIsEmailLogin(false)}
            >
              <ChevronLeft />
            </span>
          )}
          Login to your account
        </h1>
        <p className="text-muted-foreground text-sm text-balance">
          Enter your {isEmailLogin ? "email" : "username"} below to login to
          your account
        </p>
      </div>
      {!isEmailLogin ? (
        <div className="grid gap-6">
          <div className="grid gap-3">
            <Label htmlFor="username">Username</Label>
            <label className="relative h-10 w-full flex flex-col items-center justify-center">
              <UserRound className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10" />
              <Input
                id="username"
                type="text"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                placeholder="Enter your username"
                className="pl-12 pr-3 font-[Lato] py-2 text-md w-full border border-primary/40 rounded shadow-sm focus:outline-none focus:ring-1"
                required
              />
            </label>
          </div>
          <div className="grid gap-3">
            <div className="flex items-center">
              <Label htmlFor="password">Password</Label>
              <a
                href="#"
                className="ml-auto text-sm underline-offset-4 hover:underline"
              >
                Forgot your password?
              </a>
            </div>
            <label className="relative h-10 w-full flex flex-col items-center justify-center">
              <LockKeyhole className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10" />
              {!isPasswordVisible ? (
                <LucideEyeClosed
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 z-10"
                  onClick={() => setIsPasswordVisible(true)}
                />
              ) : (
                <LucideEye
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 z-10"
                  onClick={() => setIsPasswordVisible(false)}
                />
              )}
              <Input
                id="password"
                type={isPasswordVisible ? "text" : "password"}
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
                placeholder="Enter your password"
                className="pl-12 pr-3 font-[Lato] py-2 text-md w-full border border-primary/40 rounded shadow-sm focus:outline-none focus:ring-1"
              />
            </label>
          </div>
          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}
          <Button
            type="submit"
            className="w-full cursor-pointer"
            disabled={isLoading}
          >
            {isLoading ? "Logging in..." : "Login"}
          </Button>
          <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
            <span className="bg-background text-muted-foreground relative z-10 px-2">
              Or continue with
            </span>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 w-full">
          <div className="grid gap-3 w-full">
            <Label htmlFor="email">Email</Label>
            <label className="relative h-10 w-full flex flex-col items-center justify-center">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10" />
              {!isEmailSent ? (
                <div
                  className="absolute cursor-pointer font-[Lato] font-bold text-sm right-3 top-1/2 transform -translate-y-1/2 z-10 align-middle text-primary"
                  onClick={() => {
                    handleEmailSend();
                  }}
                >
                  {isLoading ? <Spinner /> : "Send OTP"}
                </div>
              ) : (
                <div
                  className="absolute cursor-pointer font-[Lato] font-bold text-sm right-3 top-1/2 transform -translate-y-1/2 z-10 align-middle text-primary"
                  onClick={() => {
                    handleEmailSend();
                  }}
                >
                  <Check className="inline mr-1 text-primary" />
                </div>
              )}
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="pl-12 pr-3 font-[Lato] py-2 text-md w-full border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-1"
                required
              ></Input>
            </label>
            {isEmailSent && (
              <div className="flex flex-col items-center justify-center w-full">
                <h1 className="font-normal font-[Lato] my-4">
                  Enter the OTP sent to your email
                </h1>
                <InputOTP
                  maxLength={6}
                  pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
                  required
                  value={otpFormData.otp}
                  onChange={(value) =>
                    setOtpFormData({ ...otpFormData, otp: value })
                  }
                >
                  <InputOTPGroup>
                    <InputOTPSlot
                      index={0}
                      className="border-b-4 border-primary border-b-primary focus:bg-primary"
                    />

                    <InputOTPSlot
                      index={1}
                      className="border-b-4 border-primary border-b-primary"
                    />
                    <InputOTPSlot
                      index={2}
                      className="border-b-4 border-primary border-b-primary"
                    />
                    <InputOTPSlot
                      index={3}
                      className="border-b-4 border-primary border-b-primary"
                    />
                    <InputOTPSlot
                      index={4}
                      className="border-b-4 border-primary border-b-primary"
                    />
                    <InputOTPSlot
                      index={5}
                      className="border-b-4 border-primary border-b-primary"
                    />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            )}
          </div>
          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}
        </div>
      )}

      {!isEmailLogin ? (
        <Button
          variant="outline"
          className="w-full border-primary hover:bg-primary/10 cursor-pointer"
          onClick={() => {
            setIsEmailLogin(!isEmailLogin);
            setFormData({ username: "", password: "" });
          }}
        >
          <Mail />
          Login with Email
        </Button>
      ) : (
        <Button
          variant="outline"
          className="w-full bg-primary text-primary-foreground hover:text-primary-foreground hover:bg-primary/90 cursor-pointer"
          disabled={!isEmailSent || isLoading || !otpFormData.otp}
          onClick={() => {
            handleOtpLogin();
          }}
        >
          <Mail />
          Login with Email
        </Button>
      )}
    </form>
  );
}
