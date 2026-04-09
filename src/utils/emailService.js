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

/**
 * Send welcome email to new members
 * @param {string} toEmail - Recipient email
 * @param {string} name - Recipient name
 */
// export const sendWelcomeEmail = async (toEmail, name) => {
//   const mailOptions = {
//     from: smtpFrom,
//     to: toEmail,
//     subject: "Welcome to Janhit Party Membership",
//     html: `
//       <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
//         <h2 style="color: #0066cc;">Welcome to Janhit Party, ${name}!</h2>
//         <p>Thank you for registering as a member of Janhit Party.</p>
//         <p>We appreciate your support and look forward to working together for a better future.</p>
//         <br />
//         <p>Best regards,<br/>Janhit Party Team</p>
//         <hr />
//         <p style="font-size: 12px; color: #666;">This is an automated message. Please do not reply.</p>
//       </div>
//     `,
//   };

//   try {
//     const info = await transporter.sendMail(mailOptions);
//     console.log(`Email sent to ${toEmail}: ${info.messageId}`);
//     return info;
//   } catch (error) {
//     console.error("Failed to send email:", error);
//     throw new Error("Email sending failed");
//   }
// };

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
