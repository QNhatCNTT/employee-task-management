import nodemailer from 'nodemailer';
import { envConfig } from '../config/env-config';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: envConfig.EMAIL_USER,
    pass: envConfig.EMAIL_PASS, // Gmail App Password
  },
});

export const sendInvitationEmail = async (
  to: string,
  employeeName: string,
  setupToken: string
): Promise<void> => {
  const setupUrl = `${envConfig.FRONTEND_URL}/setup?token=${setupToken}`;

  await transporter.sendMail({
    from: envConfig.EMAIL_USER,
    to,
    subject: 'Welcome! Set up your account',
    html: `
      <h1>Welcome, ${employeeName}!</h1>
      <p>You have been added to the Employee Task Management System.</p>
      <p>Click the link below to set up your account:</p>
      <a href="${setupUrl}">${setupUrl}</a>
      <p>This link expires in 24 hours.</p>
    `,
  });
};

export const sendOtpEmail = async (
  to: string,
  otp: string
): Promise<void> => {
  await transporter.sendMail({
    from: envConfig.EMAIL_USER,
    to,
    subject: 'Your Login Code',
    html: `
      <h1>Your Login Code</h1>
      <p>Your access code is: <strong>${otp}</strong></p>
      <p>This code expires in 5 minutes.</p>
    `,
  });
};
