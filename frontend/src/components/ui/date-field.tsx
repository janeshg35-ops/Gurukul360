import { createElement, useRef } from "react";
import { Pressable, View } from "react-native";

import { formatIsoDate, isoToLocalDate, localDateToIso } from "@/src/utils/date-only";
import { DateButton } from "./date-button";

export interface DateFieldProps {
  value: string;
  onChange: (isoDate: string) => void;
  placeholder?: string;
  minimumDate?: Date;
  maximumDate?: Date;
  fallbackDate?: Date;
  testID?: string;
}

export function DateField({
  value,
  onChange,
  placeholder,
  minimumDate,
  maximumDate,
  testID,
}: DateFieldProps) {
  const inputRef = useRef<{ showPicker?: () => void; click: () => void } | null>(null);
  const display = value ? formatIsoDate(value) : "";

  const open = () => {
    const node = inputRef.current;
    if (!node) return;
    if (typeof node.showPicker === "function") {
      try {
        node.showPicker();
        return;
      } catch {
        node.click();
        return;
      }
    }
    node.click();
  };

  return (
    <View>
      <Pressable onPress={open} testID={testID} accessibilityRole="button">
        <DateButton display={display} placeholder={placeholder} testID={testID} />
      </Pressable>
      {createElement("input", {
        ref: inputRef,
        type: "date",
        value: isoToLocalDate(value) ? value.slice(0, 10) : "",
        min: minimumDate ? localDateToIso(minimumDate) : undefined,
        max: maximumDate ? localDateToIso(maximumDate) : undefined,
        "aria-label": placeholder ?? "Date",
        onChange: (event: { target: { value: string } }) => {
          const next = event.target.value;
          if (next) onChange(next);
        },
        style: {
          position: "absolute",
          width: 1,
          height: 1,
          opacity: 0,
          pointerEvents: "none",
        },
      })}
    </View>
  );
}
