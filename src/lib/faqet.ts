import type { Roli } from "./profili";

// The screen each role starts on after signing in (all inside the tabs of src/app/(app)).
export const FAQJA_KRYESORE: Record<Roli, string> = {
  klient: "/ballina",
  miku: "/miku",
  admin: "/admini",
};
