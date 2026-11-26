import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "@/constants/ureza";

import { UrezaIcon } from "./UrezaIcon";

// A consent checkbox (the request form, the Miku accepting a contract): the whole row is the
// target, the box shows a check when ticked.
export function Kutia({ zgjedhur, onPress, teksti }: { zgjedhur: boolean; onPress: () => void; teksti: string }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.kutia, zgjedhur && styles.kutiaZgjedhur]}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: zgjedhur }}
      accessibilityLabel={teksti}
    >
      <View style={[styles.kutiaShenja, zgjedhur && styles.kutiaShenjaZgjedhur]}>
        {zgjedhur ? <UrezaIcon name="check" size={16} color={colors.white} strokeWidth={3} /> : null}
      </View>
      <Text style={styles.kutiaTeksti}>{teksti}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  kutia: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.white,
  },
  kutiaZgjedhur: { borderColor: colors.petrol, backgroundColor: "#F2F8FA" },
  kutiaShenja: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: colors.inputBorder,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  kutiaShenjaZgjedhur: { backgroundColor: colors.petrol, borderColor: colors.petrol },
  kutiaTeksti: { flex: 1, color: colors.ink, fontSize: 15, lineHeight: 21, fontWeight: "600" },
});
