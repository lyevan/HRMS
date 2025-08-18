import { pool } from "../config/db";

export const createAllTables = async () => {
  try {
    await pool.query(`
            -- Create custom types first
            DO $$ BEGIN
                CREATE TYPE employee_status AS ENUM ('active', 'inactive', 'suspended', 'terminated', 'seperated');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;

            DO $$ BEGIN
                CREATE TYPE rate_type AS ENUM ('hourly', 'monthly', 'yearly', 'exempted');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;

            DO $$ BEGIN
                CREATE TYPE leave_request_status AS ENUM ('pending', 'approved', 'rejected');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;

            -- Create base tables first (no foreign key dependencies)
            CREATE TABLE IF NOT EXISTS departments (
                department_id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL UNIQUE,
                description TEXT,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS employment_types (
                employment_type_id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL UNIQUE,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS leave_types (
                leave_type_id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL UNIQUE,
                description TEXT,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS bonus_types (
                bonus_type_id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL UNIQUE,
                description TEXT,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS deduction_types (
                deduction_type_id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL UNIQUE,
                description TEXT,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS payroll_header (
                payroll_header_id SERIAL PRIMARY KEY,
                run_date DATE NOT NULL,
                start_date DATE NOT NULL,
                end_date DATE NOT NULL,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS announcements (
                announcement_id SERIAL PRIMARY KEY, 
                title VARCHAR(100) NOT NULL,
                message TEXT NOT NULL,
                date DATE NOT NULL DEFAULT NOW(),
                announced_by VARCHAR(100) NOT NULL,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );

            -- Create tables with department dependencies
            CREATE TABLE IF NOT EXISTS positions (
                position_id SERIAL PRIMARY KEY,
                department_id INTEGER NOT NULL REFERENCES departments(department_id),
                title VARCHAR(100) NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );

            -- Create leave_balance table (depends on leave_types)
            CREATE TABLE IF NOT EXISTS leave_balance (
                leave_balance_id SERIAL PRIMARY KEY,
                leave_type_id INTEGER NOT NULL REFERENCES leave_types(leave_type_id),
                balance INTEGER NOT NULL DEFAULT 0
            );

            -- Create contracts table (depends on positions and employment_types)
            CREATE TABLE IF NOT EXISTS contracts (
                contract_id SERIAL PRIMARY KEY,
                start_date DATE NOT NULL,
                end_date DATE,
                rate NUMERIC(10, 2) NOT NULL,
                rate_type rate_type NOT NULL,
                position_id INTEGER NOT NULL REFERENCES positions(position_id),
                employment_type_id INTEGER NOT NULL REFERENCES employment_types(employment_type_id),
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );

            -- Create employees table (depends on positions, departments, contracts, leave_balance)
            CREATE TABLE IF NOT EXISTS employees (
                employee_id VARCHAR(50) NOT NULL UNIQUE PRIMARY KEY,
                system_id SERIAL,
                position_id INTEGER NOT NULL REFERENCES positions(position_id),
                department_id INTEGER NOT NULL REFERENCES departments(department_id),
                contract_id INTEGER REFERENCES contracts(contract_id),
                leave_balance_id INTEGER REFERENCES leave_balance(leave_balance_id),
                first_name VARCHAR(100) NOT NULL,
                last_name VARCHAR(100) NOT NULL,
                email VARCHAR(100) NOT NULL UNIQUE,
                date_of_birth DATE,
                status employee_status NOT NULL DEFAULT 'active',
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );

            -- Create tables that depend on employees
            CREATE TABLE IF NOT EXISTS users (
                user_id SERIAL PRIMARY KEY,
                employee_id VARCHAR(50) NOT NULL REFERENCES employees(employee_id),
                password TEXT NOT NULL,
                role VARCHAR(50) NOT NULL DEFAULT 'employee',
                username VARCHAR(100) NOT NULL,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS attendance (
                attendance_id SERIAL PRIMARY KEY,
                employee_id VARCHAR(50) NOT NULL REFERENCES employees(employee_id),
                date DATE NOT NULL DEFAULT NOW(),
                time_in TIMESTAMP NOT NULL,
                time_out TIMESTAMP,
                total_hours NUMERIC(5, 2),
                overtime_hours NUMERIC(5, 2) DEFAULT 0,
                status VARCHAR(50) NOT NULL DEFAULT 'present',
                notes TEXT,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS leave_requests (
                leave_request_id SERIAL PRIMARY KEY,
                employee_id VARCHAR(50) NOT NULL REFERENCES employees(employee_id),
                leave_type_id INTEGER NOT NULL REFERENCES leave_types(leave_type_id),
                start_date DATE NOT NULL,
                end_date DATE NOT NULL,
                status leave_request_status NOT NULL DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS payslip (
                payslip_id SERIAL PRIMARY KEY,
                employee_id VARCHAR(50) NOT NULL REFERENCES employees(employee_id),
                payroll_header_id INTEGER NOT NULL REFERENCES payroll_header(payroll_header_id),
                gross_pay NUMERIC(10, 2) NOT NULL,
                overtime_pay NUMERIC(10, 2) DEFAULT 0,
                night_diff_pay NUMERIC(10, 2) DEFAULT 0,
                leave_pay NUMERIC(10, 2) DEFAULT 0,
                bonuses NUMERIC(10, 2) DEFAULT 0,
                deductions NUMERIC(10, 2) DEFAULT 0,
                net_pay NUMERIC(10, 2) NOT NULL,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS bonuses (
                bonus_id SERIAL PRIMARY KEY,
                employee_id VARCHAR(50) NOT NULL REFERENCES employees(employee_id),
                bonus_type_id INTEGER NOT NULL REFERENCES bonus_types(bonus_type_id),
                amount NUMERIC(10, 2) NOT NULL,
                description TEXT,
                date DATE NOT NULL DEFAULT NOW(),
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS deductions (
                deduction_id SERIAL PRIMARY KEY,
                employee_id VARCHAR(50) NOT NULL REFERENCES employees(employee_id),
                deduction_type_id INTEGER NOT NULL REFERENCES deduction_types(deduction_type_id),
                amount NUMERIC(10, 2) NOT NULL,
                description TEXT,
                date DATE NOT NULL DEFAULT NOW(),
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS audit_logs (
                audit_log_id SERIAL PRIMARY KEY,
                employee_id VARCHAR(50) NOT NULL REFERENCES employees(employee_id),
                action VARCHAR(100) NOT NULL,
                timestamp TIMESTAMP DEFAULT NOW()
            );

        `);
  } catch (error) {
    console.error("Error creating all tables:", error);
  }
};
