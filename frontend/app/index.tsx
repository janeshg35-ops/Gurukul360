import { Redirect } from "expo-router";
import { View } from "react-native";

import { LoadingView } from "@/src/components/ui/feedback";
import { useAuth } from "@/src/context/auth";
import { useData } from "@/src/data/store";
import { useTheme } from "@/src/theme";

export default function Index() {
  const { user, ready: authReady } = useAuth();
  const { ready: dataReady } = useData();
  const { colors } = useTheme();

  if (!authReady || !dataReady) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.surface }}>
        <LoadingView label="Loading Gurukul360\u2026" />
      </View>
    );
  }

  return <Redirect href={user ? "/(tabs)" : "/login"} />;
}
