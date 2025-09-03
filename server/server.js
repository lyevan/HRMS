import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import dotenv from "dotenv";
import userRoutes from "./routes/userRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import employmentTypeRoutes from "./routes/employmentTypeRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import invitationRoutes from "./routes/invitationRoutes.js";
import departmentRoutes from "./routes/departmentRoutes.js";
import positionRoutes from "./routes/positionRoutes.js";
import rfidRoutes from "./routes/rfidRoutes.js";
import cookieParser from "cookie-parser";
import { initDB } from "./config/db.js";
import { pool } from "./config/db.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Simple CORS configuration that works reliably on Vercel
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    "https://relyant-demo-client.vercel.app",
    "http://localhost:5173",
    "http://192.168.0.109:5173",
    process.env.FRONTEND_URL,
  ].filter(Boolean);

  // console.log(`🔍 Request from origin: ${origin}`);
  // console.log(`📋 Allowed origins: ${allowedOrigins.join(", ")}`);
  // Set CORS headers for allowed origins only
  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
    // console.log(`✅ Origin allowed: ${origin}`);
  } else if (!origin && process.env.NODE_ENV === "development") {
    // Only allow no-origin requests in development (Postman, etc.)
    res.header("Access-Control-Allow-Origin", "*");
    // console.log(`✅ Dev mode - no origin allowed`);
  } else {
    // console.log(`❌ Origin blocked: ${origin}`);
    // Don't set CORS headers for blocked origins
  }

  res.header("Access-Control-Allow-Credentials", "true");
  res.header(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,DELETE,OPTIONS,PATCH"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type,Authorization,Cookie,X-Requested-With,Accept,Origin"
  );
  res.header("Access-Control-Max-Age", "86400");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    // console.log(`🚀 Preflight request handled for: ${origin}`);
    return res.status(200).end();
  }

  next();
});

// Other middlewares AFTER CORS
app.use(express.json());
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(morgan("dev"));
app.use(cookieParser());

// Rest of your routes...
app.get("/", (req, res) => {
  res.send("Hello from the backend");
});

app.use("/api/rfid", rfidRoutes);
app.use("/api/users", userRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/employment-types", employmentTypeRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/invite", invitationRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/positions", positionRoutes);

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

// Debug endpoint to check cookie and authentication status
app.get("/debug/auth", (req, res) => {
  const token = req.cookies?.token;
  const origin = req.headers.origin;
  const userAgent = req.headers["user-agent"];

  res.json({
    success: true,
    debug: {
      hasCookie: !!token,
      cookieValue: token ? `${token.substring(0, 10)}...` : null,
      origin: origin,
      userAgent: userAgent,
      headers: {
        cookie: req.headers.cookie
          ? req.headers.cookie.substring(0, 50) + "..."
          : null,
        authorization: req.headers.authorization || null,
      },
      environment: process.env.NODE_ENV,
      frontendUrl: process.env.FRONTEND_URL,
      timestamp: new Date().toISOString(),
    },
  });
});

// CORS test endpoint
app.get("/api/cors-test", (req, res) => {
  res.json({
    success: true,
    message: "CORS is working correctly!",
    origin: req.headers.origin,
    timestamp: new Date().toISOString(),
    corsHeaders: {
      "access-control-allow-origin": res.getHeader(
        "Access-Control-Allow-Origin"
      ),
      "access-control-allow-credentials": res.getHeader(
        "Access-Control-Allow-Credentials"
      ),
    },
  });
});

initDB().then(() => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log("Server running on port:", PORT);
  });
});
