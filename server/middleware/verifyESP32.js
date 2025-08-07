import dotenv from "dotenv";
dotenv.config();

const verifyESP32 = (req, res, next) => {
  const esp32Secret = process.env.ESP32_SECRET;

  // Check if ESP32_SECRET is configured
  if (!esp32Secret) {
    console.error("ESP32_SECRET not configured in environment variables");
    return res.status(500).json({
      success: false,
      message: "Server configuration error",
    });
  }

  // Express normalizes headers to lowercase, so use "authorization" not "Authorization"
  const authHeader = req.headers["authorization"];

  // More robust header validation
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: "Authorization header required",
    });
  }

  // Check Bearer token format
  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Invalid authorization format. Use: Bearer <token>",
    });
  }

  // Extract and verify the token
  const token = authHeader.substring(7); // Remove "Bearer " prefix
  if (token !== esp32Secret) {
    return res.status(403).json({
      success: false,
      message: "Invalid ESP32 credentials",
    });
  }

  next();
};

export default verifyESP32;
