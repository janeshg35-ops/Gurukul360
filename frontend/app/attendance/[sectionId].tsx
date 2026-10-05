import dayjs from "dayjs";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Check } from "phosphor-react-native";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { StackHeader } from "@/src/components/screen-header";
import { PrimaryButton } from "@/src/components/ui/controls";
import { useToast } from "@/src/components/ui/feedback";
import { Avatar } from "@/src/components/ui/primitives";
import { useData } from "@/src/data/store";
import { className, sectionName, sectionStudents, statusFor } from "@/src/data/compute";
import { AttendanceStatus } from "@/src/data/types";
import { makeStyles, radius, spacing, useTheme } from "@/src/theme";

const OPTIONS: { key: AttendanceStatus; label: string }[] = [
  { key: "present", label: "Present" },
  { key: "late", label: "Late" },
  { key: "absent", label: "Absent" },
];

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surfaceSecondary },
  summary: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    rowGap: spacing.sm,
    backgroundColor: c.surface,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  summaryBlock: { alignItems: "center" },
  summaryVal: { fontSize: 18, fontWeight: "800" },
  summaryLabel: { fontSize: 11, color: c.muted, fontWeight: "600" },
  content: { padding: spacing.lg, gap: spacing.sm },
  row: {
    backgroundColor: c.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: c.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  rowTop: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  name: { fontSize: 15, fontWeight: "700", color: c.onSurface },
  roll: { fontSize: 12, color: c.muted },
  segRow: { flexDirection: "row", gap: spacing.sm },
  seg: {
    flex: 1,
    height: 38,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 4,
  },
  segText: { fontSize: 13, fontWeight: "700" },
  footer: {
    padding: spacing.lg,
    backgroundColor: c.surface,
    borderTopWidth: 1,
    borderTopColor: c.border,
  },
}));

export default function AttendanceEditor() {
  const s = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { db, setAttendance } = useData();
  const params = useLocalSearchParams<{ sectionId: string; date?: string }>();

  const sectionId = params.sectionId;
  const date = params.date ?? dayjs().format("YYYY-MM-DD");
  const students = sectionStudents(db, sectionId);
  const section = db.sections.find((x) => x.id === sectionId);

  const [draft, setDraft] = useState<Partial<Record<string, AttendanceStatus>>>(() => {
    const init: Partial<Record<string, AttendanceStatus>> = {};
    for (const st of students) {
      const status = statusFor(db, date, st.id);
      if (status) init[st.id] = status;
    }
    return init;
  });

  const toneColor: Record<AttendanceStatus, string> = {
    present: colors.success,
    late: colors.warning,
    absent: colors.error,
  };

  const counts = useMemo(() => {
    const c = { present: 0, late: 0, absent: 0, unmarked: 0 };
    for (const st of students) {
      const status = draft[st.id];
      if (status) c[status] += 1;
      else c.unmarked += 1;
    }
    return c;
  }, [draft, students]);
  const total = students.length;
  const marked = counts.present + counts.late + counts.absent;
  const pct = total > 0 ? Math.round(((counts.present + counts.late) / total) * 1000) / 10 : 0;

  const onSave = () => {
    const updates: Record<string, AttendanceStatus> = {};
    for (const st of students) {
      const status = draft[st.id];
      if (status) updates[st.id] = status;
    }
    if (Object.keys(updates).length === 0) {
      toast.show("Mark at least one student before saving", "info");
      return;
    }
    setAttendance(date, updates);
    toast.show("Attendance saved successfully", "success");
    router.back();
  };

  return (
    <View style={s.root}>
      <StackHeader
        title={section ? `${className(db, section.classId)} — ${sectionName(db, sectionId)}` : "Attendance"}
        subtitle={dayjs(date).format("ddd, DD MMM YYYY")}
      />
      <View style={s.summary}>
        <View style={s.summaryBlock}>
          <Text style={[s.summaryVal, { color: colors.brandPrimary }]} testID="editor-pct">{marked === 0 ? "—" : `${pct}%`}</Text>
          <Text style={s.summaryLabel}>Attendance</Text>
        </View>
        <View style={s.summaryBlock}>
          <Text style={[s.summaryVal, { color: colors.success }]}>{counts.present}</Text>
          <Text style={s.summaryLabel}>Present</Text>
        </View>
        <View style={s.summaryBlock}>
          <Text style={[s.summaryVal, { color: colors.warning }]}>{counts.late}</Text>
          <Text style={s.summaryLabel}>Late</Text>
        </View>
        <View style={s.summaryBlock}>
          <Text style={[s.summaryVal, { color: colors.error }]}>{counts.absent}</Text>
          <Text style={s.summaryLabel}>Absent</Text>
        </View>
        <View style={s.summaryBlock}>
          <Text style={[s.summaryVal, { color: colors.muted }]}>{counts.unmarked}</Text>
          <Text style={s.summaryLabel}>Not recorded</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {students.map((st) => (
          <View key={st.id} style={s.row} testID={`attendance-student-${st.id}`}>
            <View style={s.rowTop}>
              <Avatar name={st.name} index={st.avatarIndex} size={38} />
              <View style={{ flex: 1 }}>
                <Text style={s.name}>{st.name}</Text>
                <Text style={s.roll}>Roll No. {st.rollNo}</Text>
              </View>
            </View>
            <View style={s.segRow}>
              {OPTIONS.map((opt) => {
                const active = draft[st.id] === opt.key;
                const color = toneColor[opt.key];
                return (
                  <Pressable
                    key={opt.key}
                    style={[
                      s.seg,
                      {
                        borderColor: active ? color : colors.border,
                        backgroundColor: active ? color : colors.surface,
                      },
                    ]}
                    onPress={() => setDraft((d) => ({ ...d, [st.id]: opt.key }))}
                    testID={`status-${st.id}-${opt.key}`}
                  >
                    {active ? <Check size={14} color="#FFFFFF" weight="bold" /> : null}
                    <Text style={[s.segText, { color: active ? "#FFFFFF" : colors.onSurfaceTertiary }]}>
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={[s.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <PrimaryButton label="Save Attendance" onPress={onSave} testID="save-attendance-button" />
      </View>
    </View>
  );
}
