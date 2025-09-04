import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type {
  PendingEmployee,
  CreatePendingEmployeeData,
} from "@/models/pending-employee-model";
import {
  fetchAllPendingEmployees,
  createPendingEmployee,
  reviewPendingEmployee,
  approvePendingEmployee,
  rejectPendingEmployee,
} from "@/models/pending-employee-model";

interface PendingEmployeeStore {
  // State
  pendingEmployees: PendingEmployee[];
  selectedPendingEmployee: PendingEmployee | null;
  loading: boolean;
  error: string | null;

  // Actions
  setPendingEmployees: (pendingEmployees: PendingEmployee[]) => void;
  setSelectedPendingEmployee: (pendingEmployee: PendingEmployee | null) => void;
  updatePendingEmployee: (updatedPendingEmployee: PendingEmployee) => void;
  addPendingEmployee: (newPendingEmployee: PendingEmployee) => void;
  removePendingEmployee: (pendingEmployeeId: number) => void;
  fetchPendingEmployees: (bustCache?: boolean) => Promise<void>;
  refetch: (bustCache?: boolean) => Promise<void>;

  // CRUD Operations
  createPendingEmployee: (
    data: CreatePendingEmployeeData
  ) => Promise<PendingEmployee>;
  reviewPendingEmployee: (id: number) => Promise<PendingEmployee>;
  approvePendingEmployee: (
    employee: PendingEmployee,
    role: string
  ) => Promise<any>;
  rejectPendingEmployee: (id: number) => Promise<string>;

  // Loading states
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const usePendingEmployeeStore = create<PendingEmployeeStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      pendingEmployees: [],
      selectedPendingEmployee: null,
      loading: false,
      error: null,

      // Set all pending employees
      setPendingEmployees: (pendingEmployees) =>
        set({ pendingEmployees }, false, "setPendingEmployees"),

      // Set selected pending employee
      setSelectedPendingEmployee: (pendingEmployee) =>
        set(
          { selectedPendingEmployee: pendingEmployee },
          false,
          "setSelectedPendingEmployee"
        ), // Update a specific pending employee in the list and selected pending employee if it matches
      updatePendingEmployee: (updatedPendingEmployee) =>
        set(
          (state) => {
            const updatedPendingEmployees = state.pendingEmployees.map((emp) =>
              emp.pending_employee_id ===
              updatedPendingEmployee.pending_employee_id
                ? updatedPendingEmployee
                : emp
            );

            const updatedSelectedPendingEmployee =
              state.selectedPendingEmployee?.pending_employee_id ===
              updatedPendingEmployee.pending_employee_id
                ? updatedPendingEmployee
                : state.selectedPendingEmployee;

            return {
              pendingEmployees: updatedPendingEmployees,
              selectedPendingEmployee: updatedSelectedPendingEmployee,
            };
          },
          false,
          "updatePendingEmployee"
        ),

      // Add new pending employee
      addPendingEmployee: (newPendingEmployee) =>
        set(
          (state) => ({
            pendingEmployees: [...state.pendingEmployees, newPendingEmployee],
          }),
          false,
          "addPendingEmployee"
        ),

      // Remove pending employee
      removePendingEmployee: (pendingEmployeeId) =>
        set(
          (state) => ({
            pendingEmployees: state.pendingEmployees.filter(
              (emp) => emp.pending_employee_id !== pendingEmployeeId
            ),
            selectedPendingEmployee:
              state.selectedPendingEmployee?.pending_employee_id ===
              pendingEmployeeId
                ? null
                : state.selectedPendingEmployee,
          }),
          false,
          "removePendingEmployee"
        ),

      // Fetch pending employees from API
      fetchPendingEmployees: async (bustCache = false) => {
        try {
          set(
            { loading: true, error: null },
            false,
            "fetchPendingEmployees:start"
          );

          const response = await fetchAllPendingEmployees(bustCache);

          set(
            {
              pendingEmployees: response.result,
              loading: false,
              error: null,
            },
            false,
            "fetchPendingEmployees:success"
          );
        } catch (error: any) {
          console.error("Error fetching pending employees:", error);
          set(
            {
              error: "Failed to fetch pending employees",
              loading: false,
            },
            false,
            "fetchPendingEmployees:error"
          );
        }
      },

      // Refetch alias for fetchPendingEmployees
      refetch: async (bustCache = false) => {
        await get().fetchPendingEmployees(bustCache);
      },

      // Create new pending employee
      createPendingEmployee: async (data: CreatePendingEmployeeData) => {
        try {
          set(
            { loading: true, error: null },
            false,
            "createPendingEmployee:start"
          );

          const response = await createPendingEmployee(data);

          // Add the new pending employee to the store
          get().addPendingEmployee(response.data);

          set({ loading: false }, false, "createPendingEmployee:success");

          return response.data;
        } catch (error: any) {
          console.error("Error creating pending employee:", error);
          set(
            {
              error: "Failed to create pending employee",
              loading: false,
            },
            false,
            "createPendingEmployee:error"
          );
          throw error;
        }
      },

      // Review pending employee
      reviewPendingEmployee: async (id: number) => {
        try {
          set(
            { loading: true, error: null },
            false,
            "reviewPendingEmployee:start"
          );

          const response = await reviewPendingEmployee(id);

          // Update the pending employee in the store
          get().updatePendingEmployee(response.employee);

          set({ loading: false }, false, "reviewPendingEmployee:success");

          return response.employee;
        } catch (error: any) {
          console.error(
            "Error reviewing pending employee:",
            error.response.data.error
          );
          set(
            {
              error: "Failed to review pending employee",
              loading: false,
            },
            false,
            "reviewPendingEmployee:error"
          );
          throw error;
        }
      },

      // Approve pending employee
      approvePendingEmployee: async (
        employee: PendingEmployee,
        role: string
      ) => {
        try {
          set(
            { loading: true, error: null },
            false,
            "approvePendingEmployee:start"
          );

          const response = await approvePendingEmployee(employee, role);
          // Remove the pending employee from the store since it's now approved
          get().removePendingEmployee(employee.pending_employee_id);

          set({ loading: false }, false, "approvePendingEmployee:success");

          return response.data;
        } catch (error: any) {
          console.error("Error approving pending employee:", error);
          set(
            {
              error: "Failed to approve pending employee",
              loading: false,
            },
            false,
            "approvePendingEmployee:error"
          );
          throw error;
        }
      },

      // Reject pending employee
      rejectPendingEmployee: async (id: number) => {
        try {
          set(
            { loading: true, error: null },
            false,
            "rejectPendingEmployee:start"
          );

          const response = await rejectPendingEmployee(id);

          // Remove the pending employee from the store since it's rejected
          get().removePendingEmployee(id);

          set({ loading: false }, false, "rejectPendingEmployee:success");

          return response.message;
        } catch (error: any) {
          console.error("Error rejecting pending employee:", error);
          set(
            {
              error: "Failed to reject pending employee",
              loading: false,
            },
            false,
            "rejectPendingEmployee:error"
          );
          throw error;
        }
      },

      // Loading state setters
      setLoading: (loading) => set({ loading }, false, "setLoading"),

      setError: (error) => set({ error }, false, "setError"),
    }),
    {
      name: "pending-employee-store", // Persist name for devtools
    }
  )
);

// Selector hooks for better performance with proper memoization
export const usePendingEmployees = () =>
  usePendingEmployeeStore((state) => state.pendingEmployees);
export const useSelectedPendingEmployee = () =>
  usePendingEmployeeStore((state) => state.selectedPendingEmployee);
export const usePendingEmployeeLoading = () =>
  usePendingEmployeeStore((state) => state.loading);
export const usePendingEmployeeError = () =>
  usePendingEmployeeStore((state) => state.error);

// Individual action hooks to prevent re-renders
export const useFetchPendingEmployees = () =>
  usePendingEmployeeStore((state) => state.fetchPendingEmployees);
export const useUpdatePendingEmployee = () =>
  usePendingEmployeeStore((state) => state.updatePendingEmployee);
export const useSetSelectedPendingEmployee = () =>
  usePendingEmployeeStore((state) => state.setSelectedPendingEmployee);
export const useCreatePendingEmployee = () =>
  usePendingEmployeeStore((state) => state.createPendingEmployee);
export const useReviewPendingEmployee = () =>
  usePendingEmployeeStore((state) => state.reviewPendingEmployee);
export const useApprovePendingEmployee = () =>
  usePendingEmployeeStore((state) => state.approvePendingEmployee);
export const useRejectPendingEmployee = () =>
  usePendingEmployeeStore((state) => state.rejectPendingEmployee);
