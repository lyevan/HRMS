-- Update break_duration column to store minutes as integer instead of interval

-- First, convert existing interval values to minutes (if any exist)
-- Then change the column type to integer
ALTER TABLE public.manual_log_requests 
DROP COLUMN IF EXISTS break_duration;

ALTER TABLE public.manual_log_requests 
ADD COLUMN break_duration integer DEFAULT 60;

-- Add comment to explain the new column format
COMMENT ON COLUMN public.manual_log_requests.break_duration IS 'Break duration in minutes (e.g., 60 for 1 hour break)';
