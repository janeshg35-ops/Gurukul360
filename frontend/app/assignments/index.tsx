import { useRouter } from "expo-router";
import { Notebook } from "phosphor-react-native";
import { useMemo, useState } from "react";
import { ScrollView, View } from "react-native";

import { AssignmentListCard } from "@/src/components/assignment-views";
import { StackHeader } from "@/src/components/screen-header";
import { FilterChips, SearchBar } from "@/src/components/ui/controls";
import { EmptyState } from "@/src/components/ui/feedback";
import { sortAssignments } from "@/src/data/assignments";
import { useData } from "@/src/data/store";
import { makeStyles, spacing, useTheme } from "@/src/theme";

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surfaceSecondary },
  filters: {
    backgroundColor: c.surface,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing["3xl"] },
}));

export default function AssignmentsScreen() {
  const s = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const { db } = useData();
  const [query, setQuery] = useState("");
  const [classId, setClassId] = useState("all");

  const options = useMemo(
    () => [{ key: "all", label: "All classes" }, ...[...db.classes].sort((a, b) => a.order - b.order).map((item) => ({ key: item.id, label: item.name }))],
    [db.classes],
  );
  const items = sortAssignments(db.assignments).filter((item) => {
    const classOk = classId === "all" || item.classId === classId;
    const text = query.trim().toLowerCase();
    return classOk && (!text || item.title.toLowerCase().includes(text));
  });

  return (
    <View style={s.root} testID="assignment-list">
      <StackHeader title="Homework" subtitle="Homework for every class" />
      <View style={s.filters}>
        <SearchBar value={query} onChangeText={setQuery} placeholder="Search homework" />
        <FilterChips options={options} selected={classId} onSelect={setClassId} testIDPrefix="assignment-class" />
      </View>
      {items.length === 0 ? (
        <EmptyState icon={<Notebook size={28} color={colors.brandPrimary} weight="duotone" />} title="No homework" message="Homework for the school will appear here." />
      ) : (
        <ScrollView contentContainerStyle={s.content}>
          {items.map((item) => (
            <AssignmentListCard key={item.id} item={item} onPress={() => router.push({ pathname: "/assignments/[id]", params: { id: item.id } })} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}
