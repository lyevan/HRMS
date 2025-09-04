import axios from "axios";

export type PendingEmployee = {
  pending_employee_id: number;
  contract_id?: number | null;

  // Basic Info
  first_name: string;
  last_name: string;
  middle_name?: string | null;
  nickname?: string | null;
  suffix?: string | null;
  sex?: string | null; // gender equivalent
  date_of_birth?: string | null;
  civil_status: string; // 'single', 'married', 'widowed', 'divorced', etc.
  religion?: string | null;
  citizenship?: string | null;

  // Contact Info
  email: string;
  phone?: string | null;
  telephone?: string | null;
  current_address?: string | null;
  permanent_address?: string | null;

  // Government IDs (via government_id_numbers_id foreign key)
  government_id_numbers_id?: number | null;

  // System Fields
  status: string; // 'pending', 'registering', 'for reviewing', 'for approval', 'approved', 'rejected'
  avatar_url?: string | null;
  token?: string | null;
  created_at?: string | null;
  updated_at?: string | null;

  // Additional fields that might be added through joins or relationships
  department_id?: number;
  department_name?: string | null;
  position_id?: number;
  position_title?: string | null;
  rate?: number | null;
  rate_type?: string | null;
};

export type PendingEmployeeResponse = {
  success: boolean;
  result: PendingEmployee[];
};

export type CreatePendingEmployeeData = {
  employee_information: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
  contract_information: {
    department?: string;
    position?: string;
    hourly_rate?: number;
    hire_date?: string;
    employment_type_id?: number;
    position_id?: number;
  };
  account_type?: string;
  status?: string;
};

export type UpdatePendingEmployeeData = Partial<PendingEmployee>;

// API Functions
export const fetchAllPendingEmployees = async (
  bustCache = true
): Promise<PendingEmployeeResponse> => {
  if (bustCache) {
    console.log("Fetching pending employees with cache busting");
  }

  try {
    let response;
    bustCache
      ? (response = await axios.get("/invite/pending", {
          params: { t: Date.now() },
        }))
      : (response = await axios.get("/invite/pending"));
    console.log("Fetched pending employees:", response.data.result);
    return {
      success: true,
      result: response.data.result || [],
    };
  } catch (error) {
    console.error("Error fetching pending employees:", error);
    throw error;
  }
};

export const createPendingEmployee = async (
  data: CreatePendingEmployeeData
): Promise<{ success: boolean; data: PendingEmployee }> => {
  try {
    const response = await axios.post("/invite/pending", data);
    return {
      success: true,
      data: response.data.employmentData,
    };
  } catch (error) {
    console.error("Error creating pending employee:", error);
    throw error;
  }
};

export const reviewPendingEmployee = async (
  id: number
): Promise<{ success: boolean; employee: PendingEmployee }> => {
  try {
    const response = await axios.post(`/invite/review/${id}`);
    return {
      success: true,
      employee: response.data.employee,
    };
  } catch (error) {
    console.error("Error reviewing pending employee:", error);
    throw error;
  }
};

export const approvePendingEmployee = async (
  employee: PendingEmployee,
  role: string
): Promise<{ success: boolean; data: any }> => {
  try {
    const response = await axios.post("/invite/approve", { employee, role });
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("Error approving pending employee:", error);
    throw error;
  }
};

export const rejectPendingEmployee = async (
  id: number
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await axios.post(`/invite/reject/${id}`);
    return {
      success: true,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Error rejecting pending employee:", error);
    throw error;
  }
};

// Function to get pending employee data for easier consumption
export const getPendingEmployeeData = async (): Promise<PendingEmployee[]> => {
  try {
    const response = await fetchAllPendingEmployees();
    return response.result;
  } catch (error) {
    console.error("Error getting pending employee data:", error);
    return [];
  }
};
