import { Image } from "expo-image";
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "@/constants/ureza";
import { useDeshmite } from "@/lib/deshmite";
import { useDhenat } from "@/lib/dhenat";
import { useProfili } from "@/lib/profili";
import { kohezgjatjaNeTekst, oraNeTekst, type Vizita } from "@/lib/vizitat";

import { GpsKrahasimi } from "./GpsKrahasimi";
import { HartaEDeshmise } from "./HartaEDeshmise";
import { LojtariZanor } from "./LojtariZanor";
import { UrezaIcon } from "./UrezaIcon";

// The evidence of a visit as the client reads it (design: Detajet, tab "Dëshmi"): the GPS
// position, the photos taken during the visit and the voice note.
export function DeshmiteVizites({ vizita }: { vizita: Vizita }) {
  const d = useDeshmite(vizita.id);
  const { pronat } = useDhenat();
  const { profili } = useProfili();
  const prona = pronat.find((p) => p.id === vizita.pronaId);
  const eKlient = profili?.roli !== "miku" && profili?.roli !== "admin";

  if (d.burimi === "duke_ngarkuar") return <ActivityIndicator color={colors.petrol} />;

  if (d.burimi === "pa_lidhje") {
    return (
      <View style={styles.karta}>
        <Text style={styles.titulli}>Dëshmitë nuk u ngarkuan</Text>
        <Text style={styles.tekst}>Nuk u lidh me serverin. Kontrollo internetin dhe provo përsëri.</Text>
        <Pressable style={styles.dytesor} onPress={() => void d.rifresko()} accessibilityRole="button">
          <Text style={styles.dytesorText}>Provo përsëri</Text>
        </Pressable>
      </View>
    );
  }

  if (d.deshmite.length === 0) {
    return (
      <View style={styles.karta}>
        <Text style={styles.titulli}>Dëshmitë e vizitës</Text>
        <Text style={styles.tekst}>
          {d.burimi === "mungon"
            ? "Dëshmitë shfaqen këtu pasi të ekzekutohet supabase/deshmia.sql."
            : "Vendndodhja GPS, fotot dhe shënimi zanor shfaqen këtu kur Miku t'i dërgojë."}
        </Text>
      </View>
    );
  }

  const gps = d.gps;

  return (
    <>
      {gps && gps.gjeresia !== null && gps.gjatesia !== null ? (
        <View style={styles.karta}>
          <Text style={styles.titulli}>Vendndodhja e regjistruar</Text>
          <View style={styles.rresht}>
            <UrezaIcon name="pin" size={20} color={colors.petrol} />
            <Text style={styles.vlera}>
              GPS ±{Math.round(gps.saktesia ?? 0)} m · {oraNeTekst(gps.koha)}
            </Text>
          </View>
          <GpsKrahasimi gps={gps} prona={prona} />
          {prona?.koordinatat ? (
            <HartaEDeshmise
              prona={prona.koordinatat}
              gps={{ lat: gps.gjeresia, lng: gps.gjatesia }}
              saktesia={gps.saktesia}
            />
          ) : null}
          {eKlient && prona && !prona.koordinatat ? (
            <Text style={styles.tekst}>
              Prona nuk ka vendndodhje të saktë, prandaj GPS-i nuk krahasohet me të. Shtoje te Harta.
            </Text>
          ) : null}
          <Text style={styles.tekst}>
            {gps.gjeresia.toFixed(5)}, {gps.gjatesia.toFixed(5)}
          </Text>
          <Pressable
            style={styles.dytesor}
            onPress={() => void Linking.openURL(`https://www.google.com/maps?q=${gps.gjeresia},${gps.gjatesia}`)}
            accessibilityRole="link"
          >
            <Text style={styles.dytesorText}>Shiko në hartë</Text>
          </Pressable>
        </View>
      ) : null}

      {d.fotot.length > 0 ? (
        <View style={styles.karta}>
          <Text style={styles.titulli}>Foto të bëra gjatë vizitës</Text>
          <View style={styles.rrjeta}>
            {d.fotot.map((foto) => (
              <View key={foto.id} style={styles.miniatura}>
                {foto.url ? (
                  <Image
                    source={{ uri: foto.url }}
                    style={styles.foto}
                    contentFit="cover"
                    accessibilityLabel={`Foto e vizitës, ${oraNeTekst(foto.koha)}`}
                  />
                ) : (
                  <View style={styles.foto} />
                )}
                <Text style={styles.fotoOra}>{oraNeTekst(foto.koha)}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.tekst}>Vetëm nga kamera, jo nga galeria.</Text>
        </View>
      ) : null}

      {d.zeri ? (
        <View style={styles.karta}>
          <Text style={styles.titulli}>Mesazhi zanor</Text>
          <Text style={styles.tekst}>
            {kohezgjatjaNeTekst(d.zeri.kohezgjatja ?? 0)} · regjistruar në {oraNeTekst(d.zeri.koha)}
          </Text>
          {d.zeri.url ? <LojtariZanor key={d.zeri.id} url={d.zeri.url} kohezgjatja={d.zeri.kohezgjatja} /> : null}
        </View>
      ) : null}

      <View style={styles.karta}>
        <View style={styles.pill}>
          <Text style={styles.pillText}>Së shpejti</Text>
        </View>
        <Text style={styles.titulli}>Përmbledhja në gjuhën tënde</Text>
        <Text style={styles.tekst}>Shënimi zanor do të përkthehet dhe përmblidhet këtu, në gjuhën që zgjedh.</Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  karta: { backgroundColor: colors.white, borderRadius: 20, padding: 20, gap: 10 },
  titulli: { color: colors.ink, fontSize: 20, lineHeight: 26, fontWeight: "800" },
  tekst: { color: colors.textSecondary, fontSize: 15, lineHeight: 22, fontWeight: "500" },
  rresht: { flexDirection: "row", alignItems: "center", gap: 10 },
  vlera: { color: colors.ink, fontSize: 17, fontWeight: "700" },
  dytesor: { minHeight: 44, alignItems: "flex-start", justifyContent: "center" },
  dytesorText: { color: colors.petrol, fontSize: 16, fontWeight: "800" },
  rrjeta: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  miniatura: { width: "48%", aspectRatio: 1, borderRadius: 14, overflow: "hidden", backgroundColor: "#E3EAF0" },
  foto: { width: "100%", height: "100%" },
  fotoOra: {
    position: "absolute",
    left: 8,
    bottom: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "rgba(11,37,48,0.72)",
    color: colors.white,
    fontSize: 13,
    fontWeight: "700",
  },
  pill: { alignSelf: "flex-start", backgroundColor: "#FCEFD2", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
  pillText: { color: "#7A4A06", fontSize: 12, fontWeight: "700" },
});
