import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import MapView, { type MapType, type Region } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Path } from "react-native-svg";

import { colors } from "@/constants/ureza";
import { koordinataNeTekst, type Koordinata } from "@/lib/gjeo";

import { UrezaIcon } from "./UrezaIcon";

// Marks the property on the satellite map (design: "Shto pronë"): the client zooms in until the
// pin lands on their house and confirms. The pin stays in the middle of the screen and the map moves
// under it, so the position is the centre of the map. The web version (nothing) is in ZgjidhNeHarte.web.tsx.

const KOSOVA: Region = { latitude: 42.58, longitude: 20.9, latitudeDelta: 1.7, longitudeDelta: 1.7 };

function regjioniFillestar(fillimi: Koordinata | null, afer: Koordinata | null): Region {
  if (fillimi) return { latitude: fillimi.lat, longitude: fillimi.lng, latitudeDelta: 0.003, longitudeDelta: 0.003 };
  if (afer) return { latitude: afer.lat, longitude: afer.lng, latitudeDelta: 0.03, longitudeDelta: 0.03 };
  return KOSOVA;
}

export function ZgjidhNeHarte({
  fillimi,
  afer,
  onZgjidh,
  mbyll,
}: {
  fillimi: Koordinata | null; // the position already set, if any
  afer: Koordinata | null; // the town of the property, to start near it
  onZgjidh: (k: Koordinata) => void;
  mbyll: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [regjioni] = useState(() => regjioniFillestar(fillimi, afer));
  const [qendra, setQendra] = useState<Koordinata>({ lat: regjioni.latitude, lng: regjioni.longitude });
  const [lloji, setLloji] = useState<MapType>("hybrid");
  // the whole of Kosovo is too far out to pick a house: the button waits until the map is zoomed in
  const [zmadhuar, setAfer2] = useState(regjioni.latitudeDelta < 0.1);

  return (
    <Modal visible animationType="slide" onRequestClose={mbyll} statusBarTranslucent>
      <View style={styles.root}>
        <MapView
          style={StyleSheet.absoluteFill}
          initialRegion={regjioni}
          mapType={lloji}
          rotateEnabled={false}
          pitchEnabled={false}
          showsCompass={false}
          showsPointsOfInterests={false}
          toolbarEnabled={false}
          onRegionChangeComplete={(r) => {
            setQendra({ lat: r.latitude, lng: r.longitude });
            setAfer2(r.latitudeDelta < 0.1);
          }}
          accessibilityLabel="Harta për zgjedhjen e vendndodhjes"
        />

        {/* the pin: its tip is the centre of the map */}
        <View style={styles.gjilpera}>
          <Svg width={40} height={52} viewBox="0 0 40 52">
            <Path
              d="M20 50 C20 50 4 33 4 20 a16 16 0 1 1 32 0 C36 33 20 50 20 50 Z"
              fill={colors.amber}
              stroke={colors.white}
              strokeWidth={3}
              strokeLinejoin="round"
            />
            <Circle cx={20} cy={20} r={5} fill={colors.hero} />
          </Svg>
        </View>

        <View style={[styles.siper, { top: insets.top + 8 }]}>
          <View style={styles.udhezim}>
            <Text style={styles.titulli} accessibilityRole="header">
              Shëno pronën në hartë
            </Text>
            <Text style={styles.tekst}>Zmadho dhe lëviz hartën derisa shenja të bjerë mbi shtëpinë tënde.</Text>
          </View>
          <Pressable style={styles.mbyll} onPress={mbyll} accessibilityRole="button" accessibilityLabel="Mbyll hartën">
            <UrezaIcon name="close" size={22} color={colors.white} strokeWidth={2.4} />
          </Pressable>
        </View>

        <View style={[styles.poshte, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <Pressable
            style={styles.lloji}
            onPress={() => setLloji((l) => (l === "hybrid" ? "standard" : "hybrid"))}
            accessibilityRole="button"
            accessibilityLabel={lloji === "hybrid" ? "Kalo te harta e thjeshtë" : "Kalo te pamja satelitore"}
          >
            <UrezaIcon name="map" size={18} color={colors.white} strokeWidth={2.2} />
            <Text style={styles.llojiText}>{lloji === "hybrid" ? "Hartë" : "Satelit"}</Text>
          </Pressable>
          <View style={styles.karta}>
            <Text style={styles.koordinatat}>{koordinataNeTekst(qendra)}</Text>
            {zmadhuar ? null : <Text style={styles.paralajmerim}>Zmadho më shumë për ta gjetur shtëpinë.</Text>}
            <Pressable
              style={[styles.konfirmo, !zmadhuar && styles.disabled]}
              onPress={() => {
                onZgjidh(qendra);
                mbyll();
              }}
              disabled={!zmadhuar}
              accessibilityRole="button"
            >
              <Text style={styles.konfirmoText}>Konfirmo vendndodhjen</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.hero },
  // the pin's box is 40 x 52 and its tip is at (20, 50): put that point in the middle of the screen
  gjilpera: { position: "absolute", left: "50%", top: "50%", marginLeft: -20, marginTop: -50, pointerEvents: "none" },
  siper: { position: "absolute", left: 12, right: 12, flexDirection: "row", gap: 8, alignItems: "flex-start" },
  udhezim: { flex: 1, padding: 12, borderRadius: 16, backgroundColor: "rgba(23,63,78,0.9)", gap: 2 },
  titulli: { color: colors.white, fontSize: 17, lineHeight: 22, fontWeight: "800" },
  tekst: { color: colors.onHeroText, fontSize: 14, lineHeight: 20, fontWeight: "500" },
  mbyll: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(23,63,78,0.9)",
  },
  poshte: { position: "absolute", left: 12, right: 12, bottom: 0, gap: 10 },
  lloji: {
    alignSelf: "flex-end",
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(23,63,78,0.9)",
  },
  llojiText: { color: colors.white, fontSize: 14, fontWeight: "700" },
  karta: { backgroundColor: colors.white, borderRadius: 20, padding: 16, gap: 8 },
  koordinatat: { color: colors.ink, fontSize: 16, lineHeight: 22, fontWeight: "700", textAlign: "center" },
  paralajmerim: { color: "#8A5210", fontSize: 14, lineHeight: 20, fontWeight: "600", textAlign: "center" },
  konfirmo: {
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.petrol,
    alignItems: "center",
    justifyContent: "center",
  },
  konfirmoText: { color: colors.white, fontSize: 17, fontWeight: "700" },
  disabled: { opacity: 0.45 },
});
