import { Share } from "react-native";

import { PA_LIDHJE } from "./lexo";
import { supabase } from "./supabase";

// "Shkarko të dhënat e mia" (design: Profili): gathers what the account holds about the user and
// hands it to the share sheet of the phone as a text file (JSON), where it can be saved to Files,
// mailed, and so on. Row Level Security already limits every table to what the user may read; the
// filters below keep out the rows of other people that a Miku may see (open requests, properties
// of the visits).
//
// The photos and voice notes are files in Storage, not rows: the export lists their names only.

type Rresht = Record<string, unknown>;
type Tabela = { celesi: string; emri: string; filtri: (r: Rresht, uid: string, idt: Set<string>) => boolean };

export type RezultatiIEksportit = { ok: true; tekst: string } | { ok: false; mesazh: string };

async function lexoTabelen(emri: string): Promise<{ rreshta: Rresht[] } | { mungon: string } | { paLidhje: true }> {
  try {
    const { data, error } = await supabase.from(emri).select("*");
    if (error && !error.code) return { paLidhje: true };
    if (error) return { mungon: error.code ?? "" };
    return { rreshta: (data as Rresht[] | null) ?? [] };
  } catch {
    return { paLidhje: true };
  }
}

export async function mbledhTeDhenat(perdoruesi: { id: string; email: string | null }): Promise<RezultatiIEksportit> {
  const uid = perdoruesi.id;
  const tabelat: Tabela[] = [
    { celesi: "profili", emri: "profiles", filtri: (r) => r.id === uid },
    { celesi: "pronat", emri: "pronat", filtri: (r) => r.pronari_id === uid },
    // the exact positions of the user's own properties (filled in below, after the properties are known)
    { celesi: "vendndodhjet_e_sakta", emri: "pronat_vendi", filtri: (r, _u, idt) => idt.has(String(r.prona_id)) },
    { celesi: "vizitat", emri: "vizitat", filtri: (r) => r.pronari_id === uid || r.miku_id === uid },
    // the evidence of the user's visits (filled in below, after the visits are known)
    { celesi: "deshmite", emri: "deshmite", filtri: (r, _u, idt) => idt.has(String(r.vizita_id)) },
  ];

  const rezultati: Record<string, Rresht[]> = {};
  const shenime: string[] = [];
  let idPronave = new Set<string>();
  let idVizitave = new Set<string>();

  for (const t of tabelat) {
    const l = await lexoTabelen(t.emri);
    if ("paLidhje" in l) return { ok: false, mesazh: PA_LIDHJE };
    if ("mungon" in l) {
      // a table that does not exist yet (its SQL file was not run) simply has nothing to give
      rezultati[t.celesi] = [];
      shenime.push(`${t.emri}: tabela nuk është krijuar ende.`);
      continue;
    }
    const idt = t.celesi === "vendndodhjet_e_sakta" ? idPronave : idVizitave;
    const rreshta = l.rreshta.filter((r) => t.filtri(r, uid, idt));
    rezultati[t.celesi] = rreshta;
    if (t.celesi === "pronat") idPronave = new Set(rreshta.map((r) => String(r.id)));
    if (t.celesi === "vizitat") idVizitave = new Set(rreshta.map((r) => String(r.id)));
  }

  const eksporti = {
    eksportuar_me: new Date().toISOString(),
    llogaria: { id: uid, email: perdoruesi.email },
    ...rezultati,
    shenime: [...shenime, "Fotot dhe zërat e vizitave janë skedarë; këtu shfaqen vetëm emrat e tyre (fusha rruga)."],
  };
  return { ok: true, tekst: JSON.stringify(eksporti, null, 2) };
}

// Opens the share sheet with the text. Returns an error message, or null.
export async function ndajTeDhenat(tekst: string): Promise<string | null> {
  try {
    await Share.share({ title: "Të dhënat e mia në Urëzë", message: tekst });
    return null;
  } catch {
    return "Nuk u hap ndarja e skedarit. Provo përsëri.";
  }
}
