import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import Svg, { Circle, Path } from "react-native-svg";

import { EkraniMeHero } from "@/components/EkraniMeHero";
import { HapatEVizites } from "@/components/HapatEVizites";
import { PronaIlustrim } from "@/components/PronaIlustrim";
import { StatusiChip } from "@/components/StatusiChip";
import { UrezaIcon, type IconName } from "@/components/UrezaIcon";
import { SkeletiIKartes } from "@/components/ui/Skeleti";
import { colors, hija } from "@/constants/ureza";
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
          <Shifra icon="houses" vlera={pronat.length} etiketa="Prona" onPress={() => router.navigate("/pronat")} />
          <Shifra icon="clock" vlera={aktive} etiketa="Në proces" onPress={() => router.navigate("/oda")} />
          <Shifra icon="doc" vlera={raporte} etiketa="Raporte" onPress={() => router.navigate("/oda")} />
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
              <UrezaIcon name="sparkle" size={22} color={colors.kujdes} strokeWidth={2.2} />
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
            style={({ pressed }) => [styles.karta, pressed && styles.shtypur]}
            onPress={() => hapViziten(eFundit.id)}
            accessibilityRole="button"
            accessibilityLabel={`${titulliIVizites(eFundit.lloji)}, ${pronaEFundit?.emri ?? "Prona"}. Hap detajet e vizitës.`}
          >
            <View style={styles.kartaKrye}>
              <View style={styles.miniatura}>
                <PronaIlustrim lloji={eFundit.lloji === "inspektim" ? (pronaEFundit?.lloji ?? "shtepi") : "prindert"} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.kicker}>VIZITA E FUNDIT</Text>
                <Text style={styles.titulli} numberOfLines={1}>
                  {titulliIVizites(eFundit.lloji)}
                </Text>
                <Text style={styles.nen} numberOfLines={1}>
                  {pronaEFundit?.emri ?? "Prona"} · {dataShkurt(eFundit.data)}
                </Text>
              </View>
            </View>
            <StatusiChip statusi={eFundit.statusi} />
            <View style={styles.hapat}>
              <HapatEVizites statusi={eFundit.statusi} />
            </View>
            <Text style={styles.nen}>{caNdodh(eFundit)}</Text>
            <View style={styles.kartaFund}>
              <Text style={styles.kartaFundTeksti}>Shiko detajet e vizitës</Text>
              <ShigjetaRrethi />
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
        <Text style={styles.seksioni}>Çka të kontrollojmë?</Text>
        <View style={styles.veprimet}>
          <KartaEVeprimit
            icon="home"
            titulli="Inspektim prone"
            teksti="Çati, ujë, rrymë, siguri"
            sfondi={colors.petrol}
            theksi={colors.mint}
            onPress={() => kerko("inspektim")}
          />
          <KartaEVeprimit
            icon="heart"
            titulli="Vizitë te prindërit"
            teksti="Jo mjekësore, me pëlqim"
            sfondi={colors.teal}
            theksi={colors.amber}
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
        <View style={styles.krye}>
          <Text style={styles.seksioni}>Pronat e mia</Text>
          <Pressable onPress={() => router.navigate("/pronat")} style={styles.link} accessibilityRole="button">
            <Text style={styles.linkText}>Të gjitha</Text>
            <UrezaIcon name="chevron" size={18} color={colors.petrol} strokeWidth={2.6} />
          </Pressable>
        </View>
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
          <UrezaIcon name="shield" size={22} color={colors.teal} strokeWidth={2.2} />
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

function Shifra({ icon, vlera, etiketa, onPress }: { icon: IconName; vlera: number; etiketa: string; onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.shifra, pressed && styles.shtypur]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${etiketa}: ${vlera}`}
    >
      <View style={styles.shifraIkona}>
        <UrezaIcon name={icon} size={18} color={colors.petrol} strokeWidth={2.2} />
      </View>
      <Text style={styles.shifraVlera}>{vlera}</Text>
      <Text style={styles.shifraEtiketa}>{etiketa}</Text>
    </Pressable>
  );
}

// A big coloured card that starts a new request of one kind.
function KartaEVeprimit({
  icon,
  titulli,
  teksti,
  sfondi,
  theksi,
  onPress,
}: {
  icon: IconName;
  titulli: string;
  teksti: string;
  sfondi: string;
  theksi: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.veprimi, { backgroundColor: sfondi }, pressed && styles.shtypur]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${titulli}. Kërko një vizitë.`}
    >
      {/* soft rings in the corner, like the sun of the hero */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg width="100%" height="100%" viewBox="0 0 160 190" preserveAspectRatio="xMaxYMin slice">
          <Circle cx="150" cy="12" r="62" fill={theksi} fillOpacity={0.12} />
          <Circle cx="150" cy="12" r="38" fill={theksi} fillOpacity={0.16} />
          <Path d="M0 170 Q40 150 80 165 T160 158 V190 H0Z" fill="#FFFFFF" fillOpacity={0.07} />
        </Svg>
      </View>
      <View style={[styles.veprimiIkona, { backgroundColor: theksi }]}>
        <UrezaIcon name={icon} size={24} color={sfondi} strokeWidth={2.3} />
      </View>
      <View style={styles.veprimiTekst}>
        <Text style={styles.veprimiTitulli}>{titulli}</Text>
        <Text style={styles.veprimiNen}>{teksti}</Text>
      </View>
      <View style={styles.veprimiFund}>
        <Text style={styles.veprimiCta}>Kërko</Text>
        <View style={styles.veprimiShigjeta}>
          <UrezaIcon name="arrow" size={18} color={sfondi} strokeWidth={2.6} />
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
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.ikonaBg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  shifraVlera: { color: colors.ink, fontSize: 24, lineHeight: 28, fontWeight: "800" },
  shifraEtiketa: { color: colors.textSecondary, fontSize: 13, lineHeight: 17, fontWeight: "600" },

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
  njoftimTitulli: { color: "#6B3F0A", fontSize: 16, lineHeight: 21, fontWeight: "800" },
  njoftimTeksti: { color: colors.kujdes, fontSize: 14, lineHeight: 19, fontWeight: "500" },

  karta: { backgroundColor: colors.white, borderRadius: 22, padding: 18, gap: 10, ...hija.karta },
  kartaKrye: { flexDirection: "row", alignItems: "center", gap: 14 },
  miniatura: { width: 64, height: 64, borderRadius: 16, overflow: "hidden" },
  kicker: { color: colors.teal, fontSize: 12, lineHeight: 16, fontWeight: "700", letterSpacing: 1.5 },
  titulli: { color: colors.ink, fontSize: 20, lineHeight: 26, fontWeight: "800" },
  nen: { color: colors.textSecondary, fontSize: 15, lineHeight: 21, fontWeight: "500" },
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
  kartaFundTeksti: { color: colors.petrol, fontSize: 16, fontWeight: "800" },
  shigjeta: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },

  seksioni: { color: colors.ink, fontSize: 20, lineHeight: 26, fontWeight: "800", marginBottom: 12 },
  veprimet: { flexDirection: "row", gap: 12 },
  veprimi: { flex: 1, minHeight: 190, borderRadius: 22, padding: 16, overflow: "hidden", gap: 12 },
  veprimiIkona: { width: 46, height: 46, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  veprimiTekst: { flex: 1, gap: 4 },
  veprimiTitulli: { color: colors.white, fontSize: 18, lineHeight: 23, fontWeight: "800" },
  veprimiNen: { color: colors.onHeroText, fontSize: 14, lineHeight: 19, fontWeight: "500" },
  veprimiFund: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  veprimiCta: { color: colors.white, fontSize: 16, fontWeight: "800" },
  veprimiShigjeta: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },

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
  siNumriTeksti: { color: colors.ink, fontSize: 11, fontWeight: "800" },
  siTitulli: { color: colors.ink, fontSize: 15, lineHeight: 20, fontWeight: "800", textAlign: "center" },
  siTeksti: { color: colors.textSecondary, fontSize: 13, lineHeight: 17, fontWeight: "500", textAlign: "center" },

  krye: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  link: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 12 },
  linkText: { color: colors.petrol, fontSize: 16, fontWeight: "800" },
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
  pronaVendiTeksti: { color: colors.white, fontSize: 12, fontWeight: "700", flexShrink: 1 },
  pronaEmri: { color: colors.ink, fontSize: 16, lineHeight: 21, fontWeight: "800", paddingHorizontal: 4, minHeight: 42 },
  pronaFund: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 4, paddingBottom: 4 },
  pronaCta: { color: colors.petrol, fontSize: 14, fontWeight: "800" },
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
  shtoTeksti: { color: colors.petrol, fontSize: 16, fontWeight: "800" },
  shtoNen: { color: colors.textSecondary, fontSize: 13, textAlign: "center" },

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
  besimiTitulli: { color: colors.ink, fontSize: 15, lineHeight: 20, fontWeight: "800" },
  besimiTeksti: { flex: 1, color: colors.textSecondary, fontSize: 14, lineHeight: 20, fontWeight: "500" },
});
