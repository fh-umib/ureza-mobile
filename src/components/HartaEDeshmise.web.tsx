import type { Koordinata } from "@/lib/gjeo";

// The small map of the evidence needs the phone's map; in the browser the chip and the link to
// Google Maps are enough. The phone uses HartaEDeshmise.tsx.
export function HartaEDeshmise(_: { prona: Koordinata; gps: Koordinata; saktesia: number | null; lartesia?: number }) {
  return null;
}
