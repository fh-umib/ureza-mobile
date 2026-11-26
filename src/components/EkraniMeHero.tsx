import { StatusBar } from "expo-status-bar";
import { createContext, useContext, useRef, type ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, type ScrollViewInstance } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Defs, G, LinearGradient, Path, RadialGradient, Rect, Stop } from "react-native-svg";

import { colors } from "@/constants/ureza";
import { useKeyboardReveal } from "@/hooks/use-keyboard-reveal";

import { UrezaIcon } from "./UrezaIcon";

// Text fields inside the sheet call this on focus, so the page scrolls just enough
// to keep the field above the keyboard (see use-keyboard-reveal.ts).
const RevealContext = createContext<() => void>(() => {});
export function useRevealOnFocus(): () => void {
  return useContext(RevealContext);
}

// Frame of the tab screens (design: Pronat, Ballina, ...): a dusk hero with a
// kicker, a title and a sentence, and a rounded sheet with the content.
// `kthehu` adds the pill at the top right of the hero (e.g. "Mbrapa").
export function EkraniMeHero({
  kicker,
  title,
  subtitle,
  kthehu,
  children,
}: {
  kicker: string;
  title: string;
  subtitle?: string;
  kthehu?: { etiketa: string; onPress: () => void };
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const heroHeight = insets.top + 150;
  const listRef = useRef<ScrollViewInstance>(null);
  const { keyboardHeight, revealSoon, trackScroll } = useKeyboardReveal((y) =>
    listRef.current?.scrollTo({ y, animated: true }),
  );

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      {/* keeps the status bar area dark while the page scrolls under it */}
      <View style={[styles.scrim, { height: insets.top }]} />
      <ScrollView
        ref={listRef}
        bounces={false}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        onScroll={trackScroll}
        scrollEventThrottle={16}
        contentContainerStyle={[styles.content, { paddingBottom: keyboardHeight }]}
      >
        <View style={[styles.hero, { height: heroHeight }]}>
          <View style={StyleSheet.absoluteFill}>
            <HeroSkena />
          </View>
          <View style={[styles.heroText, { paddingTop: insets.top + 18 }]}>
            <Text style={styles.kicker}>{kicker}</Text>
            <Text style={styles.title} accessibilityRole="header">
              {title}
            </Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
          {kthehu ? (
            <Pressable
              onPress={kthehu.onPress}
              style={[styles.kthehu, { top: insets.top + 10 }]}
              accessibilityRole="button"
              accessibilityLabel={kthehu.etiketa}
            >
              <UrezaIcon name="back" size={18} color={colors.white} strokeWidth={2.4} />
              <Text style={styles.kthehuText}>{kthehu.etiketa}</Text>
            </Pressable>
          ) : null}
        </View>
        <RevealContext.Provider value={revealSoon}>
          <View style={styles.sheet}>{children}</View>
        </RevealContext.Provider>
      </ScrollView>
    </View>
  );
}

// The night sky behind every screen title: a deep gradient, a faint band of the Milky Way,
// many small stars of different sizes and brightness, and a few bright ones with a soft halo.
// Nothing is drawn where it could cross the title. The stars come from a fixed seed, so they
// stay in the same place on every screen and every start.

type Ylli = { x: number; y: number; r: number; o: number };

function yjet(sa: number, fara: number): Ylli[] {
  let s = fara;
  const rast = () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
  return Array.from({ length: sa }, () => {
    const madhesia = rast();
    return {
      x: rast() * 390,
      y: rast() * 126,
      // most stars are tiny, a few are larger
      r: madhesia > 0.93 ? 1.3 : madhesia > 0.7 ? 0.85 : 0.5,
      o: 0.35 + rast() * 0.6,
    };
  });
}

const YJET = yjet(110, 7);
const YJET_E_NDRITSHME: { x: number; y: number }[] = [
  { x: 214, y: 22 },
  { x: 302, y: 58 },
  { x: 356, y: 18 },
  { x: 150, y: 96 },
];

function HeroSkena() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 390 150" preserveAspectRatio="xMidYMax slice">
      <Defs>
        <LinearGradient id="qielli" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#0A2430" />
          <Stop offset="0.55" stopColor="#123746" />
          <Stop offset="1" stopColor="#1C4B5C" />
        </LinearGradient>
        <LinearGradient id="rruga" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0" />
          <Stop offset="0.5" stopColor="#CFE8EE" stopOpacity="0.09" />
          <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </LinearGradient>
        <RadialGradient id="horizonti" cx="300" cy="170" r="190" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#F2C46B" stopOpacity="0.16" />
          <Stop offset="1" stopColor="#F2C46B" stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="aureola">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.55" />
          <Stop offset="0.35" stopColor="#E8F5F3" stopOpacity="0.18" />
          <Stop offset="1" stopColor="#E8F5F3" stopOpacity="0" />
        </RadialGradient>
      </Defs>

      <Rect width="390" height="150" fill="url(#qielli)" />
      {/* the Milky Way: a soft diagonal haze */}
      <Path d="M120 -20 L230 -20 L420 150 L300 150 Z" fill="url(#rruga)" />
      {/* the last warmth of the day, low on the right */}
      <Rect width="390" height="150" fill="url(#horizonti)" />

      <G fill="#FFFFFF">
        {YJET.map((y, i) => (
          <Circle key={i} cx={y.x} cy={y.y} r={y.r} fillOpacity={y.o} />
        ))}
      </G>

      {YJET_E_NDRITSHME.map((y) => (
        <G key={`${y.x}-${y.y}`}>
          <Circle cx={y.x} cy={y.y} r={9} fill="url(#aureola)" />
          <Path
            d={`M${y.x - 5} ${y.y} H${y.x + 5} M${y.x} ${y.y - 5} V${y.y + 5}`}
            stroke="#FFFFFF"
            strokeOpacity={0.5}
            strokeWidth={0.5}
          />
          <Circle cx={y.x} cy={y.y} r={1.5} fill="#FFFFFF" />
        </G>
      ))}
    </Svg>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1 },
  scrim: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 10, backgroundColor: colors.hero },
  hero: { backgroundColor: colors.hero },
  heroText: { paddingHorizontal: 20 },
  kicker: { color: colors.mint, fontSize: 12, lineHeight: 16, fontWeight: "700", letterSpacing: 1.5 },
  title: { marginTop: 2, color: colors.white, fontSize: 28, lineHeight: 34, fontWeight: "800" },
  subtitle: { marginTop: 2, color: colors.onHeroText, fontSize: 15, lineHeight: 21, fontWeight: "500" },
  kthehu: {
    position: "absolute",
    right: 20,
    zIndex: 11,
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 22,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
  },
  kthehuText: { color: colors.white, fontSize: 15, fontWeight: "700" },
  sheet: {
    marginTop: -24,
    flexGrow: 1, // the sheet reaches the tab bar even when the content is short
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 16,
    shadowColor: "#0B2530",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
});
