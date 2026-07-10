export type LeaderProfileType = 'TECNICO' | 'TRANSICAO' | 'ENGAJADO' | 'PENDENTE' | 'ADMINISTRADOR';
export type DiscProfileType = 'DOMINANTE' | 'ESTAVEL' | 'ANALITICO' | 'INFLUENTE';
export type UserRole = 'LEADER' | 'RH';
export type ConflictStatus = 'PENDING' | 'IN_INVESTIGATION' | 'RESOLVED' | 'UNRESOLVED';

export interface UserSession {
  email: string;
  name: string;
  role: UserRole;
  profile: LeaderProfileType;
  id?: string; // UUID from Supabase profiles
}

export interface UserRecord {
  id?: string;
  email: string;
  password?: string; // used for legacy storage sync if needed
  name: string;
  role: UserRole;
  profile: LeaderProfileType;
}

export interface LeaderProfile {
  id: string | number;
  email: string;
  name: string;
  profile: LeaderProfileType;
  levelFrom: string;
  levelTo: string;
}

export interface Collaborator {
  id: string;
  name: string;
  email?: string;
  disc: DiscProfileType;
  level: string; // L1 | L2 | L3 | L4
  role: string;
  leaderId?: string; // Reference to profiles.id in Supabase
}

export interface ConsistencyCheck {
  consistent: boolean;
  confidenceScore: number;
  details: string;
}

export interface OneOnOne {
  id: string;
  collaboratorId: string;
  collaboratorName: string;
  date: string;
  type: string;
  context: string;
  scriptText: string;
  
  // RAW Data Fields
  rawLeaderNotes?: string;
  rawCollaboratorNotes?: string;
  transcription?: string;
  finalSummary?: string;
  
  // Validation signatures
  leaderApproved?: boolean;
  collaboratorApproved?: boolean;
  
  // Consistency Results
  consistencyResult?: ConsistencyCheck;
  ataTemplateId?: string;

  // Legacy field
  notes?: string;
  evaluation?: string;
}

export interface ConflictEscalation {
  id: string;
  protocol: string;
  collaboratorId: string;
  collaboratorName: string;
  description: string;
  date: string;
  status: ConflictStatus;
  notes?: string;
  hasHistory: boolean;
  isBypass: boolean;
}

export interface SystemPrompts {
  mainPrompt: string;
  realTimePrompt: string;
}

export interface SimulatedEmail {
  id: string;
  to: string;
  from: string;
  subject: string;
  body: string;
  date: string;
}
