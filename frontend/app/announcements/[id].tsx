import dayjs from "dayjs";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Alert, ScrollView, Text, View } from "react-native";

import { StackHeader } from "@/src/components/screen-header";
import { PrimaryButton, SecondaryButton } from "@/src/components/ui/controls";
import { EmptyState, useToast } from "@/src/components/ui/feedback";
import { Badge, Card } from "@/src/components/ui/primitives";
import { useData } from "@/src/data/store";
import { makeStyles, spacing, useTheme } from "@/src/theme";

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surfaceSecondary },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing["3xl"] },
  title: { fontSize: 22, fontWeight: "800", color: c.onSurface },
  body: { fontSize: 15, lineHeight: 22, color: c.onSurface },
  meta: { fontSize: 13, fontWeight: "600", color: c.onSurfaceSecondary },
}));

export default function CommunicationDetailScreen() {
  const s = useStyles();
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { db, deleteAnnouncement } = useData();
  const toast = useToast();
  const item = db.announcements.find((row) => row.id === id);

  if (!item) {
    return (
      <View style={s.root}>
        <StackHeader title="Communication" />
        <EmptyState title="Communication not found" message="This item is no longer available on this device." />
      </View>
    );
  }

  const remove = () => {
    Alert.alert("Delete this communication?", "It will be removed from the school list.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deleteAnnouncement(item.id);
          toast.show("Communication deleted", "info");
          router.back();
        },
      },
    ]);
  };

  return (
    <View style={s.root} testID="communication-detail">
      <StackHeader title="Communication" subtitle={item.category} />
      <ScrollView contentContainerStyle={s.content}>
        <Card>
          <View style={{ gap: spacing.md }}>
            <Badge label={item.category} tone={item.category === "Event" ? "success" : item.category === "Announcement" ? "warning" : item.category === "Notice" ? "info" : "neutral"} />
            <Text style={s.title}>{item.title}</Text>
            <Text style={s.meta}>{dayjs(item.date).format("DD MMM YYYY")}</Text>
            <Text style={s.body}>{item.body}</Text>
            <Text style={[s.meta, { color: colors.onSurfaceSecondary }]}>To: {item.audience}</Text>
            <Text style={s.meta}>{item.author}</Text>
          </View>
        </Card>
        <PrimaryButton
          label="Edit"
          onPress={() => router.push({ pathname: "/announcements/form", params: { id: item.id } })}
          testID="communication-edit"
        />
        <SecondaryButton label="Delete" onPress={remove} testID="communication-delete" />
      </ScrollView>
    </View>
  );
}
