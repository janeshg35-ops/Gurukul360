import dayjs from "dayjs";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PrimaryButton } from "@/src/components/ui/controls";
import { useToast } from "@/src/components/ui/feedback";
import { Badge, Card } from "@/src/components/ui/primitives";
import {
  assignmentStatus,
  parseAssignmentDate,
  validateAssignment,
  type AssignmentInput,
} from "@/src/data/assignments";
import { DateField } from "@/src/components/ui/date-field";
import { className, sectionName } from "@/src/data/compute";
import { useData } from "@/src/data/store";
import { getTeacher, isActiveTeacher } from "@/src/data/teachers";
import { Assignment, Teacher } from "@/src/data/types";
import { makeStyles, radius, spacing, useTheme } from "@/src/theme";

const useStyles = makeStyles((c) => ({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  cardPress: { gap: spacing.sm },
  title: { fontSize: 16, fontWeight: "800", color: c.onSurface },
  meta: { fontSize: 13, fontWeight: "600", color: c.onSurfaceSecondary, lineHeight: 18 },
  detailTitle: { fontSize: 22, fontWeight: "800", color: c.onSurface },
  body: { fontSize: 15, lineHeight: 22, color: c.onSurface },
  label: { fontSize: 13, fontWeight: "700", color: c.onSurfaceSecondary, marginBottom: spacing.sm },
  field: { gap: spacing.xs },
  input: {
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    height: 48,
    backgroundColor: c.surface,
    fontSize: 15,
    color: c.onSurface,
  },
  inputMultiline: { height: 110, paddingTop: spacing.md, textAlignVertical: "top" },
  choices: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    minHeight: 36,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  chipOn: { backgroundColor: c.brandPrimary, borderColor: c.brandPrimary },
  chipText: { fontSize: 13, fontWeight: "600", color: c.onSurface },
  chipTextOn: { color: c.onBrandPrimary },
  locked: { fontSize: 15, fontWeight: "700", color: c.onSurface },
  error: { fontSize: 13, color: c.error, fontWeight: "600" },
  hint: { fontSize: 12, fontWeight: "600", color: c.onSurfaceSecondary },
  footer: { padding: spacing.lg, backgroundColor: c.surface, borderTopWidth: 1, borderTopColor: c.border },
}));

export function assignmentMeta(db: ReturnType<typeof useData>["db"], item: Assignment): string {
  const subject = db.subjects.find((row) => row.id === item.subjectId)?.name ?? "Subject";
  const teacher = getTeacher(db, item.teacherId)?.name ?? "Teacher";
  return `${subject} · ${teacher} · ${className(db, item.classId)} — ${sectionName(db, item.sectionId)}`;
}

export function AssignmentStatusBadge({ dueDate }: { dueDate: string }) {
  const status = assignmentStatus(dueDate);
  const tone = status === "Overdue" ? "error" : status === "Due Soon" ? "warning" : "info";
  return <Badge label={status} tone={tone} />;
}

export function AssignmentListCard({ item, onPress }: { item: Assignment; onPress: () => void }) {
  const s = useStyles();
  const { db } = useData();
  return (
    <Pressable onPress={onPress} testID={`assignment-${item.id}`}>
      <Card>
        <View style={s.cardPress}>
          <AssignmentStatusBadge dueDate={item.dueDate} />
          <Text style={s.title}>{item.title}</Text>
          <Text style={s.meta}>{assignmentMeta(db, item)}</Text>
          <Text style={s.meta}>Due {dayjs(item.dueDate).format("DD MMM YYYY")}</Text>
        </View>
      </Card>
    </Pressable>
  );
}

export function AssignmentDetailBody({ item }: { item: Assignment }) {
  const s = useStyles();
  const { db } = useData();
  return (
    <Card testID="assignment-detail">
      <View style={{ gap: spacing.md }}>
        <AssignmentStatusBadge dueDate={item.dueDate} />
        <Text style={s.detailTitle}>{item.title}</Text>
        <Text style={s.meta}>{assignmentMeta(db, item)}</Text>
        <Text style={s.body}>{item.instructions}</Text>
        <Text style={s.meta}>Assigned {dayjs(item.assignedDate).format("DD MMM YYYY")}</Text>
        <Text style={s.meta}>Due {dayjs(item.dueDate).format("DD MMM YYYY")}</Text>
      </View>
    </Card>
  );
}

function Choice({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const s = useStyles();
  return (
    <Pressable style={[s.chip, selected && s.chipOn]} onPress={onPress}>
      <Text style={[s.chipText, selected && s.chipTextOn]}>{label}</Text>
    </Pressable>
  );
}

export function AssignmentEditor({
  teacher,
  assignmentId,
}: {
  teacher?: Teacher;
  assignmentId?: string;
}) {
  const s = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { db, addAssignment, updateAssignment } = useData();
  const toast = useToast();
  const existing = assignmentId ? db.assignments.find((item) => item.id === assignmentId) : undefined;
  const creating = !existing;
  const lockedSection = teacher ? (creating ? teacher.classTeacherOf : existing.sectionId) : undefined;
  const lockedClass = lockedSection
    ? db.sections.find((item) => item.id === lockedSection)?.classId ?? existing?.classId
    : undefined;

  const [title, setTitle] = useState(existing?.title ?? "");
  const [instructions, setInstructions] = useState(existing?.instructions ?? "");
  const [classId, setClassId] = useState(existing?.classId ?? lockedClass ?? "");
  const [sectionId, setSectionId] = useState(existing?.sectionId ?? lockedSection ?? "");
  const [subjectId, setSubjectId] = useState(existing?.subjectId ?? "");
  const [teacherId, setTeacherId] = useState(existing?.teacherId ?? teacher?.id ?? "");
  const [assignedDate, setAssignedDate] = useState(existing?.assignedDate ?? "");
  const [dueDate, setDueDate] = useState(existing?.dueDate ?? "");
  const [error, setError] = useState("");

  const classes = [...db.classes].sort((a, b) => a.order - b.order);
  const sections = db.sections.filter((item) => item.classId === classId);
  const subjects = teacher ? db.subjects.filter((item) => teacher.subjectIds.includes(item.id)) : db.subjects;
  const teachers = db.teachers.filter(
    (item) => isActiveTeacher(item) && !!subjectId && item.subjectIds.includes(subjectId),
  );

  const save = () => {
    const assigned = parseAssignmentDate(assignedDate);
    const due = parseAssignmentDate(dueDate);
    if (!assigned) {
      setError(assignedDate.trim() ? "Enter the assigned date as DD/MM/YYYY." : "Assigned date is required.");
      return;
    }
    if (!due) {
      setError(dueDate.trim() ? "Enter the due date as DD/MM/YYYY." : "Due date is required.");
      return;
    }
    const input: AssignmentInput = {
      title,
      instructions,
      classId: teacher ? lockedClass ?? "" : classId,
      sectionId: teacher ? lockedSection ?? "" : sectionId,
      subjectId,
      teacherId: teacher ? teacher.id : teacherId,
      assignedDate: assigned,
      dueDate: due,
    };
    if (teacher && !teacher.subjectIds.includes(subjectId)) {
      setError("Subject must be one of your assigned subjects.");
      return;
    }
    const message = validateAssignment(db, input);
    if (message) {
      setError(message);
      return;
    }
    if (existing) {
      const ok = updateAssignment(existing.id, input);
      if (!ok) {
        setError("Could not save this homework.");
        return;
      }
      toast.show("Homework updated", "success");
    } else {
      const id = addAssignment(input);
      if (!id) {
        setError("Could not save this homework.");
        return;
      }
      toast.show("Homework added", "success");
    }
    router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surfaceSecondary }}>
      <KeyboardAwareScrollView style={{ flex: 1 }} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <View style={s.field}>
          <Text style={s.label}>Title</Text>
          <TextInput style={s.input} value={title} onChangeText={setTitle} placeholder="Homework title" placeholderTextColor={colors.muted} />
        </View>
        <View style={s.field}>
          <Text style={s.label}>Instructions</Text>
          <TextInput
            style={[s.input, s.inputMultiline]}
            value={instructions}
            onChangeText={setInstructions}
            placeholder="What should students do?"
            placeholderTextColor={colors.muted}
            multiline
          />
        </View>
        <View style={s.field}>
          <Text style={s.label}>Class</Text>
          {teacher ? (
            <Text style={s.locked}>{className(db, classId)}</Text>
          ) : (
            <View style={s.choices}>
              {classes.map((item) => (
                <Choice
                  key={item.id}
                  label={item.name}
                  selected={classId === item.id}
                  onPress={() => {
                    setClassId(item.id);
                    setSectionId("");
                  }}
                />
              ))}
            </View>
          )}
        </View>
        <View style={s.field}>
          <Text style={s.label}>Section</Text>
          {teacher ? (
            <Text style={s.locked}>{sectionName(db, sectionId)}</Text>
          ) : (
            <View style={s.choices}>
              {sections.map((item) => (
                <Choice key={item.id} label={item.name} selected={sectionId === item.id} onPress={() => setSectionId(item.id)} />
              ))}
            </View>
          )}
        </View>
        <View style={s.field}>
          <Text style={s.label}>Subject</Text>
          <View style={s.choices}>
            {subjects.map((item) => (
              <Choice
                key={item.id}
                label={item.name}
                selected={subjectId === item.id}
                onPress={() => {
                  setSubjectId(item.id);
                  if (teacherId && !db.teachers.find((row) => row.id === teacherId)?.subjectIds.includes(item.id)) {
                    setTeacherId(teacher?.id ?? "");
                  }
                }}
              />
            ))}
          </View>
        </View>
        <View style={s.field}>
          <Text style={s.label}>Teacher</Text>
          {teacher ? (
            <Text style={s.locked}>{teacher.name}</Text>
          ) : (
            <View style={s.choices}>
              {teachers.map((item) => (
                <Choice key={item.id} label={item.name} selected={teacherId === item.id} onPress={() => setTeacherId(item.id)} />
              ))}
            </View>
          )}
          {!teacher && subjectId && teachers.length === 0 ? (
            <Text style={s.hint}>No active teacher for this subject.</Text>
          ) : null}
        </View>
        <View style={s.field}>
          <Text style={s.label}>Assigned date</Text>
          <DateField value={assignedDate} onChange={setAssignedDate} testID="assignment-assigned-date" />
        </View>
        <View style={s.field}>
          <Text style={s.label}>Due date</Text>
          <DateField value={dueDate} onChange={setDueDate} testID="assignment-due-date" />
        </View>
        {error ? <Text style={s.error}>{error}</Text> : null}
      </KeyboardAwareScrollView>
      <View style={[s.footer, { paddingBottom: spacing.lg + insets.bottom }]}>
        <PrimaryButton label={existing ? "Save Homework" : "Add Homework"} onPress={save} testID="assignment-save" />
      </View>
    </View>
  );
}
