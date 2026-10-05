import { useRouter } from "expo-router";
import { CaretRight, ChalkboardTeacher, Plus } from "phosphor-react-native";
import { useMemo, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";

import { StackHeader } from "@/src/components/screen-header";
import { FilterChips, SearchBar } from "@/src/components/ui/controls";
import { EmptyState } from "@/src/components/ui/feedback";
import { Avatar, Badge } from "@/src/components/ui/primitives";
import { useData } from "@/src/data/store";
import {
  activeTeacherCount,
  classTeacherLabel,
  filterTeachers,
  isActiveTeacher,
  subjectNames,
  TeacherRoleFilter,
  TeacherStatusFilter,
} from "@/src/data/teachers";
import { makeStyles, spacing, useTheme } from "@/src/theme";

function avatarIndex(id: string): number {
  let sum = 0;
  for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i);
  return sum % 8;
}

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
  chipLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: c.muted,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xs,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
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
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: c.brandPrimary,
    paddingHorizontal: spacing.md,
    height: 34,
    borderRadius: 17,
  },
  addText: { color: c.onBrandPrimary, fontSize: 13, fontWeight: "700" },
}));

export default function TeachersScreen() {
  const s = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const { db } = useData();

  const [query, setQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState<TeacherRoleFilter>("all");
  const [statusFilter, setStatusFilter] = useState<TeacherStatusFilter>("all");

  const subjectOptions = [
    { key: "all", label: "All Subjects" },
    ...db.subjects.map((sub) => ({ key: sub.id, label: sub.name })),
  ];
  const roleOptions = [
    { key: "all", label: "All Roles" },
    { key: "class", label: "Class Teacher" },
    { key: "subject", label: "Subject Teacher" },
  ];
  const statusOptions = [
    { key: "all", label: "All" },
    { key: "active", label: "Active" },
    { key: "inactive", label: "Inactive" },
  ];

  const filtered = useMemo(
    () => filterTeachers(db, query, subjectFilter, roleFilter, statusFilter),
    [db, query, subjectFilter, roleFilter, statusFilter],
  );

  return (
    <View style={s.root}>
      <StackHeader
        title="Manage Teachers"
        subtitle={`${activeTeacherCount(db)} active teachers`}
        right={
          <Pressable
            style={s.addBtn}
            onPress={() => router.push("/teacher/form")}
            testID="add-teacher-button"
            accessibilityRole="button"
            accessibilityLabel="Add Teacher"
          >
            <Plus size={14} color="#FFFFFF" weight="bold" />
            <Text style={s.addText}>Add</Text>
          </Pressable>
        }
      />
      <View style={s.controls}>
        <View style={s.searchWrap}>
          <SearchBar
            value={query}
            onChangeText={setQuery}
            placeholder="Search by teacher name"
            testID="teachers-search"
          />
        </View>
        <View>
          <Text style={s.chipLabel}>Subject</Text>
          <FilterChips
            options={subjectOptions}
            selected={subjectFilter}
            onSelect={setSubjectFilter}
            testIDPrefix="teacher-subject"
          />
        </View>
        <View>
          <Text style={s.chipLabel}>Role</Text>
          <FilterChips
            options={roleOptions}
            selected={roleFilter}
            onSelect={(key) => setRoleFilter(key as TeacherRoleFilter)}
            testIDPrefix="teacher-role"
          />
        </View>
        <View>
          <Text style={s.chipLabel}>Status</Text>
          <FilterChips
            options={statusOptions}
            selected={statusFilter}
            onSelect={(key) => setStatusFilter(key as TeacherStatusFilter)}
            testIDPrefix="teacher-status"
          />
        </View>
      </View>
      <Text style={s.count}>{filtered.length} teacher(s) found</Text>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <EmptyState
            icon={<ChalkboardTeacher size={30} color={colors.muted} weight="duotone" />}
            title="No teachers found"
            message="Try adjusting your search or filters."
            testID="teachers-empty"
          />
        }
        renderItem={({ item }) => {
          const active = isActiveTeacher(item);
          const subjects = subjectNames(db, item.subjectIds).join(", ");
          const assignment = item.classTeacherOf
            ? classTeacherLabel(db, item.classTeacherOf)
            : "Subject teacher";
          return (
            <Pressable
              style={({ pressed }) => [s.row, pressed && { opacity: 0.7 }]}
              onPress={() => router.push({ pathname: "/teacher/[id]", params: { id: item.id } })}
              testID={`teacher-row-${item.id}`}
            >
              <Avatar name={item.name} index={avatarIndex(item.id)} />
              <View style={s.body}>
                <Text style={s.name}>{item.name}</Text>
                <Text style={s.sub}>
                  {subjects} · {assignment}
                </Text>
              </View>
              <Badge label={active ? "Active" : "Inactive"} tone={active ? "success" : "neutral"} />
              <CaretRight size={16} color={colors.muted} weight="bold" />
            </Pressable>
          );
        }}
      />
    </View>
  );
}
