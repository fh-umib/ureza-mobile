import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, font } from "@/constants/ureza";

import { UrezaIcon, type IconName } from "./UrezaIcon";

// A row with a switch (design: Profili, "Njoftimet" and "Privatësia"): a title, a line under it and
// a 56 x 32 switch. The whole row is the button, so the target is large. A row that is not built yet
// is shown switched off and marked "Së shpejti".
export function RreshtiNdezes({
  ikona,
  titulli,
  nentitulli,
  vlera,
  onNdrysho,
  seShpejti = false,
}: {
  ikona?: IconName;
  titulli: string;
  nentitulli: string;
  vlera: boolean;
  onNdrysho: (vlera: boolean) => void;
  seShpejti?: boolean;
}) {
  return (
    <Pressable
      style={[styles.rreshti, seShpejti && styles.seShpejti]}
      onPress={() => onNdrysho(!vlera)}
      disabled={seShpejti}
      accessibilityRole="switch"
      accessibilityLabel={titulli}
      accessibilityState={{ checked: vlera, disabled: seShpejti }}
      aria-checked={vlera}
    >
      {ikona ? (
        <View style={styles.ikona}>
          <UrezaIcon name={ikona} size={20} color={colors.petrol} strokeWidth={2.2} />
        </View>
      ) : null}
      <View style={styles.tekst}>
        <Text style={styles.titulli}>{titulli}</Text>
        <Text style={styles.nentitulli}>{nentitulli}</Text>
        {seShpejti ? (
          <View style={styles.pill}>
            <Text style={styles.pillText}>Së shpejti</Text>
          </View>
        ) : null}
      </View>
      <View style={[styles.shina, { backgroundColor: vlera ? colors.petrol : colors.inputBorder }]}>
        <View style={[styles.kapsa, vlera ? styles.kapsaMajtas : styles.kapsaDjathtas]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  rreshti: { minHeight: 72, flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 8 },
  seShpejti: { opacity: 0.6 },
  ikona: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.ikonaBg,
    alignItems: "center",
    justifyContent: "center",
  },
  tekst: { flex: 1, minWidth: 0, gap: 0 },
  titulli: { color: colors.ink, fontSize: 16, lineHeight: 22, fontFamily: font.w700 },
  nentitulli: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, fontFamily: font.w500 },
  pill: {
    alignSelf: "flex-start",
    marginTop: 4,
    backgroundColor: "#FCEFD2",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  pillText: { color: "#7A4A06", fontSize: 12, fontFamily: font.w700 },
  shina: { width: 56, height: 32, borderRadius: 16, justifyContent: "center" },
  kapsa: {
    position: "absolute",
    top: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.white,
    boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
  },
  kapsaMajtas: { right: 4 },
  kapsaDjathtas: { left: 4 },
});
