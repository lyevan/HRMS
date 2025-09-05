import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Department } from "@/models/department-model";
import {
  fetchAllDepartments,
  fetchDepartmentById,
} from "@/models/department-model";

interface DepartmentStore {
  // State
  departments: Department[];
  selectedDepartment: Department | null;
  loading: boolean;
  error: string | null;

  // Actions
  setDepartments: (departments: Department[]) => void;
  setSelectedDepartment: (department: Department | null) => void;
  updateDepartment: (updatedDepartment: Department) => void;
  addDepartment: (newDepartment: Department) => void;
  removeDepartment: (departmentId: number) => void;
  fetchDepartments: (bustCache?: boolean) => Promise<void>;
  fetchDepartmentNameById: (departmentId: number) => Promise<string | null>;
  refetch: (bustCache?: boolean) => Promise<void>;

  // Loading states
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useDepartmentStore = create<DepartmentStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      departments: [],
      selectedDepartment: null,
      loading: false,
      error: null,

      // Set all departments
      setDepartments: (departments) =>
        set({ departments }, false, "setDepartments"),

      // Set selected department
      setSelectedDepartment: (department) =>
        set({ selectedDepartment: department }, false, "setSelectedDepartment"),

      // Update a specific department in the list and selected department if it matches
      updateDepartment: (updatedDepartment) =>
        set(
          (state) => {
            const updatedDepartments = state.departments.map((dept) =>
              dept.department_id === updatedDepartment.department_id
                ? updatedDepartment
                : dept
            );

            return {
              departments: updatedDepartments,
              selectedDepartment:
                state.selectedDepartment?.department_id ===
                updatedDepartment.department_id
                  ? updatedDepartment
                  : state.selectedDepartment,
            };
          },
          false,
          "updateDepartment"
        ),

      // Add new department
      addDepartment: (newDepartment) =>
        set(
          (state) => ({
            departments: [...state.departments, newDepartment],
          }),
          false,
          "addDepartment"
        ),

      // Remove department
      removeDepartment: (departmentId) =>
        set(
          (state) => ({
            departments: state.departments.filter(
              (dept) => dept.department_id !== departmentId
            ),
            selectedDepartment:
              state.selectedDepartment?.department_id === departmentId
                ? null
                : state.selectedDepartment,
          }),
          false,
          "removeDepartment"
        ), // Fetch departments from API
      fetchDepartments: async (_bustCache = false) => {
        // _bustCache parameter reserved for future cache invalidation
        try {
          set({ loading: true, error: null }, false, "fetchDepartments:start");

          const response = await fetchAllDepartments();

          set(
            {
              departments: response.result,
              loading: false,
              error: null,
            },
            false,
            "fetchDepartments:success"
          );
        } catch (error: any) {
          console.error("Error fetching departments:", error);
          set(
            {
              error: "Failed to fetch departments",
              loading: false,
            },
            false,
            "fetchDepartments:error"
          );
        }
      },

      // Fetch department name by ID
      fetchDepartmentNameById: async (departmentId) => {
        const response = await fetchDepartmentById(departmentId);
        return response?.name || null;
      },

      // Refetch (alias for fetchDepartments)
      refetch: async (bustCache = false) => {
        await get().fetchDepartments(bustCache);
      },

      // Loading state setters
      setLoading: (loading) => set({ loading }, false, "setLoading"),

      setError: (error) => set({ error }, false, "setError"),
    }),
    {
      name: "department-store", // Persist name for devtools
    }
  )
);

// Selector hooks for better performance
export const useDepartments = () =>
  useDepartmentStore((state) => state.departments);
export const useSelectedDepartment = () =>
  useDepartmentStore((state) => state.selectedDepartment);
export const useDepartmentLoading = () =>
  useDepartmentStore((state) => state.loading);
export const useDepartmentError = () =>
  useDepartmentStore((state) => state.error);

// Individual action hooks to prevent re-renders
export const useFetchDepartments = () =>
  useDepartmentStore((state) => state.fetchDepartments);
export const useUpdateDepartment = () =>
  useDepartmentStore((state) => state.updateDepartment);
export const useSetSelectedDepartment = () =>
  useDepartmentStore((state) => state.setSelectedDepartment);
export const useFetchDepartmentNameById = () =>
  useDepartmentStore((state) => state.fetchDepartmentNameById);
