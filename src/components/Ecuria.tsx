import { StyleSheet, Text, View } from "react-native";

import { colors, font } from "@/constants/ureza";
import { VENDIMET_E_ADMINIT, dataMeOre, hapiIVizites, type Vizita } from "@/lib/vizitat";

import { UrezaIcon } from "./UrezaIcon";

// "Ti e miratove raportin · 13 nëntor, 22:30" (for the Miku: "Klienti e miratoi ...")
function tekstiIVendimit(vizita: Vizita, miku: boolean): string {
  const miratuar = vizita.statusi === "miratuar";
  const folja = miku ? (miratuar ? "miratoi" : "kundërshtoi") : miratuar ? "miratove" : "kundërshtove";
  const koha = vizita.vendosurAt ? ` · ${dataMeOre(vizita.vendosurAt)}` : "";
  return `${miku ? "Klienti" : "Ti"} e ${folja} raportin${koha}`;
}

// "Ecuria e vizitës" (design: Historiku): the steps of a visit; the reached ones are
// filled. `miku` words the last step for the Miku instead of the client.
export function Ecuria({ vizita, miku = false }: { vizita: Vizita; miku?: boolean }) {
  const hapi = hapiIVizites(vizita.statusi);
  const vendim = vizita.statusi === "miratuar" || vizita.statusi === "kundershtuar";

  const hapat: { titulli: string; nen: string; arritur: boolean }[] = [
    { titulli: "Kërkesa u dërgua", nen: dataMeOre(vizita.krijuar), arritur: true },
    {
      titulli: "Miku e pranoi",
      nen:
        hapi >= 1
          ? vizita.mikuEmri
            ? `${vizita.mikuEmri}${vizita.pranuarAt ? ` · ${dataMeOre(vizita.pranuarAt)}` : ""}`
            : "Pranuar"
          : "Në pritje",
      arritur: hapi >= 1,
    },
    {
      titulli: "Miku filloi vizitën",
      nen: hapi >= 2 ? (vizita.filluarAt ? `Në terren · ${dataMeOre(vizita.filluarAt)}` : "Në terren") : "Në pritje",
      arritur: hapi >= 2,
    },
    {
      titulli: "Dëshmitë u dërguan: GPS, foto dhe zë",
      nen: hapi >= 3 ? (vizita.derguarAt ? `Raporti është gati · ${dataMeOre(vizita.derguarAt)}` : "Raporti është gati") : "Në pritje",
      arritur: hapi >= 3,
    },
    {
      titulli:
        vizita.statusi === "miratuar"
          ? "Raporti u miratua"
          : vizita.statusi === "kundershtuar"
            ? "Raporti u kundërshtua"
            : "Miratimi",
      nen: vendim ? tekstiIVendimit(vizita, miku) : hapi >= 3 ? (miku ? "Pret vendimin e klientit" : "Pret vendimin tënd") : "Në pritje",
      arritur: vendim,
    },
  ];

  // a disputed report gets one more step: the admin's review (supabase/admini.sql)
  if (vizita.statusi === "kundershtuar") {
    hapat.push({
      titulli: vizita.shqyrtuarAt ? "Admini e shqyrtoi rastin" : "Shqyrtimi i adminit",
      nen:
        vizita.shqyrtuarAt && vizita.vendimiAdminit
          ? `${VENDIMET_E_ADMINIT[vizita.vendimiAdminit].titulli} · ${dataMeOre(vizita.shqyrtuarAt)}`
          : "Në pritje",
      arritur: vizita.shqyrtuarAt !== null,
    });
  }

  return (
    <View style={styles.karta}>
      <Text style={styles.titulli}>Ecuria e vizitës</Text>
      <View style={styles.lista}>
        {hapat.map((h, i) => (
          <View key={h.titulli} style={styles.rreshti}>
            <View style={styles.shtylla}>
              <View style={[styles.rrethi, h.arritur && styles.rrethiArritur]}>
                {h.arritur ? <UrezaIcon name="check" size={14} color={colors.white} strokeWidth={3} /> : null}
              </View>
              {i < hapat.length - 1 ? <View style={[styles.vija, h.arritur && styles.vijaArritur]} /> : null}
            </View>
            <View style={styles.tekst}>
              <Text style={[styles.hapiTitulli, !h.arritur && styles.pritje]}>{h.titulli}</Text>
              <Text style={styles.hapiNen}>{h.nen}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  karta: { backgroundColor: colors.white, borderRadius: 20, padding: 20 },
  titulli: { color: colors.ink, fontSize: 20, lineHeight: 26, fontFamily: font.w800 },
  lista: { marginTop: 14 },
  rreshti: { flexDirection: "row", gap: 14 },
  shtylla: { alignItems: "center", width: 26 },
  rrethi: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: colors.inputBorder,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  rrethiArritur: { backgroundColor: colors.petrol, borderColor: colors.petrol },
  vija: { flex: 1, width: 2, minHeight: 22, backgroundColor: colors.line },
  vijaArritur: { backgroundColor: colors.petrol },
  tekst: { flex: 1, paddingBottom: 18, gap: 2 },
  hapiTitulli: { color: colors.ink, fontSize: 16, lineHeight: 22, fontFamily: font.w800 },
  pritje: { color: colors.textSecondary, fontFamily: font.w700 },
  hapiNen: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, fontFamily: font.w500 },
});
