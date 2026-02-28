'use client';

import { 
  Firestore, 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  serverTimestamp, 
  query, 
  where, 
  Timestamp 
} from 'firebase/firestore';

export interface Room {
  id?: string;
  number: string;
  location: string;
  status: 'available' | 'inactive' | 'maintenance';
  usageCount: number;
  createdAt: Timestamp;
}

export const RoomService = {
  /**
   * Fetches all rooms from Firestore
   */
  async getRooms(db: Firestore): Promise<Room[]> {
    const roomsRef = collection(db, 'rooms');
    const snapshot = await getDocs(roomsRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Room));
  },

  /**
   * Fetches only active/available rooms for professor selection
   */
  async getAvailableRooms(db: Firestore): Promise<Room[]> {
    const roomsRef = collection(db, 'rooms');
    const q = query(roomsRef, where('status', '==', 'available'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Room));
  },

  /**
   * Adds a new laboratory room
   */
  async addRoom(db: Firestore, data: Omit<Room, 'id' | 'createdAt' | 'usageCount'>): Promise<string> {
    const roomsRef = collection(db, 'rooms');
    const docRef = await addDoc(roomsRef, {
      ...data,
      usageCount: 0,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  },

  /**
   * Updates room details
   */
  async updateRoom(db: Firestore, roomId: string, data: Partial<Room>): Promise<void> {
    const roomRef = doc(db, 'rooms', roomId);
    await updateDoc(roomRef, data);
  },

  /**
   * Deletes a room
   */
  async deleteRoom(db: Firestore, roomId: string): Promise<void> {
    const roomRef = doc(db, 'rooms', roomId);
    await deleteDoc(roomRef);
  },

  /**
   * Increments the usage count for a room
   */
  async incrementUsage(db: Firestore, roomNumber: string): Promise<void> {
    const roomsRef = collection(db, 'rooms');
    const q = query(roomsRef, where('number', '==', roomNumber));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const roomDoc = snapshot.docs[0];
      const currentCount = roomDoc.data().usageCount || 0;
      await updateDoc(doc(db, 'rooms', roomDoc.id), {
        usageCount: currentCount + 1
      });
    }
  }
};
