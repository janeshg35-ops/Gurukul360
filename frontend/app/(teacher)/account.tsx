import { useRouter } from "expo-router";
import { ScrollView, Text, View } from "react-native";

import { useLiveTeacher } from "@/src/auth/use-live-teacher";
import { StackHeader } from "@/src/components/screen-header";
import { SecondaryButton } from "@/src/components/ui/controls";
import { LoadingView } from "@/src/components/ui/feedback";
import { Badge, Card, Divider } from "@/src/components/ui/primitives";
import { useAuth } from "@/src/context/auth";
import { useData } from "@/src/data/store";
import { classTeacherLabel, isActiveTeacher, subjectNames } from "@/src/data/teachers";
import { makeStyles, spacing } from "@/src/theme";

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surfaceSecondary },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing["3xl"] },
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

export default function TeacherAccount() {
  const s = useStyles();
  const router = useRouter();
  const { signOut } = useAuth();
  const { db } = useData();
  const { teacher, ready } = useLiveTeacher();

  if (!ready || !teacher) {
    return (
      <View style={s.root}>
        <LoadingView />
      </View>
    );
  }

  const subjects = subjectNames(db, teacher.subjectIds).join(", ") || "—";
  const classOf = teacher.classTeacherOf ? classTeacherLabel(db, teacher.classTeacherOf) : "Subject Teacher";
  const active = isActiveTeacher(teacher);

  return (
    <View style={s.root}>
      <StackHeader title="My Account" subtitle={teacher.name} />
      <ScrollView contentContainerStyle={s.content}>
        <Card testID="teacher-account">
          <Row label="Name" value={teacher.name} />
          <Divider />
          <Row label="Email" value={teacher.email || "—"} />
          <Divider />
          <Row label="Phone" value={teacher.phone || "—"} />
          <Divider />
          <Row label="Subjects" value={subjects} />
          <Divider />
          <Row label="Class Teacher Of" value={classOf} />
          <Divider />
          <View style={s.row}>
            <Text style={s.label}>Status</Text>
            <Badge label={active ? "Active" : "Inactive"} tone={active ? "success" : "neutral"} />
          </View>
        </Card>
        <SecondaryButton
          label="Sign Out"
          onPress={() => {
            signOut();
            router.replace("/login");
          }}
          testID="teacher-signout"
        />
      </ScrollView>
    </View>
  );
}
