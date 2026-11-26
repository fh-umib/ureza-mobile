import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { EkraniMeHero } from "@/components/EkraniMeHero";
import { GpsKrahasimi, krahasimiIGps } from "@/components/GpsKrahasimi";
import { HartaEDeshmise } from "@/components/HartaEDeshmise";
import { ListaEKontrollit } from "@/components/ListaEKontrollit";
import { LojtariZanor } from "@/components/LojtariZanor";
import { UrezaIcon } from "@/components/UrezaIcon";
import { GjendjaBosh } from "@/components/ui/GjendjaBosh";
import { SkeletiIFaqes } from "@/components/ui/Skeleti";
import { colors, font } from "@/constants/ureza";
import { useDhenat } from "@/lib/dhenat";
import { useDeshmite, type Deshmi, type PerdorimiIDeshmive } from "@/lib/deshmite";
import { bejFoto, merrVendndodhjen } from "@/lib/kapja";
import type { Prona } from "@/lib/pronat";
import {
  draftIBosh,
  draftNgaRaporti,
  kontrolloDraftin,
  MUNGON_RAPORTET,
  useRaporti,
  type DraftIRaportit,
} from "@/lib/raporti";
import { kohezgjatjaNeTekst, oraNeTekst, titulliIVizites } from "@/lib/vizitat";

// "Dëshmia e vizitës" (design: Dëshmia): the Miku, on site, collects a GPS position, live
// photos and a voice note, confirms they are from today's visit and sends them.

const MAKS_FOTO = 6;
const MAKS_ZE_SEKONDA = 120;
const MIN_ZE_SEKONDA = 2;
const SAKTESIA_E_DOBET_M = 100; // above this the GPS position is called weak
const MIME_I_ZANIT = Platform.OS === "web" ? "audio/webm" : "audio/mp4";

export default function Deshmia() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { vizitat, pronat, burimiVizitat, dergoRaportin } = useDhenat();
  const d = useDeshmite(id);
  const raporti = useRaporti(id);
  const [draft, setDraft] = useState<DraftIRaportit | null>(null);
  const [konfirmuar, setKonfirmuar] = useState(false);
  const [duke, setDuke] = useState(false);
  const [gabim, setGabim] = useState<string | null>(null);

  const vizita = vizitat.find((v) => v.id === id);
  const prona = vizita ? pronat.find((p) => p.id === vizita.pronaId) : undefined;
  const mbrapa = { etiketa: "Kthehu", onPress: () => router.back() };

  // the checklist starts from the saved report (when the Miku comes back) or empty; set while
  // rendering, once the visit and the report are known
  if (vizita && draft === null && raporti.burimi !== "duke_ngarkuar") {
    setDraft(raporti.raporti ? draftNgaRaporti(raporti.raporti, vizita.lloji) : draftIBosh(vizita.lloji));
  }

  if (!vizita) {
    return (
      <EkraniMeHero kicker="MIKU · NË TERREN" title="Dëshmia e vizitës" kthehu={mbrapa}>
        {burimiVizitat === "duke_ngarkuar" ? (
          <SkeletiIFaqes rreshta={2} />
        ) : (
          <GjendjaBosh
            toni="gabim"
            ikona="warning"
            titulli="Kjo vizitë nuk u gjet"
            teksti="Kthehu te Kërkesat dhe hape përsëri vizitën."
            veprimi={{ etiketa: "Kthehu", onPress: mbrapa.onPress }}
          />
        )}
      </EkraniMeHero>
    );
  }

  const gatshme = d.gps !== null && d.fotot.length > 0 && d.zeri !== null;
  const mundetTeDergoje = gatshme && konfirmuar && !duke;
  // the report is required where it can be saved; before supabase/raportet.sql it is skipped
  const meRaport = raporti.burimi === "supabase" || raporti.burimi === "lokal";
  const kontrolli = meRaport && draft ? kontrolloDraftin(draft, vizita.lloji) : null;
  const raportiPlote = kontrolli !== null && "raporti" in kontrolli;

  async function dergo() {
    if (!vizita || !mundetTeDergoje) return;
    setGabim(null);
    if (kontrolli && "gabim" in kontrolli) {
      setGabim(kontrolli.gabim);
      return;
    }
    if (raporti.burimi === "pa_lidhje") {
      setGabim("Raporti nuk u ngarkua. Kontrollo internetin dhe provo përsëri.");
      void raporti.rifresko();
      return;
    }
    if (meRaport && !kontrolli) {
      setGabim("Raporti po ngarkohet. Provo pas një çasti.");
      return;
    }
    setDuke(true);
    if (kontrolli) {
      const ruajtur = await raporti.ruaj(kontrolli.raporti);
      if (ruajtur) {
        setDuke(false);
        setGabim(ruajtur);
        return;
      }
    }
    const mesazh = await dergoRaportin(vizita.id);
    setDuke(false);
    if (mesazh) {
      setGabim(mesazh);
      return;
    }
    router.back();
  }

  return (
    <EkraniMeHero
      kicker="MIKU · NË TERREN"
      title="Dëshmia e vizitës"
      subtitle={`${titulliIVizites(vizita.lloji)} · ${prona?.emri ?? "Prona"}`}
      kthehu={mbrapa}
    >
      {vizita.statusi !== "vizita" ? (
        <View style={styles.karta}>
          <Text style={styles.titulli}>Dëshmitë nuk mblidhen tani</Text>
          <Text style={styles.tekst}>
            {vizita.statusi === "pranuar"
              ? "Fillo vizitën nga faqja e vizitës kur të jesh te prona."
              : "Dëshmitë e kësaj vizite janë dërguar."}
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.hapat}>
            <Hapi emri="GPS" gati={d.gps !== null} />
            <Hapi emri="Foto" gati={d.fotot.length > 0} />
            <Hapi emri="Zë" gati={d.zeri !== null} />
            {meRaport ? <Hapi emri="Raporti" gati={raportiPlote} /> : null}
          </View>

          {raporti.burimi === "mungon" ? (
            <View style={styles.shenim}>
              <UrezaIcon name="warning" size={20} color={colors.petrol} />
              <Text style={styles.shenimText}>{MUNGON_RAPORTET} Deri atëherë dërgohen vetëm dëshmitë.</Text>
            </View>
          ) : null}

          {d.burimi === "mungon" ? (
            <View style={styles.shenim}>
              <UrezaIcon name="warning" size={20} color={colors.petrol} />
              <Text style={styles.shenimText}>
                Dëshmitë nuk ruhen ende. Ekzekuto supabase/deshmia.sql në Supabase dhe kthehu këtu.
              </Text>
            </View>
          ) : null}
          {d.burimi === "pa_lidhje" ? (
            <View style={styles.karta}>
              <Text style={styles.titulli}>Dëshmitë nuk u ngarkuan</Text>
              <Text style={styles.tekst}>Nuk u lidh me serverin. Kontrollo internetin dhe provo përsëri.</Text>
              <Pressable style={styles.dytesor} onPress={() => void d.rifresko()} accessibilityRole="button">
                <Text style={styles.dytesorText}>Provo përsëri</Text>
              </Pressable>
            </View>
          ) : null}
          {d.burimi === "duke_ngarkuar" ? <ActivityIndicator color={colors.petrol} /> : null}

          {d.burimi === "supabase" || d.burimi === "lokal" ? (
            <>
              <KartaGps d={d} prona={prona} />
              <KartaFoto d={d} />
              <KartaZeri d={d} />
              {meRaport && draft ? <ListaEKontrollit lloji={vizita.lloji} draft={draft} onNdrysho={setDraft} /> : null}

              <Pressable
                style={styles.konfirmim}
                onPress={() => setKonfirmuar((k) => !k)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: konfirmuar }}
              >
                <View style={[styles.kutia, konfirmuar && styles.kutiaBere]}>
                  {konfirmuar ? <UrezaIcon name="check" size={16} color={colors.white} strokeWidth={3} /> : null}
                </View>
                <Text style={styles.konfirmimText}>Konfirmoj që dëshmitë janë nga vizita e sotme.</Text>
              </Pressable>

              {gabim ? <Text style={styles.gabim}>{gabim}</Text> : null}

              <Pressable
                style={[styles.primary, !mundetTeDergoje && styles.disabled]}
                onPress={dergo}
                disabled={!mundetTeDergoje}
                accessibilityRole="button"
                accessibilityState={{ disabled: !mundetTeDergoje }}
              >
                {duke ? <ActivityIndicator color={colors.white} /> : <Text style={styles.primaryText}>Dërgo dëshmitë</Text>}
              </Pressable>
              {!gatshme ? (
                <Text style={styles.ndihme}>
                  {meRaport
                    ? "Duhen GPS, të paktën një foto, shënimi zanor dhe raporti para dërgimit."
                    : "Duhen GPS, të paktën një foto dhe shënimi zanor para dërgimit."}
                </Text>
              ) : meRaport && !raportiPlote ? (
                <Text style={styles.ndihme}>Plotëso raportin për klientin: gjendjen e çdo pike dhe përfundimin.</Text>
              ) : null}
            </>
          ) : null}
        </>
      )}
    </EkraniMeHero>
  );
}

function Hapi({ emri, gati }: { emri: string; gati: boolean }) {
  return (
    <View style={[styles.hapi, gati && styles.hapiGati]} accessibilityLabel={`${emri}: ${gati ? "gati" : "pa u bërë"}`}>
      <View style={[styles.hapiRrethi, gati && styles.hapiRrethiGati]}>
        {gati ? <UrezaIcon name="check" size={13} color={colors.white} strokeWidth={3} /> : null}
      </View>
      <Text style={[styles.hapiText, gati && styles.hapiTextGati]}>{emri}</Text>
    </View>
  );
}

// 1 · The GPS position
function KartaGps({ d, prona }: { d: PerdorimiIDeshmive; prona?: Prona }) {
  const [duke, setDuke] = useState(false);
  const [gabim, setGabim] = useState<string | null>(null);
  const gps = d.gps;

  async function merr() {
    setDuke(true);
    setGabim(null);
    const k = await merrVendndodhjen();
    if (!k.ok) {
      setGabim(k.mesazh);
      setDuke(false);
      return;
    }
    const mesazh = await d.ruajGps(k.vlera.gjeresia, k.vlera.gjatesia, k.vlera.saktesia);
    if (mesazh) setGabim(mesazh);
    setDuke(false);
  }

  const dobet = gps?.saktesia != null && gps.saktesia > SAKTESIA_E_DOBET_M;
  const krahasimi = krahasimiIGps(gps, prona); // only once the property has an exact position

  return (
    <View style={styles.karta}>
      <View style={styles.krye}>
        <Text style={styles.titulli}>Vendndodhja</Text>
        <View style={[styles.chip, gps ? styles.chipGati : styles.chipPritje]}>
          <Text style={[styles.chipText, { color: gps ? "#1E6B3E" : "#8A5210" }]}>{gps ? "Gati" : "Pa u marrë"}</Text>
        </View>
      </View>
      {gps ? (
        <Text style={styles.tekst}>
          GPS ±{Math.round(gps.saktesia ?? 0)} m · {oraNeTekst(gps.koha)}
        </Text>
      ) : (
        <Text style={styles.tekst}>Shtype butonin kur të jesh te prona. Ora ruhet nga serveri, jo nga telefoni.</Text>
      )}
      {gps ? <GpsKrahasimi gps={gps} prona={prona} /> : null}
      {gps && gps.gjeresia !== null && gps.gjatesia !== null && prona?.koordinatat ? (
        <HartaEDeshmise
          prona={prona.koordinatat}
          gps={{ lat: gps.gjeresia, lng: gps.gjatesia }}
          saktesia={gps.saktesia}
        />
      ) : null}
      {krahasimi?.gjendja === "larg" ? (
        <Text style={styles.paralajmerim}>
          GPS-i duket larg pronës. Nëse nuk je ende te prona, shko aty dhe merre vendndodhjen përsëri.
        </Text>
      ) : null}
      {dobet ? (
        <Text style={styles.paralajmerim}>Sakësia është e ulët. Dil jashtë ose afrohu te dritarja dhe merre përsëri.</Text>
      ) : null}
      {gabim ? <Text style={styles.gabim}>{gabim}</Text> : null}
      <Pressable
        style={[styles.dytesorPlote, duke && styles.disabled]}
        onPress={merr}
        disabled={duke}
        accessibilityRole="button"
      >
        {duke ? (
          <ActivityIndicator color={colors.petrol} />
        ) : (
          <>
            <UrezaIcon name="pin" size={20} color={colors.petrol} />
            <Text style={styles.dytesorPlotText}>{gps ? "Merr përsëri" : "Merr vendndodhjen"}</Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

// 2 · Live photos (the camera only, never the gallery)
function KartaFoto({ d }: { d: PerdorimiIDeshmive }) {
  const [duke, setDuke] = useState(false);
  const [gabim, setGabim] = useState<string | null>(null);

  async function shto() {
    setDuke(true);
    setGabim(null);
    const k = await bejFoto();
    if (!k.ok) {
      if (!k.anuluar) setGabim(k.mesazh);
      setDuke(false);
      return;
    }
    const mesazh = await d.shtoFoto(k.vlera.uri, k.vlera.mime);
    if (mesazh) setGabim(mesazh);
    setDuke(false);
  }

  async function hiq(foto: Deshmi) {
    setGabim(null);
    const mesazh = await d.fshiFoton(foto.id);
    if (mesazh) setGabim(mesazh);
  }

  return (
    <View style={styles.karta}>
      <View style={styles.krye}>
        <Text style={styles.titulli}>Foto live</Text>
        <Text style={styles.nen}>{d.fotot.length === 0 ? "Asnjë foto" : `${d.fotot.length} foto`}</Text>
      </View>
      <View style={styles.rrjeta}>
        {d.fotot.map((foto) => (
          <View key={foto.id} style={styles.miniatura}>
            {foto.url ? <Image source={{ uri: foto.url }} style={styles.foto} contentFit="cover" /> : <View style={styles.foto} />}
            <Text style={styles.fotoOra}>{oraNeTekst(foto.koha)}</Text>
            <Pressable
              style={styles.hiq}
              onPress={() => void hiq(foto)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`Hiq foton e orës ${oraNeTekst(foto.koha)}`}
            >
              <UrezaIcon name="close" size={14} color={colors.white} strokeWidth={3} />
            </Pressable>
          </View>
        ))}
        {d.fotot.length < MAKS_FOTO ? (
          <Pressable
            style={[styles.shtoFoto, duke && styles.disabled]}
            onPress={shto}
            disabled={duke}
            accessibilityRole="button"
            accessibilityLabel="Shto një foto me kamerën"
          >
            {duke ? (
              <ActivityIndicator color={colors.petrol} />
            ) : (
              <>
                <UrezaIcon name="camera" size={26} color={colors.petrol} />
                <Text style={styles.shtoText}>Shto</Text>
              </>
            )}
          </Pressable>
        ) : null}
      </View>
      <Text style={styles.nen}>Vetëm nga kamera. Galeria është e çaktivizuar.</Text>
      {gabim ? <Text style={styles.gabim}>{gabim}</Text> : null}
    </View>
  );
}

// 3 · The voice note
function KartaZeri({ d }: { d: PerdorimiIDeshmive }) {
  const regjistruesi = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const gjendja = useAudioRecorderState(regjistruesi, 250);
  const [duke, setDuke] = useState(false); // saving
  const [gabim, setGabim] = useState<string | null>(null);
  const sekonda = gjendja.durationMillis / 1000;

  async function fillo() {
    setGabim(null);
    try {
      const leja = await requestRecordingPermissionsAsync();
      if (!leja.granted) {
        setGabim("Urëza nuk e ka lejen për mikrofonin. Lejoje te Cilësimet të telefonit dhe provo përsëri.");
        return;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await regjistruesi.prepareToRecordAsync();
      regjistruesi.record();
    } catch {
      setGabim("Regjistrimi nuk filloi. Provo përsëri.");
    }
  }

  async function ndalo() {
    const gjatesia = sekonda;
    setDuke(true);
    setGabim(null);
    try {
      await regjistruesi.stop();
      await setAudioModeAsync({ allowsRecording: false });
      const uri = regjistruesi.uri;
      if (!uri) {
        setGabim("Regjistrimi nuk u ruajt. Provo përsëri.");
      } else if (gjatesia < MIN_ZE_SEKONDA) {
        setGabim("Shënimi është shumë i shkurtër. Regjistro të paktën 2 sekonda.");
      } else {
        const mesazh = await d.ruajZerin(uri, gjatesia, MIME_I_ZANIT);
        if (mesazh) setGabim(mesazh);
      }
    } catch {
      setGabim("Regjistrimi nuk u ruajt. Provo përsëri.");
    }
    setDuke(false);
  }

  // a note never runs longer than two minutes: the recorder (an external system) reached the
  // limit, so it is stopped and saved, which also shows the saving spinner
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reacts to the recorder's own state, not to React state
    if (gjendja.isRecording && sekonda >= MAKS_ZE_SEKONDA) void ndalo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gjendja.isRecording, sekonda]);

  const regjistron = gjendja.isRecording;

  return (
    <View style={styles.karta}>
      <View style={styles.krye}>
        <Text style={styles.titulli}>Shënim zanor</Text>
        {d.zeri && !regjistron ? (
          <Text style={styles.nen}>
            {kohezgjatjaNeTekst(d.zeri.kohezgjatja ?? 0)} · {oraNeTekst(d.zeri.koha)}
          </Text>
        ) : null}
      </View>

      {regjistron ? (
        <View style={styles.regjistron}>
          <View style={styles.pika} />
          <Text style={styles.regjistronKoha}>{kohezgjatjaNeTekst(sekonda)}</Text>
          <Text style={styles.nen}>po regjistron</Text>
        </View>
      ) : d.zeri?.url ? (
        <LojtariZanor key={d.zeri.id} url={d.zeri.url} kohezgjatja={d.zeri.kohezgjatja} />
      ) : (
        <Text style={styles.tekst}>Thuaj me fjalët e tua çka pe: çatia, uji, rryma, gjendja e shtëpisë.</Text>
      )}

      {gabim ? <Text style={styles.gabim}>{gabim}</Text> : null}

      {regjistron ? (
        <Pressable
          style={[styles.ndalo, duke && styles.disabled]}
          onPress={() => void ndalo()}
          disabled={duke}
          accessibilityRole="button"
          accessibilityLabel="Ndalo regjistrimin"
        >
          <UrezaIcon name="stop" size={20} color={colors.white} strokeWidth={2.4} />
          <Text style={styles.ndaloText}>Ndalo</Text>
        </Pressable>
      ) : (
        <Pressable
          style={[styles.dytesorPlote, duke && styles.disabled]}
          onPress={() => void fillo()}
          disabled={duke}
          accessibilityRole="button"
        >
          {duke ? (
            <ActivityIndicator color={colors.petrol} />
          ) : (
            <>
              <UrezaIcon name="mic" size={20} color={colors.petrol} />
              <Text style={styles.dytesorPlotText}>{d.zeri ? "Regjistro përsëri" : "Regjistro shënimin"}</Text>
            </>
          )}
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  hapat: { flexDirection: "row", gap: 8 },
  hapi: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#E3EAF0",
  },
  hapiGati: { backgroundColor: "#E4F6EB" },
  hapiRrethi: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.inputBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  hapiRrethiGati: { backgroundColor: "#1E6B3E", borderColor: "#1E6B3E" },
  hapiText: { color: colors.textSecondary, fontSize: 14, fontFamily: font.w700 },
  hapiTextGati: { color: "#1E6B3E" },
  karta: { backgroundColor: colors.white, borderRadius: 20, padding: 20, gap: 12 },
  krye: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  titulli: { color: colors.ink, fontSize: 20, lineHeight: 26, fontFamily: font.w800 },
  tekst: { color: colors.textSecondary, fontSize: 15, lineHeight: 22, fontFamily: font.w500 },
  nen: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, fontFamily: font.w600 },
  chip: { height: 28, paddingHorizontal: 12, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  chipGati: { backgroundColor: "#E4F6EB" },
  chipPritje: { backgroundColor: "#FFF2DE" },
  chipText: { fontSize: 13, fontFamily: font.w700 },
  paralajmerim: { color: "#8A5210", fontSize: 14, lineHeight: 20, fontFamily: font.w600 },
  gabim: { color: colors.error, fontSize: 14, lineHeight: 20, fontFamily: font.w600 },
  ndihme: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, fontFamily: font.w500, textAlign: "center" },
  dytesor: { minHeight: 48, alignItems: "center", justifyContent: "center" },
  dytesorText: { color: colors.petrol, fontSize: 16, fontFamily: font.w700 },
  dytesorPlote: {
    height: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.petrol,
    backgroundColor: colors.white,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  dytesorPlotText: { color: colors.petrol, fontSize: 16, fontFamily: font.w700 },
  rrjeta: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  miniatura: { width: "31%", aspectRatio: 1, borderRadius: 14, overflow: "hidden", backgroundColor: "#E3EAF0" },
  foto: { width: "100%", height: "100%" },
  fotoOra: {
    position: "absolute",
    left: 6,
    bottom: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "rgba(11,37,48,0.72)",
    color: colors.white,
    fontSize: 12,
    fontFamily: font.w700,
  },
  hiq: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(11,37,48,0.72)",
    alignItems: "center",
    justifyContent: "center",
  },
  shtoFoto: {
    width: "31%",
    aspectRatio: 1,
    borderRadius: 14,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: colors.inputBorder,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  shtoText: { color: colors.petrol, fontSize: 14, fontFamily: font.w700 },
  regjistron: { flexDirection: "row", alignItems: "center", gap: 12 },
  pika: { width: 14, height: 14, borderRadius: 7, backgroundColor: colors.vizita },
  regjistronKoha: { color: colors.ink, fontSize: 24, fontFamily: font.w800, fontVariant: ["tabular-nums"] },
  ndalo: {
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.vizita,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  ndaloText: { color: colors.white, fontSize: 16, fontFamily: font.w700 },
  konfirmim: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#E3EAF0",
  },
  kutia: {
    width: 28,
    height: 28,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.inputBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  kutiaBere: { backgroundColor: colors.petrol, borderColor: colors.petrol },
  konfirmimText: { flex: 1, color: colors.ink, fontSize: 15, lineHeight: 22, fontFamily: font.w600 },
  primary: { height: 56, borderRadius: 16, backgroundColor: colors.petrol, alignItems: "center", justifyContent: "center" },
  primaryText: { color: colors.white, fontSize: 17, fontFamily: font.w700 },
  disabled: { opacity: 0.5 },
  shenim: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: "#E8F5F3",
  },
  shenimText: { flex: 1, color: colors.petrol, fontSize: 15, lineHeight: 22, fontFamily: font.w600 },
});
