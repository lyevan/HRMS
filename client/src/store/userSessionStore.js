import { create } from "zustand";
import axios from "axios";

const useUserSessionStore = create((set, get) => ({
  user: null,
  isLoading: true,

  setUser: (userData) => set({ user: userData }),

  clearUser: () => set({ user: null }),

  login: (userData) => {
    set({ user: userData });
  },

  logout: async () => {
    try {
      await axios.post("/users/logout");
    } catch (error) {
      console.error("Logout error:", error);
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
    ];
    const currentPath = window.location.pathname;

    // Skip auth check for excluded paths
    if (excludedPaths.some((path) => currentPath.startsWith(path))) {
      set({ isLoading: false });
      return;
    }

    set({ isLoading: true });
    try {
      const response = await axios.post("/users/verify");
      if (response.data && response.data.success) {
        // Store fresh user data from database verification
        set({ user: response.data.user, isLoading: false });
      } else {
        console.log("No user data in response");
        set({ user: null, isLoading: false });
      }
    } catch (error) {
      console.log("User not authenticated:", error.message);

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
  hasRole: (requiredRole) => {
    const { user } = get();
    // Only use the user data that was verified from the database
    // This ensures we're checking against fresh, server-validated role data
    return user?.role === requiredRole;
  },

  // Enhanced role validation that forces fresh server check
  validateRole: async (requiredRole) => {
    try {
      const response = await axios.post("/users/verify");
      if (response.data && response.data.success) {
        const serverUser = response.data.user;
        // Update local state with fresh server data
        set({ user: serverUser });
        return serverUser?.role === requiredRole;
      }
      return false;
    } catch (error) {
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
