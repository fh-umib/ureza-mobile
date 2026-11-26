import { useRouter } from "expo-router";
import { useState, type ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { EkraniMeHero } from "@/components/EkraniMeHero";
import { FletaModale } from "@/components/FletaModale";
import { Ikona, type EmriIIkones } from "@/components/Ikona";
import { ditePara, PronaKarta, ShifratEPronave } from "@/components/PronaKarta";
import { Seksioni } from "@/components/Seksioni";
import { VendndodhjaFusha } from "@/components/VendndodhjaFusha";
import { Ditari } from "@/components/Ditari";
import { useToast } from "@/components/ui/Toast";
import { GjendjaBosh } from "@/components/ui/GjendjaBosh";
import { SkeletiIKartes } from "@/components/ui/Skeleti";
import { colors, font } from "@/constants/ureza";
import { useDhenat, type RezultatiShtimit } from "@/lib/dhenat";
import { gjejQytetin, type Koordinata } from "@/lib/gjeo";
import type { Lloji, Prona } from "@/lib/pronat";

const LLOJET: { vlera: Lloji; emri: string; ikona: EmriIIkones }[] = [
  { vlera: "shtepi", emri: "Shtëpi", ikona: "shtepi" },
  { vlera: "prindert", emri: "Prindërit", ikona: "prindert" },
  { vlera: "toke", emri: "Tokë", ikona: "toke" },
];

const DITE_PA_KONTROLL = 45;

function Hyrje({ i, children }: { i: number; children: ReactNode }) {
  return <Animated.View entering={FadeInDown.delay(80 * Math.min(i, 8)).duration(420)}>{children}</Animated.View>;
}

export default function Pronat() {
  const router = useRouter();
  const { pronat, vizitat, burimiPronat: burimi, shtoPronen: shto, rifresko } = useDhenat();
  const [hapur, setHapur] = useState(false);

  const meGps = pronat.filter((p) => p.koordinatat).length;
  const kerkojneKontroll = pronat.filter((p) => {
    const d = ditePara(p.id, vizitat);
    return d === null || d > DITE_PA_KONTROLL;
  }).length;

  const kerko = (p: Prona) =>
    router.push({ pathname: "/kerko-vizite", params: { pronaId: p.id, lloji: p.lloji === "prindert" ? "kujdes" : "inspektim" } });

  return (
    <EkraniMeHero kicker="PRONAT E FAMILJES" title="Pronat e mia" subtitle="Çdo pronë me ditarin e saj.">
      {burimi === "demo" ? (
        <Text style={styles.demoNote}>
          Demonstrim: tabela `pronat` nuk është gati ende te Supabase, prandaj pronat nuk ruhen. Ekzekuto
          supabase/pronat.sql.
        </Text>
      ) : null}
      {burimi === "demo" ? (
        <Pressable style={styles.riprovo} onPress={() => void rifresko()} accessibilityRole="button">
          <Text style={styles.riprovoText}>Kontrollo përsëri</Text>
        </Pressable>
      ) : null}

      {burimi === "duke_ngarkuar" ? (
        <>
          <SkeletiIKartes />
          <SkeletiIKartes />
        </>
      ) : null}

      {burimi === "pa_lidhje" ? (
        <GjendjaBosh
          toni="gabim"
          titulli="Nuk u lidh me serverin"
          teksti="Kontrollo internetin, pastaj provo përsëri."
          veprimi={{ etiketa: "Provo përsëri", onPress: () => void rifresko() }}
        />
      ) : null}

      {pronat.length > 0 ? (
        <Hyrje i={0}>
          <ShifratEPronave gjithsej={pronat.length} meGps={meGps} kerkojneKontroll={kerkojneKontroll} />
        </Hyrje>
      ) : null}

      <Seksioni ikona="pronat" titulli="Pronat e tua" numri={pronat.length > 0 ? pronat.length : undefined} />

      {burimi === "supabase" && pronat.length === 0 ? (
        <View style={styles.bosh}>
          <Text style={styles.boshTitle}>Ende nuk ke asnjë pronë</Text>
          <Text style={styles.boshText}>Shto të parën, p.sh. shtëpinë ose prindërit.</Text>
        </View>
      ) : null}

      {pronat.map((prona, i) => (
        <Hyrje key={prona.id} i={i + 1}>
          <PronaKarta
            prona={prona}
            vizita={vizitat.filter((v) => v.pronaId === prona.id).length}
            ditePara={ditePara(prona.id, vizitat)}
            aktive={
              vizitat.find(
                (v) => v.pronaId === prona.id && v.statusi !== "miratuar" && v.statusi !== "kundershtuar",
              ) ?? null
            }
            onKerko={() => kerko(prona)}
            onHistoria={() => router.navigate("/oda")}
          />
        </Hyrje>
      ))}

      <Hyrje i={pronat.length + 1}>
        <Pressable
          style={({ pressed }) => [styles.shtoKarta, pressed && styles.shtypur]}
          onPress={() => setHapur(true)}
          accessibilityRole="button"
          accessibilityLabel="Shto pronë"
        >
          <View style={styles.shtoRrethi}>
            <Ikona emri="shto" madhesia={24} ngjyra={colors.white} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.shtoText}>Shto një pronë</Text>
            <Text style={styles.shtoNen}>Shtëpi, tokë, ose shtëpia e prindërve</Text>
          </View>
          <Ikona emri="shigjeta" madhesia={18} ngjyra={colors.petrol} />
        </Pressable>
      </Hyrje>

      <Pressable
        style={({ pressed }) => [styles.detyrat, pressed && styles.shtypur]}
        onPress={() => router.push("/detyrat")}
        accessibilityRole="button"
        accessibilityLabel="Detyrat: punët që duhen bërë për pronat e tua"
      >
        <View style={styles.detyratIkona}>
          <Ikona emri="detyrat" madhesia={20} ngjyra={colors.teal} />
        </View>
        <View style={styles.detyratTekst}>
          <Text style={styles.detyratTitulli}>Detyrat</Text>
          <Text style={styles.detyratNen}>Punët që duhen bërë për pronat e tua</Text>
        </View>
        <Ikona emri="shigjeta" madhesia={18} ngjyra={colors.petrol} />
      </Pressable>

      <Seksioni
        ikona="ditari"
        titulli="Ditari i kujdesit"
        lidhja={{ etiketa: "Te Oda", onPress: () => router.navigate("/oda") }}
      />
      <Ditari />

      <ShtoPronen hapur={hapur} mbyll={() => setHapur(false)} shto={shto} />
    </EkraniMeHero>
  );
}

function ShtoPronen({
  hapur,
  mbyll,
  shto,
}: {
  hapur: boolean;
  mbyll: () => void;
  shto: (emri: string, vendi: string, lloji: Lloji, koordinatat: Koordinata | null) => Promise<RezultatiShtimit>;
}) {
  const toast = useToast();
  const [emri, setEmri] = useState("");
  const [vendi, setVendi] = useState("");
  const [lloji, setLloji] = useState<Lloji>("shtepi");
  const [k, setK] = useState<Koordinata | null>(null);
  const [tekstiIVendit, setTekstiIVendit] = useState("");
  const [fokus, setFokus] = useState<"emri" | "vendi" | null>(null);
  const [duke, setDuke] = useState(false);
  const [gabim, setGabim] = useState<string | null>(null);

  function mbylle() {
    setGabim(null);
    mbyll();
  }

  async function ruaj() {
    if (duke) return;
    if (emri.trim().length < 2 || vendi.trim().length < 2) {
      setGabim("Shkruaj emrin dhe vendndodhjen (të paktën 2 shkronja).");
      return;
    }
    if (tekstiIVendit.trim().length > 0 && !k) {
      setGabim("Koordinatat nuk lexohen. Korrigjoji, ose fshiji fushën e vendndodhjes së saktë.");
      return;
    }
    setDuke(true);
    setGabim(null);
    const r = await shto(emri.trim(), vendi.trim(), lloji, k);
    setDuke(false);
    if (!r.ruajtur) {
      setGabim(r.gabim);
      return;
    }
    setEmri("");
    setVendi("");
    setLloji("shtepi");
    setK(null);
    setTekstiIVendit("");
    mbyll();
    // saved, but the exact position was not (e.g. supabase/harta.sql has not been run)
    if (r.gabim) toast.info(`Prona u ruajt, por vendndodhja e saktë jo. ${r.gabim}`);
    else toast.sukses("Prona u shtua.");
  }

  return (
    <FletaModale hapur={hapur} mbyll={mbylle} titulli="Shto pronë">
      <View style={styles.fusha}>
        <Text style={styles.label}>Emri</Text>
        <TextInput
          style={[styles.input, fokus === "emri" && styles.inputFokus]}
          value={emri}
          onChangeText={setEmri}
          onFocus={() => setFokus("emri")}
          onBlur={() => setFokus(null)}
          placeholder="p.sh. Shtëpia në Ferizaj"
          placeholderTextColor="#8FA3AC"
          maxLength={80}
          returnKeyType="next"
          accessibilityLabel="Emri i pronës"
        />
      </View>

      <View style={styles.fusha}>
        <Text style={styles.label}>Vendndodhja</Text>
        <TextInput
          style={[styles.input, fokus === "vendi" && styles.inputFokus]}
          value={vendi}
          onChangeText={setVendi}
          onFocus={() => setFokus("vendi")}
          onBlur={() => setFokus(null)}
          placeholder="p.sh. Ferizaj"
          placeholderTextColor="#8FA3AC"
          maxLength={80}
          returnKeyType="done"
          accessibilityLabel="Vendndodhja"
        />
      </View>

      <View style={styles.fusha}>
        <Text style={styles.label}>Lloji</Text>
        <View style={styles.chips}>
          {LLOJET.map((l) => {
            const zgjedhur = l.vlera === lloji;
            return (
              <Pressable
                key={l.vlera}
                onPress={() => setLloji(l.vlera)}
                style={[styles.chip, zgjedhur && styles.chipZgjedhur]}
                accessibilityRole="button"
                accessibilityState={{ selected: zgjedhur }}
              >
                <Ikona emri={l.ikona} madhesia={16} ngjyra={zgjedhur ? colors.white : colors.petrol} />
                <Text style={[styles.chipText, zgjedhur && styles.chipTextZgjedhur]}>{l.emri}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <VendndodhjaFusha
        fillimi={k}
        afer={gjejQytetin(vendi)?.k ?? null}
        onNdrysho={(vlera, tekst) => {
          setK(vlera);
          setTekstiIVendit(tekst);
        }}
      />

      {gabim ? <Text style={styles.gabim}>{gabim}</Text> : null}

      <Pressable style={[styles.ruaj, duke && styles.disabled]} onPress={ruaj} disabled={duke} accessibilityRole="button">
        {duke ? <ActivityIndicator color={colors.white} /> : <Text style={styles.ruajText}>Ruaj pronën</Text>}
      </Pressable>
      <Pressable style={styles.anulo} onPress={mbylle} accessibilityRole="button">
        <Text style={styles.anuloText}>Anulo</Text>
      </Pressable>
    </FletaModale>
  );
}

const styles = StyleSheet.create({
  demoNote: { color: "#7A4A06", backgroundColor: "#FCEFD2", borderRadius: 14, padding: 12, fontSize: 13, lineHeight: 18, fontFamily: font.w600 },
  bosh: { backgroundColor: colors.white, borderRadius: 20, padding: 20, gap: 4, borderWidth: 1, borderColor: "#E3EAF0" },
  boshTitle: { color: colors.ink, fontSize: 17, lineHeight: 22, fontFamily: font.w800 },
  boshText: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, fontFamily: font.w500 },
  riprovo: { marginTop: 10, minHeight: 44, alignItems: "center", justifyContent: "center", borderRadius: 14, borderWidth: 1.5, borderColor: colors.petrol },
  riprovoText: { color: colors.petrol, fontSize: 15, fontFamily: font.w700 },
  flex: { flex: 1 },
  shtypur: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  shtoKarta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
    borderRadius: 22,
    backgroundColor: colors.ikonaBg,
    borderWidth: 1,
    borderColor: "rgba(23,85,104,0.14)",
  },
  shtoRrethi: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.petrol,
    alignItems: "center",
    justifyContent: "center",
  },
  shtoNen: { color: colors.textSecondary, fontSize: 14, fontFamily: font.w500 },
  detyrat: {
    minHeight: 72,
    backgroundColor: colors.white,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#0B2530",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 2,
  },
  detyratIkona: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.ikonaBg,
    alignItems: "center",
    justifyContent: "center",
  },
  detyratTekst: { flex: 1, gap: 2 },
  detyratTitulli: { color: colors.ink, fontSize: 17, lineHeight: 22, fontFamily: font.w800 },
  detyratNen: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, fontFamily: font.w500 },
  shtoText: { color: colors.petrol, fontSize: 17, fontFamily: font.w800 },
  fusha: { gap: 6 },
  label: { color: colors.ink, fontSize: 15, lineHeight: 20, fontFamily: font.w700 },
  input: {
    height: 56,
    paddingHorizontal: 16,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.inputBorder,
    borderRadius: 14,
    fontSize: 16,
    fontFamily: font.w500,
    color: colors.ink,
  },
  inputFokus: { borderColor: colors.petrol },
  chips: { flexDirection: "row", gap: 8 },
  chip: {
    minHeight: 44,
    paddingHorizontal: 14,
    flexDirection: "row",
    gap: 6,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: colors.inputBorder,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  chipZgjedhur: { backgroundColor: colors.petrol, borderColor: colors.petrol },
  chipText: { color: colors.ink, fontSize: 15, fontFamily: font.w700 },
  chipTextZgjedhur: { color: colors.white },
  gabim: { color: colors.error, fontSize: 14, lineHeight: 20, fontFamily: font.w600 },
  ruaj: {
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.petrol,
    alignItems: "center",
    justifyContent: "center",
  },
  ruajText: { color: colors.white, fontSize: 17, fontFamily: font.w700 },
  disabled: { opacity: 0.6 },
  anulo: { minHeight: 44, alignItems: "center", justifyContent: "center" },
  anuloText: { color: colors.textSecondary, fontSize: 16, fontFamily: font.w700 },
});
