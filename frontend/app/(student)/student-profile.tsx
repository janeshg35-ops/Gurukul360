import dayjs from "dayjs";
import { ScrollView, Text, View } from "react-native";

import { useLiveStudent } from "@/src/auth/use-live-student";
import { StackHeader } from "@/src/components/screen-header";
import { LoadingView } from "@/src/components/ui/feedback";
import { Badge, Card, Divider } from "@/src/components/ui/primitives";
import { useData } from "@/src/data/store";
import { className, sectionName } from "@/src/data/compute";
import { makeStyles, spacing } from "@/src/theme";

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surfaceSecondary },
  content: { padding: spacing.lg, paddingBottom: spacing["3xl"] },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: spacing.sm, gap: spacing.md },
  label: { fontSize: 14, color: c.muted },
  value: { fontSize: 14, fontWeight: "600", color: c.onSurface, flex: 1, textAlign: "right" },
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

export default function StudentProfile() {
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

  const active = student.status === "active";

  return (
    <View style={s.root}>
      <StackHeader title="My Profile" subtitle={student.admissionNo} />
      <ScrollView contentContainerStyle={s.content}>
        <Card testID="student-profile">
          <Row label="Name" value={student.name} />
          <Divider />
          <Row label="Admission Number" value={student.admissionNo} />
          <Divider />
          <Row label="Class" value={className(db, student.classId)} />
          <Divider />
          <Row label="Section" value={sectionName(db, student.sectionId)} />
          <Divider />
          <Row label="Roll Number" value={String(student.rollNo)} />
          <Divider />
          <Row label="Date of Birth" value={dayjs(student.dob).format("DD MMM YYYY")} />
          <Divider />
          <Row label="Gender" value={student.gender} />
          <Divider />
          <Row label="Phone" value={student.phone || "—"} />
          <Divider />
          <Row label="Email" value={student.email || "—"} />
          <Divider />
          <Row label="Address" value={student.address || "—"} />
          <Divider />
          <View style={s.row}>
            <Text style={s.label}>Status</Text>
            <Badge label={active ? "Active" : "Inactive"} tone={active ? "success" : "neutral"} />
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}
