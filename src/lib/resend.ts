/**
 * Resend Integration Client (Dependency-Free using fetch)
 */

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  const apiKey = process.env.RESEND_API_KEY;
  
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        from: 'SyncHR <no-reply@synchr.tech>',
        to: [to],
        subject,
        html
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Erro ao enviar e-mail via Resend.');
    }

    return { success: true, id: data.id };
  } catch (err: any) {
    console.error('[Resend API Error]:', err);
    return { success: false, error: err.message };
  }
}
