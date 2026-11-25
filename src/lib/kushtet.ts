import type { IconName } from "@/components/UrezaIcon";

// The terms of a visit (the market card of November 19, step 2: what a visit includes, the price,
// what Urëza is not responsible for, written consent). Every request records the version the
// client agreed to (vizitat.kushtet_versioni, supabase/besimi.sql), so change the version
// whenever the text changes.

export const KUSHTET_VERSIONI = "2026-11-25";
export const CMIMI_EURO = 15;
export const CMIMI_TEKST = `${CMIMI_EURO} €`;

export type SeksioniIKushteve = { ikona: IconName; titulli: string; pikat: string[] };

export const KUSHTET: SeksioniIKushteve[] = [
  {
    ikona: "check",
    titulli: "Çka përfshin një vizitë",
    pikat: [
      "Një Miku i verifikuar nga ekipi i Urëzës shkon te prona në ditën e zgjedhur.",
      "Kontrollon atë që shkruan te udhëzimet: çatinë, ujin, rrymën, dyert dhe dritaret, ose si janë prindërit.",
      "Sjell dëshmi: vendndodhjen GPS te prona, foto të drejtpërdrejta nga kamera dhe një shënim zanor.",
      "Ti e lexon raportin dhe vendos: e miraton, ose e kundërshton me arsye.",
    ],
  },
  {
    ikona: "doc",
    titulli: `Çmimi: ${CMIMI_TEKST} për vizitë`,
    pikat: [
      "I njëjti çmim për inspektimin e pronës dhe për vizitën te prindërit.",
      "Paguhet vetëm për vizitën e kryer. Kërkesa mund të anulohet falas derisa ta pranojë një Miku.",
      "Në këtë fazë pagesa bëhet jashtë aplikacionit, me marrëveshje me ekipin.",
    ],
  },
  {
    ikona: "shield",
    titulli: "Kush e bën vizitën dhe kush përgjigjet",
    pikat: [
      "Vetëm Mikutë e verifikuar nga ekipi i Urëzës i shohin dhe i pranojnë kërkesat.",
      "Nëse raporti nuk përputhet me kërkesën, e kundërshton. Admini i Urëzës i shqyrton dëshmitë dhe vendos.",
      "Nëse kundërshtimi pranohet, vizita nuk paguhet, ose përsëritet pa pagesë.",
    ],
  },
  {
    ikona: "warning",
    titulli: "Për çka nuk mbajmë përgjegjësi",
    pikat: [
      "Për dëmet që ekzistonin para vizitës, ose që ndodhin pas saj.",
      "Për riparime: Miku vetëm kontrollon dhe raporton, nuk rregullon asgjë.",
      "Për këshilla mjekësore: vizita te prindërit është jo mjekësore. Në rast urgjence thirr 112.",
      "Për pjesët e pronës ku Miku nuk ka qasje, ose që nuk janë përmendur te udhëzimet.",
    ],
  },
  {
    ikona: "key",
    titulli: "Pëlqimi me shkrim",
    pikat: [
      "Para çdo kërkese konfirmon që ke të drejtë ta lejosh hyrjen në pronë dhe fotografimin e saj.",
      "Për vizitën te prindërit konfirmon që prindi pajtohet me vizitën dhe me fotot.",
      "Pëlqimi ruhet bashkë me kërkesën, me datën dhe versionin e këtyre kushteve.",
    ],
  },
  {
    ikona: "pin",
    titulli: "Privatësia",
    pikat: [
      "Vendndodhja e Mikut lexohet vetëm gjatë vizitës, kur mbledh dëshmitë, kurrë në sfond.",
      "Fotot dhe zëri ruhen privatisht: i sheh vetëm ti, Miku i vizitës dhe, kur kundërshton, admini.",
      "Fotot merren vetëm nga kamera, jo nga galeria, që të jenë nga dita e vizitës.",
      "Mund t'i shkarkosh të dhënat e tua kurdo nga Profili.",
    ],
  },
];
