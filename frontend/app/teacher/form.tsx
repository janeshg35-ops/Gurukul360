import { useLocalSearchParams, useRouter } from "expo-router";
import { Check } from "phosphor-react-native";
import { useState, type ReactNode } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { StackHeader } from "@/src/components/screen-header";
import { PrimaryButton } from "@/src/components/ui/controls";
import { EmptyState, useToast } from "@/src/components/ui/feedback";
import { useData } from "@/src/data/store";
import {
  activeClassTeacherId,
  classTeacherLabel,
  getTeacher,
  TeacherFormInput,
  teacherEmailTaken,
  validTeacherEmail,
  validTeacherPhone,
} from "@/src/data/teachers";
import { makeStyles, radius, spacing, useTheme } from "@/src/theme";

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surfaceSecondary },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xl },
  label: { fontSize: 13, fontWeight: "700", color: c.onSurfaceSecondary, marginBottom: spacing.sm },
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
  error: { fontSize: 12, color: c.error, marginTop: spacing.xs, fontWeight: "600" },
  hint: { fontSize: 12, color: c.muted, marginTop: spacing.xs },
  choices: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    height: 36,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  chipOn: { backgroundColor: c.brandPrimary, borderColor: c.brandPrimary },
  chipText: { fontSize: 13, fontWeight: "600", color: c.onSurfaceTertiary },
  chipTextOn: { color: c.onBrandPrimary },
  subjectRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: c.surface,
  },
  subjectRowOn: { borderColor: c.brandPrimary, backgroundColor: c.brandTertiary },
  subjectName: { flex: 1, fontSize: 14, fontWeight: "700", color: c.onSurface },
  footer: { padding: spacing.lg, backgroundColor: c.surface, borderTopWidth: 1, borderTopColor: c.border },
}));

type Errors = Partial<Record<"name" | "phone" | "email" | "subjectIds" | "classTeacherOf", string>>;

export default function TeacherFormScreen() {
  const s = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { db, addTeacher, updateTeacher } = useData();
  const params = useLocalSearchParams<{ id?: string }>();
  const teacherId = typeof params.id === "string" && params.id.length > 0 ? params.id : undefined;
  const existing = teacherId ? getTeacher(db, teacherId) : undefined;

  const [name, setName] = useState(existing?.name ?? "");
  const [phone, setPhone] = useState(existing?.phone ?? "");
  const [email, setEmail] = useState(existing?.email ?? "");
  const [subjectIds, setSubjectIds] = useState<string[]>(existing ? [...existing.subjectIds] : []);
  const [sectionId, setSectionId] = useState(existing?.classTeacherOf ?? "");
  const [errors, setErrors] = useState<Errors>({});

  if (teacherId && !existing) {
    return (
      <View style={s.root}>
        <StackHeader title="Edit Teacher" />
        <EmptyState title="Teacher not found" message="This record is unavailable." />
      </View>
    );
  }

  const sections = [...db.sections].sort((a, b) => {
    const ao = db.classes.find((c) => c.id === a.classId)?.order ?? 0;
    const bo = db.classes.find((c) => c.id === b.classId)?.order ?? 0;
    if (ao !== bo) return ao - bo;
    return a.name.localeCompare(b.name);
  });

  const clearError = (key: keyof Errors) => {
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  };

  const toggleSubject = (id: string) => {
    setSubjectIds((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]));
    clearError("subjectIds");
  };

  const validate = (): TeacherFormInput | null => {
    const next: Errors = {};
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    if (trimmedName.length < 2) next.name = "Enter the teacher's full name.";
    if (!validTeacherPhone(phone)) next.phone = "Enter a valid phone number.";
    if (!validTeacherEmail(trimmedEmail)) next.email = "Enter a valid email address.";
    else if (teacherEmailTaken(db, trimmedEmail, existing?.id)) next.email = "This email is already in use.";
    if (subjectIds.length === 0 || subjectIds.some((id) => !db.subjects.some((sub) => sub.id === id))) {
      next.subjectIds = "Select at least one subject.";
    }
    if (sectionId && !db.sections.some((sec) => sec.id === sectionId)) {
      next.classTeacherOf = "Select a valid section.";
    } else if (sectionId && activeClassTeacherId(db, sectionId, existing?.id)) {
      next.classTeacherOf = "This section already has an active class teacher.";
    }
    setErrors(next);
    if (Object.values(next).some(Boolean)) return null;
    return {
      name: trimmedName,
      phone: phone.trim(),
      email: trimmedEmail,
      subjectIds: [...subjectIds],
      classTeacherOf: sectionId || undefined,
    };
  };

  const onSave = () => {
    const input = validate();
    if (!input) {
      toast.show("Please correct the highlighted fields", "error");
      return;
    }
    if (existing) {
      const ok = updateTeacher(existing.id, input);
      if (!ok) {
        toast.show("Could not save this teacher. Check the email or class assignment.", "error");
        return;
      }
      toast.show("Teacher updated", "success");
    } else {
      const id = addTeacher(input);
      if (!id) {
        toast.show("Could not add this teacher. Check the email or class assignment.", "error");
        return;
      }
      toast.show("Teacher added", "success");
    }
    router.back();
  };

  return (
    <View style={s.root}>
      <StackHeader
        title={existing ? "Edit Teacher" : "Add Teacher"}
        subtitle={existing ? existing.email : "Creates one active teacher record"}
      />
      <KeyboardAwareScrollView
        contentContainerStyle={s.content}
        bottomOffset={24}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Field label="Name" error={errors.name}>
          <TextInput
            value={name}
            onChangeText={(t) => {
              setName(t);
              clearError("name");
            }}
            style={s.input}
            placeholder="Full name"
            placeholderTextColor={colors.muted}
            testID="teacher-name-input"
          />
        </Field>

        <Field label="Phone" error={errors.phone}>
          <TextInput
            value={phone}
            onChangeText={(t) => {
              setPhone(t);
              clearError("phone");
            }}
            style={s.input}
            placeholder="Phone number"
            placeholderTextColor={colors.muted}
            keyboardType="phone-pad"
            testID="teacher-phone-input"
          />
        </Field>

        <Field label="Email" error={errors.email}>
          <TextInput
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              clearError("email");
            }}
            style={s.input}
            placeholder="name@school.com"
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            testID="teacher-email-input"
          />
        </Field>

        <Field label="Subjects" error={errors.subjectIds}>
          <View style={{ gap: spacing.sm }}>
            {db.subjects.map((sub) => {
              const on = subjectIds.includes(sub.id);
              return (
                <Pressable
                  key={sub.id}
                  style={[s.subjectRow, on && s.subjectRowOn]}
                  onPress={() => toggleSubject(sub.id)}
                  testID={`teacher-subject-option-${sub.id}`}
                >
                  <Text style={s.subjectName}>{sub.name}</Text>
                  {on ? <Check size={18} color={colors.brandPrimary} weight="bold" /> : null}
                </Pressable>
              );
            })}
          </View>
        </Field>

        <Field label="Class Teacher Of" error={errors.classTeacherOf}>
          <Text style={s.hint}>Optional. Leave as None for a subject teacher.</Text>
          <View style={[s.choices, { marginTop: spacing.sm }]}>
            <Pressable
              style={[s.chip, sectionId === "" && s.chipOn]}
              onPress={() => {
                setSectionId("");
                clearError("classTeacherOf");
              }}
              testID="teacher-section-none"
            >
              <Text style={[s.chipText, sectionId === "" && s.chipTextOn]}>None</Text>
            </Pressable>
            {sections.map((sec) => {
              const on = sectionId === sec.id;
              return (
                <Pressable
                  key={sec.id}
                  style={[s.chip, on && s.chipOn]}
                  onPress={() => {
                    setSectionId(sec.id);
                    clearError("classTeacherOf");
                  }}
                  testID={`teacher-section-${sec.id}`}
                >
                  <Text style={[s.chipText, on && s.chipTextOn]}>{classTeacherLabel(db, sec.id)}</Text>
                </Pressable>
              );
            })}
          </View>
        </Field>
      </KeyboardAwareScrollView>
      <View style={[s.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <PrimaryButton
          label={existing ? "Save Changes" : "Add Teacher"}
          onPress={onSave}
          testID="save-teacher-button"
        />
      </View>
    </View>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  const s = useStyles();
  return (
    <View>
      <Text style={s.label}>{label}</Text>
      {children}
      {error ? <Text style={s.error}>{error}</Text> : null}
    </View>
  );
}
