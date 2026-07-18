'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { storage } from '@/lib/storage';
import { Check } from 'lucide-react';
import Swal from 'sweetalert2';
import { UserSession, LeaderProfile, LeaderProfileType } from '@/types';

interface LeaderOnboardingProps {
  currentUser: UserSession;
  setLeaderProfile: (profile: LeaderProfile | null) => void;
  setCurrentUser: (session: UserSession | null) => void;
  setActiveSection: (section: any) => void;
  setMeetingStep: (step: number) => void;
}

export default function LeaderOnboarding({
  currentUser,
  setLeaderProfile,
  setCurrentUser,
  setActiveSection,
  setMeetingStep
}: LeaderOnboardingProps) {
  const [levelFrom, setLevelFrom] = useState('Coordenador');
  const [levelTo, setLevelTo] = useState('Gerente de Engenharia');
  const [diagnosedProfile, setDiagnosedProfile] = useState<LeaderProfileType | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [answers, setAnswers] = useState<Record<number, 'A' | 'B' | 'C'>>({});

  const quizQuestions = [
    {
      id: 1,
      question: "1. Qual o seu foco principal ao preparar uma reunião de 1:1?",
      options: [
        { key: 'A', text: "Remover impedimentos técnicos, revisar prazos e metas operacionais o mais rápido possível." },
        { key: 'B', text: "Apoiar no desenvolvimento de competências comportamentais e fornecer feedbacks estruturados passo a passo." },
        { key: 'C', text: "Discutir planos de PDI a longo prazo de forma resumida e altamente otimizada, pois minha agenda é cheia." }
      ]
    },
    {
      id: 2,
      question: "2. Como você reage diante de um colaborador que apresenta baixa performance persistente?",
      options: [
        { key: 'A', text: "Vou direto ao ponto técnico: descrevo a meta não batida e cobro o prazo de entrega imediatamente." },
        { key: 'B', text: "Utilizo o método SBI (Situação, Comportamento, Impacto) para dar um feedback sensível e estruturado." },
        { key: 'C', text: "Foco rápido em co-criar um plano de ação ágil e resumido para acompanhamento simples nas próximas semanas." }
      ]
    },
    {
      id: 3,
      question: "3. Qual a sua maior dificuldade ou limitação de tempo na rotina de gestão de pessoas?",
      options: [
        { key: 'A', text: "Tenho pouca paciência para jargões corporativos de RH; prefiro check-ins simples e diretos." },
        { key: 'B', text: "Sinto falta de ferramentas de inteligência emocional para conduzir feedbacks difíceis sem prejudicar o clima." },
        { key: 'C', text: "Acredito no desenvolvimento de pessoas, mas sofro com extrema falta de tempo na minha agenda diária." }
      ]
    },
    {
      id: 4,
      question: "4. Como você define o plano de PDI com um novo colaborador?",
      options: [
        { key: 'A', text: "Foco rápido em metas de certificações técnicas e sprints entregues." },
        { key: 'B', text: "Mapeamento de competências socioemocionais detalhado usando ferramentas comportamentais." },
        { key: 'C', text: "Plano enxuto e pragmático focado no próximo cargo do organograma." }
      ]
    },
    {
      id: 5,
      question: "5. Diante de um conflito de arquitetura técnica entre dois engenheiros seniores, o que você faz?",
      options: [
        { key: 'A', text: "Reviso os logs de commits e a documentação para impor a melhor solução técnica." },
        { key: 'B', text: "Facilito uma conversa empática entre ambos para compreender as motivações de cada um." },
        { key: 'C', text: "Decido rapidamente com base na opção que trará menos impacto ao cronograma da entrega." }
      ]
    },
    {
      id: 6,
      question: "6. Como você prefere receber o status de progresso das tarefas de sua equipe?",
      options: [
        { key: 'A', text: "Logs diretos no Jira/Github, sem necessidade de reuniões de status longas." },
        { key: 'B', text: "Em conversas individuais detalhadas (1:1s), avaliando o sentimento e as dificuldades do profissional." },
        { key: 'C', text: "Em um resumo executivo unificado (dashboard) enviado semanalmente por e-mail." }
      ]
    },
    {
      id: 7,
      question: "7. Um colaborador pede feedback sobre como melhorar suas habilidades de soft skills. Qual sua resposta?",
      options: [
        { key: 'A', text: "Sugiro ler a documentação interna da Clear IT e focar em entregar as sprints sem gerar atritos." },
        { key: 'B', text: "Agendo sessões estruturadas usando o modelo SBI para exercitarmos inteligência emocional." },
        { key: 'C', text: "Conecto-o com um mentor experiente e indico um curso rápido de liderança situacional." }
      ]
    }
  ];

  const handleSelectOption = (qId: number, optionKey: 'A' | 'B' | 'C') => {
    setAnswers(prev => ({ ...prev, [qId]: optionKey }));
  };

  const handleCalculateProfile = () => {
    if (Object.keys(answers).length < 7) {
      setShowWarning(true);
      return;
    }
    setShowWarning(false);

    let countA = 0;
    let countB = 0;
    let countC = 0;

    Object.values(answers).forEach(val => {
      if (val === 'A') countA++;
      else if (val === 'B') countB++;
      else countC++;
    });

    let profile: LeaderProfileType = 'TRANSICAO';
    if (countA > countB && countA > countC) {
      profile = 'TECNICO';
    } else if (countC > countA && countC > countB) {
      profile = 'ENGAJADO';
    }

    setDiagnosedProfile(profile);
  };

  const handleSaveProfile = async () => {
    if (!currentUser || !diagnosedProfile) return;

    // Bypass para o Líder de Teste
    if (currentUser.email?.toLowerCase().trim() === 'lider.teste@clearit.com.br') {
      const lProfile: LeaderProfile = {
        id: currentUser.id || '',
        email: currentUser.email || '',
        name: currentUser.name || '',
        profile: diagnosedProfile,
        levelFrom: levelFrom,
        levelTo: levelTo
      };
      setLeaderProfile(lProfile);
      
      const updatedUser = { ...currentUser, profile: diagnosedProfile };
      setCurrentUser(updatedUser);

      Swal.fire({
        title: 'Perfil Configurado (Teste)!',
        text: `[AMBIENTE DE TESTE] Seu perfil foi definido temporariamente como Líder ${diagnosedProfile.toLowerCase()}. Os dados não foram salvos no banco para permitir testes ilimitados!`,
        icon: 'success',
        background: '#0f172a',
        color: '#cbd5e1',
        confirmButtonColor: '#4f46e5'
      });

      setActiveSection('copiloto');
      setMeetingStep(1);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          profile_type: diagnosedProfile,
          level_from: levelFrom,
          level_to: levelTo
        })
        .eq('email', currentUser.email)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const lProfile: LeaderProfile = {
          id: data.id,
          email: data.email,
          name: data.name,
          profile: data.profile_type as LeaderProfileType,
          levelFrom: data.level_from || 'Coordenador',
          levelTo: data.level_to || 'Gerente'
        };
        setLeaderProfile(lProfile);
        storage.setLeaderProfile(lProfile);

        // Update local session
        const updatedUser = { ...currentUser, profile: diagnosedProfile };
        setCurrentUser(updatedUser);
        storage.setCurrentUser(updatedUser);

        Swal.fire({
          title: 'Perfil Configurado!',
          text: `Seu perfil foi definido como Líder ${diagnosedProfile.toLowerCase()} no Supabase.`,
          icon: 'success',
          background: '#0f172a',
          color: '#cbd5e1',
          confirmButtonColor: '#4f46e5'
        });

        // Switch to main copiloto view
        setActiveSection('copiloto');
        setMeetingStep(1);
      }
    } catch (err: any) {
      Swal.fire('Erro', 'Falha ao salvar perfil no Supabase: ' + err.message, 'error');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in text-left">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-slate-100 font-title">Onboarding e Diagnóstico de Liderança</h2>
        <p className="text-xs text-slate-400">Responda ao formulário situacional para a IA identificar seu perfil de atuação (Técnico, Transição ou Engajado).</p>
      </div>

      <div className="glass-card p-6 rounded-2xl border border-slate-800 bg-slate-950/40 space-y-6">
        {/* Level Selectors */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-semibold font-mono uppercase tracking-wider">Cargo / Nível Atual</label>
            <select
              value={levelFrom}
              onChange={(e) => setLevelFrom(e.target.value)}
              className="w-full bg-slate-900 border border-slate-850 rounded-xl py-2 px-3 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
            >
              <option>Coordenador</option>
              <option>Líder Técnico</option>
              <option>Gerente Operacional</option>
              <option>Diretor</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-semibold font-mono uppercase tracking-wider">Nível de Destino / Alvo</label>
            <select
              value={levelTo}
              onChange={(e) => setLevelTo(e.target.value)}
              className="w-full bg-slate-900 border border-slate-850 rounded-xl py-2 px-3 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
            >
              <option>Gerente de Engenharia</option>
              <option>Gerente Geral</option>
              <option>Diretor de Tecnologia</option>
              <option>C-Level</option>
            </select>
          </div>
        </div>

        <div className="border-t border-slate-900 my-4" />

        {/* Questions */}
        <div className="space-y-6">
          {quizQuestions.map((q) => (
            <div key={q.id} className="space-y-3">
              <h4 className="text-sm font-semibold text-slate-200">{q.question}</h4>
              <div className="grid gap-2">
                {q.options.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => handleSelectOption(q.id, opt.key as any)}
                    className={`p-3 text-xs text-left rounded-xl border transition-all ${
                      answers[q.id] === opt.key
                        ? 'bg-indigo-950/30 border-indigo-550 text-slate-100 font-medium'
                        : 'bg-slate-900/30 border-slate-900 text-slate-400 hover:bg-slate-900/60'
                    }`}
                  >
                    <span className="font-mono text-indigo-400 font-bold mr-2">{opt.key})</span>
                    {opt.text}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {showWarning && (
          <p className="text-xs text-amber-400 font-medium animate-pulse">⚠️ Por favor, responda todas as 7 perguntas antes de calcular seu perfil.</p>
        )}

        <button
          type="button"
          onClick={handleCalculateProfile}
          className="w-full bg-indigo-650 hover:bg-indigo-550 text-slate-100 text-xs font-bold py-3 rounded-xl transition-all"
        >
          Diagnosticar Perfil de Liderança
        </button>
      </div>

      {diagnosedProfile && (
        <div className="glass-card p-6 rounded-2xl border border-indigo-900/60 bg-indigo-950/20 space-y-4 animate-fade-in">
          <div className="space-y-1">
            <h3 className="font-bold text-slate-100 text-sm uppercase tracking-wide">Seu Estilo Diagnosticado</h3>
            <div className="text-xl font-bold text-emerald-400 flex items-center gap-1.5">
              <span>{diagnosedProfile === 'TECNICO' ? '🤖' : diagnosedProfile === 'TRANSICAO' ? '🌱' : '🔥'}</span>
              <span>Líder {diagnosedProfile}</span>
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            {diagnosedProfile === 'TECNICO' && "Seu perfil foca em entregas operacionais objetivas, check-ins diretos e eliminação de impedimentos e burocracia de RH. A IA formulará roteiros enxutos de foco prático."}
            {diagnosedProfile === 'TRANSICAO' && "Seu perfil é estruturado e requer o método SBI (Situação, Comportamento, Impacto) e inteligência emocional para guiar feedbacks sensíveis com segurança."}
            {diagnosedProfile === 'ENGAJADO' && "Seu perfil prioriza agilidade, planos de PDI rápidos e alinhamentos de carreira eficientes de menos de 3 minutos de preparação."}
          </p>

          <button
            type="button"
            onClick={handleSaveProfile}
            className="bg-emerald-600 hover:bg-emerald-500 text-slate-100 text-xs font-bold py-2.5 px-6 rounded-xl transition-all flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            Confirmar e Gravar no Supabase
          </button>
        </div>
      )}
    </div>
  );
}
