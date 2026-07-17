import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const { id, email, type } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "Parâmetro 'id' ausente." }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    if (type === 'LEADER') {
      // 1. Deletar do banco profiles
      const { error: profileErr } = await supabaseAdmin
        .from('profiles')
        .delete()
        .eq('id', id);

      if (profileErr) throw profileErr;

      // 2. Deletar da autenticação Supabase Auth
      try {
        await supabaseAdmin.auth.admin.deleteUser(id);
      } catch (authErr) {
        console.warn("Erro ou usuário inexistente no Supabase Auth:", authErr);
      }
    } else if (type === 'COLLABORATOR') {
      // 1. Obter e-mail se não fornecido
      let colabEmail = email;
      if (!colabEmail) {
        const { data: colab } = await supabaseAdmin
          .from('collaborators')
          .select('email')
          .eq('id', id)
          .single();
        if (colab) {
          colabEmail = colab.email;
        }
      }

      // 2. Deletar da tabela de colaboradores
      const { error: colabErr } = await supabaseAdmin
        .from('collaborators')
        .delete()
        .eq('id', id);

      if (colabErr) throw colabErr;

      // 3. Remover profile e auth.users se o liderado tiver se auto-registrado
      if (colabEmail) {
        const emailLower = colabEmail.toLowerCase().trim();
        
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('email', emailLower)
          .single();

        if (profile) {
          await supabaseAdmin.from('profiles').delete().eq('id', profile.id);
          try {
            await supabaseAdmin.auth.admin.deleteUser(profile.id);
          } catch (authErr) {
            console.warn("Erro ou usuário inexistente no Supabase Auth para colaborador:", authErr);
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[API Delete User Error]:", error);
    return NextResponse.json({ error: error.message || "Erro ao excluir usuário." }, { status: 500 });
  }
}
