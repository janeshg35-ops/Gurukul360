import { CheckCircle, Info, Warning, XCircle } from "phosphor-react-native";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { ActivityIndicator, Animated, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { makeStyles, radius, spacing, useTheme } from "@/src/theme";

// ---- Empty state ----------------------------------------------------------
const useEmptyStyles = makeStyles((c) => ({
  wrap: { alignItems: "center", justifyContent: "center", padding: spacing["2xl"], gap: spacing.md },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: c.surfaceTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 16, fontWeight: "700", color: c.onSurface, textAlign: "center" },
  body: { fontSize: 14, color: c.muted, textAlign: "center", lineHeight: 20 },
}));

export function EmptyState({
  icon,
  title,
  message,
  testID,
}: {
  icon?: React.ReactNode;
  title: string;
  message?: string;
  testID?: string;
}) {
  const s = useEmptyStyles();
  return (
    <View style={s.wrap} testID={testID}>
      {icon ? <View style={s.iconWrap}>{icon}</View> : null}
      <Text style={s.title}>{title}</Text>
      {message ? <Text style={s.body}>{message}</Text> : null}
    </View>
  );
}

// ---- Loading --------------------------------------------------------------
const useLoadingStyles = makeStyles((c) => ({
  wrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.md, backgroundColor: c.surface },
  label: { fontSize: 14, color: c.muted },
}));

export function LoadingView({ label }: { label?: string }) {
  const s = useLoadingStyles();
  const { colors } = useTheme();
  return (
    <View style={s.wrap}>
      <ActivityIndicator size="large" color={colors.brandPrimary} />
      {label ? <Text style={s.label}>{label}</Text> : null}
    </View>
  );
}

// ---- Toast ----------------------------------------------------------------
type ToastTone = "success" | "error" | "info" | "warning";
interface ToastState {
  message: string;
  tone: ToastTone;
}
interface ToastContextValue {
  show: (message: string, tone?: ToastTone) => void;
}
const ToastContext = createContext<ToastContextValue | null>(null);

const useToastStyles = makeStyles((c) => ({
  container: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    alignItems: "center",
    zIndex: 9999,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: c.surfaceInverse,
    maxWidth: 480,
    width: "100%",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  text: { color: c.onSurfaceInverse, fontSize: 14, fontWeight: "600", flex: 1 },
}));

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const s = useToastStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastState | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(
    (message: string, tone: ToastTone = "info") => {
      setToast({ message, tone });
      if (timer.current) clearTimeout(timer.current);
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      timer.current = setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }).start(
          () => setToast(null),
        );
      }, 2600);
    },
    [opacity],
  );

  useEffect(() => () => timer.current && clearTimeout(timer.current), []);

  const iconFor = (tone: ToastTone) => {
    const props = { size: 20, weight: "fill" as const };
    if (tone === "success") return <CheckCircle {...props} color={colors.success} />;
    if (tone === "error") return <XCircle {...props} color={colors.error} />;
    if (tone === "warning") return <Warning {...props} color={colors.warning} />;
    return <Info {...props} color={colors.brandSecondary} />;
  };

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toast ? (
        <Animated.View
          pointerEvents="none"
          style={[s.container, { bottom: insets.bottom + 90, opacity }]}
        >
          <View style={s.toast} testID="app-toast">
            {iconFor(toast.tone)}
            <Text style={s.text}>{toast.message}</Text>
          </View>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
