import { pool } from "../config/db.js";

/**
 * Enhanced attendance calculation helper functions
 * Using native JavaScript Date objects for UTC consistency with PostgreSQL timestamptz
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

// Utility: parse "YYYY-MM-DD HH:mm:ss" in Manila → UTC Date
function parseManilaToUTC(dateTimeString) {
  // Manila is UTC+8, so subtract 8 hours to get UTC
  const [date, time] = dateTimeString.split(" ");
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm, ss] = time.split(":").map(Number);
  return new Date(Date.UTC(y, m - 1, d, hh - 8, mm, ss));
}

// Utility: get YYYY-MM-DD from UTC date
function formatDateUTC(date) {
  return date.toISOString().split("T")[0];
}

// Utility: diff in fractional hours
function diffHoursUTC(start, end) {
  return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
}

// Utility: diff in minutes
function diffMinutesUTC(start, end) {
  return (end.getTime() - start.getTime()) / (1000 * 60);
}

// Calculate late minutes
export const calculateLateMinutes = (clockInTime, scheduledStartTime) => {
  if (!scheduledStartTime) return 0;

  const clockIn = new Date(clockInTime);

  // Parse scheduled start time for the same date as clock-in
  const clockInDate = clockIn.toISOString().split("T")[0];
  const scheduledStart = new Date(`${clockInDate}T${scheduledStartTime}`);

  if (clockIn > scheduledStart) {
    return diffMinutesUTC(scheduledStart, clockIn);
  }

  return 0;
};

// Calculate undertime minutes
export const calculateUndertimeMinutes = (clockOutTime, scheduledEndTime) => {
  if (!scheduledEndTime) return 0;

  const clockOut = new Date(clockOutTime);

  // Parse scheduled end time for the same date as clock-out
  const clockOutDate = clockOut.toISOString().split("T")[0];
  const scheduledEnd = new Date(`${clockOutDate}T${scheduledEndTime}`);

  if (clockOut < scheduledEnd) {
    return diffMinutesUTC(clockOut, scheduledEnd);
  }

  return 0;
};

// Calculate night differential hours (10pm to 6am)
export const calculateNightDifferentialHours = (
  timeIn,
  timeOut,
  scheduleInfo
) => {
  if (!timeIn || !timeOut) return 0;

  const start = new Date(timeIn);
  let end = new Date(timeOut);

  // Handle overnight shifts
  if (end <= start) {
    end = new Date(end.getTime() + 24 * 60 * 60 * 1000);
  }

  // Calculate actual break period using schedule break_start and break_end
  let breakStart = null;
  let breakEnd = null;

  if (scheduleInfo?.break_start && scheduleInfo?.break_end) {
    // Parse break times on the same date as clock-in
    const clockInDate = start.toISOString().split("T")[0];
    breakStart = new Date(`${clockInDate}T${scheduleInfo.break_start}`);
    breakEnd = new Date(`${clockInDate}T${scheduleInfo.break_end}`);

    // Handle overnight shifts - if break times are before actual start time,
    // they likely fall on the next day
    if (breakStart < start) {
      // Shift started before break time, so break is on the same day
      // No adjustment needed
    } else if (scheduleInfo?.start_time) {
      // Check if this is an overnight shift
      const scheduleStart = new Date(
        `${clockInDate}T${scheduleInfo.start_time}`
      );
      const scheduleEnd = new Date(
        `${clockInDate}T${scheduleInfo.end_time || "23:59:59"}`
      );

      // If schedule end is before schedule start, it's an overnight shift
      if (scheduleEnd <= scheduleStart && breakStart > scheduleStart) {
        // Break times should be adjusted for overnight shift
        // If break is after midnight, no adjustment needed
        // If break is before midnight but after shift start, no adjustment needed
      }
    }
  }

  let nightHours = 0;
  let current = new Date(start);

  while (current < end) {
    const hour = current.getUTCHours();

    // Convert UTC hour to Manila time (UTC+8)
    const manilaHour = (hour + 8) % 24;

    // Night differential hours: 10 PM to 6 AM Manila time
    if (manilaHour >= 22 || manilaHour < 6) {
      const nextHour = new Date(current.getTime() + 60 * 60 * 1000);
      const segmentEnd = nextHour > end ? end : nextHour;

      // Check if this hour segment overlaps with break time
      let segmentStart = current;
      let actualSegmentEnd = segmentEnd;

      if (breakStart && breakEnd) {
        // If break overlaps with this night differential segment, exclude it
        if (breakStart < segmentEnd && breakEnd > segmentStart) {
          // Calculate non-break portions of this segment
          const beforeBreak =
            breakStart > segmentStart
              ? diffMinutesUTC(segmentStart, breakStart)
              : 0;
          const afterBreak =
            breakEnd < segmentEnd ? diffMinutesUTC(breakEnd, segmentEnd) : 0;

          nightHours += (beforeBreak + afterBreak) / 60;
        } else {
          // No break overlap, count full segment
          const minutesInSegment = diffMinutesUTC(
            segmentStart,
            actualSegmentEnd
          );
          nightHours += minutesInSegment / 60;
        }
      } else {
        // No break time defined, count full segment
        const minutesInSegment = diffMinutesUTC(segmentStart, actualSegmentEnd);
        nightHours += minutesInSegment / 60;
      }
    }

    // Move to next hour boundary
    current = new Date(current);
    current.setUTCHours(current.getUTCHours() + 1, 0, 0, 0);
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

// ---- Clock-in ----
// scheduleInfo should contain: { start_time, end_time }
// TODO: Later add { break_start, break_end } for break entitlement calculations
export const enhancedClockInCalculation = async (
  employeeId,
  clockInTime, // should be ISO string or UTC Date
  scheduleInfo,
  holidayInfo
) => {
  const lateMinutes = calculateLateMinutes(
    clockInTime,
    scheduleInfo.start_time
  );

  const isEntitledHoliday = await calculateHolidayEntitlement(
    employeeId,
    formatDateUTC(new Date(clockInTime)), // YYYY-MM-DD UTC
    holidayInfo.isRegularHoliday,
    holidayInfo.isSpecialHoliday
  );

  // Enhanced holiday logic: store holiday details in payroll_breakdown for clock-in
  const holidayDetails = {
    holiday_name: holidayInfo.holidayName,
    holiday_type: holidayInfo.holidayType,
    is_entitled: isEntitledHoliday,
    expected_premium_rate: holidayInfo.isRegularHoliday
      ? 2.0
      : holidayInfo.isSpecialHoliday
      ? 1.3
      : 1.0,
  };

  return {
    late_minutes: lateMinutes,
    is_late: lateMinutes > 0,
    is_entitled_holiday: isEntitledHoliday,
    is_regular_holiday: holidayInfo.isRegularHoliday,
    is_special_holiday: holidayInfo.isSpecialHoliday,
    holiday_details: holidayDetails,
  };
};

// ---- Clock-out ----
// scheduleInfo should contain: { start_time, end_time, break_duration }
// TODO: Later add { break_start, break_end } for more precise break calculations
export const enhancedClockOutCalculation = async (
  attendanceRecord,
  clockOutTime, // ISO string or UTC Date
  scheduleInfo
) => {
  const { time_in, is_dayoff, is_regular_holiday, is_special_holiday } =
    attendanceRecord;

  const timeIn = new Date(time_in);
  let timeOut = new Date(clockOutTime);

  // Handle overnight (if clockOut before clockIn)
  if (timeOut < timeIn) {
    timeOut = new Date(timeOut.getTime() + 24 * 60 * 60 * 1000);
  }

  // Raw worked hours
  let rawHours = diffHoursUTC(timeIn, timeOut);

  // Enhanced break deduction using actual break_start and break_end times
  let totalHours = rawHours;
  let actualBreakDeduction = 0;

  if (scheduleInfo.break_start && scheduleInfo.break_end) {
    // Parse break times for the correct date
    const workDate = timeIn.toISOString().split("T")[0];
    const breakStart = new Date(`${workDate}T${scheduleInfo.break_start}`);
    const breakEnd = new Date(`${workDate}T${scheduleInfo.break_end}`);

    // Handle overnight shifts - adjust break times if necessary
    let adjustedBreakStart = breakStart;
    let adjustedBreakEnd = breakEnd;

    // If break times are before timeIn, they might be on the next day for overnight shifts
    if (
      breakStart < timeIn &&
      scheduleInfo.start_time &&
      scheduleInfo.end_time
    ) {
      const scheduleStart = new Date(`${workDate}T${scheduleInfo.start_time}`);
      const scheduleEnd = new Date(`${workDate}T${scheduleInfo.end_time}`);

      // Check if this is an overnight shift
      if (scheduleEnd <= scheduleStart) {
        // This is an overnight shift, check if break should be on next day
        if (breakStart.getHours() >= scheduleStart.getHours()) {
          // Break is likely on the same day
        } else {
          // Break is likely on the next day
          adjustedBreakStart = new Date(
            breakStart.getTime() + 24 * 60 * 60 * 1000
          );
          adjustedBreakEnd = new Date(breakEnd.getTime() + 24 * 60 * 60 * 1000);
        }
      }
    }

    // Only deduct break time if the employee worked through the break period
    if (timeIn <= adjustedBreakStart && timeOut >= adjustedBreakEnd) {
      // Employee worked through the entire break period
      const breakDurationHours = diffHoursUTC(
        adjustedBreakStart,
        adjustedBreakEnd
      );
      actualBreakDeduction = roundToPayrollIncrement(breakDurationHours);
    } else if (timeIn < adjustedBreakEnd && timeOut > adjustedBreakStart) {
      // Employee worked during part of the break period
      const overlapStart =
        timeIn > adjustedBreakStart ? timeIn : adjustedBreakStart;
      const overlapEnd =
        timeOut < adjustedBreakEnd ? timeOut : adjustedBreakEnd;
      const overlapHours = diffHoursUTC(overlapStart, overlapEnd);
      actualBreakDeduction = roundToPayrollIncrement(overlapHours);
    }
    // If no overlap, no break deduction (employee didn't work during break)

    totalHours -= actualBreakDeduction;
  } else if (scheduleInfo.break_duration && rawHours >= 4) {
    // Fallback to old break_duration logic for backward compatibility
    const breakHours = roundToPayrollIncrement(
      scheduleInfo.break_duration / 60
    );
    actualBreakDeduction = breakHours;
    totalHours -= breakHours;
  }

  if (totalHours < 0) totalHours = 0;

  // Undertime minutes
  const undertimeMinutes = calculateUndertimeMinutes(
    clockOutTime,
    scheduleInfo.end_time
  );

  // Night differential hours (always calculate, regardless of day type)
  const nightDiffHours = calculateNightDifferentialHours(
    time_in,
    clockOutTime,
    scheduleInfo
  );

  // Rest day hours (if it's a day off, all hours are rest day hours)
  const restDayHours = calculateRestDayHours(
    time_in,
    clockOutTime,
    totalHours,
    is_dayoff
  );

  // === ENHANCED HOLIDAY HOURS CALCULATION WITH RATE STACKING ===
  let regularHolidayHours = 0;
  let specialHolidayHours = 0;

  // NEW: Holiday rate stacking multipliers for comprehensive edge cases
  let holidayBaseMultiplier = 1.0; // Base rate multiplier for holidays
  let holidayOTMultiplier = 1.25; // Overtime multiplier for holidays
  let holidayNDMultiplier = 1.1; // Night diff multiplier for holidays

  if (is_regular_holiday) {
    regularHolidayHours = totalHours; // All hours worked on regular holiday
    holidayBaseMultiplier = 2.0; // Regular holiday = 200% base rate
    holidayOTMultiplier = 2.6; // Regular holiday OT = 260% (200% + 30% of 200%)
    holidayNDMultiplier = 2.2; // Regular holiday ND = 220% (200% + 10% of 200%)

    // ULTIMATE EDGE CASE: Rest Day + Regular Holiday stacking
    if (is_dayoff) {
      holidayBaseMultiplier = 2.6; // Rest Day (130%) + Regular Holiday (200%) = 260%
      holidayOTMultiplier = 3.38; // 260% + 30% of 260% = 338%
      holidayNDMultiplier = 2.86; // 260% + 10% of 260% = 286%
    }
  }

  if (is_special_holiday) {
    specialHolidayHours = totalHours; // All hours worked on special holiday
    holidayBaseMultiplier = 1.3; // Special holiday = 130% base rate
    holidayOTMultiplier = 1.69; // Special holiday OT = 169% (130% + 30% of 130%)
    holidayNDMultiplier = 1.43; // Special holiday ND = 143% (130% + 10% of 130%)

    // EDGE CASE: Rest Day + Special Holiday stacking
    if (is_dayoff) {
      holidayBaseMultiplier = 1.69; // Rest Day (130%) + Special Holiday (130%) = 169%
      holidayOTMultiplier = 2.2; // 169% + 30% of 169% = 220%
      holidayNDMultiplier = 1.86; // 169% + 10% of 169% = 186%
    }
  }

  // Scheduled shift (with overnight handling)
  let [startH, startM] = scheduleInfo.start_time.split(":").map(Number);
  let [endH, endM] = scheduleInfo.end_time.split(":").map(Number);

  let schedStart = new Date(Date.UTC(1970, 0, 1, startH - 8, startM));
  let schedEnd = new Date(Date.UTC(1970, 0, 1, endH - 8, endM));
  if (schedEnd <= schedStart) {
    schedEnd = new Date(schedEnd.getTime() + 24 * 60 * 60 * 1000);
  }

  let scheduledRawHours = diffHoursUTC(schedStart, schedEnd);

  // Calculate scheduled break hours using new break_start/break_end logic
  let scheduledBreakHours = 0;
  if (scheduleInfo.break_start && scheduleInfo.break_end) {
    const [breakStartH, breakStartM] = scheduleInfo.break_start
      .split(":")
      .map(Number);
    const [breakEndH, breakEndM] = scheduleInfo.break_end
      .split(":")
      .map(Number);

    const breakStart = new Date(
      Date.UTC(1970, 0, 1, breakStartH - 8, breakStartM)
    );
    const breakEnd = new Date(Date.UTC(1970, 0, 1, breakEndH - 8, breakEndM));

    const breakDurationHours = diffHoursUTC(breakStart, breakEnd);
    scheduledBreakHours = roundToPayrollIncrement(breakDurationHours);
  } else if (scheduleInfo.break_duration) {
    // Fallback to break_duration for backward compatibility
    scheduledBreakHours = roundToPayrollIncrement(
      scheduleInfo.break_duration / 60
    );
  }

  const scheduledWorkHours = scheduledRawHours - scheduledBreakHours;

  // === OVERTIME CALCULATION ===
  // Overtime applies when total hours exceed scheduled hours
  // BUT overtime calculation differs based on day type:
  // - Regular day: Standard overtime after 8 hours
  // - Day off: All hours are overtime (but also rest day premium)
  // - Holiday: Depends on company policy, but usually overtime after 8 hours

  let overtimeHours = 0;
  let baseOvertimeThreshold = scheduledWorkHours;

  // For rest days, company policy varies:
  // Option 1: All rest day hours are premium, overtime starts after 8 hours
  // Option 2: All rest day hours are overtime
  // We'll use Option 1 (more common)
  if (is_dayoff && !is_regular_holiday && !is_special_holiday) {
    // Pure rest day: overtime after 8 hours of rest day work
    baseOvertimeThreshold = 8;
  }

  if (totalHours > baseOvertimeThreshold) {
    overtimeHours = totalHours - baseOvertimeThreshold;
  }

  // === COMPREHENSIVE OVERTIME BREAKDOWN ===
  // Now we need to categorize what TYPE of overtime each hour is

  // Calculate base hours (non-overtime hours)
  const baseHours = totalHours - overtimeHours;

  // Now break down the overtime by type
  let regularOvertimeHours = 0;
  let nightDiffOvertimeHours = 0;
  let restDayOvertimeHours = 0;
  let regularHolidayOvertimeHours = 0;
  let specialHolidayOvertimeHours = 0;

  if (overtimeHours > 0) {
    // IMPROVED OVERTIME ALLOCATION LOGIC
    // We need to determine which specific hours are overtime
    // For a 6PM-10PM (12 hour) shift with 11 worked hours and 3 OT hours:
    // - First 8 hours are base hours
    // - Next 3 hours are overtime hours
    // - We need to see which of those overtime hours fall into ND period (10PM-6AM)

    let remainingOvertimeToAllocate = overtimeHours;

    // 1. Holiday overtime (if working on holiday)
    if (is_regular_holiday && remainingOvertimeToAllocate > 0) {
      regularHolidayOvertimeHours = Math.min(
        remainingOvertimeToAllocate,
        overtimeHours
      );
      remainingOvertimeToAllocate -= regularHolidayOvertimeHours;
    }

    if (is_special_holiday && remainingOvertimeToAllocate > 0) {
      specialHolidayOvertimeHours = Math.min(
        remainingOvertimeToAllocate,
        overtimeHours
      );
      remainingOvertimeToAllocate -= specialHolidayOvertimeHours;
    }

    // 2. Rest day overtime (if working on day off)
    if (is_dayoff && remainingOvertimeToAllocate > 0) {
      restDayOvertimeHours = Math.min(
        remainingOvertimeToAllocate,
        overtimeHours
      );
      remainingOvertimeToAllocate -= restDayOvertimeHours;
    }

    // 3. Night differential overtime
    // For your test case: 8 ND hours, 8 scheduled hours, 3 overtime hours
    // We need to determine how many of those 3 overtime hours are also ND hours
    if (nightDiffHours > 0 && remainingOvertimeToAllocate > 0) {
      // Method: Proportional allocation based on overlap
      // If we have 8 ND hours out of 11 total hours, and 3 overtime hours,
      // then proportionally: (8/11) * 3 = 2.18 hours of ND overtime

      const nightDiffProportion = nightDiffHours / totalHours;
      const proportionalNightDiffOvertimeHours =
        overtimeHours * nightDiffProportion;

      nightDiffOvertimeHours = Math.min(
        remainingOvertimeToAllocate,
        Math.round(proportionalNightDiffOvertimeHours * 100) / 100
      );
      remainingOvertimeToAllocate -= nightDiffOvertimeHours;
    }

    // 4. Regular overtime (whatever remains)
    if (remainingOvertimeToAllocate > 0) {
      regularOvertimeHours = remainingOvertimeToAllocate;
    }
  }

  // === PREMIUM HOURS BREAKDOWN ===
  // Break down each premium type into regular vs overtime portions

  // Night Differential breakdown
  const nightDiffRegularHours = Math.max(
    0,
    nightDiffHours - nightDiffOvertimeHours
  );

  // Rest Day breakdown
  const restDayRegularHours = Math.max(0, restDayHours - restDayOvertimeHours);

  // Holiday breakdown
  const regularHolidayRegularHours = Math.max(
    0,
    regularHolidayHours - regularHolidayOvertimeHours
  );
  const specialHolidayRegularHours = Math.max(
    0,
    specialHolidayHours - specialHolidayOvertimeHours
  );

  // Calculate pure regular hours (no premiums, no overtime)
  let pureRegularHours = totalHours;
  pureRegularHours -= nightDiffHours;
  pureRegularHours -= restDayHours;
  pureRegularHours -= regularHolidayHours;
  pureRegularHours -= specialHolidayHours;
  pureRegularHours -= regularOvertimeHours;
  pureRegularHours = Math.max(0, pureRegularHours);

  const isUndertime = totalHours < scheduledWorkHours - 0.5; // 30-min tolerance
  const isHalfday = totalHours < scheduledWorkHours / 2;

  // === COMPREHENSIVE PAYROLL BREAKDOWN JSON WITH PROPER ROUNDING ===
  const payrollBreakdown = {
    regular_hours: roundToPayrollIncrement(pureRegularHours),

    overtime: {
      total: roundToPayrollIncrement(overtimeHours),
      regular_overtime: roundToPayrollIncrement(regularOvertimeHours),
      night_diff_overtime: roundToPayrollIncrement(nightDiffOvertimeHours),
      rest_day_overtime: roundToPayrollIncrement(restDayOvertimeHours),
      regular_holiday_overtime: roundToPayrollIncrement(
        regularHolidayOvertimeHours
      ),
      special_holiday_overtime: roundToPayrollIncrement(
        specialHolidayOvertimeHours
      ),
    },

    premiums: {
      night_differential: {
        total: roundToPayrollIncrement(nightDiffHours),
        regular: roundToPayrollIncrement(nightDiffRegularHours),
        overtime: roundToPayrollIncrement(nightDiffOvertimeHours),
      },

      rest_day: {
        total: roundToPayrollIncrement(restDayHours),
        regular: roundToPayrollIncrement(restDayRegularHours),
        overtime: roundToPayrollIncrement(restDayOvertimeHours),
      },

      holidays: {
        regular_holiday: {
          total: roundToPayrollIncrement(regularHolidayHours),
          regular: roundToPayrollIncrement(regularHolidayRegularHours),
          overtime: roundToPayrollIncrement(regularHolidayOvertimeHours),
          night_diff: roundToPayrollIncrement(
            Math.min(nightDiffHours, regularHolidayHours)
          ),
          rest_day:
            is_dayoff && is_regular_holiday
              ? roundToPayrollIncrement(regularHolidayHours)
              : 0,
        },

        special_holiday: {
          total: roundToPayrollIncrement(specialHolidayHours),
          regular: roundToPayrollIncrement(specialHolidayRegularHours),
          overtime: roundToPayrollIncrement(specialHolidayOvertimeHours),
          night_diff: roundToPayrollIncrement(
            Math.min(nightDiffHours, specialHolidayHours)
          ),
          rest_day:
            is_dayoff && is_special_holiday
              ? roundToPayrollIncrement(specialHolidayHours)
              : 0,
        },
      },
    },

    deductions: {
      undertime_hours: roundToPayrollIncrement(undertimeMinutes / 60),
      late_hours: 0.0, // TODO: Add late hours calculation from clock-in
    },

    // Edge case flags for payroll processing
    edge_case_flags: {
      is_day_off: is_dayoff || false,
      is_regular_holiday: is_regular_holiday || false,
      is_special_holiday: is_special_holiday || false,
      is_day_off_and_regular_holiday:
        (is_dayoff && is_regular_holiday) || false,
      is_day_off_and_special_holiday:
        (is_dayoff && is_special_holiday) || false,
      has_night_differential: nightDiffHours > 0,
      has_overtime: overtimeHours > 0,
      has_multiple_premiums:
        (nightDiffHours > 0 ? 1 : 0) +
          (restDayHours > 0 ? 1 : 0) +
          (regularHolidayHours > 0 ? 1 : 0) +
          (specialHolidayHours > 0 ? 1 : 0) >
        1,
    },
  };

  return {
    total_hours: roundToPayrollIncrement(totalHours),
    overtime_hours: roundToPayrollIncrement(overtimeHours),
    regular_overtime_hours: roundToPayrollIncrement(regularOvertimeHours),
    night_diff_overtime_hours: roundToPayrollIncrement(nightDiffOvertimeHours),
    rest_day_overtime_hours: roundToPayrollIncrement(restDayOvertimeHours),
    undertime_minutes: undertimeMinutes,
    night_differential_hours: roundToPayrollIncrement(nightDiffHours),
    rest_day_hours_worked: roundToPayrollIncrement(restDayHours),
    regular_holiday_hours_worked: roundToPayrollIncrement(regularHolidayHours),
    special_holiday_hours_worked: roundToPayrollIncrement(specialHolidayHours),
    is_undertime: isUndertime,
    is_halfday: isHalfday,
    payroll_breakdown: payrollBreakdown,
  };
};

export const roundToPayrollIncrement = (hours) => {
  const wholeHours = Math.floor(hours);
  const minutes = (hours - wholeHours) * 60;

  // Custom payroll rounding rules:
  // 1-15 mins: round down to hour
  // 16-45 mins: round to 0.5 (30 minutes)
  // 46-60 mins: round up to next hour
  if (minutes <= 15) {
    return wholeHours; // Round down to hour
  } else if (minutes <= 45) {
    return wholeHours + 0.5; // Round to half hour
  } else {
    return wholeHours + 1; // Round up to next hour
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
