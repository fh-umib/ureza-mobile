
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "expo-router";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import TaskCard, { type TaskStatus } from "../components/TaskCard";
import { initialTasks, type Task } from "../data/tasks";
import { ButoniDil } from "../components/ButoniDil";
import { useSesioni } from "../lib/sesioni";
import { supabase } from "../lib/supabase";

type Source = "loading" | "supabase" | "local";

const icons: Record<string, string> = {
  "shtepia-1": "🏠",
  "toka-2": "🌿",
  "oborri-3": "🪴",
};

export default function HomeScreen() {
  const router = useRouter();
  const { perdoruesi } = useSesioni();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [source, setSource] = useState<Source>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // "Add task" form state (M2)
  const [newTitle, setNewTitle] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [saving, setSaving] = useState(false);
  const [formMessage, setFormMessage] = useState<string | null>(null);

  const loadTasks = useCallback(async () => {
    const { data, error } = await supabase
      .from("tasks")
      .select("id, title, location, status")
      .order("created_at", { ascending: false }); // newest first

    if (error || !data) {
      // No network or no table: fall back to the local sample data.
      setErrorMessage(error?.message ?? "Nuk u morën të dhëna");
      setTasks(initialTasks);
      setSource("local");
      return;
    }

    setTasks(data as Task[]);
    setSource("supabase");
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // M2: the user adds a new task; it is saved to Supabase.
  async function addTask() {
    const title = newTitle.trim();
    const location = newLocation.trim();

    if (!title || !location) {
      setFormMessage("Shkruaj titullin dhe vendndodhjen.");
      return;
    }

    setSaving(true);
    setFormMessage(null);

    // The database generates id and created_at; the status starts as "pending".
    const { error } = await supabase
      .from("tasks")
      .insert({ title, location, status: "pending" });

    setSaving(false);

    if (error) {
      setFormMessage(`Nuk u ruajt: ${error.message}`);
      return;
    }

    setNewTitle("");
    setNewLocation("");
    setFormMessage("✓ U ruajt në Supabase.");
    await loadTasks();
  }

  const completedCount = tasks.filter(
    (task) => task.status === "completed"
  ).length;

  const platform =
    Platform.OS === "ios"
      ? "iOS"
      : Platform.OS === "android"
        ? "Android"
        : "Web";

  // M3: the status is saved to Supabase. The screen updates immediately; if
  // saving fails, we roll the status back and show the error.
  async function toggleStatus(id: string) {
    const current = tasks.find((task) => task.id === id);
    if (!current) return;

    const next: TaskStatus =
      current.status === "pending" ? "completed" : "pending";

    setStatusMessage(null);
    setTasks((previous) =>
      previous.map((task) =>
        task.id === id ? { ...task, status: next } : task
      )
    );

    // Offline (local data): the change stays on the phone only.
    if (source !== "supabase") return;

    const { data, error } = await supabase
      .from("tasks")
      .update({ status: next })
      .eq("id", id)
      .select("id");

    // RLS can silently ignore the update without an error; then "data" is empty.
    if (error || !data || data.length === 0) {
      setTasks((previous) =>
        previous.map((task) =>
          task.id === id ? { ...task, status: current.status } : task
        )
      );
      setStatusMessage(
        `Statusi nuk u ruajt: ${
          error?.message ?? "Supabase nuk e lejoi ndryshimin"
        }`
      );
    }
  }

  function openDetails(task: Task) {
    router.push({
      pathname: "/artikull/[id]",
      params: {
        id: task.id,
        status: task.status,
      },
    });
  }

  return (
    <SafeAreaView
      style={styles.safe}
      edges={["top", "bottom"]}
    >
      <FlatList
        style={styles.list}
        contentContainerStyle={styles.content}
        data={tasks}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <Text>{perdoruesi?.email}</Text>
              <ButoniDil />
            </View>
            <View style={styles.brandRow}>
              <View style={styles.logo}>
                <Text style={styles.logoText}>U</Text>
              </View>

              <View>
                <Text style={styles.brandName}>Urëza</Text>
                <Text style={styles.brandSubtitle}>
                  CONNECTING HOME & DIASPORA
                </Text>
              </View>

              <View style={styles.demoBadge}>
                <Text style={styles.demoText}>DEMO</Text>
              </View>
            </View>

            <View style={styles.hero}>
              <Text style={styles.eyebrow}>
                AFËR, EDHE KUR JE LARG
              </Text>

              <Text style={styles.heroTitle}>
                Shtëpia jote,{"\n"}
                më afër se kurrë.
              </Text>

              <Text style={styles.heroSubtitle}>
                Ndiq vizitat dhe detyrat e pronës
                tënde, kudo që ndodhesh.
              </Text>

              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>
                    {tasks.length}
                  </Text>
                  <Text style={styles.statLabel}>
                    Detyra gjithsej
                  </Text>
                </View>

                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>
                    {completedCount}
                  </Text>
                  <Text style={styles.statLabel}>
                    Të përfunduara
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>
                  Detyrat e mia
                </Text>
                <Text style={styles.sectionSubtitle}>
                  Menaxho vizitat dhe kërkesat
                </Text>
                <Text
                  style={[
                    styles.sourceNote,
                    source === "local" && styles.sourceNoteWarn,
                  ]}
                >
                  {source === "loading"
                    ? "Duke ngarkuar nga Supabase…"
                    : source === "supabase"
                      ? `● Të dhëna nga Supabase (${tasks.length})`
                      : `Offline: të dhëna lokale. ${errorMessage ?? ""}`}
                </Text>
                {statusMessage ? (
                  <Text style={[styles.sourceNote, styles.sourceNoteWarn]}>
                    {statusMessage}
                  </Text>
                ) : null}
              </View>
            </View>

            <View style={styles.form}>
              <Text style={styles.formTitle}>Shto detyrë të re</Text>

              <TextInput
                style={styles.input}
                placeholder="Titulli (p.sh. Kontrolli i çatisë)"
                placeholderTextColor="#8798A2"
                value={newTitle}
                onChangeText={setNewTitle}
                maxLength={80}
              />
              <TextInput
                style={styles.input}
                placeholder="Vendndodhja (p.sh. Ferizaj, Kosovë)"
                placeholderTextColor="#8798A2"
                value={newLocation}
                onChangeText={setNewLocation}
                maxLength={80}
              />

              <Pressable
                style={[styles.addButton, saving && styles.addButtonDisabled]}
                onPress={addTask}
                disabled={saving}
              >
                <Text style={styles.addButtonText}>
                  {saving ? "Duke ruajtur…" : "Shto detyrën"}
                </Text>
              </Pressable>

              {formMessage ? (
                <Text style={styles.formMessage}>{formMessage}</Text>
              ) : null}
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <TaskCard
            title={item.title}
            location={item.location}
            status={item.status}
            icon={icons[item.id] ?? "📋"}
            onToggle={() => toggleStatus(item.id)}
            onDetails={() => openDetails(item)}
          />
        )}
        ListFooterComponent={
          <View style={styles.footer}>
            <Text style={styles.footerTitle}>
              URËZA · MOBILE APPLICATION
            </Text>
            <Text style={styles.footerText}>
              Flutura & Tringa Hyseni · {platform}
            </Text>
            <Text style={styles.footerNote}>
              Prototip universitar me të dhëna testuese
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F5F8FA",
  },
  list: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    gap: 12,
  },
  logo: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: "#175568",
    justifyContent: "center",
    alignItems: "center",
  },
  logoText: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "800",
  },
  brandName: {
    fontSize: 21,
    fontWeight: "800",
    color: "#173C48",
  },
  brandSubtitle: {
    fontSize: 9,
    fontWeight: "700",
    color: "#8798A2",
    letterSpacing: 1,
  },
  demoBadge: {
    marginLeft: "auto",
    paddingHorizontal: 9,
    paddingVertical: 6,
    backgroundColor: "#E4F4EF",
    borderRadius: 20,
  },
  demoText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#27816F",
  },
  hero: {
    backgroundColor: "#173F4E",
    padding: 24,
    borderRadius: 26,
    marginBottom: 28,
  },
  eyebrow: {
    color: "#8CE0CB",
    fontWeight: "700",
    fontSize: 11,
    letterSpacing: 1.5,
    marginBottom: 13,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 29,
    lineHeight: 36,
  },
  heroSubtitle: {
    color: "#C9DBE1",
    fontSize: 14,
    lineHeight: 22,
    marginTop: 12,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  statBox: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.10)",
    padding: 15,
    borderRadius: 16,
  },
  statNumber: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 25,
  },
  statLabel: {
    color: "#C9DBE1",
    fontSize: 11,
    marginTop: 4,
  },
  sectionHeader: {
    marginBottom: 18,
  },
  sectionTitle: {
    color: "#173C48",
    fontSize: 23,
    fontWeight: "800",
  },
  sectionSubtitle: {
    color: "#8798A2",
    fontSize: 13,
    marginTop: 5,
  },
  sourceNote: {
    color: "#738493",
    fontSize: 12,
    marginTop: 6,
  },
  sourceNoteWarn: {
    color: "#A96817",
  },
  form: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E3EAF0",
    padding: 16,
    marginBottom: 18,
    gap: 10,
  },
  formTitle: {
    color: "#173C48",
    fontSize: 16,
    fontWeight: "800",
  },
  input: {
    borderWidth: 1,
    borderColor: "#D4E2E7",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#173C48",
    backgroundColor: "#F5F8FA",
  },
  addButton: {
    backgroundColor: "#175568",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 14,
  },
  formMessage: {
    color: "#647B85",
    fontSize: 12,
  },
  footer: {
    alignItems: "center",
    marginTop: 18,
    gap: 7,
  },
  footerTitle: {
    fontSize: 10,
    fontWeight: "800",
    color: "#78929C",
    letterSpacing: 1,
  },
  footerText: {
    fontSize: 12,
    color: "#647B85",
  },
  footerNote: {
    fontSize: 11,
    color: "#9BAAB2",
  },
});
