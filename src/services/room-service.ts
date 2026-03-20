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

export async function getRooms(db: Firestore): Promise<Room[]> {
  const roomsRef = collection(db, 'rooms');
  const snapshot = await getDocs(roomsRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Room));
}

export async function getAvailableRooms(db: Firestore): Promise<Room[]> {
  const roomsRef = collection(db, 'rooms');
  const q = query(roomsRef, where('status', '==', 'available'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Room));
}

export async function addRoom(db: Firestore, data: Omit<Room, 'id' | 'createdAt' | 'usageCount' | 'currentlyOccupied'>): Promise<string> {
  const roomsRef = collection(db, 'rooms');
  const docRef = await addDoc(roomsRef, {
    ...data,
    currentlyOccupied: false,
    usageCount: 0,
    createdAt: serverTimestamp()
  });
  return docRef.id;
}

export async function updateRoom(db: Firestore, roomId: string, data: Partial<Room>): Promise<void> {
  const roomRef = doc(db, 'rooms', roomId);
  await updateDoc(roomRef, data);
}

export async function updateRoomStatus(db: Firestore, roomId: string, status: Room['status']): Promise<void> {
  const roomRef = doc(db, 'rooms', roomId);
  await updateDoc(roomRef, { status });
}

export async function updateRoomOccupancy(db: Firestore, roomNumber: string, occupied: boolean): Promise<void> {
  const roomsRef = collection(db, 'rooms');
  const q = query(roomsRef, where('number', '==', roomNumber));
  const snapshot = await getDocs(q);
  
  if (!snapshot.empty) {
    const roomDoc = snapshot.docs[0];
    await updateDoc(doc(db, 'rooms', roomDoc.id), {
      currentlyOccupied: occupied
    });
  }
}

export async function deleteRoom(db: Firestore, roomId: string): Promise<void> {
  const roomRef = doc(db, 'rooms', roomId);
  await deleteDoc(roomRef);
}

export async function incrementUsage(db: Firestore, roomNumber: string): Promise<void> {
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