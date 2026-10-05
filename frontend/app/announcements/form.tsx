import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { StackHeader } from "@/src/components/screen-header";
import { PrimaryButton } from "@/src/components/ui/controls";
import { DateField } from "@/src/components/ui/date-field";
import { useToast } from "@/src/components/ui/feedback";
import { PRINCIPAL } from "@/src/constants/branding";
import { useAuth } from "@/src/context/auth";
import { AnnouncementInput, useData } from "@/src/data/store";
import { AnnouncementCategory } from "@/src/data/types";
import { instantToIsoDate, isoDateToLocalNoonInstant } from "@/src/utils/date-only";
import { makeStyles, radius, spacing, useTheme } from "@/src/theme";

const CATEGORIES: AnnouncementCategory[] = ["Notice", "Announcement", "Event", "Circular"];
const AUDIENCES = ["All", "Teachers", "Students"] as const;

const useStyles = makeStyles((c) => ({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
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
  inputMultiline: { height: 120, paddingTop: spacing.md, textAlignVertical: "top" },
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
  error: { fontSize: 13, color: c.error, fontWeight: "600" },
  footer: { padding: spacing.lg, backgroundColor: c.surface, borderTopWidth: 1, borderTopColor: c.border },
}));

export default function CommunicationFormScreen() {
  const s = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { user } = useAuth();
  const { db, addAnnouncement, updateAnnouncement } = useData();
  const toast = useToast();
  const existing = id ? db.announcements.find((item) => item.id === id) : undefined;
  const principalName = user?.name || PRINCIPAL.name;

  const [title, setTitle] = useState(existing?.title ?? "");
  const [body, setBody] = useState(existing?.body ?? "");
  const [category, setCategory] = useState<AnnouncementCategory | "">(existing?.category ?? "");
  const [date, setDate] = useState(existing ? instantToIsoDate(existing.date) : "");
  const [audience, setAudience] = useState(existing?.audience ?? "");
  const [author, setAuthor] = useState(existing?.author ?? principalName);
  const audienceChoices = AUDIENCES.includes(audience as (typeof AUDIENCES)[number]) || !audience
    ? [...AUDIENCES]
    : [audience, ...AUDIENCES];
  const [error, setError] = useState("");

  const save = () => {
    const iso = isoDateToLocalNoonInstant(date);
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!body.trim()) {
      setError("Body is required.");
      return;
    }
    if (!category) {
      setError("Category is required.");
      return;
    }
    if (!iso) {
      setError(date.trim() ? "Enter the date as DD/MM/YYYY." : "Date is required.");
      return;
    }
    if (!audience.trim()) {
      setError("Audience is required.");
      return;
    }
    const input: AnnouncementInput = {
      title,
      body,
      category,
      date: iso,
      audience,
      author: author.trim() || principalName,
    };
    if (existing) {
      const ok = updateAnnouncement(existing.id, input);
      if (!ok) {
        setError("Could not save this communication.");
        return;
      }
      toast.show("Communication updated", "success");
    } else {
      const created = addAnnouncement(input);
      if (!created) {
        setError("Could not save this communication.");
        return;
      }
      toast.show("Communication added", "success");
    }
    router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surfaceSecondary }}>
      <StackHeader title={existing ? "Edit" : "Add"} subtitle="Communication" />
      <KeyboardAwareScrollView style={{ flex: 1 }} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <View style={s.field}>
          <Text style={s.label}>Title</Text>
          <TextInput style={s.input} value={title} onChangeText={setTitle} placeholder="Title" placeholderTextColor={colors.muted} />
        </View>
        <View style={s.field}>
          <Text style={s.label}>Body</Text>
          <TextInput
            style={[s.input, s.inputMultiline]}
            value={body}
            onChangeText={setBody}
            placeholder="Write the notice, announcement, event, or circular"
            placeholderTextColor={colors.muted}
            multiline
          />
        </View>
        <View style={s.field}>
          <Text style={s.label}>Category</Text>
          <View style={s.choices}>
            {CATEGORIES.map((item) => (
              <Pressable key={item} style={[s.chip, category === item && s.chipOn]} onPress={() => setCategory(item)}>
                <Text style={[s.chipText, category === item && s.chipTextOn]}>{item}</Text>
              </Pressable>
            ))}
          </View>
        </View>
        <View style={s.field}>
          <Text style={s.label}>Date</Text>
          <DateField value={date} onChange={setDate} testID="communication-date" />
        </View>
        <View style={s.field}>
          <Text style={s.label}>Who is this for</Text>
          <View style={s.choices}>
            {audienceChoices.map((item) => (
              <Pressable key={item} style={[s.chip, audience === item && s.chipOn]} onPress={() => setAudience(item)}>
                <Text style={[s.chipText, audience === item && s.chipTextOn]}>{item}</Text>
              </Pressable>
            ))}
          </View>
        </View>
        <View style={s.field}>
          <Text style={s.label}>Author</Text>
          <TextInput style={s.input} value={author} onChangeText={setAuthor} placeholder={principalName} placeholderTextColor={colors.muted} />
        </View>
        {error ? <Text style={s.error}>{error}</Text> : null}
      </KeyboardAwareScrollView>
      <View style={[s.footer, { paddingBottom: spacing.lg + insets.bottom }]}>
        <PrimaryButton label={existing ? "Save" : "Add"} onPress={save} testID="communication-save" />
      </View>
    </View>
  );
}
