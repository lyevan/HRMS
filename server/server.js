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
import positionRoutes from "./routes/positionRoutes.js";
import rfidRoutes from "./routes/rfidRoutes.js";
import cookieParser from "cookie-parser";
import { initDB } from "./config/db.js";
import { pool } from "./config/db.js";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.json());

// Enhanced CORS configuration for production
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);

      // In development, allow all origins
      if (process.env.NODE_ENV === "development") {
        return callback(null, true);
      }

      // In production, check against FRONTEND_URL and common variations
      const allowedOrigins = [
        process.env.FRONTEND_URL,
        // Add your actual frontend URLs here (replace with your real URLs)
        process.env.FRONTEND_URL_ALT,
        "https://your-frontend-domain.vercel.app",
        "http://localhost:5173", // Vite dev server
        "http://localhost:3000", // Common dev port
        "http://localhost:4173", // Vite preview
      ].filter(Boolean);

      console.log(
        `Checking origin: ${origin} against allowed: ${allowedOrigins.join(
          ", "
        )}`
      );

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`CORS blocked origin: ${origin}`);
        // In production, be more lenient for now to debug
        if (process.env.NODE_ENV === "production") {
          console.warn(
            "WARNING: Allowing CORS for debugging. This should be fixed in production!"
          );
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Cookie",
      "Set-Cookie",
      "Access-Control-Allow-Credentials",
      "X-Requested-With",
    ],
    exposedHeaders: ["Set-Cookie"],
    optionsSuccessStatus: 200, // For legacy browser support
  })
);

// Handle preflight requests
app.options("*", cors());
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

initDB().then(() => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log("Server running on port:", PORT);
  });
});
