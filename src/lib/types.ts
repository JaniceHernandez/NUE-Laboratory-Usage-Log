
export type UserRole = 'professor' | 'admin';

export interface Professor {
  id: string;
  name: string;
  email: string;
  college: string;
  isBlocked: boolean;
}

export interface Room {
  id: string;
  number: string;
  usageCount: number;
  status: 'available' | 'in-use';
}

export interface UsageLog {
  id: string;
  professorId: string;
  professorName: string;
  roomNumber: string;
  college: string;
  program: string;
  section: string;
  startTime: string;
  endTime?: string;
  durationMinutes?: number;
}

export interface UsageStats {
  totalUsage: number;
  totalHours: number;
  mostUsedRoom: string;
  mostActiveProfessor: string;
  activeSessions: number;
}
