
import { Platform, StyleSheet, Text, View } from "react-native";

export default function HomeScreen() {
  const platforma =
    Platform.OS === "ios"
      ? "iOS (iPhone)"
      : Platform.OS === "android"
        ? "Android"
        : "Web";

  return (
    <View style={styles.container}>
      <Text style={styles.label}>PROJEKTI YNE MOBIL</Text>

      <Text style={styles.titulli}>Urëza</Text>

      <Text style={styles.pershkrimi}>
        Një urë mes diasporës dhe shtëpisë në Kosovë.
      </Text>

      <View style={styles.karta}>
        <Text style={styles.nentitulli}>Zhvilluar nga</Text>
        <Text style={styles.vlera}>
          Flutura Hyseni & Tringa
        </Text>

        <Text style={styles.nentitulli}>Platforma</Text>
        <Text style={styles.vlera}>{platforma}</Text>
      </View>

      <Text style={styles.fundi}>
        Java 1 - Aplikacioni ynë i parë në telefon
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#F5F8FC",
  },
  label: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "bold",
    letterSpacing: 2,
    textAlign: "center",
  },
  titulli: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#164E63",
    textAlign: "center",
    marginTop: 12,
  },
  pershkrimi: {
    fontSize: 18,
    color: "#475569",
    textAlign: "center",
    marginTop: 12,
    marginBottom: 30,
  },
  karta: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  },
  nentitulli: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 6,
  },
  vlera: {
    fontSize: 18,
    fontWeight: "600",
    color: "#164E63",
    marginBottom: 18,
  },
  fundi: {
    fontSize: 13,
    textAlign: "center",
    color: "#64748B",
  },
});
