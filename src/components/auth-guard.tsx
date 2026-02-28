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

    // Public routes that don't need auth
    const publicRoutes = ["/", "/login"];
    const isPublicRoute = publicRoutes.includes(pathname);

    if (!user) {
      if (!isPublicRoute) {
        router.push("/");
      }
      setRoleLoading(false);
      return;
    }

    if (!db || !auth) return;

    // Real-time check of user profile and role
    const userRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const userData = snapshot.data();
        
        // Blocked status check: Sign out immediately
        if (userData.status === "blocked") {
          signOut(auth).then(() => {
            toast({
              variant: "destructive",
              title: "Session Terminated",
              description: "Your account has been deactivated by an administrator.",
            });
            router.push("/");
          });
          return;
        }

        // Role authorization check
        if (allowedRoles && !allowedRoles.includes(userData.role)) {
          toast({
            variant: "destructive",
            title: "Access Restricted",
            description: "You do not have permission to view this section.",
          });
          // Redirect to their default dashboard
          router.push(userData.role === "admin" ? "/admin/dashboard" : "/professor");
          return;
        }

        setAuthorized(true);
      } else {
        // Profiling failure: Should be handled at login, but fallback here
        signOut(auth);
        router.push("/");
      }
      setRoleLoading(false);
    }, (error) => {
      console.error("AuthGuard Status Listener Error:", error);
      setRoleLoading(false);
    });

    return () => unsubscribe();
  }, [user, authLoading, db, auth, allowedRoles, router, pathname, toast]);

  if (authLoading || roleLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="animate-spin text-primary" size={40} />
        <p className="text-sm font-medium text-slate-400">Securing your session...</p>
      </div>
    );
  }

  // Allow children if authorized or if on a public route without a user
  if (authorized || (!user && ["/", "/login"].includes(pathname))) {
    return <>{children}</>;
  }

  return null;
}