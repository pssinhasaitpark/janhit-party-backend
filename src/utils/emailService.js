import nodemailer from "nodemailer";

// Get and trim credentials
const smtpUser = (process.env.SMTP_USER || "").trim();
const smtpPass = (process.env.SMTP_PASS || "")
  .trim()
  .replace(/^["']|["']$/g, "");
const smtpHost = (process.env.SMTP_HOST || "smtp.gmail.com").trim();
const smtpPort = parseInt(process.env.SMTP_PORT) || 587;

// Verify environment variables are loaded
if (!smtpUser || !smtpPass) {
  console.warn("Warning: SMTP credentials are missing. Check your .env file.");
  console.warn(
    `SMTP_USER: ${smtpUser ? "✓" : "✗"}, SMTP_PASS: ${smtpPass ? "✓" : "✗"}`,
  );
}

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpPort === 465,
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
});

export const sendWelcomeEmail = async (toEmail, name) => {
  const mailOptions = {
    from: `"Janhit Party" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: "Welcome to Janhit Party Membership",
    html: `
      <h3>Dear ${name},</h3>
      <p>Thank you for registering as a member of Janhit Party.</p>
      <p>We appreciate your support and look forward to working together.</p>
      <br />
      <p>Best regards,<br/>Janhit Party Team</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${toEmail}`);
  } catch (error) {
    console.error("Failed to send email:", error);
    throw new Error("Email sending failed");
  }
};
