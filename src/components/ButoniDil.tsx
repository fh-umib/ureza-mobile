import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text } from "react-native";

import { dil } from "@/lib/sesioni";
import { font } from "@/constants/ureza";

export function ButoniDil() {
  const [duke, setDuke] = useState(false);

  async function dalja() {
    setDuke(true);
    try {
      await dil();
    } catch (e) {
      setDuke(false);
      Alert.alert("Dalja nuk u krye", (e as Error).message);
    }
  }

  return (
    <Pressable onPress={dalja} disabled={duke} accessibilityRole="button" hitSlop={8}>
      <Text style={styles.teksti}>{duke ? "…" : "Dil"}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  teksti: { color: "#2e6878", fontFamily: font.w700, fontSize: 16, paddingHorizontal: 8 },
});
