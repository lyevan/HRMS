# 💰 Payroll Management API Documentation

Base URL: `/api/payroll`

## 📖 Overview

The Payroll Management API handles employee payroll calculations, generation, management, and reporting. Supports multiple rate types (hourly, daily, monthly), contract integration, overtime calculations, and leave pay processing.

---

## 🔍 GET Endpoints

### Get All Payroll Records

```http
GET /api/payroll/records?employee_id=EMP001&start_date=2025-09-01&end_date=2025-09-30&status=paid
```

**Query Parameters (All Optional):**

- `employee_id` (string): Filter by employee ID
- `start_date` (string): Filter from date (YYYY-MM-DD)
- `end_date` (string): Filter to date (YYYY-MM-DD)
- `status` (string): Filter by status (generated, processed, paid)
- `limit` (number): Limit results (default: 50)
- `offset` (number): Offset for pagination (default: 0)

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "payroll_id": 1,
      "employee_id": "EMP001",
      "first_name": "Juan",
      "last_name": "Dela Cruz",
      "department_name": "Engineering",
      "position_title": "Software Developer",
      "pay_period_start": "2025-09-01",
      "pay_period_end": "2025-09-30",
      "regular_hours": 168.0,
      "overtime_hours": 12.0,
      "holiday_hours": 8.0,
      "night_differential_hours": 20.0,
      "leave_hours": 8.0,
      "gross_pay": 85000.0,
      "tax_deductions": 8500.0,
      "sss_deduction": 1800.0,
      "philhealth_deduction": 850.0,
      "pagibig_deduction": 200.0,
      "other_deductions": 500.0,
      "total_deductions": 11850.0,
      "net_pay": 73150.0,
      "status": "paid",
      "generated_date": "2025-10-01T08:00:00",
      "processed_date": "2025-10-05T10:00:00",
      "paid_date": "2025-10-10T14:00:00"
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 50,
    "offset": 0,
    "has_more": true
  }
}
```

### Get Employee Payroll History

```http
GET /api/payroll/employee/:employee_id/history
```

**Parameters:**

- `employee_id` (string): Employee ID

**Query Parameters (Optional):**

- `year` (number): Filter by year
- `limit` (number): Limit results

**Response:**

```json
{
  "success": true,
  "data": {
    "employee": {
      "employee_id": "EMP001",
      "first_name": "Juan",
      "last_name": "Dela Cruz",
      "department_name": "Engineering",
      "position_title": "Software Developer"
    },
    "payroll_summary": {
      "total_records": 12,
      "total_gross_pay": 1020000.0,
      "total_net_pay": 877800.0,
      "total_deductions": 142200.0,
      "average_monthly_gross": 85000.0,
      "average_monthly_net": 73150.0
    },
    "records": [
      {
        "payroll_id": 12,
        "pay_period_start": "2025-09-01",
        "pay_period_end": "2025-09-30",
        "gross_pay": 85000.0,
        "net_pay": 73150.0,
        "status": "paid",
        "paid_date": "2025-10-10T14:00:00"
      }
    ]
  }
}
```

### Get Payroll Summary

```http
GET /api/payroll/summary?period=2025-09&department_id=1
```

**Query Parameters (Optional):**

- `period` (string): Period in YYYY-MM format
- `department_id` (number): Filter by department
- `position_id` (number): Filter by position

**Response:**

```json
{
  "success": true,
  "data": {
    "period": "2025-09",
    "summary": {
      "total_employees": 25,
      "total_gross_pay": 2125000.0,
      "total_net_pay": 1831250.0,
      "total_deductions": 293750.0,
      "average_gross_pay": 85000.0,
      "average_net_pay": 73250.0
    },
    "breakdown": {
      "regular_pay": 1800000.0,
      "overtime_pay": 225000.0,
      "holiday_pay": 75000.0,
      "night_differential": 25000.0,
      "leave_pay": 0.0
    },
    "deduction_breakdown": {
      "tax_deductions": 212500.0,
      "sss_deductions": 45000.0,
      "philhealth_deductions": 21250.0,
      "pagibig_deductions": 5000.0,
      "other_deductions": 10000.0
    },
    "by_department": [
      {
        "department_name": "Engineering",
        "employee_count": 10,
        "total_gross": 850000.0,
        "total_net": 732500.0
      }
    ]
  }
}
```

### Get Payroll Report

```http
GET /api/payroll/report?type=detailed&format=json&employee_id=EMP001&start_date=2025-01-01&end_date=2025-12-31
```

**Query Parameters:**

- `type` (string): Report type (summary, detailed, deductions)
- `format` (string): Response format (json, csv) - Default: json
- `employee_id` (string, optional): Specific employee
- `department_id` (number, optional): Specific department
- `start_date` (string): Start date (YYYY-MM-DD)
- `end_date` (string): End date (YYYY-MM-DD)

**Response (JSON Format):**

```json
{
  "success": true,
  "data": {
    "report_type": "detailed",
    "period": "2025-01-01 to 2025-12-31",
    "generated_at": "2025-10-15T10:00:00",
    "total_records": 120,
    "records": [
      {
        "employee_id": "EMP001",
        "employee_name": "Juan Dela Cruz",
        "department": "Engineering",
        "position": "Software Developer",
        "pay_periods": [
          {
            "period": "2025-09-01 to 2025-09-30",
            "gross_pay": 85000.0,
            "net_pay": 73150.0,
            "hours_breakdown": {
              "regular": 168.0,
              "overtime": 12.0,
              "holiday": 8.0,
              "night_differential": 20.0,
              "leave": 8.0
            },
            "deductions": {
              "tax": 8500.0,
              "sss": 1800.0,
              "philhealth": 850.0,
              "pagibig": 200.0,
              "other": 500.0
            }
          }
        ]
      }
    ]
  }
}
```

---

## ✏️ POST Endpoints

### Calculate Employee Payroll

```http
POST /api/payroll/calculate
```

**Description:** Calculates payroll for a specific employee and period without saving to database.

**Request Body:**

```json
{
  "employee_id": "EMP001",
  "pay_period_start": "2025-09-01",
  "pay_period_end": "2025-09-30",
  "include_overtime": true,
  "include_leave_pay": true
}
```

**Response:**

```json
{
  "success": true,
  "message": "Payroll calculated successfully",
  "data": {
    "employee": {
      "employee_id": "EMP001",
      "name": "Juan Dela Cruz",
      "department": "Engineering",
      "position": "Software Developer",
      "contract": {
        "rate_type": "monthly",
        "base_rate": 75000.0,
        "overtime_rate": 1.25,
        "holiday_rate": 2.0,
        "night_differential_rate": 1.1
      }
    },
    "period": {
      "start_date": "2025-09-01",
      "end_date": "2025-09-30",
      "total_days": 30,
      "working_days": 22
    },
    "hours_summary": {
      "regular_hours": 168.0,
      "overtime_hours": 12.0,
      "holiday_hours": 8.0,
      "night_differential_hours": 20.0,
      "leave_hours": 8.0,
      "total_worked_hours": 188.0
    },
    "earnings": {
      "base_pay": 75000.0,
      "overtime_pay": 6818.18,
      "holiday_pay": 3409.09,
      "night_differential": 1704.55,
      "leave_pay": 0.0,
      "gross_pay": 86931.82
    },
    "deductions": {
      "tax_deduction": 8693.18,
      "sss_deduction": 1800.0,
      "philhealth_deduction": 869.32,
      "pagibig_deduction": 200.0,
      "other_deductions": 0.0,
      "total_deductions": 11562.5
    },
    "net_pay": 75369.32
  }
}
```

### Generate Payroll

```http
POST /api/payroll/generate
```

**Description:** Generates and saves payroll records for specified employees and period.

**Request Body:**

```json
{
  "employee_ids": ["EMP001", "EMP002", "EMP003"], // Optional: if not provided, generates for all active employees
  "pay_period_start": "2025-09-01",
  "pay_period_end": "2025-09-30",
  "include_overtime": true,
  "include_leave_pay": true,
  "generated_by": "HR001" // Optional: user who generated the payroll
}
```

**Response:**

```json
{
  "success": true,
  "message": "Payroll generated successfully for 3 employees",
  "data": {
    "batch_id": "PAYROLL_2025_09_001",
    "period": "2025-09-01 to 2025-09-30",
    "generated_at": "2025-10-01T08:00:00",
    "generated_by": "HR001",
    "summary": {
      "total_employees": 3,
      "successful_generations": 3,
      "failed_generations": 0,
      "total_gross_pay": 255000.0,
      "total_net_pay": 219450.0,
      "total_deductions": 35550.0
    },
    "employee_results": [
      {
        "employee_id": "EMP001",
        "name": "Juan Dela Cruz",
        "status": "success",
        "payroll_id": 101,
        "gross_pay": 85000.0,
        "net_pay": 73150.0
      },
      {
        "employee_id": "EMP002",
        "name": "Maria Santos",
        "status": "success",
        "payroll_id": 102,
        "gross_pay": 85000.0,
        "net_pay": 73150.0
      },
      {
        "employee_id": "EMP003",
        "name": "Jose Garcia",
        "status": "success",
        "payroll_id": 103,
        "gross_pay": 85000.0,
        "net_pay": 73150.0
      }
    ],
    "errors": []
  }
}
```

**Error Response:**

```json
{
  "success": false,
  "message": "Payroll generation completed with errors",
  "data": {
    "summary": {
      "total_employees": 3,
      "successful_generations": 2,
      "failed_generations": 1
    },
    "errors": [
      {
        "employee_id": "EMP003",
        "name": "Jose Garcia",
        "error": "No active contract found for employee"
      }
    ]
  }
}
```

---

## 🔄 PUT Endpoints

### Update Payroll Status

```http
PUT /api/payroll/:payroll_id/status
```

**Parameters:**

- `payroll_id` (number): Payroll record ID

**Request Body:**

```json
{
  "status": "processed", // Options: generated, processed, paid, cancelled
  "updated_by": "HR001", // Optional
  "comments": "Payroll processed and ready for payment" // Optional
}
```

**Response:**

```json
{
  "success": true,
  "message": "Payroll status updated successfully",
  "data": {
    "payroll_id": 101,
    "employee_name": "Juan Dela Cruz",
    "previous_status": "generated",
    "new_status": "processed",
    "updated_by": "HR001",
    "updated_at": "2025-10-05T10:00:00",
    "comments": "Payroll processed and ready for payment"
  }
}
```

### Batch Update Payroll Status

```http
PUT /api/payroll/batch/status
```

**Request Body:**

```json
{
  "payroll_ids": [101, 102, 103, 104],
  "status": "paid",
  "updated_by": "HR001",
  "payment_date": "2025-10-10", // Required when status is 'paid'
  "payment_method": "bank_transfer", // Optional
  "comments": "Monthly payroll payment batch processed"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Batch status update completed",
  "data": {
    "updated_count": 4,
    "failed_count": 0,
    "batch_id": "BATCH_UPDATE_001",
    "updated_at": "2025-10-10T14:00:00",
    "results": [
      {
        "payroll_id": 101,
        "employee_name": "Juan Dela Cruz",
        "status": "success",
        "new_status": "paid"
      },
      {
        "payroll_id": 102,
        "employee_name": "Maria Santos",
        "status": "success",
        "new_status": "paid"
      }
    ]
  }
}
```

### Recalculate Payroll

```http
PUT /api/payroll/:payroll_id/recalculate
```

**Parameters:**

- `payroll_id` (number): Payroll record ID

**Request Body:**

```json
{
  "recalculated_by": "HR001",
  "reason": "Updated overtime hours and deductions",
  "force_recalculate": false // Set to true to recalculate even if status is 'paid'
}
```

**Response:**

```json
{
  "success": true,
  "message": "Payroll recalculated successfully",
  "data": {
    "payroll_id": 101,
    "employee_name": "Juan Dela Cruz",
    "previous_calculation": {
      "gross_pay": 85000.0,
      "net_pay": 73150.0,
      "total_deductions": 11850.0
    },
    "new_calculation": {
      "gross_pay": 87500.0,
      "net_pay": 75250.0,
      "total_deductions": 12250.0
    },
    "changes": {
      "gross_pay_diff": 2500.0,
      "net_pay_diff": 2100.0,
      "deductions_diff": 400.0
    },
    "recalculated_at": "2025-10-05T15:00:00",
    "recalculated_by": "HR001"
  }
}
```

---

## ❌ DELETE Endpoints

### Delete Payroll Record

```http
DELETE /api/payroll/:payroll_id
```

**Parameters:**

- `payroll_id` (number): Payroll record ID

**Request Body:**

```json
{
  "deleted_by": "HR001",
  "reason": "Duplicate payroll entry created by mistake"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Payroll record deleted successfully",
  "data": {
    "payroll_id": 101,
    "employee_name": "Juan Dela Cruz",
    "pay_period": "2025-09-01 to 2025-09-30",
    "deleted_at": "2025-10-05T16:00:00",
    "deleted_by": "HR001"
  }
}
```

**Note:** Can only delete payroll records with status 'generated'. Processed or paid records cannot be deleted for audit purposes.

---

## 📊 Payroll Status Flow

```
generated → processed → paid
    ↓           ↓        ↓
cancelled   cancelled  (cannot cancel)
```

**Status Descriptions:**

- `generated`: Payroll calculated and saved, pending review
- `processed`: Payroll reviewed and approved, ready for payment
- `paid`: Payment has been made to employee
- `cancelled`: Payroll cancelled (only from generated/processed status)

---

## 💵 Rate Types & Calculations

### Monthly Rate

```
Base Pay = Monthly Rate
Hourly Rate = Monthly Rate ÷ (Working Days × 8 hours)
Overtime Rate = Hourly Rate × Overtime Multiplier
```

### Daily Rate

```
Base Pay = Daily Rate × Working Days
Hourly Rate = Daily Rate ÷ 8 hours
Overtime Rate = Hourly Rate × Overtime Multiplier
```

### Hourly Rate

```
Base Pay = Hourly Rate × Regular Hours
Overtime Pay = Hourly Rate × Overtime Multiplier × Overtime Hours
```

### Special Pay Calculations

- **Holiday Pay**: `Base Hourly Rate × Holiday Multiplier × Holiday Hours`
- **Night Differential**: `Base Hourly Rate × Night Differential Rate × Night Hours`
- **Leave Pay**: `Base Hourly Rate × Leave Hours` (for paid leave types)

---

## 🏷️ Deduction Types

### Mandatory Deductions

- **Income Tax**: Based on BIR tax table
- **SSS**: Social Security System contribution
- **PhilHealth**: Healthcare contribution
- **Pag-IBIG**: Housing fund contribution

### Optional Deductions

- **Loans**: Employee loan repayments
- **Insurance**: Life/health insurance premiums
- **Uniform**: Uniform/equipment deductions
- **Other**: Miscellaneous deductions

---

## 🔐 Authentication & Permissions

| Endpoint                    | Permission Required       |
| --------------------------- | ------------------------- |
| `GET /records`              | HR/Payroll Admin          |
| `GET /employee/:id/history` | Self or HR/Payroll Admin  |
| `GET /summary`              | HR/Payroll Admin          |
| `GET /report`               | HR/Payroll Admin          |
| `POST /calculate`           | HR/Payroll Admin          |
| `POST /generate`            | HR/Payroll Admin          |
| `PUT /:id/status`           | HR/Payroll Admin          |
| `PUT /batch/status`         | HR/Payroll Admin          |
| `PUT /:id/recalculate`      | HR/Payroll Admin          |
| `DELETE /:id`               | HR/Payroll Admin (Senior) |

---

## ⚠️ Important Business Rules

1. **Contract Requirement**: Employee must have an active contract to generate payroll
2. **Period Validation**: Pay periods cannot overlap for the same employee
3. **Status Progression**: Can only move forward in status (except cancellation)
4. **Audit Trail**: All payroll changes are logged for compliance
5. **Recalculation Limits**: Paid payroll can only be recalculated with special permission
6. **Attendance Integration**: Payroll calculations use actual attendance data
7. **Leave Integration**: Approved leaves are included in payroll calculations
8. **Rate Validation**: All rates and multipliers must be positive numbers
9. **Deduction Limits**: Total deductions cannot exceed 100% of gross pay
10. **Backup Requirement**: Original calculations are preserved when recalculating

---

## 📅 Date Formats

All dates should be in `YYYY-MM-DD` format (ISO 8601).

**Period Formats:**

- Pay Period: `"2025-09-01"` to `"2025-09-30"`
- Monthly Period: `"2025-09"`
- Yearly Period: `"2025"`

---

## 🔢 Currency & Number Formats

- All monetary amounts are in Philippine Peso (₱)
- Numbers use decimal format: `85000.00`
- Hours use decimal format: `168.5`
- Percentages as decimals: `0.1` for 10%

---

## 📈 Performance Notes

- Use pagination for large datasets (`limit` and `offset` parameters)
- Employee payroll history is cached for performance
- Bulk operations are preferred for multiple employee processing
- Reports can be generated in CSV format for large datasets
