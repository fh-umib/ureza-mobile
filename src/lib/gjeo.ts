// Geography helpers: distances, reading coordinates, and placing a point on the map of Kosovo.

export type Koordinata = { lat: number; lng: number };

// ---------------------------------------------------------------------------------------
// Distance between the GPS position of a visit and the property
// ---------------------------------------------------------------------------------------

export const RREZJA_E_PRONES = 150; // metres: a position this close counts as "inside the property"

const RREZJA_E_TOKES = 6371008.8; // mean radius of the Earth, metres

// Haversine distance in metres.
export function distancaNeMetra(a: Koordinata, b: Koordinata): number {
  const rad = (g: number) => (g * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * RREZJA_E_TOKES * Math.asin(Math.min(1, Math.sqrt(h)));
}

// "85 m", "1,2 km", "34 km"
export function distancaNeTekst(metra: number): string {
  if (metra < 1000) return `${Math.round(metra)} m`;
  const km = metra / 1000;
  return km < 10 ? `${km.toFixed(1).replace(".", ",")} km` : `${Math.round(km)} km`;
}

export type GjendjaEGps = "brenda" | "afer" | "larg";

// brenda: within the radius of the property.
// afer:   outside the radius, but the GPS accuracy is large enough that the Miku may still have been inside.
// larg:   clearly elsewhere.
export function krahaso(
  gps: Koordinata & { saktesia?: number | null },
  prona: Koordinata,
): { gjendja: GjendjaEGps; metra: number } {
  const metra = distancaNeMetra(gps, prona);
  if (metra <= RREZJA_E_PRONES) return { gjendja: "brenda", metra };
  const pasaktesia = Math.max(0, gps.saktesia ?? 0);
  if (metra - pasaktesia <= RREZJA_E_PRONES) return { gjendja: "afer", metra };
  return { gjendja: "larg", metra };
}

// ---------------------------------------------------------------------------------------
// Reading coordinates that a person typed or pasted
// ---------------------------------------------------------------------------------------

function kontrollo(lat: number, lng: number): Koordinata | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
}

const DMS =
  /(\d{1,3})\s*[°º]\s*(\d{1,2})\s*['′’]\s*(\d{1,2}(?:\.\d+)?)\s*(?:["″”]|'')?\s*([NSns])[\s,;]*(\d{1,3})\s*[°º]\s*(\d{1,2})\s*['′’]\s*(\d{1,2}(?:\.\d+)?)\s*(?:["″”]|'')?\s*([EWew])/;

const E_THJESHTE = /^(-?\d{1,3}(?:\.\d+)?)\s*°?\s*([NSns])?\s*[,;\s]\s*(-?\d{1,3}(?:\.\d+)?)\s*°?\s*([EWew])?$/;

// Understands: "42.3702, 21.1553", "42.3702 21.1553", "42°22'12.7"N 21°09'19.1"E", and the full
// links of Google Maps (…/@42.37,21.15,17z, …!3d42.37!4d21.15, …?q=42.37,21.15).
export function lexoKoordinatat(tekst: string): Koordinata | null {
  let t = tekst.trim();
  if (!t) return null;
  try {
    t = decodeURIComponent(t);
  } catch {
    // keep the text as it is
  }

  // the exact place of a Google Maps link wins over the centre of the map view
  let m = t.match(/!3d(-?\d{1,3}\.\d+)!4d(-?\d{1,3}\.\d+)/);
  if (m) return kontrollo(Number(m[1]), Number(m[2]));

  m = t.match(/@(-?\d{1,3}\.\d+),\s*(-?\d{1,3}\.\d+)/);
  if (m) return kontrollo(Number(m[1]), Number(m[2]));

  m = t.match(/[?&](?:q|ll|query|center|destination)=\s*(-?\d{1,3}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)/);
  if (m) return kontrollo(Number(m[1]), Number(m[2]));

  m = t.match(DMS);
  if (m) {
    const lat = (Number(m[1]) + Number(m[2]) / 60 + Number(m[3]) / 3600) * (/s/i.test(m[4]) ? -1 : 1);
    const lng = (Number(m[5]) + Number(m[6]) / 60 + Number(m[7]) / 3600) * (/w/i.test(m[8]) ? -1 : 1);
    return kontrollo(lat, lng);
  }

  const pastruar = t.replace(/[()[\]]/g, "").trim();
  m = pastruar.match(E_THJESHTE);
  if (m) {
    const lat = Number(m[1]) * (m[2] && /s/i.test(m[2]) ? -1 : 1);
    const lng = Number(m[3]) * (m[4] && /w/i.test(m[4]) ? -1 : 1);
    return kontrollo(lat, lng);
  }
  return null;
}

// What to tell the person when the text could not be read.
export function gabimiIKoordinatave(tekst: string): string {
  if (/goo\.gl|maps\.app/i.test(tekst)) {
    return "Lidhjet e shkurtra nuk lexohen. Në Google Maps shtyp gjatë mbi shtëpinë dhe kopjo numrat që shfaqen.";
  }
  return "Nuk e kuptoj. Shkruaj dy numra, p.sh. 42.3702, 21.1553, ose ngjit lidhjen e plotë nga Google Maps.";
}

// "42.37020, 21.15530"
export function koordinataNeTekst(k: Koordinata): string {
  return `${k.lat.toFixed(5)}, ${k.lng.toFixed(5)}`;
}

// A link that opens the position in the maps app of the phone.
export function lidhjaEHartes(k: Koordinata): string {
  return `https://www.google.com/maps?q=${k.lat},${k.lng}`;
}

// ---------------------------------------------------------------------------------------
// The map of Kosovo of the design (390 x 460, Harta.dc.html)
// ---------------------------------------------------------------------------------------

export const HARTA_LEVIZJA = { x: 38, y: 96, shkalla: 1.15 }; // translate + scale of the outline in the design
const KONTURA = { x0: 12, x1: 262.4, y0: 12, y1: 288 }; // the outline's own bounds
const KOSOVA = { latMin: 41.856, latMax: 43.269, lngMin: 20.012, lngMax: 21.789 }; // bounds of Kosovo
const MARGJA = 0.04; // degrees: border towns still land on the map

// The point on the 390 x 460 map, or null when the position is not in Kosovo.
export function neHarte(k: Koordinata): { x: number; y: number } | null {
  if (
    k.lat < KOSOVA.latMin - MARGJA ||
    k.lat > KOSOVA.latMax + MARGJA ||
    k.lng < KOSOVA.lngMin - MARGJA ||
    k.lng > KOSOVA.lngMax + MARGJA
  ) {
    return null;
  }
  const xk = KONTURA.x0 + ((k.lng - KOSOVA.lngMin) / (KOSOVA.lngMax - KOSOVA.lngMin)) * (KONTURA.x1 - KONTURA.x0);
  const yk = KONTURA.y0 + ((KOSOVA.latMax - k.lat) / (KOSOVA.latMax - KOSOVA.latMin)) * (KONTURA.y1 - KONTURA.y0);
  return { x: HARTA_LEVIZJA.x + xk * HARTA_LEVIZJA.shkalla, y: HARTA_LEVIZJA.y + yk * HARTA_LEVIZJA.shkalla };
}

// ---------------------------------------------------------------------------------------
// Towns: a property without an exact position is placed at the centre of its town
// ---------------------------------------------------------------------------------------

type Qyteti = { emri: string; lat: number; lng: number; aliase: string[] };

// Aliases are lower case without accents. A word of the property's place matches when it starts
// with the alias (so "Ferizajt" and "Mitrovicës" match); aliases of up to 4 letters must match the
// whole word ("peje", "pec", "viti"), so they do not catch unrelated words.
const QYTETET: Qyteti[] = [
  { emri: "Prishtinë", lat: 42.6629, lng: 21.1655, aliase: ["prishtin", "pristina"] },
  { emri: "Prizren", lat: 42.2139, lng: 20.7397, aliase: ["prizren"] },
  { emri: "Pejë", lat: 42.6593, lng: 20.2883, aliase: ["peje", "peja", "pejes", "pec"] },
  { emri: "Gjakovë", lat: 42.3803, lng: 20.4308, aliase: ["gjakov", "djakovica"] },
  { emri: "Mitrovicë", lat: 42.8914, lng: 20.866, aliase: ["mitrovic"] },
  { emri: "Ferizaj", lat: 42.3702, lng: 21.1553, aliase: ["ferizaj", "urosevac"] },
  { emri: "Gjilan", lat: 42.4635, lng: 21.4694, aliase: ["gjilan", "gnjilane"] },
  { emri: "Vushtrri", lat: 42.8231, lng: 20.9675, aliase: ["vushtrri", "vucitrn"] },
  { emri: "Podujevë", lat: 42.9108, lng: 21.19, aliase: ["podujev", "podujevo"] },
  { emri: "Suharekë", lat: 42.3589, lng: 20.825, aliase: ["suharek", "theranda", "therand"] },
  { emri: "Rahovec", lat: 42.3997, lng: 20.6547, aliase: ["rahovec", "orahovac"] },
  { emri: "Malishevë", lat: 42.4822, lng: 20.7458, aliase: ["malishev"] },
  { emri: "Drenas", lat: 42.6272, lng: 20.8903, aliase: ["drenas", "gllogovc", "glogovac"] },
  { emri: "Lipjan", lat: 42.5222, lng: 21.1256, aliase: ["lipjan"] },
  { emri: "Fushë Kosovë", lat: 42.6389, lng: 21.1031, aliase: ["fushe kosov", "kosovo polje"] },
  { emri: "Obiliq", lat: 42.6881, lng: 21.0697, aliase: ["obiliq", "obilic"] },
  { emri: "Skenderaj", lat: 42.7467, lng: 20.7889, aliase: ["skenderaj", "srbica"] },
  { emri: "Istog", lat: 42.7808, lng: 20.4872, aliase: ["istog", "istok"] },
  { emri: "Klinë", lat: 42.62, lng: 20.5769, aliase: ["kline"] },
  { emri: "Deçan", lat: 42.5403, lng: 20.2878, aliase: ["decan", "decani"] },
  { emri: "Junik", lat: 42.4764, lng: 20.2764, aliase: ["junik"] },
  { emri: "Kamenicë", lat: 42.5781, lng: 21.58, aliase: ["kamenic"] },
  { emri: "Viti", lat: 42.3231, lng: 21.3636, aliase: ["viti", "vitia", "vitin"] },
  { emri: "Shtime", lat: 42.4331, lng: 21.0394, aliase: ["shtime"] },
  { emri: "Kaçanik", lat: 42.2331, lng: 21.2594, aliase: ["kacanik"] },
  { emri: "Hani i Elezit", lat: 42.15, lng: 21.2958, aliase: ["hani i elezit", "elez han"] },
  { emri: "Shtërpcë", lat: 42.2392, lng: 21.0233, aliase: ["shterpc"] },
  { emri: "Dragash", lat: 42.0611, lng: 20.6528, aliase: ["dragash"] },
  { emri: "Novobërdë", lat: 42.6097, lng: 21.4331, aliase: ["novoberd"] },
  { emri: "Graçanicë", lat: 42.6008, lng: 21.1914, aliase: ["gracanic"] },
  { emri: "Leposaviq", lat: 43.1025, lng: 20.8, aliase: ["leposaviq", "leposavic"] },
  { emri: "Zveçan", lat: 42.91, lng: 20.84, aliase: ["zvecan"] },
  { emri: "Zubin Potok", lat: 42.9164, lng: 20.6892, aliase: ["zubin potok"] },
];

// Lower case without accents: "Mitrovicë" -> "mitrovice".
function paThekse(tekst: string): string {
  return tekst
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// The centre of the town named in a text such as "Ferizaj" or "Shtëpia në Ferizaj, Kosovë".
export function gjejQytetin(tekst: string): { emri: string; k: Koordinata } | null {
  const t = ` ${paThekse(tekst)
    .replace(/[^a-z0-9]+/g, " ")
    .trim()} `;
  for (const q of QYTETET) {
    for (const alias of q.aliase) {
      const gjetur = alias.length >= 5 || alias.includes(" ") ? t.includes(` ${alias}`) : t.includes(` ${alias} `);
      if (gjetur) return { emri: q.emri, k: { lat: q.lat, lng: q.lng } };
    }
  }
  return null;
}
