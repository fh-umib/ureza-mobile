import type { Koordinata } from "@/lib/gjeo";

// The map picker needs the phone's map; in the browser the coordinates are typed or pasted instead
// (VendndodhjaFusha does not offer the button there). The phone uses ZgjidhNeHarte.tsx.
export function ZgjidhNeHarte(_: {
  fillimi: Koordinata | null;
  afer: Koordinata | null;
  onZgjidh: (k: Koordinata) => void;
  mbyll: () => void;
}) {
  return null;
}
