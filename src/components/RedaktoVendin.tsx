import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";

import { useToast } from "./ui/Toast";
import { colors, font } from "@/constants/ureza";
import { useDhenat } from "@/lib/dhenat";
import type { Koordinata } from "@/lib/gjeo";
import { vendiNeHarte, type Prona } from "@/lib/pronat";

import { FletaModale } from "./FletaModale";
import { VendndodhjaFusha } from "./VendndodhjaFusha";

// Sets, changes or removes the exact position of a property that is already saved.
// The parent shows it only while it is open, so every opening starts from the saved position.
export function RedaktoVendin({ prona, mbyll }: { prona: Prona; mbyll: () => void }) {
  const { vendosVendndodhjen } = useDhenat();
  const toast = useToast();
  const [k, setK] = useState<Koordinata | null>(prona.koordinatat);
  const [duke, setDuke] = useState(false);
  const [gabim, setGabim] = useState<string | null>(null);

  function mbylle() {
    setGabim(null);
    mbyll();
  }

  async function ruaj() {
    if (duke) return;
    if (!k) {
      setGabim("Shkruaj koordinatat ose përdor vendndodhjen tënde.");
      return;
    }
    setDuke(true);
    setGabim(null);
    const mesazh = await vendosVendndodhjen(prona.id, k);
    setDuke(false);
    if (mesazh) {
      setGabim(mesazh);
      return;
    }
    toast.sukses("Vendndodhja e saktë u ruajt.");
    mbyll();
  }

  async function hiqe() {
    if (duke) return;
    setDuke(true);
    setGabim(null);
    const mesazh = await vendosVendndodhjen(prona.id, null);
    setDuke(false);
    if (mesazh) {
      setGabim(mesazh);
      return;
    }
    toast.info("Vendndodhja e saktë u hoq.");
    mbyll();
  }

  return (
    <FletaModale hapur mbyll={mbylle} titulli={`Vendndodhja e ${prona.emri}`}>
      <VendndodhjaFusha
        fillimi={prona.koordinatat}
        afer={vendiNeHarte(prona)?.k ?? null}
        onNdrysho={(vlera) => setK(vlera)}
      />
      {gabim ? <Text style={styles.gabim}>{gabim}</Text> : null}
      <Pressable
        style={[styles.ruaj, duke && styles.disabled]}
        onPress={ruaj}
        disabled={duke}
        accessibilityRole="button"
      >
        {duke ? <ActivityIndicator color={colors.white} /> : <Text style={styles.ruajText}>Ruaj vendndodhjen</Text>}
      </Pressable>
      {prona.koordinatat ? (
        <Pressable style={styles.hiq} onPress={hiqe} disabled={duke} accessibilityRole="button">
          <Text style={styles.hiqText}>Hiqe vendndodhjen e saktë</Text>
        </Pressable>
      ) : null}
      <Pressable style={styles.anulo} onPress={mbylle} accessibilityRole="button">
        <Text style={styles.anuloText}>Anulo</Text>
      </Pressable>
    </FletaModale>
  );
}

const styles = StyleSheet.create({
  gabim: { color: colors.error, fontSize: 14, lineHeight: 20, fontFamily: font.w600 },
  ruaj: {
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.petrol,
    alignItems: "center",
    justifyContent: "center",
  },
  ruajText: { color: colors.white, fontSize: 17, fontFamily: font.w700 },
  disabled: { opacity: 0.6 },
  hiq: { minHeight: 44, alignItems: "center", justifyContent: "center" },
  hiqText: { color: colors.error, fontSize: 16, fontFamily: font.w700 },
  anulo: { minHeight: 44, alignItems: "center", justifyContent: "center" },
  anuloText: { color: colors.textSecondary, fontSize: 16, fontFamily: font.w700 },
});
