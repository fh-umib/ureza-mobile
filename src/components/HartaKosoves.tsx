import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, G, Path, Rect } from "react-native-svg";

import { colors, font } from "@/constants/ureza";
import { HARTA_LEVIZJA, neHarte, type Koordinata } from "@/lib/gjeo";

// The map of Kosovo of the design (Harta): the outline in petrol, a dot for each property, and the
// selected property as an amber house with its name. The drawing is 390 x 460 and scales to the
// width of the screen; the points come from latitude and longitude (see neHarte in src/lib/gjeo.ts).

export const HARTA_GJERESIA = 390;
export const HARTA_LARTESIA = 460;

// The outline of Kosovo, as drawn in the design (translate and scale: HARTA_LEVIZJA).
const KONTURA =
  "M17.8,151.3 L19.5,148.8 L19.3,140.4 L23.3,130.6 L12.0,117.0 L13.4,111.5 L19.4,107.2 L34.7,113.2 L38.3,109.2 L38.4,103.7 L40.8,100.7 L69.8,94.2 L76.7,91.3 L79.9,86.9 L78.5,82.8 L73.1,78.3 L74.3,72.9 L76.7,69.7 L84.5,68.0 L89.0,61.3 L93.9,61.8 L100.7,53.0 L103.7,46.6 L104.3,41.8 L103.3,40.6 L99.0,40.4 L97.4,37.2 L94.4,29.4 L95.0,24.7 L104.0,22.4 L115.2,14.0 L122.3,12.0 L128.6,15.3 L132.3,20.9 L130.4,20.4 L128.8,21.9 L127.7,28.4 L128.6,30.0 L152.5,43.9 L165.0,45.5 L167.3,47.3 L169.5,51.8 L172.9,64.6 L175.4,66.1 L179.4,63.6 L181.8,64.0 L184.0,68.3 L185.0,80.5 L189.1,85.2 L195.6,86.0 L201.4,90.2 L208.9,91.5 L210.2,92.9 L209.6,101.3 L206.0,112.9 L209.8,114.6 L215.0,114.5 L232.7,117.6 L241.9,126.9 L250.2,124.1 L257.6,125.0 L261.2,127.4 L262.4,131.7 L257.0,136.2 L256.2,141.3 L254.6,142.7 L256.0,146.0 L254.6,150.5 L247.4,162.3 L240.4,170.3 L240.2,182.5 L237.2,185.3 L228.7,187.9 L225.7,191.2 L225.5,195.8 L231.1,204.4 L232.5,209.8 L223.3,211.2 L220.7,209.5 L218.7,211.9 L214.2,209.6 L211.9,211.0 L213.3,215.7 L204.3,214.1 L194.0,228.7 L194.6,239.9 L185.8,238.7 L180.4,230.2 L175.3,225.2 L169.8,220.9 L165.8,219.5 L152.3,230.1 L120.9,241.7 L118.1,245.1 L114.9,258.9 L116.5,271.1 L116.0,275.8 L112.1,283.6 L109.2,286.9 L106.1,288.0 L100.6,282.2 L97.1,286.7 L94.8,286.9 L89.7,282.3 L89.0,277.1 L92.8,271.4 L94.3,265.3 L87.6,243.3 L87.2,233.6 L80.2,216.6 L73.9,208.9 L56.2,195.8 L42.5,195.4 L40.1,190.9 L39.8,185.4 L36.1,181.1 L37.8,176.0 L34.4,171.5 L30.3,161.6 L27.9,158.5 L20.7,154.6 Z";

export type PikaNeHarte = {
  id: string;
  emri: string; // the name of the property, shown under the selected house
  vendi: string; // the town, shown next to the other dots
  k: Koordinata;
  sakte: boolean; // false: only the town is known, the point is drawn as a ring
};

type Vendosur = PikaNeHarte & { x: number; y: number };

// Properties in the same town land on the same point: spread them a little so each can be tapped.
function vendos(pikat: PikaNeHarte[]): Vendosur[] {
  const baza: Vendosur[] = [];
  for (const p of pikat) {
    const n = neHarte(p.k);
    if (n) baza.push({ ...p, ...n });
  }
  return baza.map((p, i) => {
    const para = baza.slice(0, i).filter((q) => Math.hypot(q.x - p.x, q.y - p.y) < 16).length;
    if (para === 0) return p;
    const kendi = para * 2.4;
    const rrezja = 16 + 6 * para;
    return { ...p, x: p.x + rrezja * Math.cos(kendi), y: p.y + rrezja * Math.sin(kendi) };
  });
}

export function HartaKosoves({
  pikat,
  zgjedhurId,
  onZgjidh,
  gjeresia,
}: {
  pikat: PikaNeHarte[];
  zgjedhurId: string | null;
  onZgjidh: (id: string) => void;
  gjeresia: number; // the width in points; the height follows
}) {
  const s = gjeresia / HARTA_GJERESIA;
  const lartesia = HARTA_LARTESIA * s;
  const vendosur = useMemo(() => vendos(pikat), [pikat]);
  const zgjedhur = vendosur.find((p) => p.id === zgjedhurId) ?? null;
  const tjeret = vendosur.filter((p) => p.id !== zgjedhurId);

  return (
    <View style={{ width: gjeresia, height: lartesia }}>
      <Svg
        width={gjeresia}
        height={lartesia}
        viewBox={`0 0 ${HARTA_GJERESIA} ${HARTA_LARTESIA}`}
        accessibilityLabel="Harta e Kosovës me pronat e shënuara"
      >
        <Rect width={HARTA_GJERESIA} height={HARTA_LARTESIA} fill={colors.hero} />
        <G transform={`translate(${HARTA_LEVIZJA.x} ${HARTA_LEVIZJA.y}) scale(${HARTA_LEVIZJA.shkalla})`}>
          <Path
            d={KONTURA}
            fill="#1F5365"
            stroke={colors.mint}
            strokeOpacity={0.55}
            strokeWidth={1.2}
            strokeLinejoin="round"
          />
        </G>
        {tjeret.map((p) => (
          <G key={p.id}>
            <Circle cx={p.x} cy={p.y} r={14} fill={colors.mint} fillOpacity={0.15} />
            {p.sakte ? (
              <Circle cx={p.x} cy={p.y} r={7} fill={colors.mint} fillOpacity={0.9} />
            ) : (
              <Circle cx={p.x} cy={p.y} r={6} fill="none" stroke={colors.mint} strokeWidth={2} strokeDasharray="3 2" />
            )}
          </G>
        ))}
        {zgjedhur ? (
          <G>
            <Circle cx={zgjedhur.x} cy={zgjedhur.y} r={34} fill={colors.amber} fillOpacity={0.14} />
            <Circle cx={zgjedhur.x} cy={zgjedhur.y} r={22} fill={colors.amber} fillOpacity={0.22} />
            {zgjedhur.sakte ? null : (
              <Circle
                cx={zgjedhur.x}
                cy={zgjedhur.y}
                r={30}
                fill="none"
                stroke={colors.amber}
                strokeWidth={1.5}
                strokeDasharray="4 3"
              />
            )}
          </G>
        ) : null}
      </Svg>

      {tjeret.map((p) => (
        <View key={p.id} style={styles.mbulesa}>
          <Text style={[styles.qyteti, { left: p.x * s + 14, top: p.y * s - 10 }]} numberOfLines={1}>
            {p.vendi}
          </Text>
          <Pressable
            onPress={() => onZgjidh(p.id)}
            style={[styles.goditja, { left: p.x * s - 22, top: p.y * s - 22 }]}
            accessibilityRole="button"
            accessibilityLabel={`${p.emri}, ${p.vendi}`}
            accessibilityState={{ selected: false }}
          />
        </View>
      ))}

      {zgjedhur ? (
        <View style={styles.mbulesa}>
          <View
            style={[
              styles.emriKonteineri,
              { left: Math.min(Math.max(zgjedhur.x * s - 100, 4), gjeresia - 204), top: zgjedhur.y * s + 28 },
            ]}
          >
            <Text style={styles.emri} numberOfLines={1}>
              {zgjedhur.emri}
            </Text>
          </View>
          <Pressable
            onPress={() => onZgjidh(zgjedhur.id)}
            style={[styles.shtepia, { left: zgjedhur.x * s - 22, top: zgjedhur.y * s - 26 }]}
            accessibilityRole="button"
            accessibilityLabel={`${zgjedhur.emri}, ${zgjedhur.vendi}`}
            accessibilityState={{ selected: true }}
          >
            <Svg width={44} height={52} viewBox="0 0 44 52" opacity={zgjedhur.sakte ? 1 : 0.85}>
              <Path
                d="M22 3 L40 19 V41 Q40 43 38 43 H6 Q4 43 4 41 V19 Z"
                fill={colors.amber}
                stroke={colors.white}
                strokeWidth={2.5}
                strokeLinejoin="round"
              />
              <Rect x={17} y={27} width={10} height={16} fill={colors.hero} />
            </Svg>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  // a layer over the map that lets the touches through everywhere except on the markers
  mbulesa: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, pointerEvents: "box-none" },
  qyteti: {
    position: "absolute",
    maxWidth: 140,
    pointerEvents: "none",
    color: colors.onHeroText,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: font.w700,
  },
  goditja: { position: "absolute", width: 44, height: 44 },
  shtepia: { position: "absolute", width: 44, height: 52 },
  emriKonteineri: { position: "absolute", width: 200, alignItems: "center", pointerEvents: "none" },
  emri: {
    maxWidth: 200,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: colors.white,
    color: colors.ink,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: font.w800,
  },
});
