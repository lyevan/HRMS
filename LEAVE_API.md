# 🏖️ Leave Management API Documentation

Base URL: `/api/leaves`

## 📖 Overview

The Leave Management API handles employee leave requests, approvals, rejections, leave balance tracking, and calendar integration with attendance system.

---

## 🔍 GET Endpoints

### Get All Leave Requests

```http
GET /api/leaves/requests
```

**Description:** Retrieves all leave requests with employee and leave type details.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "leave_request_id": 1,
      "employee_id": "EMP001",
      "leave_type_id": 1,
      "start_date": "2025-09-20",
      "end_date": "2025-09-22",
      "status": "pending",
      "reason": "Family vacation",
      "created_at": "2025-09-13T10:00:00",
      "first_name": "Juan",
      "last_name": "Dela Cruz",
      "leave_type_name": "Vacation Leave",
      "leave_type_description": "Annual vacation leave",
      "days_requested": 3,
      "approved_by": null,
      "approved_date": null,
      "comments": null
    }
  ]
}
```

### Get Employee Leave Requests

```http
GET /api/leaves/requests/employee/:employee_id
```

**Parameters:**

- `employee_id` (string): Employee ID

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "leave_request_id": 1,
      "employee_id": "EMP001",
      "leave_type_id": 1,
      "start_date": "2025-09-20",
      "end_date": "2025-09-22",
      "status": "approved",
      "reason": "Family vacation",
      "leave_type_name": "Vacation Leave",
      "days_requested": 3,
      "approved_by": "HR001",
      "approved_date": "2025-09-14T09:00:00"
    }
  ]
}
```

### Get Leave Types

```http
GET /api/leaves/types
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "leave_type_id": 1,
      "name": "Vacation Leave",
      "description": "Annual vacation leave",
      "created_at": "2025-01-01T00:00:00"
    },
    {
      "leave_type_id": 2,
      "name": "Sick Leave",
      "description": "Medical sick leave",
      "created_at": "2025-01-01T00:00:00"
    }
  ]
}
```

### Get Employee Leave Balances

```http
GET /api/leaves/balance/:employee_id
```

**Parameters:**

- `employee_id` (string): Employee ID

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "leave_balance_id": 1,
      "leave_type_id": 1,
      "balance": 12,
      "employee_id": "EMP001",
      "leave_type_name": "Vacation Leave",
      "description": "Annual vacation leave"
    },
    {
      "leave_balance_id": 2,
      "leave_type_id": 2,
      "balance": 15,
      "employee_id": "EMP001",
      "leave_type_name": "Sick Leave",
      "description": "Medical sick leave"
    }
  ]
}
```

### Get Employee Leave Calendar

```http
GET /api/leaves/calendar/:employee_id?year=2025&month=9
```

**Parameters:**

- `employee_id` (string): Employee ID
- `year` (number, optional): Filter by year
- `month` (number, optional): Filter by month (1-12)

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "leave_request_id": 1,
      "employee_id": "EMP001",
      "leave_type_id": 1,
      "start_date": "2025-09-20",
      "end_date": "2025-09-22",
      "status": "approved",
      "leave_type_name": "Vacation Leave",
      "days_count": 3
    }
  ]
}
```

---

## ✏️ POST Endpoints

### Apply for Leave

```http
POST /api/leaves/requests/apply
```

**Request Body:**

```json
{
  "employee_id": "EMP001",
  "leave_type_id": 1,
  "start_date": "2025-09-20",
  "end_date": "2025-09-22",
  "reason": "Family vacation trip to Baguio" // Optional
}
```

**Response (Success):**

```json
{
  "success": true,
  "message": "Leave request submitted successfully for Juan Dela Cruz",
  "data": {
    "leave_request_id": 1,
    "employee_id": "EMP001",
    "leave_type_id": 1,
    "start_date": "2025-09-20",
    "end_date": "2025-09-22",
    "status": "pending",
    "reason": "Family vacation trip to Baguio",
    "created_at": "2025-09-13T10:00:00",
    "employee_name": "Juan Dela Cruz",
    "leave_type_name": "Vacation Leave",
    "days_requested": 3
  }
}
```

**Error Responses:**

```json
// Missing required fields
{
  "success": false,
  "message": "Employee ID, leave type, start date, and end date are required"
}

// Invalid dates
{
  "success": false,
  "message": "End date cannot be before start date"
}

// Insufficient balance
{
  "success": false,
  "message": "Insufficient leave balance. Available: 10 days, Requested: 15 days"
}

// Overlapping requests
{
  "success": false,
  "message": "You have overlapping leave requests for this period"
}

// Employee not found
{
  "success": false,
  "message": "Active employee not found"
}

// Leave type not found
{
  "success": false,
  "message": "Leave type not found"
}
```

---

## 🔄 PUT Endpoints

### Approve Leave Request

```http
PUT /api/leaves/requests/:leave_request_id/approve
```

**Parameters:**

- `leave_request_id` (number): Leave request ID

**Request Body:**

```json
{
  "approved_by": "HR001",
  "comments": "Approved with adequate notice provided" // Optional
}
```

**Response:**

```json
{
  "success": true,
  "message": "Leave request approved for Juan Dela Cruz",
  "data": {
    "leave_request_id": 1,
    "employee_name": "Juan Dela Cruz",
    "leave_type": "Vacation Leave",
    "period": "2025-09-20 to 2025-09-22",
    "days_approved": 3
  }
}
```

**What Happens When Approved:**

1. Leave request status changes to "approved"
2. Leave balance is deducted automatically
3. Attendance records are created for leave period with `on_leave = true`
4. Approval details (who approved, when, comments) are recorded

### Reject Leave Request

```http
PUT /api/leaves/requests/:leave_request_id/reject
```

**Parameters:**

- `leave_request_id` (number): Leave request ID

**Request Body:**

```json
{
  "rejected_by": "HR001",
  "comments": "Insufficient coverage during requested period" // Optional
}
```

**Response:**

```json
{
  "success": true,
  "message": "Leave request rejected for Juan Dela Cruz",
  "data": {
    "leave_request_id": 1,
    "employee_name": "Juan Dela Cruz",
    "leave_type": "Vacation Leave",
    "status": "rejected",
    "rejected_by": "HR001",
    "rejected_date": "2025-09-13T15:00:00",
    "comments": "Insufficient coverage during requested period"
  }
}
```

### Cancel Leave Request

```http
PUT /api/leaves/requests/:leave_request_id/cancel
```

**Parameters:**

- `leave_request_id` (number): Leave request ID

**Request Body:**

```json
{
  "employee_id": "EMP001" // Must match the employee who made the request
}
```

**Response:**

```json
{
  "success": true,
  "message": "Leave request cancelled successfully",
  "data": {
    "leave_request_id": 1,
    "employee_name": "Juan Dela Cruz",
    "leave_type": "Vacation Leave",
    "period": "2025-09-20 to 2025-09-22"
  }
}
```

**What Happens When Cancelled:**

1. Leave request status changes to "cancelled"
2. If previously approved: leave balance is restored
3. If previously approved: attendance records are removed/updated
4. Can only cancel future leave requests (not started or past dates)

**Error Responses:**

```json
// Already started/past
{
  "success": false,
  "message": "Cannot cancel leave request that has already started or passed"
}

// Permission denied
{
  "success": false,
  "message": "Leave request not found or you don't have permission to cancel this request"
}

// Already processed
{
  "success": false,
  "message": "Leave request is already cancelled"
}
```

---

## 📋 Leave Request Status Flow

```
pending → approved → [can be cancelled if future]
        ↓
        rejected (final)
        ↓
        cancelled (if was pending)
```

---

## 🔐 Authentication & Permissions

| Endpoint                              | Permission Required              |
| ------------------------------------- | -------------------------------- |
| `GET /requests`                       | HR/Manager                       |
| `GET /requests/employee/:employee_id` | Self or HR/Manager               |
| `POST /requests/apply`                | Any authenticated user           |
| `PUT /requests/:id/approve`           | HR/Manager                       |
| `PUT /requests/:id/reject`            | HR/Manager                       |
| `PUT /requests/:id/cancel`            | Self (employee who made request) |
| `GET /types`                          | Any authenticated user           |
| `GET /balance/:employee_id`           | Self or HR/Manager               |
| `GET /calendar/:employee_id`          | Self or HR/Manager               |

---

## ⚠️ Important Business Rules

1. **Balance Validation:** System checks available leave balance before allowing requests
2. **Overlap Prevention:** Cannot request leave for dates that overlap with existing pending/approved requests
3. **Working Days:** Leave requests are validated against employee's working schedule
4. **Attendance Integration:** Approved leaves automatically create attendance records
5. **Retroactive Applications:** System supports applying for past dates (sick leave scenarios)
6. **Cancellation Window:** Can only cancel future leave requests
7. **Auto-Deduction:** Leave balances are automatically deducted upon approval
8. **Restoration:** Cancelled approved leaves restore the balance automatically

---

## 📅 Date Format

All dates should be in `YYYY-MM-DD` format (ISO 8601 date format).

**Examples:**

- `"2025-09-20"` ✅
- `"09/20/2025"` ❌
- `"September 20, 2025"` ❌

---

## 🏷️ Leave Types Configuration

Common leave types in the system:

| Leave Type        | Code | Description           |
| ----------------- | ---- | --------------------- |
| Vacation Leave    | VL   | Annual vacation leave |
| Sick Leave        | SL   | Medical sick leave    |
| Emergency Leave   | EL   | Emergency situations  |
| Maternity Leave   | ML   | Maternity benefits    |
| Paternity Leave   | PL   | Paternity benefits    |
| Bereavement Leave | BL   | Family bereavement    |

**Note:** Leave policies like paid/unpaid status and maximum days are managed through your company's HR policies and the leave balance system.
