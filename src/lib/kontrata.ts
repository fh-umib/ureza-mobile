import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

import type { IconName } from "@/components/UrezaIcon";

import { CMIMI_TEKST, PJESA_E_DEMIT } from "./kushtet";
import { lexo } from "./lexo";
import { useSesioni } from "./sesioni";
import { supabase } from "./supabase";
import { dataEPlote, titulliIVizites, type LlojiVizites } from "./vizitat";

// The contract between the client and the Miku for one visit (supabase/besimi.sql). The client
// agrees when sending the request, the Miku before accepting it. Both read the same text, built
// here from the visit, so change KONTRATA_VERSIONI whenever the text changes.
//
// It is a model for the prototype, not legal advice: before real use a lawyer in Kosovo should
// review it.

export const KONTRATA_VERSIONI = "2026-11-25";

// The share of a damage the Miku pays lives with the price in kushtet.ts.
export { PJESA_E_DEMIT } from "./kushtet";

// ---------------------------------------------------------------------------------------------
// Who the Miku is (profiles.miku_lloji)

export type LlojiIMikut = "kompani" | "individ" | "student" | "mjeshter";

export const LLOJET_E_MIKUT: { vlera: LlojiIMikut; emri: string; pershkrimi: string; ikona: IconName }[] = [
  { vlera: "kompani", emri: "Kompani", pershkrimi: "Biznes i regjistruar në Kosovë (ARBK)", ikona: "houses" },
  { vlera: "individ", emri: "Individ", pershkrimi: "Person fizik, pa biznes", ikona: "user" },
  { vlera: "student", emri: "Student", pershkrimi: "Punë me kohë të pjesshme", ikona: "book" },
  { vlera: "mjeshter", emri: "Mjeshtër", pershkrimi: "Me zanat, pa kompani", ikona: "key" },
];

export function emriILlojit(lloji: LlojiIMikut | null | undefined): string {
  return LLOJET_E_MIKUT.find((l) => l.vlera === lloji)?.emri ?? "Pa përcaktuar";
}

export type ProfiliIPunes = { lloji: LlojiIMikut | null; biznesi: string | null; nrb: string | null };

// The signed-in Miku's own work profile. `gati` is false while it loads or when the columns do not
// exist yet (supabase/besimi.sql not run).
export function useProfiliIPunes(): {
  profili: ProfiliIPunes | null;
  gati: boolean;
  ruaj: (p: ProfiliIPunes) => Promise<string | null>;
} {
  const { perdoruesi } = useSesioni();
  const uid = perdoruesi?.id ?? null;
  const [gjendja, setGjendja] = useState<{ uid: string | null; profili: ProfiliIPunes | null; gati: boolean }>({
    uid: null,
    profili: null,
    gati: false,
  });

  useFocusEffect(
    useCallback(() => {
      if (!uid) return;
      let aktiv = true;
      void lexo<{ miku_lloji: LlojiIMikut | null; miku_biznesi: string | null; miku_nrb: string | null }[]>(
        supabase.from("profiles").select("miku_lloji, miku_biznesi, miku_nrb").eq("id", uid),
      ).then((r) => {
        if (!aktiv) return;
        if (r.tipi !== "ok" || r.data.length === 0) {
          setGjendja({ uid, profili: null, gati: false });
          return;
        }
        const x = r.data[0];
        setGjendja({ uid, profili: { lloji: x.miku_lloji, biznesi: x.miku_biznesi, nrb: x.miku_nrb }, gati: true });
      });
      return () => {
        aktiv = false;
      };
    }, [uid]),
  );

  const ruaj = useCallback(
    async (p: ProfiliIPunes): Promise<string | null> => {
      if (!uid) return "Hyr përsëri në llogari.";
      try {
        const { error } = await supabase
          .from("profiles")
          .update({ miku_lloji: p.lloji, miku_biznesi: p.biznesi, miku_nrb: p.nrb })
          .eq("id", uid);
        if (error) {
          if (error.code === "42703" || error.code === "PGRST204") {
            return "Profili i punës kërkon supabase/besimi.sql në Supabase.";
          }
          if (error.code === "23514") return "Kontrollo emrin e biznesit (2–80 shkronja) dhe numrin e biznesit (6–12 shifra).";
          return error.code ? error.message : "Nuk u lidh me serverin. Provo përsëri.";
        }
        setGjendja({ uid, profili: p, gati: true });
        return null;
      } catch {
        return "Nuk u lidh me serverin. Provo përsëri.";
      }
    },
    [uid],
  );

  const eTanishme = gjendja.uid === uid;
  return { profili: eTanishme ? gjendja.profili : null, gati: eTanishme && gjendja.gati, ruaj };
}

// ---------------------------------------------------------------------------------------------
// The data of one contract (kontrata_e_vizites in supabase/besimi.sql)

export type DhenatEKontrates = {
  vizitaId: string;
  lloji: LlojiVizites;
  data: string;
  udhezime: string;
  pronaEmri: string;
  pronaVendi: string;
  klientiEmri: string | null;
  pelqimiAt: string | null;
  mikuEmri: string | null;
  mikuLloji: LlojiIMikut | null;
  mikuBiznesi: string | null;
  mikuNrb: string | null;
  mikuVerifikuarAt: string | null;
  kontrataPranuarAt: string | null;
};

type NgaServeri = {
  vizita_id: string;
  lloji: LlojiVizites;
  data: string;
  udhezime: string;
  prona_emri: string;
  prona_vendi: string;
  klienti_emri: string | null;
  pelqimi_at: string | null;
  miku_emri: string | null;
  miku_lloji: LlojiIMikut | null;
  miku_biznesi: string | null;
  miku_nrb: string | null;
  miku_verifikuar_at: string | null;
  kontrata_pranuar_at: string | null;
};

export type Kontrata = { burimi: "duke_ngarkuar" | "supabase" | "mungon"; dhenat: DhenatEKontrates | null };

// Reads the contract of a visit. "mungon": the function does not exist yet (besimi.sql not run)
// or this user may not read it; the screens then build it from what they already know.
export function useKontrata(vizitaId: string | null): Kontrata {
  const [gjendja, setGjendja] = useState<{ id: string | null } & Kontrata>({
    id: null,
    burimi: "duke_ngarkuar",
    dhenat: null,
  });

  useFocusEffect(
    useCallback(() => {
      if (!vizitaId) return;
      let aktiv = true;
      void lexo<NgaServeri | null>(supabase.rpc("kontrata_e_vizites", { vid: vizitaId })).then((r) => {
        if (!aktiv) return;
        if (r.tipi !== "ok" || !r.data) {
          setGjendja({ id: vizitaId, burimi: "mungon", dhenat: null });
          return;
        }
        const x = r.data;
        setGjendja({
          id: vizitaId,
          burimi: "supabase",
          dhenat: {
            vizitaId: x.vizita_id,
            lloji: x.lloji,
            data: x.data,
            udhezime: x.udhezime,
            pronaEmri: x.prona_emri,
            pronaVendi: x.prona_vendi,
            klientiEmri: x.klienti_emri,
            pelqimiAt: x.pelqimi_at,
            mikuEmri: x.miku_emri,
            mikuLloji: x.miku_lloji,
            mikuBiznesi: x.miku_biznesi,
            mikuNrb: x.miku_nrb,
            mikuVerifikuarAt: x.miku_verifikuar_at,
            kontrataPranuarAt: x.kontrata_pranuar_at,
          },
        });
      });
      return () => {
        aktiv = false;
      };
    }, [vizitaId]),
  );

  return gjendja.id === vizitaId ? { burimi: gjendja.burimi, dhenat: gjendja.dhenat } : { burimi: "duke_ngarkuar", dhenat: null };
}

// ---------------------------------------------------------------------------------------------
// The text of the contract

export type NeniIKontrates = { titulli: string; pikat: string[] };

// "Dren, student" · "Ndërtimi Sh.p.k. (Nr. i biznesit 811234567), përfaqësuar nga Dren"
export function paleMiku(d: Pick<DhenatEKontrates, "mikuEmri" | "mikuLloji" | "mikuBiznesi" | "mikuNrb">): string {
  const emri = d.mikuEmri ?? "Miku";
  if (d.mikuLloji === "kompani" && d.mikuBiznesi) {
    return `${d.mikuBiznesi}${d.mikuNrb ? ` (Nr. i biznesit ${d.mikuNrb})` : ""}, përfaqësuar nga ${emri}`;
  }
  if (d.mikuLloji === "mjeshter") return `${emri}, mjeshtër${d.mikuBiznesi ? ` (${d.mikuBiznesi})` : ""}`;
  if (d.mikuLloji) return `${emri}, ${emriILlojit(d.mikuLloji).toLowerCase()}`;
  return emri;
}

export function nenetEKontrates(d: DhenatEKontrates): NeniIKontrates[] {
  const kompani = d.mikuLloji === "kompani";
  return [
    {
      titulli: "1. Palët",
      pikat: [
        `Klienti: ${d.klientiEmri ?? "klienti i Urëzës"}, pronari ose i autorizuari i pronës.`,
        `Miku: ${paleMiku(d)}.`,
        "Urëza është platforma që i lidh palët, verifikon Mikun dhe shqyrton kundërshtimet.",
      ],
    },
    {
      titulli: "2. Objekti i kontratës",
      pikat: [
        `${titulliIVizites(d.lloji)} te “${d.pronaEmri}”, ${d.pronaVendi}, më ${dataEPlote(d.data)}.`,
        `Udhëzimet e klientit: “${d.udhezime}”`,
        "Miku kontrollon dhe raporton. Nuk bën riparime dhe nuk merr asgjë nga prona.",
      ],
    },
    {
      titulli: "3. Çmimi dhe pagesa",
      pikat: [
        `${CMIMI_TEKST} për vizitën e kryer. Në këtë fazë pagesa bëhet jashtë aplikacionit.`,
        "Kërkesa anulohet falas derisa Miku ta pranojë.",
        "Nëse admini e pranon kundërshtimin e klientit, vizita nuk paguhet ose përsëritet pa pagesë.",
      ],
    },
    {
      titulli: "4. Detyrimet e Mikut",
      pikat: [
        "Shkon te prona në ditën e caktuar dhe kontrollon atë që kërkon klienti.",
        "Dërgon dëshmi të vërteta: vendndodhjen GPS te prona, foto të drejtpërdrejta nga kamera dhe shënim zanor.",
        "Hyn në pronë vetëm me lejen e klientit dhe në mënyrën që klienti ka caktuar. Del duke e lënë siç e gjeti.",
        "I mban konfidenciale të dhënat, fotot dhe adresën e pronës, dhe nuk i përdor për asgjë tjetër.",
      ],
    },
    {
      titulli: "5. Detyrimet e klientit",
      pikat: [
        "Jep udhëzime të qarta dhe lejen për hyrje e fotografim (pëlqimi me shkrim që jep me kërkesën).",
        "Për vizitën te prindërit, siguron që prindi pajtohet me vizitën dhe me fotot.",
        "E shqyrton raportin dhe e miraton, ose e kundërshton me arsye.",
      ],
    },
    {
      titulli: "6. Dëmi gjatë punës",
      pikat: [
        `Nëse Miku shkakton dëm në pronë gjatë vizitës nga pakujdesia, paguan ${PJESA_E_DEMIT}% të vlerës së dëmit.`,
        "Për dëm të shkaktuar me qëllim ose nga pakujdesia e rëndë, Miku përgjigjet për dëmin e plotë, sipas Ligjit për Marrëdhëniet e Detyrimeve.",
        "Dëmi dokumentohet me foto në aplikacion. Nëse palët nuk pajtohen, vendos admini i Urëzës.",
        "Miku nuk përgjigjet për dëme që ekzistonin para vizitës ose që ndodhin pas saj.",
      ],
    },
    {
      titulli: "7. Kushtet e punës",
      pikat: [
        kompani
          ? "Miku punon si kompani e pavarur. Punëtorët që dërgon janë të punësuar prej saj dhe kompania përgjigjet për ta sipas Ligjit të Punës."
          : "Miku punon i pavarur: kjo kontratë nuk krijon marrëdhënie pune me klientin as me Urëzën.",
        "Vizita bëhet ndërmjet orës 08:00 dhe 20:00, në ditën e caktuar ose në një ditë tjetër me marrëveshje.",
        "Miku nuk detyrohet të bëjë punë të rrezikshme (p.sh. të hipë në çati). Kontrollon nga vendi i sigurt dhe e shënon në raport.",
        "Miku ka të drejtë ta refuzojë ose ta ndërpresë vizitën kur nuk është e sigurt, pa pasoja.",
      ],
    },
    {
      titulli: "8. Të dhënat personale",
      pikat: [
        "Vendndodhja e Mikut lexohet vetëm gjatë vizitës, kurrë në sfond.",
        "Fotot dhe zëri ruhen privatisht: i shohin klienti, Miku i vizitës dhe, kur ka kundërshtim, admini.",
        "Të dhënat përpunohen sipas Ligjit për Mbrojtjen e të Dhënave Personale.",
      ],
    },
    {
      titulli: "9. Mosmarrëveshjet dhe ligji",
      pikat: [
        "Mosmarrëveshjet zgjidhen së pari përmes kundërshtimit në aplikacion dhe vendimit të adminit të Urëzës.",
        "Nëse nuk zgjidhen, zbatohet ligji i Republikës së Kosovës dhe vendos gjykata kompetente në Kosovë.",
      ],
    },
  ];
}
