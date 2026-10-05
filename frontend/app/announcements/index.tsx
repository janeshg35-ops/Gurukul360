import dayjs from "dayjs";
import {
  CalendarBlank,
  Megaphone,
  Newspaper,
  Note,
} from "phosphor-react-native";
import type { IconProps } from "phosphor-react-native";
import { useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";

import { StackHeader } from "@/src/components/screen-header";
import { FilterChips } from "@/src/components/ui/controls";
import { Badge, Card, Tone } from "@/src/components/ui/primitives";
import { useData } from "@/src/data/store";
import { AnnouncementCategory } from "@/src/data/types";
import { makeStyles, spacing, useTheme } from "@/src/theme";

type Icon = React.ComponentType<IconProps>;

const CATEGORY_META: Record<AnnouncementCategory, { icon: Icon; tone: Tone }> = {
  Notice: { icon: Note, tone: "info" },
  Announcement: { icon: Megaphone, tone: "warning" },
  Event: { icon: CalendarBlank, tone: "success" },
  Circular: { icon: Newspaper, tone: "neutral" },
};

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surfaceSecondary },
  filters: { backgroundColor: c.surface, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: c.border },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing["3xl"] },
  head: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.sm },
  iconWrap: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 15, fontWeight: "800", color: c.onSurface, flex: 1 },
  meta: { fontSize: 12, color: c.muted, marginBottom: spacing.sm },
  body: { fontSize: 14, color: c.onSurfaceSecondary, lineHeight: 20 },
  footer: { flexDirection: "row", justifyContent: "space-between", marginTop: spacing.md },
  footerText: { fontSize: 12, color: c.muted },
}));

export default function AnnouncementsScreen() {
  const s = useStyles();
  const { colors } = useTheme();
  const { db } = useData();
  const [filter, setFilter] = useState<string>("all");

  const options = [
    { key: "all", label: "All" },
    { key: "Notice", label: "Notices" },
    { key: "Announcement", label: "Announcements" },
    { key: "Event", label: "Events" },
    { key: "Circular", label: "Circulars" },
  ];

  const items = useMemo(
    () =>
      [...db.announcements]
        .filter((a) => (filter === "all" ? true : a.category === filter))
        .sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf()),
    [db.announcements, filter],
  );

  const bgFor = (tone: Tone) =>
    tone === "info" ? colors.infoSoft : tone === "warning" ? colors.warningSoft : tone === "success" ? colors.successSoft : colors.surfaceTertiary;
  const fgFor = (tone: Tone) =>
    tone === "info" ? colors.info : tone === "warning" ? colors.warning : tone === "success" ? colors.success : colors.muted;

  return (
    <View style={s.root}>
      <StackHeader title="Communication" subtitle="Notices, events & circulars" />
      <View style={s.filters}>
        <FilterChips options={options} selected={filter} onSelect={setFilter} testIDPrefix="notice-filter" />
      </View>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {items.map((a) => {
          const meta = CATEGORY_META[a.category];
          const Icon = meta.icon;
          return (
            <Card key={a.id} testID={`announcement-${a.id}`}>
              <View style={s.head}>
                <View style={[s.iconWrap, { backgroundColor: bgFor(meta.tone) }]}>
                  <Icon size={20} color={fgFor(meta.tone)} weight="fill" />
                </View>
                <Text style={s.title}>{a.title}</Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm }}>
                <Badge label={a.category} tone={meta.tone} />
                <Text style={s.footerText}>{dayjs(a.date).format("DD MMM YYYY")}</Text>
              </View>
              <Text style={s.body}>{a.body}</Text>
              <View style={s.footer}>
                <Text style={s.footerText}>To: {a.audience}</Text>
                <Text style={s.footerText}>{a.author}</Text>
              </View>
            </Card>
          );
        })}
      </ScrollView>
    </View>
  );
}
