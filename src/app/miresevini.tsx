import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { UrezaIcon, type IconName } from "@/components/UrezaIcon";
import { UrezaLogo } from "@/components/UrezaLogo";
import { UrezaScene } from "@/components/UrezaScene";
import { colors } from "@/constants/ureza";

// Welcome screen: a short introduction before the sign-in screen (from the
// design's "Hyrje"): what Urëza is and who uses it. The button to the sign-in
// screen comes at the end of the page.

type Role = "Klient" | "Miku" | "Admin";

const ROLES: { name: Role; icon: IconName; label: string; text: string }[] = [
  {
    name: "Klient",
    icon: "home",
    label: "FAMILJA JASHTË VENDIT",
    text: "Hyn në llogari, ruan pronat dhe familjarët, kërkon vizita, sheh dëshmitë dhe e miraton ose e kundërshton raportin.",
  },
  {
    name: "Miku",
    icon: "pin",
    label: "VIZITORI LOKAL I BESUAR",
    text: "Pranon detyrën, shkon në vend dhe dërgon dëshmi: vendndodhje GPS, foto nga kamera dhe shënim zanor.",
  },
  {
    name: "Admin",
    icon: "shield",
    label: "EKIPI I URËZËS",
    text: "Shikon panelin me statistika, shqyrton rastet e kundërshtuara me GPS, ndjek cilësinë dhe menaxhon Mikut.",
  },
];

// A few stars in the free corner of the sky (the picture's own stars would sit behind the text).
const STARS: [number, number, number][] = [
  [200, 22, 0.7],
  [250, 46, 0.6],
  [286, 20, 0.7],
  [326, 54, 0.6],
  [358, 30, 0.7],
  [372, 96, 0.5],
  [318, 112, 0.5],
];

export default function Miresevini() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  // The picture is designed for 390 pt wide; it grows with the screen.
  const scale = width / 390;
  const sceneHeight = 440 * scale;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      {/* keeps the status bar area dark while the page scrolls under it */}
      <View style={[styles.statusScrim, { height: insets.top }]} />

      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.hero, { paddingBottom: 262 * scale }]}>
          {STARS.map(([x, y, opacity]) => (
            <View key={`${x}-${y}`} style={[styles.star, { left: x, top: y, opacity }]} />
          ))}
          {/* only the lower part of the picture (bridge, sun, mountains) is shown; the sky is the hero colour */}
          <View style={[styles.scene, { height: sceneHeight - 184 * scale }]}>
            <View style={{ position: "absolute", left: 0, right: 0, top: -184 * scale, height: sceneHeight }}>
              <UrezaScene />
            </View>
          </View>
          <View style={{ paddingTop: Math.max(insets.top, 44), paddingHorizontal: 24 }}>
            <View style={styles.brand}>
              <UrezaLogo size={60} />
              <Text style={styles.brandName}>Urëza</Text>
            </View>
            <Text style={styles.kicker}>ÇKA ËSHTË URËZA</Text>
            <Text style={styles.title} accessibilityRole="header">
              Shtëpia jote, më afër se kurrë.
            </Text>
            <Text style={styles.subtitle}>
              Familja jashtë vendit porosit një vizitor lokal të besuar. Ai shkon në shtëpi dhe sjell dëshmi të vërteta.
            </Text>
          </View>
        </View>

        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 32 }]}>
          <View style={styles.block}>
            <Text style={styles.sectionKicker}>ÇKA SHËRBEN URËZA</Text>
            <Text style={styles.h2}>Të njohësh gjendjen e shtëpisë, pa u kthyer.</Text>
            <Text style={styles.body}>
              Shumë familje në diasporë kanë shtëpi ose prindër në Kosovë dhe nuk mund t&apos;i shohin kur duan. Urëza i
              lidh me një Miku, një vizitor lokal, për një detyrë të caktuar: kontroll çatie, ujë, rrymë ose një vizitë
              te prindërit.
            </Text>
            <Text style={styles.body}>
              Miku nuk dërgon vetëm fjalë. Çdo vizitë vjen me vendndodhje GPS, foto të bëra aty për aty dhe një shënim
              zanor. Klienti e lexon raportin dhe vendos: e miraton ose e kundërshton.
            </Text>
          </View>

          <View style={styles.block}>
            <Text style={styles.sectionKicker}>KUJT I SHËRBEN</Text>
            {ROLES.map((role) => (
              <View key={role.name} style={styles.card}>
                <View style={styles.iconTile}>
                  <UrezaIcon name={role.icon} size={26} color={colors.petrol} />
                </View>
                <Text style={styles.cardTitle}>{role.name}</Text>
                <Text style={styles.cardLabel}>{role.label}</Text>
                <Text style={styles.cardText}>{role.text}</Text>
              </View>
            ))}
          </View>

          <Pressable style={styles.primary} onPress={() => router.push("/kush-je")} accessibilityRole="button">
            <Text style={styles.primaryText}>Vazhdo te kyçja</Text>
            <UrezaIcon name="arrow" size={22} color={colors.white} strokeWidth={2.3} />
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  statusScrim: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 10, backgroundColor: colors.hero },
  hero: { backgroundColor: colors.hero },
  scene: { position: "absolute", left: 0, right: 0, bottom: 0, overflow: "hidden", pointerEvents: "none" },
  star: { position: "absolute", width: 3, height: 3, borderRadius: 1.5, backgroundColor: colors.white },
  brand: { flexDirection: "row", alignItems: "center", gap: 14 },
  brandName: { color: colors.white, fontSize: 30, lineHeight: 36, fontWeight: "800" },
  kicker: { marginTop: 28, color: colors.mint, fontSize: 12, lineHeight: 16, fontWeight: "700", letterSpacing: 1.5 },
  title: { marginTop: 6, color: colors.white, fontSize: 32, lineHeight: 38, fontWeight: "800" },
  subtitle: { marginTop: 10, color: colors.onHeroText, fontSize: 16, lineHeight: 24, fontWeight: "500" },
  sheet: {
    marginTop: -24,
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 28,
    paddingHorizontal: 20,
    gap: 32,
    shadowColor: "#0B2530",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  block: { gap: 12 },
  sectionKicker: { color: colors.teal, fontSize: 12, lineHeight: 16, fontWeight: "700", letterSpacing: 1.5 },
  h2: { color: colors.ink, fontSize: 24, lineHeight: 30, fontWeight: "800" },
  body: { color: colors.ink, fontSize: 15, lineHeight: 23, fontWeight: "500" },
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#E3EAF0",
    borderRadius: 22,
    padding: 18,
    gap: 8,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 1,
  },
  iconTile: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: "#E8F5F3",
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: { color: colors.ink, fontSize: 18, lineHeight: 24, fontWeight: "800" },
  cardLabel: { color: colors.textSecondary, fontSize: 12, lineHeight: 16, fontWeight: "700", letterSpacing: 1 },
  cardText: { color: colors.ink, fontSize: 14, lineHeight: 21, fontWeight: "500" },
  primary: {
    marginTop: 4,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.petrol,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryText: { color: colors.white, fontSize: 17, fontWeight: "700" },
});
