import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { authenticate, SessionUser } from "@/src/auth/session";
import { Teacher, Student } from "@/src/data/types";
import { storage } from "@/src/utils/storage";

const SESSION_KEY = "gurukul360.session.v1";

export type { SessionUser };

interface AuthContextValue {
  user: SessionUser | null;
  ready: boolean;
  signIn: (
    username: string,
    password: string,
    teachers?: Teacher[],
    students?: Student[],
  ) => { ok: boolean; error?: string; role?: "Principal" | "Teacher" | "Student" };
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const raw = await storage.secureGet<string>(SESSION_KEY, "");
      if (mounted) {
        if (raw) {
          try {
            setUser(JSON.parse(raw) as SessionUser);
          } catch {
            // ignore
          }
        }
        setReady(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const signIn = useCallback((
    username: string,
    password: string,
    teachers: Teacher[] = [],
    students: Student[] = [],
  ) => {
    const res = authenticate(username, password, teachers, students);
    if (!res.ok) return { ok: false as const, error: res.error };
    setUser(res.session);
    storage.secureSet(SESSION_KEY, JSON.stringify(res.session));
    return { ok: true as const, role: res.role };
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    storage.secureRemove(SESSION_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ user, ready, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
