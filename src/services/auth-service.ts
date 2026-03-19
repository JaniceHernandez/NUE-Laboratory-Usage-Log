'use client';

import { 
  Auth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  signInWithEmailAndPassword,
  User
} from 'firebase/auth';
import { Firestore, doc, getDoc, updateDoc, serverTimestamp, collection, query, where, getDocs, deleteDoc, setDoc } from 'firebase/firestore';
import { UserService, UserProfile } from './user-service';

const INSTITUTIONAL_DOMAIN = '@neu.edu.ph';
const ADMIN_EMAIL = 'admin@neu.edu.ph';

export const AuthService = {
  async signInWithGoogle(auth: Auth, db: Firestore, intendedRole?: 'admin' | 'professor'): Promise<{ user: User; profile: UserProfile }> {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account', hd: 'neu.edu.ph' });
    
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    const userEmail = user.email?.toLowerCase();

    // 1. Domain Check
    if (!userEmail?.endsWith(INSTITUTIONAL_DOMAIN) && userEmail !== ADMIN_EMAIL) {
      await signOut(auth);
      throw new Error(`Access restricted. Please use your ${INSTITUTIONAL_DOMAIN} institutional email.`);
    }

    // 2. Profile Check
    let profile = await UserService.getUserProfile(db, user.uid);
    
    // 3. Handle First-time Login or Pre-authorized Linking
    if (!profile) {
      // Check if this email was pre-authorized as an admin
      const preAuthorized = await UserService.findUserByEmail(db, userEmail!);
      
      if (preAuthorized && preAuthorized.role === 'admin') {
        // "Claim" the pre-authorized profile: Link it to the UID
        const oldDocId = (preAuthorized as any).uid;
        const newProfile: UserProfile = {
          ...preAuthorized,
          uid: user.uid,
          name: user.displayName || 'Authorized Admin',
          photoURL: user.photoURL,
          status: 'active',
          createdAt: preAuthorized.createdAt || serverTimestamp(),
        };

        // Create new doc with UID and delete the placeholder
        await setDoc(doc(db, 'users', user.uid), newProfile);
        if (oldDocId && oldDocId !== user.uid) {
          await deleteDoc(doc(db, 'users', oldDocId));
        }
        profile = newProfile;
      } else {
        // Not pre-authorized as admin. Check if they are trying to log in as admin.
        if (intendedRole === 'admin' && userEmail !== ADMIN_EMAIL) {
          await signOut(auth);
          throw new Error('You are not an authorized administrator. Please contact the system admin.');
        }

        // New professor profile
        const role = userEmail === ADMIN_EMAIL ? 'admin' : 'professor';
        const newProfile: Partial<UserProfile> = {
          uid: user.uid,
          email: userEmail!,
          role: role as any,
          name: user.displayName,
          photoURL: user.photoURL,
          status: 'active',
          createdAt: serverTimestamp(),
        };
        await UserService.createUserProfile(db, newProfile);
        profile = await UserService.getUserProfile(db, user.uid);
      }
    } else {
      // Profile exists, update metadata
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        name: user.displayName || profile.name,
        photoURL: user.photoURL || profile.photoURL
      });
      profile.photoURL = user.photoURL || profile.photoURL;
      profile.name = user.displayName || profile.name;
    }

    // 4. Blocked Check
    if (profile && UserService.isBlocked(profile)) {
      await signOut(auth);
      throw new Error('Your institutional account has been deactivated.');
    }

    // 5. Final Role Authorization Check
    // If the user intended to login as admin, they MUST have the admin role.
    if (intendedRole === 'admin' && profile?.role !== 'admin') {
      await signOut(auth);
      throw new Error('You do not have administrative privileges.');
    }

    return { user, profile: profile! };
  },

  async signInAdmin(auth: Auth, db: Firestore, email: string, pass: string): Promise<{ user: User; profile: UserProfile }> {
    const normalizedEmail = email.toLowerCase();
    if (normalizedEmail !== ADMIN_EMAIL) {
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
