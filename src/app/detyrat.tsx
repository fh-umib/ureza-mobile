import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { EkraniMeHero, useRevealOnFocus } from "@/components/EkraniMeHero";
import { UrezaIcon } from "@/components/UrezaIcon";
import { colors } from "@/constants/ureza";
import { useSesioni } from "@/lib/sesioni";
import { supabase } from "@/lib/supabase";

// "Detyrat": the user's to-do list for their properties (what needs to be done and where),
// kept in the `tasks` table. Row Level Security shows each user only their own tasks.
type Statusi = "pending" | "completed";
type Detyra = { id: string; title: string; location: string; status: Statusi };

const PA_LIDHJE = "Nuk u lidh me serverin. Kontrollo internetin dhe provo përsëri.";

export default function Detyrat() {
  const router = useRouter();

  return (
    <EkraniMeHero
      kicker="PRONAT"
      title="Detyrat"
      subtitle="Punët që duhen bërë për pronat e tua."
      kthehu={{ etiketa: "Mbrapa", onPress: () => router.back() }}
    >
      <Lista />
    </EkraniMeHero>
  );
}

function Lista() {
  const revealSoon = useRevealOnFocus();
  const { perdoruesi } = useSesioni();
  const uid = perdoruesi?.id ?? null;

  const [detyrat, setDetyrat] = useState<Detyra[] | null>(null); // null = loading
  const [gabimNgarkimi, setGabimNgarkimi] = useState<string | null>(null);
  const [titulli, setTitulli] = useState("");
  const [vendi, setVendi] = useState("");
  const [fokus, setFokus] = useState<"titulli" | "vendi" | null>(null);
  const [duke, setDuke] = useState(false);
  const [mesazhi, setMesazhi] = useState<string | null>(null);

  const ngarko = useCallback(async () => {
    setGabimNgarkimi(null);
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select("id, title, location, status")
        .order("created_at", { ascending: false });
      if (error) {
        setGabimNgarkimi(error.code ? error.message : PA_LIDHJE);
        setDetyrat((d) => d ?? []);
        return;
      }
      setDetyrat((data ?? []) as Detyra[]);
    } catch {
      setGabimNgarkimi(PA_LIDHJE);
      setDetyrat((d) => d ?? []);
    }
  }, []);

  useEffect(() => {
    void ngarko();
  }, [ngarko, uid]);

  async function shto() {
    const t = titulli.trim();
    const v = vendi.trim();
    if (t.length < 2 || v.length < 2) {
      setMesazhi("Shkruaj titullin dhe vendndodhjen (të paktën 2 shkronja).");
      return;
    }
    setDuke(true);
    setMesazhi(null);
    try {
      // the database gives the new row its id, owner and date
      const { error } = await supabase.from("tasks").insert({ title: t, location: v, status: "pending" });
      if (error) {
        setMesazhi(error.code ? error.message : PA_LIDHJE);
        return;
      }
      setTitulli("");
      setVendi("");
      await ngarko();
    } catch {
      setMesazhi(PA_LIDHJE);
    } finally {
      setDuke(false);
    }
  }

  // The screen changes at once; if saving fails the status goes back and the reason is shown.
  async function ndrysho(d: Detyra) {
    const tjeter: Statusi = d.status === "pending" ? "completed" : "pending";
    setMesazhi(null);
    setDetyrat((lista) => (lista ?? []).map((x) => (x.id === d.id ? { ...x, status: tjeter } : x)));
    try {
      const { data, error } = await supabase.from("tasks").update({ status: tjeter }).eq("id", d.id).select("id");
      if (error || !data || data.length === 0) throw new Error(error?.message ?? "Ndryshimi nuk u lejua.");
    } catch (e) {
      setDetyrat((lista) => (lista ?? []).map((x) => (x.id === d.id ? { ...x, status: d.status } : x)));
      setMesazhi(`Statusi nuk u ruajt: ${e instanceof Error && e.message ? e.message : PA_LIDHJE}`);
    }
  }

  const lista = detyrat ?? [];
  const perfunduara = lista.filter((d) => d.status === "completed").length;

  return (
    <>
      <View style={styles.forma}>
        <Text style={styles.formaTitulli}>Shto detyrë</Text>
        <TextInput
          style={[styles.input, fokus === "titulli" && styles.inputFokus]}
          value={titulli}
          onChangeText={setTitulli}
          onFocus={() => {
            setFokus("titulli");
            revealSoon();
          }}
          onBlur={() => setFokus(null)}
          placeholder="Titulli, p.sh. Kontrolli i çatisë"
          placeholderTextColor="#8FA3AC"
          maxLength={80}
          returnKeyType="next"
          accessibilityLabel="Titulli i detyrës"
        />
        <TextInput
          style={[styles.input, fokus === "vendi" && styles.inputFokus]}
          value={vendi}
          onChangeText={setVendi}
          onFocus={() => {
            setFokus("vendi");
            revealSoon();
          }}
          onBlur={() => setFokus(null)}
          placeholder="Vendndodhja, p.sh. Ferizaj, Kosovë"
          placeholderTextColor="#8FA3AC"
          maxLength={80}
          returnKeyType="done"
          onSubmitEditing={shto}
          accessibilityLabel="Vendndodhja e detyrës"
        />
        {mesazhi ? <Text style={styles.gabim}>{mesazhi}</Text> : null}
        <Pressable style={[styles.primary, duke && styles.disabled]} onPress={shto} disabled={duke} accessibilityRole="button">
          {duke ? <ActivityIndicator color={colors.white} /> : <Text style={styles.primaryText}>Shto detyrën</Text>}
        </Pressable>
      </View>

      {detyrat === null ? <ActivityIndicator color={colors.petrol} /> : null}

      {gabimNgarkimi ? (
        <View style={styles.bosh}>
          <Text style={styles.boshTitle}>Detyrat nuk u ngarkuan</Text>
          <Text style={styles.boshText}>{gabimNgarkimi}</Text>
          <Pressable style={styles.dytesor} onPress={() => void ngarko()} accessibilityRole="button">
            <Text style={styles.dytesorText}>Provo përsëri</Text>
          </Pressable>
        </View>
      ) : null}

      {detyrat !== null && !gabimNgarkimi && lista.length === 0 ? (
        <View style={styles.bosh}>
          <Text style={styles.boshTitle}>Ende nuk ke detyra</Text>
          <Text style={styles.boshText}>Shto të parën më sipër, p.sh. një kontroll ose një punë për shtëpinë.</Text>
        </View>
      ) : null}

      {lista.length > 0 ? (
        <Text style={styles.permbledhja}>
          {lista.length} gjithsej · {perfunduara} të përfunduara
        </Text>
      ) : null}

      {lista.map((d) => {
        const eBere = d.status === "completed";
        return (
          <Pressable
            key={d.id}
            style={styles.rreshti}
            onPress={() => void ndrysho(d)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: eBere }}
            accessibilityLabel={`${d.title}, ${d.location}`}
            accessibilityHint="Shtype për ta ndryshuar statusin"
          >
            <View style={[styles.kutia, eBere && styles.kutiaBere]}>
              {eBere ? <UrezaIcon name="check" size={18} color={colors.white} strokeWidth={3} /> : null}
            </View>
            <View style={styles.tekst}>
              <Text style={[styles.titulli, eBere && styles.titulliBere]}>{d.title}</Text>
              <View style={styles.vendiRresht}>
                <UrezaIcon name="pin" size={16} color={colors.textSecondary} />
                <Text style={styles.vendi}>{d.location}</Text>
              </View>
              <View style={[styles.chip, eBere ? styles.chipBere : styles.chipPritje]}>
                <UrezaIcon
                  name={eBere ? "check" : "clock"}
                  size={14}
                  color={eBere ? "#1E6B3E" : "#8A5210"}
                  strokeWidth={2.4}
                />
                <Text style={[styles.chipText, { color: eBere ? "#1E6B3E" : "#8A5210" }]}>
                  {eBere ? "E përfunduar" : "Në pritje"}
                </Text>
              </View>
            </View>
          </Pressable>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  forma: { backgroundColor: colors.white, borderRadius: 20, padding: 20, gap: 12 },
  formaTitulli: { color: colors.ink, fontSize: 20, lineHeight: 26, fontWeight: "800" },
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
  gabim: { color: colors.error, fontSize: 14, lineHeight: 20, fontWeight: "600" },
  primary: { height: 56, borderRadius: 16, backgroundColor: colors.petrol, alignItems: "center", justifyContent: "center" },
  primaryText: { color: colors.white, fontSize: 17, fontWeight: "700" },
  disabled: { opacity: 0.6 },
  dytesor: { minHeight: 48, alignItems: "center", justifyContent: "center" },
  dytesorText: { color: colors.petrol, fontSize: 16, fontWeight: "700" },
  bosh: { backgroundColor: colors.white, borderRadius: 20, padding: 20, gap: 4, borderWidth: 1, borderColor: "#E3EAF0" },
  boshTitle: { color: colors.ink, fontSize: 17, lineHeight: 22, fontWeight: "800" },
  boshText: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, fontWeight: "500" },
  permbledhja: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, fontWeight: "700" },
  rreshti: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E3EAF0",
    padding: 16,
  },
  kutia: {
    width: 28,
    height: 28,
    marginTop: 2,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.inputBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  kutiaBere: { backgroundColor: colors.petrol, borderColor: colors.petrol },
  tekst: { flex: 1, gap: 4 },
  titulli: { color: colors.ink, fontSize: 17, lineHeight: 22, fontWeight: "800" },
  titulliBere: { color: colors.textSecondary, textDecorationLine: "line-through" },
  vendiRresht: { flexDirection: "row", alignItems: "center", gap: 4 },
  vendi: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, fontWeight: "500" },
  chip: {
    alignSelf: "flex-start",
    height: 28,
    paddingHorizontal: 10,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 2,
  },
  chipPritje: { backgroundColor: "#FFF2DE" },
  chipBere: { backgroundColor: "#E4F6EB" },
  chipText: { fontSize: 12, fontWeight: "700" },
});
