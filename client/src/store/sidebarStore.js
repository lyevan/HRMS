import { create } from "zustand";
import { persist } from "zustand/middleware";

const sidebarStore = (set) => ({
  isSidebarSmall: false,
  toggleSidebar: () =>
    set((state) => ({ isSidebarSmall: !state.isSidebarSmall })),
});

export const useSidebarStore = create(
  persist(sidebarStore, {
    name: "sidebar-storage", // unique name
  })
);
export const useSidebar = () => {
  const { isSidebarSmall, toggleSidebar } = useSidebarStore();
  return { isSidebarSmall, toggleSidebar };
};