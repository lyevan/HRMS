import { create } from "zustand";
import { persist } from "zustand/middleware";

const useThemeStore = create(
  persist(
    (set) => ({
      //black for dark mode, lofi for light mode
      theme: "hr-corporate-light",
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: "theme-storage", // unique name
      getStorage: () => localStorage, // (optional) by default the 'localStorage' is used
    }
  )
);
export const useTheme = () => {
  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);

  return { theme, setTheme };
};
