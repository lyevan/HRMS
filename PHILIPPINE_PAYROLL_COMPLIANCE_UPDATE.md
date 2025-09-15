# Philippine Payroll Compliance Update (2024)

## Overview
The payroll system has been updated to comply with current Philippine labor laws and tax regulations as of 2024.

## Major Changes

### 1. **SSS Contribution (2024 Rates)**
- Replaced simple percentage calculation with official SSS contribution table
- Employee contributions range from ₱135 to ₱900
- Based on monthly salary compensation brackets
- Automatic bracket matching in calculation

### 2. **PhilHealth Premium (2024 Rates)**
- Updated to 5% total premium (2.5% employee, 2.5% employer)
- Minimum contribution: ₱500/month
- Maximum contribution: ₱5,000/month
- Salary floor: ₱10,000, Salary ceiling: ₱100,000

### 3. **Pag-IBIG/HDMF Contribution**
- 1% for monthly salary ≤ ₱1,500
- 2% for monthly salary > ₱1,500
- Maximum monthly contribution: ₱100

### 4. **Income Tax (TRAIN Law)**
- Updated brackets with correct rates and fixed amounts:
  - ₱0 - ₱250,000: 0% (tax-free)
  - ₱250,001 - ₱400,000: 15%
  - ₱400,001 - ₱800,000: 20% + ₱22,500
  - ₱800,001 - ₱2,000,000: 25% + ₱102,500
  - ₱2,000,001 - ₱8,000,000: 30% + ₱402,500
  - Above ₱8,000,000: 35% + ₱2,202,500

### 5. **Individual Deductions System**
- Added support for employee-specific deductions (loans, advances, etc.)
- Linked to `deductions` and `deduction_types` tables
- Active/inactive status tracking

## Database Schema Updates

### Modified Tables:
```sql
-- Added is_active field to deductions table
ALTER TABLE deductions ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
```

### Existing Required Tables:
- `deduction_types` - Types of deductions (loan, advance, etc.)
- `deductions` - Individual employee deductions
- `employee_schedule_overrides` - Employee-specific schedule modifications
- `payroll_config` - System-wide payroll configurations

## How the System Works

### 1. **Government Contribution Detection**
The system automatically applies government contributions based on:
- Employee employment type ("Regular" employees get full contributions)
- Monthly salary calculations
- Official rate tables and brackets

### 2. **Deduction Flow**
1. Calculate monthly equivalent of gross pay
2. Apply SSS contribution (table lookup)
3. Apply PhilHealth contribution (percentage with min/max)
4. Apply Pag-IBIG contribution (tiered percentage)
5. Calculate taxable income (gross - mandatory contributions)
6. Apply income tax (progressive brackets)
7. Add individual deductions from database

### 3. **Employee Override System**
- Allows modification of standard working parameters per employee
- Types: hours_per_day, days_per_week, monthly_working_days
- Date-range based (effective_from, effective_until)
- Integrated into payroll calculations

## Frontend Updates

### Payroll Configuration Modal
- Added Philippine compliance notice
- Reorganized configuration groups for clarity
- Enhanced descriptions for government contribution settings

### Employee Override Management
- Full CRUD interface for employee schedule overrides
- Date range validation
- Employee filtering and search

## API Endpoints

All existing payroll endpoints now use the updated AdvancedPayrollCalculator:
- `/api/payroll/generate` - Generate payroll with Philippine compliance
- `/api/payroll/config` - Manage payroll configurations
- `/api/payroll/employee-overrides` - Manage employee schedule overrides

## Migration Notes

### From PayrollConfigService to AdvancedPayrollCalculator:
- All configuration management now centralized in AdvancedPayrollCalculator
- Static methods added for configuration CRUD operations
- Legacy PayrollConfigService can be removed

### Data Migration:
- Existing payroll_config data remains compatible
- No data migration required for core tables
- Add is_active column to deductions table if not exists

## Testing Recommendations

1. **Test with different salary ranges** to verify contribution calculations
2. **Verify tax brackets** with various income levels
3. **Test employee overrides** for part-time/special arrangements
4. **Validate deduction combinations** (government + individual)

## Legal Compliance Notes

- All rates are current as of 2024
- SSS table matches official 2024 contribution schedule
- PhilHealth rates follow latest premium updates
- TRAIN Law tax brackets implemented correctly
- Regular updates needed as government rates change

