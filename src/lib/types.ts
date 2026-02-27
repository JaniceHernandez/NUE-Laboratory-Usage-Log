export type UserRole = 'professor' | 'admin';

export interface Professor {
  id: string;
  name: string;
  email: string;
  college: string;
  isBlocked: boolean;
  avatar?: string;
}

export interface Room {
  id: string;
  number: string;
  location: string;
  usageCount: number;
  status: 'available' | 'in-use' | 'maintenance';
}

export interface UsageLog {
  id: string;
  professorId: string;
  professorName: string;
  professorAvatar?: string;
  roomNumber: string;
  college: string;
  program: string;
  section: string;
  startTime: string;
  endTime?: string;
  durationMinutes?: number;
  action?: 'CHECK-IN' | 'CHECK-OUT';
}

export interface UsageStats {
  totalUsage: number;
  totalHours: number;
  mostUsedRoom: string;
  mostActiveProfessor: string;
  activeSessions: number;
}