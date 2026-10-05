import { useLocalSearchParams, useRouter } from "expo-router";
import { Alert, ScrollView, Text, View } from "react-native";

import { StackHeader } from "@/src/components/screen-header";
import { PrimaryButton, SecondaryButton } from "@/src/components/ui/controls";
import { EmptyState, useToast } from "@/src/components/ui/feedback";
import { Avatar, Badge, Card, Divider } from "@/src/components/ui/primitives";
import { useData } from "@/src/data/store";
import {
  activeClassTeacherId,
  classTeacherLabel,
  getTeacher,
  isActiveTeacher,
  subjectNames,
} from "@/src/data/teachers";
import { makeStyles, spacing } from "@/src/theme";

function avatarIndex(id: string): number {
  let sum = 0;
  for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i);
  return sum % 8;
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surfaceSecondary },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing["3xl"] },
  profileHead: { alignItems: "center", gap: spacing.sm },
  name: { fontSize: 20, fontWeight: "800", color: c.onSurface, marginTop: spacing.sm, textAlign: "center" },
  actions: { alignSelf: "stretch", gap: spacing.sm, marginTop: spacing.sm },
  cardTitle: { fontSize: 15, fontWeight: "800", color: c.onSurface, marginBottom: spacing.md },
  detailRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: spacing.sm, gap: spacing.md },
  detailLabel: { fontSize: 14, color: c.muted },
  detailValue: { fontSize: 14, fontWeight: "600", color: c.onSurface, flex: 1, textAlign: "right" },
}));

function DetailRow({ label, value }: { label: string; value: string }) {
  const s = useStyles();
  return (
    <View style={s.detailRow}>
      <Text style={s.detailLabel}>{label}</Text>
      <Text style={s.detailValue}>{value}</Text>
    </View>
  );
}

export default function TeacherProfile() {
  const s = useStyles();
  const router = useRouter();
  const toast = useToast();
  const { db, deactivateTeacher, activateTeacher } = useData();
  const { id } = useLocalSearchParams<{ id: string }>();
  const teacher = getTeacher(db, id);

  if (!teacher) {
    return (
      <View style={s.root}>
        <StackHeader title="Teacher" />
        <EmptyState title="Teacher not found" message="This record is unavailable." />
      </View>
    );
  }

  const active = isActiveTeacher(teacher);
  const subjects = subjectNames(db, teacher.subjectIds).join(", ") || "—";
  const classOf = teacher.classTeacherOf ? classTeacherLabel(db, teacher.classTeacherOf) : "—";

  return (
    <View style={s.root}>
      <StackHeader title={teacher.name} subtitle={active ? "Active" : "Inactive"} />
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.profileHead}>
          <Avatar name={teacher.name} index={avatarIndex(teacher.id)} size={76} />
          <Text style={s.name}>{teacher.name}</Text>
          <Badge label={active ? "Active" : "Inactive"} tone={active ? "success" : "neutral"} />
          <View style={s.actions}>
            <PrimaryButton
              label="Edit Teacher"
              onPress={() => router.push({ pathname: "/teacher/form", params: { id: teacher.id } })}
              testID="edit-teacher-button"
            />
            {active ? (
              <SecondaryButton
                label="Deactivate Teacher"
                onPress={() =>
                  Alert.alert(
                    "Deactivate Teacher?",
                    `${teacher.name} will be removed from active staff management. The teacher record will be preserved.`,
                    [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Deactivate Teacher",
                        style: "destructive",
                        onPress: () => {
                          deactivateTeacher(teacher.id);
                          toast.show("Teacher deactivated", "info");
                          router.back();
                        },
                      },
                    ],
                  )
                }
                testID="deactivate-teacher-button"
              />
            ) : (
              <SecondaryButton
                label="Activate Teacher"
                onPress={() => {
                  const sectionId = teacher.classTeacherOf;
                  const holderId = sectionId ? activeClassTeacherId(db, sectionId, teacher.id) : undefined;
                  if (holderId) {
                    const holder = getTeacher(db, holderId);
                    const section = classTeacherLabel(db, sectionId);
                    const holderName = holder?.name ?? "Another teacher";
                    Alert.alert(
                      "Cannot Activate Teacher",
                      `${holderName} is already the active class teacher of ${section}. Edit this teacher and remove or change that assignment, then activate again.`,
                    );
                    return;
                  }
                  Alert.alert(
                    "Activate Teacher?",
                    `${teacher.name} will return to active staff management. The teacher record will be preserved.`,
                    [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Activate Teacher",
                        onPress: () => {
                          const result = activateTeacher(teacher.id);
                          if (result === "conflict") {
                            Alert.alert(
                              "Cannot Activate Teacher",
                              "Another active teacher is already the class teacher of this section. Edit this teacher and remove or change that assignment, then activate again.",
                            );
                            return;
                          }
                          if (result === "ok") toast.show("Teacher activated", "success");
                        },
                      },
                    ],
                  );
                }}
                testID="activate-teacher-button"
              />
            )}
          </View>
        </View>

        <Card>
          <Text style={s.cardTitle}>Teacher Details</Text>
          <DetailRow label="Phone" value={teacher.phone || "—"} />
          <Divider />
          <DetailRow label="Email" value={teacher.email || "—"} />
          <Divider />
          <DetailRow label="Subjects" value={subjects} />
          <Divider />
          <DetailRow label="Class Teacher Of" value={classOf} />
          <Divider />
          <DetailRow label="Status" value={active ? "Active" : "Inactive"} />
        </Card>
      </ScrollView>
    </View>
  );
}
