
import { Professor, Room, UsageLog } from './types';

export const MOCK_PROFESSORS: Professor[] = [
  { id: '1', name: 'Dr. John Doe', email: 'jdoe@neu.edu.ph', college: 'CEA', isBlocked: false },
  { id: '2', name: 'Prof. Jane Smith', email: 'jsmith@neu.edu.ph', college: 'CICS', isBlocked: false },
  { id: '3', name: 'Dr. Robert Brown', email: 'rbrown@neu.edu.ph', college: 'CAS', isBlocked: true },
];

export const MOCK_ROOMS: Room[] = [
  { id: '1', number: 'COM LAB 1', usageCount: 45, status: 'available' },
  { id: '2', number: 'COM LAB 2', usageCount: 32, status: 'in-use' },
  { id: '3', number: 'PHY LAB', usageCount: 12, status: 'available' },
  { id: '4', number: 'CHEM LAB', usageCount: 8, status: 'available' },
];

export const MOCK_LOGS: UsageLog[] = [
  {
    id: 'l1',
    professorId: '1',
    professorName: 'Dr. John Doe',
    roomNumber: 'COM LAB 1',
    college: 'CEA',
    program: 'BSCE',
    section: '4A',
    startTime: new Date(Date.now() - 3600000 * 2).toISOString(),
    endTime: new Date(Date.now() - 3600000).toISOString(),
    durationMinutes: 60,
  },
  {
    id: 'l2',
    professorId: '2',
    professorName: 'Prof. Jane Smith',
    roomNumber: 'COM LAB 2',
    college: 'CICS',
    program: 'BSCS',
    section: '3B',
    startTime: new Date(Date.now() - 3600000).toISOString(),
  },
];
