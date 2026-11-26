import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";

import { colors, font, rrezja } from "@/constants/ureza";

import { UrezaIcon, type IconName } from "../UrezaIcon";

// One button for the whole app. Variants:
//  * kryesor   - the main action of a screen (petrol, white text)
//  * dytesor   - a framed secondary action
//  * i_lehte   - text only, for "Provo përsëri", "Anulo"
//  * rrezik    - a destructive action, only after a confirmation
// Pressed, disabled and busy states are built in; the target is never under 44 px.
export type VariantiIButonit = "kryesor" | "dytesor" | "i_lehte" | "rrezik";

const NGJYRAT: Record<VariantiIButonit, { bg: string; fg: string; kufi: string }> = {
  kryesor: { bg: colors.petrol, fg: colors.white, kufi: colors.petrol },
  dytesor: { bg: colors.white, fg: colors.petrol, kufi: colors.line },
  i_lehte: { bg: "transparent", fg: colors.petrol, kufi: "transparent" },
  rrezik: { bg: colors.error, fg: colors.white, kufi: colors.error },
};

export function Butoni({
  etiketa,
  onPress,
  varianti = "kryesor",
  ikona,
  ikonaMajtas,
  duke = false,
  joAktiv = false,
  madhesia = "e_madhe",
  accessibilityLabel,
  style,
}: {
  etiketa: string;
  onPress: () => void;
  varianti?: VariantiIButonit;
  ikona?: IconName; // on the right, e.g. "arrow" for something that opens
  ikonaMajtas?: IconName;
  duke?: boolean;
  joAktiv?: boolean;
  madhesia?: "e_madhe" | "e_vogel";
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const n = NGJYRAT[varianti];
  const pasiv = joAktiv || duke;
  const eVogel = madhesia === "e_vogel";
  const ikonaMadhesia = eVogel ? 18 : 20;

  return (
    <Pressable
      onPress={onPress}
      disabled={pasiv}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? etiketa}
      accessibilityState={{ disabled: pasiv, busy: duke }}
      style={({ pressed }) => [
        styles.baza,
        eVogel ? styles.eVogel : styles.eMadhe,
        { backgroundColor: n.bg, borderColor: n.kufi },
        varianti === "i_lehte" && styles.iLehte,
        pressed && !pasiv && styles.shtypur,
        joAktiv && !duke && styles.joAktiv,
        style,
      ]}
    >
      {duke ? (
        <ActivityIndicator color={n.fg} />
      ) : (
        <View style={styles.brenda}>
          {ikonaMajtas ? <UrezaIcon name={ikonaMajtas} size={ikonaMadhesia} color={n.fg} strokeWidth={2.3} /> : null}
          <Text style={[styles.teksti, eVogel && styles.tekstiVogel, { color: n.fg }]} numberOfLines={1}>
            {etiketa}
          </Text>
          {ikona ? <UrezaIcon name={ikona} size={ikonaMadhesia} color={n.fg} strokeWidth={2.4} /> : null}
        </View>
      )}
    </Pressable>
  );
}

// A row of buttons that wraps on narrow phones.
export function RreshtiIButonave({ children }: { children: ReactNode }) {
  return <View style={styles.rreshti}>{children}</View>;
}

const styles = StyleSheet.create({
  baza: {
    borderRadius: rrezja.butoni,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  eMadhe: { minHeight: 56 },
  eVogel: { minHeight: 44, paddingHorizontal: 14, borderRadius: 22 },
  iLehte: { paddingHorizontal: 4, alignSelf: "flex-start" },
  shtypur: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  joAktiv: { opacity: 0.45 },
  brenda: { flexDirection: "row", alignItems: "center", gap: 8 },
  teksti: { fontSize: 17, fontFamily: font.w800 },
  tekstiVogel: { fontSize: 15 },
  rreshti: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
});
