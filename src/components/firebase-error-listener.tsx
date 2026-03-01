'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handlePermissionError = (error: FirestorePermissionError) => {
      // Log simple diagnostic info
      console.warn(`Firestore Permission Denied: ${error.context.operation} at ${error.context.path}`);
      
      toast({
        variant: "destructive",
        title: "Access Restricted",
        description: `Your current permissions do not allow ${error.context.operation} on this resource.`,
      });

      // In development, log the full context object clearly for debugging
      if (process.env.NODE_ENV === 'development') {
        console.dir(error.context);
      }
    };

    errorEmitter.on('permission-error', handlePermissionError);
    return () => {
      errorEmitter.off('permission-error', handlePermissionError);
    };
  }, [toast]);

  return null;
}