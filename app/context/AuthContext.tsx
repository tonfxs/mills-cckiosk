"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../lib/firebase/config";
import {
  loginWithEmail,
  loginWithGoogle,
  logout,
  registerWithEmail,
  resetPassword,
} from "../lib/firebase/auth";
import {
  createUserProfile,
  getUserProfile,
  updateLastLogin,
} from "../services/userService";
import { UserProfile, UserRole } from "../types/user";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;   // full Firestore profile
  role: UserRole | null;         // quick access to role
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string, name?: string) => Promise<User>;
  loginGoogle: () => Promise<User>;
  logOut: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch Firestore profile whenever auth user changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        try {
          const userProfile = await getUserProfile(firebaseUser.uid);
          setProfile(userProfile);
        } catch (err) {
          console.error("Failed to fetch user profile:", err);
          setProfile(null);
        }
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // ─── Register: create Auth user + Firestore doc ──────────────────────────
  const register = async (email: string, password: string, name?: string) => {
    const user = await registerWithEmail(email, password, name);
    await createUserProfile(user.uid, email, name ?? email.split("@")[0]);
    const userProfile = await getUserProfile(user.uid);
    setProfile(userProfile);
    return user;
  };

  // ─── Login: sign in + fetch profile + update lastLogin ───────────────────
  const login = async (email: string, password: string) => {
    const user = await loginWithEmail(email, password);
    await updateLastLogin(user.uid);
    const userProfile = await getUserProfile(user.uid);
    setProfile(userProfile);
    return user;
  };

  // ─── Google login: create profile if first time ──────────────────────────
  const loginGoogle = async () => {
    const user = await loginWithGoogle();
    const existing = await getUserProfile(user.uid);

    if (!existing) {
      // First time Google login — create their Firestore doc
      await createUserProfile(
        user.uid,
        user.email ?? "",
        user.displayName ?? user.email?.split("@")[0] ?? "User"
      );
    } else {
      await updateLastLogin(user.uid);
    }

    const userProfile = await getUserProfile(user.uid);
    setProfile(userProfile);
    return user;
  };

  // ─── Logout: clear everything ────────────────────────────────────────────
  const logOut = async () => {
    await logout();
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role: profile?.role ?? null,
        loading,
        login,
        register,
        loginGoogle,
        logOut,
        forgotPassword: resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}