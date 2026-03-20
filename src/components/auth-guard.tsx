"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUser, useFirestore, useAuth } from "@/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { logout } from "@/services/auth-service";
import { isBlocked, UserProfile } from "@/services/user-service";

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

    const userRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const userData = { uid: snapshot.id, ...snapshot.data() } as UserProfile;
        
        if (isBlocked(userData)) {
          logout(auth).then(() => {
            toast({
              variant: "destructive",
              title: "Session Terminated",
              description: "Your account has been deactivated by an administrator.",
            });
            router.push("/");
          });
          return;
        }

        if (allowedRoles && !allowedRoles.includes(userData.role)) {
          toast({
            variant: "destructive",
            title: "Access Restricted",
            description: "You do not have permission to view this section.",
          });
          router.push(userData.role === "admin" ? "/admin/dashboard" : "/professor");
          return;
        }

        setAuthorized(true);
      } else {
        setAuthorized(true);
      }
      setRoleLoading(false);
    }, (error) => {
      console.error("AuthGuard Status Listener Error:", error);
      setRoleLoading(false);
    });

    return () => unsubscribe();
  }, [user, authLoading, db, auth, allowedRoles, router, pathname, toast]);

  if (authLoading || (user && roleLoading)) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="animate-spin text-primary" size={40} />
        <p className="text-sm font-medium text-slate-400">Securing your session...</p>
      </div>
    );
  }

  if (authorized || (!user && ["/", "/login"].includes(pathname))) {
    return <>{children}</>;
  }

  return null;
}