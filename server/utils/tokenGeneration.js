import jwt from "jsonwebtoken";

export const generateInviteToken = (email) => {
  return jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "1d" });
};
