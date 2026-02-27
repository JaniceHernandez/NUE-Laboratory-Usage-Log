import { Professor, Room, UsageLog } from './types';

export const MOCK_PROFESSORS: Professor[] = [
  { id: '1', name: 'Dr. John Doe', email: 'jdoe@neu.edu.ph', college: 'CEA', isBlocked: false, avatar: 'https://picsum.photos/seed/p1/100/100' },
  { id: '2', name: 'Prof. Jane Smith', email: 'jsmith@neu.edu.ph', college: 'CICS', isBlocked: false, avatar: 'https://picsum.photos/seed/p2/100/100' },
  { id: '3', name: 'Dr. Robert Brown', email: 'rbrown@neu.edu.ph', college: 'CAS', isBlocked: true, avatar: 'https://picsum.photos/seed/p3/100/100' },
];

export const MOCK_ROOMS: Room[] = [
  { id: '1', number: 'Lab 101', location: 'Science Block, 1st Floor', usageCount: 124, status: 'available' },
  { id: '2', number: 'Lab 304', location: 'Technology Wing, 2nd Floor', usageCount: 89, status: 'in-use' },
  { id: '3', number: 'Lab 203', location: 'Innovation Center, 1st Floor', usageCount: 215, status: 'maintenance' },
  { id: '4', number: 'Lab 103', location: 'Science Block, 1st Floor', usageCount: 56, status: 'available' },
  { id: '5', number: 'Lab 402', location: 'Engineering Hall, 4th Floor', usageCount: 312, status: 'in-use' },
];

export const MOCK_LOGS: UsageLog[] = [
  {
    id: 'l1',
    professorId: '1',
    professorName: 'Dr. Sarah Miller',
    professorAvatar: 'https://picsum.photos/seed/sarah/100/100',
    roomNumber: 'L-402',
    college: 'Informatics',
    program: 'BSCS',
    section: '3A',
    startTime: 'Oct 24, 09:00 AM',
    endTime: 'Oct 24, 11:00 AM',
    durationMinutes: 120,
    action: 'CHECK-OUT'
  },
  {
    id: 'l2',
    professorId: '2',
    professorName: 'Prof. Robert King',
    professorAvatar: 'https://picsum.photos/seed/robert/100/100',
    roomNumber: 'L-101',
    college: 'Engineering',
    program: 'BSCE',
    section: '2B',
    startTime: 'Oct 24, 01:00 PM',
    endTime: 'Oct 24, 04:00 PM',
    durationMinutes: 180,
    action: 'CHECK-OUT'
  },
  {
    id: 'l3',
    professorId: '3',
    professorName: 'Ms. Elena Lopez',
    professorAvatar: 'https://picsum.photos/seed/elena/100/100',
    roomNumber: 'L-304',
    college: 'Science',
    program: 'BSBIO-4C',
    section: '4C',
    startTime: 'Oct 23, 10:00 AM',
    endTime: 'Oct 23, 01:00 PM',
    durationMinutes: 180,
    action: 'CHECK-OUT'
  }
];