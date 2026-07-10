import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/resend';

export async function POST(request: Request) {
  try {
    const { to, subject, html } = await request.json();

    if (!to || !subject || !html) {
      return NextResponse.json({ error: 'Parâmetros ausentes (to, subject, html são obrigatórios).' }, { status: 400 });
    }

    const result = await sendEmail({ to, subject, html });
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: result.id });
  } catch (error: any) {
    console.error('[API Send Email Error]:', error);
    return NextResponse.json({ error: error.message || 'Falha no envio de e-mail.' }, { status: 500 });
  }
}
