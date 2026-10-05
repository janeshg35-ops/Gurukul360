import { useRouter } from "expo-router";
import { BookOpen, CalendarBlank, CalendarCheck, ChalkboardTeacher, Megaphone, Notebook, UserCircle, UsersThree } from "phosphor-react-native";
import dayjs from "dayjs";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useLiveTeacher } from "@/src/auth/use-live-teacher";
import { ProgressRing } from "@/src/components/charts";
import { DashboardHeader, DashboardSection, cardShadow, dayGreeting, pressedStyle } from "@/src/components/dashboard-header";
import { LoadingView } from "@/src/components/ui/feedback";
import { useData } from "@/src/data/store";
import { sectionAttendanceForDate, sectionStudents } from "@/src/data/compute";
import { classTeacherLabel, subjectNames } from "@/src/data/teachers";
import { makeStyles, radius, spacing, useTheme } from "@/src/theme";
import { NO_CLASS_MESSAGE } from "./no-class";

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surfaceSecondary },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  hero: {
    backgroundColor: c.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: c.border,
    padding: spacing.lg,
    ...cardShadow,
  },
  heroTop: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  heroCopy: { flex: 1, minWidth: 0 },
  mark: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: c.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  eyebrow: { fontSize: 12, fontWeight: "700", color: c.brandPrimary, letterSpacing: 0.4, textTransform: "uppercase" },
  name: { fontSize: 22, fontWeight: "800", color: c.onSurface, marginTop: 2 },
  meta: { fontSize: 14, fontWeight: "600", color: c.onSurfaceSecondary, marginTop: spacing.sm },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.md },
  chip: {
    backgroundColor: c.brandTertiary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  chipText: { fontSize: 13, fontWeight: "700", color: c.onBrandTertiary },
  noteBox: {
    marginTop: spacing.md,
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "flex-start",
    backgroundColor: c.surfaceSecondary,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  note: { flex: 1, fontSize: 14, lineHeight: 20, color: c.onSurfaceSecondary },
  focusRow: { flexDirection: "row", gap: spacing.md },
  focus: {
    flex: 1,
    backgroundColor: c.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: c.border,
    borderLeftWidth: 3,
    padding: spacing.md,
    gap: 4,
    minHeight: 124,
    ...cardShadow,
  },
  focusHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  focusValue: { fontSize: 22, fontWeight: "800", color: c.onSurface },
  focusLabel: { fontSize: 13, fontWeight: "700", color: c.onSurface },
  focusSub: { fontSize: 12, fontWeight: "600", color: c.onSurfaceSecondary },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  action: {
    width: "30%",
    minHeight: 88,
    backgroundColor: c.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: c.border,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  actionIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  actionLabel: { fontSize: 12, fontWeight: "700", color: c.onSurface, textAlign: "center" },
  accountBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
}));

export default function TeacherDashboard() {
  const s = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { db } = useData();
  const { teacher, ready } = useLiveTeacher();

  if (!ready || !teacher) {
    return (
      <View style={s.root}>
        <LoadingView label="Loading your dashboard…" />
      </View>
    );
  }

  const subjects = subjectNames(db, teacher.subjectIds);
  const sectionId = teacher.classTeacherOf;
  const classLabel = sectionId ? classTeacherLabel(db, sectionId) : "Subject Teacher";
  const students = sectionId ? sectionStudents(db, sectionId) : [];
  const today = dayjs().format("YYYY-MM-DD");
  const attendance = sectionId ? sectionAttendanceForDate(db, sectionId, today) : null;
  const recorded = attendance ? attendance.present + attendance.late + attendance.absent : 0;
  const attendanceValue = !attendance ? "—" : recorded === 0 ? "—" : `${attendance.percentage}%`;
  const attendanceDetail = !attendance
    ? "Not available"
    : recorded === 0
      ? "Not recorded"
      : `${attendance.present + attendance.late} of ${attendance.total} present`;

  const actions = [
    { key: "students", label: "My Students", icon: UsersThree, color: colors.brandPrimary, bg: colors.brandTertiary, href: "/my-students" as const, testID: "teacher-card-students" },
    { key: "attendance", label: "Attendance", icon: CalendarCheck, color: colors.success, bg: colors.successSoft, href: "/my-attendance" as const, testID: "teacher-card-attendance" },
    { key: "subjects", label: "My Subjects", icon: BookOpen, color: colors.info, bg: colors.infoSoft, href: "/my-subjects" as const, testID: "teacher-card-subjects" },
    { key: "class", label: "My Class", icon: ChalkboardTeacher, color: colors.warning, bg: colors.warningSoft, href: "/my-class" as const, testID: "teacher-card-class" },
    { key: "homework", label: "Homework", icon: Notebook, color: colors.info, bg: colors.infoSoft, href: "/my-assignments" as const, testID: "teacher-card-homework" },
    { key: "communication", label: "Communication", icon: Megaphone, color: colors.brandPrimary, bg: colors.brandTertiary, href: "/teacher-announcements" as const, testID: "teacher-card-communication" },
    { key: "timetable", label: "Timetable", icon: CalendarBlank, color: colors.brandPrimary, bg: colors.brandTertiary, href: "/my-timetable" as const, testID: "teacher-card-timetable" },
    { key: "account", label: "Account", icon: UserCircle, color: colors.brandPrimary, bg: colors.brandTertiary, href: "/account" as const, testID: "teacher-card-account" },
  ];

  return (
    <View style={s.root} testID="teacher-dashboard">
      <DashboardHeader
        greeting={dayGreeting(teacher.name)}
        role="Teacher"
        mark={<ChalkboardTeacher size={20} color="#FFFFFF" weight="fill" />}
        right={
          <Pressable style={s.accountBtn} onPress={() => router.push("/account")} testID="teacher-account-button">
            <UserCircle size={20} color="#FFFFFF" weight="bold" />
          </Pressable>
        }
      />
      <ScrollView
        contentContainerStyle={[s.content, { paddingBottom: spacing.xl + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.hero}>
          <View style={s.heroTop}>
            <View style={s.heroCopy}>
              <Text style={s.eyebrow}>Teacher</Text>
              <Text style={s.name} testID="teacher-name">{teacher.name}</Text>
            </View>
            <View style={s.mark}>
              <ChalkboardTeacher size={24} color={colors.brandPrimary} weight="fill" />
            </View>
          </View>
          <View style={s.chips} testID="teacher-subjects">
            {subjects.length === 0 ? (
              <Text style={s.meta}>No subjects assigned</Text>
            ) : (
              subjects.map((name) => (
                <View key={name} style={s.chip}>
                  <Text style={s.chipText}>{name}</Text>
                </View>
              ))
            )}
          </View>
          <Text style={s.meta} testID="teacher-class">
            {sectionId ? `Class teacher · ${classLabel}` : "Subject Teacher"}
          </Text>
          {sectionId ? null : (
            <View style={s.noteBox}>
              <BookOpen size={18} color={colors.brandPrimary} weight="duotone" />
              <Text style={s.note}>{NO_CLASS_MESSAGE}</Text>
            </View>
          )}
        </View>

        {sectionId ? (
          <View style={s.focusRow}>
            <Pressable
              style={({ pressed }) => [s.focus, { borderLeftColor: colors.success }, pressedStyle(pressed)]}
              onPress={() => router.push("/my-attendance")}
              testID="teacher-focus-attendance"
            >
              <Text style={s.focusLabel}>Today's Attendance</Text>
              <View style={s.focusHead}>
                <Text style={s.focusValue}>{attendanceValue}</Text>
                {recorded > 0 && attendance ? (
                  <ProgressRing value={attendance.percentage} size={36} strokeWidth={4} color={colors.success} />
                ) : (
                  <CalendarCheck size={20} color={colors.success} weight="fill" />
                )}
              </View>
              <Text style={s.focusSub}>{attendanceDetail}</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [s.focus, { borderLeftColor: colors.brandPrimary }, pressedStyle(pressed)]}
              onPress={() => router.push("/my-class")}
              testID="teacher-focus-class"
            >
              <Text style={s.focusLabel}>My Class</Text>
              <View style={s.focusHead}>
                <Text style={s.focusValue}>{students.length}</Text>
                <UsersThree size={20} color={colors.brandPrimary} weight="fill" />
              </View>
              <Text style={s.focusSub}>{classLabel}</Text>
            </Pressable>
          </View>
        ) : null}

        <DashboardSection title="Quick Access" />
        <View style={s.actions}>
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Pressable
                key={action.key}
                style={({ pressed }) => [s.action, pressedStyle(pressed)]}
                onPress={() => router.push(action.href)}
                testID={action.testID}
              >
                <View style={[s.actionIcon, { backgroundColor: action.bg }]}>
                  <Icon size={20} color={action.color} weight="fill" />
                </View>
                <Text style={s.actionLabel}>{action.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
