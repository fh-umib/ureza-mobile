import { useRouter } from "expo-router";
import { useState, type ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

import { EkraniMeHero, useRevealOnFocus } from "@/components/EkraniMeHero";
import { FletaModale } from "@/components/FletaModale";
import { KartaEProfilitTePunes } from "@/components/ProfiliIPunes";
import { RreshtiNdezes } from "@/components/RreshtiNdezes";
import { UrezaIcon, type IconName } from "@/components/UrezaIcon";
import { useToast } from "@/components/ui/Toast";
import { colors } from "@/constants/ureza";
import { useVerifikimiIm } from "@/lib/admini";
import { useDhenat } from "@/lib/dhenat";
import { mbledhTeDhenat, ndajTeDhenat } from "@/lib/eksporti";
import { hapatEProfilit, plotesimi } from "@/lib/plotesimi";
import { EMRAT_E_ROLEVE, GJUHET, useProfili, type Gjuha, type Ndryshimet } from "@/lib/profili";
import { dil, useSesioni } from "@/lib/sesioni";
import { gabimiITelefonit, pastroTelefonin, TELEFONI_MAX } from "@/lib/telefoni";
import { dataMeOre } from "@/lib/vizitat";

// "Profili im" (design: Profili): the completeness of the profile, the personal data, the
// notification choices, privacy (download the data, ask for the account to be deleted) and sign out.
// The settings are saved in the account (supabase/profili.sql); until that file is run they stay on
// the phone, and the screen says so.

export default function Profili() {
  const { profili, rifresko } = useProfili();
  const roli = profili?.roli ?? "klient";

  return (
    <EkraniMeHero kicker="LLOGARIA" title="Profili im" subtitle="Të dhënat dhe cilësimet e tua.">
      {profili ? (
        <>
          <KokaEProfilit />
          <KartaEPlotesimit />
          <KartaETeDhenave />
          {roli === "klient" ? <KartaENjoftimeve /> : null}
          {roli === "miku" ? <KartaEProfilitTePunes /> : null}
          <KartaEPrivatesise />
        </>
      ) : (
        <KartaPaProfil onProvo={() => void rifresko()} />
      )}

      <DilButon />
    </EkraniMeHero>
  );
}

// ---------------------------------------------------------------------------------------------
// Header and completeness

function inicialet(emri: string | null | undefined, email: string | null | undefined): string {
  const fjalet = (emri ?? "").trim().split(/\s+/).filter(Boolean);
  if (fjalet.length >= 2) return (fjalet[0].charAt(0) + fjalet[1].charAt(0)).toUpperCase();
  if (fjalet.length === 1) return fjalet[0].charAt(0).toUpperCase();
  return (email ?? "?").charAt(0).toUpperCase();
}

const ROLET: Record<"klient" | "miku" | "admin", { ikona: IconName; bg: string; fg: string }> = {
  klient: { ikona: "user", bg: colors.ikonaBg, fg: colors.petrol },
  miku: { ikona: "compass", bg: colors.ikonaBg, fg: colors.teal },
  admin: { ikona: "key", bg: colors.kujdesBg, fg: colors.kujdes },
};

// The top of Profili: a round badge with the initials, the name and email, the role, and for a
// Miku whom the Urëza team has verified, "I verifikuar".
function KokaEProfilit() {
  const { perdoruesi } = useSesioni();
  const { profili } = useProfili();
  const verifikimi = useVerifikimiIm();
  const roli = profili?.roli ?? "klient";
  const r = ROLET[roli];
  const eVerifikuar = roli === "miku" && verifikimi.njohur && verifikimi.verifikuarAt !== null;

  return (
    <View style={[styles.karta, styles.koka]}>
      <View style={styles.avatar} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Text style={styles.avatarText}>{inicialet(profili?.emri, perdoruesi?.email)}</Text>
      </View>
      <View style={styles.kryeTekst}>
        <Text style={styles.emri} numberOfLines={1} accessibilityRole="header">
          {profili?.emri ?? perdoruesi?.email}
        </Text>
        <Text style={styles.email} numberOfLines={1}>
          {perdoruesi?.email}
        </Text>
        <View style={styles.distinktivet}>
          <View style={[styles.distinktiv, { backgroundColor: r.bg }]} accessible accessibilityLabel={`Roli: ${EMRAT_E_ROLEVE[roli]}`}>
            <UrezaIcon name={r.ikona} size={14} color={r.fg} strokeWidth={2.4} />
            <Text style={[styles.distinktivText, { color: r.fg }]}>{EMRAT_E_ROLEVE[roli]}</Text>
          </View>
          {eVerifikuar ? (
            <View style={[styles.distinktiv, { backgroundColor: colors.okBg }]} accessible accessibilityLabel="I verifikuar nga ekipi i Urëzës">
              <UrezaIcon name="shield" size={14} color={colors.ok} strokeWidth={2.4} />
              <Text style={[styles.distinktivText, { color: colors.ok }]}>I verifikuar</Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function KartaEPlotesimit() {
  const router = useRouter();
  const { perdoruesi } = useSesioni();
  const { profili, cilesimet } = useProfili();
  const { pronat } = useDhenat();
  const roli = profili?.roli ?? "klient";

  const hapat = hapatEProfilit({
    roli,
    emri: profili?.emri ?? null,
    email: perdoruesi?.email ?? null,
    telefoni: cilesimet.telefoni,
    ka_prona: pronat.length > 0,
    ka_vendndodhje: pronat.some((p) => p.koordinatat !== null),
  });
  const p = plotesimi(hapat);

  const mungojne = hapat.filter((h) => !h.kryer);

  return (
    <View style={[styles.karta, styles.hije]}>
      <View style={styles.progresi}>
        <UnazaEProgresit perqindja={p.perqindja} />
        <View style={styles.kryeTekst}>
          <Text style={styles.progresiTitulli}>
            {p.perqindja === 100 ? "Profili është i plotë" : "Plotëso profilin"}
          </Text>
          <Text style={styles.ndihme}>
            {p.kryer} nga {p.total} hapa të kryer.{p.perqindja === 100 ? " Faleminderit." : ""}
          </Text>
        </View>
      </View>

      {mungojne.length > 0 ? (
        <View>
          {mungojne.map((h) => {
            const shko = SHKO_TE_HAPI[h.etiketa];
            return (
              <Rreshti
                key={h.etiketa}
                ikona={shko?.ikona ?? "plus"}
                titulli={h.etiketa}
                nentitulli={shko ? h.keshille : `${h.keshille} Më poshtë, te Të dhënat.`}
                onPress={shko ? () => router.navigate(shko.faqja) : undefined}
              />
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

// the steps that are filled on another screen; the others are in the form below
const SHKO_TE_HAPI: Record<string, { faqja: "/pronat" | "/harta"; ikona: IconName }> = {
  Prona: { faqja: "/pronat", ikona: "houses" },
  "Vendndodhja e pronës": { faqja: "/harta", ikona: "pin" },
};

// The percentage as a ring (react-native-svg): a light track and a teal arc from the top.
function UnazaEProgresit({ perqindja }: { perqindja: number }) {
  const madhesia = 76;
  const trashesia = 8;
  const r = (madhesia - trashesia) / 2;
  const perimetri = 2 * Math.PI * r;
  return (
    <View
      style={{ width: madhesia, height: madhesia }}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`Profili është ${perqindja}% i plotë`}
      accessibilityValue={{ min: 0, max: 100, now: perqindja }}
    >
      <Svg width={madhesia} height={madhesia}>
        <Circle cx={madhesia / 2} cy={madhesia / 2} r={r} stroke={colors.line} strokeWidth={trashesia} fill="none" />
        <Circle
          cx={madhesia / 2}
          cy={madhesia / 2}
          r={r}
          stroke={colors.teal}
          strokeWidth={trashesia}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${perimetri} ${perimetri}`}
          strokeDashoffset={perimetri * (1 - perqindja / 100)}
          transform={`rotate(-90 ${madhesia / 2} ${madhesia / 2})`}
        />
      </Svg>
      <View style={styles.unazaMes} pointerEvents="none">
        <Text style={styles.unazaNumri}>{perqindja}%</Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------------------------
// Rows and group titles: every row has an icon on the left and the text; a row that opens
// something has an arrow on the right.

function TitulliIGrupit({ ikona, titulli }: { ikona: IconName; titulli: string }) {
  return (
    <View style={styles.grupiKrye}>
      <View style={styles.grupiIkona}>
        <UrezaIcon name={ikona} size={20} color={colors.petrol} strokeWidth={2.2} />
      </View>
      <Text style={styles.titulli} accessibilityRole="header">
        {titulli}
      </Text>
    </View>
  );
}

function Rreshti({
  ikona,
  titulli,
  nentitulli,
  ngjyra = colors.ink,
  djathtas,
  duke = false,
  onPress,
}: {
  ikona: IconName;
  titulli: string;
  nentitulli?: string;
  ngjyra?: string;
  djathtas?: ReactNode; // shown instead of the arrow, e.g. a small chip
  duke?: boolean;
  onPress?: () => void;
}) {
  const brenda = (
    <>
      <View style={styles.rreshtiIkona}>
        <UrezaIcon name={ikona} size={20} color={ngjyra === colors.ink ? colors.petrol : ngjyra} strokeWidth={2.2} />
      </View>
      <View style={styles.lidhjaTekst}>
        <Text style={[styles.rreshtiTitulli, { color: ngjyra }]}>{titulli}</Text>
        {nentitulli ? <Text style={styles.ndihme}>{nentitulli}</Text> : null}
      </View>
      {duke ? (
        <ActivityIndicator color={colors.petrol} />
      ) : (
        djathtas ?? (onPress ? <UrezaIcon name="chevron" size={20} color={colors.petrol} strokeWidth={2.4} /> : null)
      )}
    </>
  );
  if (!onPress) {
    return (
      <View style={styles.rreshti} accessible accessibilityLabel={nentitulli ? `${titulli}. ${nentitulli}` : titulli}>
        {brenda}
      </View>
    );
  }
  return (
    <Pressable
      style={({ pressed }) => [styles.rreshti, (duke || pressed) && styles.shtypur]}
      onPress={onPress}
      disabled={duke}
      accessibilityRole="button"
      accessibilityLabel={titulli}
      accessibilityHint={nentitulli}
    >
      {brenda}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------------------------
// Personal data

type Statusi = { gabim: string } | null;

function KartaETeDhenave() {
  const router = useRouter();
  const { perdoruesi } = useSesioni();
  const { profili, burimi, cilesimet, cilesimetNeLlogari, ruajTeDhenat } = useProfili();
  const toast = useToast();
  const revealSoon = useRevealOnFocus();

  const emriRuajtur = profili?.emri ?? "";
  const telefoniRuajtur = cilesimet.telefoni ?? "";
  const gjuhaRuajtur = cilesimet.gjuha;

  const [emri, setEmri] = useState(emriRuajtur);
  const [telefoni, setTelefoni] = useState(telefoniRuajtur);
  const [gjuha, setGjuha] = useState<Gjuha>(gjuhaRuajtur);
  const [fokus, setFokus] = useState<"emri" | "telefoni" | null>(null);
  const [gabimEmri, setGabimEmri] = useState<string | null>(null);
  const [gabimTelefoni, setGabimTelefoni] = useState<string | null>(null);
  const [duke, setDuke] = useState(false);
  const [statusi, setStatusi] = useState<Statusi>(null);

  // what is saved changed (the profile arrived, or the save worked): the form shows it.
  // Adjusted while rendering (not in an effect), so the old value never shows for a frame.
  const [ruajturParaprak, setRuajturParaprak] = useState({ emri: emriRuajtur, telefoni: telefoniRuajtur, gjuha: gjuhaRuajtur });
  if (
    ruajturParaprak.emri !== emriRuajtur ||
    ruajturParaprak.telefoni !== telefoniRuajtur ||
    ruajturParaprak.gjuha !== gjuhaRuajtur
  ) {
    if (ruajturParaprak.emri !== emriRuajtur) setEmri(emriRuajtur);
    if (ruajturParaprak.telefoni !== telefoniRuajtur) setTelefoni(telefoniRuajtur);
    if (ruajturParaprak.gjuha !== gjuhaRuajtur) setGjuha(gjuhaRuajtur);
    setRuajturParaprak({ emri: emriRuajtur, telefoni: telefoniRuajtur, gjuha: gjuhaRuajtur });
  }

  const eNdryshuar =
    emri.trim() !== emriRuajtur || pastroTelefonin(telefoni) !== telefoniRuajtur || gjuha !== gjuhaRuajtur;

  async function ruaj() {
    if (duke) return;
    const emriIPastruar = emri.trim();
    const gEmri = emriIPastruar.length < 2 ? "Shkruaj emrin tënd (të paktën 2 shkronja)." : null;
    const gTelefoni = gabimiITelefonit(telefoni);
    setGabimEmri(gEmri);
    setGabimTelefoni(gTelefoni);
    setStatusi(null);
    if (gEmri || gTelefoni) return;

    const n: Ndryshimet = {};
    if (emriIPastruar !== emriRuajtur) n.emri = emriIPastruar;
    const telefoniIPastruar = pastroTelefonin(telefoni);
    if (telefoniIPastruar !== telefoniRuajtur) n.telefoni = telefoniIPastruar === "" ? null : telefoniIPastruar;
    if (gjuha !== gjuhaRuajtur) n.gjuha = gjuha;

    setDuke(true);
    const gabim = await ruajTeDhenat(n);
    setDuke(false);
    setStatusi(gabim ? { gabim } : null);
    if (!gabim) toast.sukses("Ndryshimet u ruajtën.");
  }

  return (
    <View style={[styles.karta, styles.hije]}>
      <TitulliIGrupit ikona="user" titulli="Të dhënat" />

      {!cilesimetNeLlogari ? (
        <View style={styles.shenim}>
          <UrezaIcon name="warning" size={20} color={colors.petrol} />
          <Text style={styles.shenimText}>
            {burimi === "demo"
              ? "Tabela e profileve nuk është krijuar ende, ndaj të dhënat ruhen vetëm në këtë telefon."
              : "Telefoni, gjuha dhe njoftimet ruhen vetëm në këtë telefon, sepse supabase/profili.sql nuk është ekzekutuar ende në Supabase."}
          </Text>
        </View>
      ) : null}

      <View style={styles.forma}>
        <View style={styles.fusha}>
          <Text style={styles.label}>Emri dhe mbiemri</Text>
          <View>
            <View style={styles.ikona} pointerEvents="none">
              <UrezaIcon name="user" size={22} color={colors.textSecondary} />
            </View>
            <TextInput
              style={[styles.input, fokus === "emri" && styles.inputFokus, gabimEmri ? styles.inputGabim : null]}
              value={emri}
              onChangeText={(t) => {
                setEmri(t);
                setStatusi(null);
                if (gabimEmri) setGabimEmri(null);
              }}
              onFocus={() => {
                setFokus("emri");
                revealSoon();
              }}
              onBlur={() => setFokus(null)}
              placeholder="p.sh. Flutura Hyseni"
              placeholderTextColor="#8FA3AC"
              maxLength={40}
              autoCapitalize="words"
              autoComplete="name"
              textContentType="name"
              accessibilityLabel="Emri dhe mbiemri"
            />
          </View>
          {gabimEmri ? <Text style={styles.gabim}>{gabimEmri}</Text> : null}
        </View>

        <View style={styles.fusha}>
          <Text style={styles.label}>Email</Text>
          <View>
            <View style={styles.ikona} pointerEvents="none">
              <UrezaIcon name="mail" size={22} color={colors.textSecondary} />
            </View>
            <View
              style={[styles.input, styles.inputPaNdryshim]}
              accessible
              accessibilityLabel={`Email: ${perdoruesi?.email ?? ""}`}
            >
              <Text style={styles.inputPaNdryshimText} numberOfLines={1}>
                {perdoruesi?.email}
              </Text>
            </View>
          </View>
          <Text style={styles.ndihme}>
            Me këtë email hyn në llogari. Ndryshimi i tij nuk bëhet ende nga aplikacioni.
          </Text>
        </View>

        <View style={styles.fusha}>
          <Text style={styles.label}>Telefoni</Text>
          <View>
            <View style={styles.ikona} pointerEvents="none">
              <UrezaIcon name="phone" size={22} color={colors.textSecondary} />
            </View>
            <TextInput
              style={[
                styles.input,
                fokus === "telefoni" && styles.inputFokus,
                gabimTelefoni ? styles.inputGabim : null,
              ]}
              value={telefoni}
              onChangeText={(t) => {
                setTelefoni(t);
                setStatusi(null);
                if (gabimTelefoni) setGabimTelefoni(null);
              }}
              onFocus={() => {
                setFokus("telefoni");
                revealSoon();
              }}
              onBlur={() => {
                setFokus(null);
                setGabimTelefoni(gabimiITelefonit(telefoni));
              }}
              placeholder="+383 44 000 000"
              placeholderTextColor="#8FA3AC"
              maxLength={TELEFONI_MAX + 8}
              keyboardType="phone-pad"
              autoComplete="tel"
              textContentType="telephoneNumber"
              accessibilityLabel="Telefoni"
            />
          </View>
          {gabimTelefoni ? (
            <Text style={styles.gabim}>{gabimTelefoni}</Text>
          ) : (
            <Text style={styles.ndihme}>Për njoftimet kur Miku vjen te prona. Nuk është e detyrueshme.</Text>
          )}
        </View>

        <View style={styles.fusha}>
          <Text style={styles.label} nativeID="gjuha-etiketa">
            Gjuha e raporteve
          </Text>
          <View style={styles.zgjedhesi}>
            <View pointerEvents="none">
              <UrezaIcon name="globe" size={22} color={colors.textSecondary} />
            </View>
            {GJUHET.map((g) => {
              const aktive = g.kodi === gjuha;
              return (
                <Pressable
                  key={g.kodi}
                  style={[styles.gjuha, aktive && styles.gjuhaAktive]}
                  onPress={() => {
                    setGjuha(g.kodi);
                    setStatusi(null);
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: aktive }}
                  aria-checked={aktive}
                  accessibilityLabel={g.emri}
                >
                  <Text style={[styles.gjuhaText, aktive && styles.gjuhaTextAktive]}>{g.emri}</Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.ndihme}>Raportet shkruhen shqip. Përkthimi vjen më vonë; zgjedhja jote ruhet.</Text>
        </View>

        <Pressable
          style={[styles.primary, (!eNdryshuar || duke) && styles.disabled]}
          onPress={ruaj}
          disabled={!eNdryshuar || duke}
          accessibilityRole="button"
          accessibilityLabel="Ruaj ndryshimet"
          accessibilityState={{ disabled: !eNdryshuar || duke }}
        >
          {duke ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <Text style={styles.primaryText}>Ruaj ndryshimet</Text>
              <UrezaIcon name="check" size={22} color={colors.white} strokeWidth={2.3} />
            </>
          )}
        </Pressable>

        {statusi && "gabim" in statusi ? <Text style={styles.gabim}>{statusi.gabim}</Text> : null}
      </View>

      {profili && profili.roli !== "admin" ? (
        <Rreshti
          ikona="sparkle"
          titulli="Ndrysho rolin"
          nentitulli={`${profili.roli === "klient" ? "Provo aplikacionin si Miku" : "Provo aplikacionin si Klient"} me të njëjtën llogari (prototip).${burimi === "demo" ? " Roli ruhet vetëm në këtë telefon." : ""}`}
          onPress={() => router.push("/roli")}
        />
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------------------------
// Notifications

type FushaENjoftimit = "njoftoPranimin" | "njoftoRaportin" | "njoftoKujtesen";

// A switch that is saved at once: it flips right away and goes back when the save fails.
function NdezesIRuajtur({
  ikona,
  titulli,
  nentitulli,
  fusha,
  onGabim,
}: {
  ikona: IconName;
  titulli: string;
  nentitulli: string;
  fusha: FushaENjoftimit;
  onGabim: (mesazh: string | null) => void;
}) {
  const { cilesimet, ruajTeDhenat } = useProfili();
  const [pritje, setPritje] = useState<boolean | null>(null);
  const vlera = pritje ?? cilesimet[fusha];

  async function ndrysho(i_ri: boolean) {
    setPritje(i_ri);
    onGabim(null);
    const n: Ndryshimet = {};
    n[fusha] = i_ri;
    const gabim = await ruajTeDhenat(n);
    setPritje(null);
    if (gabim) onGabim(gabim);
  }

  return <RreshtiNdezes ikona={ikona} titulli={titulli} nentitulli={nentitulli} vlera={vlera} onNdrysho={ndrysho} />;
}

function KartaENjoftimeve() {
  const [gabim, setGabim] = useState<string | null>(null);
  return (
    <View style={[styles.karta, styles.hije]}>
      <TitulliIGrupit ikona="bell" titulli="Njoftimet" />
      <Text style={styles.ndihme}>Njoftimet nuk dërgohen ende. Zgjedhjet ruhen që të punojnë kur të aktivizohen.</Text>
      <View style={styles.listaNdezesish}>
        <NdezesIRuajtur
          ikona="check"
          titulli="Kur Miku e pranon detyrën"
          nentitulli="Njoftim menjëherë."
          fusha="njoftoPranimin"
          onGabim={setGabim}
        />
        <NdezesIRuajtur
          ikona="doc"
          titulli="Kur raporti është gati"
          nentitulli="Pas çdo vizite."
          fusha="njoftoRaportin"
          onGabim={setGabim}
        />
        <NdezesIRuajtur
          ikona="clock"
          titulli="Kujtesë para vizitës"
          nentitulli="Një ditë më parë."
          fusha="njoftoKujtesen"
          onGabim={setGabim}
        />
      </View>
      {gabim ? <Text style={styles.gabim}>{gabim}</Text> : null}
    </View>
  );
}

// ---------------------------------------------------------------------------------------------
// Privacy

function KartaEPrivatesise() {
  const router = useRouter();
  const { perdoruesi } = useSesioni();
  const { profili, fshirjaKerkuar, kerkoFshirjen } = useProfili();
  const roli = profili?.roli ?? "klient";
  const [duke, setDuke] = useState(false);
  const [gabimShkarkimi, setGabimShkarkimi] = useState<string | null>(null);
  const [konfirmim, setKonfirmim] = useState(false);
  const [dukeFshirja, setDukeFshirja] = useState(false);
  const [gabimFshirja, setGabimFshirja] = useState<string | null>(null);

  async function shkarko() {
    if (duke || !perdoruesi) return;
    setDuke(true);
    setGabimShkarkimi(null);
    const r = await mbledhTeDhenat({ id: perdoruesi.id, email: perdoruesi.email ?? null });
    if (!r.ok) {
      setDuke(false);
      setGabimShkarkimi(r.mesazh);
      return;
    }
    const gabim = await ndajTeDhenat(r.tekst);
    setDuke(false);
    if (gabim) setGabimShkarkimi(gabim);
  }

  async function dergoKerkesen(kerkuar: boolean) {
    if (dukeFshirja) return;
    setDukeFshirja(true);
    setGabimFshirja(null);
    const gabim = await kerkoFshirjen(kerkuar);
    setDukeFshirja(false);
    if (gabim) {
      setGabimFshirja(gabim);
      return;
    }
    setKonfirmim(false);
  }

  return (
    <View style={[styles.karta, styles.hije]}>
      <TitulliIGrupit ikona="shield" titulli="Privatësia dhe pëlqimi" />

      <View>
        {roli === "klient" ? (
          <Rreshti
            ikona="doc"
            titulli="Kushtet e vizitës dhe pëlqimi"
            nentitulli="Çmimi, përgjegjësia dhe pëlqimi me shkrim, që e jep në çdo kërkesë (edhe për prindërit)."
            onPress={() => router.push("/kushtet")}
          />
        ) : null}

        {roli !== "admin" ? (
          <Rreshti
            ikona="eye"
            titulli={roli === "klient" ? "Fotot ruhen vetëm në Odën time" : "Fotot e vizitave i sheh vetëm klienti"}
            nentitulli={
              roli === "klient"
                ? "Përveç teje, i sheh Miku që i bëri dhe, vetëm kur kundërshton, admini."
                : "Dhe ti, që i bëre. Admini vetëm kur klienti kundërshton."
            }
            djathtas={
              <View style={styles.aktive}>
                <UrezaIcon name="check" size={14} color={colors.ok} strokeWidth={2.8} />
                <Text style={styles.aktiveText}>Gjithmonë</Text>
              </View>
            }
          />
        ) : null}

        <Rreshti
          ikona="download"
          titulli="Shkarko të dhënat e mia"
          nentitulli="Profili, pronat dhe vizitat në një skedar teksti."
          duke={duke}
          onPress={shkarko}
        />
        {gabimShkarkimi ? <Text style={styles.gabim}>{gabimShkarkimi}</Text> : null}
      </View>

      {roli !== "admin" ? (
        fshirjaKerkuar ? (
          <View style={styles.kerkesa}>
            <Text style={styles.kerkesaTitulli}>Kërkesa për fshirjen e llogarisë u dërgua</Text>
            <Text style={styles.kerkesaText}>
              Më {dataMeOre(fshirjaKerkuar)}. Ekipi i Urëzës e shqyrton dhe i fshin të dhënat e tua. Deri atëherë
              llogaria punon normalisht.
            </Text>
            {gabimFshirja ? <Text style={styles.gabim}>{gabimFshirja}</Text> : null}
            <Pressable
              style={[styles.dytesor, dukeFshirja && styles.disabled]}
              onPress={() => void dergoKerkesen(false)}
              disabled={dukeFshirja}
              accessibilityRole="button"
            >
              {dukeFshirja ? (
                <ActivityIndicator color={colors.petrol} />
              ) : (
                <Text style={styles.dytesorText}>Anulo kërkesën</Text>
              )}
            </Pressable>
          </View>
        ) : (
          <Rreshti
            ikona="trash"
            titulli="Fshij llogarinë"
            nentitulli="Dërgon kërkesë te ekipi; të pyesim edhe një herë."
            ngjyra={colors.error}
            onPress={() => {
              setGabimFshirja(null);
              setKonfirmim(true);
            }}
          />
        )
      ) : null}

      <FletaModale hapur={konfirmim} mbyll={() => !dukeFshirja && setKonfirmim(false)} titulli="Të fshihet llogaria?">
        <Text style={styles.ndihmeMadhe}>
          Do t&apos;i dërgohet ekipit të Urëzës kërkesa për ta fshirë llogarinë tënde: profilin, pronat, vizitat, fotot
          dhe zërat. Kjo nuk kthehet pas kur ekipi e kryen.
        </Text>
        <Text style={styles.ndihmeMadhe}>
          Deri atëherë llogaria punon normalisht, dhe kërkesën mund ta anulosh këtu në Profil.
        </Text>
        {gabimFshirja ? <Text style={styles.gabim}>{gabimFshirja}</Text> : null}
        <Pressable
          style={[styles.rrezik, dukeFshirja && styles.disabled]}
          onPress={() => void dergoKerkesen(true)}
          disabled={dukeFshirja}
          accessibilityRole="button"
          accessibilityLabel="Dërgo kërkesën për fshirje"
        >
          {dukeFshirja ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.primaryText}>Dërgo kërkesën për fshirje</Text>
          )}
        </Pressable>
        <Pressable
          style={styles.dytesor}
          onPress={() => setKonfirmim(false)}
          disabled={dukeFshirja}
          accessibilityRole="button"
          accessibilityLabel="Mos e fshi"
        >
          <Text style={styles.dytesorText}>Mos e fshi</Text>
        </Pressable>
      </FletaModale>
    </View>
  );
}

// ---------------------------------------------------------------------------------------------
// No profile yet, and sign out

function KartaPaProfil({ onProvo }: { onProvo: () => void }) {
  const { perdoruesi } = useSesioni();
  const { burimi } = useProfili();
  return (
    <View style={styles.karta}>
      <Text style={styles.titulli}>{burimi === "pa_lidhje" ? "Nuk u lidh me serverin" : "Po ngarkohet profili"}</Text>
      <Text style={styles.ndihmeMadhe}>
        {burimi === "pa_lidhje"
          ? "Kontrollo internetin dhe provo përsëri."
          : `Të dhënat e ${perdoruesi?.email ?? "llogarisë"} po ngarkohen.`}
      </Text>
      {burimi === "pa_lidhje" ? (
        <Pressable style={styles.dytesor} onPress={onProvo} accessibilityRole="button">
          <Text style={styles.dytesorText}>Provo përsëri</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function DilButon() {
  const [duke, setDuke] = useState(false);
  const toast = useToast();

  async function dilNga() {
    setDuke(true);
    try {
      await dil();
    } catch (e) {
      toast.gabim(`Dalja nuk u krye. ${(e as Error).message}`);
    } finally {
      setDuke(false);
    }
  }

  return (
    <Pressable
      style={[styles.dil, duke && styles.disabled]}
      onPress={dilNga}
      disabled={duke}
      accessibilityRole="button"
      accessibilityLabel="Dil nga llogaria"
    >
      {duke ? (
        <ActivityIndicator color={colors.error} />
      ) : (
        <>
          <UrezaIcon name="logout" size={22} color={colors.error} strokeWidth={2.3} />
          <Text style={styles.dilText}>Dil</Text>
        </>
      )}
    </Pressable>
  );
}

// the light shadow the cards on Ballina, Oda and Pronat use
const hija = {
  shadowColor: "#0B2530",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.07,
  shadowRadius: 12,
  elevation: 2,
};

const styles = StyleSheet.create({
  karta: { backgroundColor: colors.white, borderRadius: 22, padding: 20, gap: 12 },
  hije: hija,
  shtypur: { opacity: 0.85 },
  titulli: { color: colors.ink, fontSize: 20, lineHeight: 26, fontWeight: "800" },

  // header
  koka: { flexDirection: "row", alignItems: "center", gap: 16, ...hija },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.petrol,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: colors.white, fontSize: 26, fontWeight: "800" },
  kryeTekst: { flex: 1, minWidth: 0 },
  emri: { color: colors.ink, fontSize: 20, lineHeight: 26, fontWeight: "800" },
  email: { color: colors.textSecondary, fontSize: 15, lineHeight: 21, fontWeight: "500" },
  distinktivet: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  distinktiv: {
    height: 28,
    paddingHorizontal: 10,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  distinktivText: { fontSize: 13, fontWeight: "800" },

  // completeness
  progresi: { flexDirection: "row", alignItems: "center", gap: 16 },
  progresiTitulli: { color: colors.ink, fontSize: 18, lineHeight: 24, fontWeight: "800" },
  unazaMes: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" },
  unazaNumri: { color: colors.ink, fontSize: 18, fontWeight: "800" },
  ndihme: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, fontWeight: "500" },
  ndihmeMadhe: { color: colors.textSecondary, fontSize: 16, lineHeight: 24, fontWeight: "500" },

  // form
  forma: { gap: 14, marginTop: 4 },
  fusha: { gap: 6 },
  label: { color: colors.ink, fontSize: 15, lineHeight: 20, fontWeight: "700" },
  ikona: { position: "absolute", left: 16, top: 17, zIndex: 1 },
  input: {
    height: 56,
    paddingLeft: 48,
    paddingRight: 16,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.inputBorder,
    borderRadius: 14,
    fontSize: 16,
    fontWeight: "500",
    color: colors.ink,
  },
  inputFokus: { borderColor: colors.petrol },
  inputGabim: { borderColor: colors.error },
  inputPaNdryshim: { backgroundColor: "#EEF3F6", borderColor: colors.line, justifyContent: "center" },
  inputPaNdryshimText: { color: colors.textSecondary, fontSize: 16, fontWeight: "500" },
  zgjedhesi: {
    minHeight: 56,
    paddingLeft: 16,
    paddingRight: 6,
    borderWidth: 1.5,
    borderColor: colors.inputBorder,
    borderRadius: 14,
    backgroundColor: colors.white,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  gjuha: {
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  gjuhaAktive: { backgroundColor: colors.ikonaBg },
  gjuhaText: { color: colors.textSecondary, fontSize: 15, fontWeight: "600" },
  gjuhaTextAktive: { color: colors.petrol, fontWeight: "800" },
  primary: {
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.petrol,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryText: { color: colors.white, fontSize: 17, fontWeight: "700" },
  rrezik: {
    height: 56,
    borderRadius: 16,
    backgroundColor: "#B3261E",
    alignItems: "center",
    justifyContent: "center",
  },
  dytesor: { minHeight: 48, alignItems: "center", justifyContent: "center" },
  dytesorText: { color: colors.petrol, fontSize: 16, fontWeight: "700" },
  disabled: { opacity: 0.5 },
  gabim: { color: colors.error, fontSize: 14, lineHeight: 20, fontWeight: "600" },
  shenim: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: "#E8F5F3",
  },
  shenimText: { flex: 1, color: colors.petrol, fontSize: 15, lineHeight: 22, fontWeight: "600" },

  // groups and rows
  listaNdezesish: { marginTop: 2 },
  grupiKrye: { flexDirection: "row", alignItems: "center", gap: 10 },
  grupiIkona: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.ikonaBg,
    alignItems: "center",
    justifyContent: "center",
  },
  aktive: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.okBg,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  aktiveText: { color: colors.ok, fontSize: 12, fontWeight: "700" },
  lidhjaTekst: { flex: 1, minWidth: 0 },
  kerkesa: { gap: 6, padding: 14, borderRadius: 16, backgroundColor: colors.kujdesBg },
  kerkesaTitulli: { color: colors.kujdes, fontSize: 16, lineHeight: 22, fontWeight: "800" },
  kerkesaText: { color: colors.kujdes, fontSize: 15, lineHeight: 22, fontWeight: "500" },

  // one row: icon on the left, the text, an arrow on the right when it opens something
  rreshti: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  rreshtiIkona: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.ikonaBg,
    alignItems: "center",
    justifyContent: "center",
  },
  rreshtiTitulli: { fontSize: 16, lineHeight: 22, fontWeight: "700" },

  // sign out: set apart, soft red, not a strong red button
  dil: {
    height: 56,
    marginTop: 8,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.errorLine,
    backgroundColor: colors.errorBg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  dilText: { color: colors.error, fontSize: 17, fontWeight: "800" },
});
