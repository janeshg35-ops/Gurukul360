import { useRouter } from "expo-router";
import { CalendarBlank, CalendarCheck, GraduationCap, Megaphone, Notebook, Student as StudentIcon, UserCircle, Wallet } from "phosphor-react-native";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useLiveStudent } from "@/src/auth/use-live-student";
import { ProgressRing } from "@/src/components/charts";
import { DashboardHeader, DashboardSection, cardShadow, dayGreeting, pressedStyle } from "@/src/components/dashboard-header";
import { LoadingView } from "@/src/components/ui/feedback";
import { Avatar, Badge, StatBar } from "@/src/components/ui/primitives";
import { useData } from "@/src/data/store";
import {
  className,
  feeStatus,
  formatINR,
  sectionName,
  studentAttendance,
  studentFee,
  studentPerformance,
  studentResults,
} from "@/src/data/compute";
import { makeStyles, radius, spacing, useTheme } from "@/src/theme";

const FEE_LABEL = { paid: "Paid", partial: "Partial", pending: "Pending" } as const;
const FEE_TONE = { paid: "success", partial: "warning", pending: "error" } as const;

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surfaceSecondary },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  hero: {
    backgroundColor: c.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: c.border,
    padding: spacing.lg,
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
    ...cardShadow,
  },
  avatarWrap: { width: 56, height: 56 },
  cap: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: c.brandTertiary,
    borderWidth: 2,
    borderColor: c.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  heroCopy: { flex: 1, minWidth: 0 },
  name: { fontSize: 22, fontWeight: "800", color: c.onSurface },
  meta: { fontSize: 14, fontWeight: "600", color: c.onSurfaceSecondary, marginTop: 4, lineHeight: 20 },
  admission: {
    marginTop: spacing.sm,
    alignSelf: "flex-start",
    backgroundColor: c.brandTertiary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  admissionLabel: { fontSize: 12, fontWeight: "700", color: c.onBrandTertiary },
  admissionValue: { fontSize: 15, fontWeight: "800", color: c.brandPrimary, marginTop: 1 },
  kpiRow: { flexDirection: "row", gap: spacing.sm },
  kpi: {
    flex: 1,
    minWidth: 0,
    backgroundColor: c.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: c.border,
    padding: spacing.sm,
    gap: 4,
    minHeight: 118,
    ...cardShadow,
  },
  kpiValue: { fontSize: 16, fontWeight: "800", color: c.onSurface },
  kpiLabel: { fontSize: 12, fontWeight: "700", color: c.onSurface, lineHeight: 16, minHeight: 32 },
  kpiSub: { fontSize: 12, fontWeight: "600", color: c.onSurfaceSecondary },
  panel: {
    backgroundColor: c.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: c.border,
    padding: spacing.lg,
    gap: spacing.md,
    ...cardShadow,
  },
  overallRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md },
  overallKicker: { fontSize: 12, fontWeight: "700", color: c.onSurfaceSecondary, letterSpacing: 0.3 },
  overallValue: { fontSize: 22, fontWeight: "800", color: c.onSurface, marginTop: 2 },
  subjectRow: { gap: 6 },
  subjectTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: spacing.md },
  subjectName: { fontSize: 14, fontWeight: "700", color: c.onSurface, flex: 1 },
  subjectPct: { fontSize: 14, fontWeight: "800", color: c.brandPrimary },
  empty: { alignItems: "center", gap: spacing.sm, paddingVertical: spacing.sm },
  emptyText: { fontSize: 14, fontWeight: "600", color: c.onSurfaceSecondary, textAlign: "center" },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  action: {
    width: "47%",
    minHeight: 72,
    backgroundColor: c.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: c.border,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  actionIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  actionLabel: { fontSize: 13, fontWeight: "700", color: c.onSurface, textAlign: "center" },
  school: { fontSize: 13, fontWeight: "600", color: c.onSurfaceSecondary, textAlign: "center", marginTop: spacing.xs },
  accountBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
}));

export default function StudentDashboard() {
  const s = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { db } = useData();
  const { student, ready } = useLiveStudent();

  if (!ready || !student) {
    return (
      <View style={s.root}>
        <LoadingView label="Loading your dashboard…" />
      </View>
    );
  }

  const attendance = studentAttendance(db, student.id);
  const performance = studentPerformance(db, student.id);
  const results = studentResults(db, student.id);
  const fee = studentFee(db, student);
  const status = feeStatus(fee);
  const classLabel = className(db, student.classId);
  const sectionLabel = sectionName(db, student.sectionId);
  const attended = attendance.present + attendance.late;

  return (
    <View style={s.root} testID="student-dashboard">
      <DashboardHeader
        greeting={dayGreeting(student.name)}
        role={`Student · ${db.school.name}`}
        mark={<GraduationCap size={20} color="#FFFFFF" weight="fill" />}
        right={
          <Pressable
            style={s.accountBtn}
            onPress={() => router.push("/student-account")}
            testID="student-account-button"
          >
            <UserCircle size={20} color="#FFFFFF" weight="bold" />
          </Pressable>
        }
      />
      <ScrollView
        contentContainerStyle={[s.content, { paddingBottom: spacing.xl + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.hero}>
          <View style={s.avatarWrap}>
            <Avatar name={student.name} index={student.avatarIndex} size={56} />
            <View style={s.cap}>
              <GraduationCap size={12} color={colors.brandPrimary} weight="fill" />
            </View>
          </View>
          <View style={s.heroCopy}>
            <Text style={s.name} testID="student-name" numberOfLines={2}>{student.name}</Text>
            <Text style={s.meta}>
              {classLabel} · Section {sectionLabel}{"\n"}Roll No. {student.rollNo}
            </Text>
            <View style={s.admission}>
              <Text style={s.admissionLabel}>Admission No.</Text>
              <Text style={s.admissionValue} testID="student-admission">{student.admissionNo}</Text>
            </View>
          </View>
        </View>

        <View style={s.kpiRow}>
          <Pressable
            style={({ pressed }) => [s.kpi, pressedStyle(pressed)]}
            onPress={() => router.push("/student-attendance")}
            testID="student-card-attendance"
          >
            {attendance.total === 0 ? (
              <CalendarCheck size={18} color={colors.success} weight="fill" />
            ) : (
              <ProgressRing value={attendance.percentage} size={32} strokeWidth={3.5} color={colors.success} />
            )}
            <Text style={s.kpiLabel}>Attendance</Text>
            <Text style={s.kpiValue} numberOfLines={1} adjustsFontSizeToFit>
              {attendance.total === 0 ? "—" : `${attendance.percentage}%`}
            </Text>
            <Text style={s.kpiSub}>
              {attendance.total === 0 ? "Not recorded" : `${attended} of ${attendance.total} days`}
            </Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [s.kpi, pressedStyle(pressed)]}
            onPress={() => router.push("/student-results")}
            testID="student-card-results"
          >
            <GraduationCap size={18} color={colors.brandPrimary} weight="fill" />
            <Text style={s.kpiLabel}>Academic Performance</Text>
            <Text style={s.kpiValue} numberOfLines={1} adjustsFontSizeToFit>
              {performance.total === 0 ? "—" : `${performance.average}%`}
            </Text>
            <Text style={s.kpiSub}>{performance.total === 0 ? "No marks" : performance.grade}</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [s.kpi, pressedStyle(pressed)]}
            onPress={() => router.push("/student-fees")}
            testID="student-card-fees"
          >
            <Wallet size={18} color={colors.warning} weight="fill" />
            <Text style={s.kpiLabel}>Fee Status</Text>
            <Text style={s.kpiValue} numberOfLines={1} adjustsFontSizeToFit>
              {formatINR(fee.outstanding)}
            </Text>
            <Badge label={FEE_LABEL[status]} tone={FEE_TONE[status]} />
          </Pressable>
        </View>

        <DashboardSection title="Academic Performance" />
        <View style={s.panel}>
          {performance.total === 0 ? (
            <View style={s.empty}>
              <GraduationCap size={28} color={colors.brandPrimary} weight="duotone" />
              <Text style={s.emptyText}>No marks recorded yet.</Text>
            </View>
          ) : (
            <>
              <View style={s.overallRow}>
                <View>
                  <Text style={s.overallKicker}>Overall</Text>
                  <Text style={s.overallValue}>{performance.average}%</Text>
                </View>
                <Badge label={performance.grade} tone="info" />
              </View>
              {results.map((result, index) => (
                <View key={`${result.subjectId}-${index}`} style={s.subjectRow}>
                  <View style={s.subjectTop}>
                    <Text style={s.subjectName} numberOfLines={1}>{result.subject}</Text>
                    <Text style={s.subjectPct}>{result.percentage}%</Text>
                  </View>
                  <StatBar value={result.percentage} max={100} color={colors.brandPrimary} />
                </View>
              ))}
            </>
          )}
        </View>

        <DashboardSection title="Quick Access" />
        <View style={s.actions}>
          <Pressable
            style={({ pressed }) => [s.action, pressedStyle(pressed)]}
            onPress={() => router.push("/student-profile")}
            testID="student-card-profile"
          >
            <View style={[s.actionIcon, { backgroundColor: colors.brandTertiary }]}>
              <StudentIcon size={20} color={colors.brandPrimary} weight="fill" />
            </View>
            <Text style={s.actionLabel}>Profile</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [s.action, pressedStyle(pressed)]}
            onPress={() => router.push("/student-attendance")}
          >
            <View style={[s.actionIcon, { backgroundColor: colors.successSoft }]}>
              <CalendarCheck size={20} color={colors.success} weight="fill" />
            </View>
            <Text style={s.actionLabel}>Attendance</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [s.action, pressedStyle(pressed)]}
            onPress={() => router.push("/student-results")}
          >
            <View style={[s.actionIcon, { backgroundColor: colors.infoSoft }]}>
              <GraduationCap size={20} color={colors.brandPrimary} weight="fill" />
            </View>
            <Text style={s.actionLabel}>Results</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [s.action, pressedStyle(pressed)]}
            onPress={() => router.push("/student-fees")}
          >
            <View style={[s.actionIcon, { backgroundColor: colors.warningSoft }]}>
              <Wallet size={20} color={colors.warning} weight="fill" />
            </View>
            <Text style={s.actionLabel}>Fees</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [s.action, pressedStyle(pressed)]}
            onPress={() => router.push("/student-assignments")}
            testID="student-card-homework"
          >
            <View style={[s.actionIcon, { backgroundColor: colors.infoSoft }]}>
              <Notebook size={20} color={colors.brandPrimary} weight="fill" />
            </View>
            <Text style={s.actionLabel}>Homework</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [s.action, pressedStyle(pressed)]}
            onPress={() => router.push("/student-announcements")}
            testID="student-card-communication"
          >
            <View style={[s.actionIcon, { backgroundColor: colors.brandTertiary }]}>
              <Megaphone size={20} color={colors.brandPrimary} weight="fill" />
            </View>
            <Text style={s.actionLabel}>Communication</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [s.action, pressedStyle(pressed)]}
            onPress={() => router.push("/student-timetable")}
            testID="student-card-timetable"
          >
            <View style={[s.actionIcon, { backgroundColor: colors.brandTertiary }]}>
              <CalendarBlank size={20} color={colors.brandPrimary} weight="fill" />
            </View>
            <Text style={s.actionLabel}>Timetable</Text>
          </Pressable>
        </View>

        <Text style={s.school} testID="student-school">
          {db.school.name} · {db.school.location} · Session {db.school.session}
        </Text>
      </ScrollView>
    </View>
  );
}
