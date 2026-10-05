import { useLocalSearchParams } from "expo-router";
import { ScrollView, View } from "react-native";

import { useLiveStudent } from "@/src/auth/use-live-student";
import { AssignmentDetailBody } from "@/src/components/assignment-views";
import { StackHeader } from "@/src/components/screen-header";
import { EmptyState, LoadingView } from "@/src/components/ui/feedback";
import { useData } from "@/src/data/store";
import { makeStyles, spacing } from "@/src/theme";

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surfaceSecondary },
  content: { padding: spacing.lg, paddingBottom: spacing["3xl"] },
}));

export default function StudentAssignmentDetailScreen() {
  const s = useStyles();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { db } = useData();
  const { student, ready } = useLiveStudent();

  if (!ready || !student) {
    return (
      <View style={s.root}>
        <LoadingView />
      </View>
    );
  }

  const item = db.assignments.find((row) => row.id === id && row.sectionId === student.sectionId);

  if (!item) {
    return (
      <View style={s.root}>
        <StackHeader title="Homework" />
        <EmptyState title="Homework not found" message="This homework is no longer available on this device." />
      </View>
    );
  }

  return (
    <View style={s.root}>
      <StackHeader title="Homework" />
      <ScrollView contentContainerStyle={s.content}>
        <AssignmentDetailBody item={item} />
      </ScrollView>
    </View>
  );
}
