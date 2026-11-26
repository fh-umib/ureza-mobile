import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { colors, font } from "@/constants/ureza";
import { useDeshmite } from "@/lib/deshmite";
import { useDhenat } from "@/lib/dhenat";
import { GJUHET, useProfili, type Gjuha } from "@/lib/profili";
import { FJALET, MUNGON_RAPORTET, shkruajRaportin, useRaporti, type Gjendja, type Perfundimi } from "@/lib/raporti";
import type { Vizita } from "@/lib/vizitat";

import { UrezaIcon } from "./UrezaIcon";

// The Miku's report in the reader's language (Shqip, Deutsch, English). A client starts in the
// language chosen on Profili ("Gjuha e raporteve"); the Miku and the admin start in Albanian.
// Everyone can switch. Every state is shown with colour + icon + word.

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

export function RaportiNeGjuhen({ vizita }: { vizita: Vizita }) {
  const { profili, cilesimet } = useProfili();
  const { pronat } = useDhenat();
  const r = useRaporti(vizita.id);
  const d = useDeshmite(vizita.id, false);
  const eKlient = (profili?.roli ?? "klient") === "klient";
  const [zgjedhur, setZgjedhur] = useState<Gjuha | null>(null);
  const gjuha: Gjuha = zgjedhur ?? (eKlient ? cilesimet.gjuha : "sq");

  if (r.burimi === "duke_ngarkuar") {
    return (
      <View style={styles.karta}>
        <ActivityIndicator color={colors.petrol} />
      </View>
    );
  }
  if (r.burimi === "mungon") {
    return (
      <View style={styles.shenim}>
        <UrezaIcon name="warning" size={20} color={colors.petrol} />
        <Text style={styles.shenimText}>{MUNGON_RAPORTET}</Text>
      </View>
    );
  }
  if (r.burimi === "pa_lidhje") {
    return (
      <View style={styles.karta}>
        <Text style={styles.tekst}>Raporti nuk u ngarkua. Kontrollo internetin dhe provo përsëri.</Text>
        <Pressable style={styles.lidhje} onPress={() => void r.rifresko()} accessibilityRole="button">
          <Text style={styles.lidhjeText}>Provo përsëri</Text>
        </Pressable>
      </View>
    );
  }

  const prona = pronat.find((p) => p.id === vizita.pronaId);
  const zgjedhesi = <ZgjedhesiIGjuhes gjuha={gjuha} onZgjidh={setZgjedhur} />;

  if (!r.raporti) {
    return (
      <View style={styles.karta}>
        {zgjedhesi}
        <Text style={styles.tekst}>{FJALET[gjuha].paRaport}</Text>
      </View>
    );
  }

  const shkruar = shkruajRaportin(
    r.raporti,
    {
      lloji: vizita.lloji,
      pronaEmri: prona?.emri ?? "Prona",
      mikuEmri: vizita.mikuEmri ?? "Miku",
      koha: vizita.derguarAt ?? r.shkruarAt ?? vizita.data,
      fotot: d.fotot.length,
      zeriSekonda: d.zeri?.kohezgjatja ?? null,
      kaGps: d.gps !== null,
    },
    gjuha,
  );
  const ngjyra = NGJYRAT_E_PERFUNDIMIT[shkruar.perfundimi.vlera];

  return (
    <View style={styles.karta} accessibilityLanguage={gjuha}>
      <View style={styles.krye}>
        <View style={styles.kryeIkona}>
          <UrezaIcon name="doc" size={20} color={colors.petrol} strokeWidth={2.2} />
        </View>
        <View style={styles.kryeTekst}>
          <Text style={styles.titulli} accessibilityRole="header">
            {shkruar.titulli}
          </Text>
          <Text style={styles.lloji}>{shkruar.lloji}</Text>
        </View>
      </View>

      {zgjedhesi}

      <Text style={styles.hyrja}>{shkruar.hyrja}</Text>

      <View style={[styles.perfundimi, { backgroundColor: ngjyra.bg }]}>
        <UrezaIcon name={shkruar.perfundimi.ikona} size={24} color={ngjyra.fg} strokeWidth={2.4} />
        <View style={styles.kryeTekst}>
          <Text style={[styles.perfundimiEmri, { color: ngjyra.fg }]}>{shkruar.perfundimi.emri}</Text>
          <Text style={[styles.perfundimiTekst, { color: ngjyra.fg }]}>{shkruar.perfundimi.teksti}</Text>
        </View>
      </View>

      <View style={styles.pikat}>
        {shkruar.pikat.map((p, i) => {
          const ng = NGJYRAT_E_GJENDJES[p.gjendja];
          return (
            <View key={p.id} style={[styles.pika, i > 0 && styles.ndarje]}>
              <View style={styles.pikaRresht}>
                <View style={styles.pikaIkona}>
                  <UrezaIcon name={p.ikona} size={18} color={colors.petrol} strokeWidth={2.2} />
                </View>
                <Text style={styles.pikaEmri}>{p.emri}</Text>
                <View style={[styles.chip, { backgroundColor: ng.bg }]}>
                  <UrezaIcon
                    name={p.gjendja === "mire" ? "check" : p.gjendja === "problem" ? "warning" : "close"}
                    size={14}
                    color={ng.fg}
                    strokeWidth={2.6}
                  />
                  <Text style={[styles.chipText, { color: ng.fg }]}>{p.gjendjaEmri}</Text>
                </View>
              </View>
              {p.koment ? (
                <View style={styles.koment}>
                  <Text style={styles.komentEtiketa}>{shkruar.fjalet.komenti}</Text>
                  <Text style={styles.komentTekst} accessibilityLanguage="sq">
                    “{p.koment}”
                  </Text>
                </View>
              ) : null}
            </View>
          );
        })}
      </View>

      {shkruar.shenimi ? (
        <View style={styles.koment}>
          <Text style={styles.komentEtiketa}>{shkruar.fjalet.shenimi}</Text>
          <Text style={styles.komentTekst} accessibilityLanguage="sq">
            “{shkruar.shenimi}”
          </Text>
        </View>
      ) : null}

      {shkruar.deshmite ? (
        <View style={styles.deshmite}>
          <UrezaIcon name="camera" size={18} color={colors.textSecondary} strokeWidth={2.2} />
          <Text style={styles.deshmiteTekst}>
            <Text style={styles.deshmiteEtiketa}>{shkruar.fjalet.deshmite}: </Text>
            {shkruar.deshmite}
          </Text>
        </View>
      ) : null}

      {vizita.lloji === "kujdes" ? <Text style={styles.fundi}>{shkruar.fjalet.jo_mjekesore}</Text> : null}
      <Text style={styles.fundi}>{shkruar.fjalet.fundi}</Text>
    </View>
  );
}

function ZgjedhesiIGjuhes({ gjuha, onZgjidh }: { gjuha: Gjuha; onZgjidh: (g: Gjuha) => void }) {
  return (
    <View style={styles.gjuhet} accessibilityRole="radiogroup" accessibilityLabel="Gjuha e raportit">
      <UrezaIcon name="globe" size={18} color={colors.textSecondary} strokeWidth={2.2} />
      {GJUHET.map((g) => {
        const aktive = g.kodi === gjuha;
        return (
          <Pressable
            key={g.kodi}
            style={[styles.gjuha, aktive && styles.gjuhaAktive]}
            onPress={() => onZgjidh(g.kodi)}
            accessibilityRole="radio"
            accessibilityState={{ checked: aktive }}
            aria-checked={aktive}
            accessibilityLabel={g.emri}
          >
            <Text style={[styles.gjuhaText, aktive && styles.gjuhaTextAktive]}>{g.emri}</Text>
          </Pressable>
        );
      })}
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
  titulli: { color: colors.ink, fontSize: 20, lineHeight: 26, fontFamily: font.w800 },
  lloji: { color: colors.textSecondary, fontSize: 14, fontFamily: font.w600 },
  tekst: { color: colors.textSecondary, fontSize: 15, lineHeight: 22, fontFamily: font.w500 },
  hyrja: { color: colors.ink, fontSize: 16, lineHeight: 24, fontFamily: font.w500 },
  gjuhet: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    padding: 4,
    paddingLeft: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.line,
  },
  gjuha: { flex: 1, minHeight: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  gjuhaAktive: { backgroundColor: colors.ikonaBg },
  gjuhaText: { color: colors.textSecondary, fontSize: 14, fontFamily: font.w700 },
  gjuhaTextAktive: { color: colors.petrol, fontFamily: font.w800 },
  perfundimi: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 16 },
  perfundimiEmri: { fontSize: 17, lineHeight: 23, fontFamily: font.w800 },
  perfundimiTekst: { fontSize: 14, lineHeight: 20, fontFamily: font.w600 },
  pikat: { borderRadius: 16, borderWidth: 1, borderColor: "#EDF1F4", paddingHorizontal: 12 },
  pika: { paddingVertical: 10, gap: 6 },
  ndarje: { borderTopWidth: 1, borderTopColor: "#EDF1F4" },
  pikaRresht: { flexDirection: "row", alignItems: "center", gap: 10 },
  pikaIkona: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.ikonaBg,
    alignItems: "center",
    justifyContent: "center",
  },
  pikaEmri: { flex: 1, color: colors.ink, fontSize: 15, lineHeight: 21, fontFamily: font.w700 },
  chip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, height: 28, borderRadius: 14 },
  chipText: { fontSize: 13, fontFamily: font.w800 },
  koment: { backgroundColor: "#F4F7F9", borderRadius: 12, padding: 10, gap: 2 },
  komentEtiketa: { color: colors.textSecondary, fontSize: 12, fontFamily: font.w800, letterSpacing: 0.3 },
  komentTekst: { color: colors.ink, fontSize: 15, lineHeight: 21, fontFamily: font.w500i },
  deshmite: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  deshmiteTekst: { flex: 1, color: colors.textSecondary, fontSize: 14, lineHeight: 20, fontFamily: font.w500 },
  deshmiteEtiketa: { fontFamily: font.w800 },
  fundi: { color: colors.textSecondary, fontSize: 13, lineHeight: 18, fontFamily: font.w500 },
  lidhje: { minHeight: 44, justifyContent: "center" },
  lidhjeText: { color: colors.petrol, fontSize: 16, fontFamily: font.w800 },
  shenim: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    backgroundColor: colors.ikonaBg,
  },
  shenimText: { flex: 1, color: colors.petrol, fontSize: 15, lineHeight: 22, fontFamily: font.w600 },
});
