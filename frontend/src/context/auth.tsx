import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { PRINCIPAL, PRINCIPAL_CREDENTIALS } from "@/src/constants/branding";
import { storage } from "@/src/utils/storage";

const SESSION_KEY = "gurukul360.session.v1";

export interface SessionUser {
  name: string;
  role: string;
  email: string;
}

interface AuthContextValue {
  user: SessionUser | null;
  ready: boolean;
  signIn: (username: string, password: string) => { ok: boolean; error?: string };
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

  const signIn = useCallback((username: string, password: string) => {
    const u = username.trim().toLowerCase();
    const p = password;
    if (!u || !p) {
      return { ok: false, error: "Please enter both username and password." };
    }
    if (
      u === PRINCIPAL_CREDENTIALS.username.toLowerCase() &&
      p === PRINCIPAL_CREDENTIALS.password
    ) {
      const session: SessionUser = {
        name: PRINCIPAL.name,
        role: PRINCIPAL.role,
        email: PRINCIPAL.email,
      };
      setUser(session);
      storage.secureSet(SESSION_KEY, JSON.stringify(session));
      return { ok: true };
    }
    return { ok: false, error: "Invalid credentials. Please try again." };
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
