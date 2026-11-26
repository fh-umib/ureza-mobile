import { useCallback, useEffect, useRef, useState } from "react";

import type { IconName } from "@/components/UrezaIcon";

import { PA_LIDHJE, lexo } from "./lexo";
import type { Gjuha } from "./profili";
import { supabase } from "./supabase";
import { DITET, MUAJT, kohezgjatjaNeTekst, type LlojiVizites } from "./vizitat";

// The Miku's written report (supabase/raportet.sql). The Miku answers a short checklist; the
// database keeps the answers, not sentences, and this file writes the report in the client's
// language (Shqip, Deutsch, English) from fixed texts. The Miku's own comments stay as written,
// in Albanian, and are labelled so. (An AI translation of the comments is a later step.)

export type Gjendja = "mire" | "problem" | "pa_kontrolluar";
export type Perfundimi = "mire" | "vemendje" | "urgjent";

export type RaportiIMikut = {
  pikat: { id: string; gjendja: Gjendja; koment: string }[];
  perfundimi: Perfundimi;
  shenimi: string;
};

// What the Miku is filling in (nothing chosen yet is null).
export type DraftIRaportit = {
  pikat: Record<string, { gjendja: Gjendja | null; koment: string }>;
  perfundimi: Perfundimi | null;
  shenimi: string;
};

export const KOMENTI_MAX = 200;
export const SHENIMI_MAX = 500;
const KOMENTI_MIN = 3;

type Teksti = Record<Gjuha, string>;

export type PikaEKontrollit = { id: string; ikona: IconName; emri: Teksti; ndihme: string };

// The points of each kind of visit. The visit to the parents is not medical: it looks at how they
// are doing day to day, never at their health.
export const PIKAT: Record<LlojiVizites, PikaEKontrollit[]> = {
  inspektim: [
    { id: "cati", ikona: "home", emri: { sq: "Çatia", de: "Dach", en: "Roof" }, ndihme: "Tjegullat, ulluqet, shenja rrjedhjeje." },
    {
      id: "uji",
      ikona: "drop",
      emri: { sq: "Uji dhe lagështia", de: "Wasser und Feuchtigkeit", en: "Water and damp" },
      ndihme: "Rrjedhje, njolla në mure, bodrumi.",
    },
    { id: "rryma", ikona: "bolt", emri: { sq: "Rryma", de: "Strom", en: "Electricity" }, ndihme: "A ka rrymë, siguresat, kabllot." },
    {
      id: "dyert",
      ikona: "key",
      emri: { sq: "Dyert, dritaret dhe bravat", de: "Türen, Fenster und Schlösser", en: "Doors, windows and locks" },
      ndihme: "Të mbyllura, pa xhama të thyer.",
    },
    {
      id: "oborri",
      ikona: "sun",
      emri: { sq: "Oborri dhe rrethoja", de: "Hof und Zaun", en: "Yard and fence" },
      ndihme: "Bari, pemët, porta, rrethoja.",
    },
    {
      id: "siguria",
      ikona: "shield",
      emri: { sq: "Siguria", de: "Sicherheit", en: "Security" },
      ndihme: "Shenja hyrjeje me forcë ose dikush që banon pa leje.",
    },
  ],
  kujdes: [
    { id: "disponimi", ikona: "heart", emri: { sq: "Disponimi", de: "Stimmung", en: "Mood" }, ndihme: "Si duken, a flasin me qejf." },
    {
      id: "ushqimi",
      ikona: "list",
      emri: { sq: "Ushqimi dhe furnizimet", de: "Lebensmittel und Vorräte", en: "Food and supplies" },
      ndihme: "A ka ushqim, ujë dhe gjërat e përditshme.",
    },
    {
      id: "ngrohja",
      ikona: "sun",
      emri: { sq: "Ngrohja dhe drita", de: "Heizung und Licht", en: "Heating and light" },
      ndihme: "A është ngrohtë brenda, a punojnë dritat.",
    },
    {
      id: "pastertia",
      ikona: "sparkle",
      emri: { sq: "Pastërtia dhe rregulli", de: "Sauberkeit und Ordnung", en: "Cleanliness and order" },
      ndihme: "Kuzhina, banjo, rrobat.",
    },
    {
      id: "shtepia",
      ikona: "shield",
      emri: { sq: "Shtëpia pa rreziqe", de: "Sicheres Zuhause", en: "Safe home" },
      ndihme: "Shkallët, qilimat, sobat, dera e mbyllur.",
    },
    {
      id: "nevojat",
      ikona: "user",
      emri: { sq: "Nevojat e përditshme", de: "Tägliche Bedürfnisse", en: "Daily needs" },
      ndihme: "A kërkojnë ndihmë për diçka (pazar, rregullime).",
    },
  ],
};

export const GJENDJET: { vlera: Gjendja; emri: Teksti; ikona: IconName }[] = [
  { vlera: "mire", emri: { sq: "Në rregull", de: "In Ordnung", en: "OK" }, ikona: "check" },
  { vlera: "problem", emri: { sq: "Ka problem", de: "Problem", en: "Problem" }, ikona: "warning" },
  { vlera: "pa_kontrolluar", emri: { sq: "Nuk u kontrollua", de: "Nicht geprüft", en: "Not checked" }, ikona: "close" },
];

export const PERFUNDIMET: { vlera: Perfundimi; emri: Teksti; teksti: Teksti; ikona: IconName }[] = [
  {
    vlera: "mire",
    emri: { sq: "Gjithçka në rregull", de: "Alles in Ordnung", en: "Everything is fine" },
    teksti: {
      sq: "Miku nuk gjeti asgjë që kërkon veprim.",
      de: "Der Miku hat nichts gefunden, das Handeln erfordert.",
      en: "The Miku found nothing that needs action.",
    },
    ikona: "check",
  },
  {
    vlera: "vemendje",
    emri: { sq: "Disa gjëra duan vëmendje", de: "Einiges braucht Aufmerksamkeit", en: "Some things need attention" },
    teksti: {
      sq: "Disa pika duan vëmendje. Shiko komentet më poshtë.",
      de: "Einige Punkte brauchen Aufmerksamkeit. Siehe die Kommentare unten.",
      en: "Some points need attention. See the comments below.",
    },
    ikona: "warning",
  },
  {
    vlera: "urgjent",
    emri: { sq: "Duhet veprim i shpejtë", de: "Schnelles Handeln nötig", en: "Needs action soon" },
    teksti: {
      sq: "Miku sugjeron të veprohet shpejt. Shiko pikat me problem.",
      de: "Der Miku empfiehlt, bald zu handeln. Siehe die Punkte mit Problem.",
      en: "The Miku suggests acting soon. See the points with a problem.",
    },
    ikona: "warning",
  },
];

// The fixed words of the report, per language.
export const FJALET: Record<
  Gjuha,
  {
    titulli: string;
    gjuha: string;
    llojet: Record<LlojiVizites, string>;
    deshmite: string;
    komenti: string;
    shenimi: string;
    fundi: string;
    paRaport: string;
    jo_mjekesore: string;
  }
> = {
  sq: {
    titulli: "Raporti i vizitës",
    gjuha: "Gjuha e raportit",
    llojet: { inspektim: "Inspektim prone", kujdes: "Vizitë te prindërit" },
    deshmite: "Dëshmitë",
    komenti: "Komenti i Mikut",
    shenimi: "Shënimi i Mikut",
    fundi: "Shkruar nga lista e kontrollit të Mikut. Komentet janë me fjalët e Mikut.",
    paRaport: "Miku nuk ka plotësuar listë kontrolli për këtë vizitë. Dëshmitë janë te skeda Dëshmi.",
    jo_mjekesore: "Kjo vizitë nuk është mjekësore. Në urgjencë thirr 112.",
  },
  de: {
    titulli: "Besuchsbericht",
    gjuha: "Berichtssprache",
    llojet: { inspektim: "Objektprüfung", kujdes: "Besuch bei den Eltern" },
    deshmite: "Nachweise",
    komenti: "Kommentar des Miku (Albanisch)",
    shenimi: "Notiz des Miku (Albanisch)",
    fundi:
      "Erstellt aus der Checkliste des Miku. Die Kommentare stehen so da, wie der Miku sie auf Albanisch geschrieben hat; eine automatische Übersetzung folgt später.",
    paRaport: "Für diesen Besuch hat der Miku keine Checkliste ausgefüllt. Die Nachweise finden Sie im Tab „Dëshmi“.",
    jo_mjekesore: "Dieser Besuch ist nicht medizinisch. Im Notfall die 112 anrufen (Kosovo).",
  },
  en: {
    titulli: "Visit report",
    gjuha: "Report language",
    llojet: { inspektim: "Property inspection", kujdes: "Visit to the parents" },
    deshmite: "Evidence",
    komenti: "Miku's comment (Albanian)",
    shenimi: "Note from the Miku (Albanian)",
    fundi:
      "Written from the Miku's checklist. The comments are shown as the Miku wrote them, in Albanian; an automatic translation comes later.",
    paRaport: "The Miku did not fill in a checklist for this visit. The evidence is in the “Dëshmi” tab.",
    jo_mjekesore: "This visit is not medical. In an emergency call 112 (Kosovo).",
  },
};

const DITET_DE = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
const MUAJT_DE = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
const DITET_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MUAJT_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// The day and time of the visit in each language (local time).
export function dataNeGjuhen(iso: string, gjuha: Gjuha): { data: string; ora: string } {
  const d = new Date(iso);
  const ora = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  const dita = d.getDay();
  const muaji = d.getMonth();
  if (gjuha === "de") return { data: `${DITET_DE[dita]}, ${d.getDate()}. ${MUAJT_DE[muaji]} ${d.getFullYear()}`, ora };
  if (gjuha === "en") return { data: `${DITET_EN[dita]}, ${d.getDate()} ${MUAJT_EN[muaji]} ${d.getFullYear()}`, ora };
  return { data: `${DITET[dita]}, ${d.getDate()} ${MUAJT[muaji]} ${d.getFullYear()}`, ora };
}

export type KontekstiIRaportit = {
  lloji: LlojiVizites;
  pronaEmri: string;
  mikuEmri: string;
  koha: string | null; // when the evidence was sent (ISO), or the visit day "YYYY-MM-DD"
  fotot: number;
  zeriSekonda: number | null;
  kaGps: boolean;
};

// The opening sentence: who visited what, and when.
function hyrja(k: KontekstiIRaportit, gjuha: Gjuha): string {
  const kur = k.koha ? dataNeGjuhen(k.koha.length === 10 ? `${k.koha}T12:00:00` : k.koha, gjuha) : null;
  const meOre = k.koha !== null && k.koha.length > 10;
  const prindert = k.lloji === "kujdes";
  if (gjuha === "de") {
    const cfare = prindert ? `Ihre Eltern („${k.pronaEmri}“)` : `„${k.pronaEmri}“`;
    if (!kur) return `${k.mikuEmri} hat ${cfare} besucht.`;
    return `${k.mikuEmri} hat ${cfare} am ${kur.data}${meOre ? ` um ${kur.ora} Uhr` : ""} besucht.`;
  }
  if (gjuha === "en") {
    const cfare = prindert ? `your parents (“${k.pronaEmri}”)` : `“${k.pronaEmri}”`;
    if (!kur) return `${k.mikuEmri} visited ${cfare}.`;
    return `${k.mikuEmri} visited ${cfare} on ${kur.data}${meOre ? ` at ${kur.ora}` : ""}.`;
  }
  const cfare = prindert ? `i vizitoi prindërit te “${k.pronaEmri}”` : `e vizitoi pronën “${k.pronaEmri}”`;
  if (!kur) return `${k.mikuEmri} ${cfare}.`;
  return `${k.mikuEmri} ${cfare} ${kur.data}${meOre ? `, në orën ${kur.ora}` : ""}.`;
}

// "GPS location, 4 photos and a voice note (01:20)."
function deshmite(k: KontekstiIRaportit, gjuha: Gjuha): string {
  const zeri = k.zeriSekonda !== null ? kohezgjatjaNeTekst(k.zeriSekonda) : null;
  const pjeset: string[] = [];
  if (gjuha === "de") {
    if (k.kaGps) pjeset.push("GPS-Standort an der Immobilie");
    if (k.fotot > 0) pjeset.push(k.fotot === 1 ? "1 Live-Foto" : `${k.fotot} Live-Fotos`);
    if (zeri) pjeset.push(`eine Sprachnotiz (${zeri})`);
  } else if (gjuha === "en") {
    if (k.kaGps) pjeset.push("GPS location at the property");
    if (k.fotot > 0) pjeset.push(k.fotot === 1 ? "1 live photo" : `${k.fotot} live photos`);
    if (zeri) pjeset.push(`a voice note (${zeri})`);
  } else {
    if (k.kaGps) pjeset.push("vendndodhja GPS te prona");
    if (k.fotot > 0) pjeset.push(`${k.fotot} foto të drejtpërdrejta`);
    if (zeri) pjeset.push(`shënim zanor (${zeri})`);
  }
  if (pjeset.length === 0) return "";
  const dhe = gjuha === "de" ? " und " : gjuha === "en" ? " and " : " dhe ";
  const lista = pjeset.length === 1 ? pjeset[0] : `${pjeset.slice(0, -1).join(", ")}${dhe}${pjeset[pjeset.length - 1]}`;
  return `${lista.charAt(0).toUpperCase()}${lista.slice(1)}.`;
}

export type RaportiIShkruar = {
  titulli: string;
  lloji: string;
  hyrja: string;
  deshmite: string;
  perfundimi: { vlera: Perfundimi; emri: string; teksti: string; ikona: IconName };
  numrat: Record<Gjendja, number>;
  pikat: { id: string; ikona: IconName; emri: string; gjendja: Gjendja; gjendjaEmri: string; koment: string }[];
  shenimi: string;
  fjalet: (typeof FJALET)[Gjuha];
};

// The whole report in one language.
export function shkruajRaportin(r: RaportiIMikut, k: KontekstiIRaportit, gjuha: Gjuha): RaportiIShkruar {
  const fjalet = FJALET[gjuha];
  const pikatELlojit = PIKAT[k.lloji];
  const numrat: Record<Gjendja, number> = { mire: 0, problem: 0, pa_kontrolluar: 0 };
  const pikat = r.pikat.flatMap((p) => {
    const pika = pikatELlojit.find((x) => x.id === p.id);
    if (!pika) return []; // a point this version of the app does not know
    numrat[p.gjendja] += 1;
    const gjendja = GJENDJET.find((g) => g.vlera === p.gjendja) ?? GJENDJET[2];
    return [{ id: p.id, ikona: pika.ikona, emri: pika.emri[gjuha], gjendja: p.gjendja, gjendjaEmri: gjendja.emri[gjuha], koment: p.koment.trim() }];
  });
  const p = PERFUNDIMET.find((x) => x.vlera === r.perfundimi) ?? PERFUNDIMET[0];
  return {
    titulli: fjalet.titulli,
    lloji: fjalet.llojet[k.lloji],
    hyrja: hyrja(k, gjuha),
    deshmite: deshmite(k, gjuha),
    perfundimi: { vlera: p.vlera, emri: p.emri[gjuha], teksti: p.teksti[gjuha], ikona: p.ikona },
    numrat,
    pikat,
    shenimi: r.shenimi.trim(),
    fjalet,
  };
}

// ---------------------------------------------------------------------------------------------
// The Miku's form

export function draftIBosh(lloji: LlojiVizites): DraftIRaportit {
  const pikat: DraftIRaportit["pikat"] = {};
  for (const p of PIKAT[lloji]) pikat[p.id] = { gjendja: null, koment: "" };
  return { pikat, perfundimi: null, shenimi: "" };
}

export function draftNgaRaporti(r: RaportiIMikut, lloji: LlojiVizites): DraftIRaportit {
  const d = draftIBosh(lloji);
  for (const p of r.pikat) if (d.pikat[p.id]) d.pikat[p.id] = { gjendja: p.gjendja, koment: p.koment };
  return { ...d, perfundimi: r.perfundimi, shenimi: r.shenimi };
}

// The finished report, or what is still missing (in Albanian, for the Miku).
export function kontrolloDraftin(d: DraftIRaportit, lloji: LlojiVizites): { raporti: RaportiIMikut } | { gabim: string } {
  const pikat: RaportiIMikut["pikat"] = [];
  for (const p of PIKAT[lloji]) {
    const v = d.pikat[p.id];
    if (!v?.gjendja) return { gabim: `Zgjidh gjendjen për “${p.emri.sq}”.` };
    const koment = v.koment.trim();
    if (v.gjendja === "problem" && koment.length < KOMENTI_MIN) {
      return { gabim: `Shkruaj shkurt çka nuk është në rregull te “${p.emri.sq}”.` };
    }
    pikat.push({ id: p.id, gjendja: v.gjendja, koment: koment.slice(0, KOMENTI_MAX) });
  }
  if (!d.perfundimi) return { gabim: "Zgjidh përfundimin e vizitës." };
  return { raporti: { pikat, perfundimi: d.perfundimi, shenimi: d.shenimi.trim().slice(0, SHENIMI_MAX) } };
}

// How many points have an answer, for the step chip and the progress line.
export function saPikaGati(d: DraftIRaportit, lloji: LlojiVizites): { gati: number; gjithsej: number } {
  const lista = PIKAT[lloji];
  return { gati: lista.filter((p) => d.pikat[p.id]?.gjendja).length, gjithsej: lista.length };
}

// ---------------------------------------------------------------------------------------------
// Reading and saving

const GJENDJET_E_LEJUARA = new Set<string>(["mire", "problem", "pa_kontrolluar"]);
const PERFUNDIMET_E_LEJUARA = new Set<string>(["mire", "vemendje", "urgjent"]);

// The stored JSON, checked (anything unexpected gives null).
export function lexoRaportin(json: unknown): RaportiIMikut | null {
  if (!json || typeof json !== "object") return null;
  const o = json as { pikat?: unknown; perfundimi?: unknown; shenimi?: unknown };
  if (!Array.isArray(o.pikat) || typeof o.perfundimi !== "string" || !PERFUNDIMET_E_LEJUARA.has(o.perfundimi)) return null;
  const pikat: RaportiIMikut["pikat"] = [];
  for (const p of o.pikat) {
    if (!p || typeof p !== "object") continue;
    const x = p as { id?: unknown; gjendja?: unknown; koment?: unknown };
    if (typeof x.id !== "string" || typeof x.gjendja !== "string" || !GJENDJET_E_LEJUARA.has(x.gjendja)) continue;
    pikat.push({ id: x.id, gjendja: x.gjendja as Gjendja, koment: typeof x.koment === "string" ? x.koment : "" });
  }
  return { pikat, perfundimi: o.perfundimi as Perfundimi, shenimi: typeof o.shenimi === "string" ? o.shenimi : "" };
}

export type BurimiIRaportit = "duke_ngarkuar" | "supabase" | "lokal" | "mungon" | "pa_lidhje";

export const MUNGON_RAPORTET = "Raporti i shkruar ruhet pasi të ekzekutohet supabase/raportet.sql në Supabase.";

// Reports of phone-only visits (ids starting with "lokal-"), until the app is closed.
const lokale = new Map<string, { raporti: RaportiIMikut; shkruarAt: string }>();

type Rresht = { permbajtja: unknown; shkruar_at: string };

export function useRaporti(vizitaId: string | undefined): {
  raporti: RaportiIMikut | null;
  shkruarAt: string | null;
  burimi: BurimiIRaportit;
  ruaj: (r: RaportiIMikut) => Promise<string | null>;
  rifresko: () => Promise<void>;
} {
  const eLokale = vizitaId?.startsWith("lokal-") ?? false;
  const [gjendja, setGjendja] = useState<{ raporti: RaportiIMikut | null; shkruarAt: string | null; burimi: BurimiIRaportit }>({
    raporti: null,
    shkruarAt: null,
    burimi: "duke_ngarkuar",
  });
  const gjenerata = useRef(0);

  // another visit: clear the previous report while rendering, so it never shows under the new one
  const [idParaprak, setIdParaprak] = useState(vizitaId);
  if (idParaprak !== vizitaId) {
    setIdParaprak(vizitaId);
    setGjendja({ raporti: null, shkruarAt: null, burimi: "duke_ngarkuar" });
  }

  const rifresko = useCallback(async () => {
    if (!vizitaId) return;
    const gj = ++gjenerata.current;
    if (eLokale) {
      const l = lokale.get(vizitaId);
      setGjendja({ raporti: l?.raporti ?? null, shkruarAt: l?.shkruarAt ?? null, burimi: "lokal" });
      return;
    }
    const r = await lexo<Rresht[]>(supabase.from("raportet").select("permbajtja, shkruar_at").eq("vizita_id", vizitaId).limit(1));
    if (gj !== gjenerata.current) return;
    if (r.tipi === "pa_lidhje") {
      setGjendja((g) => (g.burimi === "supabase" ? g : { raporti: null, shkruarAt: null, burimi: "pa_lidhje" }));
      return;
    }
    if (r.tipi === "mungon") {
      setGjendja({ raporti: null, shkruarAt: null, burimi: "mungon" });
      return;
    }
    const rreshti = r.data[0];
    setGjendja({
      raporti: rreshti ? lexoRaportin(rreshti.permbajtja) : null,
      shkruarAt: rreshti?.shkruar_at ?? null,
      burimi: "supabase",
    });
  }, [vizitaId, eLokale]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- a load: Supabase rows arrive after an await; a local demo visit is read at once
    void rifresko();
  }, [rifresko]);

  const ruaj = useCallback(
    async (raporti: RaportiIMikut): Promise<string | null> => {
      if (!vizitaId) return "Vizita nuk u gjet.";
      const tani = new Date().toISOString();
      if (eLokale) {
        lokale.set(vizitaId, { raporti, shkruarAt: tani });
        setGjendja({ raporti, shkruarAt: tani, burimi: "lokal" });
        return null;
      }
      try {
        // a new report is inserted; when one exists already (23505), it is changed
        let pergjigja = await supabase.from("raportet").insert({ vizita_id: vizitaId, permbajtja: raporti, versioni: 1 });
        if (pergjigja.error?.code === "23505") {
          pergjigja = await supabase.from("raportet").update({ permbajtja: raporti, versioni: 1 }).eq("vizita_id", vizitaId);
        }
        const { error } = pergjigja;
        if (error) {
          if (!error.code) return PA_LIDHJE;
          console.warn("raportet:", error.message);
          if (error.code === "42P01" || error.code === "PGRST205") return MUNGON_RAPORTET;
          if (error.code === "42501") return "Raportin mund ta shkruajë vetëm Miku i vizitës, dhe vetëm gjatë vizitës.";
          if (error.code === "23514") return "Raporti nuk është i plotë. Kontrollo pikat dhe provo përsëri.";
          return "Raporti nuk u ruajt. Provo përsëri.";
        }
        setGjendja({ raporti, shkruarAt: tani, burimi: "supabase" });
        return null;
      } catch {
        return PA_LIDHJE;
      }
    },
    [vizitaId, eLokale],
  );

  return { ...gjendja, ruaj, rifresko };
}
