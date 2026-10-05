import { useRouter } from "expo-router";
import { CaretRight, Plus, UsersThree } from "phosphor-react-native";
import { useEffect, useMemo, useState } from "react";
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
import {
  filterStudentList,
  pageWindow,
  paginateStudents,
  STUDENT_PAGE_SIZE,
  StudentListStatus,
} from "@/src/data/student-query";
import { makeStyles, spacing, useTheme } from "@/src/theme";

const STATUS_OPTIONS: { key: StudentListStatus; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "inactive", label: "Inactive" },
];

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
  pager: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  pageBtn: {
    minWidth: 36,
    height: 36,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  pageBtnOn: { backgroundColor: c.brandPrimary, borderColor: c.brandPrimary },
  pageText: { fontSize: 13, fontWeight: "700", color: c.onSurface },
  pageTextOn: { color: c.onBrandPrimary },
  pageGap: { fontSize: 13, fontWeight: "700", color: c.muted, paddingHorizontal: 2 },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: spacing.md,
    height: 36,
    borderRadius: 18,
  },
  addText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
}));

function countLabel(value: number): string {
  return value.toLocaleString("en-IN");
}

export default function StudentsScreen() {
  const s = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const { db } = useData();

  const [query, setQuery] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StudentListStatus>("active");
  const [page, setPage] = useState(1);

  const classOptions = [
    { key: "all", label: "All Classes" },
    ...db.classes.map((item) => ({ key: item.id, label: item.name })),
  ];
  const sectionOptions = [
    { key: "all", label: "All Sections" },
    { key: "A", label: "Section A" },
    { key: "B", label: "Section B" },
  ];

  const filtered = useMemo(
    () => filterStudentList(db.students, db.sections, query, classFilter, sectionFilter, statusFilter),
    [db.students, db.sections, query, classFilter, sectionFilter, statusFilter],
  );
  const view = paginateStudents(filtered, page, STUDENT_PAGE_SIZE);
  const labels = pageWindow(view.current, view.pages);

  useEffect(() => {
    if (view.current !== page) setPage(view.current);
  }, [view.current, page]);

  const changeQuery = (value: string) => {
    setQuery(value);
    setPage(1);
  };
  const changeClass = (value: string) => {
    setClassFilter(value);
    setPage(1);
  };
  const changeSection = (value: string) => {
    setSectionFilter(value);
    setPage(1);
  };
  const changeStatus = (value: string) => {
    setStatusFilter(value as StudentListStatus);
    setPage(1);
  };

  return (
    <View style={s.root}>
      <BrandHeader
        title="Manage Students"
        subtitle={`${activeStudents(db).length} enrolled students`}
        right={
          <Pressable
            style={s.addBtn}
            onPress={() => router.push({ pathname: "/student/form" })}
            testID="add-student-button"
            accessibilityRole="button"
            accessibilityLabel="Add Student"
          >
            <Plus size={16} color="#FFFFFF" weight="bold" />
            <Text style={s.addText}>Add</Text>
          </Pressable>
        }
      />
      <View style={s.controls}>
        <View style={s.searchWrap}>
          <SearchBar
            value={query}
            onChangeText={changeQuery}
            placeholder="Search by name, admission no., or phone"
            testID="students-search"
          />
        </View>
        <FilterChips
          options={classOptions}
          selected={classFilter}
          onSelect={changeClass}
          testIDPrefix="class-filter"
        />
        <FilterChips
          options={sectionOptions}
          selected={sectionFilter}
          onSelect={changeSection}
          testIDPrefix="section-filter"
        />
        <FilterChips
          options={STATUS_OPTIONS}
          selected={statusFilter}
          onSelect={changeStatus}
          testIDPrefix="student-status"
        />
      </View>
      {view.total > 0 ? (
        <Text style={s.count} testID="students-page-summary">
          Showing {countLabel(view.start)}–{countLabel(view.end)} of {countLabel(view.total)} students
        </Text>
      ) : (
        <Text style={s.count} testID="students-page-summary">
          Showing 0 of 0 students
        </Text>
      )}
      {view.total > 0 ? (
        <View style={s.pager}>
          <Pressable
            style={s.pageBtn}
            disabled={view.current <= 1}
            onPress={() => setPage(view.current - 1)}
            testID="students-page-prev"
          >
            <Text style={[s.pageText, view.current <= 1 && { color: colors.muted }]}>Previous</Text>
          </Pressable>
          {labels.map((label, index) =>
            label === "gap" ? (
              <Text key={`gap-${index}`} style={s.pageGap}>
                …
              </Text>
            ) : (
              <Pressable
                key={label}
                style={[s.pageBtn, label === view.current && s.pageBtnOn]}
                onPress={() => setPage(label)}
                testID={`students-page-${label}`}
              >
                <Text style={[s.pageText, label === view.current && s.pageTextOn]}>{label}</Text>
              </Pressable>
            ),
          )}
          <Pressable
            style={s.pageBtn}
            disabled={view.current >= view.pages}
            onPress={() => setPage(view.current + 1)}
            testID="students-page-next"
          >
            <Text style={[s.pageText, view.current >= view.pages && { color: colors.muted }]}>Next</Text>
          </Pressable>
        </View>
      ) : null}
      <FlatList
        data={view.slice}
        keyExtractor={(item) => item.id}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={STUDENT_PAGE_SIZE}
        windowSize={5}
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
          const hasAttendance = attn.total > 0;
          const tone = !hasAttendance
            ? "neutral"
            : attn.percentage >= 85
              ? "success"
              : attn.percentage >= 75
                ? "warning"
                : "error";
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
                  {item.status === "inactive" ? " · Inactive" : ""}
                </Text>
              </View>
              <Badge label={hasAttendance ? `${attn.percentage}%` : "—"} tone={tone} />
              <CaretRight size={16} color={colors.muted} weight="bold" />
            </Pressable>
          );
        }}
      />
    </View>
  );
}
