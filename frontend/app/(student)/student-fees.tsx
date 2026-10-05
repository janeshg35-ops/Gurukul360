import { ScrollView, Text, View } from "react-native";

import { useLiveStudent } from "@/src/auth/use-live-student";
import { StackHeader } from "@/src/components/screen-header";
import { LoadingView } from "@/src/components/ui/feedback";
import { Badge, Card } from "@/src/components/ui/primitives";
import { useData } from "@/src/data/store";
import { feeStatus, formatINR, studentFee } from "@/src/data/compute";
import { makeStyles, spacing } from "@/src/theme";

const LABEL = { paid: "Paid", partial: "Partial", pending: "Pending" } as const;

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surfaceSecondary },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing["3xl"] },
  figure: { gap: 2 },
  label: { fontSize: 12, color: c.muted, fontWeight: "700" },
  value: { fontSize: 22, fontWeight: "800", color: c.onSurface },
  statusRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: spacing.md },
  statusLabel: { fontSize: 14, color: c.muted, fontWeight: "700" },
}));

export default function StudentFees() {
  const s = useStyles();
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

  return (
    <View style={s.root}>
      <StackHeader title="Fee Status" subtitle={student.admissionNo} />
      <ScrollView contentContainerStyle={s.content}>
        <Card testID="student-fees">
          <View style={s.figure}>
            <Text style={s.label}>Total Fee</Text>
            <Text style={s.value}>{formatINR(fee.total)}</Text>
          </View>
          <View style={[s.figure, { marginTop: spacing.lg }]}>
            <Text style={s.label}>Paid</Text>
            <Text style={s.value}>{formatINR(fee.paid)}</Text>
          </View>
          <View style={[s.figure, { marginTop: spacing.lg }]}>
            <Text style={s.label}>Outstanding</Text>
            <Text style={s.value}>{formatINR(fee.outstanding)}</Text>
          </View>
          <View style={s.statusRow}>
            <Text style={s.statusLabel}>Status</Text>
            <Badge label={LABEL[status]} tone={tone} />
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}
