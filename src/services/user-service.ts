'use client';

import { 
  doc, getDoc, setDoc, updateDoc, deleteDoc, 
  serverTimestamp, Firestore, query, collection, 
  where, getDocs, addDoc 
} from 'firebase/firestore';

export interface UserProfile {
  uid?: string;
  email: string;
  role: 'admin' | 'professor';
  status: 'active' | 'blocked';
  college?: string;
  name: string | null;
  photoURL: string | null;
  createdAt: any;
}

const SUPER_ADMIN_EMAIL = 'admin@neu.edu.ph';

export const UserService = {
  /**
   * Fetches a user profile from Firestore by UID
   */
  async getUserProfile(db: Firestore, uid: string): Promise<UserProfile | null> {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { ...docSnap.data(), uid: docSnap.id } as UserProfile;
    }
    return null;
  },

  /**
   * Finds a user by email (useful for linking pre-authorized admins)
   */
  async findUserByEmail(db: Firestore, email: string): Promise<UserProfile | null> {
    const normalizedEmail = email.toLowerCase();
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', normalizedEmail));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const docData = snapshot.docs[0];
      return { ...docData.data(), uid: docData.id } as UserProfile;
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
   * Pre-authorizes an admin email
   */
  async authorizeAdminEmail(db: Firestore, email: string): Promise<void> {
    const normalizedEmail = email.toLowerCase();
    const existing = await this.findUserByEmail(db, normalizedEmail);
    if (existing && existing.role === 'admin') {
      throw new Error('Email is already an administrator.');
    }

    if (existing) {
      // Upgrade existing professor to admin
      await this.updateUserRole(db, (existing as any).uid || existing.uid!, 'admin');
    } else {
      // Create a new "pending" admin record
      const usersRef = collection(db, 'users');
      await addDoc(usersRef, {
        email: normalizedEmail,
        role: 'admin',
        status: 'active',
        name: null,
        photoURL: null,
        createdAt: serverTimestamp()
      });
    }
  },

  /**
   * Updates user status (block/unblock)
   */
  async updateUserStatus(db: Firestore, uid: string, status: 'active' | 'blocked'): Promise<void> {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, { status });
  },

  /**
   * Updates user role (admin/professor)
   */
  async updateUserRole(db: Firestore, uid: string, role: 'admin' | 'professor'): Promise<void> {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, { role });
  },

  /**
   * Deletes a user record permanently from Firestore
   */
  async deleteUser(db: Firestore, uid: string): Promise<void> {
    const userRef = doc(db, 'users', uid);
    await deleteDoc(userRef);
  },

  /**
   * Updates user college affiliation
   */
  async updateUserCollege(db: Firestore, uid: string, college: string): Promise<void> {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, { college });
  },

  /**
   * Checks if a user is blocked
   */
  isBlocked(profile: UserProfile): boolean {
    return profile.status === 'blocked';
  },

  /**
   * Checks if a user is the Super Admin
   */
  isSuperAdmin(profile?: UserProfile | null): boolean {
    if (!profile) return false;
    return profile.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
  }
};
