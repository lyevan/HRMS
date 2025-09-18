# JSON-Based Payroll Queries

## Simple Queries (Using Existing Columns - Fast)

```sql
-- Monthly overtime summary
SELECT
    employee_id,
    SUM(overtime_hours) as total_overtime,
    SUM(night_differential_hours) as total_night_diff,
    SUM(rest_day_hours_worked) as total_rest_day
FROM attendance
WHERE date >= '2025-09-01' AND date < '2025-10-01'
GROUP BY employee_id;

-- Employee attendance summary
SELECT
    COUNT(*) as days_worked,
    AVG(total_hours) as avg_hours_per_day,
    SUM(overtime_hours) as total_ot
FROM attendance
WHERE employee_id = 'EMP001'
    AND date >= '2025-09-01';
```

## Detailed JSON Queries (For Complex Calculations)

```sql
-- Get detailed overtime breakdown
SELECT
    employee_id,
    date,
    payroll_breakdown->'overtime'->>'total' as total_overtime,
    payroll_breakdown->'overtime'->>'regular_overtime' as regular_ot,
    payroll_breakdown->'overtime'->>'night_diff_overtime' as nd_ot,
    payroll_breakdown->'overtime'->>'rest_day_overtime' as rd_ot
FROM attendance
WHERE overtime_hours > 0
    AND date >= '2025-09-01';

-- Night differential breakdown (regular vs overtime)
SELECT
    employee_id,
    date,
    (payroll_breakdown->'premiums'->'night_differential'->>'total')::numeric as total_nd,
    (payroll_breakdown->'premiums'->'night_differential'->>'regular')::numeric as nd_regular,
    (payroll_breakdown->'premiums'->'night_differential'->>'overtime')::numeric as nd_overtime
FROM attendance
WHERE night_differential_hours > 0;

-- Holiday work analysis
SELECT
    employee_id,
    date,
    is_regular_holiday,
    is_special_holiday,
    payroll_breakdown->'premiums'->'holidays'->'regular_holiday'->>'total' as reg_holiday_hours,
    payroll_breakdown->'premiums'->'holidays'->'regular_holiday'->>'overtime' as reg_holiday_ot,
    payroll_breakdown->'premiums'->'holidays'->'regular_holiday'->>'night_diff' as reg_holiday_nd
FROM attendance
WHERE is_regular_holiday = true OR is_special_holiday = true;

-- Complex payroll calculation query
SELECT
    employee_id,
    date,
    total_hours,

    -- Regular pay components
    (payroll_breakdown->'regular_hours')::numeric as regular_hours,

    -- Overtime pay components
    (payroll_breakdown->'overtime'->'regular_overtime')::numeric as regular_ot,
    (payroll_breakdown->'overtime'->'night_diff_overtime')::numeric as nd_ot,
    (payroll_breakdown->'overtime'->'rest_day_overtime')::numeric as rd_ot,

    -- Premium components
    (payroll_breakdown->'premiums'->'night_differential'->'regular')::numeric as nd_regular,
    (payroll_breakdown->'premiums'->'rest_day'->'regular')::numeric as rd_regular,

    -- Deductions
    (payroll_breakdown->'deductions'->'undertime_hours')::numeric as undertime_deduction,
    (payroll_breakdown->'deductions'->'late_hours')::numeric as late_deduction

FROM attendance
WHERE employee_id = 'EMP001'
    AND date >= '2025-09-01';
```

## Payroll Calculation Examples

```sql
-- Calculate total pay for an employee (example rates)
SELECT
    employee_id,
    date,

    -- Base calculations
    (payroll_breakdown->'regular_hours')::numeric * 500 as regular_pay,

    -- Overtime calculations (1.25x)
    (payroll_breakdown->'overtime'->'regular_overtime')::numeric * 500 * 1.25 as regular_ot_pay,

    -- Night differential (10% premium)
    (payroll_breakdown->'premiums'->'night_differential'->'regular')::numeric * 500 * 1.10 as nd_regular_pay,

    -- Night differential overtime (1.25x + 10%)
    (payroll_breakdown->'overtime'->'night_diff_overtime')::numeric * 500 * 1.25 * 1.10 as nd_ot_pay,

    -- Rest day overtime (1.30x)
    (payroll_breakdown->'overtime'->'rest_day_overtime')::numeric * 500 * 1.30 as rd_ot_pay,

    -- Deductions
    (payroll_breakdown->'deductions'->'undertime_hours')::numeric * 500 * -1 as undertime_deduction

FROM attendance
WHERE employee_id = 'EMP001'
    AND date = '2025-09-19';
```

## Performance Tips

1. **Use simple columns for filtering and aggregation**
2. **Use JSON for detailed breakdown only when needed**
3. **Create partial indexes on JSON fields if frequently queried**
4. **Cast JSON values to numeric for calculations**

```sql
-- Efficient query pattern
SELECT employee_id, SUM(overtime_hours)
FROM attendance
WHERE overtime_hours > 0  -- Fast: uses regular column
    AND date >= '2025-09-01'
GROUP BY employee_id;

-- Then get details for specific records
SELECT payroll_breakdown->'overtime'
FROM attendance
WHERE employee_id = 'EMP001'
    AND overtime_hours > 0
    AND date = '2025-09-19';
```

## Index Recommendations

```sql
-- JSON GIN index for flexible queries
CREATE INDEX idx_attendance_payroll_breakdown
ON attendance USING gin (payroll_breakdown);

-- Specific JSON path indexes for frequent queries
CREATE INDEX idx_attendance_ot_breakdown
ON attendance USING gin ((payroll_breakdown->'overtime'));

CREATE INDEX idx_attendance_premiums
ON attendance USING gin ((payroll_breakdown->'premiums'));
```
