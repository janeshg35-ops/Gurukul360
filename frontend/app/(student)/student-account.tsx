import { useRouter } from "expo-router";
import { ScrollView, Text, View } from "react-native";

import { useLiveStudent } from "@/src/auth/use-live-student";
import { StackHeader } from "@/src/components/screen-header";
import { SecondaryButton } from "@/src/components/ui/controls";
import { LoadingView } from "@/src/components/ui/feedback";
import { Badge, Card, Divider } from "@/src/components/ui/primitives";
import { useAuth } from "@/src/context/auth";
import { useData } from "@/src/data/store";
import { className, sectionName } from "@/src/data/compute";
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

export default function StudentAccount() {
  const s = useStyles();
  const router = useRouter();
  const { signOut } = useAuth();
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
      <StackHeader title="My Account" subtitle={student.name} />
      <ScrollView contentContainerStyle={s.content}>
        <Card testID="student-account">
          <Row label="Name" value={student.name} />
          <Divider />
          <Row label="Admission Number" value={student.admissionNo} />
          <Divider />
          <Row label="Class" value={`${className(db, student.classId)} — ${sectionName(db, student.sectionId)}`} />
          <Divider />
          <Row label="Email" value={student.email || "—"} />
          <Divider />
          <Row label="Phone" value={student.phone || "—"} />
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
          testID="student-signout"
        />
      </ScrollView>
    </View>
  );
}
