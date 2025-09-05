import { pool } from "../config/db.js";
import bcrypt from "bcryptjs";
import { sendOnboardingEmail } from "./emailController.js";
import { supabase } from "../config/supabase.config.js";
import dotenv from "dotenv";
dotenv.config();

export const getAllEmployees = async (req, res) => {
  const { role } = req.user;
  if (role !== "admin") {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  try {
    const result = await pool.query(`
      SELECT 
        e.*,
        -- Get department and position through contract
        d.name AS department_name,
        p.title AS position_title,
        p.department_id,
        p.position_id,
        c.start_date AS contract_start_date,
        c.end_date AS contract_end_date,
        c.rate AS salary_rate,
        c.rate_type AS rate_type,
        et.name AS employment_type,
        gin.*,
        -- Aggregate leave balances into JSON
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'leave_type', lt.name,
              'balance', lb.balance
            ) ORDER BY lt.name
          ) FILTER (WHERE lb.leave_balance_id IS NOT NULL), 
          '[]'::json
        ) AS leave_balances
      FROM employees e
      -- Join through contract to get position and department
      INNER JOIN contracts c ON e.contract_id = c.contract_id
      INNER JOIN positions p ON c.position_id = p.position_id
      INNER JOIN departments d ON p.department_id = d.department_id
      LEFT JOIN employment_types et ON c.employment_type_id = et.employment_type_id
      LEFT JOIN leave_balance lb ON e.employee_id = lb.employee_id
      LEFT JOIN leave_types lt ON lb.leave_type_id = lt.leave_type_id
      LEFT JOIN government_id_numbers gin ON e.government_id_numbers_id = gin.government_id_numbers_id
      GROUP BY 
        e.employee_id, e.system_id, e.first_name, e.last_name, e.email, 
        e.date_of_birth, e.status, e.created_at, e.updated_at, e.contract_id,
        d.name, d.department_id, p.title, p.position_id, p.department_id,
        c.start_date, c.end_date, c.rate, c.rate_type, et.name, 
        gin.government_id_numbers_id, gin.sss_number, gin.hdmf_number, 
        gin.philhealth_number, gin.tin_number
      ORDER BY e.created_at DESC
    `);

    res.status(200).json({ success: true, results: result.rows });
  } catch (error) {
    console.error("Error fetching employees:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "SELECT * FROM employees WHERE employee_id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Employee not found" });
    }

    res.status(200).json({ success: true, results: result.rows[0] });
  } catch (error) {
    console.error("Error fetching employee:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const generateEmployeeId = (counter) => {
  const year = new Date().getFullYear();
  const padded = String(counter).padStart(5, "0");
  return `${year}-${padded}`; // e.g. "2025-00001"
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
    const lastId = result.rows[0].employee_id; // e.g., "2025-00137"
    const lastNumber = parseInt(lastId.split("-")[1], 10); // 137
    counter = lastNumber + 1;
  }

  return generateEmployeeId(counter); // returns "2025-00138"
};

export const createEmployee = async (req, res) => {
  const { role } = req.user;
  let allowedAccountTypes = [];

  // Admin can create any account type
  if (role == "admin") {
    allowedAccountTypes = ["employee", "staff", "admin"];
  }
  // Staff can only create employee accounts
  if (role == "staff") {
    allowedAccountTypes = ["employee"];
  }
  try {
    const {
      first_name,
      last_name,
      email,
      status = "active",
      account_type = "employee",
    } = req.body;

    if (!allowedAccountTypes.includes(account_type)) {
      return res.status(403).json({
        success: false,
        message: "Only admins can create staff and other admin accounts",
      });
    }

    const requiredFields = {
      first_name,
      last_name,
      email,
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([_, value]) => !value)
      .map(([key]) => key);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    const employee_id = await getNextEmployeeId();

    // 1. Insert into employees
    const insertEmployeeQuery = `
      INSERT INTO employees (
        employee_id, first_name, last_name, email, status
      ) VALUES ($1,$2,$3,$4,$5)
      RETURNING *
    `;

    const employeeValues = [employee_id, first_name, last_name, email, status];

    const employeeResult = await pool.query(
      insertEmployeeQuery,
      employeeValues
    );
    const insertedEmployee = employeeResult.rows[0];

    // 2. Insert into users table
    const insertUserQuery = `
      INSERT INTO users (employee_id, email, password, role, username)
      VALUES ($1, $2, $3, $4, $5)
    `;

    const encryptedPassword = await bcrypt.hash(
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
      account_type,
      username,
    ];

    await pool.query(insertUserQuery, userValues);
    await sendOnboardingEmail({
      to: insertedEmployee.email,
      first_name: insertedEmployee.first_name,
      employee_id: insertedEmployee.employee_id,
      username,
      position: insertedEmployee.position
        ? insertedEmployee.position
        : "Employee",
      company_name: process.env.COMPANY_NAME,
    });

    console.log(
      `Employee with position -${"Employee"}- created successfully.\nEmployee ID: ${employee_id}`
    );
    console.log(
      `Employee account with role -${account_type}- created successfully.\nUsername: ${username}`
    );
    res.status(201).json({ success: true, data: insertedEmployee });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: error.message, data: error });
  }
};

export const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { infoUpdates, idUpdates } = req.body;

    if (Object.keys(infoUpdates).length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No fields to update" });
    }

    const infoKeys = Object.keys(infoUpdates);
    const setClause = infoKeys.map((key, i) => `${key} = $${i + 1}`).join(", ");
    const infoValues = [...Object.values(infoUpdates), id];

    const infoQuery = `
      UPDATE employees 
      SET ${setClause}
      WHERE employee_id = $${infoValues.length}
      RETURNING *
    `;

    const infoResult = await pool.query(infoQuery, infoValues);

    if (infoResult.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Employee not found" });
    }

    // Get government_id_numbers_id for the employee
    const idCheck = await pool.query(
      "SELECT government_id_numbers_id FROM employees WHERE employee_id = $1",
      [id]
    );
    const governmentIdNumbersId = idCheck.rows[0]?.government_id_numbers_id;

    const idKeys = Object.keys(idUpdates || {});
    if (idKeys.length > 0) {
      const idSetClause = idKeys
        .map((key, i) => `${key} = $${i + 1}`)
        .join(", ");
      const idValues = [...Object.values(idUpdates), governmentIdNumbersId];

      if (!governmentIdNumbersId) {
        // Handle case where government_id_numbers_id is not found
        console.error("Government ID Numbers ID not found");
        return res.status(404).json({ success: false, message: "Not found" });
      }

      const idQuery = `
        UPDATE government_id_numbers
        SET ${idSetClause}
        WHERE government_id_numbers_id = $${idValues.length}
        RETURNING *
      `;

      await pool.query(idQuery, idValues);
    }

    res.status(200).json({ success: true, result: infoResult.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM employees WHERE employee_id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Employee not found" });
    }

    res.status(200).json({ success: true, result: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const uploadOwnAvatar = async (req, res) => {
  try {
    const { avatar } = req.file;
    const { employee_id } = req.user;

    if (!file) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    }

    // Upload to Supabase
    const { data, error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(`public/${Date.now()}_${avatar.originalname}`, avatar.buffer, {
        cacheControl: "3600",
        upsert: false,
        contentType: avatar.mimetype,
      });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      return res
        .status(500)
        .json({ success: false, message: "Error uploading file" });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(data.path);

    const avatar_url = urlData.publicUrl;

    // Update employee record
    const result = await pool.query(
      "UPDATE employees SET avatar_url = $1 WHERE employee_id = $2 RETURNING *",
      [avatar_url, employee_id]
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Employee not found" });
    }

    res.status(200).json({
      success: true,
      message: "Avatar uploaded",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error uploading avatar:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const uploadAvatar = async (req, res) => {
  try {
    const { employeeId } = req.body;
    const avatar = req.file;

    if (!avatar) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    }

    // Get file extension from original filename
    const fileExtension = avatar.originalname.split(".").pop();
    const fileName = `${employeeId}.${fileExtension}`; // Add extension!

    console.log("Avatar to be uploaded:", {
      originalname: avatar.originalname,
      mimetype: avatar.mimetype,
      size: avatar.size,
      fileName: fileName,
    });

    // Upload to Supabase with proper filename
    const { data, error: uploadError } = await supabase.storage
      .from("hrms")
      .upload(`avatars/${fileName}`, avatar.buffer, {
        cacheControl: "0",
        upsert: true,
        contentType: avatar.mimetype,
      });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      return res
        .status(500)
        .json({ success: false, message: "Error uploading file" });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("hrms")
      .getPublicUrl(data.path);

    const avatar_url = urlData.publicUrl + "?t=" + Date.now(); // Cache busting

    console.log("Generated avatar URL:", avatar_url); // Debug log

    // Update employee record
    const result = await pool.query(
      "UPDATE employees SET avatar_url = $1 WHERE employee_id = $2 RETURNING *",
      [avatar_url, employeeId]
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Employee not found" });
    }

    res.status(200).json({
      success: true,
      message: "Avatar uploaded successfully",
      data: result.rows[0],
      avatar_url: avatar_url, // Return the URL for debugging
    });
  } catch (error) {
    console.error("Error uploading avatar:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteAvatar = async (req, res) => {
  try {
    const { employeeId } = req.params;

    // Delete from Supabase
    const { error: deleteError } = await supabase.storage
      .from("hrms")
      .remove([`avatars/${employeeId}`]);

    if (deleteError) {
      console.error("Supabase delete error:", deleteError);
      return res
        .status(500)
        .json({ success: false, message: "Error deleting file" });
    }

    // Update employee record
    const result = await pool.query(
      "UPDATE employees SET avatar_url = NULL WHERE employee_id = $1 RETURNING *",
      [employeeId]
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Employee not found" });
    }

    res.status(200).json({
      success: true,
      message: "Avatar deleted successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error deleting avatar:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
