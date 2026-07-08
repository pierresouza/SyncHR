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
  LeaderProfile 
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
  UserCheck
} from 'lucide-react';

type SectionId = 'onboarding' | 'copiloto' | 'escalation' | 'rh' | 'historico';

export default function DashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [leaderProfile, setLeaderProfile] = useState<LeaderProfile | null>(null);
  const [activeSection, setActiveSection] = useState<SectionId>('onboarding');
  const [copied, setCopied] = useState(false);

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
    }
  ];

  const handleSelectAnswer = (qId: number, optionKey: 'A' | 'B' | 'C') => {
    const updated = { ...answers, [qId]: optionKey };
    setAnswers(updated);

    // Auto calculate diagnosed profile if all 3 questions answered
    if (Object.keys(updated).length === 3) {
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

    alert(`Onboarding concluído com sucesso!\n\nPerfil Identificado: ${
      diagnosedProfile === 'TECNICO' ? '🤖 Líder Técnico' : diagnosedProfile === 'TRANSICAO' ? '🌱 Líder em Transição' : '🔥 Líder Engajado'
    }\nPlataforma desbloqueada.`);

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

    // Save to storage history automatically
    storage.saveOneOnOne({
      id: `1on1-${Date.now()}`,
      collaboratorId: activeColab.id,
      collaboratorName: activeColab.name,
      date: new Date().toISOString().split('T')[0],
      type: meetingType,
      context: impedimentContext,
      scriptText: script
    });
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(generatedScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ==========================================
  // SECTION 3: COPILOTO LIVE STATE & LOGIC
  // ==========================================
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'colab' | 'ai' | 'sys', text: string }>>([
    { sender: 'sys', text: 'Simule o diálogo. Selecione uma fala rápida do colaborador na barra lateral para iniciar.' }
  ]);
  const [customInput, setCustomInput] = useState('');

  const sendChatMessage = (text: string) => {
    const updatedMessages = [
      ...chatMessages.filter(m => m.sender !== 'sys'),
      { sender: 'colab' as const, text }
    ];
    setChatMessages(updatedMessages);

    // Simulated AI response delay
    setTimeout(() => {
      let aiResponse = "";
      const profile = leaderProfile?.profile || 'TRANSICAO';

      if (text.includes("sobrecarregado")) {
        if (profile === 'TECNICO') {
          aiResponse = "Oriente o líder a revisar a distribuição de tarefas técnicas da sprint. Questione: 'Quais itens do backlog podemos repassar ou adiar?'";
        } else if (profile === 'ENGAJADO') {
          aiResponse = "Ação rápida recomendada: Faça um exercício de 2 minutos priorizando as top 3 entregas dele e limpe as distrações secundárias da agenda.";
        } else {
          aiResponse = "Foque na escuta ativa. Pergunte: 'Entendo perfeitamente. O que especificamente na carga atual está demandando mais de você? É um bloqueio técnico ou volume?'";
        }
      } else if (text.includes("PDI")) {
        aiResponse = "Conecte a tarefa atual a uma competência técnica L3/L4. Pergunte quais tecnologias do projeto ele quer dominar nas próximas sprints.";
      } else {
        aiResponse = "Valide o sentimento do colaborador (Regra 70/30). Pergunte o que causou essa percepção e combinem um registro transparente compartilhado das atas de 1:1 a partir de hoje.";
      }

      setChatMessages([...updatedMessages, { sender: 'ai' as const, text: aiResponse }]);
    }, 400);
  };

  const handleSendCustomMessage = () => {
    if (!customInput.trim()) return;
    sendChatMessage(customInput);
    setCustomInput('');
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
      alert("Por favor, descreva detalhadamente os fatos.");
      return;
    }

    // Business Rule check: RN03 (Rule of 45 days) or RN04 (Bypass)
    if (!hasHistory && !isBypass) {
      alert("Bloqueio de Regra de Negócio (RN03):\n\nNão foi detectado histórico de reuniões 1:1 com este colaborador nos últimos 45 dias.\n\nVocê precisa realizar pelo menos uma 1:1 de alinhamento antes de acionar o RH, ou selecionar o 'Bypass de Assédio/Ética' em casos graves.");
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
    alert(`Escalação enviada com sucesso!\n\nProtocolo gerado: ${protocolNum}\n\nO time de RH de TI (Priscila Bacelar) foi acionado e revisará o caso no painel analítico.`);
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
    storage.updateConflictStatus(id, newStatus, mediationNotes);
    setConflicts(storage.getConflicts());
    setSelectedConflictId(null);
    setMediationNotes('');
    alert("Chamado atualizado com sucesso no banco mockado local!");
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
    alert("Prompts de Sistema atualizados com sucesso para todas as gerações de IA da plataforma!");
  };

  return (
    <div className="flex min-h-screen relative z-10 font-sans">
      
      {/* Sidebar Panel */}
      <aside className="w-[280px] shrink-0 border-r border-slate-800/80 bg-slate-950/80 backdrop-blur-md p-6 flex flex-col gap-6">
        
        {/* Logo and Brand */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-cyan-400 flex items-center justify-center font-bold text-slate-100 text-lg font-title">
            S
          </div>
          <div>
            <h3 className="font-bold text-sm tracking-tight text-slate-100 font-title">SyncHR</h3>
            <p className="text-[10px] text-indigo-400 font-mono tracking-widest uppercase">Smart Leading</p>
          </div>
        </div>

        {/* Current Active Account Box */}
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
              <p className="text-[10px] text-slate-500 truncate">{currentUser.email}</p>
            </div>
            
            <div className="pt-2 border-t border-slate-900 flex justify-between items-center text-[10px]">
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
            <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Perfil Diagnóstico</div>
            {leaderProfile && leaderProfile.profile !== 'PENDENTE' ? (
              <>
                <div className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                  <span>{leaderProfile.profile === 'TECNICO' ? '🤖' : leaderProfile.profile === 'TRANSICAO' ? '🌱' : '🔥'}</span>
                  <span>Líder {leaderProfile.profile.toLowerCase()}</span>
                </div>
                <div className="text-[9px] text-slate-500">
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

        <div className="mt-auto text-[10px] text-slate-600 font-mono text-center pt-4 border-t border-slate-900">
          SyncHR v0.1.0 · Clear IT
        </div>
      </aside>

      {/* Main Container Content */}
      <main className="flex-1 p-8 overflow-y-auto space-y-6">
        
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
                      <label className="text-[11px] font-semibold text-slate-400 uppercase font-mono">Seu Cargo Atual</label>
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
                      <label className="text-[11px] font-semibold text-slate-400 uppercase font-mono">Seu Próximo Cargo Alvo</label>
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
                  <span className="text-[10px] uppercase font-mono bg-cyan-950/50 text-cyan-400 border border-cyan-900/40 px-2 py-0.5 rounded">
                    Diagnóstico IA em Tempo Real
                  </span>
                  
                  {diagnosedProfile ? (
                    (() => {
                      const meta = getProfileMetadata(diagnosedProfile);
                      return (
                        <div className="space-y-4">
                          <div>
                            <h3 className="text-md font-bold text-slate-100">{meta.title}</h3>
                            <p className="text-[11px] text-slate-500 mt-1">
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
                      <p>Responda às 3 perguntas para carregar o mapeamento automatizado de liderança.</p>
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

            {/* Safety LGPD Banner */}
            <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl flex gap-3 text-xs text-slate-400 items-start">
              <span className="text-lg">🔒</span>
              <div>
                <strong className="text-slate-300">Higienização e Proteção LGPD:</strong> O sistema remove nomes completos e dados pessoais sensíveis automaticamente. Mantenha os perfis comportamentais em formato de referências corporativas (ex: L1-L4).
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-12">
              
              {/* Form Config Script */}
              <div className="md:col-span-5 space-y-4">
                <div className="glass-card p-5 rounded-2xl border border-slate-800/80 bg-slate-900/20 space-y-4">
                  <h3 className="text-sm font-semibold text-slate-200">1. Preparação da Reunião</h3>

                  {/* Select Colab */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-400 uppercase font-mono">Selecionar Liderado</label>
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
                    <label className="text-[10px] font-semibold text-slate-400 uppercase font-mono">Tipo de Reunião</label>
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
                    <label className="text-[10px] font-semibold text-slate-400 uppercase font-mono">Contexto de Impedimento</label>
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
                      <button
                        onClick={handleCopyScript}
                        className="text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1.5 bg-slate-900/60 border border-slate-850 px-2.5 py-1 rounded-lg transition-all"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? 'Copiado!' : 'Copiar'}</span>
                      </button>
                    </div>

                    <div className="text-xs text-slate-300 leading-relaxed font-mono whitespace-pre-wrap max-h-[220px] overflow-y-auto bg-slate-950/30 p-4 rounded-xl border border-slate-900/40">
                      {generatedScript}
                    </div>

                    <div className="p-3 bg-indigo-950/15 border border-indigo-900/20 text-[10px] text-indigo-300 rounded-lg">
                      💡 <strong>Diretriz Human-in-the-loop:</strong> Adapte a comunicação do roteiro de acordo com a realidade. Use o roteiro como sugestão ética.
                    </div>
                  </div>
                ) : (
                  <div className="h-full min-h-[180px] rounded-2xl border border-dashed border-slate-800 flex flex-col items-center justify-center text-slate-500 text-xs space-y-2 p-6">
                    <Sparkles className="w-8 h-8 text-slate-600" />
                    <p>Preencha as configurações ao lado e clique em Gerar Roteiro.</p>
                  </div>
                )}

                {/* Simulated Real Time Chat */}
                <div className="glass-card p-5 rounded-2xl border border-slate-800 bg-slate-900/20 space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-200">2. Assistente em Tempo Real (Durante o Diálogo)</h3>
                    <p className="text-[11px] text-slate-500">Selecione uma resposta rápida abaixo do colaborador para receber orientações instantâneas de abordagem:</p>
                  </div>

                  <div className="grid md:grid-cols-3 gap-2">
                    <button
                      onClick={() => sendChatMessage("Estou me sentindo muito sobrecarregado com as tarefas do projeto e não consigo entregar nos prazos.")}
                      className="p-2.5 text-[10px] text-left rounded-lg bg-slate-950/40 border border-slate-800/80 hover:bg-slate-900/60 text-slate-300 transition-all truncate"
                    >
                      💬 "Estou muito sobrecarregado..."
                    </button>
                    <button
                      onClick={() => sendChatMessage("Sinto que meu trabalho técnico é bom, mas não vejo para onde crescer na Clear IT ou qual o meu PDI.")}
                      className="p-2.5 text-[10px] text-left rounded-lg bg-slate-950/40 border border-slate-800/80 hover:bg-slate-900/60 text-slate-300 transition-all truncate"
                    >
                      💬 "Não vejo meu PDI / Carreira..."
                    </button>
                    <button
                      onClick={() => sendChatMessage("Acho que meu gestor anterior não registrava nossos combinados, por isso perdi a confiança no feedback.")}
                      className="p-2.5 text-[10px] text-left rounded-lg bg-slate-950/40 border border-slate-800/80 hover:bg-slate-900/60 text-slate-300 transition-all truncate"
                    >
                      💬 "Perdi a confiança no feedback..."
                    </button>
                  </div>

                  {/* Chat logs */}
                  <div className="border border-slate-850 rounded-xl overflow-hidden bg-slate-950/40">
                    <div className="h-[140px] overflow-y-auto p-4 space-y-3">
                      {chatMessages.map((msg, i) => (
                        <div
                          key={i}
                          className={`p-2.5 rounded-lg text-xs leading-normal max-w-[85%] ${
                            msg.sender === 'colab'
                              ? 'bg-slate-900 border border-slate-850 text-slate-200 mr-auto'
                              : msg.sender === 'ai'
                              ? 'bg-indigo-950/20 border border-indigo-900/40 text-indigo-300 ml-auto'
                              : 'bg-amber-950/10 border border-amber-900/20 text-amber-400 text-center mx-auto max-w-full font-mono text-[10px]'
                          }`}
                        >
                          {msg.sender === 'ai' && <div className="text-[9px] font-bold text-indigo-400 mb-0.5 font-title">Smart Leading Assist:</div>}
                          {msg.text}
                        </div>
                      ))}
                    </div>

                    <div className="p-2 border-t border-slate-900 flex gap-2">
                      <input
                        type="text"
                        value={customInput}
                        onChange={(e) => setCustomInput(e.target.value)}
                        placeholder="Simule uma resposta customizada do colaborador..."
                        className="flex-1 bg-slate-900/50 border border-slate-800 rounded-lg py-1 px-3 text-slate-300 text-xs focus:outline-none focus:border-indigo-500"
                        onKeyDown={(e) => e.key === 'Enter' && handleSendCustomMessage()}
                      />
                      <button
                        onClick={handleSendCustomMessage}
                        className="bg-indigo-600 hover:bg-indigo-500 text-slate-100 px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
                      >
                        <Send className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                </div>

              </div>

            </div>
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
                    <label className="text-[10px] font-semibold text-slate-400 uppercase font-mono">Colaborador Envolvido</label>
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
                    <label className="text-[10px] font-semibold text-slate-400 uppercase font-mono">Fatos Ocorridos e Justificativa</label>
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
                      <span className="text-[10px] text-slate-500">
                        {hasHistory 
                          ? "Sim, registros de conversa encontrados no banco de dados." 
                          : "Não foram encontrados registros para este colaborador."}
                      </span>
                    </div>
                    <div>
                      {hasHistory ? (
                        <span className="bg-emerald-950/50 text-emerald-400 border border-emerald-900/40 px-2 py-0.5 rounded text-[10px] font-bold">
                          Regular
                        </span>
                      ) : (
                        <span className="bg-red-950/50 text-red-400 border border-red-900/40 px-2 py-0.5 rounded text-[10px] font-bold">
                          Bloqueado
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Ethical Bypass (RN04) */}
                  <div className="p-4 rounded-xl border border-red-900/20 bg-red-950/5 flex items-center justify-between text-xs gap-4">
                    <div className="space-y-0.5">
                      <span className="font-semibold block text-red-400">Caso Grave de Assédio ou Ética? (Bypass Ético)</span>
                      <span className="text-[10px] text-slate-500 leading-normal">
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
                                  : 'bg-emerald-950 text-emerald-400 border border-emerald-900/40'
                              }`}>
                                {c.status === 'PENDING' ? 'Pendente' : c.status === 'IN_INVESTIGATION' ? 'Em Mediação' : 'Resolvido'}
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
                        </div>
                      </div>
                    );
                  })()
                )}

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
              </div>

            </div>
          </section>
        )}



      </main>

    </div>
  );
}
