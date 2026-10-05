import { useLocalSearchParams, useRouter } from "expo-router";
import { Alert, ScrollView, View } from "react-native";

import { useLiveTeacher } from "@/src/auth/use-live-teacher";
import { AssignmentDetailBody } from "@/src/components/assignment-views";
import { StackHeader } from "@/src/components/screen-header";
import { PrimaryButton, SecondaryButton } from "@/src/components/ui/controls";
import { EmptyState, LoadingView, useToast } from "@/src/components/ui/feedback";
import { useData } from "@/src/data/store";
import { makeStyles, spacing } from "@/src/theme";

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surfaceSecondary },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing["3xl"] },
}));

export default function MyAssignmentDetailScreen() {
  const s = useStyles();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { db, deleteAssignment } = useData();
  const { teacher, ready } = useLiveTeacher();
  const toast = useToast();

  if (!ready || !teacher) {
    return (
      <View style={s.root}>
        <LoadingView />
      </View>
    );
  }

  const item = db.assignments.find((row) => row.id === id);
  const visible = !!item && (item.teacherId === teacher.id || item.sectionId === teacher.classTeacherOf);
  const owns = !!item && item.teacherId === teacher.id;

  if (!item || !visible) {
    return (
      <View style={s.root}>
        <StackHeader title="Homework" />
        <EmptyState title="Homework not found" message="This homework is outside your classes and subjects." />
      </View>
    );
  }

  const remove = () => {
    Alert.alert("Delete homework?", "This removes the homework for this class.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deleteAssignment(item.id);
          toast.show("Homework deleted", "info");
          router.back();
        },
      },
    ]);
  };

  return (
    <View style={s.root}>
      <StackHeader title="Homework" />
      <ScrollView contentContainerStyle={s.content}>
        <AssignmentDetailBody item={item} />
        {owns ? (
          <>
            <PrimaryButton
              label="Edit"
              onPress={() => router.push({ pathname: "/my-assignment-form", params: { id: item.id } })}
              testID="teacher-assignment-edit"
            />
            <SecondaryButton label="Delete" onPress={remove} testID="teacher-assignment-delete" />
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}
