import axios from "axios";
import { type Schedule } from "./schedules-model";

export interface PayrollBreakdown {
  overtime: {
    approved: {
      total: number;
      regular_overtime: number;
      rest_day_overtime: number;
      night_diff_overtime: number;
      regular_holiday_overtime: number;
      special_holiday_overtime: number;
      regular_holiday_rest_day_overtime: number;
      special_holiday_rest_day_overtime: number;
      night_diff_rest_day_overtime: number;
      night_diff_regular_holiday_overtime: number;
      night_diff_special_holiday_overtime: number;
      night_diff_regular_holiday_rest_day_overtime: number;
      night_diff_special_holiday_rest_day_overtime: number;
    };
    computed: {
      total: number;
      regular_overtime: {
        value: number;
        rate: {
          base: number;
          overtime: number;
          total: number;
        };
      };
      rest_day_overtime: {
        value: number;
        rate: {
          base: number;
          rest_day: number;
          overtime: number;
          total: number;
        };
      };
      night_diff_overtime: {
        value: number;
        rate: {
          base: number;
          night_diff: number;
          overtime: number;
          total: number;
        };
      };
      regular_holiday_overtime: {
        value: number;
        rate: {
          base: number;
          regular_holiday: number;
          overtime: number;
          total: number;
        };
      };
      special_holiday_overtime: {
        value: number;
        rate: {
          base: number;
          special_holiday: number;
          overtime: number;
          total: number;
        };
      };
      regular_holiday_rest_day_overtime: {
        value: number;
        rate: {
          base: number;
          regular_holiday: number;
          rest_day: number;
          overtime: number;
          total: number;
        };
      };
      special_holiday_rest_day_overtime: {
        value: number;
        rate: {
          base: number;
          special_holiday: number;
          rest_day: number;
          overtime: number;
          total: number;
        };
      };
      night_diff_rest_day_overtime: {
        value: number;
        rate: {
          base: number;
          night_diff: number;
          rest_day: number;
          overtime: number;
          total: number;
        };
      };
      night_diff_regular_holiday_overtime: {
        value: number;
        rate: {
          base: number;
          night_diff: number;
          regular_holiday: number;
          overtime: number;
          total: number;
        };
      };
      night_diff_special_holiday_overtime: {
        value: number;
        rate: {
          base: number;
          night_diff: number;
          special_holiday: number;
          overtime: number;
          total: number;
        };
      };
      night_diff_regular_holiday_rest_day_overtime: {
        value: number;
        rate: {
          base: number;
          night_diff: number;
          regular_holiday: number;
          rest_day: number;
          overtime: number;
          total: number;
        };
      };
      night_diff_special_holiday_rest_day_overtime: {
        value: number;
        rate: {
          base: number;
          night_diff: number;
          special_holiday: number;
          rest_day: number;
          overtime: number;
          total: number;
        };
      };
    };
  };
  worked_hours: {
    total: number;
    regular: {
      value: number;
      rate: {
        base: number;
        total: number;
      };
    };
    rest_day: {
      value: number;
      rate: {
        base: number;
        rest_day: number;
        total: number;
      };
    };
    night_diff: {
      value: number;
      rate: {
        base: number;
        night_diff: number;
        total: number;
      };
    };
    regular_holiday: {
      value: number;
      rate: {
        base: number;
        regular_holiday: number;
        total: number;
      };
    };
    special_holiday: {
      value: number;
      rate: {
        base: number;
        special_holiday: number;
        total: number;
      };
    };
    regular_holiday_rest_day: {
      value: number;
      rate: {
        base: number;
        regular_holiday: number;
        rest_day: number;
        total: number;
      };
    };
    special_holiday_rest_day: {
      value: number;
      rate: {
        base: number;
        special_holiday: number;
        rest_day: number;
        total: number;
      };
    };
    night_diff_rest_day: {
      value: number;
      rate: {
        base: number;
        night_diff: number;
        rest_day: number;
        total: number;
      };
    };
    night_diff_regular_holiday: {
      value: number;
      rate: {
        base: number;
        night_diff: number;
        regular_holiday: number;
        total: number;
      };
    };
    night_diff_special_holiday: {
      value: number;
      rate: {
        base: number;
        night_diff: number;
        special_holiday: number;
        total: number;
      };
    };
    night_diff_regular_holiday_rest_day: {
      value: number;
      rate: {
        base: number;
        night_diff: number;
        regular_holiday: number;
        rest_day: number;
        total: number;
      };
    };
    night_diff_special_holiday_rest_day: {
      value: number;
      rate: {
        base: number;
        night_diff: number;
        special_holiday: number;
        rest_day: number;
        total: number;
      };
    };
  };
  deductions: {
    late_hours: number;
    undertime_hours: number;
  };
  regular_hours: number;
  schedule: Schedule;
  edge_case_flags: {
    is_day_off: boolean;
    has_overtime: boolean;
    is_regular_holiday: boolean;
    is_special_holiday: boolean;
    premium_stack_count: number;
    has_multiple_premiums: boolean;
    has_night_differential: boolean;
    is_ultimate_case_regular: boolean;
    is_ultimate_case_special: boolean;
    is_day_off_and_regular_holiday: boolean;
    is_day_off_and_special_holiday: boolean;
  };
}

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
  is_dayoff: boolean;
  is_regular_holiday: boolean;
  is_special_holiday: boolean;
  late_minutes: number;
  undertime_minutes: number;
  night_differential_hours: number;
  rest_day_hours_worked: number;
  is_entitled_holiday: boolean;
  status: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;

  // Joined fields from employees table
  first_name?: string;
  last_name?: string;
  calculated_total_hours?: number;
  break_duration?: number; // From schedule
  start_time?: string; // From schedule
  end_time?: string; // From schedule
  days_of_week?: string[]; // From schedule

  // Additional fields can be added as needed
  processed_by?: string;
  date_last_processed?: string;
  timesheet_id?: number;
  timesheet_start_date?: string;
  timesheet_end_date?: string;
  is_timesheet_consumed?: boolean;

  payroll_breakdown?: PayrollBreakdown;
}
export interface TimesheetResponse {
  timesheet_id: number;
  start_date: string;
  end_date: string;
  is_consumed: boolean;
  recordCount: number;
  employeeCount: number;
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

export const fetchUnconsumedTimesheets = async (): Promise<
  TimesheetResponse[]
> => {
  try {
    const response = await axios.get("/attendance/get-timesheets");
    return response.data.data || [];
  } catch (error) {
    console.error("Error fetching unconsumed timesheets:", error);
    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to fetch unconsumed timesheets"
    );
  }
};

export const fetchAttendanceByTimesheet = async (
  timesheetId: number
): Promise<{
  timesheet: TimesheetResponse;
  attendance: AttendanceRecord[];
  count: number;
}> => {
  try {
    const response = await axios.get(`/attendance/timesheet/${timesheetId}`);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching attendance by timesheet:", error);
    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to fetch attendance by timesheet"
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

export const bulkDeleteAttendanceRecords = async (
  attendanceIds: number[]
): Promise<void> => {
  try {
    await axios.delete(`/attendance/bulk-delete`, {
      data: { attendance_ids: attendanceIds },
    });
  } catch (error) {
    console.error("Error bulk deleting attendance:", error);
    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to delete attendance records"
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
  // Priority order: Leave > Absent > Day Off > Holidays > Present states
  if (record.on_leave) return "On Leave";
  if (record.is_absent) return "Absent";
  if (record.is_dayoff && !record.is_present) return "Day Off";
  if (record.is_regular_holiday && record.is_present)
    return "Present (Regular Holiday)";
  if (record.is_special_holiday && record.is_present)
    return "Present (Special Holiday)";
  if (record.is_regular_holiday) return "Regular Holiday";
  if (record.is_special_holiday) return "Special Holiday";
  if (record.is_halfday) return "Half Day";
  if (record.is_undertime) return "Undertime";
  if (record.is_late) return "Late";
  if (record.is_present) return "Present";
  return "Unknown";
};

export const getAttendanceStatusColor = (record: AttendanceRecord): string => {
  if (record.on_leave) return "bg-blue-100 text-blue-800";
  if (record.is_absent) return "bg-red-100 text-red-800";
  if (record.is_dayoff && !record.is_present)
    return "bg-gray-100 text-gray-800";
  if (record.is_regular_holiday) return "bg-purple-100 text-purple-800";
  if (record.is_special_holiday) return "bg-pink-100 text-pink-800";
  if (record.is_halfday) return "bg-orange-100 text-orange-800";
  if (record.is_undertime) return "bg-yellow-100 text-yellow-800";
  if (record.is_late) return "bg-amber-100 text-amber-800";
  if (record.is_present) return "bg-green-100 text-green-800";
  return "bg-gray-100 text-gray-800";
};

// Enhanced multi-badge status function
export const getAttendanceStatusBadges = (record: AttendanceRecord) => {
  const badges = [];

  // Primary status badges
  if (record.is_present) {
    badges.push({
      key: "present",
      text: "Present",
      className: "bg-green-100 text-green-800 border-green-300",
    });
  }
  if (record.is_absent) {
    badges.push({
      key: "absent",
      text: "Absent",
      className: "bg-red-100 text-red-800 border-red-300",
    });
  }
  if (record.on_leave) {
    badges.push({
      key: "leave",
      text: "On Leave",
      className: "bg-blue-100 text-blue-800 border-blue-300",
    });
  }

  // Secondary status badges
  if (record.is_late) {
    badges.push({
      key: "late",
      text: "Late",
      className: "bg-orange-100 text-orange-800 border-orange-300",
    });
  }
  if (record.is_undertime) {
    badges.push({
      key: "undertime",
      text: "Undertime",
      className: "bg-yellow-100 text-yellow-800 border-yellow-300",
    });
  }
  if (record.is_halfday) {
    badges.push({
      key: "halfday",
      text: "Half Day",
      className: "bg-indigo-100 text-indigo-800 border-indigo-300",
    });
  }

  // Special day badges
  if (record.is_dayoff) {
    badges.push({
      key: "dayoff",
      text: "Day Off",
      className: "bg-gray-100 text-gray-800 border-gray-300",
    });
  }
  if (record.is_regular_holiday) {
    badges.push({
      key: "regular-holiday",
      text: "Regular Holiday",
      className: "bg-purple-100 text-purple-800 border-purple-300",
    });
  }
  if (record.is_special_holiday) {
    badges.push({
      key: "special-holiday",
      text: "Special Holiday",
      className: "bg-pink-100 text-pink-800 border-pink-300",
    });
  }

  return badges;
};
