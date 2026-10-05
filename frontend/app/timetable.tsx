import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { StackHeader } from "@/src/components/screen-header";
import { TimetablePeriodList, weekdayLabel } from "@/src/components/timetable-views";
import { FilterChips, PrimaryButton, SecondaryButton } from "@/src/components/ui/controls";
import { useToast } from "@/src/components/ui/feedback";
import { generateTimetable, TimetableGenerationResult } from "@/src/data/timetable-generate";
import { WEEK_DAYS } from "@/src/data/timetable-config";
import { useData } from "@/src/data/store";
import { makeStyles, radius, spacing } from "@/src/theme";

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surfaceSecondary },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing["3xl"] },
  filters: { gap: spacing.sm },
  generate: {
    backgroundColor: c.brandPrimary,
    paddingHorizontal: spacing.md,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  generateText: { color: c.onBrandPrimary, fontSize: 13, fontWeight: "700" },
  panel: {
    backgroundColor: c.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: c.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  label: { fontSize: 13, fontWeight: "700", color: c.onSurfaceSecondary },
  choices: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    minHeight: 36,
    paddingHorizontal: spacing.md,
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
  summary: { gap: 4 },
  summaryLine: { fontSize: 14, fontWeight: "700", color: c.onSurface },
  reason: { fontSize: 13, lineHeight: 18, color: c.error, fontWeight: "600" },
  preview: { fontSize: 13, fontWeight: "700", color: c.brandPrimary },
}));

export default function TimetableScreen() {
  const s = useStyles();
  const insets = useSafeAreaInsets();
  const { db, replaceTimetable } = useData();
  const toast = useToast();
  const [classId, setClassId] = useState(db.classes[0]?.id ?? "");
  const sectionsForClass = db.sections.filter((section) => section.classId === classId);
  const [sectionId, setSectionId] = useState(sectionsForClass[0]?.id ?? "");
  const [day, setDay] = useState<string>(WEEK_DAYS[0]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [allSections, setAllSections] = useState(true);
  const [picked, setPicked] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<TimetableGenerationResult | null>(null);

  const activeSection = sectionsForClass.some((section) => section.id === sectionId)
    ? sectionId
    : sectionsForClass[0]?.id ?? "";

  const source = result?.success ? result.entries : db.timetable;
  const visible = source.filter((entry) => entry.sectionId === activeSection);

  const chooseClass = (next: string) => {
    setClassId(next);
    const first = db.sections.find((section) => section.classId === next);
    setSectionId(first?.id ?? "");
  };

  const toggleSection = (id: string) => {
    setAllSections(false);
    setPicked((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  const generate = () => {
    const sectionIds = allSections ? db.sections.map((section) => section.id) : picked;
    if (sectionIds.length === 0) {
      toast.show("Select a section to generate", "warning");
      return;
    }
    setRunning(true);
    setTimeout(() => {
      const next = generateTimetable({
        classes: db.classes,
        sections: db.sections,
        subjects: db.subjects,
        teachers: db.teachers,
        sectionIds,
        fixedEntries: db.timetable,
      });
      setResult(next);
      setRunning(false);
      if (next.success && next.entries.some((entry) => entry.sectionId === activeSection)) {
        const first = next.entries.find((entry) => entry.sectionId === activeSection);
        if (first) {
          setClassId(first.classId);
          setSectionId(first.sectionId);
        }
      }
    }, 0);
  };

  const save = () => {
    if (!result?.success) return;
    const saved = replaceTimetable(result.entries);
    if (!saved) {
      toast.show("Timetable was not saved", "error");
      return;
    }
    toast.show("Timetable saved", "success");
    setResult(null);
    setPanelOpen(false);
  };

  return (
    <View style={s.root} testID="principal-timetable">
      <StackHeader
        title="Timetable"
        subtitle="Classes, teachers and rooms"
        right={
          <Pressable style={s.generate} onPress={() => setPanelOpen((open) => !open)} testID="timetable-generate-open">
            <Text style={s.generateText}>Generate</Text>
          </Pressable>
        }
      />
      <ScrollView contentContainerStyle={[s.content, { paddingBottom: spacing["3xl"] + insets.bottom }]}>
        <View style={s.filters}>
          <FilterChips
            options={db.classes.map((item) => ({ key: item.id, label: item.name }))}
            selected={classId}
            onSelect={chooseClass}
            testIDPrefix="timetable-class"
          />
          <FilterChips
            options={sectionsForClass.map((item) => ({ key: item.id, label: item.name }))}
            selected={activeSection}
            onSelect={setSectionId}
            testIDPrefix="timetable-section"
          />
          <FilterChips
            options={WEEK_DAYS.map((item) => ({ key: item, label: weekdayLabel(item) }))}
            selected={day}
            onSelect={setDay}
            testIDPrefix="timetable-day"
          />
        </View>

        {panelOpen ? (
          <View style={s.panel}>
            <Text style={s.label}>Sections</Text>
            <View style={s.choices}>
              <Pressable
                style={[s.chip, allSections && s.chipOn]}
                onPress={() => setAllSections(true)}
              >
                <Text style={[s.chipText, allSections && s.chipTextOn]}>All sections</Text>
              </Pressable>
              {db.sections.map((section) => {
                const schoolClass = db.classes.find((item) => item.id === section.classId);
                const on = !allSections && picked.includes(section.id);
                return (
                  <Pressable key={section.id} style={[s.chip, on && s.chipOn]} onPress={() => toggleSection(section.id)}>
                    <Text style={[s.chipText, on && s.chipTextOn]}>
                      {(schoolClass?.name ?? "Class").replace(/^Class\s+/, "")}-{section.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <PrimaryButton label="Generate Timetable" onPress={generate} loading={running} testID="timetable-generate" />
            {result ? (
              <View style={s.summary}>
                <Text style={s.summaryLine}>Sections processed: {result.sectionsProcessed.length}</Text>
                <Text style={s.summaryLine}>Entries generated: {result.generatedEntries.length}</Text>
                <Text style={s.summaryLine}>Unscheduled items: {result.unscheduledItems.length}</Text>
                <Text style={s.summaryLine}>Conflicts: {result.conflicts.length}</Text>
                {[...new Set([...result.conflicts, ...result.unscheduledItems.map((item) => item.reason)])].slice(0, 4).map((reason) => (
                  <Text key={reason} style={s.reason}>{reason}</Text>
                ))}
                {result.success ? (
                  <>
                    <Text style={s.preview}>Preview is showing. Save to keep this timetable.</Text>
                    <PrimaryButton label="Save" onPress={save} testID="timetable-save" />
                    <SecondaryButton label="Discard" onPress={() => setResult(null)} />
                  </>
                ) : null}
              </View>
            ) : null}
          </View>
        ) : null}

        {result?.success ? <Text style={s.preview}>Showing the generated timetable before save.</Text> : null}

        <TimetablePeriodList entries={visible} db={db} day={day} mode="section" showTeacher showClass={false} />
      </ScrollView>
    </View>
  );
}
