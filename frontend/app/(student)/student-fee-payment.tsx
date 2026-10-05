import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useLiveStudent } from "@/src/auth/use-live-student";
import { StackHeader } from "@/src/components/screen-header";
import { PrimaryButton, SecondaryButton } from "@/src/components/ui/controls";
import { LoadingView } from "@/src/components/ui/feedback";
import { Card } from "@/src/components/ui/primitives";
import { useData } from "@/src/data/store";
import { formatINR, paymentMethodLabel, studentFee } from "@/src/data/compute";
import { FeePayment } from "@/src/data/types";
import { makeStyles, radius, spacing, useTheme } from "@/src/theme";

const METHODS: { key: FeePayment["method"]; label: string }[] = [
  { key: "UPI", label: "UPI" },
  { key: "Card", label: "Card" },
  { key: "Online", label: "Net Banking" },
];

function parsePaymentAmount(raw: string): { ok: true; value: number } | { ok: false; error: string } {
  const cleaned = raw.replace(/[₹,\s]/g, "");
  if (!/^\d+$/.test(cleaned)) return { ok: false, error: "Enter a valid amount." };
  const value = Number(cleaned);
  if (!Number.isSafeInteger(value) || value <= 0) {
    return { ok: false, error: "Enter an amount greater than 0." };
  }
  return { ok: true, value };
}

function demoReference(method: FeePayment["method"], existing: string[]): string {
  const tag = method === "UPI" ? "UPI" : method === "Card" ? "CARD" : "NB";
  const used = new Set(existing);
  let reference = "";
  do {
    const token = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`.toUpperCase();
    reference = `DEMO-${tag}-${token}`;
  } while (used.has(reference));
  return reference;
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surfaceSecondary },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing["3xl"] },
  name: { fontSize: 18, fontWeight: "800", color: c.onSurface },
  admission: { fontSize: 13, color: c.muted, marginTop: 2 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: spacing.sm, gap: spacing.md },
  label: { fontSize: 13, color: c.muted, fontWeight: "600" },
  value: { fontSize: 14, fontWeight: "800", color: c.onSurface, textAlign: "right" },
  fieldLabel: { fontSize: 13, fontWeight: "700", color: c.onSurfaceSecondary },
  amountWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    height: 56,
    backgroundColor: c.surface,
    marginTop: spacing.sm,
  },
  rupee: { fontSize: 20, fontWeight: "800", color: c.onSurface, marginRight: spacing.sm },
  amountInput: { flex: 1, fontSize: 20, fontWeight: "800", color: c.onSurface, padding: 0 },
  hint: { fontSize: 13, color: c.muted, marginTop: spacing.sm },
  remaining: { fontSize: 15, fontWeight: "800", color: c.onSurface, marginTop: spacing.sm },
  error: { fontSize: 13, fontWeight: "700", color: c.error, marginTop: spacing.sm },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.sm },
  chip: {
    height: 36,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  chipOn: { backgroundColor: c.brandPrimary, borderColor: c.brandPrimary },
  chipText: { fontSize: 13, fontWeight: "700", color: c.onSurface },
  chipTextOn: { color: c.onBrandPrimary },
  demo: { backgroundColor: c.warningSoft, borderRadius: radius.md, padding: spacing.md },
  demoText: { fontSize: 12, color: c.onWarningSoft, fontWeight: "600", lineHeight: 18 },
  paidBanner: { backgroundColor: c.successSoft, borderRadius: radius.md, padding: spacing.lg, gap: 4 },
  paidTitle: { fontSize: 16, fontWeight: "800", color: c.onSuccessSoft },
  paidBody: { fontSize: 13, color: c.onSuccessSoft, lineHeight: 18 },
  footer: { padding: spacing.lg, gap: spacing.sm, backgroundColor: c.surface, borderTopWidth: 1, borderTopColor: c.border },
}));

export default function StudentFeePayment() {
  const s = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { db, recordPayment } = useData();
  const { student, ready } = useLiveStudent();
  const fee = student ? studentFee(db, student) : null;

  const [amountText, setAmountText] = useState("");
  const [seeded, setSeeded] = useState(false);
  const [method, setMethod] = useState<FeePayment["method"]>("UPI");
  const [step, setStep] = useState<"amount" | "review">("amount");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!fee || seeded) return;
    setAmountText(fee.outstanding > 0 ? String(fee.outstanding) : "");
    setSeeded(true);
  }, [fee, seeded]);

  if (!ready || !student || !fee) {
    return (
      <View style={s.root}>
        <LoadingView />
      </View>
    );
  }

  const parsed = parsePaymentAmount(amountText);
  const payable = parsed.ok ? parsed.value : null;
  const withinBalance = payable != null && payable <= fee.outstanding;
  const remaining = withinBalance && payable != null ? fee.outstanding - payable : null;
  const methodLabel = paymentMethodLabel(method, method === "Online" ? "DEMO-NB-" : undefined);

  const onReview = () => {
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }
    if (parsed.value > fee.outstanding) {
      setError(`Amount cannot exceed ${formatINR(fee.outstanding)}.`);
      return;
    }
    setError(null);
    setStep("review");
  };

  const onConfirm = () => {
    if (!parsed.ok) {
      setError(parsed.error);
      setStep("amount");
      return;
    }
    if (parsed.value > fee.outstanding) {
      setError(`Amount cannot exceed ${formatINR(fee.outstanding)}.`);
      setStep("amount");
      return;
    }
    const prior = fee.outstanding;
    const reference = demoReference(
      method,
      db.payments.map((payment) => payment.reference).filter((value): value is string => !!value),
    );
    setSubmitting(true);
    setTimeout(() => {
      const payment = recordPayment({
        studentId: student.id,
        amount: parsed.value,
        method,
        reference,
        note: "Simulated payment",
      });
      setSubmitting(false);
      router.replace({
        pathname: "/student-fee-receipt",
        params: { paymentId: payment.id, prior: String(prior) },
      });
    }, 400);
  };

  return (
    <View style={s.root}>
      <StackHeader
        title={step === "review" ? "Review Payment" : "Pay Fees"}
        subtitle={student.name}
        onBack={step === "review" ? () => setStep("amount") : undefined}
      />
      <KeyboardAwareScrollView
        contentContainerStyle={s.content}
        bottomOffset={20}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Card>
          <Text style={s.name} testID="student-payment-name">{student.name}</Text>
          <Text style={s.admission} testID="student-payment-admission">{student.admissionNo}</Text>
          <View style={s.row}>
            <Text style={s.label}>Total Fee</Text>
            <Text style={s.value}>{formatINR(fee.total)}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.label}>Already Paid</Text>
            <Text style={s.value}>{formatINR(fee.paid)}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.label}>Outstanding</Text>
            <Text style={[s.value, { color: colors.error }]} testID="student-payment-outstanding">
              {formatINR(fee.outstanding)}
            </Text>
          </View>
        </Card>

        {fee.outstanding === 0 ? (
          <View style={s.paidBanner} testID="fully-paid-state">
            <Text style={s.paidTitle}>Fully Paid</Text>
            <Text style={s.paidBody}>There is no outstanding balance to pay.</Text>
          </View>
        ) : step === "amount" ? (
          <View>
            <Text style={s.fieldLabel}>Amount to Pay</Text>
            <View style={s.amountWrap}>
              <Text style={s.rupee}>₹</Text>
              <TextInput
                value={amountText}
                onChangeText={(text) => {
                  setError(null);
                  setAmountText(text.replace(/\D/g, ""));
                }}
                keyboardType="number-pad"
                style={s.amountInput}
                placeholder="0"
                placeholderTextColor={colors.muted}
                testID="student-payment-amount"
              />
            </View>
            <Text style={s.hint}>You can pay the full outstanding amount or a smaller part of it.</Text>
            {remaining != null ? (
              <Text style={s.remaining} testID="student-payment-remaining">
                Remaining after payment {formatINR(remaining)}
              </Text>
            ) : null}
            {error ? <Text style={s.error} testID="student-payment-error">{error}</Text> : null}
          </View>
        ) : (
          <Card testID="payment-review">
            <View style={s.demo} testID="demo-payment-label">
              <Text style={s.demoText}>
                Demo Payment. This is a simulated payment. No bank, UPI app, or payment gateway is used.
              </Text>
            </View>
            <View style={s.row}>
              <Text style={s.label}>Payment Amount</Text>
              <Text style={s.value} testID="review-amount">{payable != null ? formatINR(payable) : "—"}</Text>
            </View>
            <View style={s.row}>
              <Text style={s.label}>Current Outstanding</Text>
              <Text style={s.value} testID="review-outstanding">{formatINR(fee.outstanding)}</Text>
            </View>
            <View style={s.row}>
              <Text style={s.label}>Remaining Balance</Text>
              <Text style={s.value} testID="review-remaining">{remaining != null ? formatINR(remaining) : "—"}</Text>
            </View>
            <View style={s.row}>
              <Text style={s.label}>Payment Method</Text>
              <Text style={s.value} testID="review-method">{methodLabel}</Text>
            </View>
          </Card>
        )}

        {fee.outstanding > 0 && step === "amount" ? (
          <View>
            <Text style={s.fieldLabel}>Simulated Payment Method</Text>
            <View style={s.chips}>
              {METHODS.map((option) => {
                const selected = method === option.key;
                return (
                  <Pressable
                    key={option.key}
                    style={[s.chip, selected && s.chipOn]}
                    onPress={() => setMethod(option.key)}
                    testID={`method-${option.key}`}
                  >
                    <Text style={[s.chipText, selected && s.chipTextOn]}>{option.label}</Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={[s.demo, { marginTop: spacing.md }]}>
              <Text style={s.demoText}>
                Demo Payment. UPI, Card, and Net Banking here only simulate a successful payment inside Gurukul360.
              </Text>
            </View>
          </View>
        ) : null}
      </KeyboardAwareScrollView>

      <View style={[s.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        {fee.outstanding === 0 ? (
          <PrimaryButton label="View Fee Status" onPress={() => router.replace("/student-fees")} testID="view-fee-status" />
        ) : step === "amount" ? (
          <PrimaryButton label="Review Payment" onPress={onReview} testID="review-payment-button" />
        ) : (
          <>
            <PrimaryButton
              label="Confirm Demo Payment"
              onPress={onConfirm}
              loading={submitting}
              testID="confirm-demo-payment"
            />
            <SecondaryButton label="Edit Amount" onPress={() => setStep("amount")} testID="edit-amount-button" />
          </>
        )}
      </View>
    </View>
  );
}
