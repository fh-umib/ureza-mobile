import * as Print from "expo-print";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import { useState, type ReactNode } from "react";
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { EkraniMeHero, useRevealOnFocus } from "@/components/EkraniMeHero";
import { Kutia } from "@/components/Kutia";
import { UrezaIcon } from "@/components/UrezaIcon";
import { colors, font } from "@/constants/ureza";
import { useDhenat } from "@/lib/dhenat";
import { paleMiku, useKontrata, useProfiliIPunes, type DhenatEKontrates } from "@/lib/kontrata";
import {
  AFATET,
  HYRJET,
  PAGESAT,
  htmlIKontrates,
  type Afati,
  type Hyrja,
  type Pagesa,
} from "@/lib/kontrataPdf";
import { CMIMI_TEKST, PJESA_E_DEMIT } from "@/lib/kushtet";
import { useProfili } from "@/lib/profili";
import { dataEPlote, dataMeOre, titulliIVizites } from "@/lib/vizitat";

// The contract of one visit as a form: choose the options (how the Miku gets in, payment), sign
// with the full name, then generate the digital contract as a PDF (src/lib/kontrataPdf.ts) and
// save or send it from the phone's share sheet. The data comes from kontrata_e_vizites()
// (supabase/besimi.sql); until that file is run it is built from what the phone knows.
export default function Kontrata() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const kontrata = useKontrata(id ?? null);
  const { vizitat, pronat } = useDhenat();
  const { profili } = useProfili();
  const puna = useProfiliIPunes();

  const v = vizitat.find((x) => x.id === id);
  const prona = v ? pronat.find((p) => p.id === v.pronaId) : undefined;
  const eMiku = profili?.roli === "miku";
  const ngaTelefoni: DhenatEKontrates | null = v
    ? {
        vizitaId: v.id,
        lloji: v.lloji,
        data: v.data,
        udhezime: v.udhezime,
        pronaEmri: prona?.emri ?? "Prona",
        pronaVendi: prona?.vendi ?? "",
        klientiEmri: eMiku ? null : (profili?.emri ?? null),
        pelqimiAt: null,
        mikuEmri: v.mikuEmri ?? (eMiku ? (profili?.emri ?? null) : null),
        mikuLloji: eMiku ? (puna.profili?.lloji ?? null) : null,
        mikuBiznesi: eMiku ? (puna.profili?.biznesi ?? null) : null,
        mikuNrb: eMiku ? (puna.profili?.nrb ?? null) : null,
        mikuVerifikuarAt: null,
        kontrataPranuarAt: null,
      }
    : null;
  const d = kontrata.dhenat ?? (kontrata.burimi === "mungon" ? ngaTelefoni : null);
  const mbrapa = { etiketa: "Mbrapa", onPress: () => router.back() };

  if (!d) {
    return (
      <EkraniMeHero kicker="KONTRATA" title="Kontrata" kthehu={mbrapa}>
        {kontrata.burimi === "duke_ngarkuar" ? (
          <ActivityIndicator color={colors.petrol} />
        ) : (
          <Text style={styles.teksti}>Kjo kontratë nuk u gjet, ose nuk ke qasje në të.</Text>
        )}
      </EkraniMeHero>
    );
  }

  return (
    <EkraniMeHero
      kicker={`KONTRATË · NR. ${d.vizitaId.slice(0, 8).toUpperCase()}`}
      title="Kontrata"
      subtitle="Plotësoje dhe gjenero kontratën digjitale."
      kthehu={mbrapa}
    >
      <Forma d={d} roli={eMiku ? "miku" : "klient"} emriIProfilit={profili?.emri ?? ""} />
    </EkraniMeHero>
  );
}

function Forma({ d, roli, emriIProfilit }: { d: DhenatEKontrates; roli: "klient" | "miku"; emriIProfilit: string }) {
  const revealSoon = useRevealOnFocus();
  const [hyrja, setHyrja] = useState<Hyrja>("jashte");
  const [pagesa, setPagesa] = useState<Pagesa>("para_ne_dore");
  const [afati, setAfati] = useState<Afati>("dita_e_vizites");
  const [foto, setFoto] = useState(true);
  const [shenime, setShenime] = useState("");
  const [emri, setEmri] = useState(emriIProfilit);
  const [vendi, setVendi] = useState(d.pronaVendi);
  const [konfirmo, setKonfirmo] = useState(false);
  const [fokus, setFokus] = useState<"shenime" | "emri" | "vendi" | null>(null);
  const [duke, setDuke] = useState(false);
  const [gabim, setGabim] = useState<string | null>(null);
  const [gati, setGati] = useState<{ uri: string | null; faqe: number | null; kodi: string } | null>(null);

  const mundet = emri.trim().length >= 3 && vendi.trim().length >= 2 && konfirmo;

  async function ndaje(uri: string) {
    if (Platform.OS === "web" || !(await Sharing.isAvailableAsync())) return;
    await Sharing.shareAsync(uri, { mimeType: "application/pdf", UTI: "com.adobe.pdf", dialogTitle: "Kontrata e vizitës" });
  }

  async function gjenero() {
    if (duke) return;
    if (!mundet) {
      setGabim("Shkruaj emrin e plotë dhe vendin, dhe konfirmo nënshkrimin.");
      return;
    }
    setDuke(true);
    setGabim(null);
    try {
      const { html, kodi } = htmlIKontrates(
        d,
        { hyrja, pagesa, afati, fotoParaFillimit: foto, shenime },
        { roli, emriIPlote: emri.trim(), vendi: vendi.trim(), kur: new Date() },
      );
      // A4 in points; on iOS the margins come from here, on Android from @page in the HTML
      const rezultati = await Print.printToFileAsync({
        html,
        width: 595,
        height: 842,
        margins: { top: 28, bottom: 28, left: 32, right: 32 },
      });
      // on web this opens the print dialog instead of making a file
      const uri = rezultati?.uri ?? null;
      setGati({ uri, faqe: rezultati?.numberOfPages ?? null, kodi });
      if (uri) await ndaje(uri);
    } catch {
      setGabim("Kontrata nuk u gjenerua. Provo përsëri.");
    } finally {
      setDuke(false);
    }
  }

  return (
    <>
      <View style={styles.palet}>
        <Pala ikona="home" roli="KLIENTI" emri={d.klientiEmri ?? "Klienti i Urëzës"} pranoi={d.pelqimiAt} />
        <View style={styles.lidhja}>
          <UrezaIcon name="doc" size={18} color={colors.mint} strokeWidth={2.2} />
        </View>
        <Pala ikona="shield" roli="MIKU" emri={paleMiku(d)} pranoi={d.kontrataPranuarAt} />
      </View>

      <View style={styles.karta}>
        <Text style={styles.kicker}>VIZITA</Text>
        <Text style={styles.titulli}>{titulliIVizites(d.lloji)}</Text>
        <Text style={styles.teksti}>
          {d.pronaEmri}, {d.pronaVendi} · {dataEPlote(d.data)}
        </Text>
        <View style={styles.permbledhje}>
          <Fakt ikona="doc" tekst={`${CMIMI_TEKST} për vizitën e kryer`} />
          <Fakt ikona="warning" tekst={`Dëm nga pakujdesia: ${PJESA_E_DEMIT}% e vlerës; me qëllim: dëmi i plotë`} />
          <Fakt ikona="clock" tekst="Puna 08:00–20:00, pa punë të rrezikshme" />
        </View>
      </View>

      <Seksioni numri="1" titulli="Si hyn Miku në pronë?">
        {HYRJET.map((h) => (
          <Opsion
            key={h.vlera}
            zgjedhur={hyrja === h.vlera}
            onPress={() => setHyrja(h.vlera)}
            emri={h.emri}
            pershkrimi={h.pershkrimi}
          />
        ))}
      </Seksioni>

      <Seksioni numri="2" titulli="Pagesa">
        <View style={styles.chipat}>
          {PAGESAT.map((p) => (
            <Chip key={p.vlera} zgjedhur={pagesa === p.vlera} onPress={() => setPagesa(p.vlera)} emri={p.emri} />
          ))}
        </View>
        <Text style={styles.etiketa}>Afati</Text>
        <View style={styles.chipat}>
          {AFATET.map((a) => (
            <Chip key={a.vlera} zgjedhur={afati === a.vlera} onPress={() => setAfati(a.vlera)} emri={a.emri} />
          ))}
        </View>
      </Seksioni>

      <Seksioni numri="3" titulli="Gjendja dhe shënimet">
        <Kutia
          zgjedhur={foto}
          onPress={() => setFoto((x) => !x)}
          teksti="Miku bën foto të gjendjes para se të fillojë, që çdo dëm i vjetër të dallohet."
        />
        <TextInput
          style={[styles.input, styles.inputShume, fokus === "shenime" && styles.inputFokus]}
          value={shenime}
          onChangeText={setShenime}
          onFocus={() => {
            setFokus("shenime");
            revealSoon();
          }}
          onBlur={() => setFokus(null)}
          placeholder="Shënime shtesë (opsionale), p.sh. qeni është në oborr, kodi i kutisë jepet me telefon."
          placeholderTextColor="#8FA3AC"
          multiline
          maxLength={300}
          textAlignVertical="top"
          accessibilityLabel="Shënime shtesë"
        />
      </Seksioni>

      <Seksioni numri="4" titulli="Nënshkrimi digjital">
        <Text style={styles.etiketa}>Emri dhe mbiemri</Text>
        <TextInput
          style={[styles.input, fokus === "emri" && styles.inputFokus]}
          value={emri}
          onChangeText={setEmri}
          onFocus={() => {
            setFokus("emri");
            revealSoon();
          }}
          onBlur={() => setFokus(null)}
          placeholder="Emri i plotë"
          placeholderTextColor="#8FA3AC"
          maxLength={80}
          accessibilityLabel="Emri dhe mbiemri"
        />
        <Text style={styles.etiketa}>Vendi</Text>
        <TextInput
          style={[styles.input, fokus === "vendi" && styles.inputFokus]}
          value={vendi}
          onChangeText={setVendi}
          onFocus={() => {
            setFokus("vendi");
            revealSoon();
          }}
          onBlur={() => setFokus(null)}
          placeholder="p.sh. Mitrovicë"
          placeholderTextColor="#8FA3AC"
          maxLength={60}
          accessibilityLabel="Vendi i nënshkrimit"
        />
        {emri.trim().length >= 3 ? (
          <View style={styles.firmaKuti} accessibilityLabel={`Nënshkrimi: ${emri.trim()}`}>
            <Text style={styles.firma}>{emri.trim()}</Text>
            <View style={styles.firmaVija} />
            <Text style={styles.imet}>{roli === "klient" ? "Klienti" : "Miku"} · nënshkrim digjital</Text>
          </View>
        ) : null}
        <Kutia
          zgjedhur={konfirmo}
          onPress={() => setKonfirmo((x) => !x)}
          teksti="Konfirmoj që të dhënat janë të sakta dhe e nënshkruaj këtë kontratë në mënyrë digjitale."
        />
      </Seksioni>

      {gabim ? <Text style={styles.gabim}>{gabim}</Text> : null}

      <Pressable
        style={({ pressed }) => [styles.primary, (!mundet || duke) && styles.disabled, pressed && styles.shtypur]}
        onPress={gjenero}
        disabled={duke}
        accessibilityRole="button"
        accessibilityLabel="Gjenero kontratën digjitale si PDF"
      >
        {duke ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <>
            <UrezaIcon name="download" size={22} color={colors.white} strokeWidth={2.3} />
            <Text style={styles.primaryText}>Gjenero kontratën digjitale (PDF)</Text>
          </>
        )}
      </Pressable>

      {gati ? (
        <View style={styles.sukses}>
          <View style={styles.suksesIkona}>
            <UrezaIcon name="check" size={24} color={colors.white} strokeWidth={2.8} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.suksesTitulli}>Kontrata u gjenerua</Text>
            <Text style={styles.teksti}>
              {gati.faqe ? `${gati.faqe} faqe · ` : ""}Kodi i verifikimit: {gati.kodi}
            </Text>
          </View>
          {gati.uri ? (
            <Pressable
              style={styles.ndaj}
              onPress={() => void ndaje(gati.uri as string)}
              accessibilityRole="button"
              accessibilityLabel="Ruaje ose dërgoje kontratën"
            >
              <Text style={styles.ndajTeksti}>Ndaje</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </>
  );
}

function Pala({
  ikona,
  roli,
  emri,
  pranoi,
}: {
  ikona: "home" | "shield";
  roli: string;
  emri: string;
  pranoi: string | null;
}) {
  return (
    <View style={styles.pala}>
      <UrezaIcon name={ikona} size={20} color={colors.mint} strokeWidth={2.2} />
      <Text style={styles.palaRoli}>{roli}</Text>
      <Text style={styles.palaEmri}>{emri}</Text>
      <Text style={styles.palaPranoi}>{pranoi ? `✓ pranoi ${dataMeOre(pranoi)}` : "pret pranimin"}</Text>
    </View>
  );
}

function Fakt({ ikona, tekst }: { ikona: "doc" | "warning" | "clock"; tekst: string }) {
  return (
    <View style={styles.fakt}>
      <UrezaIcon name={ikona} size={16} color={colors.teal} strokeWidth={2.2} />
      <Text style={[styles.teksti, styles.flex]}>{tekst}</Text>
    </View>
  );
}

function Seksioni({ numri, titulli, children }: { numri: string; titulli: string; children: ReactNode }) {
  return (
    <View style={styles.karta}>
      <View style={styles.seksionKrye}>
        <View style={styles.numri}>
          <Text style={styles.numriTeksti}>{numri}</Text>
        </View>
        <Text style={styles.titulli}>{titulli}</Text>
      </View>
      {children}
    </View>
  );
}

function Opsion({
  zgjedhur,
  onPress,
  emri,
  pershkrimi,
}: {
  zgjedhur: boolean;
  onPress: () => void;
  emri: string;
  pershkrimi: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.opsion, zgjedhur && styles.opsionZgjedhur]}
      accessibilityRole="radio"
      accessibilityState={{ selected: zgjedhur }}
      accessibilityLabel={`${emri}: ${pershkrimi}`}
    >
      <View style={[styles.radio, zgjedhur && styles.radioZgjedhur]}>{zgjedhur ? <View style={styles.radioPika} /> : null}</View>
      <View style={styles.flex}>
        <Text style={styles.opsionEmri}>{emri}</Text>
        <Text style={styles.opsionNen}>{pershkrimi}</Text>
      </View>
    </Pressable>
  );
}

function Chip({ zgjedhur, onPress, emri }: { zgjedhur: boolean; onPress: () => void; emri: string }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, zgjedhur && styles.chipZgjedhur]}
      accessibilityRole="radio"
      accessibilityState={{ selected: zgjedhur }}
    >
      <Text style={[styles.chipTeksti, zgjedhur && styles.chipTekstiZgjedhur]}>{emri}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  shtypur: { opacity: 0.85 },
  palet: { flexDirection: "row", alignItems: "stretch", gap: 8, backgroundColor: colors.hero, borderRadius: 22, padding: 14 },
  pala: { flex: 1, gap: 4, padding: 6 },
  palaRoli: { color: colors.mint, fontSize: 11, fontFamily: font.w800, letterSpacing: 1.2, marginTop: 4 },
  palaEmri: { color: colors.white, fontSize: 15, lineHeight: 20, fontFamily: font.w800 },
  palaPranoi: { color: colors.onHeroText, fontSize: 12, fontFamily: font.w600 },
  lidhja: { justifyContent: "center" },
  karta: { backgroundColor: colors.white, borderRadius: 20, padding: 16, gap: 10 },
  kicker: { color: colors.teal, fontSize: 12, fontFamily: font.w700, letterSpacing: 1.5 },
  titulli: { color: colors.ink, fontSize: 18, lineHeight: 24, fontFamily: font.w800, flexShrink: 1 },
  teksti: { color: colors.textSecondary, fontSize: 15, lineHeight: 21, fontFamily: font.w500 },
  permbledhje: { gap: 6, marginTop: 4, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#EDF2F5" },
  fakt: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  seksionKrye: { flexDirection: "row", alignItems: "center", gap: 10 },
  numri: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.petrol, alignItems: "center", justifyContent: "center" },
  numriTeksti: { color: colors.white, fontSize: 14, fontFamily: font.w800 },
  opsion: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#D3DEE4",
  },
  opsionZgjedhur: { borderColor: colors.petrol, backgroundColor: "#F2F8FA" },
  opsionEmri: { color: colors.ink, fontSize: 15, fontFamily: font.w800 },
  opsionNen: { color: colors.textSecondary, fontSize: 13, lineHeight: 18, fontFamily: font.w500 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.inputBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  radioZgjedhur: { borderColor: colors.petrol },
  radioPika: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.petrol },
  etiketa: { color: colors.ink, fontSize: 15, fontFamily: font.w700, marginTop: 2 },
  chipat: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.inputBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  chipZgjedhur: { backgroundColor: colors.petrol, borderColor: colors.petrol },
  chipTeksti: { color: colors.ink, fontSize: 14, fontFamily: font.w700 },
  chipTekstiZgjedhur: { color: colors.white },
  input: {
    minHeight: 52,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.inputBorder,
    borderRadius: 14,
    fontSize: 16,
    fontFamily: font.w500,
    color: colors.ink,
  },
  inputShume: { minHeight: 90 },
  inputFokus: { borderColor: colors.petrol },
  firmaKuti: { padding: 12, borderRadius: 14, backgroundColor: "#F7FAFB", borderWidth: 1, borderColor: "#E3EAF0" },
  firma: {
    color: colors.petrol,
    fontSize: 26,
    fontStyle: "italic",
    fontFamily: Platform.select({ ios: "Snell Roundhand", android: "cursive", default: "cursive" }),
  },
  firmaVija: { height: 1, backgroundColor: colors.inputBorder, marginVertical: 4 },
  imet: { color: colors.textSecondary, fontSize: 12, fontFamily: font.w600 },
  gabim: { color: colors.error, fontSize: 14, lineHeight: 20, fontFamily: font.w600 },
  primary: {
    minHeight: 56,
    borderRadius: 16,
    backgroundColor: colors.petrol,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 16,
  },
  primaryText: { color: colors.white, fontSize: 16, fontFamily: font.w800 },
  disabled: { opacity: 0.5 },
  sukses: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: "#E4F6EB",
  },
  suksesIkona: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#1E6B3E", alignItems: "center", justifyContent: "center" },
  suksesTitulli: { color: "#1E6B3E", fontSize: 16, fontFamily: font.w800 },
  ndaj: { minHeight: 40, paddingHorizontal: 14, borderRadius: 20, backgroundColor: colors.white, justifyContent: "center" },
  ndajTeksti: { color: "#1E6B3E", fontSize: 14, fontFamily: font.w800 },
});
