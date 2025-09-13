# 📋 Attendance API Documentation

Base URL: `/api/attendance`

## 📖 Overview

The Attendance API manages employee clock-in/clock-out operations and attendance record retrieval with integration to employee schedules for automatic break calculation and working days validation.

---

## 🔍 GET Endpoints

### Get All Attendance Records

```http
GET /api/attendance/
```

**Description:** Retrieves all attendance records with employee details and calculated hours.

**Headers:**

```json
{
  "Authorization": "Bearer <token>",
  "Content-Type": "application/json"
}
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "attendance_id": 1,
      "employee_id": "EMP001",
      "date": "2025-09-13",
      "time_in": "2025-09-13T08:00:00",
      "time_out": "2025-09-13T17:00:00",
      "total_hours": 8.0,
      "overtime_hours": 0.0,
      "is_present": true,
      "is_late": false,
      "is_absent": false,
      "on_leave": false,
      "first_name": "Juan",
      "last_name": "Dela Cruz"
    }
  ]
}
```

### Get Today's Attendance for Employee

```http
GET /api/attendance/today/:employee_id
```

**Parameters:**

- `employee_id` (string): Employee ID

**Response:**

```json
{
  "success": true,
  "data": {
    "attendance_id": 1,
    "employee_id": "EMP001",
    "date": "2025-09-13",
    "time_in": "2025-09-13T08:00:00",
    "time_out": null,
    "is_present": true,
    "is_late": false,
    "status": "clocked_in"
  }
}
```

### Get Employee Status

```http
GET /api/attendance/status/:employee_id
```

**Parameters:**

- `employee_id` (string): Employee ID

**Response:**

```json
{
  "success": true,
  "data": {
    "employee_id": "EMP001",
    "status": "clocked_in", // "not_clocked_in", "clocked_in", "clocked_out", "on_break"
    "current_time": "2025-09-13T14:30:00",
    "time_in": "2025-09-13T08:00:00",
    "break_status": "not_on_break"
  }
}
```

### Check Break Eligibility ⚠️ DEPRECATED

```http
GET /api/attendance/can-break/:employee_id
```

**Parameters:**

- `employee_id` (string): Employee ID

**⚠️ DEPRECATED NOTICE:**
This endpoint references the old break system with manual break start/end tracking. Your current system uses **schedules with `break_duration`** instead.

**Current System:**

- Break time is automatically calculated based on employee's assigned schedule
- The `break_duration` field in schedules table defines break time in minutes
- No manual break start/end tracking is needed
- Break time is automatically deducted from total hours during clock-out

**Response (Legacy Format):**

```json
{
  "success": true,
  "data": {
    "can_take_break": false,
    "reason": "System now uses automatic break calculation",
    "current_status": "clocked_in"
  }
}
```

---

## ✏️ POST Endpoints

### Clock In

```http
POST /api/attendance/clock-in
```

**Request Body:**

```json
{
  "employee_id": "EMP001", // Optional if using RFID
  "rfid": "1234567890" // Optional if using employee_id
}
```

**Response (Success):**

```json
{
  "success": true,
  "message": "Clocked in successfully - Juan Dela Cruz",
  "data": {
    "attendance_id": 1,
    "employee_id": "EMP001",
    "date": "2025-09-13",
    "time_in": "2025-09-13T08:00:00",
    "is_present": true,
    "is_late": false,
    "is_absent": false,
    "employee_name": "Juan Dela Cruz",
    "schedule_name": "Regular Shift",
    "scheduled_start_time": "08:00:00",
    "method": "Manual" // or "RFID"
  }
}
```

**Response (Late):**

```json
{
  "success": true,
  "message": "Clocked in successfully - Juan Dela Cruz (Late)",
  "data": {
    // Same as above but is_late: true
  }
}
```

**Error Responses:**

```json
// No schedule assigned
{
  "success": false,
  "message": "You do not have an assigned schedule",
  "info": "Please contact HR for schedule assignment."
}

// Not a working day
{
  "success": false,
  "message": "Today is not a working day according to your schedule",
  "info": "Working days: monday, tuesday, wednesday, thursday, friday"
}

// Already clocked in
{
  "success": false,
  "message": "Employee already clocked in today"
}
```

### Clock Out

```http
POST /api/attendance/clock-out
```

**Request Body:**

```json
{
  "employee_id": "EMP001", // Optional if using RFID
  "rfid": "1234567890", // Optional if using employee_id
  "notes": "Completed all tasks for today" // Optional
}
```

**Response:**

```json
{
  "success": true,
  "message": "Clocked out successfully - Juan Dela Cruz",
  "data": {
    "attendance_id": 1,
    "employee_id": "EMP001",
    "date": "2025-09-13",
    "time_in": "2025-09-13T08:00:00",
    "time_out": "2025-09-13T17:00:00",
    "total_hours": 8.0,
    "overtime_hours": null, // Not auto-calculated, requires approval
    "notes": "Completed all tasks for today",
    "employee_name": "Juan Dela Cruz",
    "hours_worked": 8.0,
    "break_duration_hours": 1.0, // Calculated from schedule.break_duration
    "method": "Manual"
  }
}
```

**Error Responses:**

```json
// No clock-in record
{
  "success": false,
  "message": "No clock-in record found for today"
}

// Already clocked out
{
  "success": false,
  "message": "Employee already clocked out today"
}
```

### Manual Update (Admin Only)

```http
POST /api/attendance/manual-update/:employee_id
```

**Parameters:**

- `employee_id` (string): Employee ID

**Request Body:**

```json
{
  "date": "2025-09-13",
  "time_in": "08:00:00", // Optional
  "time_out": "17:00:00", // Optional
  "total_hours": 8.0, // Optional
  "overtime_hours": 2.0, // Optional
  "notes": "Manual adjustment by HR",
  "is_present": true, // Optional
  "is_late": false, // Optional
  "is_absent": false, // Optional
  "on_leave": false, // Optional
  "leave_type_id": null // Optional
}
```

**Response:**

```json
{
  "success": true,
  "message": "Attendance updated successfully",
  "data": {
    "attendance_id": 1,
    "employee_id": "EMP001",
    "date": "2025-09-13",
    "time_in": "2025-09-13T08:00:00",
    "time_out": "2025-09-13T17:00:00",
    "total_hours": 8.0,
    "overtime_hours": 2.0,
    "notes": "Manual adjustment by HR",
    "updated_at": "2025-09-13T18:00:00"
  }
}
```

---

## 🔐 Authentication & Permissions

| Endpoint                           | Permission Required    |
| ---------------------------------- | ---------------------- |
| `GET /`                            | Staff or above         |
| `GET /today/:employee_id`          | Staff or above         |
| `GET /status/:employee_id`         | Staff or above         |
| `GET /can-break/:employee_id`      | Staff or above         |
| `POST /clock-in`                   | Any authenticated user |
| `POST /clock-out`                  | Any authenticated user |
| `POST /manual-update/:employee_id` | Admin only             |

---

## ⚠️ Important Notes

1. **Schedule Integration:** Clock-in validates against employee's assigned schedule and working days
2. **Late Detection:** Automatically sets `is_late` flag based on scheduled start time
3. **Overtime Policy:** Overtime hours are NOT auto-calculated; requires separate overtime approval process
4. **Break Handling:** Break time is automatically calculated from employee's assigned schedule `break_duration`
   - Break time is only deducted for shifts of 4+ hours
   - Short work periods (< 4 hours) don't have break time deducted
   - Total hours calculation ensures non-negative values
5. **Payroll Rounding:** Hours are rounded using payroll-friendly increments
   - 0-15 minutes: Round down to nearest hour
   - 16-45 minutes: Round to 30 minutes (0.5 hours)
   - 46-59 minutes: Round up to next hour
6. **RFID Support:** Endpoints support both employee_id and RFID card identification
7. **Time Zone:** All times are handled in Philippine timezone (Asia/Manila)

---

## 📝 Status Values

| Status           | Description                          |
| ---------------- | ------------------------------------ |
| `not_clocked_in` | Employee hasn't clocked in today     |
| `clocked_in`     | Employee is currently clocked in     |
| `clocked_out`    | Employee has clocked out for the day |
| `on_break`       | Employee is currently on break       |
| `on_leave`       | Employee is on approved leave        |
