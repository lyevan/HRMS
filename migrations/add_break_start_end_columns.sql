-- Migration: Add break_start and break_end columns to schedules table
-- Description: Replace break_duration with explicit break start and end times for more accurate break tracking

-- Add the new break_start and break_end columns
ALTER TABLE schedules 
ADD COLUMN break_start TIME,
ADD COLUMN break_end TIME;

-- Update existing records to convert break_duration to break_start/break_end
-- Assume break starts 4 hours after shift start (current logic) and duration determines end time
UPDATE schedules 
SET 
  break_start = (start_time + INTERVAL '4 hours')::TIME,
  break_end = (start_time + INTERVAL '4 hours' + (break_duration || ' minutes')::INTERVAL)::TIME
WHERE break_duration IS NOT NULL AND break_duration > 0;

-- For records without break_duration, set default lunch break (12:00-13:00)
UPDATE schedules 
SET 
  break_start = '12:00:00'::TIME,
  break_end = '13:00:00'::TIME
WHERE break_duration IS NULL OR break_duration = 0;

-- Add constraints to ensure break times are logical
ALTER TABLE schedules 
ADD CONSTRAINT check_break_times 
CHECK (break_end > break_start);

-- Add constraint to ensure break times are within shift hours
-- Note: This constraint handles overnight shifts by checking if end_time < start_time
ALTER TABLE schedules 
ADD CONSTRAINT check_break_within_shift 
CHECK (
  CASE 
    -- Normal shift (same day)
    WHEN end_time > start_time THEN 
      break_start >= start_time AND break_end <= end_time
    -- Overnight shift (crosses midnight)
    WHEN end_time <= start_time THEN 
      (break_start >= start_time OR break_end <= end_time)
    ELSE true
  END
);

-- Create index for performance on break time queries
CREATE INDEX idx_schedules_break_times ON schedules(break_start, break_end);

-- Keep break_duration for backward compatibility but it will be calculated from break times
-- break_duration = (break_end - break_start) in minutes
UPDATE schedules 
SET break_duration = EXTRACT(EPOCH FROM (break_end - break_start)) / 60
WHERE break_start IS NOT NULL AND break_end IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN schedules.break_start IS 'Start time of break period (e.g., 12:00:00)';
COMMENT ON COLUMN schedules.break_end IS 'End time of break period (e.g., 13:00:00)';
COMMENT ON COLUMN schedules.break_duration IS 'Break duration in minutes (calculated from break_start/break_end, kept for compatibility)';