import { useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";

import { dil } from "@/lib/sesioni";
import { useToast } from "./ui/Toast";

export function ButoniDil() {
  const [duke, setDuke] = useState(false);
  const toast = useToast();

  async function dalja() {
    setDuke(true);
    try {
      await dil();
    } catch (e) {
      setDuke(false);
      toast.gabim(`Dalja nuk u krye. ${(e as Error).message}`);
    }
  }

  return (
    <Pressable onPress={dalja} disabled={duke} accessibilityRole="button" hitSlop={8}>
      <Text style={styles.teksti}>{duke ? "…" : "Dil"}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  teksti: { color: "#2e6878", fontWeight: "700", fontSize: 16, paddingHorizontal: 8 },
});
