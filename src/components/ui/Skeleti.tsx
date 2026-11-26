import { useEffect } from "react";
import { StyleSheet, View, type DimensionValue } from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { colors, hija, rrezja } from "@/constants/ureza";

// Skeletons: the shape of what is loading, shown instead of a lone spinner, so the screen
// does not jump when the data arrives. They pulse gently, and stand still for people who
// turned on "reduce motion".

function usePulsi() {
  const paLevizje = useReducedMotion();
  const v = useSharedValue(1);
  useEffect(() => {
    if (paLevizje) return;
    v.value = withRepeat(withTiming(0.45, { duration: 750 }), -1, true);
  }, [paLevizje, v]);
  return useAnimatedStyle(() => ({ opacity: v.value }));
}

export function Skeleti({
  gjeresia = "100%",
  lartesia = 14,
  rrezja: r = 7,
}: {
  gjeresia?: DimensionValue;
  lartesia?: number;
  rrezja?: number;
}) {
  const stili = usePulsi();
  return <Animated.View style={[styles.blloku, { width: gjeresia, height: lartesia, borderRadius: r }, stili]} />;
}

// A card that is loading: optionally a picture, a title line and two text lines.
export function SkeletiIKartes({ meFoto = false }: { meFoto?: boolean }) {
  return (
    <View style={styles.karta}>
      {meFoto ? <Skeleti lartesia={110} rrezja={14} /> : null}
      <Skeleti gjeresia="55%" lartesia={18} />
      <Skeleti gjeresia="90%" />
      <Skeleti gjeresia="70%" />
    </View>
  );
}

// A list of rows that is loading (icon, two lines, a chip).
export function SkeletiIListes({ rreshta = 3 }: { rreshta?: number }) {
  return (
    <View style={[styles.karta, styles.lista]}>
      {Array.from({ length: rreshta }, (_, i) => (
        <View key={i} style={[styles.rreshti, i > 0 && styles.ndarje]}>
          <Skeleti gjeresia={40} lartesia={40} rrezja={12} />
          <View style={styles.tekstet}>
            <Skeleti gjeresia="60%" lartesia={16} />
            <Skeleti gjeresia="35%" lartesia={12} />
          </View>
          <Skeleti gjeresia={72} lartesia={28} rrezja={14} />
        </View>
      ))}
    </View>
  );
}

// The whole screen is loading: one card and a list. Hidden from screen readers, which get
// a single "Po ngarkohet" instead.
export function SkeletiIFaqes({ meFoto = false, rreshta = 3 }: { meFoto?: boolean; rreshta?: number }) {
  return (
    <View style={styles.faqja} accessible accessibilityLabel="Po ngarkohet" accessibilityRole="progressbar">
      <SkeletiIKartes meFoto={meFoto} />
      <SkeletiIListes rreshta={rreshta} />
    </View>
  );
}

const styles = StyleSheet.create({
  blloku: { backgroundColor: colors.line },
  faqja: { gap: 14 },
  karta: { backgroundColor: colors.white, borderRadius: rrezja.karta, padding: 20, gap: 12, ...hija.karta },
  lista: { paddingVertical: 4, gap: 0 },
  rreshti: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14 },
  ndarje: { borderTopWidth: 1, borderTopColor: colors.background },
  tekstet: { flex: 1, gap: 8 },
});
