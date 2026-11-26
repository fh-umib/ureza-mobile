import { useRouter } from "expo-router";
import { useState, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { EkraniMeHero, useRevealOnFocus } from "@/components/EkraniMeHero";
import { UrezaIcon, type IconName } from "@/components/UrezaIcon";
import { Butoni } from "@/components/ui/Butoni";
import { GjendjaBosh } from "@/components/ui/GjendjaBosh";
import { useToast } from "@/components/ui/Toast";
import { colors, font, hija, rrezja } from "@/constants/ureza";
import { useVerifikimiIm } from "@/lib/admini";
import { LLOJET_E_MIKUT, useProfiliIPunes, type LlojiIMikut } from "@/lib/kontrata";
import { CMIMI_TEKST, PJESA_E_DEMIT } from "@/lib/kushtet";
import { useProfili } from "@/lib/profili";
import { gabimiITelefonit, pastroTelefonin, TELEFONI_MAX } from "@/lib/telefoni";

// A new Miku's first steps, from sign-up to the first visit: (1) who you are, (2) how you work,
// (3) what happens next. Every step is saved in the account as soon as it is done (name and phone
// in the profile, the work type in the work profile), so a Miku who leaves and comes back starts
// again at the first step that is still missing. Nothing here changes how that data is stored.

type Hapi = 1 | 2 | 3;
const HAPAT: { nr: Hapi; emri: string }[] = [
  { nr: 1, emri: "Ti" },
  { nr: 2, emri: "Puna" },
  { nr: 3, emri: "Më pas" },
];

export default function MikuFillimi() {
  const router = useRouter();
  const { profili, cilesimet } = useProfili();
  const puna = useProfiliIPunes();

  // the first step that is still missing, from what is saved
  const kaTeDhenat = (profili?.emri ?? "").trim().length >= 2 && (cilesimet.telefoni ?? "") !== "";
  const kaPunen = !!puna.profili?.lloji;
  const hapiIRuajtur: Hapi = !kaTeDhenat ? 1 : !kaPunen ? 2 : 3;

  // `null` follows what is saved; a tap on "Mbrapa" or "Vazhdo" pins a step
  const [zgjedhur, setZgjedhur] = useState<Hapi | null>(null);
  const hapi: Hapi = zgjedhur ?? hapiIRuajtur;

  const mbrapa =
    hapi === 1
      ? { etiketa: "Më vonë", onPress: () => (router.canGoBack() ? router.back() : router.replace("/miku")) }
      : { etiketa: "Mbrapa", onPress: () => setZgjedhur((hapi - 1) as Hapi) };

  const titujt: Record<Hapi, { titulli: string; nen: string }> = {
    1: { titulli: "Kush je ti?", nen: "Emrin e sheh klienti; telefonin vetëm ekipi i Urëzës." },
    2: { titulli: "Si punon?", nen: "Del në kontratën që pranon për çdo vizitë." },
    3: { titulli: "Çka ndodh më pas", nen: "Edhe pak dhe je gati për vizitën e parë." },
  };

  return (
    <EkraniMeHero
      kicker={`MIKU · HAPI ${hapi} NGA 3`}
      title={titujt[hapi].titulli}
      subtitle={titujt[hapi].nen}
      kthehu={mbrapa}
    >
      <TreguesiIHapave hapi={hapi} kryer={{ 1: kaTeDhenat, 2: kaPunen, 3: false }} />

      {hapi === 1 ? <HapiTeDhenat onVazhdo={() => setZgjedhur(2)} /> : null}
      {hapi === 2 ? <HapiPuna puna={puna} onVazhdo={() => setZgjedhur(3)} /> : null}
      {hapi === 3 ? <HapiMePas onGati={() => router.replace("/miku")} /> : null}
    </EkraniMeHero>
  );
}

// ---------------------------------------------------------------------------------------------
// The step indicator: three numbered dots joined by a line, the current one marked.

function TreguesiIHapave({ hapi, kryer }: { hapi: Hapi; kryer: Record<Hapi, boolean> }) {
  return (
    <View
      style={styles.tregues}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`Hapi ${hapi} nga 3: ${HAPAT[hapi - 1].emri}`}
      accessibilityValue={{ min: 1, max: 3, now: hapi }}
    >
      {HAPAT.map((h, i) => {
        const aktiv = h.nr === hapi;
        const bere = kryer[h.nr] && !aktiv;
        return (
          <View key={h.nr} style={styles.treguesHapi}>
            <View style={styles.treguesRresht}>
              <View style={[styles.treguesVija, i === 0 && styles.pa, (bere || aktiv) && styles.treguesVijaPlote]} />
              <View style={[styles.treguesPika, aktiv && styles.treguesPikaAktive, bere && styles.treguesPikaBere]}>
                {bere ? (
                  <UrezaIcon name="check" size={14} color={colors.white} strokeWidth={3} />
                ) : (
                  <Text style={[styles.treguesNumri, aktiv && styles.treguesNumriAktiv]}>{h.nr}</Text>
                )}
              </View>
              <View style={[styles.treguesVija, i === HAPAT.length - 1 && styles.pa, bere && styles.treguesVijaPlote]} />
            </View>
            <Text style={[styles.treguesEmri, aktiv && styles.treguesEmriAktiv]}>{h.emri}</Text>
          </View>
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------------------------
// Step 1: name and phone (saved with useProfili().ruajTeDhenat, the same as on Profili).

function HapiTeDhenat({ onVazhdo }: { onVazhdo: () => void }) {
  const { profili, cilesimet, ruajTeDhenat } = useProfili();
  const toast = useToast();
  const revealSoon = useRevealOnFocus();
  const [emri, setEmri] = useState(profili?.emri ?? "");
  const [telefoni, setTelefoni] = useState(cilesimet.telefoni ?? "");
  const [gabimEmri, setGabimEmri] = useState<string | null>(null);
  const [gabimTelefoni, setGabimTelefoni] = useState<string | null>(null);
  const [gabim, setGabim] = useState<string | null>(null);
  const [duke, setDuke] = useState(false);

  async function vazhdo() {
    if (duke) return;
    const e = emri.trim();
    const t = pastroTelefonin(telefoni);
    const gE = e.length < 2 ? "Shkruaj emrin dhe mbiemrin (të paktën 2 shkronja)." : null;
    // for a Miku the phone is needed: the team calls before verifying (only the admin sees it,
    // through mikut_per_adminin(); the client never does)
    const gT = t === "" ? "Shkruaj numrin e telefonit. Ekipi të thërret para verifikimit." : gabimiITelefonit(t);
    setGabimEmri(gE);
    setGabimTelefoni(gT);
    setGabim(null);
    if (gE || gT) return;

    const ndryshime: { emri?: string; telefoni?: string } = {};
    if (e !== profili?.emri) ndryshime.emri = e;
    if (t !== cilesimet.telefoni) ndryshime.telefoni = t;
    if (Object.keys(ndryshime).length > 0) {
      setDuke(true);
      const mesazh = await ruajTeDhenat(ndryshime);
      setDuke(false);
      if (mesazh) {
        setGabim(mesazh);
        return;
      }
      toast.sukses("Të dhënat u ruajtën.");
    }
    onVazhdo();
  }

  return (
    <View style={styles.karta}>
      <Fusha
        etiketa="Emri dhe mbiemri"
        ikona="user"
        vlera={emri}
        onNdrysho={(t) => {
          setEmri(t);
          if (gabimEmri) setGabimEmri(null);
        }}
        placeholder="p.sh. Arta Berisha"
        gabim={gabimEmri}
        onFocus={revealSoon}
        tipi="emri"
      />
      <Fusha
        etiketa="Telefoni"
        ikona="phone"
        vlera={telefoni}
        onNdrysho={(t) => {
          setTelefoni(t);
          if (gabimTelefoni) setGabimTelefoni(null);
        }}
        placeholder="+383 44 000 000"
        gabim={gabimTelefoni}
        ndihme="Vetëm ekipi i Urëzës e sheh, që të të thërrasë para verifikimit."
        onFocus={revealSoon}
        tipi="telefoni"
      />
      {gabim ? <Text style={styles.gabim}>{gabim}</Text> : null}
      <Butoni etiketa="Vazhdo" ikona="arrow" onPress={vazhdo} duke={duke} />
    </View>
  );
}

function Fusha({
  etiketa,
  ikona,
  vlera,
  onNdrysho,
  placeholder,
  gabim,
  ndihme,
  onFocus,
  tipi,
}: {
  etiketa: string;
  ikona: IconName;
  vlera: string;
  onNdrysho: (t: string) => void;
  placeholder: string;
  gabim?: string | null;
  ndihme?: string;
  onFocus: () => void;
  tipi: "emri" | "telefoni" | "tekst" | "numer";
}) {
  const [fokus, setFokus] = useState(false);
  return (
    <View style={styles.fusha}>
      <Text style={styles.label}>{etiketa}</Text>
      <View>
        <View style={styles.fushaIkona} pointerEvents="none">
          <UrezaIcon name={ikona} size={22} color={colors.textSecondary} />
        </View>
        <TextInput
          style={[styles.input, fokus && styles.inputFokus, gabim ? styles.inputGabim : null]}
          value={vlera}
          onChangeText={onNdrysho}
          onFocus={() => {
            setFokus(true);
            onFocus();
          }}
          onBlur={() => setFokus(false)}
          placeholder={placeholder}
          placeholderTextColor={colors.inputBorder}
          maxLength={tipi === "telefoni" ? TELEFONI_MAX + 8 : tipi === "numer" ? 12 : 80}
          keyboardType={tipi === "telefoni" ? "phone-pad" : tipi === "numer" ? "number-pad" : "default"}
          autoCapitalize={tipi === "emri" ? "words" : "sentences"}
          autoComplete={tipi === "emri" ? "name" : tipi === "telefoni" ? "tel" : "off"}
          accessibilityLabel={etiketa}
        />
      </View>
      {gabim ? <Text style={styles.gabim}>{gabim}</Text> : ndihme ? <Text style={styles.ndihme}>{ndihme}</Text> : null}
    </View>
  );
}

// ---------------------------------------------------------------------------------------------
// Step 2: how the Miku works (saved with useProfiliIPunes().ruaj, as on Profili).

function HapiPuna({
  puna,
  onVazhdo,
}: {
  puna: ReturnType<typeof useProfiliIPunes>;
  onVazhdo: () => void;
}) {
  const toast = useToast();
  const revealSoon = useRevealOnFocus();
  const [lloji, setLloji] = useState<LlojiIMikut | null>(puna.profili?.lloji ?? null);
  const [biznesi, setBiznesi] = useState(puna.profili?.biznesi ?? "");
  const [nrb, setNrb] = useState(puna.profili?.nrb ?? "");
  const [gabim, setGabim] = useState<string | null>(null);
  const [duke, setDuke] = useState(false);

  // the saved profile arrived after the first render: the form starts from it
  const [ngarkuar, setNgarkuar] = useState(puna.profili);
  if (ngarkuar !== puna.profili) {
    setNgarkuar(puna.profili);
    if (puna.profili) {
      setLloji(puna.profili.lloji);
      setBiznesi(puna.profili.biznesi ?? "");
      setNrb(puna.profili.nrb ?? "");
    }
  }

  // `gati` is false both while it loads and when supabase/besimi.sql has not been run, so the
  // Miku is never stuck here: they can go on and fill it in later on Profili
  if (!puna.gati) {
    return (
      <GjendjaBosh
        ikona="clock"
        titulli="Profili i punës po ngarkohet"
        teksti="Nëse kjo zgjat, vazhdo dhe plotësoje më vonë te Profili, te “Si punon si Miku”."
        veprimi={{ etiketa: "Vazhdo", onPress: onVazhdo }}
      />
    );
  }

  async function vazhdo() {
    if (duke) return;
    if (!lloji) {
      setGabim("Zgjidh si punon.");
      return;
    }
    const emriBiznesit = biznesi.trim();
    const numri = nrb.replace(/\s+/g, "");
    if (lloji === "kompani" && (emriBiznesit.length < 2 || !/^[0-9]{6,12}$/.test(numri))) {
      setGabim("Për kompani shkruaj emrin e biznesit dhe numrin e biznesit (6–12 shifra).");
      return;
    }
    setDuke(true);
    setGabim(null);
    const mesazh = await puna.ruaj({
      lloji,
      biznesi: lloji === "kompani" || lloji === "mjeshter" ? emriBiznesit || null : null,
      nrb: lloji === "kompani" ? numri : null,
    });
    setDuke(false);
    if (mesazh) {
      setGabim(mesazh);
      return;
    }
    toast.sukses("U ruajt. Del në çdo kontratë që pranon.");
    onVazhdo();
  }

  return (
    <View style={styles.karta}>
      <View style={styles.rrjeta}>
        {LLOJET_E_MIKUT.map((l) => {
          const zgjedhur = l.vlera === lloji;
          return (
            <Pressable
              key={l.vlera}
              onPress={() => {
                setLloji(l.vlera);
                setGabim(null);
              }}
              style={({ pressed }) => [styles.lloji, zgjedhur && styles.llojiZgjedhur, pressed && styles.shtypur]}
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
            ikona="houses"
            vlera={biznesi}
            onNdrysho={setBiznesi}
            placeholder="p.sh. Shtëpia e Sigurt Sh.p.k."
            onFocus={revealSoon}
            tipi="tekst"
          />
          <Fusha
            etiketa="Numri i biznesit (ARBK)"
            ikona="doc"
            vlera={nrb}
            onNdrysho={setNrb}
            placeholder="p.sh. 810000000"
            onFocus={revealSoon}
            tipi="numer"
          />
        </>
      ) : null}
      {lloji === "mjeshter" ? (
        <Fusha
          etiketa="Zanati (opsional)"
          ikona="key"
          vlera={biznesi}
          onNdrysho={setBiznesi}
          placeholder="p.sh. elektricist, hidraulik"
          onFocus={revealSoon}
          tipi="tekst"
        />
      ) : null}

      {gabim ? <Text style={styles.gabim}>{gabim}</Text> : null}
      <Butoni etiketa="Vazhdo" ikona="arrow" onPress={vazhdo} duke={duke} joAktiv={!lloji} />
    </View>
  );
}

// ---------------------------------------------------------------------------------------------
// Step 3: what happens next: verification by the team, a contract for every visit, the terms.

function HapiMePas({ onGati }: { onGati: () => void }) {
  const router = useRouter();
  const verifikimi = useVerifikimiIm();
  const verifikuar = verifikimi.njohur && verifikimi.verifikuarAt !== null;

  return (
    <>
      <View style={styles.karta}>
        <RreshtiPas
          ikona={verifikuar ? "shield" : "clock"}
          ngjyra={verifikuar ? colors.ok : colors.kujdes}
          sfondi={verifikuar ? colors.okBg : colors.kujdesBg}
          titulli={verifikuar ? "Je i verifikuar" : "Ekipi të verifikon"}
          teksti={
            verifikuar
              ? "Kërkesat e reja të klientëve i sheh dhe i pranon që tani."
              : "Të thërrasim në telefon dhe të verifikojmë. Deri atëherë kërkesat e reja nuk duken."
          }
        />
        <RreshtiPas
          ikona="doc"
          ngjyra={colors.petrol}
          sfondi={colors.ikonaBg}
          titulli="Kontratë për çdo vizitë"
          teksti={`${CMIMI_TEKST} për vizitën e kryer. Për dëm nga pakujdesia paguan ${PJESA_E_DEMIT}% të vlerës. E pranon para se ta marrësh vizitën.`}
        />
        <RreshtiPas
          ikona="check"
          ngjyra={colors.teal}
          sfondi={colors.ikonaBg}
          titulli="Dëshmi në çdo vizitë"
          teksti="GPS, foto nga kamera dhe një shënim zanor. Pa to raporti nuk dërgohet."
          fundit
        />
      </View>

      <Pressable
        style={({ pressed }) => [styles.kushtet, pressed && styles.shtypur]}
        onPress={() => router.push("/kushtet")}
        accessibilityRole="link"
        accessibilityLabel="Lexo kushtet dhe kontratën"
      >
        <UrezaIcon name="book" size={20} color={colors.petrol} strokeWidth={2.2} />
        <Text style={styles.kushtetTeksti}>Lexo kushtet dhe kontratën</Text>
        <UrezaIcon name="chevron" size={18} color={colors.petrol} strokeWidth={2.4} />
      </Pressable>

      <Butoni etiketa="Shko te Kërkesat" ikona="arrow" onPress={onGati} />
    </>
  );
}

function RreshtiPas({
  ikona,
  ngjyra,
  sfondi,
  titulli,
  teksti,
  fundit,
}: {
  ikona: IconName;
  ngjyra: string;
  sfondi: string;
  titulli: string;
  teksti: string;
  fundit?: boolean;
}): ReactNode {
  return (
    <View style={[styles.pas, !fundit && styles.ndarje]} accessible accessibilityLabel={`${titulli}. ${teksti}`}>
      <View style={[styles.pasIkona, { backgroundColor: sfondi }]}>
        <UrezaIcon name={ikona} size={20} color={ngjyra} strokeWidth={2.3} />
      </View>
      <View style={styles.flex}>
        <Text style={styles.pasTitulli}>{titulli}</Text>
        <Text style={styles.ndihme}>{teksti}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  pa: { backgroundColor: "transparent" },
  shtypur: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  karta: { backgroundColor: colors.white, borderRadius: rrezja.karta, padding: 18, gap: 14, ...hija.karta },

  // step indicator
  tregues: { flexDirection: "row" },
  treguesHapi: { flex: 1, alignItems: "center", gap: 6 },
  treguesRresht: { flexDirection: "row", alignItems: "center", width: "100%" },
  treguesVija: { flex: 1, height: 2, backgroundColor: colors.line },
  treguesVijaPlote: { backgroundColor: colors.petrol },
  treguesPika: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: colors.inputBorder,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  treguesPikaAktive: { borderColor: colors.petrol, borderWidth: 3 },
  treguesPikaBere: { backgroundColor: colors.petrol, borderColor: colors.petrol },
  treguesNumri: { color: colors.textSecondary, fontSize: 13, fontFamily: font.w700 },
  treguesNumriAktiv: { color: colors.petrol, fontFamily: font.w800 },
  treguesEmri: { color: colors.textSecondary, fontSize: 13, fontFamily: font.w600 },
  treguesEmriAktiv: { color: colors.petrol, fontFamily: font.w800 },

  // fields
  fusha: { gap: 6 },
  label: { color: colors.ink, fontSize: 15, lineHeight: 20, fontFamily: font.w700 },
  fushaIkona: { position: "absolute", left: 16, top: 17, zIndex: 1 },
  input: {
    height: 56,
    paddingLeft: 48,
    paddingRight: 16,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.inputBorder,
    borderRadius: 14,
    fontSize: 16,
    fontFamily: font.w500,
    color: colors.ink,
  },
  inputFokus: { borderColor: colors.petrol },
  inputGabim: { borderColor: colors.error },
  gabim: { color: colors.error, fontSize: 14, lineHeight: 20, fontFamily: font.w600 },
  ndihme: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, fontFamily: font.w500 },

  // work type
  rrjeta: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  lloji: {
    width: "47%",
    flexGrow: 1,
    minHeight: 120,
    padding: 12,
    gap: 4,
    borderRadius: rrezja.kartaVogel,
    borderWidth: 2,
    borderColor: colors.line,
    backgroundColor: colors.white,
  },
  llojiZgjedhur: { borderColor: colors.petrol, backgroundColor: colors.background },
  llojiIkona: {
    width: 38,
    height: 38,
    borderRadius: rrezja.ikona,
    backgroundColor: colors.ikonaBg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  llojiIkonaZgjedhur: { backgroundColor: colors.petrol },
  llojiEmri: { color: colors.ink, fontSize: 16, fontFamily: font.w800 },
  llojiPershkrimi: { color: colors.textSecondary, fontSize: 12, lineHeight: 16, fontFamily: font.w500 },

  // what happens next
  pas: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingVertical: 4 },
  ndarje: { paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.background },
  pasIkona: {
    width: 40,
    height: 40,
    borderRadius: rrezja.ikona,
    alignItems: "center",
    justifyContent: "center",
  },
  pasTitulli: { color: colors.ink, fontSize: 16, lineHeight: 22, fontFamily: font.w800 },
  kushtet: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    borderRadius: rrezja.butoni,
    backgroundColor: colors.ikonaBg,
  },
  kushtetTeksti: { flex: 1, color: colors.petrol, fontSize: 16, fontFamily: font.w800 },
});
