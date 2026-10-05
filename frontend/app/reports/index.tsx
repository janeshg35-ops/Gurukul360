import { useRouter } from "expo-router";
import {
  ChartBar,
  CurrencyInr,
  FileText,
  UsersThree,
  Warning,
} from "phosphor-react-native";
import type { IconProps } from "phosphor-react-native";
import { Pressable, ScrollView, Text, View } from "react-native";

import { StackHeader } from "@/src/components/screen-header";
import { useData } from "@/src/data/store";
import { feeTotals, todayAttendance } from "@/src/data/compute";
import { makeStyles, spacing, useTheme } from "@/src/theme";

type Icon = React.ComponentType<IconProps>;

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surfaceSecondary },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing["3xl"] },
  intro: { fontSize: 14, color: c.muted, marginBottom: spacing.sm },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 12,
    padding: spacing.lg,
  },
  iconWrap: { width: 46, height: 46, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  body: { flex: 1, gap: 2 },
  title: { fontSize: 15, fontWeight: "800", color: c.onSurface },
  desc: { fontSize: 12, color: c.muted },
  stat: { fontSize: 13, fontWeight: "800", color: c.brandPrimary },
}));

export default function ReportsHub() {
  const s = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const { db } = useData();

  const fees = feeTotals(db);
  const att = todayAttendance(db);

  const REPORTS: {
    type: string;
    title: string;
    desc: string;
    icon: Icon;
    color: string;
    bg: string;
    stat: string;
  }[] = [
    { type: "student", title: "Student Report", desc: "Enrolment directory across classes", icon: UsersThree, color: colors.brandPrimary, bg: colors.brandTertiary, stat: `${db.students.length}` },
    { type: "attendance", title: "Attendance Report", desc: "Student-wise attendance summary", icon: ChartBar, color: colors.success, bg: colors.successSoft, stat: `${att.percentage}%` },
    { type: "fee-collection", title: "Fee Collection Report", desc: "Collected fees and payment status", icon: CurrencyInr, color: colors.success, bg: colors.successSoft, stat: "" },
    { type: "outstanding", title: "Outstanding Fee Report", desc: "Pending dues and follow-ups", icon: Warning, color: colors.error, bg: colors.errorSoft, stat: `${fees.studentsWithDues}` },
    { type: "performance", title: "Student Performance Summary", desc: "Term 1 averages and grades", icon: FileText, color: colors.info, bg: colors.infoSoft, stat: "" },
  ];

  return (
    <View style={s.root}>
      <StackHeader title="Reports" subtitle="Generate, export & share" />
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <Text style={s.intro}>
          All reports use the same live data as the dashboard and modules. Export as PDF or CSV via the share sheet.
        </Text>
        {REPORTS.map((r) => (
          <Pressable
            key={r.type}
            style={({ pressed }) => [s.card, pressed && { opacity: 0.75 }]}
            onPress={() => router.push({ pathname: "/reports/[type]", params: { type: r.type } })}
            testID={`report-${r.type}`}
          >
            <View style={[s.iconWrap, { backgroundColor: r.bg }]}>
              <r.icon size={24} color={r.color} weight="fill" />
            </View>
            <View style={s.body}>
              <Text style={s.title}>{r.title}</Text>
              <Text style={s.desc}>{r.desc}</Text>
            </View>
            {r.stat ? <Text style={s.stat}>{r.stat}</Text> : null}
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
