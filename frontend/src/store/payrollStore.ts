import { create } from "zustand";
import type {
  PayrollHeader,
  Payslip,
  PayrollConfig,
  PayrollApiResponse,
  CreatePayrollHeader,
} from "@/models/payroll-model";
import axios from "axios";

interface PayrollState {
  payrollHeaders: PayrollHeader[];
  payslips: Payslip[];
  configs: PayrollConfig[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchPayrollHeaders: () => Promise<void>;
  fetchPayslips: (payrollHeaderId: number) => Promise<void>;
  fetchConfigs: () => Promise<void>;
  updateConfig: (
    key: string,
    value: string | number | boolean
  ) => Promise<void>;
  updateConfigs: (
    updates: Record<string, string | number | boolean>
  ) => Promise<void>;
  generatePayroll: (
    data: CreatePayrollHeader
  ) => Promise<PayrollHeader | undefined>;
  clearError: () => void;
}

export const usePayrollStore = create<PayrollState>((set, get) => ({
  payrollHeaders: [],
  payslips: [],
  configs: [],
  loading: false,
  error: null,

  fetchPayrollHeaders: async () => {
    try {
      set({ loading: true, error: null });

      const response = await axios.get<PayrollApiResponse<PayrollHeader[]>>(
        "/payroll/headers"
      );

      if (response.data.success && response.data.data) {
        console.log("📊 Payroll headers received:", response.data.data.length);
        console.log("📊 First header sample:", response.data.data[0]);
        set({ payrollHeaders: response.data.data });
      } else {
        set({
          error: response.data.message || "Failed to fetch payroll headers",
        });
      }
    } catch (error: any) {
      console.error("Error fetching payroll headers:", error);
      set({
        error:
          error.response?.data?.message || "Failed to fetch payroll headers",
      });
    } finally {
      set({ loading: false });
    }
  },

  fetchPayslips: async (payrollHeaderId: number) => {
    try {
      set({ loading: true, error: null });

      const response = await axios.get<PayrollApiResponse<Payslip[]>>(
        `/payroll/payslips/${payrollHeaderId}`
      );

      if (response.data.success && response.data.data) {
        set({ payslips: response.data.data });
      } else {
        set({ error: response.data.message || "Failed to fetch payslips" });
      }
    } catch (error: any) {
      console.error("Error fetching payslips:", error);
      set({
        error: error.response?.data?.message || "Failed to fetch payslips",
      });
    } finally {
      set({ loading: false });
    }
  },

  fetchConfigs: async () => {
    try {
      set({ loading: true, error: null });

      const response = await axios.get<PayrollApiResponse<PayrollConfig[]>>(
        "/payroll-config/config"
      );

      if (response.data.success && response.data.data) {
        set({ configs: response.data.data });
      } else {
        set({
          error: response.data.message || "Failed to fetch configurations",
        });
      }
    } catch (error: any) {
      console.error("Error fetching configs:", error);
      set({
        error:
          error.response?.data?.message || "Failed to fetch configurations",
      });
    } finally {
      set({ loading: false });
    }
  },

  updateConfig: async (key: string, value: string | number | boolean) => {
    try {
      set({ loading: true, error: null });

      const response = await axios.put<PayrollApiResponse<PayrollConfig>>(
        `/payroll-config/config/${key}`,
        { value }
      );

      if (response.data.success) {
        // Refresh configs after update
        await get().fetchConfigs();
      } else {
        set({
          error: response.data.message || "Failed to update configuration",
        });
      }
    } catch (error: any) {
      console.error("Error updating config:", error);
      set({
        error:
          error.response?.data?.message || "Failed to update configuration",
      });
    } finally {
      set({ loading: false });
    }
  },

  updateConfigs: async (updates: Record<string, string | number | boolean>) => {
    try {
      set({ loading: true, error: null });

      // Update multiple configs in parallel
      const updatePromises = Object.entries(updates).map(([key, value]) =>
        axios.put(`/payroll-config/config/${key}`, { value })
      );

      await Promise.all(updatePromises);

      // Refresh configs after all updates
      await get().fetchConfigs();
    } catch (error: any) {
      console.error("Error updating configs:", error);
      set({
        error:
          error.response?.data?.message || "Failed to update configurations",
      });
    } finally {
      set({ loading: false });
    }
  },

  generatePayroll: async (data: CreatePayrollHeader) => {
    try {
      set({ loading: true, error: null });

      // If no employee_ids provided, fetch all active employees
      let employee_ids = data.employee_ids;
      if (!employee_ids || employee_ids.length === 0) {
        const employeesResponse = await axios.get("/employees");
        if (employeesResponse.data.success && employeesResponse.data.results) {
          employee_ids = employeesResponse.data.results
            .filter((emp: any) => emp.status === "active")
            .map((emp: any) => emp.employee_id);
        }

        if (!employee_ids || employee_ids.length === 0) {
          throw new Error("No active employees found");
        }
      }

      const response = await axios.post<PayrollApiResponse<PayrollHeader>>(
        "/payroll/generate",
        {
          ...data,
          employee_ids,
        }
      );

      if (response.data.success) {
        // Refresh payroll headers after generation
        await get().fetchPayrollHeaders();

        // If a timesheet_id was provided, consume the timesheet
        if (data.timesheet_id) {
          try {
            // Import the attendance store function dynamically to avoid circular dependencies
            const { useAttendanceStore } = await import("./attendanceStore");
            const { consumeTimesheet } = useAttendanceStore.getState();
            await consumeTimesheet(data.timesheet_id);
            console.log(
              `Timesheet ${data.timesheet_id} consumed after payroll generation`
            );
          } catch (timesheetError) {
            console.error(
              "Failed to consume timesheet after payroll generation:",
              timesheetError
            );
            // Note: We don't throw here because payroll generation was successful
            // The timesheet consumption failure shouldn't affect the payroll success
          }
        }

        return response.data.data;
      } else {
        // Handle API-level success: false
        const errorMessage =
          response.data.message || "Failed to generate payroll";
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error("Error generating payroll:", error);

      // Enhanced error message handling
      let errorMessage = "Failed to generate payroll";

      if (error.response?.data) {
        const errorData = error.response.data;

        // Handle validation errors with multiple messages
        if (errorData.errors && Array.isArray(errorData.errors)) {
          errorMessage = errorData.errors.join(", ");
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }

        // Add error type context if available
        if (errorData.error_type) {
          switch (errorData.error_type) {
            case "validation_error":
              errorMessage = `Validation Error: ${errorMessage}`;
              break;
            case "duplicate_payroll":
              errorMessage = `Duplicate Payroll: ${errorMessage}`;
              break;
            case "inactive_employees":
              errorMessage = `Employee Status Error: ${errorMessage}`;
              break;
            case "partial_failure":
              errorMessage = `Partially Completed: ${errorMessage}`;
              break;
            case "database_connection_error":
              errorMessage = `Connection Error: ${errorMessage}`;
              break;
            default:
              errorMessage = `Error: ${errorMessage}`;
          }
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      set({ error: errorMessage });
      throw new Error(errorMessage);
    } finally {
      set({ loading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
