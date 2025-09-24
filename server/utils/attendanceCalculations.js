import { pool } from "../config/db.js";
import AdvancedPayrollCalculator from "../services/AdvancedPayrollCalculator.js";
/**
 * Enhanced attendance calculation helper functions
 * Using native JavaScript Date objects for UTC consistency with PostgreSQL timestamptz
 */

// TODO: Move to database configuration table
const PAYROLL_CONFIG = {
  double_holiday_policy: "highest_only", // 'highest_only' | 'stacked'
  early_clockin_neglect_enabled: true,
  // Add more configuration options here as needed
};

// Check if a date is a holiday and get holiday details
export const getHolidayInfo = async (clockInTime) => {
  try {
    const clockInDate = new Date(clockInTime);

    // Extract YYYY-MM-DD in local (not UTC)
    const localDateString = clockInDate.toLocaleDateString("en-CA", {
      timeZone: "Asia/Manila",
    });
    // "en-CA" => YYYY-MM-DD format

    const result = await pool.query(
      `SELECT holiday_id, name, holiday_type, is_active
       FROM holidays
       WHERE date = $1 AND is_active = true
       ORDER BY
         CASE holiday_type
           WHEN 'regular' THEN 1
           WHEN 'special' THEN 2
           ELSE 3
         END`,
      [localDateString]
    );

    // If multiple holidays on same date, prioritize regular over special
    const holidayInfo = result.rows[0] || null;
    const isRegularHoliday = holidayInfo?.holiday_type === "regular";
    const isSpecialHoliday = holidayInfo?.holiday_type === "special";

    return {
      holidayId: holidayInfo?.holiday_id || null,
      holidayName: holidayInfo?.name || null,
      holidayType: holidayInfo?.holiday_type || null,
      holidayIsActive: holidayInfo?.is_active || null,
      isRegularHoliday,
      isSpecialHoliday,
    };
  } catch (err) {
    console.error("Error fetching holiday info:", err);
    return null;
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

  // Use the same date as clock-in
  const clockInDate = clockIn.toISOString().split("T")[0];
  let scheduledStart = new Date(`${clockInDate}T${scheduledStartTime}`);

  // Handle cross-midnight shifts: adjust if the difference is too large
  const diffHours = (clockIn - scheduledStart) / (1000 * 60 * 60);

  if (diffHours > 12) {
    // Clock-in is way after scheduled start → shift start forward 1 day
    scheduledStart.setDate(scheduledStart.getDate() + 1);
  } else if (diffHours < -12) {
    // Scheduled start is way after clock-in → shift start back 1 day
    scheduledStart.setDate(scheduledStart.getDate() - 1);
  }

  console.log("Clock In", clockIn);
  console.log("Scheduled Start Parsed:", scheduledStart);

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
export const enhancedClockInCalculation = async (
  employeeId,
  clockInTime, // should be ISO string or UTC Date
  scheduleInfo,
  holidayInfo
) => {
  // console.log("Employee ID:", employeeId);
  // console.log("Clock-in Time:", clockInTime);
  // console.log("Schedule Info:", scheduleInfo);
  // console.log("Holiday Info:", holidayInfo);

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

  return {
    late_minutes: lateMinutes,
    is_late: lateMinutes > 0,
    is_entitled_holiday: isEntitledHoliday,
    is_regular_holiday: holidayInfo.isRegularHoliday,
    is_special_holiday: holidayInfo.isSpecialHoliday,
  };
};

function buildBreakWindow(timeIn, breakStartStr, breakEndStr) {
  // breakStartStr like "02:00:00", breakEndStr like "03:00:00"
  const [bsHour, bsMin, bsSec] = breakStartStr.split(":").map(Number);
  const [beHour, beMin, beSec] = breakEndStr.split(":").map(Number);

  const breakStart = new Date(timeIn);
  breakStart.setHours(bsHour, bsMin, bsSec, 0);

  const breakEnd = new Date(timeIn);
  breakEnd.setHours(beHour, beMin, beSec, 0);

  // Handle overnight shifts: if break times are before timeIn, they're likely on the next day
  if (breakStart < timeIn) {
    // Break is on the next day for overnight shifts
    breakStart.setDate(breakStart.getDate() + 1);
    breakEnd.setDate(breakEnd.getDate() + 1);
  }

  return { breakStart, breakEnd };
}

// ---- Clock-out ----
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
    // let adjustedBreakStart = breakStart;
    // let adjustedBreakEnd = breakEnd;

    // If break times are before timeIn, they might be on the next day for overnight shifts
    if (
      breakStart < timeIn &&
      scheduleInfo.start_time &&
      scheduleInfo.end_time
    ) {
      const scheduleStart = new Date(`${workDate}T${scheduleInfo.start_time}`);
      const scheduleEnd = new Date(`${workDate}T${scheduleInfo.end_time}`);

      // Check if this is an overnight shift
      // if (scheduleEnd <= scheduleStart) {
      //   // This is an overnight shift, check if break should be on next day
      //   if (breakStart.getHours() >= scheduleStart.getHours()) {
      //     // Break is likely on the same day
      //   } else {
      //     // Break is likely on the next day
      //     adjustedBreakStart = new Date(
      //       breakStart.getTime() + 24 * 60 * 60 * 1000
      //     );
      //     adjustedBreakEnd = new Date(breakEnd.getTime() + 24 * 60 * 60 * 1000);
      //   }
      // }
    }

    const { breakStart: adjustedBreakStart, breakEnd: adjustedBreakEnd } =
      buildBreakWindow(
        timeIn,
        scheduleInfo.break_start,
        scheduleInfo.break_end
      );

    // console.log("[DEBUG] Adjusted Break Start:", adjustedBreakStart);
    // console.log("[DEBUG] Adjusted Break End:", adjustedBreakEnd);

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
    // console.log("[CALC 1] Actual Break Deduction Hours:", actualBreakDeduction);
    // console.log("[CALC 1] Total Hours after Break Deduction:", totalHours);

    // console.log("timeIn:", timeIn.toISOString(), timeIn.getTime());
    // console.log("timeOut:", timeOut.toISOString(), timeOut.getTime());
    // console.log(
    //   "breakStart:",
    //   adjustedBreakStart.toISOString(),
    //   adjustedBreakStart.getTime()
    // );
    // console.log(
    //   "breakEnd:",
    //   adjustedBreakEnd.toISOString(),
    //   adjustedBreakEnd.getTime()
    // );
  } else if (scheduleInfo.break_duration && rawHours >= 4) {
    // Fallback to old break_duration logic for backward compatibility
    const breakHours = roundToPayrollIncrement(
      scheduleInfo.break_duration / 60
    );
    actualBreakDeduction = breakHours;
    totalHours -= breakHours;

    // console.log("[CALC 2] Actual Break Deduction Hours:", actualBreakDeduction);
    // console.log("[CALC 2] Total Hours after Break Deduction:", totalHours);
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

  // === EARLY CLOCK-IN NEGLECT FEATURE ===
  // Option to ignore early clock-in minutes from overtime calculations
  const NEGLECT_EARLY_IN_MINUTES = PAYROLL_CONFIG.early_clockin_neglect_enabled;

  let adjustedTotalHours = totalHours;
  let earlyClockInDeduction = 0;

  if (NEGLECT_EARLY_IN_MINUTES && scheduleInfo.start_time) {
    // Calculate scheduled start time for comparison using the same logic as calculateLateMinutes
    const timeInDate = new Date(timeIn);

    // Parse schedule start time on the same date as timeIn initially
    const clockInDate = timeInDate.toISOString().split("T")[0];
    let scheduledStart = new Date(`${clockInDate}T${scheduleInfo.start_time}`);

    // Handle cross-midnight shifts: adjust if the difference is too large
    const diffHours = (timeInDate - scheduledStart) / (1000 * 60 * 60);
    if (diffHours > 12) {
      // Clock-in is way after scheduled start → shift start forward 1 day
      scheduledStart.setDate(scheduledStart.getDate() + 1);
    } else if (diffHours < -12) {
      // Scheduled start is way after clock-in → shift start back 1 day
      scheduledStart.setDate(scheduledStart.getDate() - 1);
    }

    console.log("[DEBUG] TimeIn:", timeInDate.toISOString());
    console.log(
      "[DEBUG] Scheduled Start for Early In Check:",
      scheduledStart.toISOString()
    );

    // Calculate early clock-in minutes
    if (timeIn < scheduledStart) {
      const earlyMinutes =
        (scheduledStart.getTime() - timeIn.getTime()) / (1000 * 60);
      earlyClockInDeduction = earlyMinutes / 60;
      adjustedTotalHours = Math.max(0, totalHours - earlyClockInDeduction);

      console.log(
        `[DEBUG] Early clock-in detected: ${earlyMinutes.toFixed(2)} minutes (${
          earlyMinutes / 60
        } hours deducted)`
      );
      console.log(
        `[EARLY CLOCK-IN] Original total hours: ${totalHours}, Adjusted: ${adjustedTotalHours}`
      );
    } else {
      console.log("[DEBUG] No early clock-in detected");
    }
  }

  // Rest day hours (if it's a day off, all hours are rest day hours)
  const restDayHours = calculateRestDayHours(
    time_in,
    clockOutTime,
    adjustedTotalHours,
    is_dayoff
  );

  // === COMPREHENSIVE HOLIDAY HOURS CALCULATION ===
  // Implementing all edge cases including stacking logic
  let regularHolidayHours = 0;
  let specialHolidayHours = 0;
  let regularHolidayRestDayHours = 0; // Day off + regular holiday
  let specialHolidayRestDayHours = 0; // Day off + special holiday

  // Apply double holiday policy
  if (PAYROLL_CONFIG.double_holiday_policy === "stacked") {
    // STACKED: Allow both regular and special holidays to be applied simultaneously
    // This means employee gets BOTH regular holiday pay (200%) AND special holiday pay (130%)
    // Resulting in higher total compensation but more complex calculations
    if (is_regular_holiday) {
      regularHolidayHours = adjustedTotalHours; // All hours worked on regular holiday
      if (is_dayoff) {
        regularHolidayRestDayHours = adjustedTotalHours;
      }
    }

    if (is_special_holiday) {
      specialHolidayHours = adjustedTotalHours; // All hours worked on special holiday
      if (is_dayoff) {
        specialHolidayRestDayHours = adjustedTotalHours;
      }
    }
  } else {
    // HIGHEST_ONLY (default): Regular holidays take precedence over special holidays
    // When both occur on the same day, only regular holiday pay applies
    if (is_regular_holiday) {
      regularHolidayHours = adjustedTotalHours; // All hours worked on regular holiday
      if (is_dayoff) {
        regularHolidayRestDayHours = adjustedTotalHours;
      }
    } else if (is_special_holiday) {
      specialHolidayHours = adjustedTotalHours; // All hours worked on special holiday
      if (is_dayoff) {
        specialHolidayRestDayHours = adjustedTotalHours;
      }
    }
  }

  // CRITICAL: Holiday + Day Off stacking logic
  // When an employee works on a holiday that falls on their day off,
  // they are entitled to BOTH holiday premium AND rest day premium
  // This is the "ultimate edge case" that requires careful calculation

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
  // Overtime applies when adjusted total hours exceed scheduled hours
  // BUT overtime calculation differs based on day type:
  // - Regular day: Standard overtime after scheduled work hours
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

  if (adjustedTotalHours > baseOvertimeThreshold) {
    overtimeHours = adjustedTotalHours - baseOvertimeThreshold;
    console.log("[CALC] Adjusted Total Hours:", adjustedTotalHours);
    console.log("[CALC] Base Overtime Threshold:", baseOvertimeThreshold);
    console.log("[CALC] Overtime Hours:", overtimeHours);
  }

  // === COMPREHENSIVE OVERTIME BREAKDOWN ===
  // Now we need to categorize what TYPE of overtime each hour is
  // CRITICAL: Holiday overtime calculation with proper stacking

  // Calculate base hours (non-overtime hours) using adjusted total hours
  const baseHours = adjustedTotalHours - overtimeHours;

  // Now break down the overtime by type with proper priority
  let regularOvertimeHours = 0;
  let nightDiffOvertimeHours = 0;
  let restDayOvertimeHours = 0;
  let regularHolidayOvertimeHours = 0;
  let specialHolidayOvertimeHours = 0;
  let regularHolidayRestDayOvertimeHours = 0; // Ultimate case: Holiday + Rest Day OT
  let specialHolidayRestDayOvertimeHours = 0; // Ultimate case: Holiday + Rest Day OT

  // Combined OT types for stacked premiums
  let nightDiffRegularHolidayOvertimeHours = 0;
  let nightDiffSpecialHolidayOvertimeHours = 0;
  let nightDiffRestDayOvertimeHours = 0;
  // Ultimate 3-stack combinations
  let nightDiffRegularHolidayRestDayOvertimeHours = 0;
  let nightDiffSpecialHolidayRestDayOvertimeHours = 0;

  if (overtimeHours > 0) {
    // IMPROVED OVERTIME ALLOCATION LOGIC WITH HOLIDAY STACKING
    // Priority order for overtime classification:
    // 1. ND + Holiday + Rest Day overtime (ultimate 3-stack)
    // 2. Holiday + Rest Day overtime
    // 3. ND + Holiday overtime
    // 4. ND + Rest Day overtime
    // 5. Night differential overtime
    // 6. Holiday overtime
    // 7. Rest day overtime
    // 8. Regular overtime

    let remainingOvertimeToAllocate = overtimeHours;

    // 1. ULTIMATE 3-STACK: ND + Holiday + Rest Day overtime
    if (
      nightDiffHours > 0 &&
      is_regular_holiday &&
      is_dayoff &&
      remainingOvertimeToAllocate > 0
    ) {
      nightDiffRegularHolidayRestDayOvertimeHours = Math.min(
        nightDiffHours,
        remainingOvertimeToAllocate
      );
      remainingOvertimeToAllocate -=
        nightDiffRegularHolidayRestDayOvertimeHours;
    } else if (
      nightDiffHours > 0 &&
      is_special_holiday &&
      is_dayoff &&
      remainingOvertimeToAllocate > 0
    ) {
      nightDiffSpecialHolidayRestDayOvertimeHours = Math.min(
        nightDiffHours,
        remainingOvertimeToAllocate
      );
      remainingOvertimeToAllocate -=
        nightDiffSpecialHolidayRestDayOvertimeHours;
    }

    // 2. Holiday + Rest Day overtime
    if (is_regular_holiday && is_dayoff && remainingOvertimeToAllocate > 0) {
      const remainingHolidayRestDay =
        regularHolidayRestDayHours -
        nightDiffRegularHolidayRestDayOvertimeHours;
      regularHolidayRestDayOvertimeHours = Math.min(
        remainingHolidayRestDay,
        remainingOvertimeToAllocate
      );
      remainingOvertimeToAllocate -= regularHolidayRestDayOvertimeHours;
    } else if (
      is_special_holiday &&
      is_dayoff &&
      remainingOvertimeToAllocate > 0
    ) {
      const remainingHolidayRestDay =
        specialHolidayRestDayHours -
        nightDiffSpecialHolidayRestDayOvertimeHours;
      specialHolidayRestDayOvertimeHours = Math.min(
        remainingHolidayRestDay,
        remainingOvertimeToAllocate
      );
      remainingOvertimeToAllocate -= specialHolidayRestDayOvertimeHours;
    }

    // 3. Night Diff + Holiday overtime
    if (
      nightDiffHours > 0 &&
      is_regular_holiday &&
      !is_dayoff &&
      remainingOvertimeToAllocate > 0
    ) {
      const remainingNightDiff =
        nightDiffHours - nightDiffRegularHolidayRestDayOvertimeHours;
      nightDiffRegularHolidayOvertimeHours = Math.min(
        remainingNightDiff,
        remainingOvertimeToAllocate
      );
      remainingOvertimeToAllocate -= nightDiffRegularHolidayOvertimeHours;
    } else if (
      nightDiffHours > 0 &&
      is_special_holiday &&
      !is_dayoff &&
      remainingOvertimeToAllocate > 0
    ) {
      const remainingNightDiff =
        nightDiffHours - nightDiffSpecialHolidayRestDayOvertimeHours;
      nightDiffSpecialHolidayOvertimeHours = Math.min(
        remainingNightDiff,
        remainingOvertimeToAllocate
      );
      remainingOvertimeToAllocate -= nightDiffSpecialHolidayOvertimeHours;
    }

    // 4. Night Diff + Rest Day overtime
    if (
      nightDiffHours > 0 &&
      is_dayoff &&
      !is_regular_holiday &&
      !is_special_holiday &&
      remainingOvertimeToAllocate > 0
    ) {
      const remainingNightDiff =
        nightDiffHours -
        nightDiffRegularHolidayRestDayOvertimeHours -
        nightDiffSpecialHolidayRestDayOvertimeHours;
      nightDiffRestDayOvertimeHours = Math.min(
        remainingNightDiff,
        remainingOvertimeToAllocate
      );
      remainingOvertimeToAllocate -= nightDiffRestDayOvertimeHours;
    }

    // 5. Night differential overtime (remaining night diff)
    if (nightDiffHours > 0 && remainingOvertimeToAllocate > 0) {
      const remainingNightDiff =
        nightDiffHours -
        nightDiffRegularHolidayRestDayOvertimeHours -
        nightDiffSpecialHolidayRestDayOvertimeHours -
        nightDiffRegularHolidayOvertimeHours -
        nightDiffSpecialHolidayOvertimeHours -
        nightDiffRestDayOvertimeHours;
      nightDiffOvertimeHours = Math.min(
        remainingNightDiff,
        remainingOvertimeToAllocate
      );
      remainingOvertimeToAllocate -= nightDiffOvertimeHours;
    }

    // 6. Holiday overtime (if not already allocated above)
    if (is_regular_holiday && !is_dayoff && remainingOvertimeToAllocate > 0) {
      regularHolidayOvertimeHours = Math.min(
        remainingOvertimeToAllocate,
        overtimeHours
      );
      remainingOvertimeToAllocate -= regularHolidayOvertimeHours;
    }

    if (is_special_holiday && !is_dayoff && remainingOvertimeToAllocate > 0) {
      specialHolidayOvertimeHours = Math.min(
        remainingOvertimeToAllocate,
        overtimeHours
      );
      remainingOvertimeToAllocate -= specialHolidayOvertimeHours;
    }

    // 7. Rest day overtime (if working on day off but not holiday)
    if (
      is_dayoff &&
      !is_regular_holiday &&
      !is_special_holiday &&
      remainingOvertimeToAllocate > 0
    ) {
      restDayOvertimeHours = Math.min(
        remainingOvertimeToAllocate,
        overtimeHours
      );
      remainingOvertimeToAllocate -= restDayOvertimeHours;
    }

    // 8. Regular overtime (whatever remains)
    if (remainingOvertimeToAllocate > 0) {
      regularOvertimeHours = remainingOvertimeToAllocate;
    }
  }

  // === PREMIUM HOURS BREAKDOWN ===
  // Break down each premium type into regular vs overtime portions
  // CRITICAL: Handle holiday + rest day stacking properly

  // Night Differential breakdown
  const nightDiffRegularHours = Math.max(
    0,
    nightDiffHours - nightDiffOvertimeHours
  );

  // Rest Day breakdown (excluding holiday + rest day combinations)
  let pureRestDayHours = restDayHours;
  if (is_regular_holiday && is_dayoff) {
    pureRestDayHours = 0; // All rest day hours are now holiday + rest day hours
  } else if (is_special_holiday && is_dayoff) {
    pureRestDayHours = 0; // All rest day hours are now holiday + rest day hours
  }

  const restDayRegularHours = Math.max(
    0,
    pureRestDayHours - restDayOvertimeHours
  );

  // Holiday breakdown (excluding holiday + rest day combinations)
  let pureRegularHolidayHours = regularHolidayHours;
  let pureSpecialHolidayHours = specialHolidayHours;

  if (is_dayoff) {
    // If it's a day off, separate pure holiday hours from holiday + rest day hours
    pureRegularHolidayHours = is_regular_holiday ? 0 : regularHolidayHours;
    pureSpecialHolidayHours = is_special_holiday ? 0 : specialHolidayHours;
  }

  const regularHolidayRegularHours = Math.max(
    0,
    pureRegularHolidayHours - regularHolidayOvertimeHours
  );
  const specialHolidayRegularHours = Math.max(
    0,
    pureSpecialHolidayHours - specialHolidayOvertimeHours
  );

  // Holiday + Rest Day breakdown (the ultimate edge cases)
  const regularHolidayRestDayRegularHours = Math.max(
    0,
    regularHolidayRestDayHours - regularHolidayRestDayOvertimeHours
  );
  const specialHolidayRestDayRegularHours = Math.max(
    0,
    specialHolidayRestDayHours - specialHolidayRestDayOvertimeHours
  );

  // Calculate pure regular hours (no premiums, no overtime)
  // CRITICAL: Must account for all premium types including holiday + rest day stacking
  let pureRegularHours =
    adjustedTotalHours -
    nightDiffHours -
    restDayHours -
    regularHolidayHours -
    specialHolidayHours -
    regularOvertimeHours;
  pureRegularHours = Math.max(0, pureRegularHours);

  // Calculate night diff regular hours available for allocation
  const nightDiffRegHours = Math.max(
    0,
    nightDiffHours -
      nightDiffOvertimeHours -
      nightDiffRegularHolidayOvertimeHours -
      nightDiffSpecialHolidayOvertimeHours -
      nightDiffRestDayOvertimeHours -
      nightDiffRegularHolidayRestDayOvertimeHours -
      nightDiffSpecialHolidayRestDayOvertimeHours
  );

  // Calculate total regular time for each combination
  const totalRegularTime_regularHolidayRestDay = Math.max(
    0,
    regularHolidayRestDayHours -
      regularHolidayRestDayOvertimeHours -
      nightDiffRegularHolidayRestDayOvertimeHours
  );

  const totalRegularTime_specialHolidayRestDay = Math.max(
    0,
    specialHolidayRestDayHours -
      specialHolidayRestDayOvertimeHours -
      nightDiffSpecialHolidayRestDayOvertimeHours
  );

  // 1. THREE-WAY: Allocate night diff portion first (priority allocation)
  const regularTime_nightDiffRegularHolidayRestDay = Math.min(
    nightDiffRegHours,
    totalRegularTime_regularHolidayRestDay
  );

  const regularTime_nightDiffSpecialHolidayRestDay = Math.min(
    Math.max(0, nightDiffRegHours - regularTime_nightDiffRegularHolidayRestDay),
    totalRegularTime_specialHolidayRestDay
  );

  // 2. TWO-WAY: Remaining holiday + rest day hours (after night diff removed)
  const regularTime_regularHolidayRestDay = Math.max(
    0,
    totalRegularTime_regularHolidayRestDay -
      regularTime_nightDiffRegularHolidayRestDay
  );

  const regularTime_specialHolidayRestDay = Math.max(
    0,
    totalRegularTime_specialHolidayRestDay -
      regularTime_nightDiffSpecialHolidayRestDay
  );

  // 3. TWO-WAY: NIGHT DIFF + HOLIDAY (without rest day portion) - FIXED
  const regularTime_nightDiffRegularHoliday = Math.max(
    0,
    nightDiffHours - // Start with total night diff hours
      nightDiffOvertimeHours - // Remove pure night diff OT
      nightDiffRestDayOvertimeHours - // Remove night diff + rest day OT
      nightDiffRegularHolidayRestDayOvertimeHours - // Remove 3-way OT
      nightDiffSpecialHolidayRestDayOvertimeHours - // Remove other 3-way OT
      nightDiffSpecialHolidayOvertimeHours - // Remove night diff + special holiday OT
      nightDiffRegularHolidayOvertimeHours // Remove night diff + regular holiday OT
  );

  const regularTime_nightDiffSpecialHoliday = Math.max(
    0,
    nightDiffHours - // Start with total night diff hours
      nightDiffOvertimeHours - // Remove pure night diff OT
      nightDiffRestDayOvertimeHours - // Remove night diff + rest day OT
      nightDiffRegularHolidayRestDayOvertimeHours - // Remove 3-way OT
      nightDiffSpecialHolidayRestDayOvertimeHours - // Remove 3-way OT
      nightDiffRegularHolidayOvertimeHours - // Remove night diff + regular holiday OT
      nightDiffSpecialHolidayOvertimeHours // Remove night diff + special holiday OT
  );

  // 4. TWO-WAY: NIGHT DIFF + REST DAY (without holiday portion) - FIXED
  const regularTime_nightDiffRestDay = Math.max(
    0,
    nightDiffHours - // Start with total night diff hours
      nightDiffOvertimeHours - // Remove pure night diff OT
      nightDiffRegularHolidayOvertimeHours - // Remove night diff + regular holiday OT
      nightDiffSpecialHolidayOvertimeHours - // Remove night diff + special holiday OT
      nightDiffRegularHolidayRestDayOvertimeHours - // Remove 3-way OT
      nightDiffSpecialHolidayRestDayOvertimeHours // Remove 3-way OT
  );

  // 5. SINGLE PREMIUMS - COMPLETELY REWRITTEN FOR ACCURACY

  // Pure rest day (no holiday, no night diff overlap)
  const regularTime_restDay = Math.max(
    0,
    pureRestDayHours -
      restDayOvertimeHours -
      nightDiffRestDayOvertimeHours -
      regularHolidayRestDayOvertimeHours -
      specialHolidayRestDayOvertimeHours -
      nightDiffRegularHolidayRestDayOvertimeHours -
      nightDiffSpecialHolidayRestDayOvertimeHours
  );

  // Pure regular holiday (no rest day, no night diff overlap)
  const regularTime_regularHoliday = Math.max(
    0,
    pureRegularHolidayHours -
      regularHolidayOvertimeHours -
      nightDiffRegularHolidayOvertimeHours -
      regularHolidayRestDayOvertimeHours -
      nightDiffRegularHolidayRestDayOvertimeHours
  );

  // Pure special holiday (no rest day, no night diff overlap)
  const regularTime_specialHoliday = Math.max(
    0,
    pureSpecialHolidayHours -
      specialHolidayOvertimeHours -
      nightDiffSpecialHolidayOvertimeHours -
      specialHolidayRestDayOvertimeHours -
      nightDiffSpecialHolidayRestDayOvertimeHours
  );

  // Pure night diff (no rest day, no holiday overlap)
  const regularTime_nightDiff = Math.max(
    0,
    nightDiffHours -
      nightDiffOvertimeHours -
      nightDiffRegularHolidayOvertimeHours -
      nightDiffSpecialHolidayOvertimeHours -
      nightDiffRestDayOvertimeHours -
      nightDiffRegularHolidayRestDayOvertimeHours -
      nightDiffSpecialHolidayRestDayOvertimeHours
  );

  // === VERIFICATION CHECK ===
  // The sum of all regularTime_* values should equal baseHours (adjustedTotalHours - overtimeHours)
  const totalRegularTimeCalculated =
    pureRegularHours +
    regularTime_restDay +
    regularTime_nightDiff +
    regularTime_regularHoliday +
    regularTime_specialHoliday +
    regularTime_nightDiffRestDay +
    regularTime_nightDiffRegularHoliday +
    regularTime_nightDiffSpecialHoliday +
    regularTime_regularHolidayRestDay +
    regularTime_specialHolidayRestDay +
    regularTime_nightDiffRegularHolidayRestDay +
    regularTime_nightDiffSpecialHolidayRestDay;

  // This should equal: adjustedTotalHours - overtimeHours
  // Add this validation in your code:
  console.log(
    "[VALIDATION] Total regular time calculated:",
    totalRegularTimeCalculated
  );
  console.log(
    "[VALIDATION] Expected base hours:",
    adjustedTotalHours - overtimeHours
  );
  console.log(
    "[VALIDATION] Difference:",
    Math.abs(totalRegularTimeCalculated - (adjustedTotalHours - overtimeHours))
  );

  const isUndertime = totalHours < scheduledWorkHours - 0.5; // 30-min tolerance
  const isHalfday = totalHours < scheduledWorkHours / 2;
  const calculator = new AdvancedPayrollCalculator(pool);
  await calculator.loadConfiguration();

  // === COMPREHENSIVE PAYROLL BREAKDOWN JSON WITH ENHANCED HOLIDAY LOGIC ===
  const payrollBreakdown = {
    schedule: scheduleInfo,
    regular_hours: roundToPayrollIncrement(baseHours),

    overtime: {
      computed: {
        total:
          roundToPayrollIncrement(regularOvertimeHours) +
          roundToPayrollIncrement(nightDiffOvertimeHours) +
          roundToPayrollIncrement(restDayOvertimeHours) +
          roundToPayrollIncrement(regularHolidayOvertimeHours) +
          roundToPayrollIncrement(specialHolidayOvertimeHours) +
          roundToPayrollIncrement(regularHolidayRestDayOvertimeHours) +
          roundToPayrollIncrement(specialHolidayRestDayOvertimeHours) +
          roundToPayrollIncrement(nightDiffRegularHolidayOvertimeHours) +
          roundToPayrollIncrement(nightDiffSpecialHolidayOvertimeHours) +
          roundToPayrollIncrement(nightDiffRestDayOvertimeHours) +
          roundToPayrollIncrement(nightDiffRegularHolidayRestDayOvertimeHours) +
          roundToPayrollIncrement(nightDiffSpecialHolidayRestDayOvertimeHours),
        regular_overtime: {
          value: roundToPayrollIncrement(regularOvertimeHours),
          rate: calculator.config.overtimeMultiplier,
        },
        night_diff_overtime: roundToPayrollIncrement(nightDiffOvertimeHours),
        rest_day_overtime: roundToPayrollIncrement(restDayOvertimeHours),
        regular_holiday_overtime: roundToPayrollIncrement(
          regularHolidayOvertimeHours
        ),
        special_holiday_overtime: roundToPayrollIncrement(
          specialHolidayOvertimeHours
        ),
        regular_holiday_rest_day_overtime: roundToPayrollIncrement(
          regularHolidayRestDayOvertimeHours
        ),
        special_holiday_rest_day_overtime: roundToPayrollIncrement(
          specialHolidayRestDayOvertimeHours
        ),
        night_diff_regular_holiday_overtime: roundToPayrollIncrement(
          nightDiffRegularHolidayOvertimeHours
        ),
        night_diff_special_holiday_overtime: roundToPayrollIncrement(
          nightDiffSpecialHolidayOvertimeHours
        ),
        night_diff_rest_day_overtime: roundToPayrollIncrement(
          nightDiffRestDayOvertimeHours
        ),
        night_diff_regular_holiday_rest_day_overtime: roundToPayrollIncrement(
          nightDiffRegularHolidayRestDayOvertimeHours
        ),
        night_diff_special_holiday_rest_day_overtime: roundToPayrollIncrement(
          nightDiffSpecialHolidayRestDayOvertimeHours
        ),
      },
      approved: {
        total: 0,
        regular_overtime: 0,
        night_diff_overtime: 0,
        rest_day_overtime: 0,
        regular_holiday_overtime: 0,
        special_holiday_overtime: 0,
        regular_holiday_rest_day_overtime: 0,
        special_holiday_rest_day_overtime: 0,
        night_diff_regular_holiday_overtime: 0,
        night_diff_special_holiday_overtime: 0,
        night_diff_rest_day_overtime: 0,
        night_diff_regular_holiday_rest_day_overtime: 0,
        night_diff_special_holiday_rest_day_overtime: 0,
      },
    },
    worked_hours: {
      total: roundToPayrollIncrement(adjustedTotalHours),

      // MUTUALLY EXCLUSIVE CATEGORIZATION - Each hour appears exactly once

      // Pure regular hours (no premiums)
      regular: roundToPayrollIncrement(pureRegularHours),

      // Single premium types
      rest_day: roundToPayrollIncrement(regularTime_restDay),
      night_diff: roundToPayrollIncrement(regularTime_nightDiff),
      regular_holiday: roundToPayrollIncrement(regularTime_regularHoliday),
      special_holiday: roundToPayrollIncrement(regularTime_specialHoliday),

      // 2-way premium combinations
      night_diff_rest_day: roundToPayrollIncrement(
        regularTime_nightDiffRestDay
      ),
      night_diff_regular_holiday: roundToPayrollIncrement(
        regularTime_nightDiffRegularHoliday
      ),
      night_diff_special_holiday: roundToPayrollIncrement(
        regularTime_nightDiffSpecialHoliday
      ),
      regular_holiday_rest_day: roundToPayrollIncrement(
        regularTime_regularHolidayRestDay
      ),
      special_holiday_rest_day: roundToPayrollIncrement(
        regularTime_specialHolidayRestDay
      ),

      // 3-way premium combinations (ultimate cases)
      night_diff_regular_holiday_rest_day: roundToPayrollIncrement(
        regularTime_nightDiffRegularHolidayRestDay
      ),
      night_diff_special_holiday_rest_day: roundToPayrollIncrement(
        regularTime_nightDiffSpecialHolidayRestDay
      ),
    },

    deductions: {
      undertime_hours: roundToPayrollIncrement(undertimeMinutes / 60),
      late_hours: 0.0, // TODO: Add late hours calculation from clock-in
    },

    // Enhanced edge case flags for comprehensive payroll processing
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
          (pureRestDayHours > 0 ? 1 : 0) +
          (pureRegularHolidayHours > 0 ? 1 : 0) +
          (pureSpecialHolidayHours > 0 ? 1 : 0) +
          (regularHolidayRestDayHours > 0 ? 1 : 0) +
          (specialHolidayRestDayHours > 0 ? 1 : 0) >
        1,
      // ULTIMATE EDGE CASE FLAGS
      is_ultimate_case_regular:
        (is_dayoff &&
          is_regular_holiday &&
          nightDiffHours > 0 &&
          overtimeHours > 0) ||
        false,
      is_ultimate_case_special:
        (is_dayoff &&
          is_special_holiday &&
          nightDiffHours > 0 &&
          overtimeHours > 0) ||
        false,
      premium_stack_count:
        (nightDiffHours > 0 ? 1 : 0) +
        (is_dayoff ? 1 : 0) +
        (is_regular_holiday ? 1 : 0) +
        (is_special_holiday ? 1 : 0) +
        (overtimeHours > 0 ? 1 : 0),
      // Policy information
      double_holiday_policy: PAYROLL_CONFIG.double_holiday_policy,
    },
  };

  return {
    total_hours: roundToPayrollIncrement(adjustedTotalHours), // Use adjusted hours for consistency with overtime calculation
    overtime_hours: roundToPayrollIncrement(overtimeHours),

    // Early clock-in handling
    adjusted_total_hours: roundToPayrollIncrement(adjustedTotalHours),
    early_clockin_deduction_hours: roundToPayrollIncrement(
      earlyClockInDeduction
    ),
    early_clockin_neglect_enabled: NEGLECT_EARLY_IN_MINUTES,

    // Enhanced overtime breakdown
    regular_overtime_hours: roundToPayrollIncrement(regularOvertimeHours),
    night_diff_overtime_hours: roundToPayrollIncrement(nightDiffOvertimeHours),
    rest_day_overtime_hours: roundToPayrollIncrement(restDayOvertimeHours),
    regular_holiday_overtime_hours: roundToPayrollIncrement(
      regularHolidayOvertimeHours
    ),
    special_holiday_overtime_hours: roundToPayrollIncrement(
      specialHolidayOvertimeHours
    ),
    // ULTIMATE EDGE CASES: Holiday + Rest Day overtime
    regular_holiday_rest_day_overtime_hours: roundToPayrollIncrement(
      regularHolidayRestDayOvertimeHours
    ),
    special_holiday_rest_day_overtime_hours: roundToPayrollIncrement(
      specialHolidayRestDayOvertimeHours
    ),
    // Combined OT types
    night_diff_regular_holiday_overtime_hours: roundToPayrollIncrement(
      nightDiffRegularHolidayOvertimeHours
    ),
    night_diff_special_holiday_overtime_hours: roundToPayrollIncrement(
      nightDiffSpecialHolidayOvertimeHours
    ),
    night_diff_rest_day_overtime_hours: roundToPayrollIncrement(
      nightDiffRestDayOvertimeHours
    ),
    // Ultimate 3-stack OT types
    night_diff_regular_holiday_rest_day_overtime_hours: roundToPayrollIncrement(
      nightDiffRegularHolidayRestDayOvertimeHours
    ),
    night_diff_special_holiday_rest_day_overtime_hours: roundToPayrollIncrement(
      nightDiffSpecialHolidayRestDayOvertimeHours
    ),

    // Basic deductions
    undertime_minutes: undertimeMinutes,

    // Enhanced premium hours breakdown
    night_differential_hours: roundToPayrollIncrement(nightDiffHours),
    rest_day_hours_worked: roundToPayrollIncrement(restDayHours),
    regular_holiday_hours_worked: roundToPayrollIncrement(regularHolidayHours),
    special_holiday_hours_worked: roundToPayrollIncrement(specialHolidayHours),

    // ULTIMATE EDGE CASES: Holiday + Rest Day combinations
    regular_holiday_rest_day_hours_worked: roundToPayrollIncrement(
      regularHolidayRestDayHours
    ),
    special_holiday_rest_day_hours_worked: roundToPayrollIncrement(
      specialHolidayRestDayHours
    ),

    // Pure premium hours (without stacking)
    pure_rest_day_hours: roundToPayrollIncrement(pureRestDayHours),
    pure_regular_holiday_hours: roundToPayrollIncrement(
      pureRegularHolidayHours
    ),
    pure_special_holiday_hours: roundToPayrollIncrement(
      pureSpecialHolidayHours
    ),

    // Status flags
    is_undertime: isUndertime,
    is_halfday: isHalfday,

    // Comprehensive JSON breakdown for advanced payroll calculation
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

// Validate comprehensive payroll breakdown for edge cases
export const validatePayrollBreakdown = (payrollBreakdown, totalHours) => {
  const breakdown = payrollBreakdown;
  const errors = [];
  const warnings = [];

  try {
    // 1. Validate total hours consistency
    const calculatedTotal = breakdown.worked_hours.total;

    // Allow small rounding differences
    if (Math.abs(calculatedTotal - totalHours) > 0.1) {
      errors.push(
        `Total hours mismatch: calculated ${calculatedTotal} vs expected ${totalHours}`
      );
    }

    // 1b. Validate worked hours breakdown consistency
    const totalWorkedHoursBreakdown =
      breakdown.worked_hours.regular +
      breakdown.worked_hours.rest_day +
      breakdown.worked_hours.night_diff +
      breakdown.worked_hours.regular_holiday +
      breakdown.worked_hours.special_holiday +
      breakdown.worked_hours.regular_holiday_rest_day +
      breakdown.worked_hours.special_holiday_rest_day +
      breakdown.worked_hours.night_diff_rest_day +
      breakdown.worked_hours.night_diff_regular_holiday +
      breakdown.worked_hours.night_diff_special_holiday +
      breakdown.worked_hours.night_diff_regular_holiday_rest_day +
      breakdown.worked_hours.night_diff_special_holiday_rest_day;

    if (
      Math.abs(totalWorkedHoursBreakdown - breakdown.worked_hours.total) > 0.01
    ) {
      errors.push(
        `Worked hours breakdown mismatch: ${totalWorkedHoursBreakdown} vs ${breakdown.worked_hours.total}`
      );
    }

    // 2. Validate overtime breakdown consistency
    const totalOvertimeBreakdown =
      breakdown.overtime.regular_overtime +
      breakdown.overtime.night_diff_overtime +
      breakdown.overtime.rest_day_overtime +
      breakdown.overtime.regular_holiday_overtime +
      breakdown.overtime.special_holiday_overtime +
      breakdown.overtime.regular_holiday_rest_day_overtime +
      breakdown.overtime.special_holiday_rest_day_overtime +
      breakdown.overtime.night_diff_regular_holiday_overtime +
      breakdown.overtime.night_diff_special_holiday_overtime +
      breakdown.overtime.night_diff_rest_day_overtime +
      breakdown.overtime.night_diff_regular_holiday_rest_day_overtime +
      breakdown.overtime.night_diff_special_holiday_rest_day_overtime;

    if (Math.abs(totalOvertimeBreakdown - breakdown.overtime.total) > 0.01) {
      errors.push(
        `Overtime breakdown mismatch: ${totalOvertimeBreakdown} vs ${breakdown.overtime.total}`
      );
    }

    // 3. Validate holiday + rest day stacking logic
    const flags = breakdown.edge_case_flags;

    if (
      flags.is_day_off_and_regular_holiday &&
      breakdown.worked_hours.regular_holiday_rest_day === 0
    ) {
      warnings.push(
        "Regular holiday + rest day detected but no stacked hours calculated"
      );
    }

    if (
      flags.is_day_off_and_special_holiday &&
      breakdown.worked_hours.special_holiday_rest_day === 0
    ) {
      warnings.push(
        "Special holiday + rest day detected but no stacked hours calculated"
      );
    }

    // 4. Validate ultimate edge case detection
    if (flags.is_ultimate_case_regular || flags.is_ultimate_case_special) {
      if (flags.premium_stack_count < 4) {
        warnings.push(
          "Ultimate case flagged but premium stack count is less than 4"
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      summary: {
        total_hours: totalHours,
        worked_hours_total: calculatedTotal,
        premium_types: flags.premium_stack_count,
        is_ultimate_case:
          flags.is_ultimate_case_regular || flags.is_ultimate_case_special,
      },
    };
  } catch (error) {
    return {
      isValid: false,
      errors: [`Validation error: ${error.message}`],
      warnings: [],
      summary: null,
    };
  }
};

// Enhanced function to get comprehensive holiday information with stacking analysis
export const getComprehensiveHolidayInfo = async (date, isDayOff = false) => {
  try {
    const holidayInfo = await getHolidayInfo(date);

    return {
      ...holidayInfo,
      // Enhanced stacking analysis
      stacking_info: {
        is_pure_holiday: holidayInfo.isHoliday && !isDayOff,
        is_pure_rest_day: !holidayInfo.isHoliday && isDayOff,
        is_regular_holiday_rest_day: holidayInfo.isRegularHoliday && isDayOff,
        is_special_holiday_rest_day: holidayInfo.isSpecialHoliday && isDayOff,
        premium_multiplier_estimate: calculateEstimatedPremiumMultiplier(
          holidayInfo,
          isDayOff
        ),
        complexity_level: calculateComplexityLevel(holidayInfo, isDayOff),
      },
    };
  } catch (error) {
    console.error("Error getting comprehensive holiday info:", error);
    return {
      isHoliday: false,
      isRegularHoliday: false,
      isSpecialHoliday: false,
      holidayName: null,
      holidayType: null,
      stacking_info: {
        is_pure_holiday: false,
        is_pure_rest_day: isDayOff,
        is_regular_holiday_rest_day: false,
        is_special_holiday_rest_day: false,
        premium_multiplier_estimate: isDayOff ? 1.3 : 1.0, // Basic rest day premium
        complexity_level: isDayOff ? 2 : 1,
      },
    };
  }
};

// Helper function to estimate premium multipliers for payroll validation
const calculateEstimatedPremiumMultiplier = (holidayInfo, isDayOff) => {
  let multiplier = 1.0; // Base rate

  if (isDayOff) multiplier += 0.3; // Rest day premium (+30%)
  if (holidayInfo.isRegularHoliday) multiplier += 1.0; // Regular holiday premium (+100%)
  if (holidayInfo.isSpecialHoliday) multiplier += 0.3; // Special holiday premium (+30%)

  return multiplier;
};

// Helper function to calculate complexity level for testing and validation
const calculateComplexityLevel = (holidayInfo, isDayOff) => {
  let level = 1; // Base level

  if (isDayOff) level++;
  if (holidayInfo.isRegularHoliday) level += 2;
  if (holidayInfo.isSpecialHoliday) level += 1;

  // Level 1: Regular day
  // Level 2: Rest day only
  // Level 3: Holiday only (special)
  // Level 4: Holiday only (regular) or Rest day + Special holiday
  // Level 5: Rest day + Regular holiday (ultimate case)

  return level;
};

// Update attendance with enhanced calculations including comprehensive holiday logic
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
        overtime_hours = $2,
        late_minutes = $3,
        undertime_minutes = $4,
        night_differential_hours = $5,
        rest_day_hours_worked = $6,
        regular_holiday_hours_worked = $7,
        special_holiday_hours_worked = $8,
        is_undertime = $9,
        is_halfday = $10,
        is_entitled_holiday = $11,
        payroll_breakdown = $12,
        updated_at = NOW()
      WHERE attendance_id = $13
      RETURNING *
    `,
      [
        calculations.total_hours,
        calculations.overtime_hours || 0,
        calculations.late_minutes || 0,
        calculations.undertime_minutes || 0,
        calculations.night_differential_hours || 0,
        calculations.rest_day_hours_worked || 0,
        calculations.regular_holiday_hours_worked || 0,
        calculations.special_holiday_hours_worked || 0,
        calculations.is_undertime || false,
        calculations.is_halfday || false,
        calculations.is_entitled_holiday || false,
        JSON.stringify(calculations.payroll_breakdown), // Store comprehensive breakdown as JSON
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
