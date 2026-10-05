// Relational-style data model for Gurukul360 (frontend-only demo).
// Every module (attendance, fees, academics) references the SAME Student by id.

export type Gender = "Male" | "Female";
export type StudentStatus = "active" | "inactive";
export type AttendanceStatus = "present" | "absent" | "late";
export type AnnouncementCategory =
  | "Notice"
  | "Announcement"
  | "Event"
  | "Circular";

export interface School {
  id: string;
  name: string;
  location: string;
  session: string;
}

export interface SchoolClass {
  id: string; // c6..c10
  name: string; // "Class 10"
  order: number;
}

export interface Section {
  id: string; // s-10-a
  classId: string;
  name: string; // "A"
}

export interface Subject {
  id: string;
  name: string;
}

export interface Teacher {
  id: string;
  name: string;
  subjectIds: string[];
  classTeacherOf?: string; // sectionId
  phone: string;
  email: string;
  // Missing on seeded/saved records means active.
  status?: "active" | "inactive";
}

export interface Guardian {
  id: string;
  name: string;
  relation: "Father" | "Mother" | "Guardian";
  phone: string;
  email: string;
  occupation: string;
}

export interface FeeHead {
  id: string;
  name: string;
  amount: number;
}

export interface Student {
  id: string;
  admissionNo: string;
  name: string;
  classId: string;
  sectionId: string;
  rollNo: number;
  dob: string; // ISO
  gender: Gender;
  guardianId: string;
  phone: string;
  email: string;
  address: string;
  status: StudentStatus;
  avatarIndex: number;
  feeHeadIds: string[]; // which fee heads apply to this student
}

export interface AttendanceRecord {
  date: string; // YYYY-MM-DD
  studentId: string;
  status: AttendanceStatus;
}

export interface FeePayment {
  id: string;
  receiptNo: string;
  studentId: string;
  amount: number;
  date: string; // ISO
  method: "Cash" | "Cheque" | "Online" | "UPI" | "Card";
  reference?: string;
  note?: string;
  demo: true;
}

export interface AcademicResult {
  studentId: string;
  subjectId: string;
  term: string; // "Term 1"
  marks: number;
  maxMarks: number;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  category: AnnouncementCategory;
  date: string; // ISO
  audience: string;
  author: string;
}

export interface Database {
  version: number;
  school: School;
  classes: SchoolClass[];
  sections: Section[];
  subjects: Subject[];
  teachers: Teacher[];
  guardians: Guardian[];
  feeHeads: FeeHead[];
  students: Student[];
  attendance: AttendanceRecord[];
  payments: FeePayment[];
  results: AcademicResult[];
  announcements: Announcement[];
}
