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
import { buildDatabase, DB_VERSION } from "./seed";
import { AttendanceStatus, Database, FeePayment, Gender, Guardian, Student } from "./types";

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
  const n = db.payments.length + 1001;
  return `RCPT-26-${n}`;
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
              setDb(parsed);
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

  const resetDemo = useCallback(() => {
    setDb(buildDatabase());
  }, []);

  return (
    <DataContext.Provider
      value={{ db, ready, setAttendance, recordPayment, addStudent, updateStudent, deactivateStudent, resetDemo }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
