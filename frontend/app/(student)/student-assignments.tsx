import { useRouter } from "expo-router";
import { Notebook } from "phosphor-react-native";
import { ScrollView, View } from "react-native";

import { useLiveStudent } from "@/src/auth/use-live-student";
import { AssignmentListCard } from "@/src/components/assignment-views";
import { StackHeader } from "@/src/components/screen-header";
import { EmptyState, LoadingView } from "@/src/components/ui/feedback";
import { assignmentsForSection } from "@/src/data/assignments";
import { className, sectionName } from "@/src/data/compute";
import { useData } from "@/src/data/store";
import { makeStyles, spacing, useTheme } from "@/src/theme";

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surfaceSecondary },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing["3xl"] },
}));

export default function StudentAssignmentsScreen() {
  const s = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const { db } = useData();
  const { student, ready } = useLiveStudent();

  if (!ready || !student) {
    return (
      <View style={s.root}>
        <LoadingView />
      </View>
    );
  }

  const items = assignmentsForSection(db, student.sectionId);

  return (
    <View style={s.root} testID="student-assignment-list">
      <StackHeader
        title="Homework"
        subtitle={`${className(db, student.classId)} — ${sectionName(db, student.sectionId)}`}
      />
      {items.length === 0 ? (
        <EmptyState
          icon={<Notebook size={28} color={colors.brandPrimary} weight="duotone" />}
          title="No homework yet"
          message="Homework for your class will appear here."
        />
      ) : (
        <ScrollView contentContainerStyle={s.content}>
          {items.map((item) => (
            <AssignmentListCard
              key={item.id}
              item={item}
              onPress={() => router.push({ pathname: "/student-assignment/[id]", params: { id: item.id } })}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}
