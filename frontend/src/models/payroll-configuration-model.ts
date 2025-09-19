/**
 * Payroll Configuration Models (2025 Schema)
 * These models represent the enhanced payroll configuration system
 * for Philippine compliance with holiday stacking and complex rate calculations
 */

// Base payroll configuration interface
export interface PayrollConfiguration {
  config_id: number;
  config_type: string;
  config_key: string;
  config_value: number;
  effective_date: string;
  expiry_date?: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Grouped configurations by type for easier frontend consumption
export interface PayrollConfigurationsByType {
  [configType: string]: {
    [configKey: string]: {
      value: number;
      description?: string;
      effective_date: string;
      expiry_date?: string;
    };
  };
}

// API response wrapper for payroll configurations
export interface PayrollConfigurationApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  effectiveDate?: string;
}

// Update request for payroll configuration
export interface PayrollConfigurationUpdate {
  config_type: string;
  config_key: string;
  config_value: number;
  effective_date?: string;
  description?: string;
}

// Bulk update request
export interface BulkPayrollConfigurationUpdate {
  configurations: PayrollConfigurationUpdate[];
}

// Configuration section for UI organization
export interface PayrollConfigurationSection {
  title: string;
  description: string;
  configs: PayrollConfiguration[];
  icon: React.ReactNode;
}

// Specific configuration types for 2025 Philippine compliance
export type PayrollConfigType =
  | "sss"
  | "philhealth"
  | "pagibig"
  | "income_tax"
  | "thirteenth_month"
  | "holiday_pay"
  | "overtime"
  | "night_differential"
  | "government"
  | "penalties";

// Configuration keys for each type
export interface SSS_ConfigKeys {
  employee_rate: number;
  employer_rate: number;
  min_salary: number;
  max_salary: number;
  min_contribution: number;
  max_contribution: number;
}

export interface PhilHealth_ConfigKeys {
  employee_rate: number;
  employer_rate: number;
  total_rate: number;
  min_salary: number;
  max_salary: number;
  min_contribution: number;
  max_contribution: number;
}

export interface PagIbig_ConfigKeys {
  employee_rate_low: number;
  employee_rate_medium: number;
  employee_rate_high: number;
  employer_rate: number;
  salary_threshold_low: number;
  salary_threshold_high: number;
  max_contribution: number;
}

export interface IncomeTax_ConfigKeys {
  bracket_1_min: number;
  bracket_1_max: number;
  bracket_1_rate: number;
  bracket_2_min: number;
  bracket_2_max: number;
  bracket_2_rate: number;
  bracket_2_fixed: number;
  bracket_3_min: number;
  bracket_3_max: number;
  bracket_3_rate: number;
  bracket_3_fixed: number;
  bracket_4_min: number;
  bracket_4_max: number;
  bracket_4_rate: number;
  bracket_4_fixed: number;
  bracket_5_min: number;
  bracket_5_rate: number;
  bracket_5_fixed: number;
}

export interface HolidayPay_ConfigKeys {
  regular_holiday_worked_rate: number;
  regular_holiday_not_worked_rate: number;
  special_holiday_worked_rate: number;
  rest_day_rate: number;
  regular_holiday_rest_day_rate: number;
  special_holiday_rest_day_rate: number;
}

export interface Overtime_ConfigKeys {
  regular_overtime_rate: number;
  night_differential_overtime_rate: number;
  rest_day_overtime_rate: number;
  holiday_overtime_rate: number;
  holiday_rest_day_overtime_rate: number;
  overtime_threshold_hours: number;
}

export interface NightDifferential_ConfigKeys {
  rate: number;
  start_time: string; // "22:00"
  end_time: string; // "06:00"
}

// Validation and business rules
export interface PayrollConfigurationValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  affectedEmployees?: number;
  effectiveDate: string;
}

// Configuration change history
export interface PayrollConfigurationHistory {
  config_id: number;
  config_type: string;
  config_key: string;
  old_value: number;
  new_value: number;
  effective_date: string;
  changed_by: string;
  changed_at: string;
  reason?: string;
}

// Enhanced configuration with metadata for complex calculations
export interface EnhancedPayrollConfiguration extends PayrollConfiguration {
  // Validation metadata
  min_value?: number;
  max_value?: number;
  step?: number;

  // Business logic metadata
  depends_on?: string[]; // Other config keys this depends on
  affects?: string[]; // What this config affects

  // Display metadata
  display_format?: "percentage" | "currency" | "number" | "time";
  display_suffix?: string;

  // Compliance metadata
  legal_requirement?: boolean;
  compliance_authority?: string;
  last_legal_update?: string;
}

// Store interface for payroll configurations
export interface PayrollConfigurationState {
  configurations: PayrollConfiguration[];
  configurationsByType: PayrollConfigurationsByType;
  loading: boolean;
  error: string | null;
  lastFetched: string | null;

  // Actions
  fetchConfigurations: () => Promise<void>;
  fetchActiveConfigurations: (date?: string) => Promise<void>;
  updateConfiguration: (
    configType: string,
    configKey: string,
    value: number,
    effectiveDate?: string
  ) => Promise<void>;
  bulkUpdateConfigurations: (
    updates: PayrollConfigurationUpdate[]
  ) => Promise<void>;
  initializeDefaultConfigurations: () => Promise<void>;
  validateConfiguration: (
    configType: string,
    configKey: string,
    value: number
  ) => PayrollConfigurationValidation;
  clearError: () => void;
}

// Form data for the payroll configuration modal
export interface PayrollConfigurationFormData {
  [key: string]: string; // Format: "config_type.config_key" -> value as string
}

// Modal props interface
export interface PayrollConfigurationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateConfig: (
    configType: string,
    configKey: string,
    value: number,
    effectiveDate?: string
  ) => Promise<void>;
  loading?: boolean;
}
