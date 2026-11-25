import { CMIMI_TEKST } from "./kushtet";
import { KONTRATA_VERSIONI, nenetEKontrates, paleMiku, type DhenatEKontrates } from "./kontrata";
import { dataEPlote, dataMeOre, titulliIVizites } from "./vizitat";

// The digital contract as an A4 PDF (expo-print turns this HTML into the file). The contract
// screen collects the options and the typed signature; the text of the articles is the same as
// in kontrata.ts.

export type Hyrja = "jashte" | "i_afermi" | "kuti_me_kod" | "celesi";
export type Pagesa = "para_ne_dore" | "transfer";
export type Afati = "dita_e_vizites" | "7_dite";

export const HYRJET: { vlera: Hyrja; emri: string; pershkrimi: string }[] = [
  { vlera: "jashte", emri: "Vetëm nga jashtë", pershkrimi: "Miku nuk hyn brenda" },
  { vlera: "i_afermi", emri: "E hap i afërmi", pershkrimi: "Një i afërm ose prindi e hap derën" },
  { vlera: "kuti_me_kod", emri: "Kuti me kod", pershkrimi: "Kodi jepet për këtë vizitë dhe ndryshohet pas saj" },
  { vlera: "celesi", emri: "Çelësi te Miku", pershkrimi: "Merret dhe kthehet me foto e orë" },
];
export const PAGESAT: { vlera: Pagesa; emri: string }[] = [
  { vlera: "para_ne_dore", emri: "Me para në dorë" },
  { vlera: "transfer", emri: "Transfer bankar" },
];
export const AFATET: { vlera: Afati; emri: string }[] = [
  { vlera: "dita_e_vizites", emri: "Në ditën e vizitës" },
  { vlera: "7_dite", emri: "Brenda 7 ditëve pas miratimit" },
];

export type Zgjedhjet = {
  hyrja: Hyrja;
  pagesa: Pagesa;
  afati: Afati;
  fotoParaFillimit: boolean; // photos of the state of the property before starting
  shenime: string;
};

export type Nenshkrimi = {
  roli: "klient" | "miku";
  emriIPlote: string;
  vendi: string;
  kur: Date;
};

function emri<T extends string>(lista: { vlera: T; emri: string }[], v: T): string {
  return lista.find((x) => x.vlera === v)?.emri ?? v;
}

function esc(t: string): string {
  return t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// A short code that changes whenever any word of the contract changes (FNV-1a, 32 bit), so a
// printed copy can be compared with another one.
export function kodiIVerifikimit(tekst: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < tekst.length; i++) {
    h ^= tekst.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  const s = h.toString(16).toUpperCase().padStart(8, "0");
  return `${s.slice(0, 4)}-${s.slice(4)}`;
}

export function htmlIKontrates(d: DhenatEKontrates, z: Zgjedhjet, n: Nenshkrimi): { html: string; kodi: string } {
  const numri = d.vizitaId.slice(0, 8).toUpperCase();
  const nenet = nenetEKontrates(d);
  const kushtet: [string, string][] = [
    ["Hyrja në pronë", `${emri(HYRJET, z.hyrja)}: ${HYRJET.find((h) => h.vlera === z.hyrja)?.pershkrimi ?? ""}`],
    ["Çmimi", `${CMIMI_TEKST} për vizitën e kryer`],
    ["Mënyra e pagesës", emri(PAGESAT, z.pagesa)],
    ["Afati i pagesës", emri(AFATET, z.afati)],
    [
      "Gjendja para fillimit",
      z.fotoParaFillimit
        ? "Miku bën foto të gjendjes para se të fillojë, që çdo dëm i vjetër të dallohet."
        : "Pa foto të veçanta para fillimit.",
    ],
  ];
  if (z.shenime.trim()) kushtet.push(["Shënime shtesë", z.shenime.trim()]);

  const klientiPranoi = d.pelqimiAt ? dataMeOre(d.pelqimiAt) : null;
  const mikuPranoi = d.kontrataPranuarAt ? dataMeOre(d.kontrataPranuarAt) : null;
  const nenshkruesi = n.roli === "klient" ? "Klienti" : "Miku";

  // everything that makes up the contract goes into the verification code
  const permbajtja = JSON.stringify([d, z, { ...n, kur: n.kur.toISOString() }, KONTRATA_VERSIONI]);
  const kodi = kodiIVerifikimit(permbajtja);

  const pala = (roli: string, emriPales: string, pranoi: string | null, nenshkruar: boolean) => `
    <div class="nenshkrim">
      <div class="nenshkrimRoli">${roli}</div>
      <div class="nenshkrimEmri">${esc(emriPales)}</div>
      ${
        nenshkruar
          ? `<div class="firma">${esc(n.emriIPlote)}</div>
             <div class="vija"></div>
             <div class="imet">Nënshkruar digjitalisht më ${esc(dataMeOre(n.kur.toISOString()))}, ${esc(n.vendi)}</div>`
          : `<div class="firmaBosh"></div><div class="vija"></div>`
      }
      <div class="imet">${pranoi ? `Pranoi në Urëza më ${esc(pranoi)}` : "Ende pa pranim në Urëza"}</div>
    </div>`;

  const html = `<!DOCTYPE html>
<html lang="sq"><head><meta charset="utf-8" />
<style>
  @page { size: A4; margin: 28px 32px; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, "Helvetica Neue", Helvetica, Arial, sans-serif; color: #173C48; font-size: 11.5px; line-height: 1.5; margin: 0; }
  .krye { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #175568; padding-bottom: 12px; }
  .marka { display: flex; align-items: center; gap: 10px; }
  .logo { width: 38px; height: 38px; border-radius: 10px; background: #173F4E; display: flex; align-items: center; justify-content: center; }
  .emriMarkes { font-size: 20px; font-weight: 800; color: #173F4E; }
  .moto { font-size: 9px; letter-spacing: 1.6px; color: #17695A; font-weight: 700; }
  .nr { text-align: right; font-size: 10px; color: #4A626E; }
  .nr b { display: block; font-size: 13px; color: #173C48; }
  h1 { font-size: 19px; margin: 16px 0 2px; letter-spacing: 0.5px; }
  .nen { color: #4A626E; margin: 0 0 14px; }
  table { width: 100%; border-collapse: collapse; margin: 6px 0 14px; }
  td { padding: 6px 8px; border-bottom: 1px solid #E3EAF0; vertical-align: top; }
  td.e { width: 30%; color: #4A626E; font-weight: 600; }
  .seksion { font-size: 10px; letter-spacing: 1.5px; font-weight: 800; color: #17695A; margin-top: 14px; }
  .neni { margin: 10px 0 0; page-break-inside: avoid; }
  .neni h3 { font-size: 12.5px; margin: 0 0 3px; }
  .neni ul { margin: 0; padding-left: 18px; }
  .neni li { margin: 1px 0; }
  .nenshkrimet { display: flex; gap: 24px; margin-top: 18px; page-break-inside: avoid; }
  .nenshkrim { flex: 1; border: 1px solid #D3DEE4; border-radius: 10px; padding: 12px; }
  .nenshkrimRoli { font-size: 9.5px; letter-spacing: 1.5px; font-weight: 800; color: #17695A; }
  .nenshkrimEmri { font-weight: 700; margin-bottom: 8px; }
  .firma { font-family: "Snell Roundhand", "Brush Script MT", "Segoe Script", cursive; font-size: 24px; color: #175568; min-height: 34px; }
  .firmaBosh { min-height: 34px; }
  .vija { border-top: 1px solid #7C949F; margin: 2px 0 6px; }
  .imet { font-size: 9.5px; color: #4A626E; }
  .fund { margin-top: 18px; padding-top: 10px; border-top: 1px solid #E3EAF0; display: flex; justify-content: space-between; gap: 16px; font-size: 9.5px; color: #4A626E; page-break-inside: avoid; }
  .kodi { font-family: Menlo, Courier, monospace; font-size: 12px; color: #173C48; font-weight: 700; }
  .shenim { background: #FFF2DE; color: #8A5210; border-radius: 8px; padding: 8px 10px; margin-top: 12px; font-size: 9.5px; }
</style></head>
<body>
  <div class="krye">
    <div class="marka">
      <div class="logo">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#8CE0CB" stroke-width="2" stroke-linecap="round"><path d="M3 17c3-6 15-6 18 0"/><path d="M7 13v6M12 11v8M17 13v6M2 19h20"/></svg>
      </div>
      <div><div class="emriMarkes">Urëza</div><div class="moto">AFËR, EDHE KUR JE LARG</div></div>
    </div>
    <div class="nr">KONTRATË NR.<b>${esc(numri)}</b>Gjeneruar më ${esc(dataMeOre(n.kur.toISOString()))}</div>
  </div>

  <h1>KONTRATË PËR VIZITË</h1>
  <p class="nen">${esc(titulliIVizites(d.lloji))} · ${esc(d.pronaEmri)}, ${esc(d.pronaVendi)} · ${esc(dataEPlote(d.data))}</p>

  <div class="seksion">PALËT</div>
  <table>
    <tr><td class="e">Klienti</td><td>${esc(d.klientiEmri ?? "Klienti i Urëzës")}, pronari ose i autorizuari i pronës</td></tr>
    <tr><td class="e">Miku</td><td>${esc(paleMiku(d))}${d.mikuVerifikuarAt ? " · i verifikuar nga Urëza" : ""}</td></tr>
  </table>

  <div class="seksion">KUSHTET E ZGJEDHURA</div>
  <table>${kushtet.map(([e, v]) => `<tr><td class="e">${esc(e)}</td><td>${esc(v)}</td></tr>`).join("")}</table>

  <div class="seksion">NENET</div>
  ${nenet
    .map((nn) => `<div class="neni"><h3>${esc(nn.titulli)}</h3><ul>${nn.pikat.map((p) => `<li>${esc(p)}</li>`).join("")}</ul></div>`)
    .join("")}

  <div class="nenshkrimet">
    ${pala("KLIENTI", d.klientiEmri ?? "Klienti", klientiPranoi, n.roli === "klient")}
    ${pala("MIKU", d.mikuEmri ?? "Miku", mikuPranoi, n.roli === "miku")}
  </div>

  <div class="fund">
    <div>Nënshkroi digjitalisht: <b>${esc(nenshkruesi)}</b> (${esc(n.emriIPlote)}).<br/>Versioni i kontratës: ${esc(dataEPlote(KONTRATA_VERSIONI))}.</div>
    <div style="text-align:right">Kodi i verifikimit<br/><span class="kodi">${kodi}</span></div>
  </div>
  <div class="shenim">Model kontrate për prototipin e Urëzës. Para përdorimit të vërtetë duhet ta rishikojë një jurist në Kosovë.</div>
</body></html>`;

  return { html, kodi };
}
