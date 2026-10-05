import { Database, Teacher } from "./types";

export interface TeacherFormInput {
  name: string;
  phone: string;
  email: string;
  subjectIds: string[];
  classTeacherOf?: string;
}

export type TeacherRoleFilter = "all" | "class" | "subject";
export type TeacherStatusFilter = "all" | "active" | "inactive";

export function isActiveTeacher(teacher: Teacher): boolean {
  return teacher.status !== "inactive";
}

export function activeTeacherCount(db: Database): number {
  return db.teachers.filter(isActiveTeacher).length;
}

export function getTeacher(db: Database, id: string): Teacher | undefined {
  return db.teachers.find((t) => t.id === id);
}

export function findActiveTeacherByEmail(teachers: Teacher[], email: string): Teacher | undefined {
  const key = email.trim().toLowerCase();
  return teachers.find((t) => isActiveTeacher(t) && t.email.trim().toLowerCase() === key);
}

export function validTeacherEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function validTeacherPhone(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15;
}

export function teacherEmailTaken(db: Database, email: string, exceptId?: string): boolean {
  const key = email.trim().toLowerCase();
  return db.teachers.some((t) => t.id !== exceptId && t.email.trim().toLowerCase() === key);
}

export function activeClassTeacherId(
  db: Database,
  sectionId: string,
  exceptId?: string,
): string | undefined {
  return db.teachers.find(
    (t) => t.id !== exceptId && isActiveTeacher(t) && t.classTeacherOf === sectionId,
  )?.id;
}

export function subjectNames(db: Database, subjectIds: string[]): string[] {
  return subjectIds.map((id) => db.subjects.find((s) => s.id === id)?.name ?? id);
}

export function classTeacherLabel(db: Database, sectionId?: string): string {
  if (!sectionId) return "";
  const section = db.sections.find((s) => s.id === sectionId);
  if (!section) return sectionId;
  const classLabel = db.classes.find((c) => c.id === section.classId)?.name ?? section.classId;
  return `${classLabel} — ${section.name}`;
}

export function filterTeachers(
  db: Database,
  query: string,
  subjectId: string,
  role: TeacherRoleFilter,
  status: TeacherStatusFilter,
): Teacher[] {
  const q = query.trim().toLowerCase();
  return db.teachers
    .filter((t) => (q ? t.name.toLowerCase().includes(q) : true))
    .filter((t) => (subjectId === "all" ? true : t.subjectIds.includes(subjectId)))
    .filter((t) => {
      if (role === "class") return Boolean(t.classTeacherOf);
      if (role === "subject") return !t.classTeacherOf;
      return true;
    })
    .filter((t) => {
      if (status === "active") return isActiveTeacher(t);
      if (status === "inactive") return !isActiveTeacher(t);
      return true;
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

function teacherFromInput(id: string, input: TeacherFormInput, status: Teacher["status"]): Teacher {
  const teacher: Teacher = {
    id,
    name: input.name.trim(),
    phone: input.phone.trim(),
    email: input.email.trim(),
    subjectIds: [...input.subjectIds],
    eligibleClassIds: [],
    status,
  };
  if (input.classTeacherOf) teacher.classTeacherOf = input.classTeacherOf;
  return teacher;
}

export function insertTeacher(db: Database, input: TeacherFormInput, id: string): Database | null {
  if (teacherEmailTaken(db, input.email)) return null;
  if (input.classTeacherOf && activeClassTeacherId(db, input.classTeacherOf)) return null;
  return { ...db, teachers: [...db.teachers, teacherFromInput(id, input, "active")] };
}

export function patchTeacher(db: Database, id: string, input: TeacherFormInput): Database | null {
  const current = db.teachers.find((t) => t.id === id);
  if (!current) return null;
  if (teacherEmailTaken(db, input.email, id)) return null;
  if (input.classTeacherOf && activeClassTeacherId(db, input.classTeacherOf, id)) return null;
  return {
    ...db,
    teachers: db.teachers.map((t) => {
      if (t.id !== id) return t;
      const next: Teacher = {
        ...t,
        name: input.name.trim(),
        phone: input.phone.trim(),
        email: input.email.trim(),
        subjectIds: [...input.subjectIds],
      };
      if (input.classTeacherOf) next.classTeacherOf = input.classTeacherOf;
      else delete next.classTeacherOf;
      return next;
    }),
  };
}

export function markTeacherInactive(db: Database, id: string): Database {
  return {
    ...db,
    teachers: db.teachers.map((t) => (t.id === id ? { ...t, status: "inactive" } : t)),
  };
}

export function markTeacherActive(db: Database, id: string): Database | "conflict" | "missing" {
  const teacher = db.teachers.find((t) => t.id === id);
  if (!teacher) return "missing";
  if (teacher.classTeacherOf && activeClassTeacherId(db, teacher.classTeacherOf, id)) {
    return "conflict";
  }
  return {
    ...db,
    teachers: db.teachers.map((t) => (t.id === id ? { ...t, status: "active" } : t)),
  };
}
