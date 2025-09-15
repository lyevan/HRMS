# Loans, Advances & 13th Month Pay Implementation

## 🎯 New Features Added

### ✅ 1. Enhanced Loans & Advances System

#### **Database Schema Enhancements**

```sql
-- Enhanced deductions table for installment-based deductions
ALTER TABLE deductions ADD COLUMN principal_amount NUMERIC DEFAULT 0;
ALTER TABLE deductions ADD COLUMN remaining_balance NUMERIC DEFAULT 0;
ALTER TABLE deductions ADD COLUMN installment_amount NUMERIC DEFAULT 0;
ALTER TABLE deductions ADD COLUMN installments_total INTEGER DEFAULT 1;
ALTER TABLE deductions ADD COLUMN installments_paid INTEGER DEFAULT 0;
ALTER TABLE deductions ADD COLUMN start_date DATE;
ALTER TABLE deductions ADD COLUMN end_date DATE;
ALTER TABLE deductions ADD COLUMN interest_rate NUMERIC DEFAULT 0;
ALTER TABLE deductions ADD COLUMN payment_frequency VARCHAR DEFAULT 'monthly';
ALTER TABLE deductions ADD COLUMN is_recurring BOOLEAN DEFAULT false;
ALTER TABLE deductions ADD COLUMN auto_deduct BOOLEAN DEFAULT true;
ALTER TABLE deductions ADD COLUMN next_deduction_date DATE;

-- New deduction payments tracking table
CREATE TABLE deduction_payments (
  payment_id SERIAL PRIMARY KEY,
  deduction_id INTEGER REFERENCES deductions(deduction_id),
  employee_id VARCHAR REFERENCES employees(employee_id),
  payment_date DATE NOT NULL,
  amount_paid NUMERIC NOT NULL,
  remaining_balance_after NUMERIC NOT NULL,
  payroll_period_start DATE,
  payroll_period_end DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### **Key Features**

1. **Installment-Based Deductions**
   - Support for loans with monthly/semi-monthly/weekly payments
   - Automatic balance tracking and payment scheduling
   - Interest rate support for loan calculations

2. **Payment Tracking**
   - Complete payment history in `deduction_payments` table
   - Automatic balance updates after each deduction
   - Due date management and payment scheduling

3. **Smart Deduction Logic**
   - Only deduct from active loans with remaining balance
   - Respect start/end dates for deduction periods
   - Auto-disable when fully paid
   - Support for manual vs automatic deductions

#### **Usage Examples**

```javascript
// Create a loan deduction
const loanDeduction = {
  employee_id: 'EMP001',
  deduction_type_id: 2, // Loan type
  principal_amount: 50000,
  remaining_balance: 50000,
  installment_amount: 2500,
  installments_total: 20,
  payment_frequency: 'monthly',
  is_recurring: true,
  start_date: '2024-01-01',
  end_date: '2025-08-01',
  interest_rate: 0.12, // 12% annual
  description: 'Employee emergency loan'
};

// System automatically handles:
// - Monthly deductions of ₱2,500
// - Balance tracking (₱50,000 → ₱47,500 → ₱45,000...)
// - Payment history logging
// - Auto-completion when balance reaches ₱0
```

### ✅ 2. 13th Month Pay & Bonus System

#### **Database Schema Enhancements**

```sql
-- Enhanced bonuses table for 13th month pay
ALTER TABLE bonuses ADD COLUMN pay_period_start DATE;
ALTER TABLE bonuses ADD COLUMN pay_period_end DATE;
ALTER TABLE bonuses ADD COLUMN is_thirteenth_month BOOLEAN DEFAULT false;
ALTER TABLE bonuses ADD COLUMN is_pro_rated BOOLEAN DEFAULT false;
ALTER TABLE bonuses ADD COLUMN calculation_basis VARCHAR DEFAULT 'basic_salary';
ALTER TABLE bonuses ADD COLUMN months_worked NUMERIC DEFAULT 12;
ALTER TABLE bonuses ADD COLUMN year_earned INTEGER;
ALTER TABLE bonuses ADD COLUMN payment_schedule VARCHAR DEFAULT 'december';
ALTER TABLE bonuses ADD COLUMN is_paid BOOLEAN DEFAULT false;
ALTER TABLE bonuses ADD COLUMN paid_date DATE;
ALTER TABLE bonuses ADD COLUMN tax_withheld NUMERIC DEFAULT 0;
ALTER TABLE bonuses ADD COLUMN net_amount NUMERIC;
```

#### **13th Month Pay Features**

1. **Philippine Labor Code Compliance**
   - Mandatory for all employees who worked at least 1 month
   - Based on basic salary (excludes overtime, bonuses, allowances)
   - Calculated as 1/12 of total basic salary earned

2. **Pro-Rating Support**
   - Automatic pro-rating for employees who worked less than 12 months
   - Considers actual contract start date vs calendar year
   - Accurate month calculation including partial months

3. **Tax Calculation**
   - ₱90,000 annual exemption per Philippine tax law
   - Automatic tax withholding on excess amount
   - Net amount calculation after tax

4. **Flexible Payment Scheduling**
   - December payment (standard)
   - Split payment (June & December)
   - Quarterly payments (for companies that prefer)

#### **Calculation Method**

```javascript
// 13th Month Pay Formula (Philippine Standard):
// Basic Salary for Year ÷ 12 = 13th Month Pay
// If employee worked < 12 months: Pro-rate based on months worked

const calculation = await calculator.calculateThirteenthMonthPay('EMP001', 2024);
// Returns:
{
  employee_id: 'EMP001',
  year: 2024,
  months_worked: 10.5, // Pro-rated if hired mid-year
  total_basic_salary: 350000,
  gross_thirteenth_month: 29166.67, // 350000 ÷ 12
  tax_exempt_portion: 29166.67, // Under ₱90k limit
  taxable_portion: 0,
  tax_withheld: 0,
  net_thirteenth_month: 29166.67
}
```

#### **Batch Processing**

```javascript
// Calculate for all employees at once
const results = await calculator.batchCalculateThirteenthMonthPay(2024);
// Processes all active employees, handles pro-rating automatically
```

## 🏗️ Implementation Benefits

### **Before Enhancement**
- ❌ Simple one-time deductions only
- ❌ No installment or loan tracking
- ❌ Manual balance management required
- ❌ No 13th month pay automation
- ❌ No tax calculation for bonuses

### **After Enhancement**
- ✅ Full installment-based loan system
- ✅ Automatic balance tracking and payment scheduling
- ✅ Complete payment history and audit trail
- ✅ Philippine Labor Code compliant 13th month pay
- ✅ Automatic pro-rating and tax calculations
- ✅ Batch processing for year-end operations

## 📊 API Integration

### **New Methods Available**

```javascript
// Loan & Advance Management
await calculator.getIndividualDeductions(employeeId, payrollDate);
await calculator.updateDeductionPayment(deductionId, amount, date);

// 13th Month Pay
await calculator.calculateThirteenthMonthPay(employeeId, year);
await calculator.processThirteenthMonthPay(employeeId, year);
await calculator.batchCalculateThirteenthMonthPay(year);

// Bonus Management  
await calculator.calculateEmployeeBonuses(employeeId, startDate, endDate);
await calculator.getOrCreateBonusType(name, description);
```

### **Payroll Integration**
The enhanced deduction system is automatically integrated into regular payroll processing:
- Loans/advances are automatically calculated during payroll runs
- Payment history is recorded with each payroll period
- Balances are updated in real-time
- 13th month pay can be included in December payroll or processed separately

## 🎯 Next Steps

1. **Database Migration**: Run the schema enhancement scripts
2. **Frontend Updates**: Create UI for loan management and 13th month pay processing
3. **Testing**: Verify calculations with various loan amounts and employee scenarios
4. **Year-End Processing**: Set up automated 13th month pay calculation workflows

## 🇵🇭 Philippine Compliance Notes

- **13th Month Pay**: Fully compliant with Presidential Decree 851 and Labor Code requirements
- **Tax Treatment**: Follows BIR regulations for 13th month pay taxation (₱90,000 exemption)
- **Pro-Rating**: Accurately handles employees hired mid-year per DOLE guidelines
- **Payment Timing**: Supports standard December payment and alternative schedules

The system now provides complete loan management and Philippine-compliant 13th month pay processing! 🎉
