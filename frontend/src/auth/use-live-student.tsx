import { useAuth } from "@/src/context/auth";
import { useData } from "@/src/data/store";
import { getStudent } from "@/src/data/compute";
import { Student } from "@/src/data/types";

export function useLiveStudent(): {
  student: Student | undefined;
  ready: boolean;
} {
  const { user, ready: authReady } = useAuth();
  const { db, ready: dataReady } = useData();
  const record =
    user?.role === "Student" && user.studentId ? getStudent(db, user.studentId) : undefined;
  const student = record && record.status === "active" ? record : undefined;
  return { student, ready: authReady && dataReady };
}
