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
    tabBarAccessibilityLabel: label,
    // the icon and its word sit together in one capsule; the active tab tints both, so the
    // word is never left behind under the icon
    tabBarIcon: ({ focused }: { focused: boolean }) => (
      <View style={[styles.kapsula, focused && styles.kapsulaAktive]}>
        <UrezaIcon
          name={icon}
          size={22}
          color={focused ? colors.petrol : colors.textSecondary}
          strokeWidth={focused ? 2.4 : 2}
        />
        <Text style={[styles.label, focused && styles.labelActive]} numberOfLines={1}>
          {label}
        </Text>
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
        sceneStyle: { backgroundColor: colors.background },
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopWidth: 0,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          height: 72 + insets.bottom,
          paddingTop: 8,
          paddingBottom: insets.bottom,
          shadowColor: "#0B2530",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 16,
          elevation: 12,
        },
        tabBarShowLabel: false,
        tabBarItemStyle: { minHeight: 56 },
        tabBarIconStyle: { width: "100%", height: 56 },
      }}
    >
      <Tabs.Screen name="ballina" options={tab("Ballina", "home", "/ballina", roli)} />
      <Tabs.Screen name="miku" options={tab("Kërkesat", "list", "/miku", roli)} />
      <Tabs.Screen name="admini" options={tab("Paneli", "shield", "/admini", roli)} />
      <Tabs.Screen name="pronat" options={tab("Pronat", "houses", "/pronat", roli)} />
      <Tabs.Screen name="harta" options={tab("Harta", "map", "/harta", roli)} />
      <Tabs.Screen name="oda" options={tab("Oda", "book", "/oda", roli)} />
      <Tabs.Screen name="profili" options={tab("Profili", "user", "/profili", roli)} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  kapsula: {
    minWidth: 64,
    height: 54,
    paddingHorizontal: 8,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  kapsulaAktive: { backgroundColor: colors.ikonaBg },
  label: { color: colors.textSecondary, fontSize: 11, fontWeight: "600" },
  labelActive: { color: colors.petrol, fontWeight: "800" },
});
