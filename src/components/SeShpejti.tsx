import { StyleSheet, Text, View } from "react-native";

import { colors, font } from "@/constants/ureza";

// A card for features that are not built yet, marked "Së shpejti" as in the design.
export function SeShpejti({ titulli, teksti }: { titulli: string; teksti: string }) {
  return (
    <View style={styles.karta}>
      <View style={styles.pill}>
        <Text style={styles.pillText}>Së shpejti</Text>
      </View>
      <Text style={styles.titulli}>{titulli}</Text>
      <Text style={styles.teksti}>{teksti}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  karta: { backgroundColor: colors.white, borderRadius: 20, borderWidth: 1, borderColor: "#E3EAF0", padding: 20, gap: 8 },
  pill: { alignSelf: "flex-start", backgroundColor: "#FCEFD2", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
  pillText: { color: "#7A4A06", fontSize: 12, fontFamily: font.w700 },
  titulli: { color: colors.ink, fontSize: 18, lineHeight: 24, fontFamily: font.w800 },
  teksti: { color: colors.textSecondary, fontSize: 15, lineHeight: 22, fontFamily: font.w500 },
});
