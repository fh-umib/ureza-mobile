import { useRouter } from "expo-router";
import { ActivityIndicator, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";

import { EkraniMeHero } from "@/components/EkraniMeHero";
import { HapatEVizites } from "@/components/HapatEVizites";
import { PronaKarta } from "@/components/PronaKarta";
import { UrezaIcon } from "@/components/UrezaIcon";
import { colors } from "@/constants/ureza";
import { useDhenat } from "@/lib/dhenat";
import { useProfili } from "@/lib/profili";
import { useSesioni } from "@/lib/sesioni";
import { dataEPlote, dataNeTekst, dataShkurt, titulliIVizites, type Vizita } from "@/lib/vizitat";

// The earliest visit that is still ahead (today or later) and not finished.
function vizitaERadhes(vizitat: Vizita[]): Vizita | null {
  const sot = dataNeTekst(new Date());
  const para = vizitat.filter((v) => v.data >= sot && v.statusi !== "miratuar" && v.statusi !== "kundershtuar");
  para.sort((a, b) => a.data.localeCompare(b.data));
  return para[0] ?? null;
}

export default function Ballina() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { perdoruesi } = useSesioni();
  const { profili } = useProfili();
  const { pronat, burimiPronat, vizitat, burimiVizitat } = useDhenat();
  const kartaWidth = (width - 40 - 12) / 2;

  const radhes = vizitaERadhes(vizitat);
  const eFundit = [...vizitat].sort((a, b) => b.krijuar.localeCompare(a.krijuar))[0] ?? null;
  const pronaEFundit = eFundit ? pronat.find((p) => p.id === eFundit.pronaId) : undefined;

  return (
    <EkraniMeHero
      kicker="BALLINA"
      title="Mirë se erdhe!"
      subtitle={radhes ? `Vizita e radhës: ${dataEPlote(radhes.data)}.` : (profili?.emri ?? perdoruesi?.email)}
    >
      {eFundit ? (
        <Pressable
          style={styles.karta}
          onPress={() => router.push({ pathname: "/vizita/[id]", params: { id: eFundit.id } })}
          accessibilityRole="button"
          accessibilityLabel="Hap detajet e vizitës së fundit"
        >
          <Text style={styles.kicker}>VIZITA E FUNDIT</Text>
          <Text style={styles.titulli}>{titulliIVizites(eFundit.lloji)}</Text>
          <Text style={styles.nen}>
            {pronaEFundit?.emri ?? "Prona"} · {dataShkurt(eFundit.data)}
          </Text>
          <View style={styles.hapat}>
            <HapatEVizites statusi={eFundit.statusi} />
          </View>
          {eFundit.statusi === "kerkuar" ? (
            <Text style={styles.nen}>Kërkesa është dërguar. Pret që një Miku ta pranojë.</Text>
          ) : null}
          {eFundit.statusi === "pranuar" ? (
            <Text style={styles.nen}>
              {eFundit.mikuEmri ? `${eFundit.mikuEmri} e pranoi kërkesën.` : "Një Miku e pranoi kërkesën."}
            </Text>
          ) : null}
        </Pressable>
      ) : burimiVizitat === "duke_ngarkuar" ? (
        <ActivityIndicator color={colors.petrol} />
      ) : (
        <View style={styles.karta}>
          <Text style={styles.titulli}>Ende nuk ke vizita</Text>
          <Text style={styles.nen}>Kërko vizitën e parë për një nga pronat e tua: një Miku shkon aty dhe sjell dëshmi.</Text>
        </View>
      )}

      <Pressable style={styles.primary} onPress={() => router.push("/kerko-vizite")} accessibilityRole="button">
        <Text style={styles.primaryText}>Kërko një vizitë</Text>
        <UrezaIcon name="arrow" size={22} color={colors.white} strokeWidth={2.3} />
      </Pressable>

      <View style={styles.krye}>
        <Text style={styles.seksioni}>Pronat e mia</Text>
        <Pressable onPress={() => router.navigate("/pronat")} style={styles.link} accessibilityRole="button">
          <Text style={styles.linkText}>Të gjitha</Text>
          <UrezaIcon name="chevron" size={18} color={colors.petrol} strokeWidth={2.6} />
        </Pressable>
      </View>

      {burimiPronat === "supabase" && pronat.length === 0 ? (
        <Pressable style={styles.bosh} onPress={() => router.navigate("/pronat")} accessibilityRole="button">
          <Text style={styles.titulli}>Ende nuk ke asnjë pronë</Text>
          <Text style={styles.nen}>Shto të parën te Pronat: shtëpinë, prindërit ose tokën.</Text>
        </Pressable>
      ) : null}

      <View style={styles.grid}>
        {pronat.slice(0, 2).map((prona) => (
          <PronaKarta key={prona.id} prona={prona} width={kartaWidth} />
        ))}
      </View>
    </EkraniMeHero>
  );
}

const styles = StyleSheet.create({
  karta: { backgroundColor: colors.white, borderRadius: 20, borderWidth: 1, borderColor: "#E3EAF0", padding: 20, gap: 6 },
  kicker: { color: colors.teal, fontSize: 12, lineHeight: 16, fontWeight: "700", letterSpacing: 1.5 },
  titulli: { color: colors.ink, fontSize: 20, lineHeight: 26, fontWeight: "800" },
  nen: { color: colors.textSecondary, fontSize: 15, lineHeight: 22, fontWeight: "500" },
  hapat: { marginVertical: 10 },
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
  krye: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  seksioni: { color: colors.ink, fontSize: 20, lineHeight: 26, fontWeight: "800" },
  link: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: 4 },
  linkText: { color: colors.petrol, fontSize: 16, fontWeight: "800" },
  bosh: { backgroundColor: colors.white, borderRadius: 20, padding: 20, gap: 4, borderWidth: 1, borderColor: "#E3EAF0" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
});
