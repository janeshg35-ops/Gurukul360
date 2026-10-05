import dayjs from "dayjs";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { useLocalSearchParams, useRouter } from "expo-router";
import { CheckCircle, ShareNetwork, X } from "phosphor-react-native";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PrimaryButton, SecondaryButton } from "@/src/components/ui/controls";
import { EmptyState, useToast } from "@/src/components/ui/feedback";
import { Card, Divider, Logo } from "@/src/components/ui/primitives";
import { PRODUCT, SCHOOL } from "@/src/constants/branding";
import { useData } from "@/src/data/store";
import { classSectionLabel, formatINR, getStudent, studentFee } from "@/src/data/compute";
import { makeStyles, radius, spacing, useTheme } from "@/src/theme";

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surfaceSecondary },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: c.surface,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  close: { width: 36, height: 36, borderRadius: 18, backgroundColor: c.surfaceTertiary, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 18, fontWeight: "800", color: c.onSurface },
  content: { padding: spacing.lg, gap: spacing.lg },
  successWrap: { alignItems: "center", gap: spacing.sm },
  successText: { fontSize: 18, fontWeight: "800", color: c.onSurface },
  successSub: { fontSize: 13, color: c.muted },
  receiptHead: { alignItems: "center", gap: spacing.xs, marginBottom: spacing.md },
  schoolName: { fontSize: 16, fontWeight: "800", color: c.onSurface },
  schoolSub: { fontSize: 12, color: c.muted },
  demoBadge: { backgroundColor: c.warningSoft, paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: radius.sm, marginTop: spacing.sm },
  demoBadgeText: { fontSize: 11, fontWeight: "800", color: c.onWarningSoft, letterSpacing: 0.5 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: spacing.sm },
  label: { fontSize: 14, color: c.muted },
  value: { fontSize: 14, fontWeight: "700", color: c.onSurface, maxWidth: "60%", textAlign: "right" },
  amountRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: spacing.md },
  amountLabel: { fontSize: 15, fontWeight: "800", color: c.onSurface },
  amountValue: { fontSize: 22, fontWeight: "800", color: c.success },
  footer: { padding: spacing.lg, gap: spacing.md, backgroundColor: c.surface, borderTopWidth: 1, borderTopColor: c.border },
}));

function buildReceiptHtml(data: {
  receiptNo: string;
  date: string;
  studentName: string;
  classLabel: string;
  admissionNo: string;
  amount: string;
  method: string;
  reference?: string;
  outstanding: string;
}): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
  <style>
    body{font-family:-apple-system,Helvetica,Arial,sans-serif;color:#111827;padding:32px;}
    .wrap{border:1px solid #E5E7EB;border-radius:12px;padding:28px;max-width:640px;margin:auto;}
    .head{text-align:center;border-bottom:2px solid #1E3A8A;padding-bottom:16px;margin-bottom:8px;}
    .brand{font-size:22px;font-weight:800;color:#0F172A;}
    .school{font-size:16px;font-weight:700;margin-top:6px;}
    .muted{color:#6B7280;font-size:12px;}
    .demo{display:inline-block;background:#FFFBEB;color:#B45309;font-weight:800;font-size:11px;padding:4px 10px;border-radius:6px;margin-top:10px;letter-spacing:.5px;}
    .title{text-align:center;font-size:14px;font-weight:700;letter-spacing:1px;color:#374151;margin:18px 0;}
    table{width:100%;border-collapse:collapse;}
    td{padding:8px 0;font-size:14px;}
    td.l{color:#6B7280;}td.r{text-align:right;font-weight:700;}
    .total{border-top:1px solid #E5E7EB;margin-top:10px;padding-top:14px;display:flex;justify-content:space-between;align-items:center;}
    .total .amt{font-size:22px;font-weight:800;color:#059669;}
    .foot{margin-top:26px;text-align:center;color:#9CA3AF;font-size:11px;}
  </style></head>
  <body><div class="wrap">
    <div class="head">
      <div class="brand">${PRODUCT.trademark}</div>
      <div class="muted">${PRODUCT.subtitle}</div>
      <div class="school">${SCHOOL.name}</div>
      <div class="muted">${SCHOOL.location} &middot; Session ${SCHOOL.session}</div>
      <div class="demo">DEMO TRANSACTION &mdash; NOT A REAL RECEIPT</div>
    </div>
    <div class="title">FEE PAYMENT RECEIPT</div>
    <table>
      <tr><td class="l">Receipt No.</td><td class="r">${data.receiptNo}</td></tr>
      <tr><td class="l">Date</td><td class="r">${data.date}</td></tr>
      <tr><td class="l">Student</td><td class="r">${data.studentName}</td></tr>
      <tr><td class="l">Class</td><td class="r">${data.classLabel}</td></tr>
      <tr><td class="l">Admission No.</td><td class="r">${data.admissionNo}</td></tr>
      <tr><td class="l">Payment Mode</td><td class="r">${data.method}</td></tr>
      ${data.reference ? `<tr><td class="l">Reference</td><td class="r">${data.reference}</td></tr>` : ""}
      <tr><td class="l">Balance Outstanding</td><td class="r">${data.outstanding}</td></tr>
    </table>
    <div class="total"><div style="font-weight:800;">Amount Paid</div><div class="amt">${data.amount}</div></div>
    <div class="foot">Generated by ${PRODUCT.trademark} &middot; This is a system-generated demo receipt.</div>
  </div></body></html>`;
}

export default function ReceiptScreen() {
  const s = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { db } = useData();
  const { paymentId } = useLocalSearchParams<{ paymentId: string }>();
  const [sharing, setSharing] = useState(false);

  const payment = db.payments.find((p) => p.id === paymentId);
  const student = payment ? getStudent(db, payment.studentId) : undefined;

  if (!payment || !student) {
    return (
      <View style={s.root}>
        <View style={[s.header, { paddingTop: insets.top + spacing.md }]}>
          <Text style={s.title}>Receipt</Text>
        </View>
        <EmptyState title="Receipt not available" />
      </View>
    );
  }

  const fee = studentFee(db, student);
  const dateStr = dayjs(payment.date).format("DD MMM YYYY, hh:mm A");

  const onShare = async () => {
    setSharing(true);
    try {
      const html = buildReceiptHtml({
        receiptNo: payment.receiptNo,
        date: dateStr,
        studentName: student.name,
        classLabel: classSectionLabel(db, student),
        admissionNo: student.admissionNo,
        amount: formatINR(payment.amount),
        method: payment.method,
        reference: payment.reference,
        outstanding: formatINR(fee.outstanding),
      });
      const { uri } = await Print.printToFileAsync({ html });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle: "Share Receipt" });
      } else {
        toast.show("Share & export opens on the mobile app", "info");
      }
    } catch {
      toast.show("Could not generate receipt PDF", "error");
    } finally {
      setSharing(false);
    }
  };

  return (
    <View style={s.root}>
      <View style={[s.header, { paddingTop: insets.top + spacing.md }]}>
        <Pressable style={s.close} onPress={() => router.back()} testID="receipt-close">
          <X size={18} color={colors.onSurface} weight="bold" />
        </Pressable>
        <Text style={s.title}>Payment Receipt</Text>
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.successWrap}>
          <CheckCircle size={56} color={colors.success} weight="fill" />
          <Text style={s.successText}>Payment Successful</Text>
          <Text style={s.successSub}>{formatINR(payment.amount)} recorded for {student.name}</Text>
        </View>

        <Card testID="receipt-card">
          <View style={s.receiptHead}>
            <Logo width={120} />
            <Text style={s.schoolName}>{SCHOOL.name}</Text>
            <Text style={s.schoolSub}>{SCHOOL.location} · Session {SCHOOL.session}</Text>
            <View style={s.demoBadge}>
              <Text style={s.demoBadgeText}>DEMO TRANSACTION — NOT A REAL RECEIPT</Text>
            </View>
          </View>
          <Divider />
          <View style={s.row}>
            <Text style={s.label}>Receipt No.</Text>
            <Text style={s.value} testID="receipt-number">{payment.receiptNo}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.label}>Date</Text>
            <Text style={s.value}>{dateStr}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.label}>Student</Text>
            <Text style={s.value}>{student.name}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.label}>Class</Text>
            <Text style={s.value}>{classSectionLabel(db, student)}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.label}>Payment Mode</Text>
            <Text style={s.value}>{payment.method}</Text>
          </View>
          {payment.reference ? (
            <View style={s.row}>
              <Text style={s.label}>Reference</Text>
              <Text style={s.value}>{payment.reference}</Text>
            </View>
          ) : null}
          <View style={s.row}>
            <Text style={s.label}>Balance Outstanding</Text>
            <Text style={[s.value, { color: colors.error }]}>{formatINR(fee.outstanding)}</Text>
          </View>
          <Divider />
          <View style={s.amountRow}>
            <Text style={s.amountLabel}>Amount Paid</Text>
            <Text style={s.amountValue}>{formatINR(payment.amount)}</Text>
          </View>
        </Card>
      </ScrollView>

      <View style={[s.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <SecondaryButton
          label={sharing ? "Preparing PDF…" : "Share / Export PDF"}
          onPress={onShare}
          icon={<ShareNetwork size={18} color={colors.onSurface} weight="bold" />}
          testID="share-receipt-button"
        />
        <PrimaryButton label="Done" onPress={() => router.back()} testID="receipt-done-button" />
      </View>
    </View>
  );
}
