# 🧪 **HRMS System Test Guide**

## 🚀 **Test Your Fixed System**

### **Prerequisites:**

1. ✅ Database is running with your schema
2. ✅ Server is running on expected port (usually 5000)
3. ✅ You have test employee data in the database
4. ✅ You have a valid JWT token for authentication

---

## 🔍 **Test 1: Attendance System**

### **Test Clock In/Out Flow:**

```bash
# 1. Test Clock In
curl -X POST http://localhost:5000/api/attendance/clock-in \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "employee_id": "EMP001"
  }'

# Expected Response:
# {
#   "success": true,
#   "message": "Clocked in successfully - John Doe",
#   "data": {
#     "attendance_id": 1,
#     "employee_id": "EMP001",
#     "date": "2025-09-13",
#     "time_in": "2025-09-13T08:00:00",
#     "is_present": true,
#     "is_late": false,
#     "employee_name": "John Doe",
#     "schedule_name": "Day Shift"
#   }
# }

# 2. Test Clock Out
curl -X POST http://localhost:5000/api/attendance/clock-out \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "employee_id": "EMP001",
    "notes": "Normal workday"
  }'

# Expected Response:
# {
#   "success": true,
#   "message": "Clocked out successfully - John Doe",
#   "data": {
#     "attendance_id": 1,
#     "time_out": "2025-09-13T17:00:00",
#     "total_hours": 8.00,
#     "hours_worked": 8.00,
#     "break_duration_hours": 1.00
#   }
# }

# 3. Test Deprecated Break Endpoint
curl -X GET http://localhost:5000/api/attendance/can-break/EMP001 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Expected Response:
# {
#   "success": true,
#   "can_take_break": false,
#   "message": "Break system is now automatic based on employee schedule",
#   "deprecated": true
# }
```

---

## 🏖️ **Test 2: Leave System**

### **Test Leave Request Flow:**

```bash
# 1. Get Leave Types
curl -X GET http://localhost:5000/api/leaves/types \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 2. Apply for Leave
curl -X POST http://localhost:5000/api/leaves/requests/apply \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "employee_id": "EMP001",
    "leave_type_id": 1,
    "start_date": "2025-09-20",
    "end_date": "2025-09-22",
    "reason": "Family vacation"
  }'

# 3. Get Leave Balance
curl -X GET http://localhost:5000/api/leaves/balance/EMP001 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 4. Get Leave Requests
curl -X GET http://localhost:5000/api/leaves/requests \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 💰 **Test 3: Payroll System**

### **Test Payroll Calculation:**

```bash
# 1. Calculate Payroll for Employee
curl -X POST http://localhost:5000/api/payroll/calculate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "employee_id": "EMP001",
    "pay_period_start": "2025-09-01",
    "pay_period_end": "2025-09-30"
  }'

# 2. Generate Payroll
curl -X POST http://localhost:5000/api/payroll/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "employee_ids": ["EMP001"],
    "pay_period_start": "2025-09-01",
    "pay_period_end": "2025-09-30",
    "generated_by": "HR001"
  }'

# 3. Get Payroll Records
curl -X GET "http://localhost:5000/api/payroll/records?employee_id=EMP001" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🔧 **Test 4: RFID Integration**

### **Test RFID Clock In/Out:**

```bash
# 1. Test RFID Clock In/Out (simulate RFID scanner)
curl -X POST http://localhost:5000/api/rfid/clock \
  -H "Content-Type: application/json" \
  -d '{
    "tag": "RFID_TAG_123"
  }'

# 2. Test Deprecated RFID Break
curl -X POST http://localhost:5000/api/rfid/break \
  -H "Content-Type: application/json" \
  -d '{
    "tag": "RFID_TAG_123"
  }'

# Expected Response:
# {
#   "success": false,
#   "message": "Break system is now automatic based on employee schedule",
#   "deprecated": true
# }
```

---

## ✅ **Validation Checklist**

### **Attendance System:**

- [ ] Clock in creates attendance record with `is_present = true`
- [ ] Clock out calculates `total_hours` using schedule `break_duration`
- [ ] Break endpoints return deprecation messages
- [ ] No errors referencing `break_start`, `break_end`, or `status` columns
- [ ] Schedule integration works (break time deducted automatically)

### **Leave System:**

- [ ] Leave requests can be created, approved, rejected
- [ ] Leave balances are managed correctly
- [ ] Leave types show only basic fields (no `is_paid`, `max_days`)
- [ ] Attendance records created for approved leaves

### **Payroll System:**

- [ ] Payroll calculation works with contract rates
- [ ] Payslip generation includes all deductions
- [ ] Multiple rate types supported (hourly, daily, monthly)
- [ ] Leave pay calculation integrated

### **Database Integrity:**

- [ ] No SQL errors in server logs
- [ ] All foreign keys working correctly
- [ ] Boolean flags in attendance table work properly
- [ ] Schedule-based break calculation accurate

---

## 🚨 **Common Issues & Solutions**

### **Issue 1: "Column 'break_start' does not exist"**

**Solution:** Make sure you've restarted your server after the controller fixes.

### **Issue 2: "Cannot calculate break duration"**

**Solution:** Ensure employees have schedules assigned with `break_duration` values.

### **Issue 3: "Employee not found"**

**Solution:** Verify employee exists and has `status = 'active'` in the database.

### **Issue 4: "Schedule not assigned"**

**Solution:** Assign schedules to employees:

```sql
UPDATE employees SET schedule_id = 1 WHERE employee_id = 'EMP001';
```

---

## 📊 **Test Data Setup**

### **Create Test Employee:**

```sql
-- Insert test employee
INSERT INTO employees (employee_id, first_name, last_name, email, status, schedule_id, contract_id)
VALUES ('EMP001', 'John', 'Doe', 'john.doe@company.com', 'active', 1, 1);

-- Create test schedule
INSERT INTO schedules (schedule_name, start_time, end_time, break_duration, days_of_week)
VALUES ('Day Shift', '08:00:00', '17:00:00', 60, '["monday", "tuesday", "wednesday", "thursday", "friday"]');

-- Create test contract
INSERT INTO contracts (start_date, rate, rate_type, position_id, employment_type_id)
VALUES ('2025-01-01', 50000.00, 'monthly', 1, 1);
```

### **Create Test User:**

```sql
INSERT INTO users (employee_id, username, password, role, email)
VALUES ('EMP001', 'john.doe', 'hashed_password', 'employee', 'john.doe@company.com');
```

---

## 🎯 **Success Indicators**

### **✅ All Tests Pass If:**

1. **No SQL errors** in server console
2. **Attendance flow** works clock-in → clock-out → hours calculated
3. **Leave system** allows requests and approvals
4. **Payroll system** calculates correctly
5. **Deprecated endpoints** return proper messages
6. **RFID integration** works for clock-in/out
7. **Break time** automatically deducted from schedule

### **🎉 Your System Is Ready When:**

- All API endpoints return expected responses
- Database queries execute without errors
- Frontend can connect and display data correctly
- Break system is fully automatic
- All three modules (attendance, leave, payroll) work together

---

**🚀 Your HRMS system is now properly aligned with your database schema!**
