import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";

import { PA_LIDHJE, lexo } from "./lexo";
import { useSesioni } from "./sesioni";
import { supabase } from "./supabase";
import type { Statusi } from "./vizitat";

// The Admin panel's own data (supabase/admini.sql): how many visits are in each status (numbers
// only, the admin never reads the other visits), and the Mikus with their verification.
// The disputed visits themselves come through DhenatProvider, like any other visit.

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

type RreshtNumri = { gjendja: Statusi; numri: number | string };
type RreshtMiku = {
  miku_id: string;
  emri: string;
  telefoni: string | null;
  krijuar_at: string;
  verifikuar_at: string | null;
  vizita: number | string;
};

// "Function not found" (the SQL file was not run) and "not an admin" get their own words.
function mesazhiINgarkimit(kodi: string | undefined): string {
  if (kodi === "42501") return "Kjo llogari nuk ka rolin Admin në databazë.";
  return MUNGON_ADMINI_SQL;
}

export function usePaneliIAdminit() {
  const [numrat, setNumrat] = useState<Partial<Record<Statusi, number>>>({});
  const [mikut, setMikut] = useState<MikuPerAdminin[]>([]);
  const [burimi, setBurimi] = useState<BurimiIPanelit>("duke_ngarkuar");
  const [mesazhi, setMesazhi] = useState<string | null>(null);
  const gjenerata = useRef(0);

  const rifresko = useCallback(async () => {
    const gj = ++gjenerata.current;
    const [p, m] = await Promise.all([
      lexo<RreshtNumri[]>(supabase.rpc("permbledhja_e_vizitave")),
      lexo<RreshtMiku[]>(supabase.rpc("mikut_per_adminin")),
    ]);
    if (gj !== gjenerata.current) return;

    if (p.tipi === "pa_lidhje" || m.tipi === "pa_lidhje") {
      // keep what is already on screen
      setBurimi((b) => (b === "supabase" ? b : "pa_lidhje"));
      return;
    }
    if (p.tipi === "mungon" || m.tipi === "mungon") {
      setMesazhi(mesazhiINgarkimit(p.tipi === "mungon" ? p.kodi : m.tipi === "mungon" ? m.kodi : undefined));
      setBurimi("mungon");
      return;
    }
    const n: Partial<Record<Statusi, number>> = {};
    for (const r of p.data) n[r.gjendja] = Number(r.numri);
    setNumrat(n);
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
      setMikut((lista) => lista.map((x) => (x.id === id ? { ...x, verifikuarAt: koha } : x)));
      return null;
    } catch {
      return PA_LIDHJE;
    }
  }, []);

  return { numrat, mikut, burimi, mesazhi, rifresko, verifikoMikun };
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
