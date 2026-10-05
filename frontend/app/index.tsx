import { useEffect } from "react";
import { Redirect } from "expo-router";
import { View } from "react-native";

import { isLiveStudentSession, isLiveTeacherSession } from "@/src/auth/session";
import { LoadingView } from "@/src/components/ui/feedback";
import { useAuth } from "@/src/context/auth";
import { useData } from "@/src/data/store";
import { useTheme } from "@/src/theme";

export default function Index() {
  const { user, ready: authReady, signOut } = useAuth();
  const { db, ready: dataReady } = useData();
  const { colors } = useTheme();
  const teacherSession = user?.role === "Teacher";
  const studentSession = user?.role === "Student";
  const teacherLive = user ? isLiveTeacherSession(user, db.teachers) : false;
  const studentLive = user ? isLiveStudentSession(user, db.students) : false;
  const dropSession =
    authReady && dataReady && ((teacherSession && !teacherLive) || (studentSession && !studentLive));

  useEffect(() => {
    if (dropSession) signOut();
  }, [dropSession, signOut]);

  if (!authReady || !dataReady || dropSession) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.surface }}>
        <LoadingView label="Loading Gurukul360\u2026" />
      </View>
    );
  }

  if (!user) return <Redirect href="/login" />;
  if (teacherSession) return <Redirect href="/(teacher)" />;
  if (studentSession) return <Redirect href="/(student)" />;
  return <Redirect href="/(tabs)" />;
}
