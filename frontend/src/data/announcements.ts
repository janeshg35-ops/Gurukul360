export type CommunicationRole = "Teacher" | "Student";

function audienceWords(audience: string): string[] {
  return audience
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);
}

// Principal always sees every record. Teacher and Student see All, plus the
// group named for them. Older seed phrases are read the same way: "staff" and
// "stakeholders" include teachers, "guardians" and "classes" include students.
export function announcementVisibleTo(audience: string, role: CommunicationRole): boolean {
  const words = new Set(audienceWords(audience));
  if (words.size === 0 || (words.size === 1 && words.has("all"))) return true;

  const forTeachers =
    words.has("teacher") ||
    words.has("teachers") ||
    words.has("staff") ||
    words.has("stakeholder") ||
    words.has("stakeholders");
  const forStudents =
    words.has("student") ||
    words.has("students") ||
    words.has("guardian") ||
    words.has("guardians") ||
    words.has("class") ||
    words.has("classes") ||
    words.has("stakeholder") ||
    words.has("stakeholders");

  if (!forTeachers && !forStudents && words.has("all")) return true;
  return role === "Teacher" ? forTeachers : forStudents;
}
