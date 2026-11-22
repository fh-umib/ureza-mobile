import type { Roli } from "./profili";

// The screen each role starts on after signing in (all inside the tabs of src/app/(app)).
export const FAQJA_KRYESORE: Record<Roli, string> = {
  klient: "/ballina",
  miku: "/miku",
  admin: "/admini",
};

const TE_GJITHE: Roli[] = ["klient", "miku", "admin"];

// Which roles may open each screen of one side of the app. The tab bar shows a tab only to these
// roles (src/app/(app)/_layout.tsx), and src/app/_layout.tsx sends anyone else to their own home,
// e.g. an account that became Admin while Ballina was open goes straight to Paneli.
// Screens not listed here (a visit, the role screen, the course's task list) are open to everyone.
export const ROLET_E_FAQES: Record<string, Roli[]> = {
  "/ballina": ["klient"],
  "/pronat": ["klient"],
  "/oda": ["klient"],
  "/kerko-vizite": ["klient"],
  "/miku": ["miku"],
  "/admini": ["admin"],
  "/harta": TE_GJITHE,
  "/profili": TE_GJITHE,
};

export function faqjaLejohet(roli: Roli, pathname: string): boolean {
  const rolet = ROLET_E_FAQES[pathname];
  return rolet === undefined || rolet.includes(roli);
}
