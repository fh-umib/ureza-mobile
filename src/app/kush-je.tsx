import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text } from "react-native";

import { EkraniMeHero } from "@/components/EkraniMeHero";
import { UrezaIcon } from "@/components/UrezaIcon";
import { ZgjedhesiIRolit } from "@/components/ZgjedhesiIRolit";
import { colors, font } from "@/constants/ureza";
import { useProfili } from "@/lib/profili";

// "Kush je ti?" (design: Roli): the first step after the welcome screen. The role chosen
// here decides how the next screen reads ("Po hyn si Miku") and which side of the app the
// account opens on after signing in.
export default function KushJe() {
  const router = useRouter();
  const { deklarimi, deklaroRolin } = useProfili();
  const roli = deklarimi?.roli ?? "klient";

  function vazhdo() {
    deklaroRolin(roli); // also saves the default (Klient) when nothing was tapped
    router.push("/hyrja");
  }

  return (
    <EkraniMeHero
      kicker="ZGJIDH ROLIN"
      title="Kush je ti?"
      subtitle="Zgjidh rolin për ta provuar Urëzën."
      kthehu={{ etiketa: "Mbrapa", onPress: () => router.back() }}
    >
      <ZgjedhesiIRolit roli={roli} onZgjidh={deklaroRolin} />

      <Pressable style={styles.primary} onPress={vazhdo} accessibilityRole="button">
        <Text style={styles.primaryText}>Vazhdo te kyçja</Text>
        <UrezaIcon name="arrow" size={22} color={colors.white} strokeWidth={2.3} />
      </Pressable>
    </EkraniMeHero>
  );
}

const styles = StyleSheet.create({
  primary: {
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.petrol,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryText: { color: colors.white, fontSize: 17, fontFamily: font.w700 },
});
