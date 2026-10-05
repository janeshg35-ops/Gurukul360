import { CaretRight } from "phosphor-react-native";
import type { IconProps } from "phosphor-react-native";
import React from "react";
import { Pressable, Text, View } from "react-native";

import { ProgressRing } from "@/src/components/charts";
import { pressedStyle } from "@/src/components/dashboard-header";
import { makeStyles, radius, spacing } from "@/src/theme";

type PhosphorIcon = React.ComponentType<IconProps>;

// ---- KPI summary card (2-col grid) ---------------------------------------
const useKpiStyles = makeStyles((c) => ({
  card: {
    backgroundColor: c.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: c.border,
    padding: spacing.md,
    gap: spacing.sm,
    flex: 1,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  value: { fontSize: 20, fontWeight: "800", color: c.onSurface },
  label: { fontSize: 13, color: c.onSurfaceSecondary, fontWeight: "600" },
  sub: { fontSize: 12, fontWeight: "600" },
}));

export function KpiCard({
  icon: Icon,
  iconColor,
  iconBg,
  value,
  label,
  sub,
  subColor,
  progress,
  onPress,
  testID,
}: {
  icon: PhosphorIcon;
  iconColor: string;
  iconBg: string;
  value: string;
  label: string;
  sub?: string;
  subColor?: string;
  /** Existing 0–100 figure drawn as a ring. Omit when there is nothing to show. */
  progress?: number;
  onPress?: () => void;
  testID?: string;
}) {
  const s = useKpiStyles();
  return (
    <Pressable
      style={({ pressed }) => [s.card, onPress ? pressedStyle(pressed) : undefined]}
      onPress={onPress}
      testID={testID}
    >
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <View style={[s.iconWrap, { backgroundColor: iconBg }]}>
          <Icon size={22} color={iconColor} weight="fill" />
        </View>
        {typeof progress === "number" ? (
          <ProgressRing value={progress} size={34} strokeWidth={4} color={iconColor} />
        ) : null}
      </View>
      <Text style={s.value} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={s.label}>{label}</Text>
      {sub ? <Text style={[s.sub, { color: subColor }]}>{sub}</Text> : null}
    </Pressable>
  );
}

// ---- Nav tile (quick access grid) ----------------------------------------
const useTileStyles = makeStyles((c) => ({
  tile: {
    backgroundColor: c.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: c.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
    minHeight: 84,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  label: { fontSize: 12, fontWeight: "700", color: c.onSurface, textAlign: "center" },
}));

export function NavTile({
  icon: Icon,
  iconColor,
  iconBg,
  label,
  onPress,
  testID,
}: {
  icon: PhosphorIcon;
  iconColor: string;
  iconBg: string;
  label: string;
  onPress: () => void;
  testID?: string;
}) {
  const s = useTileStyles();
  return (
    <Pressable
      style={({ pressed }) => [s.tile, pressedStyle(pressed)]}
      onPress={onPress}
      testID={testID}
    >
      <View style={[s.iconWrap, { backgroundColor: iconBg }]}>
        <Icon size={24} color={iconColor} weight="fill" />
      </View>
      <Text style={s.label}>{label}</Text>
    </Pressable>
  );
}

// ---- List row with chevron ------------------------------------------------
const useRowStyles = makeStyles((c) => ({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  body: { flex: 1, gap: 2 },
  title: { fontSize: 15, fontWeight: "700", color: c.onSurface },
  subtitle: { fontSize: 13, color: c.muted },
}));

export function ListRow({
  leading,
  title,
  subtitle,
  trailing,
  onPress,
  showChevron = true,
  testID,
}: {
  leading?: React.ReactNode;
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
  onPress?: () => void;
  showChevron?: boolean;
  testID?: string;
}) {
  const s = useRowStyles();
  return (
    <Pressable
      style={({ pressed }) => [s.row, pressed && onPress && { opacity: 0.7 }]}
      onPress={onPress}
      testID={testID}
    >
      {leading}
      <View style={s.body}>
        <Text style={s.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={s.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing}
      {showChevron && onPress ? <ChevronMuted /> : null}
    </Pressable>
  );
}

function ChevronMuted() {
  return <CaretRight size={16} color="#9CA3AF" weight="bold" />;
}
