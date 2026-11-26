import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { EkraniMeHero } from "@/components/EkraniMeHero";
import { GrafikuIDiteve, ListaEShiritave, PllakaETreguesit } from "@/components/PaneliGrafiket";
import { UrezaIcon } from "@/components/UrezaIcon";
import { GjendjaBosh } from "@/components/ui/GjendjaBosh";
import { SkeletiIKartes } from "@/components/ui/Skeleti";
import { colors } from "@/constants/ureza";
import { usePaneliIAdminit, type MikuPerAdminin } from "@/lib/admini";
import { useDhenat } from "@/lib/dhenat";
import { useProfili } from "@/lib/profili";
import {
  LLOJET_E_VIZITES,
  STATUSET,
  VENDIMET_E_ADMINIT,
  dataMeOre,
  dataShkurt,
  oraNeTekst,
  titulliIVizites,
  type Statusi,
  type Vizita,
} from "@/lib/vizitat";

// The Admin's home (design: Admin paneli), a dashboard:
//   1. the cases that wait for a decision (the one number that asks the admin to act);
//   2. the key figures, the requests of the last 14 days, where the visits are, their kinds;
//   3. the disputed reports (opening one shows the evidence and the decision form);
//   4. the Mikus and their verification.
// Every figure is a number from treguesit_e_panelit() (supabase/admini.sql): the admin never
// reads a visit that was not disputed.

// The steps of a visit, in order, for the "Ku janë vizitat" bars.
const RENDI_I_STATUSEVE: Statusi[] = ["kerkuar", "pranuar", "vizita", "raporti_gati", "miratuar", "kundershtuar"];

// 3.4 -> "3,4 orë"; 0.5 -> "30 min"; 60 -> "2,5 ditë" (Albanian decimal comma)
function kohaNeTekst(ore: number | null): string {
  if (ore === null) return "—";
  const me1 = (n: number) => n.toFixed(1).replace(/\.0$/, "").replace(".", ",");
  if (ore < 1) return `${Math.max(1, Math.round(ore * 60))} min`;
  if (ore < 48) return `${me1(ore)} orë`;
  return `${me1(ore / 24)} ditë`;
}

export default function Paneli() {
  const router = useRouter();
  const { profili } = useProfili();
  const paneli = usePaneliIAdminit();
  const { vizitat, pronat, burimiVizitat, rifresko: rifreskoVizitat } = useDhenat();
  const [filtriMikut, setFiltriMikut] = useState<"pritje" | "te_gjithe">("pritje");

  // new disputes may have arrived since the visits were loaded
  useFocusEffect(
    useCallback(() => {
      void rifreskoVizitat();
    }, [rifreskoVizitat]),
  );

  function rifreskoKrejt() {
    void paneli.rifresko();
    void rifreskoVizitat();
  }

  // --- the disputed cases (they come through DhenatProvider: the admin reads only these visits)
  const teKundershtuara = vizitat.filter((v) => v.statusi === "kundershtuar");
  const teHapura = teKundershtuara
    .filter((v) => !v.shqyrtuarAt)
    .sort((a, b) => (a.vendosurAt ?? a.krijuar).localeCompare(b.vendosurAt ?? b.krijuar)); // oldest first
  const teMbyllura = teKundershtuara
    .filter((v) => v.shqyrtuarAt)
    .sort((a, b) => (b.shqyrtuarAt ?? "").localeCompare(a.shqyrtuarAt ?? ""))
    .slice(0, 5);
  const emriProna = (v: Vizita) => pronat.find((p) => p.id === v.pronaId)?.emri ?? "Prona";

  // --- the figures
  const t = paneli.treguesit;
  const numri = (s: Statusi) => t.statuset[s] ?? 0;
  const gjithsej = RENDI_I_STATUSEVE.reduce((s, st) => s + numri(st), 0);
  const nePune = numri("kerkuar") + numri("pranuar") + numri("vizita") + numri("raporti_gati");
  const teVendosura = numri("miratuar") + numri("kundershtuar");
  const norma = teVendosura > 0 ? Math.round((numri("miratuar") / teVendosura) * 100) : null;
  const kerkesat14 = t.ditet.reduce((s, d) => s + d.numri, 0);

  // --- the Mikus (counted from the list, so a verification shows at once)
  const paVerifikuar = paneli.mikut.filter((m) => !m.verifikuarAt);
  const teVerifikuar = paneli.mikut.length - paVerifikuar.length;
  const mikutNeListe = filtriMikut === "pritje" ? paVerifikuar : paneli.mikut;

  const gati = paneli.burimi === "supabase";

  return (
    <EkraniMeHero
      kicker="ADMIN · PANELI"
      title="Paneli"
      subtitle={profili?.emri ? `${profili.emri} · ekipi i Urëzës` : "Ekipi i Urëzës"}
    >
      {paneli.burimi === "pa_lidhje" ? (
        <View style={styles.karta}>
          <Text style={styles.kartaTitulli}>Paneli nuk u ngarkua</Text>
          <Text style={styles.tekst}>Nuk u lidh me serverin. Kontrollo internetin dhe provo përsëri.</Text>
          <Pressable style={styles.dytesor} onPress={rifreskoKrejt} accessibilityRole="button">
            <Text style={styles.dytesorText}>Provo përsëri</Text>
          </Pressable>
        </View>
      ) : null}

      {paneli.burimi === "mungon" ? (
        <View style={styles.shenimKolone}>
          <View style={styles.rreshtIkone}>
            <UrezaIcon name="warning" size={20} color={colors.petrol} />
            <Text style={styles.shenimText}>{paneli.mesazhi}</Text>
          </View>
          {/* e.g. after running the SQL file while this screen was open */}
          <Pressable style={styles.dytesor} onPress={rifreskoKrejt} accessibilityRole="button">
            <Text style={styles.dytesorText}>Provo përsëri</Text>
          </Pressable>
        </View>
      ) : null}

      {/* 1 · What needs the admin now */}
      {burimiVizitat === "duke_ngarkuar" ? (
        <SkeletiIKartes />
      ) : teHapura.length > 0 ? (
        <View style={[styles.karta, styles.kartaRast]}>
          <View style={styles.rreshtIkone}>
            <UrezaIcon name="warning" size={20} color={colors.error} strokeWidth={2.4} />
            <Text style={styles.rastEtiketa}>Presin vendimin tënd</Text>
          </View>
          <Text style={styles.heroNumri}>{teHapura.length}</Text>
          <Text style={styles.rastTekst}>
            {teHapura.length === 1 ? "Një raport i kundërshtuar" : `${teHapura.length} raporte të kundërshtuara`}
            {teHapura[0].vendosurAt ? `, më i vjetri që më ${dataMeOre(teHapura[0].vendosurAt)}.` : "."}
          </Text>
          <Pressable
            style={styles.primary}
            onPress={() => router.push({ pathname: "/vizita/[id]", params: { id: teHapura[0].id } })}
            accessibilityRole="button"
          >
            <Text style={styles.primaryText}>Shqyrto rastin më të vjetër</Text>
          </Pressable>
        </View>
      ) : (
        <View style={[styles.karta, styles.kartaMire]}>
          <View style={styles.rreshtIkone}>
            <UrezaIcon name="check" size={22} color="#1E6B3E" strokeWidth={2.6} />
            <Text style={[styles.kartaTitulli, styles.mireTitulli]}>Asnjë rast në pritje</Text>
          </View>
          <Text style={styles.mireTekst}>
            Kur një klient e kundërshton një raport, rasti shfaqet këtu me dëshmitë dhe arsyen e klientit.
          </Text>
        </View>
      )}

      {/* 2 · The figures */}
      <Text style={styles.seksioni}>Treguesit</Text>
      {paneli.burimi === "duke_ngarkuar" ? <SkeletiIKartes /> : null}
      {gati ? (
        <>
          <View style={styles.rrjeta}>
            <PllakaETreguesit
              ikona="list"
              etiketa="Vizita gjithsej"
              vlera={String(gjithsej)}
              konteksti={`${nePune} në punë tani`}
            />
            <PllakaETreguesit
              ikona="check"
              etiketa="Norma e miratimit"
              vlera={norma === null ? "—" : `${norma}%`}
              konteksti={teVendosura > 0 ? `${numri("miratuar")} nga ${teVendosura} raporte` : "Ende asnjë vendim"}
            />
            <PllakaETreguesit
              ikona="clock"
              etiketa="Koha deri te pranimi"
              vlera={kohaNeTekst(t.pranimiMesatarOre)}
              konteksti="Mesatarja, nga kërkesa te Miku"
            />
            <PllakaETreguesit
              ikona="shield"
              etiketa="Mikut e verifikuar"
              vlera={`${teVerifikuar}/${paneli.mikut.length}`}
              konteksti={`${t.klientet} ${t.klientet === 1 ? "klient" : "klientë"} në aplikacion`}
              matesi={{ vlera: teVerifikuar, gjithsej: paneli.mikut.length }}
            />
          </View>

          <View style={styles.karta}>
            <Text style={styles.kartaTitulli}>Kërkesat, 14 ditët e fundit</Text>
            <Text style={styles.tekst}>
              {kerkesat14} {kerkesat14 === 1 ? "kërkesë e re" : "kërkesa të reja"}
            </Text>
            <GrafikuIDiteve ditet={t.ditet} />
          </View>

          <View style={styles.karta}>
            <Text style={styles.kartaTitulli}>Ku janë vizitat</Text>
            <Text style={styles.tekst}>Sa vizita janë në secilin hap tani.</Text>
            <ListaEShiritave
              rreshtat={RENDI_I_STATUSEVE.map((s) => ({ emri: STATUSET[s].emri, ikona: STATUSET[s].icon, numri: numri(s) }))}
            />
          </View>

          <View style={styles.karta}>
            <Text style={styles.kartaTitulli}>Llojet e vizitave</Text>
            <ListaEShiritave
              rreshtat={LLOJET_E_VIZITES.map((l) => ({ emri: l.titulli, ikona: l.icon, numri: t.llojet[l.vlera] ?? 0 }))}
            />
          </View>
        </>
      ) : null}

      {/* 3 · Disputed reports */}
      <Text style={styles.seksioni}>Rastet e kundërshtuara</Text>
      {burimiVizitat !== "duke_ngarkuar" && teHapura.length === 0 && teMbyllura.length === 0 ? (
        <GjendjaBosh
          ikona="shield"
          titulli="Asnjë raport i kundërshtuar"
          teksti="Kur një klient kundërshton një raport, rasti shfaqet këtu që ta shqyrtosh."
        />
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

      {/* 4 · The Mikus */}
      <Text style={styles.seksioni}>Mikut</Text>
      {gati ? (
        <View style={styles.filtrat} accessibilityRole="tablist">
          {(
            [
              { vlera: "pritje", emri: `Presin verifikim (${paVerifikuar.length})` },
              { vlera: "te_gjithe", emri: `Të gjithë (${paneli.mikut.length})` },
            ] as const
          ).map((f) => {
            const aktiv = filtriMikut === f.vlera;
            return (
              <Pressable
                key={f.vlera}
                style={[styles.filtri, aktiv && styles.filtriAktiv]}
                onPress={() => setFiltriMikut(f.vlera)}
                accessibilityRole="tab"
                accessibilityState={{ selected: aktiv }}
              >
                <Text style={[styles.filtriText, aktiv && styles.filtriTextAktiv]}>{f.emri}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
      {gati && mikutNeListe.length === 0 ? (
        <Text style={styles.tekst}>
          {filtriMikut === "pritje"
            ? "Të gjithë Mikut janë të verifikuar."
            : "Ende asnjë Miku. Kur dikush zgjedh rolin Miku, shfaqet këtu."}
        </Text>
      ) : null}
      {mikutNeListe.map((m) => (
        <RreshtiIMikut key={m.id} miku={m} verifiko={paneli.verifikoMikun} />
      ))}

      {gati && paneli.perditesuarAt ? (
        <View style={styles.fundi}>
          <Text style={styles.fundiText}>Përditësuar në {oraNeTekst(paneli.perditesuarAt)}</Text>
          <Pressable style={styles.rifresko} onPress={rifreskoKrejt} accessibilityRole="button">
            <Text style={styles.dytesorText}>Rifresko</Text>
          </Pressable>
        </View>
      ) : null}
    </EkraniMeHero>
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
    <View style={styles.kartaMiku}>
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
  seksioni: { color: colors.ink, fontSize: 20, lineHeight: 26, fontWeight: "800", marginTop: 4 },
  nenSeksioni: { color: colors.textSecondary, fontSize: 16, lineHeight: 22, fontWeight: "800" },
  karta: { backgroundColor: colors.white, borderRadius: 20, padding: 18, gap: 8, borderWidth: 1, borderColor: "#E3EAF0" },
  kartaTitulli: { color: colors.ink, fontSize: 17, lineHeight: 22, fontWeight: "800" },
  tekst: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, fontWeight: "500" },
  shenim: { flexDirection: "row", alignItems: "flex-start", gap: 12, padding: 14, borderRadius: 16, backgroundColor: "#E8F5F3" },
  shenimText: { flex: 1, color: colors.petrol, fontSize: 15, lineHeight: 22, fontWeight: "600" },
  shenimKolone: { gap: 4, padding: 14, borderRadius: 16, backgroundColor: "#E8F5F3" },
  rreshtIkone: { flexDirection: "row", alignItems: "center", gap: 8 },

  kartaRast: { backgroundColor: "#FBE9E9", borderColor: "#F3CFCF" },
  rastEtiketa: { color: "#7A1F1B", fontSize: 15, fontWeight: "800" },
  heroNumri: { color: "#7A1F1B", fontSize: 56, lineHeight: 62, fontWeight: "800" },
  rastTekst: { color: "#7A1F1B", fontSize: 15, lineHeight: 22, fontWeight: "600" },
  kartaMire: { backgroundColor: "#E4F6EB", borderColor: "#CBEBD7" },
  mireTitulli: { color: "#1E6B3E" },
  mireTekst: { color: "#1E6B3E", fontSize: 14, lineHeight: 20, fontWeight: "600" },

  rrjeta: { flexDirection: "row", flexWrap: "wrap", gap: 10 },

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

  filtrat: { flexDirection: "row", gap: 4, padding: 4, borderRadius: 16, backgroundColor: "#E3EAF0" },
  filtri: { flex: 1, minHeight: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", paddingHorizontal: 6 },
  filtriAktiv: { backgroundColor: colors.white },
  filtriText: { color: colors.textSecondary, fontSize: 14, fontWeight: "700", textAlign: "center" },
  filtriTextAktiv: { color: colors.petrol, fontWeight: "800" },

  kartaMiku: { backgroundColor: colors.white, borderRadius: 20, padding: 18, gap: 8, borderWidth: 1, borderColor: "#E3EAF0" },
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

  fundi: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  fundiText: { color: colors.textSecondary, fontSize: 13, fontWeight: "600" },
  rifresko: { minHeight: 44, paddingHorizontal: 12, alignItems: "center", justifyContent: "center" },
});
