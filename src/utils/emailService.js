import nodemailer from "nodemailer";
import { generateMemberPDF } from "./pdfGenerator.js";

// Get and trim credentials
const smtpUser = (process.env.SMTP_USER || "").trim();
const smtpPass = (process.env.SMTP_PASS || "").trim();
const smtpHost = (process.env.SMTP_HOST || "smtp.gmail.com").trim();
const smtpPort = parseInt(process.env.SMTP_PORT) || 587;
const smtpFrom = (
  process.env.SMTP_FROM || `"Janhit Party" <${smtpUser}>`
).trim();

// Verify environment variables are loaded
if (!smtpUser || !smtpPass) {
  console.warn("Warning: SMTP credentials are missing. Check your .env file.");
  console.warn(
    `SMTP_USER: ${smtpUser ? "✓" : "✗"}, SMTP_PASS: ${smtpPass ? "✓" : "✗"}`,
  );
}

// Create Nodemailer transporter
const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: false,
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
});

// Test transporter connection (optional, for debugging)
transporter.verify((error, success) => {
  if (error) {
    console.error("SMTP connection error:", error);
  } else {
    console.log("SMTP server is ready to take messages");
  }
});

export const sendWelcomeEmail = async (member) => {
  const pdfBuffer = await generateMemberPDF(member);
  // console.log(("pdf buffer:", pdfBuffer));

  if (!Buffer.isBuffer(pdfBuffer)) {
    throw new Error("Failed to generate membership PDF attachment");
  }

  const mailOptions = {
    from: smtpFrom,
    to: member.email,
    subject: "Welcome to Janhit Party Membership",
    html: `
      <div style="font-family: Arial; padding:20px;">
        <h2>Welcome ${member.name} 🎉</h2>
        <p>Your membership has been approved.</p>
        <p>Please find your membership card attached.</p>
      </div>
    `,
    attachments: [
      {
        filename: "membership-card.pdf",
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  };

  return await transporter.sendMail(mailOptions);
};
