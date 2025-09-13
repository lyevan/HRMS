import axios from "axios";

// Base Request Interface
export interface BaseRequest {
  request_id: number;
  employee_id: string;
  request_type:
    | "manual_log"
    | "overtime"
    | "out_of_business"
    | "change_shift"
    | "change_dayoff"
    | "undertime";
  title: string;
  description: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  requested_date: string;
  start_date?: string;
  end_date?: string;
  approved_by?: string;
  approved_date?: string;
  rejected_by?: string;
  rejected_date?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;

  // Joined fields
  first_name?: string;
  last_name?: string;
  email?: string;
  approved_by_first_name?: string;
  approved_by_last_name?: string;
  rejected_by_first_name?: string;
  rejected_by_last_name?: string;
}

// Specific Request Data Interfaces
export interface ManualLogRequestData {
  manual_log_request_id: number;
  request_id: number;
  target_date: string;
  time_in?: string;
  time_out?: string;
  reason: string;
  supporting_documents?: string[];
}

export interface OvertimeRequestData {
  overtime_request_id: number;
  request_id: number;
  attendance_id: number;
  requested_overtime_hours: number;
  reason: string;
  project_or_task?: string;
}

export interface OutOfBusinessRequestData {
  out_of_business_request_id: number;
  request_id: number;
  destination: string;
  purpose: string;
  client_or_company?: string;
  contact_person?: string;
  contact_number?: string;
  transportation_mode?: string;
  estimated_cost?: number;
}

export interface ChangeShiftRequestData {
  change_shift_request_id: number;
  request_id: number;
  current_shift_start: string;
  current_shift_end: string;
  requested_shift_start: string;
  requested_shift_end: string;
  reason: string;
  is_permanent: boolean;
  effective_until?: string;
}

export interface ChangeDayoffRequestData {
  change_dayoff_request_id: number;
  request_id: number;
  current_dayoff:
    | "monday"
    | "tuesday"
    | "wednesday"
    | "thursday"
    | "friday"
    | "saturday"
    | "sunday";
  requested_dayoff:
    | "monday"
    | "tuesday"
    | "wednesday"
    | "thursday"
    | "friday"
    | "saturday"
    | "sunday";
  reason: string;
  is_permanent: boolean;
  effective_until?: string;
}

export interface UndertimeRequestData {
  undertime_request_id: number;
  request_id: number;
  undertime_date: string;
  early_out_time: string;
  expected_hours_missed: number;
  reason: string;
  is_emergency: boolean;
  makeup_plan?: string;
}

// Complete Request with Specific Data
export interface RequestWithDetails extends BaseRequest {
  specific_data?:
    | ManualLogRequestData
    | OvertimeRequestData
    | OutOfBusinessRequestData
    | ChangeShiftRequestData
    | ChangeDayoffRequestData
    | UndertimeRequestData;
}

// Form Data Interfaces for Creating Requests
export interface CreateManualLogRequest {
  employee_id: string;
  title: string;
  description: string;
  target_date: string;
  time_in?: string;
  time_out?: string;
  break_duration?: string;
  shift_start_time?: string;
  shift_end_time?: string;
  reason: string;
  supporting_documents?: string[];
}

export interface CreateOvertimeRequest {
  employee_id: string;
  title: string;
  description: string;
  attendance_id: number;
  expected_hours: number;
  reason: string;
  project_or_task?: string;
  end_time?: string;
}
export interface CreateOutOfBusinessRequest {
  employee_id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  destination: string;
  purpose: string;
  client_or_company?: string;
  contact_person?: string;
  contact_number?: string;
  transportation_mode?: string;
  estimated_cost?: number;
}

export interface CreateChangeShiftRequest {
  employee_id: string;
  title: string;
  description: string;
  start_date: string;
  end_date?: string;
  current_shift_start: string;
  current_shift_end: string;
  requested_shift_start: string;
  requested_shift_end: string;
  reason: string;
  is_permanent: boolean;
  effective_until?: string;
}

export interface CreateChangeDayoffRequest {
  employee_id: string;
  title: string;
  description: string;
  start_date: string;
  end_date?: string;
  current_dayoff: string;
  requested_dayoff: string;
  reason: string;
  is_permanent: boolean;
  effective_until?: string;
}

export interface CreateUndertimeRequest {
  employee_id: string;
  title: string;
  description: string;
  undertime_date: string;
  early_out_time: string;
  expected_hours_missed: number;
  reason: string;
  is_emergency: boolean;
  makeup_plan?: string;
}

// API Query Parameters
export interface RequestFilters {
  employee_id?: string;
  request_type?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  limit?: number;
}

// API Response Interfaces
export interface RequestsResponse {
  success: boolean;
  data: BaseRequest[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface RequestDetailsResponse {
  success: boolean;
  data: RequestWithDetails;
}

export interface RequestStatsResponse {
  success: boolean;
  data: {
    by_type: {
      [key: string]: {
        pending: number;
        approved: number;
        rejected: number;
        cancelled: number;
        total: number;
      };
    };
    by_status: {
      pending: number;
      approved: number;
      rejected: number;
      cancelled: number;
    };
    total: number;
  };
}

// API Functions
export const fetchAllRequests = async (
  filters?: RequestFilters
): Promise<RequestsResponse> => {
  try {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }

    const response = await axios.get(`/requests?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching requests:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to fetch requests"
    );
  }
};

export const fetchRequestDetails = async (
  requestId: number
): Promise<RequestWithDetails> => {
  try {
    const response = await axios.get(`/requests/${requestId}`);

    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(
        response.data.message || "Failed to fetch request details"
      );
    }
  } catch (error) {
    console.error("Error fetching request details:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to fetch request details"
    );
  }
};

export const fetchRequestStats = async (
  filters?: Omit<RequestFilters, "page" | "limit">
): Promise<RequestStatsResponse["data"]> => {
  try {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }

    const response = await axios.get(`/requests/stats?${params.toString()}`);

    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || "Failed to fetch request stats");
    }
  } catch (error) {
    console.error("Error fetching request stats:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to fetch request stats"
    );
  }
};

// Create Request Functions
export const createManualLogRequest = async (
  data: CreateManualLogRequest
): Promise<BaseRequest> => {
  try {
    const requestData = {
      ...data,
      request_type: "manual_log",
    };

    const response = await axios.post("/requests", requestData);

    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(
        response.data.message || "Failed to create manual log request"
      );
    }
  } catch (error) {
    console.error("Error creating manual log request:", error);

    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.message || error.message;
      throw new Error(errorMessage);
    }

    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to create manual log request"
    );
  }
};

export const createOvertimeRequest = async (
  data: CreateOvertimeRequest
): Promise<BaseRequest> => {
  try {
    const requestData = {
      ...data,
      request_type: "overtime",
    };

    const response = await axios.post("/requests", requestData);

    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(
        response.data.message || "Failed to create overtime request"
      );
    }
  } catch (error) {
    console.error("Error creating overtime request:", error);

    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.message || error.message;
      throw new Error(errorMessage);
    }

    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to create overtime request"
    );
  }
};

export const createOutOfBusinessRequest = async (
  data: CreateOutOfBusinessRequest
): Promise<BaseRequest> => {
  try {
    const requestData = {
      ...data,
      request_type: "out_of_business",
    };

    const response = await axios.post("/requests", requestData);

    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(
        response.data.message || "Failed to create out of business request"
      );
    }
  } catch (error) {
    console.error("Error creating out of business request:", error);

    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.message || error.message;
      throw new Error(errorMessage);
    }

    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to create out of business request"
    );
  }
};

export const createChangeShiftRequest = async (
  data: CreateChangeShiftRequest
): Promise<BaseRequest> => {
  try {
    const requestData = {
      ...data,
      request_type: "change_shift",
    };

    const response = await axios.post("/requests", requestData);

    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(
        response.data.message || "Failed to create change shift request"
      );
    }
  } catch (error) {
    console.error("Error creating change shift request:", error);

    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.message || error.message;
      throw new Error(errorMessage);
    }

    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to create change shift request"
    );
  }
};

export const createChangeDayoffRequest = async (
  data: CreateChangeDayoffRequest
): Promise<BaseRequest> => {
  try {
    const requestData = {
      ...data,
      request_type: "change_dayoff",
    };

    const response = await axios.post("/requests", requestData);

    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(
        response.data.message || "Failed to create change day-off request"
      );
    }
  } catch (error) {
    console.error("Error creating change day-off request:", error);

    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.message || error.message;
      throw new Error(errorMessage);
    }

    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to create change day-off request"
    );
  }
};

export const createUndertimeRequest = async (
  data: CreateUndertimeRequest
): Promise<BaseRequest> => {
  try {
    const requestData = {
      ...data,
      request_type: "undertime",
    };

    const response = await axios.post("/requests", requestData);

    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(
        response.data.message || "Failed to create undertime request"
      );
    }
  } catch (error) {
    console.error("Error creating undertime request:", error);

    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.message || error.message;
      throw new Error(errorMessage);
    }

    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to create undertime request"
    );
  }
};

// Approval/Rejection Functions
export const approveRequest = async (
  requestId: number,
  approvedBy: string
): Promise<BaseRequest> => {
  try {
    const response = await axios.put(`/requests/${requestId}/approve`, {
      approved_by: approvedBy,
    });

    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || "Failed to approve request");
    }
  } catch (error) {
    console.error("Error approving request:", error);

    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.message || error.message;
      throw new Error(errorMessage);
    }

    throw new Error(
      error instanceof Error ? error.message : "Failed to approve request"
    );
  }
};

export const rejectRequest = async (
  requestId: number,
  rejectedBy: string,
  rejectionReason: string
): Promise<BaseRequest> => {
  try {
    const response = await axios.put(`/requests/${requestId}/reject`, {
      rejected_by: rejectedBy,
      rejection_reason: rejectionReason,
    });

    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || "Failed to reject request");
    }
  } catch (error) {
    console.error("Error rejecting request:", error);

    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.message || error.message;
      throw new Error(errorMessage);
    }

    throw new Error(
      error instanceof Error ? error.message : "Failed to reject request"
    );
  }
};

export const cancelRequest = async (
  requestId: number,
  employeeId: string
): Promise<BaseRequest> => {
  try {
    const response = await axios.put(`/requests/${requestId}/cancel`, {
      employee_id: employeeId,
    });

    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || "Failed to cancel request");
    }
  } catch (error) {
    console.error("Error cancelling request:", error);

    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.message || error.message;
      throw new Error(errorMessage);
    }

    throw new Error(
      error instanceof Error ? error.message : "Failed to cancel request"
    );
  }
};

// Helper Functions
export const getRequestStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case "pending":
      return "bg-yellow-100 text-yellow-800 border-yellow-600";
    case "approved":
      return "bg-green-100 text-green-800 border-green-600";
    case "rejected":
      return "bg-red-100 text-red-800 border-red-600";
    case "cancelled":
      return "bg-gray-100 text-gray-800 border-gray-600";
    default:
      return "bg-gray-100 text-gray-800 border-gray-600";
  }
};

export const getRequestTypeDisplayName = (type: string): string => {
  switch (type) {
    case "manual_log":
      return "Manual Log";
    case "overtime":
      return "Overtime";
    case "out_of_business":
      return "Out of Business";
    case "change_shift":
      return "Change Shift";
    case "change_dayoff":
      return "Change Day-off";
    case "undertime":
      return "Undertime";
    default:
      return type;
  }
};

export const formatRequestDate = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
};

export const formatRequestTime = (timeString: string): string => {
  try {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return timeString;
  }
};
