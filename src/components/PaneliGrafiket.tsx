import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, font } from "@/constants/ureza";
import { dataShkurt } from "@/lib/vizitat";

import { UrezaIcon, type IconName } from "./UrezaIcon";

// The pieces of the Admin dashboard (Paneli): a stat tile, a column chart of the requests per
// day, and a list of bars (one per status or kind). One hue (the petrol of the design system)
// for every mark: the data is one series, so colour carries no identity; names and figures do.

const SHENJA = colors.petrol; // the marks
const SHENJA_E_ZBEHUR = "#A9C3CB"; // the other columns while one is selected
const GJURMA = "#E3EDF0"; // the empty track of a bar, a lighter step of the same hue

// ---------------------------------------------------------------------------------------------
// Stat tile: a label, a value and one line of context; `matesi` adds a thin bar (e.g. 2 of 3).

export function PllakaETreguesit({
  ikona,
  etiketa,
  vlera,
  konteksti,
  matesi,
}: {
  ikona: IconName;
  etiketa: string;
  vlera: string;
  konteksti?: string;
  matesi?: { vlera: number; gjithsej: number };
}) {
  const pjesa = matesi && matesi.gjithsej > 0 ? Math.min(1, matesi.vlera / matesi.gjithsej) : 0;
  return (
    <View style={styles.pllaka} accessible accessibilityLabel={`${etiketa}: ${vlera}${konteksti ? `. ${konteksti}` : ""}`}>
      <View style={styles.pllakaKrye}>
        <UrezaIcon name={ikona} size={18} color={colors.petrol} />
        <Text style={styles.pllakaEtiketa} numberOfLines={2}>
          {etiketa}
        </Text>
      </View>
      <Text style={styles.pllakaVlera}>{vlera}</Text>
      {matesi ? (
        <View style={styles.matesGjurma}>
          {pjesa > 0 ? <View style={[styles.matesMbushja, { width: `${pjesa * 100}%` }]} /> : null}
        </View>
      ) : null}
      {konteksti ? <Text style={styles.pllakaKonteksti}>{konteksti}</Text> : null}
    </View>
  );
}

// ---------------------------------------------------------------------------------------------
// Column chart: requests per day. Tapping a column shows its day and number (the mobile
// equivalent of a hover tooltip); the busiest day carries its value on the cap.

const LARTESIA = 120;
const VENDI_PER_ETIKETEN = 20; // room above the tallest column for its value

export function GrafikuIDiteve({ ditet }: { ditet: { dita: string; numri: number }[] }) {
  const [zgjedhur, setZgjedhur] = useState<number | null>(null);
  const maks = Math.max(0, ...ditet.map((d) => d.numri));
  const gjithsej = ditet.reduce((s, d) => s + d.numri, 0);
  const iMaksit = ditet.findIndex((d) => d.numri === maks);

  if (ditet.length === 0 || gjithsej === 0) {
    return <Text style={styles.bosh}>Asnjë kërkesë në 14 ditët e fundit.</Text>;
  }

  const zgjedhja = zgjedhur !== null ? ditet[zgjedhur] : null;
  const fjala = (n: number) => (n === 1 ? "kërkesë" : "kërkesa");

  return (
    <View style={styles.grafiku}>
      <Text style={styles.grafikuInfo} accessibilityLiveRegion="polite">
        {zgjedhja
          ? `${zgjedhur === ditet.length - 1 ? "Sot" : dataShkurt(zgjedhja.dita)}: ${zgjedhja.numri} ${fjala(zgjedhja.numri)}`
          : `Më së shumti ${maks} në ditë. Prek një shtyllë për ditën.`}
      </Text>

      <View style={styles.fusha}>
        {ditet.map((d, i) => {
          const aktive = zgjedhur === i;
          const lartesia = maks > 0 ? (d.numri / maks) * (LARTESIA - VENDI_PER_ETIKETEN) : 0;
          const meEtikete = aktive || (zgjedhur === null && i === iMaksit);
          const dita = i === ditet.length - 1 ? "sot" : dataShkurt(d.dita);
          return (
            <Pressable
              key={d.dita}
              style={styles.kolona}
              onPress={() => setZgjedhur(aktive ? null : i)}
              accessibilityRole="button"
              accessibilityState={{ selected: aktive }}
              accessibilityLabel={`${dita}: ${d.numri} ${fjala(d.numri)}`}
            >
              {meEtikete && d.numri > 0 ? <Text style={styles.vleraNeKoke}>{d.numri}</Text> : null}
              {d.numri > 0 ? (
                <View
                  style={[
                    styles.shtylla,
                    { height: Math.max(4, lartesia), backgroundColor: zgjedhur === null || aktive ? SHENJA : SHENJA_E_ZBEHUR },
                  ]}
                />
              ) : null}
            </Pressable>
          );
        })}
      </View>
      <View style={styles.vijaBaze} />

      <View style={styles.etiketat}>
        <Text style={styles.etiketa}>{dataShkurt(ditet[0].dita)}</Text>
        <Text style={styles.etiketa}>{dataShkurt(ditet[Math.floor(ditet.length / 2)].dita)}</Text>
        <Text style={styles.etiketa}>Sot</Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------------------------
// A list of bars: a name, a bar and a figure per row (e.g. the visits in each status). The bar
// is the row's share of the whole; rows keep the order they are given (the steps of a visit).

export function ListaEShiritave({ rreshtat }: { rreshtat: { emri: string; ikona: IconName; numri: number }[] }) {
  const gjithsej = rreshtat.reduce((s, r) => s + r.numri, 0);
  return (
    <View style={styles.lista}>
      {rreshtat.map((r) => {
        const pjesa = gjithsej > 0 ? r.numri / gjithsej : 0;
        return (
          <View
            key={r.emri}
            style={styles.rreshti}
            accessible
            accessibilityLabel={`${r.emri}: ${r.numri}${gjithsej > 0 ? `, ${Math.round(pjesa * 100)} për qind` : ""}`}
          >
            <View style={styles.rreshtiKrye}>
              <UrezaIcon name={r.ikona} size={16} color={colors.textSecondary} strokeWidth={2.2} />
              <Text style={styles.rreshtiEmri}>{r.emri}</Text>
              <Text style={styles.rreshtiNumri}>{r.numri}</Text>
            </View>
            <View style={styles.matesGjurma}>
              {pjesa > 0 ? <View style={[styles.matesMbushja, { width: `${pjesa * 100}%` }]} /> : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  pllaka: {
    flexGrow: 1,
    flexBasis: "45%",
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E3EAF0",
    padding: 14,
    gap: 6,
  },
  pllakaKrye: { flexDirection: "row", alignItems: "center", gap: 6 },
  pllakaEtiketa: { flex: 1, color: colors.textSecondary, fontSize: 13, lineHeight: 17, fontFamily: font.w700 },
  pllakaVlera: { color: colors.ink, fontSize: 26, lineHeight: 32, fontFamily: font.w800 },
  pllakaKonteksti: { color: colors.textSecondary, fontSize: 13, lineHeight: 18, fontFamily: font.w500 },
  matesGjurma: { height: 8, borderRadius: 4, backgroundColor: GJURMA, overflow: "hidden" },
  matesMbushja: { height: 8, borderRadius: 4, backgroundColor: SHENJA },

  grafiku: { gap: 6 },
  grafikuInfo: { color: colors.ink, fontSize: 15, lineHeight: 21, fontFamily: font.w600, minHeight: 21 },
  fusha: { height: LARTESIA, flexDirection: "row", alignItems: "flex-end" },
  kolona: { flex: 1, height: LARTESIA, alignItems: "center", justifyContent: "flex-end" },
  shtylla: { width: "62%", maxWidth: 24, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  vleraNeKoke: { color: colors.ink, fontSize: 12, fontFamily: font.w800, marginBottom: 2 },
  vijaBaze: { height: 1, backgroundColor: colors.line },
  etiketat: { flexDirection: "row", justifyContent: "space-between" },
  etiketa: { color: colors.textSecondary, fontSize: 12, fontFamily: font.w600 },
  bosh: { color: colors.textSecondary, fontSize: 15, lineHeight: 22, fontFamily: font.w500 },

  lista: { gap: 12 },
  rreshti: { gap: 6 },
  rreshtiKrye: { flexDirection: "row", alignItems: "center", gap: 8 },
  rreshtiEmri: { flex: 1, color: colors.ink, fontSize: 15, fontFamily: font.w600 },
  rreshtiNumri: { color: colors.ink, fontSize: 15, fontFamily: font.w800 },
});
