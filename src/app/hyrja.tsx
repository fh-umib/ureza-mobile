import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { hyr, krijoLlogari } from "@/lib/sesioni";

// Ekrani i hyrjes: email + fjalëkalim me Supabase Auth.
// Pas hyrjes ose krijimit të llogarisë, roja në _layout.tsx e çon aplikacionin te lista.
export default function Hyrja() {
  const [email, setEmail] = useState("");
  const [fjalekalimi, setFjalekalimi] = useState("");
  const [duke, setDuke] = useState(false);
  const [mesazhi, setMesazhi] = useState<string | null>(null);

  async function hyrje() {
    setDuke(true);
    setMesazhi(null);
    try {
      await hyr(email.trim(), fjalekalimi);
    } catch (e) {
      setMesazhi((e as Error).message);
    } finally {
      setDuke(false);
    }
  }

  async function krijo() {
    setDuke(true);
    setMesazhi(null);
    try {
      const rezultati = await krijoLlogari(email.trim(), fjalekalimi);
      if (rezultati === "konfirmo") {
        setMesazhi("Llogaria u krijua. Konfirmoje email-in, pastaj hyr.");
      }
    } catch (e) {
      setMesazhi((e as Error).message);
    } finally {
      setDuke(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.safe}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.content}>
          <View style={styles.hero}>
            <Text style={styles.eyebrow}>URËZA</Text>
            <Text style={styles.title}>Hyni me llogarinë tuaj.</Text>
            <Text style={styles.subtitle}>
              Secila llogari sheh vetëm detyrat e veta.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Email-i</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="emri@shembull.com"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              accessibilityLabel="Email-i"
            />

            <Text style={styles.label}>Fjalëkalimi</Text>
            <TextInput
              style={styles.input}
              value={fjalekalimi}
              onChangeText={setFjalekalimi}
              placeholder="Të paktën 6 shkronja"
              secureTextEntry
              autoCapitalize="none"
              textContentType="password"
              accessibilityLabel="Fjalëkalimi"
            />

            {mesazhi ? <Text style={styles.mesazhi}>{mesazhi}</Text> : null}

            <Pressable
              style={[styles.butoni, duke && styles.butoniPasiv]}
              onPress={hyrje}
              disabled={duke}
              accessibilityRole="button"
            >
              {duke ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.butoniTekst}>Hyr</Text>
              )}
            </Pressable>

            <Pressable
              style={[styles.butoniDyte, duke && styles.butoniPasiv]}
              onPress={krijo}
              disabled={duke}
              accessibilityRole="button"
            >
              <Text style={styles.butoniDyteTekst}>Krijo llogari</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F5F8FA" },
  content: { flex: 1, padding: 20, justifyContent: "center", gap: 20 },
  hero: { backgroundColor: "#173F4E", padding: 24, borderRadius: 26 },
  eyebrow: { color: "#8CE0CB", fontWeight: "700", fontSize: 12, letterSpacing: 1.5 },
  title: { color: "#FFFFFF", fontWeight: "800", fontSize: 26, marginTop: 8 },
  subtitle: { color: "#C9DBE1", fontSize: 15, marginTop: 8 },
  card: { backgroundColor: "#FFFFFF", borderRadius: 20, padding: 20, gap: 10 },
  label: { color: "#173C48", fontWeight: "700", fontSize: 14 },
  input: {
    borderWidth: 1,
    borderColor: "#D4E2E7",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: "#173C48",
    backgroundColor: "#F5F8FA",
  },
  mesazhi: { color: "#9B2C2C", fontSize: 14 },
  butoni: {
    backgroundColor: "#175568",
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 6,
  },
  butoniPasiv: { opacity: 0.6 },
  butoniTekst: { color: "#FFFFFF", fontWeight: "800", fontSize: 16 },
  butoniDyte: {
    borderWidth: 2,
    borderColor: "#175568",
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: "center",
  },
  butoniDyteTekst: { color: "#175568", fontWeight: "800", fontSize: 16 },
});
