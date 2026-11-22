import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import MapView, { Circle, Marker, type MapType, type Region } from "react-native-maps";
import Svg, { Path, Rect } from "react-native-svg";

import { colors } from "@/constants/ureza";
import { RREZJA_E_PRONES } from "@/lib/gjeo";

import type { PikaNeHarte } from "./HartaKosoves";
import { UrezaIcon } from "./UrezaIcon";

// The real map (Apple Maps on the iPhone, no key needed): satellite with labels, so the houses show
// as they are. Each property is a house with a circle of 150 m around it (the radius inside which the
// GPS of a visit counts as "inside the property"); a property known only by its town gets a big dashed
// circle instead. The web version is in HartaReale.web.tsx.

const KOSOVA: Region = { latitude: 42.58, longitude: 20.9, latitudeDelta: 1.7, longitudeDelta: 1.7 };
const DELTA_E_SAKTE = 0.005; // about 550 m: the house, its circle and the neighbours
const DELTA_E_PERAFERT = 0.06; // about 6 km: the town
const RREZJA_E_QYTETIT = 1500; // metres, the dashed circle of a property placed only by its town

function regjioniNe(p: PikaNeHarte): Region {
  const delta = p.sakte ? DELTA_E_SAKTE : DELTA_E_PERAFERT;
  return { latitude: p.k.lat, longitude: p.k.lng, latitudeDelta: delta, longitudeDelta: delta };
}

export function HartaReale({
  pikat,
  zgjedhurId,
  onZgjidh,
  gjeresia,
  lartesia,
  siper,
}: {
  pikat: PikaNeHarte[];
  zgjedhurId: string | null;
  onZgjidh: (id: string) => void;
  gjeresia: number;
  lartesia: number;
  siper: number; // the space at the top taken by the title, so a point never hides behind it
}) {
  const hartaRef = useRef<MapView>(null);
  const [gati, setGati] = useState(false);
  const [lloji, setLloji] = useState<MapType>("hybrid");
  const zgjedhur = pikat.find((p) => p.id === zgjedhurId) ?? null;
  // the map opens where the selected property is, without flying in from Kosovo
  const [fillimi] = useState<Region>(() => (zgjedhur ? regjioniNe(zgjedhur) : KOSOVA));

  // fly to the selected property whenever it changes (or its position does)
  useEffect(() => {
    if (!gati || !zgjedhur) return;
    hartaRef.current?.animateToRegion(regjioniNe(zgjedhur), 600);
  }, [gati, zgjedhur?.id, zgjedhur?.k.lat, zgjedhur?.k.lng, zgjedhur?.sakte]); // eslint-disable-line react-hooks/exhaustive-deps

  function teGjitha() {
    hartaRef.current?.fitToCoordinates(
      pikat.map((p) => ({ latitude: p.k.lat, longitude: p.k.lng })),
      { edgePadding: { top: siper + 30, right: 60, bottom: 70, left: 60 }, animated: true },
    );
  }

  return (
    <View style={{ width: gjeresia, height: lartesia }}>
      <MapView
        ref={hartaRef}
        style={StyleSheet.absoluteFill}
        initialRegion={fillimi}
        mapType={lloji}
        onMapReady={() => setGati(true)}
        rotateEnabled={false}
        pitchEnabled={false}
        showsCompass={false}
        showsPointsOfInterests={false}
        toolbarEnabled={false}
        accessibilityLabel="Harta me pronat e shënuara"
      >
        {pikat.map((p) => {
          const zgjedhurAktual = p.id === zgjedhurId;
          return p.sakte ? (
            <Circle
              key={`rreth-${p.id}`}
              center={{ latitude: p.k.lat, longitude: p.k.lng }}
              radius={RREZJA_E_PRONES}
              fillColor={zgjedhurAktual ? "rgba(140,224,203,0.30)" : "rgba(140,224,203,0.16)"}
              strokeColor={colors.mint}
              strokeWidth={zgjedhurAktual ? 3 : 2}
            />
          ) : (
            <Circle
              key={`rreth-${p.id}`}
              center={{ latitude: p.k.lat, longitude: p.k.lng }}
              radius={RREZJA_E_QYTETIT}
              fillColor="rgba(242,196,107,0.14)"
              strokeColor={colors.amber}
              strokeWidth={2}
              lineDashPattern={[8, 6]}
            />
          );
        })}
        {pikat.map((p) => {
          const zgjedhurAktual = p.id === zgjedhurId;
          return (
            <Marker
              // a new key redraws the marker when it becomes (or stops being) the selected one
              key={`${p.id}-${zgjedhurAktual ? "z" : "j"}`}
              coordinate={{ latitude: p.k.lat, longitude: p.k.lng }}
              onPress={() => onZgjidh(p.id)}
              tracksViewChanges={false}
              anchor={{ x: 0.5, y: zgjedhurAktual ? 0.32 : 0.5 }}
              zIndex={zgjedhurAktual ? 2 : 1}
              accessibilityLabel={`${p.emri}, ${p.vendi}`}
            >
              <ShenjaEPrones emri={p.emri} zgjedhur={zgjedhurAktual} />
            </Marker>
          );
        })}
      </MapView>

      <View style={styles.kontrollet}>
        {pikat.length > 1 ? (
          <Pressable
            style={styles.buton}
            onPress={teGjitha}
            accessibilityRole="button"
            accessibilityLabel="Shiko të gjitha pronat"
          >
            <Text style={styles.butonText}>Të gjitha</Text>
          </Pressable>
        ) : null}
        <Pressable
          style={styles.buton}
          onPress={() => setLloji((l) => (l === "hybrid" ? "standard" : "hybrid"))}
          accessibilityRole="button"
          accessibilityLabel={lloji === "hybrid" ? "Kalo te harta e thjeshtë" : "Kalo te pamja satelitore"}
        >
          <UrezaIcon name="map" size={18} color={colors.white} strokeWidth={2.2} />
          <Text style={styles.butonText}>{lloji === "hybrid" ? "Hartë" : "Satelit"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

// The house of the design (amber, white outline) when selected, with the name under it;
// a small white one for the other properties.
function ShenjaEPrones({ emri, zgjedhur }: { emri: string; zgjedhur: boolean }) {
  if (!zgjedhur) {
    return (
      <Svg width={30} height={36} viewBox="0 0 44 52">
        <Path
          d="M22 3 L40 19 V41 Q40 43 38 43 H6 Q4 43 4 41 V19 Z"
          fill={colors.white}
          stroke={colors.petrol}
          strokeWidth={3}
          strokeLinejoin="round"
        />
        <Rect x={17} y={27} width={10} height={16} fill={colors.petrol} />
      </Svg>
    );
  }
  return (
    <View style={styles.zgjedhur}>
      <Svg width={44} height={52} viewBox="0 0 44 52">
        <Path
          d="M22 3 L40 19 V41 Q40 43 38 43 H6 Q4 43 4 41 V19 Z"
          fill={colors.amber}
          stroke={colors.white}
          strokeWidth={2.5}
          strokeLinejoin="round"
        />
        <Rect x={17} y={27} width={10} height={16} fill={colors.hero} />
      </Svg>
      <Text style={styles.emri} numberOfLines={1}>
        {emri}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  kontrollet: { position: "absolute", right: 12, bottom: 36, flexDirection: "row", gap: 8 },
  buton: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(23,63,78,0.88)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
  },
  butonText: { color: colors.white, fontSize: 14, fontWeight: "700" },
  zgjedhur: { width: 200, alignItems: "center", gap: 4 },
  emri: {
    maxWidth: 200,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: colors.white,
    color: colors.ink,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "800",
  },
});
