import { pool } from "../config/db.js";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Enhanced attendance calculation helper functions
 */

// Check if a date is a holiday and get holiday details
export const getHolidayInfo = async (date) => {
  try {
    const result = await pool.query(
      `SELECT holiday_id, name, holiday_type, is_active 
       FROM holidays 
       WHERE date = $1 AND is_active = true`,
      [date]
    );

    if (result.rows.length > 0) {
      const holiday = result.rows[0];
      return {
        isHoliday: true,
        isRegularHoliday: holiday.holiday_type === "regular",
        isSpecialHoliday: holiday.holiday_type === "special",
        holidayName: holiday.name,
        holidayType: holiday.holiday_type,
      };
    }

    return {
      isHoliday: false,
      isRegularHoliday: false,
      isSpecialHoliday: false,
      holidayName: null,
      holidayType: null,
    };
  } catch (error) {
    console.error("Error checking holiday status:", error);
    return {
      isHoliday: false,
      isRegularHoliday: false,
      isSpecialHoliday: false,
      holidayName: null,
      holidayType: null,
    };
  }
};

// Calculate late minutes
export const calculateLateMinutes = (clockInTime, scheduledStartTime) => {
  if (!scheduledStartTime) return 0;

  const clockIn = dayjs(clockInTime);
  const scheduledStart = dayjs(
    `${clockIn.format("YYYY-MM-DD")} ${scheduledStartTime}`
  );

  if (clockIn.isAfter(scheduledStart)) {
    return clockIn.diff(scheduledStart, "minute");
  }

  return 0;
};

// Calculate undertime minutes
export const calculateUndertimeMinutes = (clockOutTime, scheduledEndTime) => {
  if (!scheduledEndTime) return 0;

  const clockOut = dayjs(clockOutTime);
  const scheduledEnd = dayjs(
    `${clockOut.format("YYYY-MM-DD")} ${scheduledEndTime}`
  );

  if (clockOut.isBefore(scheduledEnd)) {
    return scheduledEnd.diff(clockOut, "minute");
  }

  return 0;
};

// Calculate night differential hours (10pm to 6am)
export const calculateNightDifferentialHours = (timeIn, timeOut) => {
  if (!timeIn || !timeOut) return 0;

  const start = dayjs(timeIn);
  const end = dayjs(timeOut);

  let nightHours = 0;
  let current = start.clone();

  while (current.isBefore(end)) {
    const hour = current.hour();

    // Night differential hours: 10 PM to 6 AM
    if (hour >= 22 || hour < 6) {
      const nextHour = current.add(1, "hour");
      const segmentEnd = nextHour.isAfter(end) ? end : nextHour;
      const minutesInSegment = segmentEnd.diff(current, "minute");
      nightHours += minutesInSegment / 60;
    }

    current = current.add(1, "hour").startOf("hour");
  }

  return Math.round(nightHours * 100) / 100; // Round to 2 decimal places
};

// Calculate rest day hours worked
export const calculateRestDayHours = (
  timeIn,
  timeOut,
  totalHours,
  isDayOff
) => {
  if (!isDayOff || !timeIn || !timeOut) return 0;

  // If it's a day off and they worked, all hours are rest day hours
  return totalHours || 0;
};

// Check if employee is entitled to holiday pay
export const calculateHolidayEntitlement = async (
  employeeId,
  date,
  isRegularHoliday,
  isSpecialHoliday
) => {
  try {
    // Regular employees are entitled to regular holiday pay even if they don't work
    // Special holidays usually don't have automatic entitlement unless worked

    if (!isRegularHoliday && !isSpecialHoliday) {
      return false;
    }

    // Get employee employment type to determine entitlement
    const employeeResult = await pool.query(
      `
      SELECT et.name as employment_type_name, c.rate_type
      FROM employees e
      LEFT JOIN contracts c ON e.contract_id = c.contract_id
      LEFT JOIN employment_types et ON c.employment_type_id = et.employment_type_id
      WHERE e.employee_id = $1
    `,
      [employeeId]
    );

    if (employeeResult.rows.length > 0) {
      const employmentType =
        employeeResult.rows[0].employment_type_name?.toLowerCase();

      // Regular employees are entitled to regular holiday pay
      if (
        isRegularHoliday &&
        (employmentType === "regular" || employmentType === "permanent")
      ) {
        return true;
      }

      // Special holidays typically require working to get pay
      // But some companies give it to regular employees too
      if (isSpecialHoliday && employmentType === "regular") {
        return true; // Adjust based on company policy
      }
    }

    return false;
  } catch (error) {
    console.error("Error calculating holiday entitlement:", error);
    return false;
  }
};

// Enhanced clock-in calculation
export const enhancedClockInCalculation = async (
  employeeId,
  clockInTime,
  scheduleInfo,
  holidayInfo
) => {
  const lateMinutes = calculateLateMinutes(
    clockInTime,
    scheduleInfo.start_time
  );
  const isEntitledHoliday = await calculateHolidayEntitlement(
    employeeId,
    dayjs(clockInTime).format("YYYY-MM-DD"),
    holidayInfo.isRegularHoliday,
    holidayInfo.isSpecialHoliday
  );

  return {
    late_minutes: lateMinutes,
    is_late: lateMinutes > 0,
    is_entitled_holiday: isEntitledHoliday,
    is_regular_holiday: holidayInfo.isRegularHoliday,
    is_special_holiday: holidayInfo.isSpecialHoliday,
  };
};

// Enhanced clock-out calculation
export const enhancedClockOutCalculation = async (
  attendanceRecord,
  clockOutTime,
  scheduleInfo
) => {
  const {
    time_in,
    employee_id,
    is_dayoff,
    is_regular_holiday,
    is_special_holiday,
  } = attendanceRecord;

  // Calculate basic hours
  const timeIn = dayjs(time_in);
  const timeOut = dayjs(clockOutTime);
  const rawHours = timeOut.diff(timeIn, "hour", true);

  // Apply break deduction if applicable
  let totalHours = rawHours;
  if (scheduleInfo.break_duration && rawHours >= 4) {
    totalHours = rawHours - scheduleInfo.break_duration / 60;
  }

  if (totalHours < 0) totalHours = 0;

  // Calculate undertime minutes
  const undertimeMinutes = calculateUndertimeMinutes(
    clockOutTime,
    scheduleInfo.end_time
  );

  // Calculate night differential hours
  const nightDiffHours = calculateNightDifferentialHours(time_in, clockOutTime);

  // Calculate rest day hours
  const restDayHours = calculateRestDayHours(
    time_in,
    clockOutTime,
    totalHours,
    is_dayoff
  );

  // Determine if it's undertime or halfday
  const scheduledRawHours =
    scheduleInfo.start_time && scheduleInfo.end_time
      ? dayjs(`1970-01-01 ${scheduleInfo.end_time}`).diff(
          dayjs(`1970-01-01 ${scheduleInfo.start_time}`),
          "hour",
          true
        )
      : 8; // Default to 8 hours if no schedule

  const scheduledWorkHours =
    scheduledRawHours -
    (scheduleInfo.break_duration ? scheduleInfo.break_duration / 60 : 0);

  const isUndertime = totalHours < scheduledWorkHours - 0.5; // 30-minute tolerance
  const isHalfday = totalHours < scheduledWorkHours / 2;

  return {
    total_hours: Math.round(totalHours * 100) / 100,
    undertime_minutes: undertimeMinutes,
    night_differential_hours: nightDiffHours,
    rest_day_hours_worked: restDayHours,
    is_undertime: isUndertime,
    is_halfday: isHalfday,
  };
};

// Payroll-friendly hour rounding
export const roundToPayrollIncrement = (hours) => {
  const wholeHours = Math.floor(hours);
  const minutes = (hours - wholeHours) * 60;

  if (minutes <= 15) {
    return wholeHours; // Round down
  } else if (minutes <= 45) {
    return wholeHours + 0.5; // Round to half hour
  } else {
    return wholeHours + 1; // Round up
  }
};

// Update attendance with enhanced calculations
export const updateAttendanceWithEnhancedCalculations = async (
  attendanceId,
  calculations
) => {
  try {
    const result = await pool.query(
      `
      UPDATE attendance 
      SET 
        total_hours = $1,
        late_minutes = $2,
        undertime_minutes = $3,
        night_differential_hours = $4,
        rest_day_hours_worked = $5,
        is_undertime = $6,
        is_halfday = $7,
        is_entitled_holiday = $8,
        updated_at = NOW()
      WHERE attendance_id = $9
      RETURNING *
    `,
      [
        calculations.total_hours,
        calculations.late_minutes || 0,
        calculations.undertime_minutes || 0,
        calculations.night_differential_hours || 0,
        calculations.rest_day_hours_worked || 0,
        calculations.is_undertime || false,
        calculations.is_halfday || false,
        calculations.is_entitled_holiday || false,
        attendanceId,
      ]
    );

    return result.rows[0];
  } catch (error) {
    console.error(
      "Error updating attendance with enhanced calculations:",
      error
    );
    throw error;
  }
};
