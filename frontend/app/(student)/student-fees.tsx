import dayjs from "dayjs";
import { useRouter } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useLiveStudent } from "@/src/auth/use-live-student";
import { StackHeader } from "@/src/components/screen-header";
import { PrimaryButton } from "@/src/components/ui/controls";
import { EmptyState, LoadingView } from "@/src/components/ui/feedback";
import { Badge, Card, Divider } from "@/src/components/ui/primitives";
import { useData } from "@/src/data/store";
import { feeStatus, formatINR, paymentMethodLabel, studentFee, studentPayments } from "@/src/data/compute";
import { makeStyles, spacing, useTheme } from "@/src/theme";

const LABEL = { paid: "Paid", partial: "Partial", pending: "Pending" } as const;

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surfaceSecondary },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing["3xl"] },
  figure: { gap: 2 },
  label: { fontSize: 12, color: c.muted, fontWeight: "700" },
  value: { fontSize: 22, fontWeight: "800", color: c.onSurface },
  statusRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: spacing.md },
  statusLabel: { fontSize: 14, color: c.muted, fontWeight: "700" },
  section: { fontSize: 16, fontWeight: "800", color: c.onSurface },
  paidBanner: {
    backgroundColor: c.successSoft,
    borderRadius: 12,
    padding: spacing.lg,
    gap: 4,
  },
  paidTitle: { fontSize: 16, fontWeight: "800", color: c.onSuccessSoft },
  paidBody: { fontSize: 13, color: c.onSuccessSoft, lineHeight: 18 },
  payTitle: { fontSize: 15, fontWeight: "800", color: c.onSurface },
  paySub: { fontSize: 13, color: c.muted, marginTop: 2 },
  payAmt: { fontSize: 15, fontWeight: "800", color: c.onSurface },
  row: { flexDirection: "row", justifyContent: "space-between", gap: spacing.md, paddingVertical: spacing.sm },
  footer: { padding: spacing.lg, backgroundColor: c.surface, borderTopWidth: 1, borderTopColor: c.border },
}));

export default function StudentFees() {
  const s = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { db } = useData();
  const { student, ready } = useLiveStudent();

  if (!ready || !student) {
    return (
      <View style={s.root}>
        <LoadingView />
      </View>
    );
  }

  const fee = studentFee(db, student);
  const status = feeStatus(fee);
  const tone = status === "paid" ? "success" : status === "partial" ? "warning" : "error";
  const history = studentPayments(db, student.id);

  return (
    <View style={s.root}>
      <StackHeader title="Fee Status" subtitle={student.admissionNo} />
      <ScrollView contentContainerStyle={s.content}>
        <Card testID="student-fees">
          <View style={s.figure}>
            <Text style={s.label}>Total Fee</Text>
            <Text style={s.value} testID="fee-total">{formatINR(fee.total)}</Text>
          </View>
          <View style={[s.figure, { marginTop: spacing.lg }]}>
            <Text style={s.label}>Paid</Text>
            <Text style={s.value} testID="fee-paid">{formatINR(fee.paid)}</Text>
          </View>
          <View style={[s.figure, { marginTop: spacing.lg }]}>
            <Text style={s.label}>Outstanding</Text>
            <Text style={s.value} testID="fee-outstanding">{formatINR(fee.outstanding)}</Text>
          </View>
          <View style={s.statusRow}>
            <Text style={s.statusLabel}>Status</Text>
            <Badge label={LABEL[status]} tone={tone} testID="fee-status" />
          </View>
        </Card>

        {fee.outstanding === 0 ? (
          <View style={s.paidBanner} testID="fully-paid-state">
            <Text style={s.paidTitle}>Fully Paid</Text>
            <Text style={s.paidBody}>There is no outstanding balance.</Text>
          </View>
        ) : null}

        <Text style={s.section}>Payment History</Text>
        <Card testID="payment-history">
          {history.length === 0 ? (
            <EmptyState title="No payments yet" message="Payments recorded for this student will appear here." />
          ) : (
            history.map((payment, index) => (
              <View key={payment.id}>
                {index > 0 ? <Divider /> : null}
                <View style={s.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.payTitle} testID={`history-receipt-${payment.receiptNo}`}>{payment.receiptNo}</Text>
                    <Text style={s.paySub}>
                      {dayjs(payment.date).format("DD MMM YYYY, hh:mm A")}
                      {" · "}
                      {paymentMethodLabel(payment.method, payment.reference)}
                    </Text>
                    {payment.reference ? <Text style={s.paySub}>{payment.reference}</Text> : null}
                  </View>
                  <Text style={[s.payAmt, { color: colors.success }]}>{formatINR(payment.amount)}</Text>
                </View>
              </View>
            ))
          )}
        </Card>
      </ScrollView>
      {fee.outstanding > 0 ? (
        <View style={[s.footer, { paddingBottom: insets.bottom + spacing.md }]}>
          <PrimaryButton
            label="Pay Fees"
            onPress={() => router.push("/student-fee-payment")}
            testID="pay-fees-button"
          />
        </View>
      ) : null}
    </View>
  );
}
