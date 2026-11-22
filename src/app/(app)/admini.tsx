import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { EkraniMeHero } from "@/components/EkraniMeHero";
import { UrezaIcon, type IconName } from "@/components/UrezaIcon";
import { colors } from "@/constants/ureza";
import { usePaneliIAdminit, type MikuPerAdminin } from "@/lib/admini";
import { useDhenat } from "@/lib/dhenat";
import { useProfili } from "@/lib/profili";
import { VENDIMET_E_ADMINIT, dataMeOre, dataShkurt, titulliIVizites, type Statusi, type Vizita } from "@/lib/vizitat";

// The Admin's home (design: Admin paneli): how many visits are in each status, the disputed
// reports that wait for a decision (opening one shows the evidence and the decision form), and
// the Mikus with their verification. The rules live in supabase/admini.sql.

const NUMRAT: { titulli: string; statuset: Statusi[]; icon: IconName }[] = [
  { titulli: "Presin një Miku", statuset: ["kerkuar"], icon: "clock" },
  { titulli: "Në punë", statuset: ["pranuar", "vizita"], icon: "pin" },
  { titulli: "Raporte në pritje", statuset: ["raporti_gati"], icon: "list" },
  { titulli: "Të miratuara", statuset: ["miratuar"], icon: "check" },
  { titulli: "Të kundërshtuara", statuset: ["kundershtuar"], icon: "warning" },
];

export default function Paneli() {
  const { profili } = useProfili();
  const paneli = usePaneliIAdminit();
  const { vizitat, pronat, burimiVizitat, rifresko: rifreskoVizitat } = useDhenat();

  // new disputes may have arrived since the visits were loaded
  useFocusEffect(
    useCallback(() => {
      void rifreskoVizitat();
    }, [rifreskoVizitat]),
  );

  const teKundershtuara = vizitat.filter((v) => v.statusi === "kundershtuar");
  // the oldest dispute first: it has waited the longest
  const teHapura = teKundershtuara
    .filter((v) => !v.shqyrtuarAt)
    .sort((a, b) => (a.vendosurAt ?? a.krijuar).localeCompare(b.vendosurAt ?? b.krijuar));
  const teMbyllura = teKundershtuara
    .filter((v) => v.shqyrtuarAt)
    .sort((a, b) => (b.shqyrtuarAt ?? "").localeCompare(a.shqyrtuarAt ?? ""))
    .slice(0, 5);
  const paVerifikuar = paneli.mikut.filter((m) => !m.verifikuarAt).length;
  const emriProna = (v: Vizita) => pronat.find((p) => p.id === v.pronaId)?.emri ?? "Prona";

  const nentitulli =
    teHapura.length > 0
      ? `${teHapura.length} ${teHapura.length === 1 ? "rast pret" : "raste presin"} vendimin tënd.`
      : profili?.emri
        ? `${profili.emri} · ekipi i Urëzës`
        : "Ekipi i Urëzës";

  return (
    <EkraniMeHero kicker="ADMIN" title="Paneli" subtitle={nentitulli}>
      {paneli.burimi === "pa_lidhje" ? (
        <View style={styles.karta}>
          <Text style={styles.kartaTitulli}>Paneli nuk u ngarkua</Text>
          <Text style={styles.tekst}>Nuk u lidh me serverin. Kontrollo internetin dhe provo përsëri.</Text>
          <Pressable style={styles.dytesor} onPress={() => void paneli.rifresko()} accessibilityRole="button">
            <Text style={styles.dytesorText}>Provo përsëri</Text>
          </Pressable>
        </View>
      ) : null}

      {paneli.burimi === "mungon" ? (
        <View style={styles.shenim}>
          <UrezaIcon name="warning" size={20} color={colors.petrol} />
          <Text style={styles.shenimText}>{paneli.mesazhi}</Text>
        </View>
      ) : null}

      {/* 1 · The overview */}
      <Text style={styles.seksioni}>Përmbledhja</Text>
      {paneli.burimi === "duke_ngarkuar" ? <ActivityIndicator color={colors.petrol} /> : null}
      {paneli.burimi === "supabase" ? (
        <View style={styles.rrjeta}>
          {NUMRAT.map((n) => (
            <Pllaka
              key={n.titulli}
              icon={n.icon}
              titulli={n.titulli}
              numri={n.statuset.reduce((s, st) => s + (paneli.numrat[st] ?? 0), 0)}
            />
          ))}
          <Pllaka
            icon="shield"
            titulli="Mikut e verifikuar"
            numri={paneli.mikut.length - paVerifikuar}
            nga={paneli.mikut.length}
          />
        </View>
      ) : null}

      {/* 2 · Disputed reports */}
      <Text style={styles.seksioni}>Rastet e kundërshtuara</Text>
      {burimiVizitat === "duke_ngarkuar" ? <ActivityIndicator color={colors.petrol} /> : null}
      {burimiVizitat !== "duke_ngarkuar" && teHapura.length === 0 ? (
        <View style={styles.karta}>
          <Text style={styles.kartaTitulli}>Nuk ka raste të hapura</Text>
          <Text style={styles.tekst}>
            Kur një klient e kundërshton një raport, rasti shfaqet këtu me dëshmitë dhe arsyen e klientit.
          </Text>
        </View>
      ) : null}
      {teHapura.map((v) => (
        <RreshtiIRastit key={v.id} vizita={v} emriProna={emriProna(v)} />
      ))}

      {teMbyllura.length > 0 ? (
        <>
          <Text style={styles.nenSeksioni}>Të shqyrtuara së fundi</Text>
          {teMbyllura.map((v) => (
            <RreshtiIRastit key={v.id} vizita={v} emriProna={emriProna(v)} />
          ))}
        </>
      ) : null}

      {/* 3 · The Mikus */}
      <Text style={styles.seksioni}>Mikut</Text>
      {paneli.burimi === "supabase" && paneli.mikut.length === 0 ? (
        <View style={styles.karta}>
          <Text style={styles.kartaTitulli}>Ende asnjë Miku</Text>
          <Text style={styles.tekst}>Kur dikush zgjedh rolin Miku, shfaqet këtu që ta verifikosh.</Text>
        </View>
      ) : null}
      {paneli.mikut.map((m) => (
        <RreshtiIMikut key={m.id} miku={m} verifiko={paneli.verifikoMikun} />
      ))}
    </EkraniMeHero>
  );
}

function Pllaka({ icon, titulli, numri, nga }: { icon: IconName; titulli: string; numri: number; nga?: number }) {
  return (
    <View style={styles.pllaka} accessible accessibilityLabel={`${titulli}: ${numri}${nga !== undefined ? ` nga ${nga}` : ""}`}>
      <UrezaIcon name={icon} size={20} color={colors.petrol} />
      <Text style={styles.pllakaNumri}>
        {numri}
        {nga !== undefined ? <Text style={styles.pllakaNga}> / {nga}</Text> : null}
      </Text>
      <Text style={styles.pllakaTitulli}>{titulli}</Text>
    </View>
  );
}

function RreshtiIRastit({ vizita, emriProna }: { vizita: Vizita; emriProna: string }) {
  const router = useRouter();
  const vendimi = vizita.vendimiAdminit ? VENDIMET_E_ADMINIT[vizita.vendimiAdminit] : null;
  return (
    <Pressable
      style={styles.rreshti}
      onPress={() => router.push({ pathname: "/vizita/[id]", params: { id: vizita.id } })}
      accessibilityRole="button"
      accessibilityLabel={`${titulliIVizites(vizita.lloji)}, ${emriProna}, ${dataShkurt(vizita.data)}`}
    >
      <View style={[styles.ikona, !vendimi && styles.ikonaRast]}>
        <UrezaIcon name={vendimi ? "check" : "warning"} size={24} color={vendimi ? colors.petrol : colors.error} />
      </View>
      <View style={styles.rreshtiTekst}>
        <Text style={styles.rreshtiTitulli}>{titulliIVizites(vizita.lloji)}</Text>
        <Text style={styles.nen}>
          {emriProna} · {dataShkurt(vizita.data)} · {vizita.mikuEmri ?? "Miku"}
        </Text>
        {vendimi ? (
          <Text style={styles.nen}>
            {vendimi.titulli}
            {vizita.shqyrtuarAt ? ` · ${dataMeOre(vizita.shqyrtuarAt)}` : ""}
          </Text>
        ) : (
          <>
            {vizita.arsyeja ? (
              <Text style={styles.arsyeja} numberOfLines={2}>
                “{vizita.arsyeja}”
              </Text>
            ) : null}
            {vizita.vendosurAt ? <Text style={styles.nen}>Kundërshtuar më {dataMeOre(vizita.vendosurAt)}</Text> : null}
          </>
        )}
      </View>
      <View style={styles.shigjeta}>
        <UrezaIcon name="chevron" size={20} color={colors.petrol} strokeWidth={2.4} />
      </View>
    </Pressable>
  );
}

function RreshtiIMikut({
  miku,
  verifiko,
}: {
  miku: MikuPerAdminin;
  verifiko: (id: string, verifikuar: boolean) => Promise<string | null>;
}) {
  const [duke, setDuke] = useState(false);
  const [gabim, setGabim] = useState<string | null>(null);
  const [konfirmo, setKonfirmo] = useState(false);
  const verifikuar = miku.verifikuarAt !== null;

  async function ndrysho(vlera: boolean) {
    if (duke) return;
    setDuke(true);
    setGabim(null);
    const mesazh = await verifiko(miku.id, vlera);
    setDuke(false);
    setKonfirmo(false);
    if (mesazh) setGabim(mesazh);
  }

  return (
    <View style={styles.karta}>
      <View style={styles.mikuKrye}>
        <View style={styles.rreshtiTekst}>
          <Text style={styles.rreshtiTitulli}>{miku.emri}</Text>
          <Text style={styles.nen}>
            {miku.vizita} {miku.vizita === 1 ? "vizitë" : "vizita"} · regjistruar më {dataMeOre(miku.krijuarAt)}
          </Text>
          {miku.telefoni ? <Text style={styles.nen}>{miku.telefoni}</Text> : null}
        </View>
        <View style={[styles.chip, verifikuar ? styles.chipPo : styles.chipJo]}>
          <UrezaIcon
            name={verifikuar ? "shield" : "clock"}
            size={16}
            color={verifikuar ? "#1E6B3E" : "#8A5210"}
            strokeWidth={2.4}
          />
          <Text style={[styles.chipText, { color: verifikuar ? "#1E6B3E" : "#8A5210" }]}>
            {verifikuar ? "I verifikuar" : "Pa verifikuar"}
          </Text>
        </View>
      </View>
      {verifikuar && miku.verifikuarAt ? <Text style={styles.nen}>Verifikuar më {dataMeOre(miku.verifikuarAt)}</Text> : null}

      {gabim ? <Text style={styles.gabim}>{gabim}</Text> : null}

      {!verifikuar ? (
        <Pressable
          style={[styles.primary, duke && styles.disabled]}
          onPress={() => void ndrysho(true)}
          disabled={duke}
          accessibilityRole="button"
          accessibilityLabel={`Verifiko ${miku.emri}`}
        >
          {duke ? <ActivityIndicator color={colors.white} /> : <Text style={styles.primaryText}>Verifikoje</Text>}
        </Pressable>
      ) : konfirmo ? (
        <View style={styles.konfirmim}>
          <Text style={styles.konfirmimText}>Ta heqim verifikimin e {miku.emri}?</Text>
          <Pressable
            style={[styles.hiqPlote, duke && styles.disabled]}
            onPress={() => void ndrysho(false)}
            disabled={duke}
            accessibilityRole="button"
          >
            {duke ? <ActivityIndicator color={colors.white} /> : <Text style={styles.primaryText}>Po, hiqe</Text>}
          </Pressable>
          <Pressable style={styles.dytesor} onPress={() => setKonfirmo(false)} disabled={duke} accessibilityRole="button">
            <Text style={styles.dytesorText}>Jo, mbaje</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable style={styles.dytesor} onPress={() => setKonfirmo(true)} accessibilityRole="button">
          <Text style={styles.dytesorText}>Hiqe verifikimin</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  seksioni: { color: colors.ink, fontSize: 20, lineHeight: 26, fontWeight: "800" },
  nenSeksioni: { color: colors.textSecondary, fontSize: 16, lineHeight: 22, fontWeight: "800" },
  karta: { backgroundColor: colors.white, borderRadius: 20, padding: 18, gap: 8, borderWidth: 1, borderColor: "#E3EAF0" },
  kartaTitulli: { color: colors.ink, fontSize: 17, lineHeight: 22, fontWeight: "800" },
  tekst: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, fontWeight: "500" },
  shenim: { flexDirection: "row", alignItems: "flex-start", gap: 12, padding: 14, borderRadius: 16, backgroundColor: "#E8F5F3" },
  shenimText: { flex: 1, color: colors.petrol, fontSize: 15, lineHeight: 22, fontWeight: "600" },
  rrjeta: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  pllaka: {
    flexGrow: 1,
    flexBasis: "45%",
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E3EAF0",
    padding: 14,
    gap: 4,
  },
  pllakaNumri: { color: colors.ink, fontSize: 28, lineHeight: 34, fontWeight: "800" },
  pllakaNga: { color: colors.textSecondary, fontSize: 17, fontWeight: "700" },
  pllakaTitulli: { color: colors.textSecondary, fontSize: 14, lineHeight: 19, fontWeight: "600" },
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
  ikonaRast: { backgroundColor: "#FBE9E9" },
  rreshtiTekst: { flex: 1, gap: 3 },
  rreshtiTitulli: { color: colors.ink, fontSize: 17, lineHeight: 22, fontWeight: "800" },
  nen: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, fontWeight: "500" },
  arsyeja: { color: colors.ink, fontSize: 14, lineHeight: 20, fontWeight: "500", fontStyle: "italic" },
  shigjeta: { alignSelf: "center" },
  mikuKrye: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  chip: { height: 32, paddingHorizontal: 10, borderRadius: 16, flexDirection: "row", alignItems: "center", gap: 6 },
  chipPo: { backgroundColor: "#E4F6EB" },
  chipJo: { backgroundColor: "#FFF2DE" },
  chipText: { fontSize: 13, fontWeight: "700" },
  gabim: { color: colors.error, fontSize: 14, lineHeight: 20, fontWeight: "600" },
  primary: { height: 52, borderRadius: 16, backgroundColor: colors.petrol, alignItems: "center", justifyContent: "center" },
  primaryText: { color: colors.white, fontSize: 16, fontWeight: "700" },
  disabled: { opacity: 0.6 },
  dytesor: { minHeight: 48, alignItems: "center", justifyContent: "center" },
  dytesorText: { color: colors.petrol, fontSize: 16, fontWeight: "700" },
  konfirmim: { gap: 8, padding: 14, borderRadius: 16, backgroundColor: "#FDECEA" },
  konfirmimText: { color: "#7A1F1B", fontSize: 15, lineHeight: 22, fontWeight: "600" },
  hiqPlote: { height: 52, borderRadius: 16, backgroundColor: colors.error, alignItems: "center", justifyContent: "center" },
});
