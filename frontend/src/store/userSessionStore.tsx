import { create } from "zustand";
import axios from "axios";
import { toast } from "sonner";
import config from "@/lib/config";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  // Add other user properties as needed
}

interface UserSessionStore {
  user: User | null;
  isLoading: boolean;
  setUser: (userData: User) => void;
  clearUser: () => void;
  login: (userData: User) => void;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
  hasRole: (requiredRole: string) => boolean;
  validateRole: (requiredRole: string) => Promise<boolean>;
  isAuthenticated: () => boolean;
  initialize: () => Promise<void>;
}

const useUserSessionStore = create<UserSessionStore>((set, get) => ({
  user: null,
  isLoading: true,

  setUser: (userData: User) => set({ user: userData }),

  clearUser: () => set({ user: null }),

  login: (userData: User) => {
    set({ user: userData });
    toast.success("Login successful!");
  },

  logout: async () => {
    try {
      await axios.post("/users/logout");
      toast.success("Logout successful!");
    } catch (error: any) {
      console.error("Logout error:", error);
      toast.error("Logout failed. Please try again.");
    } finally {
      set({ user: null });
    }
  },
  checkAuthStatus: async () => {
    // Define paths that don't require authentication
    const excludedPaths = [
      "/complete-registration",
      "/unauthorized",
      "/public",
      "/reset-password",
      "/home",
      "/about",
      "/services",
      "/pricing",
      "/testimonials",
      "/contact", 
    ];
    const currentPath = window.location.pathname;

    // Skip auth check for excluded paths
    if (excludedPaths.some((path) => currentPath.startsWith(path))) {
      set({ isLoading: false });
      return;
    }

    set({ isLoading: true });
    try {
      // Add debug logging for production
      if (config.isProduction) {
        console.log("Production auth check:", {
          baseURL: axios.defaults.baseURL,
          withCredentials: axios.defaults.withCredentials,
          currentPath,
        });
      }

      const response = await axios.post(
        "/users/verify",
        {},
        {
          timeout: 10000, // 10 second timeout
          withCredentials: true, // Ensure credentials are sent
        }
      );

      if (response.data && response.data.success) {
        // Store fresh user data from database verification
        set({ user: response.data.user, isLoading: false });
        if (config.isProduction) {
          console.log("Production auth success:", response.data.user.role);
        }
      } else {
        console.log("No user data in response");
        set({ user: null, isLoading: false });
      }
    } catch (error: any) {
      console.log("User not authenticated:", error.message);

      // Enhanced error logging for production debugging
      if (config.isProduction) {
        console.error("Production auth error details:", {
          status: error.response?.status,
          message: error.response?.data?.message || error.message,
          baseURL: axios.defaults.baseURL,
          withCredentials: axios.defaults.withCredentials,
        });
      }

      // Check if it's a role mismatch requiring re-authentication
      if (error.response?.data?.requiresReauth) {
        console.log("Role mismatch detected - forcing logout");
        // Force logout and redirect
        await get().logout();
        window.location.href = "/auth";
        return;
      }

      set({ user: null, isLoading: false });
    }
  },
  hasRole: (requiredRole: string) => {
    const { user } = get();
    // Only use the user data that was verified from the database
    // This ensures we're checking against fresh, server-validated role data
    return user?.role === requiredRole;
  },

  // Enhanced role validation that forces fresh server check
  validateRole: async (requiredRole: string) => {
    try {
      const response = await axios.post("/users/verify");
      if (response.data && response.data.success) {
        const serverUser: User = response.data.user;
        // Update local state with fresh server data
        set({ user: serverUser });
        return serverUser?.role === requiredRole;
      }
      return false;
    } catch (error: any) {
      console.log("Role validation failed:", error.message);
      if (error.response?.data?.requiresReauth) {
        await get().logout();
        window.location.href = "/auth";
      }
      set({ user: null });
      return false;
    }
  },

  isAuthenticated: () => {
    const { user } = get();
    return !!user;
  },

  initialize: async () => {
    const { checkAuthStatus } = get();
    await checkAuthStatus();
  },
}));

export { useUserSessionStore };
