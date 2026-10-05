import {
  classSectionText,
  isTeacherEligible,
  isTeacherEligibleForClass,
  roomSlotId,
  sectionSlotId,
  subjectLoadId,
  teacherSlotId,
  timetableDirectory,
  TimetableDirectory,
  validateTimetable,
  validateTimetableEntry,
} from "./timetable";
import {
  classSlotIndex,
  periodById,
  periodsPerWeek,
  roomsForSubject,
  sectionHomeroom,
  slotsByType,
  SUBJECT_WEEKLY_REQUIREMENTS,
  WEEK_DAYS,
} from "./timetable-config";
import { isActiveTeacher } from "./teachers";
import { SchoolClass, Section, Subject, Teacher, TimetableEntry, Weekday } from "./types";

const MAX_NODES = 80000;

export interface UnscheduledItem {
  classId: string;
  sectionId: string;
  subjectId: string;
  reason: string;
}

export interface TimetableGenerationResult {
  success: boolean;
  entries: TimetableEntry[];
  generatedEntries: TimetableEntry[];
  unscheduledItems: UnscheduledItem[];
  conflicts: string[];
  sectionsProcessed: string[];
}

export interface GenerateTimetableInput {
  classes: SchoolClass[];
  sections: Section[];
  subjects: Subject[];
  teachers: Teacher[];
  sectionIds: string[];
  fixedEntries?: TimetableEntry[];
}

interface Lesson {
  classId: string;
  sectionId: string;
  subjectId: string;
  slotType: "CLASS" | "ACTIVITY";
  sectionOrdinal: number;
  index: number;
  eligibleTeacherIds: string[];
}

interface Candidate {
  day: Weekday;
  dayIndex: number;
  periodId: string;
  periodIndex: number;
  teacherId: string;
  room: string;
  score: number;
}

export function generateTimetable(input: GenerateTimetableInput): TimetableGenerationResult {
  const directory = timetableDirectory(input);
  const requested = [...new Set(input.sectionIds)];
  const sectionsProcessed = requested.filter((id) => directory.sectionById.has(id));
  const missing = requested.filter((id) => !directory.sectionById.has(id));
  const fixed = (input.fixedEntries ?? []).filter((entry) => !sectionsProcessed.includes(entry.sectionId));

  if (missing.length > 0 || sectionsProcessed.length === 0) {
    return {
      success: false,
      entries: [],
      generatedEntries: [],
      unscheduledItems: [],
      conflicts: missing.length
        ? missing.map((id) => `Section ${id} was not found.`)
        : ["Select at least one section."],
      sectionsProcessed,
    };
  }

  const fixedIssues = validateTimetable(fixed, directory);
  if (fixedIssues.length > 0) {
    return {
      success: false,
      entries: [],
      generatedEntries: [],
      unscheduledItems: [],
      conflicts: fixedIssues.map((issue) => issue.message),
      sectionsProcessed,
    };
  }

  const capacity = capacityConflict(directory, sectionsProcessed);
  if (capacity) {
    return {
      success: false,
      entries: [],
      generatedEntries: [],
      unscheduledItems: [],
      conflicts: [capacity],
      sectionsProcessed,
    };
  }

  const lessons = buildLessons(directory, sectionsProcessed);
  const placed: TimetableEntry[] = [...fixed];
  const sectionSlots = new Set(fixed.map(sectionSlotId));
  const teacherSlots = new Set(fixed.map(teacherSlotId));
  const roomSlots = new Set(fixed.map(roomSlotId));
  const subjectLoads = new Map<string, number>();
  const subjectDay = new Map<string, number>();
  const dayLoad = new Map<string, number>();
  const subjectAt = new Map<string, string>();
  const teacherAt = new Map<string, Set<number>>();

  fixed.forEach((entry) => note(entry, 1));

  let nodes = 0;
  let blocked: Lesson | null = null;
  let blockedReason = "";

  const search = (index: number): boolean => {
    if (index >= lessons.length) return true;
    nodes += 1;
    if (nodes > MAX_NODES) return false;
    const lesson = lessons[index];
    const options = candidatesFor(lesson);
    if (options.length === 0) {
      blocked = lesson;
      blockedReason = unavailableReason(directory, lesson);
      return false;
    }
    for (const option of options) {
      const entry = toEntry(lesson, option);
      if (validateTimetableEntry(entry, directory, placed)) continue;
      placed.push(entry);
      note(entry, 1);
      if (search(index + 1)) return true;
      placed.pop();
      note(entry, -1);
    }
    if (!blocked) {
      blocked = lesson;
      blockedReason = unavailableReason(directory, lesson);
    }
    return false;
  };

  const solved = search(0);
  if (!solved || nodes > MAX_NODES) {
    const start = blocked ? Math.max(0, lessons.indexOf(blocked)) : 0;
    return {
      success: false,
      entries: [],
      generatedEntries: [],
      unscheduledItems: (blocked ? lessons.slice(start) : lessons).map((lesson) => ({
        classId: lesson.classId,
        sectionId: lesson.sectionId,
        subjectId: lesson.subjectId,
        reason: lesson === blocked ? blockedReason : "Not placed because the timetable could not be completed without breaking a rule.",
      })),
      conflicts: [
        nodes > MAX_NODES && !solved
          ? "Generation stopped before every period could be placed without breaking a scheduling rule."
          : blockedReason,
      ].filter(Boolean),
      sectionsProcessed,
    };
  }

  repairConsecutives(placed, directory);
  const generatedEntries = placed.filter((entry) => sectionsProcessed.includes(entry.sectionId));
  const issues = validateTimetable(placed, directory);
  if (issues.length > 0) {
    return {
      success: false,
      entries: [],
      generatedEntries: [],
      unscheduledItems: [],
      conflicts: issues.map((issue) => issue.message),
      sectionsProcessed,
    };
  }

  const under = unmetRequirements(directory, sectionsProcessed, placed);
  if (under.length > 0) {
    return {
      success: false,
      entries: [],
      generatedEntries: [],
      unscheduledItems: under,
      conflicts: under.map((item) => item.reason),
      sectionsProcessed,
    };
  }

  return {
    success: true,
    entries: sortEntries(placed),
    generatedEntries: sortEntries(generatedEntries),
    unscheduledItems: [],
    conflicts: [],
    sectionsProcessed,
  };

  function note(entry: TimetableEntry, direction: 1 | -1) {
    const sectionKey = sectionSlotId(entry);
    const teacherKey = teacherSlotId(entry);
    const roomKey = roomSlotId(entry);
    const loadKey = subjectLoadId(entry);
    const dayKey = `${entry.sectionId}|${entry.subjectId}|${entry.day}`;
    const loadDayKey = `${entry.sectionId}|${entry.day}`;
    const periodIndex = softIndex(entry.periodId);
    if (direction === 1) {
      sectionSlots.add(sectionKey);
      teacherSlots.add(teacherKey);
      roomSlots.add(roomKey);
      subjectLoads.set(loadKey, (subjectLoads.get(loadKey) ?? 0) + 1);
      subjectDay.set(dayKey, (subjectDay.get(dayKey) ?? 0) + 1);
      dayLoad.set(loadDayKey, (dayLoad.get(loadDayKey) ?? 0) + 1);
      if (periodIndex >= 0) subjectAt.set(`${entry.sectionId}|${entry.day}|${periodIndex}`, entry.subjectId);
      const taught = teacherAt.get(`${entry.teacherId}|${entry.day}`) ?? new Set<number>();
      if (periodIndex >= 0) taught.add(periodIndex);
      teacherAt.set(`${entry.teacherId}|${entry.day}`, taught);
    } else {
      sectionSlots.delete(sectionKey);
      teacherSlots.delete(teacherKey);
      roomSlots.delete(roomKey);
      subjectLoads.set(loadKey, (subjectLoads.get(loadKey) ?? 1) - 1);
      subjectDay.set(dayKey, (subjectDay.get(dayKey) ?? 1) - 1);
      dayLoad.set(loadDayKey, (dayLoad.get(loadDayKey) ?? 1) - 1);
      if (periodIndex >= 0) subjectAt.delete(`${entry.sectionId}|${entry.day}|${periodIndex}`);
      teacherAt.get(`${entry.teacherId}|${entry.day}`)?.delete(periodIndex);
    }
  }

  function candidatesFor(lesson: Lesson): Candidate[] {
    const schoolClass = directory.classById.get(lesson.classId);
    const section = directory.sectionById.get(lesson.sectionId);
    const home = sectionHomeroom(schoolClass, section);
    const rooms = roomsForSubject(lesson.subjectId, home);
    const preferred = rooms[0];
    const options: Candidate[] = [];
    const periods = slotsByType(lesson.slotType);
    WEEK_DAYS.forEach((day, dayIndex) => {
      periods.forEach((period, periodIndex) => {
        const storedIndex = lesson.slotType === "CLASS" ? periodIndex : 100 + periodIndex;
        const slot = { sectionId: lesson.sectionId, day, periodId: period.id };
        if (sectionSlots.has(sectionSlotId(slot))) return;
        lesson.eligibleTeacherIds.forEach((teacherId) => {
          const teacherSlot = { teacherId, day, periodId: period.id };
          if (teacherSlots.has(teacherSlotId(teacherSlot))) return;
          const teacher = directory.teacherById.get(teacherId);
          if (!teacher) return;
          rooms.forEach((room) => {
            const roomSlot = { room, day, periodId: period.id };
            if (roomSlots.has(roomSlotId(roomSlot))) return;
            options.push({
              day,
              dayIndex,
              periodId: period.id,
              periodIndex: storedIndex,
              teacherId,
              room,
              score: scoreCandidate(lesson, day, dayIndex, storedIndex, teacher, room, preferred),
            });
          });
        });
      });
    });
    options.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.dayIndex !== b.dayIndex) return a.dayIndex - b.dayIndex;
      if (a.periodIndex !== b.periodIndex) return a.periodIndex - b.periodIndex;
      if (a.teacherId !== b.teacherId) return a.teacherId < b.teacherId ? -1 : 1;
      return a.room < b.room ? -1 : 1;
    });
    return options;
  }

  function scoreCandidate(
    lesson: Lesson,
    day: Weekday,
    dayIndex: number,
    periodIndex: number,
    teacher: Teacher,
    room: string,
    preferred: string | undefined,
  ): number {
    let score = (6 - teacher.subjectIds.length) * 200;
    const alreadyToday = subjectDay.get(`${lesson.sectionId}|${lesson.subjectId}|${day}`) ?? 0;
    if (alreadyToday === 0) score += 80;
    else score -= 250 * alreadyToday;
    const prev = subjectAt.get(`${lesson.sectionId}|${day}|${periodIndex - 1}`);
    const next = subjectAt.get(`${lesson.sectionId}|${day}|${periodIndex + 1}`);
    if (prev === lesson.subjectId || next === lesson.subjectId) score -= 900;
    const taught = teacherAt.get(`${teacher.id}|${day}`);
    if (taught?.has(periodIndex - 1) || taught?.has(periodIndex + 1)) score -= 40;
    if (consecutiveTeacherRun(taught, periodIndex) >= 4) score -= 80;
    if (preferred && room === preferred) score += 30;
    if (lesson.slotType === "CLASS" && periodIndex < 50 && lesson.subjectId === patternSubject(lesson.sectionOrdinal, dayIndex, periodIndex)) {
      score += 1600;
    }
    score -= (dayLoad.get(`${lesson.sectionId}|${day}`) ?? 0) * 4;
    score -= dayIndex;
    if (teacher.classTeacherOf === lesson.sectionId) score += 8;
    return score;
  }
}

function patternSubject(sectionOrdinal: number, dayIndex: number, periodIndex: number): string {
  const academic = ["sub-eng", "sub-math", "sub-sci", "sub-ss", "sub-cs"];
  const start = (dayIndex + sectionOrdinal) % academic.length;
  if (periodIndex === 5) return academic[start];
  return academic[(start + periodIndex) % academic.length];
}

function consecutiveTeacherRun(taught: Set<number> | undefined, periodIndex: number): number {
  if (!taught) return 1;
  let run = 1;
  let cursor = periodIndex - 1;
  while (taught.has(cursor)) {
    run += 1;
    cursor -= 1;
  }
  cursor = periodIndex + 1;
  while (taught.has(cursor)) {
    run += 1;
    cursor += 1;
  }
  return run;
}

function softIndex(periodId: string): number {
  const classIndex = classSlotIndex(periodId);
  if (classIndex >= 0) return classIndex;
  const activityIndex = slotsByType("ACTIVITY").findIndex((slot) => slot.id === periodId);
  if (activityIndex >= 0) return 100 + activityIndex;
  return -1;
}

function capacityConflict(directory: TimetableDirectory, sectionIds: string[]): string | null {
  const classWindows = WEEK_DAYS.length * slotsByType("CLASS").length;
  const classNeed = SUBJECT_WEEKLY_REQUIREMENTS.filter((item) => item.slotType === "CLASS").reduce((sum, item) => sum + item.periodsPerWeek, 0);
  if (classNeed > classWindows) {
    return `Academic lessons need ${classNeed} periods in each section, and the week has ${classWindows} class periods.`;
  }
  for (const requirement of SUBJECT_WEEKLY_REQUIREMENTS.filter((item) => item.slotType === "ACTIVITY")) {
    const demand = sectionIds.length * requirement.periodsPerWeek;
    const windows = WEEK_DAYS.length * slotsByType("ACTIVITY").length;
    const teacherIds = new Set<string>();
    sectionIds.forEach((sectionId) => {
      const section = directory.sectionById.get(sectionId);
      if (!section) return;
      directory.teachers.forEach((teacher) => {
        if (
          isActiveTeacher(teacher) &&
          isTeacherEligible(teacher, requirement.subjectId) &&
          isTeacherEligibleForClass(teacher, section.classId)
        ) {
          teacherIds.add(teacher.id);
        }
      });
    });
    const rooms = roomsForSubject(requirement.subjectId, "").length;
    const supply = windows * Math.min(teacherIds.size, rooms);
    if (demand > supply) {
      const name = directory.subjectById.get(requirement.subjectId)?.name ?? "Activity";
      return `${name} needs ${demand} sessions, and the activity periods can staff ${supply}.`;
    }
  }
  return null;
}

function countConsecutiveSubjects(entries: TimetableEntry[]): number {
  let count = 0;
  const bySectionDay = new Map<string, TimetableEntry[]>();
  entries.forEach((entry) => {
    if (classSlotIndex(entry.periodId) < 0) return;
    const key = `${entry.sectionId}|${entry.day}`;
    const list = bySectionDay.get(key) ?? [];
    list.push(entry);
    bySectionDay.set(key, list);
  });
  bySectionDay.forEach((list) => {
    const ordered = [...list].sort((a, b) => classSlotIndex(a.periodId) - classSlotIndex(b.periodId));
    for (let index = 1; index < ordered.length; index += 1) {
      if (classSlotIndex(ordered[index].periodId) === classSlotIndex(ordered[index - 1].periodId) + 1 && ordered[index].subjectId === ordered[index - 1].subjectId) {
        count += 1;
      }
    }
  });
  return count;
}

function swapEntrySlots(entries: TimetableEntry[], left: TimetableEntry, right: TimetableEntry): TimetableEntry[] {
  const retarget = (entry: TimetableEntry, source: TimetableEntry): TimetableEntry => ({
    ...entry,
    day: source.day,
    periodId: source.periodId,
    id: `tt-${entry.sectionId}-${source.day}-${source.periodId}`,
  });
  return entries.map((entry) => {
    if (entry.id === left.id) return retarget(entry, right);
    if (entry.id === right.id) return retarget(entry, left);
    return entry;
  });
}

function repairConsecutives(entries: TimetableEntry[], directory: TimetableDirectory) {
  let count = countConsecutiveSubjects(entries);
  for (let pass = 0; pass < 20 && count > 0; pass += 1) {
    let improved = false;
    const snapshot = [...entries];
    for (const entry of snapshot) {
      if (classSlotIndex(entry.periodId) < 0) continue;
      const neighbor = snapshot.find(
        (other) =>
          other.sectionId === entry.sectionId &&
          other.day === entry.day &&
          classSlotIndex(other.periodId) === classSlotIndex(entry.periodId) + 1 &&
          other.subjectId === entry.subjectId,
      );
      if (!neighbor) continue;
      const alternatives = snapshot.filter(
        (other) => other.sectionId === entry.sectionId && other.subjectId !== entry.subjectId && classSlotIndex(other.periodId) >= 0,
      );
      for (const other of alternatives) {
        const next = swapEntrySlots(entries, neighbor, other);
        if (validateTimetable(next, directory).length > 0) continue;
        const nextCount = countConsecutiveSubjects(next);
        if (nextCount < count) {
          entries.splice(0, entries.length, ...next);
          count = nextCount;
          improved = true;
          break;
        }
      }
      if (improved) break;
    }
    if (!improved) break;
  }
}

function buildLessons(directory: TimetableDirectory, sectionIds: string[]): Lesson[] {
  const lessons: Lesson[] = [];
  sectionIds.forEach((sectionId, sectionOrdinal) => {
    const section = directory.sectionById.get(sectionId);
    if (!section) return;
    SUBJECT_WEEKLY_REQUIREMENTS.forEach((requirement) => {
      const eligibleTeacherIds = directory.teachers
        .filter(
          (teacher) =>
            isActiveTeacher(teacher) &&
            isTeacherEligible(teacher, requirement.subjectId) &&
            isTeacherEligibleForClass(teacher, section.classId),
        )
        .map((teacher) => teacher.id)
        .sort();
      for (let index = 0; index < requirement.periodsPerWeek; index += 1) {
        lessons.push({
          classId: section.classId,
          sectionId,
          subjectId: requirement.subjectId,
          slotType: requirement.slotType,
          sectionOrdinal,
          index,
          eligibleTeacherIds,
        });
      }
    });
  });
  return lessons.sort((a, b) => {
    if (a.eligibleTeacherIds.length !== b.eligibleTeacherIds.length) {
      return a.eligibleTeacherIds.length - b.eligibleTeacherIds.length;
    }
    if (a.sectionId !== b.sectionId) return a.sectionId < b.sectionId ? -1 : 1;
    if (a.subjectId !== b.subjectId) return a.subjectId < b.subjectId ? -1 : 1;
    return a.index - b.index;
  });
}

function toEntry(lesson: Lesson, option: Candidate): TimetableEntry {
  return {
    id: `tt-${lesson.sectionId}-${option.day}-${option.periodId}`,
    day: option.day,
    periodId: option.periodId,
    classId: lesson.classId,
    sectionId: lesson.sectionId,
    subjectId: lesson.subjectId,
    teacherId: option.teacherId,
    room: option.room,
  };
}

function unavailableReason(directory: TimetableDirectory, lesson: Lesson): string {
  const subject = directory.subjectById.get(lesson.subjectId)?.name ?? "Subject";
  const label = classSectionText(directory, lesson.classId, lesson.sectionId);
  return `${subject} for ${label} could not be scheduled because no eligible ${subject} teacher was available in a remaining period.`;
}

function unmetRequirements(
  directory: TimetableDirectory,
  sectionIds: string[],
  entries: TimetableEntry[],
): UnscheduledItem[] {
  const items: UnscheduledItem[] = [];
  sectionIds.forEach((sectionId) => {
    const section = directory.sectionById.get(sectionId);
    if (!section) return;
    SUBJECT_WEEKLY_REQUIREMENTS.forEach((requirement) => {
      const count = entries.filter((entry) => entry.sectionId === sectionId && entry.subjectId === requirement.subjectId).length;
      const needed = periodsPerWeek(requirement.subjectId);
      for (let extra = count; extra < needed; extra += 1) {
        items.push({
          classId: section.classId,
          sectionId,
          subjectId: requirement.subjectId,
          reason: unavailableReason(directory, {
            classId: section.classId,
            sectionId,
            subjectId: requirement.subjectId,
            index: extra,
            slotType: requirement.slotType,
            sectionOrdinal: 0,
            eligibleTeacherIds: [],
          }),
        });
      }
    });
  });
  return items;
}

function sortEntries(entries: TimetableEntry[]): TimetableEntry[] {
  const dayOrder = new Map(WEEK_DAYS.map((day, index) => [day, index]));
  return [...entries].sort((a, b) => {
    if (a.sectionId !== b.sectionId) return a.sectionId < b.sectionId ? -1 : 1;
    const day = (dayOrder.get(a.day) ?? 0) - (dayOrder.get(b.day) ?? 0);
    if (day !== 0) return day;
    return (periodById(a.periodId)?.order ?? 0) - (periodById(b.periodId)?.order ?? 0);
  });
}
