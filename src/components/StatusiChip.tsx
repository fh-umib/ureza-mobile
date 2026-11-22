import { StyleSheet, Text, View } from "react-native";

import { STATUSET, type Statusi } from "@/lib/vizitat";

import { UrezaIcon } from "./UrezaIcon";

// The status of a visit as a small coloured chip (icon + word, never colour alone).
export function StatusiChip({ statusi }: { statusi: Statusi }) {
  const s = STATUSET[statusi] ?? STATUSET.kerkuar;
  return (
    <View style={[styles.chip, { backgroundColor: s.bg }]}>
      <UrezaIcon name={s.icon} size={16} color={s.fg} strokeWidth={2.4} />
      <Text style={[styles.text, { color: s.fg }]}>{s.emri}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: "flex-start",
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  text: { fontSize: 13, fontWeight: "700" },
});
