import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AppState } from "react-native";

import { PA_LIDHJE, lexo, type Lexim } from "./lexo";
import { useSesioni } from "./sesioni";
import { supabase } from "./supabase";

// Who the signed-in user is in the app: a Klient (family abroad), a Miku (local visitor)
// or an Admin (the Urëza team). The profile lives in the `profiles` table
// (supabase/roli.sql); Row Level Security shows each user only their own row.
//
// While that table does not exist yet, the choice is kept on the phone only ("demo"),
// so the screens can still be tried.
//
// The settings of the profile (phone, language of the reports, notification choices, the request
// to delete the account) are more columns of the same row (supabase/profili.sql). While those
// columns do not exist yet, the settings are kept on the phone only.

export type Roli = "klient" | "miku" | "admin";
export type Profili = { emri: string; roli: Roli };

export type Gjuha = "sq" | "de" | "en";
export const GJUHET: { kodi: Gjuha; emri: string }[] = [
  { kodi: "sq", emri: "Shqip" },
  { kodi: "de", emri: "Deutsch" },
  { kodi: "en", emri: "English" },
];

export type Cilesimet = {
  telefoni: string | null;
  gjuha: Gjuha; // the language the reports are wanted in (chosen now, used when translation arrives)
  njoftoPranimin: boolean;
  njoftoRaportin: boolean;
  njoftoKujtesen: boolean;
};
export const CILESIMET_BAZE: Cilesimet = {
  telefoni: null,
  gjuha: "sq",
  njoftoPranimin: true,
  njoftoRaportin: true,
  njoftoKujtesen: false,
};
// What can be changed in one go: the name (a column of its own) and any of the settings.
export type Ndryshimet = Partial<Cilesimet> & { emri?: string };
export type BurimiProfilit = "duke_ngarkuar" | "supabase" | "demo" | "pa_lidhje";

export const EMRAT_E_ROLEVE: Record<Roli, string> = { klient: "Klient", miku: "Miku", admin: "Admin" };

// The role (and name) the person gave before signing in. After signing in it becomes the
// profile: created for a new account, or switching the role of an existing one.
export type Deklarimi = { roli: "klient" | "miku"; emri: string | null };

type Konteksti = {
  profili: Profili | null; // null = no role chosen yet
  burimi: BurimiProfilit;
  deklarimi: Deklarimi | null;
  // true while the declared role is being turned into the profile (the app waits, then opens)
  dukePergatitur: boolean;
  deklaroRolin: (roli: "klient" | "miku") => void;
  deklaroEmrin: (emri: string) => void;
  // Saves the name and the role (Admin cannot be chosen here). Returns an error message, or null.
  ruaje: (emri: string, roli: "klient" | "miku") => Promise<string | null>;
  rifresko: () => Promise<void>;

  cilesimet: Cilesimet;
  // true when the settings are saved in the account; false while they live on this phone only
  cilesimetNeLlogari: boolean;
  // Saves the name and/or settings in one request. Returns an error message, or null.
  ruajTeDhenat: (n: Ndryshimet) => Promise<string | null>;
  // When the user asked for the account to be deleted (ISO time), or null.
  fshirjaKerkuar: string | null;
  // Asks the Urëza team to delete the account (true) or takes the request back (false).
  kerkoFshirjen: (kerkuar: boolean) => Promise<string | null>;
};

type Rresht = { emri: string; roli: Roli };
type RreshtPlote = Rresht & {
  telefoni: string | null;
  gjuha_raporteve: string;
  njofto_pranimin: boolean;
  njofto_raportin: boolean;
  njofto_kujtesen: boolean;
  fshirja_kerkuar_at: string | null;
};

const SHTYLLAT_BAZE = "emri, roli";
const SHTYLLAT_PLOTE = `${SHTYLLAT_BAZE}, telefoni, gjuha_raporteve, njofto_pranimin, njofto_raportin, njofto_kujtesen, fshirja_kerkuar_at`;
const MUNGON_CILESIMET = "Për ta dërguar kërkesën duhet të ekzekutohet supabase/profili.sql në Supabase.";

function ngaRreshti(r: RreshtPlote): Cilesimet {
  return {
    telefoni: r.telefoni,
    gjuha: r.gjuha_raporteve === "de" || r.gjuha_raporteve === "en" ? r.gjuha_raporteve : "sq",
    njoftoPranimin: r.njofto_pranimin,
    njoftoRaportin: r.njofto_raportin,
    njoftoKujtesen: r.njofto_kujtesen,
  };
}

const CELESI = (uid: string) => `ureza-profili-${uid}`;

// Only used in demo mode (the table is missing): the choice survives closing the app.
function lexoLokal(uid: string): Profili | null {
  try {
    const tekst = localStorage.getItem(CELESI(uid));
    if (!tekst) return null;
    const p = JSON.parse(tekst) as Partial<Profili>;
    if (typeof p.emri === "string" && (p.roli === "klient" || p.roli === "miku")) return { emri: p.emri, roli: p.roli };
  } catch {
    // storage not available: the choice just is not remembered
  }
  return null;
}

function ruajLokal(uid: string, profili: Profili) {
  try {
    localStorage.setItem(CELESI(uid), JSON.stringify(profili));
  } catch {
    // see above
  }
}

const CELESI_CILESIMET = (uid: string) => `ureza-cilesimet-${uid}`;

// Only used while the columns of supabase/profili.sql are missing: the settings stay on the phone.
function lexoCilesimetLokal(uid: string): Cilesimet {
  try {
    const tekst = localStorage.getItem(CELESI_CILESIMET(uid));
    if (!tekst) return CILESIMET_BAZE;
    const c = JSON.parse(tekst) as Partial<Cilesimet>;
    return {
      telefoni: typeof c.telefoni === "string" && c.telefoni !== "" ? c.telefoni : null,
      gjuha: c.gjuha === "de" || c.gjuha === "en" ? c.gjuha : "sq",
      njoftoPranimin: typeof c.njoftoPranimin === "boolean" ? c.njoftoPranimin : CILESIMET_BAZE.njoftoPranimin,
      njoftoRaportin: typeof c.njoftoRaportin === "boolean" ? c.njoftoRaportin : CILESIMET_BAZE.njoftoRaportin,
      njoftoKujtesen: typeof c.njoftoKujtesen === "boolean" ? c.njoftoKujtesen : CILESIMET_BAZE.njoftoKujtesen,
    };
  } catch {
    return CILESIMET_BAZE;
  }
}

function ruajCilesimetLokal(uid: string, c: Cilesimet) {
  try {
    localStorage.setItem(CELESI_CILESIMET(uid), JSON.stringify(c));
  } catch {
    // storage not available: the settings are just not remembered
  }
}

// The messages of the database, in Albanian where the app knows what went wrong.
function gabimiNgaServeri(error: { code?: string; message: string }): string {
  if (!error.code) return PA_LIDHJE;
  if (error.code === "23514") return "Serveri nuk i pranoi të dhënat. Kontrollo emrin dhe numrin e telefonit.";
  if (error.code === "42501") return "Nuk ke të drejtë ta ndryshosh këtë.";
  return error.message;
}

const ProfiliContext = createContext<Konteksti | null>(null);

export function ProfiliProvider({ children }: { children: ReactNode }) {
  const { perdoruesi } = useSesioni();
  const uid = perdoruesi?.id ?? null;

  const [profili, setProfili] = useState<Profili | null>(null);
  const [burimi, setBurimi] = useState<BurimiProfilit>("duke_ngarkuar");
  const [deklarimi, setDeklarimi] = useState<Deklarimi | null>(null);
  const [cilesimet, setCilesimet] = useState<Cilesimet>(CILESIMET_BAZE);
  const [cilesimetNeLlogari, setCilesimetNeLlogari] = useState(false);
  const [fshirjaKerkuar, setFshirjaKerkuar] = useState<string | null>(null);
  const cilesimetRef = useRef(cilesimet); // the latest settings, for requests sent one after another
  const duke = useRef(false); // the declared role is being saved
  const gjenerata = useRef(0); // drops answers that arrive after the user changed

  // Somebody signed in, signed out or another user signed in: forget the previous user's data.
  // Done while rendering (not in an effect) so no screen draws a frame with the old user's data.
  const [uidParaprak, setUidParaprak] = useState(uid);
  if (uidParaprak !== uid) {
    setUidParaprak(uid);
    setProfili(null);
    setCilesimet(CILESIMET_BAZE);
    setCilesimetNeLlogari(false);
    setFshirjaKerkuar(null);
    setBurimi("duke_ngarkuar");
    if (!uid) setDeklarimi(null); // signing out forgets what was declared
  } else if (
    uid !== null &&
    deklarimi !== null &&
    (burimi === "supabase" || burimi === "demo") &&
    (profili?.roli === "admin" || profili?.roli === deklarimi.roli)
  ) {
    // the profile already has the declared role (an Admin stays Admin): nothing left to save
    setDeklarimi(null);
  }

  const rifresko = useCallback(async () => {
    if (!uid) return;
    const gj = ++gjenerata.current;
    // The settings columns exist after supabase/profili.sql; without them only name and role are read.
    let plote = true;
    // Filtered by id on purpose: the policies return only the user's own row today, but the first
    // row must never be somebody else's if a role is ever allowed to read more profiles.
    let r: Lexim<Partial<RreshtPlote>[]> = await lexo(supabase.from("profiles").select(SHTYLLAT_PLOTE).eq("id", uid));
    if (r.tipi === "mungon" && r.kodi === "42703") {
      plote = false;
      r = await lexo(supabase.from("profiles").select(SHTYLLAT_BAZE).eq("id", uid));
    }
    if (gj !== gjenerata.current) return;

    if (r.tipi === "pa_lidhje") {
      // keep what is already on screen
      setBurimi((b) => (b === "supabase" || b === "demo" ? b : "pa_lidhje"));
      return;
    }
    if (r.tipi === "mungon") {
      setProfili(lexoLokal(uid));
      setCilesimet(lexoCilesimetLokal(uid));
      setCilesimetNeLlogari(false);
      setFshirjaKerkuar(null);
      setBurimi("demo");
      return;
    }
    const rreshti = r.data[0] as RreshtPlote | undefined;
    setProfili(rreshti ? { emri: rreshti.emri, roli: rreshti.roli } : null);
    if (plote) {
      setCilesimet(rreshti ? ngaRreshti(rreshti) : CILESIMET_BAZE);
      setCilesimetNeLlogari(true);
      setFshirjaKerkuar(rreshti?.fshirja_kerkuar_at ?? null);
    } else {
      setCilesimet(lexoCilesimetLokal(uid));
      setCilesimetNeLlogari(false);
      setFshirjaKerkuar(null);
    }
    setBurimi("supabase");
  }, [uid]);

  // Load when somebody signs in (the old data was already cleared while rendering, above).
  useEffect(() => {
    gjenerata.current++;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- rifresko sets state only after its first await
    void rifresko();
  }, [uid, rifresko]);

  useEffect(() => {
    cilesimetRef.current = cilesimet;
  }, [cilesimet]);

  // Coming back to the app (e.g. after running roli.sql in Supabase) loads the profile again.
  useEffect(() => {
    const abonimi = AppState.addEventListener("change", (gjendja) => {
      if (gjendja === "active") void rifresko();
    });
    return () => abonimi.remove();
  }, [rifresko]);

  const ruaje = useCallback(
    async (emri: string, roli: "klient" | "miku"): Promise<string | null> => {
      if (!uid) return "Hyr përsëri në llogari.";
      if (burimi === "duke_ngarkuar") return "Të dhënat po ngarkohen. Provo pas një çasti.";
      const i_ri: Profili = { emri, roli };

      if (burimi === "demo") {
        ruajLokal(uid, i_ri);
        setProfili(i_ri);
        return null;
      }

      try {
        const ekziston = profili !== null;
        const { data, error } = ekziston
          ? await supabase.from("profiles").update({ emri, roli }).eq("id", uid).select("emri, roli")
          : await supabase.from("profiles").insert({ id: uid, emri, roli }).select("emri, roli");
        if (error) return error.code ? error.message : PA_LIDHJE;
        const rreshti = (data as Rresht[] | null)?.[0];
        if (!rreshti) return "Profili nuk u ruajt. Provo përsëri.";
        setProfili(rreshti);
        setBurimi("supabase");
        return null;
      } catch {
        return PA_LIDHJE;
      }
    },
    [uid, burimi, profili],
  );

  const ruajTeDhenat = useCallback(
    async (n: Ndryshimet): Promise<string | null> => {
      if (!uid) return "Hyr përsëri në llogari.";
      if (burimi === "duke_ngarkuar") return "Të dhënat po ngarkohen. Provo pas një çasti.";
      if (!profili) return "Zgjidh rolin para se t'i ruash të dhënat.";
      const { emri, ...cil } = n;
      const cilesimetERi: Cilesimet = { ...cilesimetRef.current, ...cil };
      const emriIRi = emri ?? profili.emri;

      // the table of profiles is missing: everything stays on the phone
      if (burimi === "demo") {
        ruajLokal(uid, { emri: emriIRi, roli: profili.roli });
        ruajCilesimetLokal(uid, cilesimetERi);
        cilesimetRef.current = cilesimetERi;
        setProfili({ emri: emriIRi, roli: profili.roli });
        setCilesimet(cilesimetERi);
        return null;
      }

      // the settings columns are missing: the settings stay on the phone, the name goes to the account
      if (!cilesimetNeLlogari) {
        ruajCilesimetLokal(uid, cilesimetERi);
        cilesimetRef.current = cilesimetERi;
        setCilesimet(cilesimetERi);
      }

      const fusha: Record<string, unknown> = {};
      if (emri !== undefined) fusha.emri = emri;
      if (cilesimetNeLlogari) {
        if (cil.telefoni !== undefined) fusha.telefoni = cil.telefoni;
        if (cil.gjuha !== undefined) fusha.gjuha_raporteve = cil.gjuha;
        if (cil.njoftoPranimin !== undefined) fusha.njofto_pranimin = cil.njoftoPranimin;
        if (cil.njoftoRaportin !== undefined) fusha.njofto_raportin = cil.njoftoRaportin;
        if (cil.njoftoKujtesen !== undefined) fusha.njofto_kujtesen = cil.njoftoKujtesen;
      }
      if (Object.keys(fusha).length === 0) return null;

      try {
        const { data, error } = await supabase
          .from("profiles")
          .update(fusha)
          .eq("id", uid)
          .select(cilesimetNeLlogari ? SHTYLLAT_PLOTE : SHTYLLAT_BAZE);
        if (error) return gabimiNgaServeri(error);
        // the columns are chosen at run time, so the type of the select text is not known here
        const rreshti = (data as unknown as RreshtPlote[] | null)?.[0];
        if (!rreshti) return "Ndryshimi nuk u ruajt. Provo përsëri.";
        setProfili({ emri: rreshti.emri, roli: rreshti.roli });
        if (cilesimetNeLlogari) {
          const c = ngaRreshti(rreshti);
          cilesimetRef.current = c;
          setCilesimet(c);
        }
        return null;
      } catch {
        return PA_LIDHJE;
      }
    },
    [uid, burimi, profili, cilesimetNeLlogari],
  );

  const kerkoFshirjen = useCallback(
    async (kerkuar: boolean): Promise<string | null> => {
      if (!uid) return "Hyr përsëri në llogari.";
      if (burimi !== "supabase" || !cilesimetNeLlogari) return MUNGON_CILESIMET;
      try {
        const { data, error } = await supabase.rpc("kerko_fshirjen", { kerkuar });
        if (error) {
          if (error.code === "PGRST202" || error.code === "42883") return MUNGON_CILESIMET;
          return gabimiNgaServeri(error);
        }
        setFshirjaKerkuar(typeof data === "string" ? data : null);
        return null;
      } catch {
        return PA_LIDHJE;
      }
    },
    [uid, burimi, cilesimetNeLlogari],
  );

  const deklaroRolin = useCallback((roli: "klient" | "miku") => {
    setDeklarimi((d) => ({ roli, emri: d?.emri ?? null }));
  }, []);

  const deklaroEmrin = useCallback((emri: string) => {
    setDeklarimi((d) => ({ roli: d?.roli ?? "klient", emri }));
  }, []);

  // Signed in with a declared role: make the profile match it. An Admin stays Admin; an
  // account with no profile and no name (an older account) is asked for its name on the role screen.
  const emriPerRuajtje = profili?.emri ?? deklarimi?.emri ?? null;
  const duhetRuajtur =
    uid !== null &&
    deklarimi !== null &&
    (burimi === "supabase" || burimi === "demo") &&
    profili?.roli !== "admin" &&
    profili?.roli !== deklarimi.roli &&
    emriPerRuajtje !== null;
  const dukePergatitur = duhetRuajtur;

  useEffect(() => {
    if (uid === null || deklarimi === null || (burimi !== "supabase" && burimi !== "demo")) return;
    // already matching: cleared while rendering (see the top of ProfiliProvider)
    if (profili?.roli === "admin" || profili?.roli === deklarimi.roli) return;
    if (emriPerRuajtje === null || duke.current) return;
    duke.current = true;
    void ruaje(emriPerRuajtje, deklarimi.roli).finally(() => {
      duke.current = false;
      setDeklarimi(null);
    });
  }, [uid, deklarimi, burimi, profili, emriPerRuajtje, ruaje]);

  const vlera = useMemo<Konteksti>(
    () => ({
      profili,
      burimi,
      deklarimi,
      dukePergatitur,
      deklaroRolin,
      deklaroEmrin,
      ruaje,
      rifresko,
      cilesimet,
      cilesimetNeLlogari,
      ruajTeDhenat,
      fshirjaKerkuar,
      kerkoFshirjen,
    }),
    [
      profili,
      burimi,
      deklarimi,
      dukePergatitur,
      deklaroRolin,
      deklaroEmrin,
      ruaje,
      rifresko,
      cilesimet,
      cilesimetNeLlogari,
      ruajTeDhenat,
      fshirjaKerkuar,
      kerkoFshirjen,
    ],
  );

  return <ProfiliContext.Provider value={vlera}>{children}</ProfiliContext.Provider>;
}

export function useProfili(): Konteksti {
  const vlera = useContext(ProfiliContext);
  if (!vlera) throw new Error("useProfili must be used inside ProfiliProvider");
  return vlera;
}
