import { useRouter } from "expo-router";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { EkraniMeHero } from "@/components/EkraniMeHero";
import { StatusiChip } from "@/components/StatusiChip";
import { UrezaIcon } from "@/components/UrezaIcon";
import { colors } from "@/constants/ureza";
import { useDhenat } from "@/lib/dhenat";
import { useProfili } from "@/lib/profili";
import { useSesioni } from "@/lib/sesioni";
import { LLOJET_E_VIZITES, dataShkurt, titulliIVizites, type Vizita } from "@/lib/vizitat";

// The Miku's home (design: Miku pranon detyrën): the requests that wait for a Miku, and
// the visits this Miku has accepted. Opening a request shows its details and the button to accept.
export default function KerkesatPerMiken() {
  const { perdoruesi } = useSesioni();
  const { burimi: burimiProfilit } = useProfili();
  const { vizitat, pronat, burimiVizitat, rifresko } = useDhenat();

  const tePritura = vizitat.filter((v) => v.statusi === "kerkuar").sort((a, b) => a.data.localeCompare(b.data));
  const timet = vizitat.filter((v) => v.mikuId !== null && v.mikuId === perdoruesi?.id);
  const demo = burimiVizitat === "demo" || burimiProfilit === "demo";

  return (
    <EkraniMeHero
      kicker="MIKU"
      title="Kërkesat"
      subtitle={tePritura.length > 0 ? `${tePritura.length} të reja presin një Miku.` : "Vizitat që presin një Miku."}
    >
      {burimiVizitat === "duke_ngarkuar" ? <ActivityIndicator color={colors.petrol} /> : null}

      {burimiVizitat === "pa_lidhje" ? (
        <View style={styles.bosh}>
          <Text style={styles.boshTitle}>Kërkesat nuk u ngarkuan</Text>
          <Text style={styles.boshText}>Nuk u lidh me serverin. Kontrollo internetin dhe provo përsëri.</Text>
          <Pressable style={styles.dytesor} onPress={() => void rifresko()} accessibilityRole="button">
            <Text style={styles.dytesorText}>Provo përsëri</Text>
          </Pressable>
        </View>
      ) : null}

      {demo ? (
        <View style={styles.shenim}>
          <UrezaIcon name="warning" size={20} color={colors.petrol} />
          <Text style={styles.shenimText}>
            Modalitet provë: shfaqen vetëm kërkesat e bëra në këtë telefon. Pas supabase/roli.sql shfaqen kërkesat e
            vërteta të klientëve.
          </Text>
        </View>
      ) : null}

      <Text style={styles.seksioni}>Kërkesa të reja</Text>
      {burimiVizitat !== "duke_ngarkuar" && burimiVizitat !== "pa_lidhje" && tePritura.length === 0 ? (
        <View style={styles.bosh}>
          <Text style={styles.boshTitle}>Nuk ka kërkesa të reja</Text>
          <Text style={styles.boshText}>Kur një klient kërkon një vizitë, shfaqet këtu që ta pranosh.</Text>
        </View>
      ) : null}
      {tePritura.map((v) => (
        <Rreshti key={v.id} vizita={v} emriProna={pronat.find((p) => p.id === v.pronaId)?.emri} />
      ))}

      {timet.length > 0 ? (
        <>
          <Text style={styles.seksioni}>Detyrat e mia</Text>
          {timet.map((v) => (
            <Rreshti key={v.id} vizita={v} emriProna={pronat.find((p) => p.id === v.pronaId)?.emri} />
          ))}
        </>
      ) : null}
    </EkraniMeHero>
  );
}

function Rreshti({ vizita, emriProna }: { vizita: Vizita; emriProna?: string }) {
  const router = useRouter();
  const ikona = LLOJET_E_VIZITES.find((l) => l.vlera === vizita.lloji)?.icon ?? "home";
  return (
    <Pressable
      style={styles.rreshti}
      onPress={() => router.push({ pathname: "/vizita/[id]", params: { id: vizita.id } })}
      accessibilityRole="button"
      accessibilityLabel={`${titulliIVizites(vizita.lloji)}, ${emriProna ?? "Prona"}, ${dataShkurt(vizita.data)}`}
    >
      <View style={styles.ikona}>
        <UrezaIcon name={ikona} size={24} color={colors.petrol} />
      </View>
      <View style={styles.tekst}>
        <Text style={styles.titulli}>{titulliIVizites(vizita.lloji)}</Text>
        <Text style={styles.nen}>
          {emriProna ?? "Prona"} · {dataShkurt(vizita.data)}
        </Text>
        <Text style={styles.udhezime} numberOfLines={2}>
          {vizita.udhezime}
        </Text>
        <StatusiChip statusi={vizita.statusi} />
      </View>
      <View style={styles.shigjeta}>
        <UrezaIcon name="chevron" size={20} color={colors.petrol} strokeWidth={2.4} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  seksioni: { color: colors.ink, fontSize: 20, lineHeight: 26, fontWeight: "800" },
  bosh: { backgroundColor: colors.white, borderRadius: 20, padding: 20, gap: 4, borderWidth: 1, borderColor: "#E3EAF0" },
  boshTitle: { color: colors.ink, fontSize: 17, lineHeight: 22, fontWeight: "800" },
  boshText: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, fontWeight: "500" },
  dytesor: { minHeight: 48, alignItems: "center", justifyContent: "center" },
  dytesorText: { color: colors.petrol, fontSize: 16, fontWeight: "700" },
  shenim: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: "#E8F5F3",
  },
  shenimText: { flex: 1, color: colors.petrol, fontSize: 15, lineHeight: 22, fontWeight: "600" },
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
  udhezime: { color: colors.ink, fontSize: 14, lineHeight: 20, fontWeight: "500" },
});
