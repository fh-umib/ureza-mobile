import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { colors, font } from "@/constants/ureza";
import type { Statusi } from "@/lib/vizitat";

import { HapatEVizites } from "./HapatEVizites";
import { Ikona, type EmriIIkones } from "./Ikona";
import { StatusiChip } from "./StatusiChip";

// The top of a visit, in the order trust is built (like Papa, Honor, Uber): first WHO comes
// (the Miku, verified or not), then WHAT is happening now (one live sentence and the steps),
// then the PROOF (GPS, photos, voice), each opening the evidence.

function inicialet(emri: string): string {
  const fjalet = emri.trim().split(/\s+/).filter(Boolean);
  if (fjalet.length >= 2) return (fjalet[0][0] + fjalet[1][0]).toUpperCase();
  return (fjalet[0]?.[0] ?? "?").toUpperCase();
}

// Who comes to the property. Before a Miku accepts, the card says that one is being looked for.
export function KartaEMikut({ emri, verifikuar }: { emri: string | null; verifikuar: boolean | null }) {
  if (!emri) {
    return (
      <View style={styles.karta} accessible accessibilityLabel="Ende pa Miku. Kërkesa pret që një Miku ta pranojë.">
        <View style={[styles.avatar, styles.avatarBosh]}>
          <Ikona emri="koha" madhesia={26} ngjyra={colors.kujdes} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.etiketa}>MIKU</Text>
          <Text style={styles.emri}>Po kërkohet një Miku</Text>
          <Text style={styles.nen}>Vetëm Mikutë e verifikuar nga ekipi e shohin kërkesën.</Text>
        </View>
      </View>
    );
  }
  return (
    <View
      style={styles.karta}
      accessible
      accessibilityLabel={`Miku: ${emri}${verifikuar ? ", i verifikuar nga Urëza" : ""}`}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarTeksti}>{inicialet(emri)}</Text>
        {verifikuar ? (
          <View style={styles.avatarShenja}>
            <Ikona emri="miratuar" madhesia={14} ngjyra={colors.white} />
          </View>
        ) : null}
      </View>
      <View style={styles.flex}>
        <Text style={styles.etiketa}>MIKU YT</Text>
        <Text style={styles.emri} numberOfLines={1}>
          {emri}
        </Text>
        {verifikuar ? (
          <View style={styles.distinktiv}>
            <Ikona emri="miratuar" madhesia={13} ngjyra={colors.ok} />
            <Text style={styles.distinktivTeksti}>I verifikuar nga Urëza</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

// A small dot that breathes while the Miku is at the property; still for "reduce motion".
function PikaEGjalle() {
  const paLevizje = useReducedMotion();
  const v = useSharedValue(1);
  useEffect(() => {
    if (paLevizje) return;
    v.value = withRepeat(withTiming(0.25, { duration: 900 }), -1, true);
  }, [paLevizje, v]);
  const stili = useAnimatedStyle(() => ({ opacity: v.value }));
  return (
    <View style={styles.pikaKuti}>
      <Animated.View style={[styles.pikaHalo, stili]} />
      <View style={styles.pika} />
    </View>
  );
}

// What is happening now: one sentence, the state chip, and the four steps.
export function StatusiIGjalle({ statusi, teksti }: { statusi: Statusi; teksti: string }) {
  const tani = statusi === "vizita";
  return (
    <View style={styles.statusi}>
      <View style={styles.statusiKrye}>
        {tani ? <PikaEGjalle /> : null}
        <Text style={styles.etiketa}>{tani ? "TANI" : "GJENDJA"}</Text>
        <View style={styles.flex} />
        <StatusiChip statusi={statusi} />
      </View>
      <Text style={styles.statusiTeksti} accessibilityLiveRegion="polite">
        {teksti}
      </Text>
      <View style={styles.hapat}>
        <HapatEVizites statusi={statusi} />
      </View>
    </View>
  );
}

const DESHMITE: { ikona: EmriIIkones; emri: string; nen: string }[] = [
  { ikona: "gps", emri: "GPS", nen: "Vendi dhe ora" },
  { ikona: "foto", emri: "Foto", nen: "Nga kamera" },
  { ikona: "ze", emri: "Zë", nen: "Shënim zanor" },
];

// The three proofs. Once sent, each tile opens the evidence; before that they show what will come.
export function DeshmiteShkurt({ gati, onHap }: { gati: boolean; onHap: () => void }) {
  return (
    <View style={styles.deshmiteKarta}>
      <View style={styles.deshmiteKrye}>
        <Text style={styles.deshmiteTitulli}>Dëshmitë</Text>
        {gati ? (
          <Pressable onPress={onHap} style={styles.lidhja} accessibilityRole="link" accessibilityLabel="Shiko dëshmitë">
            <Text style={styles.lidhjaTeksti}>Shiko</Text>
            <Ikona emri="shigjeta" madhesia={14} ngjyra={colors.petrol} />
          </Pressable>
        ) : null}
      </View>
      <View style={styles.pllakat}>
        {DESHMITE.map((d) => (
          <Pressable
            key={d.emri}
            onPress={gati ? onHap : undefined}
            disabled={!gati}
            style={({ pressed }) => [styles.pllaka, !gati && styles.pllakaPritje, pressed && styles.shtypur]}
            accessibilityRole={gati ? "button" : undefined}
            accessibilityLabel={gati ? `${d.emri}: hap dëshminë` : `${d.emri}: vjen pas vizitës`}
          >
            <View style={[styles.pllakaIkona, gati ? styles.pllakaIkonaGati : null]}>
              <Ikona emri={d.ikona} madhesia={20} ngjyra={gati ? colors.white : colors.textSecondary} />
            </View>
            <Text style={styles.pllakaEmri}>{d.emri}</Text>
            <Text style={styles.pllakaNen}>{gati ? d.nen : "Pas vizitës"}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const hija = {
  shadowColor: "#0B2530",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.07,
  shadowRadius: 12,
  elevation: 2,
};

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  shtypur: { opacity: 0.85, transform: [{ scale: 0.97 }] },
  etiketa: { color: colors.teal, fontSize: 11, lineHeight: 15, fontFamily: font.w800, letterSpacing: 1.4 },

  // the Miku
  karta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: colors.white,
    borderRadius: 22,
    padding: 16,
    ...hija,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.petrol,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarBosh: { backgroundColor: colors.kujdesBg },
  avatarTeksti: { color: colors.white, fontSize: 24, fontFamily: font.w800 },
  avatarShenja: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.ok,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.white,
  },
  emri: { color: colors.ink, fontSize: 19, lineHeight: 25, fontFamily: font.w800 },
  nen: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, fontFamily: font.w500 },
  distinktiv: {
    alignSelf: "flex-start",
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    height: 26,
    paddingHorizontal: 10,
    borderRadius: 13,
    backgroundColor: colors.okBg,
  },
  distinktivTeksti: { color: colors.ok, fontSize: 12, fontFamily: font.w800 },

  // live state
  statusi: { backgroundColor: colors.white, borderRadius: 22, padding: 16, gap: 10, ...hija },
  statusiKrye: { flexDirection: "row", alignItems: "center", gap: 8 },
  statusiTeksti: { color: colors.ink, fontSize: 17, lineHeight: 25, fontFamily: font.w600 },
  hapat: { marginTop: 4 },
  pikaKuti: { width: 14, height: 14, alignItems: "center", justifyContent: "center" },
  pikaHalo: { position: "absolute", width: 14, height: 14, borderRadius: 7, backgroundColor: colors.amber },
  pika: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.kujdes },

  // proofs
  deshmiteKarta: { backgroundColor: colors.white, borderRadius: 22, padding: 16, gap: 12, ...hija },
  deshmiteKrye: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  deshmiteTitulli: { color: colors.ink, fontSize: 18, lineHeight: 24, fontFamily: font.w800 },
  lidhja: { flexDirection: "row", alignItems: "center", gap: 2, minHeight: 44 },
  lidhjaTeksti: { color: colors.petrol, fontSize: 14, fontFamily: font.w800 },
  pllakat: { flexDirection: "row", gap: 10 },
  pllaka: {
    flex: 1,
    minHeight: 104,
    borderRadius: 18,
    padding: 12,
    gap: 2,
    backgroundColor: colors.ikonaBg,
  },
  pllakaPritje: { backgroundColor: colors.background },
  pllakaIkona: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  pllakaIkonaGati: { backgroundColor: colors.petrol },
  pllakaEmri: { color: colors.ink, fontSize: 15, fontFamily: font.w800 },
  pllakaNen: { color: colors.textSecondary, fontSize: 12, fontFamily: font.w600 },
});
