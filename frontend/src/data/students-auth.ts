import { Student } from "./types";

// Seeded admission numbers are MDS/{class}/{serial}, for example MDS/6/1000.
// The login alias joins those three parts: MDS61000.
// The same structural rule applies to any {letters}/{digits}/{digits} admission number.
// Other formats do not produce an alias, so characters are not stripped from arbitrary text.
const ADMISSION_ALIAS = /^([A-Za-z]+)\/(\d+)\/(\d+)$/;

export function admissionLoginAlias(admissionNo: string): string | null {
  const match = admissionNo.trim().match(ADMISSION_ALIAS);
  if (!match) return null;
  return `${match[1]}${match[2]}${match[3]}`.toUpperCase();
}

export function findStudentByLoginAlias(
  students: Student[],
  username: string,
): Student | "ambiguous" | undefined {
  const key = username.trim().toLowerCase();
  if (!key) return undefined;
  const matches = students.filter((student) => {
    const alias = admissionLoginAlias(student.admissionNo);
    return alias !== null && alias.toLowerCase() === key;
  });
  if (matches.length > 1) return "ambiguous";
  return matches[0];
}
