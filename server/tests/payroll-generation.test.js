/**
 * Payroll Generation Integration Tests
 * Tests the optimizedGeneratePayroll function with various scenarios
 */

import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

// Mock dependencies
jest.mock('../config/db.js', () => ({
  pool: {
    query: jest.fn()
  }
}));

jest.mock('../services/AdvancedPayrollCalculator.js');
jest.mock('../utils/attendanceCalculations.js');

// Import after mocking
import { pool } from '../config/db.js';
import { optimizedGeneratePayroll } from '../controllers/payrollController.js';

describe('Optimized Payroll Generation Tests', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.post('/payroll/generate', optimizedGeneratePayroll);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Input Validation', () => {
    test('Should reject missing required fields', async () => {
      const response = await request(app)
        .post('/payroll/generate')
        .send({
          // Missing start_date, end_date, run_by
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Missing required fields');
    });

    test('Should accept valid payroll generation request', async () => {
      // Mock database responses
      pool.query
        .mockResolvedValueOnce({ rows: [] }) // timesheet employees query
        .mockResolvedValueOnce({ rows: mockEmployees }) // employees query
        .mockResolvedValueOnce({ rows: [] }) // payroll header insert
        .mockResolvedValueOnce({ rows: [] }); // payslip inserts

      const response = await request(app)
        .post('/payroll/generate')
        .send({
          start_date: '2025-09-01',
          end_date: '2025-09-15',
          payroll_title: 'September 2025 - First Half',
          run_by: 1,
          employee_ids: [1, 2, 3]
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Employee Data Processing', () => {
    test('Should process employees with enhanced schedule information', async () => {
      const mockEmployeeWithSchedule = {
        employee_id: 1,
        first_name: 'John',
        last_name: 'Doe',
        rate: 500,
        rate_type: 'hourly',
        shift_start: '08:00:00',
        shift_end: '17:00:00',
        break_start: '12:00:00',
        break_end: '13:00:00',
        break_duration: 60,
        days_of_week: JSON.stringify([1, 2, 3, 4, 5])
      };

      pool.query
        .mockResolvedValueOnce({ rows: [] }) // timesheet query
        .mockResolvedValueOnce({ rows: [mockEmployeeWithSchedule] }) // employees query
        .mockResolvedValueOnce({ rows: [] }) // enhanced attendance query
        .mockResolvedValueOnce({ rows: [{ payroll_header_id: 1 }] }) // payroll header insert
        .mockResolvedValueOnce({ rows: [] }); // payslip inserts

      const response = await request(app)
        .post('/payroll/generate')
        .send({
          start_date: '2025-09-01',
          end_date: '2025-09-15',
          payroll_title: 'Test Payroll',
          run_by: 1,
          employee_ids: [1]
        });

      expect(response.status).toBe(200);
      
      // Verify that the schedule information was processed
      const queryCall = pool.query.mock.calls.find(call => 
        call[0].includes('break_start') && call[0].includes('break_end')
      );
      expect(queryCall).toBeDefined();
    });

    test('Should handle employees with payroll breakdown data', async () => {
      const mockAttendanceWithBreakdown = {
        employee_id: 1,
        payroll_breakdowns: JSON.stringify([{
          regular_hours: 8,
          overtime: { total: 2, regular_overtime: 2 },
          premiums: {
            night_differential: { total: 1 },
            rest_day: { total: 0 },
            holidays: {}
          },
          edge_case_flags: {
            has_overtime: true
          }
        }])
      };

      pool.query
        .mockResolvedValueOnce({ rows: [] }) // timesheet query
        .mockResolvedValueOnce({ rows: mockEmployees }) // employees query
        .mockResolvedValueOnce({ rows: [mockAttendanceWithBreakdown] }) // attendance query
        .mockResolvedValueOnce({ rows: [{ payroll_header_id: 1 }] }) // payroll header
        .mockResolvedValueOnce({ rows: [] }); // payslip inserts

      const response = await request(app)
        .post('/payroll/generate')
        .send({
          start_date: '2025-09-01',
          end_date: '2025-09-15',
          payroll_title: 'Test Payroll',
          run_by: 1,
          employee_ids: [1]
        });

      expect(response.status).toBe(200);
      expect(response.body.data.payslips).toBeDefined();
    });
  });

  describe('Edge Case Scenarios', () => {
    test('Should handle ultimate edge case: Day Off + Holiday + Night Diff + OT', async () => {
      const ultimateEdgeCaseAttendance = {
        employee_id: 1,
        payroll_breakdowns: JSON.stringify([{
          regular_hours: 0,
          overtime: { 
            total: 4,
            regular_holiday_rest_day_overtime: 4
          },
          premiums: {
            night_differential: { total: 4, regular: 4 },
            rest_day: { total: 12 },
            holidays: {
              regular_holiday_rest_day: {
                total: 12,
                regular: 8,
                overtime: 4
              }
            }
          },
          edge_case_flags: {
            is_ultimate_case_regular: true,
            premium_stack_count: 4
          }
        }])
      };

      pool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: mockEmployees })
        .mockResolvedValueOnce({ rows: [ultimateEdgeCaseAttendance] })
        .mockResolvedValueOnce({ rows: [{ payroll_header_id: 1 }] })
        .mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .post('/payroll/generate')
        .send({
          start_date: '2025-09-01',
          end_date: '2025-09-15',
          payroll_title: 'Ultimate Edge Case Test',
          run_by: 1,
          employee_ids: [1]
        });

      expect(response.status).toBe(200);
      
      // Should process without errors and generate high gross pay due to stacking
      const payslip = response.body.data.payslips[0];
      expect(payslip.gross_pay).toBeGreaterThan(15000); // Ultimate case should have high pay
    });

    test('Should handle multiple employees with different edge cases', async () => {
      const multipleEmployeeAttendance = [
        {
          employee_id: 1,
          payroll_breakdowns: JSON.stringify([{
            regular_hours: 8,
            overtime: { total: 0 },
            premiums: { night_differential: { total: 0 }, rest_day: { total: 0 }, holidays: {} }
          }])
        },
        {
          employee_id: 2,
          payroll_breakdowns: JSON.stringify([{
            regular_hours: 0,
            overtime: { total: 2, rest_day_overtime: 2 },
            premiums: { 
              night_differential: { total: 1 },
              rest_day: { total: 10, pure_rest_day: 10 },
              holidays: {}
            }
          }])
        }
      ];

      pool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: mockEmployees.slice(0, 2) })
        .mockResolvedValueOnce({ rows: multipleEmployeeAttendance })
        .mockResolvedValueOnce({ rows: [{ payroll_header_id: 1 }] })
        .mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .post('/payroll/generate')
        .send({
          start_date: '2025-09-01',
          end_date: '2025-09-15',
          payroll_title: 'Multiple Employees Test',
          run_by: 1,
          employee_ids: [1, 2]
        });

      expect(response.status).toBe(200);
      expect(response.body.data.payslips).toHaveLength(2);
      
      // Regular employee should have normal pay
      const regularPayslip = response.body.data.payslips.find(p => p.employee_id === 1);
      expect(regularPayslip.gross_pay).toBe(4000); // 8 × ₱500
      
      // Rest day employee should have premium pay
      const restDayPayslip = response.body.data.payslips.find(p => p.employee_id === 2);
      expect(restDayPayslip.gross_pay).toBeGreaterThan(4000);
    });
  });

  describe('Error Handling', () => {
    test('Should handle database errors gracefully', async () => {
      pool.query.mockRejectedValueOnce(new Error('Database connection failed'));

      const response = await request(app)
        .post('/payroll/generate')
        .send({
          start_date: '2025-09-01',
          end_date: '2025-09-15',
          payroll_title: 'Error Test',
          run_by: 1,
          employee_ids: [1]
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });

    test('Should handle payroll calculation errors', async () => {
      // Mock successful queries but calculation error
      pool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: mockEmployees })
        .mockResolvedValueOnce({ rows: [] }); // No attendance data

      const response = await request(app)
        .post('/payroll/generate')
        .send({
          start_date: '2025-09-01',
          end_date: '2025-09-15',
          payroll_title: 'Calculation Error Test',
          run_by: 1,
          employee_ids: [1]
        });

      // Should handle gracefully and still return success
      expect(response.status).toBe(200);
    });
  });

  describe('Performance & Optimization', () => {
    test('Should handle large employee batches efficiently', async () => {
      const largeEmployeeList = Array.from({ length: 100 }, (_, i) => ({
        employee_id: i + 1,
        first_name: `Employee${i + 1}`,
        last_name: 'Test',
        rate: 500,
        rate_type: 'hourly'
      }));

      pool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: largeEmployeeList })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ payroll_header_id: 1 }] })
        .mockResolvedValueOnce({ rows: [] });

      const startTime = Date.now();
      
      const response = await request(app)
        .post('/payroll/generate')
        .send({
          start_date: '2025-09-01',
          end_date: '2025-09-15',
          payroll_title: 'Performance Test',
          run_by: 1,
          employee_ids: largeEmployeeList.map(e => e.employee_id)
        });

      const duration = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });
});

// Mock data
const mockEmployees = [
  {
    employee_id: 1,
    first_name: 'John',
    last_name: 'Doe',
    rate: 500,
    rate_type: 'hourly',
    position_title: 'Software Engineer',
    employment_type: 'Regular',
    shift_start: '08:00:00',
    shift_end: '17:00:00',
    break_start: '12:00:00',
    break_end: '13:00:00',
    break_duration: 60,
    days_of_week: JSON.stringify([1, 2, 3, 4, 5])
  },
  {
    employee_id: 2,
    first_name: 'Jane',
    last_name: 'Smith',
    rate: 600,
    rate_type: 'hourly',
    position_title: 'Senior Developer',
    employment_type: 'Regular',
    shift_start: '09:00:00',
    shift_end: '18:00:00',
    break_start: '13:00:00',
    break_end: '14:00:00',
    break_duration: 60,
    days_of_week: JSON.stringify([1, 2, 3, 4, 5])
  }
];