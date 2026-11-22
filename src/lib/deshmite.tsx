import { useCallback, useEffect, useRef, useState } from "react";

import { PA_LIDHJE, lexo } from "./lexo";
import { supabase } from "./supabase";

// The evidence of one visit: a GPS position, live photos and a voice note (design: Dëshmia).
// Rows live in the `deshmite` table and the files in the private Storage bucket `deshmite`
// (supabase/deshmia.sql). A visit that exists only on this phone (demo mode) keeps its evidence
// on the phone too, until the app is closed.

export type LlojiDeshmise = "gps" | "foto" | "zeri";

export type Deshmi = {
  id: string;
  lloji: LlojiDeshmise;
  koha: string; // ISO timestamp (the server's clock)
  gjeresia: number | null;
  gjatesia: number | null;
  saktesia: number | null; // GPS accuracy in metres
  kohezgjatja: number | null; // voice note, seconds
  rruga: string | null; // the file in Storage
  url: string | null; // where to show the photo / play the voice note from
};

type Burimi = "duke_ngarkuar" | "supabase" | "lokal" | "mungon" | "pa_lidhje";

type Rresht = {
  id: string;
  lloji: LlojiDeshmise;
  rruga: string | null;
  gjeresia: number | null;
  gjatesia: number | null;
  saktesia: number | null;
  kohezgjatja: number | null;
  regjistruar_at: string;
};

const SHTYLLAT = "id, lloji, rruga, gjeresia, gjatesia, saktesia, kohezgjatja, regjistruar_at";
const BUCKET = "deshmite";
const SKADENCA_E_LIDHJES = 60 * 60; // signed links last one hour

// Storage and Postgres errors come in English; the Miku gets a sentence in Albanian
// (the original text goes to the console for debugging).
function shqip(mesazhi: string | undefined): string {
  if (!mesazhi) return PA_LIDHJE;
  console.warn("deshmite:", mesazhi);
  const m = mesazhi.toLowerCase();
  if (m.includes("failed to fetch") || m.includes("network")) return PA_LIDHJE;
  if (m.includes("row-level security") || m.includes("unauthorized")) {
    return "Nuk u ruajt. Dëshmi mund të shtojë vetëm Miku i vizitës, dhe vetëm kur vizita është e filluar.";
  }
  if (m.includes("bucket not found")) return "Kosha e dëshmive nuk ekziston. Ekzekuto supabase/deshmia.sql në Supabase.";
  if (m.includes("too large") || m.includes("maximum allowed size")) return "Skedari është shumë i madh (kufiri është 10 MB).";
  if (m.includes("mime")) return "Ky lloj skedari nuk lejohet.";
  return "Dëshmia nuk u ruajt. Provo përsëri.";
}

// Evidence of phone-only visits (ids starting with "lokal-").
const lokale = new Map<string, Deshmi[]>();

function ngaRreshti(r: Rresht, url: string | null): Deshmi {
  return {
    id: r.id,
    lloji: r.lloji,
    koha: r.regjistruar_at,
    gjeresia: r.gjeresia,
    gjatesia: r.gjatesia,
    saktesia: r.saktesia,
    kohezgjatja: r.kohezgjatja,
    rruga: r.rruga,
    url,
  };
}

function rendit(lista: Deshmi[]): Deshmi[] {
  return [...lista].sort((a, b) => a.koha.localeCompare(b.koha));
}

export type PerdorimiIDeshmive = {
  deshmite: Deshmi[];
  burimi: Burimi;
  gps: Deshmi | null;
  fotot: Deshmi[];
  zeri: Deshmi | null;
  // These return an error message, or null when it worked.
  ruajGps: (gjeresia: number, gjatesia: number, saktesia: number) => Promise<string | null>;
  shtoFoto: (uri: string, mime: string) => Promise<string | null>;
  fshiFoton: (id: string) => Promise<string | null>;
  ruajZerin: (uri: string, sekonda: number, mime: string) => Promise<string | null>;
  rifresko: () => Promise<void>;
};

// meSkedare = false skips the signed links of the files (enough to count the evidence).
export function useDeshmite(vizitaId: string | undefined, meSkedare = true): PerdorimiIDeshmive {
  const eLokale = vizitaId?.startsWith("lokal-") ?? false;
  const [deshmite, setDeshmite] = useState<Deshmi[]>([]);
  const [burimi, setBurimi] = useState<Burimi>("duke_ngarkuar");
  const gjenerata = useRef(0);

  const rifresko = useCallback(async () => {
    if (!vizitaId) return;
    const gj = ++gjenerata.current;
    if (eLokale) {
      setDeshmite(rendit(lokale.get(vizitaId) ?? []));
      setBurimi("lokal");
      return;
    }
    const r = await lexo<Rresht[]>(
      supabase.from("deshmite").select(SHTYLLAT).eq("vizita_id", vizitaId).order("regjistruar_at", { ascending: true }),
    );
    if (gj !== gjenerata.current) return;
    if (r.tipi === "pa_lidhje") {
      setBurimi((b) => (b === "supabase" ? b : "pa_lidhje"));
      return;
    }
    if (r.tipi === "mungon") {
      setBurimi("mungon");
      return;
    }

    // signed links for the files (the bucket is private)
    const rrugat = r.data.map((x) => x.rruga).filter((x): x is string => x !== null);
    const lidhjet = new Map<string, string>();
    if (rrugat.length > 0 && meSkedare) {
      try {
        const { data } = await supabase.storage.from(BUCKET).createSignedUrls(rrugat, SKADENCA_E_LIDHJES);
        for (const l of data ?? []) if (l.path && l.signedUrl) lidhjet.set(l.path, l.signedUrl);
      } catch {
        // the rows are shown without their files; "Provo përsëri" loads them again
      }
    }
    if (gj !== gjenerata.current) return;
    setDeshmite(r.data.map((x) => ngaRreshti(x, x.rruga ? (lidhjet.get(x.rruga) ?? null) : null)));
    setBurimi("supabase");
  }, [vizitaId, eLokale, meSkedare]);

  useEffect(() => {
    setDeshmite([]);
    setBurimi("duke_ngarkuar");
    void rifresko();
  }, [rifresko]);

  function mbaj(lista: Deshmi[]) {
    if (vizitaId && eLokale) lokale.set(vizitaId, lista);
    setDeshmite(rendit(lista));
  }

  // Uploads a file into the visit's folder and returns its path (or an error message).
  async function ngarko(uri: string, emri: string, mime: string): Promise<{ rruga: string } | { gabim: string }> {
    const rruga = `${vizitaId}/${emri}`;
    try {
      const pergjigjia = await fetch(uri);
      const bajtet = await pergjigjia.arrayBuffer();
      const { error } = await supabase.storage.from(BUCKET).upload(rruga, bajtet, { contentType: mime });
      if (error) return { gabim: shqip(error.message) };
      return { rruga };
    } catch {
      return { gabim: PA_LIDHJE };
    }
  }

  async function hiqSkedaret(rrugat: (string | null)[]) {
    const lista = rrugat.filter((x): x is string => x !== null);
    if (lista.length === 0) return;
    try {
      await supabase.storage.from(BUCKET).remove(lista);
    } catch {
      // an orphan file is harmless: nothing points to it
    }
  }

  async function shtoRresht(rresht: Record<string, unknown>): Promise<{ deshmi: Deshmi } | { gabim: string }> {
    try {
      const { data, error } = await supabase
        .from("deshmite")
        .insert({ vizita_id: vizitaId, ...rresht })
        .select(SHTYLLAT)
        .single();
      if (error) return { gabim: error.code ? shqip(error.message) : PA_LIDHJE };
      return { deshmi: ngaRreshti(data as unknown as Rresht, null) };
    } catch {
      return { gabim: PA_LIDHJE };
    }
  }

  async function fshiRreshtat(filtri: { id?: string; lloji?: LlojiDeshmise }): Promise<string | null> {
    try {
      let k = supabase.from("deshmite").delete().eq("vizita_id", vizitaId);
      if (filtri.id) k = k.eq("id", filtri.id);
      if (filtri.lloji) k = k.eq("lloji", filtri.lloji);
      const { error } = await k;
      if (error) return error.code ? shqip(error.message) : PA_LIDHJE;
      return null;
    } catch {
      return PA_LIDHJE;
    }
  }

  const gps = deshmite.find((d) => d.lloji === "gps") ?? null;
  const fotot = deshmite.filter((d) => d.lloji === "foto");
  const zeri = deshmite.find((d) => d.lloji === "zeri") ?? null;

  function mundet(): string | null {
    if (!vizitaId) return "Vizita nuk u gjet.";
    if (burimi === "duke_ngarkuar") return "Të dhënat po ngarkohen. Provo pas një çasti.";
    if (burimi === "mungon") return "Për të ruajtur dëshmitë duhet të ekzekutohet supabase/deshmia.sql në Supabase.";
    if (burimi === "pa_lidhje") return PA_LIDHJE;
    return null;
  }

  const ruajGps = async (gjeresia: number, gjatesia: number, saktesia: number): Promise<string | null> => {
    const pengesa = mundet();
    if (pengesa) return pengesa;
    if (burimi === "lokal") {
      const e_re: Deshmi = {
        id: `lokal-gps-${Date.now()}`,
        lloji: "gps",
        koha: new Date().toISOString(),
        gjeresia,
        gjatesia,
        saktesia,
        kohezgjatja: null,
        rruga: null,
        url: null,
      };
      mbaj([...deshmite.filter((d) => d.lloji !== "gps"), e_re]);
      return null;
    }
    // a new position replaces the old one
    const hequr = await fshiRreshtat({ lloji: "gps" });
    if (hequr) return hequr;
    const r = await shtoRresht({ lloji: "gps", gjeresia, gjatesia, saktesia });
    if ("gabim" in r) {
      await rifresko();
      return r.gabim;
    }
    setDeshmite((d) => rendit([...d.filter((x) => x.lloji !== "gps"), r.deshmi]));
    return null;
  };

  const shtoFoto = async (uri: string, mime: string): Promise<string | null> => {
    const pengesa = mundet();
    if (pengesa) return pengesa;
    if (burimi === "lokal") {
      mbaj([
        ...deshmite,
        {
          id: `lokal-foto-${Date.now()}`,
          lloji: "foto",
          koha: new Date().toISOString(),
          gjeresia: null,
          gjatesia: null,
          saktesia: null,
          kohezgjatja: null,
          rruga: null,
          url: uri,
        },
      ]);
      return null;
    }
    const ext = mime === "image/png" ? "png" : "jpg";
    const f = await ngarko(uri, `foto-${Date.now()}.${ext}`, mime);
    if ("gabim" in f) return f.gabim;
    const r = await shtoRresht({ lloji: "foto", rruga: f.rruga });
    if ("gabim" in r) {
      await hiqSkedaret([f.rruga]);
      return r.gabim;
    }
    setDeshmite((d) => rendit([...d, { ...r.deshmi, url: uri }]));
    return null;
  };

  const fshiFoton = async (id: string): Promise<string | null> => {
    const pengesa = mundet();
    if (pengesa) return pengesa;
    const foto = deshmite.find((d) => d.id === id);
    if (!foto) return null;
    if (burimi === "lokal") {
      mbaj(deshmite.filter((d) => d.id !== id));
      return null;
    }
    const hequr = await fshiRreshtat({ id });
    if (hequr) return hequr;
    await hiqSkedaret([foto.rruga]);
    setDeshmite((d) => d.filter((x) => x.id !== id));
    return null;
  };

  const ruajZerin = async (uri: string, sekonda: number, mime: string): Promise<string | null> => {
    const pengesa = mundet();
    if (pengesa) return pengesa;
    if (burimi === "lokal") {
      mbaj([
        ...deshmite.filter((d) => d.lloji !== "zeri"),
        {
          id: `lokal-zeri-${Date.now()}`,
          lloji: "zeri",
          koha: new Date().toISOString(),
          gjeresia: null,
          gjatesia: null,
          saktesia: null,
          kohezgjatja: Math.round(sekonda),
          rruga: null,
          url: uri,
        },
      ]);
      return null;
    }
    const ext = mime === "audio/webm" ? "webm" : mime === "audio/3gpp" ? "3gp" : "m4a";
    const f = await ngarko(uri, `zeri-${Date.now()}.${ext}`, mime);
    if ("gabim" in f) return f.gabim;
    const vjeter = deshmite.find((d) => d.lloji === "zeri");
    const hequr = await fshiRreshtat({ lloji: "zeri" });
    if (hequr) {
      await hiqSkedaret([f.rruga]);
      return hequr;
    }
    const r = await shtoRresht({ lloji: "zeri", rruga: f.rruga, kohezgjatja: Math.round(sekonda) });
    if ("gabim" in r) {
      await hiqSkedaret([f.rruga]);
      await rifresko();
      return r.gabim;
    }
    await hiqSkedaret([vjeter?.rruga ?? null]);
    setDeshmite((d) => rendit([...d.filter((x) => x.lloji !== "zeri"), { ...r.deshmi, url: uri }]));
    return null;
  };

  return { deshmite, burimi, gps, fotot, zeri, ruajGps, shtoFoto, fshiFoton, ruajZerin, rifresko };
}
