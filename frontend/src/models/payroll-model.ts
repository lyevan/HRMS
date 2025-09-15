// Payroll Configuration Models
export interface PayrollConfig {
  config_id: number;
  config_key: string;
  config_value: string;
  data_type: "integer" | "decimal" | "string" | "boolean";
  description: string;
  is_active: boolean;
  parsed_value: number | string | boolean;
  created_at: string;
  updated_at: string;
}

export interface PayrollConfigUpdate {
  value: string | number | boolean;
}

// Employee Schedule Override Models
export interface EmployeeScheduleOverride {
  override_id: number;
  employee_id: string;
  override_type: "hours_per_day" | "days_per_week" | "monthly_working_days";
  override_value: number;
  effective_from: string;
  effective_until?: string;
  reason?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateEmployeeOverride {
  employee_id: string;
  override_type: "hours_per_day" | "days_per_week" | "monthly_working_days";
  override_value: number;
  effective_from: string;
  effective_until?: string;
  reason?: string;
}

// Payroll Header Models
export interface PayrollHeader {
  payroll_header_id: number;
  run_date: string;
  start_date: string;
  end_date: string;
  status?: string;
  created_at: string;
  updated_at: string;
  total_employees?: number;
  total_gross_pay?: number;
  total_deductions?: number;
  total_net_pay?: number;
}

export interface CreatePayrollHeader {
  run_date: string;
  start_date: string;
  end_date: string;
  employee_ids?: string[];
  run_by?: string;
  payroll_title?: string;
  notes?: string;
}

// Payslip Models
export interface Payslip {
  payslip_id: number;
  employee_id: string;
  payroll_header_id: number;
  gross_pay: number;
  overtime_pay: number;
  night_diff_pay: number;
  leave_pay: number;
  bonuses: number;
  deductions: number;
  net_pay: number;
  created_at: string;
  updated_at: string;

  // Detailed breakdown fields
  basic_salary?: number;
  allowances?: number;
  bonus?: number;
  income_tax?: number;
  sss_contribution?: number;
  philhealth_contribution?: number;
  pagibig_contribution?: number;
  other_deductions?: number;
  total_deductions?: number;

  // Attendance fields
  days_worked?: number;
  paid_leave_days?: number;
  total_hours?: number;
  overtime_hours?: number;
  late_days?: number;

  // Joined employee data
  first_name?: string;
  last_name?: string;
  position_title?: string;
  department_name?: string;
  rate?: number;
  rate_type?: string;

  // Joined payroll header data
  payroll_header?: PayrollHeader;

  // Joined employee data with nested relations
  employee?: {
    first_name: string;
    last_name: string;
    position?: {
      title: string;
    };
    department?: {
      name: string;
    };
    employment_type?: {
      name: string;
    };
  };
}

// Payroll Calculation Models
export interface PayrollCalculationResult {
  employeeId: string;
  period: {
    startDate: string;
    endDate: string;
  };
  grossPay: number;
  overtimePay: number;
  holidayPay: number;
  leavePay: number;
  totalBonuses: number;
  totalDeductions: number;
  netPay: number;
  breakdown: PayrollBreakdown;
}

export interface PayrollBreakdown {
  basePay: number;
  governmentDeductions: number;
  individualDeductions: number;
  penaltyDeductions: number;
  attendanceData: AttendanceData;
  employeeData: EmployeePayrollData;
}

export interface AttendanceData {
  days_worked: number;
  paid_leave_days: number;
  total_hours: number;
  overtime_hours: number;
  late_days: number;
  dayoff_worked: number;
  regular_holiday_worked: number;
  special_holiday_worked: number;
  regular_holiday_not_worked: number;
}

export interface EmployeePayrollData {
  name: string;
  rate: number;
  rateType: string;
  effectiveHoursPerDay: number;
  effectiveMonthlyWorkingDays: number;
}

// Bonus & Deduction Models
export interface BonusType {
  bonus_type_id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Bonus {
  bonus_id: number;
  employee_id: string;
  bonus_type_id: number;
  amount: number;
  description?: string;
  date: string;
  created_at: string;
  updated_at: string;
  bonus_type?: string;
}

export interface DeductionType {
  deduction_type_id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Deduction {
  deduction_id: number;
  employee_id: string;
  deduction_type_id: number;
  amount: number;
  description?: string;
  date: string;
  created_at: string;
  updated_at: string;
  deduction_type?: string;
}

// API Response Models
export interface PayrollApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Filter and Search Models
export interface PayrollFilters {
  startDate?: string;
  endDate?: string;
  employeeId?: string;
  departmentId?: number;
  payrollHeaderId?: number;
}

export interface PayrollTableData extends Payslip {
  employee_name: string;
  position: string;
  department: string;
}

// Form Models
export interface PayrollGenerationForm {
  startDate: string;
  endDate: string;
  runDate: string;
  selectedEmployees?: string[];
  includeInactive?: boolean;
}

export interface ConfigurationForm {
  [key: string]: string | number | boolean;
}

// Export utility functions
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(amount);
};

export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString("en-PH");
};

export const formatDateRange = (startDate: string, endDate: string): string => {
  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
};

export const getRateTypeLabel = (rateType: string): string => {
  switch (rateType) {
    case "hourly":
      return "Hourly";
    case "daily":
      return "Daily";
    case "monthly":
      return "Monthly";
    default:
      return rateType;
  }
};

// Advanced Payroll Calculation Models
export interface ExtendedAttendanceData {
  days_worked: number;
  paid_leave_days: number;
  unpaid_leave_days: number;
  total_regular_hours: number;
  total_overtime_hours: number;
  late_days: number;
  regular_holiday_days: number;
  special_holiday_days: number;
  night_hours?: number;
  weekend_hours?: number;
}

export interface EmployeeDetails {
  employee_id: string;
  first_name: string;
  last_name: string;
  rate: number;
  rate_type: "hourly" | "daily" | "monthly";
  contract_start: string;
  contract_end?: string;
  position_title: string;
  employment_type: string;
}

export interface EarningsBreakdown {
  basePay: number;
  overtimePay: number;
  holidayPay: number;
  nightDifferential: number;
  weekendPay?: number;
  leavePay: number;
  bonuses?: number;
  otherEarnings: number;
  grossPay: number;
}

export interface DeductionsBreakdown {
  sss: number;
  philhealth: number;
  pagibig: number;
  tax: number;
  loan_deductions?: number;
  uniform_deductions?: number;
  otherDeductions: number;
  totalDeductions: number;
}

export interface PayrollCalculationResult {
  employee_id: string;
  employee_name: string;
  position: string;
  employment_type: string;
  rate: number;
  rate_type: "hourly" | "daily" | "monthly";
  period: {
    startDate: string;
    endDate: string;
  };
  attendance: ExtendedAttendanceData;
  earnings: EarningsBreakdown;
  deductions: DeductionsBreakdown;
  net_pay: number;
  calculated_at: string;
  error?: string;
}

// Payroll Generation Models
export interface PayrollGenerationRequest {
  start_date: string;
  end_date: string;
  employee_ids?: string[];
  generation_type: "all_employees" | "selected_employees" | "by_department";
  department_ids?: number[];
  run_by?: string;
  notes?: string;
}

export interface PayrollGenerationResponse {
  success: boolean;
  message: string;
  data?: {
    payroll_header_id: number;
    period: {
      startDate: string;
      endDate: string;
    };
    successful_payslips: PayrollCalculationResult[];
    failed_payslips: Array<{
      employee_id: string;
      error: string;
    }>;
    summary: {
      total_processed: number;
      total_failed: number;
      total_gross_pay: number;
      total_net_pay: number;
    };
  };
}

// Payroll Summary Models
export interface PayrollSummary {
  total_payroll_runs: number;
  total_payslips: number;
  total_gross_pay: number;
  total_overtime_pay: number;
  total_leave_pay: number;
  total_deductions: number;
  total_net_pay: number;
  average_net_pay: number;
  period?: {
    startDate: string;
    endDate: string;
  };
}

export interface PayrollReport {
  period: {
    startDate: string;
    endDate: string;
  };
  total_records: number;
  summary: PayrollSummary;
  records: PayrollCalculationResult[];
  by_department?: Array<{
    department_name: string;
    employee_count: number;
    total_gross: number;
    total_net: number;
  }>;
  by_employment_type?: Array<{
    employment_type: string;
    employee_count: number;
    total_gross: number;
    total_net: number;
  }>;
}

// Tax Bracket Configuration
export interface TaxBracket {
  min: number;
  max: number;
  rate: number;
  fixed_amount?: number;
}

export interface DeductionConfig {
  rate: number;
  cap?: number;
  threshold?: number;
  brackets?: TaxBracket[];
}

export interface PayrollCalculatorConfig {
  // Working time configuration
  standardWorkingHours: number;
  standardWorkingDays: number;
  weekendDays: number[];

  // Overtime configuration
  overtimeMultiplier: number;
  overtimeThreshold: number;
  nightDifferentialRate: number;

  // Holiday multipliers
  regularHolidayMultiplier: number;
  specialHolidayMultiplier: number;
  restDayMultiplier: number;
  weekendMultiplier?: number;

  // Leave configuration
  paidLeaveTypes: string[];
  unpaidLeaveTypes: string[];

  // Deduction configuration
  deductions: {
    sss: DeductionConfig;
    philhealth: DeductionConfig;
    pagibig: DeductionConfig;
    tax: {
      brackets: TaxBracket[];
    };
  };

  // Rounding configuration
  payrollRounding: "up" | "down" | "nearest";
  roundingIncrement: number;
}

// Form Models for Frontend
export interface PayrollGenerationForm {
  generation_type: "all_employees" | "selected_employees" | "by_department";
  date_range_type:
    | "current_cutoff"
    | "previous_cutoff"
    | "this_month"
    | "custom";
  start_date?: string;
  end_date?: string;
  employee_ids?: string[];
  department_ids?: number[];
  notes?: string;
}

export interface PayrollConfigForm {
  working_hours: number;
  working_days: number;
  overtime_multiplier: number;
  night_differential_rate: number;
  regular_holiday_multiplier: number;
  special_holiday_multiplier: number;
  weekend_multiplier: number;
  sss_rate: number;
  sss_cap: number;
  philhealth_rate: number;
  philhealth_cap: number;
  pagibig_rate: number;
  pagibig_cap: number;
}

// Table Column Models for TanStack Table
export interface PayrollHeaderTableData {
  payroll_header_id: number;
  run_date: string;
  start_date: string;
  end_date: string;
  employee_count: number;
  total_gross_pay: number;
  total_net_pay: number;
  status: string;
  run_by?: string;
  actions?: any;
}

export interface PayslipTableData {
  payslip_id: number;
  employee_id: string;
  employee_name: string;
  position: string;
  employment_type: string;
  days_worked: number;
  gross_pay: number;
  deductions: number;
  net_pay: number;
  status?: string;
  actions?: any;
}

// Export/Import Models
export interface PayrollExportOptions {
  format: "pdf" | "excel" | "csv";
  include_summary: boolean;
  include_details: boolean;
  group_by?: "department" | "employment_type" | "none";
  date_range?: {
    start_date: string;
    end_date: string;
  };
}

export interface PayslipExportData {
  header: PayrollHeader;
  payslip: PayrollCalculationResult;
  company_info?: {
    name: string;
    address: string;
    contact: string;
  };
}
