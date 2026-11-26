import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { EkraniMeHero } from "@/components/EkraniMeHero";
import { StatusiChip } from "@/components/StatusiChip";
import { UrezaIcon, type IconName } from "@/components/UrezaIcon";
import { GjendjaBosh } from "@/components/ui/GjendjaBosh";
import { SkeletiIListes } from "@/components/ui/Skeleti";
import { colors, font, hija, rrezja } from "@/constants/ureza";
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
  const { burimi: burimiProfilit, profili, cilesimet } = useProfili();
  const { vizitat, pronat, burimiVizitat, rifresko } = useDhenat();

  const tePritura = vizitat.filter((v) => v.statusi === "kerkuar").sort((a, b) => a.data.localeCompare(b.data));
  const timet = vizitat.filter((v) => v.mikuId !== null && v.mikuId === perdoruesi?.id);
  const demo = burimiVizitat === "demo" || burimiProfilit === "demo";
  const router = useRouter();
  const verifikimi = useVerifikimiIm();
  const puna = useProfiliIPunes();
  const paProfilPune = puna.gati && !puna.profili?.lloji;
  const profiliPlote = (profili?.emri ?? "").trim().length >= 2 && (cilesimet.telefoni ?? "") !== "";

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

      <GatiPerPune
        profiliPlote={profiliPlote}
        punaPlote={!!puna.profili?.lloji}
        punaNjohur={puna.gati}
        verifikuarAt={verifikimi.njohur ? verifikimi.verifikuarAt : null}
        verifikimiNjohur={verifikimi.njohur}
      />

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

// "Gati për punë": the three things a Miku needs before taking visits, as rows with an icon, a
// word and an arrow to where each is done. When all three are done, it shrinks to one badge.
function GatiPerPune({
  profiliPlote,
  punaPlote,
  punaNjohur,
  verifikuarAt,
  verifikimiNjohur,
}: {
  profiliPlote: boolean;
  punaPlote: boolean;
  punaNjohur: boolean;
  verifikuarAt: string | null;
  verifikimiNjohur: boolean;
}) {
  const router = useRouter();
  const verifikuar = verifikuarAt !== null;

  if (profiliPlote && punaPlote && verifikuar) {
    return (
      <View
        style={styles.gatiShenja}
        accessible
        accessibilityLabel={`I verifikuar nga ekipi i Urëzës që më ${dataMeOre(verifikuarAt)}. Gati për punë.`}
      >
        <UrezaIcon name="shield" size={16} color={colors.ok} strokeWidth={2.4} />
        <Text style={styles.gatiShenjaTeksti}>I verifikuar · gati për punë</Text>
      </View>
    );
  }

  const rreshtat: { ikona: IconName; titulli: string; gjendja: "po" | "jo" | "pret"; teksti: string; shko: () => void }[] = [
    {
      ikona: "user",
      titulli: "Profili",
      gjendja: profiliPlote ? "po" : "jo",
      teksti: profiliPlote ? "Emri dhe telefoni" : "Shto emrin dhe telefonin",
      shko: () => router.push("/miku-fillimi"),
    },
    {
      ikona: "doc",
      titulli: "Lloji i punës",
      gjendja: punaPlote ? "po" : "jo",
      teksti: punaPlote ? "Del në çdo kontratë" : punaNjohur ? "Kompani, individ, student ose mjeshtër" : "Po ngarkohet",
      shko: () => router.push(punaPlote ? "/profili" : "/miku-fillimi"),
    },
    {
      ikona: "shield",
      titulli: "Verifikimi",
      gjendja: verifikuar ? "po" : "pret",
      teksti: verifikuar
        ? "Nga ekipi i Urëzës"
        : verifikimiNjohur
          ? "Ekipi të thërret dhe të verifikon"
          : "Po kontrollohet",
      shko: () => router.push("/miku-fillimi"),
    },
  ];
  const sa = rreshtat.filter((r) => r.gjendja === "po").length;

  return (
    <View style={styles.gati}>
      <View style={styles.gatiKrye}>
        <Text style={styles.gatiTitulli} accessibilityRole="header">
          Gati për punë
        </Text>
        <Text style={styles.gatiNumri}>{sa} nga 3</Text>
      </View>
      {rreshtat.map((r, i) => {
        const pamja =
          r.gjendja === "po"
            ? { ikona: "check" as const, fg: colors.ok, bg: colors.okBg, fjala: "Gati" }
            : r.gjendja === "pret"
              ? { ikona: "clock" as const, fg: colors.kujdes, bg: colors.kujdesBg, fjala: "Në pritje" }
              : { ikona: "warning" as const, fg: colors.kujdes, bg: colors.kujdesBg, fjala: "Mungon" };
        return (
          <Pressable
            key={r.titulli}
            onPress={r.shko}
            style={({ pressed }) => [styles.gatiRresht, i > 0 && styles.gatiNdarje, pressed && styles.shtypur]}
            accessibilityRole="button"
            accessibilityLabel={`${r.titulli}: ${pamja.fjala}. ${r.teksti}`}
          >
            <View style={styles.gatiIkona}>
              <UrezaIcon name={r.ikona} size={20} color={colors.petrol} strokeWidth={2.2} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.gatiRreshtTitulli}>{r.titulli}</Text>
              <Text style={styles.gatiRreshtTeksti}>{r.teksti}</Text>
            </View>
            <View style={[styles.gatiChip, { backgroundColor: pamja.bg }]}>
              <UrezaIcon name={pamja.ikona} size={13} color={pamja.fg} strokeWidth={2.6} />
              <Text style={[styles.gatiChipTeksti, { color: pamja.fg }]}>{pamja.fjala}</Text>
            </View>
            <UrezaIcon name="chevron" size={18} color={colors.petrol} strokeWidth={2.4} />
          </Pressable>
        );
      })}
    </View>
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
  flex: { flex: 1, minWidth: 0 },
  shtypur: { opacity: 0.85 },
  gati: { backgroundColor: colors.white, borderRadius: rrezja.karta, paddingHorizontal: 14, paddingVertical: 12, ...hija.karta },
  gatiKrye: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingBottom: 6 },
  gatiTitulli: { color: colors.ink, fontSize: 18, lineHeight: 24, fontFamily: font.w800 },
  gatiNumri: { color: colors.textSecondary, fontSize: 13, fontFamily: font.w700 },
  gatiRresht: { minHeight: 64, flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 },
  gatiNdarje: { borderTopWidth: 1, borderTopColor: colors.background },
  gatiIkona: {
    width: 38,
    height: 38,
    borderRadius: rrezja.ikona,
    backgroundColor: colors.ikonaBg,
    alignItems: "center",
    justifyContent: "center",
  },
  gatiRreshtTitulli: { color: colors.ink, fontSize: 15, lineHeight: 20, fontFamily: font.w800 },
  gatiRreshtTeksti: { color: colors.textSecondary, fontSize: 13, lineHeight: 18, fontFamily: font.w500 },
  gatiChip: { flexDirection: "row", alignItems: "center", gap: 4, height: 26, paddingHorizontal: 8, borderRadius: 13 },
  gatiChipTeksti: { fontSize: 12, fontFamily: font.w800 },
  gatiShenja: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: colors.okBg,
  },
  gatiShenjaTeksti: { color: colors.ok, fontSize: 13, fontFamily: font.w800 },
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
