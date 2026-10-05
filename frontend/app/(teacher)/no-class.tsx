import { EmptyState } from "@/src/components/ui/feedback";

export const NO_CLASS_MESSAGE =
  "No class assigned. Your subject-teaching workspace will be available in a future phase.";

export function NoClassState() {
  return (
    <EmptyState title="No class assigned" message={NO_CLASS_MESSAGE} testID="teacher-no-class" />
  );
}
