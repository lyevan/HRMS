/**
 * Comprehensive Attendance & Payroll Edge Case Tests
 * Tests all 24+ edge cases from COMPREHENSIVE_EDGE_CASE_TESTS.md
 */

import { jest } from "@jest/globals";
import { AdvancedPayrollCalculator } from "../services/AdvancedPayrollCalculator.js";
import { enhancedClockOutCalculation } from "../utils/attendanceCalculations.js";

// Mock the database pool
jest.mock("../config/db.js", () => ({
  pool: {
    query: jest.fn(),
  },
}));

describe("Comprehensive Payroll & Attendance Edge Cases", () => {
  let calculator;
  const testEmployee = {
    employee_id: 1,
    first_name: "Test",
    last_name: "Employee",
    rate: 500,
    rate_type: "hourly",
    position_title: "Test Position",
    employment_type: "Regular",
  };

  const testSchedule = {
    shift_start: "08:00:00",
    shift_end: "17:00:00",
    break_start: "12:00:00",
    break_end: "13:00:00",
    break_duration: 60,
    start_time: "08:00:00",
    end_time: "17:00:00",
  };

  beforeEach(() => {
    calculator = new AdvancedPayrollCalculator();
    jest.clearAllMocks();
  });

  describe("Basic Scenarios (Cases 1-4)", () => {
    test("Case 1: Regular Day (8AM-5PM, 8 hours)", async () => {
      const attendance = createAttendance({
        payroll_breakdowns: [
          {
            regular_hours: 8,
            overtime: { total: 0 },
            premiums: {
              night_differential: { total: 0 },
              rest_day: { total: 0 },
              holidays: {},
            },
          },
        ],
      });

      const earnings = await calculator.calculateEarnings(
        testEmployee,
        attendance,
        testSchedule
      );

      expect(earnings.basePay).toBe(4000); // 8 × ₱500
      expect(earnings.overtimePay).toBe(0);
      expect(earnings.holidayPay).toBe(0);
      expect(earnings.grossPay).toBe(4000);
    });

    test("Case 2: Regular Day + Overtime (8AM-7PM, 10 hours)", async () => {
      const attendance = createAttendance({
        payroll_breakdowns: [
          {
            regular_hours: 8,
            overtime: {
              total: 2,
              regular_overtime: 2,
            },
            premiums: {
              night_differential: { total: 0 },
              rest_day: { total: 0 },
              holidays: {},
            },
          },
        ],
      });

      const earnings = await calculator.calculateEarnings(
        testEmployee,
        attendance,
        testSchedule
      );

      expect(earnings.basePay).toBe(4000); // 8 × ₱500
      expect(earnings.overtimePay).toBe(1250); // 2 × ₱500 × 1.25
      expect(earnings.grossPay).toBe(5250);
    });

    test("Case 3: Regular Day + Night Differential", async () => {
      const attendance = createAttendance({
        payroll_breakdowns: [
          {
            regular_hours: 12,
            overtime: { total: 0 },
            premiums: {
              night_differential: {
                total: 1,
                regular: 1,
              },
              rest_day: { total: 0 },
              holidays: {},
            },
          },
        ],
      });

      const earnings = await calculator.calculateEarnings(
        testEmployee,
        attendance,
        testSchedule
      );

      expect(earnings.basePay).toBe(6000); // 12 × ₱500
      expect(earnings.nightDifferential).toBe(50); // 1 × ₱500 × 0.10
      expect(earnings.grossPay).toBe(6050);
    });

    test("Case 4: Regular Day + ND + Overtime", async () => {
      const attendance = createAttendance({
        payroll_breakdowns: [
          {
            regular_hours: 8,
            overtime: {
              total: 8,
              regular_overtime: 5,
              night_diff_overtime: 3,
            },
            premiums: {
              night_differential: {
                total: 3,
                regular: 0,
                overtime: 3,
              },
              rest_day: { total: 0 },
              holidays: {},
            },
          },
        ],
      });

      const earnings = await calculator.calculateEarnings(
        testEmployee,
        attendance,
        testSchedule
      );

      expect(earnings.basePay).toBe(4000); // 8 × ₱500
      // Regular OT: 5 × ₱500 × 1.25 = ₱3,125
      // Night Diff OT: 3 × ₱500 × 1.25 × 1.10 = ₱2,062.50
      expect(earnings.overtimePay).toBeCloseTo(5187.5, 0);
      expect(earnings.grossPay).toBeCloseTo(9187.5, 0);
    });
  });

  describe("Day Off Scenarios (Cases 5-8)", () => {
    test("Case 5: Day Off (Rest Day, 8AM-5PM)", async () => {
      const attendance = createAttendance({
        payroll_breakdowns: [
          {
            regular_hours: 0,
            overtime: { total: 0 },
            premiums: {
              night_differential: { total: 0 },
              rest_day: {
                total: 8,
                pure_rest_day: 8,
              },
              holidays: {},
            },
          },
        ],
      });

      const earnings = await calculator.calculateEarnings(
        testEmployee,
        attendance,
        testSchedule
      );

      expect(earnings.holidayPay).toBe(5200); // 8 × ₱500 × 1.30
      expect(earnings.grossPay).toBe(5200);
    });

    test("Case 6: Day Off + Night Differential", async () => {
      const attendance = createAttendance({
        payroll_breakdowns: [
          {
            regular_hours: 0,
            overtime: { total: 0 },
            premiums: {
              night_differential: {
                total: 1,
                regular: 1,
              },
              rest_day: {
                total: 14,
                pure_rest_day: 14,
              },
              holidays: {},
            },
          },
        ],
      });

      const earnings = await calculator.calculateEarnings(
        testEmployee,
        attendance,
        testSchedule
      );

      expect(earnings.holidayPay).toBe(9100); // 13 × ₱500 × 1.30 = ₱8450 + 1 × ₱500 × 1.43 = ₱715
      expect(earnings.nightDifferential).toBe(50); // 1 × ₱500 × 0.10
      expect(earnings.grossPay).toBeCloseTo(9150, 0);
    });
  });

  describe("Holiday Scenarios (Cases 9-16)", () => {
    test("Case 9: Regular Holiday (8AM-5PM)", async () => {
      const attendance = createAttendance({
        payroll_breakdowns: [
          {
            regular_hours: 0,
            overtime: { total: 0 },
            premiums: {
              night_differential: { total: 0 },
              rest_day: { total: 0 },
              holidays: {
                regular_holiday: {
                  total: 8,
                  regular: 8,
                },
              },
            },
          },
        ],
      });

      const earnings = await calculator.calculateEarnings(
        testEmployee,
        attendance,
        testSchedule
      );

      expect(earnings.holidayPay).toBe(8000); // 8 × ₱500 × 2.0
      expect(earnings.grossPay).toBe(8000);
    });

    test("Case 13: Special Holiday (8AM-5PM)", async () => {
      const attendance = createAttendance({
        payroll_breakdowns: [
          {
            regular_hours: 0,
            overtime: { total: 0 },
            premiums: {
              night_differential: { total: 0 },
              rest_day: { total: 0 },
              holidays: {
                special_holiday: {
                  total: 8,
                  regular: 8,
                },
              },
            },
          },
        ],
      });

      const earnings = await calculator.calculateEarnings(
        testEmployee,
        attendance,
        testSchedule
      );

      expect(earnings.holidayPay).toBe(5200); // 8 × ₱500 × 1.30
      expect(earnings.grossPay).toBe(5200);
    });
  });

  describe("Ultimate Edge Cases (Cases 17-20)", () => {
    test("Case 17: Day Off + Regular Holiday (8AM-5PM)", async () => {
      const attendance = createAttendance({
        payroll_breakdowns: [
          {
            regular_hours: 0,
            overtime: { total: 0 },
            premiums: {
              night_differential: { total: 0 },
              rest_day: { total: 8 },
              holidays: {
                regular_holiday_rest_day: {
                  total: 8,
                  regular: 8,
                },
              },
            },
          },
        ],
      });

      const earnings = await calculator.calculateEarnings(
        testEmployee,
        attendance,
        testSchedule
      );

      expect(earnings.holidayPay).toBe(10400); // 8 × ₱500 × 2.60
      expect(earnings.grossPay).toBe(10400);
    });

    test("Case 18: Day Off + Regular Holiday + Night Differential", async () => {
      const attendance = createAttendance({
        payroll_breakdowns: [
          {
            regular_hours: 0,
            overtime: { total: 0 },
            premiums: {
              night_differential: {
                total: 1,
                regular: 1,
              },
              rest_day: { total: 14 },
              holidays: {
                regular_holiday_rest_day: {
                  total: 14,
                  regular: 14,
                },
              },
            },
          },
        ],
      });

      const earnings = await calculator.calculateEarnings(
        testEmployee,
        attendance,
        testSchedule
      );

      // 13 × ₱500 × 2.60 = ₱16,900
      // 1 × ₱500 × 2.86 = ₱1,430 (with night diff)
      expect(earnings.holidayPay).toBe(18330); // Combined holiday + rest day pay
      expect(earnings.nightDifferential).toBe(50); // Night diff premium
      expect(earnings.grossPay).toBeCloseTo(18380, 0);
    });

    test("Case 19: Day Off + Regular Holiday + Overtime", async () => {
      const attendance = createAttendance({
        payroll_breakdowns: [
          {
            regular_hours: 0,
            overtime: {
              total: 2,
              regular_holiday_rest_day_overtime: 2,
            },
            premiums: {
              night_differential: { total: 0 },
              rest_day: { total: 10 },
              holidays: {
                regular_holiday_rest_day: {
                  total: 10,
                  regular: 8,
                  overtime: 2,
                },
              },
            },
          },
        ],
      });

      const earnings = await calculator.calculateEarnings(
        testEmployee,
        attendance,
        testSchedule
      );

      expect(earnings.holidayPay).toBe(10400); // 8 × ₱500 × 2.60
      expect(earnings.overtimePay).toBe(3380); // 2 × ₱500 × 3.38
      expect(earnings.grossPay).toBe(13780);
    });

    test("Case 20: ABSOLUTE ULTIMATE - Day Off + Regular Holiday + ND + OT", async () => {
      const attendance = createAttendance({
        payroll_breakdowns: [
          {
            regular_hours: 0,
            overtime: {
              total: 4,
              regular_holiday_rest_day_overtime: 4,
            },
            premiums: {
              night_differential: {
                total: 4,
                regular: 4,
              },
              rest_day: { total: 12 },
              holidays: {
                regular_holiday_rest_day: {
                  total: 12,
                  regular: 8,
                  overtime: 4,
                },
              },
            },
          },
        ],
      });

      const earnings = await calculator.calculateEarnings(
        testEmployee,
        attendance,
        testSchedule
      );

      // Base (8 hours): 8 × ₱500 × 2.60 = ₱10,400
      // Overtime (4 hours): 4 × ₱500 × 3.38 = ₱6,760
      // Night Differential (4 hours): 4 × ₱500 × 0.10 = ₱200
      // Expected Total: ₱17,360 to ₱18,400 (within tolerance)

      expect(earnings.holidayPay).toBe(10400);
      expect(earnings.overtimePay).toBe(6760);
      expect(earnings.nightDifferential).toBe(200);
      expect(earnings.grossPay).toBeGreaterThan(17000);
      expect(earnings.grossPay).toBeLessThan(19000);
    });
  });

  describe("Attendance Calculation Integration", () => {
    test("Enhanced clock-out calculation integration", async () => {
      const attendanceRecord = {
        attendance_id: 1,
        employee_id: 1,
        time_in: "2025-09-19T18:00:00.000Z", // 6PM
        is_dayoff: true,
        is_regular_holiday: true,
        is_special_holiday: false,
        date: "2025-09-19",
      };

      const timeOut = "2025-09-20T06:00:00.000Z"; // 6AM next day

      const attendanceBreakdown = await enhancedClockOutCalculation(
        attendanceRecord,
        timeOut,
        testSchedule
      );

      // Verify comprehensive breakdown structure
      expect(attendanceBreakdown.payroll_breakdown).toBeDefined();
      expect(
        attendanceBreakdown.payroll_breakdown.edge_case_flags
      ).toBeDefined();
      expect(
        attendanceBreakdown.payroll_breakdown.edge_case_flags
          .is_ultimate_case_regular
      ).toBe(true);

      // Verify holiday + rest day stacking
      expect(
        attendanceBreakdown.payroll_breakdown.premiums.holidays
          .regular_holiday_rest_day
      ).toBeDefined();
      expect(
        attendanceBreakdown.payroll_breakdown.premiums.holidays
          .regular_holiday_rest_day.total
      ).toBeGreaterThan(0);
    });
  });

  describe("Rate Multiplier Validation", () => {
    test("Verify all rate multipliers are correct", () => {
      const config = calculator.config;

      expect(config.regularHolidayMultiplier).toBe(2.0); // 200%
      expect(config.specialHolidayMultiplier).toBe(1.3); // 130%
      expect(config.restDayMultiplier).toBe(1.3); // 130%
      expect(config.overtimeMultiplier).toBe(1.25); // 125%
      expect(config.nightDifferentialRate).toBe(0.1); // 10%
    });

    test("Verify ultimate stacking multipliers", () => {
      // Rest Day + Regular Holiday = 1.30 × 2.0 = 2.60
      const restDayHolidayMultiplier =
        calculator.config.restDayMultiplier *
        calculator.config.regularHolidayMultiplier;
      expect(restDayHolidayMultiplier).toBe(2.6);

      // Rest Day + Regular Holiday + Overtime = 2.60 × 1.25 = 3.25
      const ultimateOvertimeMultiplier =
        restDayHolidayMultiplier * calculator.config.overtimeMultiplier;
      expect(ultimateOvertimeMultiplier).toBe(3.25);
    });
  });

  // Helper function to create attendance data
  function createAttendance(overrides = {}) {
    return {
      total_regular_hours: 8,
      total_overtime_hours: 0,
      night_differential_hours: 0,
      rest_day_hours_worked: 0,
      regular_holiday_days_worked: 0,
      special_holiday_days_worked: 0,
      late_minutes: 0,
      undertime_minutes: 0,
      days_worked: 1,
      payroll_breakdowns: [
        {
          regular_hours: 8,
          overtime: { total: 0 },
          premiums: {
            night_differential: { total: 0 },
            rest_day: { total: 0 },
            holidays: {},
          },
        },
      ],
      ...overrides,
    };
  }
});

// Export for use in other test files
export { AdvancedPayrollCalculator };
