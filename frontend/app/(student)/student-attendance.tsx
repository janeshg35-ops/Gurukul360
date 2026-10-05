import dayjs from "dayjs";
import { ScrollView, Text, View } from "react-native";

import { useLiveStudent } from "@/src/auth/use-live-student";
import { StackHeader } from "@/src/components/screen-header";
import { EmptyState, LoadingView } from "@/src/components/ui/feedback";
import { Badge, Card, Divider } from "@/src/components/ui/primitives";
import { useData } from "@/src/data/store";
import { studentAttendance } from "@/src/data/compute";
import { makeStyles, spacing } from "@/src/theme";

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surfaceSecondary },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing["3xl"] },
  summary: { fontSize: 28, fontWeight: "800", color: c.brandPrimary },
  summaryLabel: { fontSize: 13, color: c.muted, fontWeight: "600" },
  counts: { flexDirection: "row", justifyContent: "space-between", marginTop: spacing.md },
  countVal: { fontSize: 16, fontWeight: "800", color: c.onSurface, textAlign: "center" },
  countLabel: { fontSize: 12, color: c.muted, fontWeight: "600", textAlign: "center" },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: spacing.sm },
  date: { fontSize: 14, fontWeight: "600", color: c.onSurface },
  title: { fontSize: 15, fontWeight: "800", color: c.onSurface, marginBottom: spacing.sm },
}));

export default function StudentAttendance() {
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

  const summary = studentAttendance(db, student.id);
  const history = db.attendance
    .filter((row) => row.studentId === student.id)
    .sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf());

  return (
    <View style={s.root}>
      <StackHeader title="Attendance" subtitle={student.name} />
      <ScrollView contentContainerStyle={s.content}>
        <Card testID="student-attendance-summary">
          <Text style={s.summary}>{summary.total === 0 ? "—" : `${summary.percentage}%`}</Text>
          <Text style={s.summaryLabel}>{summary.total === 0 ? "Not recorded" : "Recorded attendance"}</Text>
          <View style={s.counts}>
            <View>
              <Text style={s.countVal}>{summary.present}</Text>
              <Text style={s.countLabel}>Present</Text>
            </View>
            <View>
              <Text style={s.countVal}>{summary.late}</Text>
              <Text style={s.countLabel}>Late</Text>
            </View>
            <View>
              <Text style={s.countVal}>{summary.absent}</Text>
              <Text style={s.countLabel}>Absent</Text>
            </View>
          </View>
        </Card>
        {history.length === 0 ? (
          <EmptyState title="No attendance recorded" message="Days that are not marked do not appear here." />
        ) : (
          <Card>
            <Text style={s.title}>History</Text>
            {history.map((row, index) => (
                <View key={`${row.date}-${index}`}>
                {index > 0 ? <Divider /> : null}
                <View style={s.row}>
                  <Text style={s.date}>{dayjs(row.date).format("DD MMM YYYY")}</Text>
                  <Badge
                    label={row.status === "present" ? "Present" : row.status === "late" ? "Late" : "Absent"}
                    tone={row.status === "present" ? "success" : row.status === "late" ? "warning" : "error"}
                  />
                </View>
              </View>
            ))}
          </Card>
        )}
      </ScrollView>
    </View>
  );
}
