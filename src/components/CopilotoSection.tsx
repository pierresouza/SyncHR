'use client';

import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Check,
  Video,
  RefreshCw,
  Sparkles,
  Info,
  Sliders,
  ClipboardList,
  Copy,
  FileText,
  Play,
  Send
} from 'lucide-react';
import Swal from 'sweetalert2';
import { UserSession, LeaderProfile, Collaborator } from '@/types';
import { sendCollaboratorInviteEmail, sendCollaboratorSignOffRequestEmail, sendRHConflictAlertEmail } from '@/lib/emailService';
import { MarkdownRenderer, cleanScriptText } from './MarkdownRenderer';

interface CopilotoSectionProps {
  currentUser: UserSession;
  leaderProfile: LeaderProfile | null;
  collaborators: Collaborator[];
  profiles: LeaderProfile[];
  fetchDatabaseData: (user: UserSession) => void;
}

export default function CopilotoSection({
  currentUser,
  leaderProfile,
  collaborators,
  profiles,
  fetchDatabaseData
}: CopilotoSectionProps) {
  // Stepper state
  const [meetingStep, setMeetingStep] = useState(1);

  // Form states
  const [selectedColabId, setSelectedColabId] = useState(() => collaborators[0]?.id || '');
  const [collaboratorLevel, setCollaboratorLevel] = useState('L2');
  const [selectedAtaTemplate, setSelectedAtaTemplate] = useState('rotineira');
  const [meetingType, setMeetingType] = useState('Quinzenal Rotineira');
  const [meetingDate, setMeetingDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [meetingTime, setMeetingTime] = useState(() => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  });
  const [meetingDuration, setMeetingDuration] = useState('60');
  const [impedimentContext, setImpedimentContext] = useState('Alinhamento de tarefas ordinárias e checagem de clima.');
  const [shouldGenerateMeet, setShouldGenerateMeet] = useState(true);

  // Script and suggestions states
  const [generatedScript, setGeneratedScript] = useState('');
  const [loadingScript, setLoadingScript] = useState(false);
  const [kanbanTasks, setKanbanTasks] = useState<Array<{ id: string; title: string; status: 'todo' | 'in_progress' | 'done' }>>([]);
  const [deliveryAdjustment, setDeliveryAdjustment] = useState<{ proposedDeadline: string; scopeChange: string; rationale: string } | null>(null);
  const [scopeSlider, setScopeSlider] = useState(50);
  const [deadlineSlider, setDeadlineSlider] = useState(50);
  const [meetLink, setMeetLink] = useState('');
  const [copied, setCopied] = useState(false);

  // Timer live assist states
  const [liveTalkTime, setLiveTalkTime] = useState(0); // em segundos
  const [leaderTalkPercentage, setLeaderTalkPercentage] = useState(30); // Regra 70/30
  const [liveQuestionsLog, setLiveQuestionsLog] = useState<string[]>([]);
  const [chatMessage, setChatMessage] = useState('');
  const [liveSuggestions, setLiveSuggestions] = useState<string[]>([]);
  const [loadingLiveChat, setLoadingLiveChat] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Notes & Transcriptions for Step 4
  const [rawLeaderNotes, setRawLeaderNotes] = useState('');
  const [rawCollaboratorNotes, setRawCollaboratorNotes] = useState('');
  const [transcriptionText, setTranscriptionText] = useState('');
  const [lgpdConsent, setLgpdConsent] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);

  // Results step 5
  const [evaluationResult, setEvaluationResult] = useState<any>(null);
  const [leaderApproved, setLeaderApproved] = useState(false);
  const [collaboratorApproved, setCollaboratorApproved] = useState(false);
  const [isSimulationToggle, setIsSimulationToggle] = useState(false);
  const [savedMeetingId, setSavedMeetingId] = useState<string | null>(null);

  const activeColab = collaborators.find(c => c.id === selectedColabId) || collaborators[0] || {
    id: '',
    name: 'Colaborador',
    email: 'colaborador@clearit.com.br',
    disc: 'PENDENTE',
    level: 'L2',
    role: 'Desenvolvedor'
  };

  // Keep selectedColabId sync'd with collaborators list if it loads late
  useEffect(() => {
    if (collaborators.length > 0 && !selectedColabId) {
      setSelectedColabId(collaborators[0].id);
    }
  }, [collaborators, selectedColabId]);

  // Timer Controls
  const startTimer = () => {
    if (timerRef.current) return;
    timerRef.current = setInterval(() => {
      setLiveTalkTime(prev => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const resetTimer = () => {
    stopTimer();
    setLiveTalkTime(0);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const handleGenerateScript = async () => {
    if (!selectedColabId) {
      Swal.fire('Atenção', 'Selecione um liderado antes.', 'warning');
      return;
    }

    setLoadingScript(true);
    try {
      const res = await fetch('/api/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leaderProfile: leaderProfile?.profile || 'TRANSICAO',
          collaboratorName: activeColab.name,
          collaboratorDisc: activeColab.disc,
          collaboratorLevel: collaboratorLevel,
          meetingType: meetingType,
          context: impedimentContext,
          ataTemplateId: selectedAtaTemplate
        })
      });

      if (!res.ok) throw new Error('Falha HTTP ao chamar API.');

      const data = await res.json();

      setGeneratedScript(data.script);
      setKanbanTasks(data.kanbanTasks || []);
      setDeliveryAdjustment(data.deliveryAdjustment || null);

      // Auto adjust visual sliders based on suggestions
      if (data.deliveryAdjustment) {
        const hasScopeMod = data.deliveryAdjustment.scopeChange.toLowerCase().includes('reduz') || data.deliveryAdjustment.scopeChange.toLowerCase().includes('diminu');
        setScopeSlider(hasScopeMod ? 35 : 70);
        const hasDeadlineMod = data.deliveryAdjustment.proposedDeadline.toLowerCase().includes('prorr') || data.deliveryAdjustment.proposedDeadline.toLowerCase().includes('adi') || data.deliveryAdjustment.proposedDeadline.toLowerCase().includes('amanhã');
        setDeadlineSlider(hasDeadlineMod ? 85 : 50);
      }

      // If generate meet is checked, try creating a Google Meet event or fallback to Jitsi Meet
      if (shouldGenerateMeet) {
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          const accessToken = sessionData?.session?.provider_token || undefined;

          const formattedDate = meetingDate.split('-').reverse().join('/');
          const formattedDateTime = `${formattedDate} às ${meetingTime}`;

          const { createGoogleMeetEvent } = await import('@/lib/google-calendar');
          const startISO = new Date(`${meetingDate}T${meetingTime}:00`).toISOString();
          const endISO = new Date(new Date(`${meetingDate}T${meetingTime}:00`).getTime() + parseInt(meetingDuration) * 60 * 1000).toISOString();

          const meetResult = await createGoogleMeetEvent({
            summary: `1:1 SyncHR - ${leaderProfile?.name || 'Gestor'} & ${activeColab.name}`,
            description: `Alinhamento 1:1 de pauta com modelo ${selectedAtaTemplate.toUpperCase()}. Contexto: ${impedimentContext}`,
            startDateTime: startISO,
            endDateTime: endISO,
            attendeeEmail: activeColab.email || 'liderado@clearit.com.br',
            accessToken
          });

          const meetLinkUrl = meetResult.meetLink;
          const isGoogleMeetReal = !meetResult.simulated;
          setMeetLink(meetLinkUrl);

          if (activeColab.email) {
            await sendCollaboratorInviteEmail({
              colabEmail: activeColab.email,
              colabName: activeColab.name,
              leaderName: leaderProfile?.name || 'Gestor',
              formattedDateTime,
              meetingDuration: parseInt(meetingDuration) || 60,
              meetLinkUrl,
              isGoogleMeetReal
            });
          }
        } catch (calendarErr) {
          console.error('[Meet generation or email dispatch error]:', calendarErr);
        }
      }

      setMeetingStep(2); // Move to Step 2
    } catch (e: any) {
      console.error(e);
      Swal.fire('Erro na IA', 'Não foi possível gerar o roteiro com o Gemini API: ' + e.message, 'error');
    } finally {
      setLoadingScript(false);
    }
  };

  const downloadAsMarkdown = (text: string) => {
    if (!text) return;
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const sanitizedColabName = activeColab.name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    const filename = `roteiro_1a1_${sanitizedColabName}_${meetingDate || 'data'}.md`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Live Chat suggestions during meeting
  const handleSendLiveMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const messageToSend = chatMessage;
    setLiveQuestionsLog(prev => [...prev, `Colaborador: "${messageToSend}"`]);
    setChatMessage('');
    setLoadingLiveChat(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageToSend,
          profile: leaderProfile?.profile || 'TRANSICAO'
        })
      });

      if (!res.ok) throw new Error('Erro na resposta da API.');
      const data = await res.json();

      setLiveSuggestions(data.text.split('\n').filter((l: string) => l.trim().length > 0));
    } catch (err: any) {
      console.error(err);
      setLiveSuggestions(['Erro ao carregar orientações da IA. Verifique sua chave API.']);
    } finally {
      setLoadingLiveChat(false);
    }
  };

  // Evaluate & Consistency Audit (Step 4 -> Step 5)
  const handleEvaluateMeeting = async () => {
    if (!lgpdConsent) {
      Swal.fire({
        title: 'Consentimento de Privacidade',
        text: 'É obrigatório obter o opt-in do colaborador para gravação e análise em conformidade com a LGPD.',
        icon: 'warning',
        background: '#0f172a',
        color: '#cbd5e1',
        confirmButtonColor: '#4f46e5'
      });
      return;
    }

    setIsEvaluating(true);

    // LGPD Sanitization (regex mask)
    let sanitizedTranscription = transcriptionText;
    let sanitizedLeaderNotes = rawLeaderNotes;
    let sanitizedColabNotes = rawCollaboratorNotes;

    const cpfRegex = /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g;
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const blacklistHealth = /\b(atestado|médico|doença|psiquiatra|hospital|laudo|cid|c.i.d)\b/gi;

    const sanitize = (t: string) => {
      return t
        .replace(cpfRegex, '[CPF MASCARADO]')
        .replace(emailRegex, '[EMAIL MASCARADO]')
        .replace(blacklistHealth, '[DADO DE SAÚDE SEGREGADO - COMPLIANCE]');
    };

    sanitizedTranscription = sanitize(sanitizedTranscription);
    sanitizedLeaderNotes = sanitize(sanitizedLeaderNotes);
    sanitizedColabNotes = sanitize(sanitizedColabNotes);

    try {
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawLeaderNotes: sanitizedLeaderNotes,
          rawCollaboratorNotes: sanitizedColabNotes,
          transcription: sanitizedTranscription,
          collaboratorName: activeColab.name,
          collaboratorDisc: activeColab.disc
        })
      });

      if (!res.ok) throw new Error('Falha ao processar avaliação.');
      const data = await res.json();

      setEvaluationResult(data);
      setMeetingStep(5); // Go to Step 5 (Validação)
    } catch (e: any) {
      console.error(e);
      Swal.fire('Erro na Auditoria', 'Não foi possível processar a ata final com a API: ' + e.message, 'error');
    } finally {
      setIsEvaluating(false);
    }
  };

  // Real-time link generator for Led Employee Feedback Form (F-05 Link)
  const handleGenerateFeedbackLink = async () => {
    try {
      if (savedMeetingId) {
        const link = `${window.location.origin}/feedback?id=${savedMeetingId}`;
        navigator.clipboard.writeText(link);
        Swal.fire({
          title: 'Link Copiado!',
          text: 'O link de feedback do liderado foi copiado para sua área de transferência.',
          icon: 'success',
          background: '#0f172a',
          color: '#cbd5e1',
          confirmButtonColor: '#4f46e5'
        });
        return;
      }

      // 1. Save 1:1 to Supabase in draft mode (collaborator approved is false)
      const { data: oneOnOneData, error: saveErr } = await supabase.from('one_on_ones').insert({
        collaborator_id: activeColab.id,
        date: new Date().toISOString().split('T')[0],
        type: meetingType,
        context: impedimentContext,
        script_text: generatedScript,
        raw_leader_notes: rawLeaderNotes,
        raw_collaborator_notes: rawCollaboratorNotes,
        transcription: transcriptionText,
        final_summary: evaluationResult?.finalSummary || '',
        leader_approved: true,
        collaborator_approved: false,
        consistency_result: evaluationResult?.consistencyResult,
        ata_template_id: selectedAtaTemplate
      }).select().single();

      if (saveErr) throw saveErr;

      setSavedMeetingId(oneOnOneData.id);

      const link = `${window.location.origin}/feedback?id=${oneOnOneData.id}`;
      navigator.clipboard.writeText(link);

      // Envia e-mail de notificação de feedback para o colaborador via Resend
      if (activeColab.email) {
        try {
          await sendCollaboratorSignOffRequestEmail({
            colabEmail: activeColab.email,
            colabName: activeColab.name,
            leaderName: leaderProfile?.name || 'Gestor',
            feedbackLink: link
          });
        } catch (emailErr) {
          console.error('[Error sending feedback email]:', emailErr);
        }
      }

      Swal.fire({
        title: 'Link Gerado!',
        text: activeColab.email
          ? `Ata salva no banco. O link de feedback foi enviado para ${activeColab.email} e também copiado para sua área de transferência.`
          : 'Ata salva no banco de dados. O link de feedback foi copiado para envio: ' + link,
        icon: 'success',
        background: '#0f172a',
        color: '#cbd5e1',
        confirmButtonColor: '#4f46e5'
      });
    } catch (e: any) {
      console.error(e);
      Swal.fire('Erro ao Gerar Link', 'Não foi possível salvar o rascunho no banco: ' + e.message, 'error');
    }
  };

  // Final Archiving to Supabase
  const handleArchiveMeeting = async () => {
    if (!leaderApproved || !collaboratorApproved) {
      Swal.fire({
        title: 'Assinaturas Pendentes',
        text: 'Ambas as partes (Líder e Colaborador) devem aprovar e assinar a ata antes de arquivar no banco de dados.',
        icon: 'info',
        background: '#0f172a',
        color: '#cbd5e1',
        confirmButtonColor: '#4f46e5'
      });
      return;
    }

    try {
      const isDivergent = evaluationResult?.consistencyResult?.consistent === false;
      const protocol = `SHR-2026-${Math.floor(100000 + Math.random() * 900000)}`;
      let oneOnOneData;

      // 1. Save or Update 1:1 in Supabase
      if (savedMeetingId) {
        const { data, error: updateErr } = await supabase
          .from('one_on_ones')
          .update({
            raw_collaborator_notes: rawCollaboratorNotes,
            leader_approved: true,
            collaborator_approved: true,
            consistency_result: evaluationResult?.consistencyResult,
            final_summary: evaluationResult?.finalSummary || ''
          })
          .eq('id', savedMeetingId)
          .select()
          .single();

        if (updateErr) throw updateErr;
        oneOnOneData = data;
      } else {
        const { data, error: saveErr } = await supabase.from('one_on_ones').insert({
          collaborator_id: activeColab.id,
          date: new Date().toISOString().split('T')[0],
          type: meetingType,
          context: impedimentContext,
          script_text: generatedScript,
          raw_leader_notes: rawLeaderNotes,
          raw_collaborator_notes: rawCollaboratorNotes,
          transcription: transcriptionText,
          final_summary: evaluationResult?.finalSummary || '',
          leader_approved: true,
          collaborator_approved: true,
          consistency_result: evaluationResult?.consistencyResult,
          ata_template_id: selectedAtaTemplate
        }).select().single();

        if (saveErr) throw saveErr;
        oneOnOneData = data;
      }

      // 2. If it is divergent or has conflict, open a conflict in Supabase automatically (Feature 7 / 9)
      if (isDivergent || evaluationResult?.hasConflict) {
        await supabase.from('conflicts').insert({
          protocol: protocol,
          collaborator_id: activeColab.id,
          description: `Conflito de Informações ou Divergência grave identificada na 1:1 de ${oneOnOneData.date}. Detalhes: ${evaluationResult?.consistencyResult?.details || 'Divergência de percepção.'}`,
          date: new Date().toISOString().split('T')[0],
          status: 'PENDING',
          has_history: true,
          is_bypass: false
        });

        // Disparar Alerta de Atrito por E-mail para o RH via Resend
        try {
          await sendRHConflictAlertEmail({
            colabName: activeColab.name,
            colabRole: activeColab.role || 'Colaborador',
            leaderName: leaderProfile?.name || 'Gestor',
            date: oneOnOneData.date,
            protocol: protocol,
            details: evaluationResult?.consistencyResult?.details || 'Divergência de percepção detectada entre as notas do gestor e do colaborador.'
          });
        } catch (emailErr) {
          console.error('[Error sending conflict email alert to RH]:', emailErr);
        }
      }

      Swal.fire({
        title: 'Ata Registrada e Validada!',
        html: `A ata foi gravada com sucesso no Supabase.<br/>Status: <strong>VALIDADA (Dupla Assinatura)</strong>${isDivergent ? `<br/><br/><span class="text-amber-400 font-bold">⚠️ Divergência detectada! Protocolo de conflito aberto no RH: ${protocol}</span>` : ''
          }`,
        icon: 'success',
        background: '#0f172a',
        color: '#cbd5e1',
        confirmButtonColor: '#4f46e5'
      });

      // Reset meeting stepper
      setMeetingStep(1);
      setGeneratedScript('');
      setRawLeaderNotes('');
      setRawCollaboratorNotes('');
      setTranscriptionText('');
      setLgpdConsent(false);
      setEvaluationResult(null);
      setLeaderApproved(false);
      setCollaboratorApproved(false);
      setSavedMeetingId(null);

      // Refresh Supabase logs in dashboard
      fetchDatabaseData(currentUser);

    } catch (err: any) {
      console.error(err);
      Swal.fire('Erro ao Salvar', 'Não foi possível persistir a ata no Supabase: ' + err.message, 'error');
    }
  };

  const displayScript = cleanScriptText(generatedScript);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in text-left">
      {/* Step Progress bar */}
      <div className="relative p-4 rounded-xl border border-slate-900 bg-slate-950/30">
        <div className="flex justify-between items-center max-w-xl mx-auto relative z-10">
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full border flex items-center justify-center font-mono text-xs font-bold transition-all ${
                meetingStep === s
                  ? 'bg-indigo-650 border-indigo-500 text-slate-100 shadow-lg shadow-indigo-500/20'
                  : meetingStep > s
                  ? 'bg-emerald-950/40 border-emerald-500 text-emerald-400'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}>
                {meetingStep > s ? <Check className="w-4.5 h-4.5" /> : s}
              </div>
              <span className={`text-[10px] uppercase font-mono tracking-wider font-semibold ${
                meetingStep === s ? 'text-indigo-400' : 'text-slate-600'
              }`}>
                {s === 1 && 'Preparo'}
                {s === 2 && 'Roteiro'}
                {s === 3 && 'Condução'}
                {s === 4 && 'Ata RAW'}
                {s === 5 && 'Validação'}
              </span>
            </div>
          ))}
        </div>
        {/* Progress line */}
        <div className="absolute top-[28px] left-[15%] right-[15%] h-[1px] bg-slate-900 z-0" />
      </div>

      {/* Google Meet Banner */}
      {meetLink && (
        <div className="flex items-center justify-between p-3.5 rounded-xl border border-indigo-900 bg-indigo-950/20 text-xs">
          <div className="flex items-center gap-2 text-indigo-300">
            <Video className="w-4.5 h-4.5 text-indigo-400" />
            <span>Reunião no Google Meet criada: <a href={meetLink} target="_blank" rel="noopener noreferrer" className="underline font-bold text-indigo-400">{meetLink}</a></span>
          </div>
          <a
            href={meetLink}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-indigo-650 hover:bg-indigo-550 text-slate-100 font-bold px-3 py-1.5 rounded-lg transition-all"
          >
            Entrar na Chamada
          </a>
        </div>
      )}

      {/* STEP 1: PREPARAÇÃO */}
      {meetingStep === 1 && (
        <div className="grid md:grid-cols-3 gap-6 animate-fade-in">
          {/* Form fields */}
          <div className="md:col-span-2 glass-card p-6 rounded-2xl border border-slate-800 bg-slate-950/40 space-y-4">
            <h3 className="font-bold text-slate-200 text-base font-title">Mapeamento da Reunião</h3>

            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-semibold font-mono uppercase tracking-wider">Selecionar Liderado</label>
              <select
                value={selectedColabId}
                onChange={(e) => setSelectedColabId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
              >
                {collaborators.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.disc})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-semibold font-mono uppercase tracking-wider">Maturidade Técnica</label>
                <select
                  value={collaboratorLevel}
                  onChange={(e) => setCollaboratorLevel(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option value="L1">L1 (Júnior)</option>
                  <option value="L2">L2 (Pleno)</option>
                  <option value="L3">L3 (Sênior)</option>
                  <option value="L4">L4 (Staff/Principal)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-semibold font-mono uppercase tracking-wider">Modelo de ATA</label>
                <select
                  value={selectedAtaTemplate}
                  onChange={(e) => setSelectedAtaTemplate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option value="rotineira">Rotineira / Check-in</option>
                  <option value="pdi">Desempenho & PDI</option>
                  <option value="conflito">Alinhamento de Conflito</option>
                  <option value="scrum">Foco em Kanban / Código</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-semibold font-mono uppercase tracking-wider">Tipo da Agenda</label>
              <input
                type="text"
                value={meetingType}
                onChange={(e) => setMeetingType(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-semibold font-mono uppercase tracking-wider">Contexto / Impedimento a Tratar</label>
              <textarea
                rows={3}
                value={impedimentContext}
                onChange={(e) => setImpedimentContext(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 font-sans"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-semibold font-mono uppercase tracking-wider">Data da Reunião</label>
                <input
                  type="date"
                  value={meetingDate}
                  onChange={(e) => setMeetingDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-semibold font-mono uppercase tracking-wider">Horário da Reunião</label>
                <input
                  type="time"
                  value={meetingTime}
                  onChange={(e) => setMeetingTime(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-semibold font-mono uppercase tracking-wider">Duração</label>
                <select
                  value={meetingDuration}
                  onChange={(e) => setMeetingDuration(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option value="15">15 minutos</option>
                  <option value="30">30 minutos</option>
                  <option value="45">45 minutos</option>
                  <option value="60">60 minutos (1h)</option>
                  <option value="90">90 minutos (1h30)</option>
                  <option value="120">120 minutos (2h)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-900 border border-slate-800">
              <input
                type="checkbox"
                id="googleMeetToggle"
                checked={shouldGenerateMeet}
                onChange={(e) => setShouldGenerateMeet(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <label htmlFor="googleMeetToggle" className="text-xs text-slate-300 font-semibold cursor-pointer select-none">
                Agendar chamada no Google Meet & enviar convite por e-mail
              </label>
            </div>

            <button
              type="button"
              disabled={loadingScript}
              onClick={handleGenerateScript}
              className="w-full bg-indigo-650 hover:bg-indigo-550 text-slate-100 text-xs font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {loadingScript ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Acionando Gemini API...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Gerar Roteiro Inteligente
                </>
              )}
            </button>
          </div>

          {/* HR Advisor Widget */}
          <div className="space-y-6">
            <div className="glass-card p-5 rounded-2xl border border-indigo-950 bg-indigo-950/20 space-y-4">
              <div className="flex items-center gap-2 text-indigo-400 font-mono text-xs font-semibold uppercase tracking-wider">
                <Info className="w-4 h-4" />
                <span>Priscila AI Advisor (RH)</span>
              </div>
              <div className="text-xs text-slate-400 leading-relaxed italic">
                "Como gerente de RH, aconselho que ao conversar com colaboradores {activeColab.disc === 'DOMINANTE' ? 'Dominantes' : activeColab.disc === 'ESTAVEL' ? 'Estáveis' : activeColab.disc === 'ANALITICO' ? 'Analíticos' : 'Influentes'}, evite questionários frios. {activeColab.disc === 'ESTAVEL' && 'Dê tempo para ela processar a resposta e foque no ritmo da sprint.'}{activeColab.disc === 'DOMINANTE' && 'Seja direto e foque em metas de entrega palpáveis.'} Lembre-se do consentimento de opt-in de privacidade."
              </div>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-slate-800 bg-slate-900/10 space-y-3">
              <h4 className="text-xs font-bold text-slate-200 font-mono uppercase tracking-wider">DISC Dicas rápidas:</h4>
              <div className="text-xs space-y-1.5 text-slate-400">
                <p><strong>Nome:</strong> {activeColab.name}</p>
                <p><strong>DISC:</strong> {activeColab.disc}</p>
                <p><strong>Nível:</strong> {collaboratorLevel}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: ROTEIRO & WIDGETS */}
      {meetingStep === 2 && (
        <div className="grid md:grid-cols-3 gap-6 animate-fade-in">
          {/* Left: Interactive Widgets (Kanban / Sliders) */}
          <div className="space-y-6">
            {/* Visual Kanban Checklist */}
            <div className="glass-card p-5 rounded-2xl border border-slate-800 bg-slate-950/40 space-y-4">
              <h3 className="font-bold text-slate-200 text-sm font-title flex items-center gap-1.5">
                <ClipboardList className="w-4 h-4 text-indigo-400" />
                Kanban Sugerido
              </h3>
              <p className="text-[11px] text-slate-500">Items de ação para propor e debater na sprint:</p>
              <div className="space-y-2">
                {kanbanTasks.map(task => (
                  <div
                    key={task.id}
                    onClick={() => {
                      setKanbanTasks(prev =>
                        prev.map(t => t.id === task.id ? { ...t, status: t.status === 'done' ? 'todo' : 'done' } : t)
                      );
                    }}
                    className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all flex items-center justify-between ${
                      task.status === 'done'
                        ? 'bg-indigo-950/20 border-indigo-900/60 text-slate-400 line-through'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-900'
                    }`}
                  >
                    <span>{task.title}</span>
                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                      task.status === 'done' ? 'bg-indigo-650 border-indigo-500' : 'border-slate-700'
                    }`}>
                      {task.status === 'done' && <Check className="w-3.5 h-3.5 text-slate-100" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Adjustments (Sliders) */}
            <div className="glass-card p-5 rounded-2xl border border-slate-800 bg-slate-950/40 space-y-4">
              <h3 className="font-bold text-slate-200 text-sm font-title flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-cyan-400" />
                Ajuste de Entrega
              </h3>
              {deliveryAdjustment && (
                <div className="p-2.5 rounded-lg bg-cyan-950/20 border border-cyan-900/40 text-[11px] text-cyan-300 space-y-1 mb-2">
                  <p><strong>Prazo Proposto:</strong> {deliveryAdjustment.proposedDeadline}</p>
                  <p><strong>Mudança de Escopo:</strong> {deliveryAdjustment.scopeChange}</p>
                </div>
              )}

              {/* Sliders */}
              <div className="space-y-3 pt-2">
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Escopo Reduzido</span>
                    <span>Escopo Total</span>
                  </div>
                  <input
                    type="range"
                    min="0" max="100"
                    value={scopeSlider}
                    onChange={(e) => setScopeSlider(parseInt(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                  <div className="text-right text-[10px] text-indigo-400 font-bold">{scopeSlider}% de carga</div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Prazo Curto</span>
                    <span>Prazo Extendido</span>
                  </div>
                  <input
                    type="range"
                    min="0" max="100"
                    value={deadlineSlider}
                    onChange={(e) => setDeadlineSlider(parseInt(e.target.value))}
                    className="w-full accent-cyan-500"
                  />
                  <div className="text-right text-[10px] text-cyan-400 font-bold">{deadlineSlider}% de prazo</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: concise generated cheatsheet */}
          <div className="md:col-span-2 glass-card p-6 rounded-2xl border border-slate-800 bg-slate-950/40 flex flex-col space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-200 text-base font-title">Roteiro Recomendado pelo Gemini</h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(displayScript);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="text-slate-400 hover:text-slate-200 flex items-center gap-1 text-xs transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copiado!' : 'Copiar'}
                </button>
                
                <button
                  onClick={() => downloadAsMarkdown(displayScript)}
                  className="text-slate-400 hover:text-slate-200 flex items-center gap-1 text-xs transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Baixar .md</span>
                </button>
              </div>
            </div>

            <div className="flex-1 p-5 rounded-xl border border-slate-900 bg-slate-900/30 overflow-y-auto max-h-[350px]">
              <MarkdownRenderer content={displayScript} />
            </div>

            <div className="flex gap-4 pt-2">
              <button
                onClick={() => setMeetingStep(1)}
                className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-bold py-2.5 px-5 rounded-xl transition-all"
              >
                Voltar
              </button>
              <button
                onClick={() => {
                  setMeetingStep(3);
                  startTimer();
                }}
                className="flex-1 bg-indigo-650 hover:bg-indigo-550 text-slate-100 text-xs font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5"
              >
                Iniciar Condução
                <Play className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: CONDUÇÃO & LIVE ASSIST */}
      {meetingStep === 3 && (
        <div className="grid md:grid-cols-3 gap-6 animate-fade-in">
          {/* Live timers and suggestions */}
          <div className="space-y-6">
            {/* Timer Widget */}
            <div className="glass-card p-5 rounded-2xl border border-slate-800 bg-slate-950/40 space-y-3 text-center">
              <h4 className="text-slate-400 text-xs font-mono uppercase tracking-wider">Cronômetro da 1:1</h4>
              <div className="text-3xl font-black font-mono text-indigo-400">
                {formatTime(liveTalkTime)}
              </div>

              <div className="border-t border-slate-900/60 my-2 pt-2 space-y-1.5 text-left">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Proporção de Fala Líder:</span>
                  <span className="font-bold">{leaderTalkPercentage}%</span>
                </div>
                <input
                  type="range" min="10" max="90"
                  value={leaderTalkPercentage}
                  onChange={(e) => setLeaderTalkPercentage(parseInt(e.target.value))}
                  className="w-full accent-indigo-500"
                />
                <div className="text-[10px] text-slate-500 italic">
                  {leaderTalkPercentage <= 30
                    ? 'Foco excelente! A regra 70/30 está sendo respeitada.'
                    : 'Cuidado! A liderança está falando muito. O colaborador deve falar mais.'}
                </div>
              </div>

              <div className="flex gap-2 justify-center pt-2">
                <button
                  onClick={timerRef.current ? stopTimer : startTimer}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-semibold ${
                    timerRef.current
                      ? 'bg-red-950/30 border-red-900/40 text-red-400'
                      : 'bg-emerald-950/30 border-emerald-900/40 text-emerald-400'
                  }`}
                >
                  {timerRef.current ? 'Pausar' : 'Iniciar'}
                </button>
                <button
                  onClick={resetTimer}
                  className="bg-slate-900 text-slate-400 border border-slate-800 text-xs px-3 py-1.5 rounded-lg"
                >
                  Zerar
                </button>
              </div>
            </div>

            {/* Live Questions Logger */}
            <div className="glass-card p-5 rounded-2xl border border-slate-800 bg-slate-950/40 space-y-3">
              <h4 className="text-slate-200 text-xs font-bold font-mono uppercase tracking-wider">Histórico Live</h4>
              <div className="max-h-[150px] overflow-y-auto space-y-1.5 text-[11px] font-mono text-slate-400">
                {liveQuestionsLog.length === 0 ? (
                  <span className="text-slate-600">Nenhum diálogo registrado. Digite à direita para interagir.</span>
                ) : (
                  liveQuestionsLog.map((log, idx) => (
                    <div key={idx} className="border-b border-slate-900/40 pb-1">{log}</div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Chat interface */}
          <div className="md:col-span-2 glass-card p-6 rounded-2xl border border-slate-800 bg-slate-950/40 flex flex-col space-y-4">
            <div className="space-y-1">
              <h3 className="font-bold text-slate-200 text-base font-title">Copiloto em Tempo Real (Live Assist)</h3>
              <p className="text-xs text-slate-400">Digite abaixo o que o colaborador expressou. A IA analisará o perfil e sugerirá o melhor aprofundamento.</p>
            </div>

            {/* Assist responses */}
            <div className="flex-1 p-4 rounded-xl border border-slate-900 bg-slate-900/30 min-h-[180px] overflow-y-auto space-y-3">
              <div className="text-xs text-indigo-400 font-semibold font-mono">💡 SUGESTÕES DO GEMINI:</div>
              {loadingLiveChat ? (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Gemini interpretando e calculando empatia...
                </div>
              ) : (
                <div className="space-y-2 font-sans">
                  {liveSuggestions.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">Digite algo na caixa de live chat abaixo para ver conselhos em tempo real.</p>
                  ) : (
                    liveSuggestions.map((sug, i) => (
                      <p key={i} className="text-xs text-slate-300 leading-relaxed bg-slate-950/30 p-2 rounded-lg border border-slate-900">{sug}</p>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Input message form */}
            <form onSubmit={handleSendLiveMessage} className="flex gap-2">
              <input
                type="text"
                required
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Ex: 'Estou achando as tarefas de Next.js confusas e me sinto exausta...'"
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-4 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                className="bg-indigo-650 hover:bg-indigo-550 p-2.5 rounded-xl text-slate-100"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            <div className="flex gap-4 pt-2">
              <button
                onClick={() => {
                  stopTimer();
                  setMeetingStep(2);
                }}
                className="bg-slate-900 border border-slate-800 text-slate-400 text-xs font-bold py-2.5 px-5 rounded-xl"
              >
                Voltar ao Roteiro
              </button>
              <button
                onClick={() => {
                  stopTimer();
                  setMeetingStep(4);
                }}
                className="flex-1 bg-indigo-650 hover:bg-indigo-550 text-slate-100 text-xs font-bold py-2.5 rounded-xl transition-all"
              >
                Concluir e Ir para Registro
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: REGISTRO RAW & TRANSCRIÇÃO */}
      {meetingStep === 4 && (
        <div className="glass-card p-6 rounded-2xl border border-slate-800 bg-slate-950/40 space-y-6 animate-fade-in">
          <div className="space-y-1">
            <h3 className="font-bold text-slate-200 text-base font-title">Registrar Notas e Ata da Reunião</h3>
            <p className="text-xs text-slate-400">Em conformidade com a LGPD e o padrão bivalente de confiança, insira as anotações separadas de cada parte.</p>
          </div>

          {/* Dual raw note textareas */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs text-slate-300 font-semibold font-mono uppercase tracking-wider block">O que o Líder Observou (Notas RAW do Líder)</label>
              <textarea
                rows={4}
                required
                value={rawLeaderNotes}
                onChange={(e) => setRawLeaderNotes(e.target.value)}
                placeholder="Ex: Carlos sinalizou cansaço técnico. Acordamos fatiar suas tarefas da sprint. Ele pareceu focado em resolver."
                className="w-full bg-slate-900 border border-slate-850 rounded-xl py-2 px-3 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 font-sans"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-slate-300 font-semibold font-mono uppercase tracking-wider block">O que o Colaborador Relatou (Notas RAW do Colaborador)</label>
              <textarea
                rows={4}
                required
                value={rawCollaboratorNotes}
                onChange={(e) => setRawCollaboratorNotes(e.target.value)}
                placeholder="Ex: O ritmo de homologação do QA está impossível. Sinto-me sobrecarregado porque tudo trava no review."
                className="w-full bg-slate-900 border border-slate-850 rounded-xl py-2 px-3 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 font-sans"
              />
            </div>
          </div>

          {/* Transcription box */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-300 font-semibold font-mono uppercase tracking-wider block">Transcrição da Conversa / Diálogo Livre (Opcional)</label>
            <textarea
              rows={3}
              value={transcriptionText}
              onChange={(e) => setTranscriptionText(e.target.value)}
              placeholder="Transcrição da gravação do áudio ou observações da pauta corrida..."
              className="w-full bg-slate-900 border border-slate-850 rounded-xl py-2 px-3 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 font-sans"
            />
          </div>

          {/* LGPD Consent */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-indigo-950/20 border border-indigo-900/50">
            <input
              type="checkbox"
              id="lgpd"
              checked={lgpdConsent}
              onChange={(e) => setLgpdConsent(e.target.checked)}
              className="w-4 h-4 accent-indigo-500 shrink-0 mt-0.5"
            />
            <label htmlFor="lgpd" className="text-xs text-slate-400 select-none">
              <strong>[Opt-in LGPD]</strong> O colaborador está presente e outorga consentimento explícito para registrar suas percepções de desenvolvimento profissional. Proibida a inclusão de CPFs, e-mails ou atestados médicos no texto.
            </label>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setMeetingStep(3)}
              className="bg-slate-900 border border-slate-800 text-slate-400 text-xs font-bold py-2.5 px-5 rounded-xl"
            >
              Voltar
            </button>
            <button
              onClick={handleEvaluateMeeting}
              disabled={isEvaluating}
              className="flex-1 bg-indigo-650 hover:bg-indigo-550 disabled:opacity-50 text-slate-100 text-xs font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5"
            >
              {isEvaluating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Auditando e Analisando Consistência...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Auditar e Gerar Resumo da Reunião
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: VALIDAÇÃO & ASSINATURA */}
      {meetingStep === 5 && evaluationResult && (
        <div className="glass-card p-6 rounded-2xl border border-slate-800 bg-slate-950/40 space-y-6 animate-fade-in">
          <div className="space-y-1">
            <h3 className="font-bold text-slate-200 text-base font-title">Resultado da Avaliação & Fechamento</h3>
            <p className="text-xs text-slate-400">Abaixo está o parecer e resumo gerados pelo Gemini API a partir da leitura cruzada de ambos os lados.</p>
          </div>

          {/* Consistency Analysis Display */}
          <div className={`p-4 rounded-xl border ${
            evaluationResult.consistencyResult?.consistent
              ? 'bg-emerald-950/20 border-emerald-900/60 text-slate-300'
              : 'bg-amber-950/20 border-amber-900/60 text-slate-300'
          } space-y-3`}>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                {evaluationResult.consistencyResult?.consistent ? (
                  <div className="w-6 h-6 rounded-full bg-emerald-950 border border-emerald-500 flex items-center justify-center text-emerald-400 text-xs font-bold">✓</div>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-amber-950 border border-amber-500 flex items-center justify-center text-amber-400 text-xs font-bold">!</div>
                )}
                <h4 className="text-sm font-bold">
                  {evaluationResult.consistencyResult?.consistent
                    ? 'Concordância Detectada de Informações'
                    : 'Divergência / Desalinhamento Detectado'}
                </h4>
              </div>
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                evaluationResult.consistencyResult?.consistent
                  ? 'bg-emerald-900/40 text-emerald-300'
                  : 'bg-amber-900/40 text-amber-300'
              }`}>
                Alinhamento: {evaluationResult.consistencyResult?.confidenceScore}%
              </span>
            </div>
            <p className="text-xs leading-relaxed text-slate-400 font-sans">
              {evaluationResult.consistencyResult?.details}
            </p>
          </div>

          {/* Compiled Summary */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400">Resumo Final Consolidado da Reunião:</h4>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-850 text-xs text-slate-300 leading-relaxed whitespace-pre-line font-sans">
              {evaluationResult.finalSummary}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs font-sans">
            <div className="p-3 bg-slate-900/30 rounded-xl border border-slate-850 space-y-1">
              <div className="text-slate-500 font-mono">Calibração Liderança</div>
              <div className="text-base font-bold text-indigo-400">{evaluationResult.score}/100</div>
            </div>
            <div className="p-3 bg-slate-900/30 rounded-xl border border-slate-850 space-y-1">
              <div className="text-slate-500 font-mono">Sugestão de Tags</div>
              <div className="flex flex-wrap gap-1 mt-1">
                {evaluationResult.topics?.map((topic: string, i: number) => (
                  <span key={i} className="text-[10px] bg-slate-800 text-indigo-300 px-1.5 py-0.5 rounded">{topic}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Dual digital signature fields */}
          <div className="border-t border-slate-900 pt-4 space-y-4 font-sans">
            <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400">Dupla Validação (Sign-off)</h4>

            {/* Switch persona to sign as colab */}
            <div className="flex items-center gap-2 text-xs text-slate-400 pb-2">
              <input
                type="checkbox"
                id="simcolab"
                checked={isSimulationToggle}
                onChange={(e) => setIsSimulationToggle(e.target.checked)}
                className="w-4 h-4 accent-indigo-500"
              />
              <label htmlFor="simcolab" className="cursor-pointer">Simular interruptor de dispositivo do Liderado ({activeColab.name})</label>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Leader sign */}
              <div className={`p-4 rounded-xl border ${
                leaderApproved ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-400' : 'bg-slate-900/40 border-slate-850 text-slate-400'
              } flex items-center justify-between`}>
                <div>
                  <div className="font-bold text-xs">Assinatura Líder</div>
                  <div className="text-[11px] text-slate-500">{currentUser?.name}</div>
                </div>
                <button
                  onClick={() => setLeaderApproved(prev => !prev)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                    leaderApproved
                      ? 'bg-emerald-600 text-slate-100 border-emerald-500'
                      : 'bg-slate-900 hover:bg-slate-850 border-slate-800 text-slate-300'
                  }`}
                >
                  {leaderApproved ? '✓ Assinado' : 'Assinar'}
                </button>
              </div>

              {/* Colab sign */}
              <div className={`p-4 rounded-xl border ${
                collaboratorApproved ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-400' : 'bg-slate-900/40 border-slate-850 text-slate-400'
              } flex items-center justify-between`}>
                <div>
                  <div className="font-bold text-xs">Assinatura Liderado</div>
                  <div className="text-[11px] text-slate-500">{activeColab.name}</div>
                </div>
                <button
                  disabled={!isSimulationToggle}
                  onClick={() => setCollaboratorApproved(prev => !prev)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                    collaboratorApproved
                      ? 'bg-emerald-600 text-slate-100 border-emerald-500'
                      : !isSimulationToggle
                      ? 'bg-slate-900 opacity-40 cursor-not-allowed border-slate-800 text-slate-500'
                      : 'bg-slate-900 hover:bg-slate-850 border-slate-800 text-slate-300'
                  }`}
                >
                  {collaboratorApproved ? '✓ Assinado' : 'Assinar'}
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => setMeetingStep(4)}
              className="bg-slate-900 border border-slate-800 text-slate-400 text-xs font-bold py-2.5 px-5 rounded-xl"
            >
              Voltar
            </button>
            <button
              type="button"
              onClick={handleGenerateFeedbackLink}
              className="flex-1 bg-cyan-650 hover:bg-cyan-550 text-slate-100 text-xs font-bold py-2.5 px-5 rounded-xl transition-all flex items-center justify-center gap-1.5"
            >
              <Copy className="w-3.5 h-3.5" />
              {savedMeetingId ? 'Copiar Link Liderado' : 'Gerar Link Feedback'}
            </button>
            <button
              onClick={handleArchiveMeeting}
              className="flex-1 bg-indigo-650 hover:bg-indigo-550 text-slate-100 text-xs font-bold py-2.5 rounded-xl transition-all"
            >
              Arquivar no Supabase & Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
