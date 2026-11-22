// The phone number of a profile (design: Profili, "Telefoni"). It is optional, so an empty text is
// fine. The database only checks the shape (supabase/profili.sql); the digits are counted here.

export const TELEFONI_MAX = 24;

// Spaces (also the odd ones a copy brings along) are squeezed to single ones.
export function pastroTelefonin(tekst: string): string {
  return tekst.replace(/\s+/g, " ").trim();
}

// An error message, or null when the number is fine (or empty).
export function gabimiITelefonit(tekst: string): string | null {
  const t = pastroTelefonin(tekst);
  if (t === "") return null;
  if (t.length > TELEFONI_MAX) return "Numri është shumë i gjatë.";
  if (!/^\+?[0-9() -]+$/.test(t)) {
    return "Numri mund të ketë vetëm shifra, hapësira, - dhe ( ), dhe + në fillim.";
  }
  const shifra = t.replace(/\D/g, "").length;
  if (shifra < 7 || shifra > 15) return "Numri duhet të ketë 7 deri në 15 shifra, p.sh. +383 44 000 000.";
  return null;
}
