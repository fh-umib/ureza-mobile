import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { EkraniMeHero } from "@/components/EkraniMeHero";
import { StatusiChip } from "@/components/StatusiChip";
import { UrezaIcon } from "@/components/UrezaIcon";
import { GjendjaBosh } from "@/components/ui/GjendjaBosh";
import { SkeletiIListes } from "@/components/ui/Skeleti";
import { colors, font } from "@/constants/ureza";
import { useVerifikimiIm } from "@/lib/admini";
import { useProfiliIPunes } from "@/lib/kontrata";
import { useDhenat } from "@/lib/dhenat";
import { useProfili } from "@/lib/profili";
import { useSesioni } from "@/lib/sesioni";
import { LLOJET_E_VIZITES, dataMeOre, dataShkurt, titulliIVizites, type Vizita } from "@/lib/vizitat";

// A new Miku (no work profile yet) is taken to the first steps once per app session; after that
// the "Gati për punë" card leads there, so the Miku is never sent back again and again.
let fillimiUShfaq = false;

// The Miku's home (design: Miku pranon detyrën): the requests that wait for a Miku, and
// the visits this Miku has accepted. Opening a request shows its details and the button to accept.
export default function KerkesatPerMiken() {
  const { perdoruesi } = useSesioni();
  const { burimi: burimiProfilit } = useProfili();
  const { vizitat, pronat, burimiVizitat, rifresko } = useDhenat();

  const tePritura = vizitat.filter((v) => v.statusi === "kerkuar").sort((a, b) => a.data.localeCompare(b.data));
  const timet = vizitat.filter((v) => v.mikuId !== null && v.mikuId === perdoruesi?.id);
  const demo = burimiVizitat === "demo" || burimiProfilit === "demo";
  const router = useRouter();
  const verifikimi = useVerifikimiIm();
  const puna = useProfiliIPunes();
  const paProfilPune = puna.gati && !puna.profili?.lloji;

  useEffect(() => {
    if (!paProfilPune || fillimiUShfaq) return;
    fillimiUShfaq = true;
    router.push("/miku-fillimi");
  }, [paProfilPune, router]);

  return (
    <EkraniMeHero
      kicker="MIKU"
      title="Kërkesat"
      subtitle={tePritura.length > 0 ? `${tePritura.length} të reja presin një Miku.` : "Vizitat që presin një Miku."}
    >
      {burimiVizitat === "duke_ngarkuar" ? <SkeletiIListes rreshta={3} /> : null}

      {burimiVizitat === "pa_lidhje" ? (
        <GjendjaBosh
          toni="gabim"
          titulli="Kërkesat nuk u ngarkuan"
          teksti="Nuk u lidh me serverin. Kontrollo internetin dhe provo përsëri."
          veprimi={{ etiketa: "Provo përsëri", onPress: () => void rifresko() }}
        />
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

      {verifikimi.njohur ? (
        <View style={[styles.shenim, verifikimi.verifikuarAt ? styles.verifikuar : styles.paVerifikuar]}>
          <UrezaIcon
            name={verifikimi.verifikuarAt ? "shield" : "clock"}
            size={20}
            color={verifikimi.verifikuarAt ? colors.ok : colors.kujdes}
          />
          <Text style={[styles.shenimText, { color: verifikimi.verifikuarAt ? colors.ok : colors.kujdes }]}>
            {verifikimi.verifikuarAt
              ? `Je Miku i verifikuar nga ekipi i Urëzës (që më ${dataMeOre(verifikimi.verifikuarAt)}).`
              : "Ekipi i Urëzës ende nuk të ka verifikuar. Kërkesat e reja i sheh dhe i pranon vetëm pasi të verifikohesh."}
          </Text>
        </View>
      ) : null}

      {puna.gati && !puna.profili?.lloji ? (
        <Pressable
          style={[styles.shenim, styles.paVerifikuar]}
          onPress={() => router.push("/profili")}
          accessibilityRole="button"
          accessibilityLabel="Plotëso si punon si Miku te Profili"
        >
          <UrezaIcon name="warning" size={20} color={colors.kujdes} />
          <Text style={[styles.shenimText, { color: colors.kujdes }]}>
            Para se të pranosh vizita, trego si punon te Profili: kompani, individ, student ose mjeshtër. Del në kontratë.
          </Text>
          <UrezaIcon name="chevron" size={18} color={colors.kujdes} strokeWidth={2.4} />
        </Pressable>
      ) : null}

      <Text style={styles.seksioni}>Kërkesa të reja</Text>
      {burimiVizitat !== "duke_ngarkuar" && burimiVizitat !== "pa_lidhje" && tePritura.length === 0 ? (
        <GjendjaBosh
          ikona="list"
          titulli="Nuk ka kërkesa të reja"
          teksti="Kur një klient kërkon një vizitë, shfaqet këtu që ta pranosh."
        />
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
  seksioni: { color: colors.ink, fontSize: 20, lineHeight: 26, fontFamily: font.w800 },
  shenim: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: colors.ikonaBg,
  },
  shenimText: { flex: 1, color: colors.petrol, fontSize: 15, lineHeight: 22, fontFamily: font.w600 },
  verifikuar: { backgroundColor: colors.okBg },
  paVerifikuar: { backgroundColor: colors.kujdesBg },
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
  ikona: { width: 48, height: 48, borderRadius: 15, backgroundColor: colors.ikonaBg, alignItems: "center", justifyContent: "center" },
  tekst: { flex: 1, gap: 4 },
  shigjeta: { alignSelf: "center" },
  titulli: { color: colors.ink, fontSize: 17, lineHeight: 22, fontFamily: font.w800 },
  nen: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, fontFamily: font.w500 },
  udhezime: { color: colors.ink, fontSize: 14, lineHeight: 20, fontFamily: font.w500 },
});
