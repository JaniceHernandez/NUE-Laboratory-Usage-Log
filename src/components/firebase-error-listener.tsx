'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handlePermissionError = (error: FirestorePermissionError) => {
      // In development, log the full context object clearly
      console.error('Firestore Permission Error Context:', JSON.stringify(error.context, null, 2));
      
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description: `You don't have access to ${error.context.path} (${error.context.operation}).`,
      });

      if (process.env.NODE_ENV === 'development') {
        throw error;
      }
    };

    errorEmitter.on('permission-error', handlePermissionError);
    return () => {
      errorEmitter.off('permission-error', handlePermissionError);
    };
  }, [toast]);

  return null;
}
