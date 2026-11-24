import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "@/constants/ureza";

import { UrezaIcon, type IconName } from "./UrezaIcon";

// The charts of Oda (the client's history): a status bar, visits per month by kind, and how
// recently each property was visited. Colours: the two kinds of visit are a validated pair
// (blue and ochre, colour-blind safe); states use the status colours, always with an icon and a word.

export const NGJYRA_INSPEKTIM = "#0A7FA0";
export const NGJYRA_KUJDES = "#B87B14";
const GJURMA = "#E3EDF0"; // empty track
const BOSHLLEKU = 2; // white gap between touching marks

// ---------------------------------------------------------------------------------------------
// Status bar: one bar split by state (approved, in progress, disputed), with a legend below.

export type PjesaEStatusit = { emri: string; numri: number; ngjyra: string; ikona: IconName };

export function ShiritiIStatuseve({ pjeset }: { pjeset: PjesaEStatusit[] }) {
  const gjithsej = pjeset.reduce((s, p) => s + p.numri, 0);
  const teDukshme = pjeset.filter((p) => p.numri > 0);
  return (
    <View
      style={styles.statusi}
      accessible
      accessibilityLabel={pjeset.map((p) => `${p.emri}: ${p.numri}`).join(", ")}
    >
      <View style={styles.shiriti}>
        {gjithsej === 0 ? (
          <View style={[styles.segmenti, { flex: 1, backgroundColor: GJURMA }]} />
        ) : (
          teDukshme.map((p, i) => (
            <View
              key={p.emri}
              style={[
                styles.segmenti,
                { flex: p.numri, backgroundColor: p.ngjyra },
                i > 0 && { marginLeft: BOSHLLEKU },
              ]}
            />
          ))
        )}
      </View>
      <View style={styles.legjenda}>
        {pjeset.map((p) => (
          <View key={p.emri} style={styles.legjendaRreshti}>
            <View style={[styles.legjendaIkona, { backgroundColor: p.ngjyra }]}>
              <UrezaIcon name={p.ikona} size={13} color={colors.white} strokeWidth={2.8} />
            </View>
            <Text style={styles.legjendaEmri}>{p.emri}</Text>
            <Text style={styles.legjendaVlera}>
              {p.numri}
              {gjithsej > 0 ? <Text style={styles.legjendaPerqind}>  {Math.round((p.numri / gjithsej) * 100)}%</Text> : null}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------------------------
// Visits per month, stacked by kind. Tapping a column shows its month and figures (the phone's
// version of a hover tooltip); the busiest month carries its total on the cap.

export type MuajiIGrafikut = { emri: string; emriIPlote: string; inspektim: number; kujdes: number };

const LARTESIA = 130;
const VENDI_SIPER = 20;

export function GrafikuIMuajve({ muajt }: { muajt: MuajiIGrafikut[] }) {
  const [zgjedhur, setZgjedhur] = useState<number | null>(null);
  const max = Math.max(1, ...muajt.map((m) => m.inspektim + m.kujdes));
  const iMadhi = muajt.findIndex((m) => m.inspektim + m.kujdes === max);
  const z = zgjedhur !== null ? muajt[zgjedhur] : null;

  return (
    <View style={styles.muajt}>
      <View style={styles.legjendaRresht}>
        <Seria ngjyra={NGJYRA_INSPEKTIM} emri="Inspektim prone" />
        <Seria ngjyra={NGJYRA_KUJDES} emri="Te prindërit" />
      </View>

      <View style={styles.tooltip} accessibilityLiveRegion="polite">
        {z ? (
          <Text style={styles.tooltipTeksti}>
            <Text style={styles.tooltipMuaji}>{z.emriIPlote}: </Text>
            {z.inspektim} inspektim · {z.kujdes} te prindërit
          </Text>
        ) : (
          <Text style={styles.tooltipNdihme}>Prek një kolonë për shifrat e muajit.</Text>
        )}
      </View>

      <View style={[styles.kolonat, { height: LARTESIA + VENDI_SIPER }]}>
        {muajt.map((m, i) => {
          const gjithsej = m.inspektim + m.kujdes;
          const hI = (m.inspektim / max) * LARTESIA;
          const hK = (m.kujdes / max) * LARTESIA;
          const zbehur = zgjedhur !== null && zgjedhur !== i;
          return (
            <Pressable
              key={m.emriIPlote}
              style={styles.kolona}
              onPress={() => setZgjedhur(zgjedhur === i ? null : i)}
              accessibilityRole="button"
              accessibilityLabel={`${m.emriIPlote}: ${m.inspektim} inspektim, ${m.kujdes} te prindërit`}
            >
              {i === iMadhi && gjithsej > 0 && zgjedhur === null ? <Text style={styles.kapaku}>{gjithsej}</Text> : null}
              <View style={[styles.stiva, zbehur && styles.zbehur]}>
                {m.kujdes > 0 ? (
                  <View
                    style={[
                      styles.pjesa,
                      { height: hK, backgroundColor: NGJYRA_KUJDES },
                      styles.majaRrumbullak,
                      m.inspektim > 0 && { marginBottom: BOSHLLEKU },
                    ]}
                  />
                ) : null}
                {m.inspektim > 0 ? (
                  <View
                    style={[
                      styles.pjesa,
                      { height: hI, backgroundColor: NGJYRA_INSPEKTIM },
                      m.kujdes === 0 && styles.majaRrumbullak,
                    ]}
                  />
                ) : null}
                {gjithsej === 0 ? <View style={styles.zero} /> : null}
              </View>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.baza} />
      <View style={styles.etiketat}>
        {muajt.map((m, i) => (
          <Text key={m.emriIPlote} style={[styles.etiketa, zgjedhur === i && styles.etiketaAktive]}>
            {m.emri}
          </Text>
        ))}
      </View>
    </View>
  );
}

function Seria({ ngjyra, emri }: { ngjyra: string; emri: string }) {
  return (
    <View style={styles.seria}>
      <View style={[styles.seriaPika, { backgroundColor: ngjyra }]} />
      <Text style={styles.seriaEmri}>{emri}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------------------------
// Coverage: one row per property with its number of visits (one hue) and how long ago the last
// one was. A property left too long gets a warning (icon + words) and a shortcut to a new request.

export type MbulimiIPrones = {
  id: string;
  emri: string;
  vizita: number;
  ditePara: number | null; // days since the last visit; null when never visited
};

export const DITE_PA_VIZITE = 45;

export function MbulimiIPronave({ pronat, onKerko }: { pronat: MbulimiIPrones[]; onKerko: (id: string) => void }) {
  const max = Math.max(1, ...pronat.map((p) => p.vizita));
  return (
    <View style={styles.mbulimi}>
      {pronat.map((p) => {
        const harruar = p.ditePara === null || p.ditePara > DITE_PA_VIZITE;
        return (
          <View key={p.id} style={styles.pronaRresht}>
            <View style={styles.pronaKrye}>
              <Text style={styles.pronaEmri} numberOfLines={1}>
                {p.emri}
              </Text>
              <Text style={styles.pronaNumri}>
                {p.vizita} {p.vizita === 1 ? "vizitë" : "vizita"}
              </Text>
            </View>
            <View style={styles.pronaGjurma}>
              {p.vizita > 0 ? <View style={[styles.pronaMbushja, { width: `${(p.vizita / max) * 100}%` }]} /> : null}
            </View>
            <View style={styles.pronaFund}>
              <View style={styles.pronaKur}>
                <UrezaIcon
                  name={harruar ? "warning" : "check"}
                  size={15}
                  color={harruar ? "#8A5210" : "#1E6B3E"}
                  strokeWidth={2.4}
                />
                <Text style={[styles.pronaKurTeksti, harruar && styles.pronaKurHarruar]}>{kurTeksti(p.ditePara)}</Text>
              </View>
              {harruar ? (
                <Pressable
                  onPress={() => onKerko(p.id)}
                  style={styles.pronaKerko}
                  accessibilityRole="button"
                  accessibilityLabel={`Kërko vizitë për ${p.emri}`}
                >
                  <Text style={styles.pronaKerkoTeksti}>Kërko vizitë</Text>
                  <UrezaIcon name="arrow" size={15} color={colors.petrol} strokeWidth={2.6} />
                </Pressable>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

function kurTeksti(dite: number | null): string {
  if (dite === null) return "Asnjë vizitë ende";
  if (dite === 0) return "Vizituar sot";
  if (dite === 1) return "Vizituar dje";
  if (dite < 0) return `Vizita pas ${-dite} ${-dite === 1 ? "dite" : "ditësh"}`;
  return `Vizituar para ${dite} ditësh`;
}

const styles = StyleSheet.create({
  statusi: { gap: 14 },
  shiriti: { flexDirection: "row", height: 14 },
  segmenti: { height: 14, borderRadius: 4 },
  legjenda: { gap: 8 },
  legjendaRreshti: { flexDirection: "row", alignItems: "center", gap: 10 },
  legjendaIkona: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  legjendaEmri: { flex: 1, color: colors.ink, fontSize: 15, fontWeight: "600" },
  legjendaVlera: { color: colors.ink, fontSize: 15, fontWeight: "800" },
  legjendaPerqind: { color: colors.textSecondary, fontSize: 13, fontWeight: "600" },

  muajt: { gap: 6 },
  legjendaRresht: { flexDirection: "row", gap: 16, flexWrap: "wrap" },
  seria: { flexDirection: "row", alignItems: "center", gap: 6 },
  seriaPika: { width: 10, height: 10, borderRadius: 3 },
  seriaEmri: { color: colors.textSecondary, fontSize: 13, fontWeight: "600" },
  tooltip: { minHeight: 22, justifyContent: "center" },
  tooltipTeksti: { color: colors.ink, fontSize: 14, fontWeight: "500" },
  tooltipMuaji: { fontWeight: "800" },
  tooltipNdihme: { color: colors.textSecondary, fontSize: 13 },
  kolonat: { flexDirection: "row", alignItems: "flex-end", gap: 10 },
  kolona: { flex: 1, height: "100%", alignItems: "center", justifyContent: "flex-end" },
  kapaku: { color: colors.ink, fontSize: 13, fontWeight: "800", marginBottom: 4 },
  stiva: { width: "70%", maxWidth: 30 },
  zbehur: { opacity: 0.35 },
  pjesa: { width: "100%" },
  majaRrumbullak: { borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  zero: { height: 2, backgroundColor: GJURMA, borderRadius: 1 },
  baza: { height: 1, backgroundColor: colors.line },
  etiketat: { flexDirection: "row", gap: 10 },
  etiketa: { flex: 1, textAlign: "center", color: colors.textSecondary, fontSize: 12, fontWeight: "600" },
  etiketaAktive: { color: colors.ink, fontWeight: "800" },

  mbulimi: { gap: 16 },
  pronaRresht: { gap: 6 },
  pronaKrye: { flexDirection: "row", alignItems: "baseline", gap: 8 },
  pronaEmri: { flex: 1, color: colors.ink, fontSize: 15, fontWeight: "800" },
  pronaNumri: { color: colors.textSecondary, fontSize: 13, fontWeight: "700" },
  pronaGjurma: { height: 10, borderRadius: 5, backgroundColor: GJURMA, overflow: "hidden" },
  pronaMbushja: { height: 10, borderRadius: 5, backgroundColor: colors.petrol },
  pronaFund: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 28 },
  pronaKur: { flexDirection: "row", alignItems: "center", gap: 6, flexShrink: 1 },
  pronaKurTeksti: { color: colors.textSecondary, fontSize: 13, fontWeight: "600" },
  pronaKurHarruar: { color: "#8A5210" },
  pronaKerko: { flexDirection: "row", alignItems: "center", gap: 4, minHeight: 36, paddingLeft: 8 },
  pronaKerkoTeksti: { color: colors.petrol, fontSize: 14, fontWeight: "800" },
});
