import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useState } from "react";
import { Modal, Platform, Pressable, Text, View } from "react-native";

import { makeStyles, spacing, useTheme } from "@/src/theme";
import { formatIsoDate, isoToLocalDate, localDateToIso } from "@/src/utils/date-only";
import { DateButton } from "./date-button";
import type { DateFieldProps } from "./date-field";

const useStyles = makeStyles((c) => ({
  backdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(15, 23, 42, 0.35)" },
  sheet: { backgroundColor: c.surface, paddingTop: spacing.sm, paddingBottom: spacing.xl },
  doneRow: { alignItems: "flex-end", paddingHorizontal: spacing.lg },
  done: { fontSize: 16, fontWeight: "800", color: c.brandPrimary, padding: spacing.sm },
}));

export function DateField({
  value,
  onChange,
  placeholder,
  minimumDate,
  maximumDate,
  fallbackDate,
  testID,
}: DateFieldProps) {
  const s = useStyles();
  const { colors } = useTheme();
  const selected = isoToLocalDate(value);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Date>(selected ?? fallbackDate ?? new Date());

  const openPicker = () => {
    setDraft(selected ?? fallbackDate ?? maximumDate ?? new Date());
    setOpen(true);
  };

  const commit = (date: Date) => {
    onChange(localDateToIso(date));
  };

  const onAndroidChange = (event: DateTimePickerEvent, date?: Date) => {
    setOpen(false);
    if (event.type === "set" && date) commit(date);
  };

  return (
    <View>
      <Pressable onPress={openPicker} testID={testID} accessibilityRole="button">
        <DateButton display={formatIsoDate(value)} placeholder={placeholder} testID={testID} />
      </Pressable>
      {open && Platform.OS === "android" ? (
        <DateTimePicker
          value={draft}
          mode="date"
          display="default"
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          onChange={onAndroidChange}
          onDismiss={() => setOpen(false)}
        />
      ) : null}
      {Platform.OS === "ios" ? (
        <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
          <Pressable style={s.backdrop} onPress={() => setOpen(false)}>
            <Pressable style={s.sheet} onPress={() => undefined}>
              <View style={s.doneRow}>
                <Pressable
                  onPress={() => {
                    commit(draft);
                    setOpen(false);
                  }}
                  testID={testID ? `${testID}-done` : undefined}
                >
                  <Text style={[s.done, { color: colors.brandPrimary }]}>Done</Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={draft}
                mode="date"
                display="spinner"
                minimumDate={minimumDate}
                maximumDate={maximumDate}
                onChange={(_event, date) => {
                  if (date) setDraft(date);
                }}
              />
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </View>
  );
}
