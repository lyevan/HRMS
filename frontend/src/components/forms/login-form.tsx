import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Mail,
  LockKeyhole,
  UserRound,
  LucideEyeClosed,
  LucideEye,
} from "lucide-react";
import { useState } from "react";
import { useNavigate, Navigate } from "react-router";
import axios from "axios";
import { useUserSessionStore } from "@/store/userSessionStore";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
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

      if (!userData) {
        throw new Error("Invalid response from server");
      }

      // Store user in Zustand
      login(userData);

      // Navigate based on role
      if (userData.role === "admin") {
        navigate("/dashboard/admin");
       
      } else if (userData.role === "staff") {
        navigate("/dashboard/staff");

      } else if (userData.role === "employee") {
        navigate("/dashboard/employee");
     
      } else {
        // Fallback for unknown roles
        navigate("/dashboard/employee");
    
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
  return (
    <form
      className={cn(
        "flex flex-col gap-6 border border-secondary/50 shadow-xs shadow-secondary drop rounded p-4",
        className
      )}
      {...props}
      onSubmit={(e) => {
        e.preventDefault();
        handleLogin();
      }}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-xl font-[Lato] font-bold self-start 2xl:text-2xl">
          Login to your Account
        </h1>
      </div>
      <div className="grid gap-2 font-[Lato]">
        <div className="grid gap-3">
          <Label htmlFor="username" className="font-normal 2xl:text-lg">
            Username
          </Label>
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
              className="pl-12 pr-3 py-2 text-md w-full border border-secondary rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-[#6E23DD] focus:border-transparent 2xl:text-lg 2xl:h-12"
              required
              autoComplete="none"
            />
          </label>
        </div>
        <div className="grid gap-3">
          <div className="flex items-center">
            <Label htmlFor="password" className="font-normal 2xl:text-lg">
              Password
            </Label>
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
              className="pl-12 pr-3 py-2  text-md w-full border border-secondary rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-[#6E23DD] focus:border-transparent 2xl:text-lg 2xl:h-12"
              autoComplete="none"
            />
          </label>
        </div>
        <a
          href="#"
          className="ml-auto text-xs font-bold underline-offset-4 underline 2xl:text-sm"
        >
          Forgot Password?
        </a>
        {error && (
          <div className="text-red-500 text-sm text-center">{error}</div>
        )}
        <Button
          type="submit"
          className="w-full font-bold 2xl:text-lg 2xl:h-12 "
          disabled={isLoading}
        >
          {isLoading ? "Logging in..." : "Login"}
        </Button>
        <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
          <span className="bg-background text-foreground font-bold relative z-10 px-2 2xl:text-base">
            Or
          </span>
        </div>
        <Button
          variant="outline"
          className="w-full bg-secondary text-secondary-foreground font-bold 2xl:text-lg 2xl:h-12"
        >
          <Mail />
          Sign in with Email
        </Button>
      </div>
    </form>
  );
}
