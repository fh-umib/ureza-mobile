import type { IconName } from "@/components/UrezaIcon";

// Types, labels and date helpers for visits (see src/lib/dhenat.tsx for loading and saving).

export type LlojiVizites = "inspektim" | "kujdes";
export type Statusi = "kerkuar" | "pranuar" | "vizita" | "raporti_gati" | "miratuar" | "kundershtuar";

export type Vizita = {
  id: string;
  pronaId: string;
  lloji: LlojiVizites;
  data: string; // the visit day, "YYYY-MM-DD"
  udhezime: string;
  statusi: Statusi;
  krijuar: string; // ISO timestamp
  // set when a Miku accepts the request
  mikuId: string | null;
  mikuEmri: string | null;
  pranuarAt: string | null; // ISO timestamp
  // set when the Miku starts the visit and when they send the evidence
  filluarAt: string | null;
  derguarAt: string | null;
  // set when the client approves or objects to the report (the reason only when objecting)
  vendosurAt: string | null;
  arsyeja: string | null;
};

export const LLOJET_E_VIZITES: { vlera: LlojiVizites; titulli: string; nentitulli: string; icon: IconName }[] = [
  { vlera: "inspektim", titulli: "Inspektim prone", nentitulli: "Çati, ujë, rrymë, siguri", icon: "home" },
  { vlera: "kujdes", titulli: "Vizitë te prindërit", nentitulli: "Jo mjekësore, me pëlqim", icon: "user" },
];

export function titulliIVizites(lloji: LlojiVizites): string {
  return LLOJET_E_VIZITES.find((l) => l.vlera === lloji)?.titulli ?? "Vizitë";
}

// The status chips (colours from the design system) and the four steps shown on Ballina.
export const STATUSET: Record<Statusi, { emri: string; icon: IconName; bg: string; fg: string }> = {
  kerkuar: { emri: "Kërkuar", icon: "clock", bg: "#FFF2DE", fg: "#8A5210" },
  pranuar: { emri: "Pranuar", icon: "check", bg: "#E8F5F3", fg: "#175568" },
  vizita: { emri: "Në vizitë", icon: "pin", bg: "#E8F5F3", fg: "#175568" },
  raporti_gati: { emri: "Raporti gati", icon: "list", bg: "#E8F5F3", fg: "#175568" },
  miratuar: { emri: "Miratuar", icon: "check", bg: "#E4F6EB", fg: "#1E6B3E" },
  kundershtuar: { emri: "Kundërshtuar", icon: "warning", bg: "#FBE9E9", fg: "#9B2C2C" },
};

export const HAPAT = ["Kërkuar", "Pranuar", "Vizita", "Raporti"] as const;

// Index of the step a visit has reached (0 = requested ... 3 = report).
export function hapiIVizites(statusi: Statusi): number {
  switch (statusi) {
    case "kerkuar":
      return 0;
    case "pranuar":
      return 1;
    case "vizita":
      return 2;
    default:
      return 3;
  }
}

export const DITET = ["e diel", "e hënë", "e martë", "e mërkurë", "e enjte", "e premte", "e shtunë"];
export const DITET_SHKURT = ["DIE", "HËN", "MAR", "MËR", "ENJ", "PRE", "SHT"];
export const MUAJT = [
  "janar",
  "shkurt",
  "mars",
  "prill",
  "maj",
  "qershor",
  "korrik",
  "gusht",
  "shtator",
  "tetor",
  "nëntor",
  "dhjetor",
];

// "YYYY-MM-DD" for a local date (not UTC, so the day never shifts).
export function dataNeTekst(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dita = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${dita}`;
}

export function dataNgaTekst(tekst: string): Date {
  const [v, m, d] = tekst.split("-").map(Number);
  return new Date(v, m - 1, d);
}

// "12 nëntor"
export function dataShkurt(tekst: string): string {
  const d = dataNgaTekst(tekst);
  return `${d.getDate()} ${MUAJT[d.getMonth()]}`;
}

// "e enjte, 20 nëntor 2026"
export function dataEPlote(tekst: string): string {
  const d = dataNgaTekst(tekst);
  return `${DITET[d.getDay()]}, ${d.getDate()} ${MUAJT[d.getMonth()]} ${d.getFullYear()}`;
}

// The next days a visit can be requested for, starting tomorrow.
export function ditetEZgjedhshme(sa = 14): Date[] {
  const sot = new Date();
  return Array.from({ length: sa }, (_, i) => new Date(sot.getFullYear(), sot.getMonth(), sot.getDate() + i + 1));
}

// What the client is told about the visit, by status.
export const TEKSTI_STATUSIT: Record<Statusi, string> = {
  kerkuar: "Kërkesa është dërguar. Pret që një Miku ta pranojë.",
  pranuar: "Një Miku e pranoi kërkesën dhe do të shkojë në datën e caktuar.",
  vizita: "Miku është duke e kryer vizitën.",
  raporti_gati: "Miku e kreu vizitën dhe dërgoi dëshmitë. Lexo raportin dhe vendos.",
  miratuar: "Ti e miratove raportin e kësaj vizite.",
  kundershtuar: "Ti e kundërshtove raportin. Një admin e shqyrton rastin.",
};

// "12 nëntor, 18:40" for an ISO timestamp (local time).
export function dataMeOre(iso: string): string {
  const d = new Date(iso);
  const ora = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return `${d.getDate()} ${MUAJT[d.getMonth()]}, ${ora}`;
}

// What a Miku is told about a visit they have accepted (the other statuses use the client's text).
export const TEKSTI_STATUSIT_MIKU: Partial<Record<Statusi, string>> = {
  kerkuar: "Kjo kërkesë pret një Miku. Mund ta pranosh.",
  pranuar: "Ti e pranove këtë detyrë. Shko në datën e caktuar dhe fillo vizitën kur të jesh aty.",
  vizita: "Je në terren. Mblidh GPS-in, fotot dhe shënimin zanor, pastaj dërgoji.",
  raporti_gati: "Dëshmitë u dërguan. Klienti po e shqyrton raportin.",
  miratuar: "Klienti e miratoi raportin e kësaj vizite.",
  kundershtuar: "Klienti e kundërshtoi raportin. Një admin e shqyrton rastin.",
};

// "14:32" for an ISO timestamp (local time).
export function oraNeTekst(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

// 42 seconds -> "00:42"
export function kohezgjatjaNeTekst(sekonda: number): string {
  const s = Math.max(0, Math.round(sekonda));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}
