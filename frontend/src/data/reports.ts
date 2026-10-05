import {
  activeStudents,
  className,
  formatINR,
  sectionName,
  studentAttendance,
  studentFee,
  studentPerformance,
} from "./compute";
import { Database, Student } from "./types";

export interface ReportData {
  title: string;
  summary: { label: string; value: string }[];
  columns: string[];
  widths: number[];
  rows: string[][];
  hasFilter: boolean;
}

function filterStudents(
  db: Database,
  classFilter: string,
  sectionFilter: string,
): Student[] {
  return activeStudents(db)
    .filter((s) => (classFilter === "all" ? true : s.classId === classFilter))
    .filter((s) => (sectionFilter === "all" ? true : sectionName(db, s.sectionId) === sectionFilter))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export const REPORT_TITLES: Record<string, string> = {
  student: "Student Report",
  attendance: "Attendance Report",
  "fee-collection": "Fee Collection Report",
  outstanding: "Outstanding Fee Report",
  performance: "Student Performance Summary",
};

export function buildReport(
  db: Database,
  type: string,
  classFilter: string,
  sectionFilter: string,
): ReportData {
  const students = filterStudents(db, classFilter, sectionFilter);

  if (type === "student") {
    const boys = students.filter((s) => s.gender === "Male").length;
    return {
      title: REPORT_TITLES.student,
      hasFilter: true,
      summary: [
        { label: "Total Students", value: String(students.length) },
        { label: "Boys", value: String(boys) },
        { label: "Girls", value: String(students.length - boys) },
      ],
      columns: ["Name", "Admission", "Class", "Section", "Guardian"],
      widths: [150, 110, 90, 80, 150],
      rows: students.map((s) => [
        s.name,
        s.admissionNo,
        className(db, s.classId),
        sectionName(db, s.sectionId),
        db.guardians.find((g) => g.id === s.guardianId)?.name ?? "—",
      ]),
    };
  }

  if (type === "attendance") {
    const stats = students.map((s) => ({ s, a: studentAttendance(db, s.id) }));
    const recorded = stats.filter((x) => x.a.total > 0);
    const avg =
      recorded.length > 0
        ? Math.round((recorded.reduce((sum, x) => sum + x.a.percentage, 0) / recorded.length) * 10) / 10
        : 0;
    return {
      title: REPORT_TITLES.attendance,
      hasFilter: true,
      summary: [
        { label: "Students", value: String(students.length) },
        { label: "Avg Attendance", value: `${avg}%` },
        { label: "Below 75%", value: String(recorded.filter((x) => x.a.percentage < 75).length) },
      ],
      columns: ["Name", "Class", "Present", "Late", "Absent", "%"],
      widths: [150, 90, 80, 70, 80, 70],
      rows: stats.map(({ s, a }) => [
        s.name,
        `${className(db, s.classId)}-${sectionName(db, s.sectionId)}`,
        String(a.present),
        String(a.late),
        String(a.absent),
        a.total > 0 ? `${a.percentage}%` : "—",
      ]),
    };
  }

  if (type === "fee-collection") {
    const rows = students.map((s) => ({ s, f: studentFee(db, s) }));
    const collected = rows.reduce((sum, r) => sum + r.f.paid, 0);
    const billed = rows.reduce((sum, r) => sum + r.f.total, 0);
    return {
      title: REPORT_TITLES["fee-collection"],
      hasFilter: true,
      summary: [
        { label: "Collected", value: formatINR(collected) },
        { label: "Total Billed", value: formatINR(billed) },
        { label: "Students", value: String(students.length) },
      ],
      columns: ["Name", "Class", "Total", "Paid", "Status"],
      widths: [150, 90, 110, 110, 90],
      rows: rows.map(({ s, f }) => [
        s.name,
        `${className(db, s.classId)}-${sectionName(db, s.sectionId)}`,
        formatINR(f.total),
        formatINR(f.paid),
        f.outstanding <= 0 ? "Paid" : f.paid > 0 ? "Partial" : "Pending",
      ]),
    };
  }

  if (type === "outstanding") {
    const rows = students
      .map((s) => ({ s, f: studentFee(db, s) }))
      .filter((r) => r.f.outstanding > 0)
      .sort((a, b) => b.f.outstanding - a.f.outstanding);
    const outstanding = rows.reduce((sum, r) => sum + r.f.outstanding, 0);
    return {
      title: REPORT_TITLES.outstanding,
      hasFilter: true,
      summary: [
        { label: "Outstanding", value: formatINR(outstanding) },
        { label: "Students with Dues", value: String(rows.length) },
      ],
      columns: ["Name", "Class", "Total", "Paid", "Outstanding"],
      widths: [150, 90, 110, 110, 120],
      rows: rows.map(({ s, f }) => [
        s.name,
        `${className(db, s.classId)}-${sectionName(db, s.sectionId)}`,
        formatINR(f.total),
        formatINR(f.paid),
        formatINR(f.outstanding),
      ]),
    };
  }

  // performance
  const rows = students
    .map((s) => ({ s, p: studentPerformance(db, s.id) }))
    .sort((a, b) => b.p.average - a.p.average);
  const recorded = rows.filter((r) => r.p.total > 0);
  const schoolAvg =
    recorded.length > 0
      ? Math.round((recorded.reduce((sum, r) => sum + r.p.average, 0) / recorded.length) * 10) / 10
      : 0;
  const top = recorded[0];
  return {
    title: REPORT_TITLES.performance,
    hasFilter: true,
    summary: [
      { label: "Students", value: String(students.length) },
      { label: "School Average", value: `${schoolAvg}%` },
      { label: "Top Score", value: top ? `${top.p.average}%` : "—" },
    ],
    columns: ["Name", "Class", "Average", "Grade"],
    widths: [160, 100, 100, 90],
    rows: rows.map(({ s, p }) => [
      s.name,
      `${className(db, s.classId)}-${sectionName(db, s.sectionId)}`,
      p.total > 0 ? `${p.average}%` : "—",
      p.total > 0 ? p.grade : "—",
    ]),
  };
}
