'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ClipboardList, Check } from 'lucide-react';
import Swal from 'sweetalert2';
import { UserSession, OneOnOne, Collaborator, LeaderProfile } from '@/types';
import { sendRHConflictAlertEmail } from '@/lib/emailService';

interface HistorySectionProps {
  currentUser: UserSession;
  oneOnOnes: OneOnOne[];
  collaborators: Collaborator[];
  profiles: LeaderProfile[];
  fetchDatabaseData: (user: UserSession) => void;
}

export default function HistorySection({
  currentUser,
  oneOnOnes,
  collaborators,
  profiles,
  fetchDatabaseData
}: HistorySectionProps) {
  const [colabFeedbacks, setColabFeedbacks] = useState<Record<string, string>>({});
  const [signingMeetingId, setSigningMeetingId] = useState<string | null>(null);

  const handleCollaboratorSignOff = async (meetingId: string, collaboratorId: string) => {
    const feedbackNotes = colabFeedbacks[meetingId]?.trim() || '';
    if (!feedbackNotes) {
      Swal.fire('Atenção', 'Por favor, escreva suas observações/feedback sobre a reunião antes de assinar.', 'warning');
      return;
    }

    setSigningMeetingId(meetingId);
    try {
      // 1. Atualizar notas e marcar como aprovado pelo liderado no Supabase
      const { data, error } = await supabase
        .from('one_on_ones')
        .update({
          raw_collaborator_notes: feedbackNotes,
          collaborator_approved: true
        })
        .eq('id', meetingId)
        .select()
        .single();

      if (error) throw error;

      // 2. Acionar a Gemini API via serverless endpoint para avaliação de consistência
      const matchedColab = collaborators.find(c => c.id === collaboratorId);
      const evaluationRes = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawLeaderNotes: data.raw_leader_notes,
          rawCollaboratorNotes: feedbackNotes,
          transcription: data.transcription || '',
          collaboratorName: matchedColab?.name || 'Colaborador',
          collaboratorDisc: matchedColab?.disc || 'ESTAVEL'
        })
      });

      if (evaluationRes.ok) {
        const evalData = await evaluationRes.json();
        
        // Salvar os novos resumos e resultados da consistência gerados
        await supabase
          .from('one_on_ones')
          .update({
            final_summary: evalData.finalSummary || '',
            consistency_result: evalData.consistencyResult,
          })
          .eq('id', meetingId);

        // Se houver conflito ou inconsistência
        const isDivergent = evalData.consistencyResult?.consistent === false;
        if (isDivergent || evalData.hasConflict) {
          const protocolNum = `SHR-2026-${Math.floor(100000 + Math.random() * 900000)}`;
          
          await supabase.from('conflicts').insert({
            protocol: protocolNum,
            collaborator_id: collaboratorId,
            description: `Conflito ou divergência acionada via feedback bilateral. Detalhes: ${evalData.consistencyResult?.details || 'Divergência de percepções.'}`,
            date: new Date().toISOString().split('T')[0],
            status: 'PENDING',
            has_history: true,
            is_bypass: false
          });

          // Disparar email via Pipedream/Serviço Isolado
          try {
            await sendRHConflictAlertEmail({
              colabName: matchedColab?.name || 'Colaborador',
              colabRole: matchedColab?.role || 'Colaborador',
              leaderName: 'Gestor Relacionado',
              date: new Date().toLocaleDateString('pt-BR'),
              protocol: protocolNum,
              details: evalData.consistencyResult?.details || 'Desalinhamento detectado entre as percepções da reunião.'
            });
          } catch (emailErr) {
            console.error('Erro ao enviar e-mail de alerta:', emailErr);
          }
        }
      }

      setSigningMeetingId(null);
      Swal.fire({
        title: 'Ata Validada e Assinada!',
        text: 'Sua assinatura digital foi registrada com sucesso no banco de dados. Obrigado pelo feedback!',
        icon: 'success',
        background: '#0f172a',
        color: '#cbd5e1',
        confirmButtonColor: '#4f46e5'
      });
      fetchDatabaseData(currentUser);
    } catch (err: any) {
      console.error(err);
      Swal.fire('Erro ao Assinar', err.message, 'error');
      setSigningMeetingId(null);
    }
  };

  const matchedColab = collaborators.find(c => c.email?.toLowerCase() === currentUser?.email?.toLowerCase());
  const filteredOneOnOnes = currentUser?.role === 'COLLABORATOR' && matchedColab 
    ? oneOnOnes.filter(o => o.collaboratorId === matchedColab.id) 
    : oneOnOnes;

  if (filteredOneOnOnes.length === 0) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in text-left">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-100 font-title">Histórico de Reuniões 1:1</h2>
          <p className="text-xs text-slate-400">Listagem de atas gravadas e validadas no banco de dados.</p>
        </div>
        <div className="glass-card p-12 text-center rounded-2xl border border-slate-850 bg-slate-950/20 text-slate-400 font-sans">
          <ClipboardList className="w-8 h-8 mx-auto text-slate-600 mb-2" />
          <p className="text-sm font-semibold">Nenhuma reunião encontrada.</p>
          {currentUser?.role !== 'COLLABORATOR' && (
            <p className="text-xs text-slate-500">Comece agendando uma no Copiloto.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in text-left font-sans">
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-slate-100 font-title">Histórico de Reuniões 1:1</h2>
        <p className="text-xs text-slate-400">Listagem de atas gravadas e validadas no banco de dados.</p>
      </div>

      <div className="space-y-4">
        {filteredOneOnOnes.map(one => {
          const hasAudit = one.consistencyResult !== undefined && one.consistencyResult !== null;
          return (
            <div key={one.id} className="glass-card p-5 rounded-xl border border-slate-800 bg-slate-950/40 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-sm text-slate-200">{one.collaboratorName}</h3>
                  <div className="flex gap-2 items-center text-[11px] text-slate-500 mt-0.5 font-mono">
                    <span>{one.date}</span>
                    <span>•</span>
                    <span>{one.type}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  {hasAudit && (
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                      one.consistencyResult?.consistent
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/60'
                        : 'bg-amber-950 text-amber-400 border border-amber-900/60'
                    }`}>
                      {one.consistencyResult?.consistent ? 'Consistente' : 'Divergente'}
                    </span>
                  )}
                  {one.collaboratorApproved ? (
                    <span className="bg-emerald-950/50 text-emerald-400 border border-emerald-900/40 text-[10px] font-mono px-2 py-0.5 rounded flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Assinatura Bilateral
                    </span>
                  ) : (
                    <span className="bg-amber-950/50 text-amber-400 border border-amber-900/40 text-[10px] font-mono px-2 py-0.5 rounded flex items-center gap-1 animate-pulse">
                      Aguardando Sua Assinatura
                    </span>
                  )}
                </div>
              </div>

              <div className="text-xs text-slate-400 bg-slate-900/40 p-3 rounded-lg border border-slate-900 leading-relaxed">
                <div className="text-slate-500 font-semibold mb-1">Resumo Sintetizado:</div>
                {one.finalSummary || 'Sem resumo disponível.'}
              </div>

              {/* Separate RAW notes section */}
              <div className="grid md:grid-cols-2 gap-3 pt-2 text-[11px]">
                <div className="p-2.5 rounded bg-slate-900/30 border border-slate-900">
                  <span className="text-slate-500 font-bold block mb-1">RAW Percepção Líder:</span>
                  <span className="text-slate-400">{one.rawLeaderNotes || 'Sem registro.'}</span>
                </div>
                <div className="p-2.5 rounded bg-slate-900/30 border border-slate-900 flex flex-col justify-between">
                  <div>
                    <span className="text-slate-500 font-bold block mb-1">RAW Percepção Liderado:</span>
                    {one.collaboratorApproved ? (
                      <span className="text-slate-400">{one.rawCollaboratorNotes || 'Sem registro.'}</span>
                    ) : (
                      <span className="text-slate-500 italic">Sua percepção ainda não foi registrada. Preencha o feedback abaixo para assinar.</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Collaborator Signature Form */}
              {currentUser?.role === 'COLLABORATOR' && !one.collaboratorApproved && (
                <div className="mt-3 p-3.5 rounded-xl border border-slate-800 bg-slate-950/20 space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block font-bold">
                      Sua Opinião / Percepção do 1:1 (Feedback Obrigatório)
                    </label>
                    <textarea
                      placeholder="Escreva como foi a reunião na sua visão. Os combinados ficaram claros? Há algum ponto de discordância ou blocker que queira registrar?"
                      value={colabFeedbacks[one.id] ?? ''}
                      onChange={(e) => setColabFeedbacks(prev => ({ ...prev, [one.id]: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 h-20 resize-none"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={signingMeetingId === one.id}
                    onClick={() => handleCollaboratorSignOff(one.id, one.collaboratorId)}
                    className="w-full bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-slate-100 text-xs font-semibold py-2 px-4 rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/20"
                  >
                    {signingMeetingId === one.id ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-slate-100 border-t-transparent rounded-full animate-spin"></span>
                        <span>Analisando e Assinando...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5 text-slate-100" />
                        <span>Salvar Feedback & Assinar Ata Bilateralmente</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
