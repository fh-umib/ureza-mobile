import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, font } from "@/constants/ureza";

import { Ikona, type EmriIIkones } from "./Ikona";

// A section title on the tab screens: an icon, the title, an optional count, and an optional
// link on the right ("Shiko të gjitha ›").
export function Seksioni({
  ikona,
  titulli,
  numri,
  lidhja,
}: {
  ikona: EmriIIkones;
  titulli: string;
  numri?: number;
  lidhja?: { etiketa: string; onPress: () => void };
}) {
  return (
    <View style={styles.rreshti}>
      <Ikona emri={ikona} madhesia={20} ngjyra={colors.teal} />
      <Text style={styles.titulli} accessibilityRole="header">
        {titulli}
      </Text>
      {numri !== undefined ? (
        <View style={styles.numri}>
          <Text style={styles.numriTeksti}>{numri}</Text>
        </View>
      ) : null}
      <View style={styles.hapesira} />
      {lidhja ? (
        <Pressable
          onPress={lidhja.onPress}
          style={styles.lidhja}
          accessibilityRole="link"
          accessibilityLabel={lidhja.etiketa}
        >
          <Text style={styles.lidhjaTeksti}>{lidhja.etiketa}</Text>
          <Ikona emri="shigjeta" madhesia={14} ngjyra={colors.petrol} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  rreshti: { flexDirection: "row", alignItems: "center", gap: 8, minHeight: 44 },
  titulli: { color: colors.ink, fontSize: 20, lineHeight: 26, fontFamily: font.w800 },
  numri: {
    minWidth: 24,
    height: 24,
    paddingHorizontal: 7,
    borderRadius: 12,
    backgroundColor: colors.ikonaBg,
    alignItems: "center",
    justifyContent: "center",
  },
  numriTeksti: { color: colors.petrol, fontSize: 12, fontFamily: font.w800 },
  hapesira: { flex: 1 },
  lidhja: { flexDirection: "row", alignItems: "center", gap: 2, minHeight: 44 },
  lidhjaTeksti: { color: colors.petrol, fontSize: 14, fontFamily: font.w800 },
});
