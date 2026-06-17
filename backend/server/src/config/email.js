import nodemailer from 'nodemailer';

let transporter;

const isPlaceholder = (value) => {
  if (!value) return true;
  const lowered = value.toLowerCase();
  return lowered.includes('example') || lowered.includes('password') || lowered.includes('secret');
};

export const getEmailTransporter = () => {
  if (transporter) {
    return transporter;
  }

  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (isPlaceholder(user) || isPlaceholder(pass)) {
    console.warn('Email transport disabled: provide EMAIL_USER and EMAIL_PASS to send real emails.');
    return null;
  }

  const host = process.env.EMAIL_HOST;
  const port = process.env.EMAIL_PORT ? Number(process.env.EMAIL_PORT) : undefined;
  const secure = process.env.EMAIL_SECURE === 'true';

  if (host) {
    transporter = nodemailer.createTransport({
      host,
      port: port || 587,
      secure,
      auth: { user, pass }
    });
    return transporter;
  }

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user,
      pass
    }
  });

  return transporter;
};
