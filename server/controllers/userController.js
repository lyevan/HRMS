import { pool } from "../config/db.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
import bcrypt from "bcryptjs";
import cookieParser from "cookie-parser";

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
      "SELECT id, employee_id, username, email, role, created_at, updated_at FROM users WHERE employee_id = $1 AND username = $2",
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
        id: dbUser.id,
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
      sameSite: "lax",
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

    console.log(payload);

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRATION,
    });
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // HTTPS in production
      sameSite: "lax", // CSRF protection
      maxAge: process.env.COOKIE_EXPIRATION, // 7 days
      path: "/", // Available on all routes
    });

    // Return user object that matches what verify endpoint returns
    res.status(200).json({
      success: true,
      user: {
        id: user.id,
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
