import dayjs from "dayjs";
import { Check, CaretLeft, CaretRight } from "phosphor-react-native";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useLiveTeacher } from "@/src/auth/use-live-teacher";
import { NoClassState } from "./no-class";
import { StackHeader } from "@/src/components/screen-header";
import { PrimaryButton } from "@/src/components/ui/controls";
import { LoadingView, useToast } from "@/src/components/ui/feedback";
import { Avatar } from "@/src/components/ui/primitives";
import { useData } from "@/src/data/store";
import { sectionStudents, statusFor } from "@/src/data/compute";
import { classTeacherLabel } from "@/src/data/teachers";
import { AttendanceStatus, Teacher } from "@/src/data/types";
import { makeStyles, radius, spacing, useTheme } from "@/src/theme";

const OPTIONS: { key: AttendanceStatus; label: string }[] = [
  { key: "present", label: "Present" },
  { key: "late", label: "Late" },
  { key: "absent", label: "Absent" },
];

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surfaceSecondary },
  dateBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    backgroundColor: c.surface,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  arrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: c.surfaceTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  dateText: { fontSize: 15, fontWeight: "800", color: c.onSurface, minWidth: 160, textAlign: "center" },
  summary: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: c.surface,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  summaryBlock: { alignItems: "center" },
  summaryVal: { fontSize: 18, fontWeight: "800" },
  summaryLabel: { fontSize: 11, color: c.muted, fontWeight: "600" },
  content: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.lg },
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

export default function MyAttendance() {
  const { teacher, ready } = useLiveTeacher();
  if (!ready || !teacher) {
    return <LoadingView />;
  }
  if (!teacher.classTeacherOf) {
    return (
      <View style={{ flex: 1 }}>
        <StackHeader title="Attendance" />
        <NoClassState />
      </View>
    );
  }
  return <AttendanceEditor teacher={teacher} sectionId={teacher.classTeacherOf} />;
}

function AttendanceEditor({ teacher, sectionId }: { teacher: Teacher; sectionId: string }) {
  const s = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { db, setAttendance } = useData();
  const students = sectionStudents(db, sectionId);
  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [overrides, setOverrides] = useState<Partial<Record<string, AttendanceStatus>>>({});

  const markFor = (studentId: string): AttendanceStatus | null =>
    overrides[studentId] ?? statusFor(db, date, studentId);

  const shiftDay = (delta: number) => {
    const next = dayjs(date).add(delta, "day");
    if (next.isAfter(dayjs(), "day")) return;
    setDate(next.format("YYYY-MM-DD"));
    setOverrides({});
  };

  const toneColor: Record<AttendanceStatus, string> = {
    present: colors.success,
    late: colors.warning,
    absent: colors.error,
  };

  const counts = useMemo(() => {
    const tally = { present: 0, late: 0, absent: 0, unmarked: 0 };
    for (const student of students) {
      const status = markFor(student.id);
      if (status) tally[status] += 1;
      else tally.unmarked += 1;
    }
    return tally;
  }, [date, db, overrides, students]);

  const onSave = () => {
    const updates: Record<string, AttendanceStatus> = {};
    for (const student of students) {
      const status = markFor(student.id);
      if (status) updates[student.id] = status;
    }
    if (Object.keys(updates).length === 0) {
      toast.show("Mark at least one student before saving", "info");
      return;
    }
    setAttendance(date, updates);
    setOverrides({});
    toast.show("Attendance saved", "success");
  };

  const isToday = date === dayjs().format("YYYY-MM-DD");

  return (
    <View style={s.root}>
      <StackHeader title="Attendance" subtitle={`${teacher.name} · ${classTeacherLabel(db, sectionId)}`} />
      <View style={s.dateBar}>
        <Pressable style={s.arrow} onPress={() => shiftDay(-1)} testID="teacher-attendance-prev">
          <CaretLeft size={18} color={colors.onSurface} weight="bold" />
        </Pressable>
        <Text style={s.dateText}>{dayjs(date).format("ddd, DD MMM YYYY")}</Text>
        <Pressable
          style={[s.arrow, isToday && { opacity: 0.4 }]}
          onPress={() => shiftDay(1)}
          disabled={isToday}
          testID="teacher-attendance-next"
        >
          <CaretRight size={18} color={colors.onSurface} weight="bold" />
        </Pressable>
      </View>
      <View style={s.summary}>
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
      <ScrollView contentContainerStyle={s.content}>
        {students.map((student) => (
          <View key={student.id} style={s.row} testID={`teacher-attendance-${student.id}`}>
            <View style={s.rowTop}>
              <Avatar name={student.name} index={student.avatarIndex} size={38} />
              <View style={{ flex: 1 }}>
                <Text style={s.name}>{student.name}</Text>
                <Text style={s.roll}>Roll {student.rollNo}</Text>
              </View>
            </View>
            <View style={s.segRow}>
              {OPTIONS.map((opt) => {
                const active = markFor(student.id) === opt.key;
                const color = toneColor[opt.key];
                return (
                  <Pressable
                    key={opt.key}
                    style={[
                      s.seg,
                      { borderColor: active ? color : colors.border, backgroundColor: active ? color : colors.surface },
                    ]}
                    onPress={() => setOverrides((current) => ({ ...current, [student.id]: opt.key }))}
                    testID={`teacher-status-${student.id}-${opt.key}`}
                  >
                    {active ? <Check size={14} color="#FFFFFF" weight="bold" /> : null}
                    <Text style={[s.segText, { color: active ? "#FFFFFF" : colors.onSurfaceTertiary }]}>{opt.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>
      <View style={[s.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <PrimaryButton label="Save Attendance" onPress={onSave} testID="teacher-save-attendance" />
      </View>
    </View>
  );
}
