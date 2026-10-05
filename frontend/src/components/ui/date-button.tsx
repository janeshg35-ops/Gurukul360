import { CalendarBlank } from "phosphor-react-native";
import { Text, View } from "react-native";

import { makeStyles, radius, spacing, useTheme } from "@/src/theme";

const useStyles = makeStyles((c) => ({
  field: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: c.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  value: { flex: 1, fontSize: 15, fontWeight: "600", color: c.onSurface },
  placeholder: { flex: 1, fontSize: 15, color: c.muted },
}));

export function DateButton({
  display,
  placeholder = "DD/MM/YYYY",
  testID,
}: {
  display: string;
  placeholder?: string;
  testID?: string;
}) {
  const s = useStyles();
  const { colors } = useTheme();
  return (
    <View style={s.field} testID={testID ? `${testID}-display` : undefined}>
      <Text style={display ? s.value : s.placeholder}>{display || placeholder}</Text>
      <CalendarBlank size={18} color={colors.brandPrimary} weight="bold" />
    </View>
  );
}
