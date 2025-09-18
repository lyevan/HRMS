# Payroll Rounding System

## How Real Payroll Rounding Works

Instead of decimals like `2.18` hours, real payroll systems use **simplified rounding**:

### Rounding Rules:

- **1-15 minutes**: Round down to hour (e.g., 2.25 hours → 2.0 hours)
- **16-45 minutes**: Round to half hour (e.g., 2.35 hours → 2.5 hours)
- **46-60 minutes**: Round up to next hour (e.g., 2.95 hours → 3.0 hours)

### Valid Payroll Hours:

- `2.0` hours (2 hours, 0 minutes)
- `2.5` hours (2 hours, 30 minutes)
- `3.0` hours (3 hours, 0 minutes)
- `5.5` hours (5 hours, 30 minutes)
- `8.0` hours (8 hours, 0 minutes)

### Before vs After:

**Before (Incorrect):**

```json
{
  "regular_hours": 2.18,
  "night_diff_overtime": 2.18,
  "regular_overtime": 0.82
}
```

**After (Correct Payroll Rounding):**

```json
{
  "regular_hours": 2.0,
  "night_diff_overtime": 2.0,
  "regular_overtime": 1.0
}
```

### Benefits:

1. **Simple Rules**: Easy to understand and apply
2. **Time Clock Friendly**: Works with basic time tracking systems
3. **Easy Calculation**: HR can easily verify calculations
4. **Reduces Complexity**: Only whole hours and half hours
5. **System Integration**: Works with existing payroll software

### Conversion Examples:

- `2.18` hours = 2 hours 11 minutes → **2.0 hours** (1-15 mins = round down)
- `5.82` hours = 5 hours 49 minutes → **6.0 hours** (46-60 mins = round up)
- `0.82` hours = 49 minutes → **1.0 hours** (46-60 mins = round up)
- `3.33` hours = 3 hours 20 minutes → **3.5 hours** (16-45 mins = 0.5)
- `4.25` hours = 4 hours 15 minutes → **4.0 hours** (1-15 mins = round down)
- `6.75` hours = 6 hours 45 minutes → **6.5 hours** (16-45 mins = 0.5)

This makes payroll processing much more practical and human-readable! 🎯
