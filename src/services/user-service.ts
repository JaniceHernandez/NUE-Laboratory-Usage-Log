'use client';

import { doc, getDoc, setDoc, updateDoc, serverTimestamp, Firestore, query, collection, where, getDocs } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  email: string;
  role: 'admin' | 'professor';
  status: 'active' | 'blocked';
  name: string | null;
  photoURL: string | null;
  createdAt: any;
}

export const UserService = {
  /**
   * Fetches a user profile from Firestore
   */
  async getUserProfile(db: Firestore, uid: string): Promise<UserProfile | null> {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { uid: docSnap.id, ...docSnap.data() } as UserProfile;
    }
    return null;
  },

  /**
   * Creates a new user profile in Firestore
   */
  async createUserProfile(db: Firestore, profile: Partial<UserProfile>): Promise<void> {
    if (!profile.uid) throw new Error('UID is required to create a profile');
    
    const userRef = doc(db, 'users', profile.uid);
    await setDoc(userRef, {
      ...profile,
      status: 'active',
      createdAt: serverTimestamp(),
    });
  },

  /**
   * Updates user status (block/unblock)
   */
  async updateUserStatus(db: Firestore, uid: string, status: 'active' | 'blocked'): Promise<void> {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, { status });
  },

  /**
   * Fetches all professors
   */
  async getAllProfessors(db: Firestore): Promise<UserProfile[]> {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('role', '==', 'professor'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
  },

  /**
   * Checks if a user is blocked
   */
  isBlocked(profile: UserProfile): boolean {
    return profile.status === 'blocked';
  }
};
