import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "@/constants/ureza";
import { DITET_SHKURT, MUAJT, dataEPlote, dataNeTekst, dataNgaTekst } from "@/lib/vizitat";

import { UrezaIcon } from "./UrezaIcon";

// Month calendar for choosing the day of a visit. Days that already have a visit are
// shown in red with a dot (and a legend), so the same day is not booked by accident.
// Days from tomorrow up to a year ahead can be chosen.
const JAVA = [1, 2, 3, 4, 5, 6, 0].map((d) => DITET_SHKURT[d]); // Monday first

export function Kalendari({
  zgjedhur,
  onZgjidh,
  meVizita,
}: {
  zgjedhur: string; // "YYYY-MM-DD"
  onZgjidh: (data: string) => void;
  meVizita: Record<string, number>; // day -> number of visits
}) {
  const sot = new Date();
  const neser = dataNeTekst(new Date(sot.getFullYear(), sot.getMonth(), sot.getDate() + 1));
  const fundi = dataNeTekst(new Date(sot.getFullYear() + 1, sot.getMonth(), sot.getDate()));
  const sotTekst = dataNeTekst(sot);

  const zgjedhurData = dataNgaTekst(zgjedhur);
  const [pamja, setPamja] = useState({ viti: zgjedhurData.getFullYear(), muaji: zgjedhurData.getMonth() });

  const diteteMuajit = new Date(pamja.viti, pamja.muaji + 1, 0).getDate();
  const zhvendosja = (new Date(pamja.viti, pamja.muaji, 1).getDay() + 6) % 7; // empty cells before the 1st
  const qelizat: (number | null)[] = [
    ...Array<null>(zhvendosja).fill(null),
    ...Array.from({ length: diteteMuajit }, (_, i) => i + 1),
  ];
  while (qelizat.length % 7 !== 0) qelizat.push(null);
  const rreshtat = Array.from({ length: qelizat.length / 7 }, (_, r) => qelizat.slice(r * 7, r * 7 + 7));

  const eshteMuajiISotem = pamja.viti === sot.getFullYear() && pamja.muaji === sot.getMonth();
  const eshteMuajiIFundit = pamja.viti === sot.getFullYear() + 1 && pamja.muaji === sot.getMonth();

  function leviz(drejtimi: -1 | 1) {
    const d = new Date(pamja.viti, pamja.muaji + drejtimi, 1);
    setPamja({ viti: d.getFullYear(), muaji: d.getMonth() });
  }

  return (
    <View style={styles.karta}>
      <View style={styles.krye}>
        <Pressable
          onPress={() => leviz(-1)}
          disabled={eshteMuajiISotem}
          style={[styles.shigjeta, eshteMuajiISotem && styles.shigjetaOff]}
          accessibilityRole="button"
          accessibilityLabel="Muaji i kaluar"
        >
          <UrezaIcon name="back" size={22} color={colors.petrol} strokeWidth={2.4} />
        </Pressable>
        <Text style={styles.muaji} accessibilityRole="header">
          {MUAJT[pamja.muaji].charAt(0).toUpperCase() + MUAJT[pamja.muaji].slice(1)} {pamja.viti}
        </Text>
        <Pressable
          onPress={() => leviz(1)}
          disabled={eshteMuajiIFundit}
          style={[styles.shigjeta, eshteMuajiIFundit && styles.shigjetaOff]}
          accessibilityRole="button"
          accessibilityLabel="Muaji i ardhshëm"
        >
          <UrezaIcon name="chevron" size={22} color={colors.petrol} strokeWidth={2.4} />
        </Pressable>
      </View>

      <View style={styles.rreshti}>
        {JAVA.map((d) => (
          <Text key={d} style={styles.diteJave}>
            {d}
          </Text>
        ))}
      </View>

      {rreshtat.map((rresht, r) => (
        <View key={r} style={styles.rreshti}>
          {rresht.map((dita, k) => {
            if (dita === null) return <View key={k} style={styles.qeliza} />;
            const tekst = dataNeTekst(new Date(pamja.viti, pamja.muaji, dita));
            const mundshme = tekst >= neser && tekst <= fundi;
            const zgjedhurDita = tekst === zgjedhur;
            const vizita = meVizita[tekst] ?? 0;
            const etiketa = `${dataEPlote(tekst)}${vizita ? `, ke ${vizita} vizitë` : ""}`;
            return (
              <Pressable
                key={k}
                style={styles.qeliza}
                disabled={!mundshme}
                onPress={() => onZgjidh(tekst)}
                accessibilityRole="button"
                accessibilityState={{ selected: zgjedhurDita, disabled: !mundshme }}
                accessibilityLabel={etiketa}
              >
                <View style={[styles.rrethi, zgjedhurDita && styles.rrethiZgjedhur, tekst === sotTekst && styles.rrethiSot]}>
                  <Text
                    style={[
                      styles.numri,
                      !mundshme && styles.numriOff,
                      vizita > 0 && !zgjedhurDita && styles.numriMeVizite,
                      zgjedhurDita && styles.numriZgjedhur,
                    ]}
                  >
                    {dita}
                  </Text>
                  {vizita > 0 ? <View style={styles.pika} /> : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}

      <View style={styles.legjenda}>
        <View style={styles.pika2} />
        <Text style={styles.legjendaText}>Ditë me vizitë të kërkuar</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  karta: { backgroundColor: colors.white, borderRadius: 18, borderWidth: 1.5, borderColor: colors.inputBorder, padding: 12, gap: 2 },
  krye: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  muaji: { color: colors.ink, fontSize: 18, lineHeight: 24, fontWeight: "800" },
  shigjeta: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: colors.ikonaBg },
  shigjetaOff: { opacity: 0.35 },
  rreshti: { flexDirection: "row" },
  diteJave: { flex: 1, textAlign: "center", color: colors.textSecondary, fontSize: 12, lineHeight: 28, fontWeight: "700", letterSpacing: 0.5 },
  qeliza: { flex: 1, height: 46, alignItems: "center", justifyContent: "center" },
  rrethi: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  rrethiZgjedhur: { backgroundColor: colors.petrol },
  rrethiSot: { borderWidth: 1.5, borderColor: colors.inputBorder },
  numri: { color: colors.ink, fontSize: 17, lineHeight: 22, fontWeight: "600" },
  numriOff: { color: "#B7C4CB" },
  numriMeVizite: { color: colors.vizita, fontWeight: "800" },
  numriZgjedhur: { color: colors.white, fontWeight: "800" },
  pika: {
    position: "absolute",
    bottom: 3,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.vizita,
    borderWidth: 1,
    borderColor: colors.white,
  },
  legjenda: { flexDirection: "row", alignItems: "center", gap: 8, paddingTop: 8, paddingLeft: 4 },
  pika2: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.vizita },
  legjendaText: { color: colors.textSecondary, fontSize: 13, lineHeight: 18, fontWeight: "600" },
});
