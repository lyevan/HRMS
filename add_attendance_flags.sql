-- Add new columns to attendance table for payroll processing
ALTER TABLE public.attendance 
ADD COLUMN IF NOT EXISTS is_dayoff boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_regular_holiday boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_special_holiday boolean DEFAULT false;

-- Add comments for clarity
COMMENT ON COLUMN public.attendance.is_dayoff IS 'True if employee worked on their scheduled day off (rest day pay applies)';
COMMENT ON COLUMN public.attendance.is_regular_holiday IS 'True if employee worked on a regular holiday (holiday pay applies)';
COMMENT ON COLUMN public.attendance.is_special_holiday IS 'True if employee worked on a special holiday (special holiday pay applies)';

-- Create index for payroll queries
CREATE INDEX IF NOT EXISTS idx_attendance_payroll_flags 
ON public.attendance (is_dayoff, is_regular_holiday, is_special_holiday);
