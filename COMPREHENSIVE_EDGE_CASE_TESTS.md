# COMPREHENSIVE EDGE CASE TEST SCENARIOS

## All 24+ Edge Cases with Expected Payroll Results

### Base Rate: ₱500/hour, Schedule: 8AM-5PM (8 hours + 1hr break)

---

## 1. **Regular Day (Normal Work)**

- **Hours**: 8AM-5PM (8 hours)
- **Result**: 8 regular hours
- **Pay**: 8 × ₱500 = ₱4,000

## 2. **Regular Day + Overtime**

- **Hours**: 8AM-7PM (10 hours)
- **Result**: 8 regular + 2 overtime
- **Pay**: (8 × ₱500) + (2 × ₱500 × 1.25) = ₱5,250

## 3. **Regular Day + Night Differential**

- **Hours**: 8AM-11PM (14 hours)
- **Result**: 13 regular + 1 ND
- **Pay**: (13 × ₱500) + (1 × ₱500 × 1.10) = ₱7,050

## 4. **Regular Day + ND + Overtime**

- **Hours**: 8AM-1AM (16 hours)
- **Result**: 8 regular + 5 regular OT + 3 ND OT
- **Pay**: (8 × ₱500) + (5 × ₱500 × 1.25) + (3 × ₱500 × 1.375) = ₱8,187.50

---

## 5. **Day Off (Rest Day)**

- **Hours**: 8AM-5PM (8 hours)
- **Result**: 8 rest day hours
- **Pay**: 8 × ₱500 × 1.30 = ₱5,200

## 6. **Day Off + Night Differential**

- **Hours**: 8AM-11PM (14 hours)
- **Result**: 13 rest day + 1 rest day ND
- **Pay**: (13 × ₱500 × 1.30) + (1 × ₱500 × 1.43) = ₱9,165

## 7. **Day Off + Overtime**

- **Hours**: 8AM-7PM (10 hours)
- **Result**: 8 rest day + 2 rest day OT
- **Pay**: (8 × ₱500 × 1.30) + (2 × ₱500 × 1.69) = ₱6,890

## 8. **Day Off + ND + Overtime**

- **Hours**: 8AM-1AM (16 hours)
- **Result**: 8 rest day + 5 rest day OT + 3 rest day ND OT
- **Pay**: (8 × ₱500 × 1.30) + (5 × ₱500 × 1.69) + (3 × ₱500 × 1.859) = ₱12,388.50

---

## 9. **Regular Holiday**

- **Hours**: 8AM-5PM (8 hours)
- **Result**: 8 regular holiday hours
- **Pay**: 8 × ₱500 × 2.0 = ₱8,000

## 10. **Regular Holiday + Night Differential**

- **Hours**: 8AM-11PM (14 hours)
- **Result**: 13 regular holiday + 1 regular holiday ND
- **Pay**: (13 × ₱500 × 2.0) + (1 × ₱500 × 2.20) = ₱14,100

## 11. **Regular Holiday + Overtime**

- **Hours**: 8AM-7PM (10 hours)
- **Result**: 8 regular holiday + 2 regular holiday OT
- **Pay**: (8 × ₱500 × 2.0) + (2 × ₱500 × 2.60) = ₱10,600

## 12. **Regular Holiday + ND + Overtime**

- **Hours**: 8AM-1AM (16 hours)
- **Result**: 8 regular holiday + 5 regular holiday OT + 3 regular holiday ND OT
- **Pay**: (8 × ₱500 × 2.0) + (5 × ₱500 × 2.60) + (3 × ₱500 × 2.86) = ₱18,790

---

## 13. **Special Holiday**

- **Hours**: 8AM-5PM (8 hours)
- **Result**: 8 special holiday hours
- **Pay**: 8 × ₱500 × 1.30 = ₱5,200

## 14. **Special Holiday + Night Differential**

- **Hours**: 8AM-11PM (14 hours)
- **Result**: 13 special holiday + 1 special holiday ND
- **Pay**: (13 × ₱500 × 1.30) + (1 × ₱500 × 1.43) = ₱9,165

## 15. **Special Holiday + Overtime**

- **Hours**: 8AM-7PM (10 hours)
- **Result**: 8 special holiday + 2 special holiday OT
- **Pay**: (8 × ₱500 × 1.30) + (2 × ₱500 × 1.69) = ₱6,890

## 16. **Special Holiday + ND + Overtime**

- **Hours**: 8AM-1AM (16 hours)
- **Result**: 8 special holiday + 5 special holiday OT + 3 special holiday ND OT
- **Pay**: (8 × ₱500 × 1.30) + (5 × ₱500 × 1.69) + (3 × ₱500 × 1.859) = ₱12,388.50

---

## 17. **ULTIMATE EDGE CASE: Day Off + Regular Holiday**

- **Hours**: 8AM-5PM (8 hours)
- **Result**: 8 rest day + regular holiday hours
- **Pay**: 8 × ₱500 × 2.60 = ₱10,400

## 18. **Day Off + Regular Holiday + Night Differential**

- **Hours**: 8AM-11PM (14 hours)
- **Result**: 13 rest day + regular holiday + 1 rest day + regular holiday ND
- **Pay**: (13 × ₱500 × 2.60) + (1 × ₱500 × 2.86) = ₱18,330

## 19. **Day Off + Regular Holiday + Overtime**

- **Hours**: 8AM-7PM (10 hours)
- **Result**: 8 rest day + regular holiday + 2 rest day + regular holiday OT
- **Pay**: (8 × ₱500 × 2.60) + (2 × ₱500 × 3.38) = ₱13,780

## 20. **ABSOLUTE ULTIMATE: Day Off + Regular Holiday + ND + OT**

- **Hours**: 6PM-6AM (12 hours) on rest day + regular holiday
- **Result**: 4 rest day + regular holiday + 8 rest day + regular holiday ND + 4 rest day + regular holiday OT + 4 rest day + regular holiday ND OT
- **Breakdown**:
  - Base (8 hours): 8 × ₱500 × 2.60 = ₱10,400
  - Overtime (4 hours): 4 × ₱500 × 3.38 = ₱6,760
  - Night Differential (8 hours): 8 × ₱500 × 0.26 = ₱1,040
  - **TOTAL**: ₱18,200 for 12 hours!

---

## 21-24. **Day Off + Special Holiday Combinations**

Similar to regular holiday but with 1.30x base rate instead of 2.0x

---

## JSON Output Example for Ultimate Case:

```json
{
  "regular_hours": 0.0,

  "overtime": {
    "total": 4.0,
    "regular_overtime": 0.0,
    "night_diff_overtime": 4.0,
    "rest_day_overtime": 4.0,
    "regular_holiday_overtime": 4.0,
    "special_holiday_overtime": 0.0
  },

  "premiums": {
    "night_differential": {
      "total": 8.0,
      "regular": 4.0,
      "overtime": 4.0
    },

    "rest_day": {
      "total": 12.0,
      "regular": 8.0,
      "overtime": 4.0
    },

    "holidays": {
      "regular_holiday": {
        "total": 12.0,
        "regular": 8.0,
        "overtime": 4.0,
        "night_diff": 8.0,
        "rest_day": 12.0
      }
    }
  },

  "edge_case_flags": {
    "is_day_off": true,
    "is_regular_holiday": true,
    "is_day_off_and_regular_holiday": true,
    "has_night_differential": true,
    "has_overtime": true,
    "has_multiple_premiums": true
  }
}
```

## Payroll Rate Reference:

- **Regular**: 1.0x
- **Overtime**: 1.25x
- **Night Diff**: +10%
- **Rest Day**: 1.30x
- **Rest Day OT**: 1.69x (30% + 30% of 30%)
- **Regular Holiday**: 2.0x
- **Regular Holiday OT**: 2.60x
- **Special Holiday**: 1.30x
- **Special Holiday OT**: 1.69x
- **Rest Day + Regular Holiday**: 2.60x
- **Rest Day + Regular Holiday OT**: 3.38x
- **Ultimate Multiplier**: 3.718x (Rest Day + Regular Holiday + ND + OT)
