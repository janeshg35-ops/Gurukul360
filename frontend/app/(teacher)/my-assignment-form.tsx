import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";

import { useLiveTeacher } from "@/src/auth/use-live-teacher";
import { AssignmentEditor } from "@/src/components/assignment-views";
import { StackHeader } from "@/src/components/screen-header";
import { LoadingView } from "@/src/components/ui/feedback";
import { useData } from "@/src/data/store";
import { makeStyles, radius, spacing } from "@/src/theme";

const NO_SECTION =
  "You are currently not assigned to a class section. Your existing assigned homework can still be viewed.";

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surfaceSecondary },
  note: {
    margin: spacing.lg,
    backgroundColor: c.brandTertiary,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  noteText: { fontSize: 14, lineHeight: 20, fontWeight: "600", color: c.onBrandTertiary },
}));

export default function MyAssignmentFormScreen() {
  const s = useStyles();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { db } = useData();
  const { teacher, ready } = useLiveTeacher();

  if (!ready || !teacher) {
    return (
      <View style={s.root}>
        <LoadingView />
      </View>
    );
  }

  const existing = id ? db.assignments.find((item) => item.id === id) : undefined;
  const owns = !!existing && existing.teacherId === teacher.id;
  const blocked = existing ? !owns : !teacher.classTeacherOf;

  return (
    <View style={s.root}>
      <StackHeader title={existing ? "Edit Homework" : "Add Homework"} />
      {blocked ? (
        <View style={s.note}>
          <Text style={s.noteText}>
            {existing && existing.teacherId !== teacher.id
              ? "You can view this homework, but only the teacher who owns it can change it."
              : NO_SECTION}
          </Text>
        </View>
      ) : (
        <AssignmentEditor teacher={teacher} assignmentId={existing?.id} />
      )}
    </View>
  );
}
