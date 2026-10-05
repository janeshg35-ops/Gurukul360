import dayjs from "dayjs";

import { isActiveTeacher } from "./teachers";
import { Assignment, Database } from "./types";

export interface AssignmentInput {
  title: string;
  instructions: string;
  classId: string;
  sectionId: string;
  subjectId: string;
  teacherId: string;
  assignedDate: string;
  dueDate: string;
}

export type AssignmentStatus = "Overdue" | "Due Soon" | "Pending";

export function assignmentStatus(dueDate: string, today = dayjs().format("YYYY-MM-DD")): AssignmentStatus {
  const soon = dayjs(today).add(2, "day").format("YYYY-MM-DD");
  if (dueDate < today) return "Overdue";
  if (dueDate <= soon) return "Due Soon";
  return "Pending";
}

/** Accepts YYYY-MM-DD or DD/MM/YYYY. Returns YYYY-MM-DD, or null. */
export function parseAssignmentDate(value: string): string | null {
  const text = value.trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  const dmy = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text);
  if (!iso && !dmy) return null;
  const year = Number(iso ? iso[1] : dmy![3]);
  const month = Number(iso ? iso[2] : dmy![2]);
  const day = Number(iso ? iso[3] : dmy![1]);
  const parsed = dayjs(`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
  if (!parsed.isValid() || parsed.year() !== year || parsed.month() + 1 !== month || parsed.date() !== day) {
    return null;
  }
  return parsed.format("YYYY-MM-DD");
}

export function displayAssignmentDate(iso: string): string {
  const parsed = dayjs(iso);
  return parsed.isValid() ? parsed.format("DD/MM/YYYY") : iso;
}

export function validateAssignment(db: Database, input: AssignmentInput): string | null {
  if (!input.title.trim()) return "Title is required.";
  if (!input.instructions.trim()) return "Instructions are required.";
  if (!input.classId || !db.classes.some((item) => item.id === input.classId)) return "Class is required.";
  if (!input.sectionId) return "Section is required.";
  const section = db.sections.find((item) => item.id === input.sectionId);
  if (!section || section.classId !== input.classId) return "Selected section must belong to the selected class.";
  if (!input.subjectId || !db.subjects.some((item) => item.id === input.subjectId)) return "Subject is required.";
  if (!input.teacherId) return "Teacher is required.";
  const teacher = db.teachers.find((item) => item.id === input.teacherId);
  if (!teacher || !isActiveTeacher(teacher)) return "Select an active teacher.";
  if (!teacher.subjectIds.includes(input.subjectId)) return "Selected teacher must teach the selected subject.";
  const assigned = parseAssignmentDate(input.assignedDate);
  const due = parseAssignmentDate(input.dueDate);
  if (!assigned) return "Assigned date is required.";
  if (!due) return "Due date is required.";
  if (due < assigned) return "Due date cannot be before the assigned date.";
  return null;
}

export function sortAssignments(items: Assignment[]): Assignment[] {
  return [...items].sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.title.localeCompare(b.title));
}

export function assignmentsForTeacher(db: Database, teacherId: string, sectionId?: string): Assignment[] {
  return sortAssignments(
    db.assignments.filter((item) => item.teacherId === teacherId || (!!sectionId && item.sectionId === sectionId)),
  );
}

export function assignmentsForSection(db: Database, sectionId: string): Assignment[] {
  return sortAssignments(db.assignments.filter((item) => item.sectionId === sectionId));
}

export function assignmentFromInput(id: string, input: AssignmentInput): Assignment {
  return {
    id,
    title: input.title.trim(),
    instructions: input.instructions.trim(),
    classId: input.classId,
    sectionId: input.sectionId,
    subjectId: input.subjectId,
    teacherId: input.teacherId,
    assignedDate: parseAssignmentDate(input.assignedDate) ?? input.assignedDate,
    dueDate: parseAssignmentDate(input.dueDate) ?? input.dueDate,
  };
}
