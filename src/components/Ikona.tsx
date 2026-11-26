import { SymbolView } from "expo-symbols";
import type { ComponentProps } from "react";

import { UrezaIcon, type IconName } from "./UrezaIcon";

// Rich system icons through expo-symbols (in Expo Go): SF Symbols on iOS, Material Symbols on
// Android and web. Each icon is named by what it means in Urëza; the platform names are checked
// by TypeScript. When a symbol cannot be drawn, the Urëza line icon of the same meaning is shown.

type Emri = ComponentProps<typeof SymbolView>["name"];

const IKONAT = {
  shtepi: { ios: "house.fill", android: "home", rezerve: "home" },
  prindert: { ios: "figure.2", android: "family_restroom", rezerve: "heart" },
  toke: { ios: "leaf.fill", android: "park", rezerve: "map" },
  pronat: { ios: "house.and.flag.fill", android: "home_work", rezerve: "houses" },
  vizitat: { ios: "list.bullet.clipboard.fill", android: "assignment", rezerve: "list" },
  miratuar: { ios: "checkmark.seal.fill", android: "verified", rezerve: "check" },
  koha: { ios: "clock.fill", android: "schedule", rezerve: "clock" },
  vendim: { ios: "doc.text.magnifyingglass", android: "rate_review", rezerve: "doc" },
  kundershtuar: { ios: "exclamationmark.triangle.fill", android: "report", rezerve: "warning" },
  historia: { ios: "clock.arrow.circlepath", android: "history", rezerve: "clock" },
  statistika: { ios: "chart.bar.fill", android: "bar_chart", rezerve: "list" },
  miku: { ios: "person.crop.circle.badge.checkmark", android: "how_to_reg", rezerve: "user" },
  kalendar: { ios: "calendar", android: "calendar_month", rezerve: "clock" },
  shigjeta: { ios: "chevron.right", android: "chevron_right", rezerve: "chevron" },
  shto: { ios: "plus", android: "add", rezerve: "plus" },
  kujdes: { ios: "exclamationmark.circle.fill", android: "error", rezerve: "warning" },
  gps: { ios: "location.fill", android: "location_on", rezerve: "pin" },
  foto: { ios: "camera.fill", android: "photo_camera", rezerve: "camera" },
  ze: { ios: "waveform", android: "graphic_eq", rezerve: "mic" },
  ditari: { ios: "book.fill", android: "menu_book", rezerve: "book" },
  detyrat: { ios: "checklist", android: "checklist", rezerve: "list" },
} as const satisfies Record<string, { ios: Extract<Emri, string>; android: string; rezerve: IconName }>;

export type EmriIIkones = keyof typeof IKONAT;

export function Ikona({ emri, madhesia = 20, ngjyra }: { emri: EmriIIkones; madhesia?: number; ngjyra: string }) {
  const i = IKONAT[emri];
  return (
    <SymbolView
      name={{ ios: i.ios, android: i.android, web: i.android } as Emri}
      size={madhesia}
      tintColor={ngjyra}
      fallback={<UrezaIcon name={i.rezerve} size={madhesia} color={ngjyra} strokeWidth={2.2} />}
    />
  );
}
