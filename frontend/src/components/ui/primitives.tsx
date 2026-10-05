import { Image } from "expo-image";
import React from "react";
import { Text, View, ViewStyle } from "react-native";

import { MYTECH_LOGO } from "@/src/constants/branding";
import { avatarPalette, makeStyles, radius, spacing } from "@/src/theme";

// ---- MYTECH Logo (authoritative supplied asset — never regenerate) --------
export function Logo({
  width = 140,
  tint,
}: {
  width?: number;
  tint?: "dark" | "light";
}) {
  const height = (width * 112) / 218; // preserve exact proportions
  return (
    <Image
      source={MYTECH_LOGO}
      style={{ width, height }}
      contentFit="contain"
      testID="mytech-logo"
      // On the charcoal header the black logo needs to read as light.
      tintColor={tint === "light" ? "#FFFFFF" : undefined}
    />
  );
}

// ---- Card -----------------------------------------------------------------
const useCardStyles = makeStyles((c) => ({
  card: {
    backgroundColor: c.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: c.border,
    padding: spacing.lg,
  },
}));

export function Card({
  children,
  style,
  testID,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  testID?: string;
}) {
  const s = useCardStyles();
  return (
    <View style={[s.card, style]} testID={testID}>
      {children}
    </View>
  );
}

// ---- Divider --------------------------------------------------------------
const useDividerStyles = makeStyles((c) => ({
  divider: { height: 1, backgroundColor: c.divider, width: "100%" },
}));
export function Divider({ style }: { style?: ViewStyle }) {
  const s = useDividerStyles();
  return <View style={[s.divider, style]} />;
}

// ---- Badge ----------------------------------------------------------------
export type Tone = "success" | "warning" | "error" | "info" | "neutral";

const useBadgeStyles = makeStyles((c) => ({
  base: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  text: { fontSize: 12, fontWeight: "700" },
  success: { backgroundColor: c.successSoft },
  successText: { color: c.onSuccessSoft },
  warning: { backgroundColor: c.warningSoft },
  warningText: { color: c.onWarningSoft },
  error: { backgroundColor: c.errorSoft },
  errorText: { color: c.onErrorSoft },
  info: { backgroundColor: c.infoSoft },
  infoText: { color: c.onInfoSoft },
  neutral: { backgroundColor: c.surfaceTertiary },
  neutralText: { color: c.onSurfaceTertiary },
}));

export function Badge({
  label,
  tone = "neutral",
  testID,
}: {
  label: string;
  tone?: Tone;
  testID?: string;
}) {
  const s = useBadgeStyles();
  return (
    <View style={[s.base, s[tone]]} testID={testID}>
      <Text style={[s.text, s[`${tone}Text` as const]]}>{label}</Text>
    </View>
  );
}

// ---- Avatar (initials) ----------------------------------------------------
const useAvatarStyles = makeStyles(() => ({
  base: { alignItems: "center", justifyContent: "center" },
  text: { color: "#FFFFFF", fontWeight: "700" },
}));

function initials(name: string): string {
  const parts = name.replace(/^(Mr|Mrs|Ms|Dr)\.?\s+/i, "").split(" ");
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

export function Avatar({
  name,
  index = 0,
  size = 44,
}: {
  name: string;
  index?: number;
  size?: number;
}) {
  const s = useAvatarStyles();
  const bg = avatarPalette[index % avatarPalette.length];
  return (
    <View
      style={[
        s.base,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bg },
      ]}
    >
      <Text style={[s.text, { fontSize: size * 0.38 }]}>{initials(name)}</Text>
    </View>
  );
}

// ---- Section header -------------------------------------------------------
const useSectionStyles = makeStyles((c) => ({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  title: { fontSize: 16, fontWeight: "700", color: c.onSurface },
  action: { fontSize: 13, fontWeight: "600", color: c.brandPrimary },
}));

export function SectionHeader({
  title,
  actionLabel,
  onAction,
  testID,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  testID?: string;
}) {
  const s = useSectionStyles();
  return (
    <View style={s.row} testID={testID}>
      <Text style={s.title}>{title}</Text>
      {actionLabel ? (
        <Text style={s.action} onPress={onAction} testID={`${testID}-action`}>
          {actionLabel}
        </Text>
      ) : null}
    </View>
  );
}

// ---- Stat / progress bar --------------------------------------------------
const useStatBarStyles = makeStyles((c) => ({
  track: {
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: c.surfaceTertiary,
    overflow: "hidden",
  },
  fill: { height: "100%", borderRadius: radius.pill },
}));

export function StatBar({
  value,
  max,
  color,
}: {
  value: number;
  max: number;
  color: string;
}) {
  const s = useStatBarStyles();
  const ratio = max > 0 ? Math.min(value / max, 1) : 0;
  return (
    <View style={s.track}>
      <View style={[s.fill, { width: `${ratio * 100}%`, backgroundColor: color }]} />
    </View>
  );
}
