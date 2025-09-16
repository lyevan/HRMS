import { create } from "zustand";

interface DeductionType {
  deduction_type_id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

interface Deduction {
  deduction_id: number;
  employee_id: string;
  deduction_type_id: number;
  amount: number;
  description: string;
  date: string;
  is_active: boolean;
  principal_amount: number;
  remaining_balance: number;
  installment_amount: number;
  installments_total: number;
  installments_paid: number;
  start_date: string;
  end_date?: string;
  interest_rate: number;
  payment_frequency: string;
  is_recurring: boolean;
  auto_deduct: boolean;
  next_deduction_date?: string;
  deduction_type_name: string;
  deduction_type_description: string;
  first_name: string;
  last_name: string;
  email?: string;
}

interface DeductionPayment {
  payment_id: number;
  deduction_id: number;
  employee_id: string;
  payment_date: string;
  amount_paid: number;
  remaining_balance_after: number;
  payroll_period_start?: string;
  payroll_period_end?: string;
  notes?: string;
  created_at: string;
  deduction_description: string;
  deduction_type_name: string;
  first_name: string;
  last_name: string;
}

interface CreateDeductionData {
  employee_id: string;
  deduction_type_id: number;
  amount: number;
  description?: string;
  principal_amount?: number;
  installment_amount?: number;
  installments_total?: number;
  start_date?: string;
  end_date?: string;
  interest_rate?: number;
  payment_frequency?: string;
  is_recurring?: boolean;
  auto_deduct?: boolean;
}

interface ProcessPaymentData {
  amount_paid: number;
  payroll_period_start?: string;
  payroll_period_end?: string;
  notes?: string;
}

interface DeductionStore {
  deductionTypes: DeductionType[];
  deductions: Deduction[];
  payments: DeductionPayment[];
  loading: boolean;
  error: string | null;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };

  // Actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Deduction Types
  fetchDeductionTypes: () => Promise<void>;
  createDeductionType: (data: {
    name: string;
    description?: string;
  }) => Promise<void>;

  // Deductions
  fetchEmployeeDeductions: (
    employeeId: string,
    status?: string
  ) => Promise<void>;
  fetchAllDeductions: (params?: {
    status?: string;
    page?: number;
    limit?: number;
  }) => Promise<void>;
  createDeduction: (data: CreateDeductionData) => Promise<void>;
  updateDeduction: (
    deductionId: number,
    data: Partial<CreateDeductionData>
  ) => Promise<void>;
  deleteDeduction: (deductionId: number) => Promise<void>;

  // Payments
  processPayment: (
    deductionId: number,
    data: ProcessPaymentData
  ) => Promise<void>;
  fetchPaymentHistory: (deductionId: number) => Promise<void>;

  // Payroll Integration
  fetchActiveDeductionsForPayroll: (
    payrollPeriodStart: string,
    payrollPeriodEnd: string
  ) => Promise<Deduction[]>;
}

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export const useDeductionStore = create<DeductionStore>((set, get) => ({
  deductionTypes: [],
  deductions: [],
  payments: [],
  loading: false,
  error: null,
  pagination: {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  },

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  fetchDeductionTypes: async () => {
    try {
      set({ loading: true, error: null });

      const response = await fetch(`${API_BASE_URL}/deductions/types`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch deduction types");
      }

      const data = await response.json();
      set({ deductionTypes: data.deductionTypes });
    } catch (error) {
      console.error("Error fetching deduction types:", error);
      set({ error: error instanceof Error ? error.message : "Unknown error" });
    } finally {
      set({ loading: false });
    }
  },

  createDeductionType: async (data) => {
    try {
      set({ loading: true, error: null });

      const response = await fetch(`${API_BASE_URL}/deductions/types`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create deduction type");
      }

      // Refresh deduction types
      await get().fetchDeductionTypes();
    } catch (error) {
      console.error("Error creating deduction type:", error);
      set({ error: error instanceof Error ? error.message : "Unknown error" });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  fetchEmployeeDeductions: async (employeeId, status = "active") => {
    try {
      set({ loading: true, error: null });

      const response = await fetch(
        `${API_BASE_URL}/deductions/employee/${employeeId}?status=${status}`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch employee deductions");
      }

      const data = await response.json();
      set({ deductions: data.deductions });
    } catch (error) {
      console.error("Error fetching employee deductions:", error);
      set({ error: error instanceof Error ? error.message : "Unknown error" });
    } finally {
      set({ loading: false });
    }
  },

  fetchAllDeductions: async (params = {}) => {
    try {
      set({ loading: true, error: null });

      const queryParams = new URLSearchParams({
        status: params.status || "all",
        page: (params.page || 1).toString(),
        limit: (params.limit || 10).toString(),
      });

      const response = await fetch(
        `${API_BASE_URL}/deductions/all?${queryParams}`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch deductions");
      }

      const data = await response.json();
      set({
        deductions: data.deductions,
        pagination: data.pagination,
      });
    } catch (error) {
      console.error("Error fetching deductions:", error);
      set({ error: error instanceof Error ? error.message : "Unknown error" });
    } finally {
      set({ loading: false });
    }
  },

  createDeduction: async (data) => {
    try {
      set({ loading: true, error: null });

      const response = await fetch(`${API_BASE_URL}/deductions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create deduction");
      }

      // Refresh deductions list
      if (data.employee_id) {
        await get().fetchEmployeeDeductions(data.employee_id);
      }
    } catch (error) {
      console.error("Error creating deduction:", error);
      set({ error: error instanceof Error ? error.message : "Unknown error" });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateDeduction: async (deductionId, data) => {
    try {
      set({ loading: true, error: null });

      const response = await fetch(
        `${API_BASE_URL}/deductions/${deductionId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update deduction");
      }

      // Update local state
      const updatedData = await response.json();
      const currentDeductions = get().deductions;
      const updatedDeductions = currentDeductions.map((deduction) =>
        deduction.deduction_id === deductionId
          ? { ...deduction, ...updatedData.deduction }
          : deduction
      );

      set({ deductions: updatedDeductions });
    } catch (error) {
      console.error("Error updating deduction:", error);
      set({ error: error instanceof Error ? error.message : "Unknown error" });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  deleteDeduction: async (deductionId) => {
    try {
      set({ loading: true, error: null });

      const response = await fetch(
        `${API_BASE_URL}/deductions/${deductionId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete deduction");
      }

      // Remove from local state
      const currentDeductions = get().deductions;
      const filteredDeductions = currentDeductions.filter(
        (deduction) => deduction.deduction_id !== deductionId
      );

      set({ deductions: filteredDeductions });
    } catch (error) {
      console.error("Error deleting deduction:", error);
      set({ error: error instanceof Error ? error.message : "Unknown error" });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  processPayment: async (deductionId, data) => {
    try {
      set({ loading: true, error: null });

      const response = await fetch(
        `${API_BASE_URL}/deductions/${deductionId}/payment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to process payment");
      }

      // Update local deduction state
      const updatedData = await response.json();
      const currentDeductions = get().deductions;
      const updatedDeductions = currentDeductions.map((deduction) =>
        deduction.deduction_id === deductionId
          ? { ...deduction, ...updatedData.deduction }
          : deduction
      );

      set({ deductions: updatedDeductions });
    } catch (error) {
      console.error("Error processing payment:", error);
      set({ error: error instanceof Error ? error.message : "Unknown error" });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  fetchPaymentHistory: async (deductionId) => {
    try {
      set({ loading: true, error: null });

      const response = await fetch(
        `${API_BASE_URL}/deductions/${deductionId}/payments`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch payment history");
      }

      const data = await response.json();
      set({ payments: data.payments });
    } catch (error) {
      console.error("Error fetching payment history:", error);
      set({ error: error instanceof Error ? error.message : "Unknown error" });
    } finally {
      set({ loading: false });
    }
  },

  fetchActiveDeductionsForPayroll: async (
    payrollPeriodStart,
    payrollPeriodEnd
  ) => {
    try {
      set({ loading: true, error: null });

      const queryParams = new URLSearchParams({
        payrollPeriodStart,
        payrollPeriodEnd,
      });

      const response = await fetch(
        `${API_BASE_URL}/deductions/payroll?${queryParams}`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch active deductions for payroll");
      }

      const data = await response.json();
      return data.deductions;
    } catch (error) {
      console.error("Error fetching active deductions for payroll:", error);
      set({ error: error instanceof Error ? error.message : "Unknown error" });
      return [];
    } finally {
      set({ loading: false });
    }
  },
}));

export type {
  DeductionType,
  Deduction,
  DeductionPayment,
  CreateDeductionData,
  ProcessPaymentData,
};
