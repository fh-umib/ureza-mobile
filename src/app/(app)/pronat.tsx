import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from "react-native";

import { EkraniMeHero } from "@/components/EkraniMeHero";
import { FletaModale } from "@/components/FletaModale";
import { PronaKarta } from "@/components/PronaKarta";
import { UrezaIcon } from "@/components/UrezaIcon";
import { VendndodhjaFusha } from "@/components/VendndodhjaFusha";
import { Ditari } from "@/components/Ditari";
import { colors } from "@/constants/ureza";
import { useDhenat, type RezultatiShtimit } from "@/lib/dhenat";
import { gjejQytetin, type Koordinata } from "@/lib/gjeo";
import type { Lloji } from "@/lib/pronat";

const LLOJET: { vlera: Lloji; emri: string }[] = [
  { vlera: "shtepi", emri: "Shtëpi" },
  { vlera: "prindert", emri: "Prindërit" },
  { vlera: "toke", emri: "Tokë" },
];

export default function Pronat() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { pronat, burimiPronat: burimi, shtoPronen: shto, rifresko } = useDhenat();
  const [hapur, setHapur] = useState(false);
  const [lajmerim, setLajmerim] = useState<string | null>(null);

  const kartaWidth = (width - 40 - 12) / 2;

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

      {lajmerim ? (
        <Pressable onPress={() => setLajmerim(null)} accessibilityRole="button" accessibilityHint="Prek për ta mbyllur">
          <Text style={styles.demoNote}>{lajmerim}</Text>
        </Pressable>
      ) : null}

      {burimi === "duke_ngarkuar" ? <ActivityIndicator color={colors.petrol} /> : null}

      {burimi === "pa_lidhje" ? (
        <View style={styles.bosh}>
          <Text style={styles.boshTitle}>Nuk u lidh me serverin</Text>
          <Text style={styles.boshText}>Kontrollo internetin, pastaj provo përsëri.</Text>
          <Pressable style={styles.riprovo} onPress={() => void rifresko()} accessibilityRole="button">
            <Text style={styles.riprovoText}>Provo përsëri</Text>
          </Pressable>
        </View>
      ) : null}

      {burimi === "supabase" && pronat.length === 0 ? (
        <View style={styles.bosh}>
          <Text style={styles.boshTitle}>Ende nuk ke asnjë pronë</Text>
          <Text style={styles.boshText}>Shto të parën, p.sh. shtëpinë ose prindërit.</Text>
        </View>
      ) : null}

      <View style={styles.grid}>
        {pronat.map((prona) => (
          <PronaKarta key={prona.id} prona={prona} width={kartaWidth} />
        ))}
      </View>

      <Pressable style={styles.shtoButon} onPress={() => setHapur(true)} accessibilityRole="button">
        <UrezaIcon name="plus" size={22} color={colors.petrol} strokeWidth={2.4} />
        <Text style={styles.shtoText}>Shto pronë</Text>
      </Pressable>

      <Ditari onShikoTeGjitha={() => router.navigate("/oda")} />

      <Pressable style={styles.detyrat} onPress={() => router.push("/detyrat")} accessibilityRole="button">
        <View style={styles.detyratTekst}>
          <Text style={styles.detyratTitulli}>Detyrat</Text>
          <Text style={styles.detyratNen}>Punët që duhen bërë për pronat e tua</Text>
        </View>
        <UrezaIcon name="chevron" size={20} color={colors.petrol} strokeWidth={2.4} />
      </Pressable>

      <ShtoPronen hapur={hapur} mbyll={() => setHapur(false)} shto={shto} onLajmerim={setLajmerim} />
    </EkraniMeHero>
  );
}

function ShtoPronen({
  hapur,
  mbyll,
  shto,
  onLajmerim,
}: {
  hapur: boolean;
  mbyll: () => void;
  shto: (emri: string, vendi: string, lloji: Lloji, koordinatat: Koordinata | null) => Promise<RezultatiShtimit>;
  onLajmerim: (tekst: string) => void;
}) {
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
    if (r.gabim) onLajmerim(`Prona u ruajt, por vendndodhja e saktë jo. ${r.gabim}`);
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
  demoNote: { color: "#7A4A06", backgroundColor: "#FCEFD2", borderRadius: 14, padding: 12, fontSize: 13, lineHeight: 18, fontWeight: "600" },
  bosh: { backgroundColor: colors.white, borderRadius: 20, padding: 20, gap: 4, borderWidth: 1, borderColor: "#E3EAF0" },
  boshTitle: { color: colors.ink, fontSize: 17, lineHeight: 22, fontWeight: "800" },
  boshText: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, fontWeight: "500" },
  riprovo: { marginTop: 10, minHeight: 44, alignItems: "center", justifyContent: "center", borderRadius: 14, borderWidth: 1.5, borderColor: colors.petrol },
  riprovoText: { color: colors.petrol, fontSize: 15, fontWeight: "700" },
  detyrat: {
    minHeight: 64,
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E3EAF0",
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  detyratTekst: { flex: 1, gap: 2 },
  detyratTitulli: { color: colors.ink, fontSize: 17, lineHeight: 22, fontWeight: "800" },
  detyratNen: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, fontWeight: "500" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  shtoButon: {
    minHeight: 56,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: colors.inputBorder,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  shtoText: { color: colors.petrol, fontSize: 16, fontWeight: "700" },
  fusha: { gap: 6 },
  label: { color: colors.ink, fontSize: 15, lineHeight: 20, fontWeight: "700" },
  input: {
    height: 56,
    paddingHorizontal: 16,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.inputBorder,
    borderRadius: 14,
    fontSize: 16,
    fontWeight: "500",
    color: colors.ink,
  },
  inputFokus: { borderColor: colors.petrol },
  chips: { flexDirection: "row", gap: 8 },
  chip: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: colors.inputBorder,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  chipZgjedhur: { backgroundColor: colors.petrol, borderColor: colors.petrol },
  chipText: { color: colors.ink, fontSize: 15, fontWeight: "700" },
  chipTextZgjedhur: { color: colors.white },
  gabim: { color: colors.error, fontSize: 14, lineHeight: 20, fontWeight: "600" },
  ruaj: {
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.petrol,
    alignItems: "center",
    justifyContent: "center",
  },
  ruajText: { color: colors.white, fontSize: 17, fontWeight: "700" },
  disabled: { opacity: 0.6 },
  anulo: { minHeight: 44, alignItems: "center", justifyContent: "center" },
  anuloText: { color: colors.textSecondary, fontSize: 16, fontWeight: "700" },
});
