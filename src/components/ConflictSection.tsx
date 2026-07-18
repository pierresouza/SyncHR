'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Info } from 'lucide-react';
import Swal from 'sweetalert2';
import { UserSession, Collaborator, OneOnOne } from '@/types';

interface ConflictSectionProps {
  currentUser: UserSession;
  collaborators: Collaborator[];
  oneOnOnes: OneOnOne[];
  fetchDatabaseData: (user: UserSession) => void;
}

export default function ConflictSection({
  currentUser,
  collaborators,
  oneOnOnes,
  fetchDatabaseData
}: ConflictSectionProps) {
  const [selectedColabId, setSelectedColabId] = useState(() => collaborators[0]?.id || '');
  const [isBypass, setIsBypass] = useState(false);
  const [hasHistory, setHasHistory] = useState(true);
  const [description, setDescription] = useState('');

  const handleOpenConflict = async () => {
    if (!description.trim()) {
      Swal.fire('Atenção', 'Descreva o conflito para podermos escalonar.', 'warning');
      return;
    }

    // Validate RN01: Check if there's a meeting in last 45 days
    const recentMeeting = oneOnOnes.find(o =>
      o.collaboratorId === selectedColabId &&
      (Date.now() - new Date(o.date).getTime()) <= 45 * 24 * 60 * 60 * 1000
    );

    if (!isBypass && !recentMeeting) {
      Swal.fire({
        title: 'Bloqueio de Conformidade (RN01)',
        text: 'Aberturas comuns exigem ao menos uma reunião 1:1 registrada com o colaborador nos últimos 45 dias. Caso seja um caso de assédio ou ética grave, marque a opção "Bypass".',
        icon: 'error',
        background: '#0f172a',
        color: '#cbd5e1',
        confirmButtonColor: '#4f46e5'
      });
      return;
    }

    try {
      const protocolNum = `SHR-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const colab = collaborators.find(c => c.id === selectedColabId) || {
        id: selectedColabId,
        name: 'Colaborador'
      };

      const { error } = await supabase.from('conflicts').insert({
        protocol: protocolNum,
        collaborator_id: colab.id,
        description: description,
        date: new Date().toISOString().split('T')[0],
        status: 'PENDING',
        has_history: hasHistory,
        is_bypass: isBypass
      });

      if (error) throw error;

      Swal.fire({
        title: 'Escalação Enviada!',
        html: `Caso registrado com sucesso sob o protocolo <strong>${protocolNum}</strong>. A gerente de RH Priscila Bacelar foi notificada no painel.`,
        icon: 'success',
        background: '#0f172a',
        color: '#cbd5e1'
      });

      setDescription('');
      setIsBypass(false);
      setHasHistory(true);
      fetchDatabaseData(currentUser);

    } catch (err: any) {
      Swal.fire('Erro ao enviar', err.message, 'error');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in text-left">
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-slate-100 font-title">Escalação para o RH (Clear IT)</h2>
        <p className="text-xs text-slate-400">Acione a Gerente Priscila Bacelar caso a melhoria da liderança atinja impasses.</p>
      </div>

      {/* RN01 Disclaimer */}
      <div className="p-4 rounded-xl border border-indigo-950 bg-indigo-950/20 text-xs text-indigo-300 space-y-1.5 font-sans">
        <p className="font-bold flex items-center gap-1">
          <Info className="w-4 h-4" />
          Regras de Negócio e Compliance Clear IT:
        </p>
        <p className="leading-relaxed">
          <strong>RN01 (Atraso 45 dias):</strong> Aberturas ordinárias exigem pelo menos uma 1:1 realizada com o colaborador nos últimos 45 dias.
          <br />
          <strong>RN02 (Desvio Ético Bypass):</strong> Casos de ética ou assédio ignoram a barreira dos 45 dias e vão imediatamente ao RH.
        </p>
      </div>

      {/* Form escalation */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 bg-slate-950/40 space-y-4">
        <div className="space-y-1">
          <label className="text-xs text-slate-400 font-semibold font-mono uppercase tracking-wider block">Selecionar Colaborador</label>
          <select
            value={selectedColabId}
            onChange={(e) => setSelectedColabId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
          >
            {collaborators.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4 font-sans">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="bypass"
              checked={isBypass}
              onChange={(e) => setIsBypass(e.target.checked)}
              className="w-4 h-4 accent-red-650 cursor-pointer"
            />
            <label htmlFor="bypass" className="text-xs text-red-400 font-semibold cursor-pointer select-none">⚠️ Desvio Ético / Assédio (Bypass)</label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="history"
              checked={hasHistory}
              onChange={(e) => setHasHistory(e.target.checked)}
              className="w-4 h-4 accent-indigo-500 cursor-pointer"
            />
            <label htmlFor="history" className="text-xs text-slate-400 cursor-pointer select-none">Possui histórico recente</label>
          </div>
        </div>

        <div className="space-y-1.5 font-sans">
          <label className="text-xs text-slate-400 font-semibold font-mono uppercase tracking-wider block">Descreva a Situação Crítica</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Descreva minuciosamente a ocorrência corporativa para mediação do RH..."
            className="w-full bg-slate-900 border border-slate-850 rounded-xl py-2 px-3 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 font-sans"
          />
        </div>

        <button
          type="button"
          onClick={handleOpenConflict}
          className="w-full bg-red-700 hover:bg-red-650 text-slate-100 text-xs font-bold py-3 rounded-xl transition-all"
        >
          Abrir Protocolo de Mediação no RH
        </button>
      </div>
    </div>
  );
}
