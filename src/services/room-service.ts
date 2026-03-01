
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
  currentlyOccupied?: boolean;
  usageCount: number;
  createdAt?: Timestamp;
}

export const RoomService = {
  async getRooms(db: Firestore): Promise<Room[]> {
    const roomsRef = collection(db, 'rooms');
    const snapshot = await getDocs(roomsRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Room));
  },

  async getAvailableRooms(db: Firestore): Promise<Room[]> {
    const roomsRef = collection(db, 'rooms');
    const q = query(roomsRef, where('status', '==', 'available'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Room));
  },

  async addRoom(db: Firestore, data: Omit<Room, 'id' | 'createdAt' | 'usageCount' | 'currentlyOccupied'>): Promise<string> {
    const roomsRef = collection(db, 'rooms');
    const docRef = await addDoc(roomsRef, {
      ...data,
      currentlyOccupied: false,
      usageCount: 0,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  },

  async updateRoomOccupancy(db: Firestore, roomNumber: string, occupied: boolean): Promise<void> {
    const roomsRef = collection(db, 'rooms');
    const q = query(roomsRef, where('number', '==', roomNumber));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const roomDoc = snapshot.docs[0];
      await updateDoc(doc(db, 'rooms', roomDoc.id), {
        currentlyOccupied: occupied
      });
    }
  },

  async deleteRoom(db: Firestore, roomId: string): Promise<void> {
    const roomRef = doc(db, 'rooms', roomId);
    await deleteDoc(roomRef);
  },

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
