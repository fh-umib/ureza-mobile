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

// The dusk behind every screen title: a deep sky that warms towards the horizon, the setting sun
// with its glow, two ranges of mountains, and the lit bridge of Urëza on the right, so the
// title on the left always reads on the darkest part. The bottom 24 px hide under the sheet.
function HeroSkena() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 390 150" preserveAspectRatio="xMidYMax slice">
      <Defs>
        <LinearGradient id="qielli" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#0E2F3C" />
          <Stop offset="0.65" stopColor="#173F4E" />
          <Stop offset="1" stopColor="#24566A" />
        </LinearGradient>
        <RadialGradient id="drita" cx="318" cy="98" r="120" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#F2C46B" stopOpacity="0.42" />
          <Stop offset="0.45" stopColor="#F2C46B" stopOpacity="0.12" />
          <Stop offset="1" stopColor="#F2C46B" stopOpacity="0" />
        </RadialGradient>
        <LinearGradient id="dielli" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FBE3A6" />
          <Stop offset="1" stopColor="#F2C46B" />
        </LinearGradient>
        <LinearGradient id="maliLarg" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#2A6175" />
          <Stop offset="1" stopColor="#1B4A5B" />
        </LinearGradient>
        <LinearGradient id="maliAfer" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#163F4E" />
          <Stop offset="1" stopColor="#10313E" />
        </LinearGradient>
      </Defs>

      <Rect width="390" height="150" fill="url(#qielli)" />
      <Rect width="390" height="150" fill="url(#drita)" />

      {/* the sun, half behind the far range */}
      <Circle cx="318" cy="98" r="20" fill="url(#dielli)" />

      <Path d="M0 112 L52 88 L98 100 L150 76 L204 98 L252 84 L300 104 L350 86 L390 98 V150 H0Z" fill="url(#maliLarg)" />

      {/* the bridge: two towers, the main cable lit by the sun, the hangers and the deck */}
      <G>
        <Path d="M214 104 Q262 128 310 104 Q342 122 390 112" fill="none" stroke="#F2C46B" strokeWidth="1.6" strokeOpacity="0.9" />
        <Path
          d="M226 110V122 M238 115V122 M250 118V122 M274 118V122 M286 115V122 M298 110V122 M326 112V122 M346 116V122 M366 115V122"
          stroke="#F2C46B"
          strokeWidth="0.8"
          strokeOpacity="0.55"
        />
        <Rect x="210" y="98" width="5" height="30" rx="1.5" fill="#E8F5F3" fillOpacity="0.9" />
        <Rect x="308" y="98" width="5" height="30" rx="1.5" fill="#E8F5F3" fillOpacity="0.9" />
        <Rect x="196" y="121" width="194" height="3" rx="1.5" fill="#E8F5F3" fillOpacity="0.85" />
      </G>

      <Path d="M0 132 L64 112 L128 124 L196 108 L262 128 L330 114 L390 126 V150 H0Z" fill="url(#maliAfer)" />
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
