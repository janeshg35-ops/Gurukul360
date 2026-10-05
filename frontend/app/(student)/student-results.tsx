import { ScrollView, Text, View } from "react-native";

import { useLiveStudent } from "@/src/auth/use-live-student";
import { StackHeader } from "@/src/components/screen-header";
import { EmptyState, LoadingView } from "@/src/components/ui/feedback";
import { Badge, Card, Divider } from "@/src/components/ui/primitives";
import { useData } from "@/src/data/store";
import { studentPerformance, studentResults } from "@/src/data/compute";
import { makeStyles, spacing } from "@/src/theme";

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surfaceSecondary },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing["3xl"] },
  summary: { fontSize: 28, fontWeight: "800", color: c.brandPrimary },
  summaryLabel: { fontSize: 13, color: c.muted, fontWeight: "600" },
  title: { fontSize: 15, fontWeight: "800", color: c.onSurface, marginBottom: spacing.sm },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: spacing.sm, gap: spacing.md },
  subject: { fontSize: 14, fontWeight: "700", color: c.onSurface, flex: 1 },
  marks: { fontSize: 14, fontWeight: "700", color: c.onSurfaceSecondary },
}));

export default function StudentResults() {
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

  const performance = studentPerformance(db, student.id);
  const results = studentResults(db, student.id);
  const term = db.results.find((row) => row.studentId === student.id)?.term;

  return (
    <View style={s.root}>
      <StackHeader title="Academic Performance" subtitle={term ?? student.name} />
      {performance.total === 0 ? (
        <EmptyState title="No marks recorded" message="Results will appear here when they are entered." />
      ) : (
        <ScrollView contentContainerStyle={s.content}>
          <Card testID="student-performance">
            <Text style={s.summary}>{performance.average}%</Text>
            <Text style={s.summaryLabel}>Overall · Grade {performance.grade}</Text>
          </Card>
          <Card testID="student-results">
            <Text style={s.title}>Subject results</Text>
            {results.map((result, index) => (
              <View key={result.subjectId}>
                {index > 0 ? <Divider /> : null}
                <View style={s.row}>
                  <Text style={s.subject}>{result.subject}</Text>
                  <Text style={s.marks}>
                    {result.marks}/{result.maxMarks} · {result.percentage}%
                  </Text>
                  <Badge
                    label={result.grade}
                    tone={result.percentage >= 75 ? "success" : result.percentage >= 50 ? "warning" : "error"}
                  />
                </View>
              </View>
            ))}
          </Card>
        </ScrollView>
      )}
    </View>
  );
}
