'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { storage, MOCK_COLLABORATORS } from '@/lib/storage';
import { 
  LeaderProfileType, 
  Collaborator, 
  OneOnOne, 
  ConflictEscalation, 
  UserSession, 
  LeaderProfile,
  SimulatedEmail
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
  Play
} from 'lucide-react';
import Swal from 'sweetalert2';

type SectionId = 'onboarding' | 'copiloto' | 'escalation' | 'rh' | 'historico' | 'simulador';

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
          text: '"Sinto muito que esteja se sentindo assim, Mariana. A sua saúde e estabilidade são essenciais. Vamos conversar sobre isso com calma."',
          points: 10,
          feedback: 'Excelente! Demonstrou empatia e segurança psicológica imediatas, valores fundamentais para o perfil Estável em momentos de estresse.',
          discTrait: 'S (Acolhimento e Segurança)'
        },
        {
          text: '"Entendi. No modelo MSP da Clear IT, a volatilidade e a agilidade são constantes. Precisamos nos adaptar rapidamente."',
          points: 3,
          feedback: 'Inadequado. Muito frio e focado no jargão corporativo. Aumenta a ansiedade e a sensação de insegurança do Estável.',
          discTrait: 'D (Pressão por Resultados)'
        },
        {
          text: '"Quais tarefas especificamente estão mudando? Liste todas para eu analisar tecnicamente no sistema."',
          points: 5,
          feedback: 'Muito técnico e transacional. Ignora o estado emocional e o cansaço que ela expressou no início.',
          discTrait: 'C (Foco no Processo)'
        }
      ]
    },
    desenvolvimento: {
      colabSpeech: '"Tenho receio de sinalizar que não vou conseguir entregar nas dailies e parecer incompetente, então acabo trabalhando até mais tarde em silêncio."',
      options: [
        {
          text: '"Sinalizar impedimento é sinal de transparência e colaboração. Vamos definir que revisaremos suas tarefas juntos de forma privada nas segundas."',
          points: 10,
          feedback: 'Perfeito! Remove o medo do julgamento público e estabelece um processo de apoio previsível e privado, gerando alta segurança.',
          discTrait: 'S (Apoio Estruturado)'
        },
        {
          text: '"Você não deveria fazer horas extras sem me avisar, isso desalinha as métricas da nossa sprint."',
          points: 3,
          feedback: 'Péssimo. Pune a colaboradora por tentar resolver o problema e foca apenas em métricas gerenciais em vez do bem-estar dela.',
          discTrait: 'C (Foco em Regras)'
        },
        {
          text: '"Tente sinalizar nas reuniões gerais, garanto que a equipe é tranquila e ninguém vai te julgar."',
          points: 6,
          feedback: 'Bem intencionado, mas joga a responsabilidade de volta para Mariana sem criar um mecanismo prático de proteção ou mentoria.',
          discTrait: 'I (Otimismo Passivo)'
        }
      ]
    },
    fechamento: {
      colabSpeech: '"Gostaria apenas de ter mais clareza sobre o que é prioritário e um fluxo de trabalho previsível."',
      options: [
        {
          text: '"Combinado no PDI: Definiremos o foco de entregas na segunda, faremos check-in na quarta e blindo você de novas demandas no meio da sprint."',
          points: 10,
          feedback: 'Excelente! Definiu um plano de ação estruturado com alta previsibilidade e proteção contra volatilidade, ideal para restabelecer a confiança de um Estável.',
          discTrait: 'S (Planejamento e Previsibilidade)'
        },
        {
          text: '"Eu vou tentar avisar você quando o cliente pedir novas alterações no escopo do portal."',
          points: 5,
          feedback: 'Razoável, mas vago e sem compromisso estruturado de blindagem ou acompanhamento sistemático.',
          discTrait: 'I (Boa Vontade Sem Ação)'
        },
        {
          text: '"Acho que sua meta de PDI deve ser um treinamento de resiliência e gestão do estresse."',
          points: 3,
          feedback: 'Ruim. Transfere toda a responsabilidade da disfunção organizacional de priorização para o nível pessoal de resiliência da colaboradora.',
          discTrait: 'D (Individualização da Culpa)'
        }
      ]
    }
  },
  'colab-03': {
    collaboratorId: 'colab-03',
    name: 'Jorge Oliveira (L4)',
    disc: 'ANALITICO',
    role: 'DevOps Principal',
    introText: 'Jorge identificou falhas técnicas de infraestrutura e quer discuti-las de maneira puramente lógica e baseada em dados.',
    abertura: {
      colabSpeech: '"Preparei este relatório de logs. Detectei que 18% dos alarmes do SOC da Clear IT são falsos positivos gerados por scripts obsoletos que geram retrabalho operacional."',
      options: [
        {
          text: '"Obrigado pela precisão dos dados, Jorge. Esse levantamento lógico é fundamental. Vamos analisar esses 18% e a causa raiz juntos."',
          points: 10,
          feedback: 'Excelente! Demonstra respeito imediato ao trabalho analítico e embasado do colaborador, alinhando-se à comunicação lógica do Analítico.',
          discTrait: 'C (Foco em Dados e Qualidade)'
        },
        {
          text: '"Obrigado pelo relatório, Jorge. Mas me conta, como você está se sentindo em relação às suas conexões pessoais com o time remoto?"',
          points: 3,
          feedback: 'Inadequado. Desvia de forma abrupta de uma dor técnica real para perguntas emocionais que o perfil Analítico costuma achar invasivas de início.',
          discTrait: 'S (Foco Relacional)'
        },
        {
          text: '"Excelente. Vou salvar na nossa pasta compartilhada e, assim que sobrar tempo entre os projetos, damos uma olhada."',
          points: 5,
          feedback: 'Razoável, mas desmotivador. Diminui a urgência de uma falha que o colaborador estudou e estruturou metodicamente.',
          discTrait: 'D (Minimização da Dor Técnica)'
        }
      ]
    },
    desenvolvimento: {
      colabSpeech: '"Para solucionar isso definitivamente, preciso de três sprints de refactoring nos scripts de monitoramento, sem participar de reuniões de status diárias desnecessárias."',
      options: [
        {
          text: '"Entendo a necessidade técnica do refactoring. Vamos planejar as sprints de infraestrutura e eu blindo você das reuniões de alinhamento redundantes."',
          points: 10,
          feedback: 'Excelente! Compreendeu a necessidade de foco ininterrupto do Analítico e propôs uma blindagem prática que maximiza o rendimento dele.',
          discTrait: 'C (Eficiência e Estrutura)'
        },
        {
          text: '"Não podemos abrir essa exceção. Você precisa participar de todas as reuniões do time como regra geral do modelo de squads da Clear IT."',
          points: 3,
          feedback: 'Péssimo. Inflexível. Ignora o argumento lógico de produtividade e prioriza processos burocráticos sobre a solução do problema.',
          discTrait: 'D (Rigidez Burocrática)'
        },
        {
          text: '"Podemos tentar fazer o refactoring nas suas horas vagas, sem alterar seu envolvimento nas demandas dos projetos atuais."',
          points: 4,
          feedback: 'Inadequado. Sobrecarrega o colaborador e ignora o fato de que a correção dos scripts estabilizaria a própria operação do SOC.',
          discTrait: 'D (Falta de Priorização)'
        }
      ]
    },
    fechamento: {
      colabSpeech: '"Com esse refactoring, a estimativa baseada nos logs anteriores é reduzir os falsos alertas para menos de 2%, otimizando o SLA do time."',
      options: [
        {
          text: '"Perfeito. Registraremos no PDI a meta de liderar esse refactoring técnico e medir a redução de 18% para 2% dos alarmes no dashboard corporativo."',
          points: 10,
          feedback: 'Excelente! Definiu metas claras, métricas objetivas de acompanhamento de PDI e valorizou a qualidade técnica demonstrada.',
          discTrait: 'C (Metas Mensuráveis e Lógicas)'
        },
        {
          text: '"Ótimo. Vamos combinar de falar sobre a redução dos alertas em algum momento no futuro, após o refactoring terminar."',
          points: 5,
          feedback: 'Razoável, mas carece de estrutura de PDI formal ou periodicidade lógica, o que desagrada o perfil Analítico.',
          discTrait: 'S (Vagueza Operacional)'
        },
        {
          text: '"Acho muito bom, mas sua maior meta no PDI deveria ser interagir mais socialmente com os outros desenvolvedores do SOC nas reuniões."',
          points: 4,
          feedback: 'Desfocado. Ignora a grande contribuição técnica do refactoring para focar em um aspect de relacionamento que não é a prioridade do momento.',
          discTrait: 'I (Foco em Sociabilidade)'
        }
      ]
    }
  },
  'colab-04': {
    collaboratorId: 'colab-04',
    name: 'Fernanda Lima (L1)',
    disc: 'INFLUENTE',
    role: 'Dev Front-end Júnior',
    introText: 'Fernanda é júnior, entusiasmada e criativa, mas está se sentindo isolada trabalhando de forma remota.',
    abertura: {
      colabSpeech: '"Eu tenho várias ideias de layouts modernos e dinâmicos para o nosso portal interno da Clear IT! Mas o time de backend é muito fechado e sinto que não dão espaço para minhas propostas."',
      options: [
        {
          text: '"Fernanda, adorei sua energia e entusiasmo! Suas ideias de melhorias visuais são super bem-vindas. Vamos ver como integrá-las no fluxo."',
          points: 10,
          feedback: 'Excelente! Validou o entusiasmo e a necessidade de reconhecimento social do Influente, dando voz ativa e feedback positivo imediato.',
          discTrait: 'I (Reconhecimento e Estímulo)'
        },
        {
          text: '"Fernanda, no momento nosso foco é resolver bugs críticos de segurança. Layouts e visual não são nossa prioridade."',
          points: 3,
          feedback: 'Péssimo. Frustra e desmotiva a colaboradora júnior de forma abrupta, cortando seu entusiasmo natural do perfil Influente.',
          discTrait: 'D (Foco Rígido na Entrega)'
        },
        {
          text: '"Você precisa focar em aprender as linguagens de desenvolvimento e regras de backend básicas antes de propor redesenhos estruturais."',
          points: 4,
          feedback: 'Desmotivador. Transmite a mensagem de que, por ser júnior, suas opiniões e criatividade não têm valor para a equipe no momento.',
          discTrait: 'C (Burocracia de Nível)'
        }
      ]
    },
    desenvolvimento: {
      colabSpeech: '"Às vezes me sinto isolada trabalhando de casa. Tenho medo de falar nos canais gerais do Slack e parecer incompetente por ser júnior."',
      options: [
        {
          text: '"Não se sinta assim, suas dúvidas e pontos de vista agregam muito! O que acha de criarmos uma sessão quinzenal leve de demonstração visual para o time?"',
          points: 10,
          feedback: 'Excelente! Propôs uma solução que integra sociabilidade, visibilidade positiva e acolhimento técnico, neutralizando o isolamento do Influente.',
          discTrait: 'I (Sociabilidade e Visibilidade)'
        },
        {
          text: '"Trabalhar de casa exige autodisciplina e maturidade emocional para lidar com o silêncio corporativo."',
          points: 3,
          feedback: 'Inadequado. Frio e professoral. Desconsidera a necessidade humana de conexão social que os perfis Influentes precisam para produzir bem.',
          discTrait: 'C (Foco Normativo)'
        },
        {
          text: '"É normal se sentir assim no início. Tente postar suas dúvidas mesmo com receio, as pessoas acabam respondendo."',
          points: 5,
          feedback: 'Razoável, mas transfere o peso da iniciativa apenas para a colaboradora júnior, sem criar um ambiente facilitado de interação.',
          discTrait: 'S (Confronto Passivo)'
        }
      ]
    },
    fechamento: {
      colabSpeech: '"Eu ficaria muito feliz em poder apresentar algo visual e receber feedback do time sobre novas ideias!"',
      options: [
        {
          text: '"Combinado no PDI: Vamos incluir uma meta de condução técnica onde você apresentará as melhorias de UI quinzenalmente. Eu apoiarei você no preparo."',
          points: 10,
          feedback: 'Excelente! Converteu a necessidade de validação e exposição positiva em uma meta estruturada de PDI com mentoria próxima do líder.',
          discTrait: 'I (Liderança Colaborativa e Protagonismo)'
        },
        {
          text: '"Certo, vamos deixar isso anotado e no próximo trimestre vemos se o time tem espaço na agenda para te ouvir."',
          points: 4,
          feedback: 'Frustrante. Empurra a ação de engajamento para um futuro distante, matando o entusiasmo imediato da colaboradora.',
          discTrait: 'S (Procrastinação Relacional)'
        },
        {
          text: '"A sua meta de PDI principal será terminar os cursos técnicos de React que estão pendentes na plataforma de treinamento corporativo."',
          points: 5,
          feedback: 'Muito formal e transacional. Embora o estudo técnico seja importante, ignora totalmente a necessidade de entrosamento e validação discutidos na reunião.',
          discTrait: 'C (Foco Exclusivo em Cursos)'
        }
      ]
    }
  }
};

export default function DashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [leaderProfile, setLeaderProfile] = useState<LeaderProfile | null>(null);
  const [activeSection, setActiveSection] = useState<SectionId>('onboarding');
  const [copied, setCopied] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncLogs, setSyncLogs] = useState<string[]>([]);

  // States for Email Simulation & Interactive Simulator
  const [simulatedEmails, setSimulatedEmails] = useState<SimulatedEmail[]>([]);
  const [showEmailSuccess, setShowEmailSuccess] = useState(false);
  const [lastSentEmail, setLastSentEmail] = useState<SimulatedEmail | null>(null);
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);

  // States for 1:1 Meeting Transcription & Evaluation
  const [transcriptionText, setTranscriptionText] = useState('');
  const [lgpdConsent, setLgpdConsent] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<{
    score: number;
    feedback: string;
    topics: string[];
    conflictWarning: string | null;
    protocol: string | null;
  } | null>(null);

  // Simulator interactive states
  const [simPhase, setSimPhase] = useState<SimPhase>('intro');
  const [simColabId, setSimColabId] = useState('colab-02');
  const [simScore, setSimScore] = useState(0);
  const [simAnswersHistory, setSimAnswersHistory] = useState<Array<{ phase: string, question: string, answer: string, points: number, feedback: string, discTrait: string }>>([]);
  const [simIaFeedback, setSimIaFeedback] = useState('');
  const [simFeedbackConsolidated, setSimFeedbackConsolidated] = useState('');

  // General app initialization
  useEffect(() => {
    storage.initialize();
    const user = storage.getCurrentUser();
    if (!user) {
      router.push('/login');
      return;
    }
    setCurrentUser(user);

    const profile = storage.getLeaderProfile();
    setLeaderProfile(profile);

    // Load simulated emails log
    const rawEmails = localStorage.getItem('synchr_emails');
    if (rawEmails) {
      setSimulatedEmails(JSON.parse(rawEmails));
    }

    // If profile is PENDENTE or null and user is LEADER, force onboarding
    if (user.role === 'LEADER' && (!profile || profile.profile === 'PENDENTE')) {
      setActiveSection('onboarding');
    } else if (user.role === 'RH') {
      setActiveSection('rh');
    } else {
      setActiveSection('copiloto');
    }
  }, [router]);

  const handleLogout = () => {
    storage.setCurrentUser(null);
    router.push('/login');
  };

  const handleSyncDatabase = async () => {
    setSyncing(true);
    setSyncLogs(['[Início] Conectando ao endpoint corporativo da ClearIT...', '[Status] Lendo atas do localStorage...']);
    
    await new Promise((resolve) => setTimeout(resolve, 800));
    
    const oneOnOnesList = storage.getOneOnOnes();
    setSyncLogs(prev => [
      ...prev,
      `[Status] Detectadas ${oneOnOnesList.length} atas de reunião para processamento.`,
      `[Segurança] Higienizando PII e criptografando notas...`
    ]);

    await new Promise((resolve) => setTimeout(resolve, 850));

    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetings: oneOnOnesList })
      });
      const data = await res.json();
      if (data.success) {
        setSyncLogs(prev => [
          ...prev,
          `[Protocolo] Recebido do DB: ${data.protocol}`,
          `[Status] Total sincronizado: ${data.totalSynced} registros.`,
          `[Sucesso] Concluído em ${new Date(data.timestamp).toLocaleTimeString()}. Sincronizado!`
        ]);
      } else {
        setSyncLogs(prev => [...prev, `[Erro] Falha reportada pelo banco: ${data.error}`]);
      }
    } catch (e) {
      console.error(e);
      setSyncLogs(prev => [...prev, `[Erro] Falha crítica de conexão na rota /api/sync.`]);
    } finally {
      setSyncing(false);
    }
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
        { key: 'C', text: "Crio um plano de ação rápido de 3 passos para ele praticar soft skills no próximo alinhamento." }
      ]
    },
    {
      id: 8,
      question: "8. Como você lida com a pressão por prazos apertados vinda da diretoria?",
      options: [
        { key: 'A', text: "Repasso os dados brutos e peço foco total na codificação para entregar o escopo." },
        { key: 'B', text: "Reúno a equipe para entender a sobrecarga e busco blindá-los protegendo o clima interno." },
        { key: 'C', text: "Ajusto as prioridades de forma enxuta e gerencio a alocação de tempo de forma agressiva." }
      ]
    },
    {
      id: 9,
      question: "9. Qual a sua visão sobre a participação do time em eventos e treinamentos externos?",
      options: [
        { key: 'A', text: "Válido, desde que o tema seja 100% técnico e não impacte o andamento das entregas das sprints." },
        { key: 'B', text: "Essencial para o desenvolvimento integral do profissional, incluindo palestras de soft skills e cultura." },
        { key: 'C', text: "Importante, desde que traga retorno rápido (KPIs de eficiência) para o time a curto prazo." }
      ]
    },
    {
      id: 10,
      question: "10. O que para você caracteriza uma reunião de 1:1 bem-sucedida?",
      options: [
        { key: 'A', text: "Todos os impedimentos técnicos resolvidos e as tarefas desbloqueadas no board de desenvolvimento." },
        { key: 'B', text: "O liderado se sentindo seguro, ouvido de verdade e com clareza emocional sobre seu papel." },
        { key: 'C', text: "Um plano de ação claro e resumido acordado para os próximos 15 dias." }
      ]
    }
  ];

  const handleSelectAnswer = (qId: number, optionKey: 'A' | 'B' | 'C') => {
    const updated = { ...answers, [qId]: optionKey };
    setAnswers(updated);

    // Auto calculate diagnosed profile if all 10 questions answered
    if (Object.keys(updated).length === 10) {
      const counts = { A: 0, B: 0, C: 0 };
      Object.values(updated).forEach(k => counts[k]++);
      
      let winner: LeaderProfileType = 'TRANSICAO';
      if (counts.A > counts.B && counts.A > counts.C) winner = 'TECNICO';
      else if (counts.C > counts.A && counts.C > counts.B) winner = 'ENGAJADO';
      
      setDiagnosedProfile(winner);
    }
  };

  const handleSaveOnboarding = () => {
    if (!diagnosedProfile || !currentUser) return;

    const newProfile: LeaderProfile = {
      id: 1,
      email: currentUser.email,
      name: currentUser.name,
      profile: diagnosedProfile,
      levelFrom,
      levelTo
    };

    storage.setLeaderProfile(newProfile);
    setLeaderProfile(newProfile);
    
    // Update local state for current user session
    const updatedUser = { ...currentUser, profile: diagnosedProfile };
    setCurrentUser(updatedUser);
    localStorage.setItem('synchr_user', JSON.stringify(updatedUser));

    Swal.fire({
      title: 'Onboarding Concluído!',
      html: `Perfil Identificado: <strong>${
        diagnosedProfile === 'TECNICO' ? '🤖 Líder Técnico' : diagnosedProfile === 'TRANSICAO' ? '🌱 Líder em Transição' : '🔥 Líder Engajado'
      }</strong><br/>Plataforma desbloqueada com sucesso.`,
      icon: 'success',
      background: '#0f172a',
      color: '#cbd5e1',
      confirmButtonColor: '#4f46e5',
      customClass: {
        popup: 'border border-slate-800 rounded-2xl font-sans'
      }
    });

    setActiveSection('copiloto');
  };

  const handleResetOnboarding = () => {
    if (confirm("Deseja realmente resetar o perfil de liderança? As seções serão bloqueadas novamente.")) {
      storage.setLeaderProfile(null);
      setLeaderProfile(null);
      setAnswers({});
      setDiagnosedProfile(null);
      
      if (currentUser) {
        const updatedUser = { ...currentUser, profile: 'PENDENTE' as LeaderProfileType };
        setCurrentUser(updatedUser);
        localStorage.setItem('synchr_user', JSON.stringify(updatedUser));
      }
      
      setActiveSection('onboarding');
    }
  };

  const getProfileMetadata = (p: LeaderProfileType | null) => {
    switch(p) {
      case 'TECNICO':
        return {
          title: "Líder Técnico 🤖",
          desc: "Gestores focados em entregas e metas tangíveis. Apresentam baixa tolerância a jargões corporativos de RH. O copiloto gerará pautas diretas, curtas e baseadas em remoção de impedimentos.",
          color: "border-indigo-500/50 text-indigo-400 bg-indigo-950/20",
          glow: "indigo"
        };
      case 'ENGAJADO':
        return {
          title: "Líder Engajado 🔥",
          desc: "Líderes focados no desenvolvimento individual do time (PDI e carreira), mas que sofrem com extrema falta de tempo na agenda. O copiloto priorizará resumos rápidos e ações práticas em < 3 minutos.",
          color: "border-amber-500/50 text-amber-400 bg-amber-950/20",
          glow: "amber"
        };
      case 'TRANSICAO':
      default:
        return {
          title: "Líder em Transição 🌱",
          desc: "Profissionais promovidos recentemente de cargos técnicos para gestão. Sentem falta de bagagem emocional para conversas sensíveis e feedbacks. O copiloto fornecerá roteiros passo a passo detalhados com metodologia SBI.",
          color: "border-emerald-500/50 text-emerald-400 bg-emerald-950/20",
          glow: "emerald"
        };
    }
  };

  const handleSwitchSection = (sectionId: SectionId) => {
    const isLocked = currentUser?.role === 'LEADER' && (!leaderProfile || leaderProfile.profile === 'PENDENTE');
    if (sectionId !== 'onboarding' && isLocked) {
      setShowWarning(true);
      setTimeout(() => setShowWarning(false), 3500);
      return;
    }
    setActiveSection(sectionId);
    setSidebarOpen(false);
  };

  // ==========================================
  // SECTION 2: COPILOTO 1:1 STATE & LOGIC
  // ==========================================
  const [selectedColabId, setSelectedColabId] = useState('colab-02');
  const [meetingType, setMeetingType] = useState('Quinzenal Rotineira');
  const [impedimentContext, setImpedimentContext] = useState('Atrasos frequentes nas últimas duas sprints e pouca comunicação.');
  const [generatedScript, setGeneratedScript] = useState('');

  const activeColab = MOCK_COLLABORATORS.find(c => c.id === selectedColabId) || MOCK_COLLABORATORS[0];

  const handleGenerateScript = () => {
    const profile = leaderProfile?.profile || 'TRANSICAO';
    const disc = activeColab.disc;
    
    let script = `### Roteiro de 1:1 Inteligente\n\n`;
    script += `**Liderado:** ${activeColab.name} | Perfil DISC: ${disc}\n`;
    script += `**Foco:** ${meetingType}\n`;
    script += `**Perfil do Líder:** ${profile}\n\n`;
    script += `---\n\n`;

    if (profile === 'TECNICO') {
      script += `#### 1. Sincronismo Técnico & Impedimentos (3 min)\n`;
      script += `- "Carlos, direto ao ponto: o que está travando sua entrega nas últimas sprints?"\n`;
      script += `- "Como posso ajudar a desbloquear os pull requests pendentes?"\n\n`;
      script += `#### 2. Metas & Prazos (5 min)\n`;
      script += `- "Temos a entrega da feature X dia 15. Qual o seu plano de ação real para finalizar?"\n`;
      if (disc === 'DOMINANTE') {
        script += `- *Dica DISC Domínio:* Vá direto aos resultados, evite enrolar ou fazer rodeios.\n`;
      }
    } else if (profile === 'ENGAJADO') {
      script += `#### 1. Check-in Rápido de Energia (2 min)\n`;
      script += `- "De 1 a 5, como está seu nível de energia e motivação essa semana?"\n\n`;
      script += `#### 2. Ponto Focal & Carreira (3 min)\n`;
      script += `- "Olhando para os seus objetivos de PDI na Clear IT, qual das suas tarefas atuais mais contribui para o seu crescimento?"\n`;
      script += `- "Que competência você quer focar em desenvolver na próxima sprint?"\n`;
    } else {
      // TRANSICAO - SBI Method
      script += `#### 1. Abertura Empática (4 min)\n`;
      script += `- "Gostaria de saber como você tem se sentido no dia a dia com a carga de trabalho. Como estão as coisas?"\n\n`;
      script += `#### 2. Feedback Estruturado - Metodologia SBI (8 min)\n`;
      script += `- **Situação:** "Durante a última sprint do projeto..."\n`;
      script += `- **Comportamento:** "Percebi que houveram atrasos na entrega dos cards de autenticação e pouca sinalização de impedimentos nas dailies."\n`;
      script += `- **Impacto:** "Isso acabou gerando um gargalo para a equipe de QA e atrasou o deploy homologado."\n`;
      script += `- "Faz sentido para você? Qual a sua perspectiva sobre esse cenário?"\n\n`;
      script += `#### 3. Plano de Ação Conjunto (5 min)\n`;
      script += `- "Vamos alinhar uma meta simples de comunicação diária em caso de bloqueio. O que você acha?"\n`;
    }

    setGeneratedScript(script);
    // Reset any previous evaluation on generating a new script
    setEvaluationResult(null);
    setTranscriptionText('');
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(generatedScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ==========================================
  // SECTION 3: COPILOTO TRANSCRIPTION & EVALUATION LOGIC
  // ==========================================
  const handleEvaluateAndArchive = async () => {
    if (!transcriptionText.trim()) {
      Swal.fire({
        title: 'Campo Obrigatório',
        text: 'Por favor, registre a transcrição ou anotações da fala do colaborador.',
        icon: 'warning',
        background: '#0f172a',
        color: '#cbd5e1',
        confirmButtonColor: '#4f46e5',
        customClass: { popup: 'border border-slate-800 rounded-2xl font-sans' }
      });
      return;
    }

    if (!lgpdConsent) {
      Swal.fire({
        title: 'Consentimento Necessário',
        text: 'Sob as diretrizes da LGPD (RN01), o consentimento do colaborador é obrigatório para registrar a ata.',
        icon: 'error',
        background: '#0f172a',
        color: '#cbd5e1',
        confirmButtonColor: '#4f46e5',
        customClass: { popup: 'border border-slate-800 rounded-2xl font-sans' }
      });
      return;
    }

    setIsEvaluating(true);

    // Simulate IA Processing Delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    const cleanText = transcriptionText.toLowerCase();
    const leaderProf = leaderProfile?.profile || 'TRANSICAO';
    const colabDisc = activeColab.disc;

    // 1. Conflict detection (Passo 7 / F-05)
    // Keywords: ["sobrecarregado", "atrito", "desgaste", "briga", "injusto"]
    const conflictKeywords = ["sobrecarregado", "sobrecarregada", "atrito", "desgaste", "briga", "injusto", "injusta", "cansado", "cansada"];
    const hasConflict = conflictKeywords.some(keyword => cleanText.includes(keyword));

    let protocol: string | null = null;
    let conflictWarning: string | null = null;

    if (hasConflict) {
      protocol = `SHR-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      conflictWarning = `Risco de Conflito Detectado: A transcrição contém termos que indicam alto desgaste ou sobrecarga. Um chamado de mediação com o RH foi aberto automaticamente com o protocolo ${protocol}.`;

      // Save conflict to RH database (mocked storage)
      const conflict: ConflictEscalation = {
        id: `conf-${Date.now()}`,
        protocol,
        collaboratorId: activeColab.id,
        collaboratorName: activeColab.name,
        description: `[Auto-Detecção via Transcrição] O colaborador relatou descontentamento/atrito na 1:1. Resumo do relato: "${transcriptionText}"`,
        date: new Date().toISOString().split('T')[0],
        status: 'PENDING',
        hasHistory: true,
        isBypass: false
      };
      storage.saveConflict(conflict);
    }

    // 2. Mock AI Evaluation (Passo 6 / F-06)
    // We generate a tailored feedback based on Leader Profile and Liderado DISC
    let score = 85; // base score
    let feedback = "";
    let topics: string[] = [];

    // Extract topics dynamically or mock them based on keywords
    if (cleanText.includes("qa") || cleanText.includes("code review") || cleanText.includes("deploy")) {
      topics.push("Homologação e Fluxo de QA / Deploy");
    }
    if (cleanText.includes("prioridade") || cleanText.includes("prioridades") || cleanText.includes("escopo") || cleanText.includes("tarefa")) {
      topics.push("Estabilidade de Escopo e Priorização de Demandas");
    }
    if (cleanText.includes("alarmes") || cleanText.includes("soc") || cleanText.includes("infraestrutura") || cleanText.includes("logs")) {
      topics.push("Qualidade Técnica e Otimização do SOC (Alarmes Falsos)");
    }
    if (cleanText.includes("layout") || cleanText.includes("ui") || cleanText.includes("front-end") || cleanText.includes("ideias")) {
      topics.push("Melhoria de UI e Colaboração de Design");
    }
    if (cleanText.includes("isolado") || cleanText.includes("isolada") || cleanText.includes("home office") || cleanText.includes("remoto")) {
      topics.push("Integração Social e Trabalho Remoto");
    }
    if (cleanText.includes("sobrecarregado") || cleanText.includes("sobrecarregada") || cleanText.includes("cansado") || cleanText.includes("cansada")) {
      topics.push("Bem-estar Emocional e Carga de Trabalho");
    }
    if (topics.length === 0) {
      topics.push("Alinhamento Geral de Rotina");
    }

    // Adapt feedback to Leader Profile and Liderado DISC
    if (colabDisc === 'DOMINANTE') {
      if (leaderProf === 'TECNICO') {
        score = 95;
        feedback = "Excelente calibração! Como Líder Técnico lidando com um liderado Dominante (Carlos), você evitou discussões subjetivas e focou em métricas e autonomia. O Carlos valoriza a objetividade e a solução pragmática dos impedimentos de QA.";
      } else if (leaderProf === 'ENGAJADO') {
        score = 80;
        feedback = "Bom alinhamento. Você buscou focar em metas rápidas, mas lembre-se de que o Dominante precisa sentir que tem autonomia e impacto direto nos resultados técnicos. Evite focar em dinâmicas de pessoas se houver bloqueios operacionais urgentes.";
      } else {
        score = 70;
        feedback = "Atenção: O liderado Dominante pode se sentir frustrado com abordagens sentimentais excessivas ou feedbacks longos (método SBI). Tente ser mais direto ao ponto nas próximas sessões, focando no plano de ação prático.";
      }
    } else if (colabDisc === 'ESTAVEL') {
      if (leaderProf === 'TRANSICAO') {
        score = 98;
        feedback = "Desempenho espetacular! O perfil Estável (Mariana) necessita de segurança psicológica, previsibilidade e apoio direto. Sua abordagem de transição com foco em acompanhamento próximo e empatia desarmou a insegurança dela sobre prazos.";
      } else if (leaderProf === 'ENGAJADO') {
        score = 85;
        feedback = "Bom ritmo. O Estável responde bem ao foco de carreira, mas garanta que o plano de ação seja calmo e dê espaço para ela respirar. O cansaço relatado exige que você a blinde ativamente de mudanças no meio da sprint.";
      } else {
        score = 65;
        feedback = "Alerta de Tom: Líderes Técnicos tendem a cobrar entregas de forma seca. O Estável (Mariana) interpreta isso como pressão fria, aumentando o silêncio dela sobre atrasos. Pratique empatia ativa e reserve tempo para ouvi-la.";
      }
    } else if (colabDisc === 'ANALITICO') {
      if (leaderProf === 'TECNICO') {
        score = 95;
        feedback = "Alinhamento ideal! O Analítico (Jorge) valoriza discussões baseadas em logs, dados e arquitetura lógica. Como líder técnico, você reconheceu a necessidade de refactoring dele sem impor conversas sociais invasivas de início.";
      } else if (leaderProf === 'TRANSICAO') {
        score = 80;
        feedback = "Apropriado. Usar a metodologia estruturada ajuda a guiar o feedback, mas evite rodeios emocionais. O Analítico responde melhor quando você concorda com o plano técnico de forma metódica e mensurável no PDI.";
      } else {
        score = 75;
        feedback = "Ajuste necessário: O perfil Analítico é avesso a conversação vaga sobre sentimentos. Foque nas métricas de redução de alarmes falsos (SLA) para mantê-lo engajado. Evite pressionar por interações sociais forçadas.";
      }
    } else { // INFLUENTE (Fernanda)
      if (leaderProf === 'ENGAJADO') {
        score = 96;
        feedback = "Excelente conexão! O Influente (Fernanda) precisa de visibilidade positiva, entusiasmo e espaço criativo. Ao apoiar suas ideias de UI e criar uma dinâmica de apresentação para a equipe, você maximizou a energia dela.";
      } else if (leaderProf === 'TRANSICAO') {
        score = 85;
        feedback = "Bom acolhimento. Fernanda responde muito bem a orientações empáticas. Lembre-se apenas de ajudar a estruturar as ideias dela de forma concreta no PDI, para que o entusiasmo não se disperse em ideias soltas.";
      } else {
        score = 60;
        feedback = "Risco de desengajamento: O Líder Técnico focado apenas em tarefas operacionais frias ('concluir curso React', 'ignorar UI por enquanto') frustra a necessidade de pertencimento e inovação do Influente.";
      }
    }

    const evaluationObj = {
      score,
      feedback,
      topics,
      conflictWarning,
      protocol
    };

    setEvaluationResult(evaluationObj);

    // Save the finalized meeting to storage (Passo 5)
    storage.saveOneOnOne({
      id: `1on1-${Date.now()}`,
      collaboratorId: activeColab.id,
      collaboratorName: activeColab.name,
      date: new Date().toISOString().split('T')[0],
      type: meetingType,
      context: impedimentContext,
      scriptText: generatedScript || 'Roteiro não gerado previamente.',
      notes: `Avaliação: Pontuação de calibração: ${score}/100. Feedback: ${feedback}`,
      transcription: transcriptionText,
      evaluation: JSON.stringify(evaluationObj)
    });

    setIsEvaluating(false);

    Swal.fire({
      title: 'Reunião Avaliada e Arquivada!',
      html: `A 1:1 com <strong>${activeColab.name}</strong> foi registrada no localStorage sob diretrizes da LGPD (dados de saúde/PII higienizados).${
        hasConflict ? `<br/><br/><span class="text-amber-400 font-bold">⚠️ Conflito registrado: Protocolo ${protocol}</span>` : ''
      }`,
      icon: 'success',
      background: '#0f172a',
      color: '#cbd5e1',
      confirmButtonColor: '#4f46e5',
      customClass: { popup: 'border border-slate-800 rounded-2xl font-sans' }
    });
  };

  // ==========================================
  // SECTION 4: ESCALAÇÃO DE CONFLITOS LOGIC (F-05)
  // ==========================================
  const [escColabId, setEscColabId] = useState('colab-02');
  const [escDesc, setEscDesc] = useState('');
  const [isBypass, setIsBypass] = useState(false);
  const [hasHistory, setHasHistory] = useState(true);

  // Check 1on1 history in the last 45 days
  useEffect(() => {
    const history = storage.getOneOnOnes();
    // Check if there is a 1on1 with this collaborator
    const match = history.some(h => h.collaboratorId === escColabId);
    setHasHistory(match);
  }, [escColabId]);

  const handleSubmitEscalation = (e: React.FormEvent) => {
    e.preventDefault();

    if (!escDesc.trim()) {
      Swal.fire({
        title: 'Campo Obrigatório',
        text: 'Por favor, descreva detalhadamente os fatos.',
        icon: 'warning',
        background: '#0f172a',
        color: '#cbd5e1',
        confirmButtonColor: '#4f46e5',
        customClass: { popup: 'border border-slate-800 rounded-2xl font-sans' }
      });
      return;
    }

    // Business Rule check: RN03 (Rule of 45 days) or RN04 (Bypass)
    if (!hasHistory && !isBypass) {
      Swal.fire({
        title: 'Bloqueio de Regra de Negócio (RN03)',
        html: `Não foi detectado histórico de reuniões 1:1 com este colaborador nos últimos 45 dias.<br/><br/>Você precisa realizar pelo menos uma 1:1 de alinhamento antes de acionar o RH, ou selecionar o <strong>'Bypass de Assédio/Ética'</strong> em casos graves.`,
        icon: 'error',
        background: '#0f172a',
        color: '#cbd5e1',
        confirmButtonColor: '#4f46e5',
        customClass: { popup: 'border border-slate-800 rounded-2xl font-sans' }
      });
      return;
    }

    const protocolNum = `SHR-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const colab = MOCK_COLLABORATORS.find(c => c.id === escColabId)!;

    const conflict: ConflictEscalation = {
      id: `conf-${Date.now()}`,
      protocol: protocolNum,
      collaboratorId: colab.id,
      collaboratorName: colab.name,
      description: escDesc,
      date: new Date().toISOString().split('T')[0],
      status: 'PENDING',
      hasHistory,
      isBypass
    };

    storage.saveConflict(conflict);
    Swal.fire({
      title: 'Escalação Enviada!',
      html: `Protocolo gerado: <strong>${protocolNum}</strong><br/><br/>O time de RH de TI (Priscila Bacelar) foi acionado e revisará o caso no painel analítico.`,
      icon: 'success',
      background: '#0f172a',
      color: '#cbd5e1',
      confirmButtonColor: '#4f46e5',
      customClass: { popup: 'border border-slate-800 rounded-2xl font-sans' }
    });
    setEscDesc('');
    setIsBypass(false);
  };

  // ==========================================
  // SECTION 5: PAINEL DO RH (ADMIN - F-06)
  // ==========================================
  const [conflicts, setConflicts] = useState<ConflictEscalation[]>([]);
  const [selectedConflictId, setSelectedConflictId] = useState<string | null>(null);
  const [mediationNotes, setMediationNotes] = useState('');
  const [exportPayload, setExportPayload] = useState('');

  useEffect(() => {
    if (activeSection === 'rh') {
      setConflicts(storage.getConflicts());
    }
  }, [activeSection]);

  const handleUpdateConflictStatus = (id: string, newStatus: ConflictEscalation['status']) => {
    if (newStatus === 'UNRESOLVED' && (!mediationNotes || mediationNotes.trim().length < 15)) {
      Swal.fire({
        title: 'Justificativa Obrigatória',
        text: 'Erro: Registre pelo menos 15 caracteres nas Notas de Resolução / Mediação explicando por que não foi possível resolver o conflito antes de encaminhar.',
        icon: 'error',
        background: '#0f172a',
        color: '#cbd5e1',
        confirmButtonColor: '#4f46e5',
        customClass: { popup: 'border border-slate-800 rounded-2xl font-sans' }
      });
      return;
    }
    storage.updateConflictStatus(id, newStatus, mediationNotes);
    setConflicts(storage.getConflicts());
    setSelectedConflictId(null);
    setMediationNotes('');
    Swal.fire({
      title: 'Atualizado!',
      text: 'Chamado atualizado com sucesso no banco mockado local!',
      icon: 'success',
      background: '#0f172a',
      color: '#cbd5e1',
      confirmButtonColor: '#4f46e5',
      customClass: { popup: 'border border-slate-800 rounded-2xl font-sans' }
    });
  };

  const handleSelectConflict = (c: ConflictEscalation) => {
    setSelectedConflictId(c.id);
    setMediationNotes(c.notes || '');
  };

  // LGPD Export Pseudonymization & Encryption Simulator
  const handleSimulateLgpdExport = () => {
    const list = storage.getConflicts();
    
    // Simulate SHA-256 pseudonymization and AES-256 encryption string
    const simulatedExport = list.map(c => {
      // Pseudonymize collaborator name (generate a deterministic hash)
      const pseudoNameHash = `SHA256_SALT_HASH_${c.collaboratorId}`;
      return {
        protocol: c.protocol,
        date: c.date,
        pseudoCollaborator: pseudoNameHash,
        status: c.status,
        encryptedDescription: `AES_256_GCM_ENCRYPTED_DATA[${Buffer.from(c.description).toString('base64').substring(0, 32)}...]`,
        compliantWithLgpd: true
      };
    });

    setExportPayload(JSON.stringify(simulatedExport, null, 2));
  };

  // FINE TUNING PROMPTS EDITOR STATE
  const [mainPrompt, setMainPrompt] = useState('');
  const [realTimePrompt, setRealTimePrompt] = useState('');

  useEffect(() => {
    if (activeSection === 'rh') {
      const prompts = storage.getPrompts();
      setMainPrompt(prompts.mainPrompt);
      setRealTimePrompt(prompts.realTimePrompt);
    }
  }, [activeSection]);

  const handleSavePrompts = () => {
    storage.savePrompts({ mainPrompt, realTimePrompt });
    Swal.fire({
      title: 'Salvo!',
      text: 'Prompts de Sistema atualizados com sucesso para todas as gerações de IA da plataforma!',
      icon: 'success',
      background: '#0f172a',
      color: '#cbd5e1',
      confirmButtonColor: '#4f46e5',
      customClass: { popup: 'border border-slate-800 rounded-2xl font-sans' }
    });
  };

  const getColabQuestions = (colabId: string) => {
    switch (colabId) {
      case 'colab-01':
        return [
          {
            text: 'Estou frustrado com os atrasos na aprovação do code review pelo time de QA, isso trava minhas entregas.',
            label: '💬 "Frustrado com atrasos de QA..."'
          },
          {
            text: 'Quero ter mais autonomia técnica para fazer deploys diretos sem passar por burocracias de outros times.',
            label: '💬 "Quero autonomia para deploy..."'
          },
          {
            text: 'Se eu não tiver uma perspectiva clara de promoção em curto prazo, terei que buscar outra oportunidade no mercado.',
            label: '💬 "Dúvida sobre promoção rápida..."'
          }
        ];
      case 'colab-03':
        return [
          {
            text: 'Detectei que 18% dos alarmes do SOC são alarmes falsos causados por scripts legados, precisamos consertar isso urgente.',
            label: '💬 "18% de alarmes falsos no SOC..."'
          },
          {
            text: 'Preciso de três sprints focadas em refactoring sem interrupções de reuniões de status diárias para corrigir os scripts.',
            label: '💬 "Preciso de sprints focadas..."'
          },
          {
            text: 'Sinto que o time de DevOps não segue os padrões lógicos e documentados de segurança que estabelecemos.',
            label: '💬 "Time ignora padrões de segurança..."'
          }
        ];
      case 'colab-04':
        return [
          {
            text: 'Gostaria de sugerir novas melhorias visuais de UI para o portal, mas sinto que o time técnico de backend não me dá abertura.',
            label: '💬 "Time de backend bloqueia ideias UI..."'
          },
          {
            text: 'Trabalhando 100% home office, às vezes me sinto isolada e com receio de postar minhas dúvidas no Slack e parecer tola.',
            label: '💬 "Isolamento no home office..."'
          },
          {
            text: 'Ainda tenho dificuldade em receber feedbacks diretos muito frios. Prefiro um alinhamento mais encorajador.',
            label: '💬 "Dificuldade com feedback frio..."'
          }
        ];
      case 'colab-02':
      default:
        return [
          {
            text: 'Estou me sentindo muito sobrecarregada com as constantes mudanças de prioridades nos cartões de front-end.',
            label: '💬 "Sobrecarga com mudanças de escopo..."'
          },
          {
            text: 'Tenho receio de sinalizar atrasos nas reuniões gerais e parecer incompetente, então trabalho calada até tarde.',
            label: '💬 "Medo de sinalizar atrasos..."'
          },
          {
            text: 'Gostaria de maior previsibilidade nas prioridades e um fluxo mais estável para evitar ansiedade.',
            label: '💬 "Preciso de previsibilidade..."'
          }
        ];
    }
  };

  // ==========================================
  // SECTION 6: EMAIL SIMULATOR & INTERACTIVE SIMULATOR FUNCTIONS
  // ==========================================
  const handleSimulateSendEmail = () => {
    if (!generatedScript || !currentUser) return;

    const emailId = `email-${Date.now()}`;
    const emailTo = activeColab.name.toLowerCase().replace(/\s+/g, '.').split('(')[0].trim() + '@clearit.com.br';
    const newEmail: SimulatedEmail = {
      id: emailId,
      to: emailTo,
      from: currentUser.email,
      subject: `Ata e Roteiro de Reunião 1:1 - ${activeColab.name}`,
      body: generatedScript,
      date: new Date().toISOString()
    };

    const currentEmails = JSON.parse(localStorage.getItem('synchr_emails') || '[]');
    currentEmails.unshift(newEmail);
    localStorage.setItem('synchr_emails', JSON.stringify(currentEmails));
    setSimulatedEmails(currentEmails);

    setLastSentEmail(newEmail);
    setShowEmailSuccess(true);
  };

  const handleStartSimulation = (colabId: string) => {
    setSimColabId(colabId);
    setSimPhase('abertura');
    setSimScore(0);
    setSimAnswersHistory([]);
    setSimIaFeedback('');
    setSimFeedbackConsolidated('');
  };

  const handleAnswerSimulation = (option: SimAnswerOption) => {
    const scenario = SIMULATOR_SCENARIOS[simColabId];
    const currentSpeech = scenario[simPhase as 'abertura' | 'desenvolvimento' | 'fechamento'].colabSpeech;
    
    const newScore = simScore + option.points;
    setSimScore(newScore);

    const historyItem = {
      phase: simPhase,
      question: currentSpeech,
      answer: option.text,
      points: option.points,
      feedback: option.feedback,
      discTrait: option.discTrait
    };

    setSimAnswersHistory(prev => [...prev, historyItem]);
    setSimIaFeedback(option.feedback);
  };

  const handleNextSimulationStep = () => {
    setSimIaFeedback('');
    if (simPhase === 'abertura') {
      setSimPhase('desenvolvimento');
    } else if (simPhase === 'desenvolvimento') {
      setSimPhase('fechamento');
    } else if (simPhase === 'fechamento') {
      setSimPhase('feedback');
    }
  };

  const handleSaveSimulationToHistory = () => {
    const scenario = SIMULATOR_SCENARIOS[simColabId];
    const percentage = Math.round((simScore / 30) * 100);

    const summaryScript = `### Resumo da Reunião Simulada (DISC)
**Colaborador:** ${scenario.name}
**Perfil DISC:** ${scenario.disc}
**Cargo:** ${scenario.role}
**Pontuação de Calibração do Líder:** ${simScore} / 30 pontos (${percentage}%)

---

` + simAnswersHistory.map(h => `#### Fase: ${h.phase.toUpperCase()}
- **Fala do Colaborador:** ${h.question}
- **Resposta do Líder:** ${h.answer}
- **Feedback da IA:** ${h.feedback}
- **Métrica DISC avaliada:** ${h.discTrait} (Mapeado: +${h.points} pontos)
`).join('\n');

    storage.saveOneOnOne({
      id: `sim-1on1-${Date.now()}`,
      collaboratorId: simColabId,
      collaboratorName: scenario.name,
      date: new Date().toISOString().split('T')[0],
      type: 'Simulada Interativa (DISC)',
      context: scenario.introText,
      scriptText: summaryScript,
      notes: `Simulação DISC concluída com aproveitamento de ${percentage}%.`
    });

    Swal.fire({
      title: 'Salvo com Sucesso!',
      text: 'Simulação de 1:1 e plano de ação salvos no seu Histórico de Reuniões com sucesso!',
      icon: 'success',
      background: '#0f172a',
      color: '#cbd5e1',
      confirmButtonColor: '#4f46e5',
      customClass: { popup: 'border border-slate-800 rounded-2xl font-sans' }
    });
    setSimPhase('intro');
  };

  return (
    <div className="flex min-h-screen relative z-10 font-sans overflow-x-hidden">
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Panel */}
      <aside className={`fixed inset-y-0 left-0 z-40 md:relative md:flex w-[280px] shrink-0 border-r border-slate-800/80 bg-slate-950/80 backdrop-blur-md p-6 flex flex-col gap-6 transition-transform duration-300 md:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        
        {/* Logo and Brand */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-cyan-400 flex items-center justify-center font-bold text-slate-100 text-lg font-title">
            S
          </div>
          <div>
            <h3 className="font-bold text-sm tracking-tight text-slate-100 font-title">SyncHR</h3>
            <p className="text-xs text-indigo-400 font-mono tracking-widest uppercase">Smart Leading</p>
          </div>
        </div>

        {/* Current Active Account Box */}
        {currentUser && (
          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/30 space-y-2">
            <div className="flex justify-between items-start">
              <div className="text-xs text-slate-500 font-mono uppercase tracking-wider">Conta Ativa</div>
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
              <p className="text-xs text-slate-500 truncate">{currentUser.email}</p>
            </div>
            
            <div className="pt-2 border-t border-slate-900 flex justify-between items-center text-xs">
              <span className="text-slate-400">Tipo:</span>
              <span className="bg-slate-800 text-indigo-300 px-1.5 py-0.5 rounded font-semibold uppercase">
                {currentUser.role}
              </span>
            </div>
          </div>
        )}

        {/* Mapped Leader Profile Badge */}
        {currentUser?.role === 'LEADER' && (
          <div className="p-3.5 rounded-xl border border-slate-800/80 bg-slate-900/40 space-y-1">
            <div className="text-xs text-slate-500 font-mono uppercase tracking-wider">Perfil Diagnóstico</div>
            {leaderProfile && leaderProfile.profile !== 'PENDENTE' ? (
              <>
                <div className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                  <span>{leaderProfile.profile === 'TECNICO' ? '🤖' : leaderProfile.profile === 'TRANSICAO' ? '🌱' : '🔥'}</span>
                  <span>Líder {leaderProfile.profile.toLowerCase()}</span>
                </div>
                <div className="text-xs text-slate-500">
                  {leaderProfile.levelFrom} → {leaderProfile.levelTo}
                </div>
              </>
            ) : (
              <div className="text-xs font-bold text-red-400 flex items-center gap-1.5 animate-pulse">
                <span>⚠️</span>
                <span>Não Configurado</span>
              </div>
            )}
          </div>
        )}

        {/* Menu Navigation */}
        <nav className="flex-1 flex flex-col gap-1.5 pt-2">
          
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
              <span>Onboarding / Teste</span>
            </button>
          )}

          {currentUser?.role === 'LEADER' && (
            <>
              <button
                onClick={() => handleSwitchSection('copiloto')}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-left text-xs font-semibold border transition-all ${
                  activeSection === 'copiloto'
                    ? 'bg-gradient-to-r from-indigo-900/40 to-indigo-900/10 border-indigo-700/50 text-indigo-200'
                    : 'bg-transparent border-transparent hover:bg-slate-900/40 text-slate-400 hover:text-slate-200'
                } ${(!leaderProfile || leaderProfile.profile === 'PENDENTE') ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>Copiloto de 1:1</span>
                </div>
                {(!leaderProfile || leaderProfile.profile === 'PENDENTE') && <Lock className="w-3.5 h-3.5 text-slate-500" />}
              </button>

              <button
                onClick={() => handleSwitchSection('escalation')}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-left text-xs font-semibold border transition-all ${
                  activeSection === 'escalation'
                    ? 'bg-gradient-to-r from-indigo-900/40 to-indigo-900/10 border-indigo-700/50 text-indigo-200'
                    : 'bg-transparent border-transparent hover:bg-slate-900/40 text-slate-400 hover:text-slate-200'
                } ${(!leaderProfile || leaderProfile.profile === 'PENDENTE') ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>Escalação de Conflito</span>
                </div>
                {(!leaderProfile || leaderProfile.profile === 'PENDENTE') && <Lock className="w-3.5 h-3.5 text-slate-500" />}
              </button>

              <button
                onClick={() => handleSwitchSection('simulador')}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-left text-xs font-semibold border transition-all ${
                  activeSection === 'simulador'
                    ? 'bg-gradient-to-r from-indigo-900/40 to-indigo-900/10 border-indigo-700/50 text-indigo-200'
                    : 'bg-transparent border-transparent hover:bg-slate-900/40 text-slate-400 hover:text-slate-200'
                } ${(!leaderProfile || leaderProfile.profile === 'PENDENTE') ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-4 h-4 shrink-0" />
                  <span>Simulador de 1:1</span>
                </div>
                {(!leaderProfile || leaderProfile.profile === 'PENDENTE') && <Lock className="w-3.5 h-3.5 text-slate-500" />}
              </button>
            </>
          )}

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
              <span>Painel do RH (Admin)</span>
            </button>
          )}


        </nav>

        <div className="mt-auto text-xs text-slate-600 font-mono text-center pt-4 border-t border-slate-900">
          SyncHR v0.1.0 · Clear IT
        </div>
      </aside>

      {/* Main Container Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Mobile Top Bar */}
        <header className="flex md:hidden items-center justify-between p-4 border-b border-slate-805 bg-slate-950/80 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-cyan-400 flex items-center justify-center font-bold text-slate-100 text-sm font-title">
              S
            </div>
            <span className="font-bold text-xs tracking-tight text-slate-100 font-title uppercase font-mono">SyncHR</span>
          </div>
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 border border-slate-800 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 transition-all focus:outline-none"
            title="Menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </header>

        <main className="flex-1 p-4 md:p-8 space-y-6 w-full max-w-[1600px] mx-auto">
        
        {/* Floating Locked Warn Banner */}
        {showWarning && (
          <div className="p-4 bg-red-950/40 border border-red-900/60 rounded-xl text-red-400 text-xs flex gap-3 items-center justify-between sticky top-0 z-50 animate-bounce">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-red-400 shrink-0" />
              <div>
                <strong>Acesso Restrito:</strong> É obrigatório responder ao Quiz de Onboarding para desbloquear o Copiloto e a Escalação.
              </div>
            </div>
            <button onClick={() => setShowWarning(false)} className="text-red-400 font-bold">&times;</button>
          </div>
        )}

        {/* RENDER ACTIVE SECTION */}

        {/* 1. ONBOARDING / QUIZ PERFIL */}
        {activeSection === 'onboarding' && (
          <section className="space-y-6 animate-fade-in">
            <header className="space-y-2">
              <span className="text-xs bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-850 font-mono">F-01</span>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight font-title text-slate-100">
                Onboarding & Perfil de Liderança
              </h1>
              <p className="text-slate-400 text-sm max-w-3xl">
                Responda às questões abaixo para que a inteligência artificial mapeie seu estilo de liderança. O tom de voz dos roteiros e o nível de profundidade dos feedbacks serão adaptados ao seu perfil.
              </p>
            </header>

            <div className="grid gap-6 md:grid-cols-12">
              
              {/* Quiz Card */}
              <div className="md:col-span-8 space-y-6">
                
                {quizQuestions.map((q) => (
                  <div key={q.id} className="glass-card p-6 rounded-2xl border border-slate-800 bg-slate-900/20 space-y-4">
                    <h3 className="text-sm font-semibold text-slate-200">{q.question}</h3>
                    <div className="grid gap-3">
                      {q.options.map((opt) => {
                        const isSelected = answers[q.id] === opt.key;
                        return (
                          <button
                            key={opt.key}
                            onClick={() => handleSelectAnswer(q.id, opt.key as 'A' | 'B' | 'C')}
                            className={`w-full p-4 rounded-xl text-left text-xs leading-relaxed border transition-all hover:bg-slate-900/60 ${
                              isSelected
                                ? 'bg-indigo-900/20 border-indigo-500 text-slate-200 shadow-md shadow-indigo-500/5'
                                : 'bg-slate-950/40 border-slate-800/80 text-slate-400'
                            }`}
                          >
                            <span className="font-bold text-indigo-400 mr-2">{opt.key})</span>
                            {opt.text}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Level selection and actions */}
                <div className="glass-card p-6 rounded-2xl border border-slate-800 bg-slate-900/20 space-y-6">
                  <h3 className="text-sm font-semibold text-slate-200">2. Mapeamento de Organigrama (L1-L4)</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-400 uppercase font-mono">Seu Cargo Atual</label>
                      <select 
                        value={levelFrom}
                        onChange={(e) => setLevelFrom(e.target.value)}
                        className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2 px-3 text-slate-300 text-xs focus:outline-none focus:border-indigo-500"
                      >
                        <option value="Colaborador L4">Colaborador Sênior (L4)</option>
                        <option value="Coordenador">Coordenador</option>
                        <option value="Gerente">Gerente</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-400 uppercase font-mono">Seu Próximo Cargo Alvo</label>
                      <select
                        value={levelTo}
                        onChange={(e) => setLevelTo(e.target.value)}
                        className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2 px-3 text-slate-300 text-xs focus:outline-none focus:border-indigo-500"
                      >
                        <option value="Coordenador">Coordenador</option>
                        <option value="Gerente">Gerente</option>
                        <option value="Diretor (C-Level)">Diretor (C-Level)</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-2 flex gap-4">
                    <button
                      onClick={handleSaveOnboarding}
                      disabled={!diagnosedProfile}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-xs font-bold text-slate-100 disabled:opacity-50 transition-all glow-btn"
                    >
                      Salvar e Desbloquear Plataforma
                    </button>
                    {leaderProfile && leaderProfile.profile !== 'PENDENTE' && (
                      <button
                        onClick={handleResetOnboarding}
                        className="px-6 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-850 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-all"
                      >
                        Resetar Perfil
                      </button>
                    )}
                  </div>
                </div>

              </div>

              {/* Diagnosis Sidebar Results */}
              <div className="md:col-span-4">
                <div className="glass-card p-6 rounded-2xl border border-slate-800 bg-slate-900/30 sticky top-8 space-y-4">
                  <span className="text-xs uppercase font-mono bg-cyan-950/50 text-cyan-400 border border-cyan-900/40 px-2 py-0.5 rounded">
                    Diagnóstico IA em Tempo Real
                  </span>
                  
                  {diagnosedProfile ? (
                    (() => {
                      const meta = getProfileMetadata(diagnosedProfile);
                      return (
                        <div className="space-y-4">
                          <div>
                            <h3 className="text-md font-bold text-slate-100">{meta.title}</h3>
                            <p className="text-xs text-slate-500 mt-1">
                              Foco: {levelFrom} ➔ {levelTo}
                            </p>
                          </div>
                          <p className="text-xs text-slate-400 leading-relaxed bg-slate-950/40 p-3 rounded-xl border border-slate-900">
                            {meta.desc}
                          </p>
                          <div className="p-3.5 rounded-xl border border-indigo-900/20 bg-indigo-950/10 text-xs text-indigo-300 leading-normal">
                            <strong>Tom de Roteiro Adaptado:</strong> A IA priorizará pragmatismo e instruções alinhadas com as dores de transição de nível corporativo da Clear IT.
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="py-8 text-center text-slate-500 text-xs space-y-2">
                      <p>Responda às 10 perguntas para carregar o mapeamento automatizado de liderança.</p>
                      <span className="inline-block animate-pulse text-indigo-400">⚡ Aguardando...</span>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </section>
        )}

        {/* 2. COPILOTO 1:1 (Antes da conversa e durante) */}
        {activeSection === 'copiloto' && (
          <section className="space-y-6 animate-fade-in">
            <header className="space-y-1">
              <span className="text-xs bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-850 font-mono">F-03</span>
              <h1 className="text-2xl font-extrabold tracking-tight font-title text-slate-100">
                Copiloto de Reuniões 1:1 & Feedbacks
              </h1>
              <p className="text-slate-400 text-xs">
                Prepare sua pauta de feedback em menos de 3 minutos e conte com o assistente inteligente durante a reunião.
              </p>
            </header>

            {/* Safety & Human-in-the-loop Banners */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl flex gap-3 text-xs text-slate-400 items-start">
                <span className="text-lg">🔒</span>
                <div>
                  <strong className="text-slate-300">Higienização e Proteção LGPD:</strong> O sistema remove nomes completos e dados pessoais sensíveis automaticamente (RN01/RN09).
                </div>
              </div>
              <div className="p-3.5 bg-amber-950/20 border border-amber-900/50 rounded-xl flex gap-3 text-xs text-amber-400 items-start">
                <Info className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-amber-300">Responsabilidade Humana (Human-in-the-loop):</strong> O Smart Leading é suporte consultivo. A tomada de decisões e feedbacks são de responsabilidade do líder. Evite jargões técnicos excessivos (RN02/RN07/RN08).
                </div>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-12">
              
              {/* Form Config Script */}
              <div className="md:col-span-5 space-y-4">
                <div className="glass-card p-5 rounded-2xl border border-slate-800/80 bg-slate-900/20 space-y-4">
                  <h3 className="text-sm font-semibold text-slate-200">1. Preparação da Reunião</h3>

                  {/* Select Colab */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400 uppercase font-mono">Selecionar Liderado</label>
                    <select
                      value={selectedColabId}
                      onChange={(e) => setSelectedColabId(e.target.value)}
                      className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2 px-3 text-slate-300 text-xs focus:outline-none focus:border-indigo-500"
                    >
                      {MOCK_COLLABORATORS.map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({c.role})</option>
                      ))}
                    </select>
                  </div>

                  {/* Active Colab details display */}
                  <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-900 text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Perfil DISC:</span>
                      <span className="font-semibold text-indigo-400">{activeColab.disc}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Nível Operacional:</span>
                      <span className="font-semibold text-slate-300">{activeColab.level}</span>
                    </div>
                  </div>

                  {/* Select Meeting Type */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400 uppercase font-mono">Tipo de Reunião</label>
                    <select
                      value={meetingType}
                      onChange={(e) => setMeetingType(e.target.value)}
                      className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2 px-3 text-slate-300 text-xs focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Quinzenal Rotineira">Quinzenal Rotineira</option>
                      <option value="Feedback de Baixa Performance">Feedback de Baixa Performance (Crítico)</option>
                      <option value="Carreira & PDI">Alinhamento de Carreira & PDI</option>
                    </select>
                  </div>

                  {/* Select Context */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400 uppercase font-mono">Contexto de Impedimento</label>
                    <textarea
                      value={impedimentContext}
                      onChange={(e) => setImpedimentContext(e.target.value)}
                      rows={3}
                      className="w-full bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-slate-300 text-xs focus:outline-none focus:border-indigo-500 font-sans"
                      placeholder="Descreva o contexto geral..."
                    />
                  </div>

                  <button
                    onClick={handleGenerateScript}
                    className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-slate-100 text-xs font-bold py-2.5 rounded-xl transition-all shadow-md hover:shadow-indigo-500/5 glow-btn"
                  >
                    Gerar Roteiro Personalizado
                  </button>
                </div>
              </div>

              {/* Roteiro Result Display */}
              <div className="md:col-span-7 space-y-6">
                {generatedScript ? (
                  <div className="glass-card p-5 rounded-2xl border border-slate-800 bg-slate-900/30 space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-slate-850">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                        <h3 className="text-sm font-bold text-slate-100">Roteiro Inteligente Calibrado</h3>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleCopyScript}
                          className="text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1.5 bg-slate-900/60 border border-slate-850 px-2.5 py-1 rounded-lg transition-all"
                        >
                          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copied ? 'Copiado!' : 'Copiar'}</span>
                        </button>
                        <button
                          onClick={handleSimulateSendEmail}
                          className="text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1.5 bg-slate-900/60 border border-slate-850 px-2.5 py-1 rounded-lg transition-all"
                        >
                          <Mail className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Simular Envio</span>
                        </button>
                      </div>
                    </div>

                    {showEmailSuccess && lastSentEmail && (
                      <div className="p-3 bg-emerald-950/30 border border-emerald-900/50 rounded-xl flex flex-col gap-2 animate-fade-in text-xs">
                        <div className="flex justify-between items-center text-emerald-400 font-semibold">
                          <div className="flex items-center gap-1.5">
                            <Check className="w-4 h-4" />
                            <span>E-mail Simulado Enviado!</span>
                          </div>
                          <button onClick={() => setShowEmailSuccess(false)} className="text-slate-400 hover:text-slate-200 font-bold">&times;</button>
                        </div>
                        <div className="text-xs text-slate-400 font-mono bg-slate-950/30 p-2.5 rounded-lg border border-slate-900 space-y-0.5">
                          <div><strong>De:</strong> {lastSentEmail.from}</div>
                          <div><strong>Para:</strong> {lastSentEmail.to}</div>
                          <div><strong>Assunto:</strong> {lastSentEmail.subject}</div>
                          <div className="mt-1.5 pt-1.5 border-t border-slate-900 text-slate-500 max-h-[85px] overflow-y-auto whitespace-pre-wrap">{lastSentEmail.body}</div>
                        </div>
                        <div className="text-[10px] text-slate-500 italic">
                          * Este envio é mockado e foi registrado no log de auditoria no Painel do RH.
                        </div>
                      </div>
                    )}

                    <div className="text-xs text-slate-300 leading-relaxed font-mono whitespace-pre-wrap max-h-[220px] overflow-y-auto bg-slate-950/30 p-4 rounded-xl border border-slate-900/40">
                      {generatedScript}
                    </div>

                    <div className="p-3 bg-indigo-950/15 border border-indigo-900/20 text-xs text-indigo-300 rounded-lg">
                      💡 <strong>Diretriz Human-in-the-loop:</strong> Adapte a comunicação do roteiro de acordo com a realidade. Use o roteiro como sugestão ética.
                    </div>
                  </div>
                ) : (
                  <div className="h-full min-h-[180px] rounded-2xl border border-dashed border-slate-800 flex flex-col items-center justify-center text-slate-500 text-xs space-y-2 p-6">
                    <Sparkles className="w-8 h-8 text-slate-600" />
                    <p>Preencha as configurações ao lado e clique em Gerar Roteiro.</p>
                  </div>
                )}

                {/* 2. Registro e Transcrição da Reunião */}
                <div className="glass-card p-5 rounded-2xl border border-slate-800 bg-slate-900/20 space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-200">2. Registro e Transcrição da Reunião (Durante/Após o Diálogo)</h3>
                    <p className="text-xs text-slate-500">Escreva o que o colaborador falou durante a reunião de 1:1 para realizar a avaliação de abordagem:</p>
                  </div>

                  {/* Predefined mock templates */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Falas Rápidas do Colaborador (Exemplos):</span>
                    <div className="grid md:grid-cols-3 gap-2">
                      {getColabQuestions(selectedColabId).map((q, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setTranscriptionText(q.text)}
                          className="p-2.5 text-xs text-left rounded-lg bg-slate-950/40 border border-slate-800/80 hover:bg-slate-900/60 text-slate-300 transition-all truncate"
                          title={q.text}
                        >
                          {q.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Transcription Input Field */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-xs font-semibold text-slate-400 uppercase font-mono block">Relato do Colaborador</label>
                    <textarea
                      value={transcriptionText}
                      onChange={(e) => setTranscriptionText(e.target.value)}
                      rows={4}
                      className="w-full bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-slate-300 text-xs focus:outline-none focus:border-indigo-500 font-sans"
                      placeholder="Descreva detalhadamente o que o colaborador falou..."
                    />
                  </div>

                  {/* LGPD Consent (Passo 5) */}
                  <div className="p-3.5 rounded-xl border border-indigo-950/40 bg-indigo-950/5 flex items-center justify-between text-xs gap-4 text-left">
                    <div className="space-y-0.5">
                      <span className="font-semibold block text-slate-300">Consentimento de Registro (LGPD Opt-in)</span>
                      <span className="text-[10px] text-slate-500 leading-relaxed">
                        Declaro que o colaborador deu opt-in inequívoco para o registro estruturado das notas da reunião.
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input 
                        type="checkbox" 
                        checked={lgpdConsent}
                        onChange={(e) => setLgpdConsent(e.target.checked)}
                        className="sr-only peer" 
                      />
                      <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600 font-sans"></div>
                    </label>
                  </div>

                  <button
                    onClick={handleEvaluateAndArchive}
                    disabled={isEvaluating}
                    className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-slate-100 text-xs font-bold py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 glow-btn disabled:opacity-55"
                  >
                    <span>{isEvaluating ? 'Processando Avaliação...' : 'Gerar Avaliação Pós-Reunião & Arquivar'}</span>
                    <Sparkles className="w-3.5 h-3.5" />
                  </button>

                  {/* Evaluation Result Display */}
                  {evaluationResult && (
                    <div className="p-4 bg-slate-950/80 border border-slate-850 rounded-xl space-y-3.5 animate-fade-in text-left">
                      <div className="flex justify-between items-center text-xs border-b border-slate-900 pb-2">
                        <div className="flex items-center gap-1.5 text-indigo-400 font-semibold font-title">
                          <Sparkles className="w-4 h-4 text-indigo-400" />
                          <span>Avaliação da IA Pós-Reunião (Feedback SBI & DISC)</span>
                        </div>
                        <span className="font-mono text-emerald-400 font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-850">
                          Calibração: {evaluationResult.score}/100
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs">
                        <div className="text-slate-500 font-mono uppercase text-[9px] tracking-wider">Tópicos Identificados:</div>
                        <div className="flex flex-wrap gap-1.5">
                          {evaluationResult.topics.map((t, idx) => (
                            <span key={idx} className="bg-indigo-950/40 text-indigo-300 border border-indigo-900/30 px-2 py-0.5 rounded text-[10px] font-semibold">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="text-xs text-slate-300 leading-relaxed space-y-1">
                        <div className="text-slate-500 font-mono uppercase text-[9px] tracking-wider">Análise da IA:</div>
                        <p>{evaluationResult.feedback}</p>
                      </div>

                      {/* Conflict Notification Alert */}
                      {evaluationResult.conflictWarning && (
                        <div className="p-3 bg-amber-950/20 border border-amber-900/50 rounded-lg text-amber-400 text-xs leading-normal flex gap-2">
                          <span className="text-base shrink-0">⚠️</span>
                          <div>
                            <strong>Alerta de Conflito Automático:</strong> {evaluationResult.conflictWarning}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                </div>

              </div>

            </div>
          </section>
        )}

        {/* SIMULADOR DE REUNIÃO 1:1 INTERATIVO (F-02 / F-04) */}
        {activeSection === 'simulador' && currentUser?.role === 'LEADER' && (
          <section className="space-y-6 animate-fade-in text-slate-100">
            <header className="space-y-1">
              <span className="text-xs bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-850 font-mono">F-02 / F-04</span>
              <h1 className="text-2xl font-extrabold tracking-tight font-title text-slate-100">
                Simulador Interativo de Reuniões 1:1 (Capacitação)
              </h1>
              <p className="text-slate-400 text-xs">
                Treine suas abordagens comportamentais DISC em tempo real com diálogos simulados e feedback imediato da IA da Clear IT.
              </p>
            </header>

            {/* Aviso Fixo de Responsabilidade */}
            <div className="p-3.5 bg-amber-950/20 border border-amber-900/50 rounded-xl flex gap-3 text-xs text-amber-400 items-start">
              <Info className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <strong className="text-amber-300">Aviso de Responsabilidade Humana (RN07/RN08):</strong> O simulador serve para capacitar a liderança com base na teoria DISC. A condução humana empática e a remoção de jargões técnicos excessivos nas 1:1s reais continuam sendo fundamentais.
              </div>
            </div>

            {simPhase === 'intro' ? (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-200">Escolha um liderado para iniciar o treinamento:</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {Object.values(SIMULATOR_SCENARIOS).map((scenario) => (
                    <div key={scenario.collaboratorId} className="glass-card p-5 rounded-2xl border border-slate-800 bg-slate-900/20 space-y-3 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-sm font-bold text-slate-100">{scenario.name}</h4>
                            <p className="text-xs text-slate-500 font-mono">{scenario.role}</p>
                          </div>
                          <span className={`px-2 py-0.5 text-xs font-bold rounded ${
                            scenario.disc === 'DOMINANTE' 
                              ? 'bg-red-950/50 text-red-400 border border-red-900/35' 
                              : scenario.disc === 'ESTAVEL' 
                              ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-900/35'
                              : scenario.disc === 'ANALITICO'
                              ? 'bg-blue-950/50 text-blue-400 border border-blue-900/35'
                              : 'bg-amber-950/50 text-amber-400 border border-amber-900/35'
                          }`}>
                            DISC: {scenario.disc}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed italic bg-slate-950/30 p-2.5 rounded-lg border border-slate-900/55">
                          "{scenario.introText}"
                        </p>
                      </div>
                      <button
                        onClick={() => handleStartSimulation(scenario.collaboratorId)}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-slate-100 text-xs font-bold py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 glow-btn"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Iniciar Treinamento</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : simPhase === 'feedback' ? (
              <div className="glass-card p-6 rounded-2xl border border-slate-800 bg-slate-900/30 text-center space-y-6 max-w-xl mx-auto animate-fade-in">
                <div className="space-y-2">
                  <span className="text-2xl">🏆</span>
                  <h3 className="text-lg font-bold text-slate-200">Simulação Concluída!</h3>
                  <p className="text-xs text-slate-400">Resultado final do alinhamento com {SIMULATOR_SCENARIOS[simColabId].name}</p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-950/40 border border-slate-900 inline-block">
                  <div className="text-3xl font-extrabold text-indigo-400">{simScore} <span className="text-sm text-slate-500">/ 30 pts</span></div>
                  <div className="text-xs text-slate-500 font-mono mt-1">Aproveitamento: {Math.round((simScore / 30) * 100)}%</div>
                </div>

                <div className="text-xs text-slate-300 bg-slate-900/40 p-4 rounded-xl border border-slate-850 leading-relaxed">
                  {simScore >= 25 ? (
                    <strong className="text-emerald-400 block mb-1">Excelente Liderança Calibrada!</strong>
                  ) : simScore >= 15 ? (
                    <strong className="text-amber-400 block mb-1">Bom desempenho, pontos de atenção!</strong>
                  ) : (
                    <strong className="text-red-400 block mb-1">Calibração Recomendada!</strong>
                  )}
                  {simScore >= 25 
                    ? "Você foi extremamente assertivo ao acolher as necessidades do colaborador de acordo com o seu perfil DISC, sem usar jargões excessivos e respeitando a governança da Clear IT."
                    : simScore >= 15
                    ? "Suas respostas foram adequadas, mas em alguns momentos você utilizou abordagens corporativas frias ou não atendeu perfeitamente ao perfil comportamental do liderado."
                    : "As escolhas foram rígidas, burocráticas ou desconsideraram o perfil comportamental do colaborador. Recomendamos ler o guia comportamental e refazer o teste."
                  }
                </div>

                <div className="flex gap-3 justify-center">
                  <button
                    onClick={handleSaveSimulationToHistory}
                    className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-xs font-bold text-slate-100 rounded-xl transition-all shadow-md glow-btn"
                  >
                    Gravar Ata no Histórico
                  </button>
                  <button
                    onClick={() => setSimPhase('intro')}
                    className="px-5 py-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-850 text-xs font-semibold text-slate-400 hover:text-slate-200 rounded-xl transition-all"
                  >
                    Voltar ao Início
                  </button>
                </div>
              </div>
            ) : (
              // Active simulator phases (abertura, desenvolvimento, fechamento)
              <div className="glass-card p-5 rounded-2xl border border-slate-800 bg-slate-900/30 space-y-6 max-w-2xl mx-auto animate-fade-in">
                
                {/* Simulator Progress Tracker */}
                <div className="flex justify-between items-center text-xs text-slate-500 font-mono border-b border-slate-900 pb-3">
                  <span>Fase: <strong className="text-indigo-400 uppercase">{simPhase}</strong></span>
                  <div className="flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${simPhase === 'abertura' ? 'bg-indigo-500' : 'bg-slate-800'}`} />
                    <span className={`w-2 h-2 rounded-full ${simPhase === 'desenvolvimento' ? 'bg-indigo-500' : 'bg-slate-800'}`} />
                    <span className={`w-2 h-2 rounded-full ${simPhase === 'fechamento' ? 'bg-indigo-500' : 'bg-slate-800'}`} />
                  </div>
                  <span>Pontuação Acumulada: <strong className="text-emerald-400">{simScore} pts</strong></span>
                </div>

                {/* Colab Chat Balloon */}
                <div className="flex gap-3 items-start mr-8">
                  <div className="w-9 h-9 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center font-bold text-slate-300 shrink-0 uppercase text-xs">
                    {SIMULATOR_SCENARIOS[simColabId].name.substring(0, 2)}
                  </div>
                  <div className="p-3.5 bg-slate-950/60 border border-slate-850 rounded-xl rounded-tl-none space-y-1">
                    <div className="text-xs text-indigo-400 font-semibold font-mono tracking-wide">
                      {SIMULATOR_SCENARIOS[simColabId].name} · Perfil {SIMULATOR_SCENARIOS[simColabId].disc}
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed font-sans">
                      {SIMULATOR_SCENARIOS[simColabId][simPhase as 'abertura' | 'desenvolvimento' | 'fechamento'].colabSpeech}
                    </p>
                  </div>
                </div>

                {/* Question choice or IA Feedback display */}
                {simIaFeedback === '' ? (
                  <div className="space-y-2.5 pt-2">
                    <div className="text-xs text-slate-500 font-semibold mb-1">Escolha a resposta do Líder:</div>
                    {SIMULATOR_SCENARIOS[simColabId][simPhase as 'abertura' | 'desenvolvimento' | 'fechamento'].options.map((opt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleAnswerSimulation(opt)}
                        className="w-full p-3 text-xs text-left rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-indigo-850 hover:bg-slate-900 text-slate-300 transition-all hover:text-slate-100 flex gap-2 items-start"
                      >
                        <span className="font-mono text-indigo-400 font-semibold">{idx + 1}.</span>
                        <span>{opt.text}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4 animate-fade-in">
                    {/* Selected response preview */}
                    <div className="flex gap-3 items-start justify-end ml-8">
                      <div className="p-3.5 bg-indigo-950/20 border border-indigo-900/30 rounded-xl rounded-tr-none text-xs text-indigo-200 leading-relaxed">
                        <div className="text-xs text-indigo-400 font-mono font-bold uppercase mb-0.5">Sua Resposta:</div>
                        {simAnswersHistory[simAnswersHistory.length - 1]?.answer}
                      </div>
                      <div className="w-9 h-9 rounded-full bg-indigo-950 border border-indigo-800 flex items-center justify-center font-bold text-slate-100 shrink-0 text-xs">
                        L
                      </div>
                    </div>

                    {/* IA Smart Leading Feedback Panel */}
                    <div className="p-4 bg-slate-950/80 border border-indigo-900/30 rounded-xl space-y-2.5">
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-1.5 text-indigo-400 font-semibold font-title">
                          <Sparkles className="w-4 h-4" />
                          <span>Avaliação de Calibração da IA</span>
                        </div>
                        <span className="font-mono text-slate-500 text-xs bg-slate-900 px-2 py-0.5 rounded border border-slate-850">
                          {simAnswersHistory[simAnswersHistory.length - 1]?.discTrait}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {simIaFeedback}
                      </p>
                      <div className="text-xs text-slate-500 font-mono flex justify-between items-center pt-2 border-t border-slate-900">
                        <span>Aproveitamento da resposta:</span>
                        <strong className="text-emerald-400">+{simAnswersHistory[simAnswersHistory.length - 1]?.points} / 10 pts</strong>
                      </div>
                    </div>

                    <button
                      onClick={handleNextSimulationStep}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-slate-100 text-xs font-bold py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 glow-btn"
                    >
                      <span>Avançar</span>
                      <Play className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* 3. ESCALAÇÃO DE CONFLITOS (F-05) */}
        {activeSection === 'escalation' && (
          <section className="space-y-6 animate-fade-in">
            <header className="space-y-1">
              <span className="text-xs bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-850 font-mono">F-05</span>
              <h1 className="text-2xl font-extrabold tracking-tight font-title text-slate-100">
                Abertura de Chamado / Escalação de Conflitos
              </h1>
              <p className="text-slate-400 text-xs">
                Acione a mediação do RH de TI para colaboradores que não apresentaram melhora mesmo após reuniões 1:1.
              </p>
            </header>

            <div className="grid gap-6 md:grid-cols-12">
              
              {/* Form Escalation */}
              <div className="md:col-span-8">
                <form onSubmit={handleSubmitEscalation} className="glass-card p-6 rounded-2xl border border-slate-800 bg-slate-900/20 space-y-5">
                  <h3 className="text-sm font-semibold text-slate-200">Formulário de Solicitação de Mediação</h3>

                  {/* Select Colab */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400 uppercase font-mono">Colaborador Envolvido</label>
                    <select
                      value={escColabId}
                      onChange={(e) => setEscColabId(e.target.value)}
                      className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2 px-3 text-slate-300 text-xs focus:outline-none focus:border-indigo-500"
                    >
                      {MOCK_COLLABORATORS.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Description */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400 uppercase font-mono">Fatos Ocorridos e Justificativa</label>
                    <textarea
                      value={escDesc}
                      onChange={(e) => setEscDesc(e.target.value)}
                      rows={5}
                      required
                      className="w-full bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-slate-300 text-xs focus:outline-none focus:border-indigo-500 font-sans"
                      placeholder="Descreva as ocorrências de conflito ou queda persistente de rendimento..."
                    />
                  </div>

                  {/* Mapped 1on1 status constraints (RN03) */}
                  <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-900/80 flex justify-between items-center text-xs">
                    <div className="space-y-0.5">
                      <span className="font-semibold block text-slate-200">Histórico de 1:1 nos últimos 45 dias detectado?</span>
                      <span className="text-xs text-slate-500">
                        {hasHistory 
                          ? "Sim, registros de conversa encontrados no banco de dados." 
                          : "Não foram encontrados registros para este colaborador."}
                      </span>
                    </div>
                    <div>
                      {hasHistory ? (
                        <span className="bg-emerald-950/50 text-emerald-400 border border-emerald-900/40 px-2 py-0.5 rounded text-xs font-bold">
                          Regular
                        </span>
                      ) : (
                        <span className="bg-red-950/50 text-red-400 border border-red-900/40 px-2 py-0.5 rounded text-xs font-bold">
                          Bloqueado
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Ethical Bypass (RN04) */}
                  <div className="p-4 rounded-xl border border-red-900/20 bg-red-950/5 flex items-center justify-between text-xs gap-4">
                    <div className="space-y-0.5">
                      <span className="font-semibold block text-red-400">Caso Grave de Assédio ou Ética? (Bypass Ético)</span>
                      <span className="text-xs text-slate-500 leading-normal">
                        Ativa o bypass ético que pula a validação de histórico de 1:1 nos últimos 45 dias caso a integridade do profissional esteja sob risco imediato.
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input 
                        type="checkbox" 
                        checked={isBypass}
                        onChange={(e) => setIsBypass(e.target.checked)}
                        className="sr-only peer" 
                      />
                      <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600"></div>
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-xs font-bold text-slate-100 transition-all glow-btn"
                  >
                    Enviar Solicitação de Mediação ao RH
                  </button>
                </form>
              </div>

              {/* Sidebar Info Rules */}
              <div className="md:col-span-4 space-y-4">
                <div className="glass-card p-5 rounded-2xl border border-slate-800 bg-slate-900/30 text-xs space-y-3">
                  <div className="flex gap-1.5 items-center font-bold text-slate-200">
                    <Info className="w-4 h-4 text-indigo-400" />
                    <span>Regras de Escalação</span>
                  </div>
                  <ul className="list-disc pl-4 space-y-2 text-slate-400 leading-relaxed">
                    <li><strong>Regra dos 45 dias (RN03):</strong> O sistema exige histórico recente de alinhamentos antes de envolver a equipe corporativa de RH.</li>
                    <li><strong>Bypass (RN04):</strong> Permite desvio automático de segurança apenas para denúncias e incidentes éticos.</li>
                  </ul>
                </div>
              </div>

            </div>
          </section>
        )}

        {/* 4. PAINEL DO RH (ADMIN - F-06) */}
        {activeSection === 'rh' && currentUser?.role === 'RH' && (
          <section className="space-y-6 animate-fade-in">
            <header className="space-y-1">
              <span className="text-xs bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-850 font-mono">F-06</span>
              <h1 className="text-2xl font-extrabold tracking-tight font-title text-slate-100">
                Painel Analítico do RH (Admin)
              </h1>
              <p className="text-slate-400 text-xs">
                Módulo restrito para Priscila Bacelar (RH). Edite os prompts da IA, gerencie conflitos abertos e exporte dados sob diretrizes da LGPD.
              </p>
            </header>

            {/* Executive Metrics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="glass-card p-4 rounded-2xl border border-slate-800 bg-slate-900/20 text-left">
                <span className="text-xs text-slate-500 font-mono">Taxa de Adesão</span>
                <div className="text-xl font-bold text-slate-100 mt-1">92.4%</div>
                <div className="text-[10px] text-emerald-400 mt-0.5">▲ +2.1% este mês</div>
              </div>
              <div className="glass-card p-4 rounded-2xl border border-slate-800 bg-slate-900/20 text-left">
                <span className="text-xs text-slate-500 font-mono">Volume 1:1s</span>
                <div className="text-xl font-bold text-slate-100 mt-1">
                  {storage.getOneOnOnes().length} Realizadas
                </div>
                <div className="text-[10px] text-indigo-400 mt-0.5">Persistido localmente</div>
              </div>
              <div className="glass-card p-4 rounded-2xl border border-slate-800 bg-slate-900/20 text-left">
                <span className="text-xs text-slate-500 font-mono">Conflitos Ativos</span>
                <div className="text-xl font-bold text-slate-100 mt-1">
                  {conflicts.filter(c => c.status === 'PENDING' || c.status === 'IN_INVESTIGATION').length} Pendentes
                </div>
                <div className="text-[10px] text-amber-400 mt-0.5">Aguardando RH</div>
              </div>
              <div className="glass-card p-4 rounded-2xl border border-slate-800 bg-slate-900/20 text-left">
                <span className="text-xs text-slate-500 font-mono">Índice eNPS</span>
                <div className="text-xl font-bold text-slate-100 mt-1">78 pts</div>
                <div className="text-[10px] text-emerald-400 mt-0.5">Zona de Excelência</div>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-12">
              
              {/* Conflicts List & Resolution */}
              <div className="md:col-span-8 space-y-6">
                
                <div className="glass-card p-5 rounded-2xl border border-slate-800 bg-slate-900/20 space-y-4">
                  <h3 className="text-sm font-bold text-slate-200">Chamados de Conflitos Escalas</h3>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-500 font-mono">
                          <th className="py-2.5 px-3">Protocolo</th>
                          <th className="py-2.5 px-3">Colaborador</th>
                          <th className="py-2.5 px-3">Data</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3 text-right">Ação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {conflicts.map(c => (
                          <tr key={c.id} className="border-b border-slate-850/60 hover:bg-slate-900/30 text-slate-300">
                            <td className="py-3 px-3 font-mono font-bold text-indigo-400">{c.protocol}</td>
                            <td className="py-3 px-3">{c.collaboratorName}</td>
                            <td className="py-3 px-3 text-slate-500 font-mono">{c.date}</td>
                            <td className="py-3 px-3">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                c.status === 'PENDING' 
                                  ? 'bg-amber-950 text-amber-400 border border-amber-900/40' 
                                  : c.status === 'IN_INVESTIGATION' 
                                  ? 'bg-cyan-950 text-cyan-400 border border-cyan-900/40' 
                                  : c.status === 'RESOLVED'
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/40'
                                  : 'bg-red-950 text-red-400 border border-red-900/40'
                              }`}>
                                {c.status === 'PENDING' 
                                  ? 'Pendente' 
                                  : c.status === 'IN_INVESTIGATION' 
                                  ? 'Em Mediação' 
                                  : c.status === 'RESOLVED'
                                  ? 'Resolvido'
                                  : 'Não Resolvido / Encaminhado'}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <button
                                onClick={() => handleSelectConflict(c)}
                                className="text-[10px] font-bold text-slate-400 hover:text-indigo-400 underline"
                              >
                                Mediar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Mediation Notes Form */}
                {selectedConflictId && (
                  (() => {
                    const activeConf = conflicts.find(c => c.id === selectedConflictId)!;
                    return (
                      <div className="glass-card p-5 rounded-2xl border border-slate-800 bg-slate-900/30 space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-xs font-bold text-slate-200">Mediação do Chamado {activeConf.protocol}</h4>
                            <p className="text-[10px] text-slate-500 mt-0.5">Liderado: {activeConf.collaboratorName}</p>
                          </div>
                          <button onClick={() => setSelectedConflictId(null)} className="text-slate-500 font-bold">&times;</button>
                        </div>

                        <div className="text-xs text-slate-400 bg-slate-950/40 p-3 rounded-lg border border-slate-900 max-h-[100px] overflow-y-auto">
                          <strong>Descrição do Líder:</strong> "{activeConf.description}"
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-slate-400 uppercase font-mono">Notas de Resolução / Mediação</label>
                          <textarea
                            value={mediationNotes}
                            onChange={(e) => setMediationNotes(e.target.value)}
                            rows={3}
                            className="w-full bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-slate-300 text-xs focus:outline-none focus:border-indigo-500"
                            placeholder="Escreva as notas da conversa com o líder..."
                          />
                        </div>

                        <div className="flex gap-2.5">
                          <button
                            onClick={() => handleUpdateConflictStatus(activeConf.id, 'IN_INVESTIGATION')}
                            className="px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-300 rounded-xl text-xs font-semibold"
                          >
                            Marcar Em Mediação
                          </button>
                          <button
                            onClick={() => handleUpdateConflictStatus(activeConf.id, 'RESOLVED')}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-100 rounded-xl text-xs font-semibold"
                          >
                            Resolver Conflito
                          </button>
                          <button
                            onClick={() => handleUpdateConflictStatus(activeConf.id, 'UNRESOLVED')}
                            className="px-4 py-2 bg-red-950/40 border border-red-900/60 hover:bg-red-900/20 text-red-400 rounded-xl text-xs font-semibold"
                          >
                            Não Resolvido / Encaminhar
                          </button>
                        </div>
                      </div>
                    );
                  })()
                )}

                {/* Simulated Emails Log (F-07) */}
                <div className="glass-card p-5 rounded-2xl border border-slate-800 bg-slate-900/20 space-y-4 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-850">
                    <h3 className="text-sm font-bold text-slate-200">Disparos de E-mails Simulados (Auditoria)</h3>
                    <span className="text-xs text-slate-500 font-mono">{simulatedEmails.length} disparos</span>
                  </div>
                  
                  {simulatedEmails.length === 0 ? (
                    <p className="text-xs text-slate-500 italic py-2 text-center">Nenhum e-mail simulado disparado até o momento.</p>
                  ) : (
                    <div className="space-y-4">
                      <div className="overflow-x-auto max-h-[180px] overflow-y-auto">
                        <table className="w-full text-xs text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-800 text-slate-500 font-mono">
                              <th className="py-2 px-3">Destinatário</th>
                              <th className="py-2 px-3">Assunto</th>
                              <th className="py-2 px-3 text-right">Ação</th>
                            </tr>
                          </thead>
                          <tbody>
                            {simulatedEmails.map((email) => (
                              <tr key={email.id} className="border-b border-slate-850/60 hover:bg-slate-900/30 text-slate-300">
                                <td className="py-2.5 px-3 truncate max-w-[140px]" title={email.to}>{email.to}</td>
                                <td className="py-2.5 px-3 truncate max-w-[180px]" title={email.subject}>{email.subject}</td>
                                <td className="py-2.5 px-3 text-right">
                                  <button
                                    onClick={() => setSelectedEmailId(selectedEmailId === email.id ? null : email.id)}
                                    className="text-[10px] font-bold text-slate-400 hover:text-indigo-400 underline"
                                  >
                                    {selectedEmailId === email.id ? 'Fechar' : 'Visualizar'}
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {selectedEmailId && (
                        (() => {
                          const activeEmail = simulatedEmails.find(e => e.id === selectedEmailId);
                          if (!activeEmail) return null;
                          return (
                            <div className="p-3.5 bg-slate-950/80 border border-slate-850 rounded-xl space-y-2 text-xs animate-fade-in">
                              <div className="flex justify-between items-center text-slate-400 border-b border-slate-900 pb-1.5 font-mono">
                                <span>Preview do E-mail Enviado</span>
                                <span className="text-[10px]">{new Date(activeEmail.date).toLocaleString()}</span>
                              </div>
                              <div className="space-y-0.5 font-mono text-[11px] text-slate-400">
                                <div><strong>De:</strong> {activeEmail.from}</div>
                                <div><strong>Para:</strong> {activeEmail.to}</div>
                                <div><strong>Assunto:</strong> {activeEmail.subject}</div>
                              </div>
                              <pre className="mt-2 text-xs text-slate-300 font-sans whitespace-pre-wrap max-h-[140px] overflow-y-auto bg-slate-900/40 p-3 rounded-lg border border-slate-900 leading-relaxed">
                                {activeEmail.body}
                              </pre>
                            </div>
                          );
                        })()
                      )}
                    </div>
                  )}
                </div>

                {/* Prompt Tuning Interface */}
                <div className="glass-card p-5 rounded-2xl border border-slate-800 bg-slate-900/20 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-850">
                    <h3 className="text-sm font-bold text-slate-200">Fine-Tuning de Prompts de Sistema (RH / Admin)</h3>
                    <button
                      onClick={handleSavePrompts}
                      className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-slate-100 text-xs font-semibold transition-all"
                    >
                      Salvar Tuning
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-slate-400 uppercase font-mono">System Prompt principal (Geração de Pautas)</label>
                      <textarea
                        value={mainPrompt}
                        onChange={(e) => setMainPrompt(e.target.value)}
                        rows={5}
                        className="w-full bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-slate-300 text-xs focus:outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-slate-400 uppercase font-mono">System Prompt da conversa em tempo real</label>
                      <textarea
                        value={realTimePrompt}
                        onChange={(e) => setRealTimePrompt(e.target.value)}
                        rows={4}
                        className="w-full bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-slate-300 text-xs focus:outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* LGPD Secure Export Simulator */}
              <div className="md:col-span-4">
                <div className="glass-card p-5 rounded-2xl border border-slate-800 bg-slate-900/30 space-y-4">
                  <div className="flex items-center gap-1.5 font-bold text-slate-200 text-xs">
                    <Sliders className="w-4 h-4 text-indigo-400" />
                    <span>Conformidade de Transmissão (LGPD)</span>
                  </div>
                  
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Antes de exportar qualquer dado de conflito para ferramentas externas de auditoria, execute o algoritmo de pseudonimização de nomes e encriptação AES-256-GCM.
                  </p>

                  <button
                    onClick={handleSimulateLgpdExport}
                    className="w-full bg-slate-900 border border-slate-850 hover:bg-slate-850 text-slate-300 text-xs font-semibold py-2 rounded-xl transition-all"
                  >
                    Simular Exportação Higienizada
                  </button>

                  {exportPayload && (
                    <div className="space-y-2">
                      <div className="text-[10px] font-mono text-slate-500">Payload Pseudonimizado (JSON):</div>
                      <pre className="text-[9px] font-mono text-slate-400 leading-normal p-3 rounded-lg bg-slate-950 border border-slate-900 max-h-[160px] overflow-y-auto whitespace-pre-wrap">
                        {exportPayload}
                      </pre>
                    </div>
                  )}
                </div>

                {/* Sincronização Corporativa (Clear IT DB) */}
                <div className="glass-card p-5 rounded-2xl border border-slate-800 bg-slate-900/30 space-y-4 mt-4">
                  <div className="flex items-center gap-1.5 font-bold text-slate-200 text-xs">
                    <Database className="w-4 h-4 text-indigo-400" />
                    <span>Sincronismo Corporativo (Clear IT DB)</span>
                  </div>
                  
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Sincronize as atas de reuniões 1:1 ativas do localStorage para o banco de dados interno homologado.
                  </p>

                  <button
                    onClick={handleSyncDatabase}
                    disabled={syncing}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-slate-100 text-xs font-semibold py-2 rounded-xl transition-all glow-btn"
                  >
                    {syncing ? 'Sincronizando...' : 'Enviar Dados para o Banco'}
                  </button>

                  {syncLogs.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-[10px] font-mono text-slate-500">Console de Transmissão:</div>
                      <div className="text-[9px] font-mono text-emerald-400 leading-normal p-3 rounded-lg bg-slate-950 border border-slate-900 max-h-[140px] overflow-y-auto space-y-1">
                        {syncLogs.map((log, index) => (
                          <div key={index}>{log}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

              </div>

            </div>
          </section>
        )}



        </main>
      </div>

    </div>
  );
}
