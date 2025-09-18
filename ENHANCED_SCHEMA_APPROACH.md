# Enhanced Database Schema Approach - COMPREHENSIVE EDGE CASE HANDLING

## Current Schema Issues:

- Adding columns for every overtime type will bloat the database
- Hard to maintain and extend for new scenarios
- Complex queries for reporting
- **24+ different edge case combinations** need to be handled

## ALL POSSIBLE EDGE CASES IDENTIFIED:

1. **Regular Day**: Normal work
2. **Regular Day + OT**: Work beyond schedule
3. **Regular Day + ND**: Night shift
4. **Regular Day + ND + OT**: Night shift with overtime
5. **Day Off**: Rest day work
6. **Day Off + ND**: Rest day with night work
7. **Day Off + OT**: Rest day with overtime
8. **Day Off + ND + OT**: Rest day with night overtime
9. **Regular Holiday**: Holiday work
10. **Regular Holiday + ND**: Holiday with night work
11. **Regular Holiday + OT**: Holiday with overtime
12. **Regular Holiday + ND + OT**: Holiday with night overtime
13. **Special Holiday**: Special holiday work
14. **Special Holiday + ND**: Special holiday with night work
15. **Special Holiday + OT**: Special holiday with overtime
16. **Special Holiday + ND + OT**: Special holiday with night overtime
17. **Day Off + Regular Holiday**: Rest day that's also a regular holiday
18. **Day Off + Regular Holiday + ND**: Rest day + regular holiday + night
19. **Day Off + Regular Holiday + OT**: Rest day + regular holiday + overtime
20. **Day Off + Regular Holiday + ND + OT**: **ULTIMATE EDGE CASE** - ALL COMBINED!
21. **Day Off + Special Holiday**: Rest day that's also special holiday
22. **Day Off + Special Holiday + ND**: Rest day + special holiday + night
23. **Day Off + Special Holiday + OT**: Rest day + special holiday + overtime
24. **Day Off + Special Holiday + ND + OT**: Rest day + special holiday + night + overtime

## Recommended Solution: COMPREHENSIVE JSON Column Approach

### 1. Keep Existing Simple Columns (for basic queries/indexes)

```sql
-- Keep these for fast queries and reports
total_hours numeric(5, 2)
overtime_hours numeric(5, 2) -- Total OT only
night_differential_hours numeric(5, 2)
rest_day_hours_worked numeric(5, 2)
regular_holiday_hours_worked numeric(5, 2)
special_holiday_hours_worked numeric(5, 2)
```

### 2. Add Single JSON Column for ALL Edge Case Details

```sql
-- Add this single column for comprehensive payroll calculations
payroll_breakdown jsonb null
```

### 3. COMPREHENSIVE JSON Structure Example:

```json
{
  "regular_hours": 2.0,

  "overtime": {
    "total": 4.0,
    "regular_overtime": 0.0,
    "night_diff_overtime": 2.0,
    "rest_day_overtime": 1.0,
    "regular_holiday_overtime": 1.0,
    "special_holiday_overtime": 0.0
  },

  "premiums": {
    "night_differential": {
      "total": 6.0,
      "regular": 4.0,
      "overtime": 2.0
    },

    "rest_day": {
      "total": 12.0,
      "regular": 11.0,
      "overtime": 1.0
    },

    "holidays": {
      "regular_holiday": {
        "total": 12.0,
        "regular": 11.0,
        "overtime": 1.0,
        "night_diff": 6.0,
        "rest_day": 12.0
      },

      "special_holiday": {
        "total": 0.0,
        "regular": 0.0,
        "overtime": 0.0,
        "night_diff": 0.0,
        "rest_day": 0.0
      }
    }
  },

  "deductions": {
    "undertime_hours": 0.0,
    "late_hours": 0.5
  },

  "edge_case_flags": {
    "is_day_off": true,
    "is_regular_holiday": true,
    "is_special_holiday": false,
    "is_day_off_and_regular_holiday": true,
    "is_day_off_and_special_holiday": false,
    "has_night_differential": true,
    "has_overtime": true,
    "has_multiple_premiums": true
  }
}
```

## Real-World Ultimate Edge Case Example:

**Scenario**: Employee works 6AM-8PM on a rest day that's also a regular holiday, with 6 hours of night differential

**Breakdown**:

- **Total Hours**: 12 hours (6AM-8PM minus 2hr break = 12 hours)
- **Regular Holiday Hours**: 12 hours (all hours on regular holiday)
- **Rest Day Hours**: 12 hours (all hours on rest day)
- **Night Differential**: 6 hours (6AM-6AM + 6PM-8PM)
- **Overtime**: 4 hours (12 total - 8 scheduled)

**JSON Result**:

```json
{
  "regular_hours": 0.0,
  "overtime": {
    "total": 4.0,
    "regular_overtime": 0.0,
    "night_diff_overtime": 2.0,
    "rest_day_overtime": 1.0,
    "regular_holiday_overtime": 1.0
  },
  "premiums": {
    "holidays": {
      "regular_holiday": {
        "total": 12.0,
        "regular": 8.0,
        "overtime": 4.0,
        "night_diff": 6.0,
        "rest_day": 12.0
      }
    }
  },
  "edge_case_flags": {
    "is_day_off_and_regular_holiday": true,
    "has_night_differential": true,
    "has_overtime": true,
    "has_multiple_premiums": true
  }
}
```

**Payroll Calculation**:

- Regular Holiday Base: 8 hours × ₱500 × 2.0 = ₱8,000
- Regular Holiday OT: 4 hours × ₱500 × 2.60 = ₱5,200
- Night Differential Premium: 6 hours × ₱500 × 0.10 = ₱300
- Rest Day Premium: Already included in holiday rate
- **Total**: ₱13,500 for 12 hours work!

## Benefits:

### 1. **Handles ALL Edge Cases**

- Every possible combination covered
- No need to add new columns for future cases
- Extensible for new labor law requirements

### 2. **Performance Optimized**

- Simple columns for fast aggregation queries
- JSON for detailed payroll calculations only when needed
- PostgreSQL JSONB excellent performance

### 3. **Payroll System Ready**

- Clear breakdown for different pay rates
- Edge case flags for special processing
- Audit trail for complex calculations

### 4. **Query Examples**

**Simple Queries (Fast Performance)**:

```sql
-- Monthly overtime summary
SELECT employee_id, SUM(overtime_hours)
FROM attendance WHERE date >= '2025-09-01';

-- Holiday work summary
SELECT employee_id, SUM(regular_holiday_hours_worked)
FROM attendance WHERE is_regular_holiday = true;
```

**Edge Case Detection**:

```sql
-- Find ultimate edge cases (day off + holiday + ND + OT)
SELECT employee_id, date, payroll_breakdown
FROM attendance
WHERE payroll_breakdown->'edge_case_flags'->>'is_day_off_and_regular_holiday' = 'true'
  AND payroll_breakdown->'edge_case_flags'->>'has_night_differential' = 'true'
  AND payroll_breakdown->'edge_case_flags'->>'has_overtime' = 'true';
```

**Complex Payroll Calculations**:

```sql
-- Calculate pay for ultimate edge case
SELECT
  employee_id,
  date,
  -- Regular holiday base pay (2.0x)
  (payroll_breakdown->'premiums'->'holidays'->'regular_holiday'->>'regular')::numeric * 500 * 2.0 as holiday_base,

  -- Regular holiday overtime (2.60x)
  (payroll_breakdown->'premiums'->'holidays'->'regular_holiday'->>'overtime')::numeric * 500 * 2.60 as holiday_ot,

  -- Night differential premium (10%)
  (payroll_breakdown->'premiums'->'holidays'->'regular_holiday'->>'night_diff')::numeric * 500 * 0.10 as nd_premium

FROM attendance
WHERE payroll_breakdown->'edge_case_flags'->>'is_day_off_and_regular_holiday' = 'true';
```

This approach gives you:

- ✅ **Handles ALL 24+ edge cases**
- ✅ **No database bloat** (single JSON column)
- ✅ **Maximum flexibility** for any future scenario
- ✅ **Backward compatibility** with existing queries
- ✅ **Performance optimized** for both simple and complex cases
- ✅ **Payroll system ready** with clear breakdowns
- ✅ **Audit compliant** with detailed calculation tracking
