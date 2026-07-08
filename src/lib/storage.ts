import { 
  UserSession, 
  LeaderProfile, 
  Collaborator, 
  OneOnOne, 
  ConflictEscalation, 
  SystemPrompts 
} from '@/types';

// Mock credentials mapping
export const MOCK_USERS = [
  { email: 'lider.tech@clearit.com.br', password: 'tech123', name: 'Gestor Principal (Tech)', role: 'LEADER', profile: 'TECNICO' },
  { email: 'lider.transicao@clearit.com.br', password: 'trans123', name: 'Gestor Auxiliar (Transição)', role: 'LEADER', profile: 'TRANSICAO' },
  { email: 'lider.engajado@clearit.com.br', password: 'engajado123', name: 'Gestor Pessoas (Engajado)', role: 'LEADER', profile: 'ENGAJADO' },
  { email: 'lider.novo@clearit.com.br', password: 'novo123', name: 'Gestor Novo (Pendente)', role: 'LEADER', profile: 'PENDENTE' },
  { email: 'rh.priscila@clearit.com.br', password: 'rh123', name: 'Priscila Bacelar (RH)', role: 'RH', profile: 'PENDENTE' }
] as const;

export const DEFAULT_PROMPTS: SystemPrompts = {
  mainPrompt: `Você é o copiloto de IA Smart Leading. Sua missão é auxiliar líderes a conduzir reuniões de 1:1 produtivas e empáticas.
Ajuste seu tom com base no perfil do líder:
- TECNICO: Respostas extremamente diretas, sem jargões corporativos ("calibração de competências", "transversalidade"), focando em entregas e pontos de bloqueio técnicos.
- TRANSICAO: Forneça roteiros detalhados passo a passo, incluindo orientações de inteligência emocional e a metodologia de feedback SBI (Situação, Comportamento, Impacto).
- ENGAJADO: Foco em resumos e tópicos acionáveis imediatos para otimizar a preparação em menos de 3 minutos.`,
  realTimePrompt: `Com base na resposta imediata dada pelo colaborador, forneça ao líder de 2 a 3 opções de perguntas de aprofundamento ou ações imediatas.
A linguagem deve ser empática, focada em resultados e incentivar a escuta ativa do líder (regra 70/30: colaborador fala 70% do tempo).`
};

export const MOCK_COLLABORATORS: Collaborator[] = [
  { id: 'colab-01', name: 'Carlos Santos (L3)', disc: 'DOMINANTE', level: 'L3', role: 'Dev Back-end Sênior' },
  { id: 'colab-02', name: 'Mariana Souza (L2)', disc: 'ESTAVEL', level: 'L2', role: 'Dev Front-end Pleno' },
  { id: 'colab-03', name: 'Jorge Oliveira (L4)', disc: 'ANALITICO', level: 'L4', role: 'DevOps Principal' },
  { id: 'colab-04', name: 'Fernanda Lima (L1)', disc: 'INFLUENTE', level: 'L1', role: 'Dev Front-end Júnior' }
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
    notes: 'Mariana relatou cansaço mental devido à sobrecarga de tarefas.'
  }
];

export const MOCK_CONFLICTS: ConflictEscalation[] = [
  {
    id: 'conf-mock-1',
    protocol: 'SHR-2026-1049',
    collaboratorId: 'colab-02',
    collaboratorName: 'Mariana Souza (L2)',
    description: 'Mariana continua apresentando baixa produtividade crônica. Já foram feitas duas 1:1s em 45 dias sem evolução visível.',
    date: '2026-07-02',
    status: 'PENDING',
    hasHistory: true,
    isBypass: false
  }
];

// Helper wrapper functions
export const storage = {
  isBrowser(): boolean {
    return typeof window !== 'undefined';
  },

  initialize(): void {
    if (!this.isBrowser()) return;

    if (!localStorage.getItem('synchr_collaborators')) {
      localStorage.setItem('synchr_collaborators', JSON.stringify(MOCK_COLLABORATORS));
    }
    if (!localStorage.getItem('synchr_one_on_ones')) {
      localStorage.setItem('synchr_one_on_ones', JSON.stringify(MOCK_ONE_ON_ONES(MOCK_COLLABORATORS)));
    }
    if (!localStorage.getItem('synchr_conflicts')) {
      localStorage.setItem('synchr_conflicts', JSON.stringify(MOCK_CONFLICTS));
    }
    if (!localStorage.getItem('synchr_prompts')) {
      localStorage.setItem('synchr_prompts', JSON.stringify(DEFAULT_PROMPTS));
    }
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
            id: 1,
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
            id: 1,
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
