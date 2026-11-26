import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import Animated, { FadeIn, FadeInDown, FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { UrezaIcon, type IconName } from "@/components/UrezaIcon";
import { UrezaLogo } from "@/components/UrezaLogo";
import { UrezaScene } from "@/components/UrezaScene";
import { colors } from "@/constants/ureza";

// Welcome screen: one screen, no scrolling. The bridge at dusk fills the middle, the promise
// sits above it in one line, and the three proofs a Miku brings (GPS, photo, voice) sit
// under it, so the idea of Urëza is read in a glance. The roles are explained on the next
// screen ("Kush je ti?").

const DESHMITE: { ikona: IconName; emri: string }[] = [
  { ikona: "pin", emri: "GPS" },
  { ikona: "camera", emri: "Foto" },
  { ikona: "mic", emri: "Zë" },
];

// the colour of the ground at the bottom of the picture, so the picture and the footer meet
const TOKA = "#0B2530";

export default function Miresevini() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  // the picture is drawn for 390 pt; only its lower part (bridge, sun, mountains) is shown,
  // anchored to the bottom of the free space, so short phones lose sky, never the bridge
  const lartesiaESkenes = (width / 390) * 440;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <View style={[styles.koka, { paddingTop: Math.max(insets.top, 24) + 12 }]}>
        <Animated.View entering={FadeIn.duration(500)} style={styles.marka}>
          <UrezaLogo size={40} />
          <Text style={styles.markaEmri}>Urëza</Text>
        </Animated.View>

        <Animated.Text
          entering={FadeInDown.delay(120).duration(600)}
          style={styles.titulli}
          accessibilityRole="header"
        >
          Shtëpia jote,{"\n"}më afër se kurrë.
        </Animated.Text>
        <Animated.Text entering={FadeInDown.delay(240).duration(600)} style={styles.nentitulli}>
          Një Miku i besuar e viziton dhe të sjell dëshmi.
        </Animated.Text>
      </View>

      <Animated.View entering={FadeIn.delay(200).duration(900)} style={styles.skena} pointerEvents="none">
        <View style={[styles.skenaBrenda, { height: lartesiaESkenes }]}>
          <UrezaScene />
        </View>
      </Animated.View>

      <View style={[styles.fundi, { paddingBottom: Math.max(insets.bottom, 16) + 12 }]}>
        <Animated.View
          entering={FadeInUp.delay(360).duration(600)}
          style={styles.deshmite}
          accessible
          accessibilityLabel="Çdo vizitë vjen me GPS, foto dhe zë"
        >
          {DESHMITE.map((d) => (
            <View key={d.emri} style={styles.deshmia}>
              <UrezaIcon name={d.ikona} size={16} color={colors.mint} strokeWidth={2.3} />
              <Text style={styles.deshmiaTeksti}>{d.emri}</Text>
            </View>
          ))}
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(460).duration(600)}>
          <Pressable
            style={({ pressed }) => [styles.butoni, pressed && styles.shtypur]}
            onPress={() => router.push("/kush-je")}
            accessibilityRole="button"
            accessibilityLabel="Fillo"
          >
            <Text style={styles.butoniTeksti}>Fillo</Text>
            <UrezaIcon name="arrow" size={22} color={colors.hero} strokeWidth={2.4} />
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.hero },
  koka: { paddingHorizontal: 28, gap: 14 },
  marka: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 18 },
  markaEmri: { color: colors.white, fontSize: 22, fontWeight: "800", letterSpacing: 0.3 },
  titulli: { color: colors.white, fontSize: 38, lineHeight: 44, fontWeight: "800", letterSpacing: -0.5 },
  nentitulli: { color: colors.onHeroText, fontSize: 17, lineHeight: 24, fontWeight: "500" },
  // the picture takes the free space and keeps its bottom edge (the bridge) in view
  skena: { flex: 1, overflow: "hidden", justifyContent: "flex-end", marginTop: 8 },
  skenaBrenda: { width: "100%" },
  fundi: { backgroundColor: TOKA, paddingHorizontal: 24, paddingTop: 4, gap: 18 },
  deshmite: { flexDirection: "row", justifyContent: "center", gap: 10 },
  deshmia: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 17,
    backgroundColor: "rgba(140,224,203,0.10)",
    borderWidth: 1,
    borderColor: "rgba(140,224,203,0.25)",
  },
  deshmiaTeksti: { color: colors.mint, fontSize: 14, fontWeight: "700" },
  butoni: {
    height: 58,
    borderRadius: 16,
    backgroundColor: colors.amber,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  shtypur: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  butoniTeksti: { color: colors.hero, fontSize: 18, fontWeight: "800" },
});
