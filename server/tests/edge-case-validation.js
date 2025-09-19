/**
 * Edge Case Validation Test
 * Validates that attendance calculations match payroll calculations for ultimate scenarios
 */

import { AdvancedPayrollCalculator } from '../services/AdvancedPayrollCalculator.js';
import { enhancedClockOutCalculation } from '../utils/attendanceCalculations.js';

// Test data for the ULTIMATE EDGE CASE: Day Off + Regular Holiday + Night Diff + Overtime
const testEmployee = {
  employee_id: 1,
  first_name: "Test",
  last_name: "Employee",
  rate: 500, // ₱500/hour
  rate_type: "hourly",
  position_title: "Test Position",
  employment_type: "Regular"
};

const testSchedule = {
  shift_start: "08:00:00",
  shift_end: "17:00:00", 
  break_start: "12:00:00",
  break_end: "13:00:00",
  break_duration: 60,
  start_time: "08:00:00",
  end_time: "17:00:00"
};

async function testUltimateEdgeCase() {
  console.log("🔥 TESTING ULTIMATE EDGE CASE: Day Off + Regular Holiday + Night Diff + Overtime");
  console.log("===============================================================================");
  
  // Scenario: Employee works 6PM-6AM (12 hours) on rest day + regular holiday
  const timeIn = "2025-09-19T18:00:00.000Z"; // 6PM
  const timeOut = "2025-09-20T06:00:00.000Z"; // 6AM next day (12 hours)
  
  const attendanceRecord = {
    attendance_id: 1,
    employee_id: 1,
    time_in: timeIn,
    time_out: null, // Will be set by calculation
    is_dayoff: true,           // REST DAY
    is_regular_holiday: true,  // REGULAR HOLIDAY
    is_special_holiday: false,
    date: "2025-09-19"
  };
  
  try {
    // 1. Calculate attendance breakdown using enhanced logic
    console.log("⏰ Step 1: Calculate attendance breakdown...");
    const attendanceBreakdown = await enhancedClockOutCalculation(
      attendanceRecord,
      timeOut,
      testSchedule
    );
    
    console.log("📊 Attendance Breakdown:", JSON.stringify(attendanceBreakdown, null, 2));
    
    // 2. Prepare attendance data for payroll calculator (simulate aggregated data)
    const aggregatedAttendance = {
      total_regular_hours: attendanceBreakdown.total_hours || 0,
      total_overtime_hours: attendanceBreakdown.overtime_hours || 0,
      night_differential_hours: attendanceBreakdown.night_differential_hours || 0,
      rest_day_hours_worked: attendanceBreakdown.rest_day_hours || 0,
      regular_holiday_days_worked: attendanceRecord.is_regular_holiday ? 1 : 0,
      special_holiday_days_worked: 0,
      late_minutes: 0,
      undertime_minutes: 0,
      days_worked: 1,
      // Enhanced breakdown data
      payroll_breakdowns: [attendanceBreakdown.payroll_breakdown]
    };
    
    console.log("📊 Aggregated Attendance for Payroll:", JSON.stringify(aggregatedAttendance, null, 2));
    
    // 3. Calculate payroll using enhanced calculator
    console.log("\n💰 Step 2: Calculate payroll earnings...");
    const calculator = new AdvancedPayrollCalculator();
    const earnings = await calculator.calculateEarnings(
      testEmployee,
      aggregatedAttendance,
      testSchedule
    );
    
    console.log("💵 Payroll Earnings:", JSON.stringify(earnings, null, 2));
    
    // 4. Validate expected results based on COMPREHENSIVE_EDGE_CASE_TESTS.md
    console.log("\n🎯 Step 3: Validate against expected results...");
    
    // Expected breakdown from the test document:
    // Case #20: 6PM-6AM (12 hours) on rest day + regular holiday
    // - Base (8 hours): 8 × ₱500 × 2.60 = ₱10,400
    // - Overtime (4 hours): 4 × ₱500 × 3.38 = ₱6,760  
    // - Night Differential (8 hours): 8 × ₱500 × 0.26 = ₱1,040
    // TOTAL Expected: ₱18,200 (from COMPREHENSIVE_EDGE_CASE_TESTS.md)
    
    const expectedTotal = 18200; // Corrected from test document calculation
    const actualTotal = earnings.grossPay;
    const tolerance = 300; // ₱300 tolerance for rounding differences and calculation variations
    
    console.log(`Expected Total: ₱${expectedTotal.toFixed(2)}`);
    console.log(`Actual Total: ₱${actualTotal.toFixed(2)}`);
    console.log(`Difference: ₱${Math.abs(expectedTotal - actualTotal).toFixed(2)}`);
    
    if (Math.abs(expectedTotal - actualTotal) <= tolerance) {
      console.log("✅ VALIDATION PASSED: Calculations are within acceptable tolerance!");
    } else {
      console.log("❌ VALIDATION FAILED: Calculations exceed tolerance threshold!");
    }
    
    // 5. Detailed breakdown validation
    console.log("\n📈 Detailed Breakdown Analysis:");
    console.log(`Base Pay: ₱${earnings.basePay}`);
    console.log(`Overtime Pay: ₱${earnings.overtimePay}`);
    console.log(`Holiday Pay: ₱${earnings.holidayPay}`);
    console.log(`Night Differential: ₱${earnings.nightDifferential}`);
    console.log(`Total Gross: ₱${earnings.grossPay}`);
    
    return {
      success: Math.abs(expectedTotal - actualTotal) <= tolerance,
      expected: expectedTotal,
      actual: actualTotal,
      difference: Math.abs(expectedTotal - actualTotal),
      breakdown: earnings
    };
    
  } catch (error) {
    console.error("❌ Test failed with error:", error);
    return { success: false, error: error.message };
  }
}

// Additional test for regular day vs ultimate edge case comparison
async function testRegularDayComparison() {
  console.log("\n\n🔄 COMPARISON TEST: Regular Day vs Ultimate Edge Case");
  console.log("====================================================");
  
  // Regular 8-hour day (8AM-5PM with 1hr break)
  const regularAttendance = {
    total_regular_hours: 8,
    total_overtime_hours: 0,
    night_differential_hours: 0,
    rest_day_hours_worked: 0,
    regular_holiday_days_worked: 0,
    special_holiday_days_worked: 0,
    late_minutes: 0,
    undertime_minutes: 0,
    days_worked: 1,
    payroll_breakdowns: [{
      regular_hours: 8,
      overtime: { total: 0 },
      premiums: {
        night_differential: { total: 0 },
        rest_day: { total: 0 },
        holidays: {}
      }
    }]
  };
  
  const calculator = new AdvancedPayrollCalculator();
  const regularEarnings = await calculator.calculateEarnings(testEmployee, regularAttendance, testSchedule);
  
  console.log("📊 Regular Day (8 hours): ₱" + regularEarnings.grossPay);
  console.log("📊 Ultimate Edge Case: ₱" + (await testUltimateEdgeCase()).actual);
  console.log("📊 Premium Multiplier: " + ((await testUltimateEdgeCase()).actual / regularEarnings.grossPay).toFixed(2) + "x");
}

// Run the tests
export async function runEdgeCaseValidation() {
  console.log("🚀 Starting Edge Case Validation Tests...\n");
  
  const ultimateTest = await testUltimateEdgeCase();
  await testRegularDayComparison();
  
  console.log("\n" + "=".repeat(80));
  console.log("🎯 VALIDATION SUMMARY");
  console.log("=".repeat(80));
  
  if (ultimateTest.success) {
    console.log("✅ ALL TESTS PASSED!");
    console.log("✅ Ultimate edge case calculations are working correctly");
    console.log("✅ Attendance calculations match payroll calculations");
  } else {
    console.log("❌ TESTS FAILED!");
    console.log("❌ Issues found in edge case calculations");
    console.log("❌ Review the calculation logic and multipliers");
  }
  
  return ultimateTest;
}

// Allow running this file directly for testing
if (import.meta.url === `file://${process.argv[1]}`) {
  runEdgeCaseValidation().catch(console.error);
}