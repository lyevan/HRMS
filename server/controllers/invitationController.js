import { pool } from "../config/db.js";
import { sendInvitationEmail } from "./emailController.js";
import { generateInviteToken } from "../utils/tokenGeneration.js";
import { createEmployee } from "./employeeController.js";
import { sendOnboardingEmail } from "./emailController.js";
import dotenv from "dotenv";
dotenv.config();

export const createPendingEmployee = async (req, res) => {
  const {
    email,
    phone,
    department,
    position,
    hourly_rate,
    hire_date,
    account_type = "employee",
    status = "registering",
  } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    // Check if the employee already exists
    const result = await pool.query(
      "SELECT * FROM pending_employees WHERE email = $1",
      [email]
    );

    if (result.rows.length > 0) {
      return res
        .status(400)
        .json({ error: "Email is already in pending employees" });
    }

    // Next check if the email exists on the employees table
    const existingEmployee = await pool.query(
      "SELECT * FROM employees WHERE email = $1",
      [email]
    );

    if (existingEmployee.rows.length > 0) {
      return res
        .status(400)
        .json({ error: "Email is already in use by an existing employee" });
    }

    const inviteToken = generateInviteToken(email);
    await pool.query(
      "INSERT INTO pending_employees (email, phone, department, position, hourly_rate, hire_date, account_type, token, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
      [
        email,
        phone,
        department,
        position,
        hourly_rate,
        hire_date,
        account_type,
        inviteToken,
        status,
      ]
    );

    await sendInvitationEmail({
      to: email,
      url: `${process.env.FRONTEND_URL}/complete-registration/${inviteToken}`,
    });

    return res.status(201).json({
      employmentData: {
        email,
        phone,
        department,
        position,
        hourly_rate,
        hire_date,
        account_type,
        status,
      },
      message: "Pending employee created successfully",
    });
  } catch (error) {
    console.error("Error creating pending employee:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const returnEmploymentData = async (req, res) => {
  const token = req.params.token;
  try {
    const result = await pool.query(
      "SELECT * FROM pending_employees WHERE token = $1",
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Pending employee not found" });
    }

    const {
      email,
      phone,
      department,
      position,
      hourly_rate,
      hire_date,
      account_type,
      status,
    } = result.rows[0];

    return res.status(200).json({
      employmentData: {
        email,
        phone,
        department,
        position,
        hourly_rate,
        hire_date,
        account_type,
        status,
      },
    });
  } catch (error) {
    console.error("Error fetching employment data:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const completeRegistration = async (req, res) => {
  const token = req.params.token;
  const {
    firstName,
    middleName,
    lastName,
    suffix,
    nickname,
    gender,
    birthDate,
    birthPlace,
    civilStatus,
    nationality,
    religion,
    email,
    phone,
    alternatePhone,
    presentAddress,
    permanentAddress,
    sssNumber,
    pagibigNumber,
    philhealthNumber,
    tinNumber,
    highestEducation,
    schoolName,
    courseOrMajor,
    graduationYear,
    spouseName,
    spouseOccupation,
    fatherName,
    motherName,
    emergencyContactName,
    emergencyContactRelationship,
    emergencyContactPhone,
    emergencyContactAddress,
    department,
    position,
    hourlyRate,
    hireDate,
    status = "for reviewing",
  } = req.body;

  try {
    await pool.query(
      "UPDATE pending_employees SET first_name = $1, last_name = $2, middle_name = $3, suffix = $4, nickname = $5, gender = $6, birth_date = $7, birth_place = $8, civil_status = $9, nationality = $10, religion = $11, email = $12, phone = $13, alternate_phone = $14, present_address = $15, permanent_address = $16, sss_number = $17, pagibig_number = $18, philhealth_number = $19, tin_number = $20, highest_education = $21, school_name = $22, course_or_major = $23, graduation_year = $24, spouse_name = $25, spouse_occupation = $26, father_name = $27, mother_name = $28, emergency_contact_name = $29, emergency_contact_relationship = $30, emergency_contact_phone = $31, emergency_contact_address = $32, department = $33, position = $34, hourly_rate = $35, hire_date = $36, status = $37, token = null WHERE token = $38",
      [
        firstName,
        lastName,
        middleName,
        suffix,
        nickname,
        gender,
        birthDate,
        birthPlace,
        civilStatus,
        nationality,
        religion,
        email,
        phone,
        alternatePhone,
        presentAddress,
        permanentAddress,
        sssNumber,
        pagibigNumber,
        philhealthNumber,
        tinNumber,
        highestEducation,
        schoolName,
        courseOrMajor,
        graduationYear,
        spouseName,
        spouseOccupation,
        fatherName,
        motherName,
        emergencyContactName,
        emergencyContactRelationship,
        emergencyContactPhone,
        emergencyContactAddress,
        department,
        position,
        hourlyRate,
        hireDate,
        status,
        token,
      ]
    );

    return res
      .status(200)
      .json({ message: "Registration completed successfully" });
  } catch (error) {
    console.error("Error completing registration:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getAllPendingEmployees = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM pending_employees");
    return res.status(200).json({ result: result.rows });
  } catch (error) {
    console.error("Error fetching pending employees:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const reviewPendingEmployee = async (req, res) => {
  const { id } = req.params;
  console.log("Reviewing pending employee with ID:", id);

  if (!id) {
    return res.status(400).json({ error: "Employee ID is required" });
  }

  try {
    // Check if current status is 'for reviewing'
    const status = await pool.query(
      "SELECT status FROM pending_employees WHERE id = $1",
      [id]
    );
    if (status.rows.length === 0 || status.rows[0].status == "for approval") {
      return res
        .status(404)
        .json({ error: "The employee request is already for approval" });
    }
    if (status.rows.length === 0 || status.rows[0].status !== "for reviewing") {
      return res
        .status(400)
        .json({ error: "Please have the employee form completed first" });
    }
    const result = await pool.query(
      "UPDATE pending_employees SET status = 'for approval' WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Pending employee not found" });
    }

    return res.status(200).json({
      message: "Pending employee status updated to for reviewing",
      employee: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating pending employee status:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const approvePendingEmployee = async (req, res) => {
  const { employee, role } = req.body;
  console.log("Employee role to approve:", role);

  try {
    // Check if employee already exists in employees table
    const existingEmployee = await pool.query(
      "SELECT * FROM employees WHERE email = $1",
      [employee.email]
    );

    if (existingEmployee.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Employee with this email already exists",
      });
    }

    // Generate employee ID
    const generateEmployeeId = (counter) => {
      const year = new Date().getFullYear();
      const padded = String(counter).padStart(5, "0");
      return `${year}-${padded}`;
    };

    const getNextEmployeeId = async () => {
      const year = new Date().getFullYear();
      const query = `
        SELECT employee_id
        FROM employees
        WHERE employee_id LIKE $1
        ORDER BY employee_id DESC
        LIMIT 1
      `;
      const result = await pool.query(query, [`${year}-%`]);

      let counter = 1;
      if (result.rows.length > 0) {
        const lastId = result.rows[0].employee_id;
        const lastNumber = parseInt(lastId.split("-")[1], 10);
        counter = lastNumber + 1;
      }
      return generateEmployeeId(counter);
    };

    const employee_id = await getNextEmployeeId();

    // Check first if status is 'for approval'
    const status = await pool.query(
      "SELECT status FROM pending_employees WHERE id = $1",
      [employee.id]
    );
    if (status.rows.length === 0 || status.rows[0].status !== "for approval") {
      return res
        .status(400)
        .json({ error: "Please review the employee form first" });
    }

    // 1. Insert into employees table
    const insertEmployeeQuery = `
      INSERT INTO employees (
        employee_id, first_name, middle_name, last_name, suffix, nickname,
        gender, birth_date, birth_place, civil_status, nationality, religion,
        email, phone, alternate_phone, present_address, permanent_address,
        sss_number, pagibig_number, philhealth_number, tin_number,
        department, position, employment_type, emergency_contact_name,
        emergency_contact_relationship, emergency_contact_phone, emergency_contact_address,
        spouse_name, spouse_occupation, father_name, mother_name,
        highest_education, school_name, course_or_major, graduation_year,
        bank_name, bank_account_number, hourly_rate, hire_date, account_type, status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
        $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32,
        $33, $34, $35, $36, $37, $38, $39, $40, $41, $42
      ) RETURNING *
    `;

    const employeeValues = [
      employee_id,
      employee.first_name,
      employee.middle_name,
      employee.last_name,
      employee.suffix,
      employee.nickname,
      employee.gender,
      employee.birth_date,
      employee.birth_place,
      employee.civil_status,
      employee.nationality,
      employee.religion,
      employee.email,
      employee.phone,
      employee.alternate_phone,
      employee.present_address,
      employee.permanent_address,
      employee.sss_number,
      employee.pagibig_number,
      employee.philhealth_number,
      employee.tin_number,
      employee.department,
      employee.position,
      employee.employment_type,
      employee.emergency_contact_name,
      employee.emergency_contact_relationship,
      employee.emergency_contact_phone,
      employee.emergency_contact_address,
      employee.spouse_name,
      employee.spouse_occupation,
      employee.father_name,
      employee.mother_name,
      employee.highest_education,
      employee.school_name,
      employee.course_or_major,
      employee.graduation_year,
      employee.bank_name,
      employee.bank_account_number,
      employee.hourly_rate,
      employee.hire_date,
      employee.account_type || "employee",
      "active",
    ];

    const employeeResult = await pool.query(
      insertEmployeeQuery,
      employeeValues
    );
    const insertedEmployee = employeeResult.rows[0];

    // 2. Insert into users table
    const bcrypt = await import("bcryptjs");
    const insertUserQuery = `
      INSERT INTO users (employee_id, email, password, role, username)
      VALUES ($1, $2, $3, $4, $5)
    `;

    const encryptedPassword = await bcrypt.default.hash(
      insertedEmployee.employee_id.toString(),
      10
    );

    const username = `${insertedEmployee.first_name
      .toLowerCase()
      .charAt(0)}${insertedEmployee.last_name.toLowerCase()}`;

    const userValues = [
      insertedEmployee.employee_id,
      insertedEmployee.email,
      encryptedPassword,
      role || "employee",
      username,
    ];

    await pool.query(insertUserQuery, userValues);

    // 3. Send onboarding email

    await sendOnboardingEmail({
      to: insertedEmployee.email,
      first_name: insertedEmployee.first_name,
      employee_id: insertedEmployee.employee_id,
      username,
      position: insertedEmployee.position,
      company_name: process.env.COMPANY_NAME,
    });

    // 4. Remove from pending_employees table
    await pool.query("DELETE FROM pending_employees WHERE id = $1", [
      employee.id,
    ]);

    console.log(
      `Employee with position -${employee.position}- approved and created successfully.\nEmployee ID: ${employee_id}`
    );
    console.log(
      `Employee account with role -${
        employee.account_type || "employee"
      }- created successfully.\nUsername: ${username}`
    );

    res.status(201).json({
      success: true,
      message: "Employee approved and created successfully",
      data: insertedEmployee,
    });
  } catch (error) {
    console.error("Error approving pending employee:", error);
    res.status(500).json({
      success: false,
      message: error.message,
      error: error,
    });
  }
};

export const rejectPendingEmployee = async (req, res) => {};
