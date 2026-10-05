import { useLocalSearchParams } from "expo-router";
import { View } from "react-native";

import { AssignmentEditor } from "@/src/components/assignment-views";
import { StackHeader } from "@/src/components/screen-header";
import { useData } from "@/src/data/store";

export default function AssignmentFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { db } = useData();
  const existing = id ? db.assignments.find((item) => item.id === id) : undefined;
  return (
    <View style={{ flex: 1 }}>
      <StackHeader title={existing ? "Edit Homework" : "Add Homework"} />
      <AssignmentEditor assignmentId={existing?.id} />
    </View>
  );
}
