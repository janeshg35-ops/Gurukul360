import { isActiveTeacher } from "./teachers";
import { periodsPerWeek, requirementFor, SCHEDULE_SLOTS, slotById, WEEK_DAYS } from "./timetable-config";
import { SchoolClass, Section, Subject, Teacher, TimetableEntry, Weekday } from "./types";

export interface TimetableDirectory {
  classes: SchoolClass[];
  sections: Section[];
  subjects: Subject[];
  teachers: Teacher[];
  classById: Map<string, SchoolClass>;
  sectionById: Map<string, Section>;
  subjectById: Map<string, Subject>;
  teacherById: Map<string, Teacher>;
  periodIds: Set<string>;
  days: Set<string>;
}

export function timetableDirectory(input: {
  classes: SchoolClass[];
  sections: Section[];
  subjects: Subject[];
  teachers: Teacher[];
}): TimetableDirectory {
  return {
    ...input,
    classById: new Map(input.classes.map((item) => [item.id, item])),
    sectionById: new Map(input.sections.map((item) => [item.id, item])),
    subjectById: new Map(input.subjects.map((item) => [item.id, item])),
    teacherById: new Map(input.teachers.map((item) => [item.id, item])),
    periodIds: new Set(SCHEDULE_SLOTS.filter((slot) => slot.type === "CLASS" || slot.type === "ACTIVITY").map((slot) => slot.id)),
    days: new Set(WEEK_DAYS),
  };
}

export function sectionSlotId(entry: Pick<TimetableEntry, "sectionId" | "day" | "periodId">): string {
  return `${entry.sectionId}|${entry.day}|${entry.periodId}`;
}

export function teacherSlotId(entry: Pick<TimetableEntry, "teacherId" | "day" | "periodId">): string {
  return `${entry.teacherId}|${entry.day}|${entry.periodId}`;
}

export function roomSlotId(entry: Pick<TimetableEntry, "room" | "day" | "periodId">): string {
  return `${entry.room.trim().toLowerCase()}|${entry.day}|${entry.periodId}`;
}

export function subjectLoadId(entry: Pick<TimetableEntry, "sectionId" | "subjectId">): string {
  return `${entry.sectionId}|${entry.subjectId}`;
}

export function isTeacherEligible(teacher: Teacher, subjectId: string): boolean {
  return teacher.subjectIds.includes(subjectId);
}

export function isTeacherEligibleForClass(teacher: Teacher, classId: string): boolean {
  return Array.isArray(teacher.eligibleClassIds) && teacher.eligibleClassIds.includes(classId);
}

export function findSectionConflict(entries: TimetableEntry[], entry: TimetableEntry): TimetableEntry | undefined {
  const key = sectionSlotId(entry);
  return entries.find((other) => other.id !== entry.id && sectionSlotId(other) === key);
}

export function findTeacherConflict(entries: TimetableEntry[], entry: TimetableEntry): TimetableEntry | undefined {
  const key = teacherSlotId(entry);
  return entries.find((other) => other.id !== entry.id && teacherSlotId(other) === key);
}

export function findRoomConflict(entries: TimetableEntry[], entry: TimetableEntry): TimetableEntry | undefined {
  const room = entry.room.trim();
  if (!room) return undefined;
  const key = roomSlotId(entry);
  return entries.find((other) => other.id !== entry.id && other.room.trim() && roomSlotId(other) === key);
}

export function classSectionText(directory: TimetableDirectory, classId: string, sectionId: string): string {
  const schoolClass = directory.classById.get(classId);
  const section = directory.sectionById.get(sectionId);
  const grade = (schoolClass?.name ?? classId).replace(/^Class\s+/i, "");
  return `Class ${grade}-${section?.name ?? sectionId}`;
}

export function validateTimetableEntry(
  entry: TimetableEntry,
  directory: TimetableDirectory,
  others: TimetableEntry[],
): string | null {
  if (!directory.days.has(entry.day)) return "Day must be Monday to Friday.";
  const slot = slotById(entry.periodId);
  if (!slot) return "Period is not on the school timetable.";
  if (slot.type === "ASSEMBLY" || slot.type === "BREAK") {
    return "Assembly and break are part of the school day and do not take a lesson.";
  }
  if (!directory.periodIds.has(entry.periodId)) return "Period is not on the school timetable.";
  const section = directory.sectionById.get(entry.sectionId);
  if (!section || section.classId !== entry.classId) return "Section does not belong to this class.";
  const subject = directory.subjectById.get(entry.subjectId);
  if (!subject) return "Subject was not found.";
  const expected = requirementFor(entry.subjectId);
  if (expected && expected.slotType !== slot.type) {
    return `${subject.name} for ${classSectionText(directory, entry.classId, entry.sectionId)} is outside its ${expected.slotType === "CLASS" ? "class" : "activity"} periods.`;
  }
  if (!entry.room.trim()) return "Room is required.";
  const teacher = directory.teacherById.get(entry.teacherId);
  const label = classSectionText(directory, entry.classId, entry.sectionId);
  if (!teacher || !isActiveTeacher(teacher)) {
    return `${subject.name} for ${label} could not be scheduled because no eligible ${subject.name} teacher was available in a remaining period.`;
  }
  if (!isTeacherEligible(teacher, entry.subjectId) || !isTeacherEligibleForClass(teacher, entry.classId)) {
    return `${subject.name} for ${label} could not be scheduled because no eligible ${subject.name} teacher was available in a remaining period.`;
  }
  if (findSectionConflict(others, entry)) return `${label} already has a period at this time.`;
  if (findTeacherConflict(others, entry)) return `${teacher.name} is already teaching another section at this time.`;
  if (findRoomConflict(others, entry)) return `${entry.room.trim()} is already in use at this time.`;
  const load = others.filter((other) => other.id !== entry.id && subjectLoadId(other) === subjectLoadId(entry)).length + 1;
  const allowed = periodsPerWeek(entry.subjectId);
  if (load > allowed) return `${subject.name} for ${label} is already scheduled for its weekly periods.`;
  return null;
}

export interface TimetableIssue {
  entryId?: string;
  message: string;
}

export function validateTimetable(entries: TimetableEntry[], directory: TimetableDirectory): TimetableIssue[] {
  const issues: TimetableIssue[] = [];
  const seen = new Set<string>();
  entries.forEach((entry, index) => {
    if (seen.has(entry.id)) issues.push({ entryId: entry.id, message: "Timetable entry id is duplicated." });
    seen.add(entry.id);
    const message = validateTimetableEntry(entry, directory, entries.slice(0, index));
    if (message) issues.push({ entryId: entry.id, message });
  });
  return issues;
}

export function isWeekday(value: string): value is Weekday {
  return WEEK_DAYS.includes(value as Weekday);
}
