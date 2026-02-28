'use client';

import { 
  Auth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  signInWithEmailAndPassword,
  User
} from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
import { UserService, UserProfile } from './user-service';

const INSTITUTIONAL_DOMAIN = '@neu.edu.ph';
const ADMIN_EMAIL = 'admin@neu.edu.ph';

export const AuthService = {
  /**
   * Handles Google Sign-In with institutional domain validation
   */
  async signInWithGoogle(auth: Auth, db: Firestore): Promise<{ user: User; profile: UserProfile }> {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account', hd: 'neu.edu.ph' });
    
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Validate domain
    if (!user.email?.endsWith(INSTITUTIONAL_DOMAIN) && user.email !== ADMIN_EMAIL) {
      await signOut(auth);
      throw new Error(`Access restricted. Please use your ${INSTITUTIONAL_DOMAIN} email.`);
    }

    // Get or create profile
    let profile = await UserService.getUserProfile(db, user.uid);
    
    if (!profile) {
      const role = user.email === ADMIN_EMAIL ? 'admin' : 'professor';
      const newProfile: Partial<UserProfile> = {
        uid: user.uid,
        email: user.email,
        role: role,
        name: user.displayName,
        photoURL: user.photoURL,
      };
      await UserService.createUserProfile(db, newProfile);
      profile = await UserService.getUserProfile(db, user.uid);
    }

    if (profile && UserService.isBlocked(profile)) {
      await signOut(auth);
      throw new Error('Your account has been deactivated by an administrator.');
    }

    return { user, profile: profile! };
  },

  /**
   * Handles Admin Email/Password login
   */
  async signInAdmin(auth: Auth, db: Firestore, email: string, pass: string): Promise<{ user: User; profile: UserProfile }> {
    if (email !== ADMIN_EMAIL) {
      throw new Error('Invalid admin credentials.');
    }

    const result = await signInWithEmailAndPassword(auth, email, pass);
    const user = result.user;

    let profile = await UserService.getUserProfile(db, user.uid);
    
    // Auto-create admin profile if it doesn't exist for the master admin email
    if (!profile) {
      const newProfile: Partial<UserProfile> = {
        uid: user.uid,
        email: user.email!,
        role: 'admin',
        name: 'System Admin',
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

  /**
   * Logs out the current user
   */
  async logout(auth: Auth): Promise<void> {
    await signOut(auth);
  }
};
