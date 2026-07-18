'use client';

import React from 'react';
import { Sparkles, FileCheck, ShieldAlert } from 'lucide-react';
import { UserSession } from '@/types';

interface AboutSectionProps {
  currentUser: UserSession | null;
  handleSwitchSection: (section: any) => void;
}

export default function AboutSection({
  currentUser,
  handleSwitchSection
}: AboutSectionProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in text-left">
      <div className="text-center space-y-3">
        <span className="text-xs font-mono uppercase tracking-widest text-indigo-400 bg-indigo-950/40 border border-indigo-900/60 px-3 py-1 rounded-full">
          O Futuro da Liderança
        </span>
        <h1 className="text-3xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-slate-100 via-indigo-200 to-cyan-400 bg-clip-text text-transparent font-title leading-tight">
          SyncHR (Smart Leading)
        </h1>
        <p className="text-slate-400 text-base max-w-2xl mx-auto leading-relaxed">
          A IA que conecta o humano à performance, eliminando o achismo e as muletas burocráticas do feedback corporativo.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-2xl border border-slate-800 bg-slate-900/20 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-950 border border-indigo-800 flex items-center justify-center text-indigo-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-200">Não é uma Muleta</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            O copiloto gera apenas cheatsheets focados em pontos de ação, forçando o líder a focar na escuta ativa (regra 70/30) em vez de apenas ler textos na tela.
          </p>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-slate-800 bg-slate-900/20 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
            <FileCheck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-200">Validação Bilateral</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Toda ata exige a assinatura digital de ambas as partes (líder e liderado) após preencherem suas impressões brutas (RAW) de forma isolada.
          </p>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-slate-800 bg-slate-900/20 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-200">Consistência por IA</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            O Gemini API audita as percepções do líder vs. colaborador em tempo real. Qualquer desalinhamento de combinados acende um alerta preventivo para o RH.
          </p>
        </div>
      </div>

      <div className="glass-card p-8 rounded-3xl border border-slate-800/80 bg-slate-900/10 grid md:grid-cols-2 gap-8 items-center">
        <div className="space-y-4">
          <h3 className="text-xl md:text-2xl font-bold text-slate-100 font-title">Por que o SyncHR é Revolucionário?</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Diferente de sistemas legados de RH que tratam feedback como formulários frios salvos uma vez ao ano, o SyncHR atua de forma proativa nas reuniões cotidianas.
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            Ele cruza o estilo de liderança do gestor com o perfil comportamental DISC e a maturidade técnica (L1 a L4) do liderado, garantindo uma abordagem individualizada, segura (em conformidade com a LGPD) e persistente no banco de dados.
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => handleSwitchSection(currentUser?.role === 'RH' ? 'rh' : 'onboarding')}
              className="bg-indigo-600 hover:bg-indigo-500 text-slate-100 text-xs font-bold py-2.5 px-5 rounded-xl transition-all"
            >
              Começar a Usar
            </button>
          </div>
        </div>
        <div className="border border-slate-800 rounded-2xl bg-slate-950/60 p-5 space-y-3">
          <div className="text-xs font-mono uppercase text-indigo-400">Fluxo Organizacional</div>
          <div className="space-y-2">
            <div className="flex gap-2 items-center text-xs text-slate-300">
              <span className="w-5 h-5 rounded-full bg-indigo-950 flex items-center justify-center border border-indigo-900 text-[10px] text-indigo-400 font-bold">1</span>
              <span>O RH cadastra líderes e equipes no Supabase.</span>
            </div>
            <div className="flex gap-2 items-center text-xs text-slate-300">
              <span className="w-5 h-5 rounded-full bg-indigo-950 flex items-center justify-center border border-indigo-900 text-[10px] text-indigo-400 font-bold">2</span>
              <span>Líderes realizam onboarding e geram pautas no Gemini.</span>
            </div>
            <div className="flex gap-2 items-center text-xs text-slate-300">
              <span className="w-5 h-5 rounded-full bg-indigo-950 flex items-center justify-center border border-indigo-900 text-[10px] text-indigo-400 font-bold">3</span>
              <span>Reuniões 1:1 são gravadas com auditoria de concordância.</span>
            </div>
            <div className="flex gap-2 items-center text-xs text-slate-300">
              <span className="w-5 h-5 rounded-full bg-indigo-950 flex items-center justify-center border border-indigo-900 text-[10px] text-indigo-400 font-bold">4</span>
              <span>RH monitora a frequência e alertas de conflitos da empresa.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Seção da Equipe de Desenvolvimento */}
      <div className="border-t border-slate-900/60 pt-8 space-y-4">
        <div className="text-center md:text-left space-y-1">
          <h3 className="text-lg font-bold text-slate-100 font-title">Equipe de Desenvolvimento</h3>
          <p className="text-xs text-slate-400 font-sans">Os mentes por trás da arquitetura do ecossistema SyncHR (Clear IT).</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { name: "Pierre Souza", role: "Dev Fullstack / AI Integration", initial: "PS" },
            { name: "Ketelin Macedo", role: "UI-UX / Frontend Engineer", initial: "KM" },
            { name: "Gustavo Batista", role: "QA Engineer / Automation", initial: "GB" },
            { name: "Lucas Santos", role: "Security & LGPD Compliance", initial: "LS" },
            { name: "André Almeida", role: "Backend Developer / DB Admin", initial: "AA" }
          ].map((member, idx) => (
            <div key={idx} className="glass-card p-4 rounded-xl border border-slate-850 bg-slate-900/10 flex flex-col items-center text-center space-y-2 hover:border-slate-800 transition-all hover:bg-slate-900/20 group">
              <div className="w-10 h-10 rounded-full bg-indigo-950 border border-indigo-900 flex items-center justify-center text-xs font-mono font-bold text-indigo-400 group-hover:bg-indigo-900 group-hover:text-indigo-200 transition-all">
                {member.initial}
              </div>
              <div>
                <div className="text-xs font-bold text-slate-200">{member.name}</div>
                <div className="text-[9px] text-slate-500 font-mono mt-0.5">{member.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
