import {
  UserSession,
  LeaderProfile,
  Collaborator,
  OneOnOne,
  ConflictEscalation,
  SystemPrompts,
  UserRecord
} from '@/types';

// Mock credentials mapping
export const MOCK_USERS = [
  { email: 'rh.priscila@clearit.com.br', password: 'rh123456', name: 'Priscila Bacelar (RH)', role: 'RH', profile: 'ADMINISTRADOR' },
  { email: 'lider.teste@clearit.com.br', password: 'leader123456', name: 'Líder Teste (Onboarding)', role: 'LEADER', profile: 'PENDENTE' },
  { email: 'liderado.teste@clearit.com.br', password: 'colab123456', name: 'Liderado Teste (Onboarding)', role: 'COLLABORATOR', profile: 'PENDENTE' }
] as const;

export const DEFAULT_PROMPTS: SystemPrompts = {
  mainPrompt: `Você é o copiloto de IA Smart Leading. Sua missão é auxiliar líderes a conduzir reuniões de 1:1 produtivas e empáticas.
Ajuste seu tom com base no perfil do líder:
- TECNICO: Respostas extremamente diretas, sem jargões corporativos ("calibração de competências", "transversalidade"), focando em entregas e pontos de bloqueio técnicos.
- TRANSICAO: Forneça roteiros detalhados passo a passo, incluindo orientações de inteligência emocional e a metodologia de feedback SBI (Situação, Comportamento, Impacto).
- ENGAJADO: Foco em resumos e tópicos acionáveis imediatos para otimizar a preparação em menos de 3 minutos.`,
  realTimePrompt: `Com base na resposta imediata dada pelo colaborador, forneça ao líder de 2 a 3 opções de perguntas de aprofundamento ou ações imediatas.
Ajuste seu tom com base no perfil do líder. A linguagem deve ser empática, focada em resultados e incentivar a escuta ativa do líder (regra 70/30: colaborador fala 70% do tempo).`
};

export const MOCK_COLLABORATORS: Collaborator[] = [
  { id: 'colab-test', name: 'Liderado Teste (Onboarding)', email: 'liderado.teste@clearit.com.br', disc: 'PENDENTE', level: 'L2', role: 'Tester de Onboarding', leaderId: 'a0e8d1a1-1234-4321-abcd-000000000003' }
];

export const MOCK_ONE_ON_ONES = (collaborators: Collaborator[]): OneOnOne[] => [
  {
    id: '1on1-mock-1',
    collaboratorId: 'colab-02',
    collaboratorName: 'Mariana Souza (L2)',
    date: '2026-06-15',
    type: 'Quinzenal Rotineira',
    context: 'Atrasos frequentes nas últimas duas sprints e pouca comunicação.',
    scriptText: '### Roteiro Recomendado\n\n1. Pergunta Quebra-Gelo\n2. Alinhamento de Entregas\n3. Metas de Melhoria',
    rawLeaderNotes: 'Mariana relatou cansaço mental devido à sobrecarga de tarefas e falta de clareza nas prioridades da squad.',
    rawCollaboratorNotes: 'Concordo com os pontos. A divisão de tarefas ficou muito pesada após a saída do dev sênior da squad.',
    transcription: 'Líder: Como estão as coisas, Mariana? Notei atrasos.\nColaborador: Estou exausta, a squad está sem sênior e acumulei tarefas.',
    finalSummary: 'Reunião focada em discutir a sobrecarga de Mariana devido à vacância técnica na squad. Alinhado redução temporária de escopo até a contratação de novo suporte.',
    leaderApproved: true,
    collaboratorApproved: true,
    consistencyResult: {
      consistent: true,
      confidenceScore: 95,
      details: 'Ambas as partes concordam sobre a sobrecarga devido à falta de profissional sênior.'
    }
  },
  {
    id: '1on1-mock-2',
    collaboratorId: 'colab-01',
    collaboratorName: 'Carlos Santos (L3)',
    date: '2026-07-10',
    type: 'Alinhamento Técnico',
    context: 'Gargalos no fluxo de homologação e code review da squad de APIs.',
    scriptText: '### Roteiro Recomendado\n\n1. Discussão de gargalos\n2. Autonomia de deploys\n3. Métricas de qualidade',
    rawLeaderNotes: 'Carlos demonstra irritação com o fluxo de QA corporativo. Exige autonomia total para pular revisões.',
    rawCollaboratorNotes: 'A revisão de código atual é muito lenta. Atraso meu trabalho por burocracia desnecessária.',
    transcription: 'Líder: Carlos, precisamos falar sobre o deploy.\nColaborador: É lento demais, quero autonomia total.',
    finalSummary: 'Alinhamento sobre processos de code review. Líder reforçou limites de governança mas acordou em levar a discussão à retrospectiva para acelerar o fluxo do QA.',
    leaderApproved: true,
    collaboratorApproved: false
  },
  {
    id: '1on1-mock-3',
    collaboratorId: 'colab-05',
    collaboratorName: 'Rodrigo Costa (L3)',
    date: '2026-07-08',
    type: 'Acompanhamento de PDI',
    context: 'Revisão do PDI focado em automação de testes com Selenium.',
    scriptText: '### Pauta de PDI\n\n1. Progresso dos estudos\n2. Aplicação prática no projeto\n3. Próximos objetivos',
    rawLeaderNotes: 'Rodrigo avançou 70% no curso. Já iniciou scripts de teste no repositório piloto.',
    rawCollaboratorNotes: 'Muito feliz com a oportunidade. Estou conseguindo aplicar os conceitos em tempo real.',
    transcription: 'Líder: Como vai o PDI?\nColaborador: Ótimo, já automatizei 5 fluxos críticos.',
    finalSummary: 'Sessão focada na evolução do PDI de automação de Rodrigo. Progresso excelente comprovado com entrega prática no repositório piloto. Próxima meta: automação de APIs.',
    leaderApproved: true,
    collaboratorApproved: true,
    consistencyResult: {
      consistent: true,
      confidenceScore: 100,
      details: 'Alinhamento perfeito sobre o sucesso do PDI.'
    }
  }
];

export const MOCK_CONFLICTS: ConflictEscalation[] = [
  {
    id: 'conf-mock-1',
    protocol: 'SHR-2026-882710',
    collaboratorId: 'colab-02',
    collaboratorName: 'Mariana Souza (L2)',
    description: 'Colaborador Mariana Souza apresenta sintomas severos de burnout e insatisfação com a sobrecarga de tarefas após saída do sênior. Caso escalado após duas conversas de 1:1 sem resolução prática.',
    date: '2026-07-15',
    status: 'PENDING',
    hasHistory: true,
    isBypass: false
  },
  {
    id: 'conf-mock-2',
    protocol: 'SHR-2026-993812',
    collaboratorId: 'colab-05',
    collaboratorName: 'Rodrigo Costa (L3)',
    description: 'Rodrigo Costa solicitou bypass direto devido a atrito severo de comunicação técnica com a coordenação de QA. Bypass acionado diretamente para RH.',
    date: '2026-07-14',
    status: 'IN_INVESTIGATION',
    notes: 'Iniciada mediação de prazos com o gestor',
    hasHistory: false,
    isBypass: true
  }
];

// Helper wrapper functions
export const storage = {
  isBrowser(): boolean {
    return typeof window !== 'undefined';
  },

  initialize(): void {
    if (!this.isBrowser()) return;

    // Verificar se colaboradores estão ausentes ou sem e-mail (mock desatualizado no navegador)
    const storedColabs = localStorage.getItem('synchr_collaborators');
    let forceColabs = false;
    if (storedColabs) {
      try {
        const parsed = JSON.parse(storedColabs);
        if (Array.isArray(parsed) && (parsed.length === 0 || parsed.some(c => !c.email))) {
          forceColabs = true;
        }
      } catch (e) {
        forceColabs = true;
      }
    } else {
      forceColabs = true;
    }

    if (forceColabs) {
      localStorage.setItem('synchr_collaborators', JSON.stringify(MOCK_COLLABORATORS));
    }

    // Verificar se os usuários de teste estão ausentes ou desatualizados
    const storedUsers = localStorage.getItem('synchr_users');
    let forceUsers = false;
    if (storedUsers) {
      try {
        const parsed = JSON.parse(storedUsers);
        if (Array.isArray(parsed) && parsed.length < MOCK_USERS.length) {
          forceUsers = true;
        }
      } catch (e) {
        forceUsers = true;
      }
    } else {
      forceUsers = true;
    }

    if (forceUsers) {
      localStorage.setItem('synchr_users', JSON.stringify(MOCK_USERS));
    }

    if (!localStorage.getItem('synchr_one_on_ones') || forceColabs) {
      localStorage.setItem('synchr_one_on_ones', JSON.stringify(MOCK_ONE_ON_ONES(MOCK_COLLABORATORS)));
    }
    if (!localStorage.getItem('synchr_conflicts') || forceColabs) {
      localStorage.setItem('synchr_conflicts', JSON.stringify(MOCK_CONFLICTS));
    }
    if (!localStorage.getItem('synchr_prompts')) {
      localStorage.setItem('synchr_prompts', JSON.stringify(DEFAULT_PROMPTS));
    }
  },

  getUsers(): UserRecord[] {
    if (!this.isBrowser()) return Array.from(MOCK_USERS);
    this.initialize();
    const raw = localStorage.getItem('synchr_users');
    return raw ? JSON.parse(raw) : Array.from(MOCK_USERS);
  },

  saveUser(user: UserRecord): boolean {
    if (!this.isBrowser()) return false;
    const users = this.getUsers();
    const exists = users.some(u => u.email.toLowerCase() === user.email.toLowerCase());
    if (exists) return false;
    users.push(user);
    localStorage.setItem('synchr_users', JSON.stringify(users));
    return true;
  },

  getCurrentUser(): UserSession | null {
    if (!this.isBrowser()) return null;
    const raw = localStorage.getItem('synchr_user');
    return raw ? JSON.parse(raw) : null;
  },

  setCurrentUser(user: UserSession | null): void {
    if (!this.isBrowser()) return;
    if (user) {
      localStorage.setItem('synchr_user', JSON.stringify(user));

      // Seed leader profile automatically for pre-defined mock accounts
      if (user.role === 'LEADER' && user.profile !== 'PENDENTE') {
        const existingProfile = this.getLeaderProfile();
        if (!existingProfile || existingProfile.email !== user.email) {
          this.setLeaderProfile({
            id: user.id || '1',
            email: user.email,
            name: user.name,
            profile: user.profile,
            levelFrom: 'Coordenador',
            levelTo: 'Gerente'
          });
        }
      } else if (user.role === 'LEADER' && user.profile === 'PENDENTE') {
        const existingProfile = this.getLeaderProfile();
        if (!existingProfile || existingProfile.email !== user.email) {
          this.setLeaderProfile({
            id: user.id || '1',
            email: user.email,
            name: user.name,
            profile: 'PENDENTE',
            levelFrom: 'Coordenador',
            levelTo: 'Gerente'
          });
        }
      }
    } else {
      localStorage.removeItem('synchr_user');
    }
  },

  getLeaderProfile(): LeaderProfile | null {
    if (!this.isBrowser()) return null;
    const raw = localStorage.getItem('synchr_leader_profile');
    return raw ? JSON.parse(raw) : null;
  },

  setLeaderProfile(profile: LeaderProfile | null): void {
    if (!this.isBrowser()) return;
    if (profile) {
      localStorage.setItem('synchr_leader_profile', JSON.stringify(profile));
      // Update session if it matches
      const user = this.getCurrentUser();
      if (user && user.email === profile.email) {
        user.profile = profile.profile;
        localStorage.setItem('synchr_user', JSON.stringify(user));
      }
    } else {
      localStorage.removeItem('synchr_leader_profile');
    }
  },

  getCollaborators(): Collaborator[] {
    if (!this.isBrowser()) return [];
    this.initialize();
    const raw = localStorage.getItem('synchr_collaborators');
    return raw ? JSON.parse(raw) : [];
  },

  saveCollaborator(collaborator: Collaborator): void {
    if (!this.isBrowser()) return;
    const collaborators = this.getCollaborators();
    const index = collaborators.findIndex(c => c.email?.toLowerCase() === collaborator.email?.toLowerCase() || c.id === collaborator.id);
    if (index !== -1) {
      collaborators[index] = collaborator;
    } else {
      collaborators.push(collaborator);
    }
    localStorage.setItem('synchr_collaborators', JSON.stringify(collaborators));
  },

  getOneOnOnes(): OneOnOne[] {
    if (!this.isBrowser()) return [];
    this.initialize();
    const raw = localStorage.getItem('synchr_one_on_ones');
    return raw ? JSON.parse(raw) : [];
  },

  saveOneOnOne(record: OneOnOne): void {
    if (!this.isBrowser()) return;
    const records = this.getOneOnOnes();
    records.unshift(record);
    localStorage.setItem('synchr_one_on_ones', JSON.stringify(records));
  },

  getConflicts(): ConflictEscalation[] {
    if (!this.isBrowser()) return [];
    this.initialize();
    const raw = localStorage.getItem('synchr_conflicts');
    return raw ? JSON.parse(raw) : [];
  },

  saveConflict(conflict: ConflictEscalation): void {
    if (!this.isBrowser()) return;
    const conflicts = this.getConflicts();
    conflicts.unshift(conflict);
    localStorage.setItem('synchr_conflicts', JSON.stringify(conflicts));
  },

  updateConflictStatus(id: string, status: ConflictEscalation['status'], notes?: string): void {
    if (!this.isBrowser()) return;
    const conflicts = this.getConflicts();
    const index = conflicts.findIndex(c => c.id === id);
    if (index !== -1) {
      conflicts[index].status = status;
      if (notes !== undefined) {
        conflicts[index].notes = notes;
      }
      localStorage.setItem('synchr_conflicts', JSON.stringify(conflicts));
    }
  },

  getPrompts(): SystemPrompts {
    if (!this.isBrowser()) return DEFAULT_PROMPTS;
    this.initialize();
    const raw = localStorage.getItem('synchr_prompts');
    return raw ? JSON.parse(raw) : DEFAULT_PROMPTS;
  },

  savePrompts(prompts: SystemPrompts): void {
    if (!this.isBrowser()) return;
    localStorage.setItem('synchr_prompts', JSON.stringify(prompts));
  }
};
