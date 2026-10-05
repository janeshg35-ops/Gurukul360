import { PRINCIPAL, PRINCIPAL_CREDENTIALS, STUDENT_DEMO_PASSWORD, TEACHER_DEMO_PASSWORD } from "@/src/constants/branding";
import { findStudentByLoginAlias } from "@/src/data/students-auth";
import { findActiveTeacherByEmail, isActiveTeacher } from "@/src/data/teachers";
import { Student, Teacher } from "@/src/data/types";

export interface SessionUser {
  name: string;
  role: string;
  email: string;
  teacherId?: string;
  studentId?: string;
}

export type SignInResult =
  | { ok: true; role: "Principal" | "Teacher" | "Student"; session: SessionUser }
  | { ok: false; error: string };

const INVALID = "Invalid credentials. Please try again.";

export function authenticate(
  username: string,
  password: string,
  teachers: Teacher[],
  students: Student[] = [],
): SignInResult {
  const u = username.trim().toLowerCase();
  const p = password;
  if (!u || !p) {
    return { ok: false, error: "Please enter both username and password." };
  }
  if (
    u === PRINCIPAL_CREDENTIALS.username.toLowerCase() &&
    p === PRINCIPAL_CREDENTIALS.password
  ) {
    return {
      ok: true,
      role: "Principal",
      session: {
        name: PRINCIPAL.name,
        role: PRINCIPAL.role,
        email: PRINCIPAL.email,
      },
    };
  }
  const teacher = findActiveTeacherByEmail(teachers, u);
  if (teacher && p === TEACHER_DEMO_PASSWORD) {
    return {
      ok: true,
      role: "Teacher",
      session: {
        name: teacher.name,
        role: "Teacher",
        email: teacher.email,
        teacherId: teacher.id,
      },
    };
  }
  const student = findStudentByLoginAlias(students, u);
  if (student && student !== "ambiguous" && student.status === "active" && p === STUDENT_DEMO_PASSWORD) {
    return {
      ok: true,
      role: "Student",
      session: {
        name: student.name,
        role: "Student",
        email: student.email,
        studentId: student.id,
      },
    };
  }
  return { ok: false, error: INVALID };
}

export function isLiveTeacherSession(user: SessionUser, teachers: Teacher[]): boolean {
  if (user.role !== "Teacher" || !user.teacherId) return false;
  const teacher = teachers.find((t) => t.id === user.teacherId);
  return !!teacher && isActiveTeacher(teacher);
}

export function isLiveStudentSession(user: SessionUser, students: Student[]): boolean {
  if (user.role !== "Student" || !user.studentId) return false;
  const student = students.find((item) => item.id === user.studentId);
  return !!student && student.status === "active";
}

const TEACHER_AREA = new Set([
  "(teacher)",
  "my-students",
  "my-student",
  "my-attendance",
  "my-class",
  "my-subjects",
  "my-assignments",
  "my-assignment",
  "my-assignment-form",
  "teacher-announcements",
  "teacher-announcement",
  "my-timetable",
  "account",
]);

const STUDENT_AREA = new Set([
  "(student)",
  "student-profile",
  "student-attendance",
  "student-results",
  "student-fees",
  "student-fee-payment",
  "student-fee-receipt",
  "student-assignments",
  "student-assignment",
  "student-announcements",
  "student-announcement",
  "student-timetable",
  "student-account",
]);

export type AppHome = "/login" | "/(tabs)" | "/(teacher)" | "/(student)";

// Returns a route when the current screen is outside the signed-in role. Null means stay.
export function nextRoute(user: SessionUser | null, topSegment: string | undefined): AppHome | null {
  if (!topSegment) return null;
  const teacherArea = TEACHER_AREA.has(topSegment);
  const studentArea = STUDENT_AREA.has(topSegment);
  if (!user) {
    if (topSegment === "login" || topSegment === "index") return null;
    return "/login";
  }
  if (user.role === "Teacher") {
    return teacherArea ? null : "/(teacher)";
  }
  if (user.role === "Student") {
    return studentArea ? null : "/(student)";
  }
  return teacherArea || studentArea ? "/(tabs)" : null;
}
