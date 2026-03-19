import { 
  doc, getDoc, setDoc, updateDoc, deleteDoc, 
  serverTimestamp, Firestore, query, collection, 
  where, getDocs
} from 'firebase/firestore';

export interface UserProfile {
  id?: string;
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

export const SUPER_ADMIN_EMAIL = 'admin@neu.edu.ph';

export async function getUserProfile(db: Firestore, uid: string): Promise<UserProfile | null> {
  const docRef = doc(db, 'users', uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { ...docSnap.data(), id: docSnap.id, uid: docSnap.id } as UserProfile;
  }
  return null;
}

export async function isAuthorizedAdmin(db: Firestore, email: string): Promise<boolean> {
  const normalizedEmail = email.toLowerCase().trim();
  if (normalizedEmail === SUPER_ADMIN_EMAIL) return true;
  
  const emailId = normalizedEmail.replace(/[^a-z0-9]/g, '_');
  const authRef = doc(db, 'authorizedAdmins', emailId);
  const authSnap = await getDoc(authRef);
  return authSnap.exists();
}

export async function authorizeAdminEmail(db: Firestore, email: string, authorizedBy: string): Promise<void> {
  const normalizedEmail = email.toLowerCase().trim();
  const emailId = normalizedEmail.replace(/[^a-z0-9]/g, '_');
  
  const authRef = doc(db, 'authorizedAdmins', emailId);
  await setDoc(authRef, {
    email: normalizedEmail,
    authorizedBy,
    createdAt: serverTimestamp()
  });

  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('email', '==', normalizedEmail));
  const snapshot = await getDocs(q);
  if (!snapshot.empty) {
    const userDoc = snapshot.docs[0];
    await updateDoc(doc(db, 'users', userDoc.id), { role: 'admin' });
  }
}

export async function createUserProfile(db: Firestore, profile: Partial<UserProfile>): Promise<void> {
  if (!profile.uid) throw new Error('UID is required to create a profile');
  
  const userRef = doc(db, 'users', profile.uid);
  await setDoc(userRef, {
    ...profile,
    status: 'active',
    createdAt: serverTimestamp(),
  }, { merge: true });
}

export async function updateUserCollege(db: Firestore, uid: string, college: string): Promise<void> {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, { college });
}

export async function deleteAuthorizedAdmin(db: Firestore, email: string): Promise<void> {
  const emailId = email.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
  await deleteDoc(doc(db, 'authorizedAdmins', emailId));
}

export function isBlocked(profile: UserProfile): boolean {
  return profile.status === 'blocked';
}

export function isSuperAdmin(profile?: UserProfile | null): boolean {
  if (!profile) return false;
  const email = profile.email?.toLowerCase().trim();
  return email === SUPER_ADMIN_EMAIL;
}
