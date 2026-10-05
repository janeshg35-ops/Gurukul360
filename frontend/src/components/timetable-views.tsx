import { Text, View } from "react-native";

import { Card } from "@/src/components/ui/primitives";
import { className, sectionName } from "@/src/data/compute";
import { schoolSchedule, WEEK_DAYS } from "@/src/data/timetable-config";
import { Database, ScheduleSlot, TimetableEntry } from "@/src/data/types";
import { makeStyles, spacing } from "@/src/theme";

const useStyles = makeStyles((c) => ({
  day: { fontSize: 13, fontWeight: "800", color: c.brandPrimary, textTransform: "uppercase", letterSpacing: 0.4 },
  time: { fontSize: 12, fontWeight: "700", color: c.onSurfaceSecondary },
  subject: { fontSize: 16, fontWeight: "800", color: c.onSurface },
  quiet: { fontSize: 16, fontWeight: "800", color: c.onSurfaceSecondary },
  meta: { fontSize: 13, fontWeight: "600", color: c.onSurfaceSecondary },
  group: { gap: spacing.sm },
  list: { gap: spacing.md },
}));

const DAY_SHORT: Record<string, string> = {
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thu",
  Friday: "Fri",
};

export function weekdayLabel(day: string): string {
  return DAY_SHORT[day] ?? day.slice(0, 3);
}

function teacherName(db: Database, teacherId: string): string {
  return db.teachers.find((teacher) => teacher.id === teacherId)?.name ?? "Teacher";
}

function subjectName(db: Database, subjectId: string): string {
  return db.subjects.find((subject) => subject.id === subjectId)?.name ?? "Subject";
}

export function TimetablePeriodList({
  entries,
  db,
  day,
  mode,
  showTeacher,
  showClass,
}: {
  entries: TimetableEntry[];
  db: Database;
  day?: string;
  mode: "section" | "teacher";
  showTeacher: boolean;
  showClass: boolean;
}) {
  const s = useStyles();
  const slots = schoolSchedule(db.scheduleSlots);
  const days = day ? WEEK_DAYS.filter((item) => item === day) : WEEK_DAYS;

  return (
    <View style={s.list}>
      {days.map((item) => (
        <View key={item} style={s.group}>
          {day ? null : <Text style={s.day}>{item}</Text>}
          {slots.map((slot) => {
            const row = rowFor(slot, item);
            if (!row) return null;
            return (
              <Card key={`${item}-${slot.id}`} testID={`timetable-${item}-${slot.id}`}>
                <View style={{ gap: 4 }}>
                  <Text style={s.time}>{row.time}</Text>
                  <Text style={row.quiet ? s.quiet : s.subject}>{row.title}</Text>
                  {row.meta ? <Text style={s.meta}>{row.meta}</Text> : null}
                </View>
              </Card>
            );
          })}
        </View>
      ))}
    </View>
  );

  function rowFor(slot: ScheduleSlot, dayName: string): { time: string; title: string; meta: string; quiet: boolean } | null {
    const time = `${slot.start}–${slot.end}`;
    const lesson = entries.find((entry) => entry.day === dayName && entry.periodId === slot.id);
    if (slot.type === "ASSEMBLY" || slot.type === "BREAK") {
      return { time, title: slot.label, meta: "", quiet: true };
    }
    if (mode === "teacher" && !lesson) return null;
    if (!lesson) {
      return {
        time,
        title: slot.type === "ACTIVITY" ? slot.label : "Free",
        meta: "",
        quiet: true,
      };
    }
    const details = [
      showTeacher ? teacherName(db, lesson.teacherId) : "",
      showClass ? `${className(db, lesson.classId)}-${sectionName(db, lesson.sectionId)}` : "",
      lesson.room,
    ].filter(Boolean);
    return { time, title: subjectName(db, lesson.subjectId), meta: details.join(" · "), quiet: false };
  }
}
