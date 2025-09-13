import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type {
  LeaveRequest,
  LeaveType,
  LeaveBalance,
  FileLeaveFormData,
  ApprovalFormData,
  RejectionFormData,
} from "@/models/leave-model";
import {
  fetchAllLeaveRequests,
  fetchLeaveTypes,
  fetchEmployeeLeaveBalance,
  fileLeaveRequest,
  approveLeaveRequest,
  rejectLeaveRequest,
  cancelLeaveRequest,
} from "@/models/leave-model";

interface LeaveStore {
  // State
  leaveRequests: LeaveRequest[];
  leaveTypes: LeaveType[];
  leaveBalances: LeaveBalance[];
  selectedRequest: LeaveRequest | null;
  loading: boolean;
  error: string | null;

  // Loading states for specific operations
  submittingRequest: boolean;
  approvingRequest: boolean;
  rejectingRequest: boolean;

  // Actions
  setLeaveRequests: (requests: LeaveRequest[]) => void;
  setLeaveTypes: (types: LeaveType[]) => void;
  setLeaveBalances: (balances: LeaveBalance[]) => void;
  setSelectedRequest: (request: LeaveRequest | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // API Actions
  fetchLeaveRequests: () => Promise<void>;
  fetchLeaveTypes: () => Promise<void>;
  fetchEmployeeLeaveBalance: (employeeId: string) => Promise<void>;
  fileLeaveRequest: (data: FileLeaveFormData) => Promise<void>;
  approveLeaveRequest: (
    requestId: number,
    data: ApprovalFormData
  ) => Promise<void>;
  rejectLeaveRequest: (
    requestId: number,
    data: RejectionFormData
  ) => Promise<void>;
  cancelLeaveRequest: (requestId: number, employeeId: string) => Promise<void>;

  // Utility functions
  clearError: () => void;
  refetchAll: () => Promise<void>;
}

export const useLeaveStore = create<LeaveStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      leaveRequests: [],
      leaveTypes: [],
      leaveBalances: [],
      selectedRequest: null,
      loading: false,
      error: null,
      submittingRequest: false,
      approvingRequest: false,
      rejectingRequest: false,

      // Setters
      setLeaveRequests: (requests) =>
        set({ leaveRequests: requests }, false, "setLeaveRequests"),

      setLeaveTypes: (types) =>
        set({ leaveTypes: types }, false, "setLeaveTypes"),

      setLeaveBalances: (balances) =>
        set({ leaveBalances: balances }, false, "setLeaveBalances"),

      setSelectedRequest: (request) =>
        set({ selectedRequest: request }, false, "setSelectedRequest"),

      setLoading: (loading) => set({ loading }, false, "setLoading"),

      setError: (error) => set({ error }, false, "setError"),

      clearError: () => set({ error: null }, false, "clearError"),

      // Fetch all leave requests
      fetchLeaveRequests: async () => {
        try {
          set(
            { loading: true, error: null },
            false,
            "fetchLeaveRequests:start"
          );

          const response = await fetchAllLeaveRequests();

          if (response.success) {
            set(
              {
                leaveRequests: response.data || [],
                loading: false,
                error: null,
              },
              false,
              "fetchLeaveRequests:success"
            );
          } else {
            throw new Error(
              response.message || "Failed to fetch leave requests"
            );
          }
        } catch (error: any) {
          console.error("Error fetching leave requests:", error);
          set(
            {
              error:
                error.response?.data?.message ||
                error.message ||
                "Failed to fetch leave requests",
              loading: false,
            },
            false,
            "fetchLeaveRequests:error"
          );
          throw error;
        }
      },

      // Fetch leave types
      fetchLeaveTypes: async () => {
        try {
          const response = await fetchLeaveTypes();

          if (response.success) {
            set(
              {
                leaveTypes: response.data || [],
                error: null,
              },
              false,
              "fetchLeaveTypes:success"
            );
          } else {
            throw new Error(response.message || "Failed to fetch leave types");
          }
        } catch (error: any) {
          console.error("Error fetching leave types:", error);
          set(
            {
              error:
                error.response?.data?.message ||
                error.message ||
                "Failed to fetch leave types",
            },
            false,
            "fetchLeaveTypes:error"
          );
          throw error;
        }
      },

      // Fetch employee leave balance
      fetchEmployeeLeaveBalance: async (employeeId: string) => {
        try {
          const response = await fetchEmployeeLeaveBalance(employeeId);

          if (response.success) {
            set(
              {
                leaveBalances: response.data || [],
                error: null,
              },
              false,
              "fetchEmployeeLeaveBalance:success"
            );
          } else {
            throw new Error(
              response.message || "Failed to fetch leave balance"
            );
          }
        } catch (error: any) {
          console.error("Error fetching leave balance:", error);
          set(
            {
              error:
                error.response?.data?.message ||
                error.message ||
                "Failed to fetch leave balance",
            },
            false,
            "fetchEmployeeLeaveBalance:error"
          );
          throw error;
        }
      },

      // File leave request
      fileLeaveRequest: async (data: FileLeaveFormData) => {
        try {
          set(
            { submittingRequest: true, error: null },
            false,
            "fileLeaveRequest:start"
          );

          const response = await fileLeaveRequest(data);

          if (response.success) {
            // Add the new request to the list
            const currentRequests = get().leaveRequests;
            set(
              {
                leaveRequests: [response.data, ...currentRequests],
                submittingRequest: false,
                error: null,
              },
              false,
              "fileLeaveRequest:success"
            );
          } else {
            throw new Error(response.message || "Failed to file leave request");
          }
        } catch (error: any) {
          console.error("Error filing leave request:", error);
          set(
            {
              error:
                error.response?.data?.message ||
                error.message ||
                "Failed to file leave request",
              submittingRequest: false,
            },
            false,
            "fileLeaveRequest:error"
          );
          throw error;
        }
      },

      // Approve leave request
      approveLeaveRequest: async (
        requestId: number,
        data: ApprovalFormData
      ) => {
        try {
          set(
            { approvingRequest: true, error: null },
            false,
            "approveLeaveRequest:start"
          );

          const response = await approveLeaveRequest(requestId, data);

          if (response.success) {
            // Update the request in the list
            const currentRequests = get().leaveRequests;
            const updatedRequests = currentRequests.map((request) =>
              request.leave_request_id === requestId
                ? {
                    ...request,
                    status: "approved" as const,
                    approved_by: data.approved_by,
                    approved_date: new Date().toISOString(),
                    comments: data.comments || request.comments,
                  }
                : request
            );

            set(
              {
                leaveRequests: updatedRequests,
                approvingRequest: false,
                error: null,
              },
              false,
              "approveLeaveRequest:success"
            );
          } else {
            throw new Error(
              response.message || "Failed to approve leave request"
            );
          }
        } catch (error: any) {
          console.error("Error approving leave request:", error);
          set(
            {
              error:
                error.response?.data?.message ||
                error.message ||
                "Failed to approve leave request",
              approvingRequest: false,
            },
            false,
            "approveLeaveRequest:error"
          );
          throw error;
        }
      },

      // Reject leave request
      rejectLeaveRequest: async (
        requestId: number,
        data: RejectionFormData
      ) => {
        try {
          set(
            { rejectingRequest: true, error: null },
            false,
            "rejectLeaveRequest:start"
          );

          const response = await rejectLeaveRequest(requestId, data);

          if (response.success) {
            // Update the request in the list
            const currentRequests = get().leaveRequests;
            const updatedRequests = currentRequests.map((request) =>
              request.leave_request_id === requestId
                ? {
                    ...request,
                    status: "rejected" as const,
                    rejected_by: data.rejected_by,
                    rejected_date: new Date().toISOString(),
                    comments: data.comments || request.comments,
                  }
                : request
            );

            set(
              {
                leaveRequests: updatedRequests,
                rejectingRequest: false,
                error: null,
              },
              false,
              "rejectLeaveRequest:success"
            );
          } else {
            throw new Error(
              response.message || "Failed to reject leave request"
            );
          }
        } catch (error: any) {
          console.error("Error rejecting leave request:", error);
          set(
            {
              error:
                error.response?.data?.message ||
                error.message ||
                "Failed to reject leave request",
              rejectingRequest: false,
            },
            false,
            "rejectLeaveRequest:error"
          );
          throw error;
        }
      },

      // Cancel leave request
      cancelLeaveRequest: async (requestId: number, employeeId: string) => {
        try {
          set(
            { loading: true, error: null },
            false,
            "cancelLeaveRequest:start"
          );

          const response = await cancelLeaveRequest(requestId, employeeId);

          if (response.success) {
            // Update the request in the list
            const currentRequests = get().leaveRequests;
            const updatedRequests = currentRequests.map((request) =>
              request.leave_request_id === requestId
                ? {
                    ...request,
                    status: "cancelled" as const,
                    updated_at: new Date().toISOString(),
                  }
                : request
            );

            set(
              {
                leaveRequests: updatedRequests,
                loading: false,
                error: null,
              },
              false,
              "cancelLeaveRequest:success"
            );
          } else {
            throw new Error(
              response.message || "Failed to cancel leave request"
            );
          }
        } catch (error: any) {
          console.error("Error canceling leave request:", error);
          set(
            {
              error:
                error.response?.data?.message ||
                error.message ||
                "Failed to cancel leave request",
              loading: false,
            },
            false,
            "cancelLeaveRequest:error"
          );
          throw error;
        }
      },

      // Refetch all data
      refetchAll: async () => {
        try {
          await Promise.all([
            get().fetchLeaveRequests(),
            get().fetchLeaveTypes(),
          ]);
        } catch (error) {
          console.error("Error refetching all leave data:", error);
        }
      },
    }),
    {
      name: "leave-store",
    }
  )
);
