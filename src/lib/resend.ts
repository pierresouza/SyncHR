/**
 * Email Client (Nodemailer via Gmail SMTP)
 * Substitui o Resend mantendo a mesma interface sendEmail({ to, subject, html })
 */

import nodemailer from 'nodemailer';

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    console.warn('[Nodemailer] Credenciais Gmail não configuradas (GMAIL_USER / GMAIL_APP_PASSWORD). E-mail não enviado.');
    return { success: false, error: 'Credenciais de e-mail não configuradas.' };
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    });

    const info = await transporter.sendMail({
      from: `SyncHR <${user}>`,
      to,
      subject,
      html,
    });

    console.log('[Nodemailer] E-mail enviado com sucesso:', info.messageId);
    return { success: true, id: info.messageId };
  } catch (err: any) {
    console.error('[Nodemailer Error]:', err);
    return { success: false, error: err.message };
  }
}
