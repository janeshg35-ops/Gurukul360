import dayjs from "dayjs";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { storage } from "@/src/utils/storage";
import { assignmentFromInput, AssignmentInput, validateAssignment } from "./assignments";
import { buildDatabase, DB_VERSION, PE_SUBJECT, seedAssignments, seedTimetable, supplementalTeachers } from "./seed";
import { eligibilityForTeacher, SCHEDULE_SLOTS } from "./timetable-config";
import { timetableDirectory, validateTimetable } from "./timetable";
import {
  insertTeacher,
  markTeacherActive,
  markTeacherInactive,
  patchTeacher,
  TeacherFormInput,
} from "./teachers";
import { AnnouncementCategory, AttendanceStatus, Database, FeePayment, Gender, Guardian, Student, TimetableEntry } from "./types";

const DB_KEY = "gurukul360.db.v1";

interface RecordPaymentInput {
  studentId: string;
  amount: number;
  method: FeePayment["method"];
  reference?: string;
  note?: string;
}

export interface StudentFormInput {
  name: string;
  admissionNo: string;
  classId: string;
  sectionId: string;
  rollNo: number;
  dob: string;
  gender: Gender;
  phone: string;
  email: string;
  address: string;
  feeHeadIds: string[];
  guardianName: string;
  guardianPhone: string;
}

interface DataContextValue {
  db: Database;
  ready: boolean;
  // Attendance
  setAttendance: (date: string, updates: Record<string, AttendanceStatus>) => void;
  // Fees
  recordPayment: (input: RecordPaymentInput) => FeePayment;
  // Students
  addStudent: (input: StudentFormInput) => string | null;
  updateStudent: (id: string, input: StudentFormInput) => boolean;
  deactivateStudent: (id: string) => void;
  // Teachers
  addTeacher: (input: TeacherFormInput) => string | null;
  updateTeacher: (id: string, input: TeacherFormInput) => boolean;
  deactivateTeacher: (id: string) => void;
  activateTeacher: (id: string) => "ok" | "conflict" | "missing";
  // Assignments
  addAssignment: (input: AssignmentInput) => string | null;
  updateAssignment: (id: string, input: AssignmentInput) => boolean;
  deleteAssignment: (id: string) => void;
  // Communication
  addAnnouncement: (input: AnnouncementInput) => string | null;
  updateAnnouncement: (id: string, input: AnnouncementInput) => boolean;
  deleteAnnouncement: (id: string) => void;
  // Timetable
  replaceTimetable: (entries: TimetableEntry[]) => boolean;
  // Demo reset
  resetDemo: () => void;
}

function admissionTaken(db: Database, admissionNo: string, exceptId?: string): boolean {
  const key = admissionNo.trim().toLowerCase();
  return db.students.some(
    (s) => s.id !== exceptId && s.admissionNo.trim().toLowerCase() === key,
  );
}

function uniqueKey(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

const ANNOUNCEMENT_CATEGORIES: AnnouncementCategory[] = ["Notice", "Announcement", "Event", "Circular"];

export interface AnnouncementInput {
  title: string;
  body: string;
  category: AnnouncementCategory;
  date: string;
  audience: string;
  author: string;
}

function announcementError(input: AnnouncementInput): string | null {
  if (!input.title.trim()) return "Title is required.";
  if (!input.body.trim()) return "Body is required.";
  if (!ANNOUNCEMENT_CATEGORIES.includes(input.category)) return "Category is required.";
  if (!input.date || !dayjs(input.date).isValid()) return "Date is required.";
  if (!input.audience.trim()) return "Audience is required.";
  return null;
}

function avatarIndexFor(name: string): number {
  let sum = 0;
  for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
  return sum % 8;
}

function studentFromInput(id: string, guardianId: string, input: StudentFormInput, avatarIndex: number): Student {
  return {
    id,
    admissionNo: input.admissionNo.trim(),
    name: input.name.trim(),
    classId: input.classId,
    sectionId: input.sectionId,
    rollNo: input.rollNo,
    dob: input.dob,
    gender: input.gender,
    guardianId,
    phone: input.phone.trim(),
    email: input.email.trim(),
    address: input.address.trim(),
    status: "active",
    avatarIndex,
    feeHeadIds: [...input.feeHeadIds],
  };
}

const DataContext = createContext<DataContextValue | null>(null);

function nextReceiptNo(db: Database): string {
  const used = new Set(db.payments.map((payment) => payment.receiptNo));
  let serial = 1001;
  for (const receipt of used) {
    const match = /^RCPT-26-(\d+)$/.exec(receipt);
    if (!match) continue;
    const value = Number(match[1]);
    if (Number.isInteger(value) && value >= serial) serial = value + 1;
  }
  let candidate = `RCPT-26-${serial}`;
  while (used.has(candidate)) {
    serial += 1;
    candidate = `RCPT-26-${serial}`;
  }
  return candidate;
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<Database>(() => buildDatabase());
  const [ready, setReady] = useState(false);
  const loaded = useRef(false);

  // Load persisted db (or seed) on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      const raw = await storage.getItem<string>(DB_KEY, "");
      if (mounted) {
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as Database;
            if (parsed && parsed.version === DB_VERSION) {
              setDb(withTimetable(withSchedule(withTeacherEligibility(withAssignments(parsed)))));
            }
          } catch {
            // fall back to seed already in state
          }
        }
        loaded.current = true;
        setReady(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Persist on every change (after initial load)
  useEffect(() => {
    if (!loaded.current) return;
    storage.setItem(DB_KEY, JSON.stringify(db));
  }, [db]);

  const setAttendance = useCallback(
    (date: string, updates: Record<string, AttendanceStatus>) => {
      setDb((prev) => {
        const ids = Object.keys(updates);
        const kept = prev.attendance.filter(
          (a) => !(a.date === date && ids.includes(a.studentId)),
        );
        const added = ids.map((studentId) => ({
          date,
          studentId,
          status: updates[studentId],
        }));
        return { ...prev, attendance: [...kept, ...added] };
      });
    },
    [],
  );

  const recordPayment = useCallback((input: RecordPaymentInput): FeePayment => {
    const payment: FeePayment = {
      id: `pay-${Date.now()}`,
      receiptNo: "",
      studentId: input.studentId,
      amount: input.amount,
      date: dayjs().toISOString(),
      method: input.method,
      reference: input.reference,
      note: input.note,
      demo: true,
    };
    setDb((prev) => {
      payment.receiptNo = nextReceiptNo(prev);
      return { ...prev, payments: [...prev.payments, payment] };
    });
    return payment;
  }, []);

  const addStudent = useCallback((input: StudentFormInput): string | null => {
    if (admissionTaken(db, input.admissionNo)) return null;
    const studentId = uniqueKey("stu");
    const guardianId = uniqueKey("g");
    setDb((prev) => {
      if (admissionTaken(prev, input.admissionNo)) return prev;
      const guardian: Guardian = {
        id: guardianId,
        name: input.guardianName.trim(),
        relation: "Guardian",
        phone: input.guardianPhone.trim(),
        email: "",
        occupation: "",
      };
      const student = studentFromInput(studentId, guardianId, input, avatarIndexFor(input.name));
      return {
        ...prev,
        guardians: [...prev.guardians, guardian],
        students: [...prev.students, student],
      };
    });
    return studentId;
  }, [db]);

  const updateStudent = useCallback((id: string, input: StudentFormInput): boolean => {
    const current = db.students.find((s) => s.id === id);
    if (!current || admissionTaken(db, input.admissionNo, id)) return false;
    setDb((prev) => {
      const latest = prev.students.find((s) => s.id === id);
      if (!latest || admissionTaken(prev, input.admissionNo, id)) return prev;
      const existingGuardian = prev.guardians.find((g) => g.id === latest.guardianId);
      let guardianId = latest.guardianId;
      let guardians = prev.guardians;
      if (existingGuardian) {
        guardians = prev.guardians.map((g) =>
          g.id === existingGuardian.id
            ? { ...g, name: input.guardianName.trim(), phone: input.guardianPhone.trim() }
            : g,
        );
      } else {
        guardianId = uniqueKey("g");
        guardians = [
          ...prev.guardians,
          {
            id: guardianId,
            name: input.guardianName.trim(),
            relation: "Guardian" as const,
            phone: input.guardianPhone.trim(),
            email: "",
            occupation: "",
          },
        ];
      }
      return {
        ...prev,
        guardians,
        students: prev.students.map((s) =>
          s.id === id
            ? { ...studentFromInput(id, guardianId, input, s.avatarIndex), status: s.status }
            : s,
        ),
      };
    });
    return true;
  }, [db]);

  const deactivateStudent = useCallback((id: string) => {
    setDb((prev) => ({
      ...prev,
      students: prev.students.map((s) => (s.id === id ? { ...s, status: "inactive" } : s)),
    }));
  }, []);

  const addTeacher = useCallback((input: TeacherFormInput): string | null => {
    const id = uniqueKey("t");
    if (!insertTeacher(db, input, id)) return null;
    setDb((prev) => insertTeacher(prev, input, id) ?? prev);
    return id;
  }, [db]);

  const updateTeacher = useCallback((id: string, input: TeacherFormInput): boolean => {
    if (!patchTeacher(db, id, input)) return false;
    setDb((prev) => patchTeacher(prev, id, input) ?? prev);
    return true;
  }, [db]);

  const deactivateTeacher = useCallback((id: string) => {
    setDb((prev) => markTeacherInactive(prev, id));
  }, []);

  const activateTeacher = useCallback((id: string): "ok" | "conflict" | "missing" => {
    const result = markTeacherActive(db, id);
    if (result === "conflict" || result === "missing") return result;
    setDb(result);
    return "ok";
  }, [db]);

  const addAssignment = useCallback((input: AssignmentInput): string | null => {
    if (validateAssignment(db, input)) return null;
    const id = uniqueKey("asg");
    setDb((prev) => {
      if (validateAssignment(prev, input)) return prev;
      return { ...prev, assignments: [...prev.assignments, assignmentFromInput(id, input)] };
    });
    return id;
  }, [db]);

  const updateAssignment = useCallback((id: string, input: AssignmentInput): boolean => {
    if (!db.assignments.some((item) => item.id === id) || validateAssignment(db, input)) return false;
    setDb((prev) => {
      if (!prev.assignments.some((item) => item.id === id) || validateAssignment(prev, input)) return prev;
      return {
        ...prev,
        assignments: prev.assignments.map((item) => (item.id === id ? assignmentFromInput(id, input) : item)),
      };
    });
    return true;
  }, [db]);

  const deleteAssignment = useCallback((id: string) => {
    setDb((prev) => ({ ...prev, assignments: prev.assignments.filter((item) => item.id !== id) }));
  }, []);

  const addAnnouncement = useCallback((input: AnnouncementInput): string | null => {
    if (announcementError(input)) return null;
    const id = uniqueKey("a");
    setDb((prev) => {
      if (announcementError(input)) return prev;
      return {
        ...prev,
        announcements: [
          ...prev.announcements,
          {
            id,
            title: input.title.trim(),
            body: input.body.trim(),
            category: input.category,
            date: input.date,
            audience: input.audience.trim(),
            author: input.author.trim(),
          },
        ],
      };
    });
    return id;
  }, []);

  const updateAnnouncement = useCallback((id: string, input: AnnouncementInput): boolean => {
    if (announcementError(input) || !db.announcements.some((item) => item.id === id)) return false;
    setDb((prev) => {
      if (announcementError(input) || !prev.announcements.some((item) => item.id === id)) return prev;
      return {
        ...prev,
        announcements: prev.announcements.map((item) =>
          item.id === id
            ? {
                id,
                title: input.title.trim(),
                body: input.body.trim(),
                category: input.category,
                date: input.date,
                audience: input.audience.trim(),
                author: input.author.trim(),
              }
            : item,
        ),
      };
    });
    return true;
  }, [db]);

  const deleteAnnouncement = useCallback((id: string) => {
    setDb((prev) => ({ ...prev, announcements: prev.announcements.filter((item) => item.id !== id) }));
  }, []);

  const replaceTimetable = useCallback((entries: TimetableEntry[]): boolean => {
    const directory = timetableDirectory(db);
    if (validateTimetable(entries, directory).length > 0) return false;
    setDb((prev) => {
      if (validateTimetable(entries, timetableDirectory(prev)).length > 0) return prev;
      return { ...prev, timetable: entries };
    });
    return true;
  }, [db]);

  const resetDemo = useCallback(() => {
    setDb(buildDatabase());
  }, []);

  return (
    <DataContext.Provider
      value={{
        db,
        ready,
        setAttendance,
        recordPayment,
        addStudent,
        updateStudent,
        deactivateStudent,
        addTeacher,
        updateTeacher,
        deactivateTeacher,
        activateTeacher,
        addAssignment,
        updateAssignment,
        deleteAssignment,
        addAnnouncement,
        updateAnnouncement,
        deleteAnnouncement,
        replaceTimetable,
        resetDemo,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

/** Keeps a saved version-1 database. Fills homework only when the field was never stored. */
function withAssignments(parsed: Database): Database {
  if (Array.isArray(parsed.assignments)) return parsed;
  return { ...parsed, assignments: seedAssignments() };
}

function withTeacherEligibility(parsed: Database): Database {
  let changed = false;
  const teachers = parsed.teachers.map((teacher) => {
    if (Array.isArray(teacher.eligibleClassIds)) return teacher;
    changed = true;
    return { ...teacher, eligibleClassIds: eligibilityForTeacher(teacher.id) };
  });
  return changed ? { ...parsed, teachers } : parsed;
}

function withSchedule(parsed: Database): Database {
  let next = parsed;
  if (!next.subjects.some((subject) => subject.id === PE_SUBJECT.id)) {
    next = { ...next, subjects: [...next.subjects, PE_SUBJECT] };
  }
  const missingTeachers = supplementalTeachers().filter((teacher) => !next.teachers.some((item) => item.id === teacher.id));
  if (missingTeachers.length > 0) {
    next = { ...next, teachers: [...next.teachers, ...missingTeachers] };
  }
  if (!Array.isArray(next.scheduleSlots)) {
    next = { ...next, scheduleSlots: SCHEDULE_SLOTS.map((slot) => ({ ...slot })) };
  }
  return next;
}

function withTimetable(parsed: Database): Database {
  if (Array.isArray(parsed.timetable)) return parsed;
  return { ...parsed, timetable: seedTimetable() };
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
