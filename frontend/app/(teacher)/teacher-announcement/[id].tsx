import { useLocalSearchParams } from "expo-router";
import { ScrollView, View } from "react-native";

import { CommunicationReadView } from "@/src/components/communication-views";
import { StackHeader } from "@/src/components/screen-header";
import { EmptyState } from "@/src/components/ui/feedback";
import { announcementVisibleTo } from "@/src/data/announcements";
import { useData } from "@/src/data/store";
import { makeStyles, spacing } from "@/src/theme";

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surfaceSecondary },
  content: { padding: spacing.lg, paddingBottom: spacing["3xl"] },
}));

export default function TeacherAnnouncementScreen() {
  const s = useStyles();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { db } = useData();
  const item = db.announcements.find((row) => row.id === id && announcementVisibleTo(row.audience, "Teacher"));

  if (!item) {
    return (
      <View style={s.root}>
        <StackHeader title="Communication" />
        <EmptyState title="Communication not found" message="This item is no longer available on this device." />
      </View>
    );
  }

  return (
    <View style={s.root} testID="teacher-communication-detail">
      <StackHeader title="Communication" subtitle={item.category} />
      <ScrollView contentContainerStyle={s.content}>
        <CommunicationReadView item={item} />
      </ScrollView>
    </View>
  );
}
