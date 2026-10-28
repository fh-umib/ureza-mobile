
import {
  useLocalSearchParams,
  useRouter,
} from "expo-router";

import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { findTaskById } from "../../data/tasks";

export default function TaskDetailsScreen() {
  const router = useRouter();

  const { id, status } = useLocalSearchParams<{
    id: string;
    status?: string;
  }>();

  const task = findTaskById(id);

  function goBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  }

  if (!task) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🔎</Text>

          <Text style={styles.emptyTitle}>
            Detyra nuk u gjet
          </Text>

          <Text style={styles.emptyText}>
            Nuk ekziston një detyrë me ID: {id}
          </Text>

          <Pressable
            style={styles.backButton}
            onPress={goBack}
          >
            <Text style={styles.backText}>
              Kthehu te lista
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const currentStatus =
    status === "pending" || status === "completed"
      ? status
      : task.status;

  const completed = currentStatus === "completed";

  return (
    <SafeAreaView
      style={styles.safe}
      edges={["top", "bottom"]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          onPress={goBack}
          style={styles.backRow}
          accessibilityRole="button"
        >
          <Text style={styles.backLabel}>
            ← Kthehu te detyrat
          </Text>
        </Pressable>

        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Text style={styles.heroEmoji}>🏡</Text>
          </View>

          <Text style={styles.eyebrow}>
            DETAJET E DETYRËS
          </Text>

          <Text style={styles.title}>
            {task.title}
          </Text>

          <Text style={styles.heroLocation}>
            📍 {task.location}
          </Text>
        </View>

        <View style={styles.statusCard}>
          <Text style={styles.cardLabel}>
            STATUSI I DETYRËS
          </Text>

          <View
            style={[
              styles.badge,
              completed
                ? styles.greenBadge
                : styles.orangeBadge,
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                completed
                  ? styles.greenText
                  : styles.orangeText,
              ]}
            >
              {completed
                ? "✓ E përfunduar"
                : "● Në pritje"}
            </Text>
          </View>

          <Text style={styles.helper}>
            Status demonstrues për ushtrimet e Javës 3.
          </Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>
            Informacionet e detyrës
          </Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              Identifikuesi
            </Text>
            <Text style={styles.infoValue}>
              {task.id}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              Vendndodhja
            </Text>
            <Text style={styles.infoValue}>
              {task.location}
            </Text>
          </View>
        </View>

        <View style={styles.nextCard}>
          <Text style={styles.nextIcon}>🌉</Text>

          <View style={styles.nextContent}>
            <Text style={styles.nextTitle}>
              Hapi i ardhshëm
            </Text>

            <Text style={styles.nextText}>
              Në versionin e plotë të Urëzës,
              vizitat do të dokumentohen me GPS,
              fotografi dhe raport nga AI.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F5F8FA",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },
  backRow: {
    alignSelf: "flex-start",
    paddingVertical: 12,
    marginBottom: 14,
  },
  backLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#175568",
  },
  hero: {
    backgroundColor: "#173F4E",
    borderRadius: 26,
    padding: 24,
    marginBottom: 18,
  },
  heroIcon: {
    width: 60,
    height: 60,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  heroEmoji: {
    fontSize: 32,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
    color: "#8CE0CB",
    marginBottom: 10,
  },
  title: {
    fontSize: 27,
    lineHeight: 35,
    color: "#FFFFFF",
    fontWeight: "800",
  },
  heroLocation: {
    color: "#D4E5E9",
    marginTop: 14,
    fontSize: 14,
  },
  statusCard: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 20,
    marginBottom: 15,
  },
  cardLabel: {
    color: "#8798A2",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 12,
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 30,
  },
  orangeBadge: {
    backgroundColor: "#FFF2DE",
  },
  greenBadge: {
    backgroundColor: "#E4F6EB",
  },
  badgeText: {
    fontWeight: "700",
    fontSize: 15,
  },
  orangeText: {
    color: "#A96817",
  },
  greenText: {
    color: "#247A49",
  },
  helper: {
    color: "#8A98A3",
    fontSize: 12,
    marginTop: 13,
    lineHeight: 18,
  },
  infoCard: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 20,
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#173C48",
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  infoLabel: {
    color: "#8999A3",
    fontSize: 13,
  },
  infoValue: {
    flex: 1,
    textAlign: "right",
    color: "#173C48",
    fontSize: 13,
    fontWeight: "700",
  },
  divider: {
    height: 1,
    backgroundColor: "#EDF1F4",
    marginVertical: 17,
  },
  nextCard: {
    flexDirection: "row",
    backgroundColor: "#E5F3F2",
    padding: 18,
    borderRadius: 20,
    gap: 12,
  },
  nextIcon: {
    fontSize: 26,
  },
  nextContent: {
    flex: 1,
  },
  nextTitle: {
    color: "#175568",
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 6,
  },
  nextText: {
    color: "#466C74",
    fontSize: 13,
    lineHeight: 20,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#173C48",
  },
  emptyText: {
    color: "#738493",
    marginTop: 10,
    textAlign: "center",
  },
  backButton: {
    backgroundColor: "#175568",
    borderRadius: 14,
    padding: 16,
    marginTop: 24,
  },
  backText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
});
