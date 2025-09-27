import { pool } from "../config/db.js";
import { sendInvitationEmail } from "./emailController.js";
import { generateInviteToken } from "../utils/tokenGeneration.js";
import { createEmployee } from "./employeeController.js";
import { sendOnboardingEmail } from "./emailController.js";
import { supabase } from "../config/supabase.config.js";
import dotenv from "dotenv";
dotenv.config();

export const createPendingEmployee = async (req, res) => {
  const {
    employee_information: ei,
    contract_information: ci,
    account_type = "employee",
    status = "registering",
  } = req.body;

  console.log("Received employee information:", ei);
  console.log("Received contract information:", ci);

  if (!ei.email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    // Check if the employee already exists
    const result = await pool.query(
      "SELECT * FROM pending_employees WHERE email = $1 AND status != 'rejected'",
      [ei.email]
    );

    if (result.rows.length > 0) {
      return res
        .status(400)
        .json({ error: "Email is already in pending employees" });
    }

    // Next check if the email exists on the employees table
    const existingEmployee = await pool.query(
      "SELECT * FROM employees WHERE email = $1",
      [ei.email]
    );

    if (existingEmployee.rows.length > 0) {
      return res
        .status(400)
        .json({ error: "Email is already in use by an existing employee" });
    }

    // Create Contract First
    const contractResult = await pool.query(
      "INSERT INTO contracts (start_date, end_date, rate, rate_type, position_id, employment_type_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING contract_id",
      [
        ci.contract_start_date,
        ci.contract_end_date || null,
        ci.salary_rate,
        ci.rate_type,
        ci.position_id,
        ci.employment_type_id,
      ]
    );

    const contractId = contractResult.rows[0].contract_id;
    const inviteToken = generateInviteToken(ei.email);
    const insertResult = await pool.query(
      "INSERT INTO pending_employees (first_name, last_name, email, phone, contract_id, token, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
      [
        ei.first_name,
        ei.last_name,
        ei.email,
        ei.phone,
        contractId,
        inviteToken,
        status,
      ]
    );

    const createdPendingEmployee = insertResult.rows[0];

    await sendInvitationEmail({
      to: ei.email,
      url: `${process.env.FRONTEND_URL}/complete-registration/${inviteToken}`,
    });

    return res.status(201).json({
      success: true,
      employmentData: {
        pending_employee_id: createdPendingEmployee.pending_employee_id,
        first_name: createdPendingEmployee.first_name,
        last_name: createdPendingEmployee.last_name,
        email: createdPendingEmployee.email,
        phone: createdPendingEmployee.phone,
        contract_id: createdPendingEmployee.contract_id,
        status: createdPendingEmployee.status,
        created_at: createdPendingEmployee.created_at,
        token: createdPendingEmployee.token,
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
      `SELECT pe.*, gn.sss_number, gn.hdmf_number, gn.philhealth_number, gn.tin_number
       FROM pending_employees pe
       LEFT JOIN government_id_numbers gn ON pe.government_id_numbers_id = gn.government_id_numbers_id
       WHERE pe.token = $1`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Pending employee not found" });
    }

    const pendingEmployee = result.rows[0];

    return res.status(200).json({
      employmentData: {
        pending_employee_id: pendingEmployee.pending_employee_id,
        first_name: pendingEmployee.first_name,
        last_name: pendingEmployee.last_name,
        middle_name: pendingEmployee.middle_name,
        email: pendingEmployee.email,
        phone: pendingEmployee.phone,
        contract_id: pendingEmployee.contract_id,
        status: pendingEmployee.status,
        // Personal information
        nickname: pendingEmployee.nickname,
        suffix: pendingEmployee.suffix,
        sex: pendingEmployee.sex,
        date_of_birth: pendingEmployee.date_of_birth,
        civil_status: pendingEmployee.civil_status,
        religion: pendingEmployee.religion,
        citizenship: pendingEmployee.citizenship,
        current_address: pendingEmployee.current_address,
        permanent_address: pendingEmployee.permanent_address,
        telephone: pendingEmployee.telephone,
        // Government ID numbers
        sss_number: pendingEmployee.sss_number,
        hdmf_number: pendingEmployee.hdmf_number,
        philhealth_number: pendingEmployee.philhealth_number,
        tin_number: pendingEmployee.tin_number,
        // Other fields
        government_id_numbers_id: pendingEmployee.government_id_numbers_id,
        avatar_url: pendingEmployee.avatar_url,
        created_at: pendingEmployee.created_at,
        updated_at: pendingEmployee.updated_at,
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
    sex,
    dateOfBirth,
    civilStatus,
    citizenship,
    religion,
    email,
    phone,
    telephone,
    currentAddress,
    permanentAddress,
    // Government ID Numbers
    sssNumber,
    hdmfNumber,
    philHealthNumber,
    tinNumber,
    status = "for reviewing",
  } = req.body;

  const avatar = req.file; // Avatar file from multer

  try {
    // First, check if the pending employee exists
    const pendingEmployeeResult = await pool.query(
      "SELECT * FROM pending_employees WHERE token = $1",
      [token]
    );

    if (pendingEmployeeResult.rows.length === 0) {
      return res.status(404).json({ error: "Invalid or expired token" });
    }

    const pendingEmployee = pendingEmployeeResult.rows[0];
    let avatar_url = pendingEmployee.avatar_url; // Keep existing avatar if no new one uploaded
    let government_id_numbers_id = pendingEmployee.government_id_numbers_id;

    // Handle avatar upload if provided
    if (avatar) {
      try {
        // Get file extension from original filename
        const fileExtension = avatar.originalname.split(".").pop();
        const fileName = `pending_${pendingEmployee.pending_employee_id}.${fileExtension}`;

        console.log("Avatar to be uploaded:", {
          originalname: avatar.originalname,
          mimetype: avatar.mimetype,
          size: avatar.size,
          fileName: fileName,
        });

        // Upload to Supabase
        const { data, error: uploadError } = await supabase.storage
          .from("hrms")
          .upload(`pending-avatars/${fileName}`, avatar.buffer, {
            cacheControl: "0",
            upsert: true,
            contentType: avatar.mimetype,
          });

        if (uploadError) {
          console.error("Supabase upload error:", uploadError);
          return res.status(500).json({ error: "Error uploading avatar" });
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from("hrms")
          .getPublicUrl(data.path);

        avatar_url = urlData.publicUrl + "?t=" + Date.now(); // Cache busting

        console.log("Generated avatar URL:", avatar_url);
      } catch (uploadError) {
        console.error("Error handling avatar upload:", uploadError);
        // Continue without avatar if upload fails
      }
    }

    // Handle government ID numbers if provided
    if (sssNumber || hdmfNumber || philHealthNumber || tinNumber) {
      if (government_id_numbers_id) {
        // Update existing government ID record
        await pool.query(
          `UPDATE government_id_numbers SET 
            sss_number = COALESCE($1, sss_number),
            hdmf_number = COALESCE($2, hdmf_number),
            philhealth_number = COALESCE($3, philhealth_number),
            tin_number = COALESCE($4, tin_number)
          WHERE government_id_numbers_id = $5`,
          [
            sssNumber,
            hdmfNumber,
            philHealthNumber,
            tinNumber,
            government_id_numbers_id,
          ]
        );
      } else {
        // Create new government ID record
        const govIdResult = await pool.query(
          `INSERT INTO government_id_numbers 
            (sss_number, hdmf_number, philhealth_number, tin_number)
          VALUES ($1, $2, $3, $4)
          RETURNING government_id_numbers_id`,
          [sssNumber, hdmfNumber, philHealthNumber, tinNumber]
        );
        government_id_numbers_id = govIdResult.rows[0].government_id_numbers_id;
      }
    }

    // Update pending employee record
    await pool.query(
      `UPDATE pending_employees SET 
        first_name = $1, 
        last_name = $2, 
        middle_name = $3, 
        suffix = $4, 
        nickname = $5, 
        sex = $6, 
        date_of_birth = $7, 
        civil_status = $8, 
        citizenship = $9, 
        religion = $10, 
        email = $11, 
        phone = $12, 
        telephone = $13, 
        current_address = $14, 
        permanent_address = $15, 
        avatar_url = $16,
        government_id_numbers_id = $17,
        status = $18, 
        token = null,
        updated_at = CURRENT_TIMESTAMP
      WHERE token = $19`,
      [
        firstName,
        lastName,
        middleName,
        suffix,
        nickname,
        sex,
        dateOfBirth,
        civilStatus,
        citizenship,
        religion,
        email,
        phone,
        telephone,
        currentAddress,
        permanentAddress,
        avatar_url,
        government_id_numbers_id,
        status,
        token,
      ]
    );

    return res.status(200).json({
      message: "Registration completed successfully",
      avatar_url: avatar_url,
    });
  } catch (error) {
    console.error("Error completing registration:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getAllPendingEmployees = async (req, res) => {
  try {
    // Join Pending Employees with Contract ID
    const result = await pool.query(`
        SELECT 
          pe.*,
          c.*,
          p.*,
          d.name AS department_name,
          p.title AS position_title
        FROM pending_employees pe
        JOIN contracts c ON pe.contract_id = c.contract_id
        JOIN positions p ON c.position_id = p.position_id
        JOIN departments d ON p.department_id = d.department_id`);
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
      "SELECT status FROM pending_employees WHERE pending_employee_id = $1",
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
        .json({ error: "Please have the onboarding form completed first" });
    }
    const result = await pool.query(
      "UPDATE pending_employees SET status = 'for approval' WHERE pending_employee_id = $1 RETURNING *",
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

    const employee_id = await getNextEmployeeId(); // Check first if status is 'for approval'
    const status = await pool.query(
      "SELECT status FROM pending_employees WHERE pending_employee_id = $1",
      [employee.pending_employee_id]
    );
    if (status.rows.length === 0 || status.rows[0].status !== "for approval") {
      return res
        .status(400)
        .json({ error: "Please review the employee form first" });
    } // 1. Insert into employees table
    const insertEmployeeQuery = `
      INSERT INTO employees (
        employee_id, first_name, middle_name, last_name, suffix, nickname,
        sex, date_of_birth, civil_status, citizenship, religion,
        email, phone, telephone, current_address, permanent_address,
        government_id_numbers_id, avatar_url, contract_id, status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
        $17, $18, $19, $20
      ) RETURNING *
    `;
    const employeeValues = [
      employee_id,
      employee.first_name,
      employee.middle_name,
      employee.last_name,
      employee.suffix,
      employee.nickname,
      employee.sex,
      employee.date_of_birth,
      employee.civil_status,
      employee.citizenship,
      employee.religion,
      employee.email,
      employee.phone,
      employee.telephone,
      employee.current_address,
      employee.permanent_address,
      employee.government_id_numbers_id,
      employee.avatar_url,
      employee.contract_id,
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

    await pool.query(insertUserQuery, userValues); // 3. Send onboarding email
    await sendOnboardingEmail({
      to: insertedEmployee.email,
      first_name: insertedEmployee.first_name,
      employee_id: insertedEmployee.employee_id,
      username,
      position: "Employee", // Default position since we don't have this info in the current schema
      company_name: process.env.COMPANY_NAME,
    }); // 4. Remove from pending_employees table
    await pool.query(
      "DELETE FROM pending_employees WHERE pending_employee_id = $1",
      [employee.pending_employee_id]
    );
    console.log(
      `Employee approved and created successfully.\nEmployee ID: ${employee_id}`
    );
    console.log(
      `Employee account with role -${
        role || "employee"
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

export const rejectPendingEmployee = async (req, res) => {
  const { id } = req.params;
  console.log("Rejecting pending employee with ID:", id);

  if (!id) {
    return res.status(400).json({ error: "Employee ID is required" });
  }

  try {
    // Check if pending employee exists
    const checkResult = await pool.query(
      "SELECT * FROM pending_employees WHERE pending_employee_id = $1",
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: "Pending employee not found" });
    }

    // Update status to rejected
    const result = await pool.query(
      "UPDATE pending_employees SET status = 'rejected', updated_at = NOW() WHERE pending_employee_id = $1 RETURNING *",
      [id]
    );

    return res.status(200).json({
      success: true,
      message: "Pending employee rejected successfully",
      employee: result.rows[0],
    });
  } catch (error) {
    console.error("Error rejecting pending employee:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};
