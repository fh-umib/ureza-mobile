import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { DeshmiteVizites } from "@/components/DeshmiteVizites";
import { Ecuria } from "@/components/Ecuria";
import { EkraniMeHero } from "@/components/EkraniMeHero";
import { PermbledhjaERaportit, VendimiIRaportit } from "@/components/RaportiVizites";
import { RaportiNeGjuhen } from "@/components/RaportiNeGjuhen";
import { ShqyrtimiIRastit } from "@/components/ShqyrtimiIRastit";
import { UrezaIcon, type IconName } from "@/components/UrezaIcon";
import { DeshmiteShkurt, KartaEMikut, StatusiIGjalle } from "@/components/VizitaBesimi";
import { colors, font } from "@/constants/ureza";
import { GjendjaBosh } from "@/components/ui/GjendjaBosh";
import { SkeletiIFaqes } from "@/components/ui/Skeleti";
import { useToast } from "@/components/ui/Toast";
import { Kutia } from "@/components/Kutia";
import { useMikuIVerifikuar } from "@/lib/admini";
import { PJESA_E_DEMIT, useKontrata, useProfiliIPunes } from "@/lib/kontrata";
import { CMIMI_TEKST } from "@/lib/kushtet";
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
  const toast = useToast();
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
  // the client sees whether their Miku is verified (supabase/besimi.sql)
  const mikuVerifikuar = useMikuIVerifikuar(!eMiku && !eAdmin ? (vizita?.mikuId ?? null) : null);
  const mbrapa = { etiketa: "Mbrapa", onPress: () => router.back() };

  if (!vizita) {
    return (
      <EkraniMeHero kicker="VIZITA" title="Vizita" kthehu={mbrapa}>
        {burimiVizitat === "duke_ngarkuar" ? (
          <SkeletiIFaqes rreshta={2} />
        ) : (
          <GjendjaBosh
            toni="gabim"
            ikona="warning"
            titulli="Kjo vizitë nuk u gjet"
            teksti="Ndoshta u anulua. Kthehu për të parë vizitat e tua."
            veprimi={{ etiketa: "Kthehu", onPress: mbrapa.onPress }}
          />
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
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    toast.sukses("Vizita u anulua.");
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
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
              onPress={() => {
                if (t.vlera !== tab) void Haptics.selectionAsync();
                setTab(t.vlera);
              }}
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

          {/* trust, in order: who comes, what is happening now, then the proof */}
          {!eMiku ? <KartaEMikut emri={vizita.mikuEmri} verifikuar={mikuVerifikuar} /> : null}
          <StatusiIGjalle statusi={vizita.statusi} teksti={tekstiIStatusit} />

          {/* the Miku's report in the reader's language, once the evidence is sent */}
          {dergoi ? <RaportiNeGjuhen vizita={vizita} /> : null}

          {raportiGati ? <PermbledhjaERaportit vizita={vizita} onShikoDeshmite={() => setTab("deshmi")} /> : null}

          <View style={styles.karta}>
            <Text style={styles.titulli}>{eMiku ? "Çka kërkon klienti" : eAdmin ? "Çka kërkoi klienti" : "Çka kërkove"}</Text>
            <Text style={styles.udhezime}>{vizita.udhezime}</Text>
            <Rresht etiketa="Lloji" vlera={titulliIVizites(vizita.lloji)} />
            <Rresht etiketa="Data" vlera={dataEPlote(vizita.data)} />
            <Rresht etiketa="Prona" vlera={prona?.emri ?? "Prona"} fundit />
          </View>

          <KartaEKontrates vizitaId={vizita.id} />

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


          {/* while the report waits for a decision, "Shiko dëshmitë" is on the report card above */}
          {!raportiGati ? <DeshmiteShkurt gati={dergoi} onHap={() => setTab("deshmi")} /> : null}

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
  const toast = useToast();
  const { pranoVizite } = useDhenat();
  const puna = useProfiliIPunes();
  const [kontrata, setKontrata] = useState(false);
  const [duke, setDuke] = useState(false);
  const [gabim, setGabim] = useState<string | null>(null);
  // without "Si punon si Miku" the contract has no party; the database refuses the acceptance too
  const paProfil = puna.gati && !puna.profili?.lloji;

  async function prano() {
    if (duke) return;
    if (paProfil) {
      setGabim("Së pari plotëso “Si punon si Miku” te Profili.");
      return;
    }
    if (!kontrata) {
      setGabim("Lexo kontratën dhe shëno që e pranon, pastaj prano detyrën.");
      return;
    }
    setDuke(true);
    setGabim(null);
    const mesazh = await pranoVizite(vizita.id);
    setDuke(false);
    if (mesazh) {
      setGabim(mesazh);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    toast.sukses("E pranove detyrën. Kontrata u krijua.");
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
        <Text style={styles.tekst}>
          Kur të jesh te prona në datën e vizitës, shtyp “Fillo vizitën” dhe mblidhi këtu. Raporti dërgohet vetëm kur ka
          GPS, të paktën një foto dhe shënimin zanor.
        </Text>
      </View>

      <View style={styles.karta}>
        <View style={styles.kontrataKrye}>
          <View style={styles.deshmiIkona}>
            <UrezaIcon name="doc" size={22} color={colors.petrol} />
          </View>
          <Text style={[styles.titulli, styles.flex]}>Kontrata me klientin</Text>
        </View>
        <PikaEKontrates tekst={`${CMIMI_TEKST} për vizitën e kryer.`} />
        <PikaEKontrates
          tekst={`Dëm nga pakujdesia gjatë vizitës: paguan ${PJESA_E_DEMIT}% të vlerës. Me qëllim ose nga pakujdesia e rëndë: dëmin e plotë.`}
        />
        <PikaEKontrates tekst="Punon i pavarur, 08:00–20:00, dhe mund ta refuzosh punën e rrezikshme." />
        <Pressable
          style={styles.kontrataLidhje}
          onPress={() => router.push({ pathname: "/kontrata/[id]", params: { id: vizita.id } })}
          accessibilityRole="link"
        >
          <Text style={styles.kontrataLidhjeTeksti}>Hap kontratën dhe gjeneroje si PDF</Text>
          <UrezaIcon name="arrow" size={16} color={colors.petrol} strokeWidth={2.6} />
        </Pressable>
        {paProfil ? (
          <Pressable style={styles.paProfil} onPress={() => router.push("/profili")} accessibilityRole="button">
            <UrezaIcon name="warning" size={18} color="#8A5210" strokeWidth={2.2} />
            <Text style={styles.paProfilTeksti}>
              Së pari plotëso “Si punon si Miku” te Profili (kompani, individ, student ose mjeshtër).
            </Text>
            <UrezaIcon name="chevron" size={18} color="#8A5210" strokeWidth={2.4} />
          </Pressable>
        ) : (
          <Kutia
            zgjedhur={kontrata}
            onPress={() => setKontrata((x) => !x)}
            teksti="E lexova kontratën dhe e pranoj, me kushtet e punës dhe përgjegjësinë për dëmin."
          />
        )}
      </View>

      {gabim ? <Text style={styles.gabim}>{gabim}</Text> : null}

      <Pressable
        style={[styles.primary, (duke || !kontrata || paProfil) && styles.disabled]}
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

// The contract of the visit: who has accepted it, and the way to read it.
function KartaEKontrates({ vizitaId }: { vizitaId: string }) {
  const router = useRouter();
  const { burimi, dhenat } = useKontrata(vizitaId);
  if (burimi === "duke_ngarkuar") return null;
  const klienti = dhenat?.pelqimiAt ?? null;
  const miku = dhenat?.kontrataPranuarAt ?? null;
  const teDy = klienti !== null && miku !== null;
  return (
    <Pressable
      style={styles.karta}
      onPress={() => router.push({ pathname: "/kontrata/[id]", params: { id: vizitaId } })}
      accessibilityRole="button"
      accessibilityLabel="Hap kontratën e vizitës"
    >
      <View style={styles.kontrataKrye}>
        <View style={styles.deshmiIkona}>
          <UrezaIcon name="doc" size={22} color={colors.petrol} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.titulli}>Kontrata</Text>
          <Text style={styles.tekst}>
            {burimi === "mungon"
              ? "Kushtet mes teje dhe Mikut për këtë vizitë."
              : teDy
                ? "E pranuar nga të dy palët."
                : miku === null
                  ? "Pret që Miku ta pranojë."
                  : "Pret pranimin e klientit."}
          </Text>
        </View>
        <UrezaIcon name="chevron" size={20} color={colors.petrol} strokeWidth={2.4} />
      </View>
      {burimi === "supabase" ? (
        <View style={styles.kontrataPalet}>
          <ShenjaEPales emri="Klienti" kur={klienti} />
          <ShenjaEPales emri="Miku" kur={miku} />
        </View>
      ) : null}
    </Pressable>
  );
}

function ShenjaEPales({ emri, kur }: { emri: string; kur: string | null }) {
  return (
    <View style={[styles.pala, kur ? styles.palaPo : styles.palaJo]}>
      <UrezaIcon name={kur ? "check" : "clock"} size={14} color={kur ? "#1E6B3E" : "#8A5210"} strokeWidth={2.6} />
      <Text style={[styles.palaTeksti, { color: kur ? "#1E6B3E" : "#8A5210" }]}>
        {emri}: {kur ? dataShkurt(kur.slice(0, 10)) : "pret"}
      </Text>
    </View>
  );
}

function PikaEKontrates({ tekst }: { tekst: string }) {
  return (
    <View style={styles.kontrataPika}>
      <UrezaIcon name="check" size={16} color={colors.teal} strokeWidth={2.6} />
      <Text style={[styles.tekst, styles.flex]}>{tekst}</Text>
    </View>
  );
}

function Rresht({
  etiketa,
  vlera,
  fundit,
  distinktiv,
}: {
  etiketa: string;
  vlera: string;
  fundit?: boolean;
  distinktiv?: string; // a small green badge under the value (e.g. a verified Miku)
}) {
  return (
    <View style={[styles.rreshti, !fundit && styles.ndarje]}>
      <Text style={styles.etiketa}>{etiketa}</Text>
      <View style={styles.vleraKolona}>
        <Text style={styles.vlera}>{vlera}</Text>
        {distinktiv ? (
          <View style={styles.distinktiv}>
            <UrezaIcon name="shield" size={14} color="#1E6B3E" strokeWidth={2.4} />
            <Text style={styles.distinktivTeksti}>{distinktiv}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  kontrataKrye: { flexDirection: "row", alignItems: "center", gap: 12 },
  kontrataPika: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  kontrataPalet: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  pala: { flexDirection: "row", alignItems: "center", gap: 6, height: 28, paddingHorizontal: 10, borderRadius: 14 },
  palaPo: { backgroundColor: "#E4F6EB" },
  palaJo: { backgroundColor: "#FFF2DE" },
  palaTeksti: { fontSize: 13, fontFamily: font.w700 },
  kontrataLidhje: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 44 },
  kontrataLidhjeTeksti: { color: colors.petrol, fontSize: 16, fontFamily: font.w800 },
  paProfil: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#FFF2DE",
  },
  paProfilTeksti: { flex: 1, color: "#8A5210", fontSize: 14, lineHeight: 20, fontFamily: font.w600 },
  vleraKolona: { flexShrink: 1, alignItems: "flex-end", gap: 4 },
  distinktiv: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#E4F6EB",
  },
  distinktivTeksti: { color: "#1E6B3E", fontSize: 12, fontFamily: font.w800 },
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
  tabText: { color: colors.textSecondary, fontSize: 15, fontFamily: font.w700 },
  tabTextAktiv: { color: colors.petrol, fontFamily: font.w800 },
  karta: { backgroundColor: colors.white, borderRadius: 20, padding: 20, gap: 8 },
  titulli: { color: colors.ink, fontSize: 20, lineHeight: 26, fontFamily: font.w800 },
  tekst: { color: colors.textSecondary, fontSize: 15, lineHeight: 22, fontFamily: font.w500 },
  udhezime: { color: colors.ink, fontSize: 16, lineHeight: 24, fontFamily: font.w500, marginBottom: 6 },
  rreshti: { minHeight: 52, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  ndarje: { borderBottomWidth: 1, borderBottomColor: "#EDF1F4" },
  etiketa: { color: colors.textSecondary, fontSize: 15, fontFamily: font.w600 },
  vlera: { color: colors.ink, fontSize: 16, fontFamily: font.w700, textAlign: "right" },
  anulim: { gap: 8 },
  gabim: { color: colors.error, fontSize: 14, lineHeight: 20, fontFamily: font.w600 },
  anuloButon: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.vizita,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  anuloText: { color: colors.vizita, fontSize: 17, fontFamily: font.w700 },
  konfirmim: { gap: 10, padding: 16, borderRadius: 16, backgroundColor: "#FDECEA" },
  konfirmimTekst: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  konfirmimLabel: { flex: 1, color: "#7A1F1B", fontSize: 15, lineHeight: 22, fontFamily: font.w600 },
  anuloPlote: { backgroundColor: colors.vizita },
  anuloPloteText: { color: colors.white, fontSize: 17, fontFamily: font.w700 },
  jo: { minHeight: 48, alignItems: "center", justifyContent: "center" },
  joText: { color: colors.petrol, fontSize: 16, fontFamily: font.w700 },
  disabled: { opacity: 0.6 },
  ndihme: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, fontFamily: font.w500, textAlign: "center" },
  primary: { height: 56, borderRadius: 16, backgroundColor: colors.petrol, alignItems: "center", justifyContent: "center" },
  primaryText: { color: colors.white, fontSize: 17, fontFamily: font.w700 },
  sukses: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    borderRadius: 16,
    backgroundColor: "#E4F6EB",
  },
  suksesText: { flex: 1, color: "#1E6B3E", fontSize: 15, lineHeight: 22, fontFamily: font.w600 },
  deshmi: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 4 },
  deshmiIkona: { width: 44, height: 44, borderRadius: 14, backgroundColor: "#E8F5F3", alignItems: "center", justifyContent: "center" },
  deshmiTekst: { flex: 1, gap: 1 },
  deshmiTitulli: { color: colors.ink, fontSize: 16, lineHeight: 22, fontFamily: font.w800 },
});
