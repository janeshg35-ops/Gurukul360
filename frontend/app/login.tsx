import { useRouter } from "expo-router";
import { Eye, EyeSlash, Lock, User } from "phosphor-react-native";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PrimaryButton } from "@/src/components/ui/controls";
import { Logo } from "@/src/components/ui/primitives";
import { PRODUCT, PRINCIPAL_CREDENTIALS, TEACHER_DEMO_PASSWORD } from "@/src/constants/branding";
import { useAuth } from "@/src/context/auth";
import { useData } from "@/src/data/store";
import { makeStyles, radius, spacing, useTheme } from "@/src/theme";

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.ink },
  scroll: { flexGrow: 1 },
  hero: { alignItems: "center", paddingTop: spacing["2xl"], paddingBottom: spacing.xl, gap: spacing.md },
  logoPlate: {
    backgroundColor: c.surface,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
  },
  product: { color: c.onInk, fontSize: 26, fontWeight: "800", letterSpacing: 0.2 },
  subtitle: { color: "#9CA3AF", fontSize: 13, fontWeight: "500" },
  sheet: {
    flex: 1,
    backgroundColor: c.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    gap: spacing.lg,
  },
  heading: { fontSize: 20, fontWeight: "800", color: c.onSurface },
  headingSub: { fontSize: 14, color: c.muted, marginTop: 2 },
  field: { gap: spacing.sm },
  label: { fontSize: 13, fontWeight: "600", color: c.onSurfaceSecondary },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 52,
    backgroundColor: c.surfaceSecondary,
  },
  inputWrapFocused: { borderColor: c.brandPrimary, backgroundColor: c.surface },
  input: { flex: 1, fontSize: 15, color: c.onSurface, padding: 0 },
  errorBox: {
    backgroundColor: c.errorSoft,
    borderRadius: radius.sm,
    padding: spacing.md,
  },
  errorText: { color: c.onErrorSoft, fontSize: 13, fontWeight: "600" },
  demoNote: {
    backgroundColor: c.infoSoft,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 4,
  },
  demoTitle: { fontSize: 12, fontWeight: "700", color: c.onInfoSoft },
  demoLine: { fontSize: 12, color: c.onSurfaceTertiary },
  demoFill: { fontSize: 13, fontWeight: "700", color: c.brandPrimary, marginTop: spacing.xs },
  future: { textAlign: "center", fontSize: 12, color: c.muted, marginTop: spacing.sm },
  motto: { textAlign: "center", color: "#6B7280", fontSize: 12, fontWeight: "600", letterSpacing: 1 },
}));

export default function LoginScreen() {
  const s = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signIn } = useAuth();
  const { db, ready: dataReady } = useData();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState<"user" | "pass" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onLogin = () => {
    setError(null);
    if (!dataReady) return;
    setLoading(true);
    setTimeout(() => {
      const res = signIn(username, password, db.teachers);
      setLoading(false);
      if (res.ok) {
        router.replace(res.role === "Teacher" ? "/(teacher)" : "/(tabs)");
      } else {
        setError(res.error ?? "Login failed.");
      }
    }, 450);
  };

  return (
    <View style={s.root}>
      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.scroll}
        bottomOffset={24}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[s.hero, { paddingTop: insets.top + spacing.xl }]}>
          <View style={s.logoPlate}>
            <Logo width={150} />
          </View>
          <Text style={s.product}>{PRODUCT.trademark}</Text>
          <Text style={s.subtitle}>{PRODUCT.subtitle}</Text>
          <Text style={s.motto}>{PRODUCT.motto.toUpperCase()}</Text>
        </View>

        <View style={[s.sheet, { paddingBottom: insets.bottom + spacing.xl }]}>
          <View>
            <Text style={s.heading}>Login</Text>
          </View>

          {error ? (
            <View style={s.errorBox} testID="login-error">
              <Text style={s.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={s.field}>
            <Text style={s.label}>Username</Text>
            <View style={[s.inputWrap, focused === "user" && s.inputWrapFocused]}>
              <User size={18} color={colors.muted} weight="bold" />
              <TextInput
                value={username}
                onChangeText={setUsername}
                placeholder="Enter your username"
                placeholderTextColor={colors.muted}
                style={s.input}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                onFocus={() => setFocused("user")}
                onBlur={() => setFocused(null)}
                testID="login-username-input"
              />
            </View>
          </View>

          <View style={s.field}>
            <Text style={s.label}>Password</Text>
            <View style={[s.inputWrap, focused === "pass" && s.inputWrapFocused]}>
              <Lock size={18} color={colors.muted} weight="bold" />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                placeholderTextColor={colors.muted}
                style={s.input}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                onFocus={() => setFocused("pass")}
                onBlur={() => setFocused(null)}
                onSubmitEditing={onLogin}
                returnKeyType="go"
                testID="login-password-input"
              />
              <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8} testID="toggle-password">
                {showPassword ? (
                  <EyeSlash size={18} color={colors.muted} weight="bold" />
                ) : (
                  <Eye size={18} color={colors.muted} weight="bold" />
                )}
              </Pressable>
            </View>
          </View>

          <PrimaryButton label="Login" onPress={onLogin} loading={loading} testID="login-submit-button" />

          <View style={s.demoNote} testID="demo-credentials">
            <Text style={s.demoTitle}>Demo Principal:</Text>
            <Text style={s.demoLine}>
              {PRINCIPAL_CREDENTIALS.username} / {PRINCIPAL_CREDENTIALS.password}
            </Text>
            <Text style={[s.demoTitle, { marginTop: spacing.sm }]}>Demo Teacher:</Text>
            <Text style={s.demoLine}>Use any active teacher email / {TEACHER_DEMO_PASSWORD}</Text>
          </View>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}
