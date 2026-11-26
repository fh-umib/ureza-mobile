import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import MapView, { Circle, Marker, type Region } from "react-native-maps";
import Svg, { Circle as SvgCircle, Path, Rect } from "react-native-svg";

import { colors } from "@/constants/ureza";
import { RREZJA_E_PRONES, krahaso, lidhjaEHartes, type GjendjaEGps, type Koordinata } from "@/lib/gjeo";

// A small satellite map for the GPS evidence of a visit (design: Detajet, "Dëshmi"): the property with
// its circle of 150 m, and the GPS position where the Miku was, with the circle of its accuracy. The
// colour of the GPS point says the same as the chip above it: green inside, amber near, red far.
// It only shows the picture (no panning), so it never fights with the scrolling of the page.
// The web version (nothing) is in HartaEDeshmise.web.tsx.

const NGJYRAT: Record<GjendjaEGps, string> = { brenda: colors.ok, afer: "#C98A1B", larg: "#B3261E" };
const METRA_NE_GRADE = 111320; // metres in one degree of latitude

// A region that shows both circles with some air around them.
function regjioniQeEPermban(prona: Koordinata, gps: Koordinata, saktesia: number): Region {
  const kosinusi = Math.cos((prona.lat * Math.PI) / 180);
  const rLat = Math.max(RREZJA_E_PRONES, 1) / METRA_NE_GRADE;
  const gLat = Math.max(saktesia, 5) / METRA_NE_GRADE;
  const minLat = Math.min(prona.lat - rLat, gps.lat - gLat);
  const maxLat = Math.max(prona.lat + rLat, gps.lat + gLat);
  const rLng = rLat / kosinusi;
  const gLng = gLat / kosinusi;
  const minLng = Math.min(prona.lng - rLng, gps.lng - gLng);
  const maxLng = Math.max(prona.lng + rLng, gps.lng + gLng);
  const delta = Math.max((maxLat - minLat) * 1.5, (maxLng - minLng) * 1.5, 0.004);
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: delta,
    longitudeDelta: delta,
  };
}

export function HartaEDeshmise({
  prona,
  gps,
  saktesia,
  lartesia = 220,
}: {
  prona: Koordinata;
  gps: Koordinata;
  saktesia: number | null;
  lartesia?: number;
}) {
  const { gjendja } = krahaso({ ...gps, saktesia }, prona);
  const ngjyra = NGJYRAT[gjendja];
  const regjioni = regjioniQeEPermban(prona, gps, saktesia ?? 0);

  return (
    <View style={styles.kuti}>
      <MapView
        // a new key redraws the map when the points change (e.g. the Miku takes the GPS again)
        key={`${prona.lat},${prona.lng},${gps.lat},${gps.lng}`}
        style={{ height: lartesia }}
        initialRegion={regjioni}
        mapType="hybrid"
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        showsCompass={false}
        showsPointsOfInterests={false}
        toolbarEnabled={false}
        accessibilityLabel="Harta e dëshmisë: prona dhe vendi ku ishte Miku"
      >
        <Circle
          center={{ latitude: prona.lat, longitude: prona.lng }}
          radius={RREZJA_E_PRONES}
          fillColor="rgba(140,224,203,0.22)"
          strokeColor={colors.mint}
          strokeWidth={2}
        />
        {saktesia ? (
          <Circle
            center={{ latitude: gps.lat, longitude: gps.lng }}
            radius={saktesia}
            fillColor={`${ngjyra}33`}
            strokeColor={ngjyra}
            strokeWidth={1}
          />
        ) : null}
        <Marker
          coordinate={{ latitude: prona.lat, longitude: prona.lng }}
          tracksViewChanges={false}
          anchor={{ x: 0.5, y: 0.5 }}
        >
          <Svg width={34} height={40} viewBox="0 0 44 52">
            <Path
              d="M22 3 L40 19 V41 Q40 43 38 43 H6 Q4 43 4 41 V19 Z"
              fill={colors.amber}
              stroke={colors.white}
              strokeWidth={2.5}
              strokeLinejoin="round"
            />
            <Rect x={17} y={27} width={10} height={16} fill={colors.hero} />
          </Svg>
        </Marker>
        <Marker
          coordinate={{ latitude: gps.lat, longitude: gps.lng }}
          tracksViewChanges={false}
          anchor={{ x: 0.5, y: 0.5 }}
        >
          <Svg width={22} height={22} viewBox="0 0 22 22">
            <SvgCircle cx={11} cy={11} r={9} fill={ngjyra} stroke={colors.white} strokeWidth={3} />
          </Svg>
        </Marker>
      </MapView>
      <View style={styles.legjenda}>
        <View style={styles.pika}>
          <View style={[styles.shenja, { backgroundColor: colors.amber }]} />
          <Text style={styles.legjendaText}>Prona</Text>
        </View>
        <View style={styles.pika}>
          <View style={[styles.shenja, { backgroundColor: ngjyra }]} />
          <Text style={styles.legjendaText}>GPS i Mikut</Text>
        </View>
        <Pressable
          style={styles.lidhje}
          onPress={() => void Linking.openURL(lidhjaEHartes(gps))}
          accessibilityRole="link"
          accessibilityLabel="Hape vendin e GPS-it në Google Maps"
        >
          <Text style={styles.lidhjeText}>Hape në Google Maps</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  kuti: { borderRadius: 16, overflow: "hidden", backgroundColor: "#E3EAF0" },
  legjenda: {
    minHeight: 44,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    columnGap: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#E3EAF0",
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    borderTopWidth: 0,
  },
  pika: { flexDirection: "row", alignItems: "center", gap: 6 },
  shenja: { width: 12, height: 12, borderRadius: 6 },
  legjendaText: { color: colors.textSecondary, fontSize: 13, lineHeight: 18, fontWeight: "600" },
  lidhje: { minHeight: 44, marginLeft: "auto", justifyContent: "center" },
  lidhjeText: { color: colors.petrol, fontSize: 14, fontWeight: "800" },
});
