import dayjs from "dayjs";
import { useLocalSearchParams, useRouter } from "expo-router";
import { CheckCircle, Receipt } from "phosphor-react-native";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { StackHeader } from "@/src/components/screen-header";
import { PrimaryButton } from "@/src/components/ui/controls";
import { EmptyState } from "@/src/components/ui/feedback";
import { Avatar, Badge, Card, Divider, StatBar } from "@/src/components/ui/primitives";
import { useData } from "@/src/data/store";
import {
  classSectionLabel,
  feeStatus,
  formatINR,
  getStudent,
  studentFee,
  studentPayments,
} from "@/src/data/compute";
import { makeStyles, spacing, useTheme } from "@/src/theme";

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surfaceSecondary },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing["3xl"] },
  head: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  name: { fontSize: 17, fontWeight: "800", color: c.onSurface },
  sub: { fontSize: 13, color: c.muted },
  cardTitle: { fontSize: 15, fontWeight: "800", color: c.onSurface, marginBottom: spacing.md },
  figures: { flexDirection: "row", justifyContent: "space-between", marginTop: spacing.md },
  block: { gap: 2 },
  label: { fontSize: 12, color: c.muted, fontWeight: "600" },
  value: { fontSize: 16, fontWeight: "800", color: c.onSurface },
  headRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: spacing.sm },
  headName: { fontSize: 14, color: c.onSurfaceSecondary },
  headAmt: { fontSize: 14, fontWeight: "700", color: c.onSurface },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingTop: spacing.md },
  totalLabel: { fontSize: 15, fontWeight: "800", color: c.onSurface },
  totalAmt: { fontSize: 15, fontWeight: "800", color: c.brandPrimary },
  payRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.sm },
  payBody: { flex: 1 },
  payTitle: { fontSize: 14, fontWeight: "700", color: c.onSurface },
  paySub: { fontSize: 12, color: c.muted },
  payAmt: { fontSize: 14, fontWeight: "800", color: c.success },
  footer: { padding: spacing.lg, backgroundColor: c.surface, borderTopWidth: 1, borderTopColor: c.border },
  paidBanner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, padding: spacing.md },
  paidText: { fontSize: 14, fontWeight: "700", color: c.success },
}));

export default function FeeDetail() {
  const s = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { db } = useData();
  const { studentId } = useLocalSearchParams<{ studentId: string }>();

  const student = getStudent(db, studentId);
  if (!student) {
    return (
      <View style={s.root}>
        <StackHeader title="Fees" />
        <EmptyState title="Student not found" />
      </View>
    );
  }

  const fee = studentFee(db, student);
  const payments = studentPayments(db, student.id);
  const status = feeStatus(fee);
  const heads = student.feeHeadIds
    .map((hid) => db.feeHeads.find((h) => h.id === hid))
    .filter(Boolean);

  return (
    <View style={s.root}>
      <StackHeader title="Fee Details" subtitle={student.name} />
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <Card>
          <View style={s.head}>
            <Avatar name={student.name} index={student.avatarIndex} size={48} />
            <View style={{ flex: 1 }}>
              <Text style={s.name}>{student.name}</Text>
              <Text style={s.sub}>
                {classSectionLabel(db, student)} · {student.admissionNo}
              </Text>
            </View>
            <Badge
              label={status === "paid" ? "Paid" : status === "partial" ? "Partial" : "Pending"}
              tone={status === "paid" ? "success" : status === "partial" ? "warning" : "error"}
            />
          </View>
          <Divider style={{ marginVertical: spacing.md }} />
          <StatBar value={fee.paid} max={fee.total} color={colors.success} />
          <View style={s.figures}>
            <View style={s.block}>
              <Text style={s.label}>Total Fee</Text>
              <Text style={s.value}>{formatINR(fee.total)}</Text>
            </View>
            <View style={s.block}>
              <Text style={s.label}>Paid</Text>
              <Text style={[s.value, { color: colors.success }]}>{formatINR(fee.paid)}</Text>
            </View>
            <View style={s.block}>
              <Text style={s.label}>Outstanding</Text>
              <Text style={[s.value, { color: colors.error }]}>{formatINR(fee.outstanding)}</Text>
            </View>
          </View>
        </Card>

        <Card>
          <Text style={s.cardTitle}>Fee Structure</Text>
          {heads.map((h, i) => (
            <View key={h!.id}>
              {i > 0 ? <Divider /> : null}
              <View style={s.headRow}>
                <Text style={s.headName}>{h!.name}</Text>
                <Text style={s.headAmt}>{formatINR(h!.amount)}</Text>
              </View>
            </View>
          ))}
          <Divider />
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Total Payable</Text>
            <Text style={s.totalAmt}>{formatINR(fee.total)}</Text>
          </View>
        </Card>

        <Card>
          <Text style={s.cardTitle}>Payment History</Text>
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
                      {p.method} · {dayjs(p.date).format("DD MMM YYYY, hh:mm A")}
                    </Text>
                  </View>
                  <Text
                    style={s.payAmt}
                    onPress={() => router.push({ pathname: "/fees/receipt", params: { paymentId: p.id } })}
                  >
                    {formatINR(p.amount)}
                  </Text>
                </View>
              </View>
            ))
          )}
        </Card>
      </ScrollView>

      <View style={[s.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        {fee.outstanding > 0 ? (
          <PrimaryButton
            label="Record Payment"
            onPress={() => router.push({ pathname: "/fees/payment", params: { studentId: student.id } })}
            testID="record-payment-button"
          />
        ) : (
          <View style={s.paidBanner}>
            <CheckCircle size={20} color={colors.success} weight="fill" />
            <Text style={s.paidText}>All dues cleared</Text>
          </View>
        )}
      </View>
    </View>
  );
}
