# Leave Management System Setup Guide

## Overview

The complete leave management system has been implemented with separate filing and approval components as requested.

## Components Created

### 1. Leave Models (`/frontend/src/models/leave-model.ts`)

- Comprehensive TypeScript interfaces for leave management
- LeaveType, LeaveRequest, LeaveBalance types
- Form data interfaces for filing and approval

### 2. File Leave Content (`/frontend/src/components/modal-contents/file-leave-content.tsx`)

- Modal content for filing leave requests
- Supports both admin filing (for any employee) and employee self-filing
- Form validation with date range selection and days calculation
- Employee selection dropdown for admins
- Leave type selection with available balance checking

### 3. Leave Approval Details Content (`/frontend/src/components/modal-contents/leave-approval-details-content.tsx`)

- Modal content for viewing and approving leave requests
- Comprehensive leave request details display
- Approval/rejection functionality with reason input
- Read-only mode for viewing without approval permissions
- Status badges and formatted date displays

### 4. Main Filing and Approval Page (`/frontend/src/pages/admin/timekeeping/timesheet-management/filing-and-approval.tsx`)

- Complete leave management interface
- Statistics cards showing total, pending, approved, rejected requests
- Tabbed interface with "All Requests" and "Pending Approval" views
- Search and filter functionality
- Data table with leave request details
- Action dropdowns for viewing details and approving requests

## Features

### Leave Filing

- **Admin Mode**: Can file leave for any employee with employee selection dropdown
- **Employee Mode**: Files leave for logged-in employee only
- **Form Features**:
  - Leave type selection
  - Date range picker with validation
  - Automatic days calculation
  - Reason input
  - Real-time validation

### Leave Approval

- **View Details**: Read-only view of leave request information
- **Approval Interface**: Approve/reject with reason
- **Status Management**: Visual status badges for pending/approved/rejected
- **Employee Information**: Shows employee details with leave request

### Dashboard Features

- **Statistics Overview**: Cards showing counts by status
- **Search**: By employee name, ID, or leave type
- **Filtering**: By status (all/pending/approved/rejected)
- **Tabbed Views**: Separate views for all requests vs pending approval
- **Actions**: View details, approve/reject based on permissions

## API Integration

The system integrates with the existing leave controller endpoints:

- `GET /api/leave/requests` - Fetch all leave requests
- `POST /api/leave/requests` - Create new leave request
- `PUT /api/leave/requests/:id/approve` - Approve leave request
- `PUT /api/leave/requests/:id/reject` - Reject leave request
- `GET /api/leave/types` - Fetch leave types
- `GET /api/employees` - Fetch employees for admin filing

## Navigation

The leave management system is accessible through:

- **Route**: `/app/admin/tk/tm/filing-and-approval`
- **Navigation**: Timekeeping > Timesheet Management > Filing and Approval
- **Icon**: ListTodo icon in the sidebar

## Modal Architecture

Following the existing pattern:

- Uses the existing `Modal` component wrapper
- Separate modal content components for reusability
- Proper props interface with onClose and onSuccess callbacks
- Responsive design with appropriate modal sizing

## Database Integration

Works with the existing database schema:

- `leave_requests` table for request storage
- `leave_types` table for available leave types
- `employees` table for employee information
- Proper foreign key relationships maintained

## Leave-Attendance Integration

The system integrates with the attendance system:

- Leave approval automatically prevents clock-in on approved dates
- Attendance records are updated when leave is approved after work
- Proper handling of undertime and halfday flags with leave consideration

## Usage Instructions

1. **Filing Leave**:

   - Click "File Leave Request" button
   - Select employee (if admin) or defaults to current user
   - Choose leave type and date range
   - Enter reason and submit

2. **Approving Leave**:

   - Navigate to "Pending Approval" tab or use "All Requests"
   - Click "Review" or use dropdown action "Review & Approve"
   - View details and approve/reject with reason

3. **Viewing History**:
   - Use "All Requests" tab to see complete history
   - Search and filter as needed
   - View details for any request

This complete system provides a professional leave management interface with proper separation of filing and approval functions as requested.
