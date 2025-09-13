-- Improved overtime_requests table that references attendance_id
-- This approach provides better data integrity and eliminates redundant date/time storage

-- Drop the existing overtime_requests table (if exists) and recreate with better structure
DROP TABLE IF EXISTS public.overtime_requests CASCADE;

CREATE TABLE public.overtime_requests (
  overtime_request_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  request_id bigint NOT NULL,
  attendance_id integer NOT NULL,
  requested_overtime_hours numeric(4, 2) NOT NULL,
  reason text NOT NULL,
  project_or_task text NULL,
  
  -- Constraints
  CONSTRAINT overtime_requests_pkey PRIMARY KEY (overtime_request_id),
  CONSTRAINT overtime_requests_request_id_fkey FOREIGN KEY (request_id) 
    REFERENCES requests (request_id) ON DELETE CASCADE,
  CONSTRAINT overtime_requests_attendance_id_fkey FOREIGN KEY (attendance_id) 
    REFERENCES attendance (attendance_id) ON DELETE CASCADE,
  
  -- Business rules
  CONSTRAINT overtime_requests_hours_positive CHECK (requested_overtime_hours > 0),
  CONSTRAINT overtime_requests_hours_reasonable CHECK (requested_overtime_hours <= 24),
  
  -- Ensure one overtime request per attendance record
  CONSTRAINT overtime_requests_attendance_unique UNIQUE (attendance_id)
) TABLESPACE pg_default;

-- Create index for performance
CREATE INDEX idx_overtime_requests_attendance_id ON public.overtime_requests (attendance_id);
CREATE INDEX idx_overtime_requests_request_id ON public.overtime_requests (request_id);

-- Add comments for documentation
COMMENT ON TABLE public.overtime_requests IS 'Overtime requests linked to specific attendance records';
COMMENT ON COLUMN public.overtime_requests.attendance_id IS 'References the attendance record for which overtime is requested';
COMMENT ON COLUMN public.overtime_requests.requested_overtime_hours IS 'Number of overtime hours being requested';
COMMENT ON COLUMN public.overtime_requests.reason IS 'Business justification for the overtime request';
COMMENT ON COLUMN public.overtime_requests.project_or_task IS 'Optional project or task description for the overtime work';

-- When overtime is approved, update the attendance.overtime_hours column
-- This will be handled in the backend controller when status changes to 'approved'

-- Example query to get overtime request with attendance details:
/*
SELECT 
  or_req.overtime_request_id,
  or_req.requested_overtime_hours,
  or_req.reason,
  or_req.project_or_task,
  att.employee_id,
  att.date,
  att.time_in,
  att.time_out,
  att.total_hours,
  att.overtime_hours as current_overtime_hours,
  emp.first_name,
  emp.last_name,
  req.status,
  req.requested_date,
  req.approved_date
FROM overtime_requests or_req
JOIN attendance att ON or_req.attendance_id = att.attendance_id
JOIN employees emp ON att.employee_id = emp.employee_id
JOIN requests req ON or_req.request_id = req.request_id
WHERE req.status = 'pending';
*/