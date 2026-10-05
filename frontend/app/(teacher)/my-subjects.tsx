import { ScrollView, Text, View } from "react-native";

import { useLiveTeacher } from "@/src/auth/use-live-teacher";
import { StackHeader } from "@/src/components/screen-header";
import { EmptyState, LoadingView } from "@/src/components/ui/feedback";
import { Card, Divider } from "@/src/components/ui/primitives";
import { useData } from "@/src/data/store";
import { subjectNames } from "@/src/data/teachers";
import { makeStyles, spacing } from "@/src/theme";

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surfaceSecondary },
  content: { padding: spacing.lg, paddingBottom: spacing["3xl"] },
  row: { paddingVertical: spacing.md },
  name: { fontSize: 16, fontWeight: "700", color: c.onSurface },
}));

export default function MySubjects() {
  const s = useStyles();
  const { db } = useData();
  const { teacher, ready } = useLiveTeacher();

  if (!ready || !teacher) {
    return (
      <View style={s.root}>
        <LoadingView />
      </View>
    );
  }

  const subjects = subjectNames(db, teacher.subjectIds);

  return (
    <View style={s.root}>
      <StackHeader title="My Subjects" subtitle={teacher.name} />
      {subjects.length === 0 ? (
        <EmptyState title="No subjects assigned" message="Your principal assigns subjects." />
      ) : (
        <ScrollView contentContainerStyle={s.content}>
          <Card testID="teacher-subject-list">
            {subjects.map((name, index) => (
              <View key={name}>
                {index > 0 ? <Divider /> : null}
                <View style={s.row}>
                  <Text style={s.name}>{name}</Text>
                </View>
              </View>
            ))}
          </Card>
        </ScrollView>
      )}
    </View>
  );
}
