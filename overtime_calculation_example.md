# Enhanced Overtime Calculation Examples

## How the New Overtime System Works

The enhanced overtime calculation now properly handles overlapping scenarios where Night Differential (ND) hours and Rest Day hours can also be overtime hours.

### Overtime Categories:

1. **Regular Overtime**: Regular working hours beyond scheduled hours
2. **Night Differential Overtime**: ND hours (10PM-6AM) that exceed scheduled hours
3. **Rest Day Overtime**: Rest day hours that exceed normal working hours

### Example Scenarios:

#### Scenario 1: Night Shift with Overtime

- **Schedule**: 6:00 PM - 6:00 AM (12 hours with 1-hour break = 11 scheduled hours)
- **Actual Work**: 6:00 PM - 8:00 AM (14 hours with break = 13 total hours)
- **Result**:
  - Total Hours: 13 hours
  - Night Differential: 8 hours (10PM-6AM)
  - Overtime: 2 hours (13 - 11 scheduled)
  - Regular Overtime: 0 hours (regular hours didn't exceed schedule)
  - Night Diff Overtime: 2 hours (the extra 2 hours were during ND period)

#### Scenario 2: Regular Day with Extended Night Work

- **Schedule**: 8:00 AM - 5:00 PM (9 hours with 1-hour break = 8 scheduled hours)
- **Actual Work**: 8:00 AM - 11:00 PM (15 hours with break = 14 total hours)
- **Result**:
  - Total Hours: 14 hours
  - Night Differential: 1 hour (10PM-11PM)
  - Overtime: 6 hours (14 - 8 scheduled)
  - Regular Overtime: 5 hours (9AM-10PM regular work beyond schedule)
  - Night Diff Overtime: 1 hour (10PM-11PM was both ND and overtime)

#### Scenario 3: Rest Day Work with Night Differential

- **Schedule**: Rest Day (0 scheduled hours)
- **Actual Work**: 6:00 PM - 2:00 AM (8 hours with break = 7 total hours)
- **Result**:
  - Total Hours: 7 hours
  - Rest Day Hours: 7 hours (all hours on rest day)
  - Night Differential: 4 hours (10PM-2AM)
  - Overtime: 7 hours (all rest day work is considered overtime)
  - Rest Day Overtime: 3 hours (7 total - 4 ND)
  - Night Diff Overtime: 4 hours (ND hours on rest day)

### Key Benefits:

1. **Accurate Payroll**: Properly categorizes hours for different pay rates
2. **Compliance**: Meets labor law requirements for overtime classification
3. **Transparency**: Clear breakdown of how overtime is calculated
4. **Flexibility**: Handles complex scenarios like overnight shifts and rest day work

### Database Storage:

- `overtime_hours`: Total overtime hours (sum of all overtime types)
- `night_differential_hours`: Total ND hours (includes both regular and overtime ND)
- `rest_day_hours_worked`: Total rest day hours (includes both regular and overtime)

### API Response Breakdown:

The payroll summary now includes:

```json
{
  "overtime_breakdown": {
    "regular_overtime": 5.0,
    "night_diff_overtime": 1.0,
    "rest_day_overtime": 0.0
  }
}
```

This allows payroll systems to apply the correct multipliers:

- Regular Overtime: 1.25x base rate
- Night Diff Overtime: 1.25x + 10% ND premium
- Rest Day Overtime: 1.30x + potential ND premium
