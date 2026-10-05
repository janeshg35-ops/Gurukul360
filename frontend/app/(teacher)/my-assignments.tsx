import { useRouter } from "expo-router";
import { Notebook, Plus } from "phosphor-react-native";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { useLiveTeacher } from "@/src/auth/use-live-teacher";
import { AssignmentListCard } from "@/src/components/assignment-views";
import { StackHeader } from "@/src/components/screen-header";
import { SearchBar } from "@/src/components/ui/controls";
import { EmptyState, LoadingView } from "@/src/components/ui/feedback";
import { assignmentsForTeacher } from "@/src/data/assignments";
import { useData } from "@/src/data/store";
import { makeStyles, radius, spacing, useTheme } from "@/src/theme";

const NO_SECTION =
  "You are currently not assigned to a class section. Your existing assigned homework can still be viewed.";

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surfaceSecondary },
  note: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    backgroundColor: c.brandTertiary,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  noteText: { fontSize: 14, lineHeight: 20, fontWeight: "600", color: c.onBrandTertiary },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing["3xl"] },
  add: {
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

export default function MyAssignmentsScreen() {
  const s = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const { db } = useData();
  const { teacher, ready } = useLiveTeacher();
  const [query, setQuery] = useState("");

  if (!ready || !teacher) {
    return (
      <View style={s.root}>
        <LoadingView />
      </View>
    );
  }

  const text = query.trim().toLowerCase();
  const items = assignmentsForTeacher(db, teacher.id, teacher.classTeacherOf).filter(
    (item) => !text || item.title.toLowerCase().includes(text),
  );

  return (
    <View style={s.root} testID="teacher-assignment-list">
      <StackHeader
        title="Homework"
        subtitle={teacher.name}
        right={
          teacher.classTeacherOf ? (
            <Pressable style={s.add} onPress={() => router.push("/my-assignment-form")} testID="teacher-assignment-add">
              <Plus size={14} color="#FFFFFF" weight="bold" />
              <Text style={s.addText}>Add Homework</Text>
            </Pressable>
          ) : null
        }
      />
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md }}>
        <SearchBar value={query} onChangeText={setQuery} placeholder="Search homework" />
      </View>
      {teacher.classTeacherOf ? null : (
        <View style={s.note}>
          <Text style={s.noteText}>{NO_SECTION}</Text>
        </View>
      )}
      {items.length === 0 ? (
        <EmptyState
          icon={<Notebook size={28} color={colors.brandPrimary} weight="duotone" />}
          title="No homework"
          message="Homework for your class or subjects will appear here."
        />
      ) : (
        <ScrollView contentContainerStyle={s.content}>
          {items.map((item) => (
            <AssignmentListCard
              key={item.id}
              item={item}
              onPress={() => router.push({ pathname: "/my-assignment/[id]", params: { id: item.id } })}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}
