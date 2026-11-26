import { useRouter, type Href } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { EkraniMeHero, useRevealOnFocus } from "@/components/EkraniMeHero";
import { UrezaIcon } from "@/components/UrezaIcon";
import { ZgjedhesiIRolit, type Zgjedhja } from "@/components/ZgjedhesiIRolit";
import { colors } from "@/constants/ureza";
import { FAQJA_KRYESORE } from "@/lib/faqet";
import { useProfili } from "@/lib/profili";
import { dil } from "@/lib/sesioni";

// "Zgjidh rolin" (design: Roli). Shown once after the first sign-in, and again from
// Profili > "Ndrysho rolin" so one account can try both sides of the app (prototype).
// Admin is given by the Urëza team in the database, it cannot be chosen here.

export default function ZgjidhRolin() {
  const router = useRouter();
  const { profili, burimi } = useProfili();
  // opened to choose the first role (as opposed to changing the one already chosen)
  // (kept from the first render, so it does not change when the profile arrives)
  const [eParia] = useState(profili === null);

  // If the profile turns up while this screen is open (e.g. after "Provo përsëri"), move on.
  useEffect(() => {
    if (eParia && profili) router.replace(FAQJA_KRYESORE[profili.roli] as Href);
  }, [eParia, profili, router]);

  return (
    <EkraniMeHero
      kicker={eParia ? "MIRË SE ERDHE" : "PROFILI"}
      title={eParia ? "Kush je ti?" : "Ndrysho rolin"}
      subtitle={
        eParia
          ? "Zgjidh rolin për ta provuar Urëzën."
          : "Provo aplikacionin nga ana tjetër, me të njëjtën llogari."
      }
      kthehu={eParia ? undefined : { etiketa: "Mbrapa", onPress: () => router.back() }}
    >
      {eParia && burimi === "pa_lidhje" ? <PaLidhje /> : <Forma eParia={eParia} />}
    </EkraniMeHero>
  );
}

function PaLidhje() {
  const { rifresko } = useProfili();
  return (
    <View style={styles.bosh}>
      <Text style={styles.boshTitle}>Nuk u lidh me serverin</Text>
      <Text style={styles.boshText}>Kontrollo internetin dhe provo përsëri.</Text>
      <Pressable style={styles.dytesor} onPress={() => void rifresko()} accessibilityRole="button">
        <Text style={styles.dytesorText}>Provo përsëri</Text>
      </Pressable>
      <DilButon />
    </View>
  );
}

function DilButon() {
  return (
    <Pressable style={styles.dytesor} onPress={() => void dil()} accessibilityRole="button">
      <Text style={styles.dilText}>Dil nga llogaria</Text>
    </Pressable>
  );
}

function Forma({ eParia }: { eParia: boolean }) {
  const router = useRouter();
  const revealSoon = useRevealOnFocus();
  const { profili, burimi, deklarimi, ruaje } = useProfili();

  // an older account without a profile arrives here with the role it chose before signing in
  const [emri, setEmri] = useState(profili?.emri ?? deklarimi?.emri ?? "");
  const [roli, setRoli] = useState<Zgjedhja>(profili ? (profili.roli === "miku" ? "miku" : "klient") : (deklarimi?.roli ?? "klient"));
  const [fokus, setFokus] = useState(false);
  const [duke, setDuke] = useState(false);
  const [gabim, setGabim] = useState<string | null>(null);

  async function vazhdo() {
    const t = emri.trim();
    if (t.length < 2) {
      setGabim("Shkruaj emrin tënd (të paktën 2 shkronja).");
      return;
    }
    setDuke(true);
    setGabim(null);
    const mesazh = await ruaje(t, roli);
    setDuke(false);
    if (mesazh) {
      setGabim(mesazh);
      return;
    }
    // first time: the effect in the screen moves on; changing the role: go back to the tabs
    if (!eParia) router.dismissTo(FAQJA_KRYESORE[roli] as Href);
  }

  return (
    <>
      <View style={styles.fusha}>
        <Text style={styles.label}>Emri yt</Text>
        <TextInput
          style={[styles.input, fokus && styles.inputFokus]}
          value={emri}
          onChangeText={setEmri}
          onFocus={() => {
            setFokus(true);
            revealSoon();
          }}
          onBlur={() => setFokus(false)}
          placeholder="p.sh. Flutura"
          placeholderTextColor="#8FA3AC"
          maxLength={40}
          autoCapitalize="words"
          returnKeyType="done"
          accessibilityLabel="Emri yt"
        />
      </View>

      <Text style={styles.label}>Roli</Text>
      <ZgjedhesiIRolit roli={roli} onZgjidh={setRoli} />

      {burimi === "demo" ? (
        <View style={styles.shenim}>
          <UrezaIcon name="warning" size={20} color={colors.petrol} />
          <Text style={styles.shenimText}>
            Roli ruhet vetëm në këtë telefon, sepse tabela e profileve nuk është krijuar ende. Ekzekuto
            supabase/roli.sql në Supabase që të ruhet në llogari.
          </Text>
        </View>
      ) : null}

      {gabim ? <Text style={styles.gabim}>{gabim}</Text> : null}

      <Pressable
        style={[styles.primary, duke && styles.disabled]}
        onPress={vazhdo}
        disabled={duke}
        accessibilityRole="button"
      >
        {duke ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <>
            <Text style={styles.primaryText}>{eParia ? "Vazhdo" : "Ruaj"}</Text>
            <UrezaIcon name="arrow" size={22} color={colors.white} strokeWidth={2.3} />
          </>
        )}
      </Pressable>

      {eParia ? <DilButon /> : null}
    </>
  );
}

const styles = StyleSheet.create({
  fusha: { gap: 8 },
  label: { color: colors.ink, fontSize: 15, lineHeight: 20, fontWeight: "700" },
  input: {
    height: 56,
    paddingHorizontal: 16,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.inputBorder,
    borderRadius: 14,
    fontSize: 16,
    fontWeight: "500",
    color: colors.ink,
  },
  inputFokus: { borderColor: colors.petrol },
  shenim: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: colors.ikonaBg,
  },
  shenimText: { flex: 1, color: colors.petrol, fontSize: 15, lineHeight: 22, fontWeight: "600" },
  gabim: { color: colors.error, fontSize: 14, lineHeight: 20, fontWeight: "600" },
  primary: {
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.petrol,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryText: { color: colors.white, fontSize: 17, fontWeight: "700" },
  disabled: { opacity: 0.6 },
  dytesor: { minHeight: 48, alignItems: "center", justifyContent: "center" },
  dytesorText: { color: colors.petrol, fontSize: 16, fontWeight: "700" },
  dilText: { color: colors.textSecondary, fontSize: 16, fontWeight: "700" },
  bosh: { backgroundColor: colors.white, borderRadius: 20, padding: 20, gap: 4, borderWidth: 1, borderColor: "#E3EAF0" },
  boshTitle: { color: colors.ink, fontSize: 17, lineHeight: 22, fontWeight: "800" },
  boshText: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, fontWeight: "500" },
});
