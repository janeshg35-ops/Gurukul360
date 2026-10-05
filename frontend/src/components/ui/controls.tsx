import { MagnifyingGlass, X } from "phosphor-react-native";
import React from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  ViewStyle,
} from "react-native";

import { makeStyles, radius, spacing, useTheme } from "@/src/theme";

// ---- Buttons --------------------------------------------------------------
const useButtonStyles = makeStyles((c) => ({
  base: {
    height: 52,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  primary: { backgroundColor: c.brandPrimary },
  primaryText: { color: c.onBrandPrimary, fontSize: 16, fontWeight: "700" },
  secondary: {
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.borderStrong,
  },
  secondaryText: { color: c.onSurface, fontSize: 16, fontWeight: "700" },
  disabled: { opacity: 0.5 },
}));

export function PrimaryButton({
  label,
  onPress,
  loading,
  disabled,
  icon,
  style,
  testID,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  testID?: string;
}) {
  const s = useButtonStyles();
  const { colors } = useTheme();
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        s.base,
        s.primary,
        isDisabled && s.disabled,
        pressed && !isDisabled && { opacity: 0.85 },
        style,
      ]}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator color={colors.onBrandPrimary} />
      ) : (
        <>
          {icon}
          <Text style={s.primaryText}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

export function SecondaryButton({
  label,
  onPress,
  icon,
  style,
  testID,
}: {
  label: string;
  onPress: () => void;
  icon?: React.ReactNode;
  style?: ViewStyle;
  testID?: string;
}) {
  const s = useButtonStyles();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [s.base, s.secondary, pressed && { opacity: 0.7 }, style]}
      testID={testID}
    >
      {icon}
      <Text style={s.secondaryText}>{label}</Text>
    </Pressable>
  );
}

// ---- Search bar -----------------------------------------------------------
const useSearchStyles = makeStyles((c) => ({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: c.surfaceTertiary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 44,
    gap: spacing.sm,
  },
  input: { flex: 1, fontSize: 15, color: c.onSurface, padding: 0 },
}));

export function SearchBar({
  value,
  onChangeText,
  placeholder = "Search",
  testID,
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  testID?: string;
}) {
  const s = useSearchStyles();
  const { colors } = useTheme();
  return (
    <View style={s.wrap}>
      <MagnifyingGlass size={18} color={colors.muted} weight="bold" />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        style={s.input}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        testID={testID}
      />
      {value.length > 0 ? (
        <Pressable onPress={() => onChangeText("")} hitSlop={8} testID={`${testID}-clear`}>
          <X size={16} color={colors.muted} weight="bold" />
        </Pressable>
      ) : null}
    </View>
  );
}

// ---- Filter chips (horizontal, non-wrapping) ------------------------------
const useChipStyles = makeStyles((c) => ({
  row: { maxHeight: 56 },
  content: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
  },
  chip: {
    height: 36,
    flexShrink: 0,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  chipActive: { backgroundColor: c.brandPrimary, borderColor: c.brandPrimary },
  label: { fontSize: 13, fontWeight: "600", color: c.onSurfaceTertiary },
  labelActive: { color: c.onBrandPrimary },
}));

export interface ChipOption {
  key: string;
  label: string;
}

export function FilterChips({
  options,
  selected,
  onSelect,
  testIDPrefix = "chip",
}: {
  options: ChipOption[];
  selected: string;
  onSelect: (key: string) => void;
  testIDPrefix?: string;
}) {
  const s = useChipStyles();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={s.row}
      contentContainerStyle={s.content}
    >
      {options.map((opt) => {
        const active = opt.key === selected;
        return (
          <Pressable
            key={opt.key}
            onPress={() => onSelect(opt.key)}
            style={[s.chip, active && s.chipActive]}
            testID={`${testIDPrefix}-${opt.key}`}
          >
            <Text style={[s.label, active && s.labelActive]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

// ---- Segmented tabs -------------------------------------------------------
const useSegmentStyles = makeStyles((c) => ({
  wrap: {
    flexDirection: "row",
    backgroundColor: c.surfaceTertiary,
    borderRadius: radius.md,
    padding: 4,
  },
  seg: {
    flex: 1,
    height: 36,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  segActive: { backgroundColor: c.surface },
  label: { fontSize: 13, fontWeight: "600", color: c.muted },
  labelActive: { color: c.onSurface, fontWeight: "700" },
}));

export function SegmentedTabs({
  options,
  selected,
  onSelect,
  testIDPrefix = "segment",
}: {
  options: ChipOption[];
  selected: string;
  onSelect: (key: string) => void;
  testIDPrefix?: string;
}) {
  const s = useSegmentStyles();
  return (
    <View style={s.wrap}>
      {options.map((opt) => {
        const active = opt.key === selected;
        return (
          <Pressable
            key={opt.key}
            onPress={() => onSelect(opt.key)}
            style={[s.seg, active && s.segActive]}
            testID={`${testIDPrefix}-${opt.key}`}
          >
            <Text style={[s.label, active && s.labelActive]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
