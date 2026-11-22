import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { EkraniMeHero, useRevealOnFocus } from "@/components/EkraniMeHero";
import { FletaModale } from "@/components/FletaModale";
import { RreshtiNdezes } from "@/components/RreshtiNdezes";
import { UrezaIcon, type IconName } from "@/components/UrezaIcon";
import { colors } from "@/constants/ureza";
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
  const router = useRouter();
  const { profili, burimi, rifresko } = useProfili();
  const roli = profili?.roli ?? "klient";

  return (
    <EkraniMeHero kicker="LLOGARIA" title="Profili im" subtitle="Të dhënat dhe cilësimet e tua.">
      {profili ? (
        <>
          <KartaEPlotesimit />
          <KartaETeDhenave />
          {roli === "klient" ? <KartaENjoftimeve /> : null}
          <KartaEPrivatesise />

          {roli !== "admin" ? (
            <Pressable style={styles.rreshti} onPress={() => router.push("/roli")} accessibilityRole="button">
              <View style={styles.rreshtiTekst}>
                <Text style={styles.rreshtiTitulli}>Ndrysho rolin</Text>
                <Text style={styles.rreshtiNen}>
                  {roli === "klient" ? "Provo aplikacionin si Miku" : "Provo aplikacionin si Klient"} me të njëjtën
                  llogari (prototip).
                </Text>
                {burimi === "demo" ? <Text style={styles.rreshtiNen}>Roli ruhet vetëm në këtë telefon.</Text> : null}
              </View>
              <UrezaIcon name="chevron" size={20} color={colors.petrol} strokeWidth={2.4} />
            </Pressable>
          ) : null}
        </>
      ) : (
        <KartaPaProfil onProvo={() => void rifresko()} />
      )}

      <DilButon />
    </EkraniMeHero>
  );
}

// ---------------------------------------------------------------------------------------------
// Completeness

function inicialet(emri: string | null | undefined, email: string | null | undefined): string {
  const fjalet = (emri ?? "").trim().split(/\s+/).filter(Boolean);
  if (fjalet.length >= 2) return (fjalet[0].charAt(0) + fjalet[1].charAt(0)).toUpperCase();
  if (fjalet.length === 1) return fjalet[0].charAt(0).toUpperCase();
  return (email ?? "?").charAt(0).toUpperCase();
}

function KartaEPlotesimit() {
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

  return (
    <View style={styles.karta}>
      <View style={styles.krye}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{inicialet(profili?.emri, perdoruesi?.email)}</Text>
        </View>
        <View style={styles.kryeTekst}>
          <Text style={styles.emri} numberOfLines={1}>
            {profili?.emri ?? perdoruesi?.email}
          </Text>
          <Text style={styles.email} numberOfLines={1}>
            {perdoruesi?.email}
          </Text>
          <Text style={styles.roli}>{EMRAT_E_ROLEVE[roli].toUpperCase()}</Text>
          <View style={styles.foto}>
            <Text style={styles.fotoText}>Ndrysho foton</Text>
            <View style={styles.pill}>
              <Text style={styles.pillText}>Së shpejti</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.progresi}>
        <View style={styles.progresiRresht}>
          <Text style={styles.progresiTitulli}>Profili është {p.perqindja}% i plotë</Text>
          <Text style={styles.progresiNumri}>
            {p.kryer} nga {p.total}
          </Text>
        </View>
        <View
          style={styles.shiriti}
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel={`Profili është ${p.perqindja}% i plotë`}
          accessibilityValue={{ min: 0, max: 100, now: p.perqindja }}
        >
          <View style={[styles.shiritiPlote, { width: `${p.perqindja}%` }]} />
        </View>
        <Text style={styles.ndihme}>{p.keshille ?? "Profili është i plotë. Faleminderit."}</Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------------------------
// Personal data

type Statusi = { ok: true } | { gabim: string } | null;

function KartaETeDhenave() {
  const { perdoruesi } = useSesioni();
  const { profili, burimi, cilesimet, cilesimetNeLlogari, ruajTeDhenat } = useProfili();
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

  // what is saved changed (the profile arrived, or the save worked): the form shows it
  useEffect(() => setEmri(emriRuajtur), [emriRuajtur]);
  useEffect(() => setTelefoni(telefoniRuajtur), [telefoniRuajtur]);
  useEffect(() => setGjuha(gjuhaRuajtur), [gjuhaRuajtur]);

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
    setStatusi(gabim ? { gabim } : { ok: true });
  }

  return (
    <View style={styles.karta}>
      <Text style={styles.titulli} accessibilityRole="header">
        Të dhënat e mia
      </Text>

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

        {statusi && "ok" in statusi ? (
          <View style={styles.rresht}>
            <UrezaIcon name="check" size={18} color="#1E6B3E" strokeWidth={2.6} />
            <Text style={styles.ok}>Ndryshimet u ruajtën.</Text>
          </View>
        ) : null}
        {statusi && "gabim" in statusi ? <Text style={styles.gabim}>{statusi.gabim}</Text> : null}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------------------------
// Notifications

type FushaENjoftimit = "njoftoPranimin" | "njoftoRaportin" | "njoftoKujtesen";

// A switch that is saved at once: it flips right away and goes back when the save fails.
function NdezesIRuajtur({
  titulli,
  nentitulli,
  fusha,
  onGabim,
}: {
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

  return <RreshtiNdezes titulli={titulli} nentitulli={nentitulli} vlera={vlera} onNdrysho={ndrysho} />;
}

function KartaENjoftimeve() {
  const [gabim, setGabim] = useState<string | null>(null);
  return (
    <View style={styles.karta}>
      <Text style={styles.titulli} accessibilityRole="header">
        Njoftimet
      </Text>
      <Text style={styles.ndihme}>Njoftimet nuk dërgohen ende. Zgjedhjet ruhen që të punojnë kur të aktivizohen.</Text>
      <View style={styles.listaNdezesish}>
        <NdezesIRuajtur
          titulli="Kur Miku e pranon detyrën"
          nentitulli="Njoftim menjëherë."
          fusha="njoftoPranimin"
          onGabim={setGabim}
        />
        <NdezesIRuajtur
          titulli="Kur raporti është gati"
          nentitulli="Pas çdo vizite."
          fusha="njoftoRaportin"
          onGabim={setGabim}
        />
        <NdezesIRuajtur
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

function RreshtiLidhje({
  ikona,
  tekst,
  nentitulli,
  ngjyra,
  chevron = false,
  duke = false,
  onPress,
}: {
  ikona: IconName;
  tekst: string;
  nentitulli?: string;
  ngjyra: string;
  chevron?: boolean;
  duke?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.lidhja, duke && styles.disabled]}
      onPress={onPress}
      disabled={duke}
      accessibilityRole="button"
      accessibilityLabel={tekst}
    >
      <UrezaIcon name={ikona} size={22} color={ngjyra} />
      <View style={styles.lidhjaTekst}>
        <Text style={[styles.lidhjaText, { color: ngjyra }]}>{tekst}</Text>
        {nentitulli ? <Text style={styles.ndihme}>{nentitulli}</Text> : null}
      </View>
      {duke ? (
        <ActivityIndicator color={ngjyra} />
      ) : chevron ? (
        <UrezaIcon name="chevron" size={18} color={ngjyra} />
      ) : null}
    </Pressable>
  );
}

function KartaEPrivatesise() {
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
    <View style={styles.karta}>
      <Text style={styles.titulli} accessibilityRole="header">
        Privatësia dhe pëlqimi
      </Text>

      <View style={styles.listaNdezesish}>
        {roli === "klient" ? (
          <RreshtiNdezes
            titulli="Pëlqimi për vizita te prindërit"
            nentitulli="Prindërit konfirmojnë çdo vizitë."
            vlera={false}
            onNdrysho={() => {}}
            seShpejti
          />
        ) : null}

        {roli !== "admin" ? (
          <View style={styles.info}>
            <View style={styles.lidhjaTekst}>
              <Text style={styles.infoTitulli}>
                {roli === "klient" ? "Fotot ruhen vetëm në Odën time" : "Fotot e vizitave i sheh vetëm klienti"}
              </Text>
              <Text style={styles.ndihme}>
                {roli === "klient" ? "Askush tjetër nuk i sheh, përveç Mikut që i bëri." : "Dhe ti, që i bëre."}
              </Text>
            </View>
            <View style={styles.aktive}>
              <UrezaIcon name="check" size={14} color="#1E6B3E" strokeWidth={2.8} />
              <Text style={styles.aktiveText}>Gjithmonë</Text>
            </View>
          </View>
        ) : null}
      </View>

      <RreshtiLidhje
        ikona="download"
        tekst="Shkarko të dhënat e mia"
        nentitulli="Profili, pronat dhe vizitat në një skedar teksti."
        ngjyra={colors.petrol}
        chevron
        duke={duke}
        onPress={shkarko}
      />
      {gabimShkarkimi ? <Text style={styles.gabim}>{gabimShkarkimi}</Text> : null}

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
          <RreshtiLidhje
            ikona="trash"
            tekst="Fshij llogarinë"
            ngjyra="#B3261E"
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

  async function dilNga() {
    setDuke(true);
    try {
      await dil();
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
        <ActivityIndicator color={colors.petrol} />
      ) : (
        <>
          <Text style={styles.dilText}>Dil nga llogaria</Text>
          <UrezaIcon name="logout" size={22} color={colors.petrol} strokeWidth={2.3} />
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  karta: { backgroundColor: colors.white, borderRadius: 20, padding: 20, gap: 12 },
  titulli: { color: colors.ink, fontSize: 20, lineHeight: 26, fontWeight: "800" },

  // completeness
  krye: { flexDirection: "row", alignItems: "center", gap: 16 },
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
  roli: { color: colors.teal, fontSize: 12, lineHeight: 16, fontWeight: "700", letterSpacing: 1, marginTop: 2 },
  foto: { minHeight: 40, flexDirection: "row", alignItems: "center", gap: 8 },
  fotoText: { color: colors.textSecondary, fontSize: 15, fontWeight: "800" },
  pill: { backgroundColor: "#FCEFD2", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 2 },
  pillText: { color: "#7A4A06", fontSize: 12, fontWeight: "700" },
  progresi: { gap: 8 },
  progresiRresht: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  progresiTitulli: { color: colors.ink, fontSize: 14, lineHeight: 20, fontWeight: "700", flexShrink: 1 },
  progresiNumri: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, fontWeight: "700" },
  shiriti: { height: 10, borderRadius: 5, backgroundColor: "#E3EAF0", overflow: "hidden" },
  shiritiPlote: { height: 10, borderRadius: 5, backgroundColor: "#1F7A68" },
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
  gjuhaAktive: { backgroundColor: "#E8F5F3" },
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
  rresht: { flexDirection: "row", alignItems: "center", gap: 8 },
  ok: { color: "#1E6B3E", fontSize: 15, lineHeight: 20, fontWeight: "700" },
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

  // switches and privacy
  listaNdezesish: { marginTop: 2 },
  info: { minHeight: 72, flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 8 },
  infoTitulli: { color: colors.ink, fontSize: 16, lineHeight: 22, fontWeight: "700" },
  aktive: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#E4F6EB",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  aktiveText: { color: "#1E6B3E", fontSize: 12, fontWeight: "700" },
  lidhja: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#EDF1F4",
  },
  lidhjaTekst: { flex: 1, minWidth: 0 },
  lidhjaText: { fontSize: 16, lineHeight: 22, fontWeight: "700" },
  kerkesa: { gap: 6, padding: 14, borderRadius: 16, backgroundColor: "#FFF2DE" },
  kerkesaTitulli: { color: "#8A5210", fontSize: 16, lineHeight: 22, fontWeight: "800" },
  kerkesaText: { color: "#8A5210", fontSize: 15, lineHeight: 22, fontWeight: "500" },

  // the rest of the screen
  rreshti: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E3EAF0",
  },
  rreshtiTekst: { flex: 1, gap: 2 },
  rreshtiTitulli: { color: colors.ink, fontSize: 17, lineHeight: 22, fontWeight: "800" },
  rreshtiNen: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, fontWeight: "500" },
  dil: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.inputBorder,
    backgroundColor: colors.white,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  dilText: { color: colors.petrol, fontSize: 17, fontWeight: "700" },
});
