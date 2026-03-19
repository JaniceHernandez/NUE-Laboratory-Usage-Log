
'use client';

import { 
  Auth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  signInWithEmailAndPassword,
  User
} from 'firebase/auth';
import { Firestore, doc, updateDoc, serverTimestamp, getDoc, deleteDoc } from 'firebase/firestore';
import { UserService, UserProfile, SUPER_ADMIN_EMAIL } from './user-service';

const INSTITUTIONAL_DOMAIN = '@neu.edu.ph';

export const AuthService = {
  async signInWithGoogle(auth: Auth, db: Firestore, intendedRole?: 'admin' | 'professor'): Promise<{ user: User; profile: UserProfile }> {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account', hd: 'neu.edu.ph' });
    
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    const userEmail = user.email?.toLowerCase().trim();

    if (!userEmail?.endsWith(INSTITUTIONAL_DOMAIN) && userEmail !== SUPER_ADMIN_EMAIL) {
      await signOut(auth);
      throw new Error(`Access restricted. Please use your ${INSTITUTIONAL_DOMAIN} institutional email.`);
    }

    // Determine role: Super Admin or Registry-based Admin or Professor
    const isSuperAdmin = userEmail === SUPER_ADMIN_EMAIL;
    const isAuthorizedRegistry = await UserService.isAuthorizedAdmin(db, userEmail!);
    const finalRole = (isSuperAdmin || isAuthorizedRegistry) ? 'admin' : 'professor';

    // If trying to log in as admin specifically but not authorized
    if (intendedRole === 'admin' && finalRole !== 'admin') {
      await signOut(auth);
      throw new Error('This account does not have administrative clearance.');
    }

    let profile = await UserService.getUserProfile(db, user.uid);

    if (!profile) {
      const newProfile: Partial<UserProfile> = {
        uid: user.uid,
        email: userEmail!,
        role: finalRole as any,
        status: 'active',
        name: user.displayName,
        photoURL: user.photoURL,
        createdAt: serverTimestamp(),
      };
      await UserService.createUserProfile(db, newProfile);
      profile = await UserService.getUserProfile(db, user.uid);
      
      // If it was a registry-based login, cleanup the registry placeholder to prevent "Pending" duplication
      if (isAuthorizedRegistry && !isSuperAdmin) {
        const emailId = userEmail!.replace(/[^a-z0-9]/g, '_');
        await deleteDoc(doc(db, 'authorizedAdmins', emailId)).catch(() => {});
      }
    } else {
      // Sync profile info
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        name: user.displayName || profile.name,
        photoURL: user.photoURL || profile.photoURL,
        role: finalRole // Ensure role is synced (e.g., if just granted admin access)
      });
      profile.name = user.displayName || profile.name;
      profile.role = finalRole as any;
    }

    if (profile && UserService.isBlocked(profile)) {
      await signOut(auth);
      throw new Error('Your institutional account has been deactivated.');
    }

    return { user, profile: profile! };
  },

  async signInAdmin(auth: Auth, db: Firestore, email: string, pass: string): Promise<{ user: User; profile: UserProfile }> {
    const normalizedEmail = email.toLowerCase().trim();
    if (normalizedEmail !== SUPER_ADMIN_EMAIL) {
      throw new Error('Invalid admin credentials.');
    }

    const result = await signInWithEmailAndPassword(auth, normalizedEmail, pass);
    const user = result.user;

    let profile = await UserService.getUserProfile(db, user.uid);
    
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
      await UserService.createUserProfile(db, newProfile);
      profile = await UserService.getUserProfile(db, user.uid);
    }
    
    return { user, profile: profile! };
  },

  async logout(auth: Auth): Promise<void> {
    await signOut(auth);
  }
};
