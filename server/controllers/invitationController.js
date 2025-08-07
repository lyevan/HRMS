import { pool } from "../config/db.js";
import { sendInvitationEmail } from "./emailController.js";
import { generateInviteToken } from "../utils/tokenGeneration.js";
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
    status = "completing registration",
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
        .json({ message: "Email is already in pending employees" });
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
    status = "for reviewing"
  } = req.body;

  try {
    await pool.query(
      "UPDATE pending_employees SET first_name = $1, last_name = $2, middle_name = $3, suffix = $4, nickname = $5, gender = $6, birth_date = $7, birth_place = $8, civil_status = $9, nationality = $10, religion = $11, email = $12, phone = $13, alternate_phone = $14, present_address = $15, permanent_address = $16, sss_number = $17, pagibig_number = $18, philhealth_number = $19, tin_number = $20, highest_education = $21, school_name = $22, course_or_major = $23, graduation_year = $24, spouse_name = $25, spouse_occupation = $26, father_name = $27, mother_name = $28, emergency_contact_name = $29, emergency_contact_relationship = $30, emergency_contact_phone = $31, emergency_contact_address = $32, department = $33, position = $34, hourly_rate = $35, hire_date = $36, status = $37 WHERE token = $38",
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
    return res.status(200).json({result: result.rows});
  } catch (error) {
    console.error("Error fetching pending employees:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const approvePendingEmployee = async (req, res) => {};

export const rejectPendingEmployee = async (req, res) => {};
