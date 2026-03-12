
"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, ShieldCheck, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAuth, useFirestore } from "@/firebase";
import { signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleRequest = searchParams.get("role") || "professor";
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const auth = useAuth();
  const db = useFirestore();
  const { toast } = useToast();

  const handleGoogleLogin = async () => {
    if (!auth || !db) return;
    
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ hd: "neu.edu.ph" });

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      if (!user.email?.endsWith("@neu.edu.ph") && user.email !== "admin@neu.edu.ph") {
        await signOut(auth);
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "Please use your @neu.edu.ph institutional email.",
        });
        setIsLoading(false);
        return;
      }

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      let role = "professor";
      if (user.email === "admin@neu.edu.ph") {
        role = "admin";
      }

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          role: role,
          status: "active",
          name: user.displayName,
          photoURL: user.photoURL,
          createdAt: serverTimestamp(),
        });
      } else {
        const userData = userSnap.data();
        if (userData.status === "blocked") {
          await signOut(auth);
          toast({
            variant: "destructive",
            title: "Account Blocked",
            description: "Your account has been deactivated by an administrator.",
          });
          setIsLoading(false);
          return;
        }
        role = userData.role;
      }

      router.push(role === "admin" ? "/admin/dashboard" : "/professor");
    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message || "An unexpected error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminPasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Notice",
      description: "For this sprint, please use Google Sign-in with admin@neu.edu.ph",
    });
  };

  return (
    <Card className="w-full max-w-md shadow-xl border-none">
      <CardHeader className="space-y-1 text-center">
        <div className="mx-auto w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white mb-2">
          {roleRequest === "admin" ? <ShieldCheck size={24} /> : <GraduationCap size={24} />}
        </div>
        <CardTitle className="text-2xl font-headline">
          {roleRequest === "admin" ? "Admin Login" : "Professor Login"}
        </CardTitle>
        <CardDescription>
          {roleRequest === "admin" 
            ? "Access the laboratory management portal" 
            : "Sign in with your institutional Google account"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4">
          <Button 
            variant="outline" 
            className="w-full h-12 flex items-center justify-center gap-3 bg-white hover:bg-slate-50 border-slate-200"
            onClick={handleGoogleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            )}
            Continue with Google
          </Button>

          {roleRequest === "admin" && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-muted-foreground">Or password login</span>
                </div>
              </div>
              <form onSubmit={handleAdminPasswordLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Admin Email</Label>
                  <Input id="email" type="email" placeholder="admin@neu.edu.ph" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full h-11" disabled={isLoading}>Sign In</Button>
              </form>
            </>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col text-center">
        <p className="text-xs text-muted-foreground">
          {roleRequest === "professor" 
            ? "Access restricted to authorized NEU faculty only." 
            : "Unauthorized access attempt is logged."}
        </p>
      </CardFooter>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
        <ArrowLeft size={16} />
        Back to Home
      </Link>

      <Suspense fallback={<Loader2 className="animate-spin text-primary" size={40} />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
