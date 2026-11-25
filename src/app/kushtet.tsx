import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { EkraniMeHero } from "@/components/EkraniMeHero";
import { UrezaIcon } from "@/components/UrezaIcon";
import { colors } from "@/constants/ureza";
import { CMIMI_TEKST, KUSHTET, KUSHTET_VERSIONI } from "@/lib/kushtet";
import { dataEPlote } from "@/lib/vizitat";

// "Kushtet e vizitës": what a visit includes, the price, who is responsible, what Urëza is not
// responsible for, the written consent and privacy. Opened from the request form, Ballina and Profili.
export default function Kushtet() {
  const router = useRouter();

  return (
    <EkraniMeHero
      kicker="URËZA"
      title="Kushtet"
      subtitle={`${CMIMI_TEKST} për vizitë · pa surpriza.`}
      kthehu={{ etiketa: "Mbrapa", onPress: () => router.back() }}
    >
      <View style={styles.cmimi}>
        <View>
          <Text style={styles.cmimiKicker}>ÇMIMI PËR VIZITË</Text>
          <Text style={styles.cmimiVlera}>{CMIMI_TEKST}</Text>
        </View>
        <View style={styles.cmimiPikat}>
          <Pika tekst="GPS + foto + zë" />
          <Pika tekst="Raport me shkrim" />
          <Pika tekst="E drejta për kundërshtim" />
        </View>
      </View>

      {KUSHTET.map((s) => (
        <View key={s.titulli} style={styles.karta}>
          <View style={styles.krye}>
            <View style={styles.ikona}>
              <UrezaIcon name={s.ikona} size={20} color={colors.teal} strokeWidth={2.2} />
            </View>
            <Text style={styles.titulli} accessibilityRole="header">
              {s.titulli}
            </Text>
          </View>
          {s.pikat.map((p) => (
            <View key={p} style={styles.pika}>
              <View style={styles.pikaShenja} />
              <Text style={styles.pikaTeksti}>{p}</Text>
            </View>
          ))}
        </View>
      ))}

      <Text style={styles.versioni}>Versioni i kushteve: {dataEPlote(KUSHTET_VERSIONI)}</Text>
    </EkraniMeHero>
  );
}

function Pika({ tekst }: { tekst: string }) {
  return (
    <View style={styles.cmimiPika}>
      <UrezaIcon name="check" size={14} color={colors.mint} strokeWidth={2.8} />
      <Text style={styles.cmimiPikaTeksti}>{tekst}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  cmimi: {
    backgroundColor: colors.hero,
    borderRadius: 22,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  cmimiKicker: { color: colors.mint, fontSize: 11, fontWeight: "800", letterSpacing: 1.4 },
  cmimiVlera: { color: colors.white, fontSize: 40, lineHeight: 46, fontWeight: "800" },
  cmimiPikat: { gap: 6, flexShrink: 1 },
  cmimiPika: { flexDirection: "row", alignItems: "center", gap: 6 },
  cmimiPikaTeksti: { color: colors.onHeroText, fontSize: 13, fontWeight: "600", flexShrink: 1 },
  karta: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 16,
    gap: 10,
    shadowColor: "#0B2530",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  krye: { flexDirection: "row", alignItems: "center", gap: 12 },
  ikona: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#E8F5F3",
    alignItems: "center",
    justifyContent: "center",
  },
  titulli: { flex: 1, color: colors.ink, fontSize: 17, lineHeight: 22, fontWeight: "800" },
  pika: { flexDirection: "row", gap: 10, paddingLeft: 4 },
  pikaShenja: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.teal, marginTop: 8 },
  pikaTeksti: { flex: 1, color: colors.textSecondary, fontSize: 15, lineHeight: 22, fontWeight: "500" },
  versioni: { color: colors.textSecondary, fontSize: 13, textAlign: "center" },
});
