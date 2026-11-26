import { useRouter } from "expo-router";
import { useState, type ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { EkraniMeHero } from "@/components/EkraniMeHero";
import { Ikona, type EmriIIkones } from "@/components/Ikona";
import { GrafikuIMuajve, ShiritiIStatuseve, type MuajiIGrafikut } from "@/components/OdaGrafiket";
import { PronaIlustrim } from "@/components/PronaIlustrim";
import { Seksioni } from "@/components/Seksioni";
import { StatusiChip } from "@/components/StatusiChip";
import { UrezaIcon } from "@/components/UrezaIcon";
import { SkeletiIFaqes } from "@/components/ui/Skeleti";
import { colors, font } from "@/constants/ureza";
import { useDhenat } from "@/lib/dhenat";
import type { Prona } from "@/lib/pronat";
import {
  DITET_SHKURT,
  MUAJT,
  STATUSET,
  dataNeTekst,
  dataNgaTekst,
  titulliIVizites,
  type Statusi,
  type Vizita,
} from "@/lib/vizitat";

// "Oda" (the family's archive), in the order a client needs it: first what waits for their
// decision, then three figures, then each property and where it stands, then the full history
// (a timeline by month, with filters), and the charts last.

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

// Where a property stands, in one line. A visit counts as "checked" only once the Miku has been
// there (not while it is only requested or accepted); a visit still to come is shown as such.
const TE_KRYERA: Statusi[] = ["vizita", "raporti_gati", "miratuar", "kundershtuar"];
const DITE_PA_KONTROLL = 45;

type GjendjaEProns = { lloji: "kontrolluar" | "ne_rruge" | "harruar"; teksti: string; vizitaId: string | null };

function gjendjaEPrones(p: Prona, vizitat: Vizita[]): GjendjaEProns {
  const sot = dataNgaTekst(dataNeTekst(new Date())).getTime();
  const tePrones = vizitat.filter((v) => v.pronaId === p.id);
  const eArdhshme = tePrones
    .filter((v) => !TE_KRYERA.includes(v.statusi))
    .sort((a, b) => a.data.localeCompare(b.data))[0];
  const eKryera = tePrones
    .filter((v) => TE_KRYERA.includes(v.statusi) && dataNgaTekst(v.data).getTime() <= sot)
    .sort((a, b) => b.data.localeCompare(a.data))[0];
  const dite = eKryera ? Math.round((sot - dataNgaTekst(eKryera.data).getTime()) / DITA_MS) : null;

  if (eArdhshme) {
    const d = dataNgaTekst(eArdhshme.data);
    return {
      lloji: "ne_rruge",
      teksti: `Vizita më ${d.getDate()} ${MUAJT[d.getMonth()]} · ${STATUSET[eArdhshme.statusi].emri.toLowerCase()}`,
      vizitaId: eArdhshme.id,
    };
  }
  if (dite !== null && dite <= DITE_PA_KONTROLL) {
    return {
      lloji: "kontrolluar",
      teksti: dite === 0 ? "Kontrolluar sot" : dite === 1 ? "Kontrolluar dje" : `Kontrolluar para ${dite} ditësh`,
      vizitaId: eKryera?.id ?? null,
    };
  }
  return {
    lloji: "harruar",
    teksti: dite === null ? "Ende pa u kontrolluar" : `Pa kontroll prej ${dite} ditësh`,
    vizitaId: null,
  };
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
  const perVendimLista = vizitat.filter((v) => v.statusi === "raporti_gati");
  const perVendim = perVendimLista.length;
  const neProces = vizitat.length - miratuar - kundershtuar - perVendim;
  const teVendosura = miratuar + kundershtuar;
  const besimi = teVendosura > 0 ? `${Math.round((miratuar / teVendosura) * 100)}%` : "—";

  const teFiltruara = vizitat.filter((v) => kalonFiltrin(v, filtri));
  const grupet = sipasMuajit(teFiltruara);
  const kaVizita = vizitat.length > 0;

  const emriIProns = (v: Vizita) => pronat.find((p) => p.id === v.pronaId)?.emri ?? "Prona";
  const hap = (id: string) => router.push({ pathname: "/vizita/[id]", params: { id } });
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
            <Text style={styles.boshText}>Çdo vizitë që kërkon shfaqet këtu: me foto, vendndodhje, zë dhe raport.</Text>
            <Pressable style={styles.primary} onPress={() => kerko()} accessibilityRole="button">
              <Text style={styles.primaryText}>Kërko vizitën e parë</Text>
              <UrezaIcon name="arrow" size={20} color={colors.white} strokeWidth={2.4} />
            </Pressable>
          </View>
        </Hyrje>
      ) : null}

      {kaVizita ? (
        <>
          {/* 1 · what needs the client now: reports waiting for a decision */}
          {perVendimLista.length > 0 ? (
            <Hyrje i={0}>
              <View style={styles.vemendja}>
                <View style={styles.vemendjaKrye}>
                  <View style={styles.vemendjaIkona}>
                    <Ikona emri="vendim" madhesia={20} ngjyra={colors.kujdes} />
                  </View>
                  <View style={styles.flex}>
                    <Text style={styles.vemendjaTitulli}>
                      {perVendimLista.length === 1
                        ? "Një raport pret vendimin tënd"
                        : `${perVendimLista.length} raporte presin vendimin tënd`}
                    </Text>
                    <Text style={styles.vemendjaTeksti}>Lexoje dhe miratoje, ose kundërshtoje.</Text>
                  </View>
                </View>
                {perVendimLista.map((v) => (
                  <Pressable
                    key={v.id}
                    style={({ pressed }) => [styles.vemendjaRresht, pressed && styles.shtypur]}
                    onPress={() => hap(v.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`Shiko raportin: ${titulliIVizites(v.lloji)}, ${emriIProns(v)}`}
                  >
                    <Text style={styles.vemendjaRreshtTeksti} numberOfLines={1}>
                      {titulliIVizites(v.lloji)} · {emriIProns(v)}
                    </Text>
                    <Text style={styles.vemendjaCta}>Shiko raportin</Text>
                    <Ikona emri="shigjeta" madhesia={16} ngjyra={colors.petrol} />
                  </Pressable>
                ))}
              </View>
            </Hyrje>
          ) : null}

          {/* 2 · the three figures */}
          <Hyrje i={1}>
            <View style={styles.shifrat}>
              <Shifra ikona="vizitat" vlera={String(vizitat.length)} etiketa="Vizita gjithsej" />
              <Shifra ikona="miratuar" vlera={besimi} etiketa="Raporte të miratuara" />
              <Shifra ikona="koha" vlera={kohaEPranimit(vizitat)} etiketa="Deri te pranimi" />
            </View>
          </Hyrje>

          {/* 3 · every property: when it was last checked, or when the next visit is */}
          {pronat.length > 0 ? (
            <Hyrje i={2}>
              <Seksioni ikona="pronat" titulli="Pronat e tua" />
              <View style={styles.karta}>
                {pronat.map((p, i) => (
                  <RreshtiIPrones
                    key={p.id}
                    prona={p}
                    gjendja={gjendjaEPrones(p, vizitat)}
                    ndarje={i > 0}
                    onKerko={() => kerko(p.id)}
                    onHap={hap}
                  />
                ))}
              </View>
            </Hyrje>
          ) : null}

          {/* 4 · the history, filtered */}
          <Hyrje i={3}>
            <Seksioni ikona="historia" titulli="Historia" />
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
                    accessibilityLabel={`${f.emri}: ${sa}`}
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
                  <Hyrje key={v.id} i={4 + gi + i}>
                    <RreshtiIKohes
                      vizita={v}
                      prona={pronat.find((p) => p.id === v.pronaId)}
                      iFundit={i === grupi.vizitat.length - 1}
                      onPress={() => hap(v.id)}
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
            <Ikona emri="shto" madhesia={20} ngjyra={colors.white} />
            <Text style={styles.primaryText}>Kërko një vizitë</Text>
          </Pressable>

          {/* 5 · the figures behind it, last: useful, but not what the client opens Oda for */}
          <Hyrje i={6}>
            <Seksioni ikona="statistika" titulli="Statistikat" />
            <View style={styles.statistikat}>
              <View style={styles.kartaStat}>
                <Text style={styles.kartaTitulli}>Gjendja e vizitave</Text>
                <ShiritiIStatuseve
                  pjeset={[
                    { emri: "Miratuar", numri: miratuar, ngjyra: colors.ok, ikona: "check" },
                    { emri: "Për vendimin tënd", numri: perVendim, ngjyra: colors.kujdes, ikona: "sparkle" },
                    { emri: "Në proces", numri: neProces, ngjyra: colors.petrol, ikona: "clock" },
                    { emri: "Kundërshtuar", numri: kundershtuar, ngjyra: colors.error, ikona: "warning" },
                  ]}
                />
              </View>
              <View style={styles.kartaStat}>
                <Text style={styles.kartaTitulli}>Aktiviteti, 6 muajt e fundit</Text>
                <GrafikuIMuajve muajt={gjashteMuajt(vizitat)} />
              </View>
            </View>
          </Hyrje>
        </>
      ) : null}
    </EkraniMeHero>
  );
}

function Shifra({ ikona, vlera, etiketa }: { ikona: EmriIIkones; vlera: string; etiketa: string }) {
  return (
    <View style={styles.shifra} accessible accessibilityLabel={`${etiketa}: ${vlera}`}>
      <View style={styles.shifraIkona}>
        <Ikona emri={ikona} madhesia={18} ngjyra={colors.petrol} />
      </View>
      <Text style={styles.shifraVlera} numberOfLines={1} adjustsFontSizeToFit>
        {vlera}
      </Text>
      <Text style={styles.shifraEtiketa}>{etiketa}</Text>
    </View>
  );
}

const IKONA_E_PRONES: Record<Prona["lloji"], EmriIIkones> = { shtepi: "shtepi", prindert: "prindert", toke: "toke" };

// One property: its picture, name, and one line that says where it stands, as colour + icon +
// words: checked recently (green), a visit on the way (petrol), or nothing for too long (orange,
// with a shortcut to a new request).
function RreshtiIPrones({
  prona,
  gjendja: g,
  ndarje,
  onKerko,
  onHap,
}: {
  prona: Prona;
  gjendja: GjendjaEProns;
  ndarje: boolean;
  onKerko: () => void;
  onHap: (id: string) => void;
}) {
  const pamja =
    g.lloji === "ne_rruge"
      ? { ikona: "kalendar" as const, fg: colors.petrol, bg: colors.ikonaBg }
      : g.lloji === "kontrolluar"
        ? { ikona: "miratuar" as const, fg: colors.ok, bg: colors.okBg }
        : { ikona: "kujdes" as const, fg: colors.kujdes, bg: colors.kujdesBg };
  const vizitaId = g.vizitaId;
  return (
    <View style={[styles.pronaRresht, ndarje && styles.ndarje]}>
      <View style={styles.pronaFoto}>
        <PronaIlustrim lloji={prona.lloji} />
        <View style={styles.pronaLloji}>
          <Ikona emri={IKONA_E_PRONES[prona.lloji]} madhesia={12} ngjyra={colors.white} />
        </View>
      </View>
      <View style={styles.flex}>
        <Text style={styles.pronaEmri} numberOfLines={1}>
          {prona.emri}
        </Text>
        <View style={[styles.pronaChip, { backgroundColor: pamja.bg }]}>
          <Ikona emri={pamja.ikona} madhesia={13} ngjyra={pamja.fg} />
          <Text style={[styles.pronaChipTeksti, { color: pamja.fg }]} numberOfLines={1}>
            {g.teksti}
          </Text>
        </View>
      </View>
      {g.lloji === "harruar" ? (
        <Pressable
          onPress={onKerko}
          style={({ pressed }) => [styles.pronaVeprim, pressed && styles.shtypur]}
          accessibilityRole="button"
          accessibilityLabel={`Kërko vizitë për ${prona.emri}`}
        >
          <Text style={styles.pronaVeprimTeksti}>Kërko</Text>
          <Ikona emri="shigjeta" madhesia={14} ngjyra={colors.white} />
        </Pressable>
      ) : vizitaId ? (
        <Pressable
          onPress={() => onHap(vizitaId)}
          style={styles.pronaHap}
          accessibilityRole="button"
          accessibilityLabel={`Hap vizitën e ${prona.emri}`}
        >
          <Ikona emri="shigjeta" madhesia={18} ngjyra={colors.petrol} />
        </Pressable>
      ) : null}
    </View>
  );
}

// One visit on the timeline: the day on the left, a dot in the colour of its state on the line,
// and a white card with the kind, the property, the state, the Miku and an arrow.
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
        <View style={styles.vizitaKrye}>
          <View style={styles.vizitaIkona}>
            <Ikona emri={v.lloji === "kujdes" ? "prindert" : "shtepi"} madhesia={20} ngjyra={colors.petrol} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.vizitaTitulli} numberOfLines={1}>
              {titulliIVizites(v.lloji)}
            </Text>
            <Text style={styles.vizitaNen} numberOfLines={1}>
              {prona?.emri ?? "Prona"}
            </Text>
          </View>
          <Ikona emri="shigjeta" madhesia={18} ngjyra={colors.textSecondary} />
        </View>
        <View style={styles.vizitaFund}>
          <StatusiChip statusi={v.statusi} />
          {v.mikuEmri ? (
            <View style={styles.miku}>
              <Ikona emri="miku" madhesia={15} ngjyra={colors.textSecondary} />
              <Text style={styles.mikuTeksti} numberOfLines={1}>
                {v.mikuEmri}
              </Text>
            </View>
          ) : null}
        </View>
      </Pressable>
    </View>
  );
}

const hija = {
  shadowColor: "#0B2530",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.07,
  shadowRadius: 12,
  elevation: 2,
};

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  shtypur: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  ndarje: { borderTopWidth: 1, borderTopColor: colors.background },

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
  primaryText: { color: colors.white, fontSize: 17, fontFamily: font.w700 },

  bosh: { backgroundColor: colors.white, borderRadius: 22, padding: 16, gap: 8, ...hija },
  boshFoto: { height: 140, borderRadius: 16, overflow: "hidden", marginBottom: 6 },
  boshTitle: { color: colors.ink, fontSize: 20, lineHeight: 26, fontFamily: font.w800 },
  boshText: { color: colors.textSecondary, fontSize: 15, lineHeight: 21, fontFamily: font.w500, marginBottom: 8 },

  // waiting for a decision
  vemendja: { backgroundColor: colors.white, borderRadius: 22, padding: 16, gap: 10, ...hija },
  vemendjaKrye: { flexDirection: "row", alignItems: "center", gap: 12 },
  vemendjaIkona: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.kujdesBg,
    alignItems: "center",
    justifyContent: "center",
  },
  vemendjaTitulli: { color: colors.ink, fontSize: 16, lineHeight: 21, fontFamily: font.w800 },
  vemendjaTeksti: { color: colors.textSecondary, fontSize: 13, lineHeight: 18, fontFamily: font.w500 },
  vemendjaRresht: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: colors.background,
  },
  vemendjaRreshtTeksti: { flex: 1, color: colors.ink, fontSize: 14, fontFamily: font.w700 },
  vemendjaCta: { color: colors.petrol, fontSize: 14, fontFamily: font.w800 },

  // figures
  shifrat: { flexDirection: "row", gap: 10 },
  shifra: { flex: 1, backgroundColor: colors.white, borderRadius: 18, padding: 12, gap: 2, ...hija },
  shifraIkona: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: colors.ikonaBg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  shifraVlera: { color: colors.ink, fontSize: 22, lineHeight: 28, fontFamily: font.w800 },
  shifraEtiketa: { color: colors.textSecondary, fontSize: 12, lineHeight: 16, fontFamily: font.w600 },

  // cards
  karta: { backgroundColor: colors.white, borderRadius: 22, paddingHorizontal: 14, ...hija },
  kartaStat: { backgroundColor: colors.white, borderRadius: 22, padding: 16, gap: 12, ...hija },
  kartaTitulli: { color: colors.ink, fontSize: 16, lineHeight: 22, fontFamily: font.w800 },
  statistikat: { gap: 12 },

  // properties
  pronaRresht: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  pronaFoto: { width: 56, height: 56, borderRadius: 14, overflow: "hidden" },
  pronaLloji: {
    position: "absolute",
    right: 3,
    bottom: 3,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(23,63,78,0.85)",
    alignItems: "center",
    justifyContent: "center",
  },
  pronaEmri: { color: colors.ink, fontSize: 16, lineHeight: 21, fontFamily: font.w800, marginBottom: 6 },
  pronaChip: {
    alignSelf: "flex-start",
    maxWidth: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    height: 26,
    paddingHorizontal: 9,
    borderRadius: 13,
  },
  pronaChipTeksti: { fontSize: 12, fontFamily: font.w700, flexShrink: 1 },
  pronaVeprim: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 18,
    backgroundColor: colors.petrol,
  },
  pronaVeprimTeksti: { color: colors.white, fontSize: 13, fontFamily: font.w800 },
  pronaHap: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },

  // history
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
  filtriTeksti: { color: colors.ink, fontSize: 14, fontFamily: font.w700 },
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
  filtriNumriTeksti: { color: colors.petrol, fontSize: 12, fontFamily: font.w800 },
  filtriNumriTekstiAktiv: { color: colors.white },
  asnje: { color: colors.textSecondary, fontSize: 15, textAlign: "center", paddingVertical: 16, fontFamily: font.w400 },

  grupi: { gap: 0 },
  muajiRresht: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  muaji: { color: colors.teal, fontSize: 12, lineHeight: 16, fontFamily: font.w800, letterSpacing: 1.5 },
  muajiVija: { flex: 1, height: 1, backgroundColor: colors.line },
  muajiNumri: { color: colors.textSecondary, fontSize: 12, fontFamily: font.w800 },

  koha: { flexDirection: "row", gap: 10 },
  dita: { width: 38, alignItems: "center", paddingTop: 12 },
  ditaNumri: { color: colors.ink, fontSize: 22, lineHeight: 26, fontFamily: font.w800 },
  ditaEmri: { color: colors.textSecondary, fontSize: 11, fontFamily: font.w800, letterSpacing: 0.5 },
  boshti: { width: 22, alignItems: "center", paddingTop: 16 },
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
  vizita: { flex: 1, backgroundColor: colors.white, borderRadius: 18, padding: 14, gap: 12, marginBottom: 12, ...hija },
  vizitaKrye: { flexDirection: "row", alignItems: "center", gap: 12 },
  vizitaIkona: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.ikonaBg,
    alignItems: "center",
    justifyContent: "center",
  },
  vizitaTitulli: { color: colors.ink, fontSize: 16, lineHeight: 21, fontFamily: font.w800 },
  vizitaNen: { color: colors.textSecondary, fontSize: 14, lineHeight: 19, fontFamily: font.w500 },
  vizitaFund: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  miku: { flexDirection: "row", alignItems: "center", gap: 5, flexShrink: 1 },
  mikuTeksti: { color: colors.textSecondary, fontSize: 13, fontFamily: font.w600, flexShrink: 1 },
});
