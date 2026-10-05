import dayjs from "dayjs";
import {
  CalendarBlank,
  Megaphone,
  Newspaper,
  Note,
} from "phosphor-react-native";
import type { IconProps } from "phosphor-react-native";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { FilterChips } from "@/src/components/ui/controls";
import { EmptyState } from "@/src/components/ui/feedback";
import { Badge, Card, Tone } from "@/src/components/ui/primitives";
import { Announcement, AnnouncementCategory } from "@/src/data/types";
import { makeStyles, spacing, useTheme } from "@/src/theme";

type Icon = React.ComponentType<IconProps>;

const CATEGORY_META: Record<AnnouncementCategory, { icon: Icon; tone: Tone }> = {
  Notice: { icon: Note, tone: "info" },
  Announcement: { icon: Megaphone, tone: "warning" },
  Event: { icon: CalendarBlank, tone: "success" },
  Circular: { icon: Newspaper, tone: "neutral" },
};

const FILTERS = [
  { key: "all", label: "All" },
  { key: "Notice", label: "Notices" },
  { key: "Announcement", label: "Announcements" },
  { key: "Event", label: "Events" },
  { key: "Circular", label: "Circulars" },
];

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surfaceSecondary },
  filters: { backgroundColor: c.surface, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: c.border },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing["3xl"] },
  head: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.sm },
  iconWrap: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 15, fontWeight: "800", color: c.onSurface, flex: 1 },
  body: { fontSize: 14, color: c.onSurfaceSecondary, lineHeight: 20 },
  footer: { flexDirection: "row", justifyContent: "space-between", marginTop: spacing.md },
  footerText: { fontSize: 12, color: c.muted },
  detail: { fontSize: 22, fontWeight: "800", color: c.onSurface },
  detailBody: { fontSize: 15, lineHeight: 22, color: c.onSurface },
  meta: { fontSize: 13, fontWeight: "600", color: c.onSurfaceSecondary },
}));

export function CommunicationBrowser({
  items,
  onOpen,
  testID,
}: {
  items: Announcement[];
  onOpen: (id: string) => void;
  testID: string;
}) {
  const s = useStyles();
  const { colors } = useTheme();
  const [filter, setFilter] = useState("all");
  const visible = useMemo(
    () =>
      [...items]
        .filter((item) => (filter === "all" ? true : item.category === filter))
        .sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf()),
    [items, filter],
  );

  const bgFor = (tone: Tone) =>
    tone === "info" ? colors.infoSoft : tone === "warning" ? colors.warningSoft : tone === "success" ? colors.successSoft : colors.surfaceTertiary;
  const fgFor = (tone: Tone) =>
    tone === "info" ? colors.info : tone === "warning" ? colors.warning : tone === "success" ? colors.success : colors.muted;

  return (
    <View style={s.root} testID={testID}>
      <View style={s.filters}>
        <FilterChips options={FILTERS} selected={filter} onSelect={setFilter} testIDPrefix="notice-filter" />
      </View>
      {visible.length === 0 ? (
        <EmptyState
          icon={<Megaphone size={28} color={colors.brandPrimary} weight="duotone" />}
          title="No communication yet"
          message="Notices, announcements, events, and circulars for you will appear here."
        />
      ) : (
        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          {visible.map((item) => {
            const meta = CATEGORY_META[item.category];
            const Icon = meta.icon;
            return (
              <Pressable key={item.id} onPress={() => onOpen(item.id)}>
                <Card testID={`announcement-${item.id}`}>
                  <View style={s.head}>
                    <View style={[s.iconWrap, { backgroundColor: bgFor(meta.tone) }]}>
                      <Icon size={20} color={fgFor(meta.tone)} weight="fill" />
                    </View>
                    <Text style={s.title}>{item.title}</Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm }}>
                    <Badge label={item.category} tone={meta.tone} />
                    <Text style={s.footerText}>{dayjs(item.date).format("DD MMM YYYY")}</Text>
                  </View>
                  <Text style={s.body}>{item.body}</Text>
                  <View style={s.footer}>
                    <Text style={s.footerText}>To: {item.audience}</Text>
                    <Text style={s.footerText}>{item.author}</Text>
                  </View>
                </Card>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

export function CommunicationReadView({ item }: { item: Announcement }) {
  const s = useStyles();
  const tone = CATEGORY_META[item.category].tone;
  return (
    <Card>
      <View style={{ gap: spacing.md }}>
        <Badge label={item.category} tone={tone} />
        <Text style={s.detail}>{item.title}</Text>
        <Text style={s.meta}>{dayjs(item.date).format("DD MMM YYYY")}</Text>
        <Text style={s.detailBody}>{item.body}</Text>
        <Text style={s.meta}>To: {item.audience}</Text>
        <Text style={s.meta}>{item.author}</Text>
      </View>
    </Card>
  );
}
