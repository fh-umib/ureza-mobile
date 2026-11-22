// Types and demo data for properties (see src/lib/dhenat.tsx for loading and saving).

import { gjejQytetin, type Koordinata } from "./gjeo";

export type Lloji = "shtepi" | "prindert" | "toke";
export type Prona = {
  id: string;
  emri: string;
  vendi: string;
  lloji: Lloji;
  // The exact position (table pronat_vendi, supabase/harta.sql). Null when the owner has not set it,
  // and for a Miku until they have accepted a visit of this property.
  koordinatat: Koordinata | null;
};

// Shown while the `pronat` table does not exist yet (see supabase/pronat.sql),
// so the screens still look like the design.
export const PRONAT_DEMO: Prona[] = [
  { id: "demo-1", emri: "Shtëpia në Ferizaj", vendi: "Ferizaj", lloji: "shtepi", koordinatat: null },
  { id: "demo-2", emri: "Prindërit në Mitrovicë", vendi: "Mitrovicë", lloji: "prindert", koordinatat: null },
];

// Where a property goes on the map: its exact position, or else the centre of its town
// (`sakte` is false then, and the GPS of a visit is not compared with it).
export type VendiNeHarte = { k: Koordinata; sakte: boolean; qyteti: string | null };

export function vendiNeHarte(prona: Prona): VendiNeHarte | null {
  if (prona.koordinatat) return { k: prona.koordinatat, sakte: true, qyteti: null };
  const qyteti = gjejQytetin(prona.vendi) ?? gjejQytetin(prona.emri);
  return qyteti ? { k: qyteti.k, sakte: false, qyteti: qyteti.emri } : null;
}
