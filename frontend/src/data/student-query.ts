import type { Section, Student } from "./types";

export const STUDENT_PAGE_SIZE = 25;

export type StudentListStatus = "all" | "active" | "inactive";

export function filterStudentList(
  students: Student[],
  sections: Pick<Section, "id" | "name">[],
  query: string,
  classId: string,
  sectionLabel: string,
  status: StudentListStatus,
): Student[] {
  const q = query.trim().toLowerCase();
  const sectionNameById = new Map(sections.map((section) => [section.id, section.name]));
  return students
    .filter((student) => {
      if (!q) return true;
      return (
        student.name.toLowerCase().includes(q) ||
        student.admissionNo.toLowerCase().includes(q) ||
        student.phone.toLowerCase().includes(q)
      );
    })
    .filter((student) => (classId === "all" ? true : student.classId === classId))
    .filter((student) =>
      sectionLabel === "all" ? true : sectionNameById.get(student.sectionId) === sectionLabel,
    )
    .filter((student) => (status === "all" ? true : student.status === status))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function paginateStudents<T>(items: T[], page: number, pageSize = STUDENT_PAGE_SIZE) {
  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const current = total === 0 ? 1 : Math.min(Math.max(page, 1), pages);
  const startIndex = (current - 1) * pageSize;
  const slice = items.slice(startIndex, startIndex + pageSize);
  return {
    total,
    pages,
    current,
    start: total === 0 ? 0 : startIndex + 1,
    end: total === 0 ? 0 : startIndex + slice.length,
    slice,
  };
}

export function pageWindow(current: number, pages: number): Array<number | "gap"> {
  if (pages <= 5) return Array.from({ length: pages }, (_, index) => index + 1);
  const wanted = [1, pages, current - 1, current, current + 1].filter(
    (page) => page >= 1 && page <= pages,
  );
  const unique = [...new Set(wanted)].sort((a, b) => a - b);
  const labels: Array<number | "gap"> = [];
  for (let index = 0; index < unique.length; index++) {
    const page = unique[index];
    if (index > 0 && page - unique[index - 1] > 1) labels.push("gap");
    labels.push(page);
  }
  return labels;
}
