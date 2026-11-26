import { StyleSheet, Text, View } from "react-native";

import { colors, font } from "@/constants/ureza";
import { HAPAT, hapiIVizites, type Statusi } from "@/lib/vizitat";

import { UrezaIcon } from "./UrezaIcon";

// The four steps of a visit (Kërkuar, Pranuar, Vizita, Raporti) with the reached ones filled.
export function HapatEVizites({ statusi }: { statusi: Statusi }) {
  const hapi = hapiIVizites(statusi);
  return (
    <View style={styles.rreshti} accessibilityLabel={`Hapi ${hapi + 1} nga ${HAPAT.length}: ${HAPAT[hapi]}`}>
      {HAPAT.map((emri, i) => {
        const arritur = i <= hapi;
        return (
          <View key={emri} style={styles.hapi}>
            <View style={styles.pikat}>
              <View style={[styles.vija, i === 0 && styles.pa, i <= hapi && styles.vijaArritur]} />
              <View style={[styles.rrethi, arritur && styles.rrethiArritur]}>
                {arritur ? <UrezaIcon name="check" size={14} color={colors.white} strokeWidth={3} /> : null}
              </View>
              <View style={[styles.vija, i === HAPAT.length - 1 && styles.pa, i < hapi && styles.vijaArritur]} />
            </View>
            <Text style={[styles.emri, i === hapi && styles.emriAktiv]}>{emri}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  rreshti: { flexDirection: "row" },
  hapi: { flex: 1, alignItems: "center", gap: 6 },
  pikat: { flexDirection: "row", alignItems: "center", width: "100%" },
  vija: { flex: 1, height: 2, backgroundColor: colors.line },
  vijaArritur: { backgroundColor: colors.petrol },
  pa: { backgroundColor: "transparent" },
  rrethi: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.inputBorder,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  rrethiArritur: { backgroundColor: colors.petrol, borderColor: colors.petrol },
  emri: { color: colors.textSecondary, fontSize: 13, lineHeight: 18, fontFamily: font.w600 },
  emriAktiv: { color: colors.petrol, fontFamily: font.w800 },
});
