import { useMemo } from "react";
import { ScrollView, View } from "react-native";

import { useLiveTeacher } from "@/src/auth/use-live-teacher";
import { TimetablePeriodList } from "@/src/components/timetable-views";
import { StackHeader } from "@/src/components/screen-header";
import { EmptyState, LoadingView } from "@/src/components/ui/feedback";
import { useData } from "@/src/data/store";
import { makeStyles, spacing } from "@/src/theme";

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surfaceSecondary },
  content: { padding: spacing.lg, paddingBottom: spacing["3xl"] },
}));

export default function MyTimetableScreen() {
  const s = useStyles();
  const { db } = useData();
  const { teacher, ready } = useLiveTeacher();
  const entries = useMemo(
    () => (teacher ? db.timetable.filter((entry) => entry.teacherId === teacher.id) : []),
    [db.timetable, teacher],
  );

  if (!ready || !teacher) {
    return (
      <View style={s.root}>
        <LoadingView />
      </View>
    );
  }

  return (
    <View style={s.root} testID="teacher-timetable">
      <StackHeader title="Timetable" subtitle={teacher.name} />
      {entries.length === 0 ? (
        <EmptyState title="No teaching periods yet" message="Assembly and recess stay on the school day. Your classes appear here when they are scheduled." />
      ) : null}
      <ScrollView contentContainerStyle={s.content}>
        <TimetablePeriodList entries={entries} db={db} mode="teacher" showTeacher={false} showClass />
      </ScrollView>
    </View>
  );
}
