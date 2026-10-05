import { useRouter } from "expo-router";
import { ArrowLeft } from "phosphor-react-native";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { makeStyles, spacing } from "@/src/theme";
import { Logo } from "./ui/primitives";

const useStyles = makeStyles((c) => ({
  // Dark charcoal header (brand)
  brandWrap: { backgroundColor: c.ink, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  brandTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  logoPlate: {
    backgroundColor: c.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 10,
  },
  brandTitle: { color: c.onInk, fontSize: 22, fontWeight: "800", marginTop: spacing.md },
  brandSubtitle: { color: "#9CA3AF", fontSize: 13, marginTop: 2 },
  // Plain surface header (detail screens)
  plainWrap: {
    backgroundColor: c.surface,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  plainRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -spacing.sm,
  },
  plainTitle: { fontSize: 18, fontWeight: "800", color: c.onSurface },
  plainSubtitle: { fontSize: 13, color: c.muted },
  flex: { flex: 1 },
  rightSlot: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
}));

// Charcoal branded header for top-level tab screens (shows the MYTECH logo mark).
export function BrandHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  const s = useStyles();
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.brandWrap, { paddingTop: insets.top + spacing.sm }]}>
      <View style={s.brandTop}>
        <View style={s.logoPlate}>
          <Logo width={96} />
        </View>
        <View style={s.rightSlot}>{right}</View>
      </View>
      <Text style={s.brandTitle}>{title}</Text>
      {subtitle ? <Text style={s.brandSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

// Plain header with back button for detail/stack screens.
export function StackHeader({
  title,
  subtitle,
  right,
  onBack,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onBack?: () => void;
}) {
  const s = useStyles();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  return (
    <View style={[s.plainWrap, { paddingTop: insets.top + spacing.sm }]}>
      <View style={s.plainRow}>
        <Pressable
          style={({ pressed }) => [s.back, pressed && { opacity: 0.6 }]}
          onPress={onBack ?? (() => router.back())}
          hitSlop={8}
          testID="header-back-button"
        >
          <ArrowLeft size={22} color="#111827" weight="bold" />
        </Pressable>
        <View style={s.flex}>
          <Text style={s.plainTitle} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={s.plainSubtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {right ? <View style={s.rightSlot}>{right}</View> : null}
      </View>
    </View>
  );
}
