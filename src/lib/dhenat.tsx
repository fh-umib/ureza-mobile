import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AppState } from "react-native";

import type { Koordinata } from "./gjeo";
import { PA_LIDHJE, lexo } from "./lexo";
import { PRONAT_DEMO, type Lloji, type Prona } from "./pronat";
import { useProfili } from "./profili";
import { useSesioni } from "./sesioni";
import { supabase } from "./supabase";
import type { LlojiVizites, Statusi, VendimiAdminit, Vizita } from "./vizitat";

// The signed-in user's properties and visits, shared by every screen.
// Row Level Security in Supabase returns only their own rows.
//
// While a table does not exist yet (supabase/pronat.sql, supabase/vizitat.sql have
// not been run) the screens still work: properties come from a demo list and the
// changes stay on the phone until the app is closed.

export type Burimi = "duke_ngarkuar" | "supabase" | "demo" | "pa_lidhje";

export type RezultatiShtimit = { gabim: string | null; ruajtur: boolean };

export type KerkeseVizite = { pronaId: string; lloji: LlojiVizites; data: string; udhezime: string };

type Dhenat = {
  pronat: Prona[];
  burimiPronat: Burimi;
  vizitat: Vizita[];
  burimiVizitat: Burimi;
  // Saving a property also saves its exact position when one is given. When the property was saved
  // but the position was not, `ruajtur` is true and `gabim` says why.
  shtoPronen: (emri: string, vendi: string, lloji: Lloji, koordinatat?: Koordinata | null) => Promise<RezultatiShtimit>;
  // Sets the exact position of one of the client's properties (null removes it); returns an error
  // message, or null when it worked.
  vendosVendndodhjen: (pronaId: string, koordinatat: Koordinata | null) => Promise<string | null>;
  // The next ones return an error message, or null when it worked.
  kerkoVizite: (kerkesa: KerkeseVizite) => Promise<string | null>;
  anuloVizite: (id: string) => Promise<string | null>;
  // A Miku accepts an open request (the database allows this only for the Miku role).
  pranoVizite: (id: string) => Promise<string | null>;
  // The Miku starts an accepted visit (on site), and later sends the evidence.
  filloVizite: (id: string) => Promise<string | null>;
  dergoRaportin: (id: string) => Promise<string | null>;
  // The client approves the report, or objects to it with a reason (the database allows this
  // only for the client who owns the visit, and only while the report is ready).
  vendosRaportin: (id: string, miratuar: boolean, arsyeja?: string) => Promise<string | null>;
  // An admin closes a disputed case: the client was right, or the report stands, with a note
  // (the database allows this only for an admin, and only once per case).
  shqyrtoRastin: (id: string, neFavorTeKlientit: boolean, shenimi: string) => Promise<string | null>;
  rifresko: () => Promise<void>;
};

const SHTYLLAT_PRONA = "id, emri, vendi, lloji";
// The exact positions are a table of their own (supabase/harta.sql): the database shows a Miku
// only the ones of the visits they hold.
const SHTYLLAT_VENDI = "prona_id, gjeresia, gjatesia";
const MUNGON_VENDI = "Për ta ruajtur vendndodhjen e saktë duhet të ekzekutohet supabase/harta.sql në Supabase.";

type RreshtProne = Omit<Prona, "koordinatat">;
type RreshtVendi = { prona_id: string; gjeresia: number; gjatesia: number };

// Positions set while the properties are demo ones (they only live until the app is closed).
function meVendetLokale(lista: Prona[], vendet: Map<string, Koordinata | null>): Prona[] {
  return lista.map((p) => (vendet.has(p.id) ? { ...p, koordinatat: vendet.get(p.id) ?? null } : p));
}
const SHTYLLAT_BAZE = "id, prona_id, lloji, data_vizites, udhezime, statusi, created_at";
// The Miku columns exist after supabase/roli.sql, the start/send times after supabase/deshmia.sql,
// the decision after supabase/raporti.sql, the admin's review after supabase/admini.sql; each
// level is tried in turn until the database knows all its columns.
const SHTYLLAT_ME_MIKUN = `${SHTYLLAT_BAZE}, miku_id, miku_emri, pranuar_at`;
const SHTYLLAT_ME_DESHMI = `${SHTYLLAT_ME_MIKUN}, filluar_at, derguar_at`;
const SHTYLLAT_ME_VENDIM = `${SHTYLLAT_ME_DESHMI}, vendosur_at, arsyeja`;
const SHTYLLAT_PLOTE = `${SHTYLLAT_ME_VENDIM}, shqyrtuar_at, vendimi_adminit, shenimi_adminit`;
const NIVELET_E_SHTYLLAVE = [SHTYLLAT_PLOTE, SHTYLLAT_ME_VENDIM, SHTYLLAT_ME_DESHMI, SHTYLLAT_ME_MIKUN, SHTYLLAT_BAZE];
// The highest level (index above) at which each step's columns still exist.
const NIVELI_ADMIN = 0;
const NIVELI_RAPORTI = 1;
const NIVELI_DESHMIA = 2;
const NIVELI_MIKU = 3;
const MUNGON_RAPORTI = "Për ta vendosur raportin duhet të ekzekutohet supabase/raporti.sql në Supabase.";
const MUNGON_ADMINI = "Për ta shqyrtuar rastin duhet të ekzekutohet supabase/admini.sql në Supabase.";

type RreshtVizite = {
  id: string;
  prona_id: string;
  lloji: LlojiVizites;
  data_vizites: string;
  udhezime: string;
  statusi: Statusi;
  created_at: string;
  miku_id?: string | null;
  miku_emri?: string | null;
  pranuar_at?: string | null;
  filluar_at?: string | null;
  derguar_at?: string | null;
  vendosur_at?: string | null;
  arsyeja?: string | null;
  shqyrtuar_at?: string | null;
  vendimi_adminit?: VendimiAdminit | null;
  shenimi_adminit?: string | null;
};

// Typed as a plain string on purpose: which columns exist depends on which SQL files were run.
function shtyllatEVizitave(niveli: number): string {
  return NIVELET_E_SHTYLLAVE[Math.min(niveli, NIVELET_E_SHTYLLAVE.length - 1)];
}

function ngaRreshti(r: RreshtVizite): Vizita {
  return {
    id: r.id,
    pronaId: r.prona_id,
    lloji: r.lloji,
    data: r.data_vizites,
    udhezime: r.udhezime,
    statusi: r.statusi,
    krijuar: r.created_at,
    mikuId: r.miku_id ?? null,
    mikuEmri: r.miku_emri ?? null,
    pranuarAt: r.pranuar_at ?? null,
    filluarAt: r.filluar_at ?? null,
    derguarAt: r.derguar_at ?? null,
    vendosurAt: r.vendosur_at ?? null,
    arsyeja: r.arsyeja ?? null,
    shqyrtuarAt: r.shqyrtuar_at ?? null,
    vendimiAdminit: r.vendimi_adminit ?? null,
    shenimiAdminit: r.shenimi_adminit ?? null,
  };
}

// Latest visit day first; for the same day, the most recently requested first.
function rendit(vizitat: Vizita[]): Vizita[] {
  return [...vizitat].sort((a, b) => b.data.localeCompare(a.data) || b.krijuar.localeCompare(a.krijuar));
}

const DhenatContext = createContext<Dhenat | null>(null);

export function DhenatProvider({ children }: { children: ReactNode }) {
  const { perdoruesi } = useSesioni();
  const { profili, burimi: burimiProfilit } = useProfili();
  const uid = perdoruesi?.id ?? null;
  const roli = profili?.roli ?? null;
  const emriIMikut = profili?.emri ?? "Miku";

  const [pronat, setPronat] = useState<Prona[]>([]);
  const [burimiPronat, setBurimiPronat] = useState<Burimi>("duke_ngarkuar");
  const [vizitat, setVizitat] = useState<Vizita[]>([]);
  const [burimiVizitat, setBurimiVizitat] = useState<Burimi>("duke_ngarkuar");

  const pronatLokale = useRef<Prona[]>([]); // added while the table is missing
  const vendetLokale = useRef(new Map<string, Koordinata | null>()); // positions set on demo properties
  const vizitatLokale = useRef<Vizita[]>([]);
  const gjenerata = useRef(0); // drops answers that arrive after the user changed
  // 0 = all columns, 1 = without the admin's review (admini.sql not run), 2 = without the decision
  // too (raporti.sql not run), 3 = without the start/send times too (deshmia.sql not run),
  // 4 = without the Miku too (roli.sql not run)
  const niveliShtyllave = useRef(0);

  // Somebody signed in, signed out or another user signed in: clear the previous user's rows.
  // Done while rendering (not in an effect) so no screen draws a frame with the old user's data.
  const [uidParaprak, setUidParaprak] = useState(uid);
  if (uidParaprak !== uid) {
    setUidParaprak(uid);
    setPronat([]);
    setVizitat([]);
    setBurimiPronat("duke_ngarkuar");
    setBurimiVizitat("duke_ngarkuar");
  }

  const rifresko = useCallback(async () => {
    if (!uid) return;
    const gj = ++gjenerata.current;

    const p = await lexo<RreshtProne[]>(supabase.from("pronat").select(SHTYLLAT_PRONA).order("created_at", { ascending: true }));
    if (gj !== gjenerata.current) return;

    if (p.tipi === "pa_lidhje") {
      // keep what is already on screen
      setBurimiPronat((b) => (b === "supabase" ? b : "pa_lidhje"));
      setBurimiVizitat((b) => (b === "supabase" ? b : "pa_lidhje"));
      return;
    }
    if (p.tipi === "mungon") {
      // without properties there can be no real visits either
      setPronat(meVendetLokale([...PRONAT_DEMO, ...pronatLokale.current], vendetLokale.current));
      setBurimiPronat("demo");
      setVizitat(rendit(vizitatLokale.current));
      setBurimiVizitat("demo");
      return;
    }
    // the exact positions (nothing comes back before supabase/harta.sql has been run)
    const q = await lexo<RreshtVendi[]>(supabase.from("pronat_vendi").select(SHTYLLAT_VENDI));
    if (gj !== gjenerata.current) return;
    const vendet = new Map<string, Koordinata>();
    if (q.tipi === "ok") for (const r of q.data) vendet.set(r.prona_id, { lat: r.gjeresia, lng: r.gjatesia });
    setPronat((para) =>
      p.data.map((r) => ({
        ...r,
        // no answer from the server: keep the position that is already on screen
        koordinatat:
          q.tipi === "pa_lidhje" ? (para.find((x) => x.id === r.id)?.koordinatat ?? null) : (vendet.get(r.id) ?? null),
      })),
    );
    setBurimiPronat("supabase");

    const merrVizitat = () =>
      lexo<RreshtVizite[]>(
        supabase
          .from("vizitat")
          .select(shtyllatEVizitave(niveliShtyllave.current))
          .order("data_vizites", { ascending: false })
          .order("created_at", { ascending: false }),
      );
    let v = await merrVizitat();
    while (v.tipi === "mungon" && v.kodi === "42703" && niveliShtyllave.current < NIVELET_E_SHTYLLAVE.length - 1) {
      // "column does not exist": a SQL file has not been run yet, so read the older columns
      niveliShtyllave.current++;
      v = await merrVizitat();
    }
    if (gj !== gjenerata.current) return;

    if (v.tipi === "pa_lidhje") {
      setBurimiVizitat((b) => (b === "supabase" ? b : "pa_lidhje"));
      return;
    }
    if (v.tipi === "mungon") {
      setVizitat(rendit(vizitatLokale.current));
      setBurimiVizitat("demo");
      return;
    }
    setVizitat(v.data.map(ngaRreshti));
    setBurimiVizitat("supabase");
  }, [uid]);

  // Load when somebody signs in; forget what was added locally by the previous user
  // (the rows on screen were already cleared while rendering, above).
  useEffect(() => {
    gjenerata.current++;
    pronatLokale.current = [];
    vendetLokale.current = new Map();
    vizitatLokale.current = [];
    // eslint-disable-next-line react-hooks/set-state-in-effect -- rifresko sets state only after its first await
    void rifresko();
  }, [uid, rifresko]);

  // Switching between Klient and Miku changes which rows the database shows, so load again
  // (without clearing what was added locally in demo mode).
  const roliParaprak = useRef(roli);
  useEffect(() => {
    if (roliParaprak.current !== roli) {
      const para = roliParaprak.current;
      roliParaprak.current = roli;
      if (para !== null) void rifresko();
    }
  }, [roli, rifresko]);

  // Coming back to the app (e.g. after running a SQL file in Supabase) loads the data again.
  useEffect(() => {
    const abonimi = AppState.addEventListener("change", (gjendja) => {
      if (gjendja === "active") void rifresko();
    });
    return () => abonimi.remove();
  }, [rifresko]);

  // Saves the exact position of a property, or removes it with null. The database allows this only
  // for the owner, through one function (supabase/harta.sql); it also checks the numbers.
  const vendosVendndodhjen = useCallback(
    async (pronaId: string, koordinatat: Koordinata | null): Promise<string | null> => {
      const ndrysho = (p: Prona): Prona => (p.id === pronaId ? { ...p, koordinatat } : p);

      if (pronaId.startsWith("demo-") || pronaId.startsWith("lokal-")) {
        vendetLokale.current = new Map(vendetLokale.current).set(pronaId, koordinatat);
        setPronat((p) => p.map(ndrysho));
        return null;
      }
      try {
        const { error } = await supabase.rpc("vendos_vendndodhjen", {
          pid: pronaId,
          lat: koordinatat?.lat ?? null,
          lng: koordinatat?.lng ?? null,
        });
        if (error) {
          if (error.code === "PGRST202" || error.code === "42883") return MUNGON_VENDI;
          return error.code ? error.message : PA_LIDHJE;
        }
        setPronat((p) => p.map(ndrysho));
        return null;
      } catch {
        return PA_LIDHJE;
      }
    },
    [],
  );

  const shtoPronen = useCallback(
    async (emri: string, vendi: string, lloji: Lloji, koordinatat: Koordinata | null = null): Promise<RezultatiShtimit> => {
      if (burimiPronat === "demo") {
        const prona: Prona = { id: `lokal-${Date.now()}`, emri, vendi, lloji, koordinatat };
        pronatLokale.current = [...pronatLokale.current, prona];
        setPronat((p) => [...p, prona]);
        return { gabim: null, ruajtur: true };
      }
      try {
        const { data, error } = await supabase
          .from("pronat")
          .insert({ emri, vendi, lloji })
          .select(SHTYLLAT_PRONA)
          .single();
        if (error) return { gabim: error.code ? error.message : PA_LIDHJE, ruajtur: false };
        if (!data) return { gabim: "Nuk u ruajt prona.", ruajtur: false };
        const prona: Prona = { ...(data as RreshtProne), koordinatat: null };
        setPronat((p) => [...p, prona]);
        setBurimiPronat("supabase");
        if (koordinatat) {
          const gabim = await vendosVendndodhjen(prona.id, koordinatat);
          if (gabim) return { gabim, ruajtur: true };
        }
        return { gabim: null, ruajtur: true };
      } catch {
        return { gabim: PA_LIDHJE, ruajtur: false };
      }
    },
    [burimiPronat, vendosVendndodhjen],
  );

  const kerkoVizite = useCallback(
    async (kerkesa: KerkeseVizite): Promise<string | null> => {
      if (burimiVizitat === "demo") {
        const vizita: Vizita = {
          id: `lokal-${Date.now()}`,
          pronaId: kerkesa.pronaId,
          lloji: kerkesa.lloji,
          data: kerkesa.data,
          udhezime: kerkesa.udhezime,
          statusi: "kerkuar",
          krijuar: new Date().toISOString(),
          mikuId: null,
          mikuEmri: null,
          pranuarAt: null,
          filluarAt: null,
          derguarAt: null,
          vendosurAt: null,
          arsyeja: null,
          shqyrtuarAt: null,
          vendimiAdminit: null,
          shenimiAdminit: null,
        };
        vizitatLokale.current = [...vizitatLokale.current, vizita];
        setVizitat((v) => rendit([...v, vizita]));
        return null;
      }
      if (burimiVizitat === "duke_ngarkuar") return "Të dhënat po ngarkohen. Provo pas një çasti.";
      try {
        const { data, error } = await supabase
          .from("vizitat")
          .insert({
            prona_id: kerkesa.pronaId,
            lloji: kerkesa.lloji,
            data_vizites: kerkesa.data,
            udhezime: kerkesa.udhezime,
          })
          .select(shtyllatEVizitave(niveliShtyllave.current))
          .single();
        if (error) return error.code ? error.message : PA_LIDHJE;
        if (!data) return "Nuk u dërgua kërkesa.";
        setVizitat((v) => rendit([...v, ngaRreshti(data as unknown as RreshtVizite)]));
        setBurimiVizitat("supabase");
        return null;
      } catch {
        return PA_LIDHJE;
      }
    },
    [burimiVizitat],
  );

  // Cancels a request that no Miku has accepted yet (the database enforces this too).
  const anuloVizite = useCallback(
    async (id: string): Promise<string | null> => {
      if (id.startsWith("lokal-")) {
        vizitatLokale.current = vizitatLokale.current.filter((v) => v.id !== id);
        setVizitat((v) => v.filter((x) => x.id !== id));
        return null;
      }
      try {
        const { data, error } = await supabase.from("vizitat").delete().eq("id", id).select("id");
        if (error) return error.code ? error.message : PA_LIDHJE;
        if (!data || data.length === 0) return "Kërkesa nuk mund të anulohet më (ndoshta një Miku e ka pranuar).";
        setVizitat((v) => v.filter((x) => x.id !== id));
        return null;
      } catch {
        return PA_LIDHJE;
      }
    },
    [],
  );

  // A Miku accepts an open request. In the database only the Miku role may do this, and only
  // while the request is still 'kerkuar' (so two Mikus cannot take the same one).
  const pranoVizite = useCallback(
    async (id: string): Promise<string | null> => {
      if (!uid) return "Hyr përsëri në llogari.";
      const tani = new Date().toISOString();

      if (id.startsWith("lokal-")) {
        const pranuar = (v: Vizita): Vizita =>
          v.id === id ? { ...v, statusi: "pranuar", mikuId: uid, mikuEmri: emriIMikut, pranuarAt: tani } : v;
        vizitatLokale.current = vizitatLokale.current.map(pranuar);
        setVizitat((v) => v.map(pranuar));
        return null;
      }
      if (burimiProfilit !== "supabase" || niveliShtyllave.current > NIVELI_MIKU) {
        return "Për ta pranuar vizitën duhet të ekzekutohet supabase/roli.sql në Supabase.";
      }
      try {
        const { data, error } = await supabase
          .from("vizitat")
          .update({ statusi: "pranuar", miku_id: uid, miku_emri: emriIMikut, pranuar_at: tani })
          .eq("id", id)
          .eq("statusi", "kerkuar")
          .select(shtyllatEVizitave(niveliShtyllave.current));
        if (error) return error.code ? error.message : PA_LIDHJE;
        const rreshti = (data as unknown as RreshtVizite[] | null)?.[0];
        if (!rreshti) {
          // somebody else took it, or the client cancelled it: show the list as it is now
          void rifresko();
          return "Kjo kërkesë nuk është më e lirë: u anulua ose e pranoi një Miku tjetër.";
        }
        setVizitat((v) => rendit(v.map((x) => (x.id === id ? ngaRreshti(rreshti) : x))));
        return null;
      } catch {
        return PA_LIDHJE;
      }
    },
    [uid, emriIMikut, burimiProfilit, rifresko],
  );

  // The Miku's next two steps change the status of a visit they accepted:
  //   pranuar -> vizita (they are on site) and vizita -> raporti_gati (the evidence is sent).
  // The database allows each only for that Miku, and the second only with complete evidence.
  const kaloStatusin = useCallback(
    async (
      id: string,
      nga: Statusi,
      ne: Statusi,
      kohaFusha: "filluar_at" | "derguar_at",
      kohaLokale: "filluarAt" | "derguarAt",
      refuzuar: string,
    ): Promise<string | null> => {
      if (!uid) return "Hyr përsëri në llogari.";
      const tani = new Date().toISOString();

      if (id.startsWith("lokal-")) {
        const ndrysho = (v: Vizita): Vizita => (v.id === id ? { ...v, statusi: ne, [kohaLokale]: tani } : v);
        vizitatLokale.current = vizitatLokale.current.map(ndrysho);
        setVizitat((v) => v.map(ndrysho));
        return null;
      }
      if (niveliShtyllave.current > NIVELI_DESHMIA) {
        return "Për ta vazhduar vizitën duhet të ekzekutohet supabase/deshmia.sql në Supabase.";
      }
      try {
        const { data, error } = await supabase
          .from("vizitat")
          .update({ statusi: ne, [kohaFusha]: tani })
          .eq("id", id)
          .eq("statusi", nga)
          .eq("miku_id", uid)
          .select(shtyllatEVizitave(niveliShtyllave.current));
        if (error) return error.code === "42501" ? refuzuar : error.code ? error.message : PA_LIDHJE;
        const rreshti = (data as unknown as RreshtVizite[] | null)?.[0];
        if (!rreshti) {
          void rifresko();
          return "Vizita nuk është më në gjendjen e pritur. Rifreskova listën.";
        }
        setVizitat((v) => rendit(v.map((x) => (x.id === id ? ngaRreshti(rreshti) : x))));
        return null;
      } catch {
        return PA_LIDHJE;
      }
    },
    [uid, rifresko],
  );

  const filloVizite = useCallback(
    (id: string) =>
      kaloStatusin(id, "pranuar", "vizita", "filluar_at", "filluarAt", "Kjo vizitë nuk mund të fillohet tani."),
    [kaloStatusin],
  );

  const dergoRaportin = useCallback(
    (id: string) =>
      kaloStatusin(
        id,
        "vizita",
        "raporti_gati",
        "derguar_at",
        "derguarAt",
        "Dëshmitë nuk janë të plota: duhet GPS, të paktën një foto dhe shënimi zanor.",
      ),
    [kaloStatusin],
  );

  // The client decides on a report that is ready. In the database this is one function
  // (vendos_raportin in supabase/raporti.sql) that checks who is calling and which status the
  // visit has, so the client can change nothing but the decision.
  const vendosRaportin = useCallback(
    async (id: string, miratuar: boolean, arsyeja = ""): Promise<string | null> => {
      if (!uid) return "Hyr përsëri në llogari.";
      const arsyejaEPastruar = arsyeja.trim();
      if (!miratuar && arsyejaEPastruar.length < 10) return "Shkruaj pse e kundërshton raportin (të paktën 10 shkronja).";
      if (!miratuar && arsyejaEPastruar.length > 500) return "Arsyeja është shumë e gjatë (më së shumti 500 shkronja).";
      const statusiIRi: Statusi = miratuar ? "miratuar" : "kundershtuar";
      const tani = new Date().toISOString();
      const ndrysho = (v: Vizita): Vizita =>
        v.id === id ? { ...v, statusi: statusiIRi, vendosurAt: tani, arsyeja: miratuar ? null : arsyejaEPastruar } : v;

      if (id.startsWith("lokal-")) {
        vizitatLokale.current = vizitatLokale.current.map(ndrysho);
        setVizitat((v) => v.map(ndrysho));
        return null;
      }
      if (niveliShtyllave.current > NIVELI_RAPORTI) return MUNGON_RAPORTI;
      try {
        const { error } = await supabase.rpc("vendos_raportin", {
          vid: id,
          miratuar,
          arsyeja: miratuar ? null : arsyejaEPastruar,
        });
        if (error) {
          if (error.code === "PGRST202" || error.code === "42883") return MUNGON_RAPORTI;
          if (error.code === "P0002") {
            void rifresko();
            return "Ky raport nuk është më gati për vendim. Rifreskova listën.";
          }
          return error.code ? error.message : PA_LIDHJE;
        }
        setVizitat((v) => v.map(ndrysho));
        void rifresko(); // takes the server's time of the decision
        return null;
      } catch {
        return PA_LIDHJE;
      }
    },
    [uid, rifresko],
  );

  // An admin closes a disputed case. In the database this is one function (shqyrto_rastin in
  // supabase/admini.sql) that checks the role and that the case is still open.
  const shqyrtoRastin = useCallback(
    async (id: string, neFavorTeKlientit: boolean, shenimi: string): Promise<string | null> => {
      if (!uid) return "Hyr përsëri në llogari.";
      const shenimiIPastruar = shenimi.trim();
      if (shenimiIPastruar.length < 10) return "Shkruaj shënimin e vendimit (të paktën 10 shkronja).";
      if (shenimiIPastruar.length > 500) return "Shënimi është shumë i gjatë (më së shumti 500 shkronja).";
      if (id.startsWith("lokal-") || niveliShtyllave.current > NIVELI_ADMIN) return MUNGON_ADMINI;
      try {
        const { error } = await supabase.rpc("shqyrto_rastin", {
          vid: id,
          ne_favor_te_klientit: neFavorTeKlientit,
          shenimi: shenimiIPastruar,
        });
        if (error) {
          if (error.code === "PGRST202" || error.code === "42883") return MUNGON_ADMINI;
          if (error.code === "P0002") {
            void rifresko();
            return "Ky rast nuk pret më shqyrtim: ndoshta u shqyrtua tashmë. Rifreskova listën.";
          }
          return error.code ? error.message : PA_LIDHJE;
        }
        const tani = new Date().toISOString();
        const vendimi: VendimiAdminit = neFavorTeKlientit ? "klienti" : "miku";
        setVizitat((v) =>
          v.map((x) =>
            x.id === id ? { ...x, shqyrtuarAt: tani, vendimiAdminit: vendimi, shenimiAdminit: shenimiIPastruar } : x,
          ),
        );
        void rifresko(); // takes the server's time of the decision
        return null;
      } catch {
        return PA_LIDHJE;
      }
    },
    [uid, rifresko],
  );

  const vlera = useMemo<Dhenat>(
    () => ({
      pronat,
      burimiPronat,
      vizitat,
      burimiVizitat,
      shtoPronen,
      vendosVendndodhjen,
      kerkoVizite,
      anuloVizite,
      pranoVizite,
      filloVizite,
      dergoRaportin,
      vendosRaportin,
      shqyrtoRastin,
      rifresko,
    }),
    [
      pronat,
      burimiPronat,
      vizitat,
      burimiVizitat,
      shtoPronen,
      vendosVendndodhjen,
      kerkoVizite,
      anuloVizite,
      pranoVizite,
      filloVizite,
      dergoRaportin,
      vendosRaportin,
      shqyrtoRastin,
      rifresko,
    ],
  );

  return <DhenatContext.Provider value={vlera}>{children}</DhenatContext.Provider>;
}

export function useDhenat(): Dhenat {
  const vlera = useContext(DhenatContext);
  if (!vlera) throw new Error("useDhenat must be used inside DhenatProvider");
  return vlera;
}
