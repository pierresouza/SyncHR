/**
 * Email Dispatcher Service
 * Isolates and cleans up all email dispatch operations.
 * Supports Pipedream webhook triggers or standard backend SMTP/Nodemailer routing.
 */

// Helper to send a request to the backend send-email endpoint
async function callSendEmailApi(to: string, subject: string, html: string) {
  try {
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, html })
    });
    const result = await res.json();
    return result;
  } catch (err) {
    console.error('[emailService Error]:', err);
    return { success: false, error: err };
  }
}

/**
 * 1. Sends critical conflict alerts to the RH (Priscila)
 */
export async function sendRHConflictAlertEmail(params: {
  colabName: string;
  colabRole: string;
  leaderName: string;
  date: string;
  protocol: string;
  details: string;
}) {
  const { colabName, colabRole, leaderName, date, protocol, details } = params;
  const rhEmail = 'rh.priscila@clearit.com.br';
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 2px solid #dc2626; border-radius: 12px; background-color: #fef2f2; color: #991b1b;">
      <h2 style="color: #dc2626; margin-top: 0;">🚨 Alerta Crítico: Atrito / Conflito Detectado</h2>
      <p>Olá Priscila (RH),</p>
      <p>O SyncHR AI Auditor identificado um **desalinhamento grave ou potencial conflito** em uma reunião de 1:1 realizada recentemente.</p>
      <div style="background-color: #ffffff; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #fee2e2; color: #1e293b;">
        <p style="margin: 5px 0;"><strong>Protocolo:</strong> <code>${protocol}</code></p>
        <p style="margin: 5px 0;"><strong>Colaborador:</strong> ${colabName} (${colabRole})</p>
        <p style="margin: 5px 0;"><strong>Gestor:</strong> ${leaderName}</p>
        <p style="margin: 5px 0;"><strong>Data:</strong> ${date}</p>
        <p style="margin: 10px 0 5px 0;"><strong>Análise da Consistência:</strong></p>
        <p style="margin: 5px 0; font-style: italic; color: #475569;">"${details}"</p>
      </div>
      <p>Por favor, acesse o Painel do RH na plataforma para mediar esta ocorrência.</p>
      <hr style="border: 0; border-top: 1px solid #fee2e2; margin: 25px 0;" />
      <p style="font-size: 11px; color: #991b1b; margin-bottom: 0;">Este é um alerta crítico de conformidade corporativa enviado automaticamente pelo SyncHR via integração Pipedream.</p>
    </div>
  `;
  return callSendEmailApi(rhEmail, `🚨 ALERTA CRÍTICO: Conflito de 1:1 - ${colabName}`, html);
}

/**
 * 2. Sends meeting invites (Google Meet / Calendar) to collaborators
 */
export async function sendCollaboratorInviteEmail(params: {
  colabEmail: string;
  colabName: string;
  leaderName: string;
  formattedDateTime: string;
  meetingDuration: number;
  meetLinkUrl: string;
  isGoogleMeetReal: boolean;
}) {
  const { colabEmail, colabName, leaderName, formattedDateTime, meetingDuration, meetLinkUrl, isGoogleMeetReal } = params;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #1e293b;">
      <h2 style="color: #4f46e5; margin-top: 0;">Convite de Reunião 1:1</h2>
      <p>Olá <strong>${colabName}</strong>,</p>
      <p>Seu gestor <strong>${leaderName}</strong> agendou uma reunião individual de 1:1 com você.</p>
      <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
        <p style="margin: 5px 0;"><strong>Data / Hora:</strong> ${formattedDateTime}</p>
        <p style="margin: 5px 0;"><strong>Duração:</strong> ${meetingDuration} minutos</p>
        <p style="margin: 10px 0 5px 0;"><strong>Link da Reunião (Google Meet):</strong> <a href="${meetLinkUrl}" target="_blank" style="color: #4f46e5; font-weight: bold; text-decoration: underline;">Entrar no Google Meet</a></p>
      </div>
      ${!isGoogleMeetReal ? `<p style="font-size: 12px; color: #b45309; background-color: #fffbeb; padding: 10px; border-radius: 6px; border: 1px solid #fef3c7;">⚠️ <strong>Nota sobre Transcrição:</strong> Esta reunião foi gerada com um link simulado do Google Meet. Para obter a gravação e a captura automática de transcrição via e-mail pelo SyncHR, o gestor precisa estar logado com a conta Google corporativa autorizada no sistema.</p>` : ''}
      <p>Por favor, acesse o link no horário combinado. Nos vemos lá!</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 25px 0;" />
      <p style="font-size: 11px; color: #64748b; margin-bottom: 0;">Este é um e-mail automático gerado pelo ecossistema SyncHR Smart Leading da Clear IT.</p>
    </div>
  `;
  return callSendEmailApi(colabEmail, `Convite 1:1: ${leaderName} & ${colabName} (${formattedDateTime})`, html);
}

/**
 * 3. Sends sign-off requests to collaborators with the feedback link
 */
export async function sendCollaboratorSignOffRequestEmail(params: {
  colabEmail: string;
  colabName: string;
  leaderName: string;
  feedbackLink: string;
}) {
  const { colabEmail, colabName, leaderName, feedbackLink } = params;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #1e293b;">
      <h2 style="color: #4f46e5; margin-top: 0;">SyncHR - Validação de Reunião 1:1</h2>
      <p>Olá <strong>${colabName}</strong>,</p>
      <p>Sua reunião individual de 1:1 com o gestor <strong>${leaderName}</strong> foi concluída e a ata preliminar foi gerada.</p>
      <p>Para ler a pauta, tarefas Kanban acordadas e registrar o seu parecer e consentimento digital, por favor acesse a página de validação bilateral no link abaixo:</p>
      <div style="text-align: center; margin: 25px 0;">
        <a href="${feedbackLink}" target="_blank" style="background-color: #4f46e5; color: #ffffff; font-weight: bold; text-decoration: none; padding: 12px 24px; border-radius: 8px; display: inline-block;">Visualizar e Assinar Ata</a>
      </div>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 25px 0;" />
      <p style="font-size: 11px; color: #64748b; margin-bottom: 0;">Este é um e-mail automático enviado de forma segura sob conformidade da LGPD pelo ecossistema SyncHR.</p>
    </div>
  `;
  return callSendEmailApi(colabEmail, `SyncHR: Assine sua ata de 1:1 com ${leaderName}`, html);
}

/**
 * 4. Sends welcome emails to newly registered collaborators
 */
export async function sendCollaboratorWelcomeEmail(params: {
  colabEmail: string;
  colabName: string;
}) {
  const { colabEmail, colabName } = params;
  const html = `
    <div style="font-family:sans-serif;max-width:540px;margin:0 auto;background:#0f172a;color:#e2e8f0;padding:32px;border-radius:12px;">
      <h2 style="color:#818cf8;margin-bottom:4px;">SyncHR</h2>
      <p style="color:#64748b;font-size:12px;margin-top:0;">Plataforma de Liderança Inteligente · Clear IT Brasil</p>
      <hr style="border-color:#1e293b;margin:24px 0;" />
      <h3 style="color:#f1f5f9;">Olá, ${colabName}! 👋</h3>
      <p style="color:#94a3b8;">
        Você foi cadastrada(o) na plataforma <strong style="color:#e2e8f0;">SyncHR</strong> como parte do programa de desenvolvimento de liderança da sua empresa.
      </p>
      <div style="background:#1e293b;border-radius:8px;padding:20px;margin:24px 0;">
        <p style="margin:0 0 8px 0;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:1px;">O que é o SyncHR?</p>
        <p style="margin:4px 0;color:#94a3b8;font-size:14px;">
          Uma plataforma que estrutura as reuniões 1:1 entre você e seu gestor, garantindo que as conversas sejam produtivas, documentadas e transparentes.
        </p>
      </div>
      <p style="color:#94a3b8;">
        Em breve você receberá um convite de reunião do seu líder com a pauta preparada especialmente para você. Após a reunião, um link de feedback chegará neste e-mail para que você registre sua opinião sobre a conversa.
      </p>
      <p style="color:#475569;font-size:12px;margin-top:24px;">Qualquer dúvida, fale com o RH da sua empresa.</p>
    </div>
  `;
  return callSendEmailApi(colabEmail, '[SyncHR] Você foi cadastrada(o) na plataforma de desenvolvimento', html);
}
