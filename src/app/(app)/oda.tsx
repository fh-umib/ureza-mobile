import { useRouter } from "expo-router";
import { useState, type ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { EkraniMeHero } from "@/components/EkraniMeHero";
import {
  GrafikuIMuajve,
  MbulimiIPronave,
  NGJYRA_INSPEKTIM,
  NGJYRA_KUJDES,
  ShiritiIStatuseve,
  type MbulimiIPrones,
  type MuajiIGrafikut,
} from "@/components/OdaGrafiket";
import { PronaIlustrim } from "@/components/PronaIlustrim";
import { StatusiChip } from "@/components/StatusiChip";
import { UrezaIcon, type IconName } from "@/components/UrezaIcon";
import { SkeletiIFaqes } from "@/components/ui/Skeleti";
import { colors } from "@/constants/ureza";
import { useDhenat } from "@/lib/dhenat";
import type { Prona } from "@/lib/pronat";
import {
  DITET_SHKURT,
  LLOJET_E_VIZITES,
  MUAJT,
  STATUSET,
  dataNeTekst,
  dataNgaTekst,
  titulliIVizites,
  type Statusi,
  type Vizita,
} from "@/lib/vizitat";

// "Oda" (the family's archive): a summary of every visit in figures and charts, then the full
// history as a timeline, grouped by month, newest first, with filters.

const DITA_MS = 24 * 60 * 60 * 1000;
const TE_MBYLLURA: Statusi[] = ["miratuar", "kundershtuar"];

type Filtri = "te_gjitha" | "ne_proces" | "per_vendim" | "inspektim" | "kujdes";
const FILTRAT: { vlera: Filtri; emri: string }[] = [
  { vlera: "te_gjitha", emri: "Të gjitha" },
  { vlera: "ne_proces", emri: "Në proces" },
  { vlera: "per_vendim", emri: "Për vendim" },
  { vlera: "inspektim", emri: "Inspektim" },
  { vlera: "kujdes", emri: "Prindërit" },
];

function kalonFiltrin(v: Vizita, f: Filtri): boolean {
  switch (f) {
    case "te_gjitha":
      return true;
    case "ne_proces":
      return !TE_MBYLLURA.includes(v.statusi) && v.statusi !== "raporti_gati";
    case "per_vendim":
      return v.statusi === "raporti_gati";
    case "inspektim":
    case "kujdes":
      return v.lloji === f;
  }
}

function sipasMuajit(vizitat: Vizita[]): { muaji: string; vizitat: Vizita[] }[] {
  const grupet: { muaji: string; vizitat: Vizita[] }[] = [];
  for (const v of vizitat) {
    const d = dataNgaTekst(v.data);
    const muaji = `${MUAJT[d.getMonth()].toUpperCase()} ${d.getFullYear()}`;
    const eFundit = grupet[grupet.length - 1];
    if (eFundit && eFundit.muaji === muaji) eFundit.vizitat.push(v);
    else grupet.push({ muaji, vizitat: [v] });
  }
  return grupet;
}

// The last six months (oldest first), with the visits of each kind.
function gjashteMuajt(vizitat: Vizita[]): MuajiIGrafikut[] {
  const sot = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(sot.getFullYear(), sot.getMonth() - 5 + i, 1);
    const tehMuajit = vizitat.filter((v) => {
      const dv = dataNgaTekst(v.data);
      return dv.getFullYear() === d.getFullYear() && dv.getMonth() === d.getMonth();
    });
    return {
      emri: MUAJT[d.getMonth()].slice(0, 3),
      emriIPlote: `${MUAJT[d.getMonth()]} ${d.getFullYear()}`,
      inspektim: tehMuajit.filter((v) => v.lloji === "inspektim").length,
      kujdes: tehMuajit.filter((v) => v.lloji === "kujdes").length,
    };
  });
}

// How many visits each property had and how many days ago the last one (up to today) was.
function mbulimi(pronat: Prona[], vizitat: Vizita[]): MbulimiIPrones[] {
  const sot = dataNgaTekst(dataNeTekst(new Date())).getTime();
  return pronat.map((p) => {
    const tePrones = vizitat.filter((v) => v.pronaId === p.id);
    const deriSot = tePrones.filter((v) => dataNgaTekst(v.data).getTime() <= sot);
    const eFundit = deriSot.sort((a, b) => b.data.localeCompare(a.data))[0];
    return {
      id: p.id,
      emri: p.emri,
      vizita: tePrones.length,
      ditePara: eFundit ? Math.round((sot - dataNgaTekst(eFundit.data).getTime()) / DITA_MS) : null,
    };
  });
}

// Average time from request to a Miku accepting it, in words ("5 orë", "2 ditë").
function kohaEPranimit(vizitat: Vizita[]): string {
  const kohet = vizitat
    .filter((v) => v.pranuarAt)
    .map((v) => new Date(v.pranuarAt as string).getTime() - new Date(v.krijuar).getTime())
    .filter((ms) => ms >= 0);
  if (kohet.length === 0) return "—";
  const ore = kohet.reduce((s, ms) => s + ms, 0) / kohet.length / (60 * 60 * 1000);
  if (ore < 1) return "< 1 orë";
  if (ore < 48) return `${Math.round(ore)} orë`;
  return `${Math.round(ore / 24)} ditë`;
}

function Hyrje({ i, children }: { i: number; children: ReactNode }) {
  return <Animated.View entering={FadeInDown.delay(70 * Math.min(i, 8)).duration(400)}>{children}</Animated.View>;
}

export default function Oda() {
  const router = useRouter();
  const { vizitat, pronat, burimiVizitat } = useDhenat();
  const [filtri, setFiltri] = useState<Filtri>("te_gjitha");

  const miratuar = vizitat.filter((v) => v.statusi === "miratuar").length;
  const kundershtuar = vizitat.filter((v) => v.statusi === "kundershtuar").length;
  const perVendim = vizitat.filter((v) => v.statusi === "raporti_gati").length;
  const neProces = vizitat.length - miratuar - kundershtuar - perVendim;
  const teVendosura = miratuar + kundershtuar;
  const besimi = teVendosura > 0 ? `${Math.round((miratuar / teVendosura) * 100)}%` : "—";

  const teFiltruara = vizitat.filter((v) => kalonFiltrin(v, filtri));
  const grupet = sipasMuajit(teFiltruara);
  const kaVizita = vizitat.length > 0;

  const kerko = (pronaId?: string) => {
    const prona = pronat.find((p) => p.id === pronaId);
    router.push({
      pathname: "/kerko-vizite",
      params: prona ? { pronaId: prona.id, lloji: prona.lloji === "prindert" ? "kujdes" : "inspektim" } : {},
    });
  };

  return (
    <EkraniMeHero
      kicker="ODA E FAMILJES"
      title="Oda"
      subtitle={kaVizita ? `${vizitat.length} vizita, me dëshmi dhe raport.` : "Historia e çdo vizite, me dëshmi."}
    >
      {burimiVizitat === "duke_ngarkuar" ? <SkeletiIFaqes rreshta={4} /> : null}

      {burimiVizitat !== "duke_ngarkuar" && !kaVizita ? (
        <Hyrje i={0}>
          <View style={styles.bosh}>
            <View style={styles.boshFoto}>
              <PronaIlustrim lloji="ceti" />
            </View>
            <Text style={styles.boshTitle}>Oda është ende bosh</Text>
            <Text style={styles.boshText}>
              Çdo vizitë që kërkon shfaqet këtu: me foto, vendndodhje, zë dhe raport. Këtu do të shohësh edhe grafikët e
              familjes.
            </Text>
            <Pressable style={styles.primary} onPress={() => kerko()} accessibilityRole="button">
              <Text style={styles.primaryText}>Kërko vizitën e parë</Text>
              <UrezaIcon name="arrow" size={20} color={colors.white} strokeWidth={2.4} />
            </Pressable>
          </View>
        </Hyrje>
      ) : null}

      {kaVizita ? (
        <>
          <Hyrje i={0}>
            <View style={styles.shifrat}>
              <Shifra icon="book" vlera={String(vizitat.length)} etiketa="Vizita gjithsej" />
              <Shifra icon="check" vlera={besimi} etiketa="Raporte të miratuara" />
              <Shifra icon="clock" vlera={kohaEPranimit(vizitat)} etiketa="Deri te pranimi" />
            </View>
          </Hyrje>

          <Hyrje i={1}>
            <Karta titulli="Gjendja e vizitave" ikona="shield">
              <ShiritiIStatuseve
                pjeset={[
                  { emri: "Miratuar", numri: miratuar, ngjyra: colors.ok, ikona: "check" },
                  { emri: "Për vendimin tënd", numri: perVendim, ngjyra: colors.kujdes, ikona: "sparkle" },
                  { emri: "Në proces", numri: neProces, ngjyra: colors.petrol, ikona: "clock" },
                  { emri: "Kundërshtuar", numri: kundershtuar, ngjyra: colors.error, ikona: "warning" },
                ]}
              />
            </Karta>
          </Hyrje>

          <Hyrje i={2}>
            <Karta titulli="Aktiviteti, 6 muajt e fundit" ikona="clock">
              <GrafikuIMuajve muajt={gjashteMuajt(vizitat)} />
            </Karta>
          </Hyrje>

          {pronat.length > 0 ? (
            <Hyrje i={3}>
              <Karta titulli="Mbulimi i pronave" ikona="houses">
                <MbulimiIPronave pronat={mbulimi(pronat, vizitat)} onKerko={kerko} />
              </Karta>
            </Hyrje>
          ) : null}

          <Hyrje i={4}>
            <Text style={styles.seksioni}>Historia</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filtrat}
              contentContainerStyle={styles.filtratBrenda}
            >
              {FILTRAT.map((f) => {
                const aktiv = f.vlera === filtri;
                const sa = vizitat.filter((v) => kalonFiltrin(v, f.vlera)).length;
                return (
                  <Pressable
                    key={f.vlera}
                    onPress={() => setFiltri(f.vlera)}
                    style={[styles.filtri, aktiv && styles.filtriAktiv]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: aktiv }}
                  >
                    <Text style={[styles.filtriTeksti, aktiv && styles.filtriTekstiAktiv]}>{f.emri}</Text>
                    <View style={[styles.filtriNumri, aktiv && styles.filtriNumriAktiv]}>
                      <Text style={[styles.filtriNumriTeksti, aktiv && styles.filtriNumriTekstiAktiv]}>{sa}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Hyrje>

          {grupet.length === 0 ? (
            <Text style={styles.asnje}>Asnjë vizitë me këtë filtër.</Text>
          ) : (
            grupet.map((grupi, gi) => (
              <View key={grupi.muaji} style={styles.grupi}>
                <View style={styles.muajiRresht}>
                  <Text style={styles.muaji}>{grupi.muaji}</Text>
                  <View style={styles.muajiVija} />
                  <Text style={styles.muajiNumri}>{grupi.vizitat.length}</Text>
                </View>
                {grupi.vizitat.map((v, i) => (
                  <Hyrje key={v.id} i={5 + gi + i}>
                    <RreshtiIKohes
                      vizita={v}
                      prona={pronat.find((p) => p.id === v.pronaId)}
                      iFundit={i === grupi.vizitat.length - 1}
                      onPress={() => router.push({ pathname: "/vizita/[id]", params: { id: v.id } })}
                    />
                  </Hyrje>
                ))}
              </View>
            ))
          )}

          <Pressable
            style={({ pressed }) => [styles.primary, pressed && styles.shtypur]}
            onPress={() => kerko()}
            accessibilityRole="button"
          >
            <UrezaIcon name="plus" size={22} color={colors.white} strokeWidth={2.4} />
            <Text style={styles.primaryText}>Kërko një vizitë</Text>
          </Pressable>
        </>
      ) : null}
    </EkraniMeHero>
  );
}

function Shifra({ icon, vlera, etiketa }: { icon: IconName; vlera: string; etiketa: string }) {
  return (
    <View style={styles.shifra} accessible accessibilityLabel={`${etiketa}: ${vlera}`}>
      <View style={styles.shifraIkona}>
        <UrezaIcon name={icon} size={18} color={colors.petrol} strokeWidth={2.2} />
      </View>
      <Text style={styles.shifraVlera} numberOfLines={1} adjustsFontSizeToFit>
        {vlera}
      </Text>
      <Text style={styles.shifraEtiketa}>{etiketa}</Text>
    </View>
  );
}

function Karta({ titulli, ikona, children }: { titulli: string; ikona: IconName; children: ReactNode }) {
  return (
    <View style={styles.karta}>
      <View style={styles.kartaKrye}>
        <View style={styles.kartaIkona}>
          <UrezaIcon name={ikona} size={18} color={colors.teal} strokeWidth={2.2} />
        </View>
        <Text style={styles.kartaTitulli}>{titulli}</Text>
      </View>
      {children}
    </View>
  );
}

// One visit on the timeline: the day on the left, a dot on the line in the colour of its state,
// and a card with the kind, the property, the Miku and a clear "open" arrow.
function RreshtiIKohes({
  vizita: v,
  prona,
  iFundit,
  onPress,
}: {
  vizita: Vizita;
  prona: Prona | undefined;
  iFundit: boolean;
  onPress: () => void;
}) {
  const d = dataNgaTekst(v.data);
  const statusi = STATUSET[v.statusi];
  const ikona = LLOJET_E_VIZITES.find((l) => l.vlera === v.lloji)?.icon ?? "home";
  const ngjyraLlojit = v.lloji === "inspektim" ? NGJYRA_INSPEKTIM : NGJYRA_KUJDES;
  return (
    <View style={styles.koha}>
      <View style={styles.dita}>
        <Text style={styles.ditaNumri}>{d.getDate()}</Text>
        <Text style={styles.ditaEmri}>{DITET_SHKURT[d.getDay()]}</Text>
      </View>
      <View style={styles.boshti}>
        <View style={[styles.nyja, { backgroundColor: statusi.fg }]}>
          <UrezaIcon name={statusi.icon} size={12} color={colors.white} strokeWidth={3} />
        </View>
        {!iFundit ? <View style={styles.boshtiVija} /> : null}
      </View>
      <Pressable
        style={({ pressed }) => [styles.vizita, pressed && styles.shtypur]}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${titulliIVizites(v.lloji)}, ${prona?.emri ?? "Prona"}, ${statusi.emri}. Hap vizitën.`}
      >
        <View style={[styles.vizitaShirit, { backgroundColor: ngjyraLlojit }]} />
        <View style={styles.vizitaKrye}>
          <View style={[styles.vizitaIkona, { backgroundColor: `${ngjyraLlojit}1A` }]}>
            <UrezaIcon name={ikona} size={20} color={ngjyraLlojit} strokeWidth={2.2} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.vizitaTitulli} numberOfLines={1}>
              {titulliIVizites(v.lloji)}
            </Text>
            <Text style={styles.vizitaNen} numberOfLines={1}>
              {prona?.emri ?? "Prona"}
            </Text>
          </View>
        </View>
        {v.mikuEmri ? (
          <View style={styles.miku}>
            <UrezaIcon name="user" size={15} color={colors.textSecondary} strokeWidth={2.2} />
            <Text style={styles.mikuTeksti} numberOfLines={1}>
              Miku: {v.mikuEmri}
            </Text>
          </View>
        ) : null}
        <View style={styles.vizitaFund}>
          <StatusiChip statusi={v.statusi} />
          <View style={styles.hap}>
            <Text style={styles.hapTeksti}>Hap</Text>
            <View style={styles.hapRrethi}>
              <UrezaIcon name="arrow" size={15} color={colors.white} strokeWidth={2.6} />
            </View>
          </View>
        </View>
      </Pressable>
    </View>
  );
}

const hija = {
  shadowColor: "#0B2530",
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.08,
  shadowRadius: 14,
  elevation: 3,
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  shtypur: { opacity: 0.85, transform: [{ scale: 0.98 }] },

  primary: {
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.petrol,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    alignSelf: "stretch",
  },
  primaryText: { color: colors.white, fontSize: 17, fontWeight: "700" },

  bosh: { backgroundColor: colors.white, borderRadius: 22, padding: 16, gap: 8, ...hija },
  boshFoto: { height: 140, borderRadius: 16, overflow: "hidden", marginBottom: 6 },
  boshTitle: { color: colors.ink, fontSize: 20, lineHeight: 26, fontWeight: "800" },
  boshText: { color: colors.textSecondary, fontSize: 15, lineHeight: 21, fontWeight: "500", marginBottom: 8 },

  shifrat: { flexDirection: "row", gap: 10 },
  shifra: { flex: 1, backgroundColor: colors.white, borderRadius: 18, padding: 12, gap: 2, ...hija },
  shifraIkona: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.ikonaBg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  shifraVlera: { color: colors.ink, fontSize: 22, lineHeight: 28, fontWeight: "800" },
  shifraEtiketa: { color: colors.textSecondary, fontSize: 12, lineHeight: 16, fontWeight: "600" },

  karta: { backgroundColor: colors.white, borderRadius: 22, padding: 16, gap: 14, ...hija },
  kartaKrye: { flexDirection: "row", alignItems: "center", gap: 10 },
  kartaIkona: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.ikonaBg,
    alignItems: "center",
    justifyContent: "center",
  },
  kartaTitulli: { color: colors.ink, fontSize: 17, lineHeight: 22, fontWeight: "800" },

  seksioni: { color: colors.ink, fontSize: 20, lineHeight: 26, fontWeight: "800", marginBottom: 10 },
  filtrat: { marginHorizontal: -20 },
  filtratBrenda: { paddingHorizontal: 20, gap: 8 },
  filtri: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 40,
    paddingLeft: 14,
    paddingRight: 6,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
  },
  filtriAktiv: { backgroundColor: colors.petrol, borderColor: colors.petrol },
  filtriTeksti: { color: colors.ink, fontSize: 14, fontWeight: "700" },
  filtriTekstiAktiv: { color: colors.white },
  filtriNumri: {
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    paddingHorizontal: 6,
    backgroundColor: colors.ikonaBg,
    alignItems: "center",
    justifyContent: "center",
  },
  filtriNumriAktiv: { backgroundColor: "rgba(255,255,255,0.2)" },
  filtriNumriTeksti: { color: colors.petrol, fontSize: 12, fontWeight: "800" },
  filtriNumriTekstiAktiv: { color: colors.white },
  asnje: { color: colors.textSecondary, fontSize: 15, textAlign: "center", paddingVertical: 16 },

  grupi: { gap: 0 },
  muajiRresht: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  muaji: { color: colors.teal, fontSize: 12, lineHeight: 16, fontWeight: "800", letterSpacing: 1.5 },
  muajiVija: { flex: 1, height: 1, backgroundColor: colors.line },
  muajiNumri: { color: colors.textSecondary, fontSize: 12, fontWeight: "800" },

  koha: { flexDirection: "row", gap: 10 },
  dita: { width: 38, alignItems: "center", paddingTop: 10 },
  ditaNumri: { color: colors.ink, fontSize: 22, lineHeight: 26, fontWeight: "800" },
  ditaEmri: { color: colors.textSecondary, fontSize: 11, fontWeight: "800", letterSpacing: 0.5 },
  boshti: { width: 22, alignItems: "center", paddingTop: 14 },
  nyja: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: colors.background,
  },
  boshtiVija: { flex: 1, width: 2, backgroundColor: colors.line, marginTop: 2 },
  vizita: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 14,
    paddingLeft: 18,
    gap: 10,
    marginBottom: 12,
    overflow: "hidden",
    ...hija,
  },
  vizitaShirit: { position: "absolute", left: 0, top: 0, bottom: 0, width: 5 },
  vizitaKrye: { flexDirection: "row", alignItems: "center", gap: 10 },
  vizitaIkona: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  vizitaTitulli: { color: colors.ink, fontSize: 16, lineHeight: 21, fontWeight: "800" },
  vizitaNen: { color: colors.textSecondary, fontSize: 14, lineHeight: 19, fontWeight: "500" },
  miku: { flexDirection: "row", alignItems: "center", gap: 6 },
  mikuTeksti: { color: colors.textSecondary, fontSize: 13, fontWeight: "600", flexShrink: 1 },
  vizitaFund: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  hap: { flexDirection: "row", alignItems: "center", gap: 6 },
  hapTeksti: { color: colors.petrol, fontSize: 14, fontWeight: "800" },
  hapRrethi: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.petrol,
    alignItems: "center",
    justifyContent: "center",
  },
});
