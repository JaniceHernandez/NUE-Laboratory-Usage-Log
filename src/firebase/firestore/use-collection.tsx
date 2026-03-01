'use client';

import { useState, useEffect } from 'react';
import {
  Query,
  onSnapshot,
  QuerySnapshot,
  DocumentData,
  FirestoreError,
  CollectionReference,
} from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

export function useCollection<T = DocumentData>(query: Query<T> | null) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  useEffect(() => {
    if (!query) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      query,
      (snapshot: QuerySnapshot<T>) => {
        setData(snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id } as T)));
        setLoading(false);
      },
      async (err) => {
        if (err.code === 'permission-denied') {
          // Attempt to extract path from query internal structure or fall back
          const path = (query as any).path || (query as any)._query?.path?.toString() || 'unknown collection';
          const permissionError = new FirestorePermissionError({
            path,
            operation: 'list',
          });
          errorEmitter.emit('permission-error', permissionError);
        }
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [query]);

  return { data, loading, error };
}
