import { create } from "zustand";

const useToastStore = create((set, get) => ({
  message: "",
  type: "info", // can be "success", "error", "warning", etc.
  isVisible: false,
  timeoutId: null,
  hideToast: () => {
    const { timeoutId } = get();
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    set({ isVisible: false, message: "", type: "info", timeoutId: null });
  },
  showToast: (message, type = "info") => {
    // If a toast is already visible, hide it first to cleanup state, then show the new one and reset the timer
    const { timeoutId, isVisible } = get();
    
    // Clear any existing timeout to prevent conflicts
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    // If a toast is already visible, briefly hide it for smooth transition
    if (isVisible) {
      set({ isVisible: false });
      // Small delay to allow CSS transition to complete
      setTimeout(() => {
        set({ message, type, isVisible: true });
      }, 100);
    } else {
      set({ message, type, isVisible: true });
    }
    
    // Set new timeout and store its ID for cleanup
    const newTimeoutId = setTimeout(() => {
      set({ isVisible: false, message: "", type: "info", timeoutId: null });
    }, 5000); // Hide after 5 seconds
    
    set({ timeoutId: newTimeoutId });
  },
}));

export default useToastStore;
