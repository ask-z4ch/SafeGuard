import { getEmailTransporter } from '../config/email.js';

export const sendVerificationEmail = async ({ to, name, verificationUrl }) => {
  const transporter = getEmailTransporter();

  if (!transporter) {
    console.info(`Skipping verification email for ${to}; transporter not configured. Link: ${verificationUrl}`);
    return;
  }

  const message = {
    to,
    from: `Safeguard <${process.env.EMAIL_USER}>`,
    subject: 'Verify your Safeguard account',
    html: `<p>Hi ${name},</p>
           <p>Thanks for signing up. Please verify your email by clicking the link below:</p>
           <p><a href="${verificationUrl}">${verificationUrl}</a></p>
           <p>If you did not request this, you can ignore this message.</p>`
  };

  await transporter.sendMail(message);
};
