import { useLocalSearchParams, useRouter } from "expo-router";
import { Alert, ScrollView, View } from "react-native";

import { AssignmentDetailBody } from "@/src/components/assignment-views";
import { StackHeader } from "@/src/components/screen-header";
import { PrimaryButton, SecondaryButton } from "@/src/components/ui/controls";
import { EmptyState, useToast } from "@/src/components/ui/feedback";
import { useData } from "@/src/data/store";
import { makeStyles, spacing } from "@/src/theme";

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surfaceSecondary },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing["3xl"] },
}));

export default function AssignmentDetailScreen() {
  const s = useStyles();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { db, deleteAssignment } = useData();
  const toast = useToast();
  const item = db.assignments.find((row) => row.id === id);

  if (!item) {
    return (
      <View style={s.root}>
        <StackHeader title="Homework" />
        <EmptyState title="Homework not found" message="This homework is no longer available on this device." />
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
        <PrimaryButton
          label="Edit"
          onPress={() => router.push({ pathname: "/assignments/form", params: { id: item.id } })}
          testID="assignment-edit"
        />
        <SecondaryButton label="Delete" onPress={remove} testID="assignment-delete" />
      </ScrollView>
    </View>
  );
}
