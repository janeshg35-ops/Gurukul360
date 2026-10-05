import React from "react";
import { Text, View, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Logo } from "@/src/components/ui/primitives";
import { makeStyles, spacing } from "@/src/theme";

const TITLES = new Set(["mr", "mrs", "ms", "miss", "dr"]);

export function givenName(fullName: string): string {
  const parts = fullName.replace(/\./g, "").split(/\s+/).filter(Boolean);
  const named = parts.filter((part) => !TITLES.has(part.toLowerCase()));
  return named[0] || fullName;
}

export function dayGreeting(fullName: string): string {
  const hour = new Date().getHours();
  const part = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  return `${part}, ${givenName(fullName)}`;
}

export const cardShadow = {
  shadowColor: "#0F172A",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 2,
} as const;

export function pressedStyle(pressed: boolean): ViewStyle | undefined {
  return pressed ? { opacity: 0.9, transform: [{ scale: 0.985 }] } : undefined;
}

const useStyles = makeStyles((c) => ({
  wrap: { backgroundColor: c.ink, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  logoPlate: {
    backgroundColor: c.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 10,
  },
  greetRow: { flexDirection: "row", alignItems: "center", marginTop: spacing.md, gap: spacing.md },
  greetCopy: { flex: 1 },
  greeting: { color: c.onInk, fontSize: 22, fontWeight: "800" },
  role: { color: "#E5E7EB", fontSize: 13, fontWeight: "600", marginTop: 2, lineHeight: 18 },
  mark: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  right: { flexDirection: "row", alignItems: "center" },
  section: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.xs },
  sectionBar: { width: 3, height: 16, borderRadius: 2, backgroundColor: c.brandPrimary },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: c.onSurface },
}));

export function DashboardHeader({
  greeting,
  role,
  right,
  mark,
}: {
  greeting: string;
  role: string;
  right?: React.ReactNode;
  mark?: React.ReactNode;
}) {
  const s = useStyles();
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.wrap, { paddingTop: insets.top + spacing.sm }]}>
      <View style={s.top}>
        <View style={s.logoPlate}>
          <Logo width={104} />
        </View>
        <View style={s.right}>{right}</View>
      </View>
      <View style={s.greetRow}>
        <View style={s.greetCopy}>
          <Text style={s.greeting} numberOfLines={1}>
            {greeting}
          </Text>
          <Text style={s.role} numberOfLines={2}>
            {role}
          </Text>
        </View>
        {mark ? <View style={s.mark}>{mark}</View> : null}
      </View>
    </View>
  );
}

export function DashboardSection({ title }: { title: string }) {
  const s = useStyles();
  return (
    <View style={s.section}>
      <View style={s.sectionBar} />
      <Text style={s.sectionTitle}>{title}</Text>
    </View>
  );
}
