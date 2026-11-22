import { Tabs } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { UrezaIcon, type IconName } from "@/components/UrezaIcon";
import { colors } from "@/constants/ureza";
import { useProfili, type Roli } from "@/lib/profili";

// The signed-in app. Each role sees its own tabs:
//   Klient: Ballina, Pronat, Harta, Oda, Profili   (the five tabs of the design)
//   Miku:   Kërkesat, Harta, Profili
//   Admin:  Paneli, Profili
export const unstable_settings = { anchor: "ballina" };

function tab(label: string, icon: IconName, roleteQeShohin: Roli[], roli: Roli) {
  return {
    title: label,
    // `href: null` hides the tab button for the other roles
    href: roleteQeShohin.includes(roli) ? undefined : null,
    tabBarLabel: ({ focused }: { focused: boolean }) => (
      <Text style={[styles.label, focused && styles.labelActive]}>{label}</Text>
    ),
    tabBarIcon: ({ focused }: { focused: boolean }) => (
      <View style={[styles.pill, focused && styles.pillActive]}>
        <UrezaIcon name={icon} size={24} color={focused ? colors.petrol : colors.textSecondary} strokeWidth={focused ? 2.2 : 2} />
      </View>
    ),
  };
}

export default function AppTabs() {
  const insets = useSafeAreaInsets();
  const { profili } = useProfili();
  const roli: Roli = profili?.roli ?? "klient";

  return (
    <Tabs
      backBehavior={roli === "klient" ? "firstRoute" : "none"}
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: "#E3EAF0",
          borderTopWidth: 1,
          height: 64 + insets.bottom,
          paddingTop: 8,
          paddingBottom: insets.bottom,
        },
        tabBarItemStyle: { minHeight: 52 },
      }}
    >
      <Tabs.Screen name="ballina" options={tab("Ballina", "home", ["klient"], roli)} />
      <Tabs.Screen name="miku" options={tab("Kërkesat", "list", ["miku"], roli)} />
      <Tabs.Screen name="admini" options={tab("Paneli", "shield", ["admin"], roli)} />
      <Tabs.Screen name="pronat" options={tab("Pronat", "key", ["klient"], roli)} />
      <Tabs.Screen name="harta" options={tab("Harta", "map", ["klient", "miku", "admin"], roli)} />
      <Tabs.Screen name="oda" options={tab("Oda", "list", ["klient"], roli)} />
      <Tabs.Screen name="profili" options={tab("Profili", "user", ["klient", "miku", "admin"], roli)} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  label: { color: colors.textSecondary, fontSize: 12, fontWeight: "600" },
  labelActive: { color: colors.petrol, fontWeight: "800" },
  pill: { width: 56, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  pillActive: { backgroundColor: "#E8F5F3" },
});
