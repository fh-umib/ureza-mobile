import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { useToast } from "./ui/Toast";
import { colors, font } from "@/constants/ureza";
import { LLOJET_E_MIKUT, useProfiliIPunes, type LlojiIMikut, type ProfiliIPunes } from "@/lib/kontrata";

import { useRevealOnFocus } from "./EkraniMeHero";
import { UrezaIcon } from "./UrezaIcon";

// "Si punon si Miku" on Profili: a company registered in Kosovo, an individual, a student or a
// craftsman. A company also gives its name and business number (ARBK); a craftsman their trade.
// It goes into every contract the Miku accepts, and a Miku cannot accept a visit without it.
export function KartaEProfilitTePunes() {
  const { profili, gati, ruaj } = useProfiliIPunes();
  if (!gati) {
    return (
      <View style={styles.karta}>
        <TitulliIKartes />
        <Text style={styles.ndihme}>
          Kjo pjesë kërkon supabase/besimi.sql në Supabase. Pastaj zgjedh nëse je kompani, individ, student ose mjeshtër.
        </Text>
      </View>
    );
  }
  // the form starts from what is saved; `key` resets it when the saved profile changes
  return <Forma key={JSON.stringify(profili)} ruajtur={profili} ruaj={ruaj} />;
}

function Forma({
  ruajtur,
  ruaj,
}: {
  ruajtur: ProfiliIPunes | null;
  ruaj: (p: ProfiliIPunes) => Promise<string | null>;
}) {
  const revealSoon = useRevealOnFocus();
  const [lloji, setLloji] = useState<LlojiIMikut | null>(ruajtur?.lloji ?? null);
  const [biznesi, setBiznesi] = useState(ruajtur?.biznesi ?? "");
  const [nrb, setNrb] = useState(ruajtur?.nrb ?? "");
  const [duke, setDuke] = useState(false);
  const [mesazh, setMesazh] = useState<{ gabim: boolean; tekst: string } | null>(null);
  const toast = useToast();

  async function ruajeProfilin() {
    if (duke) return;
    if (!lloji) {
      setMesazh({ gabim: true, tekst: "Zgjidh si punon." });
      return;
    }
    const emriBiznesit = biznesi.trim();
    const numri = nrb.replace(/\s+/g, "");
    if (lloji === "kompani" && (emriBiznesit.length < 2 || !/^[0-9]{6,12}$/.test(numri))) {
      setMesazh({ gabim: true, tekst: "Për kompani shkruaj emrin e biznesit dhe numrin e biznesit (6–12 shifra)." });
      return;
    }
    setDuke(true);
    setMesazh(null);
    const gabim = await ruaj({
      lloji,
      biznesi: lloji === "kompani" || lloji === "mjeshter" ? emriBiznesit || null : null,
      nrb: lloji === "kompani" ? numri : null,
    });
    setDuke(false);
    setMesazh(gabim ? { gabim: true, tekst: gabim } : null);
    if (!gabim) toast.sukses("U ruajt. Del në çdo kontratë që pranon.");
  }

  return (
    <View style={styles.karta}>
      <TitulliIKartes />
      <Text style={styles.ndihme}>Del në kontratën me klientin. Pa këtë nuk mund të pranosh vizita.</Text>

      <View style={styles.rrjeta}>
        {LLOJET_E_MIKUT.map((l) => {
          const zgjedhur = l.vlera === lloji;
          return (
            <Pressable
              key={l.vlera}
              onPress={() => {
                setLloji(l.vlera);
                setMesazh(null);
              }}
              style={[styles.lloji, zgjedhur && styles.llojiZgjedhur]}
              accessibilityRole="radio"
              accessibilityState={{ selected: zgjedhur }}
              accessibilityLabel={`${l.emri}: ${l.pershkrimi}`}
            >
              <View style={[styles.llojiIkona, zgjedhur && styles.llojiIkonaZgjedhur]}>
                <UrezaIcon name={l.ikona} size={20} color={zgjedhur ? colors.white : colors.petrol} strokeWidth={2.2} />
              </View>
              <Text style={styles.llojiEmri}>{l.emri}</Text>
              <Text style={styles.llojiPershkrimi}>{l.pershkrimi}</Text>
            </Pressable>
          );
        })}
      </View>

      {lloji === "kompani" ? (
        <>
          <Fusha
            etiketa="Emri i biznesit"
            vlera={biznesi}
            onNdrysho={setBiznesi}
            placeholder="p.sh. Shtëpia e Sigurt Sh.p.k."
            onFocus={revealSoon}
          />
          <Fusha
            etiketa="Numri i biznesit (ARBK)"
            vlera={nrb}
            onNdrysho={setNrb}
            placeholder="p.sh. 810000000"
            numerike
            onFocus={revealSoon}
          />
        </>
      ) : null}
      {lloji === "mjeshter" ? (
        <Fusha
          etiketa="Zanati (opsional)"
          vlera={biznesi}
          onNdrysho={setBiznesi}
          placeholder="p.sh. elektricist, hidraulik"
          onFocus={revealSoon}
        />
      ) : null}

      {mesazh ? <Text style={[styles.mesazh, mesazh.gabim && styles.gabim]}>{mesazh.tekst}</Text> : null}

      <Pressable
        style={[styles.ruaj, duke && styles.disabled]}
        onPress={ruajeProfilin}
        disabled={duke}
        accessibilityRole="button"
      >
        {duke ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <>
            <Text style={styles.ruajTeksti}>Ruaj</Text>
            <UrezaIcon name="check" size={20} color={colors.white} strokeWidth={2.4} />
          </>
        )}
      </Pressable>
    </View>
  );
}

function TitulliIKartes() {
  return (
    <View style={styles.krye}>
      <View style={styles.kryeIkona}>
        <UrezaIcon name="doc" size={20} color={colors.petrol} strokeWidth={2.2} />
      </View>
      <Text style={styles.titulli} accessibilityRole="header">
        Si punon si Miku
      </Text>
    </View>
  );
}

function Fusha({
  etiketa,
  vlera,
  onNdrysho,
  placeholder,
  numerike,
  onFocus,
}: {
  etiketa: string;
  vlera: string;
  onNdrysho: (t: string) => void;
  placeholder: string;
  numerike?: boolean;
  onFocus: () => void;
}) {
  const [fokus, setFokus] = useState(false);
  return (
    <View style={styles.fusha}>
      <Text style={styles.label}>{etiketa}</Text>
      <TextInput
        style={[styles.input, fokus && styles.inputFokus]}
        value={vlera}
        onChangeText={onNdrysho}
        onFocus={() => {
          setFokus(true);
          onFocus();
        }}
        onBlur={() => setFokus(false)}
        placeholder={placeholder}
        placeholderTextColor="#8FA3AC"
        keyboardType={numerike ? "number-pad" : "default"}
        maxLength={numerike ? 12 : 80}
        accessibilityLabel={etiketa}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  karta: {
    backgroundColor: colors.white,
    borderRadius: 22,
    padding: 20,
    gap: 12,
    shadowColor: "#0B2530",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 2,
  },
  krye: { flexDirection: "row", alignItems: "center", gap: 10 },
  kryeIkona: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.ikonaBg,
    alignItems: "center",
    justifyContent: "center",
  },
  titulli: { color: colors.ink, fontSize: 20, lineHeight: 26, fontFamily: font.w800 },
  ndihme: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, fontFamily: font.w500 },
  rrjeta: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  lloji: {
    width: "47%",
    flexGrow: 1,
    padding: 12,
    gap: 4,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.white,
  },
  llojiZgjedhur: { borderColor: colors.petrol, backgroundColor: "#F2F8FA" },
  llojiIkona: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.ikonaBg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  llojiIkonaZgjedhur: { backgroundColor: colors.petrol },
  llojiEmri: { color: colors.ink, fontSize: 16, fontFamily: font.w800 },
  llojiPershkrimi: { color: colors.textSecondary, fontSize: 12, lineHeight: 16, fontFamily: font.w500 },
  fusha: { gap: 6 },
  label: { color: colors.ink, fontSize: 15, lineHeight: 20, fontFamily: font.w700 },
  input: {
    height: 52,
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
  mesazh: { color: colors.ok, fontSize: 14, lineHeight: 20, fontFamily: font.w600 },
  gabim: { color: colors.error },
  ruaj: {
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.petrol,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  ruajTeksti: { color: colors.white, fontSize: 16, fontFamily: font.w800 },
  disabled: { opacity: 0.6 },
});
