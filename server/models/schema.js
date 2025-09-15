// -- WARNING: This schema is for context only and is not meant to be run.
// -- Table order and constraints may not be valid for execution.

// CREATE TABLE public.announcements (
//   announcement_id integer NOT NULL DEFAULT nextval('announcements_announcement_id_seq'::regclass),
//   title character varying NOT NULL,
//   message text NOT NULL,
//   date date NOT NULL DEFAULT now(),
//   announced_by character varying NOT NULL,
//   created_at timestamp without time zone DEFAULT now(),
//   updated_at timestamp without time zone DEFAULT now(),
//   CONSTRAINT announcements_pkey PRIMARY KEY (announcement_id)
// );
// CREATE TABLE public.attendance (
//   attendance_id integer NOT NULL DEFAULT nextval('attendance_attendance_id_seq'::regclass),
//   employee_id character varying NOT NULL,
//   date date NOT NULL DEFAULT now(),
//   time_in timestamp without time zone NOT NULL,
//   time_out timestamp without time zone,
//   total_hours numeric,
//   overtime_hours numeric DEFAULT 0,
//   notes text,
//   created_at timestamp without time zone DEFAULT now(),
//   updated_at timestamp without time zone DEFAULT now(),
//   is_present boolean DEFAULT false,
//   is_late boolean DEFAULT false,
//   is_absent boolean DEFAULT false,
//   on_leave boolean DEFAULT false,
//   leave_type_id integer,
//   leave_request_id integer,
//   is_undertime boolean DEFAULT false,
//   is_halfday boolean DEFAULT false,
//   is_dayoff boolean DEFAULT false,
//   is_regular_holiday boolean DEFAULT false,
//   is_special_holiday boolean DEFAULT false,
//   late_minutes integer DEFAULT 0,
//   undertime_minutes integer DEFAULT 0,
//   night_differential_hours numeric DEFAULT 0,
//   rest_day_hours_worked numeric DEFAULT 0,
//   is_entitled_holiday boolean DEFAULT false,
//   CONSTRAINT attendance_pkey PRIMARY KEY (attendance_id),
//   CONSTRAINT attendance_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id),
//   CONSTRAINT attendance_leave_request_id_fkey FOREIGN KEY (leave_request_id) REFERENCES public.leave_requests(leave_request_id),
//   CONSTRAINT attendance_leave_type_id_fkey FOREIGN KEY (leave_type_id) REFERENCES public.leave_types(leave_type_id)
// );
// CREATE TABLE public.audit_logs (
//   audit_log_id integer NOT NULL DEFAULT nextval('audit_logs_audit_log_id_seq'::regclass),
//   employee_id character varying NOT NULL,
//   action character varying NOT NULL,
//   timestamp timestamp without time zone DEFAULT now(),
//   CONSTRAINT audit_logs_pkey PRIMARY KEY (audit_log_id),
//   CONSTRAINT audit_logs_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id)
// );
// CREATE TABLE public.bonus_types (
//   bonus_type_id integer NOT NULL DEFAULT nextval('bonus_types_bonus_type_id_seq'::regclass),
//   name character varying NOT NULL UNIQUE,
//   description text,
//   created_at timestamp without time zone DEFAULT now(),
//   updated_at timestamp without time zone DEFAULT now(),
//   CONSTRAINT bonus_types_pkey PRIMARY KEY (bonus_type_id)
// );
// CREATE TABLE public.bonuses (
//   bonus_id integer NOT NULL DEFAULT nextval('bonuses_bonus_id_seq'::regclass),
//   employee_id character varying NOT NULL,
//   bonus_type_id integer NOT NULL,
//   amount numeric NOT NULL,
//   description text,
//   date date NOT NULL DEFAULT now(),
//   created_at timestamp without time zone DEFAULT now(),
//   updated_at timestamp without time zone DEFAULT now(),
//   pay_period_start date,
//   pay_period_end date,
//   is_thirteenth_month boolean DEFAULT false,
//   is_pro_rated boolean DEFAULT false,
//   calculation_basis character varying DEFAULT 'basic_salary'::character varying CHECK (calculation_basis::text = ANY (ARRAY['basic_salary'::character varying, 'total_earnings'::character varying, 'gross_pay'::character varying]::text[])),
//   months_worked numeric DEFAULT 12,
//   year_earned integer,
//   payment_schedule character varying DEFAULT 'december'::character varying CHECK (payment_schedule::text = ANY (ARRAY['december'::character varying, 'split_june_december'::character varying, 'quarterly'::character varying]::text[])),
//   is_paid boolean DEFAULT false,
//   paid_date date,
//   tax_withheld numeric DEFAULT 0,
//   net_amount numeric,
//   CONSTRAINT bonuses_pkey PRIMARY KEY (bonus_id),
//   CONSTRAINT bonuses_bonus_type_id_fkey FOREIGN KEY (bonus_type_id) REFERENCES public.bonus_types(bonus_type_id),
//   CONSTRAINT bonuses_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id)
// );
// CREATE TABLE public.change_dayoff_requests (
//   change_dayoff_request_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
//   request_id bigint NOT NULL,
//   current_dayoff USER-DEFINED NOT NULL,
//   requested_dayoff USER-DEFINED NOT NULL,
//   reason text NOT NULL,
//   is_permanent boolean DEFAULT false,
//   effective_until date,
//   CONSTRAINT change_dayoff_requests_pkey PRIMARY KEY (change_dayoff_request_id),
//   CONSTRAINT change_dayoff_requests_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.requests(request_id)
// );
// CREATE TABLE public.change_shift_requests (
//   change_shift_request_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
//   request_id bigint NOT NULL,
//   current_shift_start time without time zone NOT NULL,
//   current_shift_end time without time zone NOT NULL,
//   requested_shift_start time without time zone NOT NULL,
//   requested_shift_end time without time zone NOT NULL,
//   reason text NOT NULL,
//   is_permanent boolean DEFAULT false,
//   effective_until date,
//   CONSTRAINT change_shift_requests_pkey PRIMARY KEY (change_shift_request_id),
//   CONSTRAINT change_shift_requests_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.requests(request_id)
// );
// CREATE TABLE public.contracts (
//   contract_id integer NOT NULL DEFAULT nextval('contracts_contract_id_seq'::regclass),
//   start_date date NOT NULL,
//   end_date date,
//   rate numeric NOT NULL,
//   rate_type USER-DEFINED NOT NULL,
//   position_id integer NOT NULL,
//   employment_type_id integer NOT NULL,
//   created_at timestamp without time zone DEFAULT now(),
//   updated_at timestamp without time zone DEFAULT now(),
//   CONSTRAINT contracts_pkey PRIMARY KEY (contract_id),
//   CONSTRAINT contracts_position_id_fkey FOREIGN KEY (position_id) REFERENCES public.positions(position_id),
//   CONSTRAINT contracts_employment_type_id_fkey FOREIGN KEY (employment_type_id) REFERENCES public.employment_types(employment_type_id)
// );
// CREATE TABLE public.deduction_payments (
//   payment_id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
//   deduction_id integer NOT NULL,
//   employee_id character varying NOT NULL,
//   payment_date date NOT NULL,
//   amount_paid numeric NOT NULL,
//   remaining_balance_after numeric NOT NULL,
//   payroll_period_start date,
//   payroll_period_end date,
//   notes text,
//   created_at timestamp without time zone DEFAULT now(),
//   CONSTRAINT deduction_payments_pkey PRIMARY KEY (payment_id),
//   CONSTRAINT deduction_payments_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id),
//   CONSTRAINT deduction_payments_deduction_id_fkey FOREIGN KEY (deduction_id) REFERENCES public.deductions(deduction_id)
// );
// CREATE TABLE public.deduction_types (
//   deduction_type_id integer NOT NULL DEFAULT nextval('deduction_types_deduction_type_id_seq'::regclass),
//   name character varying NOT NULL UNIQUE,
//   description text,
//   created_at timestamp without time zone DEFAULT now(),
//   updated_at timestamp without time zone DEFAULT now(),
//   CONSTRAINT deduction_types_pkey PRIMARY KEY (deduction_type_id)
// );
// CREATE TABLE public.deductions (
//   deduction_id integer NOT NULL DEFAULT nextval('deductions_deduction_id_seq'::regclass),
//   employee_id character varying NOT NULL,
//   deduction_type_id integer NOT NULL,
//   amount numeric NOT NULL,
//   description text,
//   date date NOT NULL DEFAULT now(),
//   created_at timestamp without time zone DEFAULT now(),
//   updated_at timestamp without time zone DEFAULT now(),
//   is_active boolean DEFAULT true,
//   principal_amount numeric DEFAULT 0,
//   remaining_balance numeric DEFAULT 0,
//   installment_amount numeric DEFAULT 0,
//   installments_total integer DEFAULT 1,
//   installments_paid integer DEFAULT 0,
//   start_date date,
//   end_date date,
//   interest_rate numeric DEFAULT 0,
//   payment_frequency character varying DEFAULT 'monthly'::character varying CHECK (payment_frequency::text = ANY (ARRAY['weekly'::character varying, 'bi-weekly'::character varying, 'semi-monthly'::character varying, 'monthly'::character varying]::text[])),
//   is_recurring boolean DEFAULT false,
//   auto_deduct boolean DEFAULT true,
//   next_deduction_date date,
//   CONSTRAINT deductions_pkey PRIMARY KEY (deduction_id),
//   CONSTRAINT deductions_deduction_type_id_fkey FOREIGN KEY (deduction_type_id) REFERENCES public.deduction_types(deduction_type_id),
//   CONSTRAINT deductions_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id)
// );
// CREATE TABLE public.departments (
//   department_id integer NOT NULL DEFAULT nextval('departments_department_id_seq'::regclass),
//   name character varying NOT NULL UNIQUE,
//   description text,
//   created_at timestamp without time zone DEFAULT now(),
//   updated_at timestamp without time zone DEFAULT now(),
//   CONSTRAINT departments_pkey PRIMARY KEY (department_id)
// );
// CREATE TABLE public.employee_schedule_overrides (
//   override_id integer NOT NULL DEFAULT nextval('employee_schedule_overrides_override_id_seq'::regclass),
//   employee_id character varying NOT NULL,
//   override_type character varying NOT NULL CHECK (override_type::text = ANY (ARRAY['hours_per_day'::character varying, 'days_per_week'::character varying, 'monthly_working_days'::character varying, 'custom_rate'::character varying]::text[])),
//   override_value numeric NOT NULL,
//   effective_from date NOT NULL,
//   effective_until date,
//   reason text,
//   is_active boolean DEFAULT true,
//   created_by character varying,
//   created_at timestamp without time zone DEFAULT now(),
//   updated_at timestamp without time zone DEFAULT now(),
//   CONSTRAINT employee_schedule_overrides_pkey PRIMARY KEY (override_id),
//   CONSTRAINT employee_schedule_overrides_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id)
// );
// CREATE TABLE public.employees (
//   employee_id character varying NOT NULL,
//   system_id integer NOT NULL DEFAULT nextval('employees_system_id_seq'::regclass),
//   contract_id integer,
//   first_name character varying NOT NULL,
//   last_name character varying NOT NULL,
//   email character varying NOT NULL UNIQUE,
//   date_of_birth date,
//   status USER-DEFINED NOT NULL DEFAULT 'active'::employee_status,
//   created_at timestamp without time zone DEFAULT now(),
//   updated_at timestamp without time zone DEFAULT now(),
//   avatar_url text UNIQUE,
//   middle_name text,
//   nickname text,
//   suffix text,
//   sex text,
//   civil_status USER-DEFINED NOT NULL DEFAULT 'single'::civil_status_type,
//   religion text,
//   citizenship text,
//   current_address text,
//   permanent_address text,
//   phone text,
//   telephone text,
//   government_id_numbers_id bigint UNIQUE,
//   schedule_id bigint,
//   CONSTRAINT employees_pkey PRIMARY KEY (employee_id),
//   CONSTRAINT employees_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contracts(contract_id),
//   CONSTRAINT employees_government_id_numbers_id_fkey FOREIGN KEY (government_id_numbers_id) REFERENCES public.government_id_numbers(government_id_numbers_id),
//   CONSTRAINT employees_schedule_id_fkey FOREIGN KEY (schedule_id) REFERENCES public.schedules(schedule_id)
// );
// CREATE TABLE public.employment_types (
//   employment_type_id integer NOT NULL DEFAULT nextval('employment_types_employment_type_id_seq'::regclass),
//   name character varying NOT NULL UNIQUE,
//   created_at timestamp without time zone DEFAULT now(),
//   updated_at timestamp without time zone DEFAULT now(),
//   CONSTRAINT employment_types_pkey PRIMARY KEY (employment_type_id)
// );
// CREATE TABLE public.government_id_numbers (
//   government_id_numbers_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
//   sss_number text UNIQUE,
//   hdmf_number text UNIQUE,
//   philhealth_number text UNIQUE,
//   tin_number text UNIQUE,
//   created_at timestamp with time zone NOT NULL DEFAULT now(),
//   CONSTRAINT government_id_numbers_pkey PRIMARY KEY (government_id_numbers_id)
// );
// CREATE TABLE public.holidays (
//   holiday_id integer NOT NULL DEFAULT nextval('holidays_holiday_id_seq'::regclass),
//   name character varying NOT NULL,
//   date date NOT NULL UNIQUE,
//   holiday_type character varying NOT NULL CHECK (holiday_type::text = ANY (ARRAY['regular'::character varying, 'special'::character varying]::text[])),
//   description text,
//   is_active boolean DEFAULT true,
//   created_at timestamp without time zone DEFAULT now(),
//   updated_at timestamp without time zone DEFAULT now(),
//   CONSTRAINT holidays_pkey PRIMARY KEY (holiday_id)
// );
// CREATE TABLE public.leave_balance (
//   leave_balance_id integer NOT NULL DEFAULT nextval('leave_balance_leave_balance_id_seq'::regclass),
//   leave_type_id integer NOT NULL,
//   balance integer NOT NULL DEFAULT 0,
//   employee_id character varying NOT NULL,
//   updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
//   CONSTRAINT leave_balance_pkey PRIMARY KEY (leave_balance_id),
//   CONSTRAINT leave_balance_leave_type_id_fkey FOREIGN KEY (leave_type_id) REFERENCES public.leave_types(leave_type_id),
//   CONSTRAINT leave_balance_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id)
// );
// CREATE TABLE public.leave_requests (
//   leave_request_id integer NOT NULL DEFAULT nextval('leave_requests_leave_request_id_seq'::regclass),
//   employee_id character varying NOT NULL,
//   leave_type_id integer NOT NULL,
//   start_date date NOT NULL,
//   end_date date NOT NULL,
//   status USER-DEFINED NOT NULL DEFAULT 'pending'::leave_request_status,
//   created_at timestamp without time zone DEFAULT now(),
//   updated_at timestamp without time zone DEFAULT now(),
//   reason text,
//   approved_by text,
//   rejected_by text,
//   approved_date timestamp without time zone,
//   rejected_date timestamp without time zone,
//   comments text,
//   CONSTRAINT leave_requests_pkey PRIMARY KEY (leave_request_id),
//   CONSTRAINT leave_requests_rejected_by_fkey FOREIGN KEY (rejected_by) REFERENCES public.users(employee_id),
//   CONSTRAINT leave_requests_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(employee_id),
//   CONSTRAINT leave_requests_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id),
//   CONSTRAINT leave_requests_leave_type_id_fkey FOREIGN KEY (leave_type_id) REFERENCES public.leave_types(leave_type_id)
// );
// CREATE TABLE public.leave_types (
//   leave_type_id integer NOT NULL DEFAULT nextval('leave_types_leave_type_id_seq'::regclass),
//   name character varying NOT NULL UNIQUE,
//   description text,
//   created_at timestamp without time zone DEFAULT now(),
//   updated_at timestamp without time zone DEFAULT now(),
//   is_paid boolean,
//   pay_percentage integer DEFAULT 100,
//   CONSTRAINT leave_types_pkey PRIMARY KEY (leave_type_id)
// );
// CREATE TABLE public.manual_log_requests (
//   manual_log_request_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
//   request_id bigint NOT NULL,
//   target_date date NOT NULL,
//   time_in time without time zone,
//   time_out time without time zone,
//   reason text NOT NULL,
//   supporting_documents ARRAY,
//   shift_start_time time without time zone DEFAULT '08:00:00'::time without time zone,
//   shift_end_time time without time zone DEFAULT '17:00:00'::time without time zone,
//   total_hours numeric,
//   overtime_hours numeric DEFAULT 0,
//   break_duration integer DEFAULT 60,
//   CONSTRAINT manual_log_requests_pkey PRIMARY KEY (manual_log_request_id),
//   CONSTRAINT manual_log_requests_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.requests(request_id)
// );
// CREATE TABLE public.otps (
//   id integer NOT NULL DEFAULT nextval('otps_id_seq'::regclass),
//   email character varying NOT NULL,
//   otp character varying NOT NULL,
//   expires_at timestamp without time zone NOT NULL,
//   used boolean DEFAULT false,
//   created_at timestamp without time zone DEFAULT now(),
//   CONSTRAINT otps_pkey PRIMARY KEY (id)
// );
// CREATE TABLE public.out_of_business_requests (
//   out_of_business_request_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
//   request_id bigint NOT NULL,
//   destination text NOT NULL,
//   purpose text NOT NULL,
//   client_or_company text,
//   contact_person text,
//   contact_number text,
//   transportation_mode text,
//   estimated_cost numeric,
//   CONSTRAINT out_of_business_requests_pkey PRIMARY KEY (out_of_business_request_id),
//   CONSTRAINT out_of_business_requests_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.requests(request_id)
// );
// CREATE TABLE public.overtime_requests (
//   overtime_request_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
//   request_id bigint NOT NULL,
//   attendance_id integer NOT NULL,
//   requested_overtime_hours numeric NOT NULL CHECK (requested_overtime_hours > 0::numeric),
//   reason text NOT NULL,
//   project_or_task text,
//   CONSTRAINT overtime_requests_pkey PRIMARY KEY (overtime_request_id),
//   CONSTRAINT overtime_requests_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.requests(request_id),
//   CONSTRAINT overtime_requests_attendance_id_fkey FOREIGN KEY (attendance_id) REFERENCES public.attendance(attendance_id)
// );
// CREATE TABLE public.payroll_calculation_logs (
//   log_id integer NOT NULL DEFAULT nextval('payroll_calculation_logs_log_id_seq'::regclass),
//   employee_id character varying NOT NULL,
//   calculation_date timestamp without time zone DEFAULT now(),
//   period_start date NOT NULL,
//   period_end date NOT NULL,
//   calculation_type character varying NOT NULL,
//   input_data jsonb,
//   output_data jsonb,
//   calculator_version character varying,
//   errors text,
//   processing_time_ms integer,
//   CONSTRAINT payroll_calculation_logs_pkey PRIMARY KEY (log_id),
//   CONSTRAINT payroll_calculation_logs_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id)
// );
// CREATE TABLE public.payroll_config (
//   config_id integer NOT NULL DEFAULT nextval('payroll_config_config_id_seq'::regclass),
//   config_key character varying NOT NULL UNIQUE,
//   config_value character varying NOT NULL,
//   data_type character varying NOT NULL CHECK (data_type::text = ANY (ARRAY['integer'::character varying, 'decimal'::character varying, 'string'::character varying, 'boolean'::character varying]::text[])),
//   description text,
//   is_active boolean DEFAULT true,
//   created_at timestamp without time zone DEFAULT now(),
//   updated_at timestamp without time zone DEFAULT now(),
//   CONSTRAINT payroll_config_pkey PRIMARY KEY (config_id)
// );
// CREATE TABLE public.payroll_configuration (
//   config_id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
//   config_type character varying NOT NULL,
//   config_key character varying NOT NULL,
//   config_value character varying NOT NULL,
//   effective_date date NOT NULL,
//   expiry_date date,
//   description text,
//   is_active boolean DEFAULT true,
//   created_at timestamp without time zone DEFAULT now(),
//   updated_at timestamp without time zone DEFAULT now(),
//   CONSTRAINT payroll_configuration_pkey PRIMARY KEY (config_id)
// );
// CREATE TABLE public.payroll_header (
//   payroll_header_id integer NOT NULL DEFAULT nextval('payroll_header_payroll_header_id_seq'::regclass),
//   run_date date NOT NULL,
//   start_date date NOT NULL,
//   end_date date NOT NULL,
//   created_at timestamp without time zone DEFAULT now(),
//   updated_at timestamp without time zone DEFAULT now(),
//   run_by text,
//   CONSTRAINT payroll_header_pkey PRIMARY KEY (payroll_header_id)
// );
// CREATE TABLE public.payroll_run_details (
//   detail_id integer NOT NULL DEFAULT nextval('payroll_run_details_detail_id_seq'::regclass),
//   payroll_run_id integer NOT NULL,
//   employee_id character varying NOT NULL,
//   base_pay numeric DEFAULT 0,
//   overtime_pay numeric DEFAULT 0,
//   holiday_pay numeric DEFAULT 0,
//   night_differential numeric DEFAULT 0,
//   leave_pay numeric DEFAULT 0,
//   other_earnings numeric DEFAULT 0,
//   gross_pay numeric DEFAULT 0,
//   sss_employee numeric DEFAULT 0,
//   sss_employer numeric DEFAULT 0,
//   philhealth_employee numeric DEFAULT 0,
//   philhealth_employer numeric DEFAULT 0,
//   pagibig_employee numeric DEFAULT 0,
//   pagibig_employer numeric DEFAULT 0,
//   income_tax numeric DEFAULT 0,
//   other_deductions numeric DEFAULT 0,
//   total_deductions numeric DEFAULT 0,
//   net_pay numeric DEFAULT 0,
//   calculation_data jsonb,
//   created_at timestamp without time zone DEFAULT now(),
//   CONSTRAINT payroll_run_details_pkey PRIMARY KEY (detail_id),
//   CONSTRAINT payroll_run_details_payroll_run_id_fkey FOREIGN KEY (payroll_run_id) REFERENCES public.payroll_runs(payroll_run_id),
//   CONSTRAINT payroll_run_details_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id)
// );
// CREATE TABLE public.payroll_runs (
//   payroll_run_id integer NOT NULL DEFAULT nextval('payroll_runs_payroll_run_id_seq'::regclass),
//   period_start date NOT NULL,
//   period_end date NOT NULL,
//   pay_frequency character varying NOT NULL DEFAULT 'monthly'::character varying,
//   run_date timestamp without time zone DEFAULT now(),
//   processed_by character varying,
//   total_employees integer,
//   total_gross_pay numeric,
//   total_deductions numeric,
//   total_net_pay numeric,
//   status character varying DEFAULT 'draft'::character varying CHECK (status::text = ANY (ARRAY['draft'::character varying, 'processed'::character varying, 'approved'::character varying, 'paid'::character varying]::text[])),
//   notes text,
//   created_at timestamp without time zone DEFAULT now(),
//   updated_at timestamp without time zone DEFAULT now(),
//   CONSTRAINT payroll_runs_pkey PRIMARY KEY (payroll_run_id)
// );
// CREATE TABLE public.payslip (
//   payslip_id integer NOT NULL DEFAULT nextval('payslip_payslip_id_seq'::regclass),
//   employee_id character varying NOT NULL,
//   payroll_header_id integer NOT NULL,
//   gross_pay numeric NOT NULL,
//   overtime_pay numeric DEFAULT 0,
//   night_diff_pay numeric DEFAULT 0,
//   leave_pay numeric DEFAULT 0,
//   bonuses numeric DEFAULT 0,
//   deductions numeric DEFAULT 0,
//   net_pay numeric NOT NULL,
//   created_at timestamp without time zone DEFAULT now(),
//   updated_at timestamp without time zone DEFAULT now(),
//   CONSTRAINT payslip_pkey PRIMARY KEY (payslip_id),
//   CONSTRAINT payslip_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id),
//   CONSTRAINT payslip_payroll_header_id_fkey FOREIGN KEY (payroll_header_id) REFERENCES public.payroll_header(payroll_header_id)
// );
// CREATE TABLE public.pending_employees (
//   pending_employee_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
//   contract_id integer,
//   first_name character varying NOT NULL,
//   last_name character varying NOT NULL,
//   email character varying NOT NULL UNIQUE,
//   date_of_birth date,
//   status text NOT NULL DEFAULT 'pending'::text,
//   created_at timestamp without time zone DEFAULT now(),
//   updated_at timestamp without time zone DEFAULT now(),
//   avatar_url text UNIQUE,
//   middle_name text,
//   nickname text,
//   suffix text,
//   sex text,
//   civil_status USER-DEFINED NOT NULL DEFAULT 'single'::civil_status_type,
//   religion text,
//   citizenship text,
//   current_address text,
//   permanent_address text,
//   phone text,
//   telephone text,
//   government_id_numbers_id bigint UNIQUE,
//   token text UNIQUE,
//   CONSTRAINT pending_employees_pkey PRIMARY KEY (pending_employee_id),
//   CONSTRAINT pending_employees_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contracts(contract_id),
//   CONSTRAINT pending_employees_government_id_numbers_id_fkey FOREIGN KEY (government_id_numbers_id) REFERENCES public.government_id_numbers(government_id_numbers_id)
// );
// CREATE TABLE public.positions (
//   position_id integer NOT NULL DEFAULT nextval('positions_position_id_seq'::regclass),
//   department_id integer NOT NULL,
//   title character varying NOT NULL,
//   description text,
//   created_at timestamp without time zone DEFAULT now(),
//   updated_at timestamp without time zone DEFAULT now(),
//   CONSTRAINT positions_pkey PRIMARY KEY (position_id),
//   CONSTRAINT positions_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(department_id)
// );
// CREATE TABLE public.requests (
//   request_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
//   employee_id character varying NOT NULL,
//   request_type USER-DEFINED NOT NULL,
//   title character varying NOT NULL,
//   description text,
//   status USER-DEFINED NOT NULL DEFAULT 'pending'::request_status,
//   requested_date date NOT NULL DEFAULT CURRENT_DATE,
//   start_date date,
//   end_date date,
//   approved_by character varying,
//   approved_date timestamp without time zone,
//   rejected_by character varying,
//   rejected_date timestamp without time zone,
//   rejection_reason text,
//   created_at timestamp without time zone DEFAULT now(),
//   updated_at timestamp without time zone DEFAULT now(),
//   CONSTRAINT requests_pkey PRIMARY KEY (request_id),
//   CONSTRAINT requests_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(employee_id),
//   CONSTRAINT requests_rejected_by_fkey FOREIGN KEY (rejected_by) REFERENCES public.users(employee_id),
//   CONSTRAINT requests_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id)
// );
// CREATE TABLE public.schedules (
//   schedule_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
//   schedule_name text,
//   start_time time without time zone NOT NULL,
//   end_time time without time zone NOT NULL,
//   created_at timestamp with time zone NOT NULL DEFAULT now(),
//   updated_at timestamp without time zone,
//   break_duration numeric,
//   days_of_week jsonb DEFAULT '[]'::jsonb,
//   CONSTRAINT schedules_pkey PRIMARY KEY (schedule_id)
// );
// CREATE TABLE public.undertime_requests (
//   undertime_request_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
//   request_id bigint NOT NULL,
//   undertime_date date NOT NULL,
//   early_out_time time without time zone NOT NULL,
//   expected_hours_missed numeric NOT NULL,
//   reason text NOT NULL,
//   is_emergency boolean DEFAULT false,
//   makeup_plan text,
//   CONSTRAINT undertime_requests_pkey PRIMARY KEY (undertime_request_id),
//   CONSTRAINT undertime_requests_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.requests(request_id)
// );
// CREATE TABLE public.users (
//   employee_id character varying NOT NULL,
//   password text NOT NULL,
//   role character varying NOT NULL DEFAULT 'employee'::character varying,
//   username character varying NOT NULL,
//   created_at timestamp without time zone DEFAULT now(),
//   updated_at timestamp without time zone DEFAULT now(),
//   email text UNIQUE,
//   CONSTRAINT users_pkey PRIMARY KEY (employee_id),
//   CONSTRAINT users_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id)
// );
