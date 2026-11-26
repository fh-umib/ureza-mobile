import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "@/constants/ureza";

import { UrezaIcon, type IconName } from "./UrezaIcon";

// The role cards of the design (Roli): Klient and Miku can be chosen, Admin is given by the
// Urëza team in the database. Used before signing in (kush-je.tsx) and from Profili (roli.tsx).
export type Zgjedhja = "klient" | "miku";

const ROLET: { vlera: Zgjedhja; titulli: string; nen: string; icon: IconName }[] = [
  { vlera: "klient", titulli: "Klient", nen: "Krijoj kërkesa dhe shoh raportet", icon: "home" },
  { vlera: "miku", titulli: "Miku (vizitori lokal)", nen: "Pranoj detyra dhe e kryej vizitën", icon: "pin" },
];

export function ZgjedhesiIRolit({ roli, onZgjidh }: { roli: Zgjedhja; onZgjidh: (roli: Zgjedhja) => void }) {
  return (
    <>
      {ROLET.map((r) => {
        const zgjedhur = r.vlera === roli;
        return (
          <Pressable
            key={r.vlera}
            style={[styles.opsion, zgjedhur && styles.opsionZgjedhur]}
            onPress={() => onZgjidh(r.vlera)}
            accessibilityRole="radio"
            accessibilityState={{ selected: zgjedhur }}
            accessibilityLabel={`${r.titulli}. ${r.nen}`}
          >
            <View style={styles.ikona}>
              <UrezaIcon name={r.icon} size={26} color={colors.petrol} />
            </View>
            <View style={styles.opsionTekst}>
              <Text style={styles.opsionTitulli}>{r.titulli}</Text>
              <Text style={styles.opsionNen}>{r.nen}</Text>
            </View>
            <View style={[styles.radio, zgjedhur && styles.radioZgjedhur]}>
              {zgjedhur ? <UrezaIcon name="check" size={14} color={colors.white} strokeWidth={3} /> : null}
            </View>
          </Pressable>
        );
      })}

      <View style={[styles.opsion, styles.opsionPaAkses]} accessibilityState={{ disabled: true }}>
        <View style={styles.ikona}>
          <UrezaIcon name="shield" size={26} color={colors.textSecondary} />
        </View>
        <View style={styles.opsionTekst}>
          <Text style={styles.opsionTitulli}>Admin</Text>
          <Text style={styles.opsionNen}>Shoh panelin, hartën dhe kundërshtimet</Text>
          <View style={styles.pill}>
            <Text style={styles.pillText}>Jepet nga ekipi</Text>
          </View>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  opsion: {
    minHeight: 84,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 10,
    paddingLeft: 10,
    paddingRight: 14,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: "#E3EAF0",
    borderRadius: 18,
  },
  opsionZgjedhur: { borderColor: colors.petrol },
  opsionPaAkses: { backgroundColor: "#EEF3F6", borderStyle: "dashed" },
  ikona: { width: 56, height: 56, borderRadius: 17, backgroundColor: colors.ikonaBg, alignItems: "center", justifyContent: "center" },
  opsionTekst: { flex: 1, gap: 2 },
  opsionTitulli: { color: colors.ink, fontSize: 17, lineHeight: 22, fontWeight: "800" },
  opsionNen: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, fontWeight: "500" },
  radio: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: colors.inputBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  radioZgjedhur: { backgroundColor: colors.petrol, borderColor: colors.petrol },
  pill: { alignSelf: "flex-start", marginTop: 4, backgroundColor: "#FCEFD2", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
  pillText: { color: "#7A4A06", fontSize: 12, fontWeight: "700" },
});
