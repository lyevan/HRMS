import pool from "../config/db.js";
import PayrollConfigService from "./payrollConfigService.js";

class AdvancedPayrollCalculator {
  constructor() {
    this.configs = null;
  }

  async initializeConfigs() {
    try {
      this.configs = await PayrollConfigService.getMultipleConfigs([
        "monthly_working_days",
        "standard_daily_hours",
        "overtime_multiplier",
        "holiday_regular_multiplier",
        "holiday_special_multiplier",
        "dayoff_multiplier",
        "late_penalty_rate",
        "sss_employee_rate",
        "philhealth_employee_rate",
        "hdmf_monthly_contribution",
      ]);
    } catch (error) {
      console.error("Error initializing payroll configs:", error);
      throw error;
    }
  }

  async calculateEmployeePayroll(employeeId, startDate, endDate) {
    try {
      if (!this.configs) {
        await this.initializeConfigs();
      }

      const employeeData = await this.getEmployeeWithOverrides(employeeId);
      if (!employeeData) {
        throw new Error("Employee not found or inactive");
      }

      const attendanceData = await this.getAttendanceData(
        employeeId,
        startDate,
        endDate
      );

      const bonusData = await this.getBonusData(employeeId, startDate, endDate);
      const deductionData = await this.getDeductionData(
        employeeId,
        startDate,
        endDate
      );

      const basePay = this.calculateBasePay(employeeData, attendanceData);
      const overtimePay = this.calculateOvertimePay(
        employeeData,
        attendanceData
      );
      const holidayPay = this.calculateHolidayPay(employeeData, attendanceData);
      const leavePay = this.calculateLeavePay(employeeData, attendanceData);

      const governmentDeductions = this.calculateGovernmentDeductions(
        basePay + overtimePay
      );
      const individualDeductions = this.sumIndividualDeductions(deductionData);
      const penaltyDeductions = this.calculatePenaltyDeductions(
        employeeData,
        attendanceData
      );

      const totalBonuses = this.sumBonuses(bonusData);

      const grossPay = basePay + overtimePay + holidayPay + leavePay;
      const totalDeductions =
        governmentDeductions + individualDeductions + penaltyDeductions;
      const netPay = grossPay + totalBonuses - totalDeductions;

      return {
        employeeId,
        period: { startDate, endDate },
        grossPay: parseFloat(grossPay.toFixed(2)),
        overtimePay: parseFloat(overtimePay.toFixed(2)),
        holidayPay: parseFloat(holidayPay.toFixed(2)),
        leavePay: parseFloat(leavePay.toFixed(2)),
        totalBonuses: parseFloat(totalBonuses.toFixed(2)),
        totalDeductions: parseFloat(totalDeductions.toFixed(2)),
        netPay: parseFloat(netPay.toFixed(2)),
        breakdown: {
          basePay: parseFloat(basePay.toFixed(2)),
          governmentDeductions: parseFloat(governmentDeductions.toFixed(2)),
          individualDeductions: parseFloat(individualDeductions.toFixed(2)),
          penaltyDeductions: parseFloat(penaltyDeductions.toFixed(2)),
          attendanceData,
          employeeData: {
            name: `${employeeData.first_name} ${employeeData.last_name}`,
            rate: employeeData.rate,
            rateType: employeeData.rate_type,
            effectiveHoursPerDay: employeeData.effective_hours_per_day,
            effectiveMonthlyWorkingDays:
              employeeData.effective_monthly_working_days,
          },
        },
      };
    } catch (error) {
      console.error("Error calculating payroll:", error);
      throw error;
    }
  }

  async getEmployeeWithOverrides(employeeId) {
    try {
      const result = await pool.query(
        `
                SELECT 
                    e.*, c.rate, c.rate_type,
                    s.hours_per_day as schedule_hours_per_day,
                    s.days_per_week as schedule_days_per_week,
                    COALESCE(
                        (SELECT override_value FROM employee_schedule_overrides 
                         WHERE employee_id = e.employee_id AND override_type = 'hours_per_day' 
                         AND effective_from <= NOW() AND (effective_until IS NULL OR effective_until >= NOW())
                         ORDER BY effective_from DESC LIMIT 1),
                        s.hours_per_day,
                        $2
                    ) as effective_hours_per_day,
                    COALESCE(
                        (SELECT override_value FROM employee_schedule_overrides 
                         WHERE employee_id = e.employee_id AND override_type = 'monthly_working_days'
                         AND effective_from <= NOW() AND (effective_until IS NULL OR effective_until >= NOW())
                         ORDER BY effective_from DESC LIMIT 1),
                        $3
                    ) as effective_monthly_working_days
                FROM employees e
                LEFT JOIN contracts c ON e.contract_id = c.contract_id
                LEFT JOIN schedules s ON e.schedule_id = s.schedule_id
                WHERE e.employee_id = $1 AND e.status = 'active'
            `,
        [
          employeeId,
          this.configs.standard_daily_hours,
          this.configs.monthly_working_days,
        ]
      );

      return result.rows[0];
    } catch (error) {
      console.error("Error getting employee data:", error);
      throw error;
    }
  }

  async getAttendanceData(employeeId, startDate, endDate) {
    try {
      const result = await pool.query(
        `
                SELECT 
                    COUNT(*) as days_worked,
                    SUM(CASE WHEN on_leave = true AND leave_type_id IN (
                        SELECT leave_type_id FROM leave_types WHERE name ILIKE '%paid%'
                    ) THEN 1 ELSE 0 END) as paid_leave_days,
                    SUM(COALESCE(total_hours, 0)) as total_hours,
                    SUM(COALESCE(overtime_hours, 0)) as overtime_hours,
                    COUNT(CASE WHEN is_late = true THEN 1 END) as late_days,
                    COUNT(CASE WHEN is_dayoff = true AND is_present = true THEN 1 END) as dayoff_worked,
                    COUNT(CASE WHEN is_regular_holiday = true AND is_present = true THEN 1 END) as regular_holiday_worked,
                    COUNT(CASE WHEN is_special_holiday = true AND is_present = true THEN 1 END) as special_holiday_worked,
                    COUNT(CASE WHEN is_regular_holiday = true AND is_present = false THEN 1 END) as regular_holiday_not_worked
                FROM attendance 
                WHERE employee_id = $1 
                    AND date BETWEEN $2 AND $3
                    AND (is_present = true OR on_leave = true)
            `,
        [employeeId, startDate, endDate]
      );

      const data = result.rows[0];

      Object.keys(data).forEach((key) => {
        data[key] = parseFloat(data[key]) || 0;
      });

      return data;
    } catch (error) {
      console.error("Error getting attendance data:", error);
      throw error;
    }
  }

  async getBonusData(employeeId, startDate, endDate) {
    try {
      const result = await pool.query(
        `
                SELECT 
                    bt.name as bonus_type,
                    SUM(b.amount) as total_bonus
                FROM bonuses b
                JOIN bonus_types bt ON b.bonus_type_id = bt.bonus_type_id
                WHERE b.employee_id = $1 
                    AND b.date BETWEEN $2 AND $3
                GROUP BY bt.bonus_type_id, bt.name
            `,
        [employeeId, startDate, endDate]
      );

      return result.rows;
    } catch (error) {
      console.error("Error getting bonus data:", error);
      throw error;
    }
  }

  async getDeductionData(employeeId, startDate, endDate) {
    try {
      const result = await pool.query(
        `
                SELECT 
                    dt.name as deduction_type,
                    SUM(d.amount) as total_deduction
                FROM deductions d
                JOIN deduction_types dt ON d.deduction_type_id = dt.deduction_type_id
                WHERE d.employee_id = $1 
                    AND d.date BETWEEN $2 AND $3
                GROUP BY dt.deduction_type_id, dt.name
            `,
        [employeeId, startDate, endDate]
      );

      return result.rows;
    } catch (error) {
      console.error("Error getting deduction data:", error);
      throw error;
    }
  }

  calculateBasePay(employeeData, attendanceData) {
    const { rate, rate_type } = employeeData;

    switch (rate_type) {
      case "hourly":
        return attendanceData.total_hours * rate;
      case "daily":
        return attendanceData.days_worked * rate;
      case "monthly":
        const expectedDays = employeeData.effective_monthly_working_days;
        return (attendanceData.days_worked / expectedDays) * rate;
      default:
        throw new Error(`Unsupported rate type: ${rate_type}`);
    }
  }

  calculateOvertimePay(employeeData, attendanceData) {
    const hourlyRate = this.getHourlyRateFromContract(employeeData);
    return (
      attendanceData.overtime_hours *
      hourlyRate *
      this.configs.overtime_multiplier
    );
  }

  calculateHolidayPay(employeeData, attendanceData) {
    const dailyRate = this.getDailyRateFromContract(employeeData);
    let holidayPay = 0;

    holidayPay +=
      attendanceData.regular_holiday_worked *
      dailyRate *
      this.configs.holiday_regular_multiplier;

    holidayPay +=
      attendanceData.special_holiday_worked *
      dailyRate *
      this.configs.holiday_special_multiplier;

    holidayPay += attendanceData.regular_holiday_not_worked * dailyRate;

    holidayPay +=
      attendanceData.dayoff_worked * dailyRate * this.configs.dayoff_multiplier;

    return holidayPay;
  }

  calculateLeavePay(employeeData, attendanceData) {
    const dailyRate = this.getDailyRateFromContract(employeeData);
    return attendanceData.paid_leave_days * dailyRate;
  }

  calculateGovernmentDeductions(grossPay) {
    const sssDeduction = grossPay * this.configs.sss_employee_rate;
    const philHealthDeduction =
      grossPay * this.configs.philhealth_employee_rate;
    const hdmfDeduction = this.configs.hdmf_monthly_contribution;

    return sssDeduction + philHealthDeduction + hdmfDeduction;
  }

  calculatePenaltyDeductions(employeeData, attendanceData) {
    const dailyRate = this.getDailyRateFromContract(employeeData);
    return (
      attendanceData.late_days * (dailyRate * this.configs.late_penalty_rate)
    );
  }

  sumIndividualDeductions(deductionData) {
    return deductionData.reduce((total, deduction) => {
      return total + parseFloat(deduction.total_deduction || 0);
    }, 0);
  }

  sumBonuses(bonusData) {
    return bonusData.reduce((total, bonus) => {
      return total + parseFloat(bonus.total_bonus || 0);
    }, 0);
  }

  getDailyRateFromContract(employeeData) {
    const { rate, rate_type } = employeeData;

    switch (rate_type) {
      case "daily":
        return rate;
      case "hourly":
        return rate * employeeData.effective_hours_per_day;
      case "monthly":
        return rate / employeeData.effective_monthly_working_days;
      default:
        throw new Error(`Unsupported rate type: ${rate_type}`);
    }
  }

  getHourlyRateFromContract(employeeData) {
    const { rate, rate_type } = employeeData;

    switch (rate_type) {
      case "hourly":
        return rate;
      case "daily":
        return rate / employeeData.effective_hours_per_day;
      case "monthly":
        return (
          rate /
          (employeeData.effective_monthly_working_days *
            employeeData.effective_hours_per_day)
        );
      default:
        throw new Error(`Unsupported rate type: ${rate_type}`);
    }
  }
}

export default AdvancedPayrollCalculator;
