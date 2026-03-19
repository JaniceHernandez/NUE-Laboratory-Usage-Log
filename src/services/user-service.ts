
'use client';

import { 
  doc, getDoc, setDoc, updateDoc, deleteDoc, 
  serverTimestamp, Firestore, query, collection, 
  where, getDocs, addDoc, DocumentData
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

export interface AuthorizedAdmin {
  email: string;
  authorizedBy?: string;
  createdAt: any;
}

const SUPER_ADMIN_EMAIL = 'admin@neu.edu.ph';

export const UserService = {
  async getUserProfile(db: Firestore, uid: string): Promise<UserProfile | null> {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { ...docSnap.data(), uid: docSnap.id } as UserProfile;
    }
    return null;
  },

  async isAuthorizedAdmin(db: Firestore, email: string): Promise<boolean> {
    if (email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) return true;
    const emailId = email.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
    const authRef = doc(db, 'authorizedAdmins', emailId);
    const authSnap = await getDoc(authRef);
    return authSnap.exists();
  },

  async authorizeAdminEmail(db: Firestore, email: string, authorizedBy: string): Promise<void> {
    const normalizedEmail = email.toLowerCase().trim();
    const emailId = normalizedEmail.replace(/[^a-z0-9]/g, '_');
    
    // Create pre-authorization record
    const authRef = doc(db, 'authorizedAdmins', emailId);
    await setDoc(authRef, {
      email: normalizedEmail,
      authorizedBy,
      createdAt: serverTimestamp()
    });

    // If user already exists, upgrade their role immediately
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', normalizedEmail));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const userDoc = snapshot.docs[0];
      await updateDoc(doc(db, 'users', userDoc.id), { role: 'admin' });
    }
  },

  async createUserProfile(db: Firestore, profile: Partial<UserProfile>): Promise<void> {
    if (!profile.uid) throw new Error('UID is required to create a profile');
    
    const userRef = doc(db, 'users', profile.uid);
    await setDoc(userRef, {
      ...profile,
      status: 'active',
      createdAt: serverTimestamp(),
    }, { merge: true });
  },

  async deleteUser(db: Firestore, uid: string): Promise<void> {
    const userRef = doc(db, 'users', uid);
    await deleteDoc(userRef);
  },

  async deleteAuthorizedAdmin(db: Firestore, email: string): Promise<void> {
    const emailId = email.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
    await deleteDoc(doc(db, 'authorizedAdmins', emailId));
  },

  isBlocked(profile: UserProfile): boolean {
    return profile.status === 'blocked';
  },

  isSuperAdmin(profile?: UserProfile | null): boolean {
    if (!profile) return false;
    return profile.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
  }
};
