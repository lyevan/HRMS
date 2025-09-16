import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Employee } from "@/models/employee-model";
import { fetchAllEmployees } from "@/models/employee-model";

interface EmployeeStore {
  // State
  employees: Employee[];
  selectedEmployee: Employee | null;
  loading: boolean;
  error: string | null;

  // Actions
  setEmployees: (employees: Employee[]) => void;
  setSelectedEmployee: (employee: Employee | null) => void;
  updateEmployee: (updatedEmployee: Employee) => void;
  addEmployee: (newEmployee: Employee) => void;
  removeEmployee: (employeeId: string) => void;
  bulkDeleteEmployees: (employees: Employee[]) => Promise<void>;
  fetchEmployees: (bustCache?: boolean) => Promise<void>;
  refetch: (bustCache?: boolean) => Promise<void>;

  // Loading states
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useEmployeeStore = create<EmployeeStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      employees: [],
      selectedEmployee: null,
      loading: false,
      error: null,

      // Set all employees
      setEmployees: (employees) => set({ employees }, false, "setEmployees"),

      // Set selected employee
      setSelectedEmployee: (employee) =>
        set({ selectedEmployee: employee }, false, "setSelectedEmployee"),

      // Update a specific employee in the list and selected employee if it matches
      updateEmployee: (updatedEmployee) =>
        set(
          (state) => {
            const updatedEmployees = state.employees.map((emp) =>
              emp.employee_id === updatedEmployee.employee_id
                ? updatedEmployee
                : emp
            );

            const updatedSelectedEmployee =
              state.selectedEmployee?.employee_id ===
              updatedEmployee.employee_id
                ? updatedEmployee
                : state.selectedEmployee;

            return {
              employees: updatedEmployees,
              selectedEmployee: updatedSelectedEmployee,
            };
          },
          false,
          "updateEmployee"
        ),

      // Add new employee
      addEmployee: (newEmployee) =>
        set(
          (state) => ({
            employees: [...state.employees, newEmployee],
          }),
          false,
          "addEmployee"
        ),

      // Remove employee
      removeEmployee: (employeeId) =>
        set(
          (state) => ({
            employees: state.employees.filter(
              (emp) => emp.employee_id !== employeeId
            ),
            selectedEmployee:
              state.selectedEmployee?.employee_id === employeeId
                ? null
                : state.selectedEmployee,
          }),
          false,
          "removeEmployee"
        ),

      // Bulk delete employees
      bulkDeleteEmployees: async (employeesToDelete) => {
        try {
          set(
            { loading: true, error: null },
            false,
            "bulkDeleteEmployees:start"
          );

          // TODO: Replace with actual API call for bulk delete
          const deletePromises = employeesToDelete.map(async (_employee) => {
            // Simulated API call - replace with actual bulk delete endpoint
            return new Promise((resolve) => setTimeout(resolve, 100));
          });

          await Promise.all(deletePromises);

          // Remove deleted employees from state
          const deletedIds = employeesToDelete.map((emp) => emp.employee_id);
          set(
            (state) => ({
              employees: state.employees.filter(
                (emp) => !deletedIds.includes(emp.employee_id)
              ),
              selectedEmployee: deletedIds.includes(
                state.selectedEmployee?.employee_id || ""
              )
                ? null
                : state.selectedEmployee,
              loading: false,
              error: null,
            }),
            false,
            "bulkDeleteEmployees:success"
          );
        } catch (error: any) {
          console.error("Error bulk deleting employees:", error);
          set(
            {
              error: "Failed to delete employees",
              loading: false,
            },
            false,
            "bulkDeleteEmployees:error"
          );
          throw error; // Re-throw to handle in UI
        }
      },

      // Fetch employees from API
      fetchEmployees: async (bustCache = false) => {
        try {
          set({ loading: true, error: null }, false, "fetchEmployees:start");

          const response = await fetchAllEmployees(bustCache);

          set(
            {
              employees: response.results,
              loading: false,
              error: null,
            },
            false,
            "fetchEmployees:success"
          );
        } catch (error: any) {
          console.error("Error fetching employees:", error);
          set(
            {
              error: "Failed to fetch employees",
              loading: false,
            },
            false,
            "fetchEmployees:error"
          );
        }
      },

      // Refetch alias for fetchEmployees
      refetch: async (bustCache = false) => {
        await get().fetchEmployees(bustCache);
      },

      // Loading state setters
      setLoading: (loading) => set({ loading }, false, "setLoading"),

      setError: (error) => set({ error }, false, "setError"),
    }),
    {
      name: "employee-store", // Persist name for devtools
    }
  )
);

// FIXED: Selector hooks for better performance with proper memoization
export const useEmployees = () => useEmployeeStore((state) => state.employees);
export const useSelectedEmployee = () =>
  useEmployeeStore((state) => state.selectedEmployee);
export const useEmployeeLoading = () =>
  useEmployeeStore((state) => state.loading);
export const useEmployeeError = () => useEmployeeStore((state) => state.error);

// FIXED: Individual action hooks to prevent re-renders
export const useFetchEmployees = () =>
  useEmployeeStore((state) => state.fetchEmployees);
export const useUpdateEmployee = () =>
  useEmployeeStore((state) => state.updateEmployee);
export const useSetSelectedEmployee = () =>
  useEmployeeStore((state) => state.setSelectedEmployee);
