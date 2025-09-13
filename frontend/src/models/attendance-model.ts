import axios from "axios";

export interface AttendanceRecord {
  attendance_id: number;
  employee_id: string;
  date: string;
  time_in: string | null;
  time_out: string | null;
  break_start: string | null;
  break_end: string | null;
  total_hours: number | null;
  overtime_hours: number | null;
  is_present: boolean;
  is_late: boolean;
  is_absent: boolean;
  is_undertime: boolean;
  is_halfday: boolean;
  on_leave: boolean;
  leave_type_id: number | null;
  leave_request_id: number | null;
  status: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;

  // Joined fields from employees table
  first_name?: string;
  last_name?: string;
  calculated_total_hours?: number;
  break_duration?: number; // From schedule
}

export interface AttendanceSummary {
  total_days: number;
  present_days: number;
  absent_days: number;
  late_days: number;
  undertime_days: number;
  halfday_days: number;
  leave_days: number;
  total_hours_worked: number;
  average_hours_per_day: number;
}

export interface TodayAttendanceRecord {
  attendance_id: number;
  employee_id: string;
  first_name: string;
  last_name: string;
  time_in: string | null;
  time_out: string | null;
  total_hours: number | null;
  is_present: boolean;
  is_late: boolean;
  status: string | null;
}

export interface ClockInRequest {
  employee_id?: string;
  rfid?: string;
}

export interface ClockOutRequest {
  employee_id?: string;
  rfid?: string;
  notes?: string;
}

export interface ManualAttendanceRequest {
  employee_id: string;
  date: string;
  time_in?: string;
  time_out?: string;
  status?: "PRESENT" | "ABSENT" | "LATE" | "HALF_DAY" | "ON_LEAVE";
  notes?: string;
}

// API Functions
export const fetchAllAttendance = async (): Promise<AttendanceRecord[]> => {
  try {
    const response = await axios.get("/attendance/");
    return response.data.data || [];
  } catch (error) {
    console.error("Error fetching all attendance:", error);
    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to fetch attendance records"
    );
  }
};

export const fetchEmployeeAttendance = async (
  employeeId: string
): Promise<AttendanceRecord[]> => {
  try {
    const response = await axios.get(`/attendance/employee/${employeeId}`);
    return response.data.data || [];
  } catch (error) {
    console.error("Error fetching employee attendance:", error);
    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to fetch employee attendance"
    );
  }
};

export const fetchTodayAttendance = async (): Promise<
  TodayAttendanceRecord[]
> => {
  try {
    const response = await axios.get("/attendance/today-all");
    return response.data.data || [];
  } catch (error) {
    console.error("Error fetching today's attendance:", error);
    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to fetch today's attendance"
    );
  }
};

export const fetchEmployeeAttendanceSummary = async (
  employeeId: string,
  startDate?: string,
  endDate?: string
): Promise<AttendanceSummary> => {
  try {
    const params = new URLSearchParams();
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);

    const response = await axios.get(
      `/attendance/employee/${employeeId}/summary?${params.toString()}`
    );
    return response.data.data;
  } catch (error) {
    console.error("Error fetching attendance summary:", error);
    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to fetch attendance summary"
    );
  }
};

export const clockInEmployee = async (
  data: ClockInRequest
): Promise<AttendanceRecord> => {
  try {
    const response = await axios.post("/attendance/clock-in", data);
    return response.data.data;
  } catch (error) {
    console.error("Error clocking in:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to clock in"
    );
  }
};

export const clockOutEmployee = async (
  data: ClockOutRequest
): Promise<AttendanceRecord> => {
  try {
    const response = await axios.post("/attendance/clock-out", data);
    return response.data.data;
  } catch (error) {
    console.error("Error clocking out:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to clock out"
    );
  }
};

export const createManualAttendance = async (
  data: ManualAttendanceRequest
): Promise<AttendanceRecord> => {
  try {
    const response = await axios.post("/attendance/manual-create", data);

    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(
        response.data.message || "Failed to create manual attendance"
      );
    }
  } catch (error) {
    console.error("Error creating manual attendance:", error);

    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.message || error.message;
      throw new Error(errorMessage);
    }

    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to create manual attendance record"
    );
  }
};

export const updateAttendanceRecord = async (
  attendanceId: number,
  data: Partial<ManualAttendanceRequest>
): Promise<AttendanceRecord> => {
  try {
    const response = await axios.put(`/attendance/${attendanceId}`, data);
    return response.data.data;
  } catch (error) {
    console.error("Error updating attendance:", error);
    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to update attendance record"
    );
  }
};

export const deleteAttendanceRecord = async (
  attendanceId: number
): Promise<void> => {
  try {
    await axios.delete(`/attendance/${attendanceId}`);
  } catch (error) {
    console.error("Error deleting attendance:", error);
    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to delete attendance record"
    );
  }
};

// Helper functions for data processing
export const calculateAttendanceStats = (records: AttendanceRecord[]) => {
  const totalRecords = records.length;
  const presentDays = records.filter((r) => r.is_present).length;
  const absentDays = records.filter((r) => r.is_absent).length;
  const lateDays = records.filter((r) => r.is_late).length;
  const undertimeDays = records.filter((r) => r.is_undertime).length;
  const halfdayDays = records.filter((r) => r.is_halfday).length;
  const leaveDays = records.filter((r) => r.on_leave).length;
  const totalHours = records.reduce(
    (sum, record) => sum + (record.total_hours || 0),
    0
  );

  return {
    total: totalRecords,
    present: presentDays,
    absent: absentDays,
    late: lateDays,
    undertime: undertimeDays,
    halfday: halfdayDays,
    leave: leaveDays,
    totalHours: totalHours,
    averageHours: totalRecords > 0 ? totalHours / totalRecords : 0,
    attendanceRate: totalRecords > 0 ? (presentDays / totalRecords) * 100 : 0,
  };
};

export const getAttendanceStatusText = (record: AttendanceRecord): string => {
  if (record.on_leave) return "On Leave";
  if (record.is_absent) return "Absent";
  if (record.is_halfday) return "Half Day";
  if (record.is_undertime) return "Undertime";
  if (record.is_late) return "Late";
  if (record.is_present) return "Present";
  return "Unknown";
};

export const getAttendanceStatusColor = (record: AttendanceRecord): string => {
  if (record.on_leave) return "bg-blue-100 text-blue-800";
  if (record.is_absent) return "bg-red-100 text-red-800";
  if (record.is_halfday) return "bg-orange-100 text-orange-800";
  if (record.is_undertime) return "bg-yellow-100 text-yellow-800";
  if (record.is_late) return "bg-amber-100 text-amber-800";
  if (record.is_present) return "bg-green-100 text-green-800";
  return "bg-gray-100 text-gray-800";
};
