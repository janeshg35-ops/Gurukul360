import { useMemo } from "react";
import { ScrollView, View } from "react-native";

import { useLiveStudent } from "@/src/auth/use-live-student";
import { TimetablePeriodList } from "@/src/components/timetable-views";
import { StackHeader } from "@/src/components/screen-header";
import { LoadingView } from "@/src/components/ui/feedback";
import { className, sectionName } from "@/src/data/compute";
import { useData } from "@/src/data/store";
import { makeStyles, spacing } from "@/src/theme";

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surfaceSecondary },
  content: { padding: spacing.lg, paddingBottom: spacing["3xl"] },
}));

export default function StudentTimetableScreen() {
  const s = useStyles();
  const { db } = useData();
  const { student, ready } = useLiveStudent();
  const entries = useMemo(
    () => (student ? db.timetable.filter((entry) => entry.sectionId === student.sectionId) : []),
    [db.timetable, student],
  );

  if (!ready || !student) {
    return (
      <View style={s.root}>
        <LoadingView />
      </View>
    );
  }

  const subtitle = `${className(db, student.classId)}-${sectionName(db, student.sectionId)}`;

  return (
    <View style={s.root} testID="student-timetable">
      <StackHeader title="Timetable" subtitle={subtitle} />
      <ScrollView contentContainerStyle={s.content}>
        <TimetablePeriodList entries={entries} db={db} mode="section" showTeacher showClass={false} />
      </ScrollView>
    </View>
  );
}
