export type LeaderProfileType = 'TECNICO' | 'TRANSICAO' | 'ENGAJADO' | 'PENDENTE';
export type DiscProfileType = 'DOMINANTE' | 'ESTAVEL' | 'ANALITICO' | 'INFLUENTE';
export type UserRole = 'LEADER' | 'RH';
export type ConflictStatus = 'PENDING' | 'IN_INVESTIGATION' | 'RESOLVED' | 'UNRESOLVED';

export interface UserSession {
  email: string;
  name: string;
  role: UserRole;
  profile: LeaderProfileType;
}

export interface UserRecord {
  email: string;
  password?: string;
  name: string;
  role: UserRole;
  profile: LeaderProfileType;
}

export interface LeaderProfile {
  id: number;
  email: string;
  name: string;
  profile: LeaderProfileType;
  levelFrom: string;
  levelTo: string;
}

export interface Collaborator {
  id: string;
  name: string;
  disc: DiscProfileType;
  level: string;
  role: string;
}

export interface OneOnOne {
  id: string;
  collaboratorId: string;
  collaboratorName: string;
  date: string;
  type: string;
  context: string;
  scriptText: string;
  notes?: string;
  transcription?: string;
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
