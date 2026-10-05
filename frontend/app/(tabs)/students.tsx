import { useRouter } from "expo-router";
import { CaretRight, UsersThree } from "phosphor-react-native";
import { useMemo, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";

import { BrandHeader } from "@/src/components/screen-header";
import { EmptyState } from "@/src/components/ui/feedback";
import { FilterChips, SearchBar } from "@/src/components/ui/controls";
import { Avatar, Badge } from "@/src/components/ui/primitives";
import { useData } from "@/src/data/store";
import {
  activeStudents,
  className,
  sectionName,
  studentAttendance,
} from "@/src/data/compute";
import { makeStyles, spacing, useTheme } from "@/src/theme";

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  controls: {
    backgroundColor: c.surface,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  searchWrap: { paddingHorizontal: spacing.lg },
  chipLabel: { fontSize: 11, fontWeight: "700", color: c.muted, paddingHorizontal: spacing.lg, marginBottom: spacing.xs, textTransform: "uppercase", letterSpacing: 0.5 },
  list: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing["3xl"] },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 12,
    padding: spacing.md,
  },
  body: { flex: 1, gap: 2 },
  name: { fontSize: 15, fontWeight: "700", color: c.onSurface },
  sub: { fontSize: 13, color: c.muted },
  count: { fontSize: 12, color: "#9CA3AF", paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
}));

export default function StudentsScreen() {
  const s = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const { db } = useData();

  const [query, setQuery] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [sectionFilter, setSectionFilter] = useState("all");

  const classOptions = [
    { key: "all", label: "All Classes" },
    ...db.classes.map((c) => ({ key: c.id, label: c.name })),
  ];
  const sectionOptions = [
    { key: "all", label: "All Sections" },
    { key: "A", label: "Section A" },
    { key: "B", label: "Section B" },
  ];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return activeStudents(db)
      .filter((st) => (classFilter === "all" ? true : st.classId === classFilter))
      .filter((st) =>
        sectionFilter === "all" ? true : sectionName(db, st.sectionId) === sectionFilter,
      )
      .filter((st) =>
        q
          ? st.name.toLowerCase().includes(q) ||
            st.admissionNo.toLowerCase().includes(q)
          : true,
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [db, query, classFilter, sectionFilter]);

  return (
    <View style={s.root}>
      <BrandHeader title="Manage Students" subtitle={`${activeStudents(db).length} enrolled students`} />
      <View style={s.controls}>
        <View style={s.searchWrap}>
          <SearchBar
            value={query}
            onChangeText={setQuery}
            placeholder="Search by name or admission no."
            testID="students-search"
          />
        </View>
        <FilterChips
          options={classOptions}
          selected={classFilter}
          onSelect={setClassFilter}
          testIDPrefix="class-filter"
        />
        <FilterChips
          options={sectionOptions}
          selected={sectionFilter}
          onSelect={setSectionFilter}
          testIDPrefix="section-filter"
        />
      </View>
      <Text style={s.count}>{filtered.length} student(s) found</Text>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <EmptyState
            icon={<UsersThree size={30} color={colors.muted} weight="duotone" />}
            title="No students found"
            message="Try adjusting your search or filters."
            testID="students-empty"
          />
        }
        renderItem={({ item }) => {
          const attn = studentAttendance(db, item.id);
          const tone = attn.percentage >= 85 ? "success" : attn.percentage >= 75 ? "warning" : "error";
          return (
            <Pressable
              style={({ pressed }) => [s.row, pressed && { opacity: 0.7 }]}
              onPress={() => router.push({ pathname: "/student/[id]", params: { id: item.id } })}
              testID={`student-row-${item.id}`}
            >
              <Avatar name={item.name} index={item.avatarIndex} />
              <View style={s.body}>
                <Text style={s.name}>{item.name}</Text>
                <Text style={s.sub}>
                  {item.admissionNo} · {className(db, item.classId)} — {sectionName(db, item.sectionId)}
                </Text>
              </View>
              <Badge label={`${attn.percentage}%`} tone={tone} />
              <CaretRight size={16} color={colors.muted} weight="bold" />
            </Pressable>
          );
        }}
      />
    </View>
  );
}
