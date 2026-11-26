import { StyleSheet, Text, View } from "react-native";

import { colors, hija, rrezja } from "@/constants/ureza";

import { UrezaIcon, type IconName } from "../UrezaIcon";
import { Butoni } from "./Butoni";

// An empty or failed state that says what happened and what to do next, always with one
// clear action when there is one. "gabim" is for a failed load (no connection), "bosh" for
// a list with nothing in it yet.
export function GjendjaBosh({
  toni = "bosh",
  ikona,
  titulli,
  teksti,
  veprimi,
}: {
  toni?: "bosh" | "gabim";
  ikona?: IconName;
  titulli: string;
  teksti: string;
  veprimi?: { etiketa: string; onPress: () => void; ikona?: IconName };
}) {
  const gabim = toni === "gabim";
  const ik = ikona ?? (gabim ? "globe" : "sparkle");
  return (
    <View style={styles.karta} accessibilityRole={gabim ? "alert" : undefined}>
      <View style={[styles.ikona, { backgroundColor: gabim ? colors.kujdesBg : colors.ikonaBg }]}>
        <UrezaIcon name={ik} size={24} color={gabim ? colors.kujdes : colors.petrol} strokeWidth={2.2} />
      </View>
      <Text style={styles.titulli} accessibilityRole="header">
        {titulli}
      </Text>
      <Text style={styles.teksti}>{teksti}</Text>
      {veprimi ? (
        <Butoni
          etiketa={veprimi.etiketa}
          onPress={veprimi.onPress}
          varianti={gabim ? "dytesor" : "kryesor"}
          ikona={veprimi.ikona ?? (gabim ? undefined : "arrow")}
          ikonaMajtas={gabim ? "back" : undefined}
          madhesia="e_vogel"
          style={styles.butoni}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  karta: {
    backgroundColor: colors.white,
    borderRadius: rrezja.karta,
    padding: 20,
    gap: 8,
    alignItems: "flex-start",
    ...hija.karta,
  },
  ikona: {
    width: 44,
    height: 44,
    borderRadius: rrezja.ikona,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  titulli: { color: colors.ink, fontSize: 18, lineHeight: 24, fontWeight: "800" },
  teksti: { color: colors.textSecondary, fontSize: 15, lineHeight: 22, fontWeight: "500" },
  butoni: { marginTop: 6 },
});
