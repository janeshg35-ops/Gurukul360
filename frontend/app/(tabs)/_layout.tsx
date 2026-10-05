import { Tabs } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { CalendarCheck, House, Student, Wallet } from "phosphor-react-native";
import type { IconProps } from "phosphor-react-native";
import { Platform } from "react-native";

import { usesNativeTabs } from "@/src/constants/navigation";
import { useTheme } from "@/src/theme";

type PhosphorIcon = React.ComponentType<IconProps>;

const TABS: {
  name: string;
  title: string;
  sf: string;
  icon: PhosphorIcon;
}[] = [
  { name: "index", title: "Home", sf: "house.fill", icon: House },
  { name: "students", title: "Students", sf: "person.3.fill", icon: Student },
  { name: "attendance", title: "Attendance", sf: "calendar.badge.checkmark", icon: CalendarCheck },
  { name: "fees", title: "Fees", sf: "creditcard.fill", icon: Wallet },
];

export default function TabsLayout() {
  const { colors } = useTheme();

  if (usesNativeTabs) {
    return (
      <NativeTabs>
        {TABS.map((t) => (
          <NativeTabs.Trigger key={t.name} name={t.name}>
            <NativeTabs.Trigger.Icon sf={t.sf as never} />
            <NativeTabs.Trigger.Label>{t.title}</NativeTabs.Trigger.Label>
          </NativeTabs.Trigger>
        ))}
      </NativeTabs>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brandPrimary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          ...(Platform.OS === "web" ? { height: 64 } : {}),
        },
        tabBarItemStyle: { alignSelf: "center" },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      {TABS.map((t) => (
        <Tabs.Screen
          key={t.name}
          name={t.name}
          options={{
            title: t.title,
            tabBarIcon: ({ color, focused }) => (
              <t.icon size={24} color={color as string} weight={focused ? "fill" : "regular"} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
