import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import dotenv from "dotenv";
import userRoutes from "./routes/userRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import invitationRoutes from "./routes/invitationRoutes.js";
import departmentRoutes from "./routes/departmentRoutes.js";
import rfidRoutes from "./routes/rfidRoutes.js";
import cookieParser from "cookie-parser";
import { initDB } from "./config/db.js";
import { pool } from "./config/db.js";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.json());
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(helmet()); // For security (HTTP Headers)
app.use(morgan("dev")); // For request logging
app.use(cookieParser()); // For parsing cookies

app.get("/", (req, res) => {
  res.send("Hello from the backend");
});

app.use("/api/rfid", rfidRoutes);
app.use("/api/users", userRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/invite", invitationRoutes);
app.use("/api/departments", departmentRoutes);

app.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW() as current_time");
    res.json({
      success: true,
      message: "Database connected successfully",
      time: result.rows[0].current_time,
      host: process.env.PGHOST,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Database connection failed",
      error: error.message,
    });
  }
});

initDB().then(() => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log("Server running on port:", PORT);
  });
});
