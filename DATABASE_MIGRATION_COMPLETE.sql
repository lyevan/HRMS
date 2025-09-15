-- =============================================================================
-- COMPLETE DATABASE MIGRATION FOR PAYROLL SYSTEM - 2025 UPDATE
-- Run these queries to make the system fully functional with 2025 compliance
-- =============================================================================

-- 1. ENHANCE ATTENDANCE TABLE
-- Add missing fields required by payroll calculations
ALTER TABLE attendance 
ADD COLUMN IF NOT EXISTS late_minutes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS undertime_minutes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS night_differential_hours NUMERIC(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS rest_day_hours_worked NUMERIC(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_entitled_holiday BOOLEAN DEFAULT FALSE;

-- Add comments for clarity
COMMENT ON COLUMN attendance.late_minutes IS 'Minutes late (for DOLE 1/216 penalty calculation)';
COMMENT ON COLUMN attendance.undertime_minutes IS 'Minutes of undertime';
COMMENT ON COLUMN attendance.night_differential_hours IS 'Hours worked between 10PM-6AM (DOLE night differential)';
COMMENT ON COLUMN attendance.rest_day_hours_worked IS 'Hours worked on designated rest day';
COMMENT ON COLUMN attendance.is_entitled_holiday IS 'Entitled to holiday pay even if not worked';

-- 2. CREATE EMPLOYEE SCHEDULE OVERRIDES TABLE
-- For individual employee schedule modifications
CREATE TABLE IF NOT EXISTS employee_schedule_overrides (
  override_id SERIAL PRIMARY KEY,
  employee_id VARCHAR NOT NULL REFERENCES employees(employee_id),
  override_type VARCHAR NOT NULL CHECK (override_type IN ('hours_per_day', 'days_per_week', 'monthly_working_days', 'custom_rate')),
  override_value NUMERIC NOT NULL,
  effective_from DATE NOT NULL,
  effective_until DATE,
  reason TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_by VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(employee_id, override_type, effective_from)
);

COMMENT ON TABLE employee_schedule_overrides IS 'Individual employee schedule and rate overrides';

-- 3. ENHANCE DEDUCTIONS TABLE
-- Add fields for loans/advances with installment tracking
ALTER TABLE deductions 
ADD COLUMN IF NOT EXISTS principal_amount NUMERIC(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS remaining_balance NUMERIC(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS installment_amount NUMERIC(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS installments_total INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS installments_paid INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS end_date DATE,
ADD COLUMN IF NOT EXISTS interest_rate NUMERIC(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_frequency VARCHAR DEFAULT 'monthly',
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS auto_deduct BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS next_deduction_date DATE;


-- Normalize data before applying constraints
UPDATE deductions SET payment_frequency = 'monthly'
WHERE payment_frequency IS NULL OR trim(payment_frequency) = '';

UPDATE bonuses SET calculation_basis = 'basic_salary'
WHERE calculation_basis IS NULL OR trim(calculation_basis) = '';

UPDATE bonuses SET payment_schedule = 'december'
WHERE payment_schedule IS NULL OR trim(payment_schedule) = '';

-- Add constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'check_payment_frequency'
      AND conrelid = 'deductions'::regclass
  ) THEN
    ALTER TABLE deductions 
    ADD CONSTRAINT check_payment_frequency CHECK (payment_frequency IN ('weekly', 'bi-weekly', 'semi-monthly', 'monthly'));
  END IF;
END
$$ LANGUAGE plpgsql;

-- 4. CREATE DEDUCTION PAYMENTS TRACKING TABLE
-- Enhanced payment tracking with proper constraints and identity column
CREATE TABLE IF NOT EXISTS deduction_payments (
  payment_id INTEGER NOT NULL GENERATED ALWAYS AS IDENTITY,
  deduction_id INTEGER NOT NULL,
  employee_id VARCHAR NOT NULL,
  payment_date DATE NOT NULL,
  amount_paid NUMERIC NOT NULL,
  remaining_balance_after NUMERIC NOT NULL,
  payroll_period_start DATE,
  payroll_period_end DATE,
  notes TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  CONSTRAINT deduction_payments_pkey PRIMARY KEY (payment_id),
  CONSTRAINT deduction_payments_deduction_id_fkey FOREIGN KEY (deduction_id)
      REFERENCES deductions(deduction_id) ON DELETE CASCADE,
  CONSTRAINT deduction_payments_employee_id_fkey FOREIGN KEY (employee_id)
      REFERENCES employees(employee_id) ON DELETE CASCADE
);

COMMENT ON TABLE deduction_payments IS 'Payment history for installment-based deductions';

-- 5. ENHANCE BONUSES TABLE FOR 13TH MONTH PAY
-- Add fields for Philippine 13th month pay compliance
ALTER TABLE bonuses 
ADD COLUMN IF NOT EXISTS pay_period_start DATE,
ADD COLUMN IF NOT EXISTS pay_period_end DATE,
ADD COLUMN IF NOT EXISTS is_thirteenth_month BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_pro_rated BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS calculation_basis VARCHAR DEFAULT 'basic_salary',
ADD COLUMN IF NOT EXISTS months_worked NUMERIC(12,2) DEFAULT 12,
ADD COLUMN IF NOT EXISTS year_earned INTEGER,
ADD COLUMN IF NOT EXISTS payment_schedule VARCHAR DEFAULT 'december',
ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS paid_date DATE,
ADD COLUMN IF NOT EXISTS tax_withheld NUMERIC(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS net_amount NUMERIC;


-- Normalize data before applying constraints
UPDATE deductions SET payment_frequency = 'monthly'
WHERE payment_frequency IS NULL OR trim(payment_frequency) = '';

UPDATE bonuses SET calculation_basis = 'basic_salary'
WHERE calculation_basis IS NULL OR trim(calculation_basis) = '';

UPDATE bonuses SET payment_schedule = 'december'
WHERE payment_schedule IS NULL OR trim(payment_schedule) = '';

-- Add constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'check_calculation_basis'
      AND conrelid = 'bonuses'::regclass
  ) THEN
    ALTER TABLE bonuses 
    ADD CONSTRAINT check_calculation_basis CHECK (calculation_basis IN ('basic_salary', 'total_earnings', 'gross_pay'));
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'check_payment_schedule'
      AND conrelid = 'bonuses'::regclass
  ) THEN
    ALTER TABLE bonuses
    ADD CONSTRAINT check_payment_schedule 
    CHECK (payment_schedule IN ('december', 'split_june_december', 'quarterly'));
  END IF;
END
$$ LANGUAGE plpgsql;

-- 6. ENHANCE LEAVE TYPES TABLE
-- Add pay percentage support for different leave types
ALTER TABLE leave_types 
ADD COLUMN IF NOT EXISTS pay_percentage INTEGER DEFAULT 100;

COMMENT ON COLUMN leave_types.pay_percentage IS 'Percentage of salary paid for this leave type (e.g., 80% for sick leave)';

-- 7. CREATE PAYROLL RUNS TABLE
-- Track payroll processing history
CREATE TABLE IF NOT EXISTS payroll_runs (
  payroll_run_id SERIAL PRIMARY KEY,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  pay_frequency VARCHAR NOT NULL DEFAULT 'monthly',
  run_date TIMESTAMP DEFAULT NOW(),
  processed_by VARCHAR,
  total_employees INTEGER,
  total_gross_pay NUMERIC(12,2),
  total_deductions NUMERIC(12,2),
  total_net_pay NUMERIC(12,2),
  status VARCHAR DEFAULT 'draft' CHECK (status IN ('draft', 'processed', 'approved', 'paid')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 8. CREATE PAYROLL RUN DETAILS TABLE
-- Individual employee payroll details per run
CREATE TABLE IF NOT EXISTS payroll_run_details (
  detail_id SERIAL PRIMARY KEY,
  payroll_run_id INTEGER NOT NULL REFERENCES payroll_runs(payroll_run_id),
  employee_id VARCHAR NOT NULL REFERENCES employees(employee_id),
  
  -- Earnings
  base_pay NUMERIC(12,2) DEFAULT 0,
  overtime_pay NUMERIC(12,2) DEFAULT 0,
  holiday_pay NUMERIC(12,2) DEFAULT 0,
  night_differential NUMERIC(12,2) DEFAULT 0,
  leave_pay NUMERIC(12,2) DEFAULT 0,
  other_earnings NUMERIC(12,2) DEFAULT 0,
  gross_pay NUMERIC(12,2) DEFAULT 0,
  
  -- Deductions
  sss_employee NUMERIC(12,2) DEFAULT 0,
  sss_employer NUMERIC(12,2) DEFAULT 0,
  philhealth_employee NUMERIC(12,2) DEFAULT 0,
  philhealth_employer NUMERIC(12,2) DEFAULT 0,
  pagibig_employee NUMERIC(12,2) DEFAULT 0,
  pagibig_employer NUMERIC(12,2) DEFAULT 0,
  income_tax NUMERIC(12,2) DEFAULT 0,
  other_deductions NUMERIC(12,2) DEFAULT 0,
  total_deductions NUMERIC(12,2) DEFAULT 0,
  
  -- Final amounts
  net_pay NUMERIC(12,2) DEFAULT 0,
  
  -- Metadata
  calculation_data JSONB, -- Store full calculation breakdown
  created_at TIMESTAMP DEFAULT NOW()
);

-- 9. INSERT DEFAULT BONUS TYPES
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='bonus_types') THEN
    INSERT INTO bonus_types (name, description) VALUES 
('13th Month Pay', 'Mandatory 13th month pay per Philippine Labor Code'),
('Performance Bonus', 'Merit-based performance bonus'),
('Holiday Bonus', 'Christmas or holiday season bonus'),
('Productivity Bonus', 'Team or company productivity bonus')
ON CONFLICT (name) DO NOTHING;
  END IF;
END$$;

-- 10. INSERT DEFAULT DEDUCTION TYPES FOR LOANS/ADVANCES
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='deduction_types') THEN
    INSERT INTO deduction_types (name, description) VALUES 
('Employee Loan', 'General employee loan'),
('Emergency Loan', 'Emergency or calamity loan'),
('Cash Advance', 'Salary advance or cash advance'),
('Equipment Loan', 'Loan for equipment or gadgets'),
('Educational Loan', 'Educational assistance loan'),
('Housing Loan', 'Housing or property loan assistance')
ON CONFLICT (name) DO NOTHING;
  END IF;
END$$;

-- 11. CREATE PAYROLL CALCULATION LOG TABLE
-- Log all payroll calculations for audit trail
CREATE TABLE IF NOT EXISTS payroll_calculation_logs (
  log_id SERIAL PRIMARY KEY,
  employee_id VARCHAR NOT NULL REFERENCES employees(employee_id),
  calculation_date TIMESTAMP DEFAULT NOW(),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  calculation_type VARCHAR NOT NULL, -- 'regular', 'thirteenth_month', 'bonus'
  input_data JSONB,
  output_data JSONB,
  calculator_version VARCHAR,
  errors TEXT,
  processing_time_ms INTEGER
);

-- 12. CREATE INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON attendance(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_date_range ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_employee_overrides_active ON employee_schedule_overrides(employee_id, is_active, effective_from, effective_until);
CREATE INDEX IF NOT EXISTS idx_deductions_employee_active ON deductions(employee_id, is_active, auto_deduct);
CREATE INDEX IF NOT EXISTS idx_deduction_payments_deduction ON deduction_payments(deduction_id, payment_date);
CREATE INDEX IF NOT EXISTS idx_bonuses_employee_year ON bonuses(employee_id, year_earned, is_thirteenth_month);
CREATE INDEX IF NOT EXISTS idx_payroll_runs_period ON payroll_runs(period_start, period_end, status);
CREATE INDEX IF NOT EXISTS idx_payroll_details_run_employee ON payroll_run_details(payroll_run_id, employee_id);

-- 13. ADD SAMPLE LEAVE TYPES WITH PAY PERCENTAGES
UPDATE leave_types SET pay_percentage = 100 WHERE name IN ('Vacation Leave', 'Emergency Leave');
UPDATE leave_types SET pay_percentage = 100 WHERE name = 'Sick Leave'; -- Can be changed to 80% if company policy
UPDATE leave_types SET pay_percentage = 0 WHERE name IN ('Leave Without Pay', 'Suspension');

-- Insert maternity/paternity leave if not exists
INSERT INTO leave_types (name, description, is_paid, pay_percentage) VALUES 
('Maternity Leave', 'Maternity leave per RA 11210', TRUE, 100),
('Paternity Leave', 'Paternity leave per RA 8972', TRUE, 100),
('Solo Parent Leave', 'Solo parent leave per RA 8972', TRUE, 100)
ON CONFLICT (name) DO NOTHING;

-- 14. CREATE VIEWS FOR EASY REPORTING
CREATE OR REPLACE VIEW v_employee_current_payroll AS
SELECT 
  e.employee_id,
  e.first_name,
  e.last_name,
  e.status,
  c.rate,
  c.rate_type,
  et.name as employment_type,
  p.title as position,
  d.name as department
FROM employees e
JOIN contracts c ON e.contract_id = c.contract_id
JOIN employment_types et ON c.employment_type_id = et.employment_type_id
JOIN positions p ON c.position_id = p.position_id
JOIN departments d ON p.department_id = d.department_id
WHERE e.status = 'active';

CREATE OR REPLACE VIEW v_active_loans_summary AS
SELECT 
  d.employee_id,
  e.first_name,
  e.last_name,
  dt.name as loan_type,
  d.principal_amount,
  d.remaining_balance,
  d.installment_amount,
  d.installments_total,
  d.installments_paid,
  (d.installments_total - d.installments_paid) as installments_remaining,
  d.next_deduction_date
FROM deductions d
JOIN employees e ON d.employee_id = e.employee_id
JOIN deduction_types dt ON d.deduction_type_id = dt.deduction_type_id
WHERE d.is_active = TRUE 
  AND d.is_recurring = TRUE 
  AND d.remaining_balance > 0;

-- 15. GRANT PERMISSIONS (adjust as needed for your user)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_app_user;

-- =============================================================================
-- 2025 PHILIPPINE PAYROLL COMPLIANCE CONFIGURATION
-- =============================================================================

-- 16. CREATE PAYROLL CONFIGURATION TABLE FOR 2025 RATES
CREATE TABLE IF NOT EXISTS payroll_configuration (
  config_id INTEGER NOT NULL GENERATED ALWAYS AS IDENTITY,
  config_type VARCHAR NOT NULL,
  config_key VARCHAR NOT NULL,
  config_value VARCHAR NOT NULL, -- Changed to VARCHAR to support both numeric and text values
  effective_date DATE NOT NULL,
  expiry_date DATE,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  CONSTRAINT payroll_configuration_pkey PRIMARY KEY (config_id),
  CONSTRAINT payroll_configuration_unique UNIQUE (config_type, config_key, effective_date)
);

-- 17. INSERT 2025 PHILIPPINE COMPLIANCE RATES
-- SSS Contribution Rates 2025
INSERT INTO payroll_configuration (config_type, config_key, config_value, effective_date, description) VALUES
('sss', 'contribution_rate_employee', 0.045, '2025-01-01', 'SSS Employee Contribution Rate 4.5% (2025)'),
('sss', 'contribution_rate_employer', 0.085, '2025-01-01', 'SSS Employer Contribution Rate 8.5% (2025)'),
('sss', 'minimum_salary_credit', 4000, '2025-01-01', 'SSS Minimum Monthly Salary Credit (2025)'),
('sss', 'maximum_salary_credit', 30000, '2025-01-01', 'SSS Maximum Monthly Salary Credit (2025)'),

-- PhilHealth Contribution Rates 2025 (UHC Act Implementation)
('philhealth', 'contribution_rate_total', 0.055, '2025-01-01', 'PhilHealth Total Contribution Rate 5.5% (2025 UHC Act)'),
('philhealth', 'contribution_rate_employee', 0.0275, '2025-01-01', 'PhilHealth Employee Share 2.75% (2025)'),
('philhealth', 'contribution_rate_employer', 0.0275, '2025-01-01', 'PhilHealth Employer Share 2.75% (2025)'),
('philhealth', 'minimum_premium', 550, '2025-01-01', 'PhilHealth Minimum Monthly Premium (2025)'),
('philhealth', 'maximum_premium', 6875, '2025-01-01', 'PhilHealth Maximum Monthly Premium (2025)'),

-- Pag-IBIG Contribution Rates 2025
('pagibig', 'contribution_rate_employee_tier1', 0.01, '2025-01-01', 'Pag-IBIG Employee Rate 1% (≤₱1,500 salary)'),
('pagibig', 'contribution_rate_employee_tier2', 0.02, '2025-01-01', 'Pag-IBIG Employee Rate 2% (>₱1,500 salary)'),
('pagibig', 'contribution_rate_employer', 0.02, '2025-01-01', 'Pag-IBIG Employer Rate 2%'),
('pagibig', 'minimum_contribution', 15, '2025-01-01', 'Pag-IBIG Minimum Monthly Contribution'),
('pagibig', 'maximum_contribution', 200, '2025-01-01', 'Pag-IBIG Maximum Monthly Contribution'),
('pagibig', 'salary_threshold', 1500, '2025-01-01', 'Pag-IBIG Salary Threshold for Rate Determination'),

-- Income Tax Rates 2025 (TRAIN Law with inflation adjustments)
('income_tax', 'exemption_annual', 250000, '2025-01-01', 'Annual Tax Exemption (2025)'),
('income_tax', 'bracket_1_limit', 250000, '2025-01-01', 'Tax Bracket 1: ₱0 - ₱250,000 (0%)'),
('income_tax', 'bracket_2_limit', 400000, '2025-01-01', 'Tax Bracket 2: ₱250,001 - ₱400,000 (15%)'),
('income_tax', 'bracket_3_limit', 800000, '2025-01-01', 'Tax Bracket 3: ₱400,001 - ₱800,000 (20%)'),
('income_tax', 'bracket_4_limit', 2000000, '2025-01-01', 'Tax Bracket 4: ₱800,001 - ₱2,000,000 (25%)'),
('income_tax', 'bracket_5_limit', 8000000, '2025-01-01', 'Tax Bracket 5: ₱2,000,001 - ₱8,000,000 (30%)'),
('income_tax', 'rate_bracket_1', 0.00, '2025-01-01', 'Tax Rate 0% (First ₱250,000)'),
('income_tax', 'rate_bracket_2', 0.15, '2025-01-01', 'Tax Rate 15% (₱250,001 - ₱400,000)'),
('income_tax', 'rate_bracket_3', 0.20, '2025-01-01', 'Tax Rate 20% (₱400,001 - ₱800,000)'),
('income_tax', 'rate_bracket_4', 0.25, '2025-01-01', 'Tax Rate 25% (₱800,001 - ₱2,000,000)'),
('income_tax', 'rate_bracket_5', 0.30, '2025-01-01', 'Tax Rate 30% (₱2,000,001 - ₱8,000,000)'),
('income_tax', 'rate_bracket_6', 0.32, '2025-01-01', 'Tax Rate 32% (Above ₱8,000,000)'),

-- 13th Month Pay Configuration 2025
('thirteenth_month', 'tax_exemption_limit', 90000, '2025-01-01', '13th Month Pay Tax Exemption Limit (2025)'),
('thirteenth_month', 'calculation_basis', 'basic_salary', '2025-01-01', 'Calculation Basis: basic_salary or total_earnings'),
('thirteenth_month', 'minimum_months_worked', 1, '2025-01-01', 'Minimum Months Worked for Pro-rated 13th Month'),

-- Holiday Pay Rates 2025
('holiday_pay', 'regular_holiday_rate', 2.0, '2025-01-01', 'Regular Holiday Pay Rate (200%)'),
('holiday_pay', 'special_holiday_rate', 1.3, '2025-01-01', 'Special Holiday Pay Rate (130%)'),
('holiday_pay', 'regular_holiday_not_worked', 1.0, '2025-01-01', 'Regular Holiday Not Worked (100%)'),

-- Overtime Rates 2025
('overtime', 'regular_overtime_rate', 1.25, '2025-01-01', 'Regular Overtime Rate (125%)'),
('overtime', 'holiday_overtime_rate', 2.6, '2025-01-01', 'Holiday Overtime Rate (260%)'),
('overtime', 'rest_day_overtime_rate', 1.69, '2025-01-01', 'Rest Day Overtime Rate (169%)'),

-- Night Differential 2025
('night_differential', 'rate', 0.10, '2025-01-01', 'Night Differential Rate (10%)'),
('night_differential', 'start_time', 22, '2025-01-01', 'Night Differential Start Time (10:00 PM)'),
('night_differential', 'end_time', 6, '2025-01-01', 'Night Differential End Time (6:00 AM)');

-- 18. CREATE PAYROLL CONFIGURATION VIEW FOR EASY ACCESS
CREATE OR REPLACE VIEW v_current_payroll_config AS
SELECT 
  config_type,
  config_key,
  config_value,
  description,
  effective_date
FROM payroll_configuration
WHERE is_active = TRUE 
  AND effective_date <= CURRENT_DATE 
  AND (expiry_date IS NULL OR expiry_date > CURRENT_DATE)
ORDER BY config_type, config_key;

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================

-- Verify tables were created
SELECT 
  schemaname,
  tablename,
  hasindexes,
  hasrules,
  hastriggers
FROM pg_tables 
WHERE tablename IN (
  'employee_schedule_overrides', 
  'deduction_payments', 
  'payroll_runs', 
  'payroll_run_details',
  'payroll_calculation_logs'
) 
ORDER BY tablename;


-- Trigger function for auto-updating updated_at columns
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables with updated_at
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name='employee_schedule_overrides' 
             AND column_name='updated_at') THEN
    CREATE TRIGGER trg_employee_schedule_overrides_updated
    BEFORE UPDATE ON employee_schedule_overrides
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name='payroll_runs' 
             AND column_name='updated_at') THEN
    CREATE TRIGGER trg_payroll_runs_updated
    BEFORE UPDATE ON payroll_runs
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END$$;