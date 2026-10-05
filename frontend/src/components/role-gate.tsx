import { useRootNavigationState, useRouter, useSegments } from "expo-router";
import { useEffect, type ReactNode } from "react";

import { isLiveTeacherSession, nextRoute } from "@/src/auth/session";
import { useAuth } from "@/src/context/auth";
import { useData } from "@/src/data/store";

export function RoleGate({ children }: { children: ReactNode }) {
  const { user, ready: authReady, signOut } = useAuth();
  const { db, ready: dataReady } = useData();
  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState();
  const top = segments[0];

  useEffect(() => {
    if (!authReady || !dataReady || !navigationState?.key) return;
    if (user?.role === "Teacher" && !isLiveTeacherSession(user, db.teachers)) {
      signOut();
      if (top !== "login") router.replace("/login");
      return;
    }
    const dest = nextRoute(user, top);
    if (dest) router.replace(dest);
  }, [authReady, dataReady, navigationState?.key, user, db.teachers, top, signOut, router]);

  return children;
}
