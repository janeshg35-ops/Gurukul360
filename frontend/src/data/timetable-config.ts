import { ScheduleSlot, ScheduleSlotType, SchoolClass, Section, Weekday } from "./types";

export const WEEK_DAYS: Weekday[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

/** One shared school day. Lesson rows keep these ids in `periodId`. */
export const SCHEDULE_SLOTS: ScheduleSlot[] = [
  { id: "assembly", order: 1, label: "Morning Assembly", start: "08:00", end: "08:20", type: "ASSEMBLY" },
  { id: "p1", order: 2, label: "Period 1", start: "08:20", end: "09:05", type: "CLASS" },
  { id: "p2", order: 3, label: "Period 2", start: "09:05", end: "09:50", type: "CLASS" },
  { id: "p3", order: 4, label: "Period 3", start: "09:50", end: "10:35", type: "CLASS" },
  { id: "recess", order: 5, label: "Recess", start: "10:35", end: "10:50", type: "BREAK" },
  { id: "p4", order: 6, label: "Period 4", start: "10:50", end: "11:35", type: "CLASS" },
  { id: "p5", order: 7, label: "Period 5", start: "11:35", end: "12:20", type: "CLASS" },
  { id: "p6", order: 8, label: "Period 6", start: "12:20", end: "13:05", type: "CLASS" },
  { id: "activity", order: 9, label: "Activity", start: "13:05", end: "13:45", type: "ACTIVITY" },
];

export interface SubjectWeeklyRequirement {
  subjectId: string;
  periodsPerWeek: number;
  slotType: "CLASS" | "ACTIVITY";
}

/** Class periods are filled by the five academic subjects. PE uses the activity slot. */
export const SUBJECT_WEEKLY_REQUIREMENTS: SubjectWeeklyRequirement[] = [
  { subjectId: "sub-eng", periodsPerWeek: 6, slotType: "CLASS" },
  { subjectId: "sub-math", periodsPerWeek: 6, slotType: "CLASS" },
  { subjectId: "sub-sci", periodsPerWeek: 6, slotType: "CLASS" },
  { subjectId: "sub-ss", periodsPerWeek: 6, slotType: "CLASS" },
  { subjectId: "sub-cs", periodsPerWeek: 6, slotType: "CLASS" },
  { subjectId: "sub-pe", periodsPerWeek: 1, slotType: "ACTIVITY" },
];

/** Preferred specialist rooms. Other subjects use the section homeroom. */
export const SUBJECT_ROOMS: Record<string, string> = {
  "sub-sci": "Science Lab",
  "sub-cs": "Computer Lab",
};

export const PE_ROOMS = ["Sports Ground", "Playground"] as const;

export const TEACHER_CLASS_ELIGIBILITY: Record<string, readonly string[]> = {
  t1: ["c9", "c10"],
  t2: ["c9", "c10"],
  t3: ["c9", "c10"],
  t4: ["c9", "c10"],
  t5: ["c6", "c7", "c8"],
  t6: ["c7", "c8"],
  t7: ["c7", "c8"],
  t8: ["c7", "c8"],
  t9: ["c6", "c7", "c8"],
  t10: ["c6", "c7", "c8"],
  t11: ["c6", "c7", "c8"],
  t12: ["c9", "c10"],
  t13: ["c6", "c7", "c8"],
  t14: ["c9", "c10"],
  t15: ["c6", "c7", "c8", "c9", "c10"],
  t16: ["c6", "c7", "c8", "c9", "c10"],
};

export function eligibilityForTeacher(teacherId: string): string[] {
  const classes = TEACHER_CLASS_ELIGIBILITY[teacherId];
  return classes ? [...classes] : [];
}

export function periodsPerWeek(subjectId: string): number {
  return SUBJECT_WEEKLY_REQUIREMENTS.find((item) => item.subjectId === subjectId)?.periodsPerWeek ?? 0;
}

export function requirementFor(subjectId: string): SubjectWeeklyRequirement | undefined {
  return SUBJECT_WEEKLY_REQUIREMENTS.find((item) => item.subjectId === subjectId);
}

export function slotsByType(type: ScheduleSlotType): ScheduleSlot[] {
  return SCHEDULE_SLOTS.filter((slot) => slot.type === type);
}

export function slotById(periodId: string): ScheduleSlot | undefined {
  return SCHEDULE_SLOTS.find((slot) => slot.id === periodId);
}

export function periodById(periodId: string): ScheduleSlot | undefined {
  return slotById(periodId);
}

export function classSlotIndex(periodId: string): number {
  return slotsByType("CLASS").findIndex((slot) => slot.id === periodId);
}

export function roomsForSubject(subjectId: string, homeroom: string): string[] {
  if (subjectId === "sub-pe") return [...PE_ROOMS];
  const preferred = SUBJECT_ROOMS[subjectId];
  if (preferred && preferred !== homeroom) return [preferred, homeroom];
  return [homeroom];
}

export function sectionHomeroom(schoolClass: SchoolClass | undefined, section: Section | undefined): string {
  const grade = (schoolClass?.name ?? schoolClass?.id ?? "Class").replace(/^Class\s+/i, "");
  const name = section?.name ?? section?.id ?? "";
  return `Room ${grade}-${name}`;
}

export function schoolSchedule(slots: ScheduleSlot[] | undefined): ScheduleSlot[] {
  if (Array.isArray(slots) && slots.length > 0) return [...slots].sort((a, b) => a.order - b.order);
  return SCHEDULE_SLOTS;
}
