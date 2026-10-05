import { useRouter } from "expo-router";
import { useMemo } from "react";
import { View } from "react-native";

import { CommunicationBrowser } from "@/src/components/communication-views";
import { StackHeader } from "@/src/components/screen-header";
import { announcementVisibleTo } from "@/src/data/announcements";
import { useData } from "@/src/data/store";
import { makeStyles } from "@/src/theme";

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surfaceSecondary },
}));

export default function StudentAnnouncementsScreen() {
  const s = useStyles();
  const router = useRouter();
  const { db } = useData();
  const items = useMemo(
    () => db.announcements.filter((item) => announcementVisibleTo(item.audience, "Student")),
    [db.announcements],
  );

  return (
    <View style={s.root}>
      <StackHeader title="Communication" subtitle="Notices, events & circulars" />
      <CommunicationBrowser
        items={items}
        testID="student-communication"
        onOpen={(id) => router.push({ pathname: "/student-announcement/[id]", params: { id } })}
      />
    </View>
  );
}
