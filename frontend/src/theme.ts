// Design tokens for Gurukul360 (MYTECH). Light theme.
// Keys match the "color" block of /app/design_guidelines.json.

import { useMemo } from "react";
import { Appearance, StyleSheet, useColorScheme } from "react-native";

export type ColorScheme = "light" | "dark";

const light = {
  // Surfaces
  surface: "#FFFFFF",
  onSurface: "#111827",
  surfaceSecondary: "#F9FAFB",
  onSurfaceSecondary: "#1F2937",
  surfaceTertiary: "#F3F4F6",
  onSurfaceTertiary: "#374151",
  surfaceInverse: "#111827",
  onSurfaceInverse: "#F9FAFB",
  muted: "#6B7280",

  // Brand — deep professional blue on charcoal base
  brand: "#1E3A8A",
  onBrand: "#FFFFFF",
  brandPrimary: "#1E3A8A",
  onBrandPrimary: "#FFFFFF",
  brandSecondary: "#3B82F6",
  onBrandSecondary: "#FFFFFF",
  brandTertiary: "#EFF6FF",
  onBrandTertiary: "#1E3A8A",

  // Charcoal (header / logo base)
  ink: "#0F172A",
  onInk: "#FFFFFF",

  // Status
  success: "#059669",
  onSuccess: "#FFFFFF",
  successSoft: "#ECFDF5",
  onSuccessSoft: "#047857",
  warning: "#D97706",
  onWarning: "#FFFFFF",
  warningSoft: "#FFFBEB",
  onWarningSoft: "#B45309",
  error: "#DC2626",
  onError: "#FFFFFF",
  errorSoft: "#FEF2F2",
  onErrorSoft: "#B91C1C",
  info: "#1E3A8A",
  onInfo: "#FFFFFF",
  infoSoft: "#EFF6FF",
  onInfoSoft: "#1E3A8A",

  // Lines
  border: "#E5E7EB",
  borderStrong: "#D1D5DB",
  divider: "#F3F4F6",
};

export type ThemeColors = typeof light;

export const defaultScheme = "light" satisfies ColorScheme;

export const themes: { light: ThemeColors; dark?: ThemeColors } = { light };

export function setColorScheme(scheme: ColorScheme | null) {
  Appearance.setColorScheme?.(scheme ?? "unspecified");
}

setColorScheme?.(themes.dark ? null : defaultScheme);

export function useTheme(): { scheme: ColorScheme; colors: ThemeColors } {
  const system = useColorScheme();
  const scheme: ColorScheme =
    (system === "light" || system === "dark") && themes[system] ? system : defaultScheme;
  return { scheme, colors: themes[scheme] ?? themes.light };
}

export function makeStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
  factory: (colors: ThemeColors) => T & StyleSheet.NamedStyles<any>,
): () => T {
  return function useStyles(): T {
    const { colors } = useTheme();
    return useMemo(() => StyleSheet.create(factory(colors)), [colors]);
  };
}

// Shared layout tokens from design_guidelines.json
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  "2xl": 32,
  "3xl": 48,
} as const;

export const radius = {
  sm: 6,
  md: 12,
  lg: 20,
  pill: 999,
} as const;

export const fontSize = {
  sm: 12,
  base: 14,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 30,
} as const;

// Palette for initials-avatars (deterministic by index)
export const avatarPalette = [
  "#1E3A8A",
  "#0E7490",
  "#B45309",
  "#047857",
  "#6D28D9",
  "#BE123C",
  "#1D4ED8",
  "#15803D",
];
