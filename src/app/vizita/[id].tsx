import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { DeshmiteVizites } from "@/components/DeshmiteVizites";
import { Ecuria } from "@/components/Ecuria";
import { EkraniMeHero } from "@/components/EkraniMeHero";
import { PermbledhjaERaportit, VendimiIRaportit } from "@/components/RaportiVizites";
import { SeShpejti } from "@/components/SeShpejti";
import { ShqyrtimiIRastit } from "@/components/ShqyrtimiIRastit";
import { StatusiChip } from "@/components/StatusiChip";
import { UrezaIcon, type IconName } from "@/components/UrezaIcon";
import { colors } from "@/constants/ureza";
import { useDhenat } from "@/lib/dhenat";
import { useProfili } from "@/lib/profili";
import {
  TEKSTI_STATUSIT,
  TEKSTI_STATUSIT_MIKU,
  dataEPlote,
  dataShkurt,
  titulliIVizites,
  type Vizita,
} from "@/lib/vizitat";
import type { Prona } from "@/lib/pronat";

// Details of one visit (design: Detajet): summary, evidence and history in three tabs.
type Tab = "permbledhje" | "deshmi" | "historiku";

const TABET: { vlera: Tab; emri: string }[] = [
  { vlera: "permbledhje", emri: "Përmbledhje" },
  { vlera: "deshmi", emri: "Dëshmi" },
  { vlera: "historiku", emri: "Historiku" },
];

export default function DetajetEVizites() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { vizitat, pronat, burimiVizitat, anuloVizite, filloVizite } = useDhenat();
  const { profili } = useProfili();
  const eMiku = profili?.roli === "miku";
  // an admin only ever sees disputed visits here (supabase/admini.sql)
  const eAdmin = profili?.roli === "admin";
  const [tab, setTab] = useState<Tab>("permbledhje");
  const [konfirmo, setKonfirmo] = useState(false);
  const [duke, setDuke] = useState(false);
  const [gabim, setGabim] = useState<string | null>(null);
  const [sapoPranuar, setSapoPranuar] = useState(false);

  const vizita = vizitat.find((v) => v.id === id);
  const prona = vizita ? pronat.find((p) => p.id === vizita.pronaId) : undefined;
  const mbrapa = { etiketa: "Mbrapa", onPress: () => router.back() };

  if (!vizita) {
    return (
      <EkraniMeHero kicker="VIZITA" title="Vizita" kthehu={mbrapa}>
        {burimiVizitat === "duke_ngarkuar" ? (
          <ActivityIndicator color={colors.petrol} />
        ) : (
          <View style={styles.karta}>
            <Text style={styles.titulli}>Kjo vizitë nuk u gjet</Text>
            <Text style={styles.tekst}>Ndoshta u anulua. Kthehu te Oda për të parë vizitat e tua.</Text>
          </View>
        )}
      </EkraniMeHero>
    );
  }

  // A Miku opening a request nobody has accepted yet sees the "accept" page (design: Miku pranon detyrën).
  if (eMiku && vizita.statusi === "kerkuar") {
    return <PranoDetyren vizita={vizita} prona={prona} onPranuar={() => setSapoPranuar(true)} />;
  }

  const shqyrtuar = vizita.statusi === "kundershtuar" && vizita.shqyrtuarAt !== null;
  const tekstiIStatusit = eAdmin
    ? shqyrtuar
      ? "Ti e shqyrtove këtë rast. Vendimi u shfaqet klientit dhe Mikut."
      : "Klienti e kundërshtoi raportin. Lexo arsyen, shiko dëshmitë dhe vendos."
    : shqyrtuar
      ? eMiku
        ? "Klienti e kundërshtoi raportin dhe admini e shqyrtoi rastin."
        : "Ti e kundërshtove raportin dhe admini e shqyrtoi rastin."
      : eMiku
        ? (TEKSTI_STATUSIT_MIKU[vizita.statusi] ?? TEKSTI_STATUSIT[vizita.statusi])
        : vizita.statusi === "pranuar" && vizita.mikuEmri
          ? `${vizita.mikuEmri} e pranoi kërkesën dhe do të shkojë në datën e caktuar.`
          : TEKSTI_STATUSIT[vizita.statusi];

  async function anulo() {
    if (!vizita || duke) return;
    setDuke(true);
    setGabim(null);
    const mesazh = await anuloVizite(vizita.id);
    setDuke(false);
    if (mesazh) {
      setGabim(mesazh);
      setKonfirmo(false);
      return;
    }
    router.back();
  }

  // The Miku, on site: starts the visit, then collects the evidence on its own screen.
  async function fillo() {
    if (!vizita || duke) return;
    setDuke(true);
    setGabim(null);
    const mesazh = await filloVizite(vizita.id);
    setDuke(false);
    if (mesazh) {
      setGabim(mesazh);
      return;
    }
    router.push({ pathname: "/deshmia/[id]", params: { id: vizita.id } });
  }

  const dergoi = vizita.statusi === "raporti_gati" || vizita.statusi === "miratuar" || vizita.statusi === "kundershtuar";
  // the client reads the report and decides (design: Raporti)
  const raportiGati = !eMiku && vizita.statusi === "raporti_gati";

  return (
    <EkraniMeHero
      kicker={raportiGati && tab === "permbledhje" ? "RAPORTI I VIZITËS" : `VIZITA · ${TABET.find((t) => t.vlera === tab)?.emri.toUpperCase()}`}
      title={titulliIVizites(vizita.lloji)}
      subtitle={`${prona?.emri ?? "Prona"} · ${dataShkurt(vizita.data)}`}
      kthehu={mbrapa}
    >
      <View style={styles.tabet} accessibilityRole="tablist">
        {TABET.map((t) => {
          const aktiv = t.vlera === tab;
          return (
            <Pressable
              key={t.vlera}
              onPress={() => setTab(t.vlera)}
              style={[styles.tab, aktiv && styles.tabAktiv]}
              accessibilityRole="tab"
              accessibilityState={{ selected: aktiv }}
            >
              <Text style={[styles.tabText, aktiv && styles.tabTextAktiv]}>{t.emri}</Text>
            </Pressable>
          );
        })}
      </View>

      {tab === "permbledhje" ? (
        <>
          {sapoPranuar && vizita.statusi === "pranuar" ? (
            <View style={styles.sukses}>
              <UrezaIcon name="check" size={20} color="#1E6B3E" strokeWidth={2.6} />
              <Text style={styles.suksesText}>Ke pranuar detyrën. Klienti e sheh emrin tënd te vizita.</Text>
            </View>
          ) : null}

          <View style={styles.karta}>
            <StatusiChip statusi={vizita.statusi} />
            <Text style={styles.statusiTeksti}>{tekstiIStatusit}</Text>
          </View>

          {raportiGati ? <PermbledhjaERaportit vizita={vizita} onShikoDeshmite={() => setTab("deshmi")} /> : null}

          <View style={styles.karta}>
            <Text style={styles.titulli}>{eMiku ? "Çka kërkon klienti" : eAdmin ? "Çka kërkoi klienti" : "Çka kërkove"}</Text>
            <Text style={styles.udhezime}>{vizita.udhezime}</Text>
            <Rresht etiketa="Lloji" vlera={titulliIVizites(vizita.lloji)} />
            <Rresht etiketa="Data" vlera={dataEPlote(vizita.data)} />
            <Rresht etiketa="Prona" vlera={prona?.emri ?? "Prona"} />
            <Rresht etiketa="Miku" vlera={vizita.mikuEmri ?? "Pa caktuar ende"} fundit />
          </View>

          {eMiku && vizita.statusi === "pranuar" ? (
            <View style={styles.anulim}>
              {gabim ? <Text style={styles.gabim}>{gabim}</Text> : null}
              <Pressable
                style={[styles.primary, duke && styles.disabled]}
                onPress={fillo}
                disabled={duke}
                accessibilityRole="button"
              >
                {duke ? <ActivityIndicator color={colors.white} /> : <Text style={styles.primaryText}>Fillo vizitën</Text>}
              </Pressable>
              <Text style={styles.ndihme}>Shtype kur të jesh te prona: pastaj mbledh GPS-in, fotot dhe shënimin zanor.</Text>
            </View>
          ) : null}

          {eMiku && vizita.statusi === "vizita" ? (
            <Pressable
              style={styles.primary}
              onPress={() => router.push({ pathname: "/deshmia/[id]", params: { id: vizita.id } })}
              accessibilityRole="button"
            >
              <Text style={styles.primaryText}>Vazhdo me dëshmitë</Text>
            </Pressable>
          ) : null}

          {raportiGati ? (
            <SeShpejti
              titulli="Përmbledhja në gjuhën tënde"
              teksti="Shënimi zanor do të përkthehet dhe përmblidhet këtu, në gjuhën që zgjedh."
            />
          ) : null}

          {/* while the report waits for a decision, "Shiko dëshmitë" is on the report card above */}
          {!raportiGati ? (
            <View style={styles.karta}>
              <Text style={styles.titulli}>Dëshmitë</Text>
              {dergoi ? (
                <>
                  <Text style={styles.tekst}>GPS, foto dhe shënim zanor nga vizita.</Text>
                  <Pressable style={styles.lidhje} onPress={() => setTab("deshmi")} accessibilityRole="button">
                    <Text style={styles.lidhjeText}>Shiko dëshmitë</Text>
                    <UrezaIcon name="chevron" size={18} color={colors.petrol} strokeWidth={2.6} />
                  </Pressable>
                </>
              ) : (
                <Text style={styles.tekst}>
                  {eMiku
                    ? "Vendndodhja GPS, fotot dhe shënimi zanor i dërgohen klientit kur ta kryesh vizitën."
                    : "Vendndodhja GPS, fotot dhe shënimi zanor vijnë këtu kur Miku ta kryejë vizitën."}
                </Text>
              )}
            </View>
          ) : null}

          {!eMiku ? <VendimiIRaportit vizita={vizita} admin={eAdmin} /> : null}

          {/* the admin decides here; once decided, every side sees the outcome */}
          <ShqyrtimiIRastit vizita={vizita} admin={eAdmin} />

          {vizita.statusi === "kerkuar" && !eMiku ? (
            <View style={styles.anulim}>
              {gabim ? <Text style={styles.gabim}>{gabim}</Text> : null}
              {!konfirmo ? (
                <Pressable style={styles.anuloButon} onPress={() => setKonfirmo(true)} accessibilityRole="button">
                  <Text style={styles.anuloText}>Anulo kërkesën</Text>
                </Pressable>
              ) : (
                <View style={styles.konfirmim}>
                  <View style={styles.konfirmimTekst}>
                    <UrezaIcon name="warning" size={20} color={colors.vizita} />
                    <Text style={styles.konfirmimLabel}>Ta anulojmë këtë kërkesë? Nuk mund të kthehet.</Text>
                  </View>
                  <Pressable
                    style={[styles.anuloButon, styles.anuloPlote, duke && styles.disabled]}
                    onPress={anulo}
                    disabled={duke}
                    accessibilityRole="button"
                  >
                    {duke ? <ActivityIndicator color={colors.white} /> : <Text style={styles.anuloPloteText}>Po, anuloje</Text>}
                  </Pressable>
                  <Pressable style={styles.jo} onPress={() => setKonfirmo(false)} disabled={duke} accessibilityRole="button">
                    <Text style={styles.joText}>Jo, e mbaj</Text>
                  </Pressable>
                </View>
              )}
            </View>
          ) : null}
        </>
      ) : null}

      {tab === "deshmi" ? <DeshmiteVizites vizita={vizita} /> : null}

      {/* the admin reads the history from the outside, like the Miku ("Klienti e kundërshtoi ...") */}
      {tab === "historiku" ? <Ecuria vizita={vizita} miku={eMiku || eAdmin} /> : null}
    </EkraniMeHero>
  );
}

// The Miku's page for a new request: what the client asks, what evidence to send, and the
// buttons to accept or leave it.
const DESHMITE: { icon: IconName; titulli: string; nen: string }[] = [
  { icon: "pin", titulli: "Vendndodhja GPS", nen: "Me orën e saktë të vizitës" },
  { icon: "camera", titulli: "Foto live", nen: "Vetëm nga kamera, jo nga galeria" },
  { icon: "mic", titulli: "Shënim zanor", nen: "Çka pe, në fjalët e tua" },
];

function PranoDetyren({ vizita, prona, onPranuar }: { vizita: Vizita; prona?: Prona; onPranuar: () => void }) {
  const router = useRouter();
  const { pranoVizite } = useDhenat();
  const [duke, setDuke] = useState(false);
  const [gabim, setGabim] = useState<string | null>(null);

  async function prano() {
    if (duke) return;
    setDuke(true);
    setGabim(null);
    const mesazh = await pranoVizite(vizita.id);
    setDuke(false);
    if (mesazh) {
      setGabim(mesazh);
      return;
    }
    onPranuar();
  }

  return (
    <EkraniMeHero
      kicker="KËRKESË E RE · MIKU"
      title={titulliIVizites(vizita.lloji)}
      subtitle={`${prona?.emri ?? "Prona"} · ${dataShkurt(vizita.data)}`}
      kthehu={{ etiketa: "Mbrapa", onPress: () => router.back() }}
    >
      <View style={styles.karta}>
        <Text style={styles.titulli}>Çka kërkon klienti</Text>
        <Text style={styles.udhezime}>{vizita.udhezime}</Text>
        <Rresht etiketa="Data" vlera={dataEPlote(vizita.data)} />
        <Rresht etiketa="Prona" vlera={prona ? `${prona.emri}, ${prona.vendi}` : "Prona"} fundit />
      </View>

      <View style={styles.karta}>
        <Text style={styles.titulli}>Dëshmitë që do t&apos;i dërgosh</Text>
        {DESHMITE.map((d) => (
          <View key={d.titulli} style={styles.deshmi}>
            <View style={styles.deshmiIkona}>
              <UrezaIcon name={d.icon} size={22} color={colors.petrol} />
            </View>
            <View style={styles.deshmiTekst}>
              <Text style={styles.deshmiTitulli}>{d.titulli}</Text>
              <Text style={styles.tekst}>{d.nen}</Text>
            </View>
          </View>
        ))}
        <View style={styles.pill}>
          <Text style={styles.pillText}>Së shpejti</Text>
        </View>
        <Text style={styles.tekst}>Mbledhja e dëshmive vjen me hapin e ardhshëm. Tani pranon vetëm detyrën.</Text>
      </View>

      {gabim ? <Text style={styles.gabim}>{gabim}</Text> : null}

      <Pressable
        style={[styles.primary, duke && styles.disabled]}
        onPress={prano}
        disabled={duke}
        accessibilityRole="button"
      >
        {duke ? <ActivityIndicator color={colors.white} /> : <Text style={styles.primaryText}>Prano detyrën</Text>}
      </Pressable>
      <Pressable style={styles.jo} onPress={() => router.back()} disabled={duke} accessibilityRole="button">
        <Text style={styles.joText}>Jo tani</Text>
      </Pressable>
    </EkraniMeHero>
  );
}

function Rresht({ etiketa, vlera, fundit }: { etiketa: string; vlera: string; fundit?: boolean }) {
  return (
    <View style={[styles.rreshti, !fundit && styles.ndarje]}>
      <Text style={styles.etiketa}>{etiketa}</Text>
      <Text style={styles.vlera}>{vlera}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tabet: { flexDirection: "row", gap: 4, padding: 4, borderRadius: 16, backgroundColor: "#E3EAF0" },
  tab: { flex: 1, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  tabAktiv: {
    backgroundColor: colors.white,
    shadowColor: "#0B2530",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.14,
    shadowRadius: 4,
    elevation: 1,
  },
  tabText: { color: colors.textSecondary, fontSize: 15, fontWeight: "700" },
  tabTextAktiv: { color: colors.petrol, fontWeight: "800" },
  karta: { backgroundColor: colors.white, borderRadius: 20, padding: 20, gap: 8 },
  titulli: { color: colors.ink, fontSize: 20, lineHeight: 26, fontWeight: "800" },
  tekst: { color: colors.textSecondary, fontSize: 15, lineHeight: 22, fontWeight: "500" },
  statusiTeksti: { color: colors.ink, fontSize: 17, lineHeight: 25, fontWeight: "500" },
  udhezime: { color: colors.ink, fontSize: 16, lineHeight: 24, fontWeight: "500", marginBottom: 6 },
  rreshti: { minHeight: 52, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  ndarje: { borderBottomWidth: 1, borderBottomColor: "#EDF1F4" },
  etiketa: { color: colors.textSecondary, fontSize: 15, fontWeight: "600" },
  vlera: { flex: 1, color: colors.ink, fontSize: 16, fontWeight: "700", textAlign: "right" },
  pill: { alignSelf: "flex-start", backgroundColor: "#FCEFD2", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
  pillText: { color: "#7A4A06", fontSize: 12, fontWeight: "700" },
  anulim: { gap: 8 },
  gabim: { color: colors.error, fontSize: 14, lineHeight: 20, fontWeight: "600" },
  anuloButon: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.vizita,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  anuloText: { color: colors.vizita, fontSize: 17, fontWeight: "700" },
  konfirmim: { gap: 10, padding: 16, borderRadius: 16, backgroundColor: "#FDECEA" },
  konfirmimTekst: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  konfirmimLabel: { flex: 1, color: "#7A1F1B", fontSize: 15, lineHeight: 22, fontWeight: "600" },
  anuloPlote: { backgroundColor: colors.vizita },
  anuloPloteText: { color: colors.white, fontSize: 17, fontWeight: "700" },
  jo: { minHeight: 48, alignItems: "center", justifyContent: "center" },
  joText: { color: colors.petrol, fontSize: 16, fontWeight: "700" },
  disabled: { opacity: 0.6 },
  ndihme: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, fontWeight: "500", textAlign: "center" },
  lidhje: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: 4 },
  lidhjeText: { color: colors.petrol, fontSize: 16, fontWeight: "800" },
  primary: { height: 56, borderRadius: 16, backgroundColor: colors.petrol, alignItems: "center", justifyContent: "center" },
  primaryText: { color: colors.white, fontSize: 17, fontWeight: "700" },
  sukses: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    borderRadius: 16,
    backgroundColor: "#E4F6EB",
  },
  suksesText: { flex: 1, color: "#1E6B3E", fontSize: 15, lineHeight: 22, fontWeight: "600" },
  deshmi: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 4 },
  deshmiIkona: { width: 44, height: 44, borderRadius: 14, backgroundColor: "#E8F5F3", alignItems: "center", justifyContent: "center" },
  deshmiTekst: { flex: 1, gap: 1 },
  deshmiTitulli: { color: colors.ink, fontSize: 16, lineHeight: 22, fontWeight: "800" },
});
