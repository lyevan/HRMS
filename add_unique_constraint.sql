-- Script to add unique constraint to attendance table to prevent duplicate employee-date records
-- Run this SQL script in your PostgreSQL database

-- First, let's identify any existing duplicate records
SELECT employee_id, date, COUNT(*) as duplicate_count
FROM attendance 
GROUP BY employee_id, date 
HAVING COUNT(*) > 1
ORDER BY employee_id, date;

-- If duplicates exist, you may want to clean them up first
-- This query will keep only the latest record (highest attendance_id) for each employee-date combination
-- Uncomment and run if you want to remove duplicates:

/*
DELETE FROM attendance 
WHERE attendance_id NOT IN (
    SELECT MAX(attendance_id) 
    FROM attendance 
    GROUP BY employee_id, date
);
*/

-- Add the unique constraint to prevent future duplicates
ALTER TABLE attendance 
ADD CONSTRAINT attendance_employee_date_unique 
UNIQUE (employee_id, date);

-- Create an index to improve query performance (if not already exists)
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date 
ON attendance (employee_id, date);

-- Verify the constraint was added
SELECT conname, contype, pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'attendance'::regclass 
AND conname = 'attendance_employee_date_unique';