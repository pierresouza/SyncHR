'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { storage } from '@/lib/storage';
import { DiscProfileType, Collaborator } from '@/types';
import { 
  User, 
  Mail, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  ShieldCheck, 
  HelpCircle, 
  Loader2, 
  Award,
  Zap,
  Users,
  Heart,
  Settings,
  Search
} from 'lucide-react';
import Swal from 'sweetalert2';

interface QuizQuestion {
  id: number;
  question: string;
  options: {
    text: string;
    disc: DiscProfileType;
    explanation: string;
  }[];
}

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: "Como você costuma agir ao se deparar com um grande desafio ou problema técnico complexo?",
    options: [
      { 
        text: "Tomo a iniciativa imediatamente, foco no resultado e busco resolver da forma mais rápida possível.", 
        disc: "DOMINANTE",
        explanation: "Foco em velocidade, resolução assertiva e entrega de impacto."
      },
      { 
        text: "Discuto com meus colegas, busco engajar as pessoas e apresentar ideias inovadoras de forma colaborativa.", 
        disc: "INFLUENTE",
        explanation: "Foco em comunicação ativa, conexões humanas e criatividade."
      },
      { 
        text: "Analiso o impacto no ritmo de trabalho do time, busco apoio mútuo e evito mudanças bruscas no planejamento.", 
        disc: "ESTAVEL",
        explanation: "Foco em consistência, segurança da squad e estabilidade operacional."
      },
      { 
        text: "Me aprofundo nos dados, leio a documentação detalhadamente e sigo processos de arquitetura rígidos e precisos.", 
        disc: "ANALITICO",
        explanation: "Foco em alta qualidade técnica, cobertura de testes e exatidão dos processos."
      }
    ]
  },
  {
    id: 2,
    question: "Em situações de alta pressão por prazos apertados na sprint, qual é o seu comportamento padrão?",
    options: [
      { 
        text: "Fico extremamente focado na entrega técnica do meu código, buscando autonomia para contornar burocracias se necessário.", 
        disc: "DOMINANTE",
        explanation: "Orientação forte para superação de blockers e senso de urgência."
      },
      { 
        text: "Converso e socializo mais com o time para manter o moral elevado e aliviar a tensão do ambiente de trabalho.", 
        disc: "INFLUENTE",
        explanation: "Orientação para otimismo, descontração e mediação de clima."
      },
      { 
        text: "Sigo pacientemente o plano combinado sem me desesperar, apoiando colegas que demonstrem estar sobrecarregados.", 
        disc: "ESTAVEL",
        explanation: "Orientação para resiliência emocional, colaboração calma e ritmo regular."
      },
      { 
        text: "Dedico ainda mais atenção aos detalhes e testes para garantir que a pressa não gere bugs em produção.", 
        disc: "ANALITICO",
        explanation: "Orientação para zero defeito, integridade de código e conformidade técnica."
      }
    ]
  },
  {
    id: 3,
    question: "Qual tipo de ambiente de trabalho corporativo mais contribui para a sua motivação diária?",
    options: [
      { 
        text: "Um ambiente dinâmico, desafiador, com metas claras e com bastante autonomia para decidir caminhos.", 
        disc: "DOMINANTE",
        explanation: "Valoriza meritocracia, inovação rápida e independência."
      },
      { 
        text: "Um ambiente integrado, onde as ideias de todos são bem-vindas e haja reconhecimento público de conquistas.", 
        disc: "INFLUENTE",
        explanation: "Valoriza visibilidade de resultados, feedback verbal positivo e espírito de equipe."
      },
      { 
        text: "Um ambiente seguro, sem cobranças imprevisíveis, com processos claros e cooperação mútua estável.", 
        disc: "ESTAVEL",
        explanation: "Valoriza previsibilidade, alinhamento sincero e harmonia coletiva."
      },
      { 
        text: "Um ambiente altamente técnico, silencioso, organizado e focado na excelência metodológica de desenvolvimento.", 
        disc: "ANALITICO",
        explanation: "Valoriza documentação atualizada, padrões de código e racionalidade estruturada."
      }
    ]
  },
  {
    id: 4,
    question: "Qual é o seu principal critério de satisfação ao concluir uma entrega de software?",
    options: [
      { 
        text: "Saber que o deploy gerou valor imediato para o cliente final e resolveu a dor do negócio de forma eficiente.", 
        disc: "DOMINANTE",
        explanation: "Busca pragmatismo e retorno operacional imediato."
      },
      { 
        text: "Ver o time e os stakeholders comemorando a entrega, sabendo que tive um papel de destaque na facilitação.", 
        disc: "INFLUENTE",
        explanation: "Busca engajamento e inspiração da equipe."
      },
      { 
        text: "Ter a certeza de que a nova funcionalidade foi integrada de forma suave e não causou impactos na rotina do sistema.", 
        disc: "ESTAVEL",
        explanation: "Busca segurança operacional e consolidação gradual."
      },
      { 
        text: "Alcançar 100% de cobertura de testes, validações rigorosas de segurança e ter a aprovação irretocável de outros engenheiros.", 
        disc: "ANALITICO",
        explanation: "Busca qualidade técnica extrema e controle metodológico."
      }
    ]
  }
];

export default function CollaboratorOnboardingPage() {
  const router = useRouter();

  // Navigation Steps: 1 = Search Email, 2 = DISC Quiz, 3 = Calculated Result, 4 = Saving / Success
  const [step, setStep] = useState(1);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [email, setEmail] = useState('');
  const [collaborator, setCollaborator] = useState<Collaborator | null>(null);
  const [leaderName, setLeaderName] = useState('Não atribuído');

  // Quiz States
  const [answers, setAnswers] = useState<Record<number, DiscProfileType>>({});
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);

  // Result States
  const [calculatedDisc, setCalculatedDisc] = useState<DiscProfileType | null>(null);

  // Auto-search if email query parameter is present
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const emailParam = params.get('email');
      if (emailParam) {
        setEmail(emailParam);
        performSearch(emailParam);
      }
    }
  }, []);

  const performSearch = async (targetEmail: string) => {
    if (!targetEmail.trim()) return;

    setSearching(true);
    try {
      // 1. Buscar colaborador por email no Supabase
      const { data, error } = await supabase
        .from('collaborators')
        .select('*')
        .eq('email', targetEmail.trim().toLowerCase())
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar no Supabase:', error);
      }

      let colabRecord: Collaborator | null = null;

      if (data) {
        colabRecord = {
          id: data.id,
          name: data.name,
          email: data.email,
          disc: data.disc,
          level: data.level,
          role: data.role,
          leaderId: data.leader_id
        };
      } else {
        // Fallback local storage
        const localColabs = storage.getCollaborators();
        const foundLocal = localColabs.find(c => c.email?.toLowerCase() === targetEmail.trim().toLowerCase());
        if (foundLocal) {
          colabRecord = foundLocal;
        }
      }

      if (!colabRecord) {
        Swal.fire({
          title: 'Cadastro Não Encontrado',
          text: 'Seu e-mail corporativo não foi localizado no sistema. Por favor, solicite ao RH (Priscila Bacelar) que realize o seu pré-cadastro.',
          icon: 'error',
          background: '#0f172a',
          color: '#cbd5e1',
          confirmButtonColor: '#ef4444'
        });
        setSearching(false);
        return;
      }

      setCollaborator(colabRecord);

      // Buscar nome do líder para exibição amigável
      if (colabRecord.leaderId) {
        const { data: leaderProfile } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', colabRecord.leaderId)
          .maybeSingle();
        
        if (leaderProfile) {
          setLeaderName(leaderProfile.name);
        } else {
          // Check mock leaders in storage
          const foundLdr = storage.getUsers().find(u => u.id === colabRecord?.leaderId);
          if (foundLdr) setLeaderName(foundLdr.name);
        }
      }

      // Avançar para o Quiz
      Swal.fire({
        title: `Olá, ${colabRecord.name}!`,
        text: 'Localizamos seu cadastro profissional. Agora faremos seu diagnóstico comportamental DISC.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
        background: '#0f172a',
        color: '#cbd5e1'
      });
      
      setTimeout(() => {
        setStep(2);
      }, 1500);

    } catch (err: any) {
      console.error(err);
      Swal.fire('Erro', 'Erro ao localizar cadastro: ' + err.message, 'error');
    } finally {
      setSearching(false);
    }
  };

  const handleSearchEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      Swal.fire('Atenção', 'Por favor, insira o seu e-mail corporativo cadastrado.', 'warning');
      return;
    }
    await performSearch(email);
  };

  const handleSelectOption = (questionId: number, disc: DiscProfileType) => {
    setAnswers(prev => ({ ...prev, [questionId]: disc }));
    
    // Auto advance or show results
    if (currentQuizIndex < QUIZ_QUESTIONS.length - 1) {
      setTimeout(() => {
        setCurrentQuizIndex(prev => prev + 1);
      }, 300);
    } else {
      // Last question answered, calculate and go to results
      setTimeout(() => {
        calculateDISC();
      }, 350);
    }
  };

  const calculateDISC = () => {
    const counts: Record<DiscProfileType, number> = {
      DOMINANTE: 0,
      ESTAVEL: 0,
      ANALITICO: 0,
      INFLUENTE: 0,
      PENDENTE: 0
    };

    // Count answers
    Object.values(answers).forEach(val => {
      counts[val] = (counts[val] || 0) + 1;
    });

    // Find the highest score
    let highestDisc: DiscProfileType = 'ESTAVEL';
    let highestCount = -1;

    (Object.keys(counts) as DiscProfileType[]).forEach(profile => {
      if (counts[profile] > highestCount) {
        highestCount = counts[profile];
        highestDisc = profile;
      }
    });

    setCalculatedDisc(highestDisc);
    setStep(3);
  };

  const handleBackQuestion = () => {
    if (currentQuizIndex > 0) {
      setCurrentQuizIndex(prev => prev - 1);
    } else {
      setStep(1);
      setCollaborator(null);
      setAnswers({});
      setCurrentQuizIndex(0);
    }
  };

  const handleSaveOnboarding = async () => {
    if (!calculatedDisc || !collaborator) return;
    setSaving(true);

    // Bypass para o colaborador de testes
    if (collaborator.email?.toLowerCase().trim() === 'liderado.teste@clearit.com.br') {
      setTimeout(() => {
        setSaving(false);
        setStep(4);
        Swal.fire({
          title: 'Onboarding de Teste Concluído!',
          text: `[AMBIENTE DE TESTE] Seu perfil calculado foi ${calculatedDisc}. Os dados não foram salvos no banco de dados para permitir testes ilimitados!`,
          icon: 'success',
          background: '#0f172a',
          color: '#cbd5e1',
          confirmButtonColor: '#10b981',
          customClass: { popup: 'border border-slate-800 rounded-2xl font-sans' }
        });
      }, 800);
      return;
    }

    const updatedCollaborator: Collaborator = {
      ...collaborator,
      disc: calculatedDisc
    };

    try {
      // 1. Gravar atualização no Supabase
      const { error } = await supabase
        .from('collaborators')
        .update({
          disc: calculatedDisc
        })
        .eq('id', collaborator.id);

      if (error) {
        console.error('Falha ao atualizar no Supabase. Atualizando localmente...', error);
      }

      // 2. Gravar no LocalStorage para redundância e resiliência local
      storage.saveCollaborator(updatedCollaborator);

      // Sucesso
      setStep(4);
      Swal.fire({
        title: 'Onboarding Concluído!',
        text: `Seu perfil comportamental foi atualizado como ${calculatedDisc}.`,
        icon: 'success',
        background: '#0f172a',
        color: '#cbd5e1',
        confirmButtonColor: '#10b981',
        customClass: { popup: 'border border-slate-800 rounded-2xl font-sans' }
      });
    } catch (err: any) {
      console.error(err);
      Swal.fire('Erro', 'Ocorreu um problema ao registrar os dados: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  // UI variables for DISC Profiles
  const getDiscStyles = (disc: DiscProfileType) => {
    switch (disc) {
      case 'DOMINANTE':
        return {
          bg: 'bg-red-950/40 border-red-900/60 text-red-400',
          gradient: 'from-red-650/20 via-red-900/10 to-transparent',
          shadow: 'shadow-red-500/10',
          badge: 'bg-red-500/20 border-red-500/40 text-red-300',
          icon: <Zap className="w-10 h-10 text-red-400" />,
          title: "Dominante (D)",
          desc: "Foco absoluto em resultados práticos, superação de obstáculos e senso de urgência acentuado. Valoriza a velocidade e autonomia de atuação.",
          tips: [
            "Seja direto e focado em blockers práticos durante as reuniões.",
            "Apresente dados e decisões rápidas, evitando rodeios ou burocracias de pauta.",
            "Estimule metas agressivas e dê espaço para que assuma a responsabilidade."
          ]
        };
      case 'INFLUENTE':
        return {
          bg: 'bg-violet-950/40 border-violet-900/60 text-violet-400',
          gradient: 'from-violet-650/20 via-violet-900/10 to-transparent',
          shadow: 'shadow-violet-500/10',
          badge: 'bg-violet-500/20 border-violet-500/40 text-violet-300',
          icon: <Users className="w-10 h-10 text-violet-400" />,
          title: "Influente (I)",
          desc: "Foco na comunicação ativa, otimismo e facilitação do espírito de equipe. Valoriza o reconhecimento público de seus avanços e conexões interpessoais.",
          tips: [
            "Inicie as conversas com perguntas sobre o clima e bem-estar (quebra-gelo).",
            "Destaque e parabenize verbalmente as boas ideias e as contribuições táticas dele.",
            "Evite roteiros rígidos demais e dê liberdade para que ele compartilhe opiniões."
          ]
        };
      case 'ESTAVEL':
        return {
          bg: 'bg-emerald-950/40 border-emerald-900/60 text-emerald-400',
          gradient: 'from-emerald-650/20 via-emerald-900/10 to-transparent',
          shadow: 'shadow-emerald-500/10',
          badge: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300',
          icon: <Heart className="w-10 h-10 text-emerald-400" />,
          title: "Estável (S)",
          desc: "Foco na segurança, resiliência emocional de equipe e ritmo estruturado. Valoriza o planejamento previsível, empatia sincera e a colaboração gradativa.",
          tips: [
            "Mantenha um tom de voz calmo, acolhedor e escute ativamente suas dores (regra 70/30).",
            "Garanta previsibilidade de prazos e evite alterações surpresa de escopo sem alinhamento prévio.",
            "Ajude a balancear a carga de trabalho e ofereça apoio estruturado em momentos de estresse."
          ]
        };
      case 'ANALITICO':
        return {
          bg: 'bg-cyan-950/40 border-cyan-900/60 text-cyan-400',
          gradient: 'from-cyan-650/20 via-cyan-900/10 to-transparent',
          shadow: 'shadow-cyan-500/10',
          badge: 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300',
          icon: <Settings className="w-10 h-10 text-cyan-400" />,
          title: "Analítico (C)",
          desc: "Foco extremo na excelência técnica, exatidão dos fluxos e cobertura metodológica. Valoriza documentações, code reviews detalhados e precisão técnica.",
          tips: [
            "Traga pautas altamente estruturadas e documentadas com antecedência.",
            "Evite argumentos subjetivos ou emocionais. Baseie-se em métricas de qualidade de código e testes.",
            "Respeite o tempo necessário para análise detalhada de problemas antes de cobrar soluções rápidas."
          ]
        };
    }
  };

  const discInfo = calculatedDisc ? getDiscStyles(calculatedDisc) : null;

  return (
    <main className="min-h-screen bg-[#0b0f19] text-slate-100 p-4 md:p-8 flex items-center justify-center relative overflow-hidden font-sans">
      
      {/* Background glowing blobs */}
      <div className="absolute w-[400px] h-[400px] rounded-full bg-indigo-500/5 top-1/4 left-1/4 orb pointer-events-none" />
      <div className="absolute w-[500px] h-[500px] rounded-full bg-cyan-500/3 bottom-10 right-10 orb pointer-events-none" />

      <div className="w-full max-w-[680px] relative z-10 space-y-6">
        
        {/* Header Title */}
        <div className="text-center space-y-2">
          <span className="text-[10px] tracking-widest text-emerald-400 bg-emerald-950/40 border border-emerald-900/40 px-3 py-1 rounded-full uppercase font-mono font-bold">
            Portal do Liderado (Clear IT)
          </span>
          <h1 className="text-2xl md:text-3xl font-black font-title tracking-tight bg-gradient-to-r from-slate-100 via-indigo-200 to-cyan-400 bg-clip-text text-transparent">
            Onboarding e Teste DISC
          </h1>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Identifique-se com o seu e-mail cadastrado pelo RH e conclua seu teste comportamental.
          </p>
        </div>

        {/* Stepper progress indicator */}
        <div className="flex justify-between items-center max-w-xs mx-auto">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-1.5">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold font-mono transition-all border ${
                step === s 
                  ? 'bg-indigo-650 border-indigo-500 text-slate-100 shadow-md shadow-indigo-555/20' 
                  : step > s 
                    ? 'bg-emerald-950 border-emerald-800 text-emerald-400' 
                    : 'bg-transparent border-slate-900 text-slate-600'
              }`}>
                {step > s ? <Check className="w-3.5 h-3.5" /> : s}
              </span>
              <span className={`text-[10px] font-bold uppercase font-mono tracking-wider ${
                step === s ? 'text-indigo-400' : 'text-slate-600'
              }`}>
                {s === 1 && 'E-mail'}
                {s === 2 && 'DISC Quiz'}
                {s === 3 && 'Diagnóstico'}
              </span>
              {s < 3 && <div className="h-[1px] w-4 bg-slate-900" />}
            </div>
          ))}
        </div>

        {/* STEP 1: ENTER EMAIL */}
        {step === 1 && (
          <form onSubmit={handleSearchEmail} className="glass-card p-6 rounded-2xl border border-slate-800/80 bg-slate-950/40 space-y-5 animate-fade-in text-left">
            <h3 className="font-bold text-sm text-slate-200 font-title flex items-center gap-1.5 pb-2 border-b border-slate-900">
              <Search className="w-4.5 h-4.5 text-indigo-400" />
              Identifique o seu Acesso
            </h3>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase font-mono tracking-wider text-slate-400">Insira seu E-mail Corporativo</label>
                <p className="text-[10px] text-slate-500 leading-normal mb-2 font-sans">Para testar, utilize um dos e-mails pré-cadastrados (ex: <code>mariana.souza@clearit.com.br</code> ou <code>carlos.santos@clearit.com.br</code>).</p>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="mariana.souza@clearit.com.br"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-9 pr-4 text-slate-100 text-xs focus:outline-none focus:border-indigo-500 font-sans"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 flex gap-4">
              <button
                type="button"
                onClick={() => router.push('/login')}
                className="bg-slate-900 border border-slate-855 hover:bg-slate-850 text-slate-400 text-xs font-bold py-2.5 px-5 rounded-xl transition-all"
              >
                Voltar ao Login
              </button>
              <button
                type="submit"
                disabled={searching}
                className="bg-gradient-to-r from-indigo-650 to-indigo-750 hover:from-indigo-600 hover:to-indigo-700 disabled:opacity-50 text-slate-100 text-xs font-bold py-2.5 px-5 rounded-xl flex-1 transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-500/10 font-sans"
              >
                {searching ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Localizando cadastro...
                  </>
                ) : (
                  <>
                    Buscar Cadastro
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: DISC QUIZ */}
        {step === 2 && collaborator && (
          <div className="glass-card p-6 rounded-2xl border border-slate-800/80 bg-slate-950/40 space-y-6 animate-fade-in text-left font-sans">
            
            {/* Collaborator profile preview */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900/40 border border-slate-850 rounded-xl text-xs">
              <div>
                <span className="text-[10px] font-mono text-slate-500 block uppercase">Colaborador</span>
                <span className="font-bold text-slate-200">{collaborator.name}</span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-500 block uppercase">Cargo</span>
                <span className="text-slate-350">{collaborator.role} ({collaborator.level})</span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-500 block uppercase">Líder Relacionado</span>
                <span className="text-indigo-400 font-semibold">{leaderName}</span>
              </div>
            </div>

            {/* Quiz progress */}
            <div className="flex justify-between items-center pb-3 border-b border-slate-900">
              <h3 className="font-bold text-xs text-indigo-400 font-mono uppercase tracking-wider flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-indigo-400" />
                Pergunta {currentQuizIndex + 1} de {QUIZ_QUESTIONS.length}
              </h3>
              <span className="text-[10px] text-slate-500 font-mono font-semibold">
                Progresso: {Math.round(((currentQuizIndex) / QUIZ_QUESTIONS.length) * 100)}%
              </span>
            </div>

            {/* Question Text */}
            <div className="space-y-4">
              <p className="text-sm font-bold text-slate-200 leading-relaxed font-title">
                {QUIZ_QUESTIONS[currentQuizIndex].question}
              </p>

              {/* Options */}
              <div className="grid grid-cols-1 gap-3.5">
                {QUIZ_QUESTIONS[currentQuizIndex].options.map((opt, oIdx) => {
                  const isSelected = answers[QUIZ_QUESTIONS[currentQuizIndex].id] === opt.disc;

                  return (
                    <button
                      key={oIdx}
                      type="button"
                      onClick={() => handleSelectOption(QUIZ_QUESTIONS[currentQuizIndex].id, opt.disc)}
                      className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3 hover:bg-slate-900/60 ${
                        isSelected 
                          ? 'bg-indigo-950/30 border-indigo-550 text-slate-100 shadow-md shadow-indigo-500/5' 
                          : 'bg-slate-900/20 border-slate-850 text-slate-300'
                      }`}
                    >
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold font-mono border mt-0.5 shrink-0 transition-all ${
                        isSelected 
                          ? 'bg-indigo-600 border-indigo-400 text-slate-100' 
                          : 'bg-slate-900 border-slate-800 text-slate-500'
                      }`}>
                        {String.fromCharCode(65 + oIdx)}
                      </span>
                      <div className="space-y-1">
                        <div className="text-xs font-semibold leading-relaxed font-sans">{opt.text}</div>
                        <div className="text-[10px] text-slate-500 italic font-mono font-semibold">{opt.explanation}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Question Nav Buttons */}
            <div className="pt-2 flex justify-between items-center">
              <button
                type="button"
                onClick={handleBackQuestion}
                className="bg-transparent border border-transparent hover:bg-slate-900/40 text-slate-400 hover:text-slate-200 text-xs font-bold py-2.5 px-4 rounded-xl transition-all flex items-center gap-1.5 font-sans"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </button>
              
              <div className="flex gap-1">
                {QUIZ_QUESTIONS.map((q, qIdx) => (
                  <span 
                    key={q.id} 
                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                      qIdx === currentQuizIndex ? 'bg-indigo-400 w-3' : qIdx < currentQuizIndex ? 'bg-indigo-900' : 'bg-slate-900'
                    }`} 
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: RESULT AND PERSIST */}
        {step === 3 && discInfo && collaborator && (
          <div className="glass-card p-6 rounded-2xl border border-slate-800/80 bg-slate-950/40 space-y-6 animate-fade-in text-left font-sans">
            <h3 className="font-bold text-sm text-slate-200 font-title flex items-center gap-1.5 pb-2 border-b border-slate-900">
              <Award className="w-4.5 h-4.5 text-indigo-400 animate-bounce" />
              Resultado do Diagnóstico Comportamental
            </h3>

            {/* Result Profile Card */}
            <div className={`p-5 rounded-2xl border bg-gradient-to-br ${discInfo.bg} ${discInfo.gradient} ${discInfo.shadow} flex flex-col md:flex-row gap-4 items-center md:items-start text-center md:text-left`}>
              <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-2xl shrink-0">
                {discInfo.icon}
              </div>
              <div className="space-y-2">
                <div className="flex flex-col md:flex-row items-center gap-2">
                  <span className="font-title font-black text-lg text-slate-100">{discInfo.title}</span>
                  <span className={`text-[9px] px-2 py-0.5 rounded font-mono font-bold ${discInfo.badge}`}>
                    Perfil DISC Determinado
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  {discInfo.desc}
                </p>
              </div>
            </div>

            {/* Tips for working with this profile */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest">
                Dicas para o seu Gestor ({leaderName})
              </h4>
              <ul className="grid grid-cols-1 gap-2">
                {discInfo.tips.map((tip, idx) => (
                  <li key={idx} className="flex gap-2 text-xs text-slate-400 items-start leading-relaxed font-sans bg-slate-900/30 p-2.5 rounded-xl border border-slate-850">
                    <span className="w-4 h-4 rounded-full bg-slate-900 flex items-center justify-center text-[9px] font-bold font-mono text-indigo-400 shrink-0 border border-slate-800 mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Persistence Action buttons */}
            <div className="pt-2 flex gap-4">
              <button
                type="button"
                disabled={saving}
                onClick={() => {
                  setAnswers({});
                  setCurrentQuizIndex(0);
                  setStep(2);
                }}
                className="bg-slate-900 border border-slate-850 hover:bg-slate-850 text-slate-400 text-xs font-bold py-2.5 px-4 rounded-xl transition-all"
              >
                Refazer Questionário
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleSaveOnboarding}
                className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-slate-100 text-xs font-bold py-2.5 px-5 rounded-xl flex-1 transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-550/10 font-sans"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Atualizando Perfil...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    Confirmar e Salvar Diagnóstico
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: SUCCESS AND LANDING */}
        {step === 4 && collaborator && (
          <div className="glass-card p-8 rounded-2xl border border-slate-800/80 bg-slate-950/40 text-center space-y-6 animate-fade-in relative overflow-hidden font-sans">
            <div className="absolute w-[200px] h-[200px] rounded-full bg-emerald-500/5 -top-10 -right-10 orb pointer-events-none" />

            <div className="w-14 h-14 rounded-full bg-emerald-950/60 border border-emerald-500 flex items-center justify-center mx-auto text-emerald-400">
              <ShieldCheck className="w-8 h-8" />
            </div>

            <div className="space-y-2 max-w-sm mx-auto">
              <h3 className="font-title font-black text-xl text-slate-200">Perfil Calibrado!</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Seu perfil comportamental DISC foi salvo com sucesso. Seu líder <strong>{leaderName}</strong> receberá sugestões de pauta calibradas ao seu estilo comportamental na próxima 1:1.
              </p>
            </div>

            <div className="p-4 bg-slate-900/40 border border-slate-855 rounded-2xl max-w-md mx-auto space-y-1 text-left text-xs leading-relaxed font-sans">
              <div className="text-slate-400"><strong>Nome:</strong> {collaborator.name}</div>
              <div className="text-slate-400"><strong>E-mail:</strong> {collaborator.email}</div>
              <div className="text-slate-400"><strong>Perfil DISC Atualizado:</strong> <span className="font-bold text-indigo-400">{calculatedDisc}</span></div>
              <div className="text-slate-400"><strong>Cargo:</strong> {collaborator.role} ({collaborator.level})</div>
              <div className="text-slate-400"><strong>Líder Associado:</strong> {leaderName}</div>
            </div>

            <div className="pt-2 flex gap-4 max-w-xs mx-auto">
              <button
                type="button"
                onClick={() => router.push('/login')}
                className="w-full bg-gradient-to-r from-indigo-650 to-indigo-750 hover:from-indigo-600 hover:to-indigo-700 text-slate-100 text-xs font-bold py-3 rounded-xl transition-all shadow-md shadow-indigo-550/10"
              >
                Voltar para Tela de Login
              </button>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
