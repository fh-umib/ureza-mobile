import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { EkraniMeHero, useRevealOnFocus } from "@/components/EkraniMeHero";
import { Kalendari } from "@/components/Kalendari";
import { Kutia } from "@/components/Kutia";
import { PronaIlustrim } from "@/components/PronaIlustrim";
import { UrezaIcon } from "@/components/UrezaIcon";
import { SkeletiIListes } from "@/components/ui/Skeleti";
import { colors, font } from "@/constants/ureza";
import { useDhenat } from "@/lib/dhenat";
import { CMIMI_TEKST } from "@/lib/kushtet";
import {
  LLOJET_E_VIZITES,
  dataEPlote,
  dataNeTekst,
  dataShkurt,
  titulliIVizites,
  type LlojiVizites,
} from "@/lib/vizitat";

// "Kërko një vizitë" (design: KrijoKerkese): choose the property, the kind of visit,
// the day and what the Miku should look at, then send the request.
export default function KerkoVizite() {
  const router = useRouter();

  return (
    <EkraniMeHero
      kicker="KËRKESË E RE"
      title="Kërko një vizitë"
      subtitle="Zgjidh pronën dhe çka duhet parë."
      kthehu={{ etiketa: "Mbrapa", onPress: () => router.back() }}
    >
      <Forma />
    </EkraniMeHero>
  );
}

type Derguar = { prona: string; lloji: LlojiVizites; data: string };

function Forma() {
  const router = useRouter();
  const revealSoon = useRevealOnFocus();
  const { pronat, burimiPronat, vizitat, kerkoVizite, rifresko } = useDhenat();
  // Ballina can open this form with the kind of visit (and the property) already chosen.
  const params = useLocalSearchParams<{ lloji?: string; pronaId?: string }>();

  const [pronaId, setPronaId] = useState<string | null>(params.pronaId ?? null);
  const [lloji, setLloji] = useState<LlojiVizites>(params.lloji === "kujdes" ? "kujdes" : "inspektim");
  const [data, setData] = useState(() => {
    const sot = new Date();
    return dataNeTekst(new Date(sot.getFullYear(), sot.getMonth(), sot.getDate() + 1)); // tomorrow
  });
  const [udhezime, setUdhezime] = useState("");
  // written consent (supabase/besimi.sql refuses a request without it); the consent text depends
  // on the kind of visit, so it is asked again when the kind changes
  const [pelqimi, setPelqimi] = useState(false);
  const [kushtet, setKushtet] = useState(false);
  const zgjidhLlojin = (l: LlojiVizites) => {
    if (l !== lloji) setPelqimi(false);
    setLloji(l);
  };
  const [fokus, setFokus] = useState(false);
  const [duke, setDuke] = useState(false);
  const [gabim, setGabim] = useState<string | null>(null);
  const [derguar, setDerguar] = useState<Derguar | null>(null);

  // the first property is chosen until the user picks another one
  const zgjedhurId = pronat.find((p) => p.id === pronaId)?.id ?? pronat[0]?.id ?? null;

  // days that already have a visit (shown in red in the calendar)
  const meVizita: Record<string, number> = {};
  for (const v of vizitat) meVizita[v.data] = (meVizita[v.data] ?? 0) + 1;
  const vizitatEDites = vizitat.filter((v) => v.data === data);

  async function dergo() {
    if (duke || !zgjedhurId) return;
    const tekst = udhezime.trim();
    if (tekst.length < 10) {
      setGabim("Shkruaj çka duhet parë (të paktën 10 shkronja), që Miku ta dijë çka të bëjë.");
      return;
    }
    if (!pelqimi || !kushtet) {
      setGabim("Konfirmo pëlqimin dhe kushtet (dy kutitë më lart), pastaj dërgoje kërkesën.");
      return;
    }
    setDuke(true);
    setGabim(null);
    const mesazh = await kerkoVizite({ pronaId: zgjedhurId, lloji, data, udhezime: tekst, pelqimiAt: new Date().toISOString() });
    setDuke(false);
    if (mesazh) {
      setGabim(mesazh);
      return;
    }
    setDerguar({ prona: pronat.find((p) => p.id === zgjedhurId)?.emri ?? "Prona", lloji, data });
  }

  if (derguar) {
    return (
      <View style={styles.sukses}>
        <View style={styles.suksesIkona}>
          <UrezaIcon name="check" size={30} color={colors.white} strokeWidth={2.6} />
        </View>
        <Text style={styles.suksesTitulli}>Kërkesa u dërgua</Text>
        <Text style={styles.suksesTeksti}>
          {titulliIVizites(derguar.lloji)} · {derguar.prona}
          {"\n"}
          {dataEPlote(derguar.data)}
        </Text>
        <Text style={styles.suksesTeksti}>Statusi: Kërkuar. Kur një Miku ta pranojë, do ta shohësh këtu.</Text>
        <Pressable style={styles.primary} onPress={() => router.dismissTo("/oda")} accessibilityRole="button">
          <Text style={styles.primaryText}>Shiko në Odë</Text>
        </Pressable>
        <Pressable style={styles.dytesor} onPress={() => router.back()} accessibilityRole="button">
          <Text style={styles.dytesorText}>Mbyll</Text>
        </Pressable>
      </View>
    );
  }

  if (burimiPronat === "duke_ngarkuar") return <SkeletiIListes rreshta={2} />;

  if (burimiPronat === "pa_lidhje") {
    return (
      <View style={styles.bosh}>
        <Text style={styles.boshTitle}>Nuk u lidh me serverin</Text>
        <Text style={styles.boshText}>Kontrollo internetin, pastaj provo përsëri.</Text>
        <Pressable style={styles.dytesor} onPress={() => void rifresko()} accessibilityRole="button">
          <Text style={styles.dytesorText}>Provo përsëri</Text>
        </Pressable>
      </View>
    );
  }

  if (pronat.length === 0) {
    return (
      <View style={styles.bosh}>
        <Text style={styles.boshTitle}>Së pari shto një pronë</Text>
        <Text style={styles.boshText}>Vizita kërkohet për një pronë: shtëpinë, prindërit ose tokën.</Text>
        <Pressable style={styles.primary} onPress={() => router.dismissTo("/pronat")} accessibilityRole="button">
          <Text style={styles.primaryText}>Shko te Pronat</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <>
      <View style={styles.seksion}>
        <Text style={styles.kicker}>1 · PRONA</Text>
        {pronat.map((p) => {
          const zgjedhur = p.id === zgjedhurId;
          return (
            <Pressable
              key={p.id}
              onPress={() => setPronaId(p.id)}
              style={[styles.opsion, zgjedhur && styles.opsionZgjedhur]}
              accessibilityRole="radio"
              accessibilityState={{ selected: zgjedhur }}
              accessibilityLabel={`${p.emri}, ${p.vendi}`}
            >
              <View style={styles.foto}>
                <PronaIlustrim lloji={p.lloji} />
              </View>
              <View style={styles.opsionTekst}>
                <Text style={styles.opsionTitulli} numberOfLines={2}>
                  {p.emri}
                </Text>
                <Text style={styles.opsionNen}>{p.vendi}</Text>
              </View>
              <Radio zgjedhur={zgjedhur} />
            </Pressable>
          );
        })}
      </View>

      <View style={styles.seksion}>
        <Text style={styles.kicker}>2 · LLOJI I VIZITËS</Text>
        {LLOJET_E_VIZITES.map((l) => {
          const zgjedhur = l.vlera === lloji;
          return (
            <Pressable
              key={l.vlera}
              onPress={() => zgjidhLlojin(l.vlera)}
              style={[styles.opsion, zgjedhur && styles.opsionZgjedhur]}
              accessibilityRole="radio"
              accessibilityState={{ selected: zgjedhur }}
              accessibilityLabel={`${l.titulli}, ${l.nentitulli}`}
            >
              <View style={styles.ikonaPlote}>
                <UrezaIcon name={l.icon} size={26} color={colors.petrol} />
              </View>
              <View style={styles.opsionTekst}>
                <Text style={styles.opsionTitulli}>{l.titulli}</Text>
                <Text style={styles.opsionNen}>{l.nentitulli}</Text>
              </View>
              <Radio zgjedhur={zgjedhur} />
            </Pressable>
          );
        })}
      </View>

      <View style={styles.seksion}>
        <Text style={styles.kicker}>3 · DATA DHE UDHËZIMET</Text>

        <Text style={styles.label}>Data e vizitës</Text>
        <Kalendari zgjedhur={data} onZgjidh={setData} meVizita={meVizita} />
        <Text style={styles.dataTeksti}>{dataEPlote(data)}</Text>
        {vizitatEDites.length > 0 ? (
          <View style={styles.paralajmerim}>
            <UrezaIcon name="warning" size={20} color={colors.vizita} />
            <Text style={styles.paralajmerimText}>
              Ke tashmë {vizitatEDites.length === 1 ? "një vizitë" : `${vizitatEDites.length} vizita`} më {dataShkurt(data)}:{" "}
              {vizitatEDites
                .map((v) => `${titulliIVizites(v.lloji)} (${pronat.find((p) => p.id === v.pronaId)?.emri ?? "Prona"})`)
                .join(", ")}
              . Mund të kërkosh edhe një.
            </Text>
          </View>
        ) : null}

        <Text style={styles.label}>Udhëzime për Mikun</Text>
        <TextInput
          style={[styles.input, fokus && styles.inputFokus]}
          value={udhezime}
          onChangeText={setUdhezime}
          onFocus={() => {
            setFokus(true);
            revealSoon();
          }}
          onBlur={() => setFokus(false)}
          placeholder="p.sh. Shiko çatinë nga jashtë dhe kontrollo a ka pllaka të lëvizura ose shenja uji. Bëj foto nga çdo anë."
          placeholderTextColor="#8FA3AC"
          multiline
          maxLength={500}
          textAlignVertical="top"
          accessibilityLabel="Udhëzime për Mikun"
        />
      </View>

      <View style={styles.seksion}>
        <Text style={styles.kicker}>4 · ÇMIMI DHE PËLQIMI</Text>
        <View style={styles.cmimi}>
          <View style={styles.cmimiTekst}>
            <Text style={styles.cmimiVlera}>{CMIMI_TEKST}</Text>
            <Text style={styles.cmimiNen}>Paguhet vetëm për vizitën e kryer. Anulimi falas derisa ta pranojë një Miku.</Text>
          </View>
          <Pressable
            onPress={() => router.push("/kushtet")}
            style={styles.kushtetLidhje}
            accessibilityRole="link"
            accessibilityLabel="Lexo kushtet e vizitës"
          >
            <Text style={styles.kushtetLidhjeTeksti}>Kushtet</Text>
            <UrezaIcon name="arrow" size={16} color={colors.petrol} strokeWidth={2.6} />
          </Pressable>
        </View>

        <Kutia
          zgjedhur={pelqimi}
          onPress={() => setPelqimi((x) => !x)}
          teksti={
            lloji === "kujdes"
              ? "Prindi pajtohet me vizitën dhe me fotot. E di që vizita është jo mjekësore."
              : "Kam të drejtë ta lejoj hyrjen në këtë pronë dhe fotografimin e saj."
          }
        />
        <Kutia
          zgjedhur={kushtet}
          onPress={() => setKushtet((x) => !x)}
          teksti={`I kam lexuar kushtet dhe pajtohem me çmimin prej ${CMIMI_TEKST} dhe me kontratën me Mikun.`}
        />
      </View>

      {gabim ? <Text style={styles.gabim}>{gabim}</Text> : null}

      <Pressable
        style={[styles.primary, (duke || !pelqimi || !kushtet) && styles.disabled]}
        onPress={dergo}
        disabled={duke}
        accessibilityRole="button"
      >
        {duke ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <>
            <Text style={styles.primaryText}>Dërgo kërkesën</Text>
            <UrezaIcon name="arrow" size={22} color={colors.white} strokeWidth={2.3} />
          </>
        )}
      </Pressable>
    </>
  );
}

function Radio({ zgjedhur }: { zgjedhur: boolean }) {
  return (
    <View style={[styles.radio, zgjedhur && styles.radioZgjedhur]}>
      {zgjedhur ? <UrezaIcon name="check" size={16} color={colors.white} strokeWidth={3} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  seksion: { gap: 10 },
  kicker: { color: colors.teal, fontSize: 12, lineHeight: 16, fontFamily: font.w700, letterSpacing: 1.5 },
  opsion: {
    minHeight: 84,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 10,
    paddingLeft: 10,
    paddingRight: 14,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: "#E3EAF0",
    borderRadius: 18,
  },
  opsionZgjedhur: { borderColor: colors.petrol },
  foto: { width: 64, height: 64, borderRadius: 14, overflow: "hidden" },
  ikonaPlote: { width: 56, height: 56, borderRadius: 17, backgroundColor: "#E8F5F3", alignItems: "center", justifyContent: "center" },
  opsionTekst: { flex: 1, gap: 2 },
  opsionTitulli: { color: colors.ink, fontSize: 17, lineHeight: 22, fontFamily: font.w800 },
  opsionNen: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, fontFamily: font.w500 },
  radio: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: colors.inputBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  radioZgjedhur: { backgroundColor: colors.petrol, borderColor: colors.petrol },
  cmimi: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: "#E8F5F3",
  },
  cmimiTekst: { flex: 1, gap: 2 },
  cmimiVlera: { color: colors.ink, fontSize: 26, lineHeight: 32, fontFamily: font.w800 },
  cmimiNen: { color: colors.textSecondary, fontSize: 13, lineHeight: 18, fontFamily: font.w500 },
  kushtetLidhje: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 22,
    backgroundColor: colors.white,
  },
  kushtetLidhjeTeksti: { color: colors.petrol, fontSize: 15, fontFamily: font.w800 },
  label: { color: colors.ink, fontSize: 15, lineHeight: 20, fontFamily: font.w700, marginTop: 4 },
  paralajmerim: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#FDECEA",
  },
  paralajmerimText: { flex: 1, color: "#7A1F1B", fontSize: 14, lineHeight: 20, fontFamily: font.w600 },
  dataTeksti: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, fontFamily: font.w600 },
  input: {
    minHeight: 104,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.inputBorder,
    borderRadius: 14,
    fontSize: 16,
    lineHeight: 23,
    fontFamily: font.w500,
    color: colors.ink,
  },
  inputFokus: { borderColor: colors.petrol },
  gabim: { color: colors.error, fontSize: 14, lineHeight: 20, fontFamily: font.w600 },
  primary: {
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.petrol,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryText: { color: colors.white, fontSize: 17, fontFamily: font.w700 },
  disabled: { opacity: 0.6 },
  dytesor: { minHeight: 48, alignItems: "center", justifyContent: "center" },
  dytesorText: { color: colors.petrol, fontSize: 16, fontFamily: font.w700 },
  bosh: { backgroundColor: colors.white, borderRadius: 20, padding: 20, gap: 8, borderWidth: 1, borderColor: "#E3EAF0" },
  boshTitle: { color: colors.ink, fontSize: 17, lineHeight: 22, fontFamily: font.w800 },
  boshText: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, fontFamily: font.w500 },
  sukses: { backgroundColor: colors.white, borderRadius: 20, padding: 24, gap: 12, borderWidth: 1, borderColor: "#E3EAF0" },
  suksesIkona: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.teal, alignItems: "center", justifyContent: "center" },
  suksesTitulli: { color: colors.ink, fontSize: 22, lineHeight: 28, fontFamily: font.w800 },
  suksesTeksti: { color: colors.textSecondary, fontSize: 15, lineHeight: 22, fontFamily: font.w500 },
});
