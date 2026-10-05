import { useLocalSearchParams } from "expo-router";
import { ScrollView, Text, View } from "react-native";

import { useLiveTeacher } from "@/src/auth/use-live-teacher";
import { StackHeader } from "@/src/components/screen-header";
import { EmptyState, LoadingView } from "@/src/components/ui/feedback";
import { Avatar, Badge, Card, Divider } from "@/src/components/ui/primitives";
import { useData } from "@/src/data/store";
import {
  className,
  sectionName,
  sectionStudents,
  studentAttendance,
  studentPerformance,
  studentResults,
} from "@/src/data/compute";
import { makeStyles, spacing } from "@/src/theme";

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surfaceSecondary },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing["3xl"] },
  head: { alignItems: "center", gap: spacing.sm },
  name: { fontSize: 20, fontWeight: "800", color: c.onSurface, marginTop: spacing.sm, textAlign: "center" },
  meta: { fontSize: 14, color: c.muted, fontWeight: "600", textAlign: "center" },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: spacing.sm, gap: spacing.md },
  label: { fontSize: 14, color: c.muted },
  value: { fontSize: 14, fontWeight: "600", color: c.onSurface, flex: 1, textAlign: "right" },
  cardTitle: { fontSize: 15, fontWeight: "800", color: c.onSurface, marginBottom: spacing.sm },
  markRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: spacing.sm, gap: spacing.md },
  subject: { fontSize: 14, fontWeight: "600", color: c.onSurface, flex: 1 },
  marks: { fontSize: 14, fontWeight: "700", color: c.onSurfaceSecondary },
}));

function Row({ label, value }: { label: string; value: string }) {
  const s = useStyles();
  return (
    <View style={s.row}>
      <Text style={s.label}>{label}</Text>
      <Text style={s.value}>{value}</Text>
    </View>
  );
}

export default function TeacherStudentProfile() {
  const s = useStyles();
  const { db } = useData();
  const { teacher, ready } = useLiveTeacher();
  const { id } = useLocalSearchParams<{ id: string }>();

  if (!ready || !teacher) {
    return (
      <View style={s.root}>
        <LoadingView />
      </View>
    );
  }

  const roster = teacher.classTeacherOf ? sectionStudents(db, teacher.classTeacherOf) : [];
  const student = roster.find((item) => item.id === id);

  if (!student) {
    return (
      <View style={s.root}>
        <StackHeader title="Student" />
        <EmptyState title="Student unavailable" message="This student is not in your class." />
      </View>
    );
  }

  const guardian = db.guardians.find((item) => item.id === student.guardianId);
  const attendance = studentAttendance(db, student.id);
  const performance = studentPerformance(db, student.id);
  const results = studentResults(db, student.id);

  return (
    <View style={s.root}>
      <StackHeader title={student.name} subtitle={`${className(db, student.classId)} — ${sectionName(db, student.sectionId)}`} />
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.head}>
          <Avatar name={student.name} index={student.avatarIndex} size={72} />
          <Text style={s.name}>{student.name}</Text>
          <Text style={s.meta}>Roll {student.rollNo}</Text>
          <Badge label="Active" tone="success" />
        </View>

        <Card>
          <Text style={s.cardTitle}>Student</Text>
          <Row label="Admission No." value={student.admissionNo} />
          <Divider />
          <Row label="Class" value={className(db, student.classId)} />
          <Divider />
          <Row label="Section" value={sectionName(db, student.sectionId)} />
          <Divider />
          <Row label="Guardian" value={guardian?.name || "—"} />
          <Divider />
          <Row label="Guardian Phone" value={guardian?.phone || "—"} />
        </Card>

        <Card testID="teacher-student-attendance">
          <Text style={s.cardTitle}>Attendance</Text>
          <Row
            label="Recorded"
            value={attendance.total === 0 ? "Not recorded" : `${attendance.percentage}%`}
          />
        </Card>

        <Card testID="teacher-student-academics">
          <Text style={s.cardTitle}>Academic Performance</Text>
          {performance.total === 0 ? (
            <Text style={s.label}>No marks recorded yet.</Text>
          ) : (
            <>
              <Row label="Average" value={`${performance.average}% · ${performance.grade}`} />
              <Divider />
              {results.map((result) => (
                <View key={result.subjectId} style={s.markRow}>
                  <Text style={s.subject}>{result.subject}</Text>
                  <Text style={s.marks}>
                    {result.marks}/{result.maxMarks}
                  </Text>
                  <Badge
                    label={result.grade}
                    tone={result.percentage >= 75 ? "success" : result.percentage >= 50 ? "warning" : "error"}
                  />
                </View>
              ))}
            </>
          )}
        </Card>
      </ScrollView>
    </View>
  );
}
