import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { colors } from "@/constants/ureza";
import { useDhenat } from "@/lib/dhenat";
import { VENDIMET_E_ADMINIT, dataMeOre, type VendimiAdminit, type Vizita } from "@/lib/vizitat";

import { useRevealOnFocus } from "./EkraniMeHero";
import { UrezaIcon } from "./UrezaIcon";

// The admin's review of a disputed report (supabase/admini.sql). Once the case is closed, the
// client, the Miku and the admin all see the decision and its note. While it is open, the admin
// sees the form: who is right, and a note that says why and what happens next.

const SHENIMI_MIN = 10;
const SHENIMI_MAX = 500;

const ZGJEDHJET: { vlera: VendimiAdminit; titulli: string; nen: string }[] = [
  { vlera: "klienti", titulli: "Klienti ka të drejtë", nen: "Dëshmitë nuk tregojnë atë që u kërkua." },
  { vlera: "miku", titulli: "Raporti qëndron", nen: "Dëshmitë tregojnë se vizita u krye siç u kërkua." },
];

export function ShqyrtimiIRastit({ vizita, admin }: { vizita: Vizita; admin: boolean }) {
  if (vizita.statusi !== "kundershtuar") return null;
  if (vizita.shqyrtuarAt && vizita.vendimiAdminit) return <VendimiIMbyllur vizita={vizita} />;
  return admin ? <FormaEShqyrtimit vizita={vizita} /> : null;
}

function VendimiIMbyllur({ vizita }: { vizita: Vizita }) {
  const v = VENDIMET_E_ADMINIT[vizita.vendimiAdminit ?? "miku"];
  return (
    <View style={[styles.karta, styles.mbyllur]}>
      <View style={styles.rreshtIkone}>
        <UrezaIcon name="shield" size={22} color={colors.petrol} strokeWidth={2.4} />
        <Text style={styles.titulli}>Vendimi i adminit: {v.titulli.toLowerCase()}</Text>
      </View>
      <Text style={styles.tekst}>{v.teksti}</Text>
      {vizita.shenimiAdminit ? <Text style={styles.shenimi}>“{vizita.shenimiAdminit}”</Text> : null}
      {vizita.shqyrtuarAt ? <Text style={styles.koha}>Shqyrtuar më {dataMeOre(vizita.shqyrtuarAt)}</Text> : null}
    </View>
  );
}

function FormaEShqyrtimit({ vizita }: { vizita: Vizita }) {
  const { shqyrtoRastin } = useDhenat();
  const revealSoon = useRevealOnFocus();
  const [zgjedhja, setZgjedhja] = useState<VendimiAdminit | null>(null);
  const [shenimi, setShenimi] = useState("");
  const [fokus, setFokus] = useState(false);
  const [duke, setDuke] = useState(false);
  const [gabim, setGabim] = useState<string | null>(null);

  async function mbyll() {
    if (duke) return;
    if (!zgjedhja) {
      setGabim("Zgjidh kush ka të drejtë.");
      return;
    }
    if (shenimi.trim().length < SHENIMI_MIN) {
      setGabim(`Shkruaj të paktën ${SHENIMI_MIN} shkronja: pse vendose kështu dhe çka ndodh tani.`);
      return;
    }
    setDuke(true);
    setGabim(null);
    const mesazh = await shqyrtoRastin(vizita.id, zgjedhja === "klienti", shenimi);
    setDuke(false);
    // when it worked, the visit is closed and the card above shows the decision instead
    if (mesazh) setGabim(mesazh);
  }

  return (
    <View style={styles.karta}>
      <Text style={styles.titulli}>Vendimi yt</Text>
      <Text style={styles.tekst}>
        Lexo arsyen e klientit dhe shiko dëshmitë. Vendimi dhe shënimi yt u shfaqen klientit dhe Mikut, dhe nuk
        ndryshohen më pas.
      </Text>

      <View style={styles.zgjedhjet} accessibilityRole="radiogroup">
        {ZGJEDHJET.map((z) => {
          const aktiv = zgjedhja === z.vlera;
          return (
            <Pressable
              key={z.vlera}
              style={[styles.zgjedhja, aktiv && styles.zgjedhjaAktive]}
              onPress={() => {
                setZgjedhja(z.vlera);
                setGabim(null);
              }}
              disabled={duke}
              accessibilityRole="radio"
              accessibilityState={{ checked: aktiv }}
            >
              <View style={[styles.rrethi, aktiv && styles.rrethiAktiv]}>
                {aktiv ? <View style={styles.pika} /> : null}
              </View>
              <View style={styles.zgjedhjaTekst}>
                <Text style={styles.zgjedhjaTitulli}>{z.titulli}</Text>
                <Text style={styles.tekst}>{z.nen}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.etiketa}>Shënimi për klientin dhe Mikun</Text>
      <TextInput
        style={[styles.input, fokus && styles.inputFokus]}
        value={shenimi}
        onChangeText={(t) => {
          setShenimi(t);
          if (gabim) setGabim(null);
        }}
        onFocus={() => {
          setFokus(true);
          revealSoon();
        }}
        onBlur={() => setFokus(false)}
        placeholder="P.sh. Fotot nuk tregojnë çatinë. Miku e përsërit vizitën falas këtë javë."
        placeholderTextColor="#8798A2"
        multiline
        maxLength={SHENIMI_MAX}
        textAlignVertical="top"
        editable={!duke}
        accessibilityLabel="Shënimi i vendimit"
      />
      <Text style={styles.numrues}>
        {shenimi.trim().length}/{SHENIMI_MAX}
      </Text>

      {gabim ? <Text style={styles.gabim}>{gabim}</Text> : null}

      <Pressable
        style={[styles.primary, duke && styles.disabled]}
        onPress={() => void mbyll()}
        disabled={duke}
        accessibilityRole="button"
      >
        {duke ? <ActivityIndicator color={colors.white} /> : <Text style={styles.primaryText}>Mbyll rastin</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  karta: { backgroundColor: colors.white, borderRadius: 20, padding: 20, gap: 10 },
  mbyllur: { backgroundColor: colors.ikonaBg },
  rreshtIkone: { flexDirection: "row", alignItems: "center", gap: 10 },
  titulli: { flex: 1, color: colors.ink, fontSize: 20, lineHeight: 26, fontWeight: "800" },
  tekst: { color: colors.textSecondary, fontSize: 15, lineHeight: 22, fontWeight: "500" },
  shenimi: { color: colors.ink, fontSize: 16, lineHeight: 24, fontWeight: "500", fontStyle: "italic" },
  koha: { color: colors.textSecondary, fontSize: 13, fontWeight: "600" },
  zgjedhjet: { gap: 10 },
  zgjedhja: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.white,
  },
  zgjedhjaAktive: { borderColor: colors.petrol, borderWidth: 2, backgroundColor: "#F1F8F7" },
  rrethi: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.inputBorder,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  rrethiAktiv: { borderColor: colors.petrol },
  pika: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.petrol },
  zgjedhjaTekst: { flex: 1, gap: 2 },
  zgjedhjaTitulli: { color: colors.ink, fontSize: 16, lineHeight: 22, fontWeight: "800" },
  etiketa: { color: colors.ink, fontSize: 15, fontWeight: "700", marginTop: 4 },
  input: {
    minHeight: 110,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.inputBorder,
    backgroundColor: colors.white,
    padding: 14,
    color: colors.ink,
    fontSize: 16,
    lineHeight: 23,
    fontWeight: "500",
  },
  inputFokus: { borderColor: colors.petrol, borderWidth: 2 },
  numrues: { color: colors.textSecondary, fontSize: 13, fontWeight: "600", textAlign: "right" },
  gabim: { color: colors.error, fontSize: 14, lineHeight: 20, fontWeight: "600" },
  primary: { height: 56, borderRadius: 16, backgroundColor: colors.petrol, alignItems: "center", justifyContent: "center" },
  primaryText: { color: colors.white, fontSize: 17, fontWeight: "700" },
  disabled: { opacity: 0.6 },
});
