'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { firebaseConfig } from './config';
import { FirebaseProvider } from './provider';

export const FirebaseClientProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [firebaseInstance, setFirebaseInstance] = useState<{
    app: FirebaseApp;
    db: Firestore;
    auth: Auth;
  } | null>(null);

  useEffect(() => {
    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const auth = getAuth(app);
    setFirebaseInstance({ app, db, auth });
  }, []);

  if (!firebaseInstance) return null;

  return (
    <FirebaseProvider
      firebaseApp={firebaseInstance.app}
      firestore={firebaseInstance.db}
      auth={firebaseInstance.auth}
    >
      {children}
    </FirebaseProvider>
  );
};