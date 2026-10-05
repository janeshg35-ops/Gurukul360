import dayjs from "dayjs";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Receipt } from "phosphor-react-native";
import { useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";

import { DonutChart, LegendRow } from "@/src/components/charts";
import { StackHeader } from "@/src/components/screen-header";
import { PrimaryButton, SecondaryButton, SegmentedTabs } from "@/src/components/ui/controls";
import { Avatar, Badge, Card, Divider, StatBar, Tone } from "@/src/components/ui/primitives";
import { EmptyState, useToast } from "@/src/components/ui/feedback";
import { useData } from "@/src/data/store";
import {
  className,
  classSectionLabel,
  formatINR,
  getStudent,
  sectionName,
  studentAttendance,
  studentFee,
  studentPayments,
  studentPerformance,
  studentResults,
} from "@/src/data/compute";
import { makeStyles, spacing, useTheme } from "@/src/theme";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "attendance", label: "Attendance" },
  { key: "fees", label: "Fees" },
  { key: "academics", label: "Academics" },
];

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surfaceSecondary },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing["3xl"] },
  profileHead: { alignItems: "center", gap: spacing.sm },
  actions: { alignSelf: "stretch", gap: spacing.sm, marginTop: spacing.sm },
  name: { fontSize: 20, fontWeight: "800", color: c.onSurface, marginTop: spacing.sm },
  classLabel: { fontSize: 14, color: c.muted, fontWeight: "600" },
  miniRow: { flexDirection: "row", gap: spacing.md },
  mini: { flex: 1, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 12, padding: spacing.md, alignItems: "center", gap: 2 },
  miniVal: { fontSize: 18, fontWeight: "800" },
  miniLabel: { fontSize: 11, color: c.muted, fontWeight: "600" },
  cardTitle: { fontSize: 15, fontWeight: "800", color: c.onSurface, marginBottom: spacing.md },
  detailRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: spacing.sm },
  detailLabel: { fontSize: 14, color: c.muted },
  detailValue: { fontSize: 14, fontWeight: "600", color: c.onSurface, maxWidth: "60%", textAlign: "right" },
  attRow: { flexDirection: "row", alignItems: "center", gap: spacing.xl },
  legendCol: { flex: 1, gap: spacing.md },
  histRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: spacing.sm },
  histDate: { fontSize: 14, color: c.onSurfaceSecondary },
  feeFigures: { flexDirection: "row", justifyContent: "space-between", marginTop: spacing.md, marginBottom: spacing.sm },
  feeBlock: { gap: 2 },
  feeLabel: { fontSize: 12, color: c.muted, fontWeight: "600" },
  feeValue: { fontSize: 15, fontWeight: "800", color: c.onSurface },
  payRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.sm },
  payBody: { flex: 1 },
  payTitle: { fontSize: 14, fontWeight: "700", color: c.onSurface },
  paySub: { fontSize: 12, color: c.muted },
  payAmt: { fontSize: 14, fontWeight: "800", color: c.success },
  subjRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: spacing.md },
  subjName: { fontSize: 14, fontWeight: "600", color: c.onSurface },
  subjMarks: { fontSize: 14, fontWeight: "700", color: c.onSurfaceSecondary, marginRight: spacing.md },
}));

function DetailRow({ label, value }: { label: string; value: string }) {
  const s = useStyles();
  return (
    <View style={s.detailRow}>
      <Text style={s.detailLabel}>{label}</Text>
      <Text style={s.detailValue}>{value}</Text>
    </View>
  );
}

export default function StudentProfile() {
  const s = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const { db, deactivateStudent } = useData();
  const toast = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [tab, setTab] = useState("overview");

  const student = getStudent(db, id);
  if (!student) {
    return (
      <View style={s.root}>
        <StackHeader title="Student" />
        <EmptyState title="Student not found" message="This record is unavailable." />
      </View>
    );
  }

  const guardian = db.guardians.find((g) => g.id === student.guardianId);
  const attn = studentAttendance(db, student.id);
  const fee = studentFee(db, student);
  const perf = studentPerformance(db, student.id);
  const results = studentResults(db, student.id);
  const payments = studentPayments(db, student.id);
  const history = db.attendance
    .filter((a) => a.studentId === student.id)
    .sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf())
    .slice(0, 12);

  const statusTone = (st: string): Tone => (st === "present" ? "success" : st === "late" ? "warning" : "error");

  return (
    <View style={s.root}>
      <StackHeader title={student.name} subtitle={classSectionLabel(db, student)} />
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.profileHead}>
          <Avatar name={student.name} index={student.avatarIndex} size={76} />
          <Text style={s.name}>{student.name}</Text>
          <Text style={s.classLabel}>
            {className(db, student.classId)} — {sectionName(db, student.sectionId)} · Roll {student.rollNo}
          </Text>
          <Badge label={student.status === "active" ? "Active" : "Inactive"} tone={student.status === "active" ? "success" : "neutral"} />
          {student.status === "active" ? (
            <View style={s.actions}>
              <PrimaryButton
                label="Edit Student"
                onPress={() => router.push({ pathname: "/student/form", params: { id: student.id } })}
                testID="edit-student-button"
              />
              <SecondaryButton
                label="Deactivate Student"
                onPress={() =>
                  Alert.alert(
                    "Deactivate Student",
                    `${student.name} will be removed from active school operations, including attendance rolls, fees, academics, reports, and dashboard statistics. Attendance history, fee payments, and academic results will be preserved.`,
                    [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Deactivate Student",
                        style: "destructive",
                        onPress: () => {
                          deactivateStudent(student.id);
                          toast.show("Student deactivated", "info");
                          router.back();
                        },
                      },
                    ],
                  )
                }
                testID="deactivate-student-button"
              />
            </View>
          ) : null}
        </View>

        <View style={s.miniRow}>
          <View style={s.mini}>
            <Text style={[s.miniVal, { color: attn.total === 0 ? colors.muted : colors.success }]}>
              {attn.total === 0 ? "—" : `${attn.percentage}%`}
            </Text>
            <Text style={s.miniLabel}>Attendance</Text>
          </View>
          <View style={s.mini}>
            <Text style={[s.miniVal, { color: perf.total === 0 ? colors.muted : fee.outstanding > 0 ? colors.error : colors.success }]}>
              {perf.total === 0 ? "—" : `${perf.average}%`}
            </Text>
            <Text style={s.miniLabel}>{perf.total === 0 ? "No marks" : `Avg · ${perf.grade}`}</Text>
          </View>
          <View style={s.mini}>
            <Text style={[s.miniVal, { color: fee.outstanding > 0 ? colors.error : colors.success }]}>
              {fee.outstanding > 0 ? "Due" : "Paid"}
            </Text>
            <Text style={s.miniLabel}>Fee Status</Text>
          </View>
        </View>

        <SegmentedTabs options={TABS} selected={tab} onSelect={setTab} testIDPrefix="profile-tab" />

        {tab === "overview" ? (
          <>
            <Card>
              <Text style={s.cardTitle}>Student Details</Text>
              <DetailRow label="Admission No." value={student.admissionNo} />
              <Divider />
              <DetailRow label="Class" value={className(db, student.classId)} />
              <Divider />
              <DetailRow label="Section" value={sectionName(db, student.sectionId)} />
              <Divider />
              <DetailRow label="Roll Number" value={String(student.rollNo)} />
              <Divider />
              <DetailRow label="Date of Birth" value={dayjs(student.dob).format("DD MMM YYYY")} />
              <Divider />
              <DetailRow label="Gender" value={student.gender} />
            </Card>

            <Card>
              <Text style={s.cardTitle}>Parent / Guardian</Text>
              <DetailRow label="Name" value={guardian?.name ?? "—"} />
              <Divider />
              <DetailRow label="Relation" value={guardian?.relation ?? "—"} />
              <Divider />
              <DetailRow label="Occupation" value={guardian?.occupation || "—"} />
              <Divider />
              <DetailRow label="Phone" value={guardian?.phone || "—"} />
              <Divider />
              <DetailRow label="Email" value={guardian?.email || "—"} />
            </Card>

            <Card>
              <Text style={s.cardTitle}>Contact Information</Text>
              <DetailRow label="Student Phone" value={student.phone} />
              <Divider />
              <DetailRow label="Student Email" value={student.email} />
              <Divider />
              <DetailRow label="Address" value={student.address} />
            </Card>
          </>
        ) : null}

        {tab === "attendance" ? (
          attn.total === 0 ? (
            <Card>
              <Text style={s.cardTitle}>Attendance Summary</Text>
              <Text style={s.paySub}>No attendance has been recorded for this student yet.</Text>
            </Card>
          ) : (
          <>
            <Card>
              <Text style={s.cardTitle}>Attendance Summary</Text>
              <View style={s.attRow}>
                <DonutChart
                  segments={[
                    { value: attn.present, color: colors.success },
                    { value: attn.late, color: colors.warning },
                    { value: attn.absent, color: colors.error },
                  ]}
                  centerTop={`${attn.percentage}%`}
                  centerBottom="Overall"
                />
                <View style={s.legendCol}>
                  <LegendRow color={colors.success} label="Present" value={String(attn.present)} />
                  <LegendRow color={colors.warning} label="Late" value={String(attn.late)} />
                  <LegendRow color={colors.error} label="Absent" value={String(attn.absent)} />
                  <LegendRow color={colors.muted} label="Total days" value={String(attn.total)} />
                </View>
              </View>
            </Card>
            <Card>
              <Text style={s.cardTitle}>Recent Attendance</Text>
              {history.map((h, i) => (
                <View key={h.date}>
                  {i > 0 ? <Divider /> : null}
                  <View style={s.histRow}>
                    <Text style={s.histDate}>{dayjs(h.date).format("ddd, DD MMM YYYY")}</Text>
                    <Badge label={h.status[0].toUpperCase() + h.status.slice(1)} tone={statusTone(h.status)} />
                  </View>
                </View>
              ))}
            </Card>
          </>
          )
        ) : null}

        {tab === "fees" ? (
          <Card>
            <Text style={s.cardTitle}>Fee Summary</Text>
            <StatBar value={fee.paid} max={fee.total} color={colors.success} />
            <View style={s.feeFigures}>
              <View style={s.feeBlock}>
                <Text style={s.feeLabel}>Total</Text>
                <Text style={s.feeValue}>{formatINR(fee.total)}</Text>
              </View>
              <View style={s.feeBlock}>
                <Text style={s.feeLabel}>Paid</Text>
                <Text style={[s.feeValue, { color: colors.success }]}>{formatINR(fee.paid)}</Text>
              </View>
              <View style={s.feeBlock}>
                <Text style={s.feeLabel}>Outstanding</Text>
                <Text style={[s.feeValue, { color: colors.error }]}>{formatINR(fee.outstanding)}</Text>
              </View>
            </View>
            <Divider style={{ marginVertical: spacing.sm }} />
            <Text style={[s.cardTitle, { marginTop: spacing.sm }]}>Payment History</Text>
            {payments.length === 0 ? (
              <Text style={s.paySub}>No payments recorded yet.</Text>
            ) : (
              payments.map((p, i) => (
                <View key={p.id}>
                  {i > 0 ? <Divider /> : null}
                  <View style={s.payRow}>
                    <Receipt size={22} color={colors.success} weight="duotone" />
                    <View style={s.payBody}>
                      <Text style={s.payTitle}>{p.receiptNo}</Text>
                      <Text style={s.paySub}>
                        {p.method} · {dayjs(p.date).format("DD MMM YYYY")}
                      </Text>
                    </View>
                    <Text style={s.payAmt}>{formatINR(p.amount)}</Text>
                  </View>
                </View>
              ))
            )}
            <PrimaryButton
              label="Open Fee Details"
              onPress={() => router.push({ pathname: "/fees/[studentId]", params: { studentId: student.id } })}
              style={{ marginTop: spacing.lg }}
              testID="profile-open-fees"
            />
          </Card>
        ) : null}

        {tab === "academics" ? (
          results.length === 0 ? (
            <Card>
              <Text style={s.cardTitle}>Academic Performance — Term 1</Text>
              <Text style={s.paySub}>No academic results have been recorded for this student yet.</Text>
            </Card>
          ) : (
          <Card>
            <Text style={s.cardTitle}>Academic Performance — Term 1</Text>
            <View style={s.miniRow}>
              <View style={s.mini}>
                <Text style={[s.miniVal, { color: colors.brandPrimary }]}>{perf.average}%</Text>
                <Text style={s.miniLabel}>Average</Text>
              </View>
              <View style={s.mini}>
                <Text style={[s.miniVal, { color: colors.brandPrimary }]}>{perf.grade}</Text>
                <Text style={s.miniLabel}>Grade</Text>
              </View>
              <View style={s.mini}>
                <Text style={[s.miniVal, { color: colors.onSurface }]}>
                  {perf.obtained}/{perf.total}
                </Text>
                <Text style={s.miniLabel}>Marks</Text>
              </View>
            </View>
            <Divider style={{ marginVertical: spacing.md }} />
            {results.map((r, i) => (
              <View key={r.subjectId}>
                {i > 0 ? <Divider /> : null}
                <View style={s.subjRow}>
                  <Text style={s.subjName}>{r.subject}</Text>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={s.subjMarks}>
                      {r.marks}/{r.maxMarks}
                    </Text>
                    <Badge
                      label={r.grade}
                      tone={r.percentage >= 75 ? "success" : r.percentage >= 50 ? "warning" : "error"}
                    />
                  </View>
                </View>
              </View>
            ))}
          </Card>
          )
        ) : null}
      </ScrollView>
    </View>
  );
}
