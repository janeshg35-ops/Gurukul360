import dayjs from "dayjs";

import { todayKey } from "./seed";
import {
  AttendanceStatus,
  Database,
  Section,
  Student,
} from "./types";

export interface AttendanceStat {
  present: number;
  absent: number;
  late: number;
  unmarked: number;
  total: number;
  percentage: number; // present+late counted as attended
}

function pct(attended: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((attended / total) * 1000) / 10;
}

export function emptyStat(): AttendanceStat {
  return { present: 0, absent: 0, late: 0, unmarked: 0, total: 0, percentage: 0 };
}

function tally(statuses: AttendanceStatus[]): AttendanceStat {
  const s = emptyStat();
  for (const st of statuses) {
    s[st] += 1;
    s.total += 1;
  }
  s.percentage = pct(s.present + s.late, s.total);
  return s;
}

// Date rolls include every active student. A missing row is unmarked, not present.
function tallyRoster(marks: (AttendanceStatus | null)[]): AttendanceStat {
  const s = emptyStat();
  for (const mark of marks) {
    s.total += 1;
    if (mark == null) s.unmarked += 1;
    else s[mark] += 1;
  }
  s.percentage = pct(s.present + s.late, s.total);
  return s;
}

// ---- Lookups -------------------------------------------------------------
export function getStudent(db: Database, id: string): Student | undefined {
  return db.students.find((s) => s.id === id);
}

export function className(db: Database, classId: string): string {
  return db.classes.find((c) => c.id === classId)?.name ?? classId;
}

export function sectionName(db: Database, sectionId: string): string {
  return db.sections.find((s) => s.id === sectionId)?.name ?? sectionId;
}

export function classSectionLabel(db: Database, student: Student): string {
  return `${className(db, student.classId)} \u2014 ${sectionName(db, student.sectionId)}`;
}

export function sectionStudents(db: Database, sectionId: string): Student[] {
  return db.students
    .filter((s) => s.sectionId === sectionId && s.status === "active")
    .sort((a, b) => a.rollNo - b.rollNo);
}

export function activeStudents(db: Database): Student[] {
  return db.students.filter((s) => s.status === "active");
}

// ---- Attendance ----------------------------------------------------------
export function statusFor(
  db: Database,
  date: string,
  studentId: string,
): AttendanceStatus | null {
  return (
    db.attendance.find((a) => a.date === date && a.studentId === studentId)?.status ??
    null
  );
}

export function studentAttendance(db: Database, studentId: string): AttendanceStat {
  const statuses = db.attendance
    .filter((a) => a.studentId === studentId)
    .map((a) => a.status);
  return tally(statuses);
}

export function sectionAttendanceForDate(
  db: Database,
  sectionId: string,
  date: string,
): AttendanceStat {
  const ids = sectionStudents(db, sectionId).map((s) => s.id);
  return tallyRoster(ids.map((id) => statusFor(db, date, id)));
}

export function todayAttendance(db: Database): AttendanceStat {
  const date = todayKey();
  const ids = activeStudents(db).map((s) => s.id);
  return tallyRoster(ids.map((id) => statusFor(db, date, id)));
}

// ---- Fees ----------------------------------------------------------------
export function studentFeeTotal(db: Database, student: Student): number {
  return student.feeHeadIds.reduce((sum, hid) => {
    const head = db.feeHeads.find((h) => h.id === hid);
    return sum + (head?.amount ?? 0);
  }, 0);
}

export function studentPaid(db: Database, studentId: string): number {
  return db.payments
    .filter((p) => p.studentId === studentId)
    .reduce((sum, p) => sum + p.amount, 0);
}

export interface FeeStat {
  total: number;
  paid: number;
  outstanding: number;
}

export function studentFee(db: Database, student: Student): FeeStat {
  const total = studentFeeTotal(db, student);
  const paid = Math.min(studentPaid(db, student.id), total);
  return { total, paid, outstanding: Math.max(total - paid, 0) };
}

export function feeStatus(fee: FeeStat): "paid" | "partial" | "pending" {
  if (fee.paid <= 0) return "pending";
  if (fee.outstanding <= 0) return "paid";
  return "partial";
}

export interface FeeTotals {
  billed: number;
  collected: number;
  outstanding: number;
  studentsWithDues: number;
  fullyPaid: number;
}

export function feeTotals(db: Database): FeeTotals {
  let billed = 0;
  let collected = 0;
  let outstanding = 0;
  let dues = 0;
  let paidCount = 0;
  for (const s of activeStudents(db)) {
    const f = studentFee(db, s);
    billed += f.total;
    collected += f.paid;
    outstanding += f.outstanding;
    if (f.outstanding > 0) dues += 1;
    else paidCount += 1;
  }
  return { billed, collected, outstanding, studentsWithDues: dues, fullyPaid: paidCount };
}

export function studentPayments(db: Database, studentId: string) {
  return db.payments
    .filter((p) => p.studentId === studentId)
    .sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf());
}

export function recentPayments(db: Database, limit = 6) {
  return [...db.payments]
    .sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf())
    .slice(0, limit);
}

// ---- Academics -----------------------------------------------------------
export function grade(percentage: number): string {
  if (percentage >= 91) return "A1";
  if (percentage >= 81) return "A2";
  if (percentage >= 71) return "B1";
  if (percentage >= 61) return "B2";
  if (percentage >= 51) return "C1";
  if (percentage >= 41) return "C2";
  if (percentage >= 33) return "D";
  return "E";
}

export interface SubjectResult {
  subjectId: string;
  subject: string;
  marks: number;
  maxMarks: number;
  percentage: number;
  grade: string;
}

export function studentResults(db: Database, studentId: string): SubjectResult[] {
  return db.results
    .filter((r) => r.studentId === studentId)
    .map((r) => {
      const percentage = Math.round((r.marks / r.maxMarks) * 100);
      return {
        subjectId: r.subjectId,
        subject: db.subjects.find((s) => s.id === r.subjectId)?.name ?? r.subjectId,
        marks: r.marks,
        maxMarks: r.maxMarks,
        percentage,
        grade: grade(percentage),
      };
    });
}

export interface PerformanceSummary {
  average: number;
  grade: string;
  obtained: number;
  total: number;
}

export function studentPerformance(db: Database, studentId: string): PerformanceSummary {
  const results = studentResults(db, studentId);
  if (results.length === 0) return { average: 0, grade: "E", obtained: 0, total: 0 };
  const obtained = results.reduce((s, r) => s + r.marks, 0);
  const total = results.reduce((s, r) => s + r.maxMarks, 0);
  const average = Math.round((obtained / total) * 1000) / 10;
  return { average, grade: grade(average), obtained, total };
}

export function subjectClassAverage(db: Database, subjectId: string): number {
  const activeIds = new Set(activeStudents(db).map((s) => s.id));
  const rows = db.results.filter((r) => r.subjectId === subjectId && activeIds.has(r.studentId));
  if (rows.length === 0) return 0;
  const sum = rows.reduce((s, r) => s + (r.marks / r.maxMarks) * 100, 0);
  return Math.round((sum / rows.length) * 10) / 10;
}

export function schoolPerformanceAverage(db: Database): number {
  const all = activeStudents(db)
    .map((s) => studentPerformance(db, s.id))
    .filter((p) => p.total > 0)
    .map((p) => p.average);
  if (all.length === 0) return 0;
  return Math.round((all.reduce((a, b) => a + b, 0) / all.length) * 10) / 10;
}

// ---- Formatting ----------------------------------------------------------
export function formatINR(amount: number): string {
  return "\u20B9" + amount.toLocaleString("en-IN");
}

export function formatINRShort(amount: number): string {
  if (amount >= 10000000) return "\u20B9" + (amount / 10000000).toFixed(2) + " Cr";
  if (amount >= 100000) return "\u20B9" + (amount / 100000).toFixed(2) + " L";
  if (amount >= 1000) return "\u20B9" + (amount / 1000).toFixed(1) + "K";
  return "\u20B9" + amount;
}

// Sections grouped with live stats for a date (used by attendance module)
export interface SectionSummary {
  section: Section;
  classLabel: string;
  sectionLabel: string;
  totalStudents: number;
  stat: AttendanceStat;
}

export function sectionSummaries(db: Database, date: string): SectionSummary[] {
  return db.sections.map((section) => {
    const students = sectionStudents(db, section.id);
    return {
      section,
      classLabel: className(db, section.classId),
      sectionLabel: section.name,
      totalStudents: students.length,
      stat: sectionAttendanceForDate(db, section.id, date),
    };
  });
}
