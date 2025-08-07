import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { logoutUser } from "../controllers/userController.js";
dotenv.config();

const verifyToken = (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "No token provided" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ success: false, message: "Invalid token" });
    }
    req.user = decoded;
    next();
  });
};

const verifyInviteToken = (req, res, next) => {
  const token = req.params.token;

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "No token provided" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (!payload.email) {
      return res
        .status(403)
        .json({ valid: false, message: "Invalid token payload" });
    }
    next();
  } catch (error) {
    return res
      .status(403)
      .json({ valid: false, message: "Invalid token", error: error.message });
  }
};

export default verifyToken;
export { verifyToken, verifyInviteToken };
