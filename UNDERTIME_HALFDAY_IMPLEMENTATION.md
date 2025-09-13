# Undertime and Half-Day Flag Implementation

## Overview

Added `is_undertime` and `is_halfday` boolean flags to the attendance system that automatically calculate based on employee's scheduled work hours.

## Logic Implementation

### Calculation Rules

- **Scheduled Work Hours** = `(end_time - start_time) - break_duration_hours`
- **is_halfday** = `total_hours < (scheduled_work_hours / 2)`
- **is_undertime** = `total_hours < (scheduled_work_hours - 1)`

### Mathematical Relationship

- If `is_halfday = true`, then `is_undertime = true` (automatically due to math)
- Both flags are calculated independently for clarity and database flexibility

## Examples with 8-Hour Schedule (8am-5pm, 1h break)

| Hours Worked | is_halfday | is_undertime | Status               |
| ------------ | ---------- | ------------ | -------------------- |
| 2.0 hours    | true       | true         | Half-day + Undertime |
| 3.5 hours    | true       | true         | Half-day + Undertime |
| 5.0 hours    | false      | true         | Undertime only       |
| 6.5 hours    | false      | true         | Undertime only       |
| 7.5 hours    | false      | false        | Regular              |
| 8.0 hours    | false      | false        | Full day             |

## Implementation Details

### Database Updates

Both `attendanceController.js` and `rfidController.js` now update:

```sql
UPDATE attendance
SET time_out = ?, total_hours = ?, is_undertime = ?, is_halfday = ?, updated_at = ?
WHERE employee_id = ? AND date = ?
```

### Response Messages

Clock-out responses now include status indicators:

- `"Clocked out successfully - John Doe"`
- `"Clocked out successfully - John Doe (Undertime)"`
- `"Clocked out successfully - John Doe (Half-day)"`
- `"Clocked out successfully - John Doe (Undertime) (Half-day)"` (for very short periods)

### API Response Data

```json
{
  "success": true,
  "message": "Clocked out successfully - John Doe (Undertime)",
  "data": {
    "attendance_id": 123,
    "employee_id": "2025-00001",
    "total_hours": "5.50",
    "is_undertime": true,
    "is_halfday": false,
    "hours_worked": 5.5,
    "employee_name": "John Doe",
    "method": "Manual"
  }
}
```

## Benefits

### HR Reporting

- Easy filtering: `WHERE is_halfday = true`
- Undertime analysis: `WHERE is_undertime = true AND is_halfday = false`
- Full attendance: `WHERE is_undertime = false`

### Payroll Integration

- Automatic deduction calculations
- Clear categorization for different pay rates
- Compliance with labor law requirements

### Audit Trail

- Clear record of attendance patterns
- Automatic flagging of irregular hours
- No manual calculation required

## Database Schema Requirements

Ensure the `attendance` table has these columns:

```sql
ALTER TABLE attendance
ADD COLUMN is_undertime BOOLEAN DEFAULT false,
ADD COLUMN is_halfday BOOLEAN DEFAULT false;
```

## Testing Scenarios

1. **2-minute test**: Should show `is_halfday: true, is_undertime: true`
2. **4-hour work**: Should show `is_halfday: false, is_undertime: true`
3. **8-hour work**: Should show `is_halfday: false, is_undertime: false`
4. **Different schedules**: Test with various start/end times and break durations
