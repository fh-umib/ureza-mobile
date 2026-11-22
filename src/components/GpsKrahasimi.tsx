import { StyleSheet, Text, View } from "react-native";

import { distancaNeTekst, krahaso, RREZJA_E_PRONES, type GjendjaEGps } from "@/lib/gjeo";
import type { Prona } from "@/lib/pronat";

import { UrezaIcon, type IconName } from "./UrezaIcon";

type Gps = { gjeresia: number | null; gjatesia: number | null; saktesia: number | null };

const PAMJA: Record<GjendjaEGps, { icon: IconName; bg: string; fg: string }> = {
  brenda: { icon: "check", bg: "#E4F6EB", fg: "#1E6B3E" },
  afer: { icon: "pin", bg: "#FFF2DE", fg: "#8A5210" },
  larg: { icon: "warning", bg: "#FBE9E9", fg: "#9B2C2C" },
};

// What the GPS position of a visit says about where the Miku was: inside the property, near it, or far.
// Returns null when there is nothing to compare: no GPS position yet, or the exact position of the
// property is not known (a property placed only by its town is never compared).
export function krahasimiIGps(gps: Gps | null | undefined, prona: Prona | undefined) {
  if (!gps || gps.gjeresia === null || gps.gjatesia === null || !prona?.koordinatat) return null;
  const k = krahaso({ lat: gps.gjeresia, lng: gps.gjatesia, saktesia: gps.saktesia }, prona.koordinatat);
  const tekst =
    k.gjendja === "brenda"
      ? `Brenda pronës · ${distancaNeTekst(k.metra)}`
      : k.gjendja === "afer"
        ? `Afër pronës · ${distancaNeTekst(k.metra)}`
        : `${distancaNeTekst(k.metra)} larg pronës`;
  return { ...k, tekst };
}

// The chip: icon + words, never colour alone.
export function GpsKrahasimi({ gps, prona }: { gps: Gps | null | undefined; prona: Prona | undefined }) {
  const k = krahasimiIGps(gps, prona);
  if (!k) return null;
  const p = PAMJA[k.gjendja];
  return (
    <View
      style={[styles.chip, { backgroundColor: p.bg }]}
      accessibilityLabel={`${k.tekst}. Prona konsiderohet brenda kur GPS-i është brenda ${RREZJA_E_PRONES} metrave.`}
    >
      <UrezaIcon name={p.icon} size={16} color={p.fg} strokeWidth={2.4} />
      <Text style={[styles.text, { color: p.fg }]}>{k.tekst}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: "flex-start",
    minHeight: 32,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  text: { fontSize: 13, fontWeight: "700", flexShrink: 1 },
});
