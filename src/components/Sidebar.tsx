'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  LogOut,
  UserCheck,
  Sparkles,
  Play,
  ShieldAlert,
  ClipboardList,
  Database,
  HelpCircle
} from 'lucide-react';
import { UserSession, LeaderProfile } from '@/types';

interface SidebarProps {
  activeSection: string;
  handleSwitchSection: (section: any) => void;
  currentUser: UserSession | null;
  leaderProfile: LeaderProfile | null;
  handleLogout: () => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export default function Sidebar({
  activeSection,
  handleSwitchSection,
  currentUser,
  leaderProfile,
  handleLogout,
  sidebarOpen,
  setSidebarOpen
}: SidebarProps) {
  const router = useRouter();

  return (
    <aside
      className={`fixed md:relative inset-y-0 left-0 w-64 border-r border-slate-900 bg-slate-950/90 backdrop-blur-xl p-5 flex flex-col gap-6 z-50 transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}
    >
      {/* Brand */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-cyan-400 flex items-center justify-center font-bold text-slate-100 text-lg font-title">
          S
        </div>
        <div>
          <h3 className="font-bold text-sm tracking-tight text-slate-100 font-title">SyncHR</h3>
          <p className="text-xs text-indigo-400 font-mono tracking-widest uppercase">Smart Leading</p>
        </div>
      </div>

      {/* Current Account */}
      {currentUser && (
        <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/30 space-y-2">
          <div className="flex justify-between items-start">
            <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Conta Ativa</div>
            <button
              onClick={handleLogout}
              className="text-slate-500 hover:text-red-400 transition-all"
              title="Sair do Sistema"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-200 truncate">{currentUser.name}</h4>
            <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
          </div>
          <div className="pt-1.5 border-t border-slate-900/60 flex justify-between items-center text-[11px]">
            <span className="text-slate-400">Tipo:</span>
            <span className="bg-indigo-950/50 text-indigo-300 border border-indigo-900/40 px-1.5 py-0.5 rounded font-mono font-bold text-[10px]">
              {currentUser.role}
            </span>
          </div>
        </div>
      )}

      {/* Leader Profile Diagnosed */}
      {currentUser?.role === 'LEADER' && (
        <div className="p-3.5 rounded-xl border border-slate-800/80 bg-slate-900/40 space-y-1">
          <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Perfil Liderança</div>
          {leaderProfile && leaderProfile.profile !== 'PENDENTE' ? (
            <>
              <div className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                <span>
                  {leaderProfile.profile === 'TECNICO'
                    ? '🤖'
                    : leaderProfile.profile === 'TRANSICAO'
                    ? '🌱'
                    : '🔥'}
                </span>
                <span>Líder {leaderProfile.profile}</span>
              </div>
              <div className="text-[11px] text-slate-500">
                {leaderProfile.levelFrom} → {leaderProfile.levelTo}
              </div>
            </>
          ) : (
            <div className="text-xs font-bold text-red-400 flex items-center gap-1.5 animate-pulse">
              <span>⚠️</span>
              <span>Pendente de Diagnóstico</span>
            </div>
          )}
        </div>
      )}

      {/* Sidebar Nav */}
      <nav className="flex-1 flex flex-col gap-1.5 pt-2">
        <button
          onClick={() => handleSwitchSection('about')}
          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left text-xs font-semibold border transition-all ${
            activeSection === 'about'
              ? 'bg-gradient-to-r from-indigo-900/40 to-indigo-900/10 border-indigo-700/50 text-indigo-200'
              : 'bg-transparent border-transparent hover:bg-slate-900/40 text-slate-400 hover:text-slate-200'
          }`}
        >
          <HelpCircle className="w-4 h-4 shrink-0" />
          <span>Sobre o SyncHR</span>
        </button>

        {currentUser?.role === 'LEADER' && (
          <button
            onClick={() => handleSwitchSection('onboarding')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left text-xs font-semibold border transition-all ${
              activeSection === 'onboarding'
                ? 'bg-gradient-to-r from-indigo-900/40 to-indigo-900/10 border-indigo-700/50 text-indigo-200'
                : 'bg-transparent border-transparent hover:bg-slate-900/40 text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-4 h-4 shrink-0" />
            <span>Onboarding Liderança</span>
          </button>
        )}

        {currentUser?.role === 'COLLABORATOR' && (
          <button
            onClick={() => router.push(`/onboarding-liderado?email=${currentUser.email}`)}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left text-xs font-semibold border transition-all bg-transparent border-transparent hover:bg-slate-900/40 text-slate-400 hover:text-slate-200"
          >
            <UserCheck className="w-4 h-4 shrink-0 text-emerald-400 animate-pulse" />
            <span className="text-emerald-450">Realizar Teste DISC</span>
          </button>
        )}

        {currentUser?.role === 'LEADER' && (
          <>
            <button
              onClick={() => handleSwitchSection('copiloto')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left text-xs font-semibold border transition-all ${
                activeSection === 'copiloto'
                  ? 'bg-gradient-to-r from-indigo-900/40 to-indigo-900/10 border-indigo-700/50 text-indigo-200'
                  : 'bg-transparent border-transparent hover:bg-slate-900/40 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>Copiloto de 1:1 (Stepper)</span>
            </button>

            <button
              onClick={() => handleSwitchSection('simulador')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left text-xs font-semibold border transition-all ${
                activeSection === 'simulador'
                  ? 'bg-gradient-to-r from-indigo-900/40 to-indigo-900/10 border-indigo-700/50 text-indigo-200'
                  : 'bg-transparent border-transparent hover:bg-slate-900/40 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Play className="w-4 h-4 shrink-0" />
              <span>Simulador de DISC (Quiz)</span>
            </button>

            <button
              onClick={() => handleSwitchSection('escalation')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left text-xs font-semibold border transition-all ${
                activeSection === 'escalation'
                  ? 'bg-gradient-to-r from-indigo-900/40 to-indigo-900/10 border-indigo-700/50 text-indigo-200'
                  : 'bg-transparent border-transparent hover:bg-slate-900/40 text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>Escalação de Conflitos</span>
            </button>
          </>
        )}

        <button
          onClick={() => handleSwitchSection('historico')}
          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left text-xs font-semibold border transition-all ${
            activeSection === 'historico'
              ? 'bg-gradient-to-r from-indigo-900/40 to-indigo-900/10 border-indigo-700/50 text-indigo-200'
              : 'bg-transparent border-transparent hover:bg-slate-900/40 text-slate-400 hover:text-slate-200'
          }`}
        >
          <ClipboardList className="w-4 h-4 shrink-0" />
          <span>Histórico de Reuniões</span>
        </button>

        {currentUser?.role === 'RH' && (
          <button
            onClick={() => handleSwitchSection('rh')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left text-xs font-semibold border transition-all ${
              activeSection === 'rh'
                ? 'bg-gradient-to-r from-indigo-900/40 to-indigo-900/10 border-indigo-700/50 text-indigo-200'
                : 'bg-transparent border-transparent hover:bg-slate-900/40 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-4 h-4 shrink-0" />
            <span>Painel Geral do RH</span>
          </button>
        )}
      </nav>

      <div className="pt-4 border-t border-slate-900 text-center">
        <p className="text-[10px] text-slate-600 font-mono">SyncHR Corporate v1.2</p>
      </div>
    </aside>
  );
}
