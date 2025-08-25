import { create } from "zustand";
import { persist } from "zustand/middleware";

interface EmployeeViewStore {
  isTableView: boolean;
  setIsTableView: (isTableView: boolean) => void;
}

const useEmployeeViewStore = create<EmployeeViewStore>()(
  persist(
    (set) => ({
      isTableView: true,
      setIsTableView: (isTableView) => set({ isTableView }),
    }),
    {
      name: "employee-view",
    }
  )
);

export default useEmployeeViewStore;
