import { useRouter } from "expo-router";
import { CaretRight, Wallet } from "phosphor-react-native";
import { useMemo, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";

import { BrandHeader } from "@/src/components/screen-header";
import { SearchBar, SegmentedTabs } from "@/src/components/ui/controls";
import { EmptyState } from "@/src/components/ui/feedback";
import { Avatar, Badge, Tone } from "@/src/components/ui/primitives";
import { useData } from "@/src/data/store";
import {
  activeStudents,
  className,
  feeStatus,
  feeTotals,
  formatINR,
  formatINRShort,
  sectionName,
  studentFee,
} from "@/src/data/compute";
import { makeStyles, spacing, useTheme } from "@/src/theme";

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  kpiRow: {
    flexDirection: "row",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: c.surface,
  },
  kpi: {
    flex: 1,
    borderRadius: 12,
    padding: spacing.lg,
    gap: 4,
  },
  kpiLabel: { fontSize: 12, fontWeight: "600" },
  kpiValue: { fontSize: 20, fontWeight: "800" },
  controls: { paddingHorizontal: spacing.lg, gap: spacing.md, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: c.border },
  list: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing["3xl"] },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 12,
    padding: spacing.md,
  },
  body: { flex: 1, gap: 2 },
  name: { fontSize: 15, fontWeight: "700", color: c.onSurface },
  sub: { fontSize: 13, color: c.muted },
  amountCol: { alignItems: "flex-end", gap: 4 },
  amount: { fontSize: 14, fontWeight: "800", color: c.onSurface },
}));

const SEGMENTS = [
  { key: "all", label: "All" },
  { key: "dues", label: "With Dues" },
  { key: "paid", label: "Fully Paid" },
];

export default function FeesScreen() {
  const s = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const { db } = useData();

  const [query, setQuery] = useState("");
  const [segment, setSegment] = useState("all");

  const totals = feeTotals(db);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return activeStudents(db)
      .map((st) => ({ student: st, fee: studentFee(db, st) }))
      .filter(({ student }) =>
        q
          ? student.name.toLowerCase().includes(q) ||
            student.admissionNo.toLowerCase().includes(q)
          : true,
      )
      .filter(({ fee }) => {
        if (segment === "dues") return fee.outstanding > 0;
        if (segment === "paid") return fee.outstanding <= 0;
        return true;
      })
      .sort((a, b) => b.fee.outstanding - a.fee.outstanding);
  }, [db, query, segment]);

  return (
    <View style={s.root}>
      <BrandHeader title="Fee Master" subtitle={`Session ${db.school.session}`} />

      <View style={s.kpiRow}>
        <View style={[s.kpi, { backgroundColor: colors.successSoft }]}>
          <Text style={[s.kpiLabel, { color: colors.onSuccessSoft }]}>Collected</Text>
          <Text style={[s.kpiValue, { color: colors.onSuccessSoft }]}>
            {formatINRShort(totals.collected)}
          </Text>
        </View>
        <View style={[s.kpi, { backgroundColor: colors.errorSoft }]}>
          <Text style={[s.kpiLabel, { color: colors.onErrorSoft }]}>Outstanding</Text>
          <Text style={[s.kpiValue, { color: colors.onErrorSoft }]}>
            {formatINRShort(totals.outstanding)}
          </Text>
        </View>
      </View>

      <View style={s.controls}>
        <SearchBar value={query} onChangeText={setQuery} placeholder="Search students" testID="fees-search" />
        <SegmentedTabs options={SEGMENTS} selected={segment} onSelect={setSegment} testIDPrefix="fees-segment" />
      </View>

      <FlatList
        data={rows}
        keyExtractor={(item) => item.student.id}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <EmptyState
            icon={<Wallet size={30} color={colors.muted} weight="duotone" />}
            title="No fee records"
            message="No students match this filter."
          />
        }
        renderItem={({ item }) => {
          const status = feeStatus(item.fee);
          const tone: Tone = status === "paid" ? "success" : status === "partial" ? "warning" : "error";
          const label = status === "paid" ? "Paid" : status === "partial" ? "Partial" : "Pending";
          return (
            <Pressable
              style={({ pressed }) => [s.row, pressed && { opacity: 0.7 }]}
              onPress={() => router.push({ pathname: "/fees/[studentId]", params: { studentId: item.student.id } })}
              testID={`fee-row-${item.student.id}`}
            >
              <Avatar name={item.student.name} index={item.student.avatarIndex} />
              <View style={s.body}>
                <Text style={s.name}>{item.student.name}</Text>
                <Text style={s.sub}>
                  {className(db, item.student.classId)} — {sectionName(db, item.student.sectionId)}
                </Text>
              </View>
              <View style={s.amountCol}>
                <Text style={[s.amount, { color: item.fee.outstanding > 0 ? colors.error : colors.success }]}>
                  {item.fee.outstanding > 0 ? formatINR(item.fee.outstanding) : formatINR(item.fee.paid)}
                </Text>
                <Badge label={label} tone={tone} />
              </View>
              <CaretRight size={16} color={colors.muted} weight="bold" />
            </Pressable>
          );
        }}
      />
    </View>
  );
}
