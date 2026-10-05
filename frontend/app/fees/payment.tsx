import { useLocalSearchParams, useRouter } from "expo-router";
import { X } from "phosphor-react-native";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { FilterChips, PrimaryButton } from "@/src/components/ui/controls";
import { EmptyState, useToast } from "@/src/components/ui/feedback";
import { Avatar, Card } from "@/src/components/ui/primitives";
import { useData } from "@/src/data/store";
import { classSectionLabel, formatINR, getStudent, studentFee } from "@/src/data/compute";
import { FeePayment } from "@/src/data/types";
import { makeStyles, radius, spacing, useTheme } from "@/src/theme";

const METHODS = [
  { key: "Cash", label: "Cash" },
  { key: "UPI", label: "UPI" },
  { key: "Online", label: "Online" },
  { key: "Cheque", label: "Cheque" },
  { key: "Card", label: "Card" },
];

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  close: { width: 36, height: 36, borderRadius: 18, backgroundColor: c.surfaceTertiary, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 18, fontWeight: "800", color: c.onSurface },
  content: { padding: spacing.lg, gap: spacing.lg },
  studentRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  name: { fontSize: 16, fontWeight: "800", color: c.onSurface },
  sub: { fontSize: 13, color: c.muted },
  outLabel: { fontSize: 12, color: c.muted, fontWeight: "600", marginTop: spacing.md },
  outValue: { fontSize: 22, fontWeight: "800", color: c.error },
  fieldLabel: { fontSize: 13, fontWeight: "700", color: c.onSurfaceSecondary, marginBottom: spacing.sm },
  amountWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    height: 56,
    backgroundColor: c.surfaceSecondary,
  },
  rupee: { fontSize: 20, fontWeight: "800", color: c.onSurface, marginRight: spacing.sm },
  amountInput: { flex: 1, fontSize: 20, fontWeight: "800", color: c.onSurface, padding: 0 },
  quickRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  quick: { paddingHorizontal: spacing.lg, height: 34, borderRadius: radius.pill, borderWidth: 1, borderColor: c.borderStrong, alignItems: "center", justifyContent: "center" },
  quickText: { fontSize: 13, fontWeight: "700", color: c.brandPrimary },
  input: {
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    height: 48,
    backgroundColor: c.surfaceSecondary,
    fontSize: 15,
    color: c.onSurface,
  },
  demo: { backgroundColor: c.warningSoft, borderRadius: radius.md, padding: spacing.md },
  demoText: { fontSize: 12, color: c.onWarningSoft, fontWeight: "600", lineHeight: 18 },
  footer: { padding: spacing.lg, borderTopWidth: 1, borderTopColor: c.border },
}));

export default function PaymentScreen() {
  const s = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { db, recordPayment } = useData();
  const { studentId } = useLocalSearchParams<{ studentId: string }>();

  const student = getStudent(db, studentId);
  const fee = student ? studentFee(db, student) : null;

  const [amount, setAmount] = useState(fee ? String(fee.outstanding) : "");
  const [method, setMethod] = useState("UPI");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!student || !fee) {
    return (
      <View style={s.root}>
        <View style={[s.header, { paddingTop: insets.top + spacing.md }]}>
          <Text style={s.title}>Record Payment</Text>
        </View>
        <EmptyState title="Student not found" />
      </View>
    );
  }

  const onSubmit = () => {
    const value = Number(amount);
    if (!value || value <= 0) {
      toast.show("Enter a valid amount", "error");
      return;
    }
    if (value > fee.outstanding) {
      toast.show(`Amount cannot exceed ${formatINR(fee.outstanding)}`, "error");
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      const payment: FeePayment = recordPayment({
        studentId: student.id,
        amount: value,
        method: method as FeePayment["method"],
        reference: reference.trim() || undefined,
        note: note.trim() || undefined,
      });
      setSubmitting(false);
      toast.show("Payment recorded successfully", "success");
      router.replace({ pathname: "/fees/receipt", params: { paymentId: payment.id } });
    }, 500);
  };

  return (
    <View style={s.root}>
      <View style={[s.header, { paddingTop: insets.top + spacing.md }]}>
        <Pressable style={s.close} onPress={() => router.back()} testID="payment-close">
          <X size={18} color={colors.onSurface} weight="bold" />
        </Pressable>
        <Text style={s.title}>Record Payment</Text>
      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={s.content}
        bottomOffset={20}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Card>
          <View style={s.studentRow}>
            <Avatar name={student.name} index={student.avatarIndex} size={48} />
            <View style={{ flex: 1 }}>
              <Text style={s.name}>{student.name}</Text>
              <Text style={s.sub}>{classSectionLabel(db, student)}</Text>
            </View>
          </View>
          <Text style={s.outLabel}>Outstanding Amount</Text>
          <Text style={s.outValue}>{formatINR(fee.outstanding)}</Text>
        </Card>

        <View>
          <Text style={s.fieldLabel}>Payment Amount</Text>
          <View style={s.amountWrap}>
            <Text style={s.rupee}>₹</Text>
            <TextInput
              value={amount}
              onChangeText={(t) => setAmount(t.replace(/[^0-9]/g, ""))}
              keyboardType="number-pad"
              style={s.amountInput}
              placeholder="0"
              placeholderTextColor={colors.muted}
              testID="payment-amount-input"
            />
          </View>
          <View style={s.quickRow}>
            <Pressable style={s.quick} onPress={() => setAmount(String(fee.outstanding))} testID="quick-full">
              <Text style={s.quickText}>Full ({formatINR(fee.outstanding)})</Text>
            </Pressable>
            <Pressable style={s.quick} onPress={() => setAmount(String(Math.round(fee.outstanding / 2)))} testID="quick-half">
              <Text style={s.quickText}>Half</Text>
            </Pressable>
          </View>
        </View>

        <View>
          <Text style={s.fieldLabel}>Payment Mode</Text>
          <FilterChips options={METHODS} selected={method} onSelect={setMethod} testIDPrefix="method" />
        </View>

        <View>
          <Text style={s.fieldLabel}>Reference No. (optional)</Text>
          <TextInput
            value={reference}
            onChangeText={setReference}
            style={s.input}
            placeholder="Transaction / Cheque reference"
            placeholderTextColor={colors.muted}
            autoCapitalize="characters"
            testID="payment-reference-input"
          />
        </View>

        <View>
          <Text style={s.fieldLabel}>Note (optional)</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            style={s.input}
            placeholder="e.g. Second installment"
            placeholderTextColor={colors.muted}
            testID="payment-note-input"
          />
        </View>

        <View style={s.demo}>
          <Text style={s.demoText}>
            This is a DEMO transaction. No real money is collected and no payment gateway is involved. A simulated receipt will be generated.
          </Text>
        </View>
      </KeyboardAwareScrollView>

      <View style={[s.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <PrimaryButton label="Record Demo Payment" onPress={onSubmit} loading={submitting} testID="submit-payment-button" />
      </View>
    </View>
  );
}
