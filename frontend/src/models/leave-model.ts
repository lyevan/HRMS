import axios from "axios";

export interface LeaveType {
  leave_type_id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface LeaveRequest {
  leave_request_id: number;
  employee_id: string;
  leave_type_id: number;
  start_date: string;
  end_date: string;
  reason: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  approved_by?: string;
  approved_date?: string;
  rejected_by?: string;
  rejected_date?: string;
  comments?: string;
  created_at: string;
  updated_at: string;

  // Joined fields
  first_name?: string;
  last_name?: string;
  emp_id?: string;
  leave_type_name?: string;
  leave_type_description?: string;
  days_requested?: number;
  approver_name?: string;
}

export interface LeaveBalance {
  balance_id: number;
  employee_id: string;
  leave_type_id: number;
  total_days: number;
  used_days: number;
  remaining_days: number;
  year: number;

  // Joined fields
  leave_type_name?: string;
}

export interface FileLeaveFormData {
  employee_id: string;
  leave_type_id: number;
  start_date: string;
  end_date: string;
  reason: string;
}

export interface ApprovalFormData {
  approved_by: string;
  comments?: string;
}

export interface RejectionFormData {
  rejected_by: string;
  comments?: string;
}

// API Response Types
export interface LeaveRequestsResponse {
  success: boolean;
  data: LeaveRequest[];
  message?: string;
}

export interface LeaveTypesResponse {
  success: boolean;
  data: LeaveType[];
  message?: string;
}

export interface LeaveBalanceResponse {
  success: boolean;
  data: LeaveBalance[];
  message?: string;
}

export interface LeaveActionResponse {
  success: boolean;
  data: any;
  message: string;
}

// API Functions
export const fetchAllLeaveRequests =
  async (): Promise<LeaveRequestsResponse> => {
    try {
      const response = await axios.get("/leave/requests");
      return response.data;
    } catch (error) {
      console.error("Error fetching leave requests:", error);
      throw error;
    }
  };

export const fetchLeaveTypes = async (): Promise<LeaveTypesResponse> => {
  try {
    const response = await axios.get("/leave/types");
    return response.data;
  } catch (error) {
    console.error("Error fetching leave types:", error);
    throw error;
  }
};

export const fetchEmployeeLeaveBalance = async (
  employeeId: string
): Promise<LeaveBalanceResponse> => {
  try {
    const response = await axios.get(`/leave/balance/${employeeId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching leave balance:", error);
    throw error;
  }
};

export const fileLeaveRequest = async (
  data: FileLeaveFormData
): Promise<LeaveActionResponse> => {
  try {
    const response = await axios.post("/leave/requests/apply", {
      employee_id: data.employee_id,
      leave_type_id: data.leave_type_id,
      start_date: data.start_date,
      end_date: data.end_date,
      reason: data.reason,
    });
    return response.data;
  } catch (error) {
    console.error("Error filing leave request:", error);
    throw error;
  }
};

export const approveLeaveRequest = async (
  requestId: number,
  data: ApprovalFormData
): Promise<LeaveActionResponse> => {
  try {
    const response = await axios.put(`/leave/requests/${requestId}/approve`, {
      approved_by: data.approved_by,
      comments: data.comments,
    });
    return response.data;
  } catch (error) {
    console.error("Error approving leave request:", error);
    throw error;
  }
};

export const rejectLeaveRequest = async (
  requestId: number,
  data: RejectionFormData
): Promise<LeaveActionResponse> => {
  try {
    const response = await axios.put(`/leave/requests/${requestId}/reject`, {
      rejected_by: data.rejected_by,
      comments: data.comments,
    });
    return response.data;
  } catch (error) {
    console.error("Error rejecting leave request:", error);
    throw error;
  }
};

export const cancelLeaveRequest = async (
  requestId: number,
  employeeId: string
): Promise<LeaveActionResponse> => {
  try {
    const response = await axios.put(`/leave/requests/${requestId}/cancel`, {
      employee_id: employeeId,
    });
    return response.data;
  } catch (error) {
    console.error("Error cancelling leave request:", error);
    throw error;
  }
};

export interface ApproveLeaveFormData {
  approved_by: string;
  comments?: string;
}
