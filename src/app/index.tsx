
import { useState } from "react";
import { useRouter } from "expo-router";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import TaskCard from "../components/TaskCard";
import { initialTasks, type Task } from "../data/tasks";

const icons: Record<string, string> = {
  "shtepia-1": "🏠",
  "toka-2": "🌿",
  "oborri-3": "🪴",
};

export default function HomeScreen() {
  const router = useRouter();

  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  const completedCount = tasks.filter(
    (task) => task.status === "completed"
  ).length;

  const platform =
    Platform.OS === "ios"
      ? "iOS"
      : Platform.OS === "android"
        ? "Android"
        : "Web";

  function toggleStatus(id: string) {
    setTasks((previous) =>
      previous.map((task) =>
        task.id === id
          ? {
              ...task,
              status:
                task.status === "pending"
                  ? "completed"
                  : "pending",
            }
          : task
      )
    );
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
        ListHeaderComponent={
          <View>
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
              </View>
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
