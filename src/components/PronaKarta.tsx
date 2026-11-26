import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "@/constants/ureza";
import type { Lloji, Prona } from "@/lib/pronat";
import { dataNeTekst, dataNgaTekst, STATUSET, type Vizita } from "@/lib/vizitat";

import { Ikona, type EmriIIkones } from "./Ikona";
import { PronaIlustrim } from "./PronaIlustrim";
import { UrezaIcon, type IconName } from "./UrezaIcon";

// A property card on Pronat: the picture across the top with the kind and GPS as badges; then
// the name, the place and how fresh the last check is (or the visit in progress); at the bottom
// the visits (to the history) and a clear request button.

export const LLOJET_E_PRONES: Record<Lloji, { emri: string; ikona: IconName }> = {
  shtepi: { emri: "Shtëpi", ikona: "home" },
  prindert: { emri: "Prindërit", ikona: "heart" },
  toke: { emri: "Tokë", ikona: "map" },
};

const IKONA_E_LLOJIT: Record<Lloji, EmriIIkones> = { shtepi: "shtepi", prindert: "prindert", toke: "toke" };

const DITE_FRESKE = 45;
const DITA_MS = 24 * 60 * 60 * 1000;

// Days since the last visit of a property up to today (null when never visited).
export function ditePara(pronaId: string, vizitat: Vizita[]): number | null {
  const sot = dataNgaTekst(dataNeTekst(new Date())).getTime();
  const data = vizitat
    .filter((v) => v.pronaId === pronaId && dataNgaTekst(v.data).getTime() <= sot)
    .map((v) => dataNgaTekst(v.data).getTime());
  return data.length ? Math.round((sot - Math.max(...data)) / DITA_MS) : null;
}

export function PronaKarta({
  prona,
  vizita,
  ditePara,
  aktive,
  onKerko,
  onHistoria,
}: {
  prona: Prona;
  vizita: number; // how many visits this property has had
  ditePara: number | null; // days since the last visit up to today; null when never
  aktive: Vizita | null; // a visit not finished yet
  onKerko: () => void;
  onHistoria: () => void;
}) {
  const lloji = LLOJET_E_PRONES[prona.lloji];

  return (
    <View style={styles.karta}>
      {/* the picture is the card's face: the kind and the GPS state sit on it as small badges */}
      <View style={styles.foto}>
        <PronaIlustrim lloji={prona.lloji} />
        <View style={[styles.distinktiv, styles.distinktivMajtas]}>
          <Ikona emri={IKONA_E_LLOJIT[prona.lloji]} madhesia={13} ngjyra={colors.white} />
          <Text style={styles.distinktivTeksti}>{lloji.emri}</Text>
        </View>
        {prona.koordinatat ? (
          <View
            style={[styles.distinktiv, styles.distinktivDjathtas]}
            accessible
            accessibilityLabel="Ka vendndodhje të saktë GPS"
          >
            <Ikona emri="gps" madhesia={13} ngjyra={colors.mint} />
            <Text style={[styles.distinktivTeksti, { color: colors.mint }]}>GPS</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.trupi}>
        <Text style={styles.emri} numberOfLines={2}>
          {prona.emri}
        </Text>
        <View style={styles.meta}>
          <UrezaIcon name="pin" size={14} color={colors.textSecondary} strokeWidth={2.2} />
          <Text style={styles.metaTeksti} numberOfLines={1}>
            {prona.vendi}
          </Text>
        </View>
        {aktive ? <ChipiAktiv vizita={aktive} /> : <ChipiIFreskise dite={ditePara} />}
      </View>

      <View style={styles.fund}>
        <Pressable
          style={({ pressed }) => [styles.historia, pressed && styles.shtypur]}
          onPress={onHistoria}
          accessibilityRole="button"
          accessibilityLabel={`${vizita} vizita. Hap historinë në Odë.`}
        >
          <Ikona emri="historia" madhesia={16} ngjyra={colors.petrol} />
          <Text style={styles.historiaTeksti}>
            {vizita} {vizita === 1 ? "vizitë" : "vizita"}
          </Text>
          <Ikona emri="shigjeta" madhesia={14} ngjyra={colors.petrol} />
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.kerko, pressed && styles.shtypur]}
          onPress={onKerko}
          accessibilityRole="button"
          accessibilityLabel={`Kërko vizitë për ${prona.emri}`}
        >
          <Text style={styles.kerkoTeksti}>Kërko vizitë</Text>
          <UrezaIcon name="arrow" size={16} color={colors.white} strokeWidth={2.6} />
        </Pressable>
      </View>
    </View>
  );
}

// Three figures above the cards: how many properties, how many have an exact GPS position, and
// how many need a check (no visit for more than DITE_FRESKE days, or never).
export function ShifratEPronave({
  gjithsej,
  meGps,
  kerkojneKontroll,
}: {
  gjithsej: number;
  meGps: number;
  kerkojneKontroll: number;
}) {
  const kujdes = kerkojneKontroll > 0;
  return (
    <View style={styles.shifrat}>
      <Shifra ikona="houses" vlera={String(gjithsej)} etiketa={gjithsej === 1 ? "Pronë" : "Prona"} />
      <Shifra ikona="pin" vlera={`${meGps}/${gjithsej}`} etiketa="Me GPS të saktë" />
      <Shifra
        ikona={kujdes ? "warning" : "check"}
        vlera={String(kerkojneKontroll)}
        etiketa="Kërkojnë kontroll"
        ngjyra={kujdes ? { bg: "#FFF2DE", fg: "#8A5210" } : undefined}
      />
    </View>
  );
}

function Shifra({
  ikona,
  vlera,
  etiketa,
  ngjyra,
}: {
  ikona: IconName;
  vlera: string;
  etiketa: string;
  ngjyra?: { bg: string; fg: string };
}) {
  return (
    <View style={styles.shifra} accessible accessibilityLabel={`${etiketa}: ${vlera}`}>
      <View style={[styles.shifraIkona, ngjyra && { backgroundColor: ngjyra.bg }]}>
        <UrezaIcon name={ikona} size={18} color={ngjyra?.fg ?? colors.petrol} strokeWidth={2.2} />
      </View>
      <Text style={styles.shifraVlera}>{vlera}</Text>
      <Text style={styles.shifraEtiketa}>{etiketa}</Text>
    </View>
  );
}

export function ChipiIFreskise({ dite }: { dite: number | null }) {
  const mire = dite !== null && dite <= DITE_FRESKE;
  const teksti =
    dite === null ? "Pa vizitë ende" : dite <= 0 ? "Kontrolluar sot" : dite === 1 ? "Kontrolluar dje" : `Kontrolluar para ${dite} ditësh`;
  return (
    <View style={[styles.chip, { backgroundColor: mire ? "#E4F6EB" : "#FFF2DE" }]}>
      <UrezaIcon name={mire ? "check" : "warning"} size={13} color={mire ? "#1E6B3E" : "#8A5210"} strokeWidth={2.6} />
      <Text style={[styles.chipTeksti, { color: mire ? "#1E6B3E" : "#8A5210" }]} numberOfLines={1}>
        {teksti}
      </Text>
    </View>
  );
}

function ChipiAktiv({ vizita }: { vizita: Vizita }) {
  const s = STATUSET[vizita.statusi];
  return (
    <View style={[styles.chip, { backgroundColor: s.bg }]}>
      <UrezaIcon name={s.icon} size={13} color={s.fg} strokeWidth={2.6} />
      <Text style={[styles.chipTeksti, { color: s.fg }]} numberOfLines={1}>
        Vizita: {s.emri.toLowerCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  shifrat: { flexDirection: "row", gap: 10 },
  shifra: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 12,
    gap: 2,
    shadowColor: "#0B2530",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
  shifraIkona: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#E8F5F3",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  shifraVlera: { color: colors.ink, fontSize: 24, lineHeight: 28, fontWeight: "800" },
  shifraEtiketa: { color: colors.textSecondary, fontSize: 12, lineHeight: 16, fontWeight: "600" },
  shtypur: { opacity: 0.85, transform: [{ scale: 0.97 }] },
  karta: {
    backgroundColor: colors.white,
    borderRadius: 22,
    overflow: "hidden",
    shadowColor: "#0B2530",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.09,
    shadowRadius: 16,
    elevation: 3,
  },
  // the picture across the whole card; the drawings are 4:3 and are cropped from the middle
  foto: { height: 150 },
  distinktiv: {
    position: "absolute",
    top: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    height: 28,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: "rgba(14,47,60,0.72)",
  },
  distinktivMajtas: { left: 12 },
  distinktivDjathtas: { right: 12 },
  distinktivTeksti: { color: colors.white, fontSize: 12, fontWeight: "800", letterSpacing: 0.3 },
  trupi: { paddingHorizontal: 16, paddingTop: 14, gap: 6, alignItems: "flex-start" },
  emri: { color: colors.ink, fontSize: 19, lineHeight: 24, fontWeight: "800" },
  meta: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaTeksti: { color: colors.textSecondary, fontSize: 14, fontWeight: "600", flexShrink: 1 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    height: 26,
    paddingHorizontal: 10,
    borderRadius: 13,
    marginTop: 2,
    maxWidth: "100%",
  },
  chipTeksti: { fontSize: 12, fontWeight: "700", flexShrink: 1 },
  fund: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
    marginHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.background,
  },
  historia: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 44 },
  historiaTeksti: { color: colors.petrol, fontSize: 14, fontWeight: "800" },
  kerko: {
    height: 44,
    paddingHorizontal: 18,
    borderRadius: 22,
    backgroundColor: colors.petrol,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  kerkoTeksti: { color: colors.white, fontSize: 14, fontWeight: "800" },
});
