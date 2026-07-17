import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/resend";

export async function POST(request: Request) {
  try {
    const { name, email, password, role = "LEADER" } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Parametros ausentes (name, email, password)." }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Verificar se já existe um usuário no Auth com este e-mail e removê-lo (órfão de tentativa anterior)
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const orphanAuthUser = existingUsers?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
    if (orphanAuthUser) {
      await supabaseAdmin.auth.admin.deleteUser(orphanAuthUser.id);
      // Também remove o perfil órfão associado
      await supabaseAdmin.from('profiles').delete().eq('id', orphanAuthUser.id);
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role, profile: role === 'RH' ? 'ADMINISTRADOR' : 'PENDENTE' }
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // Remover qualquer perfil com mesmo e-mail que possa ter sobrado
    await supabaseAdmin.from('profiles').delete().eq('email', email).neq('id', authData.user.id);

    // Criar perfil vinculado ao novo auth user
    const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
      id: authData.user.id,
      email,
      name,
      role,
      profile_type: role === 'RH' ? 'ADMINISTRADOR' : 'PENDENTE',
      level_from: 'Coordenador',
      level_to: 'Gerente'
    }, { onConflict: 'id' });

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    const appUrl = "https://synchr.tech";
    await sendEmail({
      to: email,
      subject: "[SyncHR] Seu acesso foi criado",
      html: `
        <div style="font-family:sans-serif;max-width:540px;margin:0 auto;background:#0f172a;color:#e2e8f0;padding:32px;border-radius:12px;">
          <h2 style="color:#818cf8;margin-bottom:4px;">SyncHR</h2>
          <p style="color:#64748b;font-size:12px;margin-top:0;">Plataforma de Lideranca Inteligente - Clear IT Brasil</p>
          <hr style="border-color:#1e293b;margin:24px 0;" />
          <h3 style="color:#f1f5f9;">Ola, ${name}!</h3>
          <p style="color:#94a3b8;">O RH da sua empresa criou o seu acesso a plataforma <strong style="color:#e2e8f0;">SyncHR</strong>.</p>
          <div style="background:#1e293b;border-radius:8px;padding:20px;margin:24px 0;">
            <p style="margin:0 0 8px 0;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Suas Credenciais de Acesso</p>
            <p style="margin:4px 0;color:#e2e8f0;"><strong>E-mail:</strong> ${email}</p>
            <p style="margin:4px 0;color:#e2e8f0;"><strong>Senha temporaria:</strong> ${password}</p>
          </div>
          <a href="${appUrl}/login" style="display:inline-block;background:#4f46e5;color:white;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:bold;">
            Acessar o SyncHR
          </a>
          <p style="color:#475569;font-size:12px;margin-top:24px;">Recomendamos que altere sua senha apos o primeiro acesso.</p>
        </div>
      `
    });

    return NextResponse.json({ success: true, userId: authData.user.id });
  } catch (error: any) {
    console.error("[API Create User Error]:", error);
    return NextResponse.json({ error: error.message || "Erro ao criar usuario." }, { status: 500 });
  }
}
