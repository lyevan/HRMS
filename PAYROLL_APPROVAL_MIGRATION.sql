-- PAYROLL APPROVAL WORKFLOW MIGRATION
-- Add status and approved_by columns to payroll_header table

-- First, check if the request_status enum type exists
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'request_status') THEN
        CREATE TYPE public.request_status AS ENUM ('pending', 'approved', 'rejected');
    END IF;
END $$;

-- Add status column with default 'pending'
ALTER TABLE public.payroll_header 
ADD COLUMN IF NOT EXISTS status public.request_status NULL DEFAULT 'pending'::request_status;

-- Add approved_by column with foreign key to employees
ALTER TABLE public.payroll_header 
ADD COLUMN IF NOT EXISTS approved_by character varying NULL;

-- Add foreign key constraint for approved_by
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'payroll_header_approved_by_fkey'
    ) THEN
        ALTER TABLE public.payroll_header 
        ADD CONSTRAINT payroll_header_approved_by_fkey 
        FOREIGN KEY (approved_by) REFERENCES employees (employee_id) 
        ON UPDATE CASCADE ON DELETE SET NULL;
    END IF;
END $$;

-- Add approved_date column for tracking when approval happened
ALTER TABLE public.payroll_header 
ADD COLUMN IF NOT EXISTS approved_date timestamp without time zone NULL;

-- Add rejected_by column for tracking who rejected (if applicable)
ALTER TABLE public.payroll_header 
ADD COLUMN IF NOT EXISTS rejected_by character varying NULL;

-- Add rejected_date column
ALTER TABLE public.payroll_header 
ADD COLUMN IF NOT EXISTS rejected_date timestamp without time zone NULL;

-- Add rejection_reason column
ALTER TABLE public.payroll_header 
ADD COLUMN IF NOT EXISTS rejection_reason text NULL;

-- Add foreign key constraint for rejected_by
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'payroll_header_rejected_by_fkey'
    ) THEN
        ALTER TABLE public.payroll_header 
        ADD CONSTRAINT payroll_header_rejected_by_fkey 
        FOREIGN KEY (rejected_by) REFERENCES employees (employee_id) 
        ON UPDATE CASCADE ON DELETE SET NULL;
    END IF;
END $$;

-- Update existing payroll records to have 'pending' status if they don't have one
UPDATE public.payroll_header 
SET status = 'pending'::request_status 
WHERE status IS NULL;

-- Create index for faster status queries
CREATE INDEX IF NOT EXISTS idx_payroll_header_status ON public.payroll_header(status);
CREATE INDEX IF NOT EXISTS idx_payroll_header_approved_by ON public.payroll_header(approved_by);

COMMENT ON COLUMN public.payroll_header.status IS 'Approval status of the payroll run: pending, approved, rejected';
COMMENT ON COLUMN public.payroll_header.approved_by IS 'Employee ID of the user who approved this payroll run';
COMMENT ON COLUMN public.payroll_header.approved_date IS 'Timestamp when the payroll was approved';
COMMENT ON COLUMN public.payroll_header.rejected_by IS 'Employee ID of the user who rejected this payroll run';
COMMENT ON COLUMN public.payroll_header.rejected_date IS 'Timestamp when the payroll was rejected';
COMMENT ON COLUMN public.payroll_header.rejection_reason IS 'Reason provided for rejecting the payroll run';

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'payroll_header' 
AND column_name IN ('status', 'approved_by', 'approved_date', 'rejected_by', 'rejected_date', 'rejection_reason')
ORDER BY column_name;