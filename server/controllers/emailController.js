import nodemailer from "nodemailer";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import OnboardingTemplate from "../templates/OnboardingTemplate.js";
import InvitationTemplate from "../templates/InvitationTemplate.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const company_name = process.env.COMPANY_NAME || "Your Company";

const baseEmail = async ({ to, subject, html }) => {
  const transport = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"${company_name}" <${process.env.GMAIL_USER}>`,
    replyTo: `noreply@${company_name}.com`,
    to,
    subject: subject,
    html: html,
    attachments: [
      {
        filename: "emplore-light.png",
        path: path.join(__dirname, "../assets/images/emplore-light.png"),
        cid: "companylogo",
      },
    ],
  };

  const result = await transport.sendMail(mailOptions);
  return result;
};

const sendOnboardingEmail = async ({
  to,
  first_name,
  employee_id,
  username,
  position,
  company_name,
}) => {
  try {
    const result = await baseEmail({
      to,
      subject: `Welcome to ${company_name}!`,
      html: OnboardingTemplate({
        first_name,
        employee_id,
        username,
        position,
        company_name,
        portal_url: process.env.FRONTEND_URL || "http://localhost:5173",
      }),
    });
    console.log("Onboarding email sent successfully to:", to);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error("Error sending onboarding email:", error);
    return { success: false, error: error.message };
  }
};

const sendInvitationEmail = async ({ to, url }) => {
  try {
    const result = await baseEmail({
      to,
      subject: `Invitation from ${company_name}!`,
      html: InvitationTemplate({
        company_name,
        url,
      }),
    });
    console.log("Invitation email sent successfully to:", to);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error("Error sending invitation email:", error);
    return { success: false, error: error.message };
  }
};

export { sendOnboardingEmail, sendInvitationEmail };
