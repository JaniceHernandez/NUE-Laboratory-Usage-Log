'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handlePermissionError = (error: FirestorePermissionError) => {
      // In development, we want to see the full contextual error.
      // Next.js will pick up the uncaught error and show the overlay.
      console.error('Firestore Permission Error:', error.context);
      
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description: `Operation ${error.context.operation} at ${error.context.path} failed.`,
      });

      // Throwing here will trigger the Next.js error overlay in development
      // which is what we want for agentic fixing loops.
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
