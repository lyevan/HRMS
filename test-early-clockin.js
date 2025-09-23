// Test script for early clock-in neglect feature
import { enhancedClockOutCalculation } from "./server/utils/attendanceCalculations.js";

// Test case 1: Employee clocks in 10 minutes early
const testAttendanceRecord = {
  time_in: "2024-01-15T07:50:00.000Z", // 7:50 AM - 10 minutes early
  is_dayoff: false,
  is_regular_holiday: false,
  is_special_holiday: false,
};

const testClockOutTime = "2024-01-15T17:30:00.000Z"; // 5:30 PM - 30 minutes overtime

const testScheduleInfo = {
  start_time: "08:00:00", // 8:00 AM
  end_time: "17:00:00", // 5:00 PM
  break_start: "12:00:00", // 12:00 PM
  break_end: "13:00:00", // 1:00 PM
  break_duration: 60,
};

async function testEarlyClockIn() {
  console.log("=== EARLY CLOCK-IN NEGLECT TEST ===");
  console.log("Clock In:", testAttendanceRecord.time_in);
  console.log("Clock Out:", testClockOutTime);
  console.log("Schedule: 8:00 AM - 5:00 PM");
  console.log("Expected: 10 minutes early should be deducted from overtime");
  console.log("");

  try {
    const result = await enhancedClockOutCalculation(
      testAttendanceRecord,
      testClockOutTime,
      testScheduleInfo
    );

    console.log("RESULTS:");
    console.log("- Total Hours (raw):", result.total_hours);
    console.log("- Adjusted Total Hours:", result.adjusted_total_hours);
    console.log(
      "- Early Clock-in Deduction:",
      result.early_clockin_deduction_hours
    );
    console.log("- Overtime Hours:", result.overtime_hours);
    console.log(
      "- Early Clock-in Neglect Enabled:",
      result.early_clockin_neglect_enabled
    );
    console.log("");
    console.log(
      "Expected: Should show 10 minutes (0.17 hours) deducted from overtime"
    );
  } catch (error) {
    console.error("Test failed:", error);
  }
}

testEarlyClockIn();
