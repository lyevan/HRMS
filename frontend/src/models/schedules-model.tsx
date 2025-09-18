import axios from "axios";

export type Schedule = {
  schedule_id: number;
  schedule_name: string;
  start_time: string;
  end_time: string;
  break_duration: number;
  break_start?: string; // e.g., "12:00:00"
  break_end?: string; // e.g., "13:00:00"
  days_of_week: string[];
  created_at: string;
  updated_at: string;
};

export type ScheduleResponse = {
  success: boolean;
  results: Schedule[];
};

export type BulkAssignRequest = {
  schedule_id: number;
  employee_ids: string[];
};

export type BulkAssignResponse = {
  success: boolean;
  message: string;
  assigned_count?: number;
};

// Fetch all schedules
export const fetchAllSchedules = async (
  bustCache = false
): Promise<ScheduleResponse> => {
  if (bustCache) {
    console.log("Fetching schedules with cache busting");
  }

  try {
    let response;
    bustCache
      ? (response = await axios.get("/schedules", {
          params: { t: Date.now() },
        }))
      : (response = await axios.get("/schedules"));
    return response.data;
  } catch (error) {
    console.error("Error fetching schedules:", error);
    throw error;
  }
};

// Get a single schedule by ID
export const getScheduleById = async (id: string): Promise<Schedule | null> => {
  try {
    const response = await axios.get(`/schedules/${id}`);
    return response.data.results || null;
  } catch (error) {
    console.error("Error fetching schedule by ID:", error);
    throw error;
  }
};

// Get schedule data
export const getScheduleData = async (): Promise<Schedule[]> => {
  try {
    const response = await fetchAllSchedules();
    return response.results;
  } catch (error) {
    console.error("Error getting schedule data:", error);
    return [];
  }
};

// Create new schedule
export const createSchedule = async (
  scheduleData: Omit<Schedule, "schedule_id" | "created_at" | "updated_at">
): Promise<Schedule> => {
  try {
    const response = await axios.post("/schedules", scheduleData);
    return response.data.result;
  } catch (error) {
    console.error("Error creating schedule:", error);
    throw error;
  }
};

// Update existing schedule
export const updateSchedule = async (
  scheduleId: number,
  scheduleData: Partial<
    Omit<Schedule, "schedule_id" | "created_at" | "updated_at">
  >
): Promise<Schedule> => {
  try {
    const response = await axios.put(`/schedules/${scheduleId}`, scheduleData);
    return response.data.result;
  } catch (error) {
    console.error("Error updating schedule:", error);
    throw error;
  }
};

// Delete schedule
export const deleteSchedule = async (scheduleId: number): Promise<void> => {
  try {
    await axios.delete(`/schedules/${scheduleId}`);
  } catch (error) {
    console.error("Error deleting schedule:", error);
    throw error;
  }
};

// Bulk assign schedules to employees
export const bulkAssignSchedule = async (
  assignmentData: BulkAssignRequest
): Promise<BulkAssignResponse> => {
  try {
    const response = await axios.post("/schedules/bulk-assign", assignmentData);
    return response.data;
  } catch (error) {
    console.error("Error bulk assigning schedule:", error);
    throw error;
  }
};
