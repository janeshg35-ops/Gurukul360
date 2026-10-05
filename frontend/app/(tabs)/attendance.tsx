import dayjs from "dayjs";
import { useRouter } from "expo-router";
import { CaretLeft, CaretRight } from "phosphor-react-native";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { BrandHeader } from "@/src/components/screen-header";
import { Badge, Card } from "@/src/components/ui/primitives";
import { useData } from "@/src/data/store";
import { sectionSummaries } from "@/src/data/compute";
import { makeStyles, radius, spacing, useTheme } from "@/src/theme";

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surfaceSecondary },
  dateBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: c.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  stepper: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  arrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: c.surfaceTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  dateText: { fontSize: 15, fontWeight: "800", color: c.onSurface, minWidth: 150, textAlign: "center" },
  todayChip: {
    paddingHorizontal: spacing.md,
    height: 32,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: c.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  todayChipText: { fontSize: 12, fontWeight: "700", color: c.brandPrimary },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing["3xl"] },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginTop: spacing.sm },
  summaryBlock: { alignItems: "center", gap: 2 },
  summaryVal: { fontSize: 20, fontWeight: "800" },
  summaryLabel: { fontSize: 12, color: c.muted, fontWeight: "600" },
  summaryTitle: { fontSize: 15, fontWeight: "800", color: c.onSurface },
  sectionTitle: { fontSize: 13, fontWeight: "700", color: c.muted, textTransform: "uppercase", letterSpacing: 0.5, marginTop: spacing.sm },
  secRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 12,
    padding: spacing.lg,
  },
  secBody: { flex: 1, gap: 2 },
  secName: { fontSize: 15, fontWeight: "800", color: c.onSurface },
  secSub: { fontSize: 13, color: c.muted },
}));

export default function AttendanceScreen() {
  const s = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const { db } = useData();

  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));
  const isToday = date === dayjs().format("YYYY-MM-DD");

  const summaries = sectionSummaries(db, date);
  const overall = summaries.reduce(
    (acc, cur) => {
      acc.present += cur.stat.present;
      acc.absent += cur.stat.absent;
      acc.late += cur.stat.late;
      acc.total += cur.stat.total;
      return acc;
    },
    { present: 0, absent: 0, late: 0, total: 0 },
  );
  const overallPct = overall.total > 0 ? Math.round(((overall.present + overall.late) / overall.total) * 1000) / 10 : 0;

  const shiftDay = (delta: number) => {
    const next = dayjs(date).add(delta, "day");
    if (next.isAfter(dayjs(), "day")) return; // no future
    setDate(next.format("YYYY-MM-DD"));
  };

  return (
    <View style={s.root}>
      <BrandHeader title="Attendance" subtitle="Daily class-wise attendance" />
      <View style={s.dateBar}>
        <View style={s.stepper}>
          <Pressable style={s.arrow} onPress={() => shiftDay(-1)} testID="attendance-prev-day">
            <CaretLeft size={18} color={colors.onSurface} weight="bold" />
          </Pressable>
          <Text style={s.dateText} testID="attendance-date">
            {dayjs(date).format("ddd, DD MMM YYYY")}
          </Text>
          <Pressable
            style={[s.arrow, isToday && { opacity: 0.4 }]}
            onPress={() => shiftDay(1)}
            disabled={isToday}
            testID="attendance-next-day"
          >
            <CaretRight size={18} color={colors.onSurface} weight="bold" />
          </Pressable>
        </View>
        {!isToday ? (
          <Pressable
            style={s.todayChip}
            onPress={() => setDate(dayjs().format("YYYY-MM-DD"))}
            testID="attendance-today-chip"
          >
            <Text style={s.todayChipText}>Today</Text>
          </Pressable>
        ) : null}
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <Card testID="attendance-summary-card">
          <Text style={s.summaryTitle}>School Summary</Text>
          <View style={s.summaryRow}>
            <View style={s.summaryBlock}>
              <Text style={[s.summaryVal, { color: colors.brandPrimary }]}>{overallPct}%</Text>
              <Text style={s.summaryLabel}>Attendance</Text>
            </View>
            <View style={s.summaryBlock}>
              <Text style={[s.summaryVal, { color: colors.success }]}>{overall.present}</Text>
              <Text style={s.summaryLabel}>Present</Text>
            </View>
            <View style={s.summaryBlock}>
              <Text style={[s.summaryVal, { color: colors.warning }]}>{overall.late}</Text>
              <Text style={s.summaryLabel}>Late</Text>
            </View>
            <View style={s.summaryBlock}>
              <Text style={[s.summaryVal, { color: colors.error }]}>{overall.absent}</Text>
              <Text style={s.summaryLabel}>Absent</Text>
            </View>
          </View>
        </Card>

        <Text style={s.sectionTitle}>Classes & Sections</Text>
        {summaries.map((sm) => {
          const tone = sm.stat.percentage >= 85 ? "success" : sm.stat.percentage >= 75 ? "warning" : "error";
          return (
            <Pressable
              key={sm.section.id}
              style={({ pressed }) => [s.secRow, pressed && { opacity: 0.7 }]}
              onPress={() =>
                router.push({
                  pathname: "/attendance/[sectionId]",
                  params: { sectionId: sm.section.id, date },
                })
              }
              testID={`attendance-section-${sm.section.id}`}
            >
              <View style={s.secBody}>
                <Text style={s.secName}>
                  {sm.classLabel} — {sm.sectionLabel}
                </Text>
                <Text style={s.secSub}>
                  {sm.totalStudents} students · {sm.stat.present} present · {sm.stat.absent} absent
                </Text>
              </View>
              <Badge label={`${sm.stat.percentage}%`} tone={tone} />
              <CaretRight size={16} color={colors.muted} weight="bold" />
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
