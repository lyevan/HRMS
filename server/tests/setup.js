/**
 * Jest Test Setup
 * Global configuration and mocks for the test suite
 */

// Mock console.log to reduce test output noise (optional)
global.console = {
  ...console,
  log: jest.fn(), // Mock console.log
  debug: jest.fn(), // Mock console.debug
  info: jest.fn(), // Mock console.info
  warn: console.warn, // Keep warnings
  error: console.error, // Keep errors
};

// Global test constants
global.TEST_EMPLOYEE = {
  employee_id: 1,
  first_name: "Test",
  last_name: "Employee",
  rate: 500,
  rate_type: "hourly",
  position_title: "Test Position",
  employment_type: "Regular"
};

global.TEST_SCHEDULE = {
  shift_start: "08:00:00",
  shift_end: "17:00:00",
  break_start: "12:00:00",
  break_end: "13:00:00",
  break_duration: 60,
  start_time: "08:00:00",
  end_time: "17:00:00"
};

// Global test helpers
global.createMockAttendance = (overrides = {}) => {
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
    payroll_breakdowns: [{
      regular_hours: 8,
      overtime: { total: 0 },
      premiums: {
        night_differential: { total: 0 },
        rest_day: { total: 0 },
        holidays: {}
      }
    }],
    ...overrides
  };
};

// Setup test environment
beforeAll(() => {
  // Set timezone for consistent test results
  process.env.TZ = 'Asia/Manila';
});

afterAll(() => {
  // Cleanup
  delete process.env.TZ;
});

// Global error handler for unhandled promise rejections in tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

export {};