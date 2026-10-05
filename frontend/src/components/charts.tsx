import React from "react";
import { Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

import { makeStyles, spacing, useTheme } from "@/src/theme";

export interface DonutSegment {
  value: number;
  color: string;
}

// Donut chart built on react-native-svg (reliable in Expo Go).
export function DonutChart({
  segments,
  size = 140,
  strokeWidth = 18,
  centerTop,
  centerBottom,
}: {
  segments: DonutSegment[];
  size?: number;
  strokeWidth?: number;
  centerTop?: string;
  centerBottom?: string;
}) {
  const { colors } = useTheme();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce((s, seg) => s + seg.value, 0);

  let offset = 0;
  const arcs =
    total === 0
      ? []
      : segments
          .filter((s) => s.value > 0)
          .map((seg, i) => {
            const len = (seg.value / total) * circumference;
            const dash = `${len} ${circumference - len}`;
            const el = (
              <Circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={seg.color}
                strokeWidth={strokeWidth}
                strokeDasharray={dash}
                strokeDashoffset={-offset}
                fill="none"
                strokeLinecap="butt"
              />
            );
            offset += len;
            return el;
          });

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: "-90deg" }] }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.surfaceTertiary}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {arcs}
      </Svg>
      {(centerTop || centerBottom) && (
        <View
          style={{
            ...StyleSheetAbsoluteFill,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {centerTop ? <DonutCenterTop text={centerTop} /> : null}
          {centerBottom ? <DonutCenterBottom text={centerBottom} /> : null}
        </View>
      )}
    </View>
  );
}

const StyleSheetAbsoluteFill = {
  position: "absolute" as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};

const useCenterStyles = makeStyles((c) => ({
  top: { fontSize: 22, fontWeight: "800", color: c.onSurface },
  bottom: { fontSize: 11, color: c.muted, fontWeight: "600" },
}));
function DonutCenterTop({ text }: { text: string }) {
  const s = useCenterStyles();
  return <Text style={s.top}>{text}</Text>;
}
function DonutCenterBottom({ text }: { text: string }) {
  const s = useCenterStyles();
  return <Text style={s.bottom}>{text}</Text>;
}

/** Compact ring for an existing 0–100 percentage. Does not compute a new figure. */
export function ProgressRing({
  value,
  size = 36,
  strokeWidth = 4,
  color,
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
  color: string;
}) {
  const { colors } = useTheme();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(value, 100));
  const len = (pct / 100) * circumference;
  return (
    <Svg width={size} height={size} style={{ transform: [{ rotate: "-90deg" }] }}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={colors.surfaceTertiary}
        strokeWidth={strokeWidth}
        fill="none"
      />
      {pct > 0 ? (
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${len} ${circumference - len}`}
          strokeLinecap="round"
          fill="none"
        />
      ) : null}
    </Svg>
  );
}

// ---- Vertical bar chart (View-based) -------------------------------------
export interface BarDatum {
  label: string;
  value: number;
  color?: string;
}

const useBarStyles = makeStyles((c) => ({
  wrap: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: spacing.sm },
  col: { flex: 1, alignItems: "center", gap: spacing.xs },
  barArea: { width: "100%", alignItems: "center", justifyContent: "flex-end" },
  bar: { width: "70%", borderTopLeftRadius: 4, borderTopRightRadius: 4, minHeight: 4 },
  value: { fontSize: 11, fontWeight: "700", color: c.onSurface },
  label: { fontSize: 10, color: c.muted, fontWeight: "600" },
}));

export function BarChart({
  data,
  height = 120,
  maxValue = 100,
}: {
  data: BarDatum[];
  height?: number;
  maxValue?: number;
}) {
  const s = useBarStyles();
  const { colors } = useTheme();
  return (
    <View style={s.wrap}>
      {data.map((d, i) => {
        const h = Math.max((d.value / maxValue) * height, 4);
        return (
          <View key={i} style={s.col}>
            <Text style={s.value}>{Math.round(d.value)}</Text>
            <View style={[s.barArea, { height }]}>
              <View
                style={[s.bar, { height: h, backgroundColor: d.color ?? colors.brandSecondary }]}
              />
            </View>
            <Text style={s.label} numberOfLines={1}>
              {d.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

// ---- Legend ---------------------------------------------------------------
const useLegendStyles = makeStyles((c) => ({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  dot: { width: 10, height: 10, borderRadius: 5 },
  label: { fontSize: 13, color: c.onSurfaceSecondary, fontWeight: "500" },
  value: { fontSize: 13, color: c.onSurface, fontWeight: "700", marginLeft: "auto" },
}));

export function LegendRow({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: string;
}) {
  const s = useLegendStyles();
  return (
    <View style={s.row}>
      <View style={[s.dot, { backgroundColor: color }]} />
      <Text style={s.label}>{label}</Text>
      <Text style={s.value}>{value}</Text>
    </View>
  );
}
