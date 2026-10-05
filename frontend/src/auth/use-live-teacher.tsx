import { useAuth } from "@/src/context/auth";
import { useData } from "@/src/data/store";
import { getTeacher, isActiveTeacher } from "@/src/data/teachers";
import { Teacher } from "@/src/data/types";

export function useLiveTeacher(): {
  teacher: Teacher | undefined;
  ready: boolean;
} {
  const { user, ready: authReady } = useAuth();
  const { db, ready: dataReady } = useData();
  const record =
    user?.role === "Teacher" && user.teacherId ? getTeacher(db, user.teacherId) : undefined;
  const teacher = record && isActiveTeacher(record) ? record : undefined;
  return { teacher, ready: authReady && dataReady };
}
