
"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUser, useFirestore, useAuth } from "@/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: ("admin" | "professor")[];
}

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [roleLoading, setRoleLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      if (pathname !== "/" && pathname !== "/login") {
        router.push("/");
      }
      setRoleLoading(false);
      return;
    }

    if (!db || !auth) return;

    const userRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        const userData = doc.data();
        
        if (userData.status === "blocked") {
          signOut(auth).then(() => {
            toast({
              variant: "destructive",
              title: "Session Terminated",
              description: "Your account has been blocked.",
            });
            router.push("/");
          });
          return;
        }

        if (allowedRoles && !allowedRoles.includes(userData.role)) {
          toast({
            variant: "destructive",
            title: "Unauthorized",
            description: "You do not have permission to access this area.",
          });
          router.push(userData.role === "admin" ? "/admin/dashboard" : "/professor");
          return;
        }

        setAuthorized(true);
      } else {
        // If profile doesn't exist (shouldn't happen with correct login flow)
        signOut(auth);
        router.push("/");
      }
      setRoleLoading(false);
    }, (error) => {
      console.error("AuthGuard Snapshot error:", error);
      setRoleLoading(false);
    });

    return () => unsubscribe();
  }, [user, authLoading, db, auth, allowedRoles, router, pathname, toast]);

  if (authLoading || roleLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="animate-spin text-primary" size={40} />
        <p className="text-sm font-medium text-slate-400">Verifying session...</p>
      </div>
    );
  }

  if (!user && (pathname === "/" || pathname === "/login")) {
    return <>{children}</>;
  }

  return authorized ? <>{children}</> : null;
}
