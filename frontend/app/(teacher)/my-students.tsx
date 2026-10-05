import { useRouter } from "expo-router";
import { CaretRight } from "phosphor-react-native";
import { useMemo, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";

import { useLiveTeacher } from "@/src/auth/use-live-teacher";
import { NoClassState } from "./no-class";
import { StackHeader } from "@/src/components/screen-header";
import { SearchBar } from "@/src/components/ui/controls";
import { EmptyState, LoadingView } from "@/src/components/ui/feedback";
import { Avatar } from "@/src/components/ui/primitives";
import { useData } from "@/src/data/store";
import { sectionStudents } from "@/src/data/compute";
import { classTeacherLabel } from "@/src/data/teachers";
import { makeStyles, spacing, useTheme } from "@/src/theme";

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  searchWrap: { padding: spacing.lg, paddingBottom: spacing.sm },
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
}));

export default function MyStudents() {
  const s = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const { db } = useData();
  const { teacher, ready } = useLiveTeacher();
  const [query, setQuery] = useState("");

  const sectionId = teacher?.classTeacherOf;
  const roster = useMemo(
    () => (sectionId ? sectionStudents(db, sectionId) : []),
    [db, sectionId],
  );
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return roster;
    return roster.filter((st) => st.name.toLowerCase().includes(q));
  }, [roster, query]);

  if (!ready || !teacher) {
    return (
      <View style={s.root}>
        <LoadingView />
      </View>
    );
  }

  if (!sectionId) {
    return (
      <View style={s.root}>
        <StackHeader title="My Students" />
        <NoClassState />
      </View>
    );
  }

  const classLabel = classTeacherLabel(db, sectionId);

  return (
    <View style={s.root}>
      <StackHeader title="My Students" subtitle={classLabel} />
      <View style={s.searchWrap}>
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder="Search by student name"
          testID="teacher-students-search"
        />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={s.list}
        ListEmptyComponent={
          <EmptyState title="No students found" message="Try a different name." testID="teacher-students-empty" />
        }
        renderItem={({ item }) => (
          <Pressable
            style={s.row}
            onPress={() => router.push({ pathname: "/my-student/[id]", params: { id: item.id } })}
            testID={`teacher-student-${item.id}`}
          >
            <Avatar name={item.name} index={item.avatarIndex} size={40} />
            <View style={s.body}>
              <Text style={s.name}>{item.name}</Text>
              <Text style={s.sub}>Roll {item.rollNo}</Text>
            </View>
            <CaretRight size={16} color={colors.muted} weight="bold" />
          </Pressable>
        )}
      />
    </View>
  );
}
