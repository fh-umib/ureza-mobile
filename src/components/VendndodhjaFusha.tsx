import { useState } from "react";
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { colors } from "@/constants/ureza";
import { gabimiIKoordinatave, koordinataNeTekst, lexoKoordinatat, type Koordinata } from "@/lib/gjeo";
import { merrVendndodhjen } from "@/lib/kapja";

import { UrezaIcon } from "./UrezaIcon";
import { ZgjidhNeHarte } from "./ZgjidhNeHarte";

// The exact position of a property (design: Pronat, "Shto pronë"). A client abroad cannot stand at
// the house, so the position is typed or pasted (numbers, or the link of Google Maps); a client who
// is at the property can take it from the phone instead. The parent gets the position as soon as the
// text can be read, or null while it cannot, together with the text itself (so it can tell "empty"
// from "typed but not readable").
export function VendndodhjaFusha({
  fillimi = null,
  afer = null,
  onNdrysho,
}: {
  fillimi?: Koordinata | null;
  afer?: Koordinata | null; // the town of the property: the map starts there
  onNdrysho: (k: Koordinata | null, tekst: string) => void;
}) {
  const [tekst, setTekst] = useState(fillimi ? koordinataNeTekst(fillimi) : "");
  const [lexuar, setLexuar] = useState<Koordinata | null>(fillimi);
  const [fokus, setFokus] = useState(false);
  const [provuar, setProvuar] = useState(false); // the text has been left once, so an error may show
  const [duke, setDuke] = useState(false);
  const [gabimiIPhone, setGabimiIPhone] = useState<string | null>(null);
  const [saktesia, setSaktesia] = useState<number | null>(null);
  const [harta, setHarta] = useState(false);

  function ndrysho(t: string) {
    setTekst(t);
    setGabimiIPhone(null);
    setSaktesia(null);
    const k = lexoKoordinatat(t);
    setLexuar(k);
    onNdrysho(k, t);
  }

  function zgjedhurNeHarte(k: Koordinata) {
    const t = koordinataNeTekst(k);
    setTekst(t);
    setLexuar(k);
    setProvuar(false);
    setSaktesia(null);
    setGabimiIPhone(null);
    onNdrysho(k, t);
  }

  async function perdorTelefonin() {
    if (duke) return;
    setDuke(true);
    setGabimiIPhone(null);
    const p = await merrVendndodhjen();
    setDuke(false);
    if (!p.ok) {
      setGabimiIPhone(p.mesazh);
      return;
    }
    const k = { lat: p.vlera.gjeresia, lng: p.vlera.gjatesia };
    setTekst(koordinataNeTekst(k));
    setLexuar(k);
    setProvuar(false);
    setSaktesia(p.vlera.saktesia);
    onNdrysho(k, koordinataNeTekst(k));
  }

  const gabim = provuar && tekst.trim().length > 0 && !lexuar ? gabimiIKoordinatave(tekst) : null;

  return (
    <View style={styles.fusha}>
      <Text style={styles.label}>Vendndodhja e saktë (jo e detyrueshme)</Text>
      <Text style={styles.ndihme}>
        Me të, harta të tregon pronën aty ku është dhe aplikacioni e krahason GPS-in e Mikut me të. Shëno shtëpinë në
        hartën satelitore, ose shkruaj koordinatat (në Google Maps shtyp gjatë mbi shtëpinë dhe kopjo numrat).
      </Text>
      {Platform.OS !== "web" ? (
        <Pressable
          style={styles.telefoni}
          onPress={() => setHarta(true)}
          accessibilityRole="button"
          accessibilityLabel="Zgjidhe në hartë"
        >
          <UrezaIcon name="map" size={20} color={colors.petrol} strokeWidth={2.2} />
          <Text style={styles.telefoniText}>Zgjidhe në hartë</Text>
        </Pressable>
      ) : null}
      <TextInput
        style={[styles.input, fokus && styles.inputFokus, gabim ? styles.inputGabim : null]}
        value={tekst}
        onChangeText={ndrysho}
        onFocus={() => setFokus(true)}
        onBlur={() => {
          setFokus(false);
          setProvuar(true);
        }}
        placeholder="42.3702, 21.1553 ose lidhja nga Google Maps"
        placeholderTextColor="#8FA3AC"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="default"
        accessibilityLabel="Koordinatat e pronës"
      />
      {lexuar ? (
        <View style={styles.rresht}>
          <UrezaIcon name="check" size={18} color={colors.ok} strokeWidth={2.6} />
          <Text style={styles.ok}>
            {koordinataNeTekst(lexuar)}
            {saktesia !== null ? ` · ±${Math.round(saktesia)} m` : ""}
          </Text>
        </View>
      ) : null}
      {gabim ? <Text style={styles.gabim}>{gabim}</Text> : null}

      <Pressable
        style={[styles.telefoni, duke && styles.disabled]}
        onPress={perdorTelefonin}
        disabled={duke}
        accessibilityRole="button"
        accessibilityLabel="Përdor vendndodhjen time"
      >
        {duke ? (
          <ActivityIndicator color={colors.petrol} />
        ) : (
          <>
            <UrezaIcon name="pin" size={20} color={colors.petrol} strokeWidth={2.2} />
            <Text style={styles.telefoniText}>Përdor vendndodhjen time</Text>
          </>
        )}
      </Pressable>
      <Text style={styles.ndihme}>Përdore vetëm kur je te prona.</Text>
      {gabimiIPhone ? <Text style={styles.gabim}>{gabimiIPhone}</Text> : null}
      {harta ? (
        <ZgjidhNeHarte fillimi={lexuar} afer={afer} onZgjidh={zgjedhurNeHarte} mbyll={() => setHarta(false)} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fusha: { gap: 6 },
  label: { color: colors.ink, fontSize: 15, lineHeight: 20, fontWeight: "700" },
  ndihme: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, fontWeight: "500" },
  input: {
    height: 56,
    paddingHorizontal: 16,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.inputBorder,
    borderRadius: 14,
    fontSize: 16,
    fontWeight: "500",
    color: colors.ink,
  },
  inputFokus: { borderColor: colors.petrol },
  inputGabim: { borderColor: colors.error },
  rresht: { flexDirection: "row", alignItems: "center", gap: 8 },
  ok: { color: colors.ok, fontSize: 15, lineHeight: 20, fontWeight: "700" },
  gabim: { color: colors.error, fontSize: 14, lineHeight: 20, fontWeight: "600" },
  telefoni: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.petrol,
    backgroundColor: colors.white,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  telefoniText: { color: colors.petrol, fontSize: 16, fontWeight: "700" },
  disabled: { opacity: 0.6 },
});
