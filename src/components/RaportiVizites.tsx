import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { colors } from "@/constants/ureza";
import { useDeshmite } from "@/lib/deshmite";
import { useDhenat } from "@/lib/dhenat";
import { dataMeOre, kohezgjatjaNeTekst, oraNeTekst, type Vizita } from "@/lib/vizitat";

import { useRevealOnFocus } from "./EkraniMeHero";
import { GpsKrahasimi } from "./GpsKrahasimi";
import { UrezaIcon, type IconName } from "./UrezaIcon";

// The report of a visit as the client reads it (design: Raporti): what the Miku sent, and
// the two buttons "Miratoje raportin" and "Kundërshtoje". Both pieces go on the "Përmbledhje"
// tab of the visit: the summary first, the decision at the bottom, after the client has read.

const KUNDERSHTO = "#B3261E"; // the red of "Kundërshtoje" in the design
const ARSYEJA_MIN = 10;
const ARSYEJA_MAX = 500;

function Chip({ icon, tekst }: { icon: IconName; tekst: string }) {
  return (
    <View style={styles.chip}>
      <UrezaIcon name={icon} size={16} color={colors.ink} strokeWidth={2.2} />
      <Text style={styles.chipText}>{tekst}</Text>
    </View>
  );
}

// What the Miku sent: the time of the GPS position, the number of photos, the length of the voice note.
export function PermbledhjaERaportit({ vizita, onShikoDeshmite }: { vizita: Vizita; onShikoDeshmite: () => void }) {
  const d = useDeshmite(vizita.id, false);
  const { pronat } = useDhenat();
  const prona = pronat.find((p) => p.id === vizita.pronaId);
  const emri = vizita.mikuEmri ?? "Miku";
  const gjetur = d.burimi === "supabase" || d.burimi === "lokal";

  return (
    <View style={styles.karta}>
      <Text style={styles.titulli}>Çka dërgoi {emri}</Text>
      <Text style={styles.tekst}>
        {vizita.derguarAt ? `${emri} i dërgoi këto dëshmi më ${dataMeOre(vizita.derguarAt)}.` : `${emri} i dërgoi këto dëshmi.`}{" "}
        Shikoji dhe vendos nëse vizita u krye siç e kërkove.
      </Text>
      {gjetur ? (
        <View style={styles.chips}>
          {d.gps ? (
            <Chip icon="pin" tekst={`GPS ±${Math.round(d.gps.saktesia ?? 0)} m · ${oraNeTekst(d.gps.koha)}`} />
          ) : null}
          <GpsKrahasimi gps={d.gps} prona={prona} />
          {d.fotot.length > 0 ? <Chip icon="camera" tekst={`${d.fotot.length} foto`} /> : null}
          {d.zeri ? <Chip icon="mic" tekst={`Zë ${kohezgjatjaNeTekst(d.zeri.kohezgjatja ?? 0)}`} /> : null}
        </View>
      ) : null}
      <Pressable style={styles.lidhje} onPress={onShikoDeshmite} accessibilityRole="button">
        <Text style={styles.lidhjeText}>Shiko dëshmitë</Text>
        <UrezaIcon name="chevron" size={18} color={colors.petrol} strokeWidth={2.6} />
      </Pressable>
    </View>
  );
}

// The decision: two buttons while the report waits, the outcome once the client has decided.
// `admin` words the dispute card for the admin who reviews it ("Kundërshtimi i klientit").
export function VendimiIRaportit({ vizita, admin = false }: { vizita: Vizita; admin?: boolean }) {
  const { vendosRaportin } = useDhenat();
  const revealSoon = useRevealOnFocus();
  const [paneli, setPaneli] = useState<"mirato" | "kundershto" | null>(null);
  const [arsyeja, setArsyeja] = useState("");
  const [fokus, setFokus] = useState(false);
  const [duke, setDuke] = useState(false);
  const [gabim, setGabim] = useState<string | null>(null);

  if (vizita.statusi === "miratuar") {
    return (
      <View style={[styles.karta, styles.miratuar]}>
        <View style={styles.rreshtIkone}>
          <UrezaIcon name="check" size={22} color="#1E6B3E" strokeWidth={2.6} />
          <Text style={[styles.titulli, styles.miratuarTitulli]}>Raporti u miratua</Text>
        </View>
        <Text style={styles.miratuarTekst}>
          Ti e miratove këtë raport{vizita.vendosurAt ? ` më ${dataMeOre(vizita.vendosurAt)}` : ""}. Vizita është e mbyllur.
        </Text>
      </View>
    );
  }

  if (vizita.statusi === "kundershtuar") {
    return (
      <View style={[styles.karta, styles.kundershtuar]}>
        <View style={styles.rreshtIkone}>
          <UrezaIcon name="warning" size={22} color={KUNDERSHTO} strokeWidth={2.4} />
          <Text style={[styles.titulli, styles.kundershtuarTitulli]}>
            {admin ? "Kundërshtimi i klientit" : "Kundërshtimi yt"}
          </Text>
        </View>
        {vizita.arsyeja ? <Text style={styles.arsyeja}>“{vizita.arsyeja}”</Text> : null}
        <Text style={styles.kundershtuarTekst}>
          {vizita.vendosurAt ? `Dërguar më ${dataMeOre(vizita.vendosurAt)}. ` : ""}
          {vizita.shqyrtuarAt ? "" : admin ? "Rasti pret vendimin tënd." : "Një admin e shqyrton rastin."}
        </Text>
      </View>
    );
  }

  if (vizita.statusi !== "raporti_gati") return null;

  async function vendos(miratuar: boolean) {
    if (duke) return;
    if (!miratuar && arsyeja.trim().length < ARSYEJA_MIN) {
      setGabim(`Shkruaj të paktën ${ARSYEJA_MIN} shkronja: çka mungon ose nuk të duket në rregull.`);
      return;
    }
    setDuke(true);
    setGabim(null);
    const mesazh = await vendosRaportin(vizita.id, miratuar, arsyeja);
    setDuke(false);
    // when it worked, the visit has a new status and this card shows the outcome instead
    if (mesazh) setGabim(mesazh);
  }

  function hap(pamja: "mirato" | "kundershto") {
    setGabim(null);
    setPaneli(pamja);
  }

  function mbyll() {
    setGabim(null);
    setPaneli(null);
  }

  return (
    <View style={styles.vendim}>
      {gabim ? <Text style={styles.gabim}>{gabim}</Text> : null}

      {paneli === null ? (
        <>
          <Pressable style={styles.miratoButon} onPress={() => hap("mirato")} accessibilityRole="button">
            <Text style={styles.miratoText}>Miratoje raportin</Text>
            <UrezaIcon name="check" size={22} color={colors.white} strokeWidth={2.3} />
          </Pressable>
          <Pressable style={styles.kundershtoButon} onPress={() => hap("kundershto")} accessibilityRole="button">
            <Text style={styles.kundershtoText}>Kundërshtoje</Text>
            <UrezaIcon name="warning" size={22} color={KUNDERSHTO} strokeWidth={2.3} />
          </Pressable>
          <Text style={styles.ndihme}>Nëse e kundërshton, një admin e shqyrton rastin.</Text>
        </>
      ) : null}

      {paneli === "mirato" ? (
        <View style={[styles.paneli, styles.paneliMirato]}>
          <Text style={styles.paneliLabel}>Ta miratojmë raportin? Vizita mbyllet dhe vendimi nuk mund të ndryshohet.</Text>
          <Pressable
            style={[styles.miratoButon, duke && styles.disabled]}
            onPress={() => void vendos(true)}
            disabled={duke}
            accessibilityRole="button"
          >
            {duke ? <ActivityIndicator color={colors.white} /> : <Text style={styles.miratoText}>Po, miratoje</Text>}
          </Pressable>
          <Pressable style={styles.jo} onPress={mbyll} disabled={duke} accessibilityRole="button">
            <Text style={styles.joText}>Jo, prapa</Text>
          </Pressable>
        </View>
      ) : null}

      {paneli === "kundershto" ? (
        <View style={[styles.paneli, styles.paneliKundershto]}>
          <Text style={styles.paneliLabel}>Pse e kundërshton raportin?</Text>
          <Text style={styles.paneliNdihme}>Shkruaj çka mungon ose nuk të duket në rregull. Këtë e lexon admini.</Text>
          <TextInput
            style={[styles.input, fokus && styles.inputFokus]}
            value={arsyeja}
            onChangeText={setArsyeja}
            onFocus={() => {
              setFokus(true);
              revealSoon();
            }}
            onBlur={() => setFokus(false)}
            placeholder="p.sh. Fotot nuk e tregojnë anën veriore të oborrit."
            placeholderTextColor="#8FA3AC"
            multiline
            maxLength={ARSYEJA_MAX}
            textAlignVertical="top"
            accessibilityLabel="Arsyeja e kundërshtimit"
          />
          <Text style={styles.numrues}>
            {arsyeja.length}/{ARSYEJA_MAX}
          </Text>
          <Pressable
            style={[styles.kundershtoPlote, duke && styles.disabled]}
            onPress={() => void vendos(false)}
            disabled={duke}
            accessibilityRole="button"
          >
            {duke ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.kundershtoPloteText}>Dërgo kundërshtimin</Text>
            )}
          </Pressable>
          <Pressable style={styles.jo} onPress={mbyll} disabled={duke} accessibilityRole="button">
            <Text style={styles.joText}>Jo, prapa</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  karta: { backgroundColor: colors.white, borderRadius: 20, padding: 20, gap: 10 },
  titulli: { color: colors.ink, fontSize: 20, lineHeight: 26, fontWeight: "800" },
  tekst: { color: colors.ink, fontSize: 16, lineHeight: 24, fontWeight: "500" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 17,
    backgroundColor: "#EDF1F4",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  chipText: { color: colors.ink, fontSize: 14, fontWeight: "700" },
  lidhje: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: 4 },
  lidhjeText: { color: colors.petrol, fontSize: 16, fontWeight: "800" },

  vendim: { gap: 10, marginTop: 4 },
  gabim: { color: colors.error, fontSize: 14, lineHeight: 20, fontWeight: "600" },
  miratoButon: {
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.petrol,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  miratoText: { color: colors.white, fontSize: 17, fontWeight: "700" },
  kundershtoButon: {
    height: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: KUNDERSHTO,
    backgroundColor: colors.white,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  kundershtoText: { color: KUNDERSHTO, fontSize: 17, fontWeight: "700" },
  ndihme: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, fontWeight: "500", textAlign: "center" },
  disabled: { opacity: 0.6 },

  paneli: { gap: 10, padding: 16, borderRadius: 16 },
  paneliMirato: { backgroundColor: "#E8F5F3" },
  paneliKundershto: { backgroundColor: "#FDECEA" },
  paneliLabel: { color: colors.ink, fontSize: 16, lineHeight: 23, fontWeight: "700" },
  paneliNdihme: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, fontWeight: "500" },
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
  kundershtoPlote: {
    height: 56,
    borderRadius: 16,
    backgroundColor: KUNDERSHTO,
    alignItems: "center",
    justifyContent: "center",
  },
  kundershtoPloteText: { color: colors.white, fontSize: 17, fontWeight: "700" },
  jo: { minHeight: 48, alignItems: "center", justifyContent: "center" },
  joText: { color: colors.petrol, fontSize: 16, fontWeight: "700" },

  rreshtIkone: { flexDirection: "row", alignItems: "center", gap: 10 },
  miratuar: { backgroundColor: "#E4F6EB" },
  miratuarTitulli: { color: "#1E6B3E" },
  miratuarTekst: { color: "#1E6B3E", fontSize: 16, lineHeight: 24, fontWeight: "600" },
  kundershtuar: { backgroundColor: "#FBE9E9" },
  kundershtuarTitulli: { color: "#7A1F1B" },
  kundershtuarTekst: { color: "#7A1F1B", fontSize: 15, lineHeight: 22, fontWeight: "600" },
  arsyeja: { color: colors.ink, fontSize: 16, lineHeight: 24, fontWeight: "500", fontStyle: "italic" },
});
