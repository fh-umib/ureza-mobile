import { useRouter } from "expo-router";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { EkraniMeHero } from "@/components/EkraniMeHero";
import { StatusiChip } from "@/components/StatusiChip";
import { UrezaIcon } from "@/components/UrezaIcon";
import { colors } from "@/constants/ureza";
import { useDhenat } from "@/lib/dhenat";
import { LLOJET_E_VIZITES, MUAJT, dataNgaTekst, dataShkurt, titulliIVizites, type Vizita } from "@/lib/vizitat";

// "Oda" (the archive): every visit of the user, grouped by month, newest first.
function sipasMuajit(vizitat: Vizita[]): { muaji: string; vizitat: Vizita[] }[] {
  const grupet: { muaji: string; vizitat: Vizita[] }[] = [];
  for (const v of vizitat) {
    const d = dataNgaTekst(v.data);
    const muaji = `${MUAJT[d.getMonth()].toUpperCase()} ${d.getFullYear()}`;
    const e_fundit = grupet[grupet.length - 1];
    if (e_fundit && e_fundit.muaji === muaji) e_fundit.vizitat.push(v);
    else grupet.push({ muaji, vizitat: [v] });
  }
  return grupet;
}

export default function Oda() {
  const router = useRouter();
  const { vizitat, pronat, burimiVizitat } = useDhenat();
  const grupet = sipasMuajit(vizitat);

  return (
    <EkraniMeHero kicker="ARKIVI" title="Oda" subtitle="Vizitat dhe dëshmitë e tua.">
      <Pressable style={styles.primary} onPress={() => router.push("/kerko-vizite")} accessibilityRole="button">
        <UrezaIcon name="plus" size={22} color={colors.white} strokeWidth={2.4} />
        <Text style={styles.primaryText}>Kërko një vizitë</Text>
      </Pressable>

      {burimiVizitat === "duke_ngarkuar" ? <ActivityIndicator color={colors.petrol} /> : null}

      {burimiVizitat !== "duke_ngarkuar" && vizitat.length === 0 ? (
        <View style={styles.bosh}>
          <Text style={styles.boshTitle}>Ende nuk ke vizita</Text>
          <Text style={styles.boshText}>Çdo vizitë e kërkuar shfaqet këtu, me raportin dhe dëshmitë kur të jenë gati.</Text>
        </View>
      ) : null}

      {grupet.map((grupi) => (
        <View key={grupi.muaji} style={styles.grupi}>
          <Text style={styles.muaji}>{grupi.muaji}</Text>
          {grupi.vizitat.map((v) => {
            const ikona = LLOJET_E_VIZITES.find((l) => l.vlera === v.lloji)?.icon ?? "home";
            const prona = pronat.find((p) => p.id === v.pronaId);
            return (
              <Pressable
                key={v.id}
                style={styles.rreshti}
                onPress={() => router.push({ pathname: "/vizita/[id]", params: { id: v.id } })}
                accessibilityRole="button"
                accessibilityLabel={`${titulliIVizites(v.lloji)}, ${prona?.emri ?? "Prona"}, ${dataShkurt(v.data)}`}
              >
                <View style={styles.ikona}>
                  <UrezaIcon name={ikona} size={24} color={colors.petrol} />
                </View>
                <View style={styles.tekst}>
                  <Text style={styles.titulli}>{titulliIVizites(v.lloji)}</Text>
                  <Text style={styles.nen}>
                    {prona?.emri ?? "Prona"} · {dataShkurt(v.data)}
                  </Text>
                  <StatusiChip statusi={v.statusi} />
                </View>
                <View style={styles.shigjeta}>
                  <UrezaIcon name="chevron" size={20} color={colors.petrol} strokeWidth={2.4} />
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </EkraniMeHero>
  );
}

const styles = StyleSheet.create({
  primary: {
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.petrol,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryText: { color: colors.white, fontSize: 17, fontWeight: "700" },
  bosh: { backgroundColor: colors.white, borderRadius: 20, padding: 20, gap: 4, borderWidth: 1, borderColor: "#E3EAF0" },
  boshTitle: { color: colors.ink, fontSize: 17, lineHeight: 22, fontWeight: "800" },
  boshText: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, fontWeight: "500" },
  grupi: { gap: 10 },
  muaji: { color: colors.teal, fontSize: 12, lineHeight: 16, fontWeight: "700", letterSpacing: 1.5 },
  rreshti: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E3EAF0",
    padding: 14,
  },
  ikona: { width: 48, height: 48, borderRadius: 15, backgroundColor: "#E8F5F3", alignItems: "center", justifyContent: "center" },
  tekst: { flex: 1, gap: 4 },
  shigjeta: { alignSelf: "center" },
  titulli: { color: colors.ink, fontSize: 17, lineHeight: 22, fontWeight: "800" },
  nen: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, fontWeight: "500" },
});
