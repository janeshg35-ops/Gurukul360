import dayjs from "dayjs";
import { useLocalSearchParams, useRouter } from "expo-router";
import { CheckCircle } from "phosphor-react-native";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useLiveStudent } from "@/src/auth/use-live-student";
import { StackHeader } from "@/src/components/screen-header";
import { PrimaryButton } from "@/src/components/ui/controls";
import { EmptyState, LoadingView } from "@/src/components/ui/feedback";
import { Card, Divider } from "@/src/components/ui/primitives";
import { useData } from "@/src/data/store";
import { formatINR, paymentMethodLabel, studentFee } from "@/src/data/compute";
import { makeStyles, radius, spacing, useTheme } from "@/src/theme";

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surfaceSecondary },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing["3xl"] },
  successWrap: { alignItems: "center", gap: spacing.sm },
  successText: { fontSize: 20, fontWeight: "800", color: c.onSurface },
  successSub: { fontSize: 13, color: c.muted, textAlign: "center" },
  demo: { backgroundColor: c.warningSoft, borderRadius: radius.md, padding: spacing.md },
  demoText: { fontSize: 12, color: c.onWarningSoft, fontWeight: "700", lineHeight: 18, textAlign: "center" },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: spacing.sm, gap: spacing.md },
  label: { fontSize: 14, color: c.muted, flex: 1 },
  value: { fontSize: 14, fontWeight: "700", color: c.onSurface, maxWidth: "58%", textAlign: "right" },
  footer: { padding: spacing.lg, backgroundColor: c.surface, borderTopWidth: 1, borderTopColor: c.border },
}));

export default function StudentFeeReceipt() {
  const s = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { db } = useData();
  const { student, ready } = useLiveStudent();
  const params = useLocalSearchParams<{ paymentId?: string; prior?: string }>();
  const paymentId = Array.isArray(params.paymentId) ? params.paymentId[0] : params.paymentId;
  const prior = Array.isArray(params.prior) ? params.prior[0] : params.prior;

  if (!ready || !student) {
    return (
      <View style={s.root}>
        <LoadingView />
      </View>
    );
  }

  const payment = db.payments.find((item) => item.id === paymentId && item.studentId === student.id);

  if (!payment) {
    return (
      <View style={s.root}>
        <StackHeader title="Payment" subtitle={student.admissionNo} />
        <EmptyState title="Receipt not available" message="This payment is not on your fee record." />
      </View>
    );
  }

  const fee = studentFee(db, student);
  const priorValue = Number(prior);
  const previousOutstanding = Number.isFinite(priorValue) ? priorValue : fee.outstanding + payment.amount;
  const goStatus = () => router.replace("/student-fees");

  return (
    <View style={s.root}>
      <StackHeader title="Payment Receipt" subtitle={student.admissionNo} onBack={goStatus} />
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.successWrap}>
          <CheckCircle size={56} color={colors.success} weight="fill" />
          <Text style={s.successText} testID="payment-successful">Payment Successful</Text>
          <Text style={s.successSub}>A simulated receipt was added to your fee record.</Text>
        </View>
        <View style={s.demo} testID="demo-simulated">
          <Text style={s.demoText}>Demo / Simulated Payment. This is not a bank transaction.</Text>
        </View>
        <Card testID="student-fee-receipt">
          <View style={s.row}>
            <Text style={s.label}>Student Name</Text>
            <Text style={s.value} testID="receipt-student-name">{student.name}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.label}>Admission Number</Text>
            <Text style={s.value} testID="receipt-admission">{student.admissionNo}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.label}>Amount Paid</Text>
            <Text style={s.value} testID="receipt-amount">{formatINR(payment.amount)}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.label}>Payment Method</Text>
            <Text style={s.value} testID="receipt-method">{paymentMethodLabel(payment.method, payment.reference)}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.label}>Receipt Number</Text>
            <Text style={s.value} testID="receipt-number">{payment.receiptNo}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.label}>Reference</Text>
            <Text style={s.value} testID="receipt-reference">{payment.reference || "—"}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.label}>Payment Date</Text>
            <Text style={s.value} testID="receipt-date">{dayjs(payment.date).format("DD MMM YYYY, hh:mm A")}</Text>
          </View>
          <Divider />
          <View style={s.row}>
            <Text style={s.label}>Previous Outstanding</Text>
            <Text style={s.value} testID="receipt-previous">{formatINR(previousOutstanding)}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.label}>Remaining Outstanding</Text>
            <Text style={[s.value, { color: fee.outstanding > 0 ? colors.error : colors.success }]} testID="receipt-remaining">
              {formatINR(fee.outstanding)}
            </Text>
          </View>
        </Card>
      </ScrollView>
      <View style={[s.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <PrimaryButton label="View Fee Status" onPress={goStatus} testID="view-fee-status" />
      </View>
    </View>
  );
}
