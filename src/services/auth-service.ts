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
import { UserService, UserProfile } from './user-service';

const INSTITUTIONAL_DOMAIN = '@neu.edu.ph';
const ADMIN_EMAIL = 'admin@neu.edu.ph';

export const AuthService = {
  async signInWithGoogle(auth: Auth, db: Firestore, intendedRole?: 'admin' | 'professor'): Promise<{ user: User; profile: UserProfile }> {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account', hd: 'neu.edu.ph' });
    
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    if (!user.email?.endsWith(INSTITUTIONAL_DOMAIN) && user.email !== ADMIN_EMAIL) {
      await signOut(auth);
      throw new Error(`Access restricted. Please use your ${INSTITUTIONAL_DOMAIN} email.`);
    }

    let profile = await UserService.getUserProfile(db, user.uid);
    
    if (!profile) {
      const role = user.email === ADMIN_EMAIL ? 'admin' : 'professor';
      const newProfile: Partial<UserProfile> = {
        uid: user.uid,
        email: user.email!,
        role: role as any,
        name: user.displayName || (role === 'admin' ? 'Authorized Admin' : null),
        photoURL: user.photoURL,
        status: 'active',
        createdAt: serverTimestamp(),
      };
      await UserService.createUserProfile(db, newProfile);
      profile = await UserService.getUserProfile(db, user.uid);
    } else {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        name: user.displayName || profile.name,
        photoURL: user.photoURL || profile.photoURL
      });
      profile.photoURL = user.photoURL || profile.photoURL;
      profile.name = user.displayName || profile.name;
    }

    if (profile && UserService.isBlocked(profile)) {
      await signOut(auth);
      throw new Error('Your account has been deactivated by an administrator.');
    }

    if (intendedRole === 'admin' && profile?.role !== 'admin') {
      await signOut(auth);
      throw new Error('You are not authorized to access the Admin Portal.');
    }

    return { user, profile: profile! };
  },

  async signInAdmin(auth: Auth, db: Firestore, email: string, pass: string): Promise<{ user: User; profile: UserProfile }> {
    if (email !== ADMIN_EMAIL) {
      throw new Error('Invalid admin credentials.');
    }

    const result = await signInWithEmailAndPassword(auth, email, pass);
    const user = result.user;

    let profile = await UserService.getUserProfile(db, user.uid);
    
    if (!profile) {
      const newProfile: Partial<UserProfile> = {
        uid: user.uid,
        email: user.email!,
        role: 'admin',
        name: 'Authorized Admin',
        photoURL: null,
      };
      await UserService.createUserProfile(db, newProfile);
      profile = await UserService.getUserProfile(db, user.uid);
    }
    
    if (!profile || profile.role !== 'admin') {
      await signOut(auth);
      throw new Error('Unauthorized access.');
    }

    return { user, profile };
  },

  async logout(auth: Auth): Promise<void> {
    await signOut(auth);
  }
};