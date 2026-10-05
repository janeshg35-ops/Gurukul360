import { useRouter } from "expo-router";
import { CaretRight } from "phosphor-react-native";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { BarChart } from "@/src/components/charts";
import { StackHeader } from "@/src/components/screen-header";
import { FilterChips } from "@/src/components/ui/controls";
import { Avatar, Badge, Card, Divider } from "@/src/components/ui/primitives";
import { useData } from "@/src/data/store";
import {
  activeStudents,
  className,
  sectionName,
  studentPerformance,
} from "@/src/data/compute";
import { makeStyles, spacing, useTheme } from "@/src/theme";

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surfaceSecondary },
  filters: { backgroundColor: c.surface, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: c.border },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing["3xl"] },
  cardTitle: { fontSize: 15, fontWeight: "800", color: c.onSurface, marginBottom: spacing.md },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.sm },
  body: { flex: 1, gap: 2 },
  name: { fontSize: 15, fontWeight: "700", color: c.onSurface },
  sub: { fontSize: 13, color: c.muted },
  avg: { fontSize: 15, fontWeight: "800", marginRight: spacing.sm },
}));

export default function AcademicsScreen() {
  const s = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const { db } = useData();
  const [classFilter, setClassFilter] = useState(db.classes[db.classes.length - 1]?.id ?? "all");

  const classOptions = db.classes.map((c) => ({ key: c.id, label: c.name }));

  const students = useMemo(
    () =>
      activeStudents(db)
        .filter((st) => st.classId === classFilter)
        .map((st) => ({ st, p: studentPerformance(db, st.id) }))
        .sort((a, b) => b.p.average - a.p.average),
    [db, classFilter],
  );

  const subjectBars = useMemo(() => {
    const ids = students.map((x) => x.st.id);
    return db.subjects.map((sub) => {
      const rows = db.results.filter((r) => r.subjectId === sub.id && ids.includes(r.studentId));
      const avg = rows.length ? rows.reduce((a, r) => a + (r.marks / r.maxMarks) * 100, 0) / rows.length : 0;
      return { label: sub.name.split(" ")[0], value: Math.round(avg), color: colors.brandSecondary };
    });
  }, [db, students, colors.brandSecondary]);

  return (
    <View style={s.root}>
      <StackHeader title="Academics" subtitle="Term 1 performance" />
      <View style={s.filters}>
        <FilterChips options={classOptions} selected={classFilter} onSelect={setClassFilter} testIDPrefix="academics-class" />
      </View>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <Card>
          <Text style={s.cardTitle}>Subject Averages — {className(db, classFilter)}</Text>
          <BarChart data={subjectBars} maxValue={100} height={120} />
        </Card>

        <Card>
          <Text style={s.cardTitle}>Students — {className(db, classFilter)}</Text>
          {students.map(({ st, p }, i) => (
            <View key={st.id}>
              {i > 0 ? <Divider /> : null}
              <Pressable
                style={({ pressed }) => [s.row, pressed && { opacity: 0.7 }]}
                onPress={() => router.push({ pathname: "/student/[id]", params: { id: st.id } })}
                testID={`academics-student-${st.id}`}
              >
                <Avatar name={st.name} index={st.avatarIndex} size={40} />
                <View style={s.body}>
                  <Text style={s.name}>{st.name}</Text>
                  <Text style={s.sub}>Section {sectionName(db, st.sectionId)} · Roll {st.rollNo}</Text>
                </View>
                <Text style={[s.avg, { color: p.total === 0 ? colors.muted : colors.brandPrimary }]}>
                  {p.total === 0 ? "—" : `${p.average}%`}
                </Text>
                <Badge
                  label={p.total === 0 ? "—" : p.grade}
                  tone={p.total === 0 ? "neutral" : p.average >= 75 ? "success" : p.average >= 50 ? "warning" : "error"}
                />
                <CaretRight size={16} color={colors.muted} weight="bold" />
              </Pressable>
            </View>
          ))}
        </Card>
      </ScrollView>
    </View>
  );
}
