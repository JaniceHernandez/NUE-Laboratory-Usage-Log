'use client';

import { 
  Firestore, 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  query, 
  where, 
  getDocs, 
  serverTimestamp,
  Timestamp,
  limit
} from 'firebase/firestore';
import { updateRoomOccupancy, incrementUsage } from './room-service';

export interface LabSession {
  id?: string;
  professorEmail: string;
  roomNumber: string;
  college: string;
  program: string;
  section: string;
  startTime: Timestamp;
  endTime?: Timestamp | null;
  duration?: number;
  status: 'active' | 'completed';
  createdAt: Timestamp;
}

export async function getActiveSession(db: Firestore, email: string): Promise<LabSession | null> {
  const sessionsRef = collection(db, 'sessions');
  const q = query(
    sessionsRef, 
    where('professorEmail', '==', email), 
    where('status', '==', 'active'),
    limit(1)
  );
  
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    const docData = querySnapshot.docs[0];
    return { id: docData.id, ...docData.data() } as LabSession;
  }
  return null;
}

export async function isRoomOccupied(db: Firestore, roomNumber: string): Promise<boolean> {
  const sessionsRef = collection(db, 'sessions');
  const q = query(
    sessionsRef,
    where('roomNumber', '==', roomNumber),
    where('status', '==', 'active'),
    limit(1)
  );
  const snapshot = await getDocs(q);
  return !snapshot.empty;
}

export async function startSession(db: Firestore, data: Omit<LabSession, 'id' | 'startTime' | 'status' | 'createdAt'>): Promise<string> {
  const active = await getActiveSession(db, data.professorEmail);
  if (active) {
    throw new Error('You already have an active session.');
  }

  const occupied = await isRoomOccupied(db, data.roomNumber);
  if (occupied) {
    throw new Error(`Room ${data.roomNumber} is currently occupied by another session.`);
  }

  const sessionsRef = collection(db, 'sessions');
  
  const docRef = await addDoc(sessionsRef, {
    ...data,
    status: 'active',
    startTime: serverTimestamp(),
    createdAt: serverTimestamp()
  });
  
  await updateRoomOccupancy(db, data.roomNumber, true);
  await incrementUsage(db, data.roomNumber);
  
  return docRef.id;
}

export async function logManualSession(db: Firestore, data: Omit<LabSession, 'id' | 'status' | 'createdAt' | 'duration'>): Promise<string> {
  const startMs = data.startTime.toMillis();
  const endMs = data.endTime?.toMillis() || Date.now();
  
  if (endMs <= startMs) {
    throw new Error('End time must be after start time.');
  }

  // Convert to Minutes (rounded up)
  const durationMinutes = Math.ceil((endMs - startMs) / 60000);
  const sessionsRef = collection(db, 'sessions');
  
  const docRef = await addDoc(sessionsRef, {
    ...data,
    status: 'completed',
    duration: durationMinutes,
    createdAt: serverTimestamp()
  });

  return docRef.id;
}

export async function endSession(db: Firestore, sessionId: string, startTime: Timestamp, roomNumber: string): Promise<void> {
  const sessionRef = doc(db, 'sessions', sessionId);
  const now = Timestamp.now();
  const startMs = startTime.toMillis();
  const endMs = now.toMillis();
  
  // Convert to Minutes (rounded up)
  const durationMinutes = Math.ceil((endMs - startMs) / 60000);

  await updateDoc(sessionRef, {
    status: 'completed',
    endTime: now,
    duration: durationMinutes
  });

  await updateRoomOccupancy(db, roomNumber, false);
}