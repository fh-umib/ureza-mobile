import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { EkraniMeHero } from "@/components/EkraniMeHero";
import { HapatEVizites } from "@/components/HapatEVizites";
import { Ikona, type EmriIIkones } from "@/components/Ikona";
import { PronaIlustrim, type Ilustrim } from "@/components/PronaIlustrim";
import { Seksioni } from "@/components/Seksioni";
import { StatusiChip } from "@/components/StatusiChip";
import { UrezaIcon, type IconName } from "@/components/UrezaIcon";
import { SkeletiIKartes } from "@/components/ui/Skeleti";
import { colors, font, hija } from "@/constants/ureza";
import { useDhenat } from "@/lib/dhenat";
import { CMIMI_TEKST } from "@/lib/kushtet";
import { useProfili } from "@/lib/profili";
import type { Prona } from "@/lib/pronat";
import { dataEPlote, dataNeTekst, dataShkurt, titulliIVizites, type LlojiVizites, type Vizita } from "@/lib/vizitat";

// The earliest visit that is still ahead (today or later) and not finished.
function vizitaERadhes(vizitat: Vizita[]): Vizita | null {
  const sot = dataNeTekst(new Date());
  const para = vizitat.filter((v) => v.data >= sot && v.statusi !== "miratuar" && v.statusi !== "kundershtuar");
  para.sort((a, b) => a.data.localeCompare(b.data));
  return para[0] ?? null;
}

function pershendetja(): string {
  const ora = new Date().getHours();
  if (ora < 12) return "Mirëmëngjes";
  if (ora < 18) return "Mirëdita";
  return "Mirëmbrëma";
}

// One sentence under the steps of the last visit: what is happening now.
function caNdodh(v: Vizita): string {
  switch (v.statusi) {
    case "kerkuar":
      return "Kërkesa u dërgua. Pret që një Miku ta pranojë.";
    case "pranuar":
      return v.mikuEmri ? `${v.mikuEmri} e pranoi kërkesën.` : "Një Miku e pranoi kërkesën.";
    case "vizita":
      return "Miku është te prona tani.";
    case "raporti_gati":
      return "Raporti është gati. Shiko dëshmitë dhe vendos.";
    case "miratuar":
      return "E miratove raportin.";
    case "kundershtuar":
      return "E kundërshtove raportin. Admini e shqyrton.";
  }
}

// Each block slides in a little after the one above it.
function Hyrje({ i, children }: { i: number; children: ReactNode }) {
  return <Animated.View entering={FadeInDown.delay(80 * i).duration(420)}>{children}</Animated.View>;
}

export default function Ballina() {
  const router = useRouter();
  const { profili } = useProfili();
  const { pronat, burimiPronat, vizitat, burimiVizitat } = useDhenat();

  const radhes = vizitaERadhes(vizitat);
  const eFundit = [...vizitat].sort((a, b) => b.krijuar.localeCompare(a.krijuar))[0] ?? null;
  const pronaEFundit = eFundit ? pronat.find((p) => p.id === eFundit.pronaId) : undefined;
  // a report waiting for the client's decision comes first
  const presin = vizitat.filter((v) => v.statusi === "raporti_gati");
  const aktive = vizitat.filter((v) => v.statusi !== "miratuar" && v.statusi !== "kundershtuar").length;
  const raporte = vizitat.filter((v) => ["raporti_gati", "miratuar", "kundershtuar"].includes(v.statusi)).length;
  const emri = profili?.emri?.trim().split(/\s+/)[0];

  const hapViziten = (id: string) => router.push({ pathname: "/vizita/[id]", params: { id } });
  const kerko = (lloji: LlojiVizites, pronaId?: string) =>
    router.push({ pathname: "/kerko-vizite", params: pronaId ? { lloji, pronaId } : { lloji } });

  return (
    <EkraniMeHero
      kicker="AFËR, EDHE KUR JE LARG"
      title={emri ? `${pershendetja()}, ${emri}!` : `${pershendetja()}!`}
      subtitle={radhes ? `Vizita e radhës: ${dataEPlote(radhes.data)}.` : "Çka po ndodh me pronat dhe familjen tënde."}
    >
      <Hyrje i={0}>
        <View style={styles.shifrat}>
          <Shifra
            ikona="pronat"
            toni={{ fg: colors.petrol, bg: colors.ikonaBg }}
            vlera={pronat.length}
            etiketa="Prona"
            onPress={() => router.navigate("/pronat")}
          />
          <Shifra
            ikona="koha"
            toni={{ fg: colors.kujdes, bg: colors.kujdesBg }}
            vlera={aktive}
            etiketa="Në proces"
            onPress={() => router.navigate("/oda")}
          />
          <Shifra
            ikona="miratuar"
            toni={{ fg: colors.ok, bg: colors.okBg }}
            vlera={raporte}
            etiketa="Raporte"
            onPress={() => router.navigate("/oda")}
          />
        </View>
      </Hyrje>

      {presin[0] ? (
        <Hyrje i={1}>
          <Pressable
            style={({ pressed }) => [styles.njoftim, pressed && styles.shtypur]}
            onPress={() => hapViziten(presin[0].id)}
            accessibilityRole="button"
            accessibilityLabel="Raporti është gati. Hap vizitën për ta miratuar ose kundërshtuar."
          >
            <View style={styles.njoftimIkona}>
              <Ikona emri="vendim" madhesia={22} ngjyra={colors.kujdes} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.njoftimTitulli}>
                {presin.length > 1 ? `${presin.length} raporte presin vendimin tënd` : "Raporti është gati"}
              </Text>
              <Text style={styles.njoftimTeksti}>Shiko dëshmitë, pastaj mirato ose kundërshto.</Text>
            </View>
            <ShigjetaRrethi ngjyra={colors.kujdes} sfondi="#FFE3B3" />
          </Pressable>
        </Hyrje>
      ) : null}

      <Hyrje i={2}>
        {eFundit ? (
          <Pressable
            style={({ pressed }) => [styles.kartaVizites, pressed && styles.shtypur]}
            onPress={() => hapViziten(eFundit.id)}
            accessibilityRole="button"
            accessibilityLabel={`${titulliIVizites(eFundit.lloji)}, ${pronaEFundit?.emri ?? "Prona"}. Hap detajet e vizitës.`}
          >
            <View style={styles.vizitaFoto}>
              <PronaIlustrim lloji={eFundit.lloji === "inspektim" ? (pronaEFundit?.lloji ?? "shtepi") : "prindert"} />
              <View style={styles.vizitaEtiketa}>
                <Ikona emri="kalendar" madhesia={13} ngjyra={colors.white} />
                <Text style={styles.vizitaEtiketaTeksti}>VIZITA E FUNDIT · {dataShkurt(eFundit.data)}</Text>
              </View>
            </View>
            <View style={styles.vizitaTrupi}>
              <View style={styles.vizitaTitujt}>
                <View style={styles.flex}>
                  <Text style={styles.titulli} numberOfLines={1}>
                    {titulliIVizites(eFundit.lloji)}
                  </Text>
                  <Text style={styles.nen} numberOfLines={1}>
                    {pronaEFundit?.emri ?? "Prona"}
                  </Text>
                </View>
                <StatusiChip statusi={eFundit.statusi} />
              </View>
              <View style={styles.hapat}>
                <HapatEVizites statusi={eFundit.statusi} />
              </View>
              <Text style={styles.nen}>{caNdodh(eFundit)}</Text>
              <View style={styles.kartaFund}>
                <Text style={styles.kartaFundTeksti}>Shiko detajet e vizitës</Text>
                <ShigjetaRrethi />
              </View>
            </View>
          </Pressable>
        ) : burimiVizitat === "duke_ngarkuar" ? (
          <SkeletiIKartes />
        ) : (
          <View style={styles.karta}>
            <Text style={styles.kicker}>FILLO KËTU</Text>
            <Text style={styles.titulli}>Ende nuk ke vizita</Text>
            <Text style={styles.nen}>Zgjidh më poshtë çka të shohë Miku: pronën ose prindërit.</Text>
          </View>
        )}
      </Hyrje>

      <Hyrje i={3}>
        <Seksioni ikona="vizitat" titulli="Çka të kontrollojmë?" />
        <View style={styles.veprimet}>
          <KartaEVeprimit
            ilustrim="ceti"
            ikona="shtepi"
            titulli="Inspektim prone"
            pikat={["Çati", "Ujë", "Rrymë", "Siguri"]}
            ngjyra={colors.petrol}
            onPress={() => kerko("inspektim")}
          />
          <KartaEVeprimit
            ilustrim="prindert"
            ikona="prindert"
            titulli="Vizitë te prindërit"
            pikat={["Shoqëri", "Ndihmë", "Me pëlqim"]}
            ngjyra={colors.teal}
            onPress={() => kerko("kujdes")}
          />
        </View>
      </Hyrje>

      {vizitat.length < 3 ? (
        <Hyrje i={4}>
          <SiFunksionon />
        </Hyrje>
      ) : null}

      <Hyrje i={5}>
        <Seksioni
          ikona="pronat"
          titulli="Pronat e mia"
          lidhja={{ etiketa: "Të gjitha", onPress: () => router.navigate("/pronat") }}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.rrjedha}
          contentContainerStyle={styles.rrjedhaBrenda}
        >
          {pronat.map((prona) => (
            <KartaEPrones key={prona.id} prona={prona} onPress={() => kerko(prona.lloji === "prindert" ? "kujdes" : "inspektim", prona.id)} />
          ))}
          {burimiPronat === "supabase" ? (
            <Pressable
              style={({ pressed }) => [styles.shtoProne, pressed && styles.shtypur]}
              onPress={() => router.navigate("/pronat")}
              accessibilityRole="button"
              accessibilityLabel="Shto një pronë"
            >
              <View style={styles.shtoRrethi}>
                <UrezaIcon name="plus" size={26} color={colors.petrol} strokeWidth={2.4} />
              </View>
              <Text style={styles.shtoTeksti}>Shto pronë</Text>
              <Text style={styles.shtoNen}>Shtëpi, tokë ose prindërit</Text>
            </Pressable>
          ) : null}
        </ScrollView>
      </Hyrje>

      <Hyrje i={6}>
        <Pressable
          style={({ pressed }) => [styles.besimi, pressed && styles.shtypur]}
          onPress={() => router.push("/kushtet")}
          accessibilityRole="link"
          accessibilityLabel="Kushtet e vizitës: çmimi, përgjegjësia dhe pëlqimi"
        >
          <View style={styles.besimiIkona}>
            <Ikona emri="miratuar" madhesia={20} ngjyra={colors.ok} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.besimiTitulli}>Miku i verifikuar · {CMIMI_TEKST} për vizitë</Text>
            <Text style={styles.besimiTeksti}>GPS, foto të drejtpërdrejta dhe zë. Lexo kushtet dhe pëlqimin.</Text>
          </View>
          <UrezaIcon name="chevron" size={20} color={colors.petrol} strokeWidth={2.4} />
        </Pressable>
      </Hyrje>
    </EkraniMeHero>
  );
}

// The round arrow that says "this opens something".
function ShigjetaRrethi({ ngjyra = colors.white, sfondi = colors.petrol }: { ngjyra?: string; sfondi?: string }) {
  return (
    <View style={[styles.shigjeta, { backgroundColor: sfondi }]}>
      <UrezaIcon name="arrow" size={18} color={ngjyra} strokeWidth={2.6} />
    </View>
  );
}

function Shifra({
  ikona,
  toni,
  vlera,
  etiketa,
  onPress,
}: {
  ikona: EmriIIkones;
  toni: { fg: string; bg: string };
  vlera: number;
  etiketa: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.shifra, pressed && styles.shtypur]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${etiketa}: ${vlera}`}
    >
      <View style={[styles.shifraIkona, { backgroundColor: toni.bg }]}>
        <Ikona emri={ikona} madhesia={18} ngjyra={toni.fg} />
      </View>
      <Text style={styles.shifraVlera}>{vlera}</Text>
      <Text style={styles.shifraEtiketa}>{etiketa}</Text>
    </Pressable>
  );
}

// A card that starts a new request of one kind: a picture of what the Miku will see, the kind
// with its icon, what is checked as small tags, and one clear button.
function KartaEVeprimit({
  ilustrim,
  ikona,
  titulli,
  pikat,
  ngjyra,
  onPress,
}: {
  ilustrim: Ilustrim;
  ikona: EmriIIkones;
  titulli: string;
  pikat: string[];
  ngjyra: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.veprimi, pressed && styles.shtypur]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${titulli}: ${pikat.join(", ")}. Kërko një vizitë.`}
    >
      <View style={styles.veprimiFoto}>
        <PronaIlustrim lloji={ilustrim} />
        <View style={[styles.veprimiIkona, { backgroundColor: ngjyra }]}>
          <Ikona emri={ikona} madhesia={18} ngjyra={colors.white} />
        </View>
      </View>
      <View style={styles.veprimiTrupi}>
        <Text style={styles.veprimiTitulli} numberOfLines={2}>
          {titulli}
        </Text>
        <View style={styles.veprimiPikat}>
          {pikat.map((p) => (
            <Text key={p} style={styles.veprimiPika}>
              {p}
            </Text>
          ))}
        </View>
        <View style={[styles.veprimiButoni, { backgroundColor: ngjyra }]}>
          <Text style={styles.veprimiButoniTeksti}>Kërko</Text>
          <Ikona emri="shigjeta" madhesia={14} ngjyra={colors.white} />
        </View>
      </View>
    </Pressable>
  );
}

const HAPAT_E_URES: { icon: IconName; titulli: string; teksti: string }[] = [
  { icon: "doc", titulli: "Kërkon", teksti: "Zgjedh pronën dhe ditën" },
  { icon: "pin", titulli: "Miku shkon", teksti: "GPS, foto dhe zë" },
  { icon: "check", titulli: "Ti vendos", teksti: "Miraton raportin" },
];

function SiFunksionon() {
  return (
    <View style={styles.siKarta}>
      <Text style={styles.kicker}>SI FUNKSIONON URËZA</Text>
      <View style={styles.siRreshti}>
        {HAPAT_E_URES.map((h, i) => (
          <View key={h.titulli} style={styles.siHapi}>
            <View style={styles.siIkonaRreshti}>
              <View style={[styles.siVija, i === 0 && styles.pa]} />
              <View style={styles.siIkona}>
                <UrezaIcon name={h.icon} size={22} color={colors.white} strokeWidth={2.3} />
                <View style={styles.siNumri}>
                  <Text style={styles.siNumriTeksti}>{i + 1}</Text>
                </View>
              </View>
              <View style={[styles.siVija, i === HAPAT_E_URES.length - 1 && styles.pa]} />
            </View>
            <Text style={styles.siTitulli}>{h.titulli}</Text>
            <Text style={styles.siTeksti}>{h.teksti}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function KartaEPrones({ prona, onPress }: { prona: Prona; onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.prona, pressed && styles.shtypur]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${prona.emri}, ${prona.vendi}. Kërko vizitë për këtë pronë.`}
    >
      <View style={styles.pronaFoto}>
        <PronaIlustrim lloji={prona.lloji} />
        <View style={styles.pronaVendi}>
          <UrezaIcon name="pin" size={13} color={colors.white} strokeWidth={2.4} />
          <Text style={styles.pronaVendiTeksti} numberOfLines={1}>
            {prona.vendi}
          </Text>
        </View>
      </View>
      <Text style={styles.pronaEmri} numberOfLines={2}>
        {prona.emri}
      </Text>
      <View style={styles.pronaFund}>
        <Text style={styles.pronaCta}>Kërko vizitë</Text>
        <UrezaIcon name="arrow" size={16} color={colors.petrol} strokeWidth={2.6} />
      </View>
    </Pressable>
  );
}


const styles = StyleSheet.create({
  flex: { flex: 1 },
  shtypur: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  pa: { backgroundColor: "transparent" },

  shifrat: { flexDirection: "row", gap: 10 },
  shifra: { flex: 1, backgroundColor: colors.white, borderRadius: 18, padding: 12, gap: 2, ...hija.karta },
  shifraIkona: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  shifraVlera: { color: colors.ink, fontSize: 24, lineHeight: 28, fontFamily: font.w800 },
  shifraEtiketa: { color: colors.textSecondary, fontSize: 13, lineHeight: 17, fontFamily: font.w600 },

  njoftim: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.kujdesBg,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#F5D8A6",
  },
  njoftimIkona: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#FFE3B3",
    alignItems: "center",
    justifyContent: "center",
  },
  njoftimTitulli: { color: "#6B3F0A", fontSize: 16, lineHeight: 21, fontFamily: font.w800 },
  njoftimTeksti: { color: colors.kujdes, fontSize: 14, lineHeight: 19, fontFamily: font.w500 },

  karta: { backgroundColor: colors.white, borderRadius: 22, padding: 18, gap: 10, ...hija.karta },
  kartaVizites: { backgroundColor: colors.white, borderRadius: 22, overflow: "hidden", ...hija.karta },
  vizitaFoto: { height: 120 },
  vizitaEtiketa: {
    position: "absolute",
    left: 12,
    top: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 28,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: "rgba(14,47,60,0.72)",
  },
  vizitaEtiketaTeksti: { color: colors.white, fontSize: 11, fontFamily: font.w800, letterSpacing: 0.8 },
  vizitaTrupi: { padding: 16, gap: 10 },
  vizitaTitujt: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  kicker: { color: colors.teal, fontSize: 12, lineHeight: 16, fontFamily: font.w700, letterSpacing: 1.5 },
  titulli: { color: colors.ink, fontSize: 20, lineHeight: 26, fontFamily: font.w800 },
  nen: { color: colors.textSecondary, fontSize: 15, lineHeight: 21, fontFamily: font.w500 },
  hapat: { marginVertical: 4 },
  kartaFund: {
    marginTop: 4,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#E3EAF0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  kartaFundTeksti: { color: colors.petrol, fontSize: 16, fontFamily: font.w800 },
  shigjeta: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },

  veprimet: { flexDirection: "row", gap: 12 },
  veprimi: { flex: 1, backgroundColor: colors.white, borderRadius: 22, overflow: "hidden", ...hija.karta },
  veprimiFoto: { height: 96 },
  veprimiIkona: {
    position: "absolute",
    left: 12,
    bottom: -16,
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: colors.white,
  },
  veprimiTrupi: { paddingHorizontal: 12, paddingTop: 24, paddingBottom: 12, gap: 8, flex: 1 },
  veprimiTitulli: { color: colors.ink, fontSize: 16, lineHeight: 21, fontFamily: font.w800 },
  veprimiPikat: { flexDirection: "row", flexWrap: "wrap", gap: 4, flex: 1 },
  veprimiPika: {
    color: colors.textSecondary,
    fontSize: 11,
    fontFamily: font.w700,
    backgroundColor: colors.background,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: "hidden",
  },
  veprimiButoni: {
    marginTop: 4,
    height: 40,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  veprimiButoniTeksti: { color: colors.white, fontSize: 14, fontFamily: font.w800 },

  siKarta: { backgroundColor: colors.ikonaBg, borderRadius: 22, padding: 16, gap: 14 },
  siRreshti: { flexDirection: "row" },
  siHapi: { flex: 1, alignItems: "center", gap: 4 },
  siIkonaRreshti: { flexDirection: "row", alignItems: "center", width: "100%", marginBottom: 4 },
  siVija: { flex: 1, height: 2, backgroundColor: "#9FCFC4" },
  siIkona: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.teal,
    alignItems: "center",
    justifyContent: "center",
  },
  siNumri: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.amber,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.ikonaBg,
  },
  siNumriTeksti: { color: colors.ink, fontSize: 11, fontFamily: font.w800 },
  siTitulli: { color: colors.ink, fontSize: 15, lineHeight: 20, fontFamily: font.w800, textAlign: "center" },
  siTeksti: { color: colors.textSecondary, fontSize: 13, lineHeight: 17, fontFamily: font.w500, textAlign: "center" },

  rrjedha: { marginHorizontal: -20 },
  rrjedhaBrenda: { paddingHorizontal: 20, paddingBottom: 12, gap: 12 },
  prona: { width: 170, backgroundColor: colors.white, borderRadius: 20, padding: 8, gap: 8, ...hija.karta },
  pronaFoto: { height: 110, borderRadius: 14, overflow: "hidden" },
  pronaVendi: {
    position: "absolute",
    left: 8,
    bottom: 8,
    maxWidth: 140,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(23,63,78,0.82)",
  },
  pronaVendiTeksti: { color: colors.white, fontSize: 12, fontFamily: font.w700, flexShrink: 1 },
  pronaEmri: { color: colors.ink, fontSize: 16, lineHeight: 21, fontFamily: font.w800, paddingHorizontal: 4, minHeight: 42 },
  pronaFund: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 4, paddingBottom: 4 },
  pronaCta: { color: colors.petrol, fontSize: 14, fontFamily: font.w800 },
  shtoProne: {
    width: 150,
    borderRadius: 20,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#9FB6C0",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    gap: 6,
  },
  shtoRrethi: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.ikonaBg,
    alignItems: "center",
    justifyContent: "center",
  },
  shtoTeksti: { color: colors.petrol, fontSize: 16, fontFamily: font.w800 },
  shtoNen: { color: colors.textSecondary, fontSize: 13, textAlign: "center", fontFamily: font.w400 },

  besimi: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#CFE5DF",
    backgroundColor: colors.white,
  },
  besimiIkona: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.okBg,
    alignItems: "center",
    justifyContent: "center",
  },
  besimiTitulli: { color: colors.ink, fontSize: 15, lineHeight: 20, fontFamily: font.w800 },
  besimiTeksti: { flex: 1, color: colors.textSecondary, fontSize: 14, lineHeight: 20, fontFamily: font.w500 },
});
