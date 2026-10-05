import { useRouter } from "expo-router";
import {
  CalendarCheck,
  ChalkboardTeacher,
  CaretRight,
  FileText,
  GraduationCap,
  ListChecks,
  Megaphone,
  Receipt,
  SignOut,
  Student as StudentIcon,
  Wallet,
  Warning,
} from "phosphor-react-native";
import dayjs from "dayjs";
import { Pressable, ScrollView, Text, View } from "react-native";

import { BarChart, DonutChart, LegendRow } from "@/src/components/charts";
import { BrandHeader } from "@/src/components/screen-header";
import { Card, Divider } from "@/src/components/ui/primitives";
import { KpiCard, ListRow, NavTile } from "@/src/components/ui/kpi";
import { useToast } from "@/src/components/ui/feedback";
import { SCHOOL } from "@/src/constants/branding";
import { useAuth } from "@/src/context/auth";
import { useData } from "@/src/data/store";
import { activeTeacherCount } from "@/src/data/teachers";
import {
  activeStudents,
  feeTotals,
  formatINR,
  formatINRShort,
  getStudent,
  recentPayments,
  schoolPerformanceAverage,
  subjectClassAverage,
  todayAttendance,
} from "@/src/data/compute";
import { makeStyles, spacing, useTheme } from "@/src/theme";

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surfaceSecondary },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing["3xl"] },
  grid: { flexDirection: "row", gap: spacing.md },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: c.onSurface, marginBottom: spacing.sm },
  cardTitle: { fontSize: 15, fontWeight: "800", color: c.onSurface, marginBottom: spacing.md },
  attRow: { flexDirection: "row", alignItems: "center", gap: spacing.xl },
  legendCol: { flex: 1, gap: spacing.md },
  feeFigures: { flexDirection: "row", justifyContent: "space-between", marginTop: spacing.md },
  feeBlock: { gap: 2 },
  feeLabel: { fontSize: 12, color: c.muted, fontWeight: "600" },
  feeValue: { fontSize: 16, fontWeight: "800", color: c.onSurface },
  signOut: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardLink: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  linkText: { fontSize: 13, fontWeight: "700", color: c.brandPrimary },
  amount: { fontSize: 14, fontWeight: "800", color: c.success },
  feeBarTrack: { height: 12, borderRadius: 999, backgroundColor: c.surfaceTertiary, overflow: "hidden", marginTop: spacing.sm },
  feeBarFill: { height: "100%", borderRadius: 999, backgroundColor: c.success },
}));

export default function DashboardScreen() {
  const s = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const { db } = useData();
  const { user, signOut } = useAuth();
  const toast = useToast();

  const students = activeStudents(db);
  const att = todayAttendance(db);
  const recordedToday = att.present + att.late + att.absent;
  const fees = feeTotals(db);
  const perf = schoolPerformanceAverage(db);
  const payments = recentPayments(db, 4);

  const subjectBars = db.subjects.map((sub) => ({
    label: sub.name.split(" ")[0],
    value: subjectClassAverage(db, sub.id),
    color: colors.brandSecondary,
  }));

  const onSignOut = () => {
    signOut();
    toast.show("Signed out successfully", "info");
    router.replace("/login");
  };

  return (
    <View style={s.root}>
      <BrandHeader
        title={`Hello, ${user?.name?.split(" ").slice(0, 2).join(" ") ?? "Principal"}`}
        subtitle={`${SCHOOL.name} \u00B7 Session ${SCHOOL.session}`}
        right={
          <Pressable style={s.signOut} onPress={onSignOut} testID="dashboard-signout">
            <SignOut size={18} color="#FFFFFF" weight="bold" />
          </Pressable>
        }
      />
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* KPI grid */}
        <View style={{ gap: spacing.md }}>
          <View style={s.grid}>
            <KpiCard
              icon={StudentIcon}
              iconColor={colors.brandPrimary}
              iconBg={colors.brandTertiary}
              value={String(students.length)}
              label="Total Students"
              onPress={() => router.push("/(tabs)/students")}
              testID="kpi-students"
            />
            <KpiCard
              icon={ChalkboardTeacher}
              iconColor={colors.info}
              iconBg={colors.infoSoft}
              value={String(activeTeacherCount(db))}
              label="Total Teachers"
              onPress={() => router.push("/teachers")}
              testID="kpi-teachers"
            />
          </View>
          <View style={s.grid}>
            <KpiCard
              icon={CalendarCheck}
              iconColor={colors.success}
              iconBg={colors.successSoft}
              value={recordedToday === 0 ? "—" : `${att.percentage}%`}
              label="Today's Attendance"
              sub={recordedToday === 0 ? `${att.unmarked} not recorded` : `${att.present + att.late}/${att.total} present`}
              subColor={colors.muted}
              onPress={() => router.push("/(tabs)/attendance")}
              testID="kpi-attendance"
            />
            <KpiCard
              icon={Wallet}
              iconColor={colors.success}
              iconBg={colors.successSoft}
              value={formatINRShort(fees.collected)}
              label="Fee Collection"
              onPress={() => router.push("/(tabs)/fees")}
              testID="kpi-collection"
            />
          </View>
          <View style={s.grid}>
            <KpiCard
              icon={Warning}
              iconColor={colors.error}
              iconBg={colors.errorSoft}
              value={formatINRShort(fees.outstanding)}
              label="Outstanding Fees"
              onPress={() => router.push({ pathname: "/reports/[type]", params: { type: "outstanding" } })}
              testID="kpi-outstanding"
            />
            <KpiCard
              icon={ListChecks}
              iconColor={colors.warning}
              iconBg={colors.warningSoft}
              value={String(fees.studentsWithDues)}
              label="Pending Tasks"
              sub="Fee follow-ups"
              subColor={colors.muted}
              onPress={() => router.push({ pathname: "/reports/[type]", params: { type: "outstanding" } })}
              testID="kpi-tasks"
            />
          </View>
        </View>

        {/* Attendance overview */}
        <Card testID="attendance-overview-card">
          <Text style={s.cardTitle}>Attendance Overview · Today</Text>
          <View style={s.attRow}>
            <DonutChart
              segments={[
                { value: att.present, color: colors.success },
                { value: att.late, color: colors.warning },
                { value: att.absent, color: colors.error },
                ...(att.unmarked > 0 ? [{ value: att.unmarked, color: colors.muted }] : []),
              ]}
              centerTop={att.present + att.late + att.absent === 0 ? "—" : `${att.percentage}%`}
              centerBottom="Present"
            />
            <View style={s.legendCol}>
              <LegendRow color={colors.success} label="Present" value={String(att.present)} />
              <LegendRow color={colors.warning} label="Late" value={String(att.late)} />
              <LegendRow color={colors.error} label="Absent" value={String(att.absent)} />
              {att.unmarked > 0 ? (
                <LegendRow color={colors.muted} label="Not recorded" value={String(att.unmarked)} />
              ) : null}
            </View>
          </View>
        </Card>

        {/* Fee collection overview */}
        <Card testID="fee-overview-card">
          <Text style={s.cardTitle}>Fee Collection Overview</Text>
          <View style={s.feeBarTrack}>
            <View
              style={[
                s.feeBarFill,
                { width: `${fees.billed > 0 ? (fees.collected / fees.billed) * 100 : 0}%` },
              ]}
            />
          </View>
          <View style={s.feeFigures}>
            <View style={s.feeBlock}>
              <Text style={s.feeLabel}>Collected</Text>
              <Text style={[s.feeValue, { color: colors.success }]}>{formatINR(fees.collected)}</Text>
            </View>
            <View style={s.feeBlock}>
              <Text style={s.feeLabel}>Outstanding</Text>
              <Text style={[s.feeValue, { color: colors.error }]}>{formatINR(fees.outstanding)}</Text>
            </View>
            <View style={s.feeBlock}>
              <Text style={s.feeLabel}>Total Billed</Text>
              <Text style={s.feeValue}>{formatINR(fees.billed)}</Text>
            </View>
          </View>
        </Card>

        {/* Student performance overview */}
        <Card testID="performance-overview-card">
          <View style={s.cardLink}>
            <Text style={s.cardTitle}>Student Performance · Subject Averages</Text>
          </View>
          <BarChart data={subjectBars} maxValue={100} height={110} />
          <Divider style={{ marginVertical: spacing.md }} />
          <LegendRow color={colors.brandPrimary} label="School average (Term 1)" value={`${perf}%`} />
        </Card>

        {/* Quick access */}
        <View>
          <Text style={s.sectionTitle}>Quick Access</Text>
          <View style={s.grid}>
            <NavTile
              icon={FileText}
              iconColor={colors.brandPrimary}
              iconBg={colors.brandTertiary}
              label="Reports"
              onPress={() => router.push("/reports")}
              testID="tile-reports"
            />
            <NavTile
              icon={GraduationCap}
              iconColor={colors.info}
              iconBg={colors.infoSoft}
              label="Academics"
              onPress={() => router.push("/academics")}
              testID="tile-academics"
            />
            <NavTile
              icon={Megaphone}
              iconColor={colors.warning}
              iconBg={colors.warningSoft}
              label="Notices"
              onPress={() => router.push("/announcements")}
              testID="tile-announcements"
            />
            <NavTile
              icon={StudentIcon}
              iconColor={colors.success}
              iconBg={colors.successSoft}
              label="Students"
              onPress={() => router.push("/(tabs)/students")}
              testID="tile-students"
            />
          </View>
        </View>

        {/* Recent fee activity */}
        <Card>
          <View style={[s.cardLink, { marginBottom: spacing.sm }]}>
            <Text style={s.cardTitle}>Recent Fee Activity</Text>
            <Text style={s.linkText} onPress={() => router.push("/(tabs)/fees")} testID="see-all-fees">
              View all
            </Text>
          </View>
          {payments.map((p, i) => {
            const stu = getStudent(db, p.studentId);
            return (
              <View key={p.id}>
                {i > 0 ? <Divider /> : null}
                <ListRow
                  leading={<Receipt size={22} color={colors.success} weight="duotone" />}
                  title={stu?.name ?? "Student"}
                  subtitle={`${p.method} \u00B7 ${dayjs(p.date).format("DD MMM, hh:mm A")}`}
                  trailing={<Text style={s.amount}>+{formatINR(p.amount)}</Text>}
                  showChevron={false}
                />
              </View>
            );
          })}
        </Card>

        {/* Important announcements */}
        <Card>
          <View style={[s.cardLink, { marginBottom: spacing.sm }]}>
            <Text style={s.cardTitle}>Important Announcements</Text>
            <Text style={s.linkText} onPress={() => router.push("/announcements")} testID="see-all-notices">
              View all
            </Text>
          </View>
          {db.announcements.slice(0, 3).map((a, i) => (
            <View key={a.id}>
              {i > 0 ? <Divider /> : null}
              <ListRow
                leading={<Megaphone size={22} color={colors.brandPrimary} weight="duotone" />}
                title={a.title}
                subtitle={`${a.category} \u00B7 ${dayjs(a.date).format("DD MMM")}`}
                trailing={<CaretRight size={16} color={colors.muted} weight="bold" />}
                onPress={() => router.push("/announcements")}
                showChevron={false}
              />
            </View>
          ))}
        </Card>
      </ScrollView>
    </View>
  );
}
