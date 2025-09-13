-- Create holidays table for tracking regular and special holidays
CREATE TABLE IF NOT EXISTS public.holidays (
  holiday_id serial PRIMARY KEY,
  name varchar(255) NOT NULL,
  date date NOT NULL UNIQUE,  -- Make date unique for ON CONFLICT
  holiday_type varchar(20) NOT NULL CHECK (holiday_type IN ('regular', 'special')),
  description text,
  is_active boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT NOW(),
  updated_at timestamp without time zone DEFAULT NOW()
);

-- Create index for quick holiday lookups
CREATE INDEX IF NOT EXISTS idx_holidays_date_active 
ON public.holidays (date, is_active);

-- Add sample holidays (Philippines)
INSERT INTO public.holidays (name, date, holiday_type, description) VALUES
('New Year''s Day', '2025-01-01', 'regular', 'New Year celebration'),
('Maundy Thursday', '2025-04-17', 'regular', 'Holy Week'),
('Good Friday', '2025-04-18', 'regular', 'Holy Week'),
('Araw ng Kagitingan', '2025-04-09', 'regular', 'Day of Valor'),
('Labor Day', '2025-05-01', 'regular', 'International Workers Day'),
('Independence Day', '2025-06-12', 'regular', 'Philippine Independence Day'),
('National Heroes Day', '2025-08-25', 'regular', 'Last Monday of August'),
('Bonifacio Day', '2025-11-30', 'regular', 'Andres Bonifacio Birthday'),
('Rizal Day', '2025-12-30', 'regular', 'Jose Rizal Death Anniversary'),
('Christmas Day', '2025-12-25', 'regular', 'Christmas celebration'),
('Black Saturday', '2025-04-19', 'special', 'Holy Week'),
('EDSA People Power Revolution', '2025-02-25', 'special', 'EDSA Anniversary'),
('Ninoy Aquino Day', '2025-08-21', 'special', 'Ninoy Aquino Death Anniversary'),
('All Saints Day', '2025-11-01', 'special', 'All Saints Day'),
('Christmas Eve', '2025-12-24', 'special', 'Christmas Eve'),
('New Year''s Eve', '2025-12-31', 'special', 'New Year''s Eve')
ON CONFLICT (date) DO NOTHING;

COMMENT ON TABLE public.holidays IS 'Table for tracking regular and special holidays for payroll processing';
COMMENT ON COLUMN public.holidays.holiday_type IS 'regular = double pay, special = 1.3x pay rate';
