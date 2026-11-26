import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EkraniMeHero } from "@/components/EkraniMeHero";
import type { PikaNeHarte } from "@/components/HartaKosoves";
import { HartaReale } from "@/components/HartaReale";
import { PronaIlustrim } from "@/components/PronaIlustrim";
import { ChipiIFreskise, ditePara } from "@/components/PronaKarta";
import { RedaktoVendin } from "@/components/RedaktoVendin";
import { SeShpejti } from "@/components/SeShpejti";
import { StatusiChip } from "@/components/StatusiChip";
import { UrezaIcon, type IconName } from "@/components/UrezaIcon";
import { colors, font } from "@/constants/ureza";
import { useDhenat } from "@/lib/dhenat";
import { koordinataNeTekst, lidhjaEHartes } from "@/lib/gjeo";
import { vendiNeHarte, type Prona } from "@/lib/pronat";
import { useProfili } from "@/lib/profili";
import { dataShkurt, LLOJET_E_VIZITES, STATUSET, titulliIVizites, type Vizita } from "@/lib/vizitat";

const SA_VIZITA_NE_FLETE = 4;

function shumes(n: number, njejes: string, shumes: string): string {
  return `${n} ${n === 1 ? njejes : shumes}`;
}

// The map tab (design: Harta). The client sees their properties on the map of Kosovo and the visits
// of the selected one; a Miku sees the properties of the visits they can see (the exact position only
// of the ones they have accepted); the admin's map comes in a later step (the panel is on Paneli).
export default function Harta() {
  const { profili } = useProfili();
  const roli = profili?.roli ?? "klient";

  if (roli === "admin") {
    return (
      <EkraniMeHero kicker="HARTA" title="Harta" subtitle="Rastet në një vend.">
        <SeShpejti titulli="Harta e rasteve" teksti="Harta e rasteve të kundërshtuara vjen më vonë. Rastet dhe dëshmitë e tyre janë te Paneli." />
      </EkraniMeHero>
    );
  }
  return <HartaEPronave eMiku={roli === "miku"} />;
}

function HartaEPronave({ eMiku }: { eMiku: boolean }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { pronat, burimiPronat, vizitat, rifresko } = useDhenat();
  const [zgjedhurId, setZgjedhurId] = useState<string | null>(null);
  const [redakto, setRedakto] = useState(false);

  // the map takes the upper part of the screen (above the tab bar), the sheet with the property the rest
  const [lartesiaEEkranit, setLartesiaEEkranit] = useState(height - 130);
  const lartesiaEHartes = Math.max(260, Math.round(lartesiaEEkranit * 0.46));

  const pikat = useMemo<PikaNeHarte[]>(
    () =>
      pronat.flatMap((p) => {
        const v = vendiNeHarte(p);
        return v ? [{ id: p.id, emri: p.emri, vendi: p.vendi, k: v.k, sakte: v.sakte }] : [];
      }),
    [pronat],
  );

  // the selected property: the one tapped, else the first one that is on the map, else the first
  const prona: Prona | null =
    pronat.find((p) => p.id === zgjedhurId) ??
    pronat.find((p) => pikat.some((x) => x.id === p.id)) ??
    pronat[0] ??
    null;
  const vizitatEPrones = prona ? vizitat.filter((v) => v.pronaId === prona.id) : [];

  const nenTitulli = `${shumes(pronat.length, "pronë", "prona")} · ${shumes(vizitat.length, "vizitë", "vizita")}`;

  return (
    <View style={styles.root} onLayout={(e) => setLartesiaEEkranit(e.nativeEvent.layout.height)}>
      <StatusBar style="light" />
      {/* keeps the status bar area dark once the map has scrolled away */}
      <View style={[styles.scrim, { height: insets.top }]} />
      {/* the map scrolls with the page: it is the top of the page, not a fixed window */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.faqja}
      >
        <View style={{ height: lartesiaEHartes }}>
          <HartaReale
            pikat={pikat}
            zgjedhurId={prona?.id ?? null}
            onZgjidh={setZgjedhurId}
            gjeresia={width}
            lartesia={lartesiaEHartes}
            siper={insets.top + 64}
          />
          <View style={[styles.titulli, { top: insets.top + 8 }]}>
            <Text style={styles.titulliText} accessibilityRole="header">
              Harta
            </Text>
            <Text style={styles.nentitulli}>{nenTitulli}</Text>
          </View>
          {!eMiku ? (
            <Pressable
              onPress={() => router.push("/kerko-vizite")}
              style={[styles.kerko, { top: insets.top + 8 }]}
              accessibilityRole="button"
              accessibilityLabel="Kërko një vizitë"
            >
              <UrezaIcon name="plus" size={18} color={colors.white} strokeWidth={2.2} />
              <Text style={styles.kerkoText}>Kërko</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.flete}>
          <View style={styles.fleteBrenda}>
            {burimiPronat === "duke_ngarkuar" ? <ActivityIndicator color={colors.petrol} /> : null}

            {burimiPronat === "pa_lidhje" ? (
              <View style={styles.karta}>
                <Text style={styles.titulliKartes}>Nuk u lidh me serverin</Text>
                <Text style={styles.tekst}>Kontrollo internetin, pastaj provo përsëri.</Text>
                <Pressable style={styles.dytesor} onPress={() => void rifresko()} accessibilityRole="button">
                  <Text style={styles.dytesorText}>Provo përsëri</Text>
                </Pressable>
              </View>
            ) : null}

            {(burimiPronat === "supabase" || burimiPronat === "demo") && !prona ? (
              <View style={styles.karta}>
                <Text style={styles.titulliKartes}>{eMiku ? "Asnjë pronë për momentin" : "Ende nuk ke asnjë pronë"}</Text>
                <Text style={styles.tekst}>
                  {eMiku
                    ? "Pronat shfaqen këtu kur ka kërkesa të hapura, ose vizita që ke pranuar."
                    : "Shto të parën te Pronat, p.sh. shtëpinë ose prindërit, dhe do ta shohësh në hartë."}
                </Text>
                {!eMiku ? (
                  <Pressable style={styles.dytesor} onPress={() => router.navigate("/pronat")} accessibilityRole="button">
                    <Text style={styles.dytesorText}>Shko te Pronat</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}

            {prona ? (
              <>
                {pronat.length > 1 ? (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.kartat}
                    style={styles.kartatJashte}
                  >
                    {pronat.map((p) => (
                      <KartaEPrones
                        key={p.id}
                        prona={p}
                        zgjedhur={p.id === prona.id}
                        onPress={() => setZgjedhurId(p.id)}
                      />
                    ))}
                  </ScrollView>
                ) : null}

                <View style={styles.zgjedhur}>
                  <Text style={styles.emriIPrones} accessibilityRole="header">
                    {prona.emri}
                  </Text>
                  <View style={styles.rreshtIkone}>
                    <UrezaIcon name="pin" size={15} color={colors.textSecondary} strokeWidth={2.2} />
                    <Text style={styles.vendi} numberOfLines={1}>
                      {prona.vendi} · {shumes(vizitatEPrones.length, "vizitë", "vizita")}
                    </Text>
                  </View>
                  <ChipiIFreskise dite={ditePara(prona.id, vizitat)} />
                  {!eMiku ? (
                    <Pressable
                      style={({ pressed }) => [styles.primary, pressed && styles.shtypur]}
                      onPress={() =>
                        router.push({
                          pathname: "/kerko-vizite",
                          params: { pronaId: prona.id, lloji: prona.lloji === "prindert" ? "kujdes" : "inspektim" },
                        })
                      }
                      accessibilityRole="button"
                      accessibilityLabel={`Kërko vizitë për ${prona.emri}`}
                    >
                      <Text style={styles.primaryText}>Kërko vizitë</Text>
                      <UrezaIcon name="arrow" size={22} color={colors.white} strokeWidth={2.3} />
                    </Pressable>
                  ) : null}
                </View>

                <KartaEVendit prona={prona} eMiku={eMiku} onRedakto={() => setRedakto(true)} />

                <View style={styles.vizitatKrye}>
                  <Text style={styles.seksioni} accessibilityRole="header">
                    Vizitat
                  </Text>
                  {vizitatEPrones.length > 0 ? (
                    <Pressable
                      style={styles.lidhje}
                      // the Miku has no Oda; their visits are on Kërkesat
                      onPress={() => router.navigate(eMiku ? "/miku" : "/oda")}
                      accessibilityRole="link"
                      accessibilityLabel={eMiku ? "Shiko të gjitha te Kërkesat" : "Shiko të gjitha te Oda"}
                    >
                      <Text style={styles.lidhjeText}>Shiko të gjitha</Text>
                      <UrezaIcon name="chevron" size={18} color={colors.petrol} strokeWidth={2.6} />
                    </Pressable>
                  ) : null}
                </View>

                <View style={styles.vizitat}>
                  {vizitatEPrones.length === 0 ? (
                    <Text style={[styles.tekst, styles.pavizita]}>Ende nuk ka vizita për këtë pronë.</Text>
                  ) : (
                    vizitatEPrones
                      .slice(0, SA_VIZITA_NE_FLETE)
                      .map((v, i, lista) => <RreshtiIVizites key={v.id} vizita={v} fundit={i === lista.length - 1} />)
                  )}
                </View>
              </>
            ) : null}
          </View>
        </View>
      </ScrollView>

      {redakto && prona ? <RedaktoVendin prona={prona} mbyll={() => setRedakto(false)} /> : null}
    </View>
  );
}

// A small property card that slides sideways under the map (like KartaEPrones on Ballina):
// the picture, the name and the town. The selected one has a petrol frame.
function KartaEPrones({ prona, zgjedhur, onPress }: { prona: Prona; zgjedhur: boolean; onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.pronaKarta, zgjedhur && styles.pronaKartaZgjedhur, pressed && styles.shtypur]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${prona.emri}, ${prona.vendi}. Shfaqe në hartë.`}
      accessibilityState={{ selected: zgjedhur }}
    >
      <View style={styles.pronaFoto}>
        <PronaIlustrim lloji={prona.lloji} />
      </View>
      <Text style={styles.pronaEmri} numberOfLines={2}>
        {prona.emri}
      </Text>
      <View style={styles.pronaVendi}>
        <UrezaIcon name="pin" size={13} color={colors.textSecondary} strokeWidth={2.4} />
        <Text style={styles.pronaVendiTeksti} numberOfLines={1}>
          {prona.vendi}
        </Text>
      </View>
    </Pressable>
  );
}

// What the map knows about where the property is, and what the client can do about it.
function KartaEVendit({ prona, eMiku, onRedakto }: { prona: Prona; eMiku: boolean; onRedakto: () => void }) {
  const v = vendiNeHarte(prona);
  const k = prona.koordinatat;

  // three states that read apart: colour + icon + words, never colour alone
  let gjendja: GjendjaEVendit;
  let tekst: string;
  if (k) {
    gjendja = GJENDJET.sakte;
    tekst = eMiku
      ? `${koordinataNeTekst(k)}. GPS-i yt krahasohet me këtë pikë kur mbledh dëshmitë.`
      : `${koordinataNeTekst(k)}. GPS-i i Mikut krahasohet me këtë pikë (rreze 150 m).`;
  } else if (v) {
    gjendja = GJENDJET.perafert;
    tekst = eMiku
      ? `Prona është shënuar vetëm sipas qytetit (${v.qyteti}). Vendndodhja e saktë shfaqet pasi ta pranosh vizitën.`
      : `Prona është shënuar vetëm sipas qytetit (${v.qyteti}), jo sipas adresës. Shto vendndodhjen e saktë që ta shohësh aty ku është dhe që GPS-i i Mikut të krahasohet me të.`;
  } else {
    gjendja = GJENDJET.mungon;
    tekst = eMiku
      ? "Vendi i kësaj prone nuk njihet në hartë."
      : `Vendi “${prona.vendi}” nuk njihet në hartë. Shto koordinatat e pronës që ta shohësh këtu.`;
  }

  return (
    <View style={styles.karta}>
      <View style={styles.rreshtIkone}>
        <View style={[styles.vendiIkona, { backgroundColor: gjendja.bg }]}>
          <UrezaIcon name={gjendja.ikona} size={20} color={gjendja.fg} strokeWidth={2.4} />
        </View>
        <Text style={styles.titulliKartes}>{gjendja.titulli}</Text>
      </View>
      <Text style={styles.tekst}>{tekst}</Text>
      {k || !eMiku ? (
        <View style={styles.lidhjet}>
          {k ? (
            <Pressable
              style={({ pressed }) => [styles.butonIkone, pressed && styles.shtypur]}
              onPress={() => void Linking.openURL(lidhjaEHartes(k))}
              accessibilityRole="link"
              accessibilityLabel="Hape në Google Maps"
            >
              <UrezaIcon name="map" size={18} color={colors.petrol} strokeWidth={2.2} />
              <Text style={styles.butonIkoneText}>Hape në Google Maps</Text>
            </Pressable>
          ) : null}
          {!eMiku ? (
            <Pressable
              style={({ pressed }) => [styles.butonIkone, pressed && styles.shtypur]}
              onPress={onRedakto}
              accessibilityRole="button"
              accessibilityLabel={k ? "Ndrysho vendndodhjen" : "Shto vendndodhjen e saktë"}
            >
              <UrezaIcon name={k ? "pin" : "plus"} size={18} color={colors.petrol} strokeWidth={2.2} />
              <Text style={styles.butonIkoneText}>{k ? "Ndrysho vendndodhjen" : "Shto vendndodhjen e saktë"}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

type GjendjaEVendit = { titulli: string; ikona: IconName; bg: string; fg: string };

// the same green and orange as the freshness chip on Pronat, and a neutral grey (constants/ureza.ts)
const GJENDJET: Record<"sakte" | "perafert" | "mungon", GjendjaEVendit> = {
  sakte: { titulli: "Vendndodhja e saktë", ikona: "check", bg: colors.okBg, fg: colors.ok },
  perafert: { titulli: "Vendndodhje e përafërt", ikona: "warning", bg: colors.kujdesBg, fg: colors.kujdes },
  mungon: { titulli: "Prona nuk është në hartë", ikona: "map", bg: colors.neutralBg, fg: colors.neutral },
};

// One visit: the icon of its kind, the title and date, the status (colour + icon + word) and an arrow.
function RreshtiIVizites({ vizita, fundit }: { vizita: Vizita; fundit: boolean }) {
  const router = useRouter();
  const ikona = LLOJET_E_VIZITES.find((l) => l.vlera === vizita.lloji)?.icon ?? "home";
  return (
    <Pressable
      style={({ pressed }) => [styles.rreshti, !fundit && styles.ndarje, pressed && styles.shtypur]}
      onPress={() => router.push({ pathname: "/vizita/[id]", params: { id: vizita.id } })}
      accessibilityRole="button"
      accessibilityLabel={`${titulliIVizites(vizita.lloji)}, ${dataShkurt(vizita.data)}, ${STATUSET[vizita.statusi]?.emri ?? ""}. Hap vizitën.`}
    >
      <View style={styles.rreshtiIkona}>
        <UrezaIcon name={ikona} size={20} color={colors.petrol} strokeWidth={2.2} />
      </View>
      <View style={styles.rreshtiTekst}>
        <Text style={styles.rreshtiTitulli} numberOfLines={1}>
          {titulliIVizites(vizita.lloji)}
        </Text>
        <Text style={styles.rreshtiData}>{dataShkurt(vizita.data)}</Text>
        <StatusiChip statusi={vizita.statusi} />
      </View>
      <UrezaIcon name="arrow" size={20} color={colors.petrol} strokeWidth={2.4} />
    </Pressable>
  );
}

// the light shadow the cards on Ballina, Oda and Pronat use
const hija = {
  shadowColor: "#0B2530",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.07,
  shadowRadius: 12,
  elevation: 2,
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.hero },
  // the title sits on the map in a dark card, so it reads over the satellite picture
  titulli: {
    position: "absolute",
    left: 12,
    maxWidth: "62%",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "rgba(23,63,78,0.88)",
    pointerEvents: "none",
  },
  titulliText: { color: colors.white, fontSize: 24, lineHeight: 30, fontFamily: font.w800 },
  nentitulli: { color: colors.onHeroText, fontSize: 14, lineHeight: 20, fontFamily: font.w500 },
  kerko: {
    position: "absolute",
    right: 12,
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 22,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(23,63,78,0.9)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
  },
  kerkoText: { color: colors.white, fontSize: 15, fontFamily: font.w700 },
  scrim: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 10, backgroundColor: colors.hero },
  faqja: { flexGrow: 1 },
  flete: {
    flexGrow: 1,
    marginTop: -24,
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    shadowColor: "#0B2530",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  fleteBrenda: { paddingTop: 8, paddingHorizontal: 20, paddingBottom: 32, gap: 14 },
  shtypur: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  // the row bleeds to the screen edges, so the cards slide out under them
  kartatJashte: { marginHorizontal: -20 },
  kartat: { gap: 12, paddingHorizontal: 20, paddingVertical: 4 },
  pronaKarta: {
    width: 170,
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 8,
    gap: 6,
    borderWidth: 2,
    borderColor: "transparent",
    ...hija,
  },
  pronaKartaZgjedhur: { borderColor: colors.petrol },
  pronaFoto: { height: 84, borderRadius: 14, overflow: "hidden" },
  pronaEmri: { color: colors.ink, fontSize: 15, lineHeight: 20, fontFamily: font.w800, paddingHorizontal: 4, minHeight: 40 },
  pronaVendi: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 4, paddingBottom: 4 },
  pronaVendiTeksti: { color: colors.textSecondary, fontSize: 13, fontFamily: font.w600, flexShrink: 1 },
  zgjedhur: { backgroundColor: colors.white, borderRadius: 22, padding: 20, gap: 8, alignItems: "flex-start", ...hija },
  emriIPrones: { color: colors.ink, fontSize: 22, lineHeight: 28, fontFamily: font.w800 },
  vendi: { color: colors.textSecondary, fontSize: 15, lineHeight: 21, fontFamily: font.w600, flexShrink: 1 },
  karta: { backgroundColor: colors.white, borderRadius: 20, padding: 20, gap: 8, ...hija },
  rreshtIkone: { flexDirection: "row", alignItems: "center", gap: 8 },
  titulliKartes: { color: colors.ink, fontSize: 17, lineHeight: 22, fontFamily: font.w800, flexShrink: 1 },
  tekst: { color: colors.textSecondary, fontSize: 15, lineHeight: 22, fontFamily: font.w500 },
  lidhjet: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 4 },
  vendiIkona: { width: 34, height: 34, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  butonIkone: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.white,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  butonIkoneText: { color: colors.petrol, fontSize: 15, fontFamily: font.w800 },
  dytesor: { minHeight: 44, alignItems: "flex-start", justifyContent: "center" },
  dytesorText: { color: colors.petrol, fontSize: 16, fontFamily: font.w800 },
  vizitatKrye: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  seksioni: { color: colors.ink, fontSize: 20, lineHeight: 26, fontFamily: font.w800 },
  vizitat: { backgroundColor: colors.white, borderRadius: 20, paddingHorizontal: 16, ...hija },
  rreshtiIkona: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.ikonaBg,
    alignItems: "center",
    justifyContent: "center",
  },
  pavizita: { paddingVertical: 20 },
  rreshti: { minHeight: 72, flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  ndarje: { borderBottomWidth: 1, borderBottomColor: "#EDF1F4" },
  rreshtiTekst: { flex: 1, minWidth: 0, gap: 2, alignItems: "flex-start" },
  rreshtiTitulli: { color: colors.ink, fontSize: 16, lineHeight: 22, fontFamily: font.w700 },
  rreshtiData: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, fontFamily: font.w500 },
  lidhje: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: 4 },
  lidhjeText: { color: colors.petrol, fontSize: 16, fontFamily: font.w800 },
  primary: {
    alignSelf: "stretch",
    marginTop: 4,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.petrol,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryText: { color: colors.white, fontSize: 17, fontFamily: font.w700 },
});
