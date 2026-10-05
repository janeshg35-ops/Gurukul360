import { useRouter } from "expo-router";
import { BookOpen, CalendarCheck, ChalkboardTeacher, UserCircle, UsersThree } from "phosphor-react-native";
import dayjs from "dayjs";
import { Pressable, ScrollView, Text, View } from "react-native";

import { useLiveTeacher } from "@/src/auth/use-live-teacher";
import { BrandHeader } from "@/src/components/screen-header";
import { LoadingView } from "@/src/components/ui/feedback";
import { Card } from "@/src/components/ui/primitives";
import { PRODUCT } from "@/src/constants/branding";
import { useData } from "@/src/data/store";
import { sectionAttendanceForDate, sectionStudents } from "@/src/data/compute";
import { classTeacherLabel, subjectNames } from "@/src/data/teachers";
import { makeStyles, radius, spacing, useTheme } from "@/src/theme";

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surfaceSecondary },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing["3xl"] },
  name: { fontSize: 22, fontWeight: "800", color: c.onSurface },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: c.muted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginTop: spacing.md,
  },
  fieldValue: { fontSize: 15, fontWeight: "600", color: c.onSurface, marginTop: 4 },
  subjectLine: { fontSize: 15, fontWeight: "600", color: c.onSurface, marginTop: 4 },
  card: {
    backgroundColor: c.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: c.border,
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: { flex: 1, gap: 2 },
  cardTitle: { fontSize: 16, fontWeight: "800", color: c.onSurface },
  cardDetail: { fontSize: 13, color: c.muted, fontWeight: "600" },
  accountBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
}));

export default function TeacherDashboard() {
  const s = useStyles();
  const { colors } = useTheme();
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
  const attendanceDetail = !attendance
    ? "Not available"
    : recorded === 0
      ? "Not recorded"
      : `${attendance.percentage}% present`;

  return (
    <View style={s.root} testID="teacher-dashboard">
      <BrandHeader
        title="Teacher Dashboard"
        subtitle={PRODUCT.trademark}
        right={
          <Pressable
            style={s.accountBtn}
            onPress={() => router.push("/account")}
            testID="teacher-account-button"
          >
            <UserCircle size={20} color="#FFFFFF" weight="bold" />
          </Pressable>
        }
      />
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <Card>
          <Text style={s.name} testID="teacher-name">
            {teacher.name}
          </Text>
          <Text style={s.fieldLabel}>Subjects</Text>
          <View testID="teacher-subjects">
            {subjects.map((name) => (
              <Text key={name} style={s.subjectLine}>
                {name}
              </Text>
            ))}
          </View>
          <Text style={s.fieldLabel}>Class Teacher Of</Text>
          <Text style={s.fieldValue} testID="teacher-class">
            {classLabel}
          </Text>
        </Card>

        <Pressable style={s.card} onPress={() => router.push("/my-students")} testID="teacher-card-students">
          <View style={[s.iconWrap, { backgroundColor: colors.brandTertiary }]}>
            <UsersThree size={22} color={colors.brandPrimary} weight="fill" />
          </View>
          <View style={s.cardBody}>
            <Text style={s.cardTitle}>My Students</Text>
            <Text style={s.cardDetail}>{sectionId ? `${students.length} in ${classLabel}` : "No class assigned"}</Text>
          </View>
        </Pressable>

        <Pressable style={s.card} onPress={() => router.push("/my-attendance")} testID="teacher-card-attendance">
          <View style={[s.iconWrap, { backgroundColor: colors.successSoft }]}>
            <CalendarCheck size={22} color={colors.success} weight="fill" />
          </View>
          <View style={s.cardBody}>
            <Text style={s.cardTitle}>Today's Attendance</Text>
            <Text style={s.cardDetail}>{attendanceDetail}</Text>
          </View>
        </Pressable>

        <Pressable style={s.card} onPress={() => router.push("/my-subjects")} testID="teacher-card-subjects">
          <View style={[s.iconWrap, { backgroundColor: colors.infoSoft }]}>
            <BookOpen size={22} color={colors.info} weight="fill" />
          </View>
          <View style={s.cardBody}>
            <Text style={s.cardTitle}>My Subjects</Text>
            <Text style={s.cardDetail}>
              {subjects.length === 0 ? "None assigned" : subjects.join(", ")}
            </Text>
          </View>
        </Pressable>

        <Pressable style={s.card} onPress={() => router.push("/my-class")} testID="teacher-card-class">
          <View style={[s.iconWrap, { backgroundColor: colors.warningSoft }]}>
            <ChalkboardTeacher size={22} color={colors.warning} weight="fill" />
          </View>
          <View style={s.cardBody}>
            <Text style={s.cardTitle}>My Class</Text>
            <Text style={s.cardDetail}>{classLabel}</Text>
          </View>
        </Pressable>
      </ScrollView>
    </View>
  );
}
