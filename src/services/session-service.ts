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
import { RoomService } from './room-service';

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

export const SessionService = {
  async getActiveSession(db: Firestore, email: string): Promise<LabSession | null> {
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
  },

  async isRoomOccupied(db: Firestore, roomNumber: string): Promise<boolean> {
    const sessionsRef = collection(db, 'sessions');
    const q = query(
      sessionsRef,
      where('roomNumber', '==', roomNumber),
      where('status', '==', 'active'),
      limit(1)
    );
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  },

  async startSession(db: Firestore, data: Omit<LabSession, 'id' | 'startTime' | 'status' | 'createdAt'>): Promise<string> {
    // Check if the current user already has an active session
    const active = await this.getActiveSession(db, data.professorEmail);
    if (active) {
      throw new Error('You already have an active session.');
    }

    // Check if the selected room is already occupied
    const occupied = await this.isRoomOccupied(db, data.roomNumber);
    if (occupied) {
      throw new Error(`Room ${data.roomNumber} is currently occupied by another session.`);
    }

    const sessionsRef = collection(db, 'sessions');
    
    // 1. Create the session document
    const docRef = await addDoc(sessionsRef, {
      ...data,
      status: 'active',
      startTime: serverTimestamp(),
      createdAt: serverTimestamp()
    });
    
    // 2. Update room occupancy state in the rooms collection
    // Note: Security rules have been updated to allow professors to update these specific fields
    await RoomService.updateRoomOccupancy(db, data.roomNumber, true);
    await RoomService.incrementUsage(db, data.roomNumber);
    
    return docRef.id;
  },

  async logManualSession(db: Firestore, data: Omit<LabSession, 'id' | 'status' | 'createdAt' | 'duration'>): Promise<string> {
    const startMs = data.startTime.toMillis();
    const endMs = data.endTime?.toMillis() || Date.now();
    
    if (endMs <= startMs) {
      throw new Error('End time must be after start time.');
    }

    const durationMinutes = Math.floor((endMs - startMs) / 60000);
    const sessionsRef = collection(db, 'sessions');
    
    const docRef = await addDoc(sessionsRef, {
      ...data,
      status: 'completed',
      duration: durationMinutes,
      createdAt: serverTimestamp()
    });

    return docRef.id;
  },

  async endSession(db: Firestore, sessionId: string, startTime: Timestamp, roomNumber: string): Promise<void> {
    const sessionRef = doc(db, 'sessions', sessionId);
    const startMs = startTime.toMillis();
    const endMs = Date.now();
    const durationMinutes = Math.floor((endMs - startMs) / 60000);

    // 1. Mark session as completed
    await updateDoc(sessionRef, {
      status: 'completed',
      endTime: serverTimestamp(),
      duration: durationMinutes
    });

    // 2. Mark room as vacant
    await RoomService.updateRoomOccupancy(db, roomNumber, false);
  }
};