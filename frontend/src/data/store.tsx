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
import { AttendanceStatus, Database, FeePayment } from "./types";

const DB_KEY = "gurukul360.db.v1";

interface RecordPaymentInput {
  studentId: string;
  amount: number;
  method: FeePayment["method"];
  reference?: string;
  note?: string;
}

interface DataContextValue {
  db: Database;
  ready: boolean;
  // Attendance
  setAttendance: (date: string, updates: Record<string, AttendanceStatus>) => void;
  // Fees
  recordPayment: (input: RecordPaymentInput) => FeePayment;
  // Demo reset
  resetDemo: () => void;
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

  const resetDemo = useCallback(() => {
    setDb(buildDatabase());
  }, []);

  return (
    <DataContext.Provider
      value={{ db, ready, setAttendance, recordPayment, resetDemo }}
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
