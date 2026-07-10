'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { OneOnOne } from '@/types';
import { 
  Check, 
  RefreshCw, 
  FileText, 
  Sliders, 
  ClipboardList, 
  ThumbsUp, 
  Info,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import Swal from 'sweetalert2';

function FeedbackFormContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const meetingId = searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [meeting, setMeeting] = useState<OneOnOne | null>(null);
  const [activeStep, setActiveStep] = useState(1);
  
  // Form states
  const [rawCollaboratorNotes, setRawCollaboratorNotes] = useState('');
  const [collaboratorApproved, setCollaboratorApproved] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (meetingId) {
      fetchMeeting(meetingId);
    } else {
      setLoading(false);
    }
  }, [meetingId]);

  const fetchMeeting = async (id: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('one_on_ones')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        console.error('Reunião não encontrada:', error);
        setMeeting(null);
      } else {
        // Resolve collaborator name
        const { data: colab } = await supabase
          .from('collaborators')
          .select('name')
          .eq('id', data.collaborator_id)
          .single();

        setMeeting({
          id: data.id,
          collaboratorId: data.collaborator_id,
          collaboratorName: colab?.name || 'Colaborador',
          date: data.date,
          type: data.type,
          context: data.context || '',
          scriptText: data.script_text || '',
          rawLeaderNotes: data.raw_leader_notes || '',
          rawCollaboratorNotes: data.raw_collaborator_notes || '',
          transcription: data.transcription || '',
          finalSummary: data.final_summary || '',
          leaderApproved: data.leader_approved,
          collaboratorApproved: data.collaborator_approved,
          consistencyResult: data.consistency_result,
          ataTemplateId: data.ata_template_id
        });
        setRawCollaboratorNotes(data.raw_collaborator_notes || '');
        setCollaboratorApproved(data.collaborator_approved || false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOff = async () => {
    if (!meetingId) return;
    if (!rawCollaboratorNotes.trim()) {
      Swal.fire('Atenção', 'Por favor, escreva sua opinião/notas finais sobre a reunião na Aba 3 antes de assinar.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Update the notes and approved status of collaborator in Supabase
      const { data, error } = await supabase
        .from('one_on_ones')
        .update({
          raw_collaborator_notes: rawCollaboratorNotes,
          collaborator_approved: true
        })
        .eq('id', meetingId)
        .select()
        .single();

      if (error) throw error;

      // 2. Trigger Gemini API re-evaluation of consistency and summary dynamic update
      const evaluationRes = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawLeaderNotes: data.raw_leader_notes,
          rawCollaboratorNotes: rawCollaboratorNotes,
          transcription: data.transcription || '',
          collaboratorName: meeting?.collaboratorName || 'Colaborador',
          collaboratorDisc: 'ESTAVEL' // Fallback or read from metadata
        })
      });

      if (evaluationRes.ok) {
        const evalData = await evaluationRes.json();
        
        // Update database with new summary and consistency evaluation
        await supabase
          .from('one_on_ones')
          .update({
            final_summary: evalData.finalSummary || '',
            consistency_result: evalData.consistencyResult,
          })
          .eq('id', meetingId);

        // If newly divergent or conflict, create protocol
        const isDivergent = evalData.consistencyResult?.consistent === false;
        if (isDivergent || evalData.hasConflict) {
          const protocolNum = `SHR-2026-${Math.floor(100000 + Math.random() * 900000)}`;
          await supabase.from('conflicts').insert({
            protocol: protocolNum,
            collaborator_id: data.collaborator_id,
            description: `Divergência ou Conflito acionado via formulário de feedback do Liderado. Detalhes: ${evalData.consistencyResult?.details || 'Desalinhamento de combinados.'}`,
            date: new Date().toISOString().split('T')[0],
            status: 'PENDING',
            has_history: true,
            is_bypass: false
          });
        }
      }

      setCollaboratorApproved(true);
      Swal.fire({
        title: 'Ata Validada e Assinada!',
        text: 'Sua assinatura digital foi registrada com sucesso no banco de dados. Obrigado pelo feedback!',
        icon: 'success',
        background: '#0f172a',
        color: '#cbd5e1',
        confirmButtonColor: '#4f46e5'
      });
      fetchMeeting(meetingId);
    } catch (err: any) {
      console.error(err);
      Swal.fire('Erro', 'Não foi possível gravar sua assinatura: ' + err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center text-slate-300">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-400" />
          <p className="text-xs tracking-wider uppercase font-mono">Carregando Ata de Reunião...</p>
        </div>
      </div>
    );
  }

  if (!meetingId || !meeting) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center text-slate-300 px-4">
        <div className="glass-card p-8 rounded-2xl border border-slate-800 bg-slate-900/20 max-w-md text-center space-y-4">
          <AlertTriangle className="w-12 h-12 mx-auto text-red-500 animate-pulse" />
          <h3 className="text-lg font-bold text-slate-100 font-title">Link Inválido ou Expirado</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Esta ata de reunião não foi encontrada ou o identificador é inválido. Certifique-se de que a reunião foi salva pelo líder.
          </p>
        </div>
      </div>
    );
  }

  // Parse Kanban tasks out of meeting markdown if needed, or display standard notes
  return (
    <main className="min-h-screen bg-[#0b0f19] text-slate-100 p-4 md:p-8 flex items-center justify-center relative font-sans">
      
      {/* Background blobs */}
      <div className="absolute w-[400px] h-[400px] rounded-full bg-indigo-500/5 top-1/4 left-1/4 orb pointer-events-none" />
      <div className="absolute w-[500px] h-[500px] rounded-full bg-cyan-500/3 bottom-10 right-10 orb pointer-events-none" />

      <div className="w-full max-w-[700px] space-y-6 relative z-10">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-900 pb-4">
          <div>
            <span className="text-[10px] tracking-widest text-indigo-400 uppercase font-mono font-semibold">Bilateral Feedback</span>
            <h1 className="text-xl font-bold text-slate-100 font-title">Validação da Reunião 1:1</h1>
          </div>
          <div className="text-right">
            <span className="bg-indigo-950 text-indigo-300 border border-indigo-900/40 text-[10px] px-2 py-0.5 rounded font-mono font-bold">
              {meeting.type}
            </span>
            <p className="text-[10px] text-slate-500 mt-1">{meeting.date}</p>
          </div>
        </div>

        {/* Tap Navigation Stepper */}
        <div className="flex justify-between items-center bg-slate-950/40 border border-slate-900 p-2 rounded-xl">
          {[1, 2, 3, 4].map(s => (
            <button
              key={s}
              onClick={() => setActiveStep(s)}
              className={`flex-1 py-2 text-center text-[10px] font-bold uppercase font-mono tracking-wider rounded-lg border transition-all ${
                activeStep === s
                  ? 'bg-indigo-650 border-indigo-500 text-slate-100 shadow-md shadow-indigo-500/10'
                  : 'bg-transparent border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              Aba {s} {s === 1 && '• Ata'} {s === 2 && '• Metas'} {s === 3 && '• Notas'} {s === 4 && '• Assinar'}
            </button>
          ))}
        </div>

        {/* STEP 1: RESUMO DA ATA */}
        {activeStep === 1 && (
          <div className="glass-card p-6 rounded-2xl border border-slate-800 bg-slate-950/40 space-y-4 animate-fade-in">
            <h3 className="font-bold text-slate-200 text-sm font-title flex items-center gap-1.5">
              <FileText className="w-4.5 h-4.5 text-indigo-400" />
              Resumo da Conversa
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Abaixo está a síntese objetiva da conversa compilada pela IA do Smart Leading:
            </p>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-850 text-xs text-slate-300 leading-relaxed whitespace-pre-line font-sans">
              {meeting.finalSummary || 'O resumo ainda não foi gerado. Insira suas notas na Aba 3 para processamento.'}
            </div>
            
            <div className="p-3.5 bg-slate-900/20 border border-slate-850 rounded-xl flex gap-2 text-xs text-slate-400">
              <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <span>Este resumo foi gerado a partir do cruzamento de notas da liderança e da transcrição higienizada (sem exposição de PII).</span>
            </div>
          </div>
        )}

        {/* STEP 2: METAS & KANBAN */}
        {activeStep === 2 && (
          <div className="glass-card p-6 rounded-2xl border border-slate-800 bg-slate-950/40 space-y-5 animate-fade-in">
            <div className="space-y-1">
              <h3 className="font-bold text-slate-200 text-sm font-title flex items-center gap-1.5">
                <ClipboardList className="w-4.5 h-4.5 text-cyan-400" />
                Combinados & Kanban Sugerido
              </h3>
              <p className="text-xs text-slate-400">Estes foram os itens e planos de ação pautados para a sprint:</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-850 text-xs text-slate-300 leading-relaxed whitespace-pre-line font-sans">
              <div className="text-indigo-400 font-bold mb-1 uppercase font-mono text-[10px]">Roteiro e Pauta Acordados:</div>
              {meeting.scriptText}
            </div>

            {meeting.rawLeaderNotes && (
              <div className="p-3 bg-slate-900/20 border border-slate-850 rounded-xl text-xs text-slate-400">
                <strong>Nota do Gestor:</strong> {meeting.rawLeaderNotes}
              </div>
            )}
          </div>
        )}

        {/* STEP 3: OPINIÃO DO LIDERADO */}
        {activeStep === 3 && (
          <div className="glass-card p-6 rounded-2xl border border-slate-800 bg-slate-950/40 space-y-4 animate-fade-in">
            <div className="space-y-1">
              <h3 className="font-bold text-slate-200 text-sm font-title flex items-center gap-1.5">
                <FileText className="w-4.5 h-4.5 text-indigo-400" />
                Sua Opinião Final (RAW Collaborator Notes)
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Digite livremente como você sentiu a reunião e os acordos de metas. Suas notas são armazenadas separadamente para auditoria trabalhista e calibração por IA.
              </p>
            </div>

            <div className="space-y-1.5">
              <textarea
                rows={6}
                required
                disabled={collaboratorApproved}
                value={rawCollaboratorNotes}
                onChange={(e) => setRawCollaboratorNotes(e.target.value)}
                placeholder="Ex: Concordo com o resumo. O ajuste de escopo tático me dará o fôlego necessário para entregar a refatoração com qualidade na próxima sprint."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 font-sans leading-relaxed"
              />
            </div>

            {collaboratorApproved && (
              <div className="flex gap-2 p-3 bg-emerald-950/30 border border-emerald-900/40 rounded-xl text-xs text-emerald-400">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Seu feedback já foi gravado e assinado digitalmente. Não é possível alterar.</span>
              </div>
            )}
          </div>
        )}

        {/* STEP 4: ASSINATURA DIGITAL (SIGN-OFF) */}
        {activeStep === 4 && (
          <div className="glass-card p-6 rounded-2xl border border-slate-800 bg-slate-950/40 text-center space-y-6 animate-fade-in">
            <div className="w-14 h-14 rounded-full bg-indigo-950/60 border border-indigo-550 flex items-center justify-center mx-auto text-indigo-400">
              <ShieldCheck className="w-8 h-8" />
            </div>

            <div className="space-y-2 max-w-sm mx-auto">
              <h3 className="font-bold text-slate-200 text-sm font-title">Assinatura de Concordância Bilateral</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ao clicar em Validar, você manifesta seu consentimento digital sob a LGPD com a ata sintetizada e grava sua assinatura.
              </p>
            </div>

            {/* Signature Card */}
            <div className="p-4 rounded-xl border border-slate-850 bg-slate-900/30 max-w-md mx-auto grid grid-cols-2 gap-4 text-left text-xs">
              <div className="space-y-1">
                <span className="text-slate-500 font-mono text-[10px] block uppercase">Assinatura Líder</span>
                <span className="font-bold text-slate-300">{meeting.leaderApproved ? '✓ Assinado' : 'Pendente'}</span>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 font-mono text-[10px] block uppercase">Assinatura Colaborador</span>
                <span className="font-bold text-slate-300">{collaboratorApproved ? '✓ Assinado' : 'Pendente'}</span>
              </div>
            </div>

            <div className="flex gap-4 max-w-md mx-auto">
              <button
                type="button"
                onClick={() => setActiveStep(3)}
                className="bg-slate-900 border border-slate-800 text-slate-400 text-xs font-bold py-2.5 px-5 rounded-xl flex-1"
              >
                Voltar
              </button>
              <button
                type="button"
                disabled={collaboratorApproved || submitting}
                onClick={handleSignOff}
                className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 disabled:opacity-50 text-slate-100 text-xs font-bold py-2.5 px-5 rounded-xl flex-1 transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-550/10"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    {collaboratorApproved ? 'Ata Validada' : 'Validar e Assinar'}
                  </>
                )}
              </button>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}

export default function FeedbackFormPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center text-slate-300">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-400" />
      </div>
    }>
      <FeedbackFormContent />
    </Suspense>
  );
}
