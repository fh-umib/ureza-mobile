import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "@/constants/ureza";
import { useDhenat } from "@/lib/dhenat";
import { dataNgaTekst, MUAJT, titulliIVizites } from "@/lib/vizitat";

import { PronaIlustrim } from "./PronaIlustrim";
import { StatusiChip } from "./StatusiChip";
import { UrezaIcon } from "./UrezaIcon";

// "Ditari i kujdesit": the latest visits, newest first (from the user's visits).
const MUAJT_SHKURT = MUAJT.map((m) => m.slice(0, 3).toUpperCase());

export function Ditari({ onShikoTeGjitha }: { onShikoTeGjitha?: () => void }) {
  const { vizitat, pronat, burimiVizitat } = useDhenat();
  const rreshtat = vizitat.slice(0, 3);

  return (
    <View style={styles.karta}>
      <Text style={styles.titulli}>Ditari i kujdesit</Text>
      <Text style={styles.nentitulli}>Vizitat e fundit, sipas datës</Text>

      {burimiVizitat !== "duke_ngarkuar" && rreshtat.length === 0 ? (
        <Text style={styles.bosh}>Ende nuk ka vizita në ditar. Kërko të parën nga Ballina.</Text>
      ) : null}

      <View style={styles.lista}>
        {rreshtat.map((v, i) => {
          const data = dataNgaTekst(v.data);
          const prona = pronat.find((p) => p.id === v.pronaId);
          return (
            <View key={v.id} style={[styles.rresht, i < rreshtat.length - 1 && styles.ndarje]}>
              <View style={styles.data}>
                <Text style={styles.dita}>{data.getDate()}</Text>
                <Text style={styles.muaji}>{MUAJT_SHKURT[data.getMonth()]}</Text>
              </View>
              <View style={styles.thumb}>
                <PronaIlustrim lloji={v.lloji === "inspektim" ? "ceti" : (prona?.lloji ?? "prindert")} />
              </View>
              <View style={styles.tekst}>
                <Text style={styles.rreshtTitulli}>{titulliIVizites(v.lloji)}</Text>
                <Text style={styles.rreshtShenim}>{prona?.emri ?? "Prona"}</Text>
                <StatusiChip statusi={v.statusi} />
              </View>
            </View>
          );
        })}
      </View>

      {onShikoTeGjitha ? (
        <Pressable style={styles.link} onPress={onShikoTeGjitha} accessibilityRole="button">
          <Text style={styles.linkText}>Shiko të gjitha në Odë</Text>
          <UrezaIcon name="chevron" size={18} color={colors.petrol} strokeWidth={2.6} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  karta: { backgroundColor: colors.white, borderRadius: 20, padding: 20 },
  titulli: { color: colors.ink, fontSize: 20, lineHeight: 26, fontWeight: "800" },
  nentitulli: { marginTop: 2, color: colors.textSecondary, fontSize: 15, lineHeight: 22, fontWeight: "500" },
  bosh: { marginTop: 12, color: colors.textSecondary, fontSize: 14, lineHeight: 20, fontWeight: "500" },
  lista: { marginTop: 6 },
  rresht: { flexDirection: "row", gap: 14, paddingVertical: 16, alignItems: "flex-start" },
  ndarje: { borderBottomWidth: 1, borderBottomColor: "#EDF1F4" },
  data: { width: 44, alignItems: "center" },
  dita: { color: colors.petrol, fontSize: 24, lineHeight: 28, fontWeight: "800" },
  muaji: { color: colors.textSecondary, fontSize: 13, lineHeight: 16, fontWeight: "700", letterSpacing: 1 },
  thumb: { width: 72, height: 72, borderRadius: 14, overflow: "hidden" },
  tekst: { flex: 1, gap: 4 },
  rreshtTitulli: { color: colors.ink, fontSize: 17, lineHeight: 22, fontWeight: "800" },
  rreshtShenim: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, fontWeight: "500" },
  link: { marginTop: 6, minHeight: 48, flexDirection: "row", alignItems: "center", gap: 6 },
  linkText: { color: colors.petrol, fontSize: 16, fontWeight: "800" },
});
