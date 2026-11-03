import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let transport;

function getTransport() {
  if (!env.smtpConfigured) throw new Error('Transactional email is not configured.');
  if (!transport) {
    transport = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      requireTLS: env.SMTP_PORT !== 465,
      ...(env.SMTP_USER ? { auth: { user: env.SMTP_USER, pass: env.SMTP_PASS } } : {}),
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
    });
  }
  return transport;
}

export async function sendActionEmail({ to, subject, text, html }) {
  await getTransport().sendMail({ from: env.SMTP_FROM, to, subject, text, html });
}
