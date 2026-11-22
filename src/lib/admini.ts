import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";

import { PA_LIDHJE, lexo } from "./lexo";
import { useSesioni } from "./sesioni";
import { supabase } from "./supabase";
import type { LlojiVizites, Statusi } from "./vizitat";

// The Admin panel's own data (supabase/admini.sql): the dashboard numbers (numbers only, the
// admin never reads the other visits), and the Mikus with their verification.
// The disputed visits themselves come through DhenatProvider, like any other visit.

export type TreguesitEPanelit = {
  statuset: Partial<Record<Statusi, number>>;
  llojet: Partial<Record<LlojiVizites, number>>;
  ditet: { dita: string; numri: number }[]; // the last 14 days, oldest first, "YYYY-MM-DD"
  pranimiMesatarOre: number | null; // average hours from a request to its acceptance
  klientet: number;
  mikut: number;
  mikutVerifikuar: number;
};

const TREGUESIT_BOSH: TreguesitEPanelit = {
  statuset: {},
  llojet: {},
  ditet: [],
  pranimiMesatarOre: null,
  klientet: 0,
  mikut: 0,
  mikutVerifikuar: 0,
};

export type MikuPerAdminin = {
  id: string;
  emri: string;
  telefoni: string | null;
  krijuarAt: string;
  verifikuarAt: string | null;
  vizita: number; // visits this Miku has accepted
};

export type BurimiIPanelit = "duke_ngarkuar" | "supabase" | "mungon" | "pa_lidhje";

export const MUNGON_ADMINI_SQL = "Paneli punon pasi të ekzekutohet supabase/admini.sql në Supabase.";

type TreguesitNgaServeri = {
  statuset?: Partial<Record<Statusi, number>>;
  llojet?: Partial<Record<LlojiVizites, number>>;
  ditet?: { dita: string; numri: number }[] | null;
  pranimi_mesatar_ore?: number | string | null;
  klientet?: number;
  mikut?: number;
  mikut_verifikuar?: number;
};

function ngaServeri(t: TreguesitNgaServeri): TreguesitEPanelit {
  return {
    statuset: t.statuset ?? {},
    llojet: t.llojet ?? {},
    ditet: (t.ditet ?? []).map((d) => ({ dita: d.dita, numri: Number(d.numri) })),
    pranimiMesatarOre: t.pranimi_mesatar_ore === null || t.pranimi_mesatar_ore === undefined ? null : Number(t.pranimi_mesatar_ore),
    klientet: Number(t.klientet ?? 0),
    mikut: Number(t.mikut ?? 0),
    mikutVerifikuar: Number(t.mikut_verifikuar ?? 0),
  };
}

type RreshtMiku = {
  miku_id: string;
  emri: string;
  telefoni: string | null;
  krijuar_at: string;
  verifikuar_at: string | null;
  vizita: number | string;
};

// "Function not found" (the SQL file was not run, or an older version of it) and "not an admin"
// get their own words.
// Any other error shows the server's own words and code, so the cause can be found.
function mesazhiINgarkimit(kodi: string | undefined, mesazhi: string | undefined): string {
  if (kodi === "42501") return "Kjo llogari nuk ka rolin Admin në databazë.";
  if (kodi === "PGRST202" || kodi === "42883") {
    return "Paneli i ri kërkon versionin e fundit të supabase/admini.sql: ekzekutoje sërish në Supabase.";
  }
  if (kodi || mesazhi) return `${MUNGON_ADMINI_SQL}\nServeri: ${mesazhi ?? "pa mesazh"}${kodi ? ` (${kodi})` : ""}`;
  return MUNGON_ADMINI_SQL;
}

export function usePaneliIAdminit() {
  const [treguesit, setTreguesit] = useState<TreguesitEPanelit>(TREGUESIT_BOSH);
  const [mikut, setMikut] = useState<MikuPerAdminin[]>([]);
  const [burimi, setBurimi] = useState<BurimiIPanelit>("duke_ngarkuar");
  const [mesazhi, setMesazhi] = useState<string | null>(null);
  const [perditesuarAt, setPerditesuarAt] = useState<string | null>(null);
  const gjenerata = useRef(0);

  const rifresko = useCallback(async () => {
    const gj = ++gjenerata.current;
    const [p, m] = await Promise.all([
      lexo<TreguesitNgaServeri>(supabase.rpc("treguesit_e_panelit")),
      lexo<RreshtMiku[]>(supabase.rpc("mikut_per_adminin")),
    ]);
    if (gj !== gjenerata.current) return;

    if (p.tipi === "pa_lidhje" || m.tipi === "pa_lidhje") {
      // keep what is already on screen
      setBurimi((b) => (b === "supabase" ? b : "pa_lidhje"));
      return;
    }
    if (p.tipi === "mungon" || m.tipi === "mungon") {
      const gabimi = p.tipi === "mungon" ? p : m.tipi === "mungon" ? m : null;
      setMesazhi(mesazhiINgarkimit(gabimi?.kodi, gabimi?.mesazhi));
      setBurimi("mungon");
      return;
    }
    setTreguesit(ngaServeri(p.data));
    setMikut(
      m.data.map((r) => ({
        id: r.miku_id,
        emri: r.emri,
        telefoni: r.telefoni,
        krijuarAt: r.krijuar_at,
        verifikuarAt: r.verifikuar_at,
        vizita: Number(r.vizita),
      })),
    );
    setMesazhi(null);
    setPerditesuarAt(new Date().toISOString());
    setBurimi("supabase");
  }, []);

  // Loads every time the Paneli tab is opened (e.g. after closing a case on the visit screen).
  useFocusEffect(
    useCallback(() => {
      void rifresko();
    }, [rifresko]),
  );

  // Verifies a Miku (true) or removes the verification (false). Returns an error message, or null.
  const verifikoMikun = useCallback(async (id: string, verifikuar: boolean): Promise<string | null> => {
    try {
      const { data, error } = await supabase.rpc("verifiko_mikun", { mid: id, verifikuar });
      if (error) {
        if (error.code === "PGRST202" || error.code === "42883") return MUNGON_ADMINI_SQL;
        return error.code ? error.message : PA_LIDHJE;
      }
      const koha = typeof data === "string" ? data : null;
      // (the dashboard counts the verified Mikus from this list, so it follows at once)
      setMikut((lista) => lista.map((x) => (x.id === id ? { ...x, verifikuarAt: koha } : x)));
      return null;
    } catch {
      return PA_LIDHJE;
    }
  }, []);

  return { treguesit, mikut, burimi, mesazhi, perditesuarAt, rifresko, verifikoMikun };
}

// For a Miku: has the Urëza team verified this account? `njohur` is false while loading, offline,
// or before supabase/admini.sql has been run (then the screen says nothing about it).
export function useVerifikimiIm(): { njohur: boolean; verifikuarAt: string | null } {
  const { perdoruesi } = useSesioni();
  const uid = perdoruesi?.id ?? null;
  const [gjendja, setGjendja] = useState<{ uid: string | null; njohur: boolean; verifikuarAt: string | null }>({
    uid: null,
    njohur: false,
    verifikuarAt: null,
  });

  useFocusEffect(
    useCallback(() => {
      if (!uid) return;
      let aktiv = true;
      void lexo<{ verifikuar_at: string | null }[]>(supabase.from("profiles").select("verifikuar_at").eq("id", uid)).then(
        (r) => {
          if (!aktiv || r.tipi !== "ok" || r.data.length === 0) return;
          setGjendja({ uid, njohur: true, verifikuarAt: r.data[0].verifikuar_at });
        },
      );
      return () => {
        aktiv = false;
      };
    }, [uid]),
  );

  // an answer for an earlier user is never shown
  return gjendja.uid === uid ? { njohur: gjendja.njohur, verifikuarAt: gjendja.verifikuarAt } : { njohur: false, verifikuarAt: null };
}
