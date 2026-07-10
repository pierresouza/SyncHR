'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Calendar, Lock, Mail, FileText, ArrowLeft } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4 md:p-8 font-sans bg-slate-950 text-slate-100 selection:bg-indigo-650 selection:text-white">
      <div className="max-w-3xl w-full glass-card p-6 md:p-10 rounded-3xl border border-slate-800 bg-slate-900/10 backdrop-blur-md shadow-2xl relative z-10 space-y-8 my-8">
        
        {/* Header */}
        <div className="space-y-3">
          <Link 
            href="/login" 
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-all font-mono uppercase tracking-wider group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-all" /> Voltar ao Login
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-200">
              Política de Privacidade
            </h1>
          </div>
          <p className="text-xs text-slate-500 font-mono">Última atualização: 10 de Julho de 2026</p>
        </div>

        {/* Content Blocks */}
        <div className="space-y-6 text-sm text-slate-400 leading-relaxed font-sans border-t border-slate-900 pt-6">
          <p>
            O <strong>SyncHR Smart Leading</strong> (acessível em <a href="https://synchr.tech" className="text-indigo-400 hover:underline">https://synchr.tech</a>) valoriza a sua privacidade. Esta política de privacidade descreve como coletamos, usamos e protegemos as informações fornecidas através da integração OAuth do Google para viabilizar as chamadas de videoconferência.
          </p>

          {/* Item 1 */}
          <div className="space-y-2.5">
            <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-400" />
              1. Uso de Dados do Google Calendar e Google Meet
            </h3>
            <p>
              Ao realizar a autenticação utilizando a sua Conta do Google corporativa, nosso aplicativo solicita a permissão de acesso ao escopo <code>calendar.events</code>. 
            </p>
            <p className="pl-6 border-l border-slate-900">
              <strong>Finalidade Única:</strong> Esta permissão é utilizada exclusivamente para registrar os eventos de reuniões de alinhamento 1:1 agendados no painel do SyncHR diretamente no seu Google Calendar e gerar a sala de reunião oficial correspondente do <strong>Google Meet</strong>.
            </p>
          </div>

          {/* Item 2 */}
          <div className="space-y-2.5">
            <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
              <Lock className="w-4 h-4 text-indigo-400" />
              2. Armazenamento e Segurança
            </h3>
            <p>
              Nós **não armazenamos** suas senhas da conta Google, tokens de atualização ou quaisquer dados pessoais sensíveis da sua conta do Google em nosso banco de dados. 
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>O token de acesso (Access Token) gerado pelo Supabase durante o login do Google é mantido na sua sessão local de navegador criptografada.</li>
              <li>A comunicação com a API do Google Calendar ocorre de forma segura via HTTPS.</li>
            </ul>
          </div>

          {/* Item 3 */}
          <div className="space-y-2.5">
            <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              3. Compartilhamento de Dados
            </h3>
            <p>
              O SyncHR possui políticas rígidas de não comercialização. Nós **nunca** compartilhamos, vendemos, alugamos ou distribuímos quaisquer dados ou permissões obtidas do Google para terceiros ou parceiros externos.
            </p>
          </div>

          {/* Item 4 */}
          <div className="space-y-2.5">
            <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
              <Mail className="w-4 h-4 text-indigo-400" />
              4. Contato e Esclarecimento de Dúvidas
            </h3>
            <p>
              Se você tiver dúvidas sobre como tratamos seus dados ou quiser solicitar a revogação de acessos, entre em contato diretamente com o administrador do sistema:
            </p>
            <p className="pl-6 border-l border-slate-900 font-mono text-xs">
              <strong>Administrador:</strong> Pierre Souza<br />
              <strong>E-mail:</strong> herouserpierre@gmail.com
            </p>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-[10px] text-slate-600 font-mono pt-4 border-t border-slate-900">
          SyncHR © 2026 - Desenvolvido por Clear IT para inteligência organizacional e mediação de lideranças.
        </div>

      </div>
    </main>
  );
}
