import { PRINCIPAL, PRINCIPAL_CREDENTIALS, TEACHER_DEMO_PASSWORD } from "@/src/constants/branding";
import { findActiveTeacherByEmail, isActiveTeacher } from "@/src/data/teachers";
import { Teacher } from "@/src/data/types";

export interface SessionUser {
  name: string;
  role: string;
  email: string;
  teacherId?: string;
}

export type SignInResult =
  | { ok: true; role: "Principal" | "Teacher"; session: SessionUser }
  | { ok: false; error: string };

const INVALID = "Invalid credentials. Please try again.";

export function authenticate(username: string, password: string, teachers: Teacher[]): SignInResult {
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
  return { ok: false, error: INVALID };
}

export function isLiveTeacherSession(user: SessionUser, teachers: Teacher[]): boolean {
  if (user.role !== "Teacher" || !user.teacherId) return false;
  const teacher = teachers.find((t) => t.id === user.teacherId);
  return !!teacher && isActiveTeacher(teacher);
}

const TEACHER_AREA = new Set([
  "(teacher)",
  "my-students",
  "my-student",
  "my-attendance",
  "my-class",
  "my-subjects",
  "account",
]);

export type AppHome = "/login" | "/(tabs)" | "/(teacher)";

// Returns a route when the current screen is outside the signed-in role. Null means stay.
export function nextRoute(user: SessionUser | null, topSegment: string | undefined): AppHome | null {
  if (!topSegment) return null;
  const teacherArea = TEACHER_AREA.has(topSegment);
  if (!user) {
    if (topSegment === "login" || topSegment === "index") return null;
    return "/login";
  }
  if (user.role === "Teacher") {
    return teacherArea ? null : "/(teacher)";
  }
  return teacherArea ? "/(tabs)" : null;
}
