# Payroll Rounding Test Examples

## How the New Payroll Rounding Works

The system now applies payroll-friendly rounding to ensure consistent payroll calculations:

### Rounding Rules

- **0-15 minutes**: Round down to nearest hour
- **16-45 minutes**: Round to 30 minutes (0.5 hours)
- **46-59 minutes**: Round up to next hour

### Test Examples

| Actual Hours | Minutes | Raw Time | Rounded Time | Explanation                    |
| ------------ | ------- | -------- | ------------ | ------------------------------ |
| 8.05         | 3 min   | 8h 3m    | **8.00**     | 3 min ≤ 15 min → Round down    |
| 8.25         | 15 min  | 8h 15m   | **8.00**     | 15 min ≤ 15 min → Round down   |
| 8.27         | 16 min  | 8h 16m   | **8.50**     | 16 min > 15 min → Round to 0.5 |
| 8.42         | 25 min  | 8h 25m   | **8.50**     | 25 min ≤ 45 min → Round to 0.5 |
| 8.75         | 45 min  | 8h 45m   | **8.50**     | 45 min ≤ 45 min → Round to 0.5 |
| 8.77         | 46 min  | 8h 46m   | **9.00**     | 46 min > 45 min → Round up     |
| 8.98         | 59 min  | 8h 59m   | **9.00**     | 59 min > 45 min → Round up     |

### Real Scenario Examples

#### 8am to 5pm with 2-hour break:

- Raw calculation: 9 - 2 = 7.00 hours
- Already at whole hour → **7.00 hours** (no change)

#### Your Previous Test (2 minutes):

- Raw calculation: 0.033 hours (2 minutes)
- 2 minutes ≤ 15 minutes → **0.00 hours** (rounded down)

#### Common Scenarios:

- **8:00am - 5:17pm** (9h 17m) with 2h break = 7.28h → **7.50 hours**
- **8:00am - 5:47pm** (9h 47m) with 2h break = 7.78h → **8.00 hours**
- **8:00am - 4:33pm** (8h 33m) with 1h break = 7.55h → **8.00 hours**

## Benefits

1. **Consistent Payroll**: No more 8.42 or 7.73 hour values
2. **Fair Rounding**: Industry-standard 15/30/45 minute increments
3. **Simplified Calculations**: Easier for payroll processing
4. **Employee-Friendly**: Reasonable rounding that doesn't penalize small overtime

## Testing

To test this, clock in and out at various times and verify the `total_hours` field uses these rounded values.
