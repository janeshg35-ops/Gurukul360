import { useRouter } from "expo-router";
import { CaretRight } from "phosphor-react-native";
import { Pressable, ScrollView, Text, View } from "react-native";

import { useLiveTeacher } from "@/src/auth/use-live-teacher";
import { NoClassState } from "./no-class";
import { StackHeader } from "@/src/components/screen-header";
import { LoadingView } from "@/src/components/ui/feedback";
import { Avatar, Badge, Card, Divider } from "@/src/components/ui/primitives";
import { useData } from "@/src/data/store";
import { className, sectionName, sectionStudents, studentPerformance } from "@/src/data/compute";
import { makeStyles, spacing, useTheme } from "@/src/theme";

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surfaceSecondary },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing["3xl"] },
  title: { fontSize: 20, fontWeight: "800", color: c.onSurface },
  body: { fontSize: 15, color: c.onSurfaceSecondary, marginTop: spacing.sm, lineHeight: 22 },
  stat: { fontSize: 28, fontWeight: "800", color: c.brandPrimary, marginTop: spacing.md },
  statLabel: { fontSize: 13, color: c.muted, fontWeight: "600" },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.sm },
  studentBody: { flex: 1, gap: 2 },
  studentName: { fontSize: 15, fontWeight: "700", color: c.onSurface },
  sub: { fontSize: 13, color: c.muted },
  avg: { fontSize: 14, fontWeight: "800", marginRight: spacing.sm },
}));

export default function MyClass() {
  const s = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const { db } = useData();
  const { teacher, ready } = useLiveTeacher();

  if (!ready || !teacher) {
    return (
      <View style={s.root}>
        <LoadingView />
      </View>
    );
  }

  const sectionId = teacher.classTeacherOf;
  if (!sectionId) {
    return (
      <View style={s.root}>
        <StackHeader title="My Class" />
        <NoClassState />
      </View>
    );
  }

  const section = db.sections.find((item) => item.id === sectionId);
  const label = section
    ? `${className(db, section.classId)} — ${sectionName(db, sectionId)}`
    : sectionId;
  const count = sectionStudents(db, sectionId).length;
  const students = sectionStudents(db, sectionId).map((student) => ({
    student,
    performance: studentPerformance(db, student.id),
  }));

  return (
    <View style={s.root}>
      <StackHeader title="My Class" subtitle={label} />
      <ScrollView contentContainerStyle={s.content}>
        <Card testID="teacher-my-class">
          <Text style={s.title}>{label}</Text>
          <Text style={s.body}>You are the class teacher of this section.</Text>
          <Text style={s.stat}>{count}</Text>
          <Text style={s.statLabel}>Students</Text>
        </Card>
        <Card testID="teacher-class-academics">
          <Text style={s.title}>Academic Performance</Text>
          <Text style={s.body}>Existing term results for this section.</Text>
          {students.map(({ student, performance }, index) => (
            <View key={student.id}>
              {index > 0 ? <Divider /> : null}
              <Pressable
                style={s.row}
                onPress={() => router.push({ pathname: "/my-student/[id]", params: { id: student.id } })}
                testID={`teacher-academics-${student.id}`}
              >
                <Avatar name={student.name} index={student.avatarIndex} size={40} />
                <View style={s.studentBody}>
                  <Text style={s.studentName}>{student.name}</Text>
                  <Text style={s.sub}>Roll {student.rollNo}</Text>
                </View>
                <Text style={[s.avg, { color: performance.total === 0 ? colors.muted : colors.brandPrimary }]}>
                  {performance.total === 0 ? "—" : `${performance.average}%`}
                </Text>
                <Badge
                  label={performance.total === 0 ? "—" : performance.grade}
                  tone={
                    performance.total === 0
                      ? "neutral"
                      : performance.average >= 75
                        ? "success"
                        : performance.average >= 50
                          ? "warning"
                          : "error"
                  }
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
