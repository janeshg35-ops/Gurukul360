import dayjs from "dayjs";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Check } from "phosphor-react-native";
import { useState, type ReactNode } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { StackHeader } from "@/src/components/screen-header";
import { PrimaryButton } from "@/src/components/ui/controls";
import { EmptyState, useToast } from "@/src/components/ui/feedback";
import { useData, type StudentFormInput } from "@/src/data/store";
import { formatINR, getStudent } from "@/src/data/compute";
import { Database, Gender } from "@/src/data/types";
import { makeStyles, radius, spacing, useTheme } from "@/src/theme";

const PREFERRED_FEE_HEADS = ["fh-academic", "fh-annual", "fh-exam", "fh-activity"];

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
  inputMultiline: { height: 88, paddingTop: spacing.md, textAlignVertical: "top" },
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
  feeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: c.surface,
  },
  feeRowOn: { borderColor: c.brandPrimary, backgroundColor: c.brandTertiary },
  feeBody: { flex: 1, gap: 2 },
  feeName: { fontSize: 14, fontWeight: "700", color: c.onSurface },
  feeAmt: { fontSize: 12, color: c.muted, fontWeight: "600" },
  note: { fontSize: 13, color: c.muted, lineHeight: 18 },
  footer: { padding: spacing.lg, backgroundColor: c.surface, borderTopWidth: 1, borderTopColor: c.border },
}));

function defaultFeeHeads(db: Database): string[] {
  const preferred = PREFERRED_FEE_HEADS.filter((id) => db.feeHeads.some((h) => h.id === id));
  return preferred.length > 0 ? preferred : db.feeHeads.map((h) => h.id);
}

function parseDob(input: string): string | null {
  const t = input.trim();
  const dmy = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(t);
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t);
  if (!dmy && !iso) return null;
  const year = Number(dmy ? dmy[3] : iso![1]);
  const month = Number(dmy ? dmy[2] : iso![2]);
  const day = Number(dmy ? dmy[1] : iso![3]);
  const parsed = dayjs(`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
  if (!parsed.isValid() || parsed.year() !== year || parsed.month() + 1 !== month || parsed.date() !== day) {
    return null;
  }
  if (!parsed.isBefore(dayjs(), "day")) return null;
  if (parsed.isBefore(dayjs().subtract(40, "year"))) return null;
  return parsed.format("YYYY-MM-DD");
}

function formatDob(iso: string): string {
  const parsed = dayjs(iso);
  return parsed.isValid() ? parsed.format("DD/MM/YYYY") : iso;
}

function validPhone(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15;
}

function validEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

type Errors = Partial<Record<keyof StudentFormInput | "rollText" | "dobText", string>>;

export default function StudentFormScreen() {
  const s = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { db, addStudent, updateStudent } = useData();
  const params = useLocalSearchParams<{ id?: string }>();
  const studentId = typeof params.id === "string" && params.id.length > 0 ? params.id : undefined;
  const existing = studentId ? getStudent(db, studentId) : undefined;
  const guardian = existing ? db.guardians.find((g) => g.id === existing.guardianId) : undefined;

  const [name, setName] = useState(existing?.name ?? "");
  const [admissionNo, setAdmissionNo] = useState(existing?.admissionNo ?? "");
  const [classId, setClassId] = useState(existing?.classId ?? "");
  const [sectionId, setSectionId] = useState(existing?.sectionId ?? "");
  const [rollText, setRollText] = useState(existing ? String(existing.rollNo) : "");
  const [dobText, setDobText] = useState(existing ? formatDob(existing.dob) : "");
  const [gender, setGender] = useState<Gender | "">(existing?.gender ?? "");
  const [guardianName, setGuardianName] = useState(guardian?.name ?? "");
  const [guardianPhone, setGuardianPhone] = useState(guardian?.phone ?? "");
  const [phone, setPhone] = useState(existing?.phone ?? "");
  const [email, setEmail] = useState(existing?.email ?? "");
  const [address, setAddress] = useState(existing?.address ?? "");
  const [feeHeadIds, setFeeHeadIds] = useState<string[]>(existing ? [...existing.feeHeadIds] : defaultFeeHeads(db));
  const [errors, setErrors] = useState<Errors>({});

  if (studentId && !existing) {
    return (
      <View style={s.root}>
        <StackHeader title="Edit Student" />
        <EmptyState title="Student not found" message="This record is unavailable." />
      </View>
    );
  }

  const sectionOptions = db.sections
    .filter((sec) => sec.classId === classId)
    .map((sec) => ({ key: sec.id, label: `Section ${sec.name}` }));

  const clearError = (key: keyof Errors) => {
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  };

  const onClass = (next: string) => {
    setClassId(next);
    setSectionId((current) =>
      db.sections.some((sec) => sec.id === current && sec.classId === next) ? current : "",
    );
    clearError("classId");
    clearError("sectionId");
  };

  const toggleFee = (id: string) => {
    setFeeHeadIds((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]));
    clearError("feeHeadIds");
  };

  const validate = (): StudentFormInput | null => {
    const next: Errors = {};
    const trimmedName = name.trim();
    const trimmedAdmission = admissionNo.trim();
    const roll = Number(rollText);
    const dob = parseDob(dobText);
    const section = db.sections.find((sec) => sec.id === sectionId);

    if (trimmedName.length < 2) next.name = "Enter the student's full name.";
    if (!trimmedAdmission) next.admissionNo = "Enter an admission number.";
    else if (
      db.students.some(
        (st) => st.id !== existing?.id && st.admissionNo.trim().toLowerCase() === trimmedAdmission.toLowerCase(),
      )
    ) {
      next.admissionNo = "This admission number is already in use.";
    }
    if (!db.classes.some((c) => c.id === classId)) next.classId = "Select a class.";
    if (!section || section.classId !== classId) next.sectionId = "Select a section for this class.";
    if (!Number.isInteger(roll) || roll < 1) next.rollText = "Enter a roll number of 1 or more.";
    else if (
      section &&
      db.students.some(
        (st) =>
          st.id !== existing?.id && st.status === "active" && st.sectionId === section.id && st.rollNo === roll,
      )
    ) {
      next.rollText = "This roll number is already used in the selected section.";
    }
    if (!dob) next.dobText = "Enter a valid past date of birth (DD/MM/YYYY).";
    if (gender !== "Male" && gender !== "Female") next.gender = "Select a gender.";
    if (guardianName.trim().length < 2) next.guardianName = "Enter the guardian's name.";
    if (!validPhone(guardianPhone)) next.guardianPhone = "Enter a valid guardian phone number.";
    if (!validPhone(phone)) next.phone = "Enter a valid phone number.";
    if (!validEmail(email)) next.email = "Enter a valid email address.";
    if (address.trim().length < 5) next.address = "Enter the address.";
    if (feeHeadIds.length === 0 || feeHeadIds.some((id) => !db.feeHeads.some((h) => h.id === id))) {
      next.feeHeadIds = "Select at least one fee head.";
    }

    setErrors(next);
    if (Object.values(next).some(Boolean) || !dob || (gender !== "Male" && gender !== "Female")) return null;
    return {
      name: trimmedName,
      admissionNo: trimmedAdmission,
      classId,
      sectionId,
      rollNo: roll,
      dob,
      gender,
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      feeHeadIds: [...feeHeadIds],
      guardianName: guardianName.trim(),
      guardianPhone: guardianPhone.trim(),
    };
  };

  const onSave = () => {
    const input = validate();
    if (!input) {
      toast.show("Please correct the highlighted fields", "error");
      return;
    }
    if (existing) {
      const ok = updateStudent(existing.id, input);
      if (!ok) {
        toast.show("Could not save this student. Check the admission number.", "error");
        return;
      }
      toast.show("Student updated", "success");
    } else {
      const id = addStudent(input);
      if (!id) {
        toast.show("This admission number is already in use.", "error");
        return;
      }
      toast.show("Student added", "success");
    }
    router.back();
  };

  return (
    <View style={s.root}>
      <StackHeader
        title={existing ? "Edit Student" : "Add Student"}
        subtitle={existing ? existing.admissionNo : "Creates one active student record"}
      />
      <KeyboardAwareScrollView
        contentContainerStyle={s.content}
        bottomOffset={24}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.note}>
          {existing
            ? "Changes update this same student everywhere attendance, fees, academics, and reports read the record."
            : "No attendance, fee payments, or academic marks are created. Those stay empty until they are recorded."}
        </Text>

        <Field label="Student Name" error={errors.name}>
          <TextInput
            value={name}
            onChangeText={(t) => {
              setName(t);
              clearError("name");
            }}
            style={s.input}
            placeholder="Full name"
            placeholderTextColor={colors.muted}
            testID="student-name-input"
          />
        </Field>

        <Field label="Admission Number" error={errors.admissionNo}>
          <TextInput
            value={admissionNo}
            onChangeText={(t) => {
              setAdmissionNo(t);
              clearError("admissionNo");
            }}
            style={s.input}
            placeholder="e.g. MDS/10/1031"
            placeholderTextColor={colors.muted}
            autoCapitalize="characters"
            testID="student-admission-input"
          />
        </Field>

        <Field label="Class" error={errors.classId}>
          <View style={s.choices}>
            {db.classes.map((c) => {
              const on = c.id === classId;
              return (
                <Pressable
                  key={c.id}
                  style={[s.chip, on && s.chipOn]}
                  onPress={() => onClass(c.id)}
                  testID={`student-class-${c.id}`}
                >
                  <Text style={[s.chipText, on && s.chipTextOn]}>{c.name}</Text>
                </Pressable>
              );
            })}
          </View>
        </Field>

        <Field label="Section" error={errors.sectionId}>
          {classId ? (
            <View style={s.choices}>
              {sectionOptions.map((opt) => {
                const on = opt.key === sectionId;
                return (
                  <Pressable
                    key={opt.key}
                    style={[s.chip, on && s.chipOn]}
                    onPress={() => {
                      setSectionId(opt.key);
                      clearError("sectionId");
                    }}
                    testID={`student-section-${opt.key}`}
                  >
                    <Text style={[s.chipText, on && s.chipTextOn]}>{opt.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <Text style={s.hint}>Select a class first.</Text>
          )}
        </Field>

        <Field label="Roll Number" error={errors.rollText}>
          <TextInput
            value={rollText}
            onChangeText={(t) => {
              setRollText(t.replace(/[^0-9]/g, ""));
              clearError("rollText");
            }}
            style={s.input}
            placeholder="Roll number in this section"
            placeholderTextColor={colors.muted}
            keyboardType="number-pad"
            testID="student-roll-input"
          />
        </Field>

        <Field label="Date of Birth" error={errors.dobText}>
          <TextInput
            value={dobText}
            onChangeText={(t) => {
              setDobText(t);
              clearError("dobText");
            }}
            style={s.input}
            placeholder="DD/MM/YYYY"
            placeholderTextColor={colors.muted}
            keyboardType="default"
            testID="student-dob-input"
          />
        </Field>

        <Field label="Gender" error={errors.gender}>
          <View style={s.choices}>
            {(["Male", "Female"] as const).map((option) => {
              const on = gender === option;
              return (
                <Pressable
                  key={option}
                  style={[s.chip, on && s.chipOn]}
                  onPress={() => {
                    setGender(option);
                    clearError("gender");
                  }}
                  testID={`student-gender-${option}`}
                >
                  <Text style={[s.chipText, on && s.chipTextOn]}>{option}</Text>
                </Pressable>
              );
            })}
          </View>
        </Field>

        <Field label="Guardian Name" error={errors.guardianName}>
          <TextInput
            value={guardianName}
            onChangeText={(t) => {
              setGuardianName(t);
              clearError("guardianName");
            }}
            style={s.input}
            placeholder="Parent or guardian"
            placeholderTextColor={colors.muted}
            testID="student-guardian-name-input"
          />
        </Field>

        <Field label="Guardian Phone" error={errors.guardianPhone}>
          <TextInput
            value={guardianPhone}
            onChangeText={(t) => {
              setGuardianPhone(t);
              clearError("guardianPhone");
            }}
            style={s.input}
            placeholder="Phone number"
            placeholderTextColor={colors.muted}
            keyboardType="phone-pad"
            testID="student-guardian-phone-input"
          />
        </Field>

        <Field label="Student / Contact Phone" error={errors.phone}>
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
            testID="student-phone-input"
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
            placeholder="name@email.com"
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            testID="student-email-input"
          />
        </Field>

        <Field label="Address" error={errors.address}>
          <TextInput
            value={address}
            onChangeText={(t) => {
              setAddress(t);
              clearError("address");
            }}
            style={[s.input, s.inputMultiline]}
            placeholder="Residential address"
            placeholderTextColor={colors.muted}
            multiline
            testID="student-address-input"
          />
        </Field>

        <Field label="Fee Heads" error={errors.feeHeadIds}>
          <View style={{ gap: spacing.sm }}>
            {db.feeHeads.map((head) => {
              const on = feeHeadIds.includes(head.id);
              return (
                <Pressable
                  key={head.id}
                  style={[s.feeRow, on && s.feeRowOn]}
                  onPress={() => toggleFee(head.id)}
                  testID={`student-fee-${head.id}`}
                >
                  <View style={s.feeBody}>
                    <Text style={s.feeName}>{head.name}</Text>
                    <Text style={s.feeAmt}>{formatINR(head.amount)}</Text>
                  </View>
                  {on ? <Check size={18} color={colors.brandPrimary} weight="bold" /> : null}
                </Pressable>
              );
            })}
          </View>
        </Field>
      </KeyboardAwareScrollView>
      <View style={[s.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <PrimaryButton
          label={existing ? "Save Changes" : "Add Student"}
          onPress={onSave}
          testID="save-student-button"
        />
      </View>
    </View>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  const s = useStyles();
  return (
    <View>
      <Text style={s.label}>{label}</Text>
      {children}
      {error ? <Text style={s.error}>{error}</Text> : null}
    </View>
  );
}
