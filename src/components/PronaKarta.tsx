import { StyleSheet, Text, View } from "react-native";

import { colors } from "@/constants/ureza";
import type { Prona } from "@/lib/pronat";

import { PronaIlustrim } from "./PronaIlustrim";

// A property card from the design: picture, name and place.
export function PronaKarta({ prona, width }: { prona: Prona; width: number }) {
  return (
    <View style={[styles.karta, { width }]}>
      <View style={styles.ilustrim}>
        <PronaIlustrim lloji={prona.lloji} />
      </View>
      <View style={styles.tekst}>
        <Text style={styles.emri} numberOfLines={2}>
          {prona.emri}
        </Text>
        <Text style={styles.vendi} numberOfLines={1}>
          {prona.vendi}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  karta: {
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "transparent",
    padding: 8,
    paddingBottom: 12,
    gap: 8,
  },
  ilustrim: { height: 92, borderRadius: 14, overflow: "hidden" },
  tekst: { paddingHorizontal: 4 },
  emri: { color: colors.ink, fontSize: 16, lineHeight: 21, fontWeight: "800" },
  vendi: { color: colors.textSecondary, fontSize: 14, lineHeight: 19, fontWeight: "500" },
});
