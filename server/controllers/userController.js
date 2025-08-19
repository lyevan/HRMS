import { pool } from "../config/db.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
import bcrypt from "bcryptjs";
import cookieParser from "cookie-parser";
import { sendOTPEmail } from "./emailController.js";

export const getAllUsers = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM users ORDER BY created_at DESC"
    );
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUser = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyUser = async (req, res) => {
  try {
    // req.user contains the JWT payload: { id, username, role }
    const { id: employee_id, username } = req.user;

    // Always fetch fresh user data from database to ensure current role
    const result = await pool.query(
      "SELECT employee_id, username, email, role, created_at, updated_at FROM users WHERE employee_id = $1 AND username = $2",
      [employee_id, username]
    );

    if (result.rows.length === 0) {
      // User not found in database - token is invalid
      return res.status(401).json({
        success: false,
        message: "User not found in database",
      });
    }

    const dbUser = result.rows[0];

    // Check if the role in JWT matches the role in database
    if (req.user.role !== dbUser.role) {
      // Role mismatch - someone may have changed user role or token is stale
      return res.status(403).json({
        success: false,
        message: "Role mismatch detected. Please login again.",
        requiresReauth: true,
      });
    }

    // Optional: Check if user account is still active (if you have an active field)
    // if (dbUser.status !== 'active') {
    //   return res.status(403).json({
    //     success: false,
    //     message: "User account is inactive"
    //   });
    // }

    // Return fresh user data from database (not from JWT)
    res.status(200).json({
      success: true,
      user: {
        employee_id: dbUser.employee_id,
        username: dbUser.username,
        email: dbUser.email,
        role: dbUser.role,
        created_at: dbUser.created_at,
        updated_at: dbUser.updated_at,
      },
    });
  } catch (error) {
    console.log("Verification error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Verification failed",
      error: error.message,
    });
  }
};

export const createUser = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    const requiredFields = { username, email, password, role };
    const missingFields = Object.entries(requiredFields)
      .filter(([_, value]) => !value)
      .map(([key]) => key);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      "CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, username VARCHAR(50) NOT NULL, email VARCHAR(100) NOT NULL UNIQUE, password VARCHAR(100) NOT NULL, role VARCHAR(50) NOT NULL, created_at TIMESTAMP DEFAULT NOW());"
    );

    const result = await pool.query(
      "INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING *",
      [username, email, hashedPassword, role]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, role } = req.body;

    const result = await pool.query(
      "UPDATE users SET username = $1, email = $2, role = $3 WHERE id = $4 RETURNING *",
      [username, email, role, id]
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "DELETE FROM users WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const logoutUser = (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
    });
    res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required",
      });
    }

    const result = await pool.query("SELECT * FROM users WHERE username = $1", [
      username,
    ]);

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const user = result.rows[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log(
        "Someone tried to login with invalid credentials: Username:",
        username ? username : "Unknown"
      );
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }
    const payload = {
      id: user.employee_id,
      username: user.username,
      role: user.role,
    };

    // Only log payload in development for security
    if (process.env.NODE_ENV === "development") {
      console.log("Login payload:", payload);
    }

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRATION,
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // HTTPS in production
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // More secure in production
      maxAge: process.env.COOKIE_EXPIRATION, // 7 days
      path: "/", // Available on all routes
      domain: process.env.NODE_ENV === "production" ? undefined : undefined, // Let browser handle domain
    });

    // Return user object that matches what verify endpoint returns
    res.status(200).json({
      success: true,
      user: {
        employee_id: user.employee_id,
        username: user.username,
        email: user.email,
        role: user.role,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
    console.log("Login error:", error.message);
  }
};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // Generates a 6-digit OTP
};

export const sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    // Check if user exists with this email
    const userResult = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No account found with this email address",
      });
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Store OTP in database (create table if not exists)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS otps (
        id SERIAL PRIMARY KEY,
        email VARCHAR(100) NOT NULL,
        otp VARCHAR(6) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Delete any existing OTPs for this email
    await pool.query("DELETE FROM otps WHERE email = $1", [email]);

    // Store new OTP
    await pool.query(
      "INSERT INTO otps (email, otp, expires_at) VALUES ($1, $2, $3)",
      [email, otp, expiresAt]
    );

    // Send OTP email
    const emailResult = await sendOTPEmail({ to: email, otp });

    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        message: "Failed to send OTP email",
        error: emailResult.error,
      });
    }

    // Don't send OTP in response for security reasons
    res.status(200).json({
      success: true,
      message: "OTP sent successfully to your email",
      expiresIn: "10 minutes",
    });
  } catch (error) {
    console.error("Send OTP error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyOTPAndLogin = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    // Check if OTP exists and is valid
    const otpResult = await pool.query(
      "SELECT * FROM otps WHERE email = $1 AND otp = $2 AND used = FALSE AND expires_at > NOW()",
      [email, otp]
    );

    if (otpResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    // Mark OTP as used
    await pool.query(
      "UPDATE otps SET used = TRUE WHERE email = $1 AND otp = $2",
      [email, otp]
    );

    // Get user details
    const userResult = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const user = userResult.rows[0];

    // Create JWT payload (same as login function)
    const payload = {
      id: user.employee_id,
      username: user.username,
      role: user.role,
    };

    console.log("OTP Login payload:", payload);

    // Generate JWT token (same as login function)
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRATION,
    }); // Set cookie (same as login function)
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: process.env.COOKIE_EXPIRATION,
      path: "/",
    });

    // Return user object (same format as login function)
    res.status(200).json({
      success: true,
      message: "Login successful via OTP",
      user: {
        employee_id: user.employee_id,
        username: user.username,
        email: user.email,
        role: user.role,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
    });
  } catch (error) {
    console.error("OTP verification error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// User schema is
// {
//   id: integer,
//   username: string,
//   email: string,
//   password: string,
//   role: string,
//   created_at: timestamp,
//   updated_at: timestamp
// }
