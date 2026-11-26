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
import { RedaktoVendin } from "@/components/RedaktoVendin";
import { SeShpejti } from "@/components/SeShpejti";
import { StatusiChip } from "@/components/StatusiChip";
import { UrezaIcon } from "@/components/UrezaIcon";
import { colors } from "@/constants/ureza";
import { useDhenat } from "@/lib/dhenat";
import { koordinataNeTekst, lidhjaEHartes } from "@/lib/gjeo";
import { vendiNeHarte, type Prona } from "@/lib/pronat";
import { useProfili } from "@/lib/profili";
import { dataShkurt, titulliIVizites, type Vizita } from "@/lib/vizitat";

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
        <View style={styles.doreza} />
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.fleteBrenda}
        >
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

              <View>
                <Text style={styles.emriIPrones} accessibilityRole="header">
                  {prona.emri}
                </Text>
                <Text style={styles.vendi}>
                  {prona.vendi} · {shumes(vizitatEPrones.length, "vizitë", "vizita")}
                </Text>
              </View>

              <KartaEVendit prona={prona} eMiku={eMiku} onRedakto={() => setRedakto(true)} />

              <View style={styles.vizitat}>
                {vizitatEPrones.length === 0 ? (
                  <Text style={[styles.tekst, styles.pavizita]}>Ende nuk ka vizita për këtë pronë.</Text>
                ) : (
                  vizitatEPrones
                    .slice(0, SA_VIZITA_NE_FLETE)
                    .map((v, i, lista) => <RreshtiIVizites key={v.id} vizita={v} fundit={i === lista.length - 1} />)
                )}
              </View>

              {vizitatEPrones.length > SA_VIZITA_NE_FLETE ? (
                <Pressable
                  style={styles.lidhje}
                  onPress={() => router.navigate(eMiku ? "/miku" : "/oda")}
                  accessibilityRole="button"
                >
                  <Text style={styles.lidhjeText}>Shiko të gjitha</Text>
                  <UrezaIcon name="chevron" size={18} color={colors.petrol} strokeWidth={2.6} />
                </Pressable>
              ) : null}

              {!eMiku ? (
                <Pressable style={styles.primary} onPress={() => router.navigate("/pronat")} accessibilityRole="button">
                  <Text style={styles.primaryText}>Shiko ditarin</Text>
                  <UrezaIcon name="arrow" size={22} color={colors.white} strokeWidth={2.3} />
                </Pressable>
              ) : null}
            </>
          ) : null}
        </ScrollView>
      </View>

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
      <Text style={styles.pronaEmri} numberOfLines={1}>
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

  let titulli: string;
  let tekst: string;
  if (k) {
    titulli = "Vendndodhja e saktë";
    tekst = eMiku
      ? `${koordinataNeTekst(k)}. GPS-i yt krahasohet me këtë pikë kur mbledh dëshmitë.`
      : `${koordinataNeTekst(k)}. GPS-i i Mikut krahasohet me këtë pikë (rreze 150 m).`;
  } else if (v) {
    titulli = "Vendndodhje e përafërt";
    tekst = eMiku
      ? `Prona është shënuar vetëm sipas qytetit (${v.qyteti}). Vendndodhja e saktë shfaqet pasi ta pranosh vizitën.`
      : `Prona është shënuar vetëm sipas qytetit (${v.qyteti}), jo sipas adresës. Shto vendndodhjen e saktë që ta shohësh aty ku është dhe që GPS-i i Mikut të krahasohet me të.`;
  } else {
    titulli = "Prona nuk është në hartë";
    tekst = eMiku
      ? "Vendi i kësaj prone nuk njihet në hartë."
      : `Vendi “${prona.vendi}” nuk njihet në hartë. Shto koordinatat e pronës që ta shohësh këtu.`;
  }

  return (
    <View style={styles.karta}>
      <View style={styles.rreshtIkone}>
        <UrezaIcon name="pin" size={20} color={colors.petrol} strokeWidth={2.2} />
        <Text style={styles.titulliKartes}>{titulli}</Text>
      </View>
      <Text style={styles.tekst}>{tekst}</Text>
      <View style={styles.lidhjet}>
        {k ? (
          <Pressable
            style={styles.dytesor}
            onPress={() => void Linking.openURL(lidhjaEHartes(k))}
            accessibilityRole="link"
          >
            <Text style={styles.dytesorText}>Hape në Google Maps</Text>
          </Pressable>
        ) : null}
        {!eMiku ? (
          <Pressable style={styles.dytesor} onPress={onRedakto} accessibilityRole="button">
            <Text style={styles.dytesorText}>{k ? "Ndrysho vendndodhjen" : "Shto vendndodhjen e saktë"}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function RreshtiIVizites({ vizita, fundit }: { vizita: Vizita; fundit: boolean }) {
  const router = useRouter();
  return (
    <Pressable
      style={[styles.rreshti, !fundit && styles.ndarje]}
      onPress={() => router.push({ pathname: "/vizita/[id]", params: { id: vizita.id } })}
      accessibilityRole="button"
      accessibilityLabel={`${titulliIVizites(vizita.lloji)}, ${dataShkurt(vizita.data)}`}
    >
      <View style={styles.rreshtiTekst}>
        <Text style={styles.rreshtiTitulli} numberOfLines={1}>
          {titulliIVizites(vizita.lloji)}
        </Text>
        <Text style={styles.rreshtiData}>{dataShkurt(vizita.data)}</Text>
      </View>
      <StatusiChip statusi={vizita.statusi} />
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
  titulliText: { color: colors.white, fontSize: 24, lineHeight: 30, fontWeight: "800" },
  nentitulli: { color: colors.onHeroText, fontSize: 14, lineHeight: 20, fontWeight: "500" },
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
  kerkoText: { color: colors.white, fontSize: 15, fontWeight: "700" },
  flete: {
    flex: 1,
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
  fleteBrenda: { paddingTop: 12, paddingHorizontal: 20, paddingBottom: 32, gap: 14 },
  doreza: { alignSelf: "center", width: 44, height: 5, borderRadius: 3, backgroundColor: "#C3D0D7" },
  shtypur: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  // the row bleeds to the screen edges, so the cards slide out under them
  kartatJashte: { marginHorizontal: -20 },
  kartat: { gap: 12, paddingHorizontal: 20, paddingVertical: 4 },
  pronaKarta: {
    width: 150,
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
  pronaEmri: { color: colors.ink, fontSize: 15, lineHeight: 20, fontWeight: "800", paddingHorizontal: 4 },
  pronaVendi: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 4, paddingBottom: 4 },
  pronaVendiTeksti: { color: colors.textSecondary, fontSize: 13, fontWeight: "600", flexShrink: 1 },
  emriIPrones: { color: colors.ink, fontSize: 22, lineHeight: 28, fontWeight: "800" },
  vendi: { color: colors.textSecondary, fontSize: 15, lineHeight: 21, fontWeight: "500" },
  karta: { backgroundColor: colors.white, borderRadius: 20, padding: 20, gap: 8 },
  rreshtIkone: { flexDirection: "row", alignItems: "center", gap: 8 },
  titulliKartes: { color: colors.ink, fontSize: 17, lineHeight: 22, fontWeight: "800", flexShrink: 1 },
  tekst: { color: colors.textSecondary, fontSize: 15, lineHeight: 22, fontWeight: "500" },
  lidhjet: { flexDirection: "row", flexWrap: "wrap", columnGap: 24 },
  dytesor: { minHeight: 44, alignItems: "flex-start", justifyContent: "center" },
  dytesorText: { color: colors.petrol, fontSize: 16, fontWeight: "800" },
  vizitat: { backgroundColor: colors.white, borderRadius: 20, paddingHorizontal: 16 },
  pavizita: { paddingVertical: 20 },
  rreshti: { minHeight: 68, flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 },
  ndarje: { borderBottomWidth: 1, borderBottomColor: "#EDF1F4" },
  rreshtiTekst: { flex: 1, minWidth: 0 },
  rreshtiTitulli: { color: colors.ink, fontSize: 16, lineHeight: 22, fontWeight: "700" },
  rreshtiData: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, fontWeight: "500" },
  lidhje: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: 4 },
  lidhjeText: { color: colors.petrol, fontSize: 16, fontWeight: "800" },
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
});
