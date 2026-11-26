import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { colors } from "@/constants/ureza";
import {
  GJENDJET,
  KOMENTI_MAX,
  PERFUNDIMET,
  PIKAT,
  SHENIMI_MAX,
  saPikaGati,
  type DraftIRaportit,
  type Gjendja,
  type Perfundimi,
} from "@/lib/raporti";
import type { LlojiVizites } from "@/lib/vizitat";

import { useRevealOnFocus } from "./EkraniMeHero";
import { UrezaIcon } from "./UrezaIcon";

// The Miku's checklist on the evidence screen: every point is fine, has a problem or was not
// checked, then the overall conclusion and an optional note. The client reads it in their own
// language (src/lib/raporti.ts writes it); only the comments stay as the Miku wrote them.

const NGJYRAT_E_GJENDJES: Record<Gjendja, { bg: string; fg: string }> = {
  mire: { bg: colors.okBg, fg: colors.ok },
  problem: { bg: colors.kujdesBg, fg: colors.kujdes },
  pa_kontrolluar: { bg: colors.neutralBg, fg: colors.neutral },
};

const NGJYRAT_E_PERFUNDIMIT: Record<Perfundimi, { bg: string; fg: string }> = {
  mire: { bg: colors.okBg, fg: colors.ok },
  vemendje: { bg: colors.kujdesBg, fg: colors.kujdes },
  urgjent: { bg: colors.errorBg, fg: colors.error },
};

export function ListaEKontrollit({
  lloji,
  draft,
  onNdrysho,
}: {
  lloji: LlojiVizites;
  draft: DraftIRaportit;
  onNdrysho: (d: DraftIRaportit) => void;
}) {
  const revealSoon = useRevealOnFocus();
  const [fokus, setFokus] = useState<string | null>(null);
  const { gati, gjithsej } = saPikaGati(draft, lloji);

  function ndryshoPiken(id: string, ndryshim: Partial<{ gjendja: Gjendja; koment: string }>) {
    onNdrysho({ ...draft, pikat: { ...draft.pikat, [id]: { ...draft.pikat[id], ...ndryshim } } });
  }

  return (
    <View style={styles.karta}>
      <View style={styles.krye}>
        <View style={styles.kryeIkona}>
          <UrezaIcon name="doc" size={20} color={colors.petrol} strokeWidth={2.2} />
        </View>
        <View style={styles.kryeTekst}>
          <Text style={styles.titulli} accessibilityRole="header">
            Raporti për klientin
          </Text>
          <Text style={styles.progresi}>
            {gati} nga {gjithsej} pika
          </Text>
        </View>
      </View>
      <Text style={styles.tekst}>
        Klienti e lexon raportin në gjuhën e vet (shqip, gjermanisht ose anglisht). Komentet shkruaji shkurt dhe qartë.
      </Text>

      {PIKAT[lloji].map((p) => {
        const v = draft.pikat[p.id] ?? { gjendja: null, koment: "" };
        return (
          <View key={p.id} style={styles.pika}>
            <View style={styles.pikaKrye}>
              <View style={styles.pikaIkona}>
                <UrezaIcon name={p.ikona} size={18} color={colors.petrol} strokeWidth={2.2} />
              </View>
              <View style={styles.kryeTekst}>
                <Text style={styles.pikaEmri}>{p.emri.sq}</Text>
                <Text style={styles.ndihme}>{p.ndihme}</Text>
              </View>
            </View>
            <View style={styles.opsionet} accessibilityRole="radiogroup" accessibilityLabel={p.emri.sq}>
              {GJENDJET.map((g) => {
                const zgjedhur = v.gjendja === g.vlera;
                const ngjyra = NGJYRAT_E_GJENDJES[g.vlera];
                return (
                  <Pressable
                    key={g.vlera}
                    style={[
                      styles.opsion,
                      zgjedhur && { backgroundColor: ngjyra.bg, borderColor: ngjyra.fg },
                    ]}
                    onPress={() => ndryshoPiken(p.id, { gjendja: g.vlera })}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: zgjedhur }}
                    aria-checked={zgjedhur}
                    accessibilityLabel={`${p.emri.sq}: ${g.emri.sq}`}
                  >
                    <UrezaIcon name={g.ikona} size={15} color={zgjedhur ? ngjyra.fg : colors.textSecondary} strokeWidth={2.4} />
                    <Text style={[styles.opsionText, zgjedhur && { color: ngjyra.fg }]} numberOfLines={2}>
                      {g.emri.sq}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {v.gjendja === "problem" || v.koment ? (
              <TextInput
                style={[styles.input, fokus === p.id && styles.inputFokus]}
                value={v.koment}
                onChangeText={(t) => ndryshoPiken(p.id, { koment: t })}
                onFocus={() => {
                  setFokus(p.id);
                  revealSoon();
                }}
                onBlur={() => setFokus(null)}
                placeholder={v.gjendja === "problem" ? "Çka nuk është në rregull? (e detyrueshme)" : "Koment (jo i detyrueshëm)"}
                placeholderTextColor="#8FA3AC"
                maxLength={KOMENTI_MAX}
                multiline
                textAlignVertical="top"
                accessibilityLabel={`Komenti për ${p.emri.sq}`}
              />
            ) : null}
          </View>
        );
      })}

      <Text style={styles.seksioni} accessibilityRole="header">
        Përfundimi
      </Text>
      <View style={styles.perfundimet} accessibilityRole="radiogroup" accessibilityLabel="Përfundimi">
        {PERFUNDIMET.map((p) => {
          const zgjedhur = draft.perfundimi === p.vlera;
          const ngjyra = NGJYRAT_E_PERFUNDIMIT[p.vlera];
          return (
            <Pressable
              key={p.vlera}
              style={[styles.perfundim, zgjedhur && { backgroundColor: ngjyra.bg, borderColor: ngjyra.fg }]}
              onPress={() => onNdrysho({ ...draft, perfundimi: p.vlera })}
              accessibilityRole="radio"
              accessibilityState={{ checked: zgjedhur }}
              aria-checked={zgjedhur}
            >
              <UrezaIcon name={p.ikona} size={20} color={zgjedhur ? ngjyra.fg : colors.textSecondary} strokeWidth={2.4} />
              <Text style={[styles.perfundimText, zgjedhur && { color: ngjyra.fg }]}>{p.emri.sq}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.seksioni}>Shënim për klientin (jo i detyrueshëm)</Text>
      <TextInput
        style={[styles.input, styles.inputMadh, fokus === "shenimi" && styles.inputFokus]}
        value={draft.shenimi}
        onChangeText={(t) => onNdrysho({ ...draft, shenimi: t })}
        onFocus={() => {
          setFokus("shenimi");
          revealSoon();
        }}
        onBlur={() => setFokus(null)}
        placeholder="p.sh. Çelësi u kthye në kutinë me kod."
        placeholderTextColor="#8FA3AC"
        maxLength={SHENIMI_MAX}
        multiline
        textAlignVertical="top"
        accessibilityLabel="Shënim për klientin"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  karta: { backgroundColor: colors.white, borderRadius: 20, padding: 20, gap: 12 },
  krye: { flexDirection: "row", alignItems: "center", gap: 10 },
  kryeIkona: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.ikonaBg,
    alignItems: "center",
    justifyContent: "center",
  },
  kryeTekst: { flex: 1, minWidth: 0 },
  titulli: { color: colors.ink, fontSize: 20, lineHeight: 26, fontWeight: "800" },
  progresi: { color: colors.textSecondary, fontSize: 14, fontWeight: "600" },
  tekst: { color: colors.textSecondary, fontSize: 15, lineHeight: 22, fontWeight: "500" },
  pika: { gap: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#EDF1F4" },
  pikaKrye: { flexDirection: "row", alignItems: "center", gap: 10 },
  pikaIkona: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.ikonaBg,
    alignItems: "center",
    justifyContent: "center",
  },
  pikaEmri: { color: colors.ink, fontSize: 16, lineHeight: 22, fontWeight: "800" },
  ndihme: { color: colors.textSecondary, fontSize: 13, lineHeight: 18, fontWeight: "500" },
  opsionet: { flexDirection: "row", gap: 6 },
  // icon above the word, so "Nuk u kontrollua" fits on a narrow phone
  opsion: {
    flex: 1,
    minHeight: 56,
    paddingHorizontal: 4,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  opsionText: { color: colors.textSecondary, fontSize: 13, lineHeight: 16, fontWeight: "700", textAlign: "center" },
  input: {
    minHeight: 64,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.inputBorder,
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.ink,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "500",
  },
  inputMadh: { minHeight: 88 },
  inputFokus: { borderColor: colors.petrol, borderWidth: 2 },
  seksioni: { color: colors.ink, fontSize: 16, fontWeight: "800", marginTop: 6 },
  perfundimet: { gap: 8 },
  perfundim: {
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.line,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  perfundimText: { color: colors.ink, fontSize: 15, fontWeight: "700" },
});
