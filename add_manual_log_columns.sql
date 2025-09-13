-- Add new columns to manual_log_requests table for better overtime calculation

ALTER TABLE public.manual_log_requests 
ADD COLUMN break_duration interval DEFAULT '01:00:00',
ADD COLUMN shift_start_time time without time zone DEFAULT '08:00:00',
ADD COLUMN shift_end_time time without time zone DEFAULT '17:00:00',
ADD COLUMN total_hours decimal(5,2),
ADD COLUMN overtime_hours decimal(5,2) DEFAULT 0;

-- Add comments to explain the new columns
COMMENT ON COLUMN public.manual_log_requests.break_duration IS 'Break duration (e.g., lunch break)';
COMMENT ON COLUMN public.manual_log_requests.shift_start_time IS 'Expected shift start time';
COMMENT ON COLUMN public.manual_log_requests.shift_end_time IS 'Expected shift end time';
COMMENT ON COLUMN public.manual_log_requests.total_hours IS 'Calculated total hours worked';
COMMENT ON COLUMN public.manual_log_requests.overtime_hours IS 'Calculated overtime hours';
