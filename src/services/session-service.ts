
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
  orderBy,
  limit
} from 'firebase/firestore';

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
  /**
   * Fetches the current active session for a professor
   */
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

  /**
   * Starts a new laboratory session
   */
  async startSession(db: Firestore, data: Omit<LabSession, 'id' | 'startTime' | 'status' | 'createdAt'>): Promise<string> {
    // Safety check: ensure no other active sessions exist
    const active = await this.getActiveSession(db, data.professorEmail);
    if (active) {
      throw new Error('You already have an active session.');
    }

    const sessionsRef = collection(db, 'sessions');
    const docRef = await addDoc(sessionsRef, {
      ...data,
      status: 'active',
      startTime: serverTimestamp(),
      createdAt: serverTimestamp()
    });
    
    return docRef.id;
  },

  /**
   * Ends an active laboratory session
   */
  async endSession(db: Firestore, sessionId: string, startTime: Timestamp): Promise<void> {
    const sessionRef = doc(db, 'sessions', sessionId);
    
    // Calculate duration in minutes
    const startMs = startTime.toMillis();
    const endMs = Date.now();
    const durationMinutes = Math.floor((endMs - startMs) / 60000);

    await updateDoc(sessionRef, {
      status: 'completed',
      endTime: serverTimestamp(),
      duration: durationMinutes
    });
  }
};
