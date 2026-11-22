import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "@/constants/ureza";
import { kohezgjatjaNeTekst } from "@/lib/vizitat";

import { UrezaIcon } from "./UrezaIcon";

// Plays a voice note: one round button and "00:12 / 00:42".
// `kohezgjatja` (seconds) is shown until the player knows the real length.
export function LojtariZanor({ url, kohezgjatja }: { url: string; kohezgjatja: number | null }) {
  const lojtari = useAudioPlayer({ uri: url });
  const gjendja = useAudioPlayerStatus(lojtari);

  const gjatesia = gjendja.duration > 0 ? gjendja.duration : (kohezgjatja ?? 0);
  const luan = gjendja.playing;

  function shtyp() {
    if (luan) {
      lojtari.pause();
      return;
    }
    // after the end, start again from the beginning
    if (gjendja.didJustFinish || (gjendja.duration > 0 && gjendja.currentTime >= gjendja.duration - 0.1)) {
      void lojtari.seekTo(0);
    }
    lojtari.play();
  }

  return (
    <View style={styles.rreshti}>
      <Pressable
        style={styles.buton}
        onPress={shtyp}
        accessibilityRole="button"
        accessibilityLabel={luan ? "Ndalo shënimin zanor" : "Dëgjo shënimin zanor"}
      >
        <UrezaIcon name={luan ? "pause" : "play"} size={22} color={colors.white} strokeWidth={2.4} />
      </Pressable>
      <Text style={styles.koha}>
        {kohezgjatjaNeTekst(gjendja.currentTime)} / {kohezgjatjaNeTekst(gjatesia)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  rreshti: { flexDirection: "row", alignItems: "center", gap: 14 },
  buton: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.petrol, alignItems: "center", justifyContent: "center" },
  koha: { color: colors.ink, fontSize: 17, fontWeight: "700", fontVariant: ["tabular-nums"] },
});
