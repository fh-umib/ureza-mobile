import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { EkraniMeHero } from "@/components/EkraniMeHero";
import { UrezaIcon } from "@/components/UrezaIcon";
import { colors } from "@/constants/ureza";
import {
  KONTRATA_VERSIONI,
  nenetEKontrates,
  paleMiku,
  useKontrata,
  useProfiliIPunes,
  type DhenatEKontrates,
} from "@/lib/kontrata";
import { useDhenat } from "@/lib/dhenat";
import { useProfili } from "@/lib/profili";
import { dataEPlote, dataMeOre } from "@/lib/vizitat";

// The contract of one visit, the same text for the client and the Miku (src/lib/kontrata.ts).
// It comes from kontrata_e_vizites() (supabase/besimi.sql); until that file is run it is built
// from what this phone already knows about the visit.
export default function Kontrata() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const kontrata = useKontrata(id ?? null);
  const { vizitat, pronat } = useDhenat();
  const { profili } = useProfili();
  const puna = useProfiliIPunes();

  const v = vizitat.find((x) => x.id === id);
  const prona = v ? pronat.find((p) => p.id === v.pronaId) : undefined;
  const eMiku = profili?.roli === "miku";
  const ngaTelefoni: DhenatEKontrates | null = v
    ? {
        vizitaId: v.id,
        lloji: v.lloji,
        data: v.data,
        udhezime: v.udhezime,
        pronaEmri: prona?.emri ?? "Prona",
        pronaVendi: prona?.vendi ?? "",
        klientiEmri: eMiku ? null : (profili?.emri ?? null),
        pelqimiAt: null,
        mikuEmri: v.mikuEmri ?? (eMiku ? (profili?.emri ?? null) : null),
        mikuLloji: eMiku ? (puna.profili?.lloji ?? null) : null,
        mikuBiznesi: eMiku ? (puna.profili?.biznesi ?? null) : null,
        mikuNrb: eMiku ? (puna.profili?.nrb ?? null) : null,
        mikuVerifikuarAt: null,
        kontrataPranuarAt: null,
      }
    : null;
  const d = kontrata.dhenat ?? (kontrata.burimi === "mungon" ? ngaTelefoni : null);
  const mbrapa = { etiketa: "Mbrapa", onPress: () => router.back() };

  if (!d) {
    return (
      <EkraniMeHero kicker="KONTRATA" title="Kontrata" kthehu={mbrapa}>
        {kontrata.burimi === "duke_ngarkuar" ? (
          <ActivityIndicator color={colors.petrol} />
        ) : (
          <Text style={styles.teksti}>Kjo kontratë nuk u gjet, ose nuk ke qasje në të.</Text>
        )}
      </EkraniMeHero>
    );
  }

  return (
    <EkraniMeHero
      kicker={`KONTRATË · NR. ${d.vizitaId.slice(0, 8).toUpperCase()}`}
      title="Kontrata"
      subtitle="Mes klientit dhe Mikut, për këtë vizitë."
      kthehu={mbrapa}
    >
      <View style={styles.palet}>
        <Pala ikona="home" roli="KLIENTI" emri={d.klientiEmri ?? "Klienti i Urëzës"} />
        <View style={styles.lidhja}>
          <UrezaIcon name="doc" size={18} color={colors.mint} strokeWidth={2.2} />
        </View>
        <Pala ikona="shield" roli="MIKU" emri={paleMiku(d)} verifikuar={d.mikuVerifikuarAt !== null} />
      </View>

      {nenetEKontrates(d).map((n) => (
        <View key={n.titulli} style={styles.neni}>
          <Text style={styles.neniTitulli} accessibilityRole="header">
            {n.titulli}
          </Text>
          {n.pikat.map((p) => (
            <View key={p} style={styles.pika}>
              <View style={styles.pikaShenja} />
              <Text style={styles.teksti}>{p}</Text>
            </View>
          ))}
        </View>
      ))}

      <View style={styles.neni}>
        <Text style={styles.neniTitulli}>Pranimi i palëve</Text>
        <Nenshkrimi
          kush="Klienti"
          kur={d.pelqimiAt ? `Pranoi më ${dataMeOre(d.pelqimiAt)}, kur dërgoi kërkesën.` : "Pranon kur dërgon kërkesën."}
          bere={d.pelqimiAt !== null}
        />
        <Nenshkrimi
          kush="Miku"
          kur={d.kontrataPranuarAt ? `Pranoi më ${dataMeOre(d.kontrataPranuarAt)}.` : "Pret që Miku ta pranojë, para vizitës."}
          bere={d.kontrataPranuarAt !== null}
        />
      </View>

      <View style={styles.shenim}>
        <UrezaIcon name="warning" size={18} color="#8A5210" strokeWidth={2.2} />
        <Text style={styles.shenimTeksti}>
          Model kontrate për prototipin. Para përdorimit të vërtetë duhet ta rishikojë një jurist në Kosovë.
        </Text>
      </View>
      <Text style={styles.versioni}>Versioni i kontratës: {dataEPlote(KONTRATA_VERSIONI)}</Text>
    </EkraniMeHero>
  );
}

function Pala({
  ikona,
  roli,
  emri,
  verifikuar,
}: {
  ikona: "home" | "shield";
  roli: string;
  emri: string;
  verifikuar?: boolean;
}) {
  return (
    <View style={styles.pala}>
      <UrezaIcon name={ikona} size={20} color={colors.mint} strokeWidth={2.2} />
      <Text style={styles.palaRoli}>{roli}</Text>
      <Text style={styles.palaEmri}>{emri}</Text>
      {verifikuar ? <Text style={styles.palaVerifikuar}>✓ i verifikuar</Text> : null}
    </View>
  );
}

function Nenshkrimi({ kush, kur, bere }: { kush: string; kur: string; bere: boolean }) {
  return (
    <View style={styles.nenshkrimi}>
      <View style={[styles.nenshkrimiIkona, bere ? styles.bere : styles.pritet]}>
        <UrezaIcon name={bere ? "check" : "clock"} size={16} color={bere ? "#1E6B3E" : "#8A5210"} strokeWidth={2.6} />
      </View>
      <View style={styles.flex}>
        <Text style={styles.nenshkrimiKush}>{kush}</Text>
        <Text style={styles.teksti}>{kur}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  palet: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 8,
    backgroundColor: colors.hero,
    borderRadius: 22,
    padding: 14,
  },
  pala: { flex: 1, gap: 4, padding: 6 },
  palaRoli: { color: colors.mint, fontSize: 11, fontWeight: "800", letterSpacing: 1.2, marginTop: 4 },
  palaEmri: { color: colors.white, fontSize: 15, lineHeight: 20, fontWeight: "800" },
  palaVerifikuar: { color: colors.mint, fontSize: 12, fontWeight: "700" },
  lidhja: { justifyContent: "center" },
  neni: { backgroundColor: colors.white, borderRadius: 18, padding: 16, gap: 8 },
  neniTitulli: { color: colors.ink, fontSize: 16, lineHeight: 21, fontWeight: "800" },
  pika: { flexDirection: "row", gap: 10 },
  pikaShenja: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.teal, marginTop: 9 },
  teksti: { flex: 1, color: colors.textSecondary, fontSize: 15, lineHeight: 22, fontWeight: "500" },
  nenshkrimi: { flexDirection: "row", gap: 12, alignItems: "flex-start", paddingTop: 4 },
  nenshkrimiIkona: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  bere: { backgroundColor: "#E4F6EB" },
  pritet: { backgroundColor: "#FFF2DE" },
  nenshkrimiKush: { color: colors.ink, fontSize: 15, fontWeight: "800" },
  shenim: { flexDirection: "row", gap: 10, padding: 14, borderRadius: 16, backgroundColor: "#FFF2DE" },
  shenimTeksti: { flex: 1, color: "#8A5210", fontSize: 14, lineHeight: 20, fontWeight: "600" },
  versioni: { color: colors.textSecondary, fontSize: 13, textAlign: "center" },
});
