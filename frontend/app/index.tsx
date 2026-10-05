import { useEffect } from "react";
import { Redirect } from "expo-router";
import { View } from "react-native";

import { isLiveTeacherSession } from "@/src/auth/session";
import { LoadingView } from "@/src/components/ui/feedback";
import { useAuth } from "@/src/context/auth";
import { useData } from "@/src/data/store";
import { useTheme } from "@/src/theme";

export default function Index() {
  const { user, ready: authReady, signOut } = useAuth();
  const { db, ready: dataReady } = useData();
  const { colors } = useTheme();
  const teacherSession = user?.role === "Teacher";
  const teacherLive = user ? isLiveTeacherSession(user, db.teachers) : false;
  const dropTeacher = authReady && dataReady && teacherSession && !teacherLive;

  useEffect(() => {
    if (dropTeacher) signOut();
  }, [dropTeacher, signOut]);

  if (!authReady || !dataReady || dropTeacher) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.surface }}>
        <LoadingView label="Loading Gurukul360\u2026" />
      </View>
    );
  }

  if (!user) return <Redirect href="/login" />;
  if (teacherSession) return <Redirect href="/(teacher)" />;
  return <Redirect href="/(tabs)" />;
}
