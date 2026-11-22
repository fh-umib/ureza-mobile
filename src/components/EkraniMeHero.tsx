import { StatusBar } from "expo-status-bar";
import { createContext, useContext, useRef, type ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, type ScrollViewInstance } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, G, Path, Rect } from "react-native-svg";

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
            <Svg width="100%" height="100%" viewBox="0 0 390 150" preserveAspectRatio="xMidYMax slice">
              <Rect width="390" height="150" fill="#173F4E" />
              <Rect y="80" width="390" height="70" fill="#1A4757" />
              <G fill="#FFFFFF" fillOpacity="0.65">
                <Circle cx="46" cy="22" r="1.3" />
                <Circle cx="130" cy="14" r="1.2" />
                <Circle cx="210" cy="34" r="1.3" />
                <Circle cx="270" cy="18" r="1.2" />
                <Circle cx="372" cy="30" r="1.3" />
              </G>
              <Circle cx="334" cy="80" r="30" fill="#F2C46B" fillOpacity="0.1" />
              <Circle cx="334" cy="80" r="15" fill="#F6D58A" />
              <Path d="M0 120 L45 94 L90 108 L140 80 L190 104 L240 88 L290 110 L340 92 L390 106 V150 H0Z" fill="#1D5062" />
              <Path d="M0 140 L60 116 L120 130 L190 110 L260 134 L330 116 L390 132 V150 H0Z" fill="#174657" />
            </Svg>
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
