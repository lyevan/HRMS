import axios from "axios";

export type LeaveBalance = {
  leave_type: string;
  balance: number;
  year?: number;
};

export type Employee = {
  employee_id: string;
  system_id: number;
  first_name: string;
  middle_name?: string | null; // Can be null, API returns string
  last_name: string;
  nickname?: string | null; // Can be null, API returns string
  suffix?: string | null; // Can be null, API returns string
  sex: string | null; // Can be null, API returns string
  civil_status: string | null; // Can be null, API returns string
  religion?: string | null; // Can be null, API returns string
  citizenship?: string | null; // Can be null, API returns string
  current_address?: string | null; // Can be null, API returns string
  permanent_address?: string | null; // Can be null, API returns string
  avatar_url?: string | null; // Can be null, API returns string
  email: string;
  phone?: string | null; // Can be null, API returns string
  telephone?: string | null; // Can be null, API returns string
  date_of_birth: string | null; // Can be null, API returns string
  status: string;
  created_at: string;
  updated_at: string;
  contract_id: number;
  // From joined tables
  department_name: string;
  position_title: string;
  department_id: number;
  position_id: number;
  contract_start_date: string;
  contract_end_date: string | null;
  salary_rate: number;
  rate_type: string;
  employment_type: string;
  leave_balances: LeaveBalance[];
  // Convenience properties for easier access
  department: string; // alias for department_name
  position: string; // alias for position_title
  sss_number?: string | null; // Can be null, API returns string
  philhealth_number?: string | null; // Can be null, API returns string
  hdmf_number?: string | null; // Can be null, API returns string
  tin_number?: string | null; // Can be null, API returns string
  schedule_id?: number | null;
  schedule_name?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  break_duration?: number | null;
  days_of_week?: string[] | null;
};

export type EmployeeResponse = {
  success: boolean;
  results: Employee[];
};

// Parameter to decide whether to bust cache or not

export const fetchAllEmployees = async (
  bustCache = false
): Promise<EmployeeResponse> => {
  if (bustCache) {
    // console.log("Fetching employees with cache busting");
  }
  // If bust cache is true, add a timestamp to the query param to avoid cached responses
  // If not true just fetch normally, and dont use query param
  try {
    let response;
    bustCache
      ? (response = await axios.get("/employees", {
          params: { t: Date.now() },
        }))
      : (response = await axios.get("/employees"));
    return response.data;
  } catch (error) {
    console.error("Error fetching employees:", error);
    throw error;
  }
};

// Function to get employee data
export const getEmployeeData = async (): Promise<Employee[]> => {
  try {
    const response = await fetchAllEmployees();
    return response.results;
  } catch (error) {
    console.error("Error getting employee data:", error);
    return [];
  }
};
