import { useRouter } from "expo-router";
import { CalendarCheck, GraduationCap, Student as StudentIcon, UserCircle, Wallet } from "phosphor-react-native";
import { Pressable, ScrollView, Text, View } from "react-native";

import { useLiveStudent } from "@/src/auth/use-live-student";
import { BrandHeader } from "@/src/components/screen-header";
import { LoadingView } from "@/src/components/ui/feedback";
import { Card } from "@/src/components/ui/primitives";
import { PRODUCT } from "@/src/constants/branding";
import { useData } from "@/src/data/store";
import {
  className,
  feeStatus,
  formatINR,
  sectionName,
  studentAttendance,
  studentFee,
  studentPerformance,
} from "@/src/data/compute";
import { makeStyles, radius, spacing, useTheme } from "@/src/theme";

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surfaceSecondary },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing["3xl"] },
  name: { fontSize: 22, fontWeight: "800", color: c.onSurface },
  welcome: { fontSize: 13, fontWeight: "700", color: c.muted, textTransform: "uppercase", letterSpacing: 0.4 },
  line: { fontSize: 15, fontWeight: "600", color: c.onSurface, marginTop: 4 },
  label: { fontSize: 12, fontWeight: "700", color: c.muted, marginTop: spacing.md, textTransform: "uppercase", letterSpacing: 0.4 },
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
  iconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
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

const FEE_LABEL = { paid: "Paid", partial: "Partial", pending: "Pending" } as const;

export default function StudentDashboard() {
  const s = useStyles();
  const { colors } = useTheme();
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
  const fee = studentFee(db, student);
  const status = feeStatus(fee);
  const classLabel = className(db, student.classId);
  const sectionLabel = sectionName(db, student.sectionId);

  return (
    <View style={s.root} testID="student-dashboard">
      <BrandHeader
        title="Student Dashboard"
        subtitle={PRODUCT.trademark}
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
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <Card>
          <Text style={s.welcome}>Welcome</Text>
          <Text style={s.name} testID="student-name">{student.name}</Text>
          <Text style={s.label}>Admission Number</Text>
          <Text style={s.line} testID="student-admission">{student.admissionNo}</Text>
          <Text style={s.label}>Class</Text>
          <Text style={s.line}>{classLabel}</Text>
          <Text style={s.label}>Section</Text>
          <Text style={s.line}>{sectionLabel}</Text>
          <Text style={s.label}>Roll Number</Text>
          <Text style={s.line}>{student.rollNo}</Text>
        </Card>

        <Pressable style={s.card} onPress={() => router.push("/student-profile")} testID="student-card-profile">
          <View style={[s.iconWrap, { backgroundColor: colors.brandTertiary }]}>
            <StudentIcon size={22} color={colors.brandPrimary} weight="fill" />
          </View>
          <View style={s.cardBody}>
            <Text style={s.cardTitle}>My Profile</Text>
            <Text style={s.cardDetail}>{classLabel} — {sectionLabel}</Text>
          </View>
        </Pressable>

        <Pressable style={s.card} onPress={() => router.push("/student-attendance")} testID="student-card-attendance">
          <View style={[s.iconWrap, { backgroundColor: colors.successSoft }]}>
            <CalendarCheck size={22} color={colors.success} weight="fill" />
          </View>
          <View style={s.cardBody}>
            <Text style={s.cardTitle}>Attendance</Text>
            <Text style={s.cardDetail}>
              {attendance.total === 0 ? "Not recorded" : `${attendance.percentage}% recorded`}
            </Text>
          </View>
        </Pressable>

        <Pressable style={s.card} onPress={() => router.push("/student-results")} testID="student-card-results">
          <View style={[s.iconWrap, { backgroundColor: colors.infoSoft }]}>
            <GraduationCap size={22} color={colors.info} weight="fill" />
          </View>
          <View style={s.cardBody}>
            <Text style={s.cardTitle}>Academic Performance</Text>
            <Text style={s.cardDetail}>
              {performance.total === 0 ? "No marks recorded" : `${performance.average}% · ${performance.grade}`}
            </Text>
          </View>
        </Pressable>

        <Pressable style={s.card} onPress={() => router.push("/student-fees")} testID="student-card-fees">
          <View style={[s.iconWrap, { backgroundColor: colors.warningSoft }]}>
            <Wallet size={22} color={colors.warning} weight="fill" />
          </View>
          <View style={s.cardBody}>
            <Text style={s.cardTitle}>Fee Status</Text>
            <Text style={s.cardDetail}>{FEE_LABEL[status]} · {formatINR(fee.outstanding)} outstanding</Text>
          </View>
        </Pressable>

        <Card testID="student-school">
          <Text style={s.cardTitle}>School</Text>
          <Text style={s.line}>{db.school.name}</Text>
          <Text style={s.cardDetail}>{db.school.location}</Text>
          <Text style={s.cardDetail}>Session {db.school.session}</Text>
        </Card>
      </ScrollView>
    </View>
  );
}
