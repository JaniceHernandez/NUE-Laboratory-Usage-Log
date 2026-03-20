'use client';

import { 
  Auth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  signInWithEmailAndPassword,
  User
} from 'firebase/auth';
import { Firestore, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { 
  getUserProfile, 
  createUserProfile, 
  isAuthorizedAdmin, 
  isBlocked, 
  UserProfile, 
  SUPER_ADMIN_EMAIL 
} from './user-service';

const INSTITUTIONAL_DOMAIN = '@neu.edu.ph';

export async function signInWithGoogle(auth: Auth, db: Firestore, intendedRole?: 'admin' | 'professor'): Promise<{ user: User; profile: UserProfile }> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account', hd: 'neu.edu.ph' });
  
  const result = await signInWithPopup(auth, provider);
  const user = result.user;
  const userEmail = user.email?.toLowerCase().trim();

  if (!userEmail?.endsWith(INSTITUTIONAL_DOMAIN) && userEmail !== SUPER_ADMIN_EMAIL) {
    await signOut(auth);
    throw new Error(`Access restricted. Please use your ${INSTITUTIONAL_DOMAIN} institutional email.`);
  }

  // Immediate check for Super Admin or Authorized Admin status via registry
  const isSuper = userEmail === SUPER_ADMIN_EMAIL;
  const isAuthorized = await isAuthorizedAdmin(db, userEmail!);
  
  let existingProfile = await getUserProfile(db, user.uid);
  
  // Determine role based on institutional clearance
  const finalRole = (isSuper || isAuthorized || existingProfile?.role === 'admin') ? 'admin' : 'professor';

  if (intendedRole === 'admin' && finalRole !== 'admin') {
    await signOut(auth);
    throw new Error('This account does not have administrative clearance.');
  }

  if (!existingProfile) {
    const newProfile: Partial<UserProfile> = {
      uid: user.uid,
      email: userEmail!,
      role: finalRole as any,
      status: 'active',
      name: user.displayName,
      photoURL: user.photoURL,
      createdAt: serverTimestamp(),
    };
    await createUserProfile(db, newProfile);
    existingProfile = await getUserProfile(db, user.uid);
  } else {
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      name: user.displayName || existingProfile.name,
      photoURL: user.photoURL || existingProfile.photoURL,
      role: finalRole
    });
    existingProfile.role = finalRole as any;
  }

  if (existingProfile && isBlocked(existingProfile)) {
    await signOut(auth);
    throw new Error('Your institutional account has been deactivated.');
  }

  return { user, profile: existingProfile! };
}

export async function signInAdmin(auth: Auth, db: Firestore, email: string, pass: string): Promise<{ user: User; profile: UserProfile }> {
  const normalizedEmail = email.toLowerCase().trim();
  if (normalizedEmail !== SUPER_ADMIN_EMAIL) {
    throw new Error('Invalid admin credentials.');
  }

  const result = await signInWithEmailAndPassword(auth, normalizedEmail, pass);
  const user = result.user;

  let profile = await getUserProfile(db, user.uid);
  
  if (!profile) {
    const newProfile: Partial<UserProfile> = {
      uid: user.uid,
      email: normalizedEmail,
      role: 'admin',
      status: 'active',
      name: 'Super Administrator',
      photoURL: null,
      createdAt: serverTimestamp(),
    };
    await createUserProfile(db, newProfile);
    profile = await getUserProfile(db, user.uid);
  }
  
  return { user, profile: profile! };
}

export async function logout(auth: Auth): Promise<void> {
  await signOut(auth);
}