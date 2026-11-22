import { Tabs } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { UrezaIcon, type IconName } from "@/components/UrezaIcon";
import { colors } from "@/constants/ureza";
import { faqjaLejohet } from "@/lib/faqet";
import { useProfili, type Roli } from "@/lib/profili";

// The signed-in app. Each role sees its own tabs:
//   Klient: Ballina, Pronat, Harta, Oda, Profili   (the five tabs of the design)
//   Miku:   Kërkesat, Harta, Profili
//   Admin:  Paneli, Profili
export const unstable_settings = { anchor: "ballina" };

// The roles that see each tab come from ROLET_E_FAQES (src/lib/faqet.ts), the same list the root
// layout uses to send a user away from another role's screen.
function tab(label: string, icon: IconName, faqja: string, roli: Roli) {
  return {
    title: label,
    // `href: null` hides the tab button for the other roles
    href: faqjaLejohet(roli, faqja) ? undefined : null,
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
      <Tabs.Screen name="ballina" options={tab("Ballina", "home", "/ballina", roli)} />
      <Tabs.Screen name="miku" options={tab("Kërkesat", "list", "/miku", roli)} />
      <Tabs.Screen name="admini" options={tab("Paneli", "shield", "/admini", roli)} />
      <Tabs.Screen name="pronat" options={tab("Pronat", "key", "/pronat", roli)} />
      <Tabs.Screen name="harta" options={tab("Harta", "map", "/harta", roli)} />
      <Tabs.Screen name="oda" options={tab("Oda", "list", "/oda", roli)} />
      <Tabs.Screen name="profili" options={tab("Profili", "user", "/profili", roli)} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  label: { color: colors.textSecondary, fontSize: 12, fontWeight: "600" },
  labelActive: { color: colors.petrol, fontWeight: "800" },
  pill: { width: 56, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  pillActive: { backgroundColor: "#E8F5F3" },
});
