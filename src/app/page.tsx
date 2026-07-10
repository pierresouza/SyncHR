'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { storage, MOCK_USERS, MOCK_COLLABORATORS } from '@/lib/storage';
import {
  LeaderProfileType,
  Collaborator,
  OneOnOne,
  ConflictEscalation,
  UserSession,
  LeaderProfile,
  SimulatedEmail,
  ConsistencyCheck
} from '@/types';
import {
  User,
  LogOut,
  Lock,
  Sparkles,
  MessageSquare,
  ShieldAlert,
  Terminal,
  Send,
  Check,
  Copy,
  RefreshCw,
  FileText,
  Info,
  Sliders,
  Database,
  UserCheck,
  Mail,
  Play,
  ClipboardList,
  AlertTriangle,
  Clock,
  ThumbsUp,
  FileCheck,
  PlusCircle,
  HelpCircle,
  Video
} from 'lucide-react';
import Swal from 'sweetalert2';

type SectionId = 'onboarding' | 'copiloto' | 'escalation' | 'rh' | 'historico' | 'simulador' | 'about';
type SimPhase = 'intro' | 'abertura' | 'desenvolvimento' | 'fechamento' | 'feedback';

interface SimAnswerOption {
  text: string;
  points: number;
  feedback: string;
  discTrait: string;
}

interface SimStepData {
  colabSpeech: string;
  options: SimAnswerOption[];
}

interface SimScenarioData {
  collaboratorId: string;
  name: string;
  disc: string;
  role: string;
  introText: string;
  abertura: SimStepData;
  desenvolvimento: SimStepData;
  fechamento: SimStepData;
}

const SIMULATOR_SCENARIOS: Record<string, SimScenarioData> = {
  'colab-01': {
    collaboratorId: 'colab-01',
    name: 'Carlos Santos (L3)',
    disc: 'DOMINANTE',
    role: 'Dev Back-end Sênior',
    introText: 'Carlos está visivelmente irritado com gargalos de homologação que atrasam o deploy de suas APIs.',
    abertura: {
      colabSpeech: '"Direto ao ponto: eu terminei minhas tarefas de backend há três dias, mas o time de QA e homologação travou tudo. Não posso responder por atraso deles."',
      options: [
        {
          text: '"Carlos, compreendo seu foco em entregar rápido. Vamos analisar os gargalos do fluxo de QA juntos com dados concretos na retro."',
          points: 10,
          feedback: 'Excelente! Você reconheceu o perfil focado em resultados do Dominante, evitou discussões subjetivas e propôs uma abordagem orientada a dados e solução conjunta.',
          discTrait: 'D (Foco em Resultados)'
        },
        {
          text: '"Calma Carlos, você precisa ser mais paciente e aprender a trabalhar de forma mais harmoniosa com as outras equipes."',
          points: 3,
          feedback: 'Inadequado. Dizer para um Dominante ter "calma" ou ser "paciente" soa condescendente e foca na atitude em vez do problema prático de entrega.',
          discTrait: 'S (Paciência)'
        },
        {
          text: '"Não se preocupe com o QA, o importante é que você fez sua parte técnica e concluiu o desenvolvimento."',
          points: 5,
          feedback: 'Razoável, mas passivo. Não resolve a dor dele sobre o gargalo e estimula o isolamento departamental (silos).',
          discTrait: 'C (Conformidade)'
        }
      ]
    },
    desenvolvimento: {
      colabSpeech: '"O processo deles de code review é burocrático e lento demais. Quero autonomia para pular a aprovação de QA e fazer deploy em produção direto nas minhas tarefas."',
      options: [
        {
          text: '"Liberar deploy direto sem code review viola nossas regras de segurança da Clear IT. Mas podemos revisar o processo para torná-lo mais ágil."',
          points: 10,
          feedback: 'Excelente! Definiu um limite claro de governança (segurança/processo) sem parecer autoritário, abrindo espaço para otimização prática do fluxo.',
          discTrait: 'C (Segurança e Limites)'
        },
        {
          text: '"Você tem razão, o QA é muito lento. Vou falar com o líder de QA para darem prioridade exclusiva aos seus cartões."',
          points: 4,
          feedback: 'Fraco. Cria um privilégio individual indevido, gera atritos políticos com a liderança de QA e não resolve o problema sistêmico.',
          discTrait: 'I (Influência Política)'
        },
        {
          text: '"Fazer deploy sem revisão viola as regras. Você precisa seguir os processos estabelecidos sem reclamar."',
          points: 6,
          feedback: 'Razoável por manter a segurança, mas excessivamente rígido e burocrático. Desmotiva a iniciativa de melhoria do Dominante.',
          discTrait: 'D (Autoritarismo)'
        }
      ]
    },
    fechamento: {
      colabSpeech: '"Tudo bem, entendi a barreira. Em termos práticos de plano de ação de PDI, o que vamos combinar?"',
      options: [
        {
          text: '"Vamos estabelecer um SLA de code review de 24h. Sua ação de PDI será mapear os gargalos e propor um script de automação de testes."',
          points: 10,
          feedback: 'Perfeito! Canalizou a energia do Dominante para uma liderança técnica construtiva e propositiva, vinculando ao PDI um objetivo mensurável.',
          discTrait: 'D (Liderança e Autonomia)'
        },
        {
          text: '"Eu vou monitorar as tarefas de QA e te aviso quando liberarem."',
          points: 4,
          feedback: 'Ruim. Tira a autonomia do colaborador e cria uma dependência desnecessária do líder (microgestão).',
          discTrait: 'S (Paternalismo)'
        },
        {
          text: '"O combinado é você aguardar o fluxo normal e preencher uma planilha de atrasos toda vez que travar."',
          points: 5,
          feedback: 'Burocrático e frustrante para um profissional sênior focado em resultados.',
          discTrait: 'C (Excesso de Burocracia)'
        }
      ]
    }
  },
  'colab-02': {
    collaboratorId: 'colab-02',
    name: 'Mariana Souza (L2)',
    disc: 'ESTAVEL',
    role: 'Dev Front-end Pleno',
    introText: 'Mariana está silenciosa e cansada devido a constantes mudanças de escopo que a deixam insegura.',
    abertura: {
      colabSpeech: '"Eu... eu ando muito cansada. Tem muita tarefa mudando de prioridade a cada três dias e sinto que não estou entregando nada com qualidade."',
      options: [
        {
          text: '"Mariana, sinto muito que esteja passando por isso. Vamos revisar a pauta e definir o que é prioridade inegociável esta semana para te dar previsibilidade."',
          points: 10,
          feedback: 'Excelente! O Estável precisa de segurança, clareza no processo e previsibilidade. Focar em blindar a sprint é a melhor resposta relacional.',
          discTrait: 'S (Segurança e Processos)'
        },
        {
          text: '"Mas o mercado de tecnologia na Clear IT é ágil, precisamos nos adaptar rápido às mudanças de arquitetura!"',
          points: 4,
          feedback: 'Inadequado. Desconsidera a dor emocional e a necessidade de estabilidade da colaboradora, gerando ansiedade.',
          discTrait: 'D (Cobrança Insensível)'
        },
        {
          text: '"Se você organizar melhor sua agenda e fizer horas extras conseguirá terminar tudo, mesmo mudando o escopo."',
          points: 3,
          feedback: 'Ruim. Estimula o burnout e não resolve o problema do desalinhamento gerencial.',
          discTrait: 'C (Rigidez Operacional)'
        }
      ]
    },
    desenvolvimento: {
      colabSpeech: '"Eu fico perdida quando o Product Manager traz requisitos novos sem atualizar a documentação. Dá vontade de parar de programar."',
      options: [
        {
          text: '"Compreendo. Vou alinhar com o PM que nenhuma alteração entra no Kanban sem especificação de API atualizada no Confluence."',
          points: 10,
          feedback: 'Excelente! Mostrou atitude de líder facilitador, protegendo os processos e estabelecendo uma governança clara para a tranquilidade de Mariana.',
          discTrait: 'S (Proteção de Equipe)'
        },
        {
          text: '"Você precisa ser mais resiliente e ir falar diretamente com o PM para resolver isso no bate-papo."',
          points: 4,
          feedback: 'Fraco. Empurra a responsabilidade política para uma desenvolvedora com perfil de comunicação estável/passiva, gerando desconforto.',
          discTrait: 'I (Delegação Relacional)'
        },
        {
          text: '"Não se preocupe com documentação. Apenas continue codificando como puder e depois ajustamos os bugs."',
          points: 5,
          feedback: 'Razoável, mas estimula o retrabalho e a falta de capricho técnico.',
          discTrait: 'C (Desenho Técnico)'
        }
      ]
    },
    fechamento: {
      colabSpeech: '"Agradeço muito o apoio. Com isso, qual será o nosso combinado de PDI real?"',
      options: [
        {
          text: '"Sua meta será focar em estruturar o novo design system e faremos check-ins quinzenais calmos nas quintas-feiras para validar o progresso."',
          points: 10,
          feedback: 'Excelente! Definiu um escopo estável de longo prazo e check-ins fixos previsíveis que transmitem alta segurança comportamental.',
          discTrait: 'S (Previsibilidade e Acolhimento)'
        },
        {
          text: '"A meta é você duplicar a velocidade de entrega para compensar os atrasos anteriores."',
          points: 3,
          feedback: 'Inadequado. Assusta a profissional que acabou de reportar estafa mental.',
          discTrait: 'D (Pressão Desmedida)'
        },
        {
          text: '"Vamos ver como as coisas fluem na próxima sprint e depois decidimos o que combinar."',
          points: 5,
          feedback: 'Vago demais para o perfil de Mariana, que necessita de metas explícitas.',
          discTrait: 'I (Improviso Relacional)'
        }
      ]
    }
  }
};

export default function DashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [leaderProfile, setLeaderProfile] = useState<LeaderProfile | null>(null);
  const [activeSection, setActiveSection] = useState<SectionId>('about');
  const [copied, setCopied] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncLogs, setSyncLogs] = useState<string[]>([]);

  // Real Database States
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [oneOnOnes, setOneOnOnes] = useState<OneOnOne[]>([]);
  const [conflicts, setConflicts] = useState<ConflictEscalation[]>([]);
  const [profiles, setProfiles] = useState<LeaderProfile[]>([]);
  const [loadingDb, setLoadingDb] = useState(true);

  // States for Live Stepper (1:1 Flow)
  const [meetingStep, setMeetingStep] = useState(1);
  const [selectedColabId, setSelectedColabId] = useState('');
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

  const [generatedScript, setGeneratedScript] = useState('');
  const [loadingScript, setLoadingScript] = useState(false);

  // Visual Kanban & Sliders states
  const [kanbanTasks, setKanbanTasks] = useState<Array<{ id: string; title: string; status: 'todo' | 'in_progress' | 'done' }>>([]);
  const [deliveryAdjustment, setDeliveryAdjustment] = useState<{ proposedDeadline: string; scopeChange: string; rationale: string } | null>(null);
  const [scopeSlider, setScopeSlider] = useState(50);
  const [deadlineSlider, setDeadlineSlider] = useState(50);

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
  const [evaluationResult, setEvaluationResult] = useState<{
    score: number;
    feedback: string;
    topics: string[];
    consistencyResult?: ConsistencyCheck;
    hasConflict?: boolean;
    finalSummary?: string;
  } | null>(null);

  const [leaderApproved, setLeaderApproved] = useState(false);
  const [collaboratorApproved, setCollaboratorApproved] = useState(false);
  const [isSimulationToggle, setIsSimulationToggle] = useState(false); // Switch to sign-off as collaborator
  const [savedMeetingId, setSavedMeetingId] = useState<string | null>(null); // Real-time feedback meeting ID
  const [meetLink, setMeetLink] = useState('');
  const [shouldGenerateMeet, setShouldGenerateMeet] = useState(false);

  // Email simulation states
  const [simulatedEmails, setSimulatedEmails] = useState<SimulatedEmail[]>([]);
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);

  // Simulator DISC interactive states
  const [simPhase, setSimPhase] = useState<SimPhase>('intro');
  const [simColabId, setSimColabId] = useState('colab-02');
  const [simScore, setSimScore] = useState(0);
  const [simAnswersHistory, setSimAnswersHistory] = useState<Array<{ phase: string, question: string, answer: string, points: number, feedback: string, discTrait: string }>>([]);
  const [simIaFeedback, setSimIaFeedback] = useState('');

  // RH Register Form states
  const [newLeaderName, setNewLeaderName] = useState('');
  const [newLeaderEmail, setNewLeaderEmail] = useState('');
  const [newLeaderPassword, setNewLeaderPassword] = useState('lider123');
  const [newLeaderProfile, setNewLeaderProfile] = useState<LeaderProfileType>('TECNICO');

  const [newColabName, setNewColabName] = useState('');
  const [newColabEmail, setNewColabEmail] = useState('');
  const [newColabDisc, setNewColabDisc] = useState<Collaborator['disc']>('DOMINANTE');
  const [newColabLevel, setNewColabLevel] = useState('L1');
  const [newColabRole, setNewColabRole] = useState('');
  const [newColabLeaderId, setNewColabLeaderId] = useState('');

  // General App & Database Initialization
  useEffect(() => {
    storage.initialize();

    // Listen to Supabase auth state changes (crucial for Google OAuth redirects)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[Auth State Change]:', event);
      if (session?.user) {
        const userEmail = session.user.email?.toLowerCase().trim();
        let { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', userEmail)
          .single();

        // Auto provision leader profile if not exists in database
        if (!profile && userEmail) {
          const { data: insertedProfile } = await supabase
            .from('profiles')
            .insert({
              email: userEmail,
              name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'Gestor Google',
              role: 'LEADER',
              profile_type: 'PENDENTE',
              level_from: 'Coordenador',
              level_to: 'Gerente'
            })
            .select()
            .single();
          profile = insertedProfile;
        }

        if (profile) {
          const userSession = {
            id: profile.id,
            email: profile.email,
            name: profile.name,
            role: profile.role as any,
            profile: profile.profile_type as any
          };
          storage.setCurrentUser(userSession);
          setCurrentUser(userSession);
          fetchDatabaseData(userSession);
        }
      } else {
        // No active Supabase session
        storage.setCurrentUser(null);
        setCurrentUser(null);
        router.push('/login');
      }
    });

    // Load simulated emails log
    const rawEmails = localStorage.getItem('synchr_emails');
    if (rawEmails) {
      setSimulatedEmails(JSON.parse(rawEmails));
    }

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  const fetchDatabaseData = async (user: UserSession) => {
    setLoadingDb(true);
    try {
      // 1. Seed base data if profiles are empty (Auto-seeding)
      const { data: dbProfiles, error: profileErr } = await supabase.from('profiles').select('*');

      if (!dbProfiles || dbProfiles.length === 0) {
        console.log('Seeding profiles table...');
        await supabase.from('profiles').insert(
          MOCK_USERS.map(u => ({
            email: u.email,
            name: u.name,
            role: u.role,
            profile_type: u.profile,
            level_from: 'Coordenador',
            level_to: 'Gerente'
          }))
        );
      }

      // Check collaborators
      const { data: dbColabs } = await supabase.from('collaborators').select('*');
      const seededColabs = (dbColabs || []).map(c => ({
        id: c.id,
        name: c.name,
        email: c.email || '',
        disc: c.disc,
        level: c.level,
        role: c.role,
        leaderId: c.leader_id || undefined
      })) as Collaborator[];
      setCollaborators(seededColabs);
      if (seededColabs.length > 0 && !selectedColabId) {
        setSelectedColabId(seededColabs[0].id);
      }

      // Fetch Profiles list
      const { data: refreshedProfiles } = await supabase.from('profiles').select('*');
      if (refreshedProfiles) {
        setProfiles(refreshedProfiles.map(p => ({
          id: p.id,
          email: p.email,
          name: p.name,
          profile: p.profile_type as LeaderProfileType,
          levelFrom: p.level_from || 'Coordenador',
          levelTo: p.level_to || 'Gerente'
        })));

        // Set leader profile for current user
        const matchedProfile = refreshedProfiles.find(p => p.email.toLowerCase() === user.email.toLowerCase());
        if (matchedProfile) {
          const lProfile: LeaderProfile = {
            id: matchedProfile.id,
            email: matchedProfile.email,
            name: matchedProfile.name,
            profile: matchedProfile.profile_type as LeaderProfileType,
            levelFrom: matchedProfile.level_from || 'Coordenador',
            levelTo: matchedProfile.level_to || 'Gerente'
          };
          setLeaderProfile(lProfile);
          storage.setLeaderProfile(lProfile);

          if (user.role === 'LEADER' && matchedProfile.profile_type === 'PENDENTE') {
            setActiveSection('onboarding');
          } else if (user.role === 'RH') {
            setActiveSection('rh');
          } else {
            setActiveSection('copiloto');
          }
        }
      }

      // Fetch One-on-Ones
      const { data: dbOneOnOnes } = await supabase
        .from('one_on_ones')
        .select('*')
        .order('date', { ascending: false });

      if (dbOneOnOnes) {
        setOneOnOnes(dbOneOnOnes.map(o => ({
          id: o.id,
          collaboratorId: o.collaborator_id,
          collaboratorName: seededColabs.find(c => c.id === o.collaborator_id)?.name || 'Colaborador',
          date: o.date,
          type: o.type,
          context: o.context || '',
          scriptText: o.script_text || '',
          rawLeaderNotes: o.raw_leader_notes || '',
          rawCollaboratorNotes: o.raw_collaborator_notes || '',
          transcription: o.transcription || '',
          finalSummary: o.final_summary || '',
          leaderApproved: o.leader_approved,
          collaboratorApproved: o.collaborator_approved,
          consistencyResult: o.consistency_result,
          ataTemplateId: o.ata_template_id
        })));
      }

      // Fetch Conflicts
      const { data: dbConflicts } = await supabase
        .from('conflicts')
        .select('*')
        .order('date', { ascending: false });

      if (dbConflicts) {
        setConflicts(dbConflicts.map(c => ({
          id: c.id,
          protocol: c.protocol,
          collaboratorId: c.collaborator_id,
          collaboratorName: seededColabs.find(col => col.id === c.collaborator_id)?.name || 'Colaborador',
          description: c.description,
          date: c.date,
          status: c.status as any,
          notes: c.notes || '',
          hasHistory: c.has_history,
          isBypass: c.is_bypass
        })));
      }

    } catch (err) {
      console.error('Erro ao buscar dados do Supabase:', err);
    } finally {
      setLoadingDb(false);
    }
  };

  const handleLogout = () => {
    supabase.auth.signOut();
    storage.setCurrentUser(null);
    storage.setLeaderProfile(null);
    router.push('/login');
  };

  const handleSwitchSection = (sectionId: SectionId) => {
    if (sectionId !== 'onboarding' && sectionId !== 'about' && (!leaderProfile || leaderProfile.profile === 'PENDENTE') && currentUser?.role === 'LEADER') {
      Swal.fire({
        title: 'Complete o Onboarding',
        text: 'Você precisa concluir a autoavaliação de liderança antes de acessar as outras telas.',
        icon: 'warning',
        background: '#0f172a',
        color: '#cbd5e1',
        confirmButtonColor: '#4f46e5'
      });
      return;
    }
    setActiveSection(sectionId);
    setSidebarOpen(false);
  };

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

  // ==========================================
  // SECTION 1: ONBOARDING QUIZ STATE & LOGIC
  // ==========================================
  const [answers, setAnswers] = useState<Record<number, 'A' | 'B' | 'C'>>({});
  const [levelFrom, setLevelFrom] = useState('Coordenador');
  const [levelTo, setLevelTo] = useState('Gerente');
  const [diagnosedProfile, setDiagnosedProfile] = useState<LeaderProfileType | null>(null);
  const [showWarning, setShowWarning] = useState(false);

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

  // ==========================================
  // SECTION 2: COPILOTO (STEPPER 1:1 FLOW)
  // ==========================================
  const activeColab = collaborators.find(c => c.id === selectedColabId) || collaborators[0] || MOCK_COLLABORATORS[0];

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
            const inviteHtml = `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #1e293b;">
                <h2 style="color: #4f46e5; margin-top: 0;">SyncHR - Convite para Reunião 1:1</h2>
                <p>Olá <strong>${activeColab.name}</strong>,</p>
                <p>Seu gestor <strong>${leaderProfile?.name || 'Gestor'}</strong> agendou um alinhamento individual 1:1 com você.</p>
                <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
                  <p style="margin: 5px 0;"><strong>Modelo da ATA:</strong> ${selectedAtaTemplate.toUpperCase()}</p>
                  <p style="margin: 5px 0;"><strong>Data / Hora:</strong> ${formattedDateTime}</p>
                  <p style="margin: 5px 0;"><strong>Duração:</strong> ${meetingDuration} minutos</p>
                  <p style="margin: 10px 0 5px 0;"><strong>Link da Reunião (Google Meet):</strong> <a href="${meetLinkUrl}" target="_blank" style="color: #4f46e5; font-weight: bold; text-decoration: underline;">Entrar no Google Meet</a></p>
                </div>
                ${!isGoogleMeetReal ? `<p style="font-size: 12px; color: #b45309; background-color: #fffbeb; padding: 10px; border-radius: 6px; border: 1px solid #fef3c7;">⚠️ <strong>Nota sobre Transcrição:</strong> Esta reunião foi gerada com um link simulado do Google Meet. Para obter a gravação e a captura automática de transcrição via e-mail pelo SyncHR, o gestor precisa estar logado com a conta Google corporativa autorizada no sistema.</p>` : ''}
                <p>Por favor, acesse o link no horário combinado. Nos vemos lá!</p>
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 25px 0;" />
                <p style="font-size: 11px; color: #64748b; margin-bottom: 0;">Este é um e-mail automático gerado pelo ecossistema SyncHR Smart Leading da Clear IT.</p>
              </div>
            `;

            await fetch('/api/send-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: activeColab.email,
                subject: `Convite 1:1: ${leaderProfile?.name || 'Gestor'} & ${activeColab.name} (${formattedDateTime})`,
                html: inviteHtml
              })
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

  // Final Archiving to Supabase
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
          const feedbackHtml = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #1e293b;">
              <h2 style="color: #4f46e5; margin-top: 0;">SyncHR - Validação de Reunião 1:1</h2>
              <p>Olá <strong>${activeColab.name}</strong>,</p>
              <p>Sua reunião individual de 1:1 com o gestor <strong>${leaderProfile?.name || 'Gestor'}</strong> foi concluída e a ata preliminar foi gerada.</p>
              <p>Para ler a pauta, tarefas Kanban acordadas e registrar o seu parecer e consentimento digital, por favor acesse a página de validação bilateral no link abaixo:</p>
              <div style="text-align: center; margin: 25px 0;">
                <a href="${link}" target="_blank" style="background-color: #4f46e5; color: #ffffff; font-weight: bold; text-decoration: none; padding: 12px 24px; border-radius: 8px; display: inline-block;">Visualizar e Assinar Ata</a>
              </div>
              <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 25px 0;" />
              <p style="font-size: 11px; color: #64748b; margin-bottom: 0;">Este é um e-mail automático enviado de forma segura sob conformidade da LGPD pelo ecossistema SyncHR.</p>
            </div>
          `;

          await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: activeColab.email,
              subject: `SyncHR: Assine sua ata de 1:1 com ${leaderProfile?.name || 'Gestor'}`,
              html: feedbackHtml
            })
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
          const rhEmail = 'rh.priscila@clearit.com.br';
          const alertHtml = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 2px solid #dc2626; border-radius: 12px; background-color: #fef2f2; color: #991b1b;">
              <h2 style="color: #dc2626; margin-top: 0;">🚨 Alerta Crítico: Atrito / Conflito Detectado</h2>
              <p>Olá Priscila (RH),</p>
              <p>O SyncHR AI Auditor identificou um **desalinhamento grave ou potencial conflito** em uma reunião de 1:1 realizada recentemente.</p>
              <div style="background-color: #ffffff; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #fee2e2; color: #1e293b;">
                <p style="margin: 5px 0;"><strong>Protocolo:</strong> <code>${protocol}</code></p>
                <p style="margin: 5px 0;"><strong>Colaborador:</strong> ${activeColab.name} (${activeColab.role})</p>
                <p style="margin: 5px 0;"><strong>Gestor:</strong> ${leaderProfile?.name || 'Gestor'}</p>
                <p style="margin: 5px 0;"><strong>Data:</strong> ${oneOnOneData.date}</p>
                <p style="margin: 10px 0 5px 0;"><strong>Análise da Consistência:</strong></p>
                <p style="margin: 5px 0; font-style: italic; color: #475569;">"${evaluationResult?.consistencyResult?.details || 'Divergência de percepção detectada entre as notas do gestor e do colaborador.'}"</p>
              </div>
              <p>Por favor, acesse o Painel do RH na plataforma para mediar esta ocorrência.</p>
              <hr style="border: 0; border-top: 1px solid #fee2e2; margin: 25px 0;" />
              <p style="font-size: 11px; color: #991b1b; margin-bottom: 0;">Este é um alerta crítico de conformidade e governança corporativa gerado automaticamente pelo SyncHR.</p>
            </div>
          `;

          await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: rhEmail,
              subject: `🚨 ALERTA CRÍTICO: Conflito de 1:1 - ${activeColab.name}`,
              html: alertHtml
            })
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
      fetchDatabaseData(currentUser!);

    } catch (err: any) {
      console.error(err);
      Swal.fire('Erro ao Salvar', 'Não foi possível persistir a ata no Supabase: ' + err.message, 'error');
    }
  };

  // ==========================================
  // SECTION 3: RH PORTAL (CADASTROS & METRICAS)
  // ==========================================
  const handleRHRegisterLeader = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeaderName.trim() || !newLeaderEmail.trim()) {
      Swal.fire('Atenção', 'Preencha nome e e-mail corporativo.', 'warning');
      return;
    }

    try {
      // Usar rota server-side com Admin Client para NÃO trocar a sessão do browser
      const res = await fetch('/api/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newLeaderName,
          email: newLeaderEmail,
          password: newLeaderPassword || 'SyncHR@2025',
          role: 'LEADER'
        })
      });

      const result = await res.json();
      if (!result.success) throw new Error(result.error);

      Swal.fire({
        title: 'Líder Cadastrado!',
        text: `Gestor(a) ${newLeaderName} foi criado(a) e receberá o acesso por e-mail.`,
        icon: 'success',
        background: '#0f172a',
        color: '#cbd5e1'
      });

      setNewLeaderName('');
      setNewLeaderEmail('');
      fetchDatabaseData(currentUser!);
    } catch (err: any) {
      Swal.fire('Erro no Cadastro', err.message, 'error');
    }
  };


  const handleRHRegisterCollaborator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColabName.trim() || !newColabRole.trim() || !newColabEmail.trim()) {
      Swal.fire('Atenção', 'Preencha todos os campos do colaborador.', 'warning');
      return;
    }

    try {
      const { error } = await supabase.from('collaborators').insert({
        name: newColabName,
        email: newColabEmail,
        disc: newColabDisc,
        level: newColabLevel,
        role: newColabRole,
        leader_id: newColabLeaderId || null
      });

      if (error) throw error;

      // Enviar e-mail de boas-vindas para o liderado
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: newColabEmail,
          subject: '[SyncHR] Você foi cadastrada(o) na plataforma de desenvolvimento',
          html: `
            <div style="font-family:sans-serif;max-width:540px;margin:0 auto;background:#0f172a;color:#e2e8f0;padding:32px;border-radius:12px;">
              <h2 style="color:#818cf8;margin-bottom:4px;">SyncHR</h2>
              <p style="color:#64748b;font-size:12px;margin-top:0;">Plataforma de Liderança Inteligente · Clear IT Brasil</p>
              <hr style="border-color:#1e293b;margin:24px 0;" />
              <h3 style="color:#f1f5f9;">Olá, ${newColabName}! 👋</h3>
              <p style="color:#94a3b8;">
                Você foi cadastrada(o) na plataforma <strong style="color:#e2e8f0;">SyncHR</strong> como parte do programa de desenvolvimento de liderança da sua empresa.
              </p>
              <div style="background:#1e293b;border-radius:8px;padding:20px;margin:24px 0;">
                <p style="margin:0 0 8px 0;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:1px;">O que é o SyncHR?</p>
                <p style="margin:4px 0;color:#94a3b8;font-size:14px;">
                  Uma plataforma que estrutura as reuniões 1:1 entre você e seu gestor, garantindo que as conversas sejam produtivas, documentadas e transparentes.
                </p>
              </div>
              <p style="color:#94a3b8;">
                Em breve você receberá um convite de reunião do seu líder com a pauta preparada especialmente para você. Após a reunião, um link de feedback chegará neste e-mail para que você registre sua opinião sobre a conversa.
              </p>
              <p style="color:#475569;font-size:12px;margin-top:24px;">Qualquer dúvida, fale com o RH da sua empresa.</p>
            </div>
          `
        })
      });

      Swal.fire({
        title: 'Colaborador Cadastrado!',
        text: `${newColabName} foi cadastrado(a) e receberá um e-mail de boas-vindas.`,
        icon: 'success',
        background: '#0f172a',
        color: '#cbd5e1'
      });

      setNewColabName('');
      setNewColabEmail('');
      setNewColabRole('');
      fetchDatabaseData(currentUser!);
    } catch (err: any) {
      Swal.fire('Erro no Cadastro', err.message, 'error');
    }
  };


  const handleResolveConflict = async (id: string, notes: string) => {
    try {
      const { error } = await supabase
        .from('conflicts')
        .update({ status: 'RESOLVED', notes: notes })
        .eq('id', id);

      if (error) throw error;

      Swal.fire('Sucesso', 'Conflito arquivado como Solucionado!', 'success');
      fetchDatabaseData(currentUser!);
    } catch (err: any) {
      Swal.fire('Erro', err.message, 'error');
    }
  };

  const handleDeleteCollaborator = async (id: string, name: string) => {
    const confirm = await Swal.fire({
      title: 'Excluir Liderado?',
      text: `Tem certeza que deseja deletar o colaborador(a) ${name}? Esta ação não pode ser desfeita e removerá seus históricos de reuniões associadas.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sim, Deletar',
      cancelButtonText: 'Cancelar',
      background: '#0f172a',
      color: '#cbd5e1',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#4f46e5'
    });

    if (confirm.isConfirmed) {
      try {
        const { error } = await supabase
          .from('collaborators')
          .delete()
          .eq('id', id);

        if (error) throw error;

        Swal.fire({
          title: 'Excluído!',
          text: 'O colaborador foi removido do Supabase com sucesso.',
          icon: 'success',
          background: '#0f172a',
          color: '#cbd5e1',
          confirmButtonColor: '#4f46e5'
        });
        fetchDatabaseData(currentUser!);
      } catch (err: any) {
        Swal.fire('Erro ao Excluir', err.message, 'error');
      }
    }
  };

  const handleDeleteLeader = async (id: string, name: string) => {
    try {
      // 1. Verificar integridade referencial no Supabase
      const { data: colabs, error: checkErr } = await supabase
        .from('collaborators')
        .select('id')
        .eq('leader_id', id);

      if (checkErr) throw checkErr;

      if (colabs && colabs.length > 0) {
        Swal.fire({
          title: 'Exclusão Bloqueada',
          text: `O gestor(a) ${name} possui ${colabs.length} liderado(s) ativamente vinculado(s). Por favor, transfira a equipe para outro gestor antes de excluí-lo.`,
          icon: 'error',
          background: '#0f172a',
          color: '#cbd5e1',
          confirmButtonColor: '#4f46e5'
        });
        return;
      }

      const confirm = await Swal.fire({
        title: 'Excluir Líder?',
        text: `Tem certeza que deseja deletar o gestor(a) ${name}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sim, Deletar',
        cancelButtonText: 'Cancelar',
        background: '#0f172a',
        color: '#cbd5e1',
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#4f46e5'
      });

      if (confirm.isConfirmed) {
        const { error } = await supabase
          .from('profiles')
          .delete()
          .eq('id', id);

        if (error) throw error;

        Swal.fire({
          title: 'Excluído!',
          text: 'O gestor foi removido do Supabase com sucesso.',
          icon: 'success',
          background: '#0f172a',
          color: '#cbd5e1',
          confirmButtonColor: '#4f46e5'
        });
        fetchDatabaseData(currentUser!);
      }
    } catch (err: any) {
      Swal.fire('Erro ao Excluir', err.message, 'error');
    }
  };

  // ==========================================
  // SECTION 4: INTERACTIVE DISC SIMULATOR (MOCK)
  // ==========================================
  const handleStartSimulation = () => {
    setSimPhase('abertura');
    setSimScore(0);
    setSimAnswersHistory([]);
    setSimIaFeedback('');
  };

  const handleChooseSimOption = (option: SimAnswerOption) => {
    const scenario = SIMULATOR_SCENARIOS[simColabId];
    const newHistory = [
      ...simAnswersHistory,
      {
        phase: simPhase,
        question: scenario[simPhase as 'abertura' | 'desenvolvimento' | 'fechamento'].colabSpeech,
        answer: option.text,
        points: option.points,
        feedback: option.feedback,
        discTrait: option.discTrait
      }
    ];

    setSimAnswersHistory(newHistory);
    setSimScore(prev => prev + option.points);

    if (simPhase === 'abertura') {
      setSimPhase('desenvolvimento');
    } else if (simPhase === 'desenvolvimento') {
      setSimPhase('fechamento');
    } else {
      setSimPhase('feedback');
      // Calculate average & final comments
      const totalPoints = simScore + option.points;
      const percentage = Math.round((totalPoints / 30) * 100);
      let review = "";
      if (percentage >= 85) {
        review = `Excelente calibração relacional! Você se provou apto a liderar colaboradores do tipo ${scenario.disc} na Clear IT, minimizando ruídos e focando em planos de PDI tangíveis.`;
      } else if (percentage >= 60) {
        review = `Bom aproveitamento. Você ouviu as dores do liderado, mas algumas respostas focaram excessivamente em jargões formais em vez de sanar as necessidades específicas do perfil DISC.`;
      } else {
        review = `Atenção: Seu comportamento tendeu a ser desalinhado com as necessidades do liderado. Revise as diretrizes do guia DISC de liderança corporativa da Clear IT.`;
      }
      setSimIaFeedback(review);
    }
  };

  const handleSaveSimToDb = async () => {
    const scenario = SIMULATOR_SCENARIOS[simColabId];
    const percentage = Math.round((simScore / 30) * 100);
    const summaryScript = `### Resumo da Reunião Simulada (DISC)
**Colaborador:** ${scenario.name}
**Perfil DISC:** ${scenario.disc}
**Cargo:** ${scenario.role}
**Aproveitamento do Gestor:** ${percentage}% (${simScore}/30 pts)

---
` + simAnswersHistory.map(h => `* **Fase:** ${h.phase.toUpperCase()}
  * **Fala:** ${h.question}
  * **Sua Resposta:** ${h.answer}
  * **Conselho:** ${h.feedback}`).join('\n');

    try {
      const { error } = await supabase.from('one_on_ones').insert({
        collaborator_id: collaborators[0]?.id || activeColab.id,
        date: new Date().toISOString().split('T')[0],
        type: 'Simulada (DISC)',
        context: scenario.introText,
        script_text: summaryScript,
        raw_leader_notes: `Aproveitamento na simulação: ${percentage}%`,
        raw_collaborator_notes: 'Feedback da simulação de IA gravado.',
        final_summary: `O líder realizou uma simulação de 1:1 com a persona de teste ${scenario.name} com um aproveitamento final de ${percentage}%.`,
        leader_approved: true,
        collaborator_approved: true
      });

      if (error) throw error;

      Swal.fire({
        title: 'Simulação Arquivada!',
        text: 'A simulação foi gravada no Supabase como registro de evolução contínua da liderança.',
        icon: 'success',
        background: '#0f172a',
        color: '#cbd5e1'
      });

      setSimPhase('intro');
      fetchDatabaseData(currentUser!);
    } catch (err: any) {
      Swal.fire('Erro ao salvar', err.message, 'error');
    }
  };

  return (
    <div className="min-h-screen text-slate-100 flex relative overflow-hidden bg-[#0b0f19] font-sans">

      {/* Background Orbs */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-indigo-500/5 -top-40 -left-40 orb pointer-events-none" />
      <div className="absolute w-[600px] h-[600px] rounded-full bg-cyan-500/3 -bottom-60 -right-20 orb pointer-events-none" />

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Panel */}
      <aside className={`fixed md:relative inset-y-0 left-0 w-64 border-r border-slate-900 bg-slate-950/90 backdrop-blur-xl p-5 flex flex-col gap-6 z-50 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}>

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
                  <span>{leaderProfile.profile === 'TECNICO' ? '🤖' : leaderProfile.profile === 'TRANSICAO' ? '🌱' : '🔥'}</span>
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
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left text-xs font-semibold border transition-all ${activeSection === 'about'
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
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left text-xs font-semibold border transition-all ${activeSection === 'onboarding'
                  ? 'bg-gradient-to-r from-indigo-900/40 to-indigo-900/10 border-indigo-700/50 text-indigo-200'
                  : 'bg-transparent border-transparent hover:bg-slate-900/40 text-slate-400 hover:text-slate-200'
                }`}
            >
              <UserCheck className="w-4 h-4 shrink-0" />
              <span>Onboarding Liderança</span>
            </button>
          )}

          {currentUser?.role === 'LEADER' && (
            <>
              <button
                onClick={() => handleSwitchSection('copiloto')}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left text-xs font-semibold border transition-all ${activeSection === 'copiloto'
                    ? 'bg-gradient-to-r from-indigo-900/40 to-indigo-900/10 border-indigo-700/50 text-indigo-200'
                    : 'bg-transparent border-transparent hover:bg-slate-900/40 text-slate-400 hover:text-slate-200'
                  }`}
              >
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>Copiloto de 1:1 (Stepper)</span>
              </button>

              <button
                onClick={() => handleSwitchSection('simulador')}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left text-xs font-semibold border transition-all ${activeSection === 'simulador'
                    ? 'bg-gradient-to-r from-indigo-900/40 to-indigo-900/10 border-indigo-700/50 text-indigo-200'
                    : 'bg-transparent border-transparent hover:bg-slate-900/40 text-slate-400 hover:text-slate-200'
                  }`}
              >
                <Play className="w-4 h-4 shrink-0" />
                <span>Simulador de DISC (Quiz)</span>
              </button>

              <button
                onClick={() => handleSwitchSection('escalation')}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left text-xs font-semibold border transition-all ${activeSection === 'escalation'
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
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left text-xs font-semibold border transition-all ${activeSection === 'historico'
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
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left text-xs font-semibold border transition-all ${activeSection === 'rh'
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

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">

        {/* Navbar */}
        <header className="h-16 border-b border-slate-900 bg-slate-950/40 backdrop-blur-md px-6 flex justify-between items-center z-30 sticky top-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1 text-slate-400 hover:text-slate-200 md:hidden"
            >
              <ClipboardList className="w-6 h-6" />
            </button>
            <div className="text-sm font-bold text-slate-200 font-title uppercase tracking-wider">
              {activeSection === 'about' && 'Sobre o SyncHR'}
              {activeSection === 'onboarding' && 'Diagnóstico de Liderança'}
              {activeSection === 'copiloto' && 'Copiloto de Reuniões de 1:1'}
              {activeSection === 'simulador' && 'Simulador DISC Interativo'}
              {activeSection === 'escalation' && 'Escalação e Prevenção de Conflitos'}
              {activeSection === 'historico' && 'Histórico de Atas Bilaterais'}
              {activeSection === 'rh' && 'Painel de Governança do RH'}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {loadingDb ? (
              <span className="text-xs text-indigo-400 flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Sincronizando Supabase...
              </span>
            ) : (
              <span className="text-xs text-emerald-500 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                Conectado ao Supabase
              </span>
            )}
          </div>
        </header>

        {/* Dashboard Pages */}
        <main className="flex-1 p-6 md:p-8 relative z-20 space-y-6">

          {/* ==========================================
              PAGE: ABOUT (PRODUCT PITCH)
             ========================================== */}
          {activeSection === 'about' && (
            <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
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
            </div>
          )}

          {/* ==========================================
              PAGE: ONBOARDING (LEADER SELF-ASSESSMENT)
             ========================================== */}
          {activeSection === 'onboarding' && (
            <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
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
                            className={`p-3 text-xs text-left rounded-xl border transition-all ${answers[q.id] === opt.key
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
          )}

          {/* ==========================================
              PAGE: COPILOTO (STEPPER 1:1 FLOW)
             ========================================== */}
          {activeSection === 'copiloto' && (
            <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">

              {/* Step Progress bar */}
              <div className="relative p-4 rounded-xl border border-slate-900 bg-slate-950/30">
                <div className="flex justify-between items-center max-w-xl mx-auto relative z-10">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <div key={s} className="flex flex-col items-center gap-1">
                      <div className={`w-8 h-8 rounded-full border flex items-center justify-center font-mono text-xs font-bold transition-all ${meetingStep === s
                          ? 'bg-indigo-650 border-indigo-500 text-slate-100 shadow-lg shadow-indigo-500/20'
                          : meetingStep > s
                            ? 'bg-emerald-950/40 border-emerald-500 text-emerald-400'
                            : 'bg-slate-900 border-slate-800 text-slate-500'
                        }`}>
                        {meetingStep > s ? <Check className="w-4.5 h-4.5" /> : s}
                      </div>
                      <span className={`text-[10px] uppercase font-mono tracking-wider font-semibold ${meetingStep === s ? 'text-indigo-400' : 'text-slate-600'
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
                    <h3 className="font-bold text-slate-200 text-base">Mapeamento da Reunião</h3>

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
                            className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all flex items-center justify-between ${task.status === 'done'
                                ? 'bg-indigo-950/20 border-indigo-900/60 text-slate-400 line-through'
                                : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-900'
                              }`}
                          >
                            <span>{task.title}</span>
                            <div className={`w-4 h-4 rounded border flex items-center justify-center ${task.status === 'done' ? 'bg-indigo-650 border-indigo-500' : 'border-slate-700'
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
                      <h3 className="font-bold text-slate-200 text-base">Roteiro Recomendado pelo Gemini</h3>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(generatedScript);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}
                        className="text-slate-400 hover:text-slate-200 flex items-center gap-1 text-xs"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied ? 'Copiado!' : 'Copiar'}
                      </button>
                    </div>

                    <div className="flex-1 p-4 rounded-xl border border-slate-900 bg-slate-900/30 overflow-y-auto max-h-[350px] font-sans text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                      {generatedScript}
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
                          className={`text-xs px-3 py-1.5 rounded-lg border font-semibold ${timerRef.current
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
                      <h3 className="font-bold text-slate-200 text-base">Copiloto em Tempo Real (Live Assist)</h3>
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
                        <div className="space-y-2">
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
                    <h3 className="font-bold text-slate-200 text-base">Registrar Notas e Ata da Reunião</h3>
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
                    <h3 className="font-bold text-slate-200 text-base">Resultado da Avaliação & Fechamento</h3>
                    <p className="text-xs text-slate-400">Abaixo está o parecer e resumo gerados pelo Gemini API a partir da leitura cruzada de ambos os lados.</p>
                  </div>

                  {/* Consistency Analysis Display */}
                  <div className={`p-4 rounded-xl border ${evaluationResult.consistencyResult?.consistent
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
                      <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${evaluationResult.consistencyResult?.consistent ? 'bg-emerald-900/40 text-emerald-300' : 'bg-amber-900/40 text-amber-300'
                        }`}>
                        Alinhamento: {evaluationResult.consistencyResult?.confidenceScore}%
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed text-slate-400">
                      {evaluationResult.consistencyResult?.details}
                    </p>
                  </div>

                  {/* Compiled Summary */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400">Resumo Final Consolidado da Reunião:</h4>
                    <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-850 text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                      {evaluationResult.finalSummary}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="p-3 bg-slate-900/30 rounded-xl border border-slate-850 space-y-1">
                      <div className="text-slate-500 font-mono">Calibração Liderança</div>
                      <div className="text-base font-bold text-indigo-400">{evaluationResult.score}/100</div>
                    </div>
                    <div className="p-3 bg-slate-900/30 rounded-xl border border-slate-850 space-y-1">
                      <div className="text-slate-500 font-mono">Sugestão de Tags</div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {evaluationResult.topics?.map((topic, i) => (
                          <span key={i} className="text-[10px] bg-slate-800 text-indigo-300 px-1.5 py-0.5 rounded">{topic}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Dual digital signature fields */}
                  <div className="border-t border-slate-900 pt-4 space-y-4">
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
                      <div className={`p-4 rounded-xl border ${leaderApproved ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-400' : 'bg-slate-900/40 border-slate-850 text-slate-400'
                        } flex items-center justify-between`}>
                        <div>
                          <div className="font-bold text-xs">Assinatura Líder</div>
                          <div className="text-[11px] text-slate-500">{currentUser?.name}</div>
                        </div>
                        <button
                          onClick={() => setLeaderApproved(prev => !prev)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${leaderApproved
                              ? 'bg-emerald-600 text-slate-100 border-emerald-500'
                              : 'bg-slate-900 hover:bg-slate-850 border-slate-800 text-slate-300'
                            }`}
                        >
                          {leaderApproved ? '✓ Assinado' : 'Assinar'}
                        </button>
                      </div>

                      {/* Colab sign */}
                      <div className={`p-4 rounded-xl border ${collaboratorApproved ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-400' : 'bg-slate-900/40 border-slate-850 text-slate-400'
                        } flex items-center justify-between`}>
                        <div>
                          <div className="font-bold text-xs">Assinatura Liderado</div>
                          <div className="text-[11px] text-slate-500">{activeColab.name}</div>
                        </div>
                        <button
                          disabled={!isSimulationToggle}
                          onClick={() => setCollaboratorApproved(prev => !prev)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${collaboratorApproved
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
          )}

          {/* ==========================================
              PAGE: HISTORICO (ONE-ON-ONES)
             ========================================== */}
          {activeSection === 'historico' && (
            <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-slate-100 font-title">Histórico de Reuniões 1:1</h2>
                <p className="text-xs text-slate-400">Listagem de atas gravadas e validadas no banco de dados.</p>
              </div>

              {oneOnOnes.length === 0 ? (
                <div className="glass-card p-12 text-center rounded-2xl border border-slate-850 bg-slate-950/20 text-slate-400">
                  <ClipboardList className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                  <p className="text-sm font-semibold">Nenhuma reunião encontrada.</p>
                  <p className="text-xs text-slate-500">Comece agendando uma no Copiloto.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {oneOnOnes.map(one => {
                    const hasAudit = one.consistencyResult !== undefined && one.consistencyResult !== null;
                    return (
                      <div key={one.id} className="glass-card p-5 rounded-xl border border-slate-800 bg-slate-950/40 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-sm text-slate-200">{one.collaboratorName}</h3>
                            <div className="flex gap-2 items-center text-[11px] text-slate-500 mt-0.5">
                              <span className="font-mono">{one.date}</span>
                              <span>•</span>
                              <span>{one.type}</span>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            {hasAudit && (
                              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${one.consistencyResult?.consistent
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/60'
                                  : 'bg-amber-950 text-amber-400 border border-amber-900/60'
                                }`}>
                                {one.consistencyResult?.consistent ? 'Consistente' : 'Divergente'}
                              </span>
                            )}
                            <span className="bg-emerald-900/30 text-emerald-400 border border-emerald-900/40 text-[10px] font-mono px-2 py-0.5 rounded flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              Validada
                            </span>
                          </div>
                        </div>

                        <div className="text-xs text-slate-400 bg-slate-900/40 p-3 rounded-lg border border-slate-900 font-sans leading-relaxed">
                          <div className="text-slate-500 font-semibold mb-1">Resumo Sintetizado:</div>
                          {one.finalSummary || 'Sem resumo disponível.'}
                        </div>

                        {/* Separate RAW notes section */}
                        <div className="grid md:grid-cols-2 gap-3 pt-2 text-[11px]">
                          <div className="p-2.5 rounded bg-slate-900/30 border border-slate-900">
                            <span className="text-slate-500 font-bold block mb-1">RAW Percepção Líder:</span>
                            <span className="text-slate-400">{one.rawLeaderNotes || 'Sem registro.'}</span>
                          </div>
                          <div className="p-2.5 rounded bg-slate-900/30 border border-slate-900">
                            <span className="text-slate-500 font-bold block mb-1">RAW Percepção Liderado:</span>
                            <span className="text-slate-400">{one.rawCollaboratorNotes || 'Sem registro.'}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ==========================================
              PAGE: ESCALATION (CONFLICT REPORTING)
             ========================================== */}
          {activeSection === 'escalation' && (
            <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-slate-100 font-title">Escalação para o RH (Clear IT)</h2>
                <p className="text-xs text-slate-400">Acione a Gerente Priscila Bacelar caso a melhoria da liderança atinja impasses.</p>
              </div>

              {/* RN01 Disclaimer */}
              <div className="p-4 rounded-xl border border-indigo-950 bg-indigo-950/20 text-xs text-indigo-300 space-y-1.5">
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
                    id="escColabId"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                  >
                    {collaborators.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="bypass" className="w-4 h-4 accent-red-650" />
                    <label htmlFor="bypass" className="text-xs text-red-400 font-semibold cursor-pointer">⚠️ Desvio Ético / Assédio (Bypass)</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="history" defaultChecked className="w-4 h-4 accent-indigo-500" />
                    <label htmlFor="history" className="text-xs text-slate-400 cursor-pointer">Possui histórico recente</label>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-semibold font-mono uppercase tracking-wider block">Descreva a Situação Crítica</label>
                  <textarea
                    id="escDesc"
                    rows={4}
                    placeholder="Descreva minuciosamente a ocorrência corporativa para mediação do RH..."
                    className="w-full bg-slate-900 border border-slate-850 rounded-xl py-2 px-3 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 font-sans"
                  />
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    const escColabId = (document.getElementById('escColabId') as HTMLSelectElement).value;
                    const isBypass = (document.getElementById('bypass') as HTMLInputElement).checked;
                    const hasHistory = (document.getElementById('history') as HTMLInputElement).checked;
                    const escDesc = (document.getElementById('escDesc') as HTMLTextAreaElement).value;

                    if (!escDesc.trim()) {
                      Swal.fire('Atenção', 'Descreva o conflito para podermos escalonar.', 'warning');
                      return;
                    }

                    // Validate RN01: Check if there's a meeting in last 45 days
                    const recentMeeting = oneOnOnes.find(o =>
                      o.collaboratorId === escColabId &&
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
                      const colab = collaborators.find(c => c.id === escColabId) || MOCK_COLLABORATORS[0];

                      const { error } = await supabase.from('conflicts').insert({
                        protocol: protocolNum,
                        collaborator_id: colab.id,
                        description: escDesc,
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

                      (document.getElementById('escDesc') as HTMLTextAreaElement).value = '';
                      fetchDatabaseData(currentUser!);

                    } catch (err: any) {
                      Swal.fire('Erro ao enviar', err.message, 'error');
                    }
                  }}
                  className="w-full bg-red-700 hover:bg-red-650 text-slate-100 text-xs font-bold py-3 rounded-xl transition-all"
                >
                  Abrir Protocolo de Mediação no RH
                </button>
              </div>
            </div>
          )}

          {/* ==========================================
              PAGE: SIMULATOR (DISC INTERACTIVE QUIZ)
             ========================================== */}
          {activeSection === 'simulador' && (
            <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-slate-100 font-title">Simulador de Diálogos DISC</h2>
                <p className="text-xs text-slate-400">Treine suas respostas como líder escolhendo a melhor abordagem para lidar com as reações comportamentais dos seus liderados.</p>
              </div>

              {simPhase === 'intro' ? (
                <div className="glass-card p-6 rounded-2xl border border-slate-800 bg-slate-950/40 text-center space-y-4">
                  <Play className="w-12 h-12 mx-auto text-indigo-400 animate-pulse" />
                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-200 text-sm font-title">Iniciar Nova Simulação</h3>
                    <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                      Selecione um perfil de colaborador na lista e tente maximizar seus pontos escolhendo a atitude empática correta.
                    </p>
                  </div>

                  <div className="space-y-2 max-w-sm mx-auto">
                    <label className="text-xs text-slate-500 font-mono block">Escolher Colaborador de Teste:</label>
                    <select
                      value={simColabId}
                      onChange={(e) => setSimColabId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-slate-200 text-xs focus:outline-none"
                    >
                      <option value="colab-01">Carlos Santos (DOMINANTE)</option>
                      <option value="colab-02">Mariana Souza (ESTÁVEL)</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleStartSimulation}
                    className="bg-indigo-650 hover:bg-indigo-550 text-slate-100 text-xs font-bold py-2.5 px-8 rounded-xl transition-all"
                  >
                    Iniciar Simulação de Reunião
                  </button>
                </div>
              ) : (
                <div className="glass-card p-6 rounded-2xl border border-slate-800 bg-slate-950/40 space-y-6">

                  {/* Status header */}
                  <div className="flex justify-between items-center text-xs border-b border-slate-900 pb-3">
                    <span className="text-slate-400 font-mono">Fase: <strong>{simPhase.toUpperCase()}</strong></span>
                    <span className="bg-indigo-950 border border-indigo-900 text-indigo-400 px-2 py-0.5 rounded font-bold font-mono">Pontos: {simScore}</span>
                  </div>

                  {simPhase !== 'feedback' ? (
                    <div className="space-y-6">
                      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-850 space-y-2">
                        <div className="text-[10px] text-indigo-400 font-bold uppercase font-mono tracking-wider">Frente de Conversa:</div>
                        <p className="text-xs text-slate-200 leading-relaxed italic">
                          {SIMULATOR_SCENARIOS[simColabId][simPhase as 'abertura' | 'desenvolvimento' | 'fechamento'].colabSpeech}
                        </p>
                      </div>

                      <div className="space-y-2.5">
                        {SIMULATOR_SCENARIOS[simColabId][simPhase as 'abertura' | 'desenvolvimento' | 'fechamento'].options.map((opt, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleChooseSimOption(opt)}
                            className="w-full p-3.5 text-xs text-left bg-slate-900/20 border border-slate-900 hover:border-indigo-950 hover:bg-slate-900/50 rounded-xl text-slate-300 transition-all leading-relaxed"
                          >
                            {opt.text}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6 text-center animate-fade-in">
                      <div className="w-12 h-12 rounded-full bg-emerald-950 border border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto text-xl font-bold">✓</div>

                      <div className="space-y-2">
                        <h3 className="font-bold text-slate-200">Simulação Concluída!</h3>
                        <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                          A IA avaliou seu estilo de calibragem.
                        </p>
                        <div className="text-2xl font-black text-indigo-400 font-mono">{simScore} / 30 Pontos</div>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-850 max-w-md mx-auto text-xs text-slate-400 leading-relaxed text-left space-y-3">
                        <div className="font-bold text-slate-300">Análise do Copiloto de IA:</div>
                        <p className="italic">"{simIaFeedback}"</p>
                        <div className="border-t border-slate-850 pt-2 space-y-2">
                          <span className="font-bold text-[10px] text-slate-500 uppercase tracking-wider block">Histórico de Escolhas:</span>
                          {simAnswersHistory.map((h, i) => (
                            <div key={i} className="text-[11px] pb-1 border-b border-slate-900 last:border-0">
                              <p><strong>{h.phase.toUpperCase()}:</strong> {h.points} pts - <span className="text-indigo-400 font-semibold">{h.discTrait}</span></p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-3 max-w-sm mx-auto pt-2">
                        <button
                          onClick={() => setSimPhase('intro')}
                          className="bg-slate-900 border border-slate-850 text-slate-400 text-xs font-bold py-2.5 px-5 rounded-xl flex-1"
                        >
                          Tentar Novamente
                        </button>
                        <button
                          onClick={handleSaveSimToDb}
                          className="bg-indigo-650 hover:bg-indigo-550 text-slate-100 text-xs font-bold py-2.5 px-5 rounded-xl flex-1"
                        >
                          Gravar no Supabase
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>
          )}

          {/* ==========================================
              PAGE: RH PANEL (GOVERNANCE)
             ========================================== */}
          {activeSection === 'rh' && currentUser?.role === 'RH' && (
            <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-slate-100 font-title">Painel de Governança e Clima do RH</h2>
                <p className="text-xs text-slate-400">Visibilidade unificada das reuniões, taxa de conformidade e cadastro corporativo do ecossistema.</p>
              </div>

              {/* Key Metrics cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-850 space-y-1 text-center">
                  <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Adesão Geral</div>
                  <div className="text-2xl font-black text-indigo-400 font-mono">100%</div>
                  <p className="text-[9px] text-slate-500">Reuniões calendas batidas</p>
                </div>
                <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-850 space-y-1 text-center">
                  <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Índice eNPS Médio</div>
                  <div className="text-2xl font-black text-cyan-400 font-mono">8.4 / 10</div>
                  <p className="text-[9px] text-slate-500">Clima organizacional saudável</p>
                </div>
                <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-850 space-y-1 text-center">
                  <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Alinhamento Médio</div>
                  <div className="text-2xl font-black text-emerald-400 font-mono">
                    {oneOnOnes.length > 0
                      ? `${Math.round(oneOnOnes.reduce((acc, curr) => acc + (curr.consistencyResult?.confidenceScore || 90), 0) / oneOnOnes.length)}%`
                      : 'N/A'}
                  </div>
                  <p className="text-[9px] text-slate-500">Concordância calculada por IA</p>
                </div>
                <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-850 space-y-1 text-center">
                  <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Mediações Pendentes</div>
                  <div className="text-2xl font-black text-amber-500 font-mono">
                    {conflicts.filter(c => c.status === 'PENDING').length}
                  </div>
                  <p className="text-[9px] text-slate-500">Exige intervenção de Priscila</p>
                </div>
              </div>

              {/* Tabs for RH: Cadastros vs Conflicts */}
              <div className="grid md:grid-cols-12 gap-6 pt-4">

                {/* Left: Administrative registrations */}
                <div className="md:col-span-6 space-y-6">

                  {/* Register Leader */}
                  <div className="glass-card p-5 rounded-2xl border border-slate-800 bg-slate-950/40 space-y-4">
                    <h3 className="font-bold text-slate-200 text-sm flex items-center gap-1.5">
                      <PlusCircle className="w-4 h-4 text-indigo-400" />
                      Cadastrar Novo Líder
                    </h3>
                    <form onSubmit={handleRHRegisterLeader} className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-400 font-mono uppercase">Nome Completo</label>
                          <input
                            type="text"
                            required
                            value={newLeaderName}
                            onChange={(e) => setNewLeaderName(e.target.value)}
                            placeholder="Ex: Carlos Abreu"
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-2 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-400 font-mono uppercase">Email Corporativo</label>
                          <input
                            type="email"
                            required
                            value={newLeaderEmail}
                            onChange={(e) => setNewLeaderEmail(e.target.value)}
                            placeholder="ex: lider.carlos@clearit.com"
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-2 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-mono uppercase">Senha Padrão (Mín. 6 Caracteres)</label>
                        <input
                          type="password"
                          required
                          value={newLeaderPassword}
                          onChange={(e) => setNewLeaderPassword(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-2 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full bg-indigo-650 hover:bg-indigo-550 text-slate-100 text-xs font-bold py-2 rounded-lg transition-all"
                      >
                        Registrar Líder no Supabase
                      </button>
                    </form>
                  </div>

                  {/* Register Collaborator */}
                  <div className="glass-card p-5 rounded-2xl border border-slate-800 bg-slate-950/40 space-y-4">
                    <h3 className="font-bold text-slate-200 text-sm flex items-center gap-1.5">
                      <PlusCircle className="w-4 h-4 text-cyan-400" />
                      Cadastrar Novo Colaborador (Liderado)
                    </h3>
                    <form onSubmit={handleRHRegisterCollaborator} className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-400 font-mono uppercase">Nome Completo</label>
                          <input
                            type="text"
                            required
                            value={newColabName}
                            onChange={(e) => setNewColabName(e.target.value)}
                            placeholder="Ex: João da Silva"
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-2 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-400 font-mono uppercase">Cargo / Função</label>
                          <input
                            type="text"
                            required
                            value={newColabRole}
                            onChange={(e) => setNewColabRole(e.target.value)}
                            placeholder="Ex: Dev Back-end Pleno"
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-2 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-mono uppercase">E-mail Corporativo</label>
                        <input
                          type="email"
                          required
                          value={newColabEmail}
                          onChange={(e) => setNewColabEmail(e.target.value)}
                          placeholder="Ex: joao.silva@clearit.com.br"
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-2 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-400 font-mono uppercase">DISC</label>
                          <select
                            value={newColabDisc}
                            onChange={(e) => setNewColabDisc(e.target.value as any)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-2 text-slate-200 text-xs focus:outline-none"
                          >
                            <option value="DOMINANTE">DOMINANTE</option>
                            <option value="ESTAVEL">ESTAVEL</option>
                            <option value="ANALITICO">ANALITICO</option>
                            <option value="INFLUENTE">INFLUENTE</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-400 font-mono uppercase">Nível</label>
                          <select
                            value={newColabLevel}
                            onChange={(e) => setNewColabLevel(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-2 text-slate-200 text-xs focus:outline-none"
                          >
                            <option value="L1">L1 (Júnior)</option>
                            <option value="L2">L2 (Pleno)</option>
                            <option value="L3">L3 (Sênior)</option>
                            <option value="L4">L4 (Principal)</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-400 font-mono uppercase">Líder Relacionado</label>
                          <select
                            value={newColabLeaderId}
                            onChange={(e) => setNewColabLeaderId(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-2 text-slate-200 text-xs focus:outline-none"
                          >
                            <option value="">Nenhum</option>
                            {profiles.filter(p => p.profile !== 'PENDENTE' && p.profile !== 'ADMINISTRADOR').map(p => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-cyan-650 hover:bg-cyan-550 text-slate-100 text-xs font-bold py-2 rounded-lg transition-all"
                      >
                        Registrar Colaborador no Supabase
                      </button>
                    </form>
                  </div>

                  {/* Active Leaders List */}
                  <div className="glass-card p-5 rounded-2xl border border-slate-800 bg-slate-950/40 space-y-4">
                    <h3 className="font-bold text-slate-200 text-sm flex items-center gap-1.5 border-b border-slate-900 pb-2">
                      <UserCheck className="w-4.5 h-4.5 text-indigo-400" />
                      Gestores Cadastrados ({profiles.filter(p => p.profile !== 'ADMINISTRADOR').length})
                    </h3>

                    {profiles.filter(p => p.profile !== 'ADMINISTRADOR').length === 0 ? (
                      <p className="text-xs text-slate-500 italic">Nenhum gestor cadastrado.</p>
                    ) : (
                      <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                        <table className="w-full text-xs text-slate-300 text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-900 text-slate-500 font-mono uppercase text-[9px]">
                              <th className="py-2">Nome</th>
                              <th className="py-2">Perfil</th>
                              <th className="py-2 text-right">Ação</th>
                            </tr>
                          </thead>
                          <tbody>
                            {profiles.filter(p => p.profile !== 'ADMINISTRADOR').map(p => (
                              <tr key={p.id} className="border-b border-slate-900/60 hover:bg-slate-900/10">
                                <td className="py-2 font-medium">
                                  <div>{p.name}</div>
                                  <div className="text-[10px] text-slate-500">{p.email}</div>
                                </td>
                                <td className="py-2">
                                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${p.profile === 'ADMINISTRADOR'
                                      ? 'bg-cyan-950/50 text-cyan-400 border border-cyan-900/40 font-bold'
                                      : p.profile === 'PENDENTE'
                                        ? 'bg-amber-950/50 text-amber-400 border border-amber-900/40'
                                        : 'bg-indigo-950/50 text-indigo-300 border border-indigo-900/40'
                                    }`}>
                                    {p.profile}
                                  </span>
                                </td>
                                <td className="py-2 text-right">
                                  {p.email !== 'rh.priscila@clearit.com.br' ? (
                                    <button
                                      onClick={() => handleDeleteLeader(p.id as string, p.name)}
                                      className="text-[10px] text-red-400 hover:text-red-300 hover:underline font-bold px-2 py-1 transition-all"
                                    >
                                      Deletar
                                    </button>
                                  ) : (
                                    <span className="text-[10px] text-slate-600 italic">RH Admin</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                </div>

                {/* Right: Conflict Alerts & Auditing */}
                <div className="md:col-span-6 space-y-6">
                  <div className="glass-card p-5 rounded-2xl border border-slate-800 bg-slate-950/40 space-y-4">
                    <h3 className="font-bold text-slate-200 text-sm flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-amber-500" />
                      Alertas de Atrito e Mediações de Conflito
                    </h3>

                    {conflicts.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">Nenhum atrito reportado pela IA ou pelos Líderes.</p>
                    ) : (
                      <div className="space-y-3 max-h-[380px] overflow-y-auto">
                        {conflicts.map(conf => (
                          <div key={conf.id} className="p-3 bg-slate-900/60 rounded-xl border border-slate-850 space-y-2">
                            <div className="flex justify-between items-start text-xs">
                              <div>
                                <strong className="text-slate-200">{conf.collaboratorName}</strong>
                                <div className="text-[10px] text-slate-500 font-mono mt-0.5">Protocolo: {conf.protocol}</div>
                              </div>
                              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${conf.status === 'PENDING'
                                  ? 'bg-red-950 text-red-400 border border-red-900/60'
                                  : 'bg-emerald-950 text-emerald-400 border border-emerald-900/60'
                                }`}>
                                {conf.status === 'PENDING' ? 'Pendente' : 'Solucionado'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed font-sans">{conf.description}</p>

                            {conf.status === 'PENDING' ? (
                              <button
                                onClick={async () => {
                                  const { value: notes } = await Swal.fire({
                                    title: 'Resolver Conflito',
                                    input: 'textarea',
                                    inputLabel: 'Ações tomadas pelo RH (Priscila):',
                                    inputPlaceholder: 'Descreva a resolução...',
                                    inputAttributes: { 'aria-label': 'Resolução' },
                                    showCancelButton: true,
                                    background: '#0f172a',
                                    color: '#cbd5e1',
                                    confirmButtonColor: '#4f46e5'
                                  });
                                  if (notes) {
                                    handleResolveConflict(conf.id, notes);
                                  }
                                }}
                                className="text-[10px] bg-indigo-900/40 hover:bg-indigo-900 border border-indigo-800 text-indigo-300 font-bold px-2 py-1 rounded"
                              >
                                Resolver e Arquivar
                              </button>
                            ) : (
                              <div className="text-[10px] text-slate-500 font-sans border-t border-slate-900/60 pt-1">
                                <strong>Resolução:</strong> {conf.notes}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Active Collaborators List */}
                  <div className="glass-card p-5 rounded-2xl border border-slate-800 bg-slate-950/40 space-y-4">
                    <h3 className="font-bold text-slate-200 text-sm flex items-center gap-1.5 border-b border-slate-900 pb-2">
                      <User className="w-4.5 h-4.5 text-cyan-400" />
                      Liderados Cadastrados ({collaborators.length})
                    </h3>

                    {collaborators.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">Nenhum colaborador cadastrado.</p>
                    ) : (
                      <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                        <table className="w-full text-xs text-slate-300 text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-900 text-slate-500 font-mono uppercase text-[9px]">
                              <th className="py-2">Nome</th>
                              <th className="py-2">Cargo / DISC / Nível</th>
                              <th className="py-2 text-right">Ação</th>
                            </tr>
                          </thead>
                          <tbody>
                            {collaborators.map(colab => {
                              const matchedLeader = profiles.find(p => p.id === colab.leaderId);
                              return (
                                <tr key={colab.id} className="border-b border-slate-900/60 hover:bg-slate-900/10">
                                  <td className="py-2 font-medium">
                                    <div>{colab.name}</div>
                                    <div className="text-[10px] text-slate-500">
                                      Líder: {matchedLeader ? matchedLeader.name : 'Nenhum'}
                                    </div>
                                  </td>
                                  <td className="py-2">
                                    <div className="text-slate-400">{colab.role}</div>
                                    <div className="flex gap-1.5 mt-0.5">
                                      <span className="text-[9px] bg-slate-900 text-cyan-400 px-1 py-0.2 rounded font-mono font-bold">{colab.disc}</span>
                                      <span className="text-[9px] bg-slate-900 text-indigo-400 px-1 py-0.2 rounded font-mono font-bold">{colab.level}</span>
                                    </div>
                                  </td>
                                  <td className="py-2 text-right">
                                    <button
                                      onClick={() => handleDeleteCollaborator(colab.id as string, colab.name)}
                                      className="text-[10px] text-red-400 hover:text-red-300 hover:underline font-bold px-2 py-1 transition-all"
                                    >
                                      Deletar
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                </div>

              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
