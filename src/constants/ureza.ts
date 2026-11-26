// Colors of the Urëza design system (petrol blue). Body text #173C48, secondary
// text #4A626E. Mint is only used on dark backgrounds.
export const colors = {
  ink: "#173C48",
  textSecondary: "#4A626E",
  petrol: "#175568",
  hero: "#173F4E",
  teal: "#17695A",
  mint: "#8CE0CB",
  amber: "#F2C46B",
  line: "#D3DEE4",
  inputBorder: "#7C949F",
  background: "#F5F8FA",
  white: "#FFFFFF",
  onHeroText: "#D6E6EA",
  error: "#9B2C2C",
  errorBg: "#FBEFEE",
  errorLine: "#EBC8C5",
  // the light tint behind small icons on cards
  ikonaBg: "#E8F5F3",
  // states shown with colour + icon + words (freshness, map position): good, needs care, unknown
  okBg: "#E4F6EB",
  ok: "#1E6B3E",
  kujdesBg: "#FFF2DE",
  kujdes: "#8A5210",
  neutralBg: "#EEF1F3",
  neutral: "#5F6F77",
  // days that already have a visit in the calendar
  vizita: "#C9302C",
};

// Typeface: Figtree (Google Fonts), one family for the whole app. React Native picks a font by
// its family name, so each weight is its own family; use these instead of `fontWeight`.
export const font = {
  w400: "Figtree_400Regular",
  w500: "Figtree_500Medium",
  w600: "Figtree_600SemiBold",
  w700: "Figtree_700Bold",
  w800: "Figtree_800ExtraBold",
  // quoted words (a reason, a note), in italics
  w500i: "Figtree_500Medium_Italic",
} as const;

// Shared shape tokens, so every card, button and chip uses the same radius and shadow.
export const rrezja = { karta: 22, kartaVogel: 18, butoni: 16, chip: 14, ikona: 12 } as const;

export const hija = {
  // cards on the light background: a soft, low shadow
  karta: {
    shadowColor: "#0B2530",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 2,
  },
  // things that float above the screen (toasts)
  larte: {
    shadowColor: "#0B2530",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 8,
  },
} as const;
