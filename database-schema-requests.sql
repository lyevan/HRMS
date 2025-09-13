-- Request Management System Database Schema
-- Execute these SQL commands in your Supabase SQL editor

-- Create enum types for request statuses
CREATE TYPE request_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');
CREATE TYPE request_type AS ENUM ('manual_log', 'overtime', 'out_of_business', 'change_shift', 'change_dayoff', 'undertime');
CREATE TYPE shift_type AS ENUM ('morning', 'afternoon', 'night', 'flexible');
CREATE TYPE day_of_week AS ENUM ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');

-- Main requests table for all request types
CREATE TABLE public.requests (
  request_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  employee_id character varying NOT NULL,
  request_type request_type NOT NULL,
  title character varying NOT NULL,
  description text,
  status request_status NOT NULL DEFAULT 'pending',
  requested_date date NOT NULL DEFAULT CURRENT_DATE,
  start_date date,
  end_date date,
  approved_by character varying,
  approved_date timestamp without time zone,
  rejected_by character varying,
  rejected_date timestamp without time zone,
  rejection_reason text,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  
  CONSTRAINT requests_pkey PRIMARY KEY (request_id),
  CONSTRAINT requests_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id),
  CONSTRAINT requests_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(employee_id),
  CONSTRAINT requests_rejected_by_fkey FOREIGN KEY (rejected_by) REFERENCES public.users(employee_id)
);

-- Manual log requests (for manual attendance entries)
CREATE TABLE public.manual_log_requests (
  manual_log_request_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  request_id bigint NOT NULL,
  target_date date NOT NULL,
  time_in time without time zone,
  time_out time without time zone,
  reason text NOT NULL,
  supporting_documents text[], -- URLs to uploaded documents
  
  CONSTRAINT manual_log_requests_pkey PRIMARY KEY (manual_log_request_id),
  CONSTRAINT manual_log_requests_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.requests(request_id) ON DELETE CASCADE
);

-- Overtime requests
CREATE TABLE public.overtime_requests (
  overtime_request_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  request_id bigint NOT NULL,
  overtime_date date NOT NULL,
  start_time time without time zone NOT NULL,
  end_time time without time zone NOT NULL,
  expected_hours numeric(4,2) NOT NULL,
  reason text NOT NULL,
  project_or_task text,
  
  CONSTRAINT overtime_requests_pkey PRIMARY KEY (overtime_request_id),
  CONSTRAINT overtime_requests_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.requests(request_id) ON DELETE CASCADE
);

-- Out of business requests (business trips, client meetings, etc.)
CREATE TABLE public.out_of_business_requests (
  out_of_business_request_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  request_id bigint NOT NULL,
  destination text NOT NULL,
  purpose text NOT NULL,
  client_or_company text,
  contact_person text,
  contact_number text,
  transportation_mode text,
  estimated_cost numeric(10,2),
  
  CONSTRAINT out_of_business_requests_pkey PRIMARY KEY (out_of_business_request_id),
  CONSTRAINT out_of_business_requests_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.requests(request_id) ON DELETE CASCADE
);

-- Change shift requests
CREATE TABLE public.change_shift_requests (
  change_shift_request_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  request_id bigint NOT NULL,
  current_shift_start time without time zone NOT NULL,
  current_shift_end time without time zone NOT NULL,
  requested_shift_start time without time zone NOT NULL,
  requested_shift_end time without time zone NOT NULL,
  reason text NOT NULL,
  is_permanent boolean DEFAULT false,
  effective_until date, -- null if permanent
  
  CONSTRAINT change_shift_requests_pkey PRIMARY KEY (change_shift_request_id),
  CONSTRAINT change_shift_requests_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.requests(request_id) ON DELETE CASCADE
);

-- Change day-off requests
CREATE TABLE public.change_dayoff_requests (
  change_dayoff_request_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  request_id bigint NOT NULL,
  current_dayoff day_of_week NOT NULL,
  requested_dayoff day_of_week NOT NULL,
  reason text NOT NULL,
  is_permanent boolean DEFAULT false,
  effective_until date, -- null if permanent
  
  CONSTRAINT change_dayoff_requests_pkey PRIMARY KEY (change_dayoff_request_id),
  CONSTRAINT change_dayoff_requests_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.requests(request_id) ON DELETE CASCADE
);

-- Undertime requests
CREATE TABLE public.undertime_requests (
  undertime_request_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  request_id bigint NOT NULL,
  undertime_date date NOT NULL,
  early_out_time time without time zone NOT NULL,
  expected_hours_missed numeric(4,2) NOT NULL,
  reason text NOT NULL,
  is_emergency boolean DEFAULT false,
  makeup_plan text, -- how they plan to make up the hours
  
  CONSTRAINT undertime_requests_pkey PRIMARY KEY (undertime_request_id),
  CONSTRAINT undertime_requests_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.requests(request_id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_requests_employee_id ON public.requests(employee_id);
CREATE INDEX idx_requests_status ON public.requests(status);
CREATE INDEX idx_requests_type ON public.requests(request_type);
CREATE INDEX idx_requests_date ON public.requests(requested_date);

-- Create triggers for updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_requests_updated_at 
    BEFORE UPDATE ON public.requests 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample request types data (optional)
-- You can run this to populate some initial data
/*
INSERT INTO public.requests (employee_id, request_type, title, description, status) VALUES
('EMP001', 'manual_log', 'Manual Log Entry for Missed Punch', 'Forgot to clock in due to system maintenance', 'pending'),
('EMP002', 'overtime', 'Overtime Request for Project Deadline', 'Need to work overtime to meet client deadline', 'pending'),
('EMP003', 'out_of_business', 'Client Meeting in Makati', 'Important client presentation for Q4 proposal', 'pending');
*/