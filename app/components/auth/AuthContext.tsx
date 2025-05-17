"use client";
import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "../../../firebase.client";
import { setAuthCookie, clearAuthCookie } from "./AuthCookieHandler";

interface AuthContextType {
  user: any;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>({
  user: null,
  loading: true,
  signIn: () => Promise.resolve(),
  signOut: () => Promise.resolve(),
});

export function AuthProvider({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    try {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setUser(user);
        setLoading(false);
        if (!user) {
          // Only redirect if we're not already on the sign-in page
          if (window.location.pathname !== "/signin") {
            router.push("/signin");
          }
        }
      });
      return unsubscribe;
    } catch (error) {
      console.error("Auth state initialization error:", error);
      setUser(null);
      setLoading(false);
      // Don't redirect here - let the middleware handle it
      return () => {};
    }
  }, [router]);

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await firebaseSignOut(auth);
      await clearAuthCookie();
      setUser(null);
      router.push("/signin");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await setAuthCookie(result.user.uid);
      router.push("/");
    } catch (error) {
      console.error("Sign in error:", error);
      throw error;
    }
  };

  const signOut = async () => {
    await handleSignOut();
    try {
      await auth.signOut();
    } catch (error) {
      console.error("Sign out error:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
