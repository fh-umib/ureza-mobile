// "Profili është 80% i plotë" (design: Profili). The steps depend on the role: a client also
// adds a property and its exact position, which the map and the GPS check need.

export type Hapi = { etiketa: string; kryer: boolean; keshille: string };

export function hapatEProfilit(d: {
  roli: "klient" | "miku" | "admin";
  emri: string | null;
  email: string | null;
  telefoni: string | null;
  ka_prona: boolean;
  ka_vendndodhje: boolean;
}): Hapi[] {
  const hapat: Hapi[] = [
    { etiketa: "Emri", kryer: (d.emri ?? "").trim().length >= 2, keshille: "Shto emrin tënd." },
    { etiketa: "Emaili", kryer: (d.email ?? "").length > 0, keshille: "Shto emailin." },
    {
      etiketa: "Telefoni",
      kryer: (d.telefoni ?? "").length > 0,
      keshille:
        d.roli === "klient"
          ? "Shto numrin e telefonit që Miku të të njoftojë."
          : "Shto numrin e telefonit që ekipi të të kontaktojë.",
    },
  ];
  if (d.roli === "klient") {
    hapat.push(
      { etiketa: "Prona", kryer: d.ka_prona, keshille: "Shto pronën e parë që Miku ta vizitojë." },
      {
        etiketa: "Vendndodhja e pronës",
        kryer: d.ka_vendndodhje,
        keshille: "Shto vendndodhjen e saktë të një prone, që harta dhe GPS-i të punojnë.",
      },
    );
  }
  return hapat;
}

export function plotesimi(hapat: Hapi[]): { kryer: number; total: number; perqindja: number; keshille: string | null } {
  const kryer = hapat.filter((h) => h.kryer).length;
  const total = hapat.length;
  const hapiTjeter = hapat.find((h) => !h.kryer);
  return {
    kryer,
    total,
    perqindja: total === 0 ? 100 : Math.round((kryer / total) * 100),
    keshille: hapiTjeter ? hapiTjeter.keshille : null,
  };
}
